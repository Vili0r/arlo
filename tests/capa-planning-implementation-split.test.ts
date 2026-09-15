import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CapaPlanningInputSchema,
  CapaImplementationInputSchema,
  CreateCapaSchema,
} from "@/lib/validations/capa";
import { CapaPhase, CapaType, AuditAction } from "@prisma/client";
import { CAPA_STATUS_CONFIG } from "@/lib/constants/status-transitions";
import { createCapa, updateCapa } from "@/lib/actions/capa";
import { getAuditHistory } from "@/lib/actions/audit";

const ORG_ID = "org_plan_impl_test";
const USER_ID = "user_plan_impl_test";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({
    userId: USER_ID,
    orgId: ORG_ID,
  })),
  clerkClient: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: vi.fn(async () => ({
    orgId: ORG_ID,
    userId: USER_ID,
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { mockTx, mockPrisma } = vi.hoisted(() => {
  const tx = {
    capa: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    capaInitiation: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    capaInvestigation: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    capaPlanning: {
      create: vi.fn(),
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    capaImplementation: {
      create: vi.fn(),
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    capaEffectiveness: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    attachment: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    extensionRequest: {
      createMany: vi.fn(),
    },
    recordLock: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };

  const prisma = {
    $transaction: vi.fn(async (cb: (tx: any) => Promise<any>) => cb(tx)),
    auditLog: {
      findMany: vi.fn(),
    },
  };

  return { mockTx: tx, mockPrisma: prisma };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("CapaPlanning and CapaImplementation Model Split", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation Schemas", () => {
    it("validates CapaPlanningInputSchema with required and optional fields", () => {
      const validPlanning = {
        capaPlanDueDate: "2026-10-15",
        actionPlan: "Design new injection mold tooling to eliminate burrs",
        effectivenessCheckPlan: "Inspect 5 consecutive production batches for zero defects",
        primaryApproverId: "user_qa_lead",
        secondaryApproverId: "user_operations_head",
        attachments: [
          {
            fileName: "tooling_specs.pdf",
            fileUrl: "https://blob.arlo.io/tooling_specs.pdf",
          },
        ],
      };

      const result = CapaPlanningInputSchema.safeParse(validPlanning);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.capaPlanDueDate).toBe("2026-10-15");
        expect(result.data.actionPlan).toContain("Design new injection mold");
        expect(result.data.primaryApproverId).toBe("user_qa_lead");
        expect(result.data.attachments).toHaveLength(1);
      }
    });

    it("validates CapaImplementationInputSchema with all requested fields", () => {
      const validImplementation = {
        dateDue: "2026-11-01",
        actionPlan: "Deploy mold tooling and conduct trial runs",
        effectivenessCheckPlan: "Batch sampling verification plan",
        effectivenessDueDate: "2026-12-01",
        validateComments: "Validation protocol VAL-2026-004 executed with zero failures",
        actionPlanSummary: "Tooling installed and calibrated; operators trained",
        riskEvaluation: "Residual risk is low and within acceptable criteria",
        primaryApproverId: "user_qa_lead",
        secondaryApproverId: "user_ops_lead",
        attachments: [
          {
            fileName: "validation_report.pdf",
            fileUrl: "https://blob.arlo.io/validation_report.pdf",
          },
        ],
      };

      const result = CapaImplementationInputSchema.safeParse(validImplementation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dateDue).toBe("2026-11-01");
        expect(result.data.validateComments).toContain("VAL-2026-004");
        expect(result.data.actionPlanSummary).toContain("Tooling installed");
        expect(result.data.effectivenessDueDate).toBe("2026-12-01");
      }
    });

    it("validates full CreateCapaSchema containing both planning and implementation sections", () => {
      const capaData = {
        shortDescription: "Remediation of sealing defect in lot 45A",
        type: CapaType.CORRECTIVE,
        currentPhase: CapaPhase.INITIATION,
        ownerId: USER_ID,
        initiation: {
          problemStatement: "Lot 45A seal failure during pouch packaging",
        },
        planning: {
          capaPlanDueDate: "2026-10-15",
          actionPlan: "Redesign sealing jaw heating element",
          effectivenessCheckPlan: "Tensile pull test on 100 samples",
          primaryApproverId: "user_1",
          secondaryApproverId: "user_2",
          attachments: [],
        },
        implementation: {
          dateDue: "2026-11-15",
          actionPlan: "Replaced sealing jaw on Line 3",
          effectivenessCheckPlan: "Tensile test criteria",
          effectivenessDueDate: "2026-12-15",
          validateComments: "Completed IQ/OQ/PQ",
          actionPlanSummary: "Installed upgraded heater cartridge",
          primaryApproverId: "user_1",
          secondaryApproverId: "user_2",
          attachments: [],
        },
      };

      const parsed = CreateCapaSchema.safeParse(capaData);
      expect(parsed.success).toBe(true);
    });
  });

  describe("Lifecycle Status Transitions", () => {
    it("includes PLANNING in the CAPA lifecycle between INVESTIGATION and IMPLEMENTATION", () => {
      const steps = CAPA_STATUS_CONFIG.steps;
      const phaseValues = steps.map((s) => s.value);

      expect(phaseValues).toEqual([
        CapaPhase.INITIATION,
        CapaPhase.INVESTIGATION,
        CapaPhase.PLANNING,
        CapaPhase.IMPLEMENTATION,
        CapaPhase.EFFECTIVENESS,
        CapaPhase.CLOSED,
      ]);

      const investigationStep = steps.find((s) => s.value === CapaPhase.INVESTIGATION);
      expect(investigationStep?.allowedNextStatuses).toContain(CapaPhase.PLANNING);

      const planningStep = steps.find((s) => s.value === CapaPhase.PLANNING);
      expect(planningStep?.allowedNextStatuses).toContain(CapaPhase.IMPLEMENTATION);
      expect(planningStep?.allowedPreviousStatuses).toContain(CapaPhase.INVESTIGATION);

      const implementationStep = steps.find((s) => s.value === CapaPhase.IMPLEMENTATION);
      expect(implementationStep?.allowedNextStatuses).toContain(CapaPhase.EFFECTIVENESS);
      expect(implementationStep?.allowedPreviousStatuses).toContain(CapaPhase.PLANNING);
    });
  });

  describe("Server Actions with CapaPlanning and CapaImplementation", () => {
    it("createCapa creates both CapaPlanning and CapaImplementation records", async () => {
      mockTx.capa.count.mockResolvedValue(0);
      mockTx.capa.create.mockResolvedValue({
        id: "capa_split_001",
        capaNumber: "CAPA-2026-0001",
        shortDescription: "Test split",
        type: CapaType.CORRECTIVE,
        currentPhase: CapaPhase.INITIATION,
        ownerId: USER_ID,
      });
      mockTx.capaInitiation.create.mockResolvedValue({ id: "init_001" });
      mockTx.capaInvestigation.create.mockResolvedValue({ id: "inv_001" });
      mockTx.capaPlanning.create.mockResolvedValue({ id: "plan_001" });
      mockTx.capaImplementation.create.mockResolvedValue({ id: "impl_001" });
      mockTx.capaEffectiveness.create.mockResolvedValue({ id: "eff_001" });
      mockTx.auditLog.create.mockResolvedValue({ id: "log_001" });

      const result = await createCapa({
        shortDescription: "Test split implementation",
        type: CapaType.CORRECTIVE,
        currentPhase: CapaPhase.INITIATION,
        ownerId: USER_ID,
        initiation: {
          problemStatement: "Test problem statement",
        },
        planning: {
          capaPlanDueDate: "2026-10-20",
          actionPlan: "Plan actions",
          effectivenessCheckPlan: "Plan effectiveness",
          primaryApproverId: "user_prim",
          secondaryApproverId: "user_sec",
          attachments: [
            {
              fileName: "plan.pdf",
              fileUrl: "https://blob.arlo.io/plan.pdf",
            },
          ],
        },
        implementation: {
          dateDue: "2026-11-20",
          actionPlan: "Implement actions",
          effectivenessCheckPlan: "Check plan",
          effectivenessDueDate: "2026-12-20",
          validateComments: "Validated successfully",
          actionPlanSummary: "Summary of execution",
          primaryApproverId: "user_prim",
          secondaryApproverId: "user_sec",
          attachments: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockTx.capaPlanning.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            capaId: "capa_split_001",
            actionPlan: "Plan actions",
            effectivenessCheckPlan: "Plan effectiveness",
            primaryApproverId: "user_prim",
            secondaryApproverId: "user_sec",
          }),
        })
      );
      expect(mockTx.capaImplementation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            capaId: "capa_split_001",
            validateComments: "Validated successfully",
            actionPlanSummary: "Summary of execution",
            primaryApproverId: "user_prim",
            secondaryApproverId: "user_sec",
          }),
        })
      );
    });

    it("updateCapa upserts CapaPlanning and CapaImplementation and diffs in audit trail", async () => {
      const capaId = "capa_update_001";
      mockTx.recordLock.findUnique.mockResolvedValue(null);
      mockTx.capa.findUnique.mockResolvedValue({
        id: capaId,
        orgId: ORG_ID,
        shortDescription: "Old description",
        type: CapaType.CORRECTIVE,
        currentPhase: CapaPhase.INVESTIGATION,
        ownerId: USER_ID,
        cancellationRequested: false,
        cancellationJustification: null,
        initiation: { problemStatement: "Initial issue" },
        investigation: { investigationSummary: "Under analysis" },
        planning: {
          actionPlan: "Draft plan",
          effectivenessCheckPlan: "Draft criteria",
        },
        implementation: {
          validateComments: null,
          actionPlanSummary: null,
        },
        effectiveness: null,
      });

      mockTx.capa.update.mockResolvedValue({
        id: capaId,
        shortDescription: "Updated description",
        type: CapaType.CORRECTIVE,
        currentPhase: CapaPhase.PLANNING,
        ownerId: USER_ID,
        cancellationRequested: false,
        cancellationJustification: null,
      });

      mockTx.capaInitiation.upsert.mockResolvedValue({});
      mockTx.capaInvestigation.upsert.mockResolvedValue({});
      mockTx.capaPlanning.upsert.mockResolvedValue({});
      mockTx.capaImplementation.upsert.mockResolvedValue({});
      mockTx.auditLog.create.mockResolvedValue({});

      const result = await updateCapa(capaId, {
        shortDescription: "Updated description",
        type: CapaType.CORRECTIVE,
        currentPhase: CapaPhase.PLANNING,
        ownerId: USER_ID,
        cancellationRequested: false,
        initiation: {
          problemStatement: "Initial issue",
        },
        investigation: {
          investigationSummary: "Root cause found",
        },
        planning: {
          capaPlanDueDate: "2026-10-30",
          actionPlan: "Approved action plan",
          effectivenessCheckPlan: "Statistical sampling check",
          primaryApproverId: "user_qa",
          secondaryApproverId: "user_director",
          attachments: [],
        },
        implementation: {
          dateDue: "2026-11-30",
          actionPlan: "Approved action plan execution",
          effectivenessCheckPlan: "Statistical sampling check",
          effectivenessDueDate: "2026-12-30",
          validateComments: "All test lots passed torque limits",
          actionPlanSummary: "Re-machined spindle",
          primaryApproverId: "user_qa",
          secondaryApproverId: "user_director",
          attachments: [],
        },
      });

      expect(result.success).toBe(true);
      expect(mockTx.capaPlanning.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { capaId },
          update: expect.objectContaining({
            actionPlan: "Approved action plan",
            effectivenessCheckPlan: "Statistical sampling check",
          }),
        })
      );
      expect(mockTx.capaImplementation.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { capaId },
          update: expect.objectContaining({
            validateComments: "All test lots passed torque limits",
            actionPlanSummary: "Re-machined spindle",
          }),
        })
      );
      expect(mockTx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: "Capa",
            entityId: capaId,
            action: AuditAction.UPDATE,
          }),
        })
      );
    });

    it("getAuditHistory aggregates CapaPlanning in the entityType in query", async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([
        {
          id: "log_plan_1",
          entityType: "CapaPlanning",
          entityId: "plan_1",
          action: AuditAction.UPDATE,
          capaId: "capa_001",
          timestamp: new Date("2026-09-10T10:00:00Z"),
          changedBy: { firstName: "QA", lastName: "Lead", email: "qa@arlo.io" },
        },
      ]);

      const history = await getAuditHistory("Capa", "capa_001");
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                entityType: expect.objectContaining({
                  in: expect.arrayContaining(["CapaPlanning"]),
                }),
              }),
            ]),
          }),
        })
      );
      expect(history).toHaveLength(1);
      expect(history[0].entityType).toBe("CapaPlanning");
    });
  });
});
