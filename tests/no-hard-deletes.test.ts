import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { AuditAction } from "@prisma/client";

// Hoisted mocks for webhook and Prisma
const { mockPrisma, mockVerifyWebhook } = vi.hoisted(() => {
  const verifyWebhook = vi.fn();

  const prismaObj = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
    },
    organizationMember: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    complaint: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prismaObj)),
  };

  return {
    mockPrisma: prismaObj,
    mockVerifyWebhook: verifyWebhook,
  };
});

import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}));

vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: (...args: unknown[]) => mockVerifyWebhook(...args),
}));

import { POST as clerkWebhookHandler } from "@/app/api/webhooks/clerk/route";
import { findOrgByIdentifier } from "@/lib/tenant";

/**
 * @traceability
 * URS: URS-008 (Closed Record Immutability & Modification Protection), URS-010 (21 CFR Part 11 Electronic Audit Trail)
 * SRS: SRS-005 (Closed Complaint Immutability Guard), SRS-015 (Chronological Audit History Retrieval)
 * Design: DESIGN-005 (Immutability Guard)
 * Test ID: TEST-NO-HARD-DELETES
 */
describe("[NO HARD DELETES] Regulatory Data Retention & Soft-Delete Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Prisma Schema Verification: Soft-Delete Fields & Audit Actions
  // ---------------------------------------------------------------------------
  describe("1. Schema & Model Architecture (Soft Delete Declarations)", () => {
    const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");

    function getModelBlock(content: string, modelName: string): string {
      const marker = `model ${modelName} {`;
      const start = content.indexOf(marker);
      if (start === -1) return "";
      const end = content.indexOf("\n}", start);
      return content.slice(start, end !== -1 ? end + 2 : undefined);
    }

    it("should confirm the Complaint model defines a deletedAt timestamp for soft deletes and prohibits hard deletes", () => {
      const complaintBlock = getModelBlock(schemaContent, "Complaint");
      expect(complaintBlock).not.toBe("");
      expect(complaintBlock).toMatch(/deletedAt\s+DateTime\?\s+\/\/\s*Soft delete\s*\(No hard deletes\)/i);
    });

    it("should confirm User and Organization models include deletedAt soft-delete fields", () => {
      const userBlock = getModelBlock(schemaContent, "User");
      expect(userBlock).not.toBe("");
      expect(userBlock).toMatch(/deletedAt\s+DateTime\?\s+\/\/\s*Soft delete/i);

      const orgBlock = getModelBlock(schemaContent, "Organization");
      expect(orgBlock).not.toBe("");
      expect(orgBlock).toMatch(/deletedAt\s+DateTime\?\s+\/\/\s*Soft delete/i);
    });

    it("should confirm the AuditAction enum contains SOFT_DELETE and does NOT contain any hard delete action", () => {
      const auditActionMatch = schemaContent.match(/enum\s+AuditAction\s+\{([^}]+)\}/);
      expect(auditActionMatch).not.toBeNull();

      const actions = auditActionMatch![1];
      expect(actions).toContain("SOFT_DELETE");
      expect(actions).not.toContain("HARD_DELETE");
      expect(actions).not.toMatch(/\bDELETE\b/);
      expect(actions).not.toContain("PURGE");
    });

    it("should confirm the AuditLog model itself has no deletedAt field (immutable permanent audit records)", () => {
      const auditLogMatch = schemaContent.match(/model\s+AuditLog\s+\{([^}]+)\}/);
      expect(auditLogMatch).not.toBeNull();

      const auditLogFields = auditLogMatch![1];
      // 21 CFR Part 11: Audit trail entries must be strictly append-only and cannot be soft or hard deleted
      expect(auditLogFields).not.toContain("deletedAt");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Webhook Execution: User & Organization Soft Deletions (No Hard Delete)
  // ---------------------------------------------------------------------------
  describe("2. Webhook Event Handlers (Clerk Soft-Deletion & Restoration)", () => {
    it("should soft-delete User on 'user.deleted' webhook event without calling prisma.user.delete", async () => {
      const existingUser = {
        id: "user_test_soft_delete",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        deletedAt: null,
      };

      mockVerifyWebhook.mockResolvedValue({
        type: "user.deleted",
        data: { id: "user_test_soft_delete" },
      });
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue({
        ...existingUser,
        deletedAt: new Date(),
      });
      mockPrisma.organizationMember.findFirst.mockResolvedValue({
        id: "mem_123",
        orgId: "org_medical_01",
        userId: "user_test_soft_delete",
      });
      mockPrisma.auditLog.create.mockResolvedValue({ id: "audit_soft_del_user" });

      const dummyReq = new NextRequest("http://localhost:3000/api/webhooks/clerk", {
        method: "POST",
      });

      const response = await clerkWebhookHandler(dummyReq);
      expect(response.status).toBe(200);

      // Verify prisma.user.update was called setting deletedAt
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user_test_soft_delete" },
        data: { deletedAt: expect.any(Date) },
      });

      // Verify that HARD DELETE methods were NEVER called
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
      expect(mockPrisma.user.deleteMany).not.toHaveBeenCalled();

      // Verify an AuditLog was recorded with action: SOFT_DELETE
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_medical_01",
            entityType: "User",
            entityId: "user_test_soft_delete",
            action: AuditAction.SOFT_DELETE,
            reason: expect.stringContaining("soft delete"),
          }),
        })
      );
    });

    it("should restore a previously soft-deleted User on 'user.created' or 'user.updated'", async () => {
      mockVerifyWebhook.mockResolvedValue({
        type: "user.updated",
        data: {
          id: "user_test_soft_delete",
          email_addresses: [{ email_address: "test@example.com" }],
          first_name: "Test",
          last_name: "User",
        },
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user_test_soft_delete",
        deletedAt: new Date("2026-01-01T00:00:00Z"),
      });
      mockPrisma.user.upsert.mockResolvedValue({
        id: "user_test_soft_delete",
        deletedAt: null,
      });

      const dummyReq = new NextRequest("http://localhost:3000/api/webhooks/clerk", {
        method: "POST",
      });

      const response = await clerkWebhookHandler(dummyReq);
      expect(response.status).toBe(200);

      // Verify upsert restores user with deletedAt: null
      expect(mockPrisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            deletedAt: null,
          }),
        })
      );
    });

    it("should soft-delete Organization on 'organization.deleted' webhook event without calling prisma.organization.delete", async () => {
      const existingOrg = {
        id: "org_test_soft_delete",
        name: "Test Devices Corp",
        deletedAt: null,
      };

      mockVerifyWebhook.mockResolvedValue({
        type: "organization.deleted",
        data: { id: "org_test_soft_delete" },
      });
      mockPrisma.organization.findUnique.mockResolvedValue(existingOrg);
      mockPrisma.organization.update.mockResolvedValue({
        ...existingOrg,
        deletedAt: new Date(),
      });

      const dummyReq = new NextRequest("http://localhost:3000/api/webhooks/clerk", {
        method: "POST",
      });

      const response = await clerkWebhookHandler(dummyReq);
      expect(response.status).toBe(200);

      // Verify prisma.organization.update set deletedAt
      expect(mockPrisma.organization.update).toHaveBeenCalledWith({
        where: { id: "org_test_soft_delete" },
        data: { deletedAt: expect.any(Date) },
      });

      // Verify HARD DELETE was never called on Organization
      expect(mockPrisma.organization.delete).not.toHaveBeenCalled();
      expect(mockPrisma.organization.deleteMany).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Application Query Filters: Enforcing deletedAt: null
  // ---------------------------------------------------------------------------
  describe("3. Query Boundaries (Exclusion of Soft-Deleted Records)", () => {
    it("should filter out soft-deleted organizations in findOrgByIdentifier", async () => {
      mockPrisma.organization.findFirst.mockResolvedValue(null);

      await findOrgByIdentifier("inactive-org");

      expect(mockPrisma.organization.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { slug: "inactive-org" },
            { name: { equals: "inactive-org", mode: "insensitive" } },
            { id: "inactive-org" },
          ],
          deletedAt: null, // Strict requirement that active lookups exclude soft-deleted orgs
        },
      });
    });

    it("should confirm core server actions and pages query complaints with deletedAt: null", () => {
      const appFiles = [
        "lib/tenant.ts",
        "lib/actions/task.ts",
        "lib/actions/esignature.ts",
        "app/[orgSlug]/complaints/page.tsx",
        "app/[orgSlug]/page.tsx",
      ];

      for (const relPath of appFiles) {
        const fullPath = path.resolve(__dirname, "..", relPath);
        const fileContent = fs.readFileSync(fullPath, "utf-8");
        expect(fileContent).toContain("deletedAt: null");
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Server Actions Immutability: No Hard Delete Actions Exported
  // ---------------------------------------------------------------------------
  describe("4. Complaint Server Actions & Service Surface", () => {
    it("should verify that lib/actions/complaints.ts exports NO hard delete functions", async () => {
      const complaintsModule = await import("@/lib/actions/complaints");
      const exportedKeys = Object.keys(complaintsModule);

      const deleteFunctions = exportedKeys.filter((name) =>
        /delete|remove|destroy|purge/i.test(name)
      );

      expect(deleteFunctions).toEqual([]);
    });

    it("should verify that actions/complaint/updateComplaint.ts exports NO hard delete functions", async () => {
      const updateComplaintModule = await import("@/actions/complaint/updateComplaint");
      const exportedKeys = Object.keys(updateComplaintModule);

      const deleteFunctions = exportedKeys.filter((name) =>
        /delete|remove|destroy|purge/i.test(name)
      );

      expect(deleteFunctions).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Codebase Static Analysis Guardrail: Zero Hard Deletes on Primary Records
  // ---------------------------------------------------------------------------
  describe("5. Codebase Static Analysis Guardrail (No Hard Deletes in Production Code)", () => {
    const rootDir = path.resolve(__dirname, "..");
    const searchDirs = ["lib", "actions", "app"];

    function getFiles(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getFiles(fullPath));
        } else if (/\.(ts|tsx)$/.test(file)) {
          results.push(fullPath);
        }
      }
      return results;
    }

    it("should verify that prisma.complaint.delete or prisma.complaint.deleteMany is NEVER called anywhere", () => {
      const files: string[] = [];
      for (const sub of searchDirs) {
        files.push(...getFiles(path.join(rootDir, sub)));
      }

      const violatingFiles: { file: string; match: string }[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        // Matches prisma.complaint.delete( or tx.complaint.delete( or deleteMany
        const match = content.match(/(prisma|tx)\.complaint\.(delete|deleteMany)\s*\(/);
        if (match) {
          violatingFiles.push({ file: path.relative(rootDir, file), match: match[0] });
        }
      }

      expect(violatingFiles).toEqual([]);
    });

    it("should verify that prisma.user.delete or prisma.user.deleteMany is NEVER called anywhere", () => {
      const files: string[] = [];
      for (const sub of searchDirs) {
        files.push(...getFiles(path.join(rootDir, sub)));
      }

      const violatingFiles: { file: string; match: string }[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        const match = content.match(/(prisma|tx)\.user\.(delete|deleteMany)\s*\(/);
        if (match) {
          violatingFiles.push({ file: path.relative(rootDir, file), match: match[0] });
        }
      }

      expect(violatingFiles).toEqual([]);
    });

    it("should verify that prisma.organization.delete or prisma.organization.deleteMany is NEVER called anywhere", () => {
      const files: string[] = [];
      for (const sub of searchDirs) {
        files.push(...getFiles(path.join(rootDir, sub)));
      }

      const violatingFiles: { file: string; match: string }[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        const match = content.match(/(prisma|tx)\.organization\.(delete|deleteMany)\s*\(/);
        if (match) {
          violatingFiles.push({ file: path.relative(rootDir, file), match: match[0] });
        }
      }

      expect(violatingFiles).toEqual([]);
    });

    it("should verify that audit logs are strictly immutable and never hard-deleted", () => {
      const files: string[] = [];
      for (const sub of searchDirs) {
        files.push(...getFiles(path.join(rootDir, sub)));
      }

      const violatingFiles: { file: string; match: string }[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        const match = content.match(/(prisma|tx)\.auditLog\.(delete|deleteMany)\s*\(/);
        if (match) {
          violatingFiles.push({ file: path.relative(rootDir, file), match: match[0] });
        }
      }

      expect(violatingFiles).toEqual([]);
    });

    it("should verify that CAPA records are never hard-deleted", () => {
      const files: string[] = [];
      for (const sub of searchDirs) {
        files.push(...getFiles(path.join(rootDir, sub)));
      }

      const violatingFiles: { file: string; match: string }[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        const match = content.match(/(prisma|tx)\.capa\.(delete|deleteMany)\s*\(/);
        if (match) {
          violatingFiles.push({ file: path.relative(rootDir, file), match: match[0] });
        }
      }

      expect(violatingFiles).toEqual([]);
    });
  });
});
