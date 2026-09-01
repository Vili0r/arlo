"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgAuth, PERMISSIONS } from "@/lib/auth-guard";
import { generateJsonDiff } from "@/lib/json-diff";
import { generateAuditDiff } from "@/utils/auditDiff";
import { revalidatePath } from "next/cache";
import type { FormSchemaDefinition } from "@/lib/types/form-template.types";
import {
  Priority,
  ComplaintStatus,
  Death,
  CommunicationStatus,
  SampleStatus,
  InvestigationStatus,
  VigilanceStatus,
  AuditAction,
  Prisma,
  LockEntityType,
} from "@prisma/client";
import { assertRecordNotLocked } from "@/lib/actions/record-lock";

// =============================================================================
// Input Types for Relational Complaint Creation
// =============================================================================

export interface ProductInformationInput {
  id?: string | null;
  occurrence?: string | null;
  materialNumber?: string | null;
  materialDescription?: string | null;
  serialNumber?: string | null;
  batchNumber?: string | null;
  udi?: string | null;
  asReportedCode1?: string | null; // IMDRF Annex A Code
  asReportedCode2?: string | null; // IMDRF Annex A Code
  softwareVersion?: string | null;
}

export interface PatientInformationInput {
  id?: string | null;
  patientImpact?: string | null;
  patientImpactDesc?: string | null;
  patientName?: string | null;
  sex?: string | null;
  age?: number | null;
  eventOccurred?: Date | string | null;
  annexE_Codes?: string[]; // IMDRF Annex E (Health Effects - Clinical Signs)
  annexF_Codes?: string[]; // IMDRF Annex F (Health Effects - Health Impact)
}

export interface AttachmentInput {
  fileUrl: string;
  fileName: string;
  fileSize?: number | null;
  mimeType?: string | null;
}

export interface CreateComplaintWithRelationsInput {
  // Core Complaint Mandatory & Configurable Fields
  shortDescription: string;
  description?: string;
  priority: Priority;
  awarenessDate: Date | string;
  dateReceived?: Date | string;
  regulatoryReportingReference?: string | null;
  customerName: string;
  customerType: string;
  initialReporterName: string;
  initialReporterSurname: string;
  email: string;
  address: string;
  country: string;
  telNumber: string;
  countryEventOccurred: string;
  region: string;
  death?: Death;
  detailDescriptionNativeLanguage?: string | null;
  customerResponseNeeded?: boolean;
  finalResponseCompletedOn?: Date | string | null;
  complaintOwnerId?: string; // Maps to Clerk User ID (defaults to active user)

  // Optional Device Legacy fields
  deviceModel?: string | null;
  deviceSerialNumber?: string | null;
  lotNumber?: string | null;
  isAdverseEvent?: boolean;

  // Dynamic Custom Fields (JSONB Template Pattern)
  customData?: Record<string, unknown>;
  formTemplateVersion?: number | null;

  // Nested Relational Payloads (1:N)
  products?: ProductInformationInput[];
  patients?: PatientInformationInput[];
  attachments?: AttachmentInput[];

  // Automated Workflow Flags
  investigationRequired?: boolean; // Default true: auto-creates Investigation
  initialCommunicationNotes?: string; // Optional custom initial communication note
}

/**
 * Server Action: createComplaintWithRelations
 *
 * Executes an atomic 21 CFR Part 11 compliant database transaction to:
 * 1. Create the Complaint record with nested Product & Patient records.
 * 2. Auto-generate an empty VigilanceDecisionTree record.
 * 3. Auto-generate an Investigation record (unless investigationRequired is false).
 * 4. Auto-generate an initial CustomerCommunication record (unless customerResponseNeeded is false).
 * 5. Create a single comprehensive AuditLog entry with JSON diffing for customData.
 */
export async function createComplaintWithRelations(
  data: CreateComplaintWithRelationsInput
) {
  const { userId, orgId } = await requireOrgAuth(PERMISSIONS.COMPLAINTS_CREATE);

  if (!data.shortDescription) {
    throw new Error("400 Bad Request: shortDescription is required.");
  }
  if (!data.priority) {
    throw new Error("400 Bad Request: priority is required.");
  }
  if (!data.awarenessDate) {
    throw new Error("400 Bad Request: awarenessDate is required.");
  }
  if (!data.customerName || !data.email) {
    throw new Error("400 Bad Request: Customer contact details are required.");
  }

  // Parse dates
  const awarenessDate = new Date(data.awarenessDate);
  const dateReceived = data.dateReceived ? new Date(data.dateReceived) : new Date();
  const finalResponseCompletedOn = data.finalResponseCompletedOn
    ? new Date(data.finalResponseCompletedOn)
    : null;

  const complaintOwnerId = data.complaintOwnerId || userId;
  const description = data.description || data.shortDescription;
  const customerResponseNeeded = data.customerResponseNeeded ?? true;
  const investigationRequired = data.investigationRequired ?? true;
  const deathStatus: Death = data.death ?? Death.NO;

  return await prisma.$transaction(async (tx) => {
    // 1. Generate sequential complaint identifier (CMP-YYYY-0001) scoped per calendar year for this tenant
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);

    const count = await tx.complaint.count({
      where: {
        orgId,
        createdAt: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
    });
    const complaintNumber = `CMP-${currentYear}-${String(count + 1).padStart(4, "0")}`;

    // 2. Create the Complaint and nested 1:N relations (ProductInformation & PatientInformation)
    const complaint = await tx.complaint.create({
      data: {
        orgId,
        complaintNumber,
        shortDescription: data.shortDescription,
        description,
        priority: data.priority,
        awarenessDate,
        dateReceived,
        regulatoryReportingReference: data.regulatoryReportingReference ?? null,
        customerName: data.customerName,
        customerType: data.customerType,
        initialReporterName: data.initialReporterName,
        initialReporterSurname: data.initialReporterSurname,
        email: data.email,
        address: data.address,
        country: data.country,
        telNumber: data.telNumber,
        countryEventOccurred: data.countryEventOccurred,
        region: data.region,
        death: deathStatus,
        detailDescriptionNativeLanguage: data.detailDescriptionNativeLanguage ?? null,
        customerResponseNeeded,
        finalResponseCompletedOn,
        complaintOwnerId,
        createdById: userId,
        status: "OPEN",
        deviceModel: data.deviceModel ?? null,
        deviceSerialNumber: data.deviceSerialNumber ?? null,
        lotNumber: data.lotNumber ?? null,
        isAdverseEvent: data.isAdverseEvent ?? false,
        customData: data.customData
          ? (data.customData as Prisma.InputJsonValue)
          : {},
        formTemplateVersion: data.formTemplateVersion ?? null,

        // Nested 1:N ProductInformation creation
        ...(data.products && data.products.length > 0
          ? {
              productInformation: {
                create: data.products.map((prod) => ({
                  orgId,
                  occurrence: prod.occurrence ?? null,
                  materialNumber: prod.materialNumber ?? null,
                  materialDescription: prod.materialDescription ?? null,
                  serialNumber: prod.serialNumber ?? null,
                  batchNumber: prod.batchNumber ?? null,
                  udi: prod.udi ?? null,
                  asReportedCode1: prod.asReportedCode1 ?? null,
                  asReportedCode2: prod.asReportedCode2 ?? null,
                  softwareVersion: prod.softwareVersion ?? null,
                })),
              },
            }
          : {}),

        // Nested 1:N PatientInformation creation
        ...(data.patients && data.patients.length > 0
          ? {
              patientInformation: {
                create: data.patients.map((pat) => ({
                  orgId,
                  patientImpact: pat.patientImpact ?? null,
                  patientImpactDesc: pat.patientImpactDesc ?? null,
                  patientName: pat.patientName ?? null,
                  sex: pat.sex ?? null,
                  age: pat.age !== undefined && pat.age !== null ? Number(pat.age) : null,
                  eventOccurred: pat.eventOccurred ? new Date(pat.eventOccurred) : null,
                  annexE_Codes: pat.annexE_Codes ?? [],
                  annexF_Codes: pat.annexF_Codes ?? [],
                })),
              },
            }
          : {}),

        // Nested 1:N Attachment creation
        ...(data.attachments && data.attachments.length > 0
          ? {
              attachments: {
                create: data.attachments.map((att) => ({
                  orgId,
                  fileUrl: att.fileUrl,
                  fileName: att.fileName,
                  fileSize: att.fileSize ?? null,
                  mimeType: att.mimeType ?? null,
                  uploadedById: userId,
                })),
              },
            }
          : {}),
      },
      include: {
        productInformation: true,
        patientInformation: true,
        attachments: {
          where: {
            investigationId: null,
            vigilanceId: null,
            communicationId: null,
            taskId: null,
          },
        },
      },
    });

    // 3. Auto-create empty VigilanceDecisionTree linked to the complaint
    const vigilanceDecisionTree = await tx.vigilanceDecisionTree.create({
      data: {
        orgId,
        complaintId: complaint.id,
        status: VigilanceStatus.PENDING,
        reportable: false,
        rationale: null,
      },
    });

    // 4. Auto-create empty Investigation linked to the complaint (unless explicitly disabled)
    let investigation = null;
    if (investigationRequired) {
      investigation = await tx.investigation.create({
        data: {
          orgId,
          complaintId: complaint.id,
          status: InvestigationStatus.NOT_STARTED,
          investigatorId: null,
        },
      });
    }

    // 5. Auto-create initial CustomerCommunication record (unless customerResponseNeeded is false)
    let customerCommunication = null;
    if (customerResponseNeeded) {
      customerCommunication = await tx.customerCommunication.create({
        data: {
          orgId,
          complaintId: complaint.id,
          communicationDate: new Date(),
          internalNotes:
            data.initialCommunicationNotes ||
            `Initial customer intake communication logged for ${data.customerName}.`,
          authorId: userId,
        },
      });
    }

    // 6. Compute granular custom field diff for 21 CFR Part 11 electronic audit trail
    let fieldChanges: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =
      Prisma.JsonNull;
    if (data.customData && Object.keys(data.customData).length > 0) {
      const template = await tx.formTemplate.findUnique({
        where: {
          orgId_entityType: {
            orgId,
            entityType: "Complaint",
          },
        },
      });
      const schemaDef =
        (template?.schemaDefinition as unknown as FormSchemaDefinition) || [];
      const diff = generateJsonDiff(null, data.customData, schemaDef);
      if (diff.length > 0) {
        fieldChanges = diff as unknown as Prisma.InputJsonValue;
      }
    }

    // 7. Create single comprehensive AuditLog entry detailing all linked creations
    const auditLog = await tx.auditLog.create({
      data: {
        orgId,
        entityType: "Complaint",
        entityId: complaint.id,
        action: AuditAction.CREATE,
        changedById: userId,
        previousData: Prisma.JsonNull,
        newData: {
          complaint: {
            id: complaint.id,
            complaintNumber: complaint.complaintNumber,
            shortDescription: complaint.shortDescription,
            priority: complaint.priority,
            status: complaint.status,
            awarenessDate: complaint.awarenessDate,
            dateReceived: complaint.dateReceived,
            customerName: complaint.customerName,
            customerType: complaint.customerType,
            initialReporter: `${complaint.initialReporterName} ${complaint.initialReporterSurname}`,
            email: complaint.email,
            telNumber: complaint.telNumber,
            country: complaint.country,
            countryEventOccurred: complaint.countryEventOccurred,
            region: complaint.region,
            death: complaint.death,
            customerResponseNeeded: complaint.customerResponseNeeded,
            complaintOwnerId: complaint.complaintOwnerId,
          },
          productsCount: complaint.productInformation.length,
          patientsCount: complaint.patientInformation.length,
          vigilanceDecisionTreeId: vigilanceDecisionTree.id,
          investigationId: investigation?.id ?? null,
          customerCommunicationId: customerCommunication?.id ?? null,
        } as Prisma.InputJsonValue,
        reason: `Initial complaint creation with relational entities (${complaintNumber})`,
        fieldChanges,
        complaintId: complaint.id,
      },
    });

    return {
      complaint,
      vigilanceDecisionTree,
      investigation,
      customerCommunication,
      auditLog,
    };
  });
}

export interface UpdateComplaintWithRelationsInput {
  complaintId: string;
  shortDescription: string;
  description?: string;
  priority: Priority;
  status?: ComplaintStatus;
  awarenessDate: Date | string;
  dateReceived?: Date | string;
  regulatoryReportingReference?: string | null;
  customerName: string;
  customerType: string;
  initialReporterName: string;
  initialReporterSurname: string;
  email: string;
  address: string;
  country: string;
  telNumber: string;
  countryEventOccurred: string;
  region: string;
  death?: Death;
  detailDescriptionNativeLanguage?: string | null;
  customerResponseNeeded?: boolean;
  finalResponseCompletedOn?: Date | string | null;
  complaintOwnerId?: string;

  deviceModel?: string | null;
  deviceSerialNumber?: string | null;
  lotNumber?: string | null;
  isAdverseEvent?: boolean;

  products?: ProductInformationInput[];
  patients?: PatientInformationInput[];
  newAttachments?: AttachmentInput[];
}

/**
 * Server Action: updateComplaintWithRelations
 * Updates a complaint's fields, products, patients, and logs an immutable audit event.
 */
export async function updateComplaintWithRelations(
  data: UpdateComplaintWithRelationsInput
) {
  const { userId, orgId } = await requireOrgAuth(PERMISSIONS.COMPLAINTS_CREATE);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.complaint.findUnique({
      where: { id: data.complaintId, orgId },
      include: {
        productInformation: true,
        patientInformation: true,
        attachments: {
          where: {
            investigationId: null,
            vigilanceId: null,
            communicationId: null,
            taskId: null,
          },
        },
      },
    });

    if (!existing) {
      throw new Error("Complaint not found or insufficient permissions.");
    }

    // Concurrency Lock Check: Ensure record is not actively locked by another user
    await assertRecordNotLocked(
      tx,
      orgId,
      LockEntityType.Complaint,
      data.complaintId,
      userId
    );

    const awarenessDate = new Date(data.awarenessDate);
    const dateReceived = data.dateReceived
      ? new Date(data.dateReceived)
      : existing.dateReceived;

    // Intelligent relational updates for products
    if (data.products !== undefined) {
      const incomingProductIds = new Set(
        data.products.map((p) => p.id).filter((id): id is string => Boolean(id))
      );
      const existingProductIds = new Set(existing.productInformation.map((p) => p.id));

      // 1. Delete products in DB missing from the incoming payload
      const productsToDelete = existing.productInformation.filter(
        (p) => !incomingProductIds.has(p.id)
      );
      if (productsToDelete.length > 0) {
        await tx.productInformation.deleteMany({
          where: {
            id: { in: productsToDelete.map((p) => p.id) },
            complaintId: data.complaintId,
          },
        });
      }

      // 2. Update existing items or create new ones
      for (const p of data.products) {
        if (p.id && existingProductIds.has(p.id)) {
          await tx.productInformation.update({
            where: { id: p.id },
            data: {
              occurrence: p.occurrence ?? null,
              materialNumber: p.materialNumber ?? null,
              materialDescription: p.materialDescription ?? null,
              serialNumber: p.serialNumber ?? null,
              batchNumber: p.batchNumber ?? null,
              udi: p.udi ?? null,
              asReportedCode1: p.asReportedCode1 ?? null,
              asReportedCode2: p.asReportedCode2 ?? null,
              softwareVersion: p.softwareVersion ?? null,
            },
          });
        } else {
          await tx.productInformation.create({
            data: {
              orgId,
              complaintId: data.complaintId,
              occurrence: p.occurrence ?? null,
              materialNumber: p.materialNumber ?? null,
              materialDescription: p.materialDescription ?? null,
              serialNumber: p.serialNumber ?? null,
              batchNumber: p.batchNumber ?? null,
              udi: p.udi ?? null,
              asReportedCode1: p.asReportedCode1 ?? null,
              asReportedCode2: p.asReportedCode2 ?? null,
              softwareVersion: p.softwareVersion ?? null,
            },
          });
        }
      }
    }

    // Intelligent relational updates for patients
    if (data.patients !== undefined) {
      const incomingPatientIds = new Set(
        data.patients.map((pt) => pt.id).filter((id): id is string => Boolean(id))
      );
      const existingPatientIds = new Set(existing.patientInformation.map((pt) => pt.id));

      // 1. Delete patients in DB missing from the incoming payload
      const patientsToDelete = existing.patientInformation.filter(
        (pt) => !incomingPatientIds.has(pt.id)
      );
      if (patientsToDelete.length > 0) {
        await tx.patientInformation.deleteMany({
          where: {
            id: { in: patientsToDelete.map((pt) => pt.id) },
            complaintId: data.complaintId,
          },
        });
      }

      // 2. Update existing items or create new ones
      for (const pt of data.patients) {
        if (pt.id && existingPatientIds.has(pt.id)) {
          await tx.patientInformation.update({
            where: { id: pt.id },
            data: {
              patientName: pt.patientName ?? null,
              patientImpact: pt.patientImpact ?? null,
              patientImpactDesc: pt.patientImpactDesc ?? null,
              sex: pt.sex ?? null,
              age: pt.age ?? null,
              eventOccurred: pt.eventOccurred
                ? new Date(pt.eventOccurred)
                : awarenessDate,
              annexE_Codes: pt.annexE_Codes ?? [],
              annexF_Codes: pt.annexF_Codes ?? [],
            },
          });
        } else {
          await tx.patientInformation.create({
            data: {
              orgId,
              complaintId: data.complaintId,
              patientName: pt.patientName ?? null,
              patientImpact: pt.patientImpact ?? null,
              patientImpactDesc: pt.patientImpactDesc ?? null,
              sex: pt.sex ?? null,
              age: pt.age ?? null,
              eventOccurred: pt.eventOccurred
                ? new Date(pt.eventOccurred)
                : awarenessDate,
              annexE_Codes: pt.annexE_Codes ?? [],
              annexF_Codes: pt.annexF_Codes ?? [],
            },
          });
        }
      }
    }

    const updated = await tx.complaint.update({
      where: { id: data.complaintId },
      data: {
        shortDescription: data.shortDescription,
        description: data.description ?? data.shortDescription,
        priority: data.priority,
        status: data.status ?? existing.status,
        awarenessDate,
        dateReceived,
        regulatoryReportingReference: data.regulatoryReportingReference ?? null,
        customerName: data.customerName,
        customerType: data.customerType,
        initialReporterName: data.initialReporterName,
        initialReporterSurname: data.initialReporterSurname,
        email: data.email,
        address: data.address,
        country: data.country,
        telNumber: data.telNumber,
        countryEventOccurred: data.countryEventOccurred,
        region: data.region,
        death: data.death ?? existing.death,
        detailDescriptionNativeLanguage:
          data.detailDescriptionNativeLanguage ?? null,
        customerResponseNeeded:
          data.customerResponseNeeded ?? existing.customerResponseNeeded,
        finalResponseCompletedOn: data.finalResponseCompletedOn
          ? new Date(data.finalResponseCompletedOn)
          : null,
        complaintOwnerId: data.complaintOwnerId || existing.complaintOwnerId,
        deviceModel: data.deviceModel ?? existing.deviceModel,
        deviceSerialNumber:
          data.deviceSerialNumber ?? existing.deviceSerialNumber,
        lotNumber: data.lotNumber ?? existing.lotNumber,
        isAdverseEvent: data.isAdverseEvent ?? existing.isAdverseEvent,
      },
      include: {
        productInformation: true,
        patientInformation: true,
      },
    });

    if (data.newAttachments && data.newAttachments.length > 0) {
      await tx.attachment.createMany({
        data: data.newAttachments.map((att) => ({
          orgId,
          complaintId: data.complaintId,
          fileUrl: att.fileUrl,
          fileName: att.fileName,
          fileSize: att.fileSize ?? null,
          mimeType: att.mimeType ?? null,
          uploadedById: userId,
        })),
      });
    }

    // Fetch the fully updated entity for logging
    const fullyUpdated = await tx.complaint.findUnique({
      where: { id: data.complaintId },
      include: {
        productInformation: true,
        patientInformation: true,
        attachments: {
          where: {
            investigationId: null,
            vigilanceId: null,
            communicationId: null,
            taskId: null,
          },
        },
      },
    });

    // Create 21 CFR Part 11 AuditLog for UPDATE
    const fieldChanges = generateAuditDiff(
      existing as unknown as Record<string, unknown>,
      fullyUpdated as unknown as Record<string, unknown>
    );

    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "Complaint",
        entityId: data.complaintId,
        action: AuditAction.UPDATE,
        changedById: userId,
        previousData: existing as unknown as Prisma.InputJsonValue,
        newData: fullyUpdated as unknown as Prisma.InputJsonValue,
        reason: `Updated complaint details (${updated.complaintNumber})`,
        fieldChanges: fieldChanges as unknown as Prisma.InputJsonValue,
        complaintId: data.complaintId,
      },
    });

    return fullyUpdated;
  });

  revalidatePath("/[orgSlug]/complaints", "page");
  return result;
}

export interface AddCustomerCommunicationInput {
  complaintId: string;
  notes?: string;
  internalNotes?: string;
  questionAsked?: string | null;
  customerResponse?: string | null;
  status?: CommunicationStatus;
  communicationDate?: Date | string;
  attachments?: AttachmentInput[];
}

export async function addCustomerCommunication(
  data: AddCustomerCommunicationInput
) {
  const { userId, orgId } = await requireOrgAuth(PERMISSIONS.COMPLAINTS_CREATE);

  return await prisma.$transaction(async (tx) => {
    const communication = await tx.customerCommunication.create({
      data: {
        orgId,
        complaintId: data.complaintId,
        internalNotes: data.internalNotes ?? data.notes ?? null,
        questionAsked: data.questionAsked ?? null,
        customerResponse: data.customerResponse ?? null,
        status: data.status ?? "OPEN",
        communicationDate: data.communicationDate
          ? new Date(data.communicationDate)
          : new Date(),
        authorId: userId,
        ...(data.attachments && data.attachments.length > 0
          ? {
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
            }
          : {}),
      },
      include: {
        author: {
          select: { email: true, firstName: true, lastName: true },
        },
        attachments: true,
      },
    });

    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "CustomerCommunication",
        entityId: communication.id,
        action: AuditAction.CREATE,
        changedById: userId,
        newData: communication as unknown as Prisma.InputJsonValue,
        reason: "Logged customer communication",
        complaintId: data.complaintId,
      },
    });

    return communication;
  });
}

export interface UpdateSampleManagementInput {
  complaintId: string;
  sampleAvailable: boolean;
  trackingDetails?: string | null;
  status: SampleStatus;
  receivedDate?: Date | string | null;
}

export async function updateSampleManagement(
  data: UpdateSampleManagementInput
) {
  const { userId, orgId } = await requireOrgAuth(PERMISSIONS.COMPLAINTS_CREATE);

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.sampleManagement.findUnique({
      where: { complaintId: data.complaintId },
    });

    const sample = await tx.sampleManagement.upsert({
      where: { complaintId: data.complaintId },
      create: {
        orgId,
        complaintId: data.complaintId,
        sampleAvailable: data.sampleAvailable,
        trackingDetails: data.trackingDetails ?? null,
        status: data.status,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
      },
      update: {
        sampleAvailable: data.sampleAvailable,
        trackingDetails: data.trackingDetails ?? null,
        status: data.status,
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
      },
    });

    const fieldChanges = existing
      ? generateAuditDiff(existing, sample, [
          "updatedAt",
          "createdAt",
          "orgId",
          "id",
          "complaintId",
        ])
      : [];

    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "SampleManagement",
        entityId: sample.id,
        action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
        changedById: userId,
        previousData: existing ? (existing as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        newData: sample as unknown as Prisma.InputJsonValue,
        fieldChanges:
          fieldChanges.length > 0
            ? (fieldChanges as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        reason: `Updated sample management status to ${data.status}`,
        complaintId: data.complaintId,
      },
    });

    return sample;
  });
}


