import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AuditAction,
  ComplaintStatus,
  InvestigationStatus,
  VigilanceStatus,
  CommunicationStatus,
  TaskStatus,
  MIRStatus,
} from "@prisma/client";

const { mockVerifyPassword, mockAuth, mockTx } = vi.hoisted(() => {
  const verifyPassword = vi.fn();
  const authFn = vi.fn().mockResolvedValue({
    userId: "user_qa_manager_1",
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
    recordLock: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };

  return {
    mockVerifyPassword: verifyPassword,
    mockAuth: authFn,
    mockTx: tx,
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
  requireOrgAuth: vi.fn().mockResolvedValue({
    userId: "user_qa_manager_1",
    orgId: "org_test456",
  }),
  ROLES: {
    ADMIN: "org:admin",
    QA_MANAGER: "org:qa_manager",
  },
  PERMISSIONS: {
    COMPLAINTS_APPROVE_CLOSE: "org:complaints:approve_close",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(mockTx)),
  },
}));

import { executeStatusTransition } from "@/lib/actions/esignature";

/**
 * @traceability
 * URS: URS-004 (Vigilance Decision Tree & Regulatory Incident Reporting)
 * SRS: SRS-010 (MIR Subfolder Lifecycle & Closure Validation)
 * Design: DESIGN-010 (MIR Lifecycle Controller)
 * Test ID: TEST-009
 */
describe("[TEST-009] MIR Sub-Folder Lifecycle & Complaint Closure Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseComplaint = {
    id: "cmp_100",
    orgId: "org_test456",
    complaintNumber: "CMP-2026-0100",
    status: ComplaintStatus.OPEN,
    awarenessDate: new Date("2026-08-01T00:00:00Z"),
    dateReceived: new Date("2026-08-01T00:00:00Z"),
  };

  const baseVigilance = {
    id: "vig_100",
    orgId: "org_test456",
    complaintId: "cmp_100",
    status: VigilanceStatus.PENDING,
    decision: null,
  };

  const baseCompletedInvestigation = {
    id: "inv_100",
    orgId: "org_test456",
    complaintId: "cmp_100",
    status: InvestigationStatus.UNDER_REVIEW,
    investigatorId: "user_investigator_1",
    sampleAnalysisRequired: false,
    sampleAnalysisExemptRationale: "No physical retain units available.",
    riskReviewRequired: false,
    riskReviewExemptRationale: "Known risk profile covered in hazard analysis.",
    investigationSummaryCompletedById: "user_investigator_1",
    investigationSummaryCompletedAt: new Date("2026-08-20T00:00:00Z"),
    summary: {
      id: "summary_100",
      investigationId: "inv_100",
      completedById: "user_investigator_1",
      completedAt: new Date("2026-08-20T00:00:00Z"),
      summary: "Root cause identified as supplier component variation.",
      report: "Comprehensive laboratory testing report completed.",
      capaFscaRationale: "CAPA-2026-099 initiated with supplier.",
      imdrfCodes: [
        { annex: "ANNEX_B", code: "B01", term: "Break" },
        { annex: "ANNEX_C", code: "C01", term: "Stress Cracking" },
        { annex: "ANNEX_D", code: "D01", term: "Material Defect" },
        { annex: "ANNEX_G", code: "G01", term: "Supplier Quality" },
      ],
    },
    customSections: [],
  };

  /* ========================================================================= */
  /* 1. INITIAL MIR AUTO-CREATION ON REPORTABLE VIGILANCE                     */
  /* ========================================================================= */

  describe("Automatic Creation of Initial MIR when Vigilance is marked REPORTABLE", () => {
    it("should automatically create an Initial MIR draft sub-folder when vigilance is transitioned to REPORTABLE", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.vigilanceDecisionTree.findUnique.mockResolvedValue(baseVigilance);

      mockTx.vigilanceDecisionTree.update.mockResolvedValue({
        ...baseVigilance,
        status: VigilanceStatus.REPORTABLE,
      });

      // Mock that Initial MIR does NOT exist yet
      mockTx.initialMIR.findUnique.mockResolvedValue(null);
      const newlyCreatedMIR = {
        id: "imir_auto_1",
        orgId: "org_test456",
        complaintId: "cmp_100",
        status: "DRAFT",
        reportType: "INITIAL",
      };
      mockTx.initialMIR.create.mockResolvedValue(newlyCreatedMIR);
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_auto_imir" });

      const formData = new FormData();
      formData.set("entityType", "Vigilance");
      formData.set("entityId", "vig_100");
      formData.set("newStatus", "REPORTABLE");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "I confirm reportability determination under EU MDR Article 87.");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("REPORTABLE");

      // Verify Initial MIR query was executed
      expect(mockTx.initialMIR.findUnique).toHaveBeenCalledWith({
        where: { complaintId: "cmp_100" },
      });

      // Verify Initial MIR was created with default DRAFT & INITIAL values
      expect(mockTx.initialMIR.create).toHaveBeenCalledWith({
        data: {
          orgId: "org_test456",
          complaintId: "cmp_100",
          status: "DRAFT",
          reportType: "INITIAL",
        },
      });

      // Verify Audit Log was generated for newly created Initial MIR sub-folder
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "InitialMIR",
            entityId: "imir_auto_1",
            action: AuditAction.CREATE,
            changedById: "user_qa_manager_1",
            reason: "Initial MIR record created upon Reportable Vigilance determination",
            complaintId: "cmp_100",
          }),
        })
      );
    });

    it("should NOT create a duplicate Initial MIR if one already exists for the complaint", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.vigilanceDecisionTree.findUnique.mockResolvedValue(baseVigilance);

      mockTx.vigilanceDecisionTree.update.mockResolvedValue({
        ...baseVigilance,
        status: VigilanceStatus.REPORTABLE,
      });

      // Initial MIR already exists
      mockTx.initialMIR.findUnique.mockResolvedValue({
        id: "imir_existing_1",
        orgId: "org_test456",
        complaintId: "cmp_100",
        status: "DRAFT",
        reportType: "INITIAL",
      });

      const formData = new FormData();
      formData.set("entityType", "Vigilance");
      formData.set("entityId", "vig_100");
      formData.set("newStatus", "REPORTABLE");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "Confirm reportability");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(mockTx.initialMIR.findUnique).toHaveBeenCalledWith({
        where: { complaintId: "cmp_100" },
      });
      // Duplicate protection: create must NOT be called
      expect(mockTx.initialMIR.create).not.toHaveBeenCalled();
    });

    it("should NOT create Initial MIR when vigilance is determined NOT_REPORTABLE", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.vigilanceDecisionTree.findUnique.mockResolvedValue(baseVigilance);

      mockTx.vigilanceDecisionTree.update.mockResolvedValue({
        ...baseVigilance,
        status: VigilanceStatus.NOT_REPORTABLE,
      });

      const formData = new FormData();
      formData.set("entityType", "Vigilance");
      formData.set("entityId", "vig_100");
      formData.set("newStatus", "NOT_REPORTABLE");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "Confirm non-reportable incident");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(mockTx.initialMIR.create).not.toHaveBeenCalled();
    });
  });

  /* ========================================================================= */
  /* 2. FINAL MIR AUTO-CREATION ON INVESTIGATION CLOSURE                     */
  /* ========================================================================= */

  describe("Automatic Creation of Final MIR when Investigation Sub-folder is COMPLETED", () => {
    it("should automatically create a Final MIR draft when Investigation is closed/COMPLETED and vigilance is REPORTABLE", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.investigation.findUnique.mockResolvedValue(baseCompletedInvestigation);

      mockTx.investigation.update.mockResolvedValue({
        ...baseCompletedInvestigation,
        status: InvestigationStatus.COMPLETED,
      });

      // Vigilance was reportable
      mockTx.vigilanceDecisionTree.findFirst.mockResolvedValue({
        id: "vig_100",
        orgId: "org_test456",
        complaintId: "cmp_100",
        status: VigilanceStatus.REPORTABLE,
      });

      // Final MIR does not exist yet
      mockTx.finalMIR.findUnique.mockResolvedValue(null);
      const newlyCreatedFinalMIR = {
        id: "fmir_auto_1",
        orgId: "org_test456",
        complaintId: "cmp_100",
        status: "DRAFT",
        reportType: "FINAL",
      };
      mockTx.finalMIR.create.mockResolvedValue(newlyCreatedFinalMIR);
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_auto_fmir" });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_100");
      formData.set("newStatus", "COMPLETED");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "I approve completion of this investigation file.");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("COMPLETED");

      // Verify reportable vigilance check
      expect(mockTx.vigilanceDecisionTree.findFirst).toHaveBeenCalledWith({
        where: {
          complaintId: "cmp_100",
          orgId: "org_test456",
          status: { in: ["REPORTABLE", "SUBMITTED"] },
        },
      });

      // Verify Final MIR check and creation
      expect(mockTx.finalMIR.findUnique).toHaveBeenCalledWith({
        where: { complaintId: "cmp_100" },
      });

      expect(mockTx.finalMIR.create).toHaveBeenCalledWith({
        data: {
          orgId: "org_test456",
          complaintId: "cmp_100",
          status: "DRAFT",
          reportType: "FINAL",
        },
      });

      // Verify Audit Log was generated for newly created Final MIR sub-folder
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "FinalMIR",
            entityId: "fmir_auto_1",
            action: AuditAction.CREATE,
            changedById: "user_qa_manager_1",
            reason: "Final MIR record created upon Investigation completion",
            complaintId: "cmp_100",
          }),
        })
      );
    });

    it("should automatically create Final MIR when Investigation completes and linked vigilance is already SUBMITTED", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.investigation.findUnique.mockResolvedValue(baseCompletedInvestigation);

      mockTx.investigation.update.mockResolvedValue({
        ...baseCompletedInvestigation,
        status: InvestigationStatus.COMPLETED,
      });

      mockTx.vigilanceDecisionTree.findFirst.mockResolvedValue({
        id: "vig_100",
        orgId: "org_test456",
        complaintId: "cmp_100",
        status: VigilanceStatus.SUBMITTED,
      });

      mockTx.finalMIR.findUnique.mockResolvedValue(null);
      mockTx.finalMIR.create.mockResolvedValue({
        id: "fmir_auto_2",
        orgId: "org_test456",
        complaintId: "cmp_100",
        status: "DRAFT",
        reportType: "FINAL",
      });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_100");
      formData.set("newStatus", "COMPLETED");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "I approve completion of investigation.");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(mockTx.finalMIR.create).toHaveBeenCalledTimes(1);
    });

    it("should NOT create Final MIR when vigilance assessment is NOT_REPORTABLE", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.investigation.findUnique.mockResolvedValue(baseCompletedInvestigation);

      mockTx.investigation.update.mockResolvedValue({
        ...baseCompletedInvestigation,
        status: InvestigationStatus.COMPLETED,
      });

      // No reportable or submitted vigilance
      mockTx.vigilanceDecisionTree.findFirst.mockResolvedValue(null);

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_100");
      formData.set("newStatus", "COMPLETED");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "Completing investigation on non-reportable issue");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(mockTx.finalMIR.create).not.toHaveBeenCalled();
    });

    it("should NOT create a duplicate Final MIR if one was already generated", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.investigation.findUnique.mockResolvedValue(baseCompletedInvestigation);

      mockTx.investigation.update.mockResolvedValue({
        ...baseCompletedInvestigation,
        status: InvestigationStatus.COMPLETED,
      });

      mockTx.vigilanceDecisionTree.findFirst.mockResolvedValue({
        id: "vig_100",
        orgId: "org_test456",
        status: VigilanceStatus.REPORTABLE,
      });

      mockTx.finalMIR.findUnique.mockResolvedValue({
        id: "fmir_existing_1",
        orgId: "org_test456",
        complaintId: "cmp_100",
        status: "DRAFT",
      });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_100");
      formData.set("newStatus", "COMPLETED");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "Completing investigation");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(mockTx.finalMIR.create).not.toHaveBeenCalled();
    });
  });

  /* ========================================================================= */
  /* 3. COMPLAINT MAIN FILE CLOSURE GUARDS (ALL SUB-FOLDERS MUST BE CLOSED)    */
  /* ========================================================================= */

  describe("Complaint Main File Closure Guards (Sub-folder Dependencies)", () => {
    it("should prevent closing complaint when linked Initial MIR is still in DRAFT or IN_REVIEW", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);

      // Complaint where investigation and vigilance are finished, but Initial MIR is DRAFT
      mockTx.complaint.findUnique.mockResolvedValue({
        ...baseComplaint,
        status: ComplaintStatus.PENDING_RESPONSE,
        investigation: { id: "inv_100", status: InvestigationStatus.COMPLETED },
        vigilanceDecisionTrees: [{ id: "vig_100", status: VigilanceStatus.SUBMITTED }],
        initialMIR: { id: "imir_100", status: MIRStatus.DRAFT },
        finalMIR: { id: "fmir_100", status: MIRStatus.SUBMITTED },
        customerCommunications: [],
        tasks: [],
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_100");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "Attempting closure with open Initial MIR");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot move complaint to CLOSED");
      expect(result.error).toContain("Initial MIR is currently in DRAFT status (must be SUBMITTED)");
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
    });

    it("should prevent closing complaint when linked Final MIR is still in DRAFT or IN_REVIEW", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);

      // Complaint where investigation, vigilance, and Initial MIR are finished, but Final MIR is IN_REVIEW
      mockTx.complaint.findUnique.mockResolvedValue({
        ...baseComplaint,
        status: ComplaintStatus.PENDING_RESPONSE,
        investigation: { id: "inv_100", status: InvestigationStatus.COMPLETED },
        vigilanceDecisionTrees: [{ id: "vig_100", status: VigilanceStatus.SUBMITTED }],
        initialMIR: { id: "imir_100", status: MIRStatus.SUBMITTED },
        finalMIR: { id: "fmir_100", status: MIRStatus.IN_REVIEW },
        customerCommunications: [],
        tasks: [],
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_100");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "Attempting closure with in-review Final MIR");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot move complaint to CLOSED");
      expect(result.error).toContain("Final MIR is currently in IN_REVIEW status (must be SUBMITTED)");
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
    });

    it("should prevent closing complaint when linked Investigation is open (IN_PROGRESS / UNDER_REVIEW)", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);

      mockTx.complaint.findUnique.mockResolvedValue({
        ...baseComplaint,
        status: ComplaintStatus.PENDING_RESPONSE,
        investigation: { id: "inv_100", status: InvestigationStatus.IN_PROGRESS },
        vigilanceDecisionTrees: [{ id: "vig_100", status: VigilanceStatus.SUBMITTED }],
        initialMIR: { id: "imir_100", status: MIRStatus.SUBMITTED },
        finalMIR: { id: "fmir_100", status: MIRStatus.SUBMITTED },
        customerCommunications: [],
        tasks: [],
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_100");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "Attempting closure with open investigation");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot close complaint: All direct linkages must be closed first");
      expect(result.error).toContain("Investigation is still open (current status: IN PROGRESS)");
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
    });

    it("should prevent closing complaint when Vigilance assessment is not finalized (PENDING or REPORTABLE)", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);

      mockTx.complaint.findUnique.mockResolvedValue({
        ...baseComplaint,
        status: ComplaintStatus.PENDING_RESPONSE,
        investigation: { id: "inv_100", status: InvestigationStatus.COMPLETED },
        vigilanceDecisionTrees: [{ id: "vig_100", status: VigilanceStatus.REPORTABLE }],
        initialMIR: { id: "imir_100", status: MIRStatus.SUBMITTED },
        finalMIR: { id: "fmir_100", status: MIRStatus.SUBMITTED },
        customerCommunications: [],
        tasks: [],
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_100");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "Attempting closure with unsubmitted vigilance");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Vigilance Decision Tree assessment is not finalized");
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
    });

    it("should prevent closing complaint when sub-folder Tasks or Communications are open", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);

      mockTx.complaint.findUnique.mockResolvedValue({
        ...baseComplaint,
        status: ComplaintStatus.PENDING_RESPONSE,
        investigation: { id: "inv_100", status: InvestigationStatus.COMPLETED },
        vigilanceDecisionTrees: [{ id: "vig_100", status: VigilanceStatus.SUBMITTED }],
        initialMIR: { id: "imir_100", status: MIRStatus.SUBMITTED },
        finalMIR: { id: "fmir_100", status: MIRStatus.SUBMITTED },
        customerCommunications: [
          { id: "comm_1", status: CommunicationStatus.OPEN },
        ],
        tasks: [
          { id: "task_1", status: TaskStatus.IN_PROGRESS, shortDescription: "Review batch history" },
        ],
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_100");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "Attempting closure with open tasks and comms");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot move complaint to CLOSED");
      expect(result.error).toContain("Customer Communication (comm_1) is not closed");
      expect(result.error).toContain("Task (Review batch history) is not completed");
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
    });

    it("should list all incomplete sub-folders when multiple folders are open simultaneously", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);

      mockTx.complaint.findUnique.mockResolvedValue({
        ...baseComplaint,
        status: ComplaintStatus.PENDING_RESPONSE,
        investigation: { id: "inv_100", status: InvestigationStatus.COMPLETED },
        vigilanceDecisionTrees: [{ id: "vig_100", status: VigilanceStatus.SUBMITTED }],
        initialMIR: { id: "imir_100", status: MIRStatus.DRAFT },
        finalMIR: { id: "fmir_100", status: MIRStatus.IN_REVIEW },
        customerCommunications: [{ id: "comm_2", status: CommunicationStatus.OPEN }],
        tasks: [{ id: "task_2", status: TaskStatus.OPEN, shortDescription: "Sample inspection" }],
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_100");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "Attempting closure with multiple active subfolders");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Initial MIR is currently in DRAFT status (must be SUBMITTED)");
      expect(result.error).toContain("Final MIR is currently in IN_REVIEW status (must be SUBMITTED)");
      expect(result.error).toContain("Customer Communication (comm_2) is not closed");
      expect(result.error).toContain("Task (Sample inspection) is not completed");
    });

    it("should successfully close the complaint when ALL sub-folders are completed/closed", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);

      const allClosedComplaint = {
        ...baseComplaint,
        status: ComplaintStatus.PENDING_RESPONSE,
        investigation: { id: "inv_100", status: InvestigationStatus.COMPLETED },
        vigilanceDecisionTrees: [{ id: "vig_100", status: VigilanceStatus.SUBMITTED }],
        initialMIR: { id: "imir_100", status: MIRStatus.SUBMITTED },
        finalMIR: { id: "fmir_100", status: MIRStatus.SUBMITTED },
        customerCommunications: [
          { id: "comm_1", status: CommunicationStatus.CLOSED },
        ],
        tasks: [
          { id: "task_1", status: TaskStatus.CLOSED, shortDescription: "Review batch history" },
        ],
      };

      mockTx.complaint.findUnique.mockResolvedValue(allClosedComplaint);
      mockTx.complaint.update.mockResolvedValue({
        ...allClosedComplaint,
        status: ComplaintStatus.CLOSED,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_complaint_closed" });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_100");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "I approve final complaint closure as all sub-folders are fully resolved.");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("CLOSED");
      expect(mockTx.complaint.update).toHaveBeenCalledWith({
        where: { id: "cmp_100", orgId: "org_test456" },
        data: { status: "CLOSED" },
      });
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: "Complaint",
            entityId: "cmp_100",
            action: AuditAction.STATUS_CHANGE,
            changedById: "user_qa_manager_1",
            complaintId: "cmp_100",
          }),
        })
      );
    });

    it("should allow closing complaint when sub-folders are cancelled or exempted", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.recordLock.findUnique.mockResolvedValue(null);

      const exemptedComplaint = {
        ...baseComplaint,
        status: ComplaintStatus.PENDING_RESPONSE,
        investigation: { id: "inv_100", status: InvestigationStatus.NOT_REQUIRED },
        vigilanceDecisionTrees: [{ id: "vig_100", status: VigilanceStatus.CANCELLED }],
        initialMIR: { id: "imir_100", status: MIRStatus.CANCELLED },
        finalMIR: null,
        customerCommunications: [{ id: "comm_1", status: CommunicationStatus.CANCELLED }],
        tasks: [{ id: "task_1", status: TaskStatus.CANCELLED }],
      };

      mockTx.complaint.findUnique.mockResolvedValue(exemptedComplaint);
      mockTx.complaint.update.mockResolvedValue({
        ...exemptedComplaint,
        status: ComplaintStatus.CLOSED,
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_100");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "SecurePassword123!");
      formData.set("meaningOfSignature", "Closing exempted complaint");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("CLOSED");
    });
  });
});
