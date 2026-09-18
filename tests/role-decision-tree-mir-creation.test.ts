import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuthCtx, mockPrisma } = vi.hoisted(() => {
  return {
    mockAuthCtx: {
      userId: "user_test_123",
      orgId: "org_acme_corp",
      orgRole: "org:admin",
      orgSlug: "acme",
    },
    mockPrisma: {
      complaint: {
        findUnique: vi.fn(),
      },
      vigilanceDecisionTree: {
        create: vi.fn(),
      },
      mIR: {
        count: vi.fn(),
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: vi.fn().mockImplementation(async () => mockAuthCtx),
  ROLES: {
    ADMIN: "org:admin",
    QA_MANAGER: "org:qa_manager",
    VIGILANCE_LEAD: "org:vigilance_lead",
    QUALITY_ENGINEER: "org:quality_engineer",
    COMPLAINT_INVESTIGATOR: "org:complaint_investigator",
    CAPA_OWNER: "org:capa_owner",
    MEMBER: "org:member",
    READ_ONLY: "org:read_only",
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createDecisionTree } from "@/lib/actions/vigilance";
import { isRegulatoryRole } from "@/lib/utils";
import { createMIR } from "@/lib/actions/mir";
import { AuditAction } from "@prisma/client";

describe("Role-Based Decision Tree & MIR Creation", () => {
  const baseComplaint = {
    id: "cmp_001",
    orgId: "org_acme_corp",
    complaintNumber: "CMP-2026-00001",
    shortDescription: "Infusion pump flow rate variance",
    vigilanceDecisionTrees: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthCtx.orgRole = "org:admin";
    mockAuthCtx.orgId = "org_acme_corp";
    mockAuthCtx.userId = "user_test_123";

    mockPrisma.complaint.findUnique.mockResolvedValue(baseComplaint);
    mockPrisma.vigilanceDecisionTree.create.mockImplementation(async ({ data }) => ({
      id: "vdt_new_123",
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    mockPrisma.mIR.count.mockResolvedValue(5);
    mockPrisma.mIR.create.mockImplementation(async ({ data }) => ({
      id: "mir_new_123",
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    mockPrisma.auditLog.create.mockResolvedValue({ id: "audit_123" });
  });

  describe("Role Verification Helper (isRegulatoryRole)", () => {
    it("recognizes authorized roles with and without org: prefix", () => {
      expect(isRegulatoryRole("org:admin")).toBe(true);
      expect(isRegulatoryRole("admin")).toBe(true);
      expect(isRegulatoryRole("org:qa_manager")).toBe(true);
      expect(isRegulatoryRole("qa_manager")).toBe(true);
      expect(isRegulatoryRole("qa manager")).toBe(true);
      expect(isRegulatoryRole("org:vigilance_lead")).toBe(true);
      expect(isRegulatoryRole("vigilance_lead")).toBe(true);
      expect(isRegulatoryRole("vigilance lead")).toBe(true);
    });

    it("rejects unauthorized roles", () => {
      expect(isRegulatoryRole("org:quality_engineer")).toBe(false);
      expect(isRegulatoryRole("quality_engineer")).toBe(false);
      expect(isRegulatoryRole("org:complaint_investigator")).toBe(false);
      expect(isRegulatoryRole("org:capa_owner")).toBe(false);
      expect(isRegulatoryRole("org:member")).toBe(false);
      expect(isRegulatoryRole("org:read_only")).toBe(false);
      expect(isRegulatoryRole(null)).toBe(false);
      expect(isRegulatoryRole(undefined)).toBe(false);
    });
  });

  describe("createDecisionTree Server Action", () => {
    it("allows Administrator to create a decision tree", async () => {
      mockAuthCtx.orgRole = "org:admin";

      const res = await createDecisionTree("cmp_001", "acme");
      expect(res.success).toBe(true);
      expect(res.decisionTree.complaintId).toBe("cmp_001");
      expect(res.decisionTree.status).toBe("PENDING");
      expect(res.decisionTree.assessmentStage).toBe("INITIAL");

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orgId: "org_acme_corp",
          entityType: "VigilanceDecisionTree",
          action: AuditAction.CREATE,
          complaintId: "cmp_001",
        }),
      });
    });

    it("allows QA Manager to create a decision tree", async () => {
      mockAuthCtx.orgRole = "org:qa_manager";

      const res = await createDecisionTree("cmp_001", "acme");
      expect(res.success).toBe(true);
      expect(mockPrisma.vigilanceDecisionTree.create).toHaveBeenCalled();
    });

    it("allows Vigilance Lead to create a decision tree", async () => {
      mockAuthCtx.orgRole = "org:vigilance_lead";

      const res = await createDecisionTree("cmp_001", "acme");
      expect(res.success).toBe(true);
      expect(mockPrisma.vigilanceDecisionTree.create).toHaveBeenCalled();
    });

    it("determines POST_INVESTIGATION stage if a previous decision tree exists", async () => {
      mockAuthCtx.orgRole = "org:vigilance_lead";
      mockPrisma.complaint.findUnique.mockResolvedValue({
        ...baseComplaint,
        vigilanceDecisionTrees: [{ id: "vdt_old" }],
      });

      const res = await createDecisionTree("cmp_001", "acme");
      expect(res.success).toBe(true);
      expect(res.decisionTree.assessmentStage).toBe("POST_INVESTIGATION");
    });

    it("blocks unauthorized roles (Quality Engineer, Member, Read Only) with 403 Forbidden", async () => {
      const unauthorizedRoles = [
        "org:quality_engineer",
        "org:complaint_investigator",
        "org:capa_owner",
        "org:member",
        "org:read_only",
      ];

      for (const role of unauthorizedRoles) {
        mockAuthCtx.orgRole = role;
        await expect(createDecisionTree("cmp_001", "acme")).rejects.toThrow(
          /403 Forbidden/
        );
      }
    });

    it("rejects when complaint does not exist or tenant mismatch", async () => {
      mockAuthCtx.orgRole = "org:admin";
      mockPrisma.complaint.findUnique.mockResolvedValue(null);

      await expect(createDecisionTree("cmp_nonexistent", "acme")).rejects.toThrow(
        /Complaint not found/
      );
    });
  });

  describe("createMIR Server Action", () => {
    it("allows Administrator to create an Initial MIR", async () => {
      mockAuthCtx.orgRole = "org:admin";

      const res = await createMIR("cmp_001", "INITIAL", "acme");
      expect(res.success).toBe(true);
      expect(res.mir.complaintId).toBe("cmp_001");
      expect(res.mir.reportType).toBe("INITIAL");
      expect(res.mir.status).toBe("DRAFT");
      expect(res.mir.mirNumber).toBe("MIR-2026-00006");

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orgId: "org_acme_corp",
          entityType: "InitialMIR",
          action: AuditAction.CREATE,
          complaintId: "cmp_001",
        }),
      });
    });

    it("allows QA Manager to create a Final MIR", async () => {
      mockAuthCtx.orgRole = "org:qa_manager";

      const res = await createMIR("cmp_001", "FINAL", "acme");
      expect(res.success).toBe(true);
      expect(res.mir.reportType).toBe("FINAL");
      expect(res.mir.status).toBe("DRAFT");

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: "FinalMIR",
          action: AuditAction.CREATE,
        }),
      });
    });

    it("allows Vigilance Lead to create an Initial MIR", async () => {
      mockAuthCtx.orgRole = "org:vigilance_lead";

      const res = await createMIR("cmp_001", "INITIAL", "acme");
      expect(res.success).toBe(true);
      expect(mockPrisma.mIR.create).toHaveBeenCalled();
    });

    it("blocks unauthorized roles (Quality Engineer, Member, Read Only) with 403 Forbidden", async () => {
      const unauthorizedRoles = [
        "org:quality_engineer",
        "org:complaint_investigator",
        "org:capa_owner",
        "org:member",
        "org:read_only",
      ];

      for (const role of unauthorizedRoles) {
        mockAuthCtx.orgRole = role;
        await expect(createMIR("cmp_001", "INITIAL", "acme")).rejects.toThrow(
          /403 Forbidden/
        );
      }
    });

    it("rejects when complaint does not exist", async () => {
      mockAuthCtx.orgRole = "org:admin";
      mockPrisma.complaint.findUnique.mockResolvedValue(null);

      await expect(createMIR("cmp_nonexistent", "INITIAL", "acme")).rejects.toThrow(
        /Complaint not found/
      );
    });
  });
});
