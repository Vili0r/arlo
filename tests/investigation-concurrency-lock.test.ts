import { describe, it, expect, vi, beforeEach } from "vitest";
import { LockEntityType, InvestigationStatus, AuditAction } from "@prisma/client";

const { mockAuthCtx, mockTx, mockPrisma } = vi.hoisted(() => {
  const authCtx = {
    userId: "user_investigator_1",
    orgId: "org_test456",
  };

  const tx = {
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
  };
});

vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: vi.fn().mockImplementation(async () => mockAuthCtx),
  PERMISSIONS: {
    COMPLAINTS_CREATE: "org:complaints:create",
  },
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
import { updateInvestigation } from "@/lib/actions/investigations";

describe("Investigation Concurrency Control & Record Locking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthCtx.userId = "user_investigator_1";
    mockAuthCtx.orgId = "org_test456";
  });

  const baseInvestigation = {
    id: "inv_concurrency_123",
    orgId: "org_test456",
    complaintId: "cmp_concurrency_1",
    status: InvestigationStatus.IN_PROGRESS,
    investigatorId: "user_investigator_1",
    sampleAnalysisRequired: false,
    riskReviewRequired: false,
    capaRequired: false,
    fscaRequired: false,
    reportabilityReviewRequired: false,
    attachments: [],
    customSections: [],
    summary: null,
  };

  const activeLockByOtherUser = {
    id: "lock_1",
    orgId: "org_test456",
    entityType: LockEntityType.Investigation,
    recordId: "inv_concurrency_123",
    lockedById: "user_other_investigator",
    lockedAt: new Date(Date.now() - 30000), // 30s ago
    expiresAt: new Date(Date.now() + 90000), // expires in 90s (Active)
    lockedBy: {
      id: "user_other_investigator",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@arlo.io",
      imageUrl: "https://example.com/avatar.jpg",
    },
  };

  describe("acquireRecordLock action", () => {
    it("should allow a user to acquire a lock when no active lock exists", async () => {
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.recordLock.upsert.mockResolvedValue({
        id: "lock_new",
        orgId: "org_test456",
        entityType: LockEntityType.Investigation,
        recordId: "inv_concurrency_123",
        lockedById: "user_investigator_1",
        expiresAt: new Date(Date.now() + 120000),
      });

      const result = await acquireRecordLock(
        LockEntityType.Investigation,
        "inv_concurrency_123"
      );

      expect(result.success).toBe(true);
      expect(result.isLockedByMe).toBe(true);
      expect(mockTx.recordLock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            org_entity_record_lock_unique: {
              orgId: "org_test456",
              entityType: LockEntityType.Investigation,
              recordId: "inv_concurrency_123",
            },
          },
          create: expect.objectContaining({
            lockedById: "user_investigator_1",
          }),
        })
      );
    });

    it("should reject lock acquisition when another user actively holds the lock", async () => {
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      // Act as user_investigator_1 trying to acquire User 2's lock
      const result = await acquireRecordLock(
        LockEntityType.Investigation,
        "inv_concurrency_123"
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
        "This investigation is currently being edited by Jane Doe."
      );
      expect(mockTx.recordLock.upsert).not.toHaveBeenCalled();
    });

    it("should automatically clean up expired locks and grant lock to new user", async () => {
      const expiredLock = {
        ...activeLockByOtherUser,
        expiresAt: new Date(Date.now() - 10000), // Expired 10s ago
      };

      // Mock cleanup of expired lock and findUnique returning null (or expired)
      mockTx.recordLock.deleteMany.mockResolvedValue({ count: 1 });
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.recordLock.upsert.mockResolvedValue({
        id: "lock_claimed_after_expiry",
        orgId: "org_test456",
        entityType: LockEntityType.Investigation,
        recordId: "inv_concurrency_123",
        lockedById: "user_investigator_1",
        expiresAt: new Date(Date.now() + 120000),
      });

      const result = await acquireRecordLock(
        LockEntityType.Investigation,
        "inv_concurrency_123"
      );

      expect(mockTx.recordLock.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          orgId: "org_test456",
          entityType: LockEntityType.Investigation,
          recordId: "inv_concurrency_123",
          expiresAt: expect.any(Object),
        }),
      });

      expect(result.success).toBe(true);
      expect(result.isLockedByMe).toBe(true);
      expect(mockTx.recordLock.upsert).toHaveBeenCalled();
    });
  });

  describe("refreshRecordLock & releaseRecordLock actions", () => {
    it("should allow the active lock holder to refresh lock expiry", async () => {
      mockPrisma.recordLock.updateMany.mockResolvedValue({ count: 1 });

      const result = await refreshRecordLock(
        LockEntityType.Investigation,
        "inv_concurrency_123"
      );

      expect(result.success).toBe(true);
      expect(result.isLockedByMe).toBe(true);
      expect(mockPrisma.recordLock.updateMany).toHaveBeenCalledWith({
        where: {
          orgId: "org_test456",
          entityType: LockEntityType.Investigation,
          recordId: "inv_concurrency_123",
          lockedById: "user_investigator_1",
        },
        data: {
          expiresAt: expect.any(Date),
        },
      });
    });

    it("should only allow the lock holder to delete/release the lock", async () => {
      mockPrisma.recordLock.deleteMany.mockResolvedValue({ count: 1 });

      const result = await releaseRecordLock(
        LockEntityType.Investigation,
        "inv_concurrency_123"
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.recordLock.deleteMany).toHaveBeenCalledWith({
        where: {
          orgId: "org_test456",
          entityType: LockEntityType.Investigation,
          recordId: "inv_concurrency_123",
          lockedById: "user_investigator_1",
        },
      });
    });
  });

  describe("updateInvestigation concurrency enforcement", () => {
    it("should reject updateInvestigation when another user is actively editing/holding the lock", async () => {
      mockTx.investigation.findUnique.mockResolvedValue(baseInvestigation);
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      // Attempt update as user_investigator_1 while Jane Doe holds the lock
      await expect(
        updateInvestigation({
          id: "inv_concurrency_123",
          complaintId: "cmp_concurrency_1",
          orgSlug: "test-org",
          status: InvestigationStatus.IN_PROGRESS,
          notes: "Attempting concurrent edit without holding lock",
          sampleAnalysisRequired: false,
          riskReviewRequired: false,
          capaRequired: false,
          fscaRequired: false,
          reportabilityReviewRequired: false,
        })
      ).rejects.toThrow(
        "Cannot update investigation: Record is currently locked and being edited by Jane Doe."
      );

      // Verify no DB modifications or audit logs were created
      expect(mockTx.investigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should allow updateInvestigation when the active lock is held by the same user", async () => {
      mockTx.investigation.findUnique.mockResolvedValue(baseInvestigation);
      // Lock held by the same user
      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOtherUser,
        lockedById: "user_investigator_1",
        lockedBy: {
          firstName: "Current",
          lastName: "Investigator",
          email: "investigator@arlo.io",
        },
      });

      mockTx.investigation.update.mockResolvedValue({
        ...baseInvestigation,
        notes: "Authorized edit by lock holder",
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_1" });

      const result = await updateInvestigation({
        id: "inv_concurrency_123",
        complaintId: "cmp_concurrency_1",
        orgSlug: "test-org",
        status: InvestigationStatus.IN_PROGRESS,
        notes: "Authorized edit by lock holder",
        sampleAnalysisRequired: false,
        riskReviewRequired: false,
        capaRequired: false,
        fscaRequired: false,
        reportabilityReviewRequired: false,
      });

      expect(result).toBeDefined();
      expect(mockTx.investigation.update).toHaveBeenCalled();
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: "Investigation",
            entityId: "inv_concurrency_123",
            action: AuditAction.UPDATE,
            changedById: "user_investigator_1",
          }),
        })
      );
    });

    it("should allow updateInvestigation when no lock exists", async () => {
      mockTx.investigation.findUnique.mockResolvedValue(baseInvestigation);
      mockTx.recordLock.findUnique.mockResolvedValue(null); // No active lock

      mockTx.investigation.update.mockResolvedValue({
        ...baseInvestigation,
        notes: "Update with no existing lock",
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_2" });

      const result = await updateInvestigation({
        id: "inv_concurrency_123",
        complaintId: "cmp_concurrency_1",
        orgSlug: "test-org",
        status: InvestigationStatus.IN_PROGRESS,
        notes: "Update with no existing lock",
        sampleAnalysisRequired: false,
        riskReviewRequired: false,
        capaRequired: false,
        fscaRequired: false,
        reportabilityReviewRequired: false,
      });

      expect(result).toBeDefined();
      expect(mockTx.investigation.update).toHaveBeenCalled();
    });
  });
});
