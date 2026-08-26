"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgAuth, PERMISSIONS } from "@/lib/auth-guard";
import { InvestigationStatus, AuditAction, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface AttachmentInput {
  fileUrl: string;
  fileName: string;
  fileSize?: number | null;
  mimeType?: string | null;
}

export interface UpdateInvestigationInput {
  id: string;
  complaintId: string;
  orgSlug: string;
  status: InvestigationStatus;
  investigatorId?: string | null;
  notes?: string | null;

  // Sample Analysis
  sampleAnalysisAssignedDate?: Date | string | null;
  sampleAnalysisCompleteDate?: Date | string | null;
  sampleAnalysisRequired: boolean;
  sampleAnalysisExemptRationale?: string | null;
  decontaminatedAt?: Date | string | null;
  sampleReceivedDate?: Date | string | null;
  quantity?: number | null;
  sampleAnalysisResults?: string | null;

  // Risk Review
  riskReviewRequired: boolean;
  riskReviewExemptRationale?: string | null;
  riskReviewCompletedAt?: Date | string | null;
  riskReviewCompletedById?: string | null;
  riskReviewResults?: string | null;

  // Investigation Summary
  investigationSummaryCompletedById?: string | null;
  investigationSummaryCompletedAt?: Date | string | null;
  summaryText?: string | null;
  report?: string | null;
  capaRationale?: string | null;
  capaRequired: boolean;
  capaRef?: string | null;
  reportabilityReviewRequired: boolean;
  imdrfCodes?: Array<{
    id?: string;
    productInformationId?: string | null;
    annex: "ANNEX_B" | "ANNEX_C" | "ANNEX_D" | "ANNEX_G";
    category?: string;
    code: string;
    term: string;
    notes?: string | null;
  }>;

  newAttachments?: AttachmentInput[];
}

export async function updateInvestigation(data: UpdateInvestigationInput) {
  const { userId, orgId } = await requireOrgAuth();

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.investigation.findUnique({
      where: { id: data.id, orgId },
      include: { attachments: true, summary: { include: { imdrfCodes: true } } },
    });

    if (!existing) {
      throw new Error("Investigation not found or insufficient permissions.");
    }

    const summaryData = {
      orgId,
      completedById: data.investigationSummaryCompletedById ?? null,
      completedAt: data.investigationSummaryCompletedAt ? new Date(data.investigationSummaryCompletedAt) : null,
      summary: data.summaryText ?? null,
      report: data.report ?? null,
      capaRationale: data.capaRationale ?? null,
      capaRequired: data.capaRequired,
      capaRef: data.capaRef ?? null,
      notes: data.notes ?? null,
      reportabilityReviewRequired: data.reportabilityReviewRequired,
    };

    const imdrfCodesCreate = (data.imdrfCodes || []).map(code => ({
      orgId,
      productInformationId: code.productInformationId || null,
      annex: code.annex,
      code: code.code,
      term: code.term,
      notes: code.notes || null,
    }));

    const updated = await tx.investigation.update({
      where: { id: data.id },
      data: {
        status: data.status,
        investigatorId: data.investigatorId ?? null,

        sampleAnalysisAssignedDate: data.sampleAnalysisAssignedDate ? new Date(data.sampleAnalysisAssignedDate) : null,
        sampleAnalysisCompleteDate: data.sampleAnalysisCompleteDate ? new Date(data.sampleAnalysisCompleteDate) : null,
        sampleAnalysisRequired: data.sampleAnalysisRequired,
        sampleAnalysisExemptRationale: data.sampleAnalysisExemptRationale ?? null,
        decontaminatedAt: data.decontaminatedAt ? new Date(data.decontaminatedAt) : null,
        sampleReceivedDate: data.sampleReceivedDate ? new Date(data.sampleReceivedDate) : null,
        quantity: data.quantity ?? null,
        sampleAnalysisResults: data.sampleAnalysisResults ?? null,

        riskReviewRequired: data.riskReviewRequired,
        riskReviewExemptRationale: data.riskReviewExemptRationale ?? null,
        riskReviewCompletedAt: data.riskReviewCompletedAt ? new Date(data.riskReviewCompletedAt) : null,
        riskReviewCompletedById: data.riskReviewCompletedById ?? null,
        riskReviewResults: data.riskReviewResults ?? null,

        summary: {
          upsert: {
            create: {
              ...summaryData,
              imdrfCodes: {
                create: imdrfCodesCreate,
              }
            },
            update: {
              ...summaryData,
              imdrfCodes: {
                deleteMany: {},
                create: imdrfCodesCreate,
              }
            }
          }
        }
      },
    });

    if (data.newAttachments && data.newAttachments.length > 0) {
      await tx.attachment.createMany({
        data: data.newAttachments.map((att) => ({
          orgId,
          complaintId: data.complaintId,
          investigationId: data.id,
          fileUrl: att.fileUrl,
          fileName: att.fileName,
          fileSize: att.fileSize ?? null,
          mimeType: att.mimeType ?? null,
          uploadedById: userId,
        })),
      });
    }

    const fullyUpdated = await tx.investigation.findUnique({
      where: { id: data.id },
      include: { attachments: true }
    });

    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "Investigation",
        entityId: data.id,
        action: AuditAction.UPDATE,
        changedById: userId,
        previousData: existing as unknown as Prisma.InputJsonValue,
        newData: fullyUpdated as unknown as Prisma.InputJsonValue,
        reason: `Updated investigation details`,
        complaintId: data.complaintId,
      },
    });

    return fullyUpdated;
  });
}
