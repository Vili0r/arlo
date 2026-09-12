import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditAction, LockEntityType, MIRStatus } from "@prisma/client";

const { mockVerifyPassword, mockAuth, mockTx } = vi.hoisted(() => {
  const verifyPassword = vi.fn();
  const authFn = vi.fn().mockResolvedValue({
    userId: "user_ra_specialist_1",
    orgId: "org_test456",
    orgRole: "org:admin",
    has: () => true,
  });

  const tx = {
    initialMIR: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    finalMIR: {
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
    userId: "user_ra_specialist_1",
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

describe("MIR Stage Transitions & E-Signature Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseInitialMIR = {
    id: "imir_101",
    orgId: "org_test456",
    complaintId: "cmp_stage_1",
    status: MIRStatus.DRAFT,
    reportType: "INITIAL",
    mirNumber: "MIR-2026-0001",
    manufacturerReference: "MFR-REF-001",
    submissionCountry: "DE",
    submissionMethod: "EUDAMED",
    initialDeviceRelatedness: "POSSIBLE",
    initialCausalityAssessment: "UNDER_EVALUATION",
    initialSeriousnessAssessment: "SERIOUS_DETERIORATION",
    initialRiskAssessment: "ACCEPTABLE_WITH_CAPA",
    preliminaryConclusion: "Device malfunction led to temporary treatment delay.",
    investigationStarted: true,
    investigationStartDate: new Date("2026-09-01T00:00:00Z"),
    preparedById: "user_ra_specialist_1",
    submissionDate: null,
    dueDate: new Date("2026-09-30T00:00:00Z"),
  };

  const baseFinalMIR = {
    id: "fmir_202",
    orgId: "org_test456",
    complaintId: "cmp_stage_1",
    status: MIRStatus.DRAFT,
    reportType: "FINAL",
    mirNumber: "MIR-2026-0001-F",
    manufacturerReference: "MFR-REF-001",
    competentAuthority: "BfArM",
    submissionCountry: "DE",
    submissionMethod: "EUDAMED",
    finalDeviceRelatedness: "CAUSAL_RELATIONSHIP",
    finalCausalityAssessment: "CONFIRMED",
    finalCausalityRationale: "Batch testing confirmed component dimensional variance.",
    manufacturerConclusion: "Issue resolved via supplier tooling correction and CAPA-2026-042.",
    incidentConfirmed: true,
    deviceContributionConfirmed: true,
    rootCauseConfirmed: true,
    recurrencePotential: "LOW",
    manufacturerFinalStatement: "No further adverse events reported; monitoring continues.",
    preparedById: "user_ra_specialist_1",
    submissionDate: null,
  };

  const lockByAnotherUser = {
    id: "lock_mir_other",
    orgId: "org_test456",
    entityType: LockEntityType.Vigilance,
    recordId: "imir_101",
    lockedById: "user_other_regulator",
    lockedAt: new Date(Date.now() - 10000),
    expiresAt: new Date(Date.now() + 60000),
    lockedBy: {
      firstName: "Sarah",
      lastName: "Connor",
      email: "sarah.connor@arlo.io",
    },
  };

  /* ========================================================================= */
  /* 1. INITIAL MIR STAGE TRANSITIONS                                          */
  /* ========================================================================= */

  describe("Initial MIR Stage Transitions", () => {
    describe("Forward Progression (DRAFT → IN_REVIEW → SUBMITTED)", () => {
      it("should successfully transition from DRAFT to IN_REVIEW with valid password", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.initialMIR.findUnique.mockResolvedValue(baseInitialMIR);
        mockTx.initialMIR.update.mockResolvedValue({
          ...baseInitialMIR,
          status: MIRStatus.IN_REVIEW,
        });
        mockTx.auditLog.create.mockResolvedValue({ id: "audit_1" });

        const formData = new FormData();
        formData.set("entityType", "InitialMIR");
        formData.set("entityId", "imir_101");
        formData.set("newStatus", "IN_REVIEW");
        formData.set("password", "SecurePassword123!");
        formData.set("meaningOfSignature", "I submit this Initial MIR for regulatory review.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(true);
        expect(result.updatedStatus).toBe("IN_REVIEW");
        expect(mockTx.initialMIR.update).toHaveBeenCalledWith({
          where: { id: "imir_101", orgId: "org_test456" },
          data: {
            status: MIRStatus.IN_REVIEW,
          },
        });
        expect(mockTx.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              entityType: "InitialMIR",
              entityId: "imir_101",
              action: AuditAction.STATUS_CHANGE,
              changedById: "user_ra_specialist_1",
              complaintId: "cmp_stage_1",
            }),
          })
        );
      });

      it("should successfully transition from IN_REVIEW to SUBMITTED and set submissionDate", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.initialMIR.findUnique.mockResolvedValue({
          ...baseInitialMIR,
          status: MIRStatus.IN_REVIEW,
        });
        mockTx.initialMIR.update.mockResolvedValue({
          ...baseInitialMIR,
          status: MIRStatus.SUBMITTED,
          submissionDate: new Date(),
        });
        mockTx.auditLog.create.mockResolvedValue({ id: "audit_2" });

        const formData = new FormData();
        formData.set("entityType", "InitialMIR");
        formData.set("entityId", "imir_101");
        formData.set("newStatus", "SUBMITTED");
        formData.set("password", "SecurePassword123!");
        formData.set("meaningOfSignature", "I authorize final submission of Initial MIR to BfArM.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(true);
        expect(result.updatedStatus).toBe("SUBMITTED");
        expect(mockTx.initialMIR.update).toHaveBeenCalledWith({
          where: { id: "imir_101", orgId: "org_test456" },
          data: {
            status: MIRStatus.SUBMITTED,
            submissionDate: expect.any(Date),
          },
        });
      });

      it("should reject transition when e-signature password verification fails", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: false });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.initialMIR.findUnique.mockResolvedValue(baseInitialMIR);

        const formData = new FormData();
        formData.set("entityType", "InitialMIR");
        formData.set("entityId", "imir_101");
        formData.set("newStatus", "IN_REVIEW");
        formData.set("password", "WrongPassword!");
        formData.set("meaningOfSignature", "Submitting for review.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("Password verification failed");
        expect(mockTx.initialMIR.update).not.toHaveBeenCalled();
      });

      it("should reject invalid forward skip from DRAFT directly to SUBMITTED", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.initialMIR.findUnique.mockResolvedValue(baseInitialMIR);

        const formData = new FormData();
        formData.set("entityType", "InitialMIR");
        formData.set("entityId", "imir_101");
        formData.set("newStatus", "SUBMITTED");
        formData.set("password", "SecurePassword123!");
        formData.set("meaningOfSignature", "Skipping review straight to submit.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid status transition");
        expect(mockTx.initialMIR.update).not.toHaveBeenCalled();
      });
    });

    describe("Reverting (IN_REVIEW → DRAFT)", () => {
      it("should successfully revert from IN_REVIEW to DRAFT with valid rationale and password", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.initialMIR.findUnique.mockResolvedValue({
          ...baseInitialMIR,
          status: MIRStatus.IN_REVIEW,
        });
        mockTx.initialMIR.update.mockResolvedValue({
          ...baseInitialMIR,
          status: MIRStatus.DRAFT,
        });
        mockTx.auditLog.create.mockResolvedValue({ id: "audit_revert" });

        const formData = new FormData();
        formData.set("entityType", "InitialMIR");
        formData.set("entityId", "imir_101");
        formData.set("newStatus", "DRAFT");
        formData.set("password", "SecurePassword123!");
        formData.set("rationale", "Need to amend device relatedness details based on new clinical findings.");
        formData.set("meaningOfSignature", "I request revisions on this Initial MIR draft.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(true);
        expect(result.updatedStatus).toBe("DRAFT");
        expect(mockTx.initialMIR.update).toHaveBeenCalledWith({
          where: { id: "imir_101", orgId: "org_test456" },
          data: {
            status: MIRStatus.DRAFT,
          },
        });
      });

      it("should reject reverting from IN_REVIEW to DRAFT when rationale is missing", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.initialMIR.findUnique.mockResolvedValue({
          ...baseInitialMIR,
          status: MIRStatus.IN_REVIEW,
        });

        const formData = new FormData();
        formData.set("entityType", "InitialMIR");
        formData.set("entityId", "imir_101");
        formData.set("newStatus", "DRAFT");
        formData.set("password", "SecurePassword123!");
        formData.set("meaningOfSignature", "Reverting without explanation.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("A documented rationale is mandatory when reverting a stage");
        expect(mockTx.initialMIR.update).not.toHaveBeenCalled();
      });

      it("should reject reverting when rationale contains only whitespace", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.initialMIR.findUnique.mockResolvedValue({
          ...baseInitialMIR,
          status: MIRStatus.IN_REVIEW,
        });

        const formData = new FormData();
        formData.set("entityType", "InitialMIR");
        formData.set("entityId", "imir_101");
        formData.set("newStatus", "DRAFT");
        formData.set("password", "SecurePassword123!");
        formData.set("rationale", "     ");
        formData.set("meaningOfSignature", "Whitespace rationale test.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("A documented rationale is mandatory when reverting a stage");
      });
    });

    describe("Cancellation (Branching to CANCELLED & Terminal State)", () => {
      it("should successfully cancel Initial MIR when valid password and documented rationale are provided", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.initialMIR.findUnique.mockResolvedValue(baseInitialMIR);
        mockTx.initialMIR.update.mockResolvedValue({
          ...baseInitialMIR,
          status: MIRStatus.CANCELLED,
        });
        mockTx.auditLog.create.mockResolvedValue({ id: "audit_cancel" });

        const formData = new FormData();
        formData.set("entityType", "InitialMIR");
        formData.set("entityId", "imir_101");
        formData.set("newStatus", "CANCELLED");
        formData.set("password", "SecurePassword123!");
        formData.set("rationale", "Duplicate vigilance entry logged in error by intake clerk.");
        formData.set("meaningOfSignature", "I confirm cancellation of this Initial MIR file.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(true);
        expect(result.updatedStatus).toBe("CANCELLED");
        expect(mockTx.initialMIR.update).toHaveBeenCalledWith({
          where: { id: "imir_101", orgId: "org_test456" },
          data: {
            status: MIRStatus.CANCELLED,
          },
        });
      });

      it("should reject cancelling Initial MIR when rationale is not provided", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.initialMIR.findUnique.mockResolvedValue(baseInitialMIR);

        const formData = new FormData();
        formData.set("entityType", "InitialMIR");
        formData.set("entityId", "imir_101");
        formData.set("newStatus", "CANCELLED");
        formData.set("password", "SecurePassword123!");
        formData.set("meaningOfSignature", "Cancelling without rationale.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("A documented rationale is mandatory when cancelling");
        expect(mockTx.initialMIR.update).not.toHaveBeenCalled();
      });

      it("should reject transitioning from CANCELLED to any active status (terminal state)", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.initialMIR.findUnique.mockResolvedValue({
          ...baseInitialMIR,
          status: MIRStatus.CANCELLED,
        });

        const formData = new FormData();
        formData.set("entityType", "InitialMIR");
        formData.set("entityId", "imir_101");
        formData.set("newStatus", "DRAFT");
        formData.set("password", "SecurePassword123!");
        formData.set("rationale", "Attempting to uncancel record");
        formData.set("meaningOfSignature", "Attempt reactivation.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid status transition");
        expect(mockTx.initialMIR.update).not.toHaveBeenCalled();
      });
    });

    describe("Concurrency Lock & Multi-Tenant Security", () => {
      it("should reject transition when record is currently locked by another user", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.initialMIR.findUnique.mockResolvedValue(baseInitialMIR);
        mockTx.recordLock.findUnique.mockResolvedValue(lockByAnotherUser);

        const formData = new FormData();
        formData.set("entityType", "InitialMIR");
        formData.set("entityId", "imir_101");
        formData.set("newStatus", "IN_REVIEW");
        formData.set("password", "SecurePassword123!");
        formData.set("meaningOfSignature", "Submitting while locked.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("Cannot update vigilance: Record is currently locked and being edited by Sarah Connor.");
        expect(mockTx.initialMIR.update).not.toHaveBeenCalled();
      });

      it("should reject transition when Initial MIR belongs to another organization", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.initialMIR.findUnique.mockResolvedValue(null); // Not found in user's tenant

        const formData = new FormData();
        formData.set("entityType", "InitialMIR");
        formData.set("entityId", "imir_101");
        formData.set("newStatus", "IN_REVIEW");
        formData.set("password", "SecurePassword123!");
        formData.set("meaningOfSignature", "Cross tenant submission.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("InitialMIR record not found or access denied");
      });
    });
  });

  /* ========================================================================= */
  /* 2. FINAL MIR STAGE TRANSITIONS                                            */
  /* ========================================================================= */

  describe("Final MIR Stage Transitions", () => {
    describe("Forward Progression (DRAFT → IN_REVIEW → SUBMITTED)", () => {
      it("should successfully transition Final MIR from DRAFT to IN_REVIEW with valid credentials", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.finalMIR.findUnique.mockResolvedValue(baseFinalMIR);
        mockTx.finalMIR.update.mockResolvedValue({
          ...baseFinalMIR,
          status: MIRStatus.IN_REVIEW,
        });
        mockTx.auditLog.create.mockResolvedValue({ id: "audit_fmir_1" });

        const formData = new FormData();
        formData.set("entityType", "FinalMIR");
        formData.set("entityId", "fmir_202");
        formData.set("newStatus", "IN_REVIEW");
        formData.set("password", "SecurePassword123!");
        formData.set("meaningOfSignature", "I submit this Final MIR report for QA approval.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(true);
        expect(result.updatedStatus).toBe("IN_REVIEW");
        expect(mockTx.finalMIR.update).toHaveBeenCalledWith({
          where: { id: "fmir_202", orgId: "org_test456" },
          data: {
            status: MIRStatus.IN_REVIEW,
          },
        });
        expect(mockTx.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              entityType: "FinalMIR",
              entityId: "fmir_202",
              action: AuditAction.STATUS_CHANGE,
              changedById: "user_ra_specialist_1",
            }),
          })
        );
      });

      it("should successfully transition Final MIR from IN_REVIEW to SUBMITTED and record submissionDate", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.finalMIR.findUnique.mockResolvedValue({
          ...baseFinalMIR,
          status: MIRStatus.IN_REVIEW,
        });
        mockTx.finalMIR.update.mockResolvedValue({
          ...baseFinalMIR,
          status: MIRStatus.SUBMITTED,
          submissionDate: new Date(),
        });
        mockTx.auditLog.create.mockResolvedValue({ id: "audit_fmir_2" });

        const formData = new FormData();
        formData.set("entityType", "FinalMIR");
        formData.set("entityId", "fmir_202");
        formData.set("newStatus", "SUBMITTED");
        formData.set("password", "SecurePassword123!");
        formData.set("meaningOfSignature", "I certify final submission of Final MIR closure.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(true);
        expect(result.updatedStatus).toBe("SUBMITTED");
        expect(mockTx.finalMIR.update).toHaveBeenCalledWith({
          where: { id: "fmir_202", orgId: "org_test456" },
          data: {
            status: MIRStatus.SUBMITTED,
            submissionDate: expect.any(Date),
          },
        });
      });

      it("should reject transition when password verification fails", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: false });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.finalMIR.findUnique.mockResolvedValue(baseFinalMIR);

        const formData = new FormData();
        formData.set("entityType", "FinalMIR");
        formData.set("entityId", "fmir_202");
        formData.set("newStatus", "IN_REVIEW");
        formData.set("password", "BadPassword");
        formData.set("meaningOfSignature", "Testing wrong password.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("Password verification failed");
        expect(mockTx.finalMIR.update).not.toHaveBeenCalled();
      });

      it("should reject illegal status jump from DRAFT directly to SUBMITTED", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.finalMIR.findUnique.mockResolvedValue(baseFinalMIR);

        const formData = new FormData();
        formData.set("entityType", "FinalMIR");
        formData.set("entityId", "fmir_202");
        formData.set("newStatus", "SUBMITTED");
        formData.set("password", "SecurePassword123!");
        formData.set("meaningOfSignature", "Skipping to submitted.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid status transition");
        expect(mockTx.finalMIR.update).not.toHaveBeenCalled();
      });
    });

    describe("Reverting (IN_REVIEW → DRAFT)", () => {
      it("should successfully revert Final MIR to DRAFT when valid password and rationale are provided", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.finalMIR.findUnique.mockResolvedValue({
          ...baseFinalMIR,
          status: MIRStatus.IN_REVIEW,
        });
        mockTx.finalMIR.update.mockResolvedValue({
          ...baseFinalMIR,
          status: MIRStatus.DRAFT,
        });
        mockTx.auditLog.create.mockResolvedValue({ id: "audit_fmir_revert" });

        const formData = new FormData();
        formData.set("entityType", "FinalMIR");
        formData.set("entityId", "fmir_202");
        formData.set("newStatus", "DRAFT");
        formData.set("password", "SecurePassword123!");
        formData.set("rationale", "Need updated CAPA reference number before final filing.");
        formData.set("meaningOfSignature", "Reverting Final MIR for edits.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(true);
        expect(result.updatedStatus).toBe("DRAFT");
        expect(mockTx.finalMIR.update).toHaveBeenCalledWith({
          where: { id: "fmir_202", orgId: "org_test456" },
          data: {
            status: MIRStatus.DRAFT,
          },
        });
      });

      it("should reject reverting Final MIR to DRAFT without documented rationale", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.finalMIR.findUnique.mockResolvedValue({
          ...baseFinalMIR,
          status: MIRStatus.IN_REVIEW,
        });

        const formData = new FormData();
        formData.set("entityType", "FinalMIR");
        formData.set("entityId", "fmir_202");
        formData.set("newStatus", "DRAFT");
        formData.set("password", "SecurePassword123!");
        formData.set("meaningOfSignature", "Reverting without rationale.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("A documented rationale is mandatory when reverting a stage");
        expect(mockTx.finalMIR.update).not.toHaveBeenCalled();
      });
    });

    describe("Cancellation (Branching & Terminal State)", () => {
      it("should successfully cancel Final MIR when valid password and rationale are provided", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.finalMIR.findUnique.mockResolvedValue(baseFinalMIR);
        mockTx.finalMIR.update.mockResolvedValue({
          ...baseFinalMIR,
          status: MIRStatus.CANCELLED,
        });
        mockTx.auditLog.create.mockResolvedValue({ id: "audit_fmir_cancel" });

        const formData = new FormData();
        formData.set("entityType", "FinalMIR");
        formData.set("entityId", "fmir_202");
        formData.set("newStatus", "CANCELLED");
        formData.set("password", "SecurePassword123!");
        formData.set("rationale", "Regulatory authority informed us this event does not require Final MIR filing.");
        formData.set("meaningOfSignature", "Cancelling Final MIR with rationale.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(true);
        expect(result.updatedStatus).toBe("CANCELLED");
      });

      it("should reject cancelling Final MIR when rationale is omitted", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.finalMIR.findUnique.mockResolvedValue(baseFinalMIR);

        const formData = new FormData();
        formData.set("entityType", "FinalMIR");
        formData.set("entityId", "fmir_202");
        formData.set("newStatus", "CANCELLED");
        formData.set("password", "SecurePassword123!");
        formData.set("meaningOfSignature", "Cancelling without rationale.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("A documented rationale is mandatory when cancelling");
      });

      it("should reject transitioning a CANCELLED Final MIR to any other status", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.finalMIR.findUnique.mockResolvedValue({
          ...baseFinalMIR,
          status: MIRStatus.CANCELLED,
        });

        const formData = new FormData();
        formData.set("entityType", "FinalMIR");
        formData.set("entityId", "fmir_202");
        formData.set("newStatus", "DRAFT");
        formData.set("password", "SecurePassword123!");
        formData.set("rationale", "Attempt reactivation");
        formData.set("meaningOfSignature", "Attempt reactivation.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid status transition");
      });
    });

    describe("Concurrency Lock & Multi-Tenant Security", () => {
      it("should reject Final MIR transition when locked by another user", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.finalMIR.findUnique.mockResolvedValue(baseFinalMIR);
        mockTx.recordLock.findUnique.mockResolvedValue({
          ...lockByAnotherUser,
          recordId: "fmir_202",
        });

        const formData = new FormData();
        formData.set("entityType", "FinalMIR");
        formData.set("entityId", "fmir_202");
        formData.set("newStatus", "IN_REVIEW");
        formData.set("password", "SecurePassword123!");
        formData.set("meaningOfSignature", "Submitting locked Final MIR.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("Cannot update vigilance: Record is currently locked and being edited by Sarah Connor.");
        expect(mockTx.finalMIR.update).not.toHaveBeenCalled();
      });

      it("should reject transition when Final MIR belongs to another tenant", async () => {
        mockVerifyPassword.mockResolvedValue({ verified: true });
        mockTx.recordLock.findUnique.mockResolvedValue(null);
        mockTx.finalMIR.findUnique.mockResolvedValue(null);

        const formData = new FormData();
        formData.set("entityType", "FinalMIR");
        formData.set("entityId", "fmir_202");
        formData.set("newStatus", "IN_REVIEW");
        formData.set("password", "SecurePassword123!");
        formData.set("meaningOfSignature", "Submitting cross tenant.");

        const result = await executeStatusTransition(null, formData);

        expect(result.success).toBe(false);
        expect(result.error).toContain("FinalMIR record not found or access denied");
      });
    });
  });
});
