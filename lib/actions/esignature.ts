"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgAuth, ROLES, PERMISSIONS } from "@/lib/auth-guard";
import { generateAuditDiff } from "@/utils/auditDiff";
import {
  isTransitionAllowed,
  isRevertTransition,
  isCancelTransition,
  getStatusConfig,
  type EntityType,
} from "@/lib/constants/status-transitions";
import { AuditAction, Prisma } from "@prisma/client";
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

  try {
    const authCtx = await requireOrgAuth();
    userId = authCtx.userId;
    orgId = authCtx.orgId;
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
        const isQAManager =
          authContext.orgRole === ROLES.QA_MANAGER ||
          Boolean(authContext.has?.({ role: ROLES.QA_MANAGER }));
        const hasApprovalPermission = Boolean(
          authContext.has?.({
            permission: PERMISSIONS.COMPLAINTS_APPROVE_CLOSE,
          })
        );

        if (!isAdmin && !isQAManager && !hasApprovalPermission) {
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
            vigilanceDecisionTree: true,
            capas: {
              where: { deletedAt: null },
            },
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

        // 2. Check Vigilance Decision Tree linkage
        if (
          fullComplaint.vigilanceDecisionTree &&
          fullComplaint.vigilanceDecisionTree.status !== "SUBMITTED" &&
          fullComplaint.vigilanceDecisionTree.status !== "NOT_REPORTABLE"
        ) {
          blockingReasons.push(
            `Vigilance Decision Tree assessment is not finalized (current status: ${fullComplaint.vigilanceDecisionTree.status.replace(/_/g, " ")})`
          );
        }

        // 3. Check CAPAs linkage
        if (fullComplaint.capas && fullComplaint.capas.length > 0) {
          const openCapas = fullComplaint.capas.filter(
            (c) => c.status !== "CLOSED"
          );
          if (openCapas.length > 0) {
            const capaNumbers = openCapas.map((c) => c.capaNumber).join(", ");
            blockingReasons.push(
              `Active CAPA(s) are not closed: ${capaNumbers}`
            );
          }
        }

        if (blockingReasons.length > 0) {
          throw new Error(
            `Cannot close complaint: All direct linkages must be closed first:\n• ${blockingReasons.join("\n• ")}`
          );
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
        rationale
      );

      // 5e. Write immutable audit log with e-signature details
      const signatureReason = [
        isCancel
          ? `E-SIGNATURE RECORD CANCELLATION: ${currentStatus} → ${newStatus}`
          : isRevert
          ? `E-SIGNATURE STAGE REVERSION: ${currentStatus} → ${newStatus}`
          : `E-SIGNATURE STATUS CHANGE: ${currentStatus} → ${newStatus}`,
        `Meaning: ${meaningOfSignature}`,
        ...(rationale?.trim() ? [`Rationale: ${rationale.trim()}`] : []),
        `Signed by: ${userId}`,
        `Timestamp: ${new Date().toISOString()}`,
      ].join(" | ");

      await tx.auditLog.create({
        data: {
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
          // Link to complaint if applicable
          ...(entityType === "Complaint"
            ? { complaintId: entityId }
            : (oldRecord as Record<string, unknown>).complaintId
            ? { complaintId: (oldRecord as Record<string, unknown>).complaintId as string }
            : {}),
        },
      });

      return updatedRecord;
    });

    // 5f. Revalidate the page to reflect the new status
    revalidatePath("/", "layout");

    return {
      success: true,
      updatedStatus: newStatus,
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
  rationale?: string | null
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
        data: { status: newStatus as Prisma.EnumInvestigationStatusFieldUpdateOperationsInput["set"] },
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
    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }
}
