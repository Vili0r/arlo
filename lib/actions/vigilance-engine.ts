"use server";

import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AuditAction, Prisma, LockEntityType } from "@prisma/client";
import { assertRecordNotLocked } from "@/lib/actions/record-lock";
import { revalidatePath } from "next/cache";
import { generateAuditDiff } from "@/utils/auditDiff";
import {
  CanonicalAnswerValue,
  StoredQuestionAnswer,
  FactSource,
  FactReviewStatus,
} from "@/lib/vigilance/question-bank";
import {
  JurisdictionCode,
  JurisdictionAssessment,
  ReportabilityStatus,
} from "@/lib/vigilance/types";
import { evaluateAllJurisdictions } from "@/lib/vigilance/engine";

export interface SaveQuestionAnswerInput {
  complaintId: string;
  vigilanceId?: string;
  orgSlug: string;
  questionId: string;
  answer: CanonicalAnswerValue;
  structuredValue?: string | null;
  rationale?: string | null;
  evidence?: string[];
  source?: FactSource;
  confidence?: number | null;
  reviewStatus?: FactReviewStatus;
  reason?: string;
}

export interface BatchSaveQuestionAnswersInput {
  complaintId: string;
  vigilanceId?: string;
  orgSlug: string;
  answers: Array<{
    questionId: string;
    answer: CanonicalAnswerValue;
    structuredValue?: string | null;
    rationale?: string | null;
    evidence?: string[];
    source?: FactSource;
    confidence?: number | null;
    reviewStatus?: FactReviewStatus;
  }>;
  reason?: string;
}

export interface RunGlobalAssessmentInput {
  complaintId: string;
  vigilanceId?: string;
  orgSlug: string;
  jurisdictions?: JurisdictionCode[];
  reason?: string;
}

export interface ApproveJurisdictionAssessmentInput {
  assessmentId: string;
  complaintId: string;
  orgSlug: string;
  reason?: string;
}

/**
 * Saves or updates a single canonical factual answer with full 21 CFR Part 11 audit trail
 */
export async function saveQuestionAnswer(input: SaveQuestionAnswerInput) {
  const { orgId, userId } = await requireOrgAuth();

  const result = await prisma.$transaction(async (tx) => {
    // Check complaint access
    const complaint = await tx.complaint.findUnique({
      where: { id: input.complaintId, orgId, deletedAt: null },
    });
    if (!complaint) {
      throw new Error("Complaint not found or access denied.");
    }

    if (input.vigilanceId) {
      await assertRecordNotLocked(
        tx,
        orgId,
        LockEntityType.Vigilance,
        input.vigilanceId,
        userId
      );
    }

    const existing = await tx.vigilanceQuestionAnswer.findUnique({
      where: {
        orgId_complaintId_questionId: {
          orgId,
          complaintId: input.complaintId,
          questionId: input.questionId,
        },
      },
    });

    const saved = await tx.vigilanceQuestionAnswer.upsert({
      where: {
        orgId_complaintId_questionId: {
          orgId,
          complaintId: input.complaintId,
          questionId: input.questionId,
        },
      },
      update: {
        answer: input.answer as any,
        structuredValue: input.structuredValue ?? null,
        rationale: input.rationale ?? null,
        evidence: input.evidence ?? [],
        source: (input.source as any) ?? "USER",
        confidence: input.confidence ?? null,
        reviewStatus: (input.reviewStatus as any) ?? "APPROVED",
        answeredById: userId,
        answeredAt: new Date(),
        vigilanceId: input.vigilanceId ?? existing?.vigilanceId ?? null,
      },
      create: {
        orgId,
        complaintId: input.complaintId,
        vigilanceId: input.vigilanceId ?? null,
        questionId: input.questionId,
        answer: input.answer as any,
        structuredValue: input.structuredValue ?? null,
        rationale: input.rationale ?? null,
        evidence: input.evidence ?? [],
        source: (input.source as any) ?? "USER",
        confidence: input.confidence ?? null,
        reviewStatus: (input.reviewStatus as any) ?? "APPROVED",
        answeredById: userId,
        answeredAt: new Date(),
      },
    });

    const fieldChanges = generateAuditDiff(
      existing as unknown as Record<string, unknown>,
      saved as unknown as Record<string, unknown>
    );

    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "VigilanceQuestionAnswer",
        entityId: saved.id,
        action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
        changedById: userId,
        previousData: existing as unknown as Prisma.InputJsonValue,
        newData: saved as unknown as Prisma.InputJsonValue,
        reason:
          input.reason ||
          `Recorded answer for ${input.questionId}: ${input.answer}`,
        fieldChanges: fieldChanges as unknown as Prisma.InputJsonValue,
        complaintId: input.complaintId,
      },
    });

    return saved;
  });

  revalidatePath(`/${input.orgSlug}/complaints/${input.complaintId}/vigilance`);
  return result;
}

/**
 * Saves batch of answers and triggers multi-jurisdiction assessment
 */
export async function batchSaveQuestionAnswers(input: BatchSaveQuestionAnswersInput) {
  const { orgId, userId } = await requireOrgAuth();

  const result = await prisma.$transaction(async (tx) => {
    const complaint = await tx.complaint.findUnique({
      where: { id: input.complaintId, orgId, deletedAt: null },
    });
    if (!complaint) {
      throw new Error("Complaint not found or access denied.");
    }

    if (input.vigilanceId) {
      await assertRecordNotLocked(
        tx,
        orgId,
        LockEntityType.Vigilance,
        input.vigilanceId,
        userId
      );
    }

    const savedAnswers = [];
    for (const item of input.answers) {
      const existing = await tx.vigilanceQuestionAnswer.findUnique({
        where: {
          orgId_complaintId_questionId: {
            orgId,
            complaintId: input.complaintId,
            questionId: item.questionId,
          },
        },
      });

      const saved = await tx.vigilanceQuestionAnswer.upsert({
        where: {
          orgId_complaintId_questionId: {
            orgId,
            complaintId: input.complaintId,
            questionId: item.questionId,
          },
        },
        update: {
          answer: item.answer as any,
          structuredValue: item.structuredValue ?? null,
          rationale: item.rationale ?? null,
          evidence: item.evidence ?? [],
          source: (item.source as any) ?? "USER",
          confidence: item.confidence ?? null,
          reviewStatus: (item.reviewStatus as any) ?? "APPROVED",
          answeredById: userId,
          answeredAt: new Date(),
          vigilanceId: input.vigilanceId ?? existing?.vigilanceId ?? null,
        },
        create: {
          orgId,
          complaintId: input.complaintId,
          vigilanceId: input.vigilanceId ?? null,
          questionId: item.questionId,
          answer: item.answer as any,
          structuredValue: item.structuredValue ?? null,
          rationale: item.rationale ?? null,
          evidence: item.evidence ?? [],
          source: (item.source as any) ?? "USER",
          confidence: item.confidence ?? null,
          reviewStatus: (item.reviewStatus as any) ?? "APPROVED",
          answeredById: userId,
          answeredAt: new Date(),
        },
      });

      savedAnswers.push(saved);
    }

    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "VigilanceQuestionAnswer",
        entityId: input.complaintId,
        action: AuditAction.UPDATE,
        changedById: userId,
        newData: savedAnswers as unknown as Prisma.InputJsonValue,
        reason:
          input.reason ||
          `Batch updated ${input.answers.length} vigilance factual answers`,
        complaintId: input.complaintId,
      },
    });

    return savedAnswers;
  });

  revalidatePath(`/${input.orgSlug}/complaints/${input.complaintId}/vigilance`);
  return result;
}

/**
 * Runs multi-jurisdiction assessment evaluation against all saved answers for a complaint
 */
export async function runGlobalAssessment(input: RunGlobalAssessmentInput) {
  const { orgId, userId } = await requireOrgAuth();

  const result = await prisma.$transaction(async (tx) => {
    const complaint = await tx.complaint.findUnique({
      where: { id: input.complaintId, orgId, deletedAt: null },
      include: {
        vigilanceDecisionTrees: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    if (!complaint) {
      throw new Error("Complaint not found or access denied.");
    }

    const vigilance =
      input.vigilanceId ||
      complaint.vigilanceDecisionTrees[0]?.id;

    if (vigilance) {
      await assertRecordNotLocked(
        tx,
        orgId,
        LockEntityType.Vigilance,
        vigilance,
        userId
      );
    }

    // Fetch all current answers for this complaint
    const dbAnswers = await tx.vigilanceQuestionAnswer.findMany({
      where: { orgId, complaintId: input.complaintId },
    });

    const canonicalAnswers: StoredQuestionAnswer[] = dbAnswers.map((a) => ({
      questionId: a.questionId,
      answer: a.answer as CanonicalAnswerValue,
      structuredValue: a.structuredValue,
      rationale: a.rationale,
      evidence: Array.isArray(a.evidence) ? (a.evidence as string[]) : [],
      source: a.source as FactSource,
      confidence: a.confidence,
      reviewStatus: a.reviewStatus as FactReviewStatus,
      answeredBy: a.answeredById,
      answeredAt: a.answeredAt.toISOString(),
    }));

    const targetJurisdictions = input.jurisdictions || [
      "EU",
      "US_FDA",
      "CA_HEALTH_CANADA",
      "AU_TGA",
      "CN_NMPA",
      "JP_PMDA",
    ];

    const evaluationResult = evaluateAllJurisdictions(
      canonicalAnswers,
      targetJurisdictions,
      {
        incidentId: input.complaintId,
        awarenessDate: complaint.awarenessDate,
      }
    );

    const savedAssessments = [];

    for (const [jCode, assessment] of Object.entries(
      evaluationResult.jurisdictionAssessments
    )) {
      const existing = await tx.vigilanceJurisdictionAssessment.findUnique({
        where: {
          orgId_complaintId_jurisdiction: {
            orgId,
            complaintId: input.complaintId,
            jurisdiction: jCode,
          },
        },
      });

      const saved = await tx.vigilanceJurisdictionAssessment.upsert({
        where: {
          orgId_complaintId_jurisdiction: {
            orgId,
            complaintId: input.complaintId,
            jurisdiction: jCode,
          },
        },
        update: {
          regulator: assessment.regulator,
          regulatoryFramework: assessment.regulatoryFramework,
          rulesetVersion: assessment.rulesetVersion,
          status: assessment.status as any,
          reportingCategory: assessment.reportingCategory,
          reportingReason: assessment.reportingReason,
          awarenessDate: assessment.awarenessDate
            ? new Date(assessment.awarenessDate)
            : null,
          deadline: assessment.deadline ? new Date(assessment.deadline) : null,
          deadlineType: assessment.deadlineType,
          deadlineDays: assessment.deadlineDays,
          requiredForm: assessment.requiredForm,
          submissionMethod: assessment.submissionMethod,
          triggeredRules: assessment.triggeredRules,
          supportingQuestions: assessment.supportingQuestions,
          unresolvedQuestions: assessment.unresolvedQuestions,
          reviewerRequired: assessment.reviewerRequired,
          assessedAt: new Date(assessment.assessedAt),
          vigilanceId: vigilance ?? existing?.vigilanceId ?? null,
        },
        create: {
          orgId,
          complaintId: input.complaintId,
          vigilanceId: vigilance ?? null,
          jurisdiction: jCode,
          regulator: assessment.regulator,
          regulatoryFramework: assessment.regulatoryFramework,
          rulesetVersion: assessment.rulesetVersion,
          status: assessment.status as any,
          reportingCategory: assessment.reportingCategory,
          reportingReason: assessment.reportingReason,
          awarenessDate: assessment.awarenessDate
            ? new Date(assessment.awarenessDate)
            : null,
          deadline: assessment.deadline ? new Date(assessment.deadline) : null,
          deadlineType: assessment.deadlineType,
          deadlineDays: assessment.deadlineDays,
          requiredForm: assessment.requiredForm,
          submissionMethod: assessment.submissionMethod,
          triggeredRules: assessment.triggeredRules,
          supportingQuestions: assessment.supportingQuestions,
          unresolvedQuestions: assessment.unresolvedQuestions,
          reviewerRequired: assessment.reviewerRequired,
          assessedAt: new Date(assessment.assessedAt),
        },
      });

      savedAssessments.push(saved);
    }

    // Synchronize the EU assessment with the existing VigilanceDecisionTree for seamless backward compatibility
    const euAssessment = evaluationResult.jurisdictionAssessments["EU"];
    if (vigilance && euAssessment) {
      const isReportable = euAssessment.status === "REPORTABLE";
      let legacyDecision: any = "NON_REPORTABLE";
      if (isReportable) {
        if (euAssessment.deadlineDays === 2) {
          legacyDecision = "REPORTABLE_5_DAY"; // closest expedited serious threat mapping
        } else if (euAssessment.deadlineDays === 10 || euAssessment.deadlineDays === 15) {
          legacyDecision = "REPORTABLE_15_DAY";
        } else {
          legacyDecision = "REPORTABLE_30_DAY";
        }
      }

      await tx.vigilanceDecisionTree.update({
        where: { id: vigilance },
        data: {
          reportable: isReportable,
          decision: legacyDecision,
          dueDate: euAssessment.deadline ? new Date(euAssessment.deadline) : undefined,
          targetRegion: "EU MDR (2017/745 EUDAMED)",
          rationale: euAssessment.reportingReason,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "VigilanceJurisdictionAssessment",
        entityId: input.complaintId,
        action: AuditAction.UPDATE,
        changedById: userId,
        newData: savedAssessments as unknown as Prisma.InputJsonValue,
        reason:
          input.reason ||
          `Evaluated global vigilance reportability for jurisdictions: ${targetJurisdictions.join(", ")}`,
        complaintId: input.complaintId,
      },
    });

    return {
      evaluationResult,
      savedAssessments,
    };
  });

  revalidatePath(`/${input.orgSlug}/complaints/${input.complaintId}/vigilance`);
  return result;
}

/**
 * Approves a specific jurisdiction assessment (Regulatory sign-off)
 */
export async function approveJurisdictionAssessment(
  input: ApproveJurisdictionAssessmentInput
) {
  const { orgId, userId } = await requireOrgAuth();

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.vigilanceJurisdictionAssessment.findUnique({
      where: { id: input.assessmentId, orgId },
    });
    if (!existing) {
      throw new Error("Assessment not found or access denied.");
    }

    const updated = await tx.vigilanceJurisdictionAssessment.update({
      where: { id: input.assessmentId, orgId },
      data: {
        approvedById: userId,
        approvedAt: new Date(),
        reviewerRequired: false,
      },
    });

    await tx.auditLog.create({
      data: {
        orgId,
        entityType: "VigilanceJurisdictionAssessment",
        entityId: input.assessmentId,
        action: AuditAction.APPROVE_CLOSE,
        changedById: userId,
        previousData: existing as unknown as Prisma.InputJsonValue,
        newData: updated as unknown as Prisma.InputJsonValue,
        reason:
          input.reason ||
          `Regulatory approval of ${existing.jurisdiction} vigilance determination (${existing.status})`,
        complaintId: input.complaintId,
      },
    });

    return updated;
  });

  revalidatePath(`/${input.orgSlug}/complaints/${input.complaintId}/vigilance`);
  return result;
}
