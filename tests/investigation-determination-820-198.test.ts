import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuditAction, ComplaintStatus, InvestigationStatus, VigilanceStatus } from "@prisma/client";

const { mockVerifyPassword, mockAuth, mockTx } = vi.hoisted(() => {
  const verifyPassword = vi.fn();
  const authFn = vi.fn().mockResolvedValue({
    userId: "user_qa_evaluator_1",
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
    recordLock: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: "user_qa_evaluator_1",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@medicaldevices.com",
      }),
    },
    organizationMember: {
      findUnique: vi.fn().mockResolvedValue({
        role: "Quality Assurance Lead",
      }),
    },
    organization: {
      findUnique: vi.fn().mockResolvedValue({
        id: "org_test456",
        name: "Acme MedTech Inc.",
      }),
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
    userId: "user_qa_evaluator_1",
    orgId: "org_test456",
    orgRole: "Quality Assurance Lead",
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
 * Regulatory Standard: FDA 21 CFR § 820.198(b) (Complaint Files - Review & Evaluation)
 * ISO Standard: ISO 13485:2016 Clause 8.2.2 (Complaint Handling)
 * URS: URS-002, URS-003
 */
describe("[21 CFR § 820.198(b)] Complaint Evaluation: Investigation Determination & Documentation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const activeInvestigation = {
    id: "inv_123",
    complaintId: "cmp_456",
    orgId: "org_test456",
    status: InvestigationStatus.NOT_STARTED,
    sampleAnalysisRequired: false,
    riskReviewRequired: false,
    investigationSummaryCompletedById: null,
  };

  it("should REJECT moving investigation to NOT_REQUIRED when rationale is missing", async () => {
    mockVerifyPassword.mockResolvedValue({ verified: true });
    mockTx.investigation.findUnique.mockResolvedValue(activeInvestigation);

    const formData = new FormData();
    formData.set("entityType", "Investigation");
    formData.set("entityId", "inv_123");
    formData.set("newStatus", "NOT_REQUIRED");
    formData.set("password", "QualityPass2026!");
    formData.set("meaningOfSignature", "I am approving this change");
    // rationale omitted

    const result = await executeStatusTransition(null, formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("A documented rationale is mandatory when determining that an investigation is not required per 21 CFR § 820.198(b)");
    expect(mockTx.investigation.update).not.toHaveBeenCalled();
  });

  it("should REJECT moving investigation to NOT_REQUIRED when rationale is only whitespace", async () => {
    mockVerifyPassword.mockResolvedValue({ verified: true });
    mockTx.investigation.findUnique.mockResolvedValue(activeInvestigation);

    const formData = new FormData();
    formData.set("entityType", "Investigation");
    formData.set("entityId", "inv_123");
    formData.set("newStatus", "NOT_REQUIRED");
    formData.set("password", "QualityPass2026!");
    formData.set("meaningOfSignature", "I am approving this change");
    formData.set("rationale", "     ");

    const result = await executeStatusTransition(null, formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain("A documented rationale is mandatory when determining that an investigation is not required per 21 CFR § 820.198(b)");
    expect(mockTx.investigation.update).not.toHaveBeenCalled();
  });

  it("should SUCCEED moving investigation to NOT_REQUIRED when valid rationale and signature are provided, documenting reason and responsible user", async () => {
    mockVerifyPassword.mockResolvedValue({ verified: true });
    mockTx.investigation.findUnique.mockResolvedValue(activeInvestigation);
    mockTx.investigation.update.mockResolvedValue({
      ...activeInvestigation,
      status: InvestigationStatus.NOT_REQUIRED,
      noInvestigationReason: "Evaluated by QA: Non-safety cosmetic packaging scratch. Confirmed no impact to sterile barrier or device functionality per SOP-QA-301.",
      noInvestigationDeterminedById: "user_qa_evaluator_1",
      noInvestigationDeterminedAt: new Date(),
    });
    mockTx.auditLog.create.mockResolvedValue({ id: "audit_not_req_sig" });

    const documentedRationale = "Evaluated by QA: Non-safety cosmetic packaging scratch. Confirmed no impact to sterile barrier or device functionality per SOP-QA-301.";

    const formData = new FormData();
    formData.set("entityType", "Investigation");
    formData.set("entityId", "inv_123");
    formData.set("newStatus", "NOT_REQUIRED");
    formData.set("password", "QualityPass2026!");
    formData.set("meaningOfSignature", "I am approving this change");
    formData.set("rationale", documentedRationale);

    const result = await executeStatusTransition(null, formData);

    expect(result.success).toBe(true);
    expect(result.updatedStatus).toBe("NOT_REQUIRED");

    // Verify investigation update persisted reason, responsible user, and timestamp
    expect(mockTx.investigation.update).toHaveBeenCalledWith({
      where: { id: "inv_123", orgId: "org_test456" },
      data: {
        status: "NOT_REQUIRED",
        noInvestigationReason: documentedRationale,
        noInvestigationDeterminedById: "user_qa_evaluator_1",
        noInvestigationDeterminedAt: expect.any(Date),
      },
    });

    // Verify immutable 21 CFR Part 11 audit log captures the responsible individual and justification
    expect(mockTx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orgId: "org_test456",
        entityType: "Investigation",
        entityId: "inv_123",
        action: AuditAction.STATUS_CHANGE,
        changedById: "user_qa_evaluator_1",
        signerName: "Jane Doe",
        signerEmail: "jane.doe@medicaldevices.com",
        signerRole: "Quality Assurance Lead",
        signatureMeaning: "I am approving this change",
        reason: expect.stringContaining(documentedRationale),
      }),
    });
  });

  it("should reset determination fields if investigation is reverted from NOT_REQUIRED back to NOT_STARTED", async () => {
    mockVerifyPassword.mockResolvedValue({ verified: true });
    const notRequiredInvestigation = {
      ...activeInvestigation,
      status: InvestigationStatus.NOT_REQUIRED,
      noInvestigationReason: "Old reason",
      noInvestigationDeterminedById: "user_qa_evaluator_1",
      noInvestigationDeterminedAt: new Date(),
    };

    mockTx.investigation.findUnique.mockResolvedValue(notRequiredInvestigation);
    mockTx.investigation.update.mockResolvedValue({
      ...notRequiredInvestigation,
      status: InvestigationStatus.NOT_STARTED,
      noInvestigationReason: null,
      noInvestigationDeterminedById: null,
      noInvestigationDeterminedAt: null,
    });
    mockTx.auditLog.create.mockResolvedValue({ id: "audit_revert_sig" });

    const revertRationale = "New complaint details received from clinician indicating malfunction. Full investigation initiated.";

    const formData = new FormData();
    formData.set("entityType", "Investigation");
    formData.set("entityId", "inv_123");
    formData.set("newStatus", "NOT_STARTED");
    formData.set("password", "QualityPass2026!");
    formData.set("meaningOfSignature", "I have reviewed and verified this change");
    formData.set("rationale", revertRationale);

    const result = await executeStatusTransition(null, formData);

    expect(result.success).toBe(true);
    expect(result.updatedStatus).toBe("NOT_STARTED");

    expect(mockTx.investigation.update).toHaveBeenCalledWith({
      where: { id: "inv_123", orgId: "org_test456" },
      data: {
        status: "NOT_STARTED",
        noInvestigationReason: null,
        noInvestigationDeterminedById: null,
        noInvestigationDeterminedAt: null,
      },
    });
  });

  it("should allow closing the complaint when investigation is NOT_REQUIRED and vigilance is finalized", async () => {
    mockVerifyPassword.mockResolvedValue({ verified: true });
    const compliantComplaint = {
      id: "cmp_456",
      orgId: "org_test456",
      status: ComplaintStatus.PENDING_RESPONSE,
      investigation: {
        id: "inv_123",
        status: InvestigationStatus.NOT_REQUIRED,
        noInvestigationReason: "Pre-existing duplicate complaint investigated under CMP-2026-0042.",
      },
      vigilanceDecisionTrees: [
        { id: "vig_1", status: VigilanceStatus.NOT_REPORTABLE },
      ],
    };

    mockTx.complaint.findUnique.mockResolvedValue(compliantComplaint);
    mockTx.complaint.update.mockResolvedValue({
      ...compliantComplaint,
      status: ComplaintStatus.CLOSED,
    });
    mockTx.auditLog.create.mockResolvedValue({ id: "audit_close" });

    const formData = new FormData();
    formData.set("entityType", "Complaint");
    formData.set("entityId", "cmp_456");
    formData.set("newStatus", "CLOSED");
    formData.set("password", "QualityPass2026!");
    formData.set("meaningOfSignature", "I am the responsible quality manager");

    const result = await executeStatusTransition(null, formData);

    expect(result.success).toBe(true);
    expect(result.updatedStatus).toBe("CLOSED");
    expect(mockTx.complaint.update).toHaveBeenCalledWith({
      where: { id: "cmp_456", orgId: "org_test456" },
      data: { status: "CLOSED" },
    });
  });
});
