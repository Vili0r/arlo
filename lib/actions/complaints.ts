"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgAuth, PERMISSIONS } from "@/lib/auth-guard";
import { generateJsonDiff } from "@/lib/json-diff";
import type { FormSchemaDefinition } from "@/lib/types/form-template.types";
import {
  Priority,
  Death,
  CommunicationDirection,
  InvestigationStatus,
  VigilanceStatus,
  AuditAction,
  Prisma,
} from "@prisma/client";

// =============================================================================
// Input Types for Relational Complaint Creation
// =============================================================================

export interface ProductInformationInput {
  occurrence?: string | null;
  materialNumber?: string | null;
  materialDescription?: string | null;
  serialNumber?: string | null;
  batchNumber?: string | null;
  asReportedCode1?: string | null; // IMDRF Annex A Code
  asReportedCode2?: string | null; // IMDRF Annex A Code
  softwareVersion?: string | null;
}

export interface PatientInformationInput {
  patientImpact?: string | null;
  patientImpactDesc?: string | null;
  patientName?: string | null;
  sex?: string | null;
  age?: number | null;
  eventOccurred?: Date | string | null;
  annexE_Codes?: string[]; // IMDRF Annex E (Health Effects - Clinical Signs)
  annexF_Codes?: string[]; // IMDRF Annex F (Health Effects - Health Impact)
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
  followUpRequired?: boolean;
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
  const followUpRequired = data.followUpRequired ?? true;
  const deathStatus: Death = data.death ?? Death.NO;

  return await prisma.$transaction(async (tx) => {
    // 1. Generate sequential complaint identifier (CMP-YYYY-0001) for this tenant
    const count = await tx.complaint.count({ where: { orgId } });
    const year = new Date().getFullYear();
    const complaintNumber = `CMP-${year}-${String(count + 1).padStart(4, "0")}`;

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
        followUpRequired,
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
      },
      include: {
        productInformation: true,
        patientInformation: true,
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
          rootCauseDesc: null,
          investigationRequired: true,
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
          direction: CommunicationDirection.INBOUND,
          notes:
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
            followUpRequired: complaint.followUpRequired,
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
