"use server";

import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  MIR,
  AuditAction,
  Prisma,
  LockEntityType,
  MIRClassification,
  MIRReportType,
  MIRStatus,
} from "@prisma/client";
import { assertRecordNotLocked } from "@/lib/actions/record-lock";
import { generateAuditDiff } from "@/utils/auditDiff";
import { revalidatePath } from "next/cache";

const MIR_DATE_FIELDS = new Set([
  "submissionDate",
  "dueDate",
  "investigationStartDate",
  "reportDate",
  "adverseEventDateFrom",
  "adverseEventDateTo",
  "mfrAwarenessDate",
  "mfrAwarenessReportDate",
  "reportNextDate",
  "expectedDayOfNextReport",
  "deviceMfrDate",
  "dateLotReleased",
  "deviceExpiryDate",
  "expiryDate",
  "implantedDateFrom",
  "dateOfImplantFrom",
  "implantedDateTo",
  "dateOfImplantTo",
  "explantedDateFrom",
  "dateOfExplantFrom",
  "explantedDateTo",
  "dateOfExplantTo",
  "deviceMarketDate",
  "sCreateTimeStamp",
]);

const MIR_INT_FIELDS = new Set([
  "numYears",
  "numMonths",
  "numDays",
  "numPatientsInvolved",
  "patientAgeYears",
  "patientAgeMonths",
  "patientAgeDays",
]);

const MIR_FLOAT_FIELDS = new Set(["massKG", "heightCM"]);

const MIR_FK_FIELDS = new Set(["preparedById", "reviewedById", "approvedById"]);

const REQUIRED_BOOLEANS = new Set([
  "investigationStarted",
  "incidentConfirmed",
  "deviceContributionConfirmed",
]);

const MIR_BOOLEAN_FIELDS = new Set([
  "investigationStarted",
  "incidentConfirmed",
  "deviceContributionConfirmed",
  "pmcfpmpfQuestion",
  "appLegislationUnknown",
  "deviceClass",
  "devicePlacedMarket",
  "devicePlacedOnMarket",
  "deviceFulfill",
  "distributionEEA",
  "distributionAll",
  "suspicionRelationship",
  "rootCauseConfirmed",
  "riskAssReviewed",
  "riskAssAdequate",
]);

const VALID_CLASSIFICATIONS = new Set(Object.values(MIRClassification));
const VALID_REPORT_TYPES = new Set(Object.values(MIRReportType));
const VALID_STATUSES = new Set(Object.values(MIRStatus));

function sanitizeMIRFields(raw: Record<string, any>): Record<string, any> {
  const allowed = new Set(Object.values(Prisma.MIRScalarFieldEnum));
  const immutable = new Set(["id", "orgId", "complaintId", "createdAt", "updatedAt"]);

  // Merge alias fields if canonical is empty
  const source = { ...raw };
  if (!source.implantFacilityName && source.implantFacitlityName) {
    source.implantFacilityName = source.implantFacitlityName;
  }
  if (!source.notifiedBodyCerNoOfDevice && source.notifiedBodyCertNo) {
    source.notifiedBodyCerNoOfDevice = source.notifiedBodyCertNo;
  }
  if (!source.cidCapaForLateReportable && source.cidCapaLateReportable) {
    source.cidCapaForLateReportable = source.cidCapaLateReportable;
  }
  if (!source.authorizedRepresentativeContact && source.arContact) {
    source.authorizedRepresentativeContact = source.arContact;
  }

  const cleaned: Record<string, any> = {};

  for (const [key, val] of Object.entries(source)) {
    if (!allowed.has(key as any) || immutable.has(key)) {
      continue;
    }

    if (key === "eventClassification") {
      cleaned[key] =
        val && VALID_CLASSIFICATIONS.has(val as MIRClassification) ? val : null;
      continue;
    }

    if (key === "reportType") {
      if (val && VALID_REPORT_TYPES.has(val as MIRReportType)) {
        cleaned[key] = val;
      }
      continue;
    }

    if (key === "status") {
      if (val && VALID_STATUSES.has(val as MIRStatus)) {
        cleaned[key] = val;
      }
      continue;
    }

    if (MIR_FK_FIELDS.has(key)) {
      cleaned[key] = val ? String(val) : null;
      continue;
    }

    if (MIR_DATE_FIELDS.has(key)) {
      if (val === "" || val === null || val === undefined) {
        cleaned[key] = null;
      } else {
        const d = val instanceof Date ? val : new Date(val);
        cleaned[key] = isNaN(d.getTime()) ? null : d;
      }
      continue;
    }

    if (MIR_INT_FIELDS.has(key)) {
      if (val === "" || val === null || val === undefined) {
        cleaned[key] = null;
      } else {
        const n = parseInt(String(val), 10);
        cleaned[key] = isNaN(n) ? null : n;
      }
      continue;
    }

    if (MIR_FLOAT_FIELDS.has(key)) {
      if (val === "" || val === null || val === undefined) {
        cleaned[key] = null;
      } else {
        const n = parseFloat(String(val));
        cleaned[key] = isNaN(n) ? null : n;
      }
      continue;
    }

    if (MIR_BOOLEAN_FIELDS.has(key)) {
      if (val === "" || val === null || val === undefined) {
        cleaned[key] = REQUIRED_BOOLEANS.has(key) ? false : null;
      } else if (typeof val === "boolean") {
        cleaned[key] = val;
      } else if (val === "true") {
        cleaned[key] = true;
      } else if (val === "false") {
        cleaned[key] = false;
      } else {
        cleaned[key] = Boolean(val);
      }
      continue;
    }

    cleaned[key] = val;
  }

  return cleaned;
}

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

    const { attachments, attachment, ...rawFields } = newData as any;

    if (attachments && Array.isArray(attachments)) {
      try {
        const existingAttachments = await tx.attachment.findMany({
          where: { mirId, orgId } as any,
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
      } catch (attErr) {
        console.warn("[MIR updateAttachments warning]", attErr);
      }
    }

    const mirFields = sanitizeMIRFields(rawFields);

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

