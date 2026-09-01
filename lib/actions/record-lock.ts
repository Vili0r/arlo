"use server";

import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { LockEntityType } from "@prisma/client";

// Lock duration settings
const LOCK_TTL_SECONDS = 120; // 2 minutes auto-expiry window

export interface LockUserSummary {
  id: string;
  name: string;
  email: string;
  imageUrl?: string | null;
}

export interface LockResult {
  success: boolean;
  isLockedByMe: boolean;
  lockedBy?: LockUserSummary;
  expiresAt?: string;
  message?: string;
}

/**
 * Atomically acquires or extends a lock for a specific record.
 */
export async function acquireRecordLock(
  entityType: LockEntityType,
  recordId: string
): Promise<LockResult> {
  const { userId, orgId } = await requireOrgAuth();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_TTL_SECONDS * 1000);

  return await prisma.$transaction(async (tx) => {
    // 0. Clean up any expired locks for this record (prevents stale row conflicts)
    await tx.recordLock.deleteMany({
      where: {
        orgId,
        entityType,
        recordId,
        expiresAt: { lte: now },
      },
    });

    // 1. Check for existing lock on this entity instance
    const existingLock = await tx.recordLock.findUnique({
      where: {
        org_entity_record_lock_unique: {
          orgId,
          entityType,
          recordId,
        },
      },
      include: {
        lockedBy: {
          select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true },
        },
      },
    });

    // 2. Lock exists and is actively held by someone else
    if (existingLock && existingLock.expiresAt > now && existingLock.lockedById !== userId) {
      const holderName = [existingLock.lockedBy.firstName, existingLock.lockedBy.lastName]
        .filter(Boolean)
        .join(" ") || existingLock.lockedBy.email;

      return {
        success: false,
        isLockedByMe: false,
        lockedBy: {
          id: existingLock.lockedBy.id,
          name: holderName,
          email: existingLock.lockedBy.email,
          imageUrl: existingLock.lockedBy.imageUrl,
        },
        expiresAt: existingLock.expiresAt.toISOString(),
        message: `This ${entityType.toLowerCase()} is currently being edited by ${holderName}.`,
      };
    }

    // 3. Acquire or overwrite (if expired or held by same user)
    const lock = await tx.recordLock.upsert({
      where: {
        org_entity_record_lock_unique: {
          orgId,
          entityType,
          recordId,
        },
      },
      create: {
        orgId,
        entityType,
        recordId,
        lockedById: userId,
        lockedAt: now,
        expiresAt,
      },
      update: {
        lockedById: userId,
        lockedAt: now,
        expiresAt,
      },
    });

    return {
      success: true,
      isLockedByMe: true,
      expiresAt: lock.expiresAt.toISOString(),
    };
  });
}

/**
 * Heartbeat action to refresh lock expiry while the user is actively working.
 */
export async function refreshRecordLock(
  entityType: LockEntityType,
  recordId: string
): Promise<LockResult> {
  const { userId, orgId } = await requireOrgAuth();
  const now = new Date();
  const newExpiresAt = new Date(now.getTime() + LOCK_TTL_SECONDS * 1000);

  // Update only if this specific user still holds the lock
  const updateResult = await prisma.recordLock.updateMany({
    where: {
      orgId,
      entityType,
      recordId,
      lockedById: userId,
    },
    data: {
      expiresAt: newExpiresAt,
    },
  });

  if (updateResult.count === 0) {
    // Lock was lost / expired and acquired by someone else; attempt to inspect/acquire
    return acquireRecordLock(entityType, recordId);
  }

  return {
    success: true,
    isLockedByMe: true,
    expiresAt: newExpiresAt.toISOString(),
  };
}

/**
 * Explicitly releases the lock on component unmount or navigation.
 */
export async function releaseRecordLock(
  entityType: LockEntityType,
  recordId: string
): Promise<{ success: boolean }> {
  const { userId, orgId } = await requireOrgAuth();

  await prisma.recordLock.deleteMany({
    where: {
      orgId,
      entityType,
      recordId,
      lockedById: userId, // Only the holder can release
    },
  });

  return { success: true };
}

/**
 * Asserts that a record is not actively locked by another user.
 * Throws an informative error if a concurrent edit lock is held by someone else.
 */
export async function assertRecordNotLocked(
  tx: any,
  orgId: string,
  entityType: LockEntityType,
  recordId: string,
  userId: string
): Promise<void> {
  if (!tx?.recordLock?.findUnique) {
    return;
  }

  const now = new Date();
  const activeLock = await tx.recordLock.findUnique({
    where: {
      org_entity_record_lock_unique: {
        orgId,
        entityType,
        recordId,
      },
    },
    include: {
      lockedBy: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });

  if (activeLock && activeLock.expiresAt > now && activeLock.lockedById !== userId) {
    const holderName =
      [activeLock.lockedBy?.firstName, activeLock.lockedBy?.lastName]
        .filter(Boolean)
        .join(" ") || activeLock.lockedBy?.email || "another user";
    throw new Error(
      `Cannot update ${entityType.toLowerCase()}: Record is currently locked and being edited by ${holderName}.`
    );
  }
}

