import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditAction, InvestigationStatus } from "@prisma/client";

const { mockVerifyPassword, mockAuth, mockTx } = vi.hoisted(() => {
  const verifyPassword = vi.fn();
  const authFn = vi.fn().mockResolvedValue({
    userId: "user_investigator_1",
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
    investigationCustomSection: {
      updateMany: vi.fn(),
    },
    attachment: {
      createMany: vi.fn(),
    },
    recordLock: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    vigilanceDecisionTree: {
      findUnique: vi.fn(),
      update: vi.fn(),
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
    userId: "user_investigator_1",
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
import { updateInvestigation } from "@/lib/actions/investigations";
import {
  saveInvestigationSummaryDraft,
  signAndCompleteInvestigationSummary,
} from "@/lib/actions/investigation-summary";

describe("Investigation Stage Transitions & E-Signature Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseCompletedInvestigation = {
    id: "inv_101",
    orgId: "org_test456",
    complaintId: "cmp_stage_1",
    status: InvestigationStatus.IN_PROGRESS,
    investigatorId: "user_investigator_1",
    // Sample Analysis: fully completed
    sampleAnalysisRequired: true,
    sampleAnalysisAssignedDate: new Date("2026-08-10T00:00:00Z"),
    sampleAnalysisCompleteDate: new Date("2026-08-15T00:00:00Z"),
    sampleAnalysisExemptRationale: null,
    // Risk Review: fully completed
    riskReviewRequired: true,
    riskReviewCompletedById: "user_risk_officer",
    riskReviewCompletedAt: new Date("2026-08-16T00:00:00Z"),
    riskReviewResults: "Risk is within acceptable ALARP thresholds per ISO 14971.",
    riskReviewExemptRationale: null,
    // Summary & CAPA: fully completed
    investigationSummaryCompletedById: "user_investigator_1",
    investigationSummaryCompletedAt: new Date("2026-08-18T00:00:00Z"),
    summary: {
      id: "summary_1",
      investigationId: "inv_101",
      completedById: "user_investigator_1",
      completedAt: new Date("2026-08-18T00:00:00Z"),
      summary: "Root cause identified as plunger friction due to insufficient lubrication.",
      report: "Detailed teardown analysis performed on 3 retain units.",
      capaFscaRationale: "CAPA-2026-012 opened to adjust silicone dispensing volume.",
      imdrfCodes: [
        { annex: "ANNEX_B", code: "B01", term: "Mechanical Jam" },
        { annex: "ANNEX_C", code: "C05", term: "Friction Resistance" },
        { annex: "ANNEX_D", code: "D10", term: "Dimensional Deviation" },
        { annex: "ANNEX_G", code: "G02", term: "Manufacturing Process Deviation" },
      ],
    },
    customSections: [],
  };

  describe("Pushing Investigation to Under Review (Required Fields Validation)", () => {
    it("should reject transition to UNDER_REVIEW when Investigator (General Details) is missing", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue({
        ...baseCompletedInvestigation,
        investigatorId: "", // Missing investigator
      });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "UNDER_REVIEW");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I confirm submission of investigation for review");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot move investigation to Under Review");
      expect(result.error).toContain("General Details: Investigator must be assigned.");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject transition to UNDER_REVIEW when Sample Analysis is required but dates are incomplete", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue({
        ...baseCompletedInvestigation,
        sampleAnalysisRequired: true,
        sampleAnalysisAssignedDate: null,
        sampleAnalysisCompleteDate: null,
      });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "UNDER_REVIEW");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I confirm submission of investigation for review");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Sample Analysis: Assigned Date is required.");
      expect(result.error).toContain("Sample Analysis: Complete Date is required.");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject transition to UNDER_REVIEW when Sample Analysis is NOT required but exempt rationale is missing", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue({
        ...baseCompletedInvestigation,
        sampleAnalysisRequired: false,
        sampleAnalysisExemptRationale: "   ", // Blank rationale
      });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "UNDER_REVIEW");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I confirm submission of investigation for review");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Sample Analysis: Exempt Rationale is required when Sample Analysis is not required.");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject transition to UNDER_REVIEW when Risk Review is required but completed by/date/results are missing", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue({
        ...baseCompletedInvestigation,
        riskReviewRequired: true,
        riskReviewCompletedById: null,
        riskReviewCompletedAt: null,
        riskReviewResults: "",
      });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "UNDER_REVIEW");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I confirm submission of investigation for review");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Risk Review: Completed By is required when Risk Review is required.");
      expect(result.error).toContain("Risk Review: Completed At date is required when Risk Review is required.");
      expect(result.error).toContain("Risk Review: Results are required when Risk Review is required.");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject transition to UNDER_REVIEW when Risk Review is NOT required but exempt rationale is missing", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue({
        ...baseCompletedInvestigation,
        riskReviewRequired: false,
        riskReviewExemptRationale: null,
      });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "UNDER_REVIEW");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I confirm submission of investigation for review");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Risk Review: Exempt Rationale is required when Risk Review is not required.");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
    });

    it("should reject transition to UNDER_REVIEW when Summary details or required IMDRF Annex codes are incomplete", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue({
        ...baseCompletedInvestigation,
        summary: {
          ...baseCompletedInvestigation.summary,
          summary: "", // Missing summary text
          capaFscaRationale: "", // Missing CAPA rationale
          // Missing Annex G
          imdrfCodes: [
            { annex: "ANNEX_B", code: "B01", term: "Mechanical Jam" },
            { annex: "ANNEX_C", code: "C05", term: "Friction Resistance" },
            { annex: "ANNEX_D", code: "D10", term: "Dimensional Deviation" },
          ],
        },
      });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "UNDER_REVIEW");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I confirm submission of investigation for review");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Summary & CAPA: Summary text is required.");
      expect(result.error).toContain("Summary & CAPA/FSCA: CAPA / FSCA Rationale is required.");
      expect(result.error).toContain("Summary & CAPA: IMDRF Codes must include valid selections for all Annexes (Annex B, C, D, and G).");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
    });

    it("should reject transition to UNDER_REVIEW when an active custom section is required but missing details", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue({
        ...baseCompletedInvestigation,
        customSections: [
          {
            id: "cs_1",
            template: { sectionName: "Bioburden Test", isActive: true },
            isRequired: true,
            assignedToId: null,
            assignedDate: null,
            results: "",
          },
        ],
      });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "UNDER_REVIEW");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I confirm submission of investigation for review");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Custom Section "Bioburden Test": Assigned To, Assigned Date, Results required.');
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
    });

    it("should successfully transition to UNDER_REVIEW when all required fields are complete and password is valid", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue(baseCompletedInvestigation);
      mockTx.investigation.update.mockResolvedValue({
        ...baseCompletedInvestigation,
        status: InvestigationStatus.UNDER_REVIEW,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_under_review_success" });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "UNDER_REVIEW");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I submit this investigation for QA review");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("UNDER_REVIEW");
      expect(mockTx.investigation.update).toHaveBeenCalledWith({
        where: { id: "inv_101", orgId: "org_test456" },
        data: { status: "UNDER_REVIEW" },
      });
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "Investigation",
            entityId: "inv_101",
            action: AuditAction.STATUS_CHANGE,
            reason: expect.stringContaining("E-SIGNATURE STATUS CHANGE: IN_PROGRESS → UNDER_REVIEW"),
          }),
        })
      );
    });
  });

  describe("Reverting Investigation back to Under Investigation (E-Signature & Rationale Validation)", () => {
    const underReviewInvestigation = {
      ...baseCompletedInvestigation,
      status: InvestigationStatus.UNDER_REVIEW,
    };

    it("should reject reverting to IN_PROGRESS when an INCORRECT password is provided and leave status intact", async () => {
      // Simulate Clerk rejecting invalid password
      mockVerifyPassword.mockRejectedValue(new Error("incorrect password"));

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "wrong_pw");
      formData.set("meaningOfSignature", "I am author of this change");
      formData.set("rationale", "Need additional retain sample testing");

      const result = await executeStatusTransition(null, formData);

      expect(mockVerifyPassword).toHaveBeenCalledWith({
        userId: "user_investigator_1",
        password: "wrong_pw",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Incorrect password");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject reverting to IN_PROGRESS when password verification returns verified: false", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: false });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "invalid_password");
      formData.set("meaningOfSignature", "I am author of this change");
      formData.set("rationale", "Reverting for more data");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Password verification failed");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject reverting to IN_PROGRESS when e-signature password is valid BUT no rationale is provided", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue(underReviewInvestigation);

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am author of this change");
      formData.set("rationale", "   "); // Empty whitespace rationale

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("A documented rationale is mandatory when reverting a stage (UNDER_REVIEW → IN_PROGRESS).");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should successfully revert from UNDER_REVIEW to IN_PROGRESS when valid password and documented rationale are provided", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue(underReviewInvestigation);
      mockTx.investigation.update.mockResolvedValue({
        ...underReviewInvestigation,
        status: InvestigationStatus.IN_PROGRESS,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_revert_success" });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I have reviewed and verified this change");
      formData.set("rationale", "QA reviewer requested additional lot testing on retain samples.");

      const result = await executeStatusTransition(null, formData);

      expect(mockVerifyPassword).toHaveBeenCalledWith({
        userId: "user_investigator_1",
        password: "ValidSecurePass2026!",
      });
      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("IN_PROGRESS");

      // Verify status update in database
      expect(mockTx.investigation.update).toHaveBeenCalledWith({
        where: { id: "inv_101", orgId: "org_test456" },
        data: { status: "IN_PROGRESS" },
      });

      // Verify 21 CFR Part 11 AuditLog entry recorded with stage reversion and rationale
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "Investigation",
            entityId: "inv_101",
            action: AuditAction.STATUS_CHANGE,
            changedById: "user_investigator_1",
            reason: expect.stringContaining("E-SIGNATURE STAGE REVERSION: UNDER_REVIEW → IN_PROGRESS"),
          }),
        })
      );

      const auditReason = mockTx.auditLog.create.mock.calls[0][0].data.reason;
      expect(auditReason).toContain("Meaning: I have reviewed and verified this change");
      expect(auditReason).toContain("Rationale: QA reviewer requested additional lot testing on retain samples.");
      expect(auditReason).toContain("Signed by: user_investigator_1");
    });
  });

  describe("Pushing Investigation to Completed (Final Approval & Locking)", () => {
    const underReviewInvestigation = {
      ...baseCompletedInvestigation,
      status: InvestigationStatus.UNDER_REVIEW,
    };

    it("should reject moving investigation to COMPLETED when user lacks QA Manager or Admin permissions", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue(underReviewInvestigation);

      // Simulate a standard member without QA Manager / Admin / Approve permissions
      mockAuth.mockResolvedValueOnce({
        userId: "user_investigator_1",
        orgId: "org_test456",
        orgRole: "org:member",
        has: () => false,
      });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "COMPLETED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve and complete this investigation");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("403 Forbidden: Only QA Managers and Administrators have the required permissions");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject moving investigation to COMPLETED when mandatory fields are missing", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue({
        ...underReviewInvestigation,
        summary: null, // Missing summary
      });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "COMPLETED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve and complete this investigation");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Summary & CAPA: Investigation Summary details have not been saved yet.");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
    });

    it("should reject moving investigation to COMPLETED when password verification fails", async () => {
      mockVerifyPassword.mockRejectedValue(new Error("incorrect password"));

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "COMPLETED");
      formData.set("password", "wrong_pass");
      formData.set("meaningOfSignature", "I approve and complete this investigation");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Incorrect password");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
    });

    it("should reject invalid status transition directly from NOT_STARTED to COMPLETED", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue({
        ...baseCompletedInvestigation,
        status: InvestigationStatus.NOT_STARTED,
      });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "COMPLETED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve and complete this investigation");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid status transition: NOT_STARTED → COMPLETED is not allowed for Investigation.");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
    });

    it("should successfully transition to COMPLETED when QA/Admin credentials and complete required fields are provided", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue(underReviewInvestigation);
      mockTx.investigation.update.mockResolvedValue({
        ...underReviewInvestigation,
        status: InvestigationStatus.COMPLETED,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_completed_success" });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "COMPLETED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve and sign off on completing this investigation");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("COMPLETED");

      // Verify status update in database
      expect(mockTx.investigation.update).toHaveBeenCalledWith({
        where: { id: "inv_101", orgId: "org_test456" },
        data: { status: "COMPLETED" },
      });

      // Verify audit log entry
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "Investigation",
            entityId: "inv_101",
            action: AuditAction.STATUS_CHANGE,
            changedById: "user_investigator_1",
            reason: expect.stringContaining("E-SIGNATURE STATUS CHANGE: UNDER_REVIEW → COMPLETED"),
          }),
        })
      );
    });
  });

  describe("Completed Investigation Immutability (Zero-Update Lockdown)", () => {
    const completedInvestigation = {
      ...baseCompletedInvestigation,
      status: InvestigationStatus.COMPLETED,
    };

    it("should reject updateInvestigation when investigation is in COMPLETED status under all circumstances", async () => {
      mockTx.investigation.findUnique.mockResolvedValue(completedInvestigation);

      await expect(
        updateInvestigation({
          id: "inv_101",
          complaintId: "cmp_stage_1",
          orgSlug: "test-org",
          status: InvestigationStatus.COMPLETED,
          notes: "Attempting to change notes on completed record",
          sampleAnalysisRequired: true,
          riskReviewRequired: true,
          capaRequired: false,
          fscaRequired: false,
          reportabilityReviewRequired: false,
        })
      ).rejects.toThrow(
        "Cannot update investigation: Investigation is in Completed status and locked. Under 21 CFR Part 11 and ISO 13485 compliance, completed investigations cannot be modified under any circumstances."
      );

      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject updating individual fields (sample analysis, risk review, investigator) when investigation is COMPLETED", async () => {
      mockTx.investigation.findUnique.mockResolvedValue(completedInvestigation);

      await expect(
        updateInvestigation({
          id: "inv_101",
          complaintId: "cmp_stage_1",
          orgSlug: "test-org",
          status: InvestigationStatus.COMPLETED,
          investigatorId: "user_different_investigator",
          sampleAnalysisResults: "Tampered sample results",
          riskReviewResults: "Tampered risk results",
          sampleAnalysisRequired: true,
          riskReviewRequired: true,
          capaRequired: false,
          fscaRequired: false,
          reportabilityReviewRequired: false,
        })
      ).rejects.toThrow(
        "Cannot update investigation: Investigation is in Completed status and locked."
      );

      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject saveInvestigationSummaryDraft when parent investigation is COMPLETED", async () => {
      mockTx.investigation.findUnique.mockResolvedValue({
        id: "inv_101",
        complaintId: "cmp_stage_1",
        status: InvestigationStatus.COMPLETED,
      });

      await expect(
        saveInvestigationSummaryDraft({
          investigationId: "inv_101",
          summary: "Attempted edit",
          report: null,
          capaRequired: false,
          capaRef: null,
          fscaRequired: false,
          fscaRef: null,
          capaFscaRationale: null,
          reportabilityReviewRequired: false,
          notes: null,
        })
      ).rejects.toThrow(
        "Cannot update investigation summary: Investigation is completed and locked."
      );

      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject signAndCompleteInvestigationSummary when parent investigation is already COMPLETED", async () => {
      mockTx.investigation.findUnique.mockResolvedValue({
        id: "inv_101",
        complaintId: "cmp_stage_1",
        status: InvestigationStatus.COMPLETED,
      });

      await expect(
        signAndCompleteInvestigationSummary({
          investigationId: "inv_101",
          summary: "Attempted second sign",
          report: null,
          capaRequired: false,
          capaRef: null,
          fscaRequired: false,
          fscaRef: null,
          capaFscaRationale: null,
          reportabilityReviewRequired: false,
          notes: null,
        })
      ).rejects.toThrow(
        "Investigation is already completed and locked."
      );

      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe("Cancelling an Investigation File (Rationale & E-Signature Enforcement)", () => {
    it("should reject cancelling an investigation when an INCORRECT password is provided", async () => {
      mockVerifyPassword.mockRejectedValue(new Error("incorrect password"));

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "bad_pass");
      formData.set("meaningOfSignature", "I am approving this change");
      formData.set("rationale", "Duplicate investigation created in error");

      const result = await executeStatusTransition(null, formData);

      expect(mockVerifyPassword).toHaveBeenCalledWith({
        userId: "user_investigator_1",
        password: "bad_pass",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Incorrect password");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject cancelling an investigation when password is valid BUT no rationale is provided", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue(baseCompletedInvestigation);

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am approving this change");
      // rationale omitted / empty

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "A documented rationale is mandatory when cancelling a Investigation."
      );
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject cancelling an investigation with blank or whitespace-only rationale", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue(baseCompletedInvestigation);

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am approving this change");
      formData.set("rationale", "     "); // Whitespace only

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "A documented rationale is mandatory when cancelling a Investigation."
      );
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject cancelling an investigation that is already CANCELLED", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue({
        ...baseCompletedInvestigation,
        status: InvestigationStatus.CANCELLED,
      });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am approving this change");
      formData.set("rationale", "Attempting to cancel again");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Invalid status transition: CANCELLED → CANCELLED is not allowed for Investigation."
      );
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
    });

    it("should successfully cancel an investigation when valid password and documented rationale are provided", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue(baseCompletedInvestigation);
      mockTx.investigation.update.mockResolvedValue({
        ...baseCompletedInvestigation,
        status: InvestigationStatus.CANCELLED,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_cancel_success" });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am approving this cancellation");
      formData.set("rationale", "Investigation opened under wrong complaint number; recreated under CMP-2026-0042.");

      const result = await executeStatusTransition(null, formData);

      expect(mockVerifyPassword).toHaveBeenCalledWith({
        userId: "user_investigator_1",
        password: "ValidSecurePass2026!",
      });
      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("CANCELLED");

      // Verify DB update
      expect(mockTx.investigation.update).toHaveBeenCalledWith({
        where: { id: "inv_101", orgId: "org_test456" },
        data: { status: "CANCELLED" },
      });

      // Verify 21 CFR Part 11 AuditLog creation
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "Investigation",
            entityId: "inv_101",
            action: AuditAction.STATUS_CHANGE,
            changedById: "user_investigator_1",
            reason: expect.stringContaining(
              "E-SIGNATURE RECORD CANCELLATION: IN_PROGRESS → CANCELLED"
            ),
          }),
        })
      );

      const auditReason = mockTx.auditLog.create.mock.calls[0][0].data.reason;
      expect(auditReason).toContain("Meaning: I am approving this cancellation");
      expect(auditReason).toContain("Rationale: Investigation opened under wrong complaint number; recreated under CMP-2026-0042.");
      expect(auditReason).toContain("Signed by: user_investigator_1");
    });

    it("should reject transitioning a CANCELLED investigation to any subsequent active status (terminal state)", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue({
        ...baseCompletedInvestigation,
        status: InvestigationStatus.CANCELLED,
      });

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_101");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am author of this change");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Invalid status transition: CANCELLED → IN_PROGRESS is not allowed for Investigation."
      );
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe("Multi-Tenant Isolation & Security Guardrails", () => {
    it("should enforce tenant isolation and reject update when investigation belongs to another organization", async () => {
      // simulate query with orgId yielding null due to cross-org mismatch
      mockTx.investigation.findUnique.mockResolvedValue(null);

      await expect(
        updateInvestigation({
          id: "inv_other_org",
          complaintId: "cmp_stage_1",
          orgSlug: "test-org",
          status: InvestigationStatus.IN_PROGRESS,
          notes: "Cross tenant modification attempt",
          sampleAnalysisRequired: false,
          riskReviewRequired: false,
          capaRequired: false,
          fscaRequired: false,
          reportabilityReviewRequired: false,
        })
      ).rejects.toThrow("Investigation not found or insufficient permissions.");

      expect(mockTx.investigation.findUnique).toHaveBeenCalledWith({
        where: {
          id: "inv_other_org",
          orgId: "org_test456",
        },
        include: expect.any(Object),
      });

      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should enforce tenant isolation and reject status transition when investigation belongs to another organization", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.investigation.findUnique.mockResolvedValue(null);

      const formData = new FormData();
      formData.set("entityType", "Investigation");
      formData.set("entityId", "inv_other_org");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I confirm submission of investigation");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Investigation record not found or access denied.");
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });
  });
});
