'use server';

import { auth } from '@clerk/nextjs/server';
import { PrismaClient, Complaint } from '@prisma/client';
import { generateAuditDiff } from '../../utils/auditDiff';

const prisma = new PrismaClient();

export async function updateComplaint(
  complaintId: string,
  newData: Partial<Complaint>,
  reasonForChange?: string
) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    throw new Error('Unauthorized');
  }

  // 1. Query the existing record from the database
  const oldRecord = await prisma.complaint.findUnique({
    where: { id: complaintId, orgId },
  });

  if (!oldRecord) {
    throw new Error('Complaint not found');
  }

  // Generate a composite new record for the diffing engine
  const proposedRecord = { ...oldRecord, ...newData };

  // 2. Execute generateAuditDiff
  const fieldChanges = generateAuditDiff(oldRecord, proposedRecord);

  // If there are no changes, just return the old record
  if (fieldChanges.length === 0) {
    return oldRecord;
  }

  // 3. Execute a Prisma $transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update the record
    const updatedRecord = await tx.complaint.update({
      where: { id: complaintId, orgId },
      data: newData,
    });

    // Create the AuditLog row
    await tx.auditLog.create({
      data: {
        orgId,
        entityType: 'Complaint',
        entityId: complaintId,
        action: 'UPDATE',
        previousData: oldRecord as any,
        newData: updatedRecord as any,
        reason: reasonForChange,
        fieldChanges: fieldChanges as any,
        changedById: userId,
        complaintId: complaintId,
      },
    });

    return updatedRecord;
  });

  return result;
}

// NOTE: The `executeStatusChange` function has been removed from this file.
// Status transitions now go through `lib/actions/esignature.ts` which enforces
// 21 CFR Part 11 electronic signature (password re-authentication) before
// executing any status change.
