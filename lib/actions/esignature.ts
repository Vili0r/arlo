"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgAuth, ROLES, PERMISSIONS } from "@/lib/auth-guard";
import { generateAuditDiff } from "@/utils/auditDiff";
import {
  isTransitionAllowed,
  isAdvanceTransition,
  isRevertTransition,
  isCancelTransition,
  getStatusConfig,
  type EntityType,
} from "@/lib/constants/status-transitions";
import { isCapaPhaseApproved } from "@/lib/actions/capa";
import { CapaPhase, AuditAction, Prisma, LockEntityType, MIRStatus } from "@prisma/client";
import { assertRecordNotLocked } from "@/lib/actions/record-lock";
import { clerkClient, auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import * as z from "zod";

// =============================================================================
// 21 CFR Part 11 E-Signature Status Transition Server Action
//
// This action enforces electronic signature requirements per FDA 21 CFR Part 11
// § 11.200 by requiring re-authentication (password verification) before
// executing any status change on a regulated record.
// =============================================================================

const ExecuteStatusTransitionSchema = z.object({
  entityType: z.enum([
    "Complaint",
    "Investigation",
    "Vigilance",
    "CustomerCommunication",
    "ComplaintTask",
    "Capa",
    "InitialMIR",
    "FinalMIR",
    "MIR",
  ]),
  entityId: z.string().min(1, "Entity ID is required"),
  newStatus: z.string().min(1, "Target status is required"),
  password: z.string().min(1, "Password is required for electronic signature"),
  meaningOfSignature: z.string().min(1, "Meaning of signature is required"),
  rationale: z.string().optional().nullable(),
});

export type ExecuteStatusTransitionInput = z.infer<
  typeof ExecuteStatusTransitionSchema
>;

export interface StatusTransitionResult {
  success: boolean;
  error?: string;
  updatedStatus?: string;
  signatureId?: string;
}

export async function executeStatusTransition(
  _prevState: StatusTransitionResult | null,
  formData: FormData
): Promise<StatusTransitionResult> {
  // -------------------------------------------------------------------------
  // 1. Parse & validate input
  // -------------------------------------------------------------------------
  const raw = {
    entityType: formData.get("entityType") as string,
    entityId: formData.get("entityId") as string,
    newStatus: formData.get("newStatus") as string,
    password: formData.get("password") as string,
    meaningOfSignature: formData.get("meaningOfSignature") as string,
    rationale: formData.get("rationale") as string | null,
  };

  const parsed = ExecuteStatusTransitionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const { entityType, entityId, newStatus, password, meaningOfSignature, rationale } =
    parsed.data;

  // -------------------------------------------------------------------------
  // 2. Authenticate session (Clerk auth token)
  // -------------------------------------------------------------------------
  let userId: string;
  let orgId: string;
  let userRole: string | undefined;

  try {
    const authCtx = await requireOrgAuth();
    userId = authCtx.userId;
    orgId = authCtx.orgId;
    userRole = authCtx.orgRole;
  } catch {
    return {
      success: false,
      error: "Authentication failed. Please sign in and try again.",
    };
  }

  // -------------------------------------------------------------------------
  // 3. Verify electronic signature — re-authenticate via Clerk password
  //    (21 CFR Part 11 § 11.200: two distinct identification components)
  // -------------------------------------------------------------------------
  try {
    const clerk = await clerkClient();
    const verification = await clerk.users.verifyPassword({
      userId,
      password,
    });

    if (!verification.verified) {
      return {
        success: false,
        error:
          "Password verification failed. The electronic signature could not be authenticated.",
      };
    }
  } catch (err: unknown) {
    // Clerk throws on invalid password rather than returning verified: false
    const message =
      err instanceof Error ? err.message : "Password verification failed";

    // Check for specific Clerk error codes
    if (
      message.includes("password") ||
      message.includes("verification") ||
      message.includes("incorrect")
    ) {
      return {
        success: false,
        error:
          "Incorrect password. Please re-enter your credentials to sign this action.",
      };
    }

    return {
      success: false,
      error: `E-Signature verification error: ${message}`,
    };
  }

  // -------------------------------------------------------------------------
  // 4. Validate the transition is allowed by the state machine
  // -------------------------------------------------------------------------
  const statusConfig = getStatusConfig(entityType as EntityType);

  // -------------------------------------------------------------------------
  // 5. Execute the status change in a Prisma transaction
  // -------------------------------------------------------------------------
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 5a. Fetch the current record with tenant isolation
      const oldRecord = await fetchRecord(
        tx,
        entityType as EntityType,
        entityId,
        orgId
      );

      if (!oldRecord) {
        throw new Error(
          `${entityType} record not found or access denied.`
        );
      }

      // Concurrency Lock Check: Ensure record is not actively locked by another user
      const lockEntityTypeMap: Record<EntityType, LockEntityType> = {
        Complaint: LockEntityType.Complaint,
        Investigation: LockEntityType.Investigation,
        Vigilance: LockEntityType.Vigilance,
        CustomerCommunication: LockEntityType.FollowUp,
        ComplaintTask: LockEntityType.Task,
        Capa: LockEntityType.Capa,
        InitialMIR: LockEntityType.Vigilance,
        FinalMIR: LockEntityType.Vigilance,
        MIR: LockEntityType.Vigilance,
      };

      const lockType = lockEntityTypeMap[entityType as EntityType];
      if (lockType) {
        await assertRecordNotLocked(tx, orgId, lockType, entityId, userId);
      }

      const currentStatus = (oldRecord as Record<string, unknown>)[
        statusConfig.statusField
      ] as string;

      // 5b. Validate the transition
      if (!isTransitionAllowed(entityType as EntityType, currentStatus, newStatus)) {
        throw new Error(
          `Invalid status transition: ${currentStatus} → ${newStatus} is not allowed for ${entityType}.`
        );
      }

      // 5b-1. Permission Guardrails for Final Approval and Reopening
      if (
        (entityType === "Investigation" || entityType === "Complaint") &&
        (newStatus === "COMPLETED" ||
          newStatus === "CLOSED" ||
          currentStatus === "COMPLETED" ||
          currentStatus === "CLOSED")
      ) {
        const authContext = await auth();
        const isAdmin =
          authContext.orgRole === ROLES.ADMIN ||
          Boolean(authContext.has?.({ role: ROLES.ADMIN }));
        const isQAApprover =
          authContext.orgRole === ROLES.QA_MANAGER ||
          authContext.orgRole === ROLES.QA_APPROVER ||
          Boolean(authContext.has?.({ role: ROLES.QA_MANAGER })) ||
          Boolean(authContext.has?.({ role: ROLES.QA_APPROVER }));
        const hasApprovalPermission =
          authContext.orgRole === ROLES.QA_APPROVER ||
          Boolean(
            authContext.has?.({
              permission: PERMISSIONS.COMPLAINTS_APPROVE_CLOSE,
            })
          ) ||
          Boolean(
            authContext.has?.({
              permission: PERMISSIONS.COMPLAINT_CLOSE,
            })
          );

        if (!isAdmin && !isQAApprover && !hasApprovalPermission) {
          const actionDesc =
            newStatus === "COMPLETED" || newStatus === "CLOSED"
              ? "approve and complete"
              : "reopen / revert from completed";
          throw new Error(
            `403 Forbidden: Only QA Managers and Administrators have the required permissions to ${actionDesc} this ${entityType}.`
          );
        }
      }

      // 5b-2. Direct Linkages Closure Guard for Complaint Closure
      if (entityType === "Complaint" && newStatus === "CLOSED") {
        const fullComplaint = await tx.complaint.findUnique({
          where: { id: entityId, orgId },
          include: {
            investigation: true,
            vigilanceDecisionTrees: true,
          },
        });

        if (!fullComplaint) {
          throw new Error("Complaint not found.");
        }

        const blockingReasons: string[] = [];

        // 1. Check Investigation linkage
        if (
          fullComplaint.investigation &&
          fullComplaint.investigation.status !== "COMPLETED" &&
          fullComplaint.investigation.status !== "NOT_REQUIRED"
        ) {
          blockingReasons.push(
            `Investigation is still open (current status: ${fullComplaint.investigation.status.replace(/_/g, " ")})`
          );
        }

        // 2. Check Vigilance Decision Tree linkages
        if (fullComplaint.vigilanceDecisionTrees && fullComplaint.vigilanceDecisionTrees.length > 0) {
          const unfinalizedVigilance = fullComplaint.vigilanceDecisionTrees.filter(
            (v) => v.status !== "SUBMITTED" && v.status !== "NOT_REPORTABLE" && v.status !== "CANCELLED"
          );
          if (unfinalizedVigilance.length > 0) {
            blockingReasons.push(
              `Vigilance Decision Tree assessment is not finalized (${unfinalizedVigilance.length} assessment(s) pending/in-progress)`
            );
          }
        }

        if (blockingReasons.length > 0) {
          throw new Error(
            `Cannot close complaint: All direct linkages must be closed first:\n• ${blockingReasons.join("\n• ")}`
          );
        }
      }

      // 5b-3. Investigation Under Review Mandatory Fields Guard
      if (
        entityType === "Investigation" &&
        (newStatus === "UNDER_REVIEW" || newStatus === "COMPLETED")
      ) {
        await validateInvestigationForReview(tx, entityId, orgId);
      }

      // 5b-4. Complaint Closure Validation
      if (
        entityType === "Complaint" &&
        (newStatus === "CLOSED" || newStatus === "CANCELLED")
      ) {
        await validateComplaintClosure(tx, entityId, orgId, newStatus);
      }

      // 5b-5. CAPA Phase Approval Gatekeeper
      if (entityType === "Capa") {
        const isAdvancing = isAdvanceTransition(
          "Capa",
          currentStatus,
          newStatus
        );
        if (isAdvancing) {
          const approved = await isCapaPhaseApproved(
            tx,
            entityId,
            orgId,
            currentStatus as CapaPhase
          );
          if (!approved) {
            throw new Error(
              `Cannot move to the next step: The ${currentStatus} phase has not been approved by the designated approver.`
            );
          }
        }
      }

      const isCancel = isCancelTransition(newStatus);
      const isRevert = isRevertTransition(
        entityType as EntityType,
        currentStatus,
        newStatus
      );

      if (isCancel && (!rationale || rationale.trim().length === 0)) {
        throw new Error(
          `A documented rationale is mandatory when cancelling a ${entityType}.`
        );
      }

      if (isRevert && (!rationale || rationale.trim().length === 0)) {
        throw new Error(
          `A documented rationale is mandatory when reverting a stage (${currentStatus} → ${newStatus}).`
        );
      }

      // 21 CFR 820.198(b) / ISO 13485 8.2.2: Mandatory reason when determining no investigation is needed
      if (
        entityType === "Investigation" &&
        newStatus === "NOT_REQUIRED" &&
        (!rationale || rationale.trim().length === 0)
      ) {
        throw new Error(
          "A documented rationale is mandatory when determining that an investigation is not required per 21 CFR § 820.198(b)."
        );
      }

      // 5c. Build the proposed record for diffing
      const proposedRecord = {
        ...(oldRecord as Record<string, unknown>),
        [statusConfig.statusField]: newStatus,
      };

      const fieldChanges = generateAuditDiff(
        oldRecord as Record<string, unknown>,
        proposedRecord
      );

      // 5d. Update the record status
      const updatedRecord = await updateRecord(
        tx,
        entityType as EntityType,
        entityId,
        orgId,
        newStatus,
        rationale,
        userId
      );

      // --- START AUTO-CREATE MIR LOGIC ---
      if (entityType === "Vigilance" && newStatus === "REPORTABLE") {
        const vigilance = updatedRecord as any;
        if (vigilance.complaintId) {
          const mirDelegate = (tx as any).mIR || (tx as any).initialMIR;
          if (mirDelegate) {
            const existingInitial = mirDelegate.findFirst
              ? await mirDelegate.findFirst({
                  where: {
                    complaintId: vigilance.complaintId,
                    reportType: { in: ["INITIAL", "COMBINED"] },
                  },
                })
              : await mirDelegate.findUnique?.({
                  where: { complaintId: vigilance.complaintId },
                });
            if (!existingInitial) {
              const newInitial = await mirDelegate.create({
                data: {
                  orgId,
                  complaintId: vigilance.complaintId,
                  status: "DRAFT",
                  reportType: "INITIAL",
                },
              });
              await tx.auditLog.create({
                data: {
                  orgId,
                  entityType: "InitialMIR",
                  entityId: newInitial.id,
                  action: AuditAction.CREATE,
                  changedById: userId,
                  newData: newInitial as unknown as Prisma.InputJsonValue,
                  reason: "Initial MIR record created upon Reportable Vigilance determination",
                  complaintId: vigilance.complaintId,
                },
              });
            }
          }
        }
      }

      if (entityType === "Investigation" && newStatus === "COMPLETED") {
        const investigation = updatedRecord as any;
        if (investigation.complaintId && typeof tx.vigilanceDecisionTree?.findFirst === "function") {
          // Check if reportable
          const vigilance = await tx.vigilanceDecisionTree.findFirst({
            where: {
              complaintId: investigation.complaintId,
              orgId,
              status: { in: ["REPORTABLE", "SUBMITTED"] },
            },
          });
          const mirDelegate = (tx as any).mIR || (tx as any).finalMIR;
          if (vigilance && mirDelegate) {
            const existingFinal = mirDelegate.findFirst
              ? await mirDelegate.findFirst({
                  where: {
                    complaintId: investigation.complaintId,
                    reportType: { in: ["FINAL", "FINAL_NON_REPORTABLE"] },
                  },
                })
              : await mirDelegate.findUnique?.({
                  where: { complaintId: investigation.complaintId },
                });
            if (!existingFinal) {
              const newFinal = await mirDelegate.create({
                data: {
                  orgId,
                  complaintId: investigation.complaintId,
                  status: "DRAFT",
                  reportType: "FINAL",
                },
              });
              await tx.auditLog.create({
                data: {
                  orgId,
                  entityType: "FinalMIR",
                  entityId: newFinal.id,
                  action: AuditAction.CREATE,
                  changedById: userId,
                  newData: newFinal as unknown as Prisma.InputJsonValue,
                  reason: "Final MIR record created upon Investigation completion",
                  complaintId: investigation.complaintId,
                },
              });
            }
          }
        }
      }
      // --- END AUTO-CREATE MIR LOGIC ---

      // Generate unique Signature ID for 21 CFR Part 11 manifestation
      const signatureId = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Determine record version or status state snapshot
      const recordVersion =
        (oldRecord as any)?.version !== undefined
          ? String((oldRecord as any).version)
          : (oldRecord as any)?.formTemplateVersion !== undefined
          ? String((oldRecord as any).formTemplateVersion)
          : `${currentStatus} → ${newStatus}`;

      // Resolve historical signer details & organization snapshot
      let signerName: string | null = null;
      let signerEmail: string | null = null;
      let signerRole: string | null = userRole || null;
      let organizationName: string | null = null;

      if (typeof (tx as any).user?.findUnique === "function") {
        try {
          const dbUser = await (tx as any).user.findUnique({
            where: { id: userId },
            select: { firstName: true, lastName: true, email: true },
          });
          if (dbUser) {
            const fullName = [dbUser.firstName, dbUser.lastName]
              .filter(Boolean)
              .join(" ")
              .trim();
            signerName = fullName || dbUser.email || null;
            signerEmail = dbUser.email || null;
          }
        } catch {
          // ignore lookup error to avoid blocking transaction
        }
      }

      if (!signerRole && typeof (tx as any).organizationMember?.findUnique === "function") {
        try {
          const member = await (tx as any).organizationMember.findUnique({
            where: { orgId_userId: { orgId, userId } },
            select: { role: true },
          });
          if (member?.role) {
            signerRole = member.role;
          }
        } catch {
          // ignore
        }
      }

      if (typeof (tx as any).organization?.findUnique === "function") {
        try {
          const dbOrg = await (tx as any).organization.findUnique({
            where: { id: orgId },
            select: { name: true },
          });
          if (dbOrg?.name) {
            organizationName = dbOrg.name;
          }
        } catch {
          // ignore
        }
      }

      // 5e. Write immutable audit log with e-signature details
      const signatureReason = [
        isCancel
          ? `E-SIGNATURE RECORD CANCELLATION: ${currentStatus} → ${newStatus}`
          : isRevert
          ? `E-SIGNATURE STAGE REVERSION: ${currentStatus} → ${newStatus}`
          : `E-SIGNATURE STATUS CHANGE: ${currentStatus} → ${newStatus}`,
        `Signature ID: ${signatureId}`,
        `Meaning: ${meaningOfSignature}`,
        `Record Version: ${recordVersion}`,
        `Authentication Event: PASSWORD_VERIFICATION_SUCCESS`,
        ...(rationale?.trim() ? [`Rationale: ${rationale.trim()}`] : []),
        `Signed by: ${userId}`,
        ...(signerRole ? [`Role at signing: ${signerRole}`] : []),
        ...(organizationName ? [`Organization: ${organizationName}`] : []),
        `Timestamp: ${new Date().toISOString()}`,
      ].join(" | ");

      const createdAuditLog = await tx.auditLog.create({
        data: {
          id: signatureId,
          orgId,
          entityType,
          entityId,
          action: AuditAction.STATUS_CHANGE,
          previousData:
            (oldRecord as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          newData:
            (updatedRecord as unknown as Prisma.InputJsonValue) ??
            Prisma.JsonNull,
          reason: signatureReason,
          fieldChanges:
            fieldChanges.length > 0
              ? (fieldChanges as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          changedById: userId,
          signerName,
          signerEmail,
          signerRole,
          organizationName,
          signatureMeaning: meaningOfSignature,
          recordVersion,
          // Link to complaint or capa if applicable
          ...(entityType === "Complaint"
            ? { complaintId: entityId }
            : entityType === "Capa"
            ? { capaId: entityId }
            : (oldRecord as Record<string, unknown>).complaintId
            ? { complaintId: (oldRecord as Record<string, unknown>).complaintId as string }
            : (oldRecord as Record<string, unknown>).capaId
            ? { capaId: (oldRecord as Record<string, unknown>).capaId as string }
            : {}),
        },
      });

      return {
        updatedRecord,
        signatureId: createdAuditLog?.id ?? signatureId,
      };
    }, { maxWait: 5000, timeout: 20000 });

    // 5f. Revalidate the page to reflect the new status
    revalidatePath("/", "layout");

    return {
      success: true,
      updatedStatus: newStatus,
      signatureId: result.signatureId,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return {
      success: false,
      error: message,
    };
  }
}

// =============================================================================
// Internal helpers — Prisma record fetch/update by entity type
// =============================================================================

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function fetchRecord(
  tx: PrismaTx,
  entityType: EntityType,
  entityId: string,
  orgId: string
) {
  switch (entityType) {
    case "Complaint":
      return tx.complaint.findUnique({
        where: { id: entityId, orgId, deletedAt: null },
      });
    case "Investigation":
      return tx.investigation.findUnique({
        where: { id: entityId, orgId },
      });
    case "Vigilance":
      return tx.vigilanceDecisionTree.findUnique({
        where: { id: entityId, orgId },
      });
    case "CustomerCommunication":
      return tx.customerCommunication.findUnique({
        where: { id: entityId, orgId },
      });
    case "ComplaintTask":
      return tx.complaintTask.findUnique({
        where: { id: entityId, orgId },
      });
    case "Capa":
      return tx.capa.findUnique({
        where: { id: entityId, orgId },
      });
    case "InitialMIR":
      return (tx as any).mIR?.findFirst
        ? (tx as any).mIR.findFirst({ where: { id: entityId, orgId } })
        : (tx as any).initialMIR?.findUnique({ where: { id: entityId, orgId } });
    case "FinalMIR":
      return (tx as any).mIR?.findFirst
        ? (tx as any).mIR.findFirst({ where: { id: entityId, orgId } })
        : (tx as any).finalMIR?.findUnique({ where: { id: entityId, orgId } });
    case "MIR":
      return (tx as any).mIR?.findFirst
        ? (tx as any).mIR.findFirst({ where: { id: entityId, orgId } })
        : (tx as any).initialMIR?.findUnique
        ? (tx as any).initialMIR.findUnique({ where: { id: entityId, orgId } })
        : (tx as any).finalMIR?.findUnique({ where: { id: entityId, orgId } });
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }
}

async function updateRecord(
  tx: PrismaTx,
  entityType: EntityType,
  entityId: string,
  orgId: string,
  newStatus: string,
  rationale?: string | null,
  userId?: string
) {
  switch (entityType) {
    case "Complaint":
      return tx.complaint.update({
        where: { id: entityId, orgId },
        data: { status: newStatus as Prisma.EnumComplaintStatusFieldUpdateOperationsInput["set"] },
      });
    case "Investigation":
      return tx.investigation.update({
        where: { id: entityId, orgId },
        data: {
          status: newStatus as Prisma.EnumInvestigationStatusFieldUpdateOperationsInput["set"],
          ...(newStatus === "NOT_REQUIRED"
            ? {
                noInvestigationReason: rationale?.trim() || null,
                noInvestigationDeterminedById: userId || null,
                noInvestigationDeterminedAt: new Date(),
              }
            : newStatus === "NOT_STARTED" || newStatus === "IN_PROGRESS"
            ? {
                noInvestigationReason: null,
                noInvestigationDeterminedById: null,
                noInvestigationDeterminedAt: null,
              }
            : {}),
        },
      });
    case "Vigilance":
      return tx.vigilanceDecisionTree.update({
        where: { id: entityId, orgId },
        data: {
          status: newStatus as Prisma.EnumVigilanceStatusFieldUpdateOperationsInput["set"],
          ...(newStatus === "CANCELLED" && rationale?.trim()
            ? { cancelledRationale: rationale.trim() }
            : {}),
        },
      });
    case "CustomerCommunication":
      return tx.customerCommunication.update({
        where: { id: entityId, orgId },
        data: { status: newStatus as Prisma.EnumCommunicationStatusFieldUpdateOperationsInput["set"] },
      });
    case "ComplaintTask":
      return tx.complaintTask.update({
        where: { id: entityId, orgId },
        data: { status: newStatus as Prisma.EnumTaskStatusFieldUpdateOperationsInput["set"] },
      });
    case "Capa":
      return tx.capa.update({
        where: { id: entityId, orgId },
        data: {
          currentPhase: newStatus as Prisma.EnumCapaPhaseFieldUpdateOperationsInput["set"],
        },
      });
    case "InitialMIR":
      return (tx as any).mIR?.update
        ? (tx as any).mIR.update({
            where: { id: entityId, orgId },
            data: {
              status: newStatus as MIRStatus,
              ...(newStatus === "SUBMITTED" ? { submissionDate: new Date() } : {}),
            },
          })
        : (tx as any).initialMIR?.update({
            where: { id: entityId, orgId },
            data: {
              status: newStatus as MIRStatus,
              ...(newStatus === "SUBMITTED" ? { submissionDate: new Date() } : {}),
            },
          });
    case "FinalMIR":
      return (tx as any).mIR?.update
        ? (tx as any).mIR.update({
            where: { id: entityId, orgId },
            data: {
              status: newStatus as MIRStatus,
              ...(newStatus === "SUBMITTED" ? { submissionDate: new Date() } : {}),
            },
          })
        : (tx as any).finalMIR?.update({
            where: { id: entityId, orgId },
            data: {
              status: newStatus as MIRStatus,
              ...(newStatus === "SUBMITTED" ? { submissionDate: new Date() } : {}),
            },
          });
    case "MIR":
      return (tx as any).mIR?.update
        ? (tx as any).mIR.update({
            where: { id: entityId, orgId },
            data: {
              status: newStatus as MIRStatus,
              ...(newStatus === "SUBMITTED" ? { submissionDate: new Date() } : {}),
            },
          })
        : (tx as any).initialMIR?.update
        ? (tx as any).initialMIR.update({
            where: { id: entityId, orgId },
            data: {
              status: newStatus as MIRStatus,
              ...(newStatus === "SUBMITTED" ? { submissionDate: new Date() } : {}),
            },
          })
        : (tx as any).finalMIR?.update({
            where: { id: entityId, orgId },
            data: {
              status: newStatus as MIRStatus,
              ...(newStatus === "SUBMITTED" ? { submissionDate: new Date() } : {}),
            },
          });
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }
}

async function validateInvestigationForReview(
  tx: PrismaTx,
  investigationId: string,
  orgId: string
) {
  const fullInvestigation = await tx.investigation.findUnique({
    where: { id: investigationId, orgId },
    include: {
      summary: {
        include: {
          imdrfCodes: true,
        },
      },
      customSections: {
        include: {
          template: true,
        },
      },
    },
  });

  if (!fullInvestigation) {
    throw new Error("Investigation record not found.");
  }

  const missingFields: string[] = [];

  // 1. General Details: Investigator
  if (!fullInvestigation.investigatorId?.trim()) {
    missingFields.push("General Details: Investigator must be assigned.");
  }

  // 2. Sample Analysis:
  if (fullInvestigation.sampleAnalysisRequired) {
    if (!fullInvestigation.sampleAnalysisAssignedDate) {
      missingFields.push("Sample Analysis: Assigned Date is required.");
    }
    if (!fullInvestigation.sampleAnalysisCompleteDate) {
      missingFields.push("Sample Analysis: Complete Date is required.");
    }
  } else {
    if (!fullInvestigation.sampleAnalysisExemptRationale?.trim()) {
      missingFields.push("Sample Analysis: Exempt Rationale is required when Sample Analysis is not required.");
    }
  }

  // 3. Risk Review:
  if (fullInvestigation.riskReviewRequired) {
    if (!fullInvestigation.riskReviewCompletedById?.trim()) {
      missingFields.push("Risk Review: Completed By is required when Risk Review is required.");
    }
    if (!fullInvestigation.riskReviewCompletedAt) {
      missingFields.push("Risk Review: Completed At date is required when Risk Review is required.");
    }
    if (!fullInvestigation.riskReviewResults?.trim()) {
      missingFields.push("Risk Review: Results are required when Risk Review is required.");
    }
  } else {
    if (!fullInvestigation.riskReviewExemptRationale?.trim()) {
      missingFields.push("Risk Review: Exempt Rationale is required when Risk Review is not required.");
    }
  }

  // 4. Summary & CAPA:
  if (!fullInvestigation.summary) {
    missingFields.push("Summary & CAPA: Investigation Summary details have not been saved yet.");
  } else {
    const summary = fullInvestigation.summary;
    const completedById = fullInvestigation.investigationSummaryCompletedById || summary.completedById;
    const completedAt = fullInvestigation.investigationSummaryCompletedAt || summary.completedAt;

    if (!completedById?.trim()) {
      missingFields.push("Summary & CAPA: Summary Completed By is required.");
    }
    if (!completedAt) {
      missingFields.push("Summary & CAPA: Summary Completed At date is required.");
    }
    if (!summary.summary?.trim()) {
      missingFields.push("Summary & CAPA: Summary text is required.");
    }
    if (!summary.report?.trim()) {
      missingFields.push("Summary & CAPA: Investigation Report is required.");
    }
    if (!summary.capaFscaRationale?.trim()) {
      missingFields.push("Summary & CAPA/FSCA: CAPA / FSCA Rationale is required.");
    }

    // IMDRF Codes check: Annex B, C, D, G
    const codes = summary.imdrfCodes || [];
    const hasAnnexB = codes.some((c) => c.annex === "ANNEX_B" && c.code?.trim() && c.term?.trim());
    const hasAnnexC = codes.some((c) => c.annex === "ANNEX_C" && c.code?.trim() && c.term?.trim());
    const hasAnnexD = codes.some((c) => c.annex === "ANNEX_D" && c.code?.trim() && c.term?.trim());
    const hasAnnexG = codes.some((c) => c.annex === "ANNEX_G" && c.code?.trim() && c.term?.trim());

    if (!hasAnnexB || !hasAnnexC || !hasAnnexD || !hasAnnexG) {
      missingFields.push("Summary & CAPA: IMDRF Codes must include valid selections for all Annexes (Annex B, C, D, and G).");
    }
  }

  // 5. Custom Sections:
  if (fullInvestigation.customSections && fullInvestigation.customSections.length > 0) {
    for (const cs of fullInvestigation.customSections) {
      if (cs.template && !cs.template.isActive) {
        continue;
      }
      const sectionName = cs.template?.sectionName || "Custom Section";
      if (cs.isRequired) {
        const missingSub: string[] = [];
        if (!cs.assignedToId?.trim()) missingSub.push("Assigned To");
        if (!cs.assignedDate) missingSub.push("Assigned Date");
        if (!cs.results?.trim()) missingSub.push("Results");
        if (missingSub.length > 0) {
          missingFields.push(`Custom Section "${sectionName}": ${missingSub.join(", ")} required.`);
        }
      } else {
        if (!cs.exemptRationale?.trim()) {
          missingFields.push(`Custom Section "${sectionName}": Exempt Rationale is required.`);
        }
      }
    }
  }

  if (missingFields.length > 0) {
    throw new Error(
      `Cannot move investigation to Under Review. The following mandatory fields must be completed:\n• ${missingFields.join("\n• ")}`
    );
  }
}
async function validateComplaintClosure(tx: PrismaTx, complaintId: string, orgId: string, newStatus: string) {
  if (newStatus !== "CLOSED" && newStatus !== "CANCELLED") return;

  const fullComplaint = await tx.complaint.findUnique({
    where: { id: complaintId, orgId },
    include: {
      investigation: true,
      vigilanceDecisionTrees: true,
      mirs: true,
      tasks: true,
      customerCommunications: true,
    }
  });

  if (!fullComplaint) {
    throw new Error("Complaint record not found.");
  }

  const activeFolders: string[] = [];

  const mirs = (fullComplaint as any).mirs || [];
  const initialMIR =
    (fullComplaint as any).initialMIR ||
    mirs.find((m: any) => m.reportType === "INITIAL" || m.reportType === "COMBINED");
  const finalMIR =
    (fullComplaint as any).finalMIR ||
    mirs.find((m: any) => m.reportType === "FINAL" || m.reportType === "FINAL_NON_REPORTABLE");

  if (newStatus === "CLOSED") {
    // Check Investigation
    if (fullComplaint.investigation && fullComplaint.investigation.status !== "COMPLETED" && fullComplaint.investigation.status !== "NOT_REQUIRED" && fullComplaint.investigation.status !== "CANCELLED") {
      activeFolders.push(`Investigation is currently in ${fullComplaint.investigation.status} status (must be COMPLETED or NOT_REQUIRED)`);
    }

    // Check Vigilance Decision Tree
    for (const tree of fullComplaint.vigilanceDecisionTrees || []) {
      if (tree.status !== "SUBMITTED" && tree.status !== "NOT_REPORTABLE" && tree.status !== "CANCELLED") {
        activeFolders.push(`Vigilance Decision Tree is currently in ${tree.status} status (must be SUBMITTED or NOT_REPORTABLE)`);
      }
    }

    // Check Initial MIR
    if (initialMIR && initialMIR.status !== "SUBMITTED" && initialMIR.status !== "CANCELLED") {
      activeFolders.push(`Initial MIR is currently in ${initialMIR.status} status (must be SUBMITTED)`);
    }

    // Check Final MIR
    if (finalMIR && finalMIR.status !== "SUBMITTED" && finalMIR.status !== "CANCELLED") {
      activeFolders.push(`Final MIR is currently in ${finalMIR.status} status (must be SUBMITTED)`);
    }

    // Check Follow-ups / Communications
    for (const comm of fullComplaint.customerCommunications || []) {
      if (comm.status !== "CLOSED" && comm.status !== "CANCELLED") { // Assuming OPEN / CLOSED / CANCELLED
        activeFolders.push(`Customer Communication (${comm.id}) is not closed`);
      }
    }

    // Check Tasks
    for (const task of fullComplaint.tasks || []) {
      if (task.status !== "CLOSED" && task.status !== "CANCELLED") {
        activeFolders.push(`Task (${task.shortDescription || task.id}) is not completed`);
      }
    }
  } else if (newStatus === "CANCELLED") {
    // If cancelling, ensure subfolders are also cancelled
    if (fullComplaint.investigation && fullComplaint.investigation.status !== "CANCELLED") {
      activeFolders.push(`Investigation must be CANCELLED before the complaint can be cancelled`);
    }
    for (const tree of fullComplaint.vigilanceDecisionTrees || []) {
      if (tree.status !== "CANCELLED") activeFolders.push(`Vigilance Decision Tree must be CANCELLED`);
    }
    if (initialMIR && initialMIR.status !== "CANCELLED") {
      activeFolders.push(`Initial MIR must be CANCELLED`);
    }
    if (finalMIR && finalMIR.status !== "CANCELLED") {
      activeFolders.push(`Final MIR must be CANCELLED`);
    }
    for (const comm of fullComplaint.customerCommunications || []) {
      if (comm.status !== "CANCELLED") activeFolders.push(`Customer Communication must be CANCELLED`);
    }
    for (const task of fullComplaint.tasks || []) {
      if (task.status !== "CANCELLED") activeFolders.push(`Task must be CANCELLED`);
    }
  }

  if (activeFolders.length > 0) {
    throw new Error(
      `Cannot move complaint to ${newStatus}. The following sub-folders must be completed or cancelled first:\n• ${activeFolders.join("\n• ")}`
    );
  }
}
