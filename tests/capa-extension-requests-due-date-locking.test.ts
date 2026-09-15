import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CreateExtensionRequestSchema,
  ReviewExtensionRequestSchema,
  CreateCapaSchema,
} from "@/lib/validations/capa";
import { CapaPhase, CapaType, ExtensionRequestStatus, AuditAction } from "@prisma/client";
import {
  updateCapa,
  createExtensionRequest,
  reviewExtensionRequest,
} from "@/lib/actions/capa";

const ORG_ID = "org_ext_locking_test";
const USER_ID = "user_ext_locking_test";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({
    userId: USER_ID,
    orgId: ORG_ID,
  })),
  clerkClient: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: vi.fn(async () => ({
    orgId: ORG_ID,
    userId: USER_ID,
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { mockTx, mockPrisma } = vi.hoisted(() => {
  const tx = {
    capa: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    capaInitiation: {
      create: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    capaInvestigation: {
      create: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    capaPlanning: {
      create: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    capaImplementation: {
      create: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    capaEffectiveness: {
      create: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    extensionRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    recordLock: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };

  const prisma = {
    $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => cb(tx)),
  };

  return { mockTx: tx, mockPrisma: prisma };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("CAPA Due-Date Immutability & Stage Extension Governance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation Schemas", () => {
    it("validates CreateExtensionRequestSchema successfully", () => {
      const input = {
        capaId: "capa_123",
        targetPhase: CapaPhase.PLANNING,
        requestedDueDate: "2026-11-30",
        justification: "Supplier lead time increased by 3 weeks for qualifying materials.",
        riskEvaluationRationale: "Low risk to patient safety as inventory holds are in effect.",
        primaryApproverId: "user_approver_1",
      };

      const result = CreateExtensionRequestSchema.parse(input);
      expect(result.capaId).toBe("capa_123");
      expect(result.targetPhase).toBe(CapaPhase.PLANNING);
      expect(result.justification).toBe(input.justification);
    });

    it("rejects CreateExtensionRequestSchema when justification is missing", () => {
      const input = {
        capaId: "capa_123",
        targetPhase: CapaPhase.INVESTIGATION,
        requestedDueDate: "2026-12-01",
        justification: "",
      };

      expect(() => CreateExtensionRequestSchema.parse(input)).toThrow();
    });

    it("validates ReviewExtensionRequestSchema for approval and rejection", () => {
      const approve = ReviewExtensionRequestSchema.parse({
        extensionRequestId: "ext_123",
        decision: "APPROVED",
        reviewComments: "Approved based on material quarantine verification.",
      });
      expect(approve.decision).toBe("APPROVED");

      const reject = ReviewExtensionRequestSchema.parse({
        extensionRequestId: "ext_123",
        decision: "REJECTED",
        reviewComments: "Rationale insufficient; expediting alternate supplier.",
      });
      expect(reject.decision).toBe("REJECTED");
    });
  });

  describe("Due Date Immutability Enforcement in updateCapa", () => {
    const baseExistingCapa = {
      id: "capa_test_id",
      orgId: ORG_ID,
      capaNumber: "CAPA-2026-0001",
      shortDescription: "Existing CAPA",
      type: CapaType.CORRECTIVE,
      currentPhase: CapaPhase.PLANNING,
      ownerId: "user_owner",
      cancellationRequested: false,
      cancellationJustification: null,
      initiation: {
        dateDue: new Date("2026-06-01T00:00:00.000Z"),
      },
      investigation: {
        planDueDate: new Date("2026-07-01T00:00:00.000Z"),
      },
      planning: {
        capaPlanDueDate: new Date("2026-08-01T00:00:00.000Z"),
      },
      implementation: {
        dateDue: new Date("2026-09-01T00:00:00.000Z"),
        implementationDueDate: new Date("2026-09-01T00:00:00.000Z"),
      },
      effectiveness: {
        dateDue: new Date("2026-10-01T00:00:00.000Z"),
      },
    };

    const validPayload = {
      shortDescription: "Updated short description",
      type: CapaType.CORRECTIVE,
      currentPhase: CapaPhase.PLANNING,
      ownerId: "user_owner",
      cancellationRequested: false,
      initiation: {
        problemStatement: "Problem description",
        dateDue: "2026-06-01", // Unchanged
        repeatCapa: false,
        existingCapa: false,
        capaRequired: true,
        fscaRequired: false,
        attachments: [],
      },
      investigation: {
        planDueDate: "2026-07-01", // Unchanged
        rootCauseTools: [],
        impactProductQuality: false,
        attachments: [],
      },
      planning: {
        capaPlanDueDate: "2026-08-01", // Unchanged
        actionPlan: "Updated action plan",
        attachments: [],
      },
      implementation: {
        dateDue: "2026-09-01", // Unchanged
        implementationDueDate: "2026-09-01",
        attachments: [],
      },
      effectiveness: {
        dateDue: "2026-10-01", // Unchanged
        attachments: [],
      },
      extensionRequests: [],
      attachments: [],
    };

    it("allows updating other fields when phase due dates remain identical", async () => {
      mockTx.capa.findUnique.mockResolvedValueOnce(baseExistingCapa);
      mockTx.recordLock.findUnique.mockResolvedValueOnce(null);
      mockTx.capa.update.mockResolvedValueOnce({ id: "capa_test_id" });

      const result = await updateCapa("capa_test_id", validPayload as any);
      expect(result.success).toBe(true);
      expect(mockTx.capa.update).toHaveBeenCalled();
    });

    it("allows initial setting of a due date if previously null", async () => {
      const existingWithNullDates = {
        ...baseExistingCapa,
        planning: { capaPlanDueDate: null },
      };
      mockTx.capa.findUnique.mockResolvedValueOnce(existingWithNullDates);
      mockTx.recordLock.findUnique.mockResolvedValueOnce(null);
      mockTx.capa.update.mockResolvedValueOnce({ id: "capa_test_id" });

      const payload = {
        ...validPayload,
        planning: {
          ...validPayload.planning,
          capaPlanDueDate: "2026-12-15", // initial due date setting
        },
      };

      const result = await updateCapa("capa_test_id", payload as any);
      expect(result.success).toBe(true);
      expect(mockTx.capaPlanning.upsert).toHaveBeenCalled();
    });

    it("prohibits direct modification of Initiation due date once set", async () => {
      mockTx.capa.findUnique.mockResolvedValueOnce(baseExistingCapa);
      mockTx.recordLock.findUnique.mockResolvedValueOnce(null);

      const modifiedPayload = {
        ...validPayload,
        initiation: {
          ...validPayload.initiation,
          dateDue: "2026-06-15", // Direct update attempt
        },
      };

      await expect(updateCapa("capa_test_id", modifiedPayload as any)).rejects.toThrow(
        "Direct updates to previously set Initiation due dates are prohibited. A formal Extension Request must be submitted under Controls."
      );
    });

    it("prohibits direct modification of Investigation due date once set", async () => {
      mockTx.capa.findUnique.mockResolvedValueOnce(baseExistingCapa);
      mockTx.recordLock.findUnique.mockResolvedValueOnce(null);

      const modifiedPayload = {
        ...validPayload,
        investigation: {
          ...validPayload.investigation,
          planDueDate: "2026-07-20", // Direct update attempt
        },
      };

      await expect(updateCapa("capa_test_id", modifiedPayload as any)).rejects.toThrow(
        "Direct updates to previously set Investigation due dates are prohibited. A formal Extension Request must be submitted under Controls."
      );
    });

    it("prohibits direct modification of Planning due date once set", async () => {
      mockTx.capa.findUnique.mockResolvedValueOnce(baseExistingCapa);
      mockTx.recordLock.findUnique.mockResolvedValueOnce(null);

      const modifiedPayload = {
        ...validPayload,
        planning: {
          ...validPayload.planning,
          capaPlanDueDate: "2026-08-25", // Direct update attempt
        },
      };

      await expect(updateCapa("capa_test_id", modifiedPayload as any)).rejects.toThrow(
        "Direct updates to previously set Planning due dates are prohibited. A formal Extension Request must be submitted under Controls."
      );
    });

    it("prohibits direct modification of Implementation due date once set", async () => {
      mockTx.capa.findUnique.mockResolvedValueOnce(baseExistingCapa);
      mockTx.recordLock.findUnique.mockResolvedValueOnce(null);

      const modifiedPayload = {
        ...validPayload,
        implementation: {
          ...validPayload.implementation,
          dateDue: "2026-09-30", // Direct update attempt
        },
      };

      await expect(updateCapa("capa_test_id", modifiedPayload as any)).rejects.toThrow(
        "Direct updates to previously set Implementation due dates are prohibited. A formal Extension Request must be submitted under Controls."
      );
    });

    it("prohibits direct modification of Effectiveness due date once set", async () => {
      mockTx.capa.findUnique.mockResolvedValueOnce(baseExistingCapa);
      mockTx.recordLock.findUnique.mockResolvedValueOnce(null);

      const modifiedPayload = {
        ...validPayload,
        effectiveness: {
          ...validPayload.effectiveness,
          dateDue: "2026-10-31", // Direct update attempt
        },
      };

      await expect(updateCapa("capa_test_id", modifiedPayload as any)).rejects.toThrow(
        "Direct updates to previously set Effectiveness due dates are prohibited. A formal Extension Request must be submitted under Controls."
      );
    });
  });

  describe("Extension Request Lifecycle Actions", () => {
    it("creates an extension request with PENDING status and audit log", async () => {
      mockTx.capa.findUnique.mockResolvedValueOnce({
        id: "capa_123",
        orgId: ORG_ID,
      });

      mockTx.extensionRequest.create.mockResolvedValueOnce({
        id: "ext_created_001",
        targetPhase: CapaPhase.PLANNING,
        requestedDueDate: new Date("2026-12-15T00:00:00.000Z"),
        justification: "Validation lab backlog",
        riskEvaluationRationale: "No clinical risk",
      });

      const res = await createExtensionRequest({
        capaId: "capa_123",
        targetPhase: CapaPhase.PLANNING,
        requestedDueDate: "2026-12-15",
        justification: "Validation lab backlog",
        riskEvaluationRationale: "No clinical risk",
      });

      expect(res.success).toBe(true);
      expect(res.extensionRequestId).toBe("ext_created_001");
      expect(mockTx.extensionRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            capaId: "capa_123",
            targetPhase: CapaPhase.PLANNING,
            status: ExtensionRequestStatus.PENDING,
            requesterId: USER_ID,
          }),
        })
      );
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: AuditAction.CREATE,
            entityType: "ExtensionRequest",
            capaId: "capa_123",
          }),
        })
      );
    });

    it("approving an extension request updates the target phase due date and records audit trail", async () => {
      const extRecord = {
        id: "ext_to_approve",
        orgId: ORG_ID,
        capaId: "capa_123",
        targetPhase: CapaPhase.PLANNING,
        requestedDueDate: new Date("2026-11-20T00:00:00.000Z"),
        status: ExtensionRequestStatus.PENDING,
      };

      mockTx.extensionRequest.findUnique.mockResolvedValueOnce(extRecord);
      mockTx.extensionRequest.update.mockResolvedValueOnce({
        ...extRecord,
        status: ExtensionRequestStatus.APPROVED,
      });

      const res = await reviewExtensionRequest({
        extensionRequestId: "ext_to_approve",
        decision: "APPROVED",
        reviewComments: "Approved after reviewing safety assessment",
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe("APPROVED");
      expect(mockTx.capaPlanning.update).toHaveBeenCalledWith({
        where: { capaId: "capa_123" },
        data: { capaPlanDueDate: extRecord.requestedDueDate },
      });
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: AuditAction.UPDATE,
            entityType: "ExtensionRequest",
            capaId: "capa_123",
          }),
        })
      );
    });

    it("rejecting an extension request sets status to REJECTED and does not update phase due date", async () => {
      const extRecord = {
        id: "ext_to_reject",
        orgId: ORG_ID,
        capaId: "capa_123",
        targetPhase: CapaPhase.INVESTIGATION,
        requestedDueDate: new Date("2026-11-20T00:00:00.000Z"),
        status: ExtensionRequestStatus.PENDING,
      };

      mockTx.extensionRequest.findUnique.mockResolvedValueOnce(extRecord);
      mockTx.extensionRequest.update.mockResolvedValueOnce({
        ...extRecord,
        status: ExtensionRequestStatus.REJECTED,
      });

      const res = await reviewExtensionRequest({
        extensionRequestId: "ext_to_reject",
        decision: "REJECTED",
        reviewComments: "Insufficient justification",
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe("REJECTED");
      expect(mockTx.capaInvestigation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: AuditAction.UPDATE,
            entityType: "ExtensionRequest",
          }),
        })
      );
    });

    it("rejects reviewing an extension request that is not PENDING", async () => {
      mockTx.extensionRequest.findUnique.mockResolvedValueOnce({
        id: "ext_already_done",
        orgId: ORG_ID,
        capaId: "capa_123",
        targetPhase: CapaPhase.PLANNING,
        status: ExtensionRequestStatus.APPROVED,
      });

      await expect(
        reviewExtensionRequest({
          extensionRequestId: "ext_already_done",
          decision: "REJECTED",
        })
      ).rejects.toThrow("Extension request has already been approved");
    });
  });
});
