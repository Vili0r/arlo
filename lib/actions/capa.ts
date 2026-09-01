"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgAuth } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { CapaType, CapaPhase, ExtensionRequestStatus, AuditAction, LockEntityType } from "@prisma/client";
import { assertRecordNotLocked } from "@/lib/actions/record-lock";
import { CreateCapaSchema, type CreateCapaFormValues } from "@/lib/validations/capa";

export interface AttachmentInput {
  fileUrl: string;
  fileName: string;
  fileSize?: number | null;
  mimeType?: string | null;
}

export async function createCapa(data: CreateCapaFormValues) {
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

    // 5. Create CapaImplementation
    const implementation = await tx.capaImplementation.create({
      data: {
        orgId,
        capaId: capa.id,
        actionPlan: validated.implementation?.actionPlan || null,
        actionPlanSummary: validated.implementation?.actionPlanSummary || null,
        riskEvaluation: validated.implementation?.riskEvaluation || null,
        implementationDueDate: validated.implementation?.implementationDueDate ? new Date(validated.implementation.implementationDueDate) : null,
        effectivenessCheckPlan: validated.implementation?.effectivenessCheckPlan || null,
        effectivenessDueDate: validated.implementation?.effectivenessDueDate ? new Date(validated.implementation.effectivenessDueDate) : null,
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

export async function updateCapa(capaId: string, data: CreateCapaFormValues) {
  const { orgId, userId } = await requireOrgAuth();

  const validated = CreateCapaSchema.parse(data);

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.capa.findUnique({
      where: { id: capaId, orgId },
      include: {
        initiation: true,
        investigation: true,
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

    // 4. Upsert Implementation
    if (validated.implementation) {
      await tx.capaImplementation.upsert({
        where: { capaId },
        create: {
          orgId,
          capaId,
          actionPlan: validated.implementation.actionPlan || null,
          actionPlanSummary: validated.implementation.actionPlanSummary || null,
          riskEvaluation: validated.implementation.riskEvaluation || null,
          implementationDueDate: validated.implementation.implementationDueDate ? new Date(validated.implementation.implementationDueDate) : null,
          effectivenessCheckPlan: validated.implementation.effectivenessCheckPlan || null,
          effectivenessDueDate: validated.implementation.effectivenessDueDate ? new Date(validated.implementation.effectivenessDueDate) : null,
          primaryApproverId: validated.implementation.primaryApproverId || null,
          secondaryApproverId: validated.implementation.secondaryApproverId || null,
        },
        update: {
          actionPlan: validated.implementation.actionPlan || null,
          actionPlanSummary: validated.implementation.actionPlanSummary || null,
          riskEvaluation: validated.implementation.riskEvaluation || null,
          implementationDueDate: validated.implementation.implementationDueDate ? new Date(validated.implementation.implementationDueDate) : null,
          effectivenessCheckPlan: validated.implementation.effectivenessCheckPlan || null,
          effectivenessDueDate: validated.implementation.effectivenessDueDate ? new Date(validated.implementation.effectivenessDueDate) : null,
          primaryApproverId: validated.implementation.primaryApproverId || null,
          secondaryApproverId: validated.implementation.secondaryApproverId || null,
        },
      });
    }

    // 5. Upsert Effectiveness
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

    // 6. Audit Trail
    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "Capa",
        entityId: capaId,
        action: AuditAction.UPDATE,
        changedById: userId,
        capaId,
        previousData: {
          shortDescription: existing.shortDescription,
          type: existing.type,
          currentPhase: existing.currentPhase,
          ownerId: existing.ownerId,
          cancellationRequested: existing.cancellationRequested,
          cancellationJustification: existing.cancellationJustification,
          initiation: existing.initiation,
          investigation: existing.investigation,
          implementation: existing.implementation,
          effectiveness: existing.effectiveness,
        },
        newData: {
          shortDescription: updatedCapa.shortDescription,
          type: updatedCapa.type,
          currentPhase: updatedCapa.currentPhase,
          ownerId: updatedCapa.ownerId,
          cancellationRequested: updatedCapa.cancellationRequested,
          cancellationJustification: updatedCapa.cancellationJustification,
          initiation: validated.initiation,
          investigation: validated.investigation,
          implementation: validated.implementation,
          effectiveness: validated.effectiveness,
        },
        reason: "CAPA record and phase details updated",
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
