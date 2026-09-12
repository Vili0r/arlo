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
  LockEntityType,
  Priority,
  SampleStatus,
} from "@prisma/client";

const { mockVerifyPassword, mockAuth, mockAuthCtx, mockTx, mockPrisma } = vi.hoisted(() => {
  const verifyPassword = vi.fn();
  const authCtx = {
    userId: "user_qa_lead_1",
    orgId: "org_test456",
    orgRole: "org:admin",
  };
  const authFn = vi.fn().mockResolvedValue({
    userId: "user_qa_lead_1",
    orgId: "org_test456",
    orgRole: "org:admin",
    has: () => true,
  });

  const tx = {
    complaint: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    investigation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    investigationSummary: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    vigilanceDecisionTree: {
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
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    complaintTask: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    sampleManagement: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    capa: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    capaInitiation: {
      upsert: vi.fn(),
      create: vi.fn(),
    },
    capaInvestigation: {
      upsert: vi.fn(),
      create: vi.fn(),
    },
    capaImplementation: {
      upsert: vi.fn(),
      create: vi.fn(),
    },
    capaEffectiveness: {
      upsert: vi.fn(),
      create: vi.fn(),
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

// Mock dependencies
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

import { getAuditHistory } from "@/lib/actions/audit";
import { updateComplaintWithRelations, updateSampleManagement } from "@/lib/actions/complaints";
import { updateInvestigation } from "@/lib/actions/investigations";
import { saveInvestigationSummaryDraft } from "@/lib/actions/investigation-summary";
import { updateVigilance } from "@/lib/actions/vigilance";
import { updateInitialMIR, updateFinalMIR } from "@/lib/actions/mir";
import { updateCustomerCommunication } from "@/lib/actions/communication";
import { updateComplaintTask } from "@/lib/actions/task";
import { updateCapa } from "@/lib/actions/capa";
import { executeStatusTransition } from "@/lib/actions/esignature";

describe("View History & Audit Trail Logging - Complaint Sub-Folders & CAPA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthCtx.userId = "user_qa_lead_1";
    mockAuthCtx.orgId = "org_test456";
    mockAuth.mockResolvedValue({
      userId: "user_qa_lead_1",
      orgId: "org_test456",
      orgRole: "org:admin",
      has: () => true,
    });
  });

  const COMPLAINT_ID = "cmp_audit_100";
  const CAPA_ID = "capa_audit_200";

  /* ========================================================================= */
  /* 1. COMPLAINT & ALL SUB-FOLDERS AUDIT LOGGING VERIFICATION                 */
  /* ========================================================================= */

  describe("Complaint File and Sub-Folder Audit Trail Logging", () => {
    it("1. Complaint Main File: updateComplaintWithRelations logs audit entry with complaintId", async () => {
      const existingComplaint = {
        id: COMPLAINT_ID,
        orgId: "org_test456",
        complaintNumber: "CMP-2026-0100",
        shortDescription: "Original complaint description",
        priority: Priority.LOW,
        status: ComplaintStatus.OPEN,
        awarenessDate: new Date("2026-08-01T00:00:00Z"),
        dateReceived: new Date("2026-08-01T00:00:00Z"),
        productInformation: [],
        patientInformation: [],
        attachments: [],
      };

      mockTx.complaint.findUnique.mockResolvedValue(existingComplaint);
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.complaint.update.mockResolvedValue({
        ...existingComplaint,
        shortDescription: "Updated complaint description with new serial batch info",
      });

      await updateComplaintWithRelations({
        complaintId: COMPLAINT_ID,
        shortDescription: "Updated complaint description with new serial batch info",
        priority: Priority.HIGH,
        awarenessDate: new Date("2026-08-01T00:00:00Z").toISOString(),
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "Complaint",
            entityId: COMPLAINT_ID,
            action: AuditAction.UPDATE,
            changedById: "user_qa_lead_1",
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("2. Complaint Status Transition: executeStatusTransition logs AuditAction.STATUS_CHANGE with complaintId", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.complaint.findUnique.mockResolvedValue({
        id: COMPLAINT_ID,
        orgId: "org_test456",
        status: ComplaintStatus.OPEN,
        awarenessDate: new Date("2026-08-01T00:00:00Z"),
        dateReceived: new Date("2026-08-01T00:00:00Z"),
      });
      mockTx.complaint.update.mockResolvedValue({
        id: COMPLAINT_ID,
        orgId: "org_test456",
        status: ComplaintStatus.IN_PROGRESS,
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", COMPLAINT_ID);
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidPass2026!");
      formData.set("meaningOfSignature", "I approve moving complaint to In Progress");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "Complaint",
            entityId: COMPLAINT_ID,
            action: AuditAction.STATUS_CHANGE,
            changedById: "user_qa_lead_1",
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("3. Investigation Sub-folder: updateInvestigation logs audit entry with complaintId", async () => {
      const existingInv = {
        id: "inv_audit_1",
        orgId: "org_test456",
        complaintId: COMPLAINT_ID,
        status: InvestigationStatus.IN_PROGRESS,
        investigatorId: "user_investigator_1",
        sampleAnalysisRequired: false,
        riskReviewRequired: false,
        capaRequired: false,
        fscaRequired: false,
        reportabilityReviewRequired: false,
        attachments: [],
        customSections: [],
      };

      mockTx.investigation.findUnique.mockResolvedValue(existingInv);
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.investigation.update.mockResolvedValue({
        ...existingInv,
        sampleAnalysisRequired: true,
      });

      await updateInvestigation({
        id: "inv_audit_1",
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
            orgId: "org_test456",
            entityType: "Investigation",
            entityId: "inv_audit_1",
            action: AuditAction.UPDATE,
            changedById: "user_qa_lead_1",
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("4. Investigation Summary: saveInvestigationSummaryDraft logs audit entry with complaintId", async () => {
      mockTx.investigation.findUnique.mockResolvedValue({
        id: "inv_audit_1",
        complaintId: COMPLAINT_ID,
        status: "IN_PROGRESS",
      });
      mockTx.investigationSummary.findUnique.mockResolvedValue(null);
      mockTx.investigationSummary.upsert.mockResolvedValue({
        id: "inv_summary_1",
        investigationId: "inv_audit_1",
        summary: "Root cause determined as component fatigue",
      });

      await saveInvestigationSummaryDraft({
        investigationId: "inv_audit_1",
        summary: "Root cause determined as component fatigue",
        report: "Full teardown report",
        capaRequired: true,
        capaRef: "CAPA-2026-001",
        fscaRequired: false,
        fscaRef: null,
        capaFscaRationale: "Corrective tooling required",
        reportabilityReviewRequired: true,
        notes: null,
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "InvestigationSummary",
            entityId: "inv_summary_1",
            changedById: "user_qa_lead_1",
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("5. Vigilance Sub-folder: updateVigilance logs audit entry with complaintId", async () => {
      mockTx.vigilanceDecisionTree.findUnique.mockResolvedValue({
        id: "vig_audit_1",
        orgId: "org_test456",
        complaintId: COMPLAINT_ID,
        status: VigilanceStatus.PENDING,
        attachments: [],
      });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.vigilanceDecisionTree.update.mockResolvedValue({
        id: "vig_audit_1",
        complaintId: COMPLAINT_ID,
        status: VigilanceStatus.REPORTABLE,
        reportable: true,
      });

      await updateVigilance({
        id: "vig_audit_1",
        orgSlug: "test-org",
        status: VigilanceStatus.REPORTABLE,
        reportable: true,
        rationale: "Adverse event criteria met under MDR Annex I",
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "VigilanceDecisionTree",
            entityId: "vig_audit_1",
            action: AuditAction.UPDATE,
            changedById: "user_qa_lead_1",
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("6. Initial MIR Sub-folder: updateInitialMIR logs audit entry with complaintId", async () => {
      mockTx.initialMIR.findUnique.mockResolvedValue({
        id: "imir_audit_1",
        orgId: "org_test456",
        complaintId: COMPLAINT_ID,
        status: MIRStatus.DRAFT,
      });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.initialMIR.update.mockResolvedValue({
        id: "imir_audit_1",
        complaintId: COMPLAINT_ID,
        status: MIRStatus.DRAFT,
        submissionCountry: "DE",
      });

      await updateInitialMIR("imir_audit_1", {
        submissionCountry: "DE",
        mirNumber: "MIR-2026-0001",
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "InitialMIR",
            entityId: "imir_audit_1",
            action: AuditAction.UPDATE,
            changedById: "user_qa_lead_1",
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("7. Final MIR Sub-folder: updateFinalMIR logs audit entry with complaintId", async () => {
      mockTx.finalMIR.findUnique.mockResolvedValue({
        id: "fmir_audit_1",
        orgId: "org_test456",
        complaintId: COMPLAINT_ID,
        status: MIRStatus.DRAFT,
      });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.finalMIR.update.mockResolvedValue({
        id: "fmir_audit_1",
        complaintId: COMPLAINT_ID,
        status: MIRStatus.DRAFT,
        incidentConfirmed: true,
      });

      await updateFinalMIR("fmir_audit_1", {
        incidentConfirmed: true,
        manufacturerConclusion: "Issue resolved permanently via CAPA-2026-001",
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "FinalMIR",
            entityId: "fmir_audit_1",
            action: AuditAction.UPDATE,
            changedById: "user_qa_lead_1",
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("8. Customer Communication Sub-folder: updateCustomerCommunication logs audit entry with complaintId", async () => {
      mockTx.customerCommunication.findUnique.mockResolvedValue({
        id: "comm_audit_1",
        orgId: "org_test456",
        complaintId: COMPLAINT_ID,
        status: CommunicationStatus.OPEN,
        questionAsked: "Initial inquiry",
        attachments: [],
        author: { email: "author@arlo.io" },
      });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.customerCommunication.update.mockResolvedValue({});

      // Mock subsequent findUnique for diffing
      mockTx.customerCommunication.findUnique.mockResolvedValueOnce({
        id: "comm_audit_1",
        orgId: "org_test456",
        complaintId: COMPLAINT_ID,
        status: CommunicationStatus.OPEN,
        questionAsked: "Initial inquiry",
        attachments: [],
        author: { email: "author@arlo.io" },
      }).mockResolvedValueOnce({
        id: "comm_audit_1",
        orgId: "org_test456",
        complaintId: COMPLAINT_ID,
        status: CommunicationStatus.OPEN,
        questionAsked: "Initial inquiry",
        customerResponse: "Hospital confirmed patient recovered without intervention",
        attachments: [],
        author: { email: "author@arlo.io" },
      });

      await updateCustomerCommunication({
        communicationId: "comm_audit_1",
        customerResponse: "Hospital confirmed patient recovered without intervention",
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "CustomerCommunication",
            entityId: "comm_audit_1",
            action: AuditAction.UPDATE,
            changedById: "user_qa_lead_1",
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("9. Tasks Sub-folder: updateComplaintTask logs audit entry with complaintId", async () => {
      mockTx.complaintTask.findUnique.mockResolvedValue({
        id: "task_audit_1",
        orgId: "org_test456",
        complaintId: COMPLAINT_ID,
        shortDescription: "Inspect retain batch samples",
        status: TaskStatus.OPEN,
        attachments: [],
        originator: { email: "orig@arlo.io" },
        assignedTo: { email: "assignee@arlo.io" },
      });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.complaintTask.update.mockResolvedValue({});

      mockTx.complaintTask.findUnique.mockResolvedValueOnce({
        id: "task_audit_1",
        orgId: "org_test456",
        complaintId: COMPLAINT_ID,
        shortDescription: "Inspect retain batch samples",
        status: TaskStatus.OPEN,
        attachments: [],
        originator: { email: "orig@arlo.io" },
        assignedTo: { email: "assignee@arlo.io" },
      }).mockResolvedValueOnce({
        id: "task_audit_1",
        orgId: "org_test456",
        complaintId: COMPLAINT_ID,
        shortDescription: "Inspect retain batch samples",
        status: TaskStatus.CLOSED,
        attachments: [],
        originator: { email: "orig@arlo.io" },
        assignedTo: { email: "assignee@arlo.io" },
      });

      await updateComplaintTask({
        id: "task_audit_1",
        orgSlug: "test-org",
        status: TaskStatus.CLOSED,
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "ComplaintTask",
            entityId: "task_audit_1",
            action: AuditAction.STATUS_CHANGE,
            changedById: "user_qa_lead_1",
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("10. Sample Management Sub-folder: updateSampleManagement logs audit entry with complaintId", async () => {
      mockTx.sampleManagement.findUnique.mockResolvedValue({
        id: "sample_audit_1",
        orgId: "org_test456",
        complaintId: COMPLAINT_ID,
        sampleAvailable: true,
        status: SampleStatus.PENDING,
      });
      mockTx.sampleManagement.upsert.mockResolvedValue({
        id: "sample_audit_1",
        orgId: "org_test456",
        complaintId: COMPLAINT_ID,
        status: SampleStatus.RECEIVED,
        sampleAvailable: true,
      });

      await updateSampleManagement({
        complaintId: COMPLAINT_ID,
        sampleAvailable: true,
        status: SampleStatus.RECEIVED,
        trackingDetails: "FedEx 123456789",
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "SampleManagement",
            entityId: "sample_audit_1",
            action: AuditAction.UPDATE,
            changedById: "user_qa_lead_1",
            complaintId: COMPLAINT_ID,
          }),
        })
      );
    });

    it("11. View History Drawer Query: getAuditHistory('Complaint', complaintId) aggregates and returns all sub-folder logs", async () => {
      const mockAggregatedSubfolderLogs = [
        {
          id: "log_1",
          entityType: "Complaint",
          entityId: COMPLAINT_ID,
          action: AuditAction.STATUS_CHANGE,
          reason: "Complaint moved to Closed",
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-02T16:00:00Z"),
          changedBy: { firstName: "QA", lastName: "Lead", email: "qa@arlo.io" },
        },
        {
          id: "log_2",
          entityType: "FinalMIR",
          entityId: "fmir_audit_1",
          action: AuditAction.STATUS_CHANGE,
          reason: "Final MIR submitted to authority",
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-02T15:30:00Z"),
          changedBy: { firstName: "Sarah", lastName: "Connor", email: "sarah@arlo.io" },
        },
        {
          id: "log_3",
          entityType: "InitialMIR",
          entityId: "imir_audit_1",
          action: AuditAction.UPDATE,
          reason: "Updated Initial MIR report",
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-02T14:00:00Z"),
          changedBy: { firstName: "Sarah", lastName: "Connor", email: "sarah@arlo.io" },
        },
        {
          id: "log_4",
          entityType: "Investigation",
          entityId: "inv_audit_1",
          action: AuditAction.STATUS_CHANGE,
          reason: "Investigation completed and signed",
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-02T12:00:00Z"),
          changedBy: { firstName: "Mark", lastName: "Spencer", email: "mark@arlo.io" },
        },
        {
          id: "log_5",
          entityType: "InvestigationSummary",
          entityId: "inv_summary_1",
          action: AuditAction.UPDATE,
          reason: "Saved draft of Investigation Summary",
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-02T11:00:00Z"),
          changedBy: { firstName: "Mark", lastName: "Spencer", email: "mark@arlo.io" },
        },
        {
          id: "log_6",
          entityType: "VigilanceDecisionTree",
          entityId: "vig_audit_1",
          action: AuditAction.UPDATE,
          reason: "Updated vigilance decision tree assessment",
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-01T15:00:00Z"),
          changedBy: { firstName: "Sarah", lastName: "Connor", email: "sarah@arlo.io" },
        },
        {
          id: "log_7",
          entityType: "CustomerCommunication",
          entityId: "comm_audit_1",
          action: AuditAction.UPDATE,
          reason: "Updated customer communication record",
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-01T14:00:00Z"),
          changedBy: { firstName: "Alex", lastName: "Smith", email: "alex@arlo.io" },
        },
        {
          id: "log_8",
          entityType: "ComplaintTask",
          entityId: "task_audit_1",
          action: AuditAction.STATUS_CHANGE,
          reason: "Task completed",
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-01T13:00:00Z"),
          changedBy: { firstName: "Alex", lastName: "Smith", email: "alex@arlo.io" },
        },
        {
          id: "log_9",
          entityType: "SampleManagement",
          entityId: "sample_audit_1",
          action: AuditAction.UPDATE,
          reason: "Sample marked received",
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-01T11:00:00Z"),
          changedBy: { firstName: "Sam", lastName: "Logistics", email: "sam@arlo.io" },
        },
        {
          id: "log_10",
          entityType: "Complaint",
          entityId: COMPLAINT_ID,
          action: AuditAction.CREATE,
          reason: "Complaint logged into system",
          complaintId: COMPLAINT_ID,
          timestamp: new Date("2026-09-01T09:00:00Z"),
          changedBy: { firstName: "Alex", lastName: "Smith", email: "alex@arlo.io" },
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockAggregatedSubfolderLogs);

      const history = await getAuditHistory("Complaint", COMPLAINT_ID);

      // Verify OR query catches main complaint AND all sub-folders via complaintId
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          orgId: "org_test456",
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

      // Verify that all 10 logs from every single sub-folder are returned
      expect(history).toHaveLength(10);
      const entityTypesInHistory = history.map((h: any) => h.entityType);
      expect(entityTypesInHistory).toContain("Complaint");
      expect(entityTypesInHistory).toContain("FinalMIR");
      expect(entityTypesInHistory).toContain("InitialMIR");
      expect(entityTypesInHistory).toContain("Investigation");
      expect(entityTypesInHistory).toContain("InvestigationSummary");
      expect(entityTypesInHistory).toContain("VigilanceDecisionTree");
      expect(entityTypesInHistory).toContain("CustomerCommunication");
      expect(entityTypesInHistory).toContain("ComplaintTask");
      expect(entityTypesInHistory).toContain("SampleManagement");
    });
  });

  /* ========================================================================= */
  /* 2. CAPA & ALL SUB-SECTIONS / PHASES AUDIT LOGGING VERIFICATION            */
  /* ========================================================================= */

  describe("CAPA File and Sub-Section Audit Trail Logging", () => {
    it("1. CAPA Record Update: updateCapa logs AuditAction.UPDATE with capaId and phase diffs", async () => {
      const existingCapa = {
        id: CAPA_ID,
        orgId: "org_test456",
        capaNumber: "CAPA-2026-0001",
        shortDescription: "Initial CAPA problem definition",
        type: CapaType.CORRECTIVE,
        currentPhase: CapaPhase.INITIATION,
        ownerId: "user_qa_lead_1",
        cancellationRequested: false,
        cancellationJustification: null,
        initiation: {
          problemStatement: "Initial statement",
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
        shortDescription: "Revised CAPA: tooling recalibration",
      });

      await updateCapa(CAPA_ID, {
        shortDescription: "Revised CAPA: tooling recalibration",
        type: CapaType.CORRECTIVE,
        currentPhase: CapaPhase.INITIATION,
        ownerId: "user_qa_lead_1",
        cancellationRequested: false,
        initiation: {
          problemStatement: "Detailed root cause analysis across batch 402",
          repeatCapa: false,
          existingCapa: false,
          capaRequired: true,
          fscaRequired: false,
        },
      } as any);

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "Capa",
            entityId: CAPA_ID,
            action: AuditAction.UPDATE,
            changedById: "user_qa_lead_1",
            capaId: CAPA_ID,
            reason: "CAPA record and phase details updated",
          }),
        })
      );
    });

    it("2. CAPA Phase Transition: executeStatusTransition logs AuditAction.STATUS_CHANGE with capaId", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.capa.findUnique.mockResolvedValue({
        id: CAPA_ID,
        orgId: "org_test456",
        currentPhase: CapaPhase.INITIATION,
      });
      mockTx.capa.update.mockResolvedValue({
        id: CAPA_ID,
        orgId: "org_test456",
        currentPhase: CapaPhase.INVESTIGATION,
      });

      const formData = new FormData();
      formData.set("entityType", "Capa");
      formData.set("entityId", CAPA_ID);
      formData.set("newStatus", "INVESTIGATION");
      formData.set("password", "ValidPass2026!");
      formData.set("meaningOfSignature", "I approve initiating CAPA investigation phase.");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "Capa",
            entityId: CAPA_ID,
            action: AuditAction.STATUS_CHANGE,
            changedById: "user_qa_lead_1",
          }),
        })
      );
    });

    it("3. View History Drawer Query: getAuditHistory('Capa', capaId) aggregates and returns all CAPA phase logs", async () => {
      const mockCapaHistoryLogs = [
        {
          id: "capa_log_1",
          entityType: "Capa",
          entityId: CAPA_ID,
          action: AuditAction.STATUS_CHANGE,
          reason: "E-SIGNATURE STATUS CHANGE: EFFECTIVENESS → CLOSED",
          capaId: CAPA_ID,
          timestamp: new Date("2026-09-10T16:00:00Z"),
          changedBy: { firstName: "QA", lastName: "Director", email: "director@arlo.io" },
        },
        {
          id: "capa_log_2",
          entityType: "CapaEffectiveness",
          entityId: "eff_1",
          action: AuditAction.UPDATE,
          reason: "Effectiveness check confirmed zero defect recurrence over 30 days",
          capaId: CAPA_ID,
          timestamp: new Date("2026-09-08T14:00:00Z"),
          changedBy: { firstName: "John", lastName: "Validator", email: "john@arlo.io" },
        },
        {
          id: "capa_log_3",
          entityType: "ExtensionRequest",
          entityId: "ext_1",
          action: AuditAction.CREATE,
          reason: "Requested 14-day extension for supplier tooling delivery",
          capaId: CAPA_ID,
          timestamp: new Date("2026-09-05T10:00:00Z"),
          changedBy: { firstName: "Mark", lastName: "Engineer", email: "mark@arlo.io" },
        },
        {
          id: "capa_log_4",
          entityType: "CapaImplementation",
          entityId: "imp_1",
          action: AuditAction.UPDATE,
          reason: "Action plan implemented and SOP updated",
          capaId: CAPA_ID,
          timestamp: new Date("2026-09-04T11:00:00Z"),
          changedBy: { firstName: "Mark", lastName: "Engineer", email: "mark@arlo.io" },
        },
        {
          id: "capa_log_5",
          entityType: "CapaInvestigation",
          entityId: "inv_capa_1",
          action: AuditAction.UPDATE,
          reason: "Root cause 5-Why analysis completed",
          capaId: CAPA_ID,
          timestamp: new Date("2026-09-03T15:00:00Z"),
          changedBy: { firstName: "Mark", lastName: "Engineer", email: "mark@arlo.io" },
        },
        {
          id: "capa_log_6",
          entityType: "CapaInitiation",
          entityId: "init_1",
          action: AuditAction.UPDATE,
          reason: "Problem statement and risk review completed",
          capaId: CAPA_ID,
          timestamp: new Date("2026-09-02T09:00:00Z"),
          changedBy: { firstName: "QA", lastName: "Lead", email: "qa@arlo.io" },
        },
        {
          id: "capa_log_7",
          entityType: "Capa",
          entityId: CAPA_ID,
          action: AuditAction.CREATE,
          reason: "Created CAPA CAPA-2026-0001",
          capaId: CAPA_ID,
          timestamp: new Date("2026-09-01T08:00:00Z"),
          changedBy: { firstName: "QA", lastName: "Lead", email: "qa@arlo.io" },
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockCapaHistoryLogs);

      const history = await getAuditHistory("Capa", CAPA_ID);

      // Verify Capa OR query captures Capa entity and all phase entities
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          orgId: "org_test456",
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

      expect(history).toHaveLength(7);
      const entityTypesInCapaHistory = history.map((h: any) => h.entityType);
      expect(entityTypesInCapaHistory).toContain("Capa");
      expect(entityTypesInCapaHistory).toContain("CapaInitiation");
      expect(entityTypesInCapaHistory).toContain("CapaInvestigation");
      expect(entityTypesInCapaHistory).toContain("CapaImplementation");
      expect(entityTypesInCapaHistory).toContain("CapaEffectiveness");
      expect(entityTypesInCapaHistory).toContain("ExtensionRequest");
    });
  });
});
