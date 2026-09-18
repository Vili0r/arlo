import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getInstanceBaseline,
  getValidationDocumentContent,
  getReleaseManifest,
  getReleaseDocumentContent,
  VALIDATION_DOCUMENTS,
} from "@/actions/assurance/baseline";

const { mockRequireOrgAuth, mockFindOrgByIdentifier, mockPrisma } = vi.hoisted(() => ({
  mockRequireOrgAuth: vi.fn(),
  mockFindOrgByIdentifier: vi.fn(),
  mockPrisma: {
    investigationSectionTemplate: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: () => mockRequireOrgAuth(),
}));

vi.mock("@/lib/tenant", () => ({
  findOrgByIdentifier: (...args: any[]) => mockFindOrgByIdentifier(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("Assurance Baseline Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getInstanceBaseline", () => {
    it("should retrieve organization baseline with 21 CFR Part 11 parameters and templates", async () => {
      mockRequireOrgAuth.mockResolvedValue({
        userId: "user_qa",
        orgId: "org_clerk_123",
      });
      mockFindOrgByIdentifier.mockResolvedValue({
        id: "org_clerk_123",
        name: "Acme Medical Devices",
        slug: "acme-med",
      });
      mockPrisma.investigationSectionTemplate.findMany.mockResolvedValue([
        { id: "tmpl_1", sectionName: "Sterilization Review", isActive: true },
      ]);

      const baseline = await getInstanceBaseline("acme-med");

      expect(baseline).toBeDefined();
      expect(baseline.organization.name).toBe("Acme Medical Devices");
      expect(baseline.organization.slug).toBe("acme-med");
      expect(baseline.organization.clerkOrgId).toBe("org_clerk_123");
      expect(baseline.workflowConfiguration.closureGatekeepers.requireDualCredentialEsignature).toBe(true);
      expect(baseline.workflowConfiguration.closureGatekeepers.enforceClosedRecordImmutability).toBe(true);
      expect(baseline.dataIntegrityAndPart11.appendOnlyAuditTrail).toBe(true);
      expect(baseline.dataIntegrityAndPart11.recordHashAlgorithm).toBe("SHA-256");
      expect(baseline.workflowConfiguration.activeInvestigationTemplatesCount).toBe(1);
      expect(baseline.workflowConfiguration.activeInvestigationTemplates[0].sectionName).toBe("Sterilization Review");
    });
  });

  describe("getValidationDocumentContent", () => {
    it("should read known validation documents from docs/validation-support-pack", async () => {
      // Test reading the README
      const content = await getValidationDocumentContent("00_README");
      expect(content).toBeDefined();
      expect(content).toContain("Arlo Quality Management Platform");
    });

    it("should throw an error for non-existent document ID", async () => {
      await expect(getValidationDocumentContent("INVALID_DOC_ID")).rejects.toThrow(
        "Validation document 'INVALID_DOC_ID' not found"
      );
    });
  });

  describe("getReleaseManifest & getReleaseDocumentContent", () => {
    it("should read release manifest for version 1.0.0", async () => {
      const manifest = await getReleaseManifest("1.0.0");
      expect(manifest).toBeDefined();
      if (manifest) {
        expect(manifest.product).toBe("Arlo Quality Management Platform");
        expect(manifest.releaseVersion).toBe("1.0.0");
        expect(manifest.verificationGate.status).toBe("PASSED");
      }
    });

    it("should read a specific release document for version 1.0.0", async () => {
      const content = await getReleaseDocumentContent("1.0.0", "01-release-summary.md");
      expect(content).toBeDefined();
      expect(content).toContain("Release Summary");
    });

    it("should return null for non-existent release version manifest", async () => {
      const manifest = await getReleaseManifest("99.99.99");
      expect(manifest).toBeNull();
    });
  });
});
