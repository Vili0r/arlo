import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditAction, CommunicationStatus } from "@prisma/client";

const { mockVerifyPassword, mockAuth, mockTx } = vi.hoisted(() => {
  const verifyPassword = vi.fn();
  const authFn = vi.fn().mockResolvedValue({
    userId: "user_investigator_1",
    orgId: "org_test456",
    orgRole: "org:admin",
    has: () => true,
  });

  const tx = {
    customerCommunication: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    attachment: {
      createMany: vi.fn(),
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

describe("Customer Communication - Stage Transitions & E-Signature Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseCommunication = {
    id: "comm_stage_1",
    orgId: "org_test456",
    complaintId: "cmp_stage_1",
    status: CommunicationStatus.OPEN,
    communicationDate: new Date("2026-08-10T14:30:00Z"),
    questionAsked: "Please clarify the flow rate observed during the event.",
    customerResponse: null,
    internalNotes: "Awaiting customer reply.",
    authorId: "user_investigator_1",
  };

  describe("Forward Stage Transitions: Progressing & Completing/Closing", () => {
    it("should successfully transition communication from OPEN to IN_PROGRESS with valid e-signature password", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue(baseCommunication);
      mockTx.customerCommunication.update.mockResolvedValue({
        ...baseCommunication,
        status: CommunicationStatus.IN_PROGRESS,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_comm_progress_1" });

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I confirm customer inquiry has been dispatched");

      const result = await executeStatusTransition(null, formData);

      expect(mockVerifyPassword).toHaveBeenCalledWith({
        userId: "user_investigator_1",
        password: "ValidSecurePass2026!",
      });

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("IN_PROGRESS");

      expect(mockTx.customerCommunication.update).toHaveBeenCalledWith({
        where: { id: "comm_stage_1", orgId: "org_test456" },
        data: { status: "IN_PROGRESS" },
      });

      // Verify 21 CFR Part 11 AuditLog
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "CustomerCommunication",
            entityId: "comm_stage_1",
            action: AuditAction.STATUS_CHANGE,
            changedById: "user_investigator_1",
            complaintId: "cmp_stage_1",
            reason: expect.stringContaining("E-SIGNATURE STATUS CHANGE: OPEN → IN_PROGRESS"),
          }),
        })
      );

      const auditReason = mockTx.auditLog.create.mock.calls[0][0].data.reason;
      expect(auditReason).toContain("Meaning: I confirm customer inquiry has been dispatched");
      expect(auditReason).toContain("Signed by: user_investigator_1");
    });

    it("should successfully transition communication from IN_PROGRESS to CLOSED (Completed/Closed)", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      const inProgressComm = {
        ...baseCommunication,
        status: CommunicationStatus.IN_PROGRESS,
        customerResponse: "Flow rate recorded at 12 mL/hr.",
      };

      mockTx.customerCommunication.findUnique.mockResolvedValue(inProgressComm);
      mockTx.customerCommunication.update.mockResolvedValue({
        ...inProgressComm,
        status: CommunicationStatus.CLOSED,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_comm_close_1" });

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I have reviewed and verified this change");
      formData.set("rationale", "Customer provided full clarification.");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("CLOSED");

      expect(mockTx.customerCommunication.update).toHaveBeenCalledWith({
        where: { id: "comm_stage_1", orgId: "org_test456" },
        data: { status: "CLOSED" },
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "CustomerCommunication",
            entityId: "comm_stage_1",
            action: AuditAction.STATUS_CHANGE,
            changedById: "user_investigator_1",
            complaintId: "cmp_stage_1",
            reason: expect.stringContaining("E-SIGNATURE STATUS CHANGE: IN_PROGRESS → CLOSED"),
          }),
        })
      );
    });

    it("should allow direct transition from OPEN directly to CLOSED", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue(baseCommunication);
      mockTx.customerCommunication.update.mockResolvedValue({
        ...baseCommunication,
        status: CommunicationStatus.CLOSED,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_comm_direct_close" });

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am approving this change");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("CLOSED");
      expect(mockTx.customerCommunication.update).toHaveBeenCalledWith({
        where: { id: "comm_stage_1", orgId: "org_test456" },
        data: { status: "CLOSED" },
      });
    });
  });

  describe("Reverting Communication Stages (Rationale & E-Signature Enforcement)", () => {
    const closedComm = {
      ...baseCommunication,
      status: CommunicationStatus.CLOSED,
    };

    const inProgressComm = {
      ...baseCommunication,
      status: CommunicationStatus.IN_PROGRESS,
    };

    it("should reject reverting from CLOSED to IN_PROGRESS when rationale is missing", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue(closedComm);

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am author of this change");
      // rationale omitted

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "A documented rationale is mandatory when reverting a stage (CLOSED → IN_PROGRESS)."
      );
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject reverting from CLOSED to OPEN when rationale is whitespace-only", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue(closedComm);

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "OPEN");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am author of this change");
      formData.set("rationale", "     ");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "A documented rationale is mandatory when reverting a stage (CLOSED → OPEN)."
      );
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject reverting from IN_PROGRESS to OPEN when rationale is missing", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue(inProgressComm);

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "OPEN");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am author of this change");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "A documented rationale is mandatory when reverting a stage (IN_PROGRESS → OPEN)."
      );
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
    });

    it("should successfully revert from CLOSED to IN_PROGRESS when valid password and documented rationale are provided", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue(closedComm);
      mockTx.customerCommunication.update.mockResolvedValue({
        ...closedComm,
        status: CommunicationStatus.IN_PROGRESS,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_revert_comm_1" });

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I have reviewed and verified this change");
      formData.set("rationale", "Customer provided contradictory lot numbers requiring secondary follow-up.");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("IN_PROGRESS");

      expect(mockTx.customerCommunication.update).toHaveBeenCalledWith({
        where: { id: "comm_stage_1", orgId: "org_test456" },
        data: { status: "IN_PROGRESS" },
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "CustomerCommunication",
            entityId: "comm_stage_1",
            action: AuditAction.STATUS_CHANGE,
            changedById: "user_investigator_1",
            complaintId: "cmp_stage_1",
            reason: expect.stringContaining("E-SIGNATURE STAGE REVERSION: CLOSED → IN_PROGRESS"),
          }),
        })
      );

      const auditReason = mockTx.auditLog.create.mock.calls[0][0].data.reason;
      expect(auditReason).toContain("Meaning: I have reviewed and verified this change");
      expect(auditReason).toContain("Rationale: Customer provided contradictory lot numbers requiring secondary follow-up.");
      expect(auditReason).toContain("Signed by: user_investigator_1");
    });
  });

  describe("Cancelling Communication Records (Rationale & E-Signature Enforcement)", () => {
    it("should reject cancelling a communication when an INCORRECT password is provided", async () => {
      mockVerifyPassword.mockRejectedValue(new Error("incorrect password"));

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "wrong_password");
      formData.set("meaningOfSignature", "I am approving this change");
      formData.set("rationale", "Duplicate customer communication logged in error");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Incorrect password");
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject cancelling a communication when password verification returns verified: false", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: false });

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "unverified_pass");
      formData.set("meaningOfSignature", "I am approving this change");
      formData.set("rationale", "Customer contact info invalid");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Password verification failed");
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
    });

    it("should reject cancelling a communication when password is valid BUT no rationale is provided", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue(baseCommunication);

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am approving this change");
      // rationale omitted

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "A documented rationale is mandatory when cancelling a CustomerCommunication."
      );
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject cancelling a communication with whitespace-only rationale", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue(baseCommunication);

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am approving this change");
      formData.set("rationale", "    \n\t   ");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "A documented rationale is mandatory when cancelling a CustomerCommunication."
      );
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
    });

    it("should successfully cancel a communication from OPEN with valid password and documented rationale", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue(baseCommunication);
      mockTx.customerCommunication.update.mockResolvedValue({
        ...baseCommunication,
        status: CommunicationStatus.CANCELLED,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_comm_cancel_1" });

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am approving this change");
      formData.set("rationale", "Duplicate communication entry created accidentally.");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("CANCELLED");

      expect(mockTx.customerCommunication.update).toHaveBeenCalledWith({
        where: { id: "comm_stage_1", orgId: "org_test456" },
        data: { status: "CANCELLED" },
      });

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "CustomerCommunication",
            entityId: "comm_stage_1",
            action: AuditAction.STATUS_CHANGE,
            changedById: "user_investigator_1",
            complaintId: "cmp_stage_1",
            reason: expect.stringContaining(
              "E-SIGNATURE RECORD CANCELLATION: OPEN → CANCELLED"
            ),
          }),
        })
      );

      const auditReason = mockTx.auditLog.create.mock.calls[0][0].data.reason;
      expect(auditReason).toContain("Meaning: I am approving this change");
      expect(auditReason).toContain("Rationale: Duplicate communication entry created accidentally.");
      expect(auditReason).toContain("Signed by: user_investigator_1");
    });

    it("should successfully cancel a communication from IN_PROGRESS status", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      const inProgressComm = {
        ...baseCommunication,
        status: CommunicationStatus.IN_PROGRESS,
      };
      mockTx.customerCommunication.findUnique.mockResolvedValue(inProgressComm);
      mockTx.customerCommunication.update.mockResolvedValue({
        ...inProgressComm,
        status: CommunicationStatus.CANCELLED,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_cancel_inprogress" });

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am author of this change");
      formData.set("rationale", "Customer withdrew complaint before response was finalized.");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("CANCELLED");
    });

    it("should successfully cancel a communication from CLOSED status", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      const closedComm = {
        ...baseCommunication,
        status: CommunicationStatus.CLOSED,
      };
      mockTx.customerCommunication.findUnique.mockResolvedValue(closedComm);
      mockTx.customerCommunication.update.mockResolvedValue({
        ...closedComm,
        status: CommunicationStatus.CANCELLED,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_cancel_closed" });

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am approving this change");
      formData.set("rationale", "Administrative cancellation of erroneous historical log.");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("CANCELLED");
    });

    it("should reject cancelling an already CANCELLED communication", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue({
        ...baseCommunication,
        status: CommunicationStatus.CANCELLED,
      });

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am approving this change");
      formData.set("rationale", "Attempting double cancel");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Invalid status transition: CANCELLED → CANCELLED is not allowed for CustomerCommunication."
      );
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
    });

    it("should reject transitioning a CANCELLED communication to any other status (terminal state)", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue({
        ...baseCommunication,
        status: CommunicationStatus.CANCELLED,
      });

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "OPEN");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am author of this change");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Invalid status transition: CANCELLED → OPEN is not allowed for CustomerCommunication."
      );
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
    });
  });

  describe("Validation & Security Guardrails", () => {
    it("should reject transition when required e-signature form fields are missing (e.g. empty password)", async () => {
      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", ""); // empty password
      formData.set("meaningOfSignature", "I am author of this change");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Password is required for electronic signature");
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
    });

    it("should reject transition when meaning of signature is missing", async () => {
      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_stage_1");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", ""); // empty meaning

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Meaning of signature is required");
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
    });

    it("should reject transition when communication record is not found or belongs to another organization", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue(null);

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_other_tenant");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am author of this change");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("CustomerCommunication record not found or access denied.");
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
    });
  });
});
