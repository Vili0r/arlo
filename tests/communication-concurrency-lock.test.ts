import { describe, it, expect, vi, beforeEach } from "vitest";
import { LockEntityType, CommunicationStatus, AuditAction } from "@prisma/client";

const { mockAuthCtx, mockTx, mockPrisma, mockVerifyPassword } = vi.hoisted(() => {
  const authCtx = {
    userId: "user_primary_investigator",
    orgId: "org_test456",
  };

  const verifyPassword = vi.fn().mockResolvedValue({ verified: true });

  const tx = {
    customerCommunication: {
      findUnique: vi.fn(),
      update: vi.fn(),
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
import { updateCustomerCommunication } from "@/lib/actions/communication";
import { executeStatusTransition } from "@/lib/actions/esignature";

describe("Customer Communication Concurrency Control & Record Locking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthCtx.userId = "user_primary_investigator";
    mockAuthCtx.orgId = "org_test456";
  });

  const baseCommunication = {
    id: "comm_concurrency_101",
    orgId: "org_test456",
    complaintId: "cmp_concurrency_1",
    status: CommunicationStatus.OPEN,
    communicationDate: new Date("2026-08-10T14:30:00Z"),
    questionAsked: "Could you confirm retain sample availability?",
    customerResponse: null,
    internalNotes: "Pending customer response",
    authorId: "user_primary_investigator",
    author: {
      email: "primary@arlo.io",
      firstName: "Primary",
      lastName: "Investigator",
    },
    attachments: [],
  };

  const activeLockByOtherUser = {
    id: "lock_comm_1",
    orgId: "org_test456",
    entityType: LockEntityType.FollowUp,
    recordId: "comm_concurrency_101",
    lockedById: "user_other_investigator",
    lockedAt: new Date(Date.now() - 30000), // 30s ago
    expiresAt: new Date(Date.now() + 90000), // active for 90s more
    lockedBy: {
      id: "user_other_investigator",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@arlo.io",
      imageUrl: "https://example.com/avatar.jpg",
    },
  };

  describe("1. acquireRecordLock action for Customer Communication", () => {
    it("should allow a user to acquire a lock when no active lock exists", async () => {
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.recordLock.upsert.mockResolvedValue({
        id: "lock_new_comm",
        orgId: "org_test456",
        entityType: LockEntityType.FollowUp,
        recordId: "comm_concurrency_101",
        lockedById: "user_primary_investigator",
        expiresAt: new Date(Date.now() + 120000),
      });

      const result = await acquireRecordLock(
        LockEntityType.FollowUp,
        "comm_concurrency_101"
      );

      expect(result.success).toBe(true);
      expect(result.isLockedByMe).toBe(true);
      expect(mockTx.recordLock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            org_entity_record_lock_unique: {
              orgId: "org_test456",
              entityType: LockEntityType.FollowUp,
              recordId: "comm_concurrency_101",
            },
          },
          create: expect.objectContaining({
            lockedById: "user_primary_investigator",
          }),
        })
      );
    });

    it("should reject lock acquisition when another user actively holds the lock", async () => {
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      const result = await acquireRecordLock(
        LockEntityType.FollowUp,
        "comm_concurrency_101"
      );

      expect(result.success).toBe(false);
      expect(result.isLockedByMe).toBe(false);
      expect(result.lockedBy).toEqual({
        id: "user_other_investigator",
        name: "Jane Doe",
        email: "jane.doe@arlo.io",
        imageUrl: "https://example.com/avatar.jpg",
      });
      expect(result.message).toContain(
        "This followup is currently being edited by Jane Doe."
      );
      expect(mockTx.recordLock.upsert).not.toHaveBeenCalled();
    });

    it("should automatically clean up expired locks and grant lock to new user", async () => {
      mockTx.recordLock.deleteMany.mockResolvedValue({ count: 1 });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.recordLock.upsert.mockResolvedValue({
        id: "lock_claimed_after_expiry",
        orgId: "org_test456",
        entityType: LockEntityType.FollowUp,
        recordId: "comm_concurrency_101",
        lockedById: "user_primary_investigator",
        expiresAt: new Date(Date.now() + 120000),
      });

      const result = await acquireRecordLock(
        LockEntityType.FollowUp,
        "comm_concurrency_101"
      );

      expect(mockTx.recordLock.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          orgId: "org_test456",
          entityType: LockEntityType.FollowUp,
          recordId: "comm_concurrency_101",
          expiresAt: expect.any(Object),
        }),
      });

      expect(result.success).toBe(true);
      expect(result.isLockedByMe).toBe(true);
      expect(mockTx.recordLock.upsert).toHaveBeenCalled();
    });
  });

  describe("2. refreshRecordLock & releaseRecordLock actions", () => {
    it("should allow the active lock holder to refresh lock expiry", async () => {
      mockPrisma.recordLock.updateMany.mockResolvedValue({ count: 1 });

      const result = await refreshRecordLock(
        LockEntityType.FollowUp,
        "comm_concurrency_101"
      );

      expect(result.success).toBe(true);
      expect(result.isLockedByMe).toBe(true);
      expect(mockPrisma.recordLock.updateMany).toHaveBeenCalledWith({
        where: {
          orgId: "org_test456",
          entityType: LockEntityType.FollowUp,
          recordId: "comm_concurrency_101",
          lockedById: "user_primary_investigator",
        },
        data: {
          expiresAt: expect.any(Date),
        },
      });
    });

    it("should only allow the lock holder to delete/release the lock", async () => {
      mockPrisma.recordLock.deleteMany.mockResolvedValue({ count: 1 });

      const result = await releaseRecordLock(
        LockEntityType.FollowUp,
        "comm_concurrency_101"
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.recordLock.deleteMany).toHaveBeenCalledWith({
        where: {
          orgId: "org_test456",
          entityType: LockEntityType.FollowUp,
          recordId: "comm_concurrency_101",
          lockedById: "user_primary_investigator",
        },
      });
    });
  });

  describe("3. updateCustomerCommunication Concurrency & Lock Enforcement", () => {
    it("should reject updateCustomerCommunication when another user actively holds the lock", async () => {
      mockTx.customerCommunication.findUnique.mockResolvedValue(baseCommunication);
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      // Attempt to save communication details as user_primary_investigator while Jane Doe holds lock
      await expect(
        updateCustomerCommunication({
          communicationId: "comm_concurrency_101",
          customerResponse: "Attempting concurrent modification without lock",
          internalNotes: "Should be blocked",
        })
      ).rejects.toThrow(
        "Cannot update followup: Record is currently locked and being edited by Jane Doe."
      );

      // Ensure no database updates or audit logs were created
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should allow updateCustomerCommunication when the active lock is held by the same user", async () => {
      mockTx.customerCommunication.findUnique
        .mockResolvedValueOnce(baseCommunication)
        .mockResolvedValueOnce({
          ...baseCommunication,
          customerResponse: "Authorized update by lock holder",
        });

      // Lock held by the same user
      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOtherUser,
        lockedById: "user_primary_investigator",
        lockedBy: {
          firstName: "Primary",
          lastName: "Investigator",
          email: "primary@arlo.io",
        },
      });

      mockTx.customerCommunication.update.mockResolvedValue({
        ...baseCommunication,
        customerResponse: "Authorized update by lock holder",
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_lock_holder_update" });

      const result = await updateCustomerCommunication({
        communicationId: "comm_concurrency_101",
        customerResponse: "Authorized update by lock holder",
      });

      expect(result).toBeDefined();
      expect(result.customerResponse).toBe("Authorized update by lock holder");
      expect(mockTx.customerCommunication.update).toHaveBeenCalled();
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: "CustomerCommunication",
            entityId: "comm_concurrency_101",
            action: AuditAction.UPDATE,
            changedById: "user_primary_investigator",
          }),
        })
      );
    });

    it("should allow updateCustomerCommunication when no active lock exists", async () => {
      mockTx.customerCommunication.findUnique
        .mockResolvedValueOnce(baseCommunication)
        .mockResolvedValueOnce({
          ...baseCommunication,
          internalNotes: "Notes updated with no lock",
        });

      mockTx.recordLock.findUnique.mockResolvedValue(null); // No lock

      mockTx.customerCommunication.update.mockResolvedValue({
        ...baseCommunication,
        internalNotes: "Notes updated with no lock",
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_no_lock_update" });

      const result = await updateCustomerCommunication({
        communicationId: "comm_concurrency_101",
        internalNotes: "Notes updated with no lock",
      });

      expect(result).toBeDefined();
      expect(mockTx.customerCommunication.update).toHaveBeenCalled();
    });
  });

  describe("4. Actions / Status Transitions & E-Signature Concurrency Lock Enforcement", () => {
    it("should reject moving communication to IN_PROGRESS when another user holds the lock", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue(baseCommunication);
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_concurrency_101");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I confirm customer inquiry dispatched");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Cannot update followup: Record is currently locked and being edited by Jane Doe."
      );
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject completing / closing communication (CLOSED) when another user holds the lock", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue({
        ...baseCommunication,
        status: CommunicationStatus.IN_PROGRESS,
      });
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_concurrency_101");
      formData.set("newStatus", "CLOSED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve closing communication");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Cannot update followup: Record is currently locked and being edited by Jane Doe."
      );
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject cancelling communication (CANCELLED) when another user holds the lock", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue(baseCommunication);
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_concurrency_101");
      formData.set("newStatus", "CANCELLED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I approve cancelling communication");
      formData.set("rationale", "Duplicate communication entry");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Cannot update followup: Record is currently locked and being edited by Jane Doe."
      );
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject reverting communication stage (CLOSED -> IN_PROGRESS) when another user holds the lock", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue({
        ...baseCommunication,
        status: CommunicationStatus.CLOSED,
      });
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_concurrency_101");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I am reverting status");
      formData.set("rationale", "Need further follow up");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Cannot update followup: Record is currently locked and being edited by Jane Doe."
      );
      expect(mockTx.customerCommunication.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should successfully execute status transition when lock is held by the same user", async () => {
      mockVerifyPassword.mockResolvedValue({ verified: true });
      mockTx.customerCommunication.findUnique.mockResolvedValue(baseCommunication);
      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOtherUser,
        lockedById: "user_primary_investigator",
        lockedBy: {
          firstName: "Primary",
          lastName: "Investigator",
          email: "primary@arlo.io",
        },
      });

      mockTx.customerCommunication.update.mockResolvedValue({
        ...baseCommunication,
        status: CommunicationStatus.IN_PROGRESS,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_comm_transition_success" });

      const formData = new FormData();
      formData.set("entityType", "CustomerCommunication");
      formData.set("entityId", "comm_concurrency_101");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I confirm customer inquiry dispatched");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("IN_PROGRESS");
      expect(mockTx.customerCommunication.update).toHaveBeenCalledWith({
        where: { id: "comm_concurrency_101", orgId: "org_test456" },
        data: { status: "IN_PROGRESS" },
      });
      expect(mockTx.auditLog.create).toHaveBeenCalled();
    });
  });
});
