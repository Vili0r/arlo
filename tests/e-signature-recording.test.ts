import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AuditAction,
  ComplaintStatus,
  InvestigationStatus,
  CapaPhase,
} from "@prisma/client";

const { mockVerifyPassword, mockAuth, mockAuthCtx, mockTx } = vi.hoisted(() => {
  const verifyPassword = vi.fn();
  const authCtx = {
    userId: "user_qa_lead_42",
    orgId: "org_medical_device_001",
    orgRole: "org:admin",
  };
  const authFn = vi.fn().mockResolvedValue({
    userId: "user_qa_lead_42",
    orgId: "org_medical_device_001",
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
    capa: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    recordLock: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    organizationMember: {
      findUnique: vi.fn(),
    },
  };

  return {
    mockVerifyPassword: verifyPassword,
    mockAuth: authFn,
    mockAuthCtx: authCtx,
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
  requireOrgAuth: vi.fn().mockImplementation(async () => mockAuthCtx),
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
 * URS: URS-011 (21 CFR Part 11 Electronic Signatures)
 * SRS: SRS-017 (Dual-Credential E-Signature Verification & Immutability)
 * Design: DESIGN-017 (21 CFR Part 11 E-Signature)
 * Test ID: TEST-016
 */
describe("[TEST-016] 21 CFR Part 11 Electronic Signature Recording Specification", () => {
  const ORG_ID = "org_medical_device_001";
  const SIGNER_USER_ID = "user_qa_lead_42";

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.recordLock.findUnique.mockResolvedValue(null);
    mockTx.auditLog.create.mockImplementation(({ data }: any) =>
      Promise.resolve({
        id: data.id || `log_mock_${Date.now()}`,
        ...data,
        timestamp: new Date("2026-09-13T11:00:00.000Z"),
      })
    );
  });

  it("records all 6 required electronic signature manifestation components: Signature ID, User, Timestamp, Meaning, Record Version, and Authentication Event", async () => {
    // 1. Setup: Clerk validates user's password (the Authentication Event)
    mockVerifyPassword.mockResolvedValue({ verified: true });

    const complaintId = "cmp_esign_test_001";
    const initialRecord = {
      id: complaintId,
      orgId: ORG_ID,
      complaintNumber: "CMP-2026-0001",
      shortDescription: "Infusion pump motor occlusion alarm failure",
      status: ComplaintStatus.OPEN,
      version: 2,
      awarenessDate: new Date("2026-09-01T00:00:00Z"),
      dateReceived: new Date("2026-09-01T00:00:00Z"),
      customerName: "Metro Health Hospital",
      customerType: "HOSPITAL",
      initialReporterName: "Dr.",
      initialReporterSurname: "Carter",
      email: "dr.carter@metrohealth.org",
      address: "100 Medical Blvd",
      country: "US",
      telNumber: "+1-555-0199",
      countryEventOccurred: "US",
      region: "AMER",
      complaintOwnerId: SIGNER_USER_ID,
      createdById: SIGNER_USER_ID,
      investigation: null,
      vigilanceDecisionTrees: [],
    };

    const updatedRecord = {
      ...initialRecord,
      status: ComplaintStatus.IN_PROGRESS,
    };

    mockTx.complaint.findUnique.mockResolvedValue(initialRecord);
    mockTx.complaint.update.mockResolvedValue(updatedRecord);

    const formData = new FormData();
    formData.set("entityType", "Complaint");
    formData.set("entityId", complaintId);
    formData.set("newStatus", ComplaintStatus.IN_PROGRESS);
    formData.set("password", "QualitySystemPassword2026!");
    formData.set(
      "meaningOfSignature",
      "I author and approve transitioning this complaint to In Progress"
    );
    formData.set("rationale", "Commencing technical evaluation with EE lab");

    // 2. Execute Electronic Signature Status Transition
    const result = await executeStatusTransition(null, formData);

    // Verify successful operation
    expect(result.success).toBe(true);
    expect(result.updatedStatus).toBe(ComplaintStatus.IN_PROGRESS);

    // 3. Verify Authentication Event: Clerk verifyPassword was called with user ID and password
    expect(mockVerifyPassword).toHaveBeenCalledWith({
      userId: SIGNER_USER_ID,
      password: "QualitySystemPassword2026!",
    });

    // 4. Verify Audit Log was created with all 6 required components
    expect(mockTx.auditLog.create).toHaveBeenCalledTimes(1);
    const createCall = mockTx.auditLog.create.mock.calls[0][0];
    const auditData = createCall.data;

    // (1) Signature ID: unique signature identifier generated and logged
    expect(auditData.id).toBeDefined();
    expect(auditData.id).toMatch(/^sig_/);
    expect(result.signatureId).toBe(auditData.id);
    expect(auditData.reason).toContain(`Signature ID: ${auditData.id}`);

    // (2) User: authenticated user identity logged in accountability fields & reason
    expect(auditData.changedById).toBe(SIGNER_USER_ID);
    expect(auditData.reason).toContain(`Signed by: ${SIGNER_USER_ID}`);

    // (3) Timestamp: ISO 8601 timestamp manifestation recorded at execution
    expect(auditData.reason).toMatch(/Timestamp: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // (4) Meaning: regulatory intent of the signature clearly manifested
    expect(auditData.reason).toContain(
      "Meaning: I author and approve transitioning this complaint to In Progress"
    );

    // (5) Record Version: snapshots of state before & after mutation, plus version identifier
    expect(auditData.previousData).toEqual(expect.objectContaining({ status: "OPEN" }));
    expect(auditData.newData).toEqual(expect.objectContaining({ status: "IN_PROGRESS" }));
    expect(auditData.reason).toContain("Record Version: 2");

    // (6) Authentication Event: re-authentication proof recorded
    expect(auditData.action).toBe(AuditAction.STATUS_CHANGE);
    expect(auditData.reason).toContain("Authentication Event: PASSWORD_VERIFICATION_SUCCESS");
  });

  it("captures Record Version as status transition states when explicit version number is not present", async () => {
    mockVerifyPassword.mockResolvedValue({ verified: true });

    const complaintId = "cmp_no_explicit_version_002";
    const initialComplaint = {
      id: complaintId,
      orgId: ORG_ID,
      complaintNumber: "CMP-2026-0002",
      shortDescription: "Syringe barrel cracked during transit",
      status: ComplaintStatus.OPEN,
      // No explicit version or formTemplateVersion property
      awarenessDate: new Date("2026-09-01T00:00:00Z"),
      dateReceived: new Date("2026-09-01T00:00:00Z"),
      customerName: "Metro Health Hospital",
      customerType: "HOSPITAL",
      initialReporterName: "Dr.",
      initialReporterSurname: "Carter",
      email: "dr.carter@metrohealth.org",
      address: "100 Medical Blvd",
      country: "US",
      telNumber: "+1-555-0199",
      countryEventOccurred: "US",
      region: "AMER",
      complaintOwnerId: SIGNER_USER_ID,
      createdById: SIGNER_USER_ID,
      investigation: null,
      vigilanceDecisionTrees: [],
    };

    const updatedComplaint = {
      ...initialComplaint,
      status: ComplaintStatus.IN_PROGRESS,
    };

    mockTx.complaint.findUnique.mockResolvedValue(initialComplaint);
    mockTx.complaint.update.mockResolvedValue(updatedComplaint);

    const formData = new FormData();
    formData.set("entityType", "Complaint");
    formData.set("entityId", complaintId);
    formData.set("newStatus", ComplaintStatus.IN_PROGRESS);
    formData.set("password", "SecureQA2026!");
    formData.set(
      "meaningOfSignature",
      "I approve commencing investigation for this complaint"
    );

    const result = await executeStatusTransition(null, formData);

    expect(result.success).toBe(true);
    expect(mockTx.auditLog.create).toHaveBeenCalledTimes(1);

    const auditData = mockTx.auditLog.create.mock.calls[0][0].data;

    // Verify all 6 components
    expect(auditData.id).toMatch(/^sig_/); // (1) Signature ID
    expect(auditData.changedById).toBe(SIGNER_USER_ID); // (2) User
    expect(auditData.reason).toContain(`Signed by: ${SIGNER_USER_ID}`);
    expect(auditData.reason).toContain("Timestamp:"); // (3) Timestamp
    expect(auditData.reason).toContain(
      "Meaning: I approve commencing investigation for this complaint" // (4) Meaning
    );
    expect(auditData.reason).toContain("Record Version: OPEN → IN_PROGRESS"); // (5) Record Version
    expect(auditData.reason).toContain("Authentication Event: PASSWORD_VERIFICATION_SUCCESS"); // (6) Authentication Event
    expect(auditData.action).toBe(AuditAction.STATUS_CHANGE);
  });

  it("aborts signature recording if Authentication Event fails (fail-closed integrity)", async () => {
    // Authentication fails (incorrect password)
    mockVerifyPassword.mockResolvedValue({ verified: false });

    const complaintId = "cmp_fail_auth_001";
    mockTx.complaint.findUnique.mockResolvedValue({
      id: complaintId,
      orgId: ORG_ID,
      status: ComplaintStatus.OPEN,
    });

    const formData = new FormData();
    formData.set("entityType", "Complaint");
    formData.set("entityId", complaintId);
    formData.set("newStatus", ComplaintStatus.IN_PROGRESS);
    formData.set("password", "WrongPassword!");
    formData.set("meaningOfSignature", "Attempted approval");

    const result = await executeStatusTransition(null, formData);

    // Operation must fail
    expect(result.success).toBe(false);
    expect(result.error).toContain("Password verification failed");

    // Database must not record status change or audit log
    expect(mockTx.complaint.update).not.toHaveBeenCalled();
    expect(mockTx.auditLog.create).not.toHaveBeenCalled();
  });

  it("records all 6 components during Record Cancellation with mandatory rationale", async () => {
    mockVerifyPassword.mockResolvedValue({ verified: true });

    const complaintId = "cmp_cancel_test_003";
    const initialComplaint = {
      id: complaintId,
      orgId: ORG_ID,
      complaintNumber: "CMP-2026-0003",
      status: ComplaintStatus.OPEN,
      complaintOwnerId: SIGNER_USER_ID,
      customerName: "Clinic North",
      customerType: "CLINIC",
      initialReporterName: "Nurse",
      initialReporterSurname: "Adams",
      email: "adams@clinicnorth.com",
      address: "123 North St",
      country: "US",
      telNumber: "555-0100",
      countryEventOccurred: "US",
      region: "AMER",
      awarenessDate: new Date("2026-09-01T00:00:00Z"),
      dateReceived: new Date("2026-09-01T00:00:00Z"),
      shortDescription: "Duplicate report submitted in error",
    };

    mockTx.complaint.findUnique.mockResolvedValue(initialComplaint);
    mockTx.complaint.update.mockResolvedValue({
      ...initialComplaint,
      status: ComplaintStatus.CANCELLED,
    });

    const formData = new FormData();
    formData.set("entityType", "Complaint");
    formData.set("entityId", complaintId);
    formData.set("newStatus", ComplaintStatus.CANCELLED);
    formData.set("password", "CancelPass2026!");
    formData.set("meaningOfSignature", "I formally cancel this complaint record");
    formData.set("rationale", "Duplicate of CMP-2026-0001 submitted by customer twice");

    const result = await executeStatusTransition(null, formData);

    expect(result.success).toBe(true);

    const auditData = mockTx.auditLog.create.mock.calls[0][0].data;

    // Verify all 6 components for Cancellation
    expect(auditData.id).toMatch(/^sig_/); // (1) Signature ID
    expect(auditData.changedById).toBe(SIGNER_USER_ID); // (2) User
    expect(auditData.reason).toContain("Timestamp:"); // (3) Timestamp
    expect(auditData.reason).toContain("Meaning: I formally cancel this complaint record"); // (4) Meaning
    expect(auditData.reason).toContain("Record Version: OPEN → CANCELLED"); // (5) Record Version
    expect(auditData.reason).toContain("Authentication Event: PASSWORD_VERIFICATION_SUCCESS"); // (6) Authentication Event
    expect(auditData.reason).toContain("Rationale: Duplicate of CMP-2026-0001 submitted by customer twice");
    expect(auditData.reason).toContain("E-SIGNATURE RECORD CANCELLATION: OPEN → CANCELLED");
  });

  it("records all 6 components during Stage Reversion with mandatory rationale", async () => {
    mockVerifyPassword.mockResolvedValue({ verified: true });

    const capaId = "capa_revert_test_004";
    const initialCapa = {
      id: capaId,
      orgId: ORG_ID,
      capaNumber: "CAPA-2026-0001",
      currentPhase: CapaPhase.IMPLEMENTATION,
      ownerId: SIGNER_USER_ID,
    };

    mockTx.capa.findUnique.mockResolvedValue(initialCapa);
    mockTx.capa.update.mockResolvedValue({
      ...initialCapa,
      currentPhase: CapaPhase.INVESTIGATION,
    });

    const formData = new FormData();
    formData.set("entityType", "Capa");
    formData.set("entityId", capaId);
    formData.set("newStatus", CapaPhase.INVESTIGATION);
    formData.set("password", "RevertPass2026!");
    formData.set(
      "meaningOfSignature",
      "I approve reverting this CAPA to Investigation phase"
    );
    formData.set(
      "rationale",
      "Root cause analysis incomplete; additional lab testing required"
    );

    const result = await executeStatusTransition(null, formData);

    expect(result.success).toBe(true);

    const auditData = mockTx.auditLog.create.mock.calls[0][0].data;

    // Verify all 6 components for Reversion
    expect(auditData.id).toMatch(/^sig_/); // (1) Signature ID
    expect(auditData.changedById).toBe(SIGNER_USER_ID); // (2) User
    expect(auditData.reason).toContain("Timestamp:"); // (3) Timestamp
    expect(auditData.reason).toContain(
      "Meaning: I approve reverting this CAPA to Investigation phase" // (4) Meaning
    );
    expect(auditData.reason).toContain("Record Version: IMPLEMENTATION → INVESTIGATION"); // (5) Record Version
    expect(auditData.reason).toContain("Authentication Event: PASSWORD_VERIFICATION_SUCCESS"); // (6) Authentication Event
    expect(auditData.reason).toContain(
      "Rationale: Root cause analysis incomplete; additional lab testing required"
    );
    expect(auditData.reason).toContain(
      "E-SIGNATURE STAGE REVERSION: IMPLEMENTATION → INVESTIGATION"
    );
  });

  it("records immutable historical authorization snapshot (name, role at time, organization, meaning, version)", async () => {
    mockVerifyPassword.mockResolvedValue({ verified: true });

    const capaId = "capa_snapshot_test_005";
    const initialCapa = {
      id: capaId,
      orgId: ORG_ID,
      capaNumber: "CAPA-001",
      version: 4,
      currentPhase: CapaPhase.EFFECTIVENESS,
      ownerId: SIGNER_USER_ID,
    };

    mockTx.capa.findUnique.mockResolvedValue(initialCapa);
    mockTx.capa.update.mockResolvedValue({
      ...initialCapa,
      currentPhase: CapaPhase.CLOSED,
    });

    // Mock DB user and organization lookups
    mockTx.user.findUnique.mockResolvedValue({
      id: SIGNER_USER_ID,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@acmemedical.com",
    });

    mockTx.organization.findUnique.mockResolvedValue({
      id: ORG_ID,
      name: "Acme Medical",
    });

    // Signer holds QA Manager role at time of approval
    mockAuthCtx.orgRole = "org:qa_manager";

    const formData = new FormData();
    formData.set("entityType", "Capa");
    formData.set("entityId", capaId);
    formData.set("newStatus", CapaPhase.CLOSED);
    formData.set("password", "PassValid2026!");
    formData.set("meaningOfSignature", "Approved CAPA Closure");

    const result = await executeStatusTransition(null, formData);

    expect(result.success).toBe(true);
    expect(mockTx.auditLog.create).toHaveBeenCalledTimes(1);

    const auditData = mockTx.auditLog.create.mock.calls[0][0].data;

    // Verify historical snapshot fields are captured immutably
    expect(auditData.signerName).toBe("John Smith");
    expect(auditData.signerEmail).toBe("john.smith@acmemedical.com");
    expect(auditData.signerRole).toBe("org:qa_manager");
    expect(auditData.organizationName).toBe("Acme Medical");
    expect(auditData.signatureMeaning).toBe("Approved CAPA Closure");
    expect(auditData.recordVersion).toBe("4");
    expect(auditData.changedById).toBe(SIGNER_USER_ID);

    // Verify reason string contains human-readable evidence
    expect(auditData.reason).toContain("Role at signing: org:qa_manager");
    expect(auditData.reason).toContain("Organization: Acme Medical");
    expect(auditData.reason).toContain("Meaning: Approved CAPA Closure");
    expect(auditData.reason).toContain("Record Version: 4");
  });

  it("historical approval snapshot preserves original role and authority even if user's role is subsequently downgraded to Read Only in Clerk", async () => {
    mockVerifyPassword.mockResolvedValue({ verified: true });

    const capaId = "capa_downgrade_test_006";
    const initialCapa = {
      id: capaId,
      orgId: ORG_ID,
      capaNumber: "CAPA-001",
      version: 4,
      currentPhase: CapaPhase.EFFECTIVENESS,
      ownerId: SIGNER_USER_ID,
    };

    mockTx.capa.findUnique.mockResolvedValue(initialCapa);
    mockTx.capa.update.mockResolvedValue({
      ...initialCapa,
      currentPhase: CapaPhase.CLOSED,
    });

    mockTx.user.findUnique.mockResolvedValue({
      id: SIGNER_USER_ID,
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@acmemedical.com",
    });

    mockTx.organization.findUnique.mockResolvedValue({
      id: ORG_ID,
      name: "Acme Medical",
    });

    // 1. At time of approval: John Smith is QA Manager
    mockAuthCtx.orgRole = "org:qa_manager";

    const formData = new FormData();
    formData.set("entityType", "Capa");
    formData.set("entityId", capaId);
    formData.set("newStatus", CapaPhase.CLOSED);
    formData.set("password", "PassValid2026!");
    formData.set("meaningOfSignature", "Approved CAPA Closure");

    const result = await executeStatusTransition(null, formData);
    expect(result.success).toBe(true);

    const savedAuditEntry = mockTx.auditLog.create.mock.calls[0][0].data;

    // 2. Six months later: user's role is downgraded in Clerk to Read Only
    mockAuthCtx.orgRole = "org:read_only";

    // 3. The historical approval entry in the database STILL has the original snapshot!
    expect(savedAuditEntry.signerName).toBe("John Smith");
    expect(savedAuditEntry.signerRole).toBe("org:qa_manager"); // Remains QA Manager
    expect(savedAuditEntry.organizationName).toBe("Acme Medical");
    expect(savedAuditEntry.signatureMeaning).toBe("Approved CAPA Closure");
    expect(savedAuditEntry.recordVersion).toBe("4");
    expect(savedAuditEntry.reason).toContain("Role at signing: org:qa_manager");
  });
});

