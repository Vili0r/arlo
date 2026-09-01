import { describe, it, expect, vi, beforeEach } from "vitest";
import { SampleStatus, AuditAction } from "@prisma/client";

const { mockTx, mockPrisma, mockAuthCtx } = vi.hoisted(() => {
  const authCtx = {
    userId: "user_sample_manager",
    orgId: "org_test456",
  };

  const tx = {
    sampleManagement: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };

  const prismaObj = {
    $transaction: vi.fn((callback) => callback(tx)),
  };

  return { mockTx: tx, mockPrisma: prismaObj, mockAuthCtx: authCtx };
});

// Mock dependencies
vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: vi.fn().mockImplementation(async () => mockAuthCtx),
  PERMISSIONS: {
    COMPLAINTS_CREATE: "org:complaints:create",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { updateSampleManagement } from "@/lib/actions/complaints";

describe("Sample Management - Save & Update Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthCtx.userId = "user_sample_manager";
    mockAuthCtx.orgId = "org_test456";
  });

  const existingSample = {
    id: "sample_rec_101",
    orgId: "org_test456",
    complaintId: "cmp_sample_1",
    sampleAvailable: true,
    trackingDetails: "FedEx 789123456789",
    status: SampleStatus.PENDING,
    receivedDate: null,
    createdAt: new Date("2026-08-01T10:00:00Z"),
    updatedAt: new Date("2026-08-01T10:00:00Z"),
  };

  it("should create a new SampleManagement record when none exists and log AuditAction.CREATE", async () => {
    mockTx.sampleManagement.findUnique.mockResolvedValue(null); // No existing record
    const createdSample = {
      id: "sample_new_1",
      orgId: "org_test456",
      complaintId: "cmp_sample_1",
      sampleAvailable: true,
      trackingDetails: "UPS 1Z9999999999999999",
      status: SampleStatus.PENDING,
      receivedDate: null,
      createdAt: new Date("2026-08-15T12:00:00Z"),
      updatedAt: new Date("2026-08-15T12:00:00Z"),
    };
    mockTx.sampleManagement.upsert.mockResolvedValue(createdSample);
    mockTx.auditLog.create.mockResolvedValue({ id: "audit_create_sample" });

    const result = await updateSampleManagement({
      complaintId: "cmp_sample_1",
      sampleAvailable: true,
      trackingDetails: "UPS 1Z9999999999999999",
      status: SampleStatus.PENDING,
      receivedDate: null,
    });

    expect(result).toEqual(createdSample);
    expect(mockTx.sampleManagement.upsert).toHaveBeenCalledWith({
      where: { complaintId: "cmp_sample_1" },
      create: {
        orgId: "org_test456",
        complaintId: "cmp_sample_1",
        sampleAvailable: true,
        trackingDetails: "UPS 1Z9999999999999999",
        status: SampleStatus.PENDING,
        receivedDate: null,
      },
      update: {
        sampleAvailable: true,
        trackingDetails: "UPS 1Z9999999999999999",
        status: SampleStatus.PENDING,
        receivedDate: null,
      },
    });

    expect(mockTx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: "org_test456",
          entityType: "SampleManagement",
          entityId: "sample_new_1",
          action: AuditAction.CREATE,
          changedById: "user_sample_manager",
          complaintId: "cmp_sample_1",
          reason: "Updated sample management status to PENDING",
        }),
      })
    );
  });

  it("should update existing SampleManagement record (e.g. mark sample received) and log AuditAction.UPDATE with diffs", async () => {
    const receivedDate = new Date("2026-08-18T15:30:00Z");
    const updatedSample = {
      ...existingSample,
      status: SampleStatus.RECEIVED,
      receivedDate,
      trackingDetails: "FedEx 789123456789 - Delivered to Lab Dock B",
      updatedAt: new Date("2026-08-18T15:35:00Z"),
    };

    mockTx.sampleManagement.findUnique.mockResolvedValue(existingSample);
    mockTx.sampleManagement.upsert.mockResolvedValue(updatedSample);
    mockTx.auditLog.create.mockResolvedValue({ id: "audit_update_sample" });

    const result = await updateSampleManagement({
      complaintId: "cmp_sample_1",
      sampleAvailable: true,
      trackingDetails: "FedEx 789123456789 - Delivered to Lab Dock B",
      status: SampleStatus.RECEIVED,
      receivedDate: "2026-08-18T15:30:00Z",
    });

    expect(result.status).toBe(SampleStatus.RECEIVED);
    expect(result.receivedDate).toEqual(receivedDate);

    expect(mockTx.sampleManagement.upsert).toHaveBeenCalledWith({
      where: { complaintId: "cmp_sample_1" },
      create: {
        orgId: "org_test456",
        complaintId: "cmp_sample_1",
        sampleAvailable: true,
        trackingDetails: "FedEx 789123456789 - Delivered to Lab Dock B",
        status: SampleStatus.RECEIVED,
        receivedDate: expect.any(Date),
      },
      update: {
        sampleAvailable: true,
        trackingDetails: "FedEx 789123456789 - Delivered to Lab Dock B",
        status: SampleStatus.RECEIVED,
        receivedDate: expect.any(Date),
      },
    });

    expect(mockTx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: "org_test456",
          entityType: "SampleManagement",
          entityId: "sample_rec_101",
          action: AuditAction.UPDATE,
          changedById: "user_sample_manager",
          complaintId: "cmp_sample_1",
          reason: "Updated sample management status to RECEIVED",
        }),
      })
    );

    const auditCallArgs = mockTx.auditLog.create.mock.calls[0][0].data;
    const fieldChanges = auditCallArgs.fieldChanges as Array<{ field: string; oldValue: any; newValue: any }>;
    expect(fieldChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "status",
          oldValue: "PENDING",
          newValue: "RECEIVED",
        }),
        expect.objectContaining({
          field: "trackingDetails",
          oldValue: "FedEx 789123456789",
          newValue: "FedEx 789123456789 - Delivered to Lab Dock B",
        }),
      ])
    );
  });

  it("should handle marking sample unavailable with null tracking and dates", async () => {
    mockTx.sampleManagement.findUnique.mockResolvedValue(existingSample);
    const unavailableSample = {
      ...existingSample,
      sampleAvailable: false,
      trackingDetails: null,
      status: SampleStatus.DISPOSED,
      receivedDate: null,
    };
    mockTx.sampleManagement.upsert.mockResolvedValue(unavailableSample);
    mockTx.auditLog.create.mockResolvedValue({ id: "audit_destroy_sample" });

    const result = await updateSampleManagement({
      complaintId: "cmp_sample_1",
      sampleAvailable: false,
      trackingDetails: null,
      status: SampleStatus.DISPOSED,
      receivedDate: null,
    });

    expect(result.sampleAvailable).toBe(false);
    expect(result.trackingDetails).toBeNull();
    expect(result.status).toBe(SampleStatus.DISPOSED);
  });
});
