import { describe, it, expect, vi, beforeEach } from "vitest";
import { LockEntityType, MIRStatus, AuditAction, MIRClassification } from "@prisma/client";

const { mockAuthCtx, mockTx, mockPrisma } = vi.hoisted(() => {
  const authCtx = {
    userId: "user_ra_specialist_1",
    orgId: "org_test456",
  };

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
    attachment: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
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
  assertRecordNotLocked,
} from "@/lib/actions/record-lock";
import { updateInitialMIR, updateFinalMIR } from "@/lib/actions/mir";

describe("MIR Concurrency Control & Record Locking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthCtx.userId = "user_ra_specialist_1";
    mockAuthCtx.orgId = "org_test456";
    mockTx.attachment.findMany.mockResolvedValue([]);
    mockTx.attachment.deleteMany.mockResolvedValue({ count: 0 });
    mockTx.attachment.createMany.mockResolvedValue({ count: 0 });
  });

  const baseInitialMIR = {
    id: "imir_concurrency_123",
    orgId: "org_test456",
    complaintId: "cmp_concurrency_1",
    status: MIRStatus.DRAFT,
    reportType: "INITIAL",
    mirNumber: "MIR-2026-0001",
    manufacturerReference: "MFR-REF-001",
    competentAuthority: "BfArM",
    submissionCountry: "DE",
    submissionMethod: "EUDAMED",
    initialDeviceRelatedness: "POSSIBLE",
    initialCausalityAssessment: "UNDER_EVALUATION",
    initialSeriousnessAssessment: "SERIOUS_DETERIORATION",
    initialRiskAssessment: "ACCEPTABLE_WITH_CAPA",
    preliminaryConclusion: "Initial preliminary conclusion.",
    investigationStarted: true,
    preparedById: "user_ra_specialist_1",
    submissionDate: null,
  };

  const baseFinalMIR = {
    id: "fmir_concurrency_456",
    orgId: "org_test456",
    complaintId: "cmp_concurrency_1",
    status: MIRStatus.DRAFT,
    reportType: "FINAL",
    mirNumber: "MIR-2026-0001-F",
    manufacturerReference: "MFR-REF-001",
    competentAuthority: "BfArM",
    submissionCountry: "DE",
    submissionMethod: "EUDAMED",
    finalDeviceRelatedness: "CAUSAL_RELATIONSHIP",
    finalCausalityAssessment: "CONFIRMED",
    finalCausalityRationale: "Batch testing confirmed variance.",
    manufacturerConclusion: "Supplier tooling corrected.",
    incidentConfirmed: true,
    deviceContributionConfirmed: true,
    rootCauseConfirmed: true,
    recurrencePotential: "LOW",
    manufacturerFinalStatement: "Final monitoring statement.",
    preparedById: "user_ra_specialist_1",
    submissionDate: null,
  };

  const activeLockByOtherUser = {
    id: "lock_mir_1",
    orgId: "org_test456",
    entityType: LockEntityType.Vigilance,
    recordId: "imir_concurrency_123",
    lockedById: "user_other_regulator",
    lockedAt: new Date(Date.now() - 30000),
    expiresAt: new Date(Date.now() + 90000),
    lockedBy: {
      id: "user_other_regulator",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@arlo.io",
      imageUrl: "https://example.com/avatar.jpg",
    },
  };

  /* ========================================================================= */
  /* 1. Record Lock Lifecycle for MIR Entities                                 */
  /* ========================================================================= */

  describe("Record Lock Lifecycle for MIR Entities", () => {
    it("should allow a user to acquire a lock on an Initial MIR record when no active lock exists", async () => {
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.recordLock.upsert.mockResolvedValue({
        id: "lock_imir_new",
        orgId: "org_test456",
        entityType: LockEntityType.Vigilance,
        recordId: "imir_concurrency_123",
        lockedById: "user_ra_specialist_1",
        expiresAt: new Date(Date.now() + 120000),
      });

      const result = await acquireRecordLock(
        LockEntityType.Vigilance,
        "imir_concurrency_123"
      );

      expect(result.success).toBe(true);
      expect(result.isLockedByMe).toBe(true);
      expect(mockTx.recordLock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            org_entity_record_lock_unique: {
              orgId: "org_test456",
              entityType: LockEntityType.Vigilance,
              recordId: "imir_concurrency_123",
            },
          },
          create: expect.objectContaining({
            lockedById: "user_ra_specialist_1",
          }),
        })
      );
    });

    it("should reject lock acquisition on an MIR record when another user actively holds the lock", async () => {
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      const result = await acquireRecordLock(
        LockEntityType.Vigilance,
        "imir_concurrency_123"
      );

      expect(result.success).toBe(false);
      expect(result.isLockedByMe).toBe(false);
      expect(result.lockedBy).toEqual({
        id: "user_other_regulator",
        name: "Jane Doe",
        email: "jane.doe@arlo.io",
        imageUrl: "https://example.com/avatar.jpg",
      });
      expect(result.message).toContain(
        "This vigilance is currently being edited by Jane Doe."
      );
      expect(mockTx.recordLock.upsert).not.toHaveBeenCalled();
    });

    it("should refresh lock expiry for the active lock holder", async () => {
      mockPrisma.recordLock.updateMany.mockResolvedValue({ count: 1 });

      const result = await refreshRecordLock(
        LockEntityType.Vigilance,
        "imir_concurrency_123"
      );

      expect(result.success).toBe(true);
      expect(result.isLockedByMe).toBe(true);
      expect(mockPrisma.recordLock.updateMany).toHaveBeenCalledWith({
        where: {
          orgId: "org_test456",
          entityType: LockEntityType.Vigilance,
          recordId: "imir_concurrency_123",
          lockedById: "user_ra_specialist_1",
        },
        data: {
          expiresAt: expect.any(Date),
        },
      });
    });

    it("should release lock when requested by the active lock holder", async () => {
      mockPrisma.recordLock.deleteMany.mockResolvedValue({ count: 1 });

      const result = await releaseRecordLock(
        LockEntityType.Vigilance,
        "imir_concurrency_123"
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.recordLock.deleteMany).toHaveBeenCalledWith({
        where: {
          orgId: "org_test456",
          entityType: LockEntityType.Vigilance,
          recordId: "imir_concurrency_123",
          lockedById: "user_ra_specialist_1",
        },
      });
    });
  });

  /* ========================================================================= */
  /* 2. updateInitialMIR Concurrency & Audit Trail Enforcement                */
  /* ========================================================================= */

  describe("updateInitialMIR server action", () => {
    it("should reject updateInitialMIR when record is locked by another user", async () => {
      mockTx.initialMIR.findUnique.mockResolvedValue(baseInitialMIR);
      mockTx.recordLock.findUnique.mockResolvedValue(activeLockByOtherUser);

      await expect(
        updateInitialMIR("imir_concurrency_123", {
          preliminaryConclusion: "Concurrent edit attempt",
        })
      ).rejects.toThrow(
        "Cannot update vigilance: Record is currently locked and being edited by Jane Doe."
      );

      expect(mockTx.initialMIR.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should allow updateInitialMIR when active lock is held by the same user", async () => {
      mockTx.initialMIR.findUnique.mockResolvedValue(baseInitialMIR);
      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOtherUser,
        lockedById: "user_ra_specialist_1",
      });

      const updatedRecord = {
        ...baseInitialMIR,
        preliminaryConclusion: "Updated preliminary conclusion by authorized user.",
      };
      mockTx.initialMIR.update.mockResolvedValue(updatedRecord);
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_imir_update" });

      const result = await updateInitialMIR("imir_concurrency_123", {
        preliminaryConclusion: "Updated preliminary conclusion by authorized user.",
      });

      expect(result).toEqual(updatedRecord);
      expect(mockTx.initialMIR.update).toHaveBeenCalledWith({
        where: { id: "imir_concurrency_123", orgId: "org_test456" },
        data: {
          preliminaryConclusion: "Updated preliminary conclusion by authorized user.",
        },
      });
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "InitialMIR",
            entityId: "imir_concurrency_123",
            action: AuditAction.UPDATE,
            changedById: "user_ra_specialist_1",
            complaintId: "cmp_concurrency_1",
            reason: "Updated Initial MIR report",
          }),
        })
      );
    });

    it("should allow updateInitialMIR when no lock exists", async () => {
      mockTx.initialMIR.findUnique.mockResolvedValue(baseInitialMIR);
      mockTx.recordLock.findUnique.mockResolvedValue(null);

      const updatedRecord = {
        ...baseInitialMIR,
        submissionCountry: "FR",
      };
      mockTx.initialMIR.update.mockResolvedValue(updatedRecord);

      const result = await updateInitialMIR("imir_concurrency_123", {
        submissionCountry: "FR",
      });

      expect(result).toEqual(updatedRecord);
      expect(mockTx.initialMIR.update).toHaveBeenCalledWith({
        where: { id: "imir_concurrency_123", orgId: "org_test456" },
        data: { submissionCountry: "FR" },
      });
    });

    it("should sanitize empty string enum, FK, date and alias fields before passing to update", async () => {
      mockTx.initialMIR.findUnique.mockResolvedValue(baseInitialMIR);
      mockTx.recordLock.findUnique.mockResolvedValue(null);

      mockTx.initialMIR.update.mockImplementation(async ({ data }) => ({
        ...baseInitialMIR,
        ...data,
      }));

      await updateInitialMIR("imir_concurrency_123", {
        eventClassification: "" as any,
        preparedById: "",
        reportDate: "" as any,
        numYears: "" as any,
        implantFacitlityName: "Hospital St. Jude",
      } as any);

      expect(mockTx.initialMIR.update).toHaveBeenCalledWith({
        where: { id: "imir_concurrency_123", orgId: "org_test456" },
        data: expect.objectContaining({
          eventClassification: null,
          preparedById: null,
          reportDate: null,
          numYears: null,
          implantFacilityName: "Hospital St. Jude",
        }),
      });
    });

    it("should preserve valid enum values and sanitize invalid enum values to null", async () => {
      mockTx.initialMIR.findUnique.mockResolvedValue(baseInitialMIR);
      mockTx.recordLock.findUnique.mockResolvedValue(null);

      mockTx.initialMIR.update.mockImplementation(async ({ data }) => ({
        ...baseInitialMIR,
        ...data,
      }));

      // Test valid enum
      await updateInitialMIR("imir_concurrency_123", {
        eventClassification: MIRClassification.DEATH,
      } as any);

      expect(mockTx.initialMIR.update).toHaveBeenCalledWith({
        where: { id: "imir_concurrency_123", orgId: "org_test456" },
        data: { eventClassification: MIRClassification.DEATH },
      });

      // Test invalid enum
      await updateInitialMIR("imir_concurrency_123", {
        eventClassification: "INVALID_CLASSIFICATION" as any,
      } as any);

      expect(mockTx.initialMIR.update).toHaveBeenCalledWith({
        where: { id: "imir_concurrency_123", orgId: "org_test456" },
        data: { eventClassification: null },
      });
    });

    it("should synchronize attachments by adding new and removing missing ones", async () => {
      mockTx.initialMIR.findUnique.mockResolvedValue(baseInitialMIR);
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.initialMIR.update.mockResolvedValue(baseInitialMIR);

      mockTx.attachment.findMany.mockResolvedValue([
        { id: "att_old", fileUrl: "https://blob.example.com/old.pdf" },
        { id: "att_keep", fileUrl: "https://blob.example.com/keep.pdf" },
      ]);

      await updateInitialMIR("imir_concurrency_123", {
        attachments: [
          {
            fileName: "keep.pdf",
            fileUrl: "https://blob.example.com/keep.pdf",
            fileSize: 1024,
            mimeType: "application/pdf",
          },
          {
            fileName: "new.pdf",
            fileUrl: "https://blob.example.com/new.pdf",
            fileSize: 2048,
            mimeType: "application/pdf",
          },
        ] as any,
      } as any);

      // Should delete the old unreferenced attachment
      expect(mockTx.attachment.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["att_old"] } },
      });

      // Should create the new attachment
      expect(mockTx.attachment.createMany).toHaveBeenCalledWith({
        data: [
          {
            orgId: "org_test456",
            complaintId: "cmp_concurrency_1",
            mirId: "imir_concurrency_123",
            fileUrl: "https://blob.example.com/new.pdf",
            fileName: "new.pdf",
            fileSize: 2048,
            mimeType: "application/pdf",
            uploadedById: "user_ra_specialist_1",
          },
        ],
      });
    });

    it("should filter out immutable fields and parse date and number strings", async () => {
      mockTx.initialMIR.findUnique.mockResolvedValue(baseInitialMIR);
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.initialMIR.update.mockImplementation(async ({ data }) => ({
        ...baseInitialMIR,
        ...data,
      }));

      await updateInitialMIR("imir_concurrency_123", {
        id: "attempted_id_override",
        orgId: "attempted_org_override",
        complaintId: "attempted_complaint_override",
        createdAt: new Date(),
        updatedAt: new Date(),
        unknownField: "ignored",
        reportDate: "2026-10-15T00:00:00.000Z" as any,
        numYears: "4" as any,
        massKG: "72.5" as any,
      } as any);

      const updateCall = mockTx.initialMIR.update.mock.calls[0][0];
      expect(updateCall.data.id).toBeUndefined();
      expect(updateCall.data.orgId).toBeUndefined();
      expect(updateCall.data.complaintId).toBeUndefined();
      expect(updateCall.data.createdAt).toBeUndefined();
      expect(updateCall.data.updatedAt).toBeUndefined();
      expect(updateCall.data.unknownField).toBeUndefined();
      expect(updateCall.data.numYears).toBe(4);
      expect(updateCall.data.massKG).toBe(72.5);
      expect(updateCall.data.reportDate).toEqual(new Date("2026-10-15T00:00:00.000Z"));
    });

    it("should reject updateInitialMIR when record does not exist or belongs to another organization", async () => {
      mockTx.initialMIR.findUnique.mockResolvedValue(null);

      await expect(
        updateInitialMIR("imir_nonexistent", {
          submissionCountry: "FR",
        })
      ).rejects.toThrow("Initial MIR record not found or access denied.");

      expect(mockTx.initialMIR.update).not.toHaveBeenCalled();
    });
  });

  /* ========================================================================= */
  /* 3. updateFinalMIR Concurrency & Audit Trail Enforcement                  */
  /* ========================================================================= */

  describe("updateFinalMIR server action", () => {
    it("should reject updateFinalMIR when record is locked by another user", async () => {
      mockTx.finalMIR.findUnique.mockResolvedValue(baseFinalMIR);
      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOtherUser,
        recordId: "fmir_concurrency_456",
      });

      await expect(
        updateFinalMIR("fmir_concurrency_456", {
          manufacturerConclusion: "Concurrent edit attempt",
        })
      ).rejects.toThrow(
        "Cannot update vigilance: Record is currently locked and being edited by Jane Doe."
      );

      expect(mockTx.finalMIR.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should allow updateFinalMIR when active lock is held by the same user", async () => {
      mockTx.finalMIR.findUnique.mockResolvedValue(baseFinalMIR);
      mockTx.recordLock.findUnique.mockResolvedValue({
        ...activeLockByOtherUser,
        recordId: "fmir_concurrency_456",
        lockedById: "user_ra_specialist_1",
      });

      const updatedRecord = {
        ...baseFinalMIR,
        manufacturerConclusion: "Updated conclusion with final CAPA details.",
      };
      mockTx.finalMIR.update.mockResolvedValue(updatedRecord);
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_fmir_update" });

      const result = await updateFinalMIR("fmir_concurrency_456", {
        manufacturerConclusion: "Updated conclusion with final CAPA details.",
      });

      expect(result).toEqual(updatedRecord);
      expect(mockTx.finalMIR.update).toHaveBeenCalledWith({
        where: { id: "fmir_concurrency_456", orgId: "org_test456" },
        data: {
          manufacturerConclusion: "Updated conclusion with final CAPA details.",
        },
      });
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test456",
            entityType: "FinalMIR",
            entityId: "fmir_concurrency_456",
            action: AuditAction.UPDATE,
            changedById: "user_ra_specialist_1",
            complaintId: "cmp_concurrency_1",
            reason: "Updated Final MIR report",
          }),
        })
      );
    });

    it("should allow updateFinalMIR when no lock exists", async () => {
      mockTx.finalMIR.findUnique.mockResolvedValue(baseFinalMIR);
      mockTx.recordLock.findUnique.mockResolvedValue(null);

      const updatedRecord = {
        ...baseFinalMIR,
        recurrencePotential: "NEGLIGIBLE",
      };
      mockTx.finalMIR.update.mockResolvedValue(updatedRecord);

      const result = await updateFinalMIR("fmir_concurrency_456", {
        recurrencePotential: "NEGLIGIBLE",
      });

      expect(result).toEqual(updatedRecord);
      expect(mockTx.finalMIR.update).toHaveBeenCalled();
    });

    it("should reject updateFinalMIR when record does not exist or belongs to another organization", async () => {
      mockTx.finalMIR.findUnique.mockResolvedValue(null);

      await expect(
        updateFinalMIR("fmir_nonexistent", {
          recurrencePotential: "NEGLIGIBLE",
        })
      ).rejects.toThrow("Final MIR record not found or access denied.");

      expect(mockTx.finalMIR.update).not.toHaveBeenCalled();
    });
  });
});
