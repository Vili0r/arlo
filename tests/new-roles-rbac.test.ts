import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ROLES,
  PERMISSIONS,
  PERMISSION_EQUIVALENTS,
  requireOrgAuth,
  verifySeparationOfDuties,
} from "@/lib/auth-guard";
import { ROLE_PRESETS, getDefaultCardsForRole } from "@/lib/insights";

// Mock Clerk server auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
  clerkClient: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn().mockResolvedValue({ id: "user_test" }), upsert: vi.fn() },
    organization: { findUnique: vi.fn().mockResolvedValue({ id: "org_test" }), upsert: vi.fn() },
  },
}));

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * @traceability
 * URS: URS-012 (Multi-Tenant Isolation & Role-Based Access Control)
 * SRS: SRS-018 (Role-Based Access Control Enforcement)
 * Design: DESIGN-018 (RBAC Authorization Guard)
 * Test ID: TEST-017
 */
describe("[TEST-017] New Roles & Expanded Permissions (RBAC)", () => {
  const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.user.findUnique as any).mockResolvedValue({ id: "user_test" });
    (prisma.organization.findUnique as any).mockResolvedValue({ id: "org_test" });
  });

  describe("Constants & Definitions", () => {
    it("exports the 4 new roles in ROLES", () => {
      expect(ROLES.QUALITY_ENGINEER).toBe("org:quality_engineer");
      expect(ROLES.QA_REVIEWER).toBe("org:qa_reviewer");
      expect(ROLES.QA_APPROVER).toBe("org:qa_approver");
      expect(ROLES.READ_ONLY).toBe("org:read_only");
    });

    it("exports expanded permissions including dot-notation equivalents", () => {
      expect(PERMISSIONS.COMPLAINT_CREATE).toBe("org:complaint:create");
      expect(PERMISSIONS.COMPLAINT_EDIT).toBe("org:complaint:edit");
      expect(PERMISSIONS.COMPLAINT_CLOSE).toBe("org:complaint:close");
      expect(PERMISSIONS.COMPLAINT_ASSIGN).toBe("org:complaint:assign");
      expect(PERMISSIONS.CAPA_CREATE).toBe("org:capa:create");
      expect(PERMISSIONS.CAPA_APPROVE).toBe("org:capa:approve");
      expect(PERMISSIONS.CAPA_CLOSE).toBe("org:capa:close");
      expect(PERMISSIONS.AUDIT_VIEW).toBe("org:audit:view");
      expect(PERMISSIONS.REPORT_EXPORT).toBe("org:report:export");
      expect(PERMISSIONS.USER_MANAGE).toBe("org:user:manage");

      // Backward compatibility aliases
      expect(PERMISSIONS.COMPLAINTS_CREATE).toBe("org:complaints:create");
      expect(PERMISSIONS.COMPLAINTS_APPROVE_CLOSE).toBe("org:complaints:approve_close");
      expect(PERMISSIONS.SYSTEM_AUDIT_READ).toBe("org:system:audit_read");
    });

    it("maps permission equivalents bidirectionally", () => {
      expect(PERMISSION_EQUIVALENTS["complaint.create"]).toContain("org:complaint:create");
      expect(PERMISSION_EQUIVALENTS["complaint.close"]).toContain("org:complaint:close");
      expect(PERMISSION_EQUIVALENTS["complaint.close"]).toContain("org:complaints:approve_close");
      expect(PERMISSION_EQUIVALENTS["audit.view"]).toContain("org:system:audit_read");
    });
  });

  describe("QA Approver Role Capabilities & Boundary", () => {
    it("allows QA Approver to close complaints and approve CAPAs", async () => {
      mockAuth.mockResolvedValue({
        userId: "user_qa_approver",
        orgId: "org_test_001",
        orgRole: ROLES.QA_APPROVER,
        has: () => false,
      });

      // Canonical slug
      await expect(
        requireOrgAuth(PERMISSIONS.COMPLAINT_CLOSE)
      ).resolves.toMatchObject({ orgRole: ROLES.QA_APPROVER });

      // Legacy alias
      await expect(
        requireOrgAuth(PERMISSIONS.COMPLAINTS_APPROVE_CLOSE)
      ).resolves.toMatchObject({ orgRole: ROLES.QA_APPROVER });

      // Dot notation
      await expect(
        requireOrgAuth("complaint.close" as any)
      ).resolves.toMatchObject({ orgRole: ROLES.QA_APPROVER });

      // CAPA Approve & Close
      await expect(
        requireOrgAuth(PERMISSIONS.CAPA_APPROVE)
      ).resolves.toMatchObject({ orgRole: ROLES.QA_APPROVER });
      await expect(
        requireOrgAuth(PERMISSIONS.CAPA_CLOSE)
      ).resolves.toMatchObject({ orgRole: ROLES.QA_APPROVER });
    });

    it("enforces Separation of Duties: QA Approver cannot approve their own investigation", () => {
      const qaApproverId = "user_qa_approver_123";
      expect(() => {
        verifySeparationOfDuties(qaApproverId, qaApproverId, "Complaint");
      }).toThrow(/Separation of Duties/);
    });
  });

  describe("QA Reviewer Role Capabilities & Boundary", () => {
    it("allows QA Reviewer to investigate, edit, and view audit trail", async () => {
      mockAuth.mockResolvedValue({
        userId: "user_qa_reviewer",
        orgId: "org_test_001",
        orgRole: ROLES.QA_REVIEWER,
        has: () => false,
      });

      await expect(
        requireOrgAuth(PERMISSIONS.COMPLAINT_INVESTIGATE)
      ).resolves.toMatchObject({ orgRole: ROLES.QA_REVIEWER });

      await expect(
        requireOrgAuth(PERMISSIONS.AUDIT_VIEW)
      ).resolves.toMatchObject({ orgRole: ROLES.QA_REVIEWER });
    });

    it("strictly forbids QA Reviewer from closing complaints or approving CAPAs", async () => {
      mockAuth.mockResolvedValue({
        userId: "user_qa_reviewer",
        orgId: "org_test_001",
        orgRole: ROLES.QA_REVIEWER,
        has: () => false,
      });

      await expect(
        requireOrgAuth(PERMISSIONS.COMPLAINT_CLOSE)
      ).rejects.toThrow(/403 Forbidden/);

      await expect(
        requireOrgAuth("complaint.close" as any)
      ).rejects.toThrow(/403 Forbidden/);

      await expect(
        requireOrgAuth(PERMISSIONS.CAPA_APPROVE)
      ).rejects.toThrow(/403 Forbidden/);
    });
  });

  describe("Quality Engineer Role Capabilities & Boundary", () => {
    it("allows Quality Engineer to create complaints, investigate, edit CAPA, and view audits", async () => {
      mockAuth.mockResolvedValue({
        userId: "user_qe_001",
        orgId: "org_test_001",
        orgRole: ROLES.QUALITY_ENGINEER,
        has: () => false,
      });

      await expect(
        requireOrgAuth(PERMISSIONS.COMPLAINT_CREATE)
      ).resolves.toMatchObject({ orgRole: ROLES.QUALITY_ENGINEER });

      await expect(
        requireOrgAuth("complaint.create" as any)
      ).resolves.toMatchObject({ orgRole: ROLES.QUALITY_ENGINEER });

      await expect(
        requireOrgAuth(PERMISSIONS.COMPLAINT_INVESTIGATE)
      ).resolves.toMatchObject({ orgRole: ROLES.QUALITY_ENGINEER });

      await expect(
        requireOrgAuth(PERMISSIONS.CAPA_CREATE)
      ).resolves.toMatchObject({ orgRole: ROLES.QUALITY_ENGINEER });
    });

    it("strictly forbids Quality Engineer from closing complaints or approving CAPAs", async () => {
      mockAuth.mockResolvedValue({
        userId: "user_qe_001",
        orgId: "org_test_001",
        orgRole: ROLES.QUALITY_ENGINEER,
        has: () => false,
      });

      await expect(
        requireOrgAuth(PERMISSIONS.COMPLAINT_CLOSE)
      ).rejects.toThrow(/403 Forbidden/);

      await expect(
        requireOrgAuth(PERMISSIONS.CAPA_APPROVE)
      ).rejects.toThrow(/403 Forbidden/);
    });
  });

  describe("Read Only Role Capabilities & Boundary", () => {
    it("allows Read Only role to inspect audit logs and vigilance", async () => {
      mockAuth.mockResolvedValue({
        userId: "user_auditor",
        orgId: "org_test_001",
        orgRole: ROLES.READ_ONLY,
        has: () => false,
      });

      await expect(
        requireOrgAuth(PERMISSIONS.AUDIT_VIEW)
      ).resolves.toMatchObject({ orgRole: ROLES.READ_ONLY });

      await expect(
        requireOrgAuth(PERMISSIONS.SYSTEM_AUDIT_READ)
      ).resolves.toMatchObject({ orgRole: ROLES.READ_ONLY });

      await expect(
        requireOrgAuth("audit.view" as any)
      ).resolves.toMatchObject({ orgRole: ROLES.READ_ONLY });
    });

    it("strictly blocks Read Only role from write operations", async () => {
      mockAuth.mockResolvedValue({
        userId: "user_auditor",
        orgId: "org_test_001",
        orgRole: ROLES.READ_ONLY,
        has: () => false,
      });

      await expect(
        requireOrgAuth(PERMISSIONS.COMPLAINT_CREATE)
      ).rejects.toThrow(/403 Forbidden/);

      await expect(
        requireOrgAuth(PERMISSIONS.COMPLAINT_EDIT)
      ).rejects.toThrow(/403 Forbidden/);

      await expect(
        requireOrgAuth(PERMISSIONS.COMPLAINT_CLOSE)
      ).rejects.toThrow(/403 Forbidden/);

      await expect(
        requireOrgAuth(PERMISSIONS.CAPA_CREATE)
      ).rejects.toThrow(/403 Forbidden/);
    });
  });

  describe("Dashboard Insights Presets", () => {
    it("has properly defined presets for all 4 new roles", () => {
      expect(ROLE_PRESETS[ROLES.QA_APPROVER]).toBeDefined();
      expect(ROLE_PRESETS[ROLES.QA_APPROVER].label).toBe("QA Approver");
      expect(ROLE_PRESETS[ROLES.QA_APPROVER].defaultCards).toEqual([
        "MY_APPROVALS",
        "VIGILANCE_SLA",
        "CAPA_PIPELINE",
      ]);

      expect(ROLE_PRESETS[ROLES.QA_REVIEWER]).toBeDefined();
      expect(ROLE_PRESETS[ROLES.QA_REVIEWER].label).toBe("QA Reviewer");
      expect(ROLE_PRESETS[ROLES.QA_REVIEWER].defaultCards).toEqual([
        "MY_INVESTIGATIONS",
        "CUSTOMER_COMMUNICATION",
        "AUDIT_ACTIVITY",
      ]);

      expect(ROLE_PRESETS[ROLES.QUALITY_ENGINEER]).toBeDefined();
      expect(ROLE_PRESETS[ROLES.QUALITY_ENGINEER].label).toBe("Quality Engineer");
      expect(ROLE_PRESETS[ROLES.QUALITY_ENGINEER].defaultCards).toEqual([
        "MY_INVESTIGATIONS",
        "CAPA_PIPELINE",
        "SAMPLE_STATUS",
      ]);

      expect(ROLE_PRESETS[ROLES.READ_ONLY]).toBeDefined();
      expect(ROLE_PRESETS[ROLES.READ_ONLY].label).toBe("Read Only / Auditor");
      expect(ROLE_PRESETS[ROLES.READ_ONLY].defaultCards).toEqual([
        "AUDIT_ACTIVITY",
        "CUSTOMER_COMMUNICATION",
        "VIGILANCE_SLA",
      ]);
    });

    it("returns role preset cards from getDefaultCardsForRole", () => {
      expect(getDefaultCardsForRole(ROLES.QUALITY_ENGINEER)).toEqual([
        "MY_INVESTIGATIONS",
        "CAPA_PIPELINE",
        "SAMPLE_STATUS",
      ]);
      expect(getDefaultCardsForRole(ROLES.READ_ONLY)).toEqual([
        "AUDIT_ACTIVITY",
        "CUSTOMER_COMMUNICATION",
        "VIGILANCE_SLA",
      ]);
    });
  });
});
