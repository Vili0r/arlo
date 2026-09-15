"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgAuth } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { CapaType, CapaPhase, ExtensionRequestStatus, AuditAction, LockEntityType, Prisma } from "@prisma/client";
import { assertRecordNotLocked } from "@/lib/actions/record-lock";
import {
  CreateCapaSchema,
  type CreateCapaFormValues,
  type CreateCapaInput,
  CreateExtensionRequestSchema,
  type CreateExtensionRequestInput,
  ReviewExtensionRequestSchema,
  type ReviewExtensionRequestInput,
} from "@/lib/validations/capa";
import { generateAuditDiff, stripMetadata } from "@/utils/auditDiff";

export interface AttachmentInput {
  fileUrl: string;
  fileName: string;
  fileSize?: number | null;
  mimeType?: string | null;
}

export async function createCapa(data: CreateCapaInput) {
  const { orgId, userId } = await requireOrgAuth();

  // Validate input
  const validated = CreateCapaSchema.parse(data);

  return await prisma.$transaction(async (tx) => {
    // 1. Generate sequential CAPA number: CAPA-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);

    const count = await tx.capa.count({
      where: {
        orgId,
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
    });
    const capaNumber = `CAPA-${currentYear}-${String(count + 1).padStart(4, "0")}`;

    // 2. Create the Parent Capa record
    const capa = await tx.capa.create({
      data: {
        orgId,
        capaNumber,
        shortDescription: validated.shortDescription,
        type: validated.type,
        currentPhase: validated.currentPhase,
        ownerId: validated.ownerId || userId,
        cancellationRequested: validated.cancellationRequested,
        cancellationJustification: validated.cancellationJustification || null,
      },
    });

    // 3. Create CapaInitiation
    const initiation = await tx.capaInitiation.create({
      data: {
        orgId,
        capaId: capa.id,
        problemStatement: validated.initiation.problemStatement,
        containmentAction: validated.initiation.containmentAction || null,
        dateDue: validated.initiation.dateDue ? new Date(validated.initiation.dateDue) : null,
        source: validated.initiation.source || null,
        repeatCapa: validated.initiation.repeatCapa,
        capaReference: validated.initiation.capaReference || null,
        existingCapa: validated.initiation.existingCapa,
        existingOpenCapaReference: validated.initiation.existingOpenCapaReference || null,
        existingCapaDueDate: validated.initiation.existingCapaDueDate ? new Date(validated.initiation.existingCapaDueDate) : null,
        processOrProduct: validated.initiation.processOrProduct || null,
        affectedArea: validated.initiation.affectedArea || null,
        productDetails: validated.initiation.productDetails || null,
        relatedProcess: validated.initiation.relatedProcess || null,
        severityRanking: validated.initiation.severityRanking || null,
        severityRationale: validated.initiation.severityRationale || null,
        occurrenceRanking: validated.initiation.occurrenceRanking || null,
        occurrenceRationale: validated.initiation.occurrenceRationale || null,
        riskCategory: validated.initiation.riskCategory || null,
        capaRequired: validated.initiation.capaRequired,
        capaType: validated.initiation.capaType || null,
        capaSummary: validated.initiation.capaSummary || null,
        fscaRequired: validated.initiation.fscaRequired,
        fscaRefNumber: validated.initiation.fscaRefNumber || null,
        primaryApproverId: validated.initiation.primaryApproverId || null,
        secondaryApproverId: validated.initiation.secondaryApproverId || null,
        completedById: validated.initiation.completedById || null,
        completedAt: validated.initiation.completedAt ? new Date(validated.initiation.completedAt) : null,
      },
    });

    // Initiation Attachments
    if (validated.initiation.attachments && validated.initiation.attachments.length > 0) {
      await tx.attachment.createMany({
        data: validated.initiation.attachments.map((att) => ({
          orgId,
          capaInitiationId: initiation.id,
          fileUrl: att.fileUrl,
          fileName: att.fileName,
          fileSize: att.fileSize ?? null,
          mimeType: att.mimeType ?? null,
          uploadedById: userId,
        })),
      });
    }

    // 4. Create CapaInvestigation (always initialized or populated)
    const investigation = await tx.capaInvestigation.create({
      data: {
        orgId,
        capaId: capa.id,
        containmentSummary: validated.investigation?.containmentSummary || null,
        investigationSummary: validated.investigation?.investigationSummary || null,
        rootCauseDescription: validated.investigation?.rootCauseDescription || null,
        rootCauseTools: validated.investigation?.rootCauseTools || [],
        impactProductQuality: validated.investigation?.impactProductQuality ?? false,
        impactProductQualityRationale: validated.investigation?.impactProductQualityRationale || null,
        planDueDate: validated.investigation?.planDueDate ? new Date(validated.investigation.planDueDate) : null,
        investigatorId: validated.investigation?.investigatorId || null,
        primaryApproverId: validated.investigation?.primaryApproverId || null,
        secondaryApproverId: validated.investigation?.secondaryApproverId || null,
      },
    });

    if (validated.investigation?.attachments && validated.investigation.attachments.length > 0) {
      await tx.attachment.createMany({
        data: validated.investigation.attachments.map((att) => ({
          orgId,
          capaInvestigationId: investigation.id,
          fileUrl: att.fileUrl,
          fileName: att.fileName,
          fileSize: att.fileSize ?? null,
          mimeType: att.mimeType ?? null,
          uploadedById: userId,
        })),
      });
    }

    // 5. Create CapaPlanning
    const planning = await tx.capaPlanning.create({
      data: {
        orgId,
        capaId: capa.id,
        capaPlanDueDate: validated.planning?.capaPlanDueDate ? new Date(validated.planning.capaPlanDueDate) : null,
        actionPlan: validated.planning?.actionPlan || null,
        effectivenessCheckPlan: validated.planning?.effectivenessCheckPlan || null,
        primaryApproverId: validated.planning?.primaryApproverId || null,
        secondaryApproverId: validated.planning?.secondaryApproverId || null,
      },
    });

    if (validated.planning?.attachments && validated.planning.attachments.length > 0) {
      await tx.attachment.createMany({
        data: validated.planning.attachments.map((att) => ({
          orgId,
          capaPlanningId: planning.id,
          fileUrl: att.fileUrl,
          fileName: att.fileName,
          fileSize: att.fileSize ?? null,
          mimeType: att.mimeType ?? null,
          uploadedById: userId,
        })),
      });
    }

    // 6. Create CapaImplementation
    const implDueDate = validated.implementation?.dateDue
      ? new Date(validated.implementation.dateDue)
      : validated.implementation?.implementationDueDate
      ? new Date(validated.implementation.implementationDueDate)
      : null;

    const implementation = await tx.capaImplementation.create({
      data: {
        orgId,
        capaId: capa.id,
        dateDue: implDueDate,
        implementationDueDate: implDueDate,
        actionPlan: validated.implementation?.actionPlan || null,
        effectivenessCheckPlan: validated.implementation?.effectivenessCheckPlan || null,
        effectivenessDueDate: validated.implementation?.effectivenessDueDate ? new Date(validated.implementation.effectivenessDueDate) : null,
        validateComments: validated.implementation?.validateComments || null,
        actionPlanSummary: validated.implementation?.actionPlanSummary || null,
        riskEvaluation: validated.implementation?.riskEvaluation || null,
        primaryApproverId: validated.implementation?.primaryApproverId || null,
        secondaryApproverId: validated.implementation?.secondaryApproverId || null,
      },
    });

    if (validated.implementation?.attachments && validated.implementation.attachments.length > 0) {
      await tx.attachment.createMany({
        data: validated.implementation.attachments.map((att) => ({
          orgId,
          capaImplementationId: implementation.id,
          fileUrl: att.fileUrl,
          fileName: att.fileName,
          fileSize: att.fileSize ?? null,
          mimeType: att.mimeType ?? null,
          uploadedById: userId,
        })),
      });
    }

    // 6. Create CapaEffectiveness
    const effectiveness = await tx.capaEffectiveness.create({
      data: {
        orgId,
        capaId: capa.id,
        effectivenessVerificationSummary: validated.effectiveness?.effectivenessVerificationSummary || null,
        ineffectiveJustification: validated.effectiveness?.ineffectiveJustification || null,
        dateDue: validated.effectiveness?.dateDue ? new Date(validated.effectiveness.dateDue) : null,
        primaryApproverId: validated.effectiveness?.primaryApproverId || null,
        secondaryApproverId: validated.effectiveness?.secondaryApproverId || null,
      },
    });

    if (validated.effectiveness?.attachments && validated.effectiveness.attachments.length > 0) {
      await tx.attachment.createMany({
        data: validated.effectiveness.attachments.map((att) => ({
          orgId,
          capaEffectivenessId: effectiveness.id,
          fileUrl: att.fileUrl,
          fileName: att.fileName,
          fileSize: att.fileSize ?? null,
          mimeType: att.mimeType ?? null,
          uploadedById: userId,
        })),
      });
    }

    // 7. Create Extension Requests if any
    if (validated.extensionRequests && validated.extensionRequests.length > 0) {
      await tx.extensionRequest.createMany({
        data: validated.extensionRequests.map((ext) => ({
          orgId,
          capaId: capa.id,
          targetPhase: ext.targetPhase,
          requestedDueDate: new Date(ext.requestedDueDate),
          justification: ext.justification,
          riskEvaluationRationale: ext.riskEvaluationRationale || null,
          status: ext.status || ExtensionRequestStatus.PENDING,
          requesterId: ext.requesterId || userId,
          primaryApproverId: ext.primaryApproverId || null,
          secondaryApproverId: ext.secondaryApproverId || null,
        })),
      });
    }

    // 8. Create Root Attachments (e.g. cancellation memos)
    if (validated.attachments && validated.attachments.length > 0) {
      await tx.attachment.createMany({
        data: validated.attachments.map((att) => ({
          orgId,
          capaId: capa.id,
          fileUrl: att.fileUrl,
          fileName: att.fileName,
          fileSize: att.fileSize ?? null,
          mimeType: att.mimeType ?? null,
          uploadedById: userId,
        })),
      });
    }

    // 9. 21 CFR Part 11 Audit Trail Logging
    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "Capa",
        entityId: capa.id,
        action: AuditAction.CREATE,
        changedById: userId,
        capaId: capa.id,
        newData: {
          capaNumber,
          shortDescription: capa.shortDescription,
          type: capa.type,
          currentPhase: capa.currentPhase,
          ownerId: capa.ownerId,
        },
        reason: "Initial CAPA initiation and phase establishment",
      },
    });

    revalidatePath("/[orgSlug]/capa", "page");
    return { success: true, capaId: capa.id, capaNumber };
  });
}

export async function updateCapa(capaId: string, data: CreateCapaInput) {
  const { orgId, userId } = await requireOrgAuth();

  const validated = CreateCapaSchema.parse(data);

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.capa.findUnique({
      where: { id: capaId, orgId },
      include: {
        initiation: true,
        investigation: true,
        planning: true,
        implementation: true,
        effectiveness: true,
      },
    });

    if (!existing) {
      throw new Error("CAPA record not found");
    }

    // Concurrency Lock Check: Ensure record is not actively locked by another user
    await assertRecordNotLocked(
      tx,
      orgId,
      LockEntityType.Capa,
      capaId,
      userId
    );

    // Due Date Immutability Enforcement:
    // Once a phase due date is established, direct updates via edit form are prohibited.
    // A formal Extension Request must be submitted under Controls.
    function isDueDateDirectlyModified(
      existingDate: Date | null | undefined,
      incomingDate: Date | string | null | undefined
    ): boolean {
      if (!existingDate) return false;
      if (!incomingDate) return true;
      const existingIso = new Date(existingDate).toISOString().split("T")[0];
      const incomingIso = typeof incomingDate === "string" && incomingDate.length === 10
        ? incomingDate
        : new Date(incomingDate).toISOString().split("T")[0];
      return existingIso !== incomingIso;
    }

    if (isDueDateDirectlyModified(existing.initiation?.dateDue, validated.initiation.dateDue)) {
      throw new Error(
        "Direct updates to previously set Initiation due dates are prohibited. A formal Extension Request must be submitted under Controls."
      );
    }
    if (isDueDateDirectlyModified(existing.investigation?.planDueDate, validated.investigation?.planDueDate)) {
      throw new Error(
        "Direct updates to previously set Investigation due dates are prohibited. A formal Extension Request must be submitted under Controls."
      );
    }
    if (isDueDateDirectlyModified(existing.planning?.capaPlanDueDate, validated.planning?.capaPlanDueDate)) {
      throw new Error(
        "Direct updates to previously set Planning due dates are prohibited. A formal Extension Request must be submitted under Controls."
      );
    }
    const existingImplDue = existing.implementation?.dateDue ?? existing.implementation?.implementationDueDate;
    const incomingImplDue = validated.implementation?.dateDue ?? validated.implementation?.implementationDueDate;
    if (isDueDateDirectlyModified(existingImplDue, incomingImplDue)) {
      throw new Error(
        "Direct updates to previously set Implementation due dates are prohibited. A formal Extension Request must be submitted under Controls."
      );
    }
    if (isDueDateDirectlyModified(existing.effectiveness?.dateDue, validated.effectiveness?.dateDue)) {
      throw new Error(
        "Direct updates to previously set Effectiveness due dates are prohibited. A formal Extension Request must be submitted under Controls."
      );
    }

    // 1. Update Core Capa
    const updatedCapa = await tx.capa.update({
      where: { id: capaId },
      data: {
        shortDescription: validated.shortDescription,
        type: validated.type,
        currentPhase: validated.currentPhase,
        ownerId: validated.ownerId || existing.ownerId,
        cancellationRequested: validated.cancellationRequested,
        cancellationJustification: validated.cancellationJustification || null,
      },
    });

    // 2. Upsert Initiation
    await tx.capaInitiation.upsert({
      where: { capaId },
      create: {
        orgId,
        capaId,
        problemStatement: validated.initiation.problemStatement,
        containmentAction: validated.initiation.containmentAction || null,
        dateDue: validated.initiation.dateDue ? new Date(validated.initiation.dateDue) : null,
        source: validated.initiation.source || null,
        repeatCapa: validated.initiation.repeatCapa,
        capaReference: validated.initiation.capaReference || null,
        existingCapa: validated.initiation.existingCapa,
        existingOpenCapaReference: validated.initiation.existingOpenCapaReference || null,
        existingCapaDueDate: validated.initiation.existingCapaDueDate ? new Date(validated.initiation.existingCapaDueDate) : null,
        processOrProduct: validated.initiation.processOrProduct || null,
        affectedArea: validated.initiation.affectedArea || null,
        productDetails: validated.initiation.productDetails || null,
        relatedProcess: validated.initiation.relatedProcess || null,
        severityRanking: validated.initiation.severityRanking || null,
        severityRationale: validated.initiation.severityRationale || null,
        occurrenceRanking: validated.initiation.occurrenceRanking || null,
        occurrenceRationale: validated.initiation.occurrenceRationale || null,
        riskCategory: validated.initiation.riskCategory || null,
        capaRequired: validated.initiation.capaRequired,
        capaType: validated.initiation.capaType || null,
        capaSummary: validated.initiation.capaSummary || null,
        fscaRequired: validated.initiation.fscaRequired,
        fscaRefNumber: validated.initiation.fscaRefNumber || null,
        primaryApproverId: validated.initiation.primaryApproverId || null,
        secondaryApproverId: validated.initiation.secondaryApproverId || null,
        completedById: validated.initiation.completedById || null,
        completedAt: validated.initiation.completedAt ? new Date(validated.initiation.completedAt) : null,
      },
      update: {
        problemStatement: validated.initiation.problemStatement,
        containmentAction: validated.initiation.containmentAction || null,
        dateDue: validated.initiation.dateDue ? new Date(validated.initiation.dateDue) : null,
        source: validated.initiation.source || null,
        repeatCapa: validated.initiation.repeatCapa,
        capaReference: validated.initiation.capaReference || null,
        existingCapa: validated.initiation.existingCapa,
        existingOpenCapaReference: validated.initiation.existingOpenCapaReference || null,
        existingCapaDueDate: validated.initiation.existingCapaDueDate ? new Date(validated.initiation.existingCapaDueDate) : null,
        processOrProduct: validated.initiation.processOrProduct || null,
        affectedArea: validated.initiation.affectedArea || null,
        productDetails: validated.initiation.productDetails || null,
        relatedProcess: validated.initiation.relatedProcess || null,
        severityRanking: validated.initiation.severityRanking || null,
        severityRationale: validated.initiation.severityRationale || null,
        occurrenceRanking: validated.initiation.occurrenceRanking || null,
        occurrenceRationale: validated.initiation.occurrenceRationale || null,
        riskCategory: validated.initiation.riskCategory || null,
        capaRequired: validated.initiation.capaRequired,
        capaType: validated.initiation.capaType || null,
        capaSummary: validated.initiation.capaSummary || null,
        fscaRequired: validated.initiation.fscaRequired,
        fscaRefNumber: validated.initiation.fscaRefNumber || null,
        primaryApproverId: validated.initiation.primaryApproverId || null,
        secondaryApproverId: validated.initiation.secondaryApproverId || null,
        completedById: validated.initiation.completedById || null,
        completedAt: validated.initiation.completedAt ? new Date(validated.initiation.completedAt) : null,
      },
    });

    // 3. Upsert Investigation
    if (validated.investigation) {
      await tx.capaInvestigation.upsert({
        where: { capaId },
        create: {
          orgId,
          capaId,
          containmentSummary: validated.investigation.containmentSummary || null,
          investigationSummary: validated.investigation.investigationSummary || null,
          rootCauseDescription: validated.investigation.rootCauseDescription || null,
          rootCauseTools: validated.investigation.rootCauseTools || [],
          impactProductQuality: validated.investigation.impactProductQuality ?? false,
          impactProductQualityRationale: validated.investigation.impactProductQualityRationale || null,
          planDueDate: validated.investigation.planDueDate ? new Date(validated.investigation.planDueDate) : null,
          investigatorId: validated.investigation.investigatorId || null,
          primaryApproverId: validated.investigation.primaryApproverId || null,
          secondaryApproverId: validated.investigation.secondaryApproverId || null,
        },
        update: {
          containmentSummary: validated.investigation.containmentSummary || null,
          investigationSummary: validated.investigation.investigationSummary || null,
          rootCauseDescription: validated.investigation.rootCauseDescription || null,
          rootCauseTools: validated.investigation.rootCauseTools || [],
          impactProductQuality: validated.investigation.impactProductQuality ?? false,
          impactProductQualityRationale: validated.investigation.impactProductQualityRationale || null,
          planDueDate: validated.investigation.planDueDate ? new Date(validated.investigation.planDueDate) : null,
          investigatorId: validated.investigation.investigatorId || null,
          primaryApproverId: validated.investigation.primaryApproverId || null,
          secondaryApproverId: validated.investigation.secondaryApproverId || null,
        },
      });
    }

    // 4. Upsert Planning
    if (validated.planning) {
      await tx.capaPlanning.upsert({
        where: { capaId },
        create: {
          orgId,
          capaId,
          capaPlanDueDate: validated.planning.capaPlanDueDate ? new Date(validated.planning.capaPlanDueDate) : null,
          actionPlan: validated.planning.actionPlan || null,
          effectivenessCheckPlan: validated.planning.effectivenessCheckPlan || null,
          primaryApproverId: validated.planning.primaryApproverId || null,
          secondaryApproverId: validated.planning.secondaryApproverId || null,
        },
        update: {
          capaPlanDueDate: validated.planning.capaPlanDueDate ? new Date(validated.planning.capaPlanDueDate) : null,
          actionPlan: validated.planning.actionPlan || null,
          effectivenessCheckPlan: validated.planning.effectivenessCheckPlan || null,
          primaryApproverId: validated.planning.primaryApproverId || null,
          secondaryApproverId: validated.planning.secondaryApproverId || null,
        },
      });
    }

    // 5. Upsert Implementation
    if (validated.implementation) {
      const implDateDue = validated.implementation.dateDue
        ? new Date(validated.implementation.dateDue)
        : validated.implementation.implementationDueDate
        ? new Date(validated.implementation.implementationDueDate)
        : null;

      await tx.capaImplementation.upsert({
        where: { capaId },
        create: {
          orgId,
          capaId,
          dateDue: implDateDue,
          implementationDueDate: implDateDue,
          actionPlan: validated.implementation.actionPlan || null,
          effectivenessCheckPlan: validated.implementation.effectivenessCheckPlan || null,
          effectivenessDueDate: validated.implementation.effectivenessDueDate ? new Date(validated.implementation.effectivenessDueDate) : null,
          validateComments: validated.implementation.validateComments || null,
          actionPlanSummary: validated.implementation.actionPlanSummary || null,
          riskEvaluation: validated.implementation.riskEvaluation || null,
          primaryApproverId: validated.implementation.primaryApproverId || null,
          secondaryApproverId: validated.implementation.secondaryApproverId || null,
        },
        update: {
          dateDue: implDateDue,
          implementationDueDate: implDateDue,
          actionPlan: validated.implementation.actionPlan || null,
          effectivenessCheckPlan: validated.implementation.effectivenessCheckPlan || null,
          effectivenessDueDate: validated.implementation.effectivenessDueDate ? new Date(validated.implementation.effectivenessDueDate) : null,
          validateComments: validated.implementation.validateComments || null,
          actionPlanSummary: validated.implementation.actionPlanSummary || null,
          riskEvaluation: validated.implementation.riskEvaluation || null,
          primaryApproverId: validated.implementation.primaryApproverId || null,
          secondaryApproverId: validated.implementation.secondaryApproverId || null,
        },
      });
    }

    // 6. Upsert Effectiveness
    if (validated.effectiveness) {
      await tx.capaEffectiveness.upsert({
        where: { capaId },
        create: {
          orgId,
          capaId,
          effectivenessVerificationSummary: validated.effectiveness.effectivenessVerificationSummary || null,
          ineffectiveJustification: validated.effectiveness.ineffectiveJustification || null,
          dateDue: validated.effectiveness.dateDue ? new Date(validated.effectiveness.dateDue) : null,
          primaryApproverId: validated.effectiveness.primaryApproverId || null,
          secondaryApproverId: validated.effectiveness.secondaryApproverId || null,
        },
        update: {
          effectivenessVerificationSummary: validated.effectiveness.effectivenessVerificationSummary || null,
          ineffectiveJustification: validated.effectiveness.ineffectiveJustification || null,
          dateDue: validated.effectiveness.dateDue ? new Date(validated.effectiveness.dateDue) : null,
          primaryApproverId: validated.effectiveness.primaryApproverId || null,
          secondaryApproverId: validated.effectiveness.secondaryApproverId || null,
        },
      });
    }

    const previousData = {
      shortDescription: existing.shortDescription,
      type: existing.type,
      currentPhase: existing.currentPhase,
      ownerId: existing.ownerId,
      cancellationRequested: existing.cancellationRequested,
      cancellationJustification: existing.cancellationJustification,
      initiation: existing.initiation ? stripMetadata(existing.initiation) : null,
      investigation: existing.investigation ? stripMetadata(existing.investigation) : null,
      planning: existing.planning ? stripMetadata(existing.planning) : null,
      implementation: existing.implementation ? stripMetadata(existing.implementation) : null,
      effectiveness: existing.effectiveness ? stripMetadata(existing.effectiveness) : null,
    };

    const newData = {
      shortDescription: updatedCapa.shortDescription,
      type: updatedCapa.type,
      currentPhase: updatedCapa.currentPhase,
      ownerId: updatedCapa.ownerId,
      cancellationRequested: updatedCapa.cancellationRequested,
      cancellationJustification: updatedCapa.cancellationJustification,
      initiation: validated.initiation ? stripMetadata(validated.initiation) : null,
      investigation: validated.investigation ? stripMetadata(validated.investigation) : null,
      planning: validated.planning ? stripMetadata(validated.planning) : null,
      implementation: validated.implementation ? stripMetadata(validated.implementation) : null,
      effectiveness: validated.effectiveness ? stripMetadata(validated.effectiveness) : null,
    };

    const fieldChanges = generateAuditDiff(
      previousData as Record<string, any>,
      newData as Record<string, any>
    );

    // 6. Audit Trail
    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "Capa",
        entityId: capaId,
        action: AuditAction.UPDATE,
        changedById: userId,
        capaId,
        previousData,
        newData,
        fieldChanges: fieldChanges as unknown as Prisma.InputJsonValue,
        reason: (data as any).reason || "CAPA record and phase details updated",
      },
    });

    revalidatePath("/[orgSlug]/capa", "page");
    revalidatePath(`/[orgSlug]/capa/${capaId}`, "page");
    return { success: true, capaId };
  });
}

export async function getCapaById(capaId: string) {
  const { orgId } = await requireOrgAuth();

  const capa = await prisma.capa.findUnique({
    where: { id: capaId, orgId },
    include: {
      owner: { select: { id: true, email: true, firstName: true, lastName: true, imageUrl: true } },
      initiation: {
        include: {
          primaryApprover: { select: { id: true, email: true, firstName: true, lastName: true } },
          secondaryApprover: { select: { id: true, email: true, firstName: true, lastName: true } },
          completedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          attachments: true,
        },
      },
      investigation: {
        include: {
          investigator: { select: { id: true, email: true, firstName: true, lastName: true } },
          primaryApprover: { select: { id: true, email: true, firstName: true, lastName: true } },
          secondaryApprover: { select: { id: true, email: true, firstName: true, lastName: true } },
          attachments: true,
        },
      },
      planning: {
        include: {
          primaryApprover: { select: { id: true, email: true, firstName: true, lastName: true } },
          secondaryApprover: { select: { id: true, email: true, firstName: true, lastName: true } },
          attachments: true,
        },
      },
      implementation: {
        include: {
          primaryApprover: { select: { id: true, email: true, firstName: true, lastName: true } },
          secondaryApprover: { select: { id: true, email: true, firstName: true, lastName: true } },
          attachments: true,
        },
      },
      effectiveness: {
        include: {
          primaryApprover: { select: { id: true, email: true, firstName: true, lastName: true } },
          secondaryApprover: { select: { id: true, email: true, firstName: true, lastName: true } },
          attachments: true,
        },
      },
      extensionRequests: {
        include: {
          requester: { select: { id: true, email: true, firstName: true, lastName: true } },
          primaryApprover: { select: { id: true, email: true, firstName: true, lastName: true } },
          secondaryApprover: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      attachments: true,
      auditLogs: {
        include: {
          changedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { timestamp: "desc" },
      },
    },
  });

  return capa;
}

export async function createExtensionRequest(data: CreateExtensionRequestInput) {
  const { orgId, userId } = await requireOrgAuth();
  const validated = CreateExtensionRequestSchema.parse(data);

  return await prisma.$transaction(async (tx) => {
    const capa = await tx.capa.findUnique({
      where: { id: validated.capaId, orgId },
    });

    if (!capa) {
      throw new Error("CAPA record not found");
    }

    const requestedDueDate = new Date(validated.requestedDueDate);

    const ext = await tx.extensionRequest.create({
      data: {
        orgId,
        capaId: validated.capaId,
        targetPhase: validated.targetPhase,
        requestedDueDate,
        justification: validated.justification,
        riskEvaluationRationale: validated.riskEvaluationRationale || null,
        requesterId: userId,
        primaryApproverId: validated.primaryApproverId || null,
        secondaryApproverId: validated.secondaryApproverId || null,
        status: ExtensionRequestStatus.PENDING,
      },
    });

    // 21 CFR Part 11 Audit Trail
    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "ExtensionRequest",
        entityId: ext.id,
        action: AuditAction.CREATE,
        changedById: userId,
        capaId: validated.capaId,
        newData: {
          extensionRequestId: ext.id,
          targetPhase: ext.targetPhase,
          requestedDueDate: ext.requestedDueDate.toISOString(),
          justification: ext.justification,
          riskEvaluationRationale: ext.riskEvaluationRationale,
        },
        reason: `Formal extension request submitted for phase ${ext.targetPhase}`,
      },
    });

    revalidatePath("/[orgSlug]/capa/[id]", "page");
    return { success: true, extensionRequestId: ext.id };
  });
}

export async function reviewExtensionRequest(data: ReviewExtensionRequestInput) {
  const { orgId, userId } = await requireOrgAuth();
  const validated = ReviewExtensionRequestSchema.parse(data);

  return await prisma.$transaction(async (tx) => {
    const ext = await tx.extensionRequest.findUnique({
      where: { id: validated.extensionRequestId, orgId },
      include: { capa: true },
    });

    if (!ext) {
      throw new Error("Extension request not found");
    }

    if (ext.status !== ExtensionRequestStatus.PENDING) {
      throw new Error(`Extension request has already been ${ext.status.toLowerCase()}`);
    }

    const updatedExt = await tx.extensionRequest.update({
      where: { id: ext.id },
      data: {
        status: validated.decision as ExtensionRequestStatus,
      },
    });

    // If approved, update target phase due date on the specific subrecord
    if (validated.decision === "APPROVED") {
      switch (ext.targetPhase) {
        case CapaPhase.INITIATION:
          await tx.capaInitiation.update({
            where: { capaId: ext.capaId },
            data: { dateDue: ext.requestedDueDate },
          });
          break;
        case CapaPhase.INVESTIGATION:
          await tx.capaInvestigation.update({
            where: { capaId: ext.capaId },
            data: { planDueDate: ext.requestedDueDate },
          });
          break;
        case CapaPhase.PLANNING:
          await tx.capaPlanning.update({
            where: { capaId: ext.capaId },
            data: { capaPlanDueDate: ext.requestedDueDate },
          });
          break;
        case CapaPhase.IMPLEMENTATION:
          await tx.capaImplementation.update({
            where: { capaId: ext.capaId },
            data: {
              dateDue: ext.requestedDueDate,
              implementationDueDate: ext.requestedDueDate,
            },
          });
          break;
        case CapaPhase.EFFECTIVENESS:
          await tx.capaEffectiveness.update({
            where: { capaId: ext.capaId },
            data: { dateDue: ext.requestedDueDate },
          });
          break;
        default:
          break;
      }
    }

    // 21 CFR Part 11 Audit Trail
    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "ExtensionRequest",
        entityId: ext.id,
        action: AuditAction.UPDATE,
        changedById: userId,
        capaId: ext.capaId,
        previousData: { status: ext.status },
        newData: {
          status: validated.decision,
          reviewComments: validated.reviewComments || null,
        },
        reason: `Extension request ${validated.decision.toLowerCase()} for phase ${ext.targetPhase}. ${validated.reviewComments || ""}`.trim(),
      },
    });

    revalidatePath("/[orgSlug]/capa/[id]", "page");
    return { success: true, status: validated.decision };
  });
}

export async function approveCapaPhase(capaId: string, phase: CapaPhase) {
  const { orgId, userId, orgRole } = await requireOrgAuth();

  return await prisma.$transaction(async (tx) => {
    const capa = await tx.capa.findUnique({
      where: { id: capaId, orgId },
      include: {
        initiation: true,
        investigation: true,
        planning: true,
        implementation: true,
        effectiveness: true,
      },
    });

    if (!capa) {
      throw new Error("CAPA record not found");
    }

    let primaryApproverId: string | null | undefined = null;
    let secondaryApproverId: string | null | undefined = null;

    switch (phase) {
      case CapaPhase.INITIATION:
        primaryApproverId = capa.initiation?.primaryApproverId;
        secondaryApproverId = capa.initiation?.secondaryApproverId;
        break;
      case CapaPhase.INVESTIGATION:
        primaryApproverId = capa.investigation?.primaryApproverId;
        secondaryApproverId = capa.investigation?.secondaryApproverId;
        break;
      case CapaPhase.PLANNING:
        primaryApproverId = capa.planning?.primaryApproverId;
        secondaryApproverId = capa.planning?.secondaryApproverId;
        break;
      case CapaPhase.IMPLEMENTATION:
        primaryApproverId = capa.implementation?.primaryApproverId;
        secondaryApproverId = capa.implementation?.secondaryApproverId;
        break;
      case CapaPhase.EFFECTIVENESS:
        primaryApproverId = capa.effectiveness?.primaryApproverId;
        secondaryApproverId = capa.effectiveness?.secondaryApproverId;
        break;
      default:
        break;
    }

    if (!primaryApproverId) {
      throw new Error(`Cannot approve ${phase} phase: A primary approver must be designated first.`);
    }

    const isDesignatedApprover = userId === primaryApproverId || userId === secondaryApproverId;
    const isPrivileged =
      orgRole === "admin" ||
      orgRole === "qa_manager" ||
      orgRole === "org:admin" ||
      orgRole === "org:qa_manager";

    if (!isDesignatedApprover && !isPrivileged) {
      throw new Error("Permission denied: Only the designated approver or QA Manager can approve this phase.");
    }

    if (phase === CapaPhase.INITIATION) {
      await tx.capaInitiation.update({
        where: { capaId },
        data: {
          completedById: userId,
          completedAt: new Date(),
        },
      });
    }

    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "CapaPhaseApproval",
        entityId: capa.id,
        capaId: capa.id,
        action: AuditAction.UPDATE,
        changedById: userId,
        signatureMeaning: "I am approving this change",
        reason: `Formal approval for ${phase} phase granted by designated approver.`,
        newData: {
          phase,
          status: "APPROVED",
          approvedById: userId,
          approvedAt: new Date().toISOString(),
        },
      },
    });

    revalidatePath("/[orgSlug]/capa/[id]", "page");
    return { success: true, phase, status: "APPROVED" };
  });
}

export async function isCapaPhaseApproved(
  tx: any,
  capaId: string,
  orgId: string,
  phase: CapaPhase
): Promise<boolean> {
  let approvalLogs: any[] = [];
  if (tx.auditLog?.findMany) {
    try {
      approvalLogs = (await tx.auditLog.findMany({
        where: {
          capaId,
          orgId,
          entityType: "CapaPhaseApproval",
        },
        orderBy: { timestamp: "desc" },
      })) || [];
    } catch {
      approvalLogs = [];
    }
  }

  const isApproved = approvalLogs.some((log: any) => {
    const data = log.newData as Record<string, any> | null;
    return data?.phase === phase && data?.status === "APPROVED";
  });

  if (isApproved) return true;

  // Investigation phase strictly requires approval before advancing
  if (phase === CapaPhase.INVESTIGATION) {
    return false;
  }

  // Initiation phase: completedAt counts as sign-off; otherwise require approval if approver is designated
  if (phase === CapaPhase.INITIATION) {
    if (tx.capaInitiation?.findUnique) {
      try {
        const init = await tx.capaInitiation.findUnique({
          where: { capaId },
          select: { primaryApproverId: true, completedAt: true },
        });
        if (init) {
          if (init.completedAt) return true;
          if (init.primaryApproverId) return false;
        }
      } catch {
        // ignore
      }
    }
    return true;
  }

  // Planning phase: check if approver is designated
  if (phase === CapaPhase.PLANNING) {
    if (tx.capaPlanning?.findUnique) {
      try {
        const plan = await tx.capaPlanning.findUnique({
          where: { capaId },
          select: { primaryApproverId: true },
        });
        if (plan?.primaryApproverId) return false;
      } catch {
        // ignore
      }
    }
    return true;
  }

  // Implementation phase: check if approver is designated
  if (phase === CapaPhase.IMPLEMENTATION) {
    if (tx.capaImplementation?.findUnique) {
      try {
        const impl = await tx.capaImplementation.findUnique({
          where: { capaId },
          select: { primaryApproverId: true },
        });
        if (impl?.primaryApproverId) return false;
      } catch {
        // ignore
      }
    }
    return true;
  }

  // Effectiveness phase: check if approver is designated
  if (phase === CapaPhase.EFFECTIVENESS) {
    if (tx.capaEffectiveness?.findUnique) {
      try {
        const eff = await tx.capaEffectiveness.findUnique({
          where: { capaId },
          select: { primaryApproverId: true },
        });
        if (eff?.primaryApproverId) return false;
      } catch {
        // ignore
      }
    }
    return true;
  }

  return true;
}

