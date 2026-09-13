import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AuditAction,
  ComplaintStatus,
  InvestigationStatus,
  VigilanceStatus,
  CommunicationStatus,
  TaskStatus,
  MIRStatus,
  CapaPhase,
  CapaType,
  Priority,
  Death,
  SampleStatus,
} from "@prisma/client";

const { mockVerifyPassword, mockAuth, mockAuthCtx, mockTx, mockPrisma } = vi.hoisted(() => {
  const verifyPassword = vi.fn();
  const authCtx = {
    userId: "user_qa_officer_01",
    orgId: "org_medical_pms_01",
    orgRole: "org:admin",
  };
  const authFn = vi.fn().mockResolvedValue({
    userId: "user_qa_officer_01",
    orgId: "org_medical_pms_01",
    orgRole: "org:admin",
    has: () => true,
  });

  const tx = {
    complaint: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    investigation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    investigationSummary: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    vigilanceDecisionTree: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    initialMIR: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    finalMIR: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    customerCommunication: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    complaintTask: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    sampleManagement: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    capa: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    capaInitiation: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    capaInvestigation: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    capaImplementation: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    capaEffectiveness: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    extensionRequest: {
      createMany: vi.fn(),
    },
    attachment: {
      createMany: vi.fn(),
    },
    productInformation: {
      deleteMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    patientInformation: {
      deleteMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    formTemplate: {
      findUnique: vi.fn(),
    },
    recordLock: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };

  const prismaObj = {
    $transaction: vi.fn((callback) => callback(tx)),
    auditLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    complaint: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  return {
    mockVerifyPassword: verifyPassword,
    mockAuth: authFn,
    mockAuthCtx: authCtx,
    mockTx: tx,
    mockPrisma: prismaObj,
  };
});

// Mock Clerk and Next.js dependencies
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      verifyPassword: (params: { userId: string; password?: string }) =>
        mockVerifyPassword(params),
    },
  }),
  auth: () => mockAuth(),
}));

vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: vi.fn().mockImplementation(async () => mockAuthCtx),
  ROLES: {
    ADMIN: "org:admin",
    QA_MANAGER: "org:qa_manager",
  },
  PERMISSIONS: {
    COMPLAINTS_CREATE: "org:complaints:create",
    COMPLAINTS_APPROVE_CLOSE: "org:complaints:approve_close",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import {
  createComplaintWithRelations,
  updateComplaintWithRelations,
  updateSampleManagement,
  CreateComplaintWithRelationsInput,
} from "@/lib/actions/complaints";
import { updateInvestigation } from "@/lib/actions/investigations";
import { saveInvestigationSummaryDraft } from "@/lib/actions/investigation-summary";
import { updateVigilance } from "@/lib/actions/vigilance";
import { updateInitialMIR, updateFinalMIR } from "@/lib/actions/mir";
import { updateCustomerCommunication } from "@/lib/actions/communication";
import { updateComplaintTask } from "@/lib/actions/task";
import { createCapa, updateCapa } from "@/lib/actions/capa";
import { executeStatusTransition } from "@/lib/actions/esignature";
import { getAuditHistory } from "@/lib/actions/audit";
import { createAuditLog } from "@/lib/audit";

describe("Requirement: The system shall maintain an audit trail for changes to complaint records, all related sub-records and CAPA records", () => {
  const COMPLAINT_ID = "cmp_audit_req_001";
  const CAPA_ID = "capa_audit_req_001";
  const ORG_ID = "org_medical_pms_01";
  const USER_ID = "user_qa_officer_01";

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthCtx.userId = USER_ID;
    mockAuthCtx.orgId = ORG_ID;
    mockAuth.mockResolvedValue({
      userId: USER_ID,
      orgId: ORG_ID,
      orgRole: "org:admin",
      has: () => true,
    });
  });

  /* ========================================================================= */
  /* PART 1: AUDIT TRAIL FOR CHANGES TO COMPLAINT RECORDS                      */
  /* ========================================================================= */

  describe("1. Complaint Records Audit Trail Maintenance", () => {
    it("1.1 Record Creation: maintains an audit trail with action=CREATE when a complaint is created", async () => {
      mockTx.complaint.count.mockResolvedValue(0);
      mockTx.formTemplate.findUnique.mockResolvedValue(null);

      const mockComplaint = {
        id: COMPLAINT_ID,
        orgId: ORG_ID,
        complaintNumber: "CMP-2026-0001",
        shortDescription: "Syringe plunger sticking issue",
        description: "Plunger friction higher than nominal specification",
        priority: Priority.HIGH,
        status: ComplaintStatus.OPEN,
        awarenessDate: new Date("2026-09-01T10:00:00Z"),
        dateReceived: new Date("2026-09-01T10:30:00Z"),
        customerName: "St. Jude Hospital",
        customerType: "HOSPITAL",
        initialReporterName: "Elena",
        initialReporterSurname: "Rostova",
        email: "elena@stjude.org",
        address: "100 Medical Center Dr",
        country: "Germany",
        telNumber: "+49-89-123456",
        countryEventOccurred: "Germany",
        region: "EMEA",
        death: Death.NO,
        customerResponseNeeded: true,
        complaintOwnerId: USER_ID,
        productInformation: [{ id: "prod_1", materialNumber: "SYR-50" }],
        patientInformation: [{ id: "pat_1", patientName: "Anonymized" }],
      };

      mockTx.complaint.create.mockResolvedValue(mockComplaint);
      mockTx.vigilanceDecisionTree.create.mockResolvedValue({ id: "vig_1" });
      mockTx.investigation.create.mockResolvedValue({ id: "inv_1" });
      mockTx.customerCommunication.create.mockResolvedValue({ id: "comm_1" });
      mockTx.auditLog.create.mockResolvedValue({ id: "log_create_cmp" });

      const input: CreateComplaintWithRelationsInput = {
        shortDescription: "Syringe plunger sticking issue",
        description: "Plunger friction higher than nominal specification",
        priority: Priority.HIGH,
        awarenessDate: new Date("2026-09-01T10:00:00Z"),
        dateReceived: new Date("2026-09-01T10:30:00Z"),
        customerName: "St. Jude Hospital",
        customerType: "HOSPITAL",
        initialReporterName: "Elena",
        initialReporterSurname: "Rostova",
        email: "elena@stjude.org",
        address: "100 Medical Center Dr",
        country: "Germany",
        telNumber: "+49-89-123456",
        countryEventOccurred: "Germany",
        region: "EMEA",
        death: Death.NO,
        products: [{ materialNumber: "SYR-50", materialDescription: "50ml Syringe" }],
        patients: [{ patientName: "Anonymized", sex: "FEMALE", age: 52 }],
      };

      await createComplaintWithRelations(input);

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "Complaint",
            entityId: COMPLAINT_ID,
            action: AuditAction.CREATE,
            changedById: USER_ID,
            complaintId: COMPLAINT_ID,
            newData: expect.objectContaining({
              complaint: expect.objectContaining({
                id: COMPLAINT_ID,
                shortDescription: "Syringe plunger sticking issue",
                priority: Priority.HIGH,
              }),
            }),
          }),
        })
      );
    });

    it("1.2 Record Modification: maintains an audit trail with action=UPDATE, previousData and newData snapshots", async () => {
      const existingComplaint = {
        id: COMPLAINT_ID,
        orgId: ORG_ID,
        complaintNumber: "CMP-2026-0001",
        shortDescription: "Original description",
        priority: Priority.LOW,
        status: ComplaintStatus.OPEN,
        awarenessDate: new Date("2026-09-01T10:00:00Z"),
        dateReceived: new Date("2026-09-01T10:30:00Z"),
        productInformation: [],
        patientInformation: [],
        attachments: [],
      };

      mockTx.complaint.findUnique.mockResolvedValue(existingComplaint);
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.complaint.update.mockResolvedValue({
        ...existingComplaint,
        shortDescription: "Updated high priority description",
        priority: Priority.HIGH,
      });

      await updateComplaintWithRelations({
        complaintId: COMPLAINT_ID,
        shortDescription: "Updated high priority description",
        priority: Priority.HIGH,
        awarenessDate: new Date("2026-09-01T10:00:00Z").toISOString(),
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "Complaint",
            entityId: COMPLAINT_ID,
            action: AuditAction.UPDATE,
            changedById: USER_ID,
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("1.3 Status Change / E-Signature: maintains an audit trail with action=STATUS_CHANGE and signature meaning", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.complaint.findUnique.mockResolvedValue({
        id: COMPLAINT_ID,
        orgId: ORG_ID,
        status: ComplaintStatus.OPEN,
        awarenessDate: new Date("2026-09-01T10:00:00Z"),
        dateReceived: new Date("2026-09-01T10:30:00Z"),
      });
      mockTx.complaint.update.mockResolvedValue({
        id: COMPLAINT_ID,
        orgId: ORG_ID,
        status: ComplaintStatus.IN_PROGRESS,
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", COMPLAINT_ID);
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "QualityPassword2026!");
      formData.set("meaningOfSignature", "I approve transitioning this complaint to In Progress");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "Complaint",
            entityId: COMPLAINT_ID,
            action: AuditAction.STATUS_CHANGE,
            changedById: USER_ID,
            complaintId: COMPLAINT_ID,
            reason: expect.stringContaining("I approve transitioning this complaint to In Progress"),
          }),
        })
      );
    });
  });

  /* ========================================================================= */
  /* PART 2: AUDIT TRAIL FOR CHANGES TO ALL RELATED SUB-RECORDS                */
  /* ========================================================================= */

  describe("2. Complaint Sub-Records Audit Trail Maintenance", () => {
    it("2.1 Investigation Sub-Record: maintains an audit trail entry linked via complaintId", async () => {
      const invRecord = {
        id: "inv_sub_01",
        orgId: ORG_ID,
        complaintId: COMPLAINT_ID,
        status: InvestigationStatus.IN_PROGRESS,
        investigatorId: USER_ID,
        sampleAnalysisRequired: false,
        riskReviewRequired: false,
        capaRequired: false,
        fscaRequired: false,
        reportabilityReviewRequired: false,
        attachments: [],
        customSections: [],
      };

      mockTx.investigation.findUnique.mockResolvedValue(invRecord);
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.investigation.update.mockResolvedValue({
        ...invRecord,
        sampleAnalysisRequired: true,
      });

      await updateInvestigation({
        id: "inv_sub_01",
        complaintId: COMPLAINT_ID,
        orgSlug: "test-org",
        status: InvestigationStatus.IN_PROGRESS,
        sampleAnalysisRequired: true,
        riskReviewRequired: false,
        capaRequired: false,
        fscaRequired: false,
        reportabilityReviewRequired: false,
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "Investigation",
            entityId: "inv_sub_01",
            action: AuditAction.UPDATE,
            changedById: USER_ID,
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("2.2 Investigation Summary Sub-Record: maintains an audit trail entry linked via complaintId", async () => {
      mockTx.investigation.findUnique.mockResolvedValue({
        id: "inv_sub_01",
        complaintId: COMPLAINT_ID,
        status: "IN_PROGRESS",
      });
      mockTx.investigationSummary.findUnique.mockResolvedValue(null);
      mockTx.investigationSummary.upsert.mockResolvedValue({
        id: "inv_sum_01",
        investigationId: "inv_sub_01",
        summary: "Plunger elastomer formulation out of tolerance",
      });

      await saveInvestigationSummaryDraft({
        investigationId: "inv_sub_01",
        summary: "Plunger elastomer formulation out of tolerance",
        report: "Full mechanical testing report attached",
        capaRequired: true,
        capaRef: "CAPA-2026-0099",
        fscaRequired: false,
        fscaRef: null,
        capaFscaRationale: "Corrective tooling supplier audit required",
        reportabilityReviewRequired: true,
        notes: null,
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "InvestigationSummary",
            entityId: "inv_sum_01",
            changedById: USER_ID,
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("2.3 Vigilance Decision Tree Sub-Record: maintains an audit trail entry linked via complaintId", async () => {
      mockTx.vigilanceDecisionTree.findUnique.mockResolvedValue({
        id: "vig_sub_01",
        orgId: ORG_ID,
        complaintId: COMPLAINT_ID,
        status: VigilanceStatus.PENDING,
        attachments: [],
      });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.vigilanceDecisionTree.update.mockResolvedValue({
        id: "vig_sub_01",
        complaintId: COMPLAINT_ID,
        status: VigilanceStatus.REPORTABLE,
        reportable: true,
      });

      await updateVigilance({
        id: "vig_sub_01",
        orgSlug: "test-org",
        status: VigilanceStatus.REPORTABLE,
        reportable: true,
        rationale: "EU MDR Article 87 criteria met: potential serious deterioration in health",
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "VigilanceDecisionTree",
            entityId: "vig_sub_01",
            action: AuditAction.UPDATE,
            changedById: USER_ID,
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("2.4 Initial MIR Sub-Record: maintains an audit trail entry linked via complaintId", async () => {
      mockTx.initialMIR.findUnique.mockResolvedValue({
        id: "imir_sub_01",
        orgId: ORG_ID,
        complaintId: COMPLAINT_ID,
        status: MIRStatus.DRAFT,
      });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.initialMIR.update.mockResolvedValue({
        id: "imir_sub_01",
        complaintId: COMPLAINT_ID,
        status: MIRStatus.DRAFT,
        mirNumber: "MIR-EU-2026-0042",
      });

      await updateInitialMIR("imir_sub_01", {
        mirNumber: "MIR-EU-2026-0042",
        submissionCountry: "FR",
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "InitialMIR",
            entityId: "imir_sub_01",
            action: AuditAction.UPDATE,
            changedById: USER_ID,
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("2.5 Final MIR Sub-Record: maintains an audit trail entry linked via complaintId", async () => {
      mockTx.finalMIR.findUnique.mockResolvedValue({
        id: "fmir_sub_01",
        orgId: ORG_ID,
        complaintId: COMPLAINT_ID,
        status: MIRStatus.DRAFT,
      });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.finalMIR.update.mockResolvedValue({
        id: "fmir_sub_01",
        complaintId: COMPLAINT_ID,
        status: MIRStatus.DRAFT,
        incidentConfirmed: true,
      });

      await updateFinalMIR("fmir_sub_01", {
        incidentConfirmed: true,
        manufacturerConclusion: "Supplier material lot quarantined, mold recalibrated.",
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "FinalMIR",
            entityId: "fmir_sub_01",
            action: AuditAction.UPDATE,
            changedById: USER_ID,
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("2.6 Customer Communication Sub-Record: maintains an audit trail entry linked via complaintId", async () => {
      mockTx.customerCommunication.findUnique
        .mockResolvedValueOnce({
          id: "comm_sub_01",
          orgId: ORG_ID,
          complaintId: COMPLAINT_ID,
          status: CommunicationStatus.OPEN,
          questionAsked: "Was medication dose delayed?",
          attachments: [],
          author: { email: "qa@arlo.io" },
        })
        .mockResolvedValueOnce({
          id: "comm_sub_01",
          orgId: ORG_ID,
          complaintId: COMPLAINT_ID,
          status: CommunicationStatus.OPEN,
          questionAsked: "Was medication dose delayed?",
          customerResponse: "Hospital reports alternate syringe used without dosage delay.",
          attachments: [],
          author: { email: "qa@arlo.io" },
        });

      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.customerCommunication.update.mockResolvedValue({});

      await updateCustomerCommunication({
        communicationId: "comm_sub_01",
        customerResponse: "Hospital reports alternate syringe used without dosage delay.",
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "CustomerCommunication",
            entityId: "comm_sub_01",
            action: AuditAction.UPDATE,
            changedById: USER_ID,
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("2.7 Complaint Task Sub-Record: maintains an audit trail entry linked via complaintId", async () => {
      mockTx.complaintTask.findUnique
        .mockResolvedValueOnce({
          id: "task_sub_01",
          orgId: ORG_ID,
          complaintId: COMPLAINT_ID,
          shortDescription: "Inspect retain batch samples",
          status: TaskStatus.OPEN,
          attachments: [],
          originator: { email: "qa@arlo.io" },
          assignedTo: { email: "tech@arlo.io" },
        })
        .mockResolvedValueOnce({
          id: "task_sub_01",
          orgId: ORG_ID,
          complaintId: COMPLAINT_ID,
          shortDescription: "Inspect retain batch samples",
          status: TaskStatus.CLOSED,
          attachments: [],
          originator: { email: "qa@arlo.io" },
          assignedTo: { email: "tech@arlo.io" },
        });

      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.complaintTask.update.mockResolvedValue({});

      await updateComplaintTask({
        id: "task_sub_01",
        orgSlug: "test-org",
        status: TaskStatus.CLOSED,
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "ComplaintTask",
            entityId: "task_sub_01",
            action: AuditAction.STATUS_CHANGE,
            changedById: USER_ID,
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("2.8 Sample Management Sub-Record: maintains an audit trail entry linked via complaintId", async () => {
      mockTx.sampleManagement.findUnique.mockResolvedValue({
        id: "sample_sub_01",
        orgId: ORG_ID,
        complaintId: COMPLAINT_ID,
        sampleAvailable: true,
        status: SampleStatus.PENDING,
      });
      mockTx.sampleManagement.upsert.mockResolvedValue({
        id: "sample_sub_01",
        orgId: ORG_ID,
        complaintId: COMPLAINT_ID,
        status: SampleStatus.RECEIVED,
        sampleAvailable: true,
      });

      await updateSampleManagement({
        complaintId: COMPLAINT_ID,
        sampleAvailable: true,
        status: SampleStatus.RECEIVED,
        trackingDetails: "DHL-EXPRESS-9921",
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "SampleManagement",
            entityId: "sample_sub_01",
            action: AuditAction.UPDATE,
            changedById: USER_ID,
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });
  });

  /* ========================================================================= */
  /* PART 3: AUDIT TRAIL FOR CHANGES TO CAPA RECORDS & PHASES                  */
  /* ========================================================================= */

  describe("3. CAPA Records and Sub-Records Audit Trail Maintenance", () => {
    it("3.1 CAPA Creation: maintains an audit trail with action=CREATE when a CAPA is created", async () => {
      mockTx.capa.count.mockResolvedValue(0);

      const mockCapa = {
        id: CAPA_ID,
        orgId: ORG_ID,
        capaNumber: "CAPA-2026-0001",
        shortDescription: "Plunger barrel molding friction remediation",
        type: CapaType.CORRECTIVE,
        currentPhase: CapaPhase.INITIATION,
        ownerId: USER_ID,
      };

      mockTx.capa.create.mockResolvedValue(mockCapa);
      mockTx.capaInitiation.create.mockResolvedValue({ id: "init_1", capaId: CAPA_ID });
      mockTx.capaInvestigation.create.mockResolvedValue({ id: "inv_capa_1", capaId: CAPA_ID });
      mockTx.capaImplementation.create.mockResolvedValue({ id: "imp_1", capaId: CAPA_ID });
      mockTx.capaEffectiveness.create.mockResolvedValue({ id: "eff_1", capaId: CAPA_ID });
      mockTx.auditLog.create.mockResolvedValue({ id: "log_capa_create" });

      await createCapa({
        shortDescription: "Plunger barrel molding friction remediation",
        type: CapaType.CORRECTIVE,
        currentPhase: CapaPhase.INITIATION,
        ownerId: USER_ID,
        cancellationRequested: false,
        initiation: {
          problemStatement: "Molding cavity #4 exhibits dimensional variance.",
          repeatCapa: false,
          existingCapa: false,
          capaRequired: true,
          fscaRequired: false,
          attachments: [],
        },
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "Capa",
            entityId: CAPA_ID,
            action: AuditAction.CREATE,
            changedById: USER_ID,
            capaId: CAPA_ID,
            newData: expect.objectContaining({
              capaNumber: "CAPA-2026-0001",
              shortDescription: "Plunger barrel molding friction remediation",
              type: CapaType.CORRECTIVE,
              currentPhase: CapaPhase.INITIATION,
            }),
          }),
        })
      );
    });

    it("3.2 CAPA Modification: maintains an audit trail with action=UPDATE capturing phase changes and diffs", async () => {
      const existingCapa = {
        id: CAPA_ID,
        orgId: ORG_ID,
        capaNumber: "CAPA-2026-0001",
        shortDescription: "Plunger barrel molding friction remediation",
        type: CapaType.CORRECTIVE,
        currentPhase: CapaPhase.INITIATION,
        ownerId: USER_ID,
        cancellationRequested: false,
        cancellationJustification: null,
        initiation: {
          problemStatement: "Molding cavity #4 exhibits dimensional variance.",
          repeatCapa: false,
          existingCapa: false,
          capaRequired: true,
          fscaRequired: false,
        },
        investigation: {},
        implementation: {},
        effectiveness: {},
        extensionRequests: [],
        attachments: [],
      };

      mockTx.capa.findUnique.mockResolvedValue(existingCapa);
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.capa.update.mockResolvedValue({
        ...existingCapa,
        shortDescription: "Updated: Plunger barrel cavity tooling replacement",
      });

      await updateCapa(CAPA_ID, {
        shortDescription: "Updated: Plunger barrel cavity tooling replacement",
        type: CapaType.CORRECTIVE,
        currentPhase: CapaPhase.INITIATION,
        ownerId: USER_ID,
        cancellationRequested: false,
        initiation: {
          problemStatement: "Expanded root cause to cavity #2 and #4 tooling fatigue.",
          repeatCapa: false,
          existingCapa: false,
          capaRequired: true,
          fscaRequired: false,
        },
      } as any);

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "Capa",
            entityId: CAPA_ID,
            action: AuditAction.UPDATE,
            changedById: USER_ID,
            capaId: CAPA_ID,
            reason: "CAPA record and phase details updated",
          }),
        })
      );
    });

    it("3.3 CAPA Phase Transition / E-Signature: maintains an audit trail with action=STATUS_CHANGE", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.capa.findUnique.mockResolvedValue({
        id: CAPA_ID,
        orgId: ORG_ID,
        currentPhase: CapaPhase.INITIATION,
      });
      mockTx.capa.update.mockResolvedValue({
        id: CAPA_ID,
        orgId: ORG_ID,
        currentPhase: CapaPhase.INVESTIGATION,
      });

      const formData = new FormData();
      formData.set("entityType", "Capa");
      formData.set("entityId", CAPA_ID);
      formData.set("newStatus", "INVESTIGATION");
      formData.set("password", "SecretQA2026!");
      formData.set("meaningOfSignature", "I approve initiating the CAPA Investigation phase");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "Capa",
            entityId: CAPA_ID,
            action: AuditAction.STATUS_CHANGE,
            changedById: USER_ID,
            reason: expect.stringContaining("I approve initiating the CAPA Investigation phase"),
          }),
        })
      );
    });
  });

  /* ========================================================================= */
  /* PART 4: AUDIT TRAIL AGGREGATION & REGULATORY INTEGRITY (21 CFR PART 11)   */
  /* ========================================================================= */

  describe("4. Audit Trail Aggregation and 21 CFR Part 11 Integrity", () => {
    it("4.1 Aggregation: getAuditHistory for Complaint aggregates the parent complaint and all related sub-records", async () => {
      const mockAggregatedLogs = [
        {
          id: "log_cmp_1",
          entityType: "Complaint",
          entityId: COMPLAINT_ID,
          action: AuditAction.CREATE,
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-01T08:00:00Z"),
          changedBy: { firstName: "QA", lastName: "Officer", email: "qa@arlo.io" },
        },
        {
          id: "log_inv_1",
          entityType: "Investigation",
          entityId: "inv_1",
          action: AuditAction.UPDATE,
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-01T09:00:00Z"),
          changedBy: { firstName: "Jane", lastName: "Investigator", email: "jane@arlo.io" },
        },
        {
          id: "log_vig_1",
          entityType: "VigilanceDecisionTree",
          entityId: "vig_1",
          action: AuditAction.UPDATE,
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-01T10:00:00Z"),
          changedBy: { firstName: "Vigilance", lastName: "Specialist", email: "vig@arlo.io" },
        },
        {
          id: "log_sample_1",
          entityType: "SampleManagement",
          entityId: "sample_1",
          action: AuditAction.UPDATE,
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-01T11:00:00Z"),
          changedBy: { firstName: "Lab", lastName: "Tech", email: "lab@arlo.io" },
        },
        {
          id: "log_comm_1",
          entityType: "CustomerCommunication",
          entityId: "comm_1",
          action: AuditAction.UPDATE,
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-01T12:00:00Z"),
          changedBy: { firstName: "Rep", lastName: "Support", email: "support@arlo.io" },
        },
        {
          id: "log_task_1",
          entityType: "ComplaintTask",
          entityId: "task_1",
          action: AuditAction.STATUS_CHANGE,
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-01T13:00:00Z"),
          changedBy: { firstName: "Lead", lastName: "Eng", email: "eng@arlo.io" },
        },
        {
          id: "log_imir_1",
          entityType: "InitialMIR",
          entityId: "imir_1",
          action: AuditAction.UPDATE,
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-01T14:00:00Z"),
          changedBy: { firstName: "Regulatory", lastName: "Officer", email: "reg@arlo.io" },
        },
        {
          id: "log_fmir_1",
          entityType: "FinalMIR",
          entityId: "fmir_1",
          action: AuditAction.UPDATE,
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-01T15:00:00Z"),
          changedBy: { firstName: "Regulatory", lastName: "Officer", email: "reg@arlo.io" },
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockAggregatedLogs);

      const history = await getAuditHistory("Complaint", COMPLAINT_ID);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          orgId: ORG_ID,
          OR: [
            { entityType: "Complaint", entityId: COMPLAINT_ID },
            { entityType: "SampleManagement", complaintId: COMPLAINT_ID },
            { complaintId: COMPLAINT_ID },
          ],
        },
        orderBy: { timestamp: "desc" },
        include: {
          changedBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      expect(history).toHaveLength(8);
      const entityTypes = history.map((h: any) => h.entityType);
      expect(entityTypes).toEqual([
        "Complaint",
        "Investigation",
        "VigilanceDecisionTree",
        "SampleManagement",
        "CustomerCommunication",
        "ComplaintTask",
        "InitialMIR",
        "FinalMIR",
      ]);
    });

    it("4.2 Aggregation: getAuditHistory for Capa aggregates the parent CAPA and all phase sub-records", async () => {
      const mockCapaLogs = [
        {
          id: "log_capa_1",
          entityType: "Capa",
          entityId: CAPA_ID,
          action: AuditAction.CREATE,
          capaId: CAPA_ID,
          timestamp: new Date("2026-09-01T08:00:00Z"),
          changedBy: { firstName: "QA", lastName: "Manager", email: "qa@arlo.io" },
        },
        {
          id: "log_init_1",
          entityType: "CapaInitiation",
          entityId: "init_1",
          action: AuditAction.UPDATE,
          capaId: CAPA_ID,
          timestamp: new Date("2026-09-02T09:00:00Z"),
          changedBy: { firstName: "QA", lastName: "Manager", email: "qa@arlo.io" },
        },
        {
          id: "log_inv_1",
          entityType: "CapaInvestigation",
          entityId: "inv_1",
          action: AuditAction.UPDATE,
          capaId: CAPA_ID,
          timestamp: new Date("2026-09-03T10:00:00Z"),
          changedBy: { firstName: "Eng", lastName: "Lead", email: "eng@arlo.io" },
        },
        {
          id: "log_imp_1",
          entityType: "CapaImplementation",
          entityId: "imp_1",
          action: AuditAction.UPDATE,
          capaId: CAPA_ID,
          timestamp: new Date("2026-09-04T11:00:00Z"),
          changedBy: { firstName: "Eng", lastName: "Lead", email: "eng@arlo.io" },
        },
        {
          id: "log_eff_1",
          entityType: "CapaEffectiveness",
          entityId: "eff_1",
          action: AuditAction.UPDATE,
          capaId: CAPA_ID,
          timestamp: new Date("2026-09-05T12:00:00Z"),
          changedBy: { firstName: "QA", lastName: "Director", email: "director@arlo.io" },
        },
        {
          id: "log_ext_1",
          entityType: "ExtensionRequest",
          entityId: "ext_1",
          action: AuditAction.CREATE,
          capaId: CAPA_ID,
          timestamp: new Date("2026-09-06T13:00:00Z"),
          changedBy: { firstName: "Eng", lastName: "Lead", email: "eng@arlo.io" },
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockCapaLogs);

      const history = await getAuditHistory("Capa", CAPA_ID);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          orgId: ORG_ID,
          OR: [
            { entityType: "Capa", entityId: CAPA_ID },
            { capaId: CAPA_ID },
            {
              entityType: {
                in: [
                  "Capa",
                  "CapaInitiation",
                  "CapaInvestigation",
                  "CapaImplementation",
                  "CapaEffectiveness",
                  "ExtensionRequest",
                ],
              },
              OR: [{ entityId: CAPA_ID }, { capaId: CAPA_ID }],
            },
          ],
        },
        orderBy: { timestamp: "desc" },
        include: {
          changedBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      expect(history).toHaveLength(6);
      const entityTypes = history.map((h: any) => h.entityType);
      expect(entityTypes).toContain("Capa");
      expect(entityTypes).toContain("CapaInitiation");
      expect(entityTypes).toContain("CapaInvestigation");
      expect(entityTypes).toContain("CapaImplementation");
      expect(entityTypes).toContain("CapaEffectiveness");
      expect(entityTypes).toContain("ExtensionRequest");
    });

    it("4.3 Immutability & Audit Attributes: createAuditLog stores all required Part 11 attributes", async () => {
      const mockCreatedEntry = {
        id: "log_part11_01",
        orgId: ORG_ID,
        entityType: "Complaint",
        entityId: COMPLAINT_ID,
        action: AuditAction.UPDATE,
        changedById: USER_ID,
        previousData: { status: "OPEN" },
        newData: { status: "UNDER_INVESTIGATION" },
        reason: "Investigation initiated following triage review",
        complaintId: COMPLAINT_ID,
        timestamp: new Date("2026-09-13T10:00:00Z"),
      };

      mockPrisma.auditLog.create.mockResolvedValue(mockCreatedEntry);

      const result = await createAuditLog({
        orgId: ORG_ID,
        entityType: "Complaint",
        entityId: COMPLAINT_ID,
        action: AuditAction.UPDATE,
        changedById: USER_ID,
        previousData: { status: "OPEN" },
        newData: { status: "UNDER_INVESTIGATION" },
        reason: "Investigation initiated following triage review",
        complaintId: COMPLAINT_ID,
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            entityType: "Complaint",
            entityId: COMPLAINT_ID,
            action: AuditAction.UPDATE,
            changedById: USER_ID,
            previousData: { status: "OPEN" },
            newData: { status: "UNDER_INVESTIGATION" },
            reason: "Investigation initiated following triage review",
            complaintId: COMPLAINT_ID,
          }),
        })
      );
      expect(result).toEqual(mockCreatedEntry);
    });

    it("4.4 Fail-Closed Security: throws and aborts if audit logging fails to prevent unrecorded mutations", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockPrisma.auditLog.create.mockRejectedValue(new Error("Database write failed for audit log"));

      try {
        await expect(
          createAuditLog({
            orgId: ORG_ID,
            entityType: "Complaint",
            entityId: COMPLAINT_ID,
            action: AuditAction.UPDATE,
            changedById: USER_ID,
            reason: "Attempted change",
          })
        ).rejects.toThrow("Database write failed for audit log");
      } finally {
        consoleErrorSpy.mockRestore();
      }
    });
  });

  /* ========================================================================= */
  /* PART 5: AUDIT TRAIL & VIEW HISTORY INFORMATION SPECIFICATION              */
  /* ========================================================================= */

  describe("5. View History & Audit Trail Required Information Specification", () => {
    it("5.1 Recording Specification: records at least Record, Field, Old Value, New Value, Changed By, Date, and Reason for Complaint CMP-123", async () => {
      const johnSmithUserId = "user_john_smith";
      const complaintId = "cmp_123";
      mockAuthCtx.userId = johnSmithUserId;

      const existingRecord = {
        id: complaintId,
        orgId: ORG_ID,
        complaintNumber: "CMP-123",
        shortDescription: "Infusion pump volumetric error",
        priority: Priority.MEDIUM, // Old Value: Medium
        status: ComplaintStatus.OPEN,
        awarenessDate: new Date("2026-09-13T10:00:00Z"),
        dateReceived: new Date("2026-09-13T10:00:00Z"),
        customerName: "Memorial Clinic",
        customerType: "CLINIC",
        initialReporterName: "Nurse",
        initialReporterSurname: "Taylor",
        email: "nurse@memorial.org",
        address: "742 Evergreen Terrace",
        country: "US",
        telNumber: "555-0100",
        countryEventOccurred: "US",
        region: "AMER",
        death: Death.NO,
        productInformation: [],
        patientInformation: [],
        attachments: [],
      };

      mockTx.complaint.findUnique
        .mockResolvedValueOnce(existingRecord)
        .mockResolvedValueOnce({
          ...existingRecord,
          priority: Priority.HIGH,
        });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.complaint.update.mockResolvedValue({
        ...existingRecord,
        priority: Priority.HIGH, // New Value: High
      });

      // Execute update with specified reason: "Investigation revealed patient injury risk."
      await updateComplaintWithRelations({
        complaintId,
        shortDescription: "Infusion pump volumetric error",
        priority: Priority.HIGH,
        awarenessDate: new Date("2026-09-13T10:00:00Z").toISOString(),
        customerName: "Memorial Clinic",
        customerType: "CLINIC",
        initialReporterName: "Nurse",
        initialReporterSurname: "Taylor",
        email: "nurse@memorial.org",
        address: "742 Evergreen Terrace",
        country: "US",
        telNumber: "555-0100",
        countryEventOccurred: "US",
        region: "AMER",
        reason: "Investigation revealed patient injury risk.",
      });

      // Verify that mockTx.auditLog.create was invoked with all 7 required components
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            // 1. Record identifier
            entityType: "Complaint",
            entityId: complaintId,
            complaintId: complaintId,
            // 2. Action
            action: AuditAction.UPDATE,
            // 3. Changed By
            changedById: johnSmithUserId,
            // 4. Reason
            reason: "Investigation revealed patient injury risk.",
            // 5. Field Changes containing Field, Old Value (MEDIUM), New Value (HIGH)
            fieldChanges: expect.arrayContaining([
              expect.objectContaining({
                field: "priority",
                oldValue: "MEDIUM",
                newValue: "HIGH",
              }),
            ]),
            // 6. State snapshots
            previousData: expect.objectContaining({
              priority: Priority.MEDIUM,
            }),
            newData: expect.objectContaining({
              priority: Priority.HIGH,
            }),
          }),
        })
      );
    });

    it("5.2 View History Specification: getAuditHistory returns complete audit entry with Record, Changed By, Date, Reason, and Field diffs", async () => {
      const mockAuditLogEntry = {
        id: "log_exact_spec_001",
        orgId: ORG_ID,
        entityType: "Complaint",
        entityId: "cmp_123",
        complaintId: "cmp_123",
        action: AuditAction.UPDATE,
        // Changed By: John Smith
        changedById: "user_john_smith",
        changedBy: {
          firstName: "John",
          lastName: "Smith",
          email: "john.smith@arlo.io",
        },
        // Date: 2026-09-13 10:30 (UTC)
        timestamp: new Date("2026-09-13T10:30:00.000Z"),
        // Reason: Investigation revealed patient injury risk.
        reason: "Investigation revealed patient injury risk.",
        // Field: Severity (priority), Old Value: Medium, New Value: High
        fieldChanges: [
          {
            field: "priority",
            oldValue: "MEDIUM",
            newValue: "HIGH",
          },
        ],
        previousData: {
          complaintNumber: "CMP-123",
          priority: "MEDIUM",
        },
        newData: {
          complaintNumber: "CMP-123",
          priority: "HIGH",
        },
      };

      mockPrisma.auditLog.findMany.mockResolvedValue([mockAuditLogEntry]);

      const history = await getAuditHistory("Complaint", "cmp_123");

      expect(history).toHaveLength(1);
      const entry = history[0];

      // 1. Record
      expect(entry.entityType).toBe("Complaint");
      expect(entry.complaintId).toBe("cmp_123");
      expect((entry.newData as any).complaintNumber).toBe("CMP-123");

      // 2. Changed By
      expect(entry.changedBy.firstName).toBe("John");
      expect(entry.changedBy.lastName).toBe("Smith");

      // 3. Date
      const dateIso = entry.timestamp.toISOString();
      expect(dateIso).toContain("2026-09-13T10:30");

      // 4. Reason
      expect(entry.reason).toBe("Investigation revealed patient injury risk.");

      // 5. Field, Old Value, New Value
      expect(entry.fieldChanges).toEqual([
        {
          field: "priority",
          oldValue: "MEDIUM",
          newValue: "HIGH",
        },
      ]);
    });

    it("5.3 Sub-Records & CAPA Audit Trail Specification: records and returns all required metadata for sub-records and CAPA", async () => {
      const mockSubRecordAndCapaLogs = [
        {
          id: "log_sub_inv_001",
          entityType: "Investigation",
          entityId: "inv_123",
          complaintId: "cmp_123",
          action: AuditAction.UPDATE,
          changedById: "user_john_smith",
          changedBy: { firstName: "John", lastName: "Smith", email: "john@arlo.io" },
          timestamp: new Date("2026-09-13T10:30:00.000Z"),
          reason: "Investigation revealed patient injury risk.",
          fieldChanges: [
            {
              field: "riskReviewRequired",
              oldValue: false,
              newValue: true,
            },
          ],
        },
        {
          id: "log_capa_001",
          entityType: "Capa",
          entityId: "capa_456",
          capaId: "capa_456",
          action: AuditAction.UPDATE,
          changedById: "user_john_smith",
          changedBy: { firstName: "John", lastName: "Smith", email: "john@arlo.io" },
          timestamp: new Date("2026-09-13T10:30:00.000Z"),
          reason: "Investigation revealed patient injury risk.",
          fieldChanges: [
            {
              field: "type",
              oldValue: "PREVENTIVE",
              newValue: "CORRECTIVE",
            },
          ],
          newData: {
            capaNumber: "CAPA-2026-0001",
          },
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockSubRecordAndCapaLogs);

      const history = await getAuditHistory("Complaint", "cmp_123");

      expect(history).toHaveLength(2);
      history.forEach((h: any) => {
        expect(h.changedBy.firstName).toBe("John");
        expect(h.changedBy.lastName).toBe("Smith");
        expect(h.reason).toBe("Investigation revealed patient injury risk.");
        expect(h.timestamp.toISOString()).toContain("2026-09-13T10:30");
        expect(h.fieldChanges.length).toBeGreaterThan(0);
        expect(h.fieldChanges[0]).toHaveProperty("field");
        expect(h.fieldChanges[0]).toHaveProperty("oldValue");
        expect(h.fieldChanges[0]).toHaveProperty("newValue");
      });
    });

    it("5.4 Relational ID Protection: updating CAPA does not mark capaId, investigationId, id, or empty attachments as changed", async () => {
      const existingCapaWithRelations = {
        id: "capa_rel_001",
        orgId: ORG_ID,
        capaNumber: "CAPA-2026-0001",
        shortDescription: "Plunger barrel cavity tooling replacement",
        type: CapaType.CORRECTIVE,
        currentPhase: CapaPhase.INVESTIGATION,
        ownerId: USER_ID,
        cancellationRequested: false,
        cancellationJustification: null,
        createdAt: new Date("2026-09-01T00:00:00Z"),
        updatedAt: new Date("2026-09-01T00:00:00Z"),
        initiation: {
          id: "init_001",
          orgId: ORG_ID,
          capaId: "capa_rel_001",
          problemStatement: "Plunger elastomer formulation out of tolerance",
          repeatCapa: false,
          existingCapa: false,
          capaRequired: true,
          fscaRequired: false,
          attachments: null,
        },
        investigation: {
          id: "inv_001",
          orgId: ORG_ID,
          capaId: "capa_rel_001",
          rootCauseTools: ["5 Whys Analysis"],
          attachments: null,
        },
        implementation: {
          id: "imp_001",
          orgId: ORG_ID,
          capaId: "capa_rel_001",
          actionPlan: "Tooling replacement in cavity 2",
          attachments: null,
        },
        effectiveness: null,
      };

      mockTx.capa.findUnique.mockResolvedValue(existingCapaWithRelations);
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.capa.update.mockResolvedValue({
        ...existingCapaWithRelations,
      });

      // User updates investigation root cause tools, and form sends empty attachments []
      await updateCapa("capa_rel_001", {
        shortDescription: "Plunger barrel cavity tooling replacement",
        type: CapaType.CORRECTIVE,
        currentPhase: CapaPhase.INVESTIGATION,
        ownerId: USER_ID,
        cancellationRequested: false,
        initiation: {
          problemStatement: "Plunger elastomer formulation out of tolerance",
          repeatCapa: false,
          existingCapa: false,
          capaRequired: true,
          fscaRequired: false,
          attachments: [], // Empty array from form should match null/none
        },
        investigation: {
          rootCauseTools: ["Fishbone / Ishikawa Diagram", "Is / Is Not Comparative Analysis"],
          attachments: [], // Empty array from form
        },
        implementation: {
          actionPlan: "Tooling replacement in cavity 2",
          attachments: [],
        },
      } as any);

      expect(mockTx.auditLog.create).toHaveBeenCalled();
      const auditLogCall = mockTx.auditLog.create.mock.calls.find(
        (call: any) => call[0]?.data?.entityId === "capa_rel_001"
      );
      expect(auditLogCall).toBeDefined();
      const fieldChanges = auditLogCall[0].data.fieldChanges as Array<{ field: string; oldValue: any; newValue: any }>;

      // 1. None of the top-level changes should be capaId, investigationId, or id
      const changedFieldNames = fieldChanges.map((f) => f.field);
      expect(changedFieldNames).not.toContain("capaId");
      expect(changedFieldNames).not.toContain("investigationId");
      expect(changedFieldNames).not.toContain("id");
      expect(changedFieldNames).not.toContain("initiation"); // Initiation has no changes (problemStatement identical, attachments null vs [])
      expect(changedFieldNames).not.toContain("implementation"); // Implementation identical

      // 2. Investigation was changed: verify inner diff does NOT have capaId or attachments (none vs [])
      const invDiff = fieldChanges.find((f) => f.field === "investigation");
      expect(invDiff).toBeDefined();
      expect(invDiff?.oldValue).not.toHaveProperty("capaId");
      expect(invDiff?.newValue).not.toHaveProperty("capaId");
      expect(invDiff?.oldValue).not.toHaveProperty("id");
      expect(invDiff?.newValue).not.toHaveProperty("id");
      expect(invDiff?.oldValue).toHaveProperty("rootCauseTools", ["5 Whys Analysis"]);
      expect(invDiff?.newValue).toHaveProperty("rootCauseTools", [
        "Fishbone / Ishikawa Diagram",
        "Is / Is Not Comparative Analysis",
      ]);
    });
  });
});
