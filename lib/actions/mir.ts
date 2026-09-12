"use server";

import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { InitialMIR, FinalMIR, AuditAction, Prisma, LockEntityType } from "@prisma/client";
import { assertRecordNotLocked } from "@/lib/actions/record-lock";
import { generateAuditDiff } from "@/utils/auditDiff";
import { revalidatePath } from "next/cache";

export async function updateInitialMIR(
  mirId: string,
  newData: Partial<InitialMIR>
) {
  const { userId, orgId } = await requireOrgAuth();

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.initialMIR.findUnique({
      where: { id: mirId, orgId },
    });

    if (!existing) {
      throw new Error("Initial MIR record not found or access denied.");
    }

    await assertRecordNotLocked(
      tx,
      orgId,
      LockEntityType.Vigilance,
      mirId,
      userId
    );

    const updated = await tx.initialMIR.update({
      where: { id: mirId, orgId },
      data: newData,
    });

    const fieldChanges = generateAuditDiff(
      existing as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    );

    if (fieldChanges.length > 0) {
      await tx.auditLog.create({
        data: {
          orgId,
          entityType: "InitialMIR",
          entityId: mirId,
          action: AuditAction.UPDATE,
          changedById: userId,
          previousData: existing as unknown as Prisma.InputJsonValue,
          newData: updated as unknown as Prisma.InputJsonValue,
          reason: "Updated Initial MIR report",
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

export async function updateFinalMIR(
  mirId: string,
  newData: Partial<FinalMIR>
) {
  const { userId, orgId } = await requireOrgAuth();

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.finalMIR.findUnique({
      where: { id: mirId, orgId },
    });

    if (!existing) {
      throw new Error("Final MIR record not found or access denied.");
    }

    await assertRecordNotLocked(
      tx,
      orgId,
      LockEntityType.Vigilance,
      mirId,
      userId
    );

    const updated = await tx.finalMIR.update({
      where: { id: mirId, orgId },
      data: newData,
    });

    const fieldChanges = generateAuditDiff(
      existing as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    );

    if (fieldChanges.length > 0) {
      await tx.auditLog.create({
        data: {
          orgId,
          entityType: "FinalMIR",
          entityId: mirId,
          action: AuditAction.UPDATE,
          changedById: userId,
          previousData: existing as unknown as Prisma.InputJsonValue,
          newData: updated as unknown as Prisma.InputJsonValue,
          reason: "Updated Final MIR report",
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
