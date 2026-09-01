import { describe, it, expect, vi, beforeEach } from "vitest";
import { Priority, Death, AuditAction } from "@prisma/client";
import { generateAuditDiff } from "@/utils/auditDiff";

const { mockTx, mockPrisma } = vi.hoisted(() => {
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
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };

  const prismaObj = {
    $transaction: vi.fn((callback) => callback(tx)),
    complaint: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };

  return { mockTx: tx, mockPrisma: prismaObj };
});

// Mock dependencies
vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: vi.fn().mockResolvedValue({
    userId: "user_test123",
    orgId: "org_test456",
  }),
  PERMISSIONS: {
    COMPLAINTS_CREATE: "org:complaints:create",
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({
    userId: "user_test123",
    orgId: "org_test456",
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Also mock PrismaClient instance in actions/complaint/updateComplaint.ts
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
import { getAuditHistory } from "@/lib/actions/audit";

describe("Complaint Update & Audit Trail Logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const existingComplaint = {
    id: "cmp_12345",
    orgId: "org_test456",
    complaintNumber: "CMP-2026-0001",
    shortDescription: "Original Short Description",
    description: "Original full details",
    priority: Priority.LOW,
    status: "OPEN",
    awarenessDate: new Date("2026-08-01T00:00:00Z"),
    dateReceived: new Date("2026-08-01T00:00:00Z"),
    regulatoryReportingReference: null,
    customerName: "City Hospital",
    customerType: "HOSPITAL",
    initialReporterName: "Alice",
    initialReporterSurname: "Smith",
    email: "alice@cityhospital.org",
    address: "100 Main St",
    country: "United States",
    telNumber: "+1-555-0100",
    countryEventOccurred: "United States",
    region: "NORTH_AMERICA",
    death: Death.NO,
    detailDescriptionNativeLanguage: null,
    customerResponseNeeded: true,
    finalResponseCompletedOn: null,
    complaintOwnerId: "user_test123",
    deviceModel: "Pump Model A",
    deviceSerialNumber: "SN-100",
    lotNumber: "LOT-1",
    isAdverseEvent: false,
    productInformation: [
      {
        id: "prod_1",
        occurrence: "Primary",
        materialNumber: "MAT-01",
        materialDescription: "Pump Model A",
        serialNumber: "SN-100",
        batchNumber: "LOT-1",
        udi: null,
        asReportedCode1: null,
        asReportedCode2: null,
        softwareVersion: null,
      },
    ],
    patientInformation: [
      {
        id: "pat_1",
        patientName: "John Doe",
        patientImpact: "None",
        patientImpactDesc: null,
        sex: "MALE",
        age: 50,
        eventOccurred: new Date("2026-08-01T00:00:00Z"),
        annexE_Codes: [],
        annexF_Codes: [],
      },
    ],
    attachments: [],
  };

  it("should update complaint details and create an immutable 21 CFR Part 11 AuditLog with field diffs", async () => {
    mockTx.complaint.findUnique
      .mockResolvedValueOnce(existingComplaint) // before update
      .mockResolvedValueOnce({
        ...existingComplaint,
        shortDescription: "Updated Motor Malfunction Description",
        priority: Priority.CRITICAL,
        death: Death.YES,
        customerName: "City Hospital West Wing",
      }); // after update for logging

    mockTx.complaint.update.mockResolvedValue({
      ...existingComplaint,
      shortDescription: "Updated Motor Malfunction Description",
      priority: Priority.CRITICAL,
      death: Death.YES,
      customerName: "City Hospital West Wing",
    });

    const mockAuditLogEntry = {
      id: "audit_update_1",
      orgId: "org_test456",
      entityType: "Complaint",
      entityId: "cmp_12345",
      action: AuditAction.UPDATE,
      changedById: "user_test123",
      previousData: existingComplaint,
      newData: {
        ...existingComplaint,
        shortDescription: "Updated Motor Malfunction Description",
        priority: Priority.CRITICAL,
        death: Death.YES,
        customerName: "City Hospital West Wing",
      },
      reason: "Updated complaint details (CMP-2026-0001)",
      fieldChanges: [
        {
          field: "shortDescription",
          oldValue: "Original Short Description",
          newValue: "Updated Motor Malfunction Description",
        },
        {
          field: "priority",
          oldValue: "LOW",
          newValue: "CRITICAL",
        },
        {
          field: "death",
          oldValue: "NO",
          newValue: "YES",
        },
        {
          field: "customerName",
          oldValue: "City Hospital",
          newValue: "City Hospital West Wing",
        },
      ],
      complaintId: "cmp_12345",
    };

    mockTx.auditLog.create.mockResolvedValue(mockAuditLogEntry);

    // Act
    const updated = await updateComplaintWithRelations({
      complaintId: "cmp_12345",
      shortDescription: "Updated Motor Malfunction Description",
      priority: Priority.CRITICAL,
      awarenessDate: existingComplaint.awarenessDate,
      customerName: "City Hospital West Wing",
      customerType: "HOSPITAL",
      initialReporterName: "Alice",
      initialReporterSurname: "Smith",
      email: "alice@cityhospital.org",
      address: "100 Main St",
      country: "United States",
      telNumber: "+1-555-0100",
      countryEventOccurred: "United States",
      region: "NORTH_AMERICA",
      death: Death.YES,
    });

    // Assert update was performed
    expect(mockTx.complaint.update).toHaveBeenCalledTimes(1);
    expect(updated).not.toBeNull();
    expect(updated!.shortDescription).toBe("Updated Motor Malfunction Description");
    expect(updated!.priority).toBe(Priority.CRITICAL);
    expect(updated!.death).toBe(Death.YES);

    // Assert AuditLog was created with action UPDATE
    expect(mockTx.auditLog.create).toHaveBeenCalledTimes(1);
    const auditCallArgs = mockTx.auditLog.create.mock.calls[0][0];

    expect(auditCallArgs.data.entityType).toBe("Complaint");
    expect(auditCallArgs.data.entityId).toBe("cmp_12345");
    expect(auditCallArgs.data.action).toBe(AuditAction.UPDATE);
    expect(auditCallArgs.data.changedById).toBe("user_test123");
    expect(auditCallArgs.data.complaintId).toBe("cmp_12345");
    expect(auditCallArgs.data.previousData).toBeDefined();
    expect(auditCallArgs.data.newData).toBeDefined();

    // Verify diff calculation captured the changed fields
    const changes = auditCallArgs.data.fieldChanges as Array<{ field: string; oldValue: any; newValue: any }>;
    expect(changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "shortDescription",
          oldValue: "Original Short Description",
          newValue: "Updated Motor Malfunction Description",
        }),
        expect.objectContaining({
          field: "priority",
          oldValue: "LOW",
          newValue: "CRITICAL",
        }),
        expect.objectContaining({
          field: "death",
          oldValue: "NO",
          newValue: "YES",
        }),
        expect.objectContaining({
          field: "customerName",
          oldValue: "City Hospital",
          newValue: "City Hospital West Wing",
        }),
      ])
    );
  });

  it("should accurately calculate field diffs using generateAuditDiff", () => {
    const oldRec = {
      id: "123",
      shortDescription: "Motor failure",
      priority: "LOW",
      death: "NO",
      customData: { defectCode: "E01" },
    };

    const newRec = {
      id: "123",
      shortDescription: "Motor failure - electrical short",
      priority: "HIGH",
      death: "NO",
      customData: { defectCode: "E02" },
    };

    const diff = generateAuditDiff(oldRec, newRec);

    expect(diff).toHaveLength(3);
    expect(diff).toContainEqual({
      field: "shortDescription",
      oldValue: "Motor failure",
      newValue: "Motor failure - electrical short",
    });
    expect(diff).toContainEqual({
      field: "priority",
      oldValue: "LOW",
      newValue: "HIGH",
    });
    expect(diff).toContainEqual({
      field: "customData",
      oldValue: { defectCode: "E01" },
      newValue: { defectCode: "E02" },
    });
  });

  it("should record audit log when updating complaint via updateComplaint server action", async () => {
    mockPrisma.complaint.findUnique.mockResolvedValue(existingComplaint);
    mockTx.complaint.update.mockResolvedValue({
      ...existingComplaint,
      shortDescription: "Updated via action",
    });
    mockTx.auditLog.create.mockResolvedValue({ id: "audit_action_1" });

    const result = await updateComplaint("cmp_12345", {
      shortDescription: "Updated via action",
    }, "Customer requested update");

    expect(result.shortDescription).toBe("Updated via action");
    expect(mockTx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "UPDATE",
          entityType: "Complaint",
          entityId: "cmp_12345",
          reason: "Customer requested update",
        }),
      })
    );
  });

  it("should retrieve full audit history for a complaint using getAuditHistory", async () => {
    const mockHistoryLogs = [
      {
        id: "audit_2",
        orgId: "org_test456",
        entityType: "Complaint",
        entityId: "cmp_12345",
        action: AuditAction.UPDATE,
        reason: "Updated complaint details",
        timestamp: new Date("2026-08-31T12:00:00Z"),
        changedBy: { firstName: "Admin", lastName: "User", email: "admin@arlo.io" },
      },
      {
        id: "audit_1",
        orgId: "org_test456",
        entityType: "Complaint",
        entityId: "cmp_12345",
        action: AuditAction.CREATE,
        reason: "Initial complaint creation",
        timestamp: new Date("2026-08-31T10:00:00Z"),
        changedBy: { firstName: "Jane", lastName: "Doe", email: "jane@arlo.io" },
      },
    ];

    mockPrisma.auditLog.findMany.mockResolvedValue(mockHistoryLogs);

    const history = await getAuditHistory("Complaint", "cmp_12345");

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          orgId: "org_test456",
          OR: expect.arrayContaining([
            { entityType: "Complaint", entityId: "cmp_12345" },
          ]),
        }),
        orderBy: { timestamp: "desc" },
      })
    );
    expect(history).toHaveLength(2);
    expect(history[0].id).toBe("audit_2");
    expect(history[1].id).toBe("audit_1");
  });
});
