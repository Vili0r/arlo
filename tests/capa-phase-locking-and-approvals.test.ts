import { describe, it, expect, vi, beforeEach } from "vitest";
import { CapaPhase, AuditAction } from "@prisma/client";
import { approveCapaPhase, isCapaPhaseApproved } from "@/lib/actions/capa";
import { executeStatusTransition } from "@/lib/actions/esignature";
import { isAdvanceTransition } from "@/lib/constants/status-transitions";

const ORG_ID = "org_locking_approval_test";
const USER_ID = "user_primary_approver";
const USER_UNAUTHORIZED = "user_unauthorized";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({
    userId: USER_ID,
    orgId: ORG_ID,
    orgRole: "org:member",
  })),
  clerkClient: vi.fn(async () => ({
    users: {
      verifyPassword: vi.fn(async () => ({ verified: true })),
    },
  })),
}));

vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: vi.fn(async () => ({
    orgId: ORG_ID,
    userId: USER_ID,
    orgRole: "org:member",
  })),
  ROLES: {
    ADMIN: "org:admin",
    QA_MANAGER: "org:qa_manager",
    QA_APPROVER: "org:qa_approver",
  },
  PERMISSIONS: {
    COMPLAINTS_APPROVE_CLOSE: "org:complaints:approve_close",
    COMPLAINT_CLOSE: "org:complaint:close",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { mockTx, mockPrisma } = vi.hoisted(() => {
  const tx = {
    capa: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    capaInitiation: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    recordLock: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
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

describe("[TEST-026] CAPA Phase Locking & Approver Gatekeeping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isAdvanceTransition Helper", () => {
    it("correctly identifies advancing transitions in CAPA lifecycle", () => {
      expect(isAdvanceTransition("Capa", CapaPhase.INITIATION, CapaPhase.INVESTIGATION)).toBe(true);
      expect(isAdvanceTransition("Capa", CapaPhase.INVESTIGATION, CapaPhase.PLANNING)).toBe(true);
      expect(isAdvanceTransition("Capa", CapaPhase.PLANNING, CapaPhase.IMPLEMENTATION)).toBe(true);
      expect(isAdvanceTransition("Capa", CapaPhase.IMPLEMENTATION, CapaPhase.EFFECTIVENESS)).toBe(true);
      expect(isAdvanceTransition("Capa", CapaPhase.EFFECTIVENESS, CapaPhase.CLOSED)).toBe(true);
    });

    it("correctly identifies non-advancing transitions", () => {
      expect(isAdvanceTransition("Capa", CapaPhase.INVESTIGATION, CapaPhase.INITIATION)).toBe(false);
      expect(isAdvanceTransition("Capa", CapaPhase.PLANNING, CapaPhase.INVESTIGATION)).toBe(false);
      expect(isAdvanceTransition("Capa", CapaPhase.INVESTIGATION, "CANCELLED")).toBe(false);
    });
  });

  describe("Phase Approval Action (approveCapaPhase)", () => {
    const mockCapa = {
      id: "capa_approval_test",
      orgId: ORG_ID,
      currentPhase: CapaPhase.INVESTIGATION,
      initiation: {
        primaryApproverId: "user_init_approver",
      },
      investigation: {
        primaryApproverId: USER_ID,
        secondaryApproverId: "user_sec_approver",
      },
    };

    it("allows the designated primary approver to approve the investigation phase", async () => {
      mockTx.capa.findUnique.mockResolvedValueOnce(mockCapa);

      const result = await approveCapaPhase("capa_approval_test", CapaPhase.INVESTIGATION);
      expect(result.success).toBe(true);
      expect(result.status).toBe("APPROVED");
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: "CapaPhaseApproval",
            capaId: "capa_approval_test",
            action: AuditAction.UPDATE,
            changedById: USER_ID,
            newData: expect.objectContaining({
              phase: CapaPhase.INVESTIGATION,
              status: "APPROVED",
            }),
          }),
        })
      );
    });

    it("rejects approval if primary approver has not been designated", async () => {
      const capaNoApprover = {
        ...mockCapa,
        investigation: {
          primaryApproverId: null,
          secondaryApproverId: null,
        },
      };
      mockTx.capa.findUnique.mockResolvedValueOnce(capaNoApprover);

      await expect(
        approveCapaPhase("capa_approval_test", CapaPhase.INVESTIGATION)
      ).rejects.toThrow(
        "Cannot approve INVESTIGATION phase: A primary approver must be designated first."
      );
    });
  });

  describe("CAPA Phase Gatekeeper in executeStatusTransition", () => {
    function buildFormData(data: Record<string, string>): FormData {
      const fd = new FormData();
      for (const [key, value] of Object.entries(data)) {
        fd.append(key, value);
      }
      return fd;
    }

    it("blocks advancing from INVESTIGATION to PLANNING if phase is not approved", async () => {
      mockTx.capa.findUnique.mockResolvedValueOnce({
        id: "capa_advance_gate",
        orgId: ORG_ID,
        currentPhase: CapaPhase.INVESTIGATION,
      });
      mockTx.recordLock.findUnique.mockResolvedValueOnce(null);
      // No approval logs found
      mockTx.auditLog.findMany.mockResolvedValueOnce([]);

      const formData = buildFormData({
        entityType: "Capa",
        entityId: "capa_advance_gate",
        newStatus: CapaPhase.PLANNING,
        password: "secure_password",
        meaningOfSignature: "I am approving this change",
      });

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Cannot move to the next step: The INVESTIGATION phase has not been approved by the designated approver."
      );
      expect(mockTx.capa.update).not.toHaveBeenCalled();
    });

    it("allows advancing from INVESTIGATION to PLANNING once phase is approved", async () => {
      mockTx.capa.findUnique.mockResolvedValueOnce({
        id: "capa_advance_gate",
        orgId: ORG_ID,
        currentPhase: CapaPhase.INVESTIGATION,
      });
      mockTx.recordLock.findUnique.mockResolvedValueOnce(null);
      // Approval log present
      mockTx.auditLog.findMany.mockResolvedValueOnce([
        {
          entityType: "CapaPhaseApproval",
          newData: {
            phase: CapaPhase.INVESTIGATION,
            status: "APPROVED",
          },
        },
      ]);
      mockTx.capa.update.mockResolvedValueOnce({
        id: "capa_advance_gate",
        currentPhase: CapaPhase.PLANNING,
      });

      const formData = buildFormData({
        entityType: "Capa",
        entityId: "capa_advance_gate",
        newStatus: CapaPhase.PLANNING,
        password: "secure_password",
        meaningOfSignature: "I am approving this change",
      });

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(mockTx.capa.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "capa_advance_gate", orgId: ORG_ID },
          data: { currentPhase: CapaPhase.PLANNING },
        })
      );
    });
  });
});
