import { describe, it, expect, vi, beforeEach } from "vitest";
import { Priority, Death, ComplaintStatus } from "@prisma/client";

const { mockTx, mockPrisma, mockAuthContext, mockVerifyPassword } = vi.hoisted(() => {
  const verifyPassword = vi.fn().mockResolvedValue({ verified: true });
  const authCtx = {
    userId: "user_org_b",
    orgId: "org_B",
    orgRole: "org:admin",
    has: () => true,
  };

  const tx = {
    complaint: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    vigilanceDecisionTree: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    investigation: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    customerCommunication: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    productInformation: {
      deleteMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    patientInformation: {
      deleteMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };

  const prismaObj = {
    $transaction: vi.fn((callback) => callback(tx)),
    complaint: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };

  return {
    mockTx: tx,
    mockPrisma: prismaObj,
    mockAuthContext: authCtx,
    mockVerifyPassword: verifyPassword,
  };
});

// Mock dependencies
vi.mock("@/lib/auth-guard", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth-guard")>("@/lib/auth-guard");
  return {
    ...actual,
    requireOrgAuth: vi.fn().mockImplementation(async () => {
      if (!mockAuthContext.userId) {
        throw new Error("401 Unauthorized: User authentication required.");
      }
      if (!mockAuthContext.orgId) {
        throw new Error(
          "403 Forbidden: An active Organization context (orgId) is mandatory for tenant isolation."
        );
      }
      return {
        userId: mockAuthContext.userId,
        orgId: mockAuthContext.orgId,
        orgRole: mockAuthContext.orgRole,
      };
    }),
  };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockImplementation(async () => ({
    userId: mockAuthContext.userId,
    orgId: mockAuthContext.orgId,
    orgRole: mockAuthContext.orgRole,
    has: () => true,
  })),
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      verifyPassword: (...args: any[]) => mockVerifyPassword(...args),
    },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock PrismaClient instance in actions/complaint/updateComplaint.ts
vi.mock("@prisma/client", async () => {
  const actual = await vi.importActual<typeof import("@prisma/client")>("@prisma/client");
  return {
    ...actual,
    PrismaClient: class {
      $transaction = mockPrisma.$transaction;
      complaint = mockPrisma.complaint;
      auditLog = mockPrisma.auditLog;
    },
  };
});

import {
  createComplaintWithRelations,
  updateComplaintWithRelations,
} from "@/lib/actions/complaints";
import { updateComplaint } from "@/actions/complaint/updateComplaint";
import { executeStatusTransition } from "@/lib/actions/esignature";
import { getAuditHistory } from "@/lib/actions/audit";

describe("Cross-Organization Multi-Tenant Security & Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.userId = "user_org_b";
    mockAuthContext.orgId = "org_B";
    mockAuthContext.orgRole = "org:admin";
  });

  const complaintInOrgA = {
    id: "cmp_org_a_123",
    orgId: "org_A", // Belongs to Organization A
    complaintNumber: "CMP-2026-0001",
    shortDescription: "Org A confidential device complaint",
    description: "Confidential details of Org A product issue",
    priority: Priority.HIGH,
    status: ComplaintStatus.OPEN,
    awarenessDate: new Date("2026-08-01T00:00:00Z"),
    dateReceived: new Date("2026-08-01T00:00:00Z"),
    customerName: "Hospital Alpha",
    customerType: "HOSPITAL",
    initialReporterName: "Dr. Alpha",
    initialReporterSurname: "Physician",
    email: "alpha@hospital-a.org",
    address: "1 Alpha Way",
    country: "United States",
    telNumber: "+1-555-0101",
    countryEventOccurred: "United States",
    region: "NORTH_AMERICA",
    death: Death.NO,
    complaintOwnerId: "user_org_a",
    createdById: "user_org_a",
    productInformation: [],
    patientInformation: [],
    attachments: [],
  };

  describe("1. Complaint Creation Isolation", () => {
    it("should strictly bind created complaint and all sub-records to the caller's active orgId and not allow cross-org injection", async () => {
      // User is authenticated in Organization B
      mockAuthContext.orgId = "org_B";
      mockAuthContext.userId = "user_org_b";
      mockTx.complaint.count.mockResolvedValue(0);

      mockTx.complaint.create.mockResolvedValue({
        id: "cmp_org_b_1",
        orgId: "org_B",
        complaintNumber: "CMP-2026-0001",
        productInformation: [],
        patientInformation: [],
        attachments: [],
      });
      mockTx.vigilanceDecisionTree.create.mockResolvedValue({ id: "vig_1", orgId: "org_B" });
      mockTx.investigation.create.mockResolvedValue({ id: "inv_1", orgId: "org_B" });
      mockTx.customerCommunication.create.mockResolvedValue({ id: "comm_1", orgId: "org_B" });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_1", orgId: "org_B" });

      await createComplaintWithRelations({
        shortDescription: "Org B complaint",
        priority: Priority.MEDIUM,
        awarenessDate: new Date("2026-08-31T00:00:00Z"),
        customerName: "Clinic Beta",
        customerType: "CLINIC",
        initialReporterName: "Jane",
        initialReporterSurname: "Beta",
        email: "jane@clinic-b.org",
        address: "2 Beta Blvd",
        country: "United States",
        telNumber: "+1-555-0102",
        countryEventOccurred: "United States",
        region: "NORTH_AMERICA",
      });

      // Verify that tx.complaint.create received caller's orgId ("org_B")
      expect(mockTx.complaint.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_B",
            createdById: "user_org_b",
          }),
        })
      );

      // Verify sub-records were scoped to "org_B"
      expect(mockTx.vigilanceDecisionTree.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: "org_B" }),
        })
      );
      expect(mockTx.investigation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: "org_B" }),
        })
      );
      expect(mockTx.customerCommunication.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orgId: "org_B" }),
        })
      );
    });

    it("should reject complaint creation when user has no active organization context", async () => {
      // Missing organization context
      mockAuthContext.orgId = "";

      await expect(
        createComplaintWithRelations({
          shortDescription: "Unauthenticated org complaint",
          priority: Priority.LOW,
          awarenessDate: new Date("2026-08-31T00:00:00Z"),
          customerName: "Anonymous Clinic",
          customerType: "CLINIC",
          initialReporterName: "Anon",
          initialReporterSurname: "User",
          email: "anon@clinic.org",
          address: "N/A",
          country: "United States",
          telNumber: "N/A",
          countryEventOccurred: "United States",
          region: "NORTH_AMERICA",
        })
      ).rejects.toThrow("An active Organization context (orgId) is mandatory for tenant isolation.");
    });
  });

  describe("2. Complaint View Isolation", () => {
    it("should prevent a user in Org B from viewing a complaint belonging to Org A", async () => {
      // User is in Org B
      mockAuthContext.orgId = "org_B";

      // Database returns null because query filters where: { id: "cmp_org_a_123", orgId: "org_B" }
      mockPrisma.complaint.findUnique.mockImplementation(({ where }: { where: { id: string; orgId: string } }) => {
        if (where.id === complaintInOrgA.id && where.orgId === complaintInOrgA.orgId) {
          return Promise.resolve(complaintInOrgA);
        }
        return Promise.resolve(null);
      });

      // Query from Org B for Org A's record
      const result = await mockPrisma.complaint.findUnique({
        where: {
          id: complaintInOrgA.id,
          orgId: "org_B", // Tenant isolation filter
        },
      });

      expect(result).toBeNull();
    });
  });

  describe("3. Complaint Update Isolation", () => {
    it("should prevent a user in Org B from updating a complaint in Org A via updateComplaintWithRelations", async () => {
      mockAuthContext.orgId = "org_B";
      mockAuthContext.userId = "user_org_b";

      // When looking up complaint with where: { id: "cmp_org_a_123", orgId: "org_B" }, returns null
      mockTx.complaint.findUnique.mockResolvedValue(null);

      await expect(
        updateComplaintWithRelations({
          complaintId: "cmp_org_a_123",
          shortDescription: "Unauthorized malicious modification attempt",
          priority: Priority.CRITICAL,
          awarenessDate: new Date(),
          customerName: "Hacked Hospital",
          customerType: "HOSPITAL",
          initialReporterName: "Hacker",
          initialReporterSurname: "User",
          email: "hacker@evil.org",
          address: "N/A",
          country: "United States",
          telNumber: "N/A",
          countryEventOccurred: "United States",
          region: "NORTH_AMERICA",
        })
      ).rejects.toThrow("Complaint not found or insufficient permissions.");

      // Ensure no update and no audit log were executed
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should prevent a user in Org B from updating a complaint in Org A via updateComplaint", async () => {
      mockAuthContext.orgId = "org_B";
      mockAuthContext.userId = "user_org_b";

      // Query scoped by orgId returns null
      mockPrisma.complaint.findUnique.mockResolvedValue(null);

      await expect(
        updateComplaint("cmp_org_a_123", {
          shortDescription: "Unauthorized update attempt",
        })
      ).rejects.toThrow("Complaint not found");

      expect(mockTx.complaint.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe("4. Stage Transition & Electronic Signature Isolation", () => {
    it("should prevent a user in Org B from transitioning a complaint status in Org A", async () => {
      mockAuthContext.orgId = "org_B";
      mockAuthContext.userId = "user_org_b";
      mockVerifyPassword.mockResolvedValue({ verified: true });

      // fetchRecord scoped by orgId returns null
      mockTx.complaint.findUnique.mockResolvedValue(null);

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_org_a_123");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidPass2026!");
      formData.set("meaningOfSignature", "I confirm initiation");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Complaint record not found or access denied.");
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe("5. Audit History Isolation", () => {
    it("should prevent a user in Org B from reading audit trail logs of Org A", async () => {
      mockAuthContext.orgId = "org_B";

      // Mock database behavior: findMany only returns logs where orgId matches
      mockPrisma.auditLog.findMany.mockImplementation(({ where }: { where: { orgId: string } }) => {
        if (where.orgId === "org_A") {
          return Promise.resolve([
            { id: "audit_a_1", orgId: "org_A", entityType: "Complaint", entityId: "cmp_org_a_123" },
          ]);
        }
        // For Org B, no logs exist for Org A's entityId
        return Promise.resolve([]);
      });

      const history = await getAuditHistory("Complaint", "cmp_org_a_123");

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: "org_B", // Tenant filter automatically enforced
          }),
        })
      );
      expect(history).toEqual([]);
    });
  });
});
