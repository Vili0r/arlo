import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getAssessments, POST as postAssessments } from "@/app/api/complaints/[id]/vigilance/assessments/route";
import { GET as getRulesets } from "@/app/api/complaints/[id]/vigilance/rulesets/route";

const { mockRequireOrgAuth, mockPrisma, mockRunGlobalAssessment, mockGetAllRulesets } = vi.hoisted(() => ({
  mockRequireOrgAuth: vi.fn(),
  mockPrisma: {
    vigilanceJurisdictionAssessment: {
      findMany: vi.fn(),
    },
    vigilanceQuestionAnswer: {
      findMany: vi.fn(),
    },
  },
  mockRunGlobalAssessment: vi.fn(),
  mockGetAllRulesets: vi.fn(),
}));

vi.mock("@/lib/auth-guard", () => ({
  requireOrgAuth: () => mockRequireOrgAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/actions/vigilance-engine", () => ({
  runGlobalAssessment: (...args: any[]) => mockRunGlobalAssessment(...args),
}));

vi.mock("@/lib/vigilance/rules", () => ({
  getAllRulesets: () => mockGetAllRulesets(),
}));

describe("Vigilance API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/complaints/[id]/vigilance/assessments", () => {
    it("should return assessments and answers for complaint", async () => {
      mockRequireOrgAuth.mockResolvedValue({ userId: "u1", orgId: "org_alpha" });
      mockPrisma.vigilanceJurisdictionAssessment.findMany.mockResolvedValue([
        { id: "vja_1", jurisdiction: "US_FDA", reportabilityDecision: "REPORTABLE" },
      ]);
      mockPrisma.vigilanceQuestionAnswer.findMany.mockResolvedValue([
        { id: "vqa_1", questionId: "death_or_serious_injury", answer: true },
      ]);

      const req = new NextRequest("http://localhost:3000/api/complaints/cmp_123/vigilance/assessments");
      const res = await getAssessments(req, {
        params: Promise.resolve({ id: "cmp_123" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.complaintId).toBe("cmp_123");
      expect(data.assessments).toHaveLength(1);
      expect(data.answers).toHaveLength(1);
    });

    it("should handle unauthorized or server errors with 500", async () => {
      mockRequireOrgAuth.mockRejectedValue(new Error("Unauthorized: Org membership missing"));
      const req = new NextRequest("http://localhost:3000/api/complaints/cmp_123/vigilance/assessments");
      const res = await getAssessments(req, {
        params: Promise.resolve({ id: "cmp_123" }),
      });

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toContain("Unauthorized");
    });
  });

  describe("POST /api/complaints/[id]/vigilance/assessments", () => {
    it("should execute global assessment engine and return results", async () => {
      mockRunGlobalAssessment.mockResolvedValue({
        savedAssessments: [
          { id: "ass_1", jurisdiction: "EU_MDR", reportabilityDecision: "REPORTABLE" },
        ],
        evaluationResult: {
          evaluatedAt: "2026-09-18T12:00:00Z",
          totalJurisdictions: 1,
        },
      });

      const req = new NextRequest("http://localhost:3000/api/complaints/cmp_123/vigilance/assessments", {
        method: "POST",
        body: JSON.stringify({
          orgSlug: "acme-med",
          jurisdictions: ["EU_MDR"],
          reason: "Quality engineer triggered evaluation",
        }),
      });

      const res = await postAssessments(req, {
        params: Promise.resolve({ id: "cmp_123" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.complaintId).toBe("cmp_123");
      expect(data.assessments).toHaveLength(1);
      expect(mockRunGlobalAssessment).toHaveBeenCalledWith({
        complaintId: "cmp_123",
        orgSlug: "acme-med",
        jurisdictions: ["EU_MDR"],
        reason: "Quality engineer triggered evaluation",
      });
    });
  });

  describe("GET /api/complaints/[id]/vigilance/rulesets", () => {
    it("should return all configured country rulesets", async () => {
      mockRequireOrgAuth.mockResolvedValue({ userId: "u1", orgId: "org_alpha" });
      mockGetAllRulesets.mockReturnValue([
        { jurisdiction: "EU_MDR", title: "EU Medical Device Regulation" },
        { jurisdiction: "US_FDA", title: "US FDA 21 CFR 803" },
      ]);

      const req = new NextRequest("http://localhost:3000/api/complaints/cmp_123/vigilance/rulesets");
      const res = await getRulesets(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.count).toBe(2);
      expect(data.rulesets).toHaveLength(2);
    });
  });
});
