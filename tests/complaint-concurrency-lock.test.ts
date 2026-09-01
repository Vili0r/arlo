import { describe, it, expect, vi, beforeEach } from "vitest";
import { LockEntityType, ComplaintStatus, AuditAction, Priority } from "@prisma/client";

const { mockAuthCtx, mockTx, mockPrisma, mockVerifyPassword } = vi.hoisted(() => {
  const authCtx = {
    userId: "user_primary_qa",
    orgId: "org_test456",
  };

  const verifyPassword = vi.fn().mockResolvedValue({ verified: true });

  const tx = {
    complaint: {
      findUnique: vi.fn(),
      update: vi.fn(),
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
    attachment: {
      createMany: vi.fn(),
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

  const prismaObj = {
    $transaction: vi.fn((callback) => callback(tx)),
    recordLock: {
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  return {
    mockAuthCtx: authCtx,
    mockTx: tx,
    mockPrisma: prismaObj,
    mockVerifyPassword: verifyPassword,
  };
});

// Mock dependencies
vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: vi.fn().mockImplementation(async () => mockAuthCtx),
  PERMISSIONS: {
    COMPLAINTS_CREATE: "org:complaints:create",
    COMPLAINTS_APPROVE_CLOSE: "org:complaints:approve_close",
  },
  ROLES: {
    ADMIN: "org:admin",
    QA_MANAGER: "org:qa_manager",
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      verifyPassword: (params: { userId: string; password?: string }) =>
        mockVerifyPassword(params),
    },
  }),
  auth: () =>
    Promise.resolve({
      userId: mockAuthCtx.userId,
      orgId: mockAuthCtx.orgId,
      orgRole: "org:admin",
      has: () => true,
    }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import {
  acquireRecordLock,
  refreshRecordLock,
  releaseRecordLock,
} from "@/lib/actions/record-lock";
import { updateComplaintWithRelations } from "@/lib/actions/complaints";
import { executeStatusTransition } from "@/lib/actions/esignature";

describe("Complaint Concurrency Control & Record Locking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthCtx.userId = "user_primary_qa";
    mockAuthCtx.orgId = "org_test456";
  });

  const baseComplaint = {
    id: "cmp_concurrency_101",
    orgId: "org_test456",
    complaintNumber: "CMP-2026-0099",
    shortDescription: "Syringe plunger stuck",
    priority: Priority.HIGH,
    status: ComplaintStatus.OPEN,
    awarenessDate: new Date("2026-08-01T00:00:00Z"),
    dateReceived: new Date("2026-08-01T00:00:00Z"),
    productInformation: [],
    patientInformation: [],
    attachments: [],
    investigation: null,
    vigilanceDecisionTrees: [],
  };

  const activeLockByOtherUser = {
    id: "lock_cmp_1",
    orgId: "org_test456",
    entityType: LockEntityType.Complaint,
    recordId: "cmp_concurrency_101",
    lockedById: "user_concurrent_editor",
    lockedAt: new Date(Date.now() - 30000), // 30s ago
    expiresAt: new Date(Date.now() + 90000), // active for 90s more
    lockedBy: {
      id: "user_concurrent_editor",
      firstName: "Sarah",
      lastName: "Jenkins",
      email: "sarah.jenkins@arlo.io",
      imageUrl: "https://example.com/avatar.jpg",
    },
  };

  describe("1. acquireRecordLock action for Complaint", () => {
    it("should allow a user to acquire a lock on a complaint when no active lock exists", async () => {
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.recordLock.upsert.mockResolvedValue({
        id: "lock_new_cmp",
        orgId: "org_test456",
        entityType: LockEntityType.Complaint,
        recordId: "cmp_concurrency_101",
        lockedById: "user_primary_qa",
        expiresAt: new Date(Date.now() + 120000),
      });

      const result = await acquireRecordLock(
        LockEntityType.Complaint,
        "cmp_concurrency_101"
      );

      expect(result.success).toBe(true);
      expect(result.isLockedByMe).toBe(true);
      expect(mockTx.recordLock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            org_entity_record_lock_unique: {
              orgId: "org_test456",
              entityType: LockEntityType.Complaint,
              recordId: "cmp_concurrency_101",
            },
          },
          create: expect.objectContaining({
            lockedById: "user_primary_qa",
          }),
        })
      );
    });

    it("should reject lock acquisition when another user actively holds the complaint lock", async () => {
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      const result = await acquireRecordLock(
        LockEntityType.Complaint,
        "cmp_concurrency_101"
      );

      expect(result.success).toBe(false);
      expect(result.isLockedByMe).toBe(false);
      expect(result.lockedBy).toEqual({
        id: "user_concurrent_editor",
        name: "Sarah Jenkins",
        email: "sarah.jenkins@arlo.io",
        imageUrl: "https://example.com/avatar.jpg",
      });
      expect(result.message).toContain(
        "This complaint is currently being edited by Sarah Jenkins."
      );
      expect(mockTx.recordLock.upsert).not.toHaveBeenCalled();
    });

    it("should automatically clean up expired locks and grant lock to new user", async () => {
      mockTx.recordLock.deleteMany.mockResolvedValue({ count: 1 });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.recordLock.upsert.mockResolvedValue({
        id: "lock_claimed_after_expiry",
        orgId: "org_test456",
        entityType: LockEntityType.Complaint,
        recordId: "cmp_concurrency_101",
        lockedById: "user_primary_qa",
        expiresAt: new Date(Date.now() + 120000),
      });

      const result = await acquireRecordLock(
        LockEntityType.Complaint,
        "cmp_concurrency_101"
      );

      expect(mockTx.recordLock.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          orgId: "org_test456",
          entityType: LockEntityType.Complaint,
          recordId: "cmp_concurrency_101",
          expiresAt: expect.any(Object),
        }),
      });

      expect(result.success).toBe(true);
      expect(result.isLockedByMe).toBe(true);
      expect(mockTx.recordLock.upsert).toHaveBeenCalled();
    });
  });

  describe("2. refreshRecordLock & releaseRecordLock actions", () => {
    it("should allow the active lock holder to refresh complaint lock expiry", async () => {
      mockPrisma.recordLock.updateMany.mockResolvedValue({ count: 1 });

      const result = await refreshRecordLock(
        LockEntityType.Complaint,
        "cmp_concurrency_101"
      );

      expect(result.success).toBe(true);
      expect(result.isLockedByMe).toBe(true);
      expect(mockPrisma.recordLock.updateMany).toHaveBeenCalledWith({
        where: {
          orgId: "org_test456",
          entityType: LockEntityType.Complaint,
          recordId: "cmp_concurrency_101",
          lockedById: "user_primary_qa",
        },
        data: {
          expiresAt: expect.any(Date),
        },
      });
    });

    it("should only allow the lock holder to delete/release the lock", async () => {
      mockPrisma.recordLock.deleteMany.mockResolvedValue({ count: 1 });

      const result = await releaseRecordLock(
        LockEntityType.Complaint,
        "cmp_concurrency_101"
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.recordLock.deleteMany).toHaveBeenCalledWith({
        where: {
          orgId: "org_test456",
          entityType: LockEntityType.Complaint,
          recordId: "cmp_concurrency_101",
          lockedById: "user_primary_qa",
        },
      });
    });
  });

  describe("3. updateComplaintWithRelations Concurrency & Lock Enforcement", () => {
    it("should reject updateComplaintWithRelations when another user actively holds the lock", async () => {
      mockTx.complaint.findUnique.mockResolvedValue(baseComplaint);
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      await expect(
        updateComplaintWithRelations({
          complaintId: "cmp_concurrency_101",
          shortDescription: "Attempting update while locked by Sarah",
          priority: Priority.CRITICAL,
          awarenessDate: new Date(),
          customerName: "City Hospital",
          customerType: "HOSPITAL",
          initialReporterName: "Dr. Smith",
          initialReporterSurname: "MD",
          email: "smith@hospital.org",
          address: "100 Main St",
          country: "United States",
          telNumber: "555-0100",
          countryEventOccurred: "United States",
          region: "NORTH_AMERICA",
        })
      ).rejects.toThrow(
        "Cannot update complaint: Record is currently locked and being edited by Sarah Jenkins."
      );

      expect(mockTx.complaint.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should allow updateComplaintWithRelations when the active lock is held by the same user", async () => {
      mockTx.complaint.findUnique
        .mockResolvedValueOnce(baseComplaint)
        .mockResolvedValueOnce({
          ...baseComplaint,
          shortDescription: "Authorized edit by lock holder",
        });

      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOtherUser,
        lockedById: "user_primary_qa",
        lockedBy: {
          firstName: "Primary",
          lastName: "QA",
          email: "primary@arlo.io",
        },
      });

      mockTx.complaint.update.mockResolvedValue({
        ...baseComplaint,
        shortDescription: "Authorized edit by lock holder",
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_lock_holder_update" });

      const result = await updateComplaintWithRelations({
        complaintId: "cmp_concurrency_101",
        shortDescription: "Authorized edit by lock holder",
        priority: Priority.HIGH,
        awarenessDate: new Date(),
        customerName: "City Hospital",
        customerType: "HOSPITAL",
        initialReporterName: "Dr. Smith",
        initialReporterSurname: "MD",
        email: "smith@hospital.org",
        address: "100 Main St",
        country: "United States",
        telNumber: "555-0100",
        countryEventOccurred: "United States",
        region: "NORTH_AMERICA",
      });

      expect(result).toBeDefined();
      expect(mockTx.complaint.update).toHaveBeenCalled();
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: "Complaint",
            entityId: "cmp_concurrency_101",
            action: AuditAction.UPDATE,
            changedById: "user_primary_qa",
          }),
        })
      );
    });

    it("should allow updateComplaintWithRelations when no active lock exists", async () => {
      mockTx.complaint.findUnique
        .mockResolvedValueOnce(baseComplaint)
        .mockResolvedValueOnce({
          ...baseComplaint,
          shortDescription: "Updated with no lock",
        });

      mockTx.recordLock.findUnique.mockResolvedValue(null); // No lock

      mockTx.complaint.update.mockResolvedValue({
        ...baseComplaint,
        shortDescription: "Updated with no lock",
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_no_lock_update" });

      const result = await updateComplaintWithRelations({
        complaintId: "cmp_concurrency_101",
        shortDescription: "Updated with no lock",
        priority: Priority.HIGH,
        awarenessDate: new Date(),
        customerName: "City Hospital",
        customerType: "HOSPITAL",
        initialReporterName: "Dr. Smith",
        initialReporterSurname: "MD",
        email: "smith@hospital.org",
        address: "100 Main St",
        country: "United States",
        telNumber: "555-0100",
        countryEventOccurred: "United States",
        region: "NORTH_AMERICA",
      });

      expect(result).toBeDefined();
      expect(mockTx.complaint.update).toHaveBeenCalled();
    });
  });

  describe("4. Status Transitions & E-Signature Concurrency Lock Enforcement", () => {
    it("should reject moving complaint to IN_PROGRESS when another user holds the lock", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.complaint.findUnique.mockResolvedValue(baseComplaint);
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_concurrency_101");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I confirm initiation");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Cannot update complaint: Record is currently locked and being edited by Sarah Jenkins."
      );
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject closing complaint (CLOSED) when another user holds the lock", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.complaint.findUnique.mockResolvedValue({
        ...baseComplaint,
        status: ComplaintStatus.PENDING_RESPONSE,
      });
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_concurrency_101");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve closure");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Cannot update complaint: Record is currently locked and being edited by Sarah Jenkins."
      );
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject cancelling complaint (CANCELLED) when another user holds the lock", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.complaint.findUnique.mockResolvedValue(baseComplaint);
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_concurrency_101");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve cancelling complaint");
      formData.set("rationale", "Duplicate complaint");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Cannot update complaint: Record is currently locked and being edited by Sarah Jenkins."
      );
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
    });

    it("should successfully execute status transition when lock is held by the same user", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.complaint.findUnique.mockResolvedValue(baseComplaint);
      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOtherUser,
        lockedById: "user_primary_qa",
        lockedBy: {
          firstName: "Primary",
          lastName: "QA",
          email: "primary@arlo.io",
        },
      });

      mockTx.complaint.update.mockResolvedValue({
        ...baseComplaint,
        status: ComplaintStatus.IN_PROGRESS,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_transition_success" });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_concurrency_101");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I confirm initiation");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("IN_PROGRESS");
      expect(mockTx.complaint.update).toHaveBeenCalledWith({
        where: { id: "cmp_concurrency_101", orgId: "org_test456" },
        data: { status: "IN_PROGRESS" },
      });
    });
  });
});
