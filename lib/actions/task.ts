"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgAuth } from "@/lib/auth-guard";
import { generateAuditDiff } from "@/utils/auditDiff";
import { revalidatePath } from "next/cache";
import {
  TaskStatus,
  TaskType,
  TaskSubType,
  AuditAction,
  Prisma,
  LockEntityType,
} from "@prisma/client";
import { assertRecordNotLocked } from "@/lib/actions/record-lock";
import type { AttachmentInput } from "@/lib/actions/complaints";

export interface CreateComplaintTaskInput {
  orgSlug: string;
  complaintId: string;
  shortDescription: string;
  taskDescription?: string | null;
  taskType: TaskType;
  taskSubType?: TaskSubType | null;
  assignedToId?: string | null;
  dateDue?: Date | string | null;
  status?: TaskStatus;
  attachments?: AttachmentInput[];
}

export interface UpdateComplaintTaskInput {
  id: string;
  orgSlug: string;
  shortDescription?: string;
  taskDescription?: string | null;
  taskType?: TaskType;
  taskSubType?: TaskSubType | null;
  assignedToId?: string | null;
  dateDue?: Date | string | null;
  status?: TaskStatus;
  newAttachments?: AttachmentInput[];
  reason?: string;
}

/**
 * Server Action: createComplaintTask
 *
 * Creates an ad-hoc ComplaintTask record, attaches uploaded files,
 * and records an immutable 21 CFR Part 11 AuditLog entry.
 */
export async function createComplaintTask(data: CreateComplaintTaskInput) {
  const { userId, orgId } = await requireOrgAuth();

  if (!data.complaintId || !data.shortDescription || !data.taskType) {
    throw new Error("Missing required fields for task creation.");
  }

  if (data.taskType === TaskType.INTERNAL_FOLLOW_UP && !data.taskSubType) {
    throw new Error("Sub-Type is required when Task Type is Internal Follow-up.");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Verify complaint exists for this tenant
    const complaint = await tx.complaint.findUnique({
      where: { id: data.complaintId, orgId, deletedAt: null },
    });

    if (!complaint) {
      throw new Error("Complaint not found or access denied.");
    }

    // Create ComplaintTask
    const task = await tx.complaintTask.create({
      data: {
        orgId,
        complaintId: data.complaintId,
        shortDescription: data.shortDescription,
        taskDescription: data.taskDescription || null,
        taskType: data.taskType,
        taskSubType: data.taskType === TaskType.INTERNAL_FOLLOW_UP ? data.taskSubType : null,
        status: data.status || TaskStatus.OPEN,
        assignedToId: data.assignedToId || null,
        originatorId: userId,
        dateOfRequest: new Date(),
        dateDue: data.dateDue ? new Date(data.dateDue) : null,
        ...(data.attachments && data.attachments.length > 0 && {
          attachments: {
            create: data.attachments.map((att) => ({
              orgId,
              complaintId: data.complaintId,
              fileUrl: att.fileUrl,
              fileName: att.fileName,
              fileSize: att.fileSize ?? null,
              mimeType: att.mimeType ?? null,
              uploadedById: userId,
            })),
          },
        }),
      },
      include: {
        attachments: true,
        originator: {
          select: { email: true, firstName: true, lastName: true },
        },
        assignedTo: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    });

    // Create 21 CFR Part 11 AuditLog
    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "ComplaintTask",
        entityId: task.id,
        action: AuditAction.CREATE,
        changedById: userId,
        newData: task as unknown as Prisma.InputJsonValue,
        reason: `Created complaint task: ${task.shortDescription}`,
        complaintId: data.complaintId,
      },
    });

    return task;
  });

  revalidatePath(`/${data.orgSlug}/complaints/${data.complaintId}`);
  revalidatePath(`/${data.orgSlug}/complaints`);
  return result;
}

/**
 * Server Action: updateComplaintTask
 *
 * Updates an ad-hoc ComplaintTask record, handles new attachments,
 * computes granular field differences using generateAuditDiff,
 * and creates an immutable AuditLog entry with entityType="ComplaintTask".
 */
export async function updateComplaintTask(data: UpdateComplaintTaskInput) {
  const { userId, orgId } = await requireOrgAuth();

  if (!data.id) {
    throw new Error("Task ID is required.");
  }

  if (data.taskType === TaskType.INTERNAL_FOLLOW_UP && !data.taskSubType) {
    throw new Error("Sub-Type is required when Task Type is Internal Follow-up.");
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch existing task baseline
    const existing = await tx.complaintTask.findUnique({
      where: { id: data.id, orgId },
      include: {
        attachments: true,
        originator: {
          select: { email: true, firstName: true, lastName: true },
        },
        assignedTo: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!existing) {
      throw new Error("Complaint task not found or access denied.");
    }

    // Concurrency Lock Check: Ensure record is not actively locked by another user
    await assertRecordNotLocked(
      tx,
      orgId,
      LockEntityType.Task,
      data.id,
      userId
    );

    // 2. Attach any new files directly to this task
    if (data.newAttachments && data.newAttachments.length > 0) {
      await tx.attachment.createMany({
        data: data.newAttachments.map((att) => ({
          orgId,
          complaintId: existing.complaintId,
          taskId: existing.id,
          fileUrl: att.fileUrl,
          fileName: att.fileName,
          fileSize: att.fileSize ?? null,
          mimeType: att.mimeType ?? null,
          uploadedById: userId,
        })),
      });
    }

    // 3. Update task
    const nextTaskType = data.taskType ?? existing.taskType;
    const nextTaskSubType =
      nextTaskType === TaskType.INTERNAL_FOLLOW_UP
        ? (data.taskSubType !== undefined ? data.taskSubType : existing.taskSubType)
        : null;

    await tx.complaintTask.update({
      where: { id: data.id, orgId },
      data: {
        shortDescription: data.shortDescription ?? existing.shortDescription,
        taskDescription:
          data.taskDescription !== undefined
            ? data.taskDescription
            : existing.taskDescription,
        taskType: nextTaskType,
        taskSubType: nextTaskSubType,
        status: data.status ?? existing.status,
        assignedToId:
          data.assignedToId !== undefined
            ? data.assignedToId || null
            : existing.assignedToId,
        dateDue:
          data.dateDue !== undefined
            ? data.dateDue
              ? new Date(data.dateDue)
              : null
            : existing.dateDue,
      },
    });

    // 4. Fetch updated task for audit diffing
    const fullyUpdated = await tx.complaintTask.findUnique({
      where: { id: data.id, orgId },
      include: {
        attachments: true,
        originator: {
          select: { email: true, firstName: true, lastName: true },
        },
        assignedTo: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!fullyUpdated) {
      throw new Error("Failed to retrieve updated complaint task.");
    }

    // 5. Generate granular audit diff using generateAuditDiff
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
        ? `Task status updated from ${existing.status} to ${fullyUpdated.status}`
        : `Updated complaint task: ${fullyUpdated.shortDescription}`);

    // 6. Create immutable AuditLog entry with entityType: "ComplaintTask"
    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "ComplaintTask",
        entityId: data.id,
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

  if (data.orgSlug) {
    revalidatePath(`/${data.orgSlug}/complaints/${result.complaintId}/tasks/${result.id}`);
    revalidatePath(`/${data.orgSlug}/complaints/${result.complaintId}`);
    revalidatePath(`/${data.orgSlug}/complaints`);
  }
  return result;
}
