"use server";

import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AuditAction, Prisma, LockEntityType } from "@prisma/client";
import { assertRecordNotLocked } from "@/lib/actions/record-lock";
import { revalidatePath } from "next/cache";
import { generateAuditDiff } from "@/utils/auditDiff";

export async function updateVigilance(data: any) {
  const { orgId, userId } = await requireOrgAuth();

  if (!data.orgSlug || !data.id) {
    throw new Error("Missing orgSlug or vigilance ID");
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.vigilanceDecisionTree.findUnique({
      where: { id: data.id, orgId },
      include: { attachments: true },
    });

    if (!existing) {
      throw new Error("Vigilance record not found or insufficient permissions.");
    }

    // Concurrency Lock Check: Ensure record is not actively locked by another user
    await assertRecordNotLocked(
      tx,
      orgId,
      LockEntityType.Vigilance,
      data.id,
      userId
    );

    const updated = await tx.vigilanceDecisionTree.update({
      where: { id: data.id, orgId },
      data: {
        status: data.status,
        reportable: data.reportable,
        ownerId: data.ownerId || null,
        approverId: data.approverId || null,
        targetRegion: data.targetRegion || null,
        decision: data.decision || null,
        reportType: data.reportType || null,
        awarenessDate: data.awarenessDate ? new Date(data.awarenessDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        rationale: data.rationale || null,
        cancelledRationale: data.cancelledRationale || null,
        notes: data.notes || null,
        ...(data.newAttachments && data.newAttachments.length > 0 && {
          attachments: {
            create: data.newAttachments.map((a: any) => ({
              fileUrl: a.fileUrl,
              fileName: a.fileName,
              fileSize: a.fileSize,
              mimeType: a.mimeType,
              uploadedById: userId,
              orgId: orgId,
              complaintId: existing.complaintId,
            })),
          },
        }),
      },
      include: { attachments: true },
    });

    const fieldChanges = generateAuditDiff(
      existing as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    );

    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "VigilanceDecisionTree",
        entityId: data.id,
        action: AuditAction.UPDATE,
        changedById: userId,
        previousData: existing as unknown as Prisma.InputJsonValue,
        newData: updated as unknown as Prisma.InputJsonValue,
        reason: `Updated vigilance decision tree assessment`,
        fieldChanges: fieldChanges as unknown as Prisma.InputJsonValue,
        complaintId: existing.complaintId,
      },
    });

    return updated;
  });

  revalidatePath(`/${data.orgSlug}/complaints/${result.complaintId}/vigilance`);
  return result;
}

