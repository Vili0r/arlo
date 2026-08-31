"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgAuth } from "@/lib/auth-guard";
import { AuditAction, Prisma, VigilanceAssessmentStage, VigilanceStatus } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";
import { generateAuditDiff } from "@/utils/auditDiff";
import { revalidatePath } from "next/cache";

export interface SaveInvestigationSummaryInput {
  investigationId: string;
  summary: string | null;
  report: string | null;
  capaRequired: boolean;
  capaRef: string | null;
  fscaRequired: boolean;
  fscaRef: string | null;
  capaFscaRationale: string | null;
  reportabilityReviewRequired: boolean;
  notes: string | null;
  password?: string;
}

export async function saveInvestigationSummaryDraft(data: SaveInvestigationSummaryInput) {
  const { userId, orgId } = await requireOrgAuth();

  return await prisma.$transaction(async (tx) => {
    const investigation = await tx.investigation.findUnique({
      where: { id: data.investigationId, orgId },
      select: { id: true, complaintId: true },
    });

    if (!investigation) {
      throw new Error("Investigation not found or insufficient permissions.");
    }

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
      fscaRequired: data.fscaRequired,
      fscaRef: data.fscaRequired ? data.fscaRef : null,
      capaFscaRationale: data.capaFscaRationale,
      reportabilityReviewRequired: data.reportabilityReviewRequired,
      notes: data.notes,
    };

    const summary = await tx.investigationSummary.upsert({
      where: { investigationId: data.investigationId },
      create: payload,
      update: payload,
    });

    const fieldChanges = generateAuditDiff(
      existing as unknown as Record<string, unknown>,
      summary as unknown as Record<string, unknown>
    );

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
        fieldChanges: fieldChanges as unknown as Prisma.InputJsonValue,
        complaintId: investigation.complaintId,
      },
    });

    revalidatePath(`/investigations/${data.investigationId}`);
    return summary;
  });
}

export async function signAndCompleteInvestigationSummary(data: SaveInvestigationSummaryInput) {
  const { userId, orgId } = await requireOrgAuth();

  // 1. Verify electronic signature if password is provided (21 CFR Part 11 § 11.200)
  if (data.password) {
    try {
      const clerk = await clerkClient();
      const verification = await clerk.users.verifyPassword({
        userId,
        password: data.password,
      });

      if (!verification.verified) {
        throw new Error("Password verification failed. Electronic signature could not be authenticated.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Password verification failed";
      throw new Error(`Electronic signature authentication failed: ${message}`);
    }
  }

  return await prisma.$transaction(async (tx) => {
    // Retrieve parent investigation & complaint link
    const investigation = await tx.investigation.findUnique({
      where: { id: data.investigationId, orgId },
      select: { id: true, complaintId: true, status: true },
    });

    if (!investigation) {
      throw new Error("Investigation not found or insufficient permissions.");
    }

    const existingSummary = await tx.investigationSummary.findUnique({
      where: { investigationId: data.investigationId },
    });

    const now = new Date();

    // 2. Lock & stamp the InvestigationSummary record
    const summaryPayload = {
      orgId,
      investigationId: data.investigationId,
      summary: data.summary,
      report: data.report,
      capaRequired: data.capaRequired,
      capaRef: data.capaRequired ? data.capaRef : null,
      fscaRequired: data.fscaRequired,
      fscaRef: data.fscaRequired ? data.fscaRef : null,
      capaFscaRationale: data.capaFscaRationale,
      reportabilityReviewRequired: data.reportabilityReviewRequired,
      notes: data.notes,
      completedById: userId,
      completedAt: now,
    };

    const summary = await tx.investigationSummary.upsert({
      where: { investigationId: data.investigationId },
      create: summaryPayload,
      update: summaryPayload,
    });

    // Update the parent Investigation status to COMPLETED and stamp summary fields
    await tx.investigation.update({
      where: { id: data.investigationId },
      data: {
        status: "COMPLETED",
        investigationSummaryCompletedById: userId,
        investigationSummaryCompletedAt: now,
      },
    });

    // 3. Conditional automated Vigilance Decision Tree creation
    let newVigilance = null;
    if (data.reportabilityReviewRequired) {
      newVigilance = await tx.vigilanceDecisionTree.create({
        data: {
          orgId,
          complaintId: investigation.complaintId,
          status: VigilanceStatus.PENDING,
          assessmentStage: VigilanceAssessmentStage.POST_INVESTIGATION,
          reportable: false,
        },
      });
    }

    // 4. Audit Trail for Investigation Summary sign & lock
    const summaryDiff = generateAuditDiff(
      existingSummary as unknown as Record<string, unknown>,
      summary as unknown as Record<string, unknown>
    );

    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "InvestigationSummary",
        entityId: summary.id,
        action: AuditAction.APPROVE_CLOSE,
        changedById: userId,
        previousData: existingSummary ? (existingSummary as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        newData: summary as unknown as Prisma.InputJsonValue,
        reason: "Signed and Locked Investigation Summary",
        fieldChanges: summaryDiff as unknown as Prisma.InputJsonValue,
        complaintId: investigation.complaintId,
      },
    });

    // 5. Audit Trail for automated Vigilance Decision Tree creation (if triggered)
    if (newVigilance) {
      await tx.auditLog.create({
        data: {
          orgId,
          entityType: "VigilanceDecisionTree",
          entityId: newVigilance.id,
          action: AuditAction.CREATE,
          changedById: userId,
          previousData: Prisma.JsonNull,
          newData: newVigilance as unknown as Prisma.InputJsonValue,
          reason: "Automated Post-Investigation Vigilance Assessment triggered by Investigation Summary completion",
          complaintId: investigation.complaintId,
        },
      });
    }

    revalidatePath(`/investigations/${data.investigationId}`);
    revalidatePath(`/complaints/${investigation.complaintId}/vigilance`);
    return {
      summary,
      newVigilance,
    };
  });
}
