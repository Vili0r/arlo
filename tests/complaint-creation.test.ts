import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createComplaintWithRelations,
  CreateComplaintWithRelationsInput,
} from "@/lib/actions/complaints";
import { Priority, Death, InvestigationStatus, VigilanceStatus, AuditAction } from "@prisma/client";

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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Prisma
const mockTx = {
  complaint: {
    count: vi.fn(),
    create: vi.fn(),
  },
  vigilanceDecisionTree: {
    create: vi.fn(),
  },
  investigation: {
    create: vi.fn(),
  },
  customerCommunication: {
    create: vi.fn(),
  },
  formTemplate: {
    findUnique: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback(mockTx)),
  },
}));

describe("Complaint Creation Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validComplaintInput: CreateComplaintWithRelationsInput = {
    shortDescription: "Infusion pump motor malfunction during clinical delivery",
    description: "The motor stalled during medication infusion causing alert.",
    priority: Priority.HIGH,
    awarenessDate: new Date("2026-08-31T10:00:00Z"),
    dateReceived: new Date("2026-08-31T10:30:00Z"),
    customerName: "Memorial Regional Hospital",
    customerType: "HOSPITAL",
    initialReporterName: "Jane",
    initialReporterSurname: "Doe",
    email: "jane.doe@memorial.org",
    address: "123 Health Ave, Suite 400",
    country: "United States",
    telNumber: "+1-555-0199",
    countryEventOccurred: "United States",
    region: "NORTH_AMERICA",
    death: Death.NO,
    products: [
      {
        materialNumber: "MAT-9001",
        materialDescription: "Infusion Pump Model X",
        serialNumber: "SN-8831",
        batchNumber: "LOT-2026-A",
      },
    ],
    patients: [
      {
        patientName: "Patient A",
        age: 45,
        sex: "FEMALE",
        patientImpact: "Delinquent dosage recovered without adverse harm",
      },
    ],
  };

  it("should create an investigation, vigilance, and follow-up (customer communication) record at the same time when a complaint is created", async () => {
    const currentYear = new Date().getFullYear();
    mockTx.complaint.count.mockResolvedValue(0);

    const mockCreatedComplaint = {
      id: "cmp_12345",
      orgId: "org_test456",
      complaintNumber: `CMP-${currentYear}-0001`,
      shortDescription: validComplaintInput.shortDescription,
      description: validComplaintInput.description,
      priority: validComplaintInput.priority,
      status: "OPEN",
      awarenessDate: validComplaintInput.awarenessDate,
      dateReceived: validComplaintInput.dateReceived,
      customerName: validComplaintInput.customerName,
      customerType: validComplaintInput.customerType,
      initialReporterName: validComplaintInput.initialReporterName,
      initialReporterSurname: validComplaintInput.initialReporterSurname,
      email: validComplaintInput.email,
      address: validComplaintInput.address,
      country: validComplaintInput.country,
      telNumber: validComplaintInput.telNumber,
      countryEventOccurred: validComplaintInput.countryEventOccurred,
      region: validComplaintInput.region,
      death: Death.NO,
      customerResponseNeeded: true,
      complaintOwnerId: "user_test123",
      createdById: "user_test123",
      productInformation: [{ id: "prod_1", ...validComplaintInput.products![0] }],
      patientInformation: [{ id: "pat_1", ...validComplaintInput.patients![0] }],
      attachments: [],
    };
    mockTx.complaint.create.mockResolvedValue(mockCreatedComplaint);

    const mockVigilance = {
      id: "vig_12345",
      orgId: "org_test456",
      complaintId: "cmp_12345",
      status: VigilanceStatus.PENDING,
      reportable: false,
    };
    mockTx.vigilanceDecisionTree.create.mockResolvedValue(mockVigilance);

    const mockInvestigation = {
      id: "inv_12345",
      orgId: "org_test456",
      complaintId: "cmp_12345",
      status: InvestigationStatus.NOT_STARTED,
      investigatorId: null,
    };
    mockTx.investigation.create.mockResolvedValue(mockInvestigation);

    const mockCommunication = {
      id: "comm_12345",
      orgId: "org_test456",
      complaintId: "cmp_12345",
      internalNotes: "Initial customer intake communication logged for Memorial Regional Hospital.",
      authorId: "user_test123",
    };
    mockTx.customerCommunication.create.mockResolvedValue(mockCommunication);

    const mockAuditLog = {
      id: "audit_12345",
      orgId: "org_test456",
      entityType: "Complaint",
      entityId: "cmp_12345",
      action: AuditAction.CREATE,
      changedById: "user_test123",
      complaintId: "cmp_12345",
    };
    mockTx.auditLog.create.mockResolvedValue(mockAuditLog);

    // Act
    const result = await createComplaintWithRelations(validComplaintInput);

    // Assert: Primary Complaint was created in transaction
    expect(mockTx.complaint.create).toHaveBeenCalledTimes(1);
    expect(result.complaint).toBeDefined();
    expect(result.complaint.id).toBe("cmp_12345");
    expect(result.complaint.complaintNumber).toBe(`CMP-${currentYear}-0001`);
    expect(result.complaint.status).toBe("OPEN");

    // Assert: 1. Vigilance Record was created simultaneously with matching complaintId
    expect(mockTx.vigilanceDecisionTree.create).toHaveBeenCalledTimes(1);
    expect(mockTx.vigilanceDecisionTree.create).toHaveBeenCalledWith({
      data: {
        orgId: "org_test456",
        complaintId: "cmp_12345",
        status: VigilanceStatus.PENDING,
        reportable: false,
        rationale: null,
      },
    });
    expect(result.vigilanceDecisionTree).toEqual(mockVigilance);

    // Assert: 2. Investigation Record was created simultaneously with matching complaintId
    expect(mockTx.investigation.create).toHaveBeenCalledTimes(1);
    expect(mockTx.investigation.create).toHaveBeenCalledWith({
      data: {
        orgId: "org_test456",
        complaintId: "cmp_12345",
        status: InvestigationStatus.NOT_STARTED,
        investigatorId: null,
      },
    });
    expect(result.investigation).toEqual(mockInvestigation);

    // Assert: 3. Follow-Up / Customer Communication Record was created simultaneously with matching complaintId
    expect(mockTx.customerCommunication.create).toHaveBeenCalledTimes(1);
    expect(mockTx.customerCommunication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: "org_test456",
          complaintId: "cmp_12345",
          authorId: "user_test123",
        }),
      })
    );
    expect(result.customerCommunication).toEqual(mockCommunication);

    // Assert: Initial Audit Log links to all 3 created sub-records
    expect(mockTx.auditLog.create).toHaveBeenCalledTimes(1);
    expect(mockTx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: "org_test456",
          entityType: "Complaint",
          entityId: "cmp_12345",
          action: AuditAction.CREATE,
          changedById: "user_test123",
          newData: expect.objectContaining({
            vigilanceDecisionTreeId: "vig_12345",
            investigationId: "inv_12345",
            customerCommunicationId: "comm_12345",
          }),
        }),
      })
    );
  });

  it("should fail validation if required fields are missing", async () => {
    // Missing shortDescription
    await expect(
      createComplaintWithRelations({
        ...validComplaintInput,
        shortDescription: "",
      })
    ).rejects.toThrow("shortDescription is required");

    // Missing priority
    await expect(
      createComplaintWithRelations({
        ...validComplaintInput,
        priority: undefined as unknown as Priority,
      })
    ).rejects.toThrow("priority is required");

    // Missing customer details
    await expect(
      createComplaintWithRelations({
        ...validComplaintInput,
        customerName: "",
      })
    ).rejects.toThrow("Customer contact details are required");

    await expect(
      createComplaintWithRelations({
        ...validComplaintInput,
        email: "",
      })
    ).rejects.toThrow("Customer contact details are required");
  });

  it("should allow disabling auto-creation of optional sub-folders via workflow flags", async () => {
    mockTx.complaint.count.mockResolvedValue(1);
    mockTx.complaint.create.mockResolvedValue({
      id: "cmp_99999",
      orgId: "org_test456",
      complaintNumber: "CMP-2026-0002",
      productInformation: [],
      patientInformation: [],
      attachments: [],
    });
    mockTx.vigilanceDecisionTree.create.mockResolvedValue({ id: "vig_999" });
    mockTx.auditLog.create.mockResolvedValue({ id: "audit_999" });

    const result = await createComplaintWithRelations({
      ...validComplaintInput,
      investigationRequired: false,
      customerResponseNeeded: false,
    });

    expect(result.investigation).toBeNull();
    expect(mockTx.investigation.create).not.toHaveBeenCalled();
    expect(result.customerCommunication).toBeNull();
    expect(mockTx.customerCommunication.create).not.toHaveBeenCalled();
    expect(result.vigilanceDecisionTree).toBeDefined();
  });
});
