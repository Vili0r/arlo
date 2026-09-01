import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditAction, ComplaintStatus, InvestigationStatus, VigilanceStatus } from "@prisma/client";

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
      verifyPassword: (...args: any[]) => mockVerifyPassword(...args),
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

describe("Complaint Stage Transitions & Electronic Signature (Password Verification)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const activeComplaint = {
    id: "cmp_stage_1",
    orgId: "org_test456",
    complaintNumber: "CMP-2026-0001",
    shortDescription: "Syringe plunger stuck",
    status: ComplaintStatus.OPEN,
    investigation: {
      id: "inv_1",
      status: InvestigationStatus.COMPLETED,
    },
    vigilanceDecisionTrees: [
      {
        id: "vig_1",
        status: VigilanceStatus.NOT_REPORTABLE,
      },
    ],
  };

  it("should reject moving complaint to next stage when an INCORRECT password is provided and leave record status intact", async () => {
    // Simulate Clerk rejecting the incorrect password
    mockVerifyPassword.mockRejectedValue(new Error("incorrect password"));

    const formData = new FormData();
    formData.set("entityType", "Complaint");
    formData.set("entityId", "cmp_stage_1");
    formData.set("newStatus", "IN_PROGRESS");
    formData.set("password", "wrong_password_123");
    formData.set("meaningOfSignature", "I confirm initiation of investigation");
    formData.set("rationale", "Moving to investigation stage");

    // Act
    const result = await executeStatusTransition(null, formData);

    // Assert password verification was attempted with provided credentials
    expect(mockVerifyPassword).toHaveBeenCalledWith({
      userId: "user_investigator_1",
      password: "wrong_password_123",
    });

    // Assert action failed with appropriate error message
    expect(result.success).toBe(false);
    expect(result.error).toContain("Incorrect password");

    // Assert database was NOT updated and no status change audit log was committed
    expect(mockTx.complaint.update).not.toHaveBeenCalled();
    expect(mockTx.auditLog.create).not.toHaveBeenCalled();
  });

  it("should reject moving complaint when password verification returns verified: false", async () => {
    mockVerifyPassword.mockResolvedValue({ verified: false });

    const formData = new FormData();
    formData.set("entityType", "Complaint");
    formData.set("entityId", "cmp_stage_1");
    formData.set("newStatus", "IN_PROGRESS");
    formData.set("password", "bad_password");
    formData.set("meaningOfSignature", "I confirm initiation of investigation");

    const result = await executeStatusTransition(null, formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Password verification failed");
    expect(mockTx.complaint.update).not.toHaveBeenCalled();
    expect(mockTx.auditLog.create).not.toHaveBeenCalled();
  });

  it("should successfully move complaint to next stage when the CORRECT password is provided and log e-signature audit trail", async () => {
    // Simulate Clerk verifying the correct password successfully
    mockVerifyPassword.mockResolvedValue({ verified: true });

    mockTx.complaint.findUnique.mockResolvedValue(activeComplaint);
    mockTx.complaint.update.mockResolvedValue({
      ...activeComplaint,
      status: ComplaintStatus.IN_PROGRESS,
    });
    mockTx.auditLog.create.mockResolvedValue({ id: "audit_stage_success" });

    const formData = new FormData();
    formData.set("entityType", "Complaint");
    formData.set("entityId", "cmp_stage_1");
    formData.set("newStatus", "IN_PROGRESS");
    formData.set("password", "ValidSecurePass2026!");
    formData.set("meaningOfSignature", "I author and approve initiating investigation for this complaint");
    formData.set("rationale", "Assigning to engineering QA team");

    // Act
    const result = await executeStatusTransition(null, formData);

    // Assert password verification succeeded
    expect(mockVerifyPassword).toHaveBeenCalledWith({
      userId: "user_investigator_1",
      password: "ValidSecurePass2026!",
    });

    // Assert success result returned
    expect(result.success).toBe(true);
    expect(result.updatedStatus).toBe("IN_PROGRESS");

    // Assert database complaint record was transitioned
    expect(mockTx.complaint.update).toHaveBeenCalledWith({
      where: { id: "cmp_stage_1", orgId: "org_test456" },
      data: { status: "IN_PROGRESS" },
    });

    // Assert 21 CFR Part 11 Electronic Signature AuditLog entry was recorded
    expect(mockTx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: "org_test456",
          entityType: "Complaint",
          entityId: "cmp_stage_1",
          action: AuditAction.STATUS_CHANGE,
          changedById: "user_investigator_1",
          complaintId: "cmp_stage_1",
          reason: expect.stringContaining("E-SIGNATURE STATUS CHANGE: OPEN → IN_PROGRESS"),
        }),
      })
    );

    // Verify signature metadata included in reason
    const loggedReason = mockTx.auditLog.create.mock.calls[0][0].data.reason;
    expect(loggedReason).toContain("Meaning: I author and approve initiating investigation for this complaint");
    expect(loggedReason).toContain("Rationale: Assigning to engineering QA team");
    expect(loggedReason).toContain("Signed by: user_investigator_1");
  });

  describe("Direct Linkages / Sub-folder Closure Guards", () => {
    it("should prevent closing a complaint if linked investigation is IN_PROGRESS", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.complaint.findUnique.mockResolvedValue({
        ...activeComplaint,
        status: ComplaintStatus.PENDING_RESPONSE,
        investigation: {
          id: "inv_1",
          status: InvestigationStatus.IN_PROGRESS,
        },
        vigilanceDecisionTrees: [
          { id: "vig_1", status: VigilanceStatus.NOT_REPORTABLE },
        ],
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_stage_1");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve closing this complaint");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Cannot close complaint: All direct linkages must be closed first");
      expect(result.error).toContain("Investigation is still open (current status: IN PROGRESS)");
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
    });

    it("should prevent closing a complaint if linked investigation is UNDER_REVIEW", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.complaint.findUnique.mockResolvedValue({
        ...activeComplaint,
        status: ComplaintStatus.PENDING_RESPONSE,
        investigation: {
          id: "inv_1",
          status: InvestigationStatus.UNDER_REVIEW,
        },
        vigilanceDecisionTrees: [
          { id: "vig_1", status: VigilanceStatus.NOT_REPORTABLE },
        ],
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_stage_1");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve closing this complaint");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Investigation is still open (current status: UNDER REVIEW)");
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
    });

    it("should prevent closing a complaint if linked vigilance assessment is PENDING or REPORTABLE", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.complaint.findUnique.mockResolvedValue({
        ...activeComplaint,
        status: ComplaintStatus.PENDING_RESPONSE,
        investigation: {
          id: "inv_1",
          status: InvestigationStatus.COMPLETED,
        },
        vigilanceDecisionTrees: [
          { id: "vig_1", status: VigilanceStatus.PENDING },
          { id: "vig_2", status: VigilanceStatus.REPORTABLE },
        ],
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_stage_1");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve closing this complaint");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Vigilance Decision Tree assessment is not finalized (2 assessment(s) pending/in-progress)");
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
    });

    it("should allow closing a complaint when investigation is NOT_REQUIRED and vigilance is SUBMITTED", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      const readyComplaint = {
        ...activeComplaint,
        status: ComplaintStatus.PENDING_RESPONSE,
        investigation: {
          id: "inv_1",
          status: InvestigationStatus.NOT_REQUIRED,
        },
        vigilanceDecisionTrees: [
          { id: "vig_1", status: VigilanceStatus.SUBMITTED },
        ],
      };

      mockTx.complaint.findUnique.mockResolvedValue(readyComplaint);
      mockTx.complaint.update.mockResolvedValue({
        ...readyComplaint,
        status: ComplaintStatus.CLOSED,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_close_not_req" });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_stage_1");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve closing this complaint");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("CLOSED");
      expect(mockTx.complaint.update).toHaveBeenCalledWith({
        where: { id: "cmp_stage_1", orgId: "org_test456" },
        data: { status: "CLOSED" },
      });
    });

    it("should allow closing a complaint when vigilance assessment is CANCELLED", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      const readyComplaint = {
        ...activeComplaint,
        status: ComplaintStatus.PENDING_RESPONSE,
        investigation: {
          id: "inv_1",
          status: InvestigationStatus.COMPLETED,
        },
        vigilanceDecisionTrees: [
          { id: "vig_1", status: VigilanceStatus.CANCELLED },
        ],
      };

      mockTx.complaint.findUnique.mockResolvedValue(readyComplaint);
      mockTx.complaint.update.mockResolvedValue({
        ...readyComplaint,
        status: ComplaintStatus.CLOSED,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_close_vig_cancelled" });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_stage_1");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve closing this complaint");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("CLOSED");
    });
  });

  describe("User Permissions & Role Guardrails for Complaint Closure", () => {
    const readyComplaint = {
      ...activeComplaint,
      status: ComplaintStatus.PENDING_RESPONSE,
      investigation: {
        id: "inv_1",
        status: InvestigationStatus.COMPLETED,
      },
      vigilanceDecisionTrees: [
        {
          id: "vig_1",
          status: VigilanceStatus.NOT_REPORTABLE,
        },
      ],
    };

    it("should reject closing complaint when user is a standard member without QA/Admin approval rights", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.complaint.findUnique.mockResolvedValue(readyComplaint);

      // Simulate standard member with no admin, qa_manager, or approve_close permissions
      mockAuth.mockResolvedValueOnce({
        userId: "user_member_1",
        orgId: "org_test456",
        orgRole: "org:member",
        has: () => false,
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_stage_1");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve closing this complaint");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "403 Forbidden: Only QA Managers and Administrators have the required permissions to approve and complete this Complaint."
      );
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should allow closing complaint when user has QA_MANAGER role", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.complaint.findUnique.mockResolvedValue(readyComplaint);
      mockTx.complaint.update.mockResolvedValue({
        ...readyComplaint,
        status: ComplaintStatus.CLOSED,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_qa_close" });

      mockAuth.mockResolvedValueOnce({
        userId: "user_qa_mgr",
        orgId: "org_test456",
        orgRole: "org:qa_manager",
        has: (param: any) => param?.role === "org:qa_manager",
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_stage_1");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve closing this complaint");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("CLOSED");
      expect(mockTx.complaint.update).toHaveBeenCalledWith({
        where: { id: "cmp_stage_1", orgId: "org_test456" },
        data: { status: "CLOSED" },
      });
    });

    it("should allow closing complaint when user has custom COMPLAINTS_APPROVE_CLOSE permission", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.complaint.findUnique.mockResolvedValue(readyComplaint);
      mockTx.complaint.update.mockResolvedValue({
        ...readyComplaint,
        status: ComplaintStatus.CLOSED,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_perm_close" });

      mockAuth.mockResolvedValueOnce({
        userId: "user_custom_delegate",
        orgId: "org_test456",
        orgRole: "org:member",
        has: (param: any) => param?.permission === "org:complaints:approve_close",
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_stage_1");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve closing this complaint");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("CLOSED");
    });

    it("should reject reopening a closed complaint when user lacks QA/Admin rights", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.complaint.findUnique.mockResolvedValue({
        ...readyComplaint,
        status: ComplaintStatus.CLOSED,
      });

      mockAuth.mockResolvedValueOnce({
        userId: "user_unauthorized",
        orgId: "org_test456",
        orgRole: "org:member",
        has: () => false,
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_stage_1");
      formData.set("newStatus", "REOPENED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am author of this change");
      formData.set("rationale", "New evidence discovered");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "403 Forbidden: Only QA Managers and Administrators have the required permissions to reopen / revert from completed this Complaint."
      );
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
    });
  });
});
