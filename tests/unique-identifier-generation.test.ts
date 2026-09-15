import { describe, it, expect, vi, beforeEach } from "vitest";
import { Priority, Death, CapaType, CapaPhase, AuditAction } from "@prisma/client";
import fs from "fs";
import path from "path";

// Hoisted mocks for auth, prisma, and transaction
const { mockAuthCtx, mockTx, mockPrisma } = vi.hoisted(() => {
  const authCtx = {
    userId: "user_test_qa",
    orgId: "org_medical_devices_01",
  };

  const tx = {
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
    productInformation: {
      create: vi.fn(),
    },
    patientInformation: {
      create: vi.fn(),
    },
    capa: {
      count: vi.fn(),
      create: vi.fn(),
    },
    capaInitiation: {
      create: vi.fn(),
    },
    capaInvestigation: {
      create: vi.fn(),
    },
    capaPlanning: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    capaImplementation: {
      create: vi.fn(),
    },
    capaEffectiveness: {
      create: vi.fn(),
    },
    extensionRequest: {
      createMany: vi.fn(),
    },
    attachment: {
      createMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };

  const prismaObj = {
    $transaction: vi.fn((callback: (tx: any) => any) => callback(tx)),
  };

  return {
    mockAuthCtx: authCtx,
    mockTx: tx,
    mockPrisma: prismaObj,
  };
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

import {
  createComplaintWithRelations,
  CreateComplaintWithRelationsInput,
} from "@/lib/actions/complaints";
import { createCapa } from "@/lib/actions/capa";
import { CreateCapaFormValues } from "@/lib/validations/capa";

/**
 * @traceability
 * URS: URS-001 (Complaint Intake & Unique Identification)
 * SRS: SRS-003 (Deterministic Unique Identifier Generation)
 * Design: DESIGN-003 (Numbering Service)
 * Test ID: TEST-002
 */
describe("[TEST-002] Requirement Verification: Unique Complaint Identification Number and Unique CAPA Number", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthCtx.userId = "user_test_qa";
    mockAuthCtx.orgId = "org_medical_devices_01";

    // Default implementations for related entity mocks
    mockTx.complaint.create.mockImplementation(({ data }: any) => ({
      id: "cmp_default_id",
      productInformation: [],
      patientInformation: [],
      attachments: [],
      ...data,
    }));
    mockTx.vigilanceDecisionTree.create.mockResolvedValue({ id: "vig_default" });
    mockTx.investigation.create.mockResolvedValue({ id: "inv_default" });
    mockTx.customerCommunication.create.mockResolvedValue({ id: "comm_default" });

    mockTx.capa.create.mockImplementation(({ data }: any) => ({
      id: "capa_default_id",
      ...data,
    }));
    mockTx.capaInitiation.create.mockResolvedValue({ id: "init_default" });
    mockTx.auditLog.create.mockResolvedValue({ id: "audit_default" });
  });

  const sampleComplaintInput: CreateComplaintWithRelationsInput = {
    shortDescription: "Syringe plunger displacement under infusion pressure",
    description: "During saline infusion, plunger displacement occurred triggering occlusion alert.",
    priority: Priority.HIGH,
    awarenessDate: new Date("2026-09-01T08:00:00Z"),
    dateReceived: new Date("2026-09-01T08:30:00Z"),
    customerName: "St. Jude Memorial Hospital",
    customerType: "HOSPITAL",
    initialReporterName: "Sarah",
    initialReporterSurname: "Connor",
    email: "sarah.connor@stjude-hospital.org",
    address: "742 Evergreen Terrace",
    country: "United States",
    telNumber: "+1-555-0144",
    countryEventOccurred: "United States",
    region: "NORTH_AMERICA",
    death: Death.NO,
  };

  const sampleCapaInput: CreateCapaFormValues = {
    shortDescription: "Plunger stopper mold dimensional variation mitigation",
    type: CapaType.CORRECTIVE,
    currentPhase: CapaPhase.INITIATION,
    ownerId: "user_test_qa",
    cancellationRequested: false,
    initiation: {
      problemStatement: "Tooling wear on cavity 4 causes slight dimension drift in plunger stoppers.",
      containmentAction: "Quarantine lot LOT-2026-99 and inspect dimensional tolerances.",
      repeatCapa: false,
      existingCapa: false,
      capaRequired: true,
      fscaRequired: false,
    },
  };

  // ---------------------------------------------------------------------------
  // 1. Complaint Identification Number Uniqueness & Formatting
  // ---------------------------------------------------------------------------
  describe("1. Complaint Identification Number Generation", () => {
    it("The system shall generate a unique complaint identification number conforming to CMP-YYYY-XXXX format", async () => {
      const currentYear = new Date().getFullYear();
      mockTx.complaint.count.mockResolvedValue(0);

      mockTx.complaint.create.mockImplementation(({ data }: any) => ({
        id: "cmp_id_001",
        productInformation: [],
        patientInformation: [],
        attachments: [],
        ...data,
      }));

      const result = await createComplaintWithRelations(sampleComplaintInput);

      // Verify format: CMP-YYYY-XXXX (e.g. CMP-2026-0001)
      const expectedNumber = `CMP-${currentYear}-0001`;
      expect(result.complaint.complaintNumber).toBe(expectedNumber);
      expect(result.complaint.complaintNumber).toMatch(/^CMP-\d{4}-\d{4}$/);

      // Verify query was scoped to the current calendar year and tenant organization
      expect(mockTx.complaint.count).toHaveBeenCalledWith({
        where: {
          orgId: "org_medical_devices_01",
          createdAt: {
            gte: new Date(currentYear, 0, 1),
            lt: new Date(currentYear + 1, 0, 1),
          },
        },
      });

      // Verify database write received the unique complaint identification number
      expect(mockTx.complaint.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_medical_devices_01",
            complaintNumber: expectedNumber,
          }),
        })
      );
    });

    it("The system shall generate sequentially unique complaint numbers on successive creations", async () => {
      const currentYear = new Date().getFullYear();
      const generatedNumbers: string[] = [];

      // Simulate 5 successive complaints being logged
      for (let count = 0; count < 5; count++) {
        mockTx.complaint.count.mockResolvedValueOnce(count);
        mockTx.complaint.create.mockImplementationOnce(({ data }: any) => ({
          id: `cmp_${count + 1}`,
          productInformation: [],
          patientInformation: [],
          attachments: [],
          ...data,
        }));

        const result = await createComplaintWithRelations(sampleComplaintInput);
        generatedNumbers.push(result.complaint.complaintNumber);
      }

      // Check all 5 generated numbers are unique and sequentially incremented
      expect(generatedNumbers).toEqual([
        `CMP-${currentYear}-0001`,
        `CMP-${currentYear}-0002`,
        `CMP-${currentYear}-0003`,
        `CMP-${currentYear}-0004`,
        `CMP-${currentYear}-0005`,
      ]);

      const uniqueSet = new Set(generatedNumbers);
      expect(uniqueSet.size).toBe(5);
    });

    it("The system shall enforce complaint number uniqueness per tenant and reject duplicates", async () => {
      mockTx.complaint.count.mockResolvedValue(0);
      mockTx.complaint.create.mockRejectedValue(
        new Error("Unique constraint failed on the constraint: Complaint_orgId_complaintNumber_key")
      );

      await expect(createComplaintWithRelations(sampleComplaintInput)).rejects.toThrow(
        /Unique constraint failed/
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 2. CAPA Number Uniqueness & Formatting
  // ---------------------------------------------------------------------------
  describe("2. CAPA Number Generation", () => {
    it("The system shall generate a unique CAPA number conforming to CAPA-YYYY-XXXX format", async () => {
      const currentYear = new Date().getFullYear();
      mockTx.capa.count.mockResolvedValue(0);

      mockTx.capa.create.mockImplementation(({ data }: any) => ({
        id: "capa_id_001",
        ...data,
      }));

      const result = await createCapa(sampleCapaInput);

      // Verify format: CAPA-YYYY-XXXX (e.g. CAPA-2026-0001)
      const expectedNumber = `CAPA-${currentYear}-0001`;
      expect(result.success).toBe(true);
      expect(result.capaNumber).toBe(expectedNumber);
      expect(result.capaNumber).toMatch(/^CAPA-\d{4}-\d{4}$/);

      // Verify query was scoped to the current calendar year and tenant organization
      expect(mockTx.capa.count).toHaveBeenCalledWith({
        where: {
          orgId: "org_medical_devices_01",
          createdAt: {
            gte: new Date(currentYear, 0, 1),
            lt: new Date(currentYear + 1, 0, 1),
          },
        },
      });

      // Verify database write received the unique CAPA number
      expect(mockTx.capa.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org_medical_devices_01",
            capaNumber: expectedNumber,
          }),
        })
      );
    });

    it("The system shall generate sequentially unique CAPA numbers on successive creations", async () => {
      const currentYear = new Date().getFullYear();
      const generatedNumbers: string[] = [];

      // Simulate 5 successive CAPAs being created
      for (let count = 0; count < 5; count++) {
        mockTx.capa.count.mockResolvedValueOnce(count);
        mockTx.capa.create.mockImplementationOnce(({ data }: any) => ({
          id: `capa_${count + 1}`,
          ...data,
        }));

        const result = await createCapa(sampleCapaInput);
        generatedNumbers.push(result.capaNumber);
      }

      // Check all 5 generated numbers are unique and sequentially incremented
      expect(generatedNumbers).toEqual([
        `CAPA-${currentYear}-0001`,
        `CAPA-${currentYear}-0002`,
        `CAPA-${currentYear}-0003`,
        `CAPA-${currentYear}-0004`,
        `CAPA-${currentYear}-0005`,
      ]);

      const uniqueSet = new Set(generatedNumbers);
      expect(uniqueSet.size).toBe(5);
    });

    it("The system shall enforce CAPA number uniqueness per tenant and reject duplicates", async () => {
      mockTx.capa.count.mockResolvedValue(0);
      mockTx.capa.create.mockRejectedValue(
        new Error("Unique constraint failed on the constraint: Capa_orgId_capaNumber_key")
      );

      await expect(createCapa(sampleCapaInput)).rejects.toThrow(/Unique constraint failed/);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Tenant Isolation for Unique Identifiers
  // ---------------------------------------------------------------------------
  describe("3. Multi-Tenant Identifier Isolation", () => {
    it("The system shall isolate complaint and CAPA numbers per tenant organization", async () => {
      const currentYear = new Date().getFullYear();

      // Org A has 3 complaints and 2 CAPAs
      mockAuthCtx.orgId = "org_Alpha";
      mockTx.complaint.count.mockResolvedValue(3);
      mockTx.capa.count.mockResolvedValue(2);
      mockTx.complaint.create.mockImplementation(({ data }: any) => ({
        id: "c1",
        productInformation: [],
        patientInformation: [],
        attachments: [],
        ...data,
      }));
      mockTx.capa.create.mockImplementation(({ data }: any) => ({ id: "cp1", ...data }));

      const complaintOrgA = await createComplaintWithRelations(sampleComplaintInput);
      const capaOrgA = await createCapa(sampleCapaInput);

      expect(complaintOrgA.complaint.complaintNumber).toBe(`CMP-${currentYear}-0004`);
      expect(capaOrgA.capaNumber).toBe(`CAPA-${currentYear}-0003`);

      // Org B is a brand new organization with 0 complaints and 0 CAPAs
      mockAuthCtx.orgId = "org_Beta";
      mockTx.complaint.count.mockResolvedValue(0);
      mockTx.capa.count.mockResolvedValue(0);

      const complaintOrgB = await createComplaintWithRelations(sampleComplaintInput);
      const capaOrgB = await createCapa(sampleCapaInput);

      // Org B starts at 0001, isolated from Org A
      expect(complaintOrgB.complaint.complaintNumber).toBe(`CMP-${currentYear}-0001`);
      expect(capaOrgB.capaNumber).toBe(`CAPA-${currentYear}-0001`);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Combined End-to-End System Requirement Verification
  // ---------------------------------------------------------------------------
  describe("4. Combined Requirement Verification", () => {
    it("The system shall generate a unique complaint identification number and unique capa number", async () => {
      const currentYear = new Date().getFullYear();

      mockTx.complaint.count.mockResolvedValue(42);
      mockTx.capa.count.mockResolvedValue(17);

      mockTx.complaint.create.mockImplementation(({ data }: any) => ({
        id: "cmp_unique_43",
        productInformation: [],
        patientInformation: [],
        attachments: [],
        ...data,
      }));

      mockTx.capa.create.mockImplementation(({ data }: any) => ({
        id: "capa_unique_18",
        ...data,
      }));

      // Act: Generate both complaint and CAPA
      const complaintResult = await createComplaintWithRelations(sampleComplaintInput);
      const capaResult = await createCapa(sampleCapaInput);

      // Assert unique complaint identification number
      expect(complaintResult.complaint.complaintNumber).toBe(`CMP-${currentYear}-0043`);
      expect(complaintResult.complaint.complaintNumber).toMatch(/^CMP-\d{4}-\d{4}$/);

      // Assert unique CAPA number
      expect(capaResult.capaNumber).toBe(`CAPA-${currentYear}-0018`);
      expect(capaResult.capaNumber).toMatch(/^CAPA-\d{4}-\d{4}$/);

      // Assert non-collision between complaint and CAPA identifiers
      expect(complaintResult.complaint.complaintNumber).not.toBe(capaResult.capaNumber);

      // Verify audit trail logged both unique identifiers for 21 CFR Part 11 compliance
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: "Complaint",
            reason: expect.stringContaining(`CMP-${currentYear}-0043`),
          }),
        })
      );

      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: "Capa",
            newData: expect.objectContaining({
              capaNumber: `CAPA-${currentYear}-0018`,
            }),
          }),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Database Schema Level Uniqueness Guarantee
  // ---------------------------------------------------------------------------
  describe("5. Database Schema Uniqueness Guarantees", () => {
    it("The database schema shall define composite unique constraints for complaintNumber and capaNumber per organization", () => {
      const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
      const schemaContent = fs.readFileSync(schemaPath, "utf-8");

      // Verify Complaint model has @@unique([orgId, complaintNumber])
      expect(schemaContent).toMatch(/model Complaint\s*\{[\s\S]*?@@unique\(\[orgId,\s*complaintNumber\]\)/);

      // Verify Capa model has @@unique([orgId, capaNumber])
      expect(schemaContent).toMatch(/model Capa\s*\{[\s\S]*?@@unique\(\[orgId,\s*capaNumber\]\)/);
    });
  });
});
