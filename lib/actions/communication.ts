"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgAuth, PERMISSIONS } from "@/lib/auth-guard";
import { generateAuditDiff } from "@/utils/auditDiff";
import { revalidatePath } from "next/cache";
import {
  CommunicationStatus,
  CommunicationDirection,
  AuditAction,
  Prisma,
} from "@prisma/client";
import type { AttachmentInput } from "@/lib/actions/complaints";

export interface UpdateCustomerCommunicationInput {
  communicationId: string;
  status?: CommunicationStatus;
  questionAsked?: string | null;
  customerResponse?: string | null;
  internalNotes?: string | null;
  direction?: CommunicationDirection;
  communicationDate?: Date | string;
  newAttachments?: AttachmentInput[];
  reason?: string;
}

/**
 * Server Action: updateCustomerCommunication
 *
 * Updates a CustomerCommunication record, handles newly uploaded attachments,
 * executes 21 CFR Part 11 JSON diffing via generateAuditDiff, and creates an
 * immutable AuditLog entry with entityType="CustomerCommunication".
 */
export async function updateCustomerCommunication(
  data: UpdateCustomerCommunicationInput
) {
  const { userId, orgId } = await requireOrgAuth(PERMISSIONS.COMPLAINTS_CREATE);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch existing record to establish baseline for diffing
    const existing = await tx.customerCommunication.findUnique({
      where: {
        id: data.communicationId,
        orgId,
      },
      include: {
        attachments: true,
        author: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!existing) {
      throw new Error("Customer communication record not found or access denied.");
    }

    // 2. Attach any new files directly to this communication record
    if (data.newAttachments && data.newAttachments.length > 0) {
      await tx.attachment.createMany({
        data: data.newAttachments.map((att) => ({
          orgId,
          complaintId: existing.complaintId,
          communicationId: existing.id,
          fileUrl: att.fileUrl,
          fileName: att.fileName,
          fileSize: att.fileSize ?? null,
          mimeType: att.mimeType ?? null,
          uploadedById: userId,
        })),
      });
    }

    // 3. Update communication fields
    await tx.customerCommunication.update({
      where: {
        id: data.communicationId,
        orgId,
      },
      data: {
        status: data.status ?? existing.status,
        questionAsked:
          data.questionAsked !== undefined
            ? data.questionAsked
            : existing.questionAsked,
        customerResponse:
          data.customerResponse !== undefined
            ? data.customerResponse
            : existing.customerResponse,
        internalNotes:
          data.internalNotes !== undefined
            ? data.internalNotes
            : existing.internalNotes,
        direction: data.direction ?? existing.direction,
        communicationDate: data.communicationDate
          ? new Date(data.communicationDate)
          : existing.communicationDate,
      },
    });

    // 4. Fetch the fresh updated record for audit comparison
    const fullyUpdated = await tx.customerCommunication.findUnique({
      where: {
        id: data.communicationId,
        orgId,
      },
      include: {
        attachments: true,
        author: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!fullyUpdated) {
      throw new Error("Failed to retrieve updated communication record.");
    }

    // 5. Generate granular audit diff using established generateAuditDiff utility
    const fieldChanges = generateAuditDiff(
      existing as unknown as Record<string, unknown>,
      fullyUpdated as unknown as Record<string, unknown>
    );

    const isStatusChange =
      data.status !== undefined && data.status !== existing.status;
    const auditAction = isStatusChange
      ? AuditAction.STATUS_CHANGE
      : AuditAction.UPDATE;

    const actionReason =
      data.reason ||
      (isStatusChange
        ? `Communication status updated from ${existing.status} to ${fullyUpdated.status}`
        : `Updated customer communication record`);

    // 6. Create immutable AuditLog entry for CustomerCommunication
    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "CustomerCommunication",
        entityId: data.communicationId,
        action: auditAction,
        changedById: userId,
        previousData: existing as unknown as Prisma.InputJsonValue,
        newData: fullyUpdated as unknown as Prisma.InputJsonValue,
        reason: actionReason,
        fieldChanges: fieldChanges as unknown as Prisma.InputJsonValue,
        complaintId: existing.complaintId,
      },
    });

    return fullyUpdated;
  });

  revalidatePath("/[orgSlug]/complaints", "page");
  return result;
}
