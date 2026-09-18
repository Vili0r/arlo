import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getInvestigationTemplates,
  createInvestigationTemplate,
  toggleInvestigationTemplate,
  initializeCustomSections,
  getCustomSections,
  updateCustomSection,
} from "@/lib/actions/investigation-templates";
import { AuditAction } from "@prisma/client";

const { mockRequireOrgAuth, mockPrisma, mockRevalidatePath } = vi.hoisted(() => ({
  mockRequireOrgAuth: vi.fn(),
  mockPrisma: {
    investigationSectionTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    investigationCustomSection: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: () => mockRequireOrgAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}));

describe("Investigation Templates Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getInvestigationTemplates", () => {
    it("should retrieve all section templates ordered by creation date", async () => {
      mockPrisma.investigationSectionTemplate.findMany.mockResolvedValue([
        { id: "t1", sectionName: "Root Cause 5-Whys", isActive: true },
        { id: "t2", sectionName: "Fishbone Diagram", isActive: false },
      ]);

      const res = await getInvestigationTemplates("org_test");
      expect(res).toHaveLength(2);
      expect(mockPrisma.investigationSectionTemplate.findMany).toHaveBeenCalledWith({
        where: { orgId: "org_test" },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("createInvestigationTemplate", () => {
    it("should create active template and record audit log", async () => {
      mockRequireOrgAuth.mockResolvedValue({ userId: "u1", orgId: "org_test" });
      const createdTemplate = {
        id: "t_new",
        orgId: "org_test",
        sectionName: "Biocompatibility Evaluation",
        isActive: true,
      };
      mockPrisma.investigationSectionTemplate.create.mockResolvedValue(createdTemplate);

      const res = await createInvestigationTemplate("Biocompatibility Evaluation", "acme");
      expect(res).toEqual(createdTemplate);
      expect(mockPrisma.investigationSectionTemplate.create).toHaveBeenCalledWith({
        data: {
          orgId: "org_test",
          sectionName: "Biocompatibility Evaluation",
          isActive: true,
        },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test",
            entityType: "InvestigationSectionTemplate",
            entityId: "t_new",
            action: AuditAction.CREATE,
            changedById: "u1",
          }),
        })
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith("/acme/settings/investigation-templates");
    });
  });

  describe("toggleInvestigationTemplate", () => {
    it("should update isActive state and record audit log", async () => {
      mockRequireOrgAuth.mockResolvedValue({ userId: "u1", orgId: "org_test" });
      const existing = {
        id: "t1",
        orgId: "org_test",
        sectionName: "5-Whys",
        isActive: true,
      };
      const updated = {
        ...existing,
        isActive: false,
      };
      mockPrisma.investigationSectionTemplate.findUnique.mockResolvedValue(existing);
      mockPrisma.investigationSectionTemplate.update.mockResolvedValue(updated);

      const res = await toggleInvestigationTemplate("t1", false, "acme");
      expect(res.isActive).toBe(false);
      expect(mockPrisma.investigationSectionTemplate.update).toHaveBeenCalledWith({
        where: { id: "t1", orgId: "org_test" },
        data: { isActive: false },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: AuditAction.UPDATE,
            changedById: "u1",
          }),
        })
      );
    });

    it("should throw error if template is not found", async () => {
      mockRequireOrgAuth.mockResolvedValue({ userId: "u1", orgId: "org_test" });
      mockPrisma.investigationSectionTemplate.findUnique.mockResolvedValue(null);

      await expect(toggleInvestigationTemplate("unknown", true, "acme")).rejects.toThrow("Template not found");
    });
  });

  describe("initializeCustomSections", () => {
    it("should provision missing custom sections for an investigation from active templates", async () => {
      mockPrisma.investigationSectionTemplate.findMany.mockResolvedValue([
        { id: "tmpl_1", sectionName: "Electrical Test", isActive: true },
        { id: "tmpl_2", sectionName: "Software Log Analysis", isActive: true },
      ]);
      // Already has tmpl_1
      mockPrisma.investigationCustomSection.findMany.mockResolvedValue([
        { id: "cs_1", templateId: "tmpl_1" },
      ]);

      await initializeCustomSections("inv_100", "org_test");

      // Should only create tmpl_2
      expect(mockPrisma.investigationCustomSection.createMany).toHaveBeenCalledWith({
        data: [
          {
            orgId: "org_test",
            investigationId: "inv_100",
            templateId: "tmpl_2",
          },
        ],
      });
    });

    it("should do nothing if no active templates exist", async () => {
      mockPrisma.investigationSectionTemplate.findMany.mockResolvedValue([]);

      await initializeCustomSections("inv_100", "org_test");
      expect(mockPrisma.investigationCustomSection.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.investigationCustomSection.createMany).not.toHaveBeenCalled();
    });
  });

  describe("getCustomSections", () => {
    it("should retrieve custom sections for investigation with templates", async () => {
      mockRequireOrgAuth.mockResolvedValue({ userId: "u1", orgId: "org_test" });
      mockPrisma.investigationCustomSection.findMany.mockResolvedValue([
        { id: "cs_1", templateId: "t1", template: { sectionName: "Root Cause" } },
      ]);

      const sections = await getCustomSections("inv_100");
      expect(sections).toHaveLength(1);
      expect(mockPrisma.investigationCustomSection.findMany).toHaveBeenCalledWith({
        where: { investigationId: "inv_100", orgId: "org_test" },
        include: { template: true },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("updateCustomSection", () => {
    it("should update custom section fields and record audit diff", async () => {
      mockRequireOrgAuth.mockResolvedValue({ userId: "u1", orgId: "org_test" });
      const existing = {
        id: "cs_1",
        orgId: "org_test",
        investigationId: "inv_1",
        investigation: { status: "IN_PROGRESS" },
        isRequired: true,
        assignedToId: null,
        results: null,
      };
      const updated = {
        ...existing,
        assignedToId: "user_engineer",
        results: "Root cause confirmed as capacitor failure",
      };
      mockPrisma.investigationCustomSection.findUnique.mockResolvedValue(existing);
      mockPrisma.investigationCustomSection.update.mockResolvedValue(updated);

      const res = await updateCustomSection(
        "cs_1",
        {
          assignedToId: "user_engineer",
          results: "Root cause confirmed as capacitor failure",
        },
        "acme"
      );

      expect(res).toBeDefined();
      expect(mockPrisma.investigationCustomSection.update).toHaveBeenCalledWith({
        where: { id: "cs_1", orgId: "org_test" },
        data: expect.objectContaining({
          assignedToId: "user_engineer",
          results: "Root cause confirmed as capacitor failure",
        }),
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_test",
            entityType: "InvestigationCustomSection",
            action: AuditAction.UPDATE,
            changedById: "u1",
          }),
        })
      );
    });

    it("should reject updates if investigation is completed", async () => {
      mockRequireOrgAuth.mockResolvedValue({ userId: "u1", orgId: "org_test" });
      mockPrisma.investigationCustomSection.findUnique.mockResolvedValue({
        id: "cs_1",
        orgId: "org_test",
        investigation: { status: "COMPLETED" },
      });

      await expect(
        updateCustomSection("cs_1", { results: "New findings" })
      ).rejects.toThrow("Cannot update custom section: Investigation is completed and locked.");
    });
  });
});
