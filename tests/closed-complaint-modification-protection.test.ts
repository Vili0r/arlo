import { describe, it, expect, vi, beforeEach } from "vitest";
import { Priority, Death, ComplaintStatus, AuditAction } from "@prisma/client";

const { mockAuthCtx, mockTx, mockPrisma, mockVerifyPassword } = vi.hoisted(() => {
  const authCtx = {
    userId: "user_unauthorized_member",
    orgId: "org_medical_devices_01",
    orgRole: "org:member",
    has: vi.fn().mockReturnValue(false),
  };

  const verifyPassword = vi.fn().mockResolvedValue({ verified: true });

  const tx = {
    complaint: {
      findUnique: vi.fn(),
      update: vi.fn(),
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
    attachment: {
      createMany: vi.fn(),
    },
    recordLock: {
      findUnique: vi.fn().mockResolvedValue(null),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };

  const prismaObj = {
    $transaction: vi.fn((callback: (tx: any) => any) => callback(tx)),
    complaint: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    recordLock: {
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };

  return {
    mockAuthCtx: authCtx,
    mockTx: tx,
    mockPrisma: prismaObj,
    mockVerifyPassword: verifyPassword,
  };
});

// Mock dependencies
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockImplementation(async () => mockAuthCtx),
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      verifyPassword: (...args: any[]) => mockVerifyPassword(...args),
    },
  }),
}));

vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: vi.fn().mockImplementation(async () => mockAuthCtx),
  ROLES: {
    ADMIN: "org:admin",
    QA_MANAGER: "org:qa_manager",
    QA_APPROVER: "org:qa_approver",
    QA_REVIEWER: "org:qa_reviewer",
    QUALITY_ENGINEER: "org:quality_engineer",
    COMPLAINT_INVESTIGATOR: "org:complaint_investigator",
    CAPA_OWNER: "org:capa_owner",
    VIGILANCE_LEAD: "org:vigilance_lead",
    READ_ONLY: "org:read_only",
  },
  PERMISSIONS: {
    COMPLAINTS_CREATE: "org:complaints:create",
    COMPLAINT_CREATE: "org:complaint:create",
    COMPLAINTS_INVESTIGATE: "org:complaints:investigate",
    COMPLAINT_INVESTIGATE: "org:complaint:investigate",
    COMPLAINTS_APPROVE_CLOSE: "org:complaints:approve_close",
    COMPLAINT_CLOSE: "org:complaint:close",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

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

import { updateComplaintWithRelations } from "@/lib/actions/complaints";
import { updateComplaint } from "@/actions/complaint/updateComplaint";
import { executeStatusTransition } from "@/lib/actions/esignature";

describe("The system shall prevent unauthorized users from modifying closed complaints", () => {
  const closedComplaint = {
    id: "cmp_closed_001",
    orgId: "org_medical_devices_01",
    complaintNumber: "CMP-2026-0001",
    shortDescription: "Original closed complaint description",
    description: "Detailed investigation has concluded and complaint was formally closed.",
    priority: Priority.HIGH,
    status: ComplaintStatus.CLOSED,
    awarenessDate: new Date("2026-06-01T00:00:00Z"),
    dateReceived: new Date("2026-06-01T00:00:00Z"),
    regulatoryReportingReference: "MEDWATCH-2026-99",
    customerName: "Memorial University Hospital",
    customerType: "HOSPITAL",
    initialReporterName: "Dr. Gregory",
    initialReporterSurname: "House",
    email: "ghouse@memorial.edu",
    address: "100 Diagnostics Way",
    country: "United States",
    telNumber: "+1-555-0199",
    countryEventOccurred: "United States",
    region: "NORTH_AMERICA",
    death: Death.NO,
    complaintOwnerId: "user_owner_1",
    createdById: "user_creator_1",
    productInformation: [
      {
        id: "prod_01",
        occurrence: "Primary",
        materialNumber: "MAT-100",
        materialDescription: "Infusion System X",
        serialNumber: "SN-9999",
        batchNumber: "LOT-01",
        udi: null,
        asReportedCode1: null,
        asReportedCode2: null,
        softwareVersion: null,
      },
    ],
    patientInformation: [
      {
        id: "pat_01",
        patientName: "Patient A",
        patientImpact: "None",
        patientImpactDesc: null,
        sex: "MALE",
        age: 62,
        eventOccurred: new Date("2026-06-01T00:00:00Z"),
        annexE_Codes: [],
        annexF_Codes: [],
      },
    ],
    attachments: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default to unauthorized standard member
    mockAuthCtx.userId = "user_unauthorized_member";
    mockAuthCtx.orgId = "org_medical_devices_01";
    mockAuthCtx.orgRole = "org:member";
    mockAuthCtx.has.mockReturnValue(false);

    mockTx.complaint.findUnique.mockResolvedValue(closedComplaint);
    mockPrisma.complaint.findUnique.mockResolvedValue(closedComplaint);
    mockVerifyPassword.mockResolvedValue({ verified: true });
  });

  // ---------------------------------------------------------------------------
  // 1. Preventing Unauthorized Field Updates on Closed Complaints
  // ---------------------------------------------------------------------------
  describe("1. Field / Details Modification Protection (updateComplaintWithRelations)", () => {
    it("should reject modifying a closed complaint when attempted by an unauthorized member", async () => {
      // User is a standard member without QA Manager or Admin role or approve_close permission
      mockAuthCtx.orgRole = "org:member";
      mockAuthCtx.has.mockReturnValue(false);

      await expect(
        updateComplaintWithRelations({
          complaintId: "cmp_closed_001",
          shortDescription: "Unauthorized change to closed complaint description",
          priority: Priority.CRITICAL,
          awarenessDate: closedComplaint.awarenessDate,
          customerName: closedComplaint.customerName,
          customerType: closedComplaint.customerType,
          initialReporterName: closedComplaint.initialReporterName,
          initialReporterSurname: closedComplaint.initialReporterSurname,
          email: closedComplaint.email,
          address: closedComplaint.address,
          country: closedComplaint.country,
          telNumber: closedComplaint.telNumber,
          countryEventOccurred: closedComplaint.countryEventOccurred,
          region: closedComplaint.region,
        })
      ).rejects.toThrow(
        "403 Forbidden: Cannot modify a closed complaint. Only QA Managers and Administrators have permission to modify closed complaints."
      );

      // Verify no DB modifications or audit logs occurred
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
      expect(mockTx.productInformation.update).not.toHaveBeenCalled();
      expect(mockTx.patientInformation.update).not.toHaveBeenCalled();
      expect(mockTx.auditLog.create).not.toHaveBeenCalled();
    });

    it("should reject modifying a closed complaint when user is a Complaint Investigator without QA/Admin rights", async () => {
      // User has complaint investigator role, but lacks QA_MANAGER, ADMIN, or COMPLAINTS_APPROVE_CLOSE
      mockAuthCtx.orgRole = "org:complaint_investigator";
      mockAuthCtx.has.mockImplementation((param: any) => {
        return param?.permission === "org:complaints:investigate";
      });

      await expect(
        updateComplaintWithRelations({
          complaintId: "cmp_closed_001",
          shortDescription: "Investigator attempted description rewrite on closed record",
          priority: Priority.LOW,
          awarenessDate: closedComplaint.awarenessDate,
          customerName: closedComplaint.customerName,
          customerType: closedComplaint.customerType,
          initialReporterName: closedComplaint.initialReporterName,
          initialReporterSurname: closedComplaint.initialReporterSurname,
          email: closedComplaint.email,
          address: closedComplaint.address,
          country: closedComplaint.country,
          telNumber: closedComplaint.telNumber,
          countryEventOccurred: closedComplaint.countryEventOccurred,
          region: closedComplaint.region,
        })
      ).rejects.toThrow(/403 Forbidden: Cannot modify a closed complaint/);

      expect(mockTx.complaint.update).not.toHaveBeenCalled();
    });

    it("should allow modifying a closed complaint when caller has QA_MANAGER role", async () => {
      mockAuthCtx.orgRole = "org:qa_manager";
      mockAuthCtx.has.mockImplementation((param: any) => param?.role === "org:qa_manager");

      const updatedComplaint = {
        ...closedComplaint,
        shortDescription: "Authorized post-closure documentation clarification",
      };
      mockTx.complaint.update.mockResolvedValue(updatedComplaint);
      mockTx.complaint.findUnique
        .mockResolvedValueOnce(closedComplaint)
        .mockResolvedValueOnce(updatedComplaint);
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_qa_mod" });

      const result = await updateComplaintWithRelations({
        complaintId: "cmp_closed_001",
        shortDescription: "Authorized post-closure documentation clarification",
        priority: Priority.HIGH,
        awarenessDate: closedComplaint.awarenessDate,
        customerName: closedComplaint.customerName,
        customerType: closedComplaint.customerType,
        initialReporterName: closedComplaint.initialReporterName,
        initialReporterSurname: closedComplaint.initialReporterSurname,
        email: closedComplaint.email,
        address: closedComplaint.address,
        country: closedComplaint.country,
        telNumber: closedComplaint.telNumber,
        countryEventOccurred: closedComplaint.countryEventOccurred,
        region: closedComplaint.region,
      });

      expect(result).toBeDefined();
      expect(mockTx.complaint.update).toHaveBeenCalledTimes(1);
    });

    it("should allow modifying a closed complaint when caller has COMPLAINTS_APPROVE_CLOSE permission", async () => {
      mockAuthCtx.orgRole = "org:member";
      mockAuthCtx.has.mockImplementation((param: any) => {
        return param?.permission === "org:complaints:approve_close";
      });

      const updatedComplaint = {
        ...closedComplaint,
        description: "Clarification added by authorized delegate",
      };
      mockTx.complaint.update.mockResolvedValue(updatedComplaint);
      mockTx.complaint.findUnique
        .mockResolvedValueOnce(closedComplaint)
        .mockResolvedValueOnce(updatedComplaint);
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_delegate_mod" });

      const result = await updateComplaintWithRelations({
        complaintId: "cmp_closed_001",
        shortDescription: closedComplaint.shortDescription,
        description: "Clarification added by authorized delegate",
        priority: Priority.HIGH,
        awarenessDate: closedComplaint.awarenessDate,
        customerName: closedComplaint.customerName,
        customerType: closedComplaint.customerType,
        initialReporterName: closedComplaint.initialReporterName,
        initialReporterSurname: closedComplaint.initialReporterSurname,
        email: closedComplaint.email,
        address: closedComplaint.address,
        country: closedComplaint.country,
        telNumber: closedComplaint.telNumber,
        countryEventOccurred: closedComplaint.countryEventOccurred,
        region: closedComplaint.region,
      });

      expect(result).toBeDefined();
      expect(mockTx.complaint.update).toHaveBeenCalledTimes(1);
    });

    it("should allow modifying a closed complaint when caller has QA_APPROVER role", async () => {
      mockAuthCtx.orgRole = "org:qa_approver";
      mockAuthCtx.has.mockImplementation((param: any) => param?.role === "org:qa_approver");

      const updatedComplaint = {
        ...closedComplaint,
        shortDescription: "Authorized post-closure documentation clarification by QA Approver",
      };
      mockTx.complaint.update.mockResolvedValue(updatedComplaint);
      mockTx.complaint.findUnique
        .mockResolvedValueOnce(closedComplaint)
        .mockResolvedValueOnce(updatedComplaint);
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_qa_approver_mod" });

      const result = await updateComplaintWithRelations({
        complaintId: "cmp_closed_001",
        shortDescription: "Authorized post-closure documentation clarification by QA Approver",
        priority: Priority.HIGH,
        awarenessDate: closedComplaint.awarenessDate,
        customerName: closedComplaint.customerName,
        customerType: closedComplaint.customerType,
        initialReporterName: closedComplaint.initialReporterName,
        initialReporterSurname: closedComplaint.initialReporterSurname,
        email: closedComplaint.email,
        address: closedComplaint.address,
        country: closedComplaint.country,
        telNumber: closedComplaint.telNumber,
        countryEventOccurred: closedComplaint.countryEventOccurred,
        region: closedComplaint.region,
      });

      expect(result).toBeDefined();
      expect(mockTx.complaint.update).toHaveBeenCalled();
    });

    it("should reject modifying a closed complaint when user is QA_REVIEWER, QUALITY_ENGINEER, or READ_ONLY", async () => {
      const nonApproverRoles = ["org:qa_reviewer", "org:quality_engineer", "org:read_only"];

      for (const role of nonApproverRoles) {
        mockAuthCtx.orgRole = role;
        mockAuthCtx.has.mockReturnValue(false);
        mockTx.complaint.findUnique.mockResolvedValue(closedComplaint);

        await expect(
          updateComplaintWithRelations({
            complaintId: "cmp_closed_001",
            shortDescription: "Unauthorized edit attempt",
            priority: Priority.HIGH,
            awarenessDate: closedComplaint.awarenessDate,
            customerName: closedComplaint.customerName,
            customerType: closedComplaint.customerType,
            initialReporterName: closedComplaint.initialReporterName,
            initialReporterSurname: closedComplaint.initialReporterSurname,
            email: closedComplaint.email,
            address: closedComplaint.address,
            country: closedComplaint.country,
            telNumber: closedComplaint.telNumber,
            countryEventOccurred: closedComplaint.countryEventOccurred,
            region: closedComplaint.region,
          })
        ).rejects.toThrow(/403 Forbidden: Cannot modify a closed complaint/);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Preventing Unauthorized Modifications via updateComplaint
  // ---------------------------------------------------------------------------
  describe("2. Modification Protection via updateComplaint", () => {
    it("should reject updating a closed complaint via updateComplaint when caller is unauthorized", async () => {
      mockAuthCtx.orgRole = "org:member";
      mockAuthCtx.has.mockReturnValue(false);

      await expect(
        updateComplaint("cmp_closed_001", {
          shortDescription: "Tampering with closed record",
        })
      ).rejects.toThrow(
        "403 Forbidden: Cannot modify a closed complaint. Only QA Managers and Administrators have permission to modify closed complaints."
      );

      expect(mockTx.complaint.update).not.toHaveBeenCalled();
    });

    it("should allow updateComplaint when caller is an Administrator", async () => {
      mockAuthCtx.orgRole = "org:admin";
      mockAuthCtx.has.mockImplementation((param: any) => param?.role === "org:admin");

      mockTx.complaint.update.mockResolvedValue({
        ...closedComplaint,
        regulatoryReportingReference: "MEDWATCH-2026-99-UPDATED",
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_admin_mod" });

      const result = await updateComplaint(
        "cmp_closed_001",
        { regulatoryReportingReference: "MEDWATCH-2026-99-UPDATED" },
        "Admin update to regulatory reference"
      );

      expect(result).toBeDefined();
      expect(mockTx.complaint.update).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Preventing Unauthorized Stage Transitions / Reopening of Closed Complaints
  // ---------------------------------------------------------------------------
  describe("3. Status & Lifecycle Transition Protection (executeStatusTransition)", () => {
    it("should reject reopening or changing status of a closed complaint when user is unauthorized", async () => {
      mockAuthCtx.orgRole = "org:member";
      mockAuthCtx.has.mockReturnValue(false);

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_closed_001");
      formData.set("newStatus", "REOPENED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I author this change");
      formData.set("rationale", "Attempted reopening by unauthorized user");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "403 Forbidden: Only QA Managers and Administrators have the required permissions to reopen / revert from completed this Complaint."
      );
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
    });

    it("should reject transitioning a closed complaint back to IN_PROGRESS when user is unauthorized", async () => {
      mockAuthCtx.orgRole = "org:complaint_investigator";
      mockAuthCtx.has.mockReturnValue(false);

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_closed_001");
      formData.set("newStatus", "IN_PROGRESS");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I author this change");
      formData.set("rationale", "Attempt to revert directly to in progress");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("403 Forbidden");
      expect(mockTx.complaint.update).not.toHaveBeenCalled();
    });

    it("should allow an authorized QA Manager to reopen a closed complaint with documented rationale and signature", async () => {
      mockAuthCtx.orgRole = "org:qa_manager";
      mockAuthCtx.has.mockImplementation((param: any) => param?.role === "org:qa_manager");

      mockTx.complaint.update.mockResolvedValue({
        ...closedComplaint,
        status: ComplaintStatus.REOPENED,
      });
      mockTx.auditLog.create.mockResolvedValue({ id: "audit_reopen" });

      const formData = new FormData();
      formData.set("entityType", "Complaint");
      formData.set("entityId", "cmp_closed_001");
      formData.set("newStatus", "REOPENED");
      formData.set("password", "ValidSecurePass2026!");
      formData.set("meaningOfSignature", "I have reviewed and verified this change");
      formData.set("rationale", "New post-market clinical follow-up received from hospital");

      const result = await executeStatusTransition(null, formData);

      expect(result.success).toBe(true);
      expect(result.updatedStatus).toBe("REOPENED");
      expect(mockTx.complaint.update).toHaveBeenCalledWith({
        where: { id: "cmp_closed_001", orgId: "org_medical_devices_01" },
        data: { status: "REOPENED" },
      });
    });
  });
});
