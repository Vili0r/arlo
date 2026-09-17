"use server";

import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { MIR, AuditAction, Prisma, LockEntityType } from "@prisma/client";
import { assertRecordNotLocked } from "@/lib/actions/record-lock";
import { generateAuditDiff } from "@/utils/auditDiff";
import { revalidatePath } from "next/cache";

export async function updateMIR(
  mirId: string,
  newData: Prisma.MIRUpdateInput,
  reason?: string,
  entityType?: "InitialMIR" | "FinalMIR" | "MIR"
) {
  const { userId, orgId } = await requireOrgAuth();

  const result = await prisma.$transaction(async (tx: any) => {
    // Support unified mIR delegate or legacy initialMIR / finalMIR delegates
    const mirDelegate =
      tx.mIR ||
      (entityType === "InitialMIR" ? tx.initialMIR : entityType === "FinalMIR" ? tx.finalMIR : undefined) ||
      tx.mIR ||
      tx.initialMIR;

    const existing = mirDelegate?.findUnique
      ? await mirDelegate.findUnique({ where: { id: mirId, orgId } })
      : await (tx.initialMIR?.findUnique({ where: { id: mirId, orgId } }) || tx.finalMIR?.findUnique({ where: { id: mirId, orgId } }));

    if (!existing) {
      throw new Error(
        entityType === "InitialMIR"
          ? "Initial MIR record not found or access denied."
          : entityType === "FinalMIR"
          ? "Final MIR record not found or access denied."
          : "MIR record not found or access denied."
      );
    }

    await assertRecordNotLocked(
      tx,
      orgId,
      LockEntityType.Vigilance,
      mirId,
      userId
    );

    const { attachments, attachment, ...mirFields } = newData as any;

    if (attachments && Array.isArray(attachments)) {
      const existingAttachments = await tx.attachment.findMany({
        where: { mirId, orgId },
      });
      const existingUrls = new Set(existingAttachments.map((a: any) => a.fileUrl));
      const incomingUrls = new Set(attachments.map((a: any) => a.fileUrl));

      const toDelete = existingAttachments.filter((a: any) => !incomingUrls.has(a.fileUrl));
      if (toDelete.length > 0) {
        await tx.attachment.deleteMany({
          where: { id: { in: toDelete.map((a: any) => a.id) } },
        });
      }

      const toAdd = attachments.filter((a: any) => a.fileUrl && !existingUrls.has(a.fileUrl));
      if (toAdd.length > 0) {
        await tx.attachment.createMany({
          data: toAdd.map((a: any) => ({
            orgId,
            complaintId: existing.complaintId,
            mirId,
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            fileSize: a.fileSize || null,
            mimeType: a.mimeType || null,
            uploadedById: userId,
          })),
        });
      }
    }

    const updated = await mirDelegate.update({
      where: { id: mirId, orgId },
      data: mirFields,
    });

    const fieldChanges = generateAuditDiff(
      existing as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    );

    if (fieldChanges.length > 0) {
      await tx.auditLog.create({
        data: {
          orgId,
          entityType: entityType || "MIR",
          entityId: mirId,
          action: AuditAction.UPDATE,
          changedById: userId,
          previousData: existing as unknown as Prisma.InputJsonValue,
          newData: updated as unknown as Prisma.InputJsonValue,
          reason: reason || "Updated MIR report",
          fieldChanges: fieldChanges as unknown as Prisma.InputJsonValue,
          complaintId: existing.complaintId,
        },
      });
    }

    return updated;
  });

  revalidatePath("/", "layout");
  return result;
}

export async function updateInitialMIR(
  mirId: string,
  newData: Prisma.MIRUpdateInput,
  reason?: string
) {
  return updateMIR(mirId, newData, reason || "Updated Initial MIR report", "InitialMIR");
}

export async function updateFinalMIR(
  mirId: string,
  newData: Prisma.MIRUpdateInput,
  reason?: string
) {
  return updateMIR(mirId, newData, reason || "Updated Final MIR report", "FinalMIR");
}

