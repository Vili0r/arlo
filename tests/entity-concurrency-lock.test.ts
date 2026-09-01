import { describe, it, expect, vi, beforeEach } from "vitest";
import { LockEntityType, ComplaintStatus, VigilanceStatus, TaskStatus, CapaPhase, CapaType } from "@prisma/client";

const { mockAuthCtx, mockTx, mockPrisma } = vi.hoisted(() => {
  const authCtx = {
    userId: "user_primary",
    orgId: "org_test456",
  };

  const tx = {
    complaint: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    customerCommunication: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    vigilanceDecisionTree: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    complaintTask: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    capa: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    capaInitiation: {
      upsert: vi.fn(),
    },
    capaInvestigation: {
      upsert: vi.fn(),
    },
    capaImplementation: {
      upsert: vi.fn(),
    },
    capaEffectiveness: {
      upsert: vi.fn(),
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
  ROLES: {
    ADMIN: "org:admin",
    QA_MANAGER: "org:qa_manager",
  },
  PERMISSIONS: {
    COMPLAINTS_CREATE: "org:complaints:create",
    COMPLAINTS_APPROVE_CLOSE: "org:complaints:approve_close",
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      verifyPassword: vi.fn().mockResolvedValue({ verified: true }),
    },
  }),
  auth: vi.fn().mockResolvedValue({
    userId: "user_primary",
    orgId: "org_test456",
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
  assertRecordNotLocked,
} from "@/lib/actions/record-lock";
import { executeStatusTransition } from "@/lib/actions/esignature";
import { updateComplaintWithRelations } from "@/lib/actions/complaints";
import { updateCustomerCommunication } from "@/lib/actions/communication";
import { updateVigilance } from "@/lib/actions/vigilance";
import { updateComplaintTask } from "@/lib/actions/task";
import { updateCapa } from "@/lib/actions/capa";

describe("Entity Concurrency Control & Record Locking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthCtx.userId = "user_primary";
    mockAuthCtx.orgId = "org_test456";
  });

  const activeLockByOther = {
    id: "lock_other",
    orgId: "org_test456",
    entityType: LockEntityType.Complaint,
    recordId: "rec_123",
    lockedById: "user_other",
    lockedAt: new Date(Date.now() - 10000),
    expiresAt: new Date(Date.now() + 60000),
    lockedBy: {
      id: "user_other",
      firstName: "Alex",
      lastName: "Smith",
      email: "alex.smith@example.com",
      imageUrl: null,
    },
  };

  describe("assertRecordNotLocked helper", () => {
    it("should pass without error when no active lock exists", async () => {
      mockTx.recordLock.findUnique.mockResolvedValue(null);

      await expect(
        assertRecordNotLocked(
          mockTx,
          "org_test456",
          LockEntityType.Complaint,
          "rec_123",
          "user_primary"
        )
      ).resolves.toBeUndefined();
    });

    it("should pass when the active lock is held by the same user", async () => {
      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOther,
        lockedById: "user_primary",
      });

      await expect(
        assertRecordNotLocked(
          mockTx,
          "org_test456",
          LockEntityType.Complaint,
          "rec_123",
          "user_primary"
        )
      ).resolves.toBeUndefined();
    });

    it("should throw an informative error when locked by another user", async () => {
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOther);

      await expect(
        assertRecordNotLocked(
          mockTx,
          "org_test456",
          LockEntityType.Complaint,
          "rec_123",
          "user_primary"
        )
      ).rejects.toThrow(
        "Cannot update complaint: Record is currently locked and being edited by Alex Smith."
      );
    });
  });

  describe("Server Actions Lock Enforcement", () => {
    it("Complaint: updateComplaintWithRelations should fail when locked by another user", async () => {
      mockTx.complaint.findUnique.mockResolvedValue({
        id: "cmp_1",
        orgId: "org_test456",
        awarenessDate: new Date(),
        dateReceived: new Date(),
        productInformation: [],
        patientInformation: [],
        attachments: [],
      });
      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOther,
        entityType: LockEntityType.Complaint,
        recordId: "cmp_1",
      });

      await expect(
        updateComplaintWithRelations({
          complaintId: "cmp_1",
          awarenessDate: new Date().toISOString(),
          shortDescription: "Updated complaint",
        } as any)
      ).rejects.toThrow(
        "Cannot update complaint: Record is currently locked and being edited by Alex Smith."
      );
    });

    it("Communication: updateCustomerCommunication should fail when locked by another user", async () => {
      mockTx.customerCommunication.findUnique.mockResolvedValue({
        id: "comm_1",
        orgId: "org_test456",
        complaintId: "cmp_1",
        attachments: [],
        author: { email: "author@test.com" },
      });
      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOther,
        entityType: LockEntityType.FollowUp,
        recordId: "comm_1",
      });

      await expect(
        updateCustomerCommunication({
          communicationId: "comm_1",
          questionAsked: "New question",
        })
      ).rejects.toThrow(
        "Cannot update followup: Record is currently locked and being edited by Alex Smith."
      );
    });

    it("Vigilance: updateVigilance should fail when locked by another user", async () => {
      mockTx.vigilanceDecisionTree.findUnique.mockResolvedValue({
        id: "vig_1",
        orgId: "org_test456",
        complaintId: "cmp_1",
        attachments: [],
      });
      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOther,
        entityType: LockEntityType.Vigilance,
        recordId: "vig_1",
      });

      await expect(
        updateVigilance({
          id: "vig_1",
          orgSlug: "cvmed",
          status: VigilanceStatus.REPORTABLE,
        })
      ).rejects.toThrow(
        "Cannot update vigilance: Record is currently locked and being edited by Alex Smith."
      );
    });

    it("Task: updateComplaintTask should fail when locked by another user", async () => {
      mockTx.complaintTask.findUnique.mockResolvedValue({
        id: "task_1",
        orgId: "org_test456",
        complaintId: "cmp_1",
        shortDescription: "Original Task",
        attachments: [],
      });
      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOther,
        entityType: LockEntityType.Task,
        recordId: "task_1",
      });

      await expect(
        updateComplaintTask({
          id: "task_1",
          orgSlug: "cvmed",
          shortDescription: "New task title",
        })
      ).rejects.toThrow(
        "Cannot update task: Record is currently locked and being edited by Alex Smith."
      );
    });

    it("CAPA: updateCapa should fail when locked by another user", async () => {
      mockTx.capa.findUnique.mockResolvedValue({
        id: "capa_1",
        orgId: "org_test456",
        capaNumber: "CAPA-2026-0001",
        ownerId: "user_primary",
        initiation: {},
        investigation: {},
        implementation: {},
        effectiveness: {},
      });
      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOther,
        entityType: LockEntityType.Capa,
        recordId: "capa_1",
      });

      await expect(
        updateCapa("capa_1", {
          shortDescription: "Updated CAPA",
          type: CapaType.CORRECTIVE,
          currentPhase: CapaPhase.INITIATION,
          ownerId: "user_primary",
          cancellationRequested: false,
          initiation: {
            problemStatement: "Problem statement here",
            repeatCapa: false,
            existingCapa: false,
            capaRequired: true,
            fscaRequired: false,
          },
        } as any)
      ).rejects.toThrow(
        "Cannot update capa: Record is currently locked and being edited by Alex Smith."
      );
    });

    it("Status Transition: executeStatusTransition should fail when entity is locked by another user", async () => {
      mockTx.complaint.findUnique.mockResolvedValue({
        id: "cmp_1",
        orgId: "org_test456",
        status: ComplaintStatus.OPEN,
        awarenessDate: new Date(),
        dateReceived: new Date(),
      });
      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOther,
        entityType: LockEntityType.Complaint,
        recordId: "cmp_1",
      });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_1");
      formData.set("newStatus", "INVESTIGATION");
      formData.set("password", "correct_password");
      formData.set("meaningOfSignature", "I approve this transition.");

      const result = await executeStatusTransition(null, formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Cannot update complaint: Record is currently locked and being edited by Alex Smith."
      );
    });
  });

  describe("Lock lifecycle for Capa and Task entities", () => {
    it("should acquire lock for Capa entity", async () => {
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.recordLock.upsert.mockResolvedValue({
        id: "lock_capa",
        orgId: "org_test456",
        entityType: LockEntityType.Capa,
        recordId: "capa_1",
        lockedById: "user_primary",
        expiresAt: new Date(Date.now() + 120000),
      });

      const res = await acquireRecordLock(LockEntityType.Capa, "capa_1");
      expect(res.success).toBe(true);
      expect(res.isLockedByMe).toBe(true);
    });

    it("should refresh lock for Task entity", async () => {
      mockPrisma.recordLock.updateMany.mockResolvedValue({ count: 1 });

      const res = await refreshRecordLock(LockEntityType.Task, "task_1");
      expect(res.success).toBe(true);
      expect(res.isLockedByMe).toBe(true);
    });

    it("should release lock for FollowUp entity", async () => {
      mockPrisma.recordLock.deleteMany.mockResolvedValue({ count: 1 });

      const res = await releaseRecordLock(LockEntityType.FollowUp, "comm_1");
      expect(res.success).toBe(true);
    });
  });
});

