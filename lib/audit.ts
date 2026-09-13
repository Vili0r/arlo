import { prisma } from "@/lib/prisma";
import { AuditAction, Prisma } from "@prisma/client";

export interface CreateAuditLogParams {
  orgId: string;
  entityType:
    | "Complaint"
    | "Capa"
    | "User"
    | "Organization"
    | "OrganizationMember"
    | "Investigation"
    | "VigilanceDecisionTree"
    | "CustomerCommunication"
    | "SampleManagement"
    | "InvestigationSummary"
    | (string & {});
  entityId: string;
  action: AuditAction;
  changedById: string;
  previousData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  reason?: string;
  /** Granular custom field diff from generateJsonDiff — Array<AuditFieldChange> */
  fieldChanges?: Record<string, unknown>[] | null;
  complaintId?: string;
  capaId?: string;
  signerName?: string | null;
  signerEmail?: string | null;
  signerRole?: string | null;
  organizationName?: string | null;
  signatureMeaning?: string | null;
  recordVersion?: string | null;
}

/**
 * Creates an immutable, append-only AuditLog record in PostgreSQL
 * satisfying FDA 21 CFR Part 11 electronic records requirement.
 */
export async function createAuditLog({
  orgId,
  entityType,
  entityId,
  action,
  changedById,
  previousData,
  newData,
  reason,
  fieldChanges,
  complaintId,
  capaId,
  signerName,
  signerEmail,
  signerRole,
  organizationName,
  signatureMeaning,
  recordVersion,
}: CreateAuditLogParams) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        orgId,
        entityType,
        entityId,
        action,
        changedById,
        previousData: previousData
          ? (previousData as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        newData: newData
          ? (newData as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        reason: reason ?? null,
        fieldChanges: fieldChanges
          ? (fieldChanges as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        complaintId: complaintId ?? null,
        capaId: capaId ?? null,
        signerName: signerName ?? null,
        signerEmail: signerEmail ?? null,
        signerRole: signerRole ?? null,
        organizationName: organizationName ?? null,
        signatureMeaning: signatureMeaning ?? null,
        recordVersion: recordVersion ?? null,
      },
    });

    return log;
  } catch (error) {
    console.error(
      `[AUDIT_LOG_ERROR] Failed to record audit trail for ${entityType}:${entityId}`,
      error
    );
    throw error;
  }
}
