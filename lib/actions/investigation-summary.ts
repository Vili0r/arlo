"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgAuth } from "@/lib/auth-guard";
import { AuditAction, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface SaveInvestigationSummaryInput {
  investigationId: string;
  summary: string | null;
  report: string | null;
  capaRequired: boolean;
  capaRef: string | null;
  capaRationale: string | null;
  reportabilityReviewRequired: boolean;
  notes: string | null;
}

export async function saveInvestigationSummaryDraft(data: SaveInvestigationSummaryInput) {
  const { userId, orgId } = await requireOrgAuth();

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.investigationSummary.findUnique({
      where: { investigationId: data.investigationId },
    });

    const payload = {
      orgId,
      investigationId: data.investigationId,
      summary: data.summary,
      report: data.report,
      capaRequired: data.capaRequired,
      capaRef: data.capaRequired ? data.capaRef : null,
      capaRationale: data.capaRequired ? data.capaRationale : null,
      reportabilityReviewRequired: data.reportabilityReviewRequired,
      notes: data.notes,
    };

    const summary = await tx.investigationSummary.upsert({
      where: { investigationId: data.investigationId },
      create: payload,
      update: payload,
    });

    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "InvestigationSummary",
        entityId: summary.id,
        action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
        changedById: userId,
        previousData: existing ? (existing as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        newData: summary as unknown as Prisma.InputJsonValue,
        reason: "Saved draft of Investigation Summary",
      },
    });

    revalidatePath(`/investigations/${data.investigationId}`);
    return summary;
  });
}

export async function signAndCompleteInvestigationSummary(data: SaveInvestigationSummaryInput) {
  const { userId, orgId } = await requireOrgAuth();

  return await prisma.$transaction(async (tx) => {
    // Upsert the record with signature details
    const summary = await tx.investigationSummary.upsert({
      where: { investigationId: data.investigationId },
      create: {
        orgId,
        investigationId: data.investigationId,
        summary: data.summary,
        report: data.report,
        capaRequired: data.capaRequired,
        capaRef: data.capaRequired ? data.capaRef : null,
        capaRationale: data.capaRequired ? data.capaRationale : null,
        reportabilityReviewRequired: data.reportabilityReviewRequired,
        notes: data.notes,
        completedById: userId,
        completedAt: new Date(),
      },
      update: {
        summary: data.summary,
        report: data.report,
        capaRequired: data.capaRequired,
        capaRef: data.capaRequired ? data.capaRef : null,
        capaRationale: data.capaRequired ? data.capaRationale : null,
        reportabilityReviewRequired: data.reportabilityReviewRequired,
        notes: data.notes,
        completedById: userId,
        completedAt: new Date(),
      },
    });

    // Also update the parent Investigation status to COMPLETED
    await tx.investigation.update({
      where: { id: data.investigationId },
      data: { status: "COMPLETED" },
    });

    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "InvestigationSummary",
        entityId: summary.id,
        action: AuditAction.APPROVE_CLOSE,
        changedById: userId,
        newData: summary as unknown as Prisma.InputJsonValue,
        reason: "Signed and Locked Investigation Summary",
      },
    });

    revalidatePath(`/investigations/${data.investigationId}`);
    return summary;
  });
}
