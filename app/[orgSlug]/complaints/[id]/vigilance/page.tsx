import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { VigilanceEditForm } from "@/components/vigilance-edit-form";

interface VigilancePageProps {
  params: Promise<{ orgSlug: string; id: string }>;
  searchParams?: Promise<{ vigilanceId?: string }>;
}

export default async function VigilancePage({
  params,
  searchParams,
}: VigilancePageProps) {
  const { orgSlug, id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const targetVigilanceId = resolvedSearchParams?.vigilanceId;
  const { orgId } = await requireOrgAuth();

  const complaint = await prisma.complaint.findUnique({
    where: { id, orgId, deletedAt: null },
    include: {
      vigilanceDecisionTrees: {
        orderBy: { createdAt: "asc" },
        include: {
          attachments: true,
          owner: { select: { email: true, firstName: true, lastName: true } },
          approver: { select: { email: true, firstName: true, lastName: true } },
        },
      },
      vigilanceQuestionAnswers: {
        orderBy: { questionId: "asc" },
      },
      vigilanceJurisdictionAssessments: {
        orderBy: { jurisdiction: "asc" },
      },
    },
  });

  if (!complaint) {
    notFound();
  }

  // Get specific vigilance record by ID, or the latest, or create an initial one if none exist
  let vigilance = targetVigilanceId
    ? complaint.vigilanceDecisionTrees.find((v) => v.id === targetVigilanceId) || null
    : null;

  if (!vigilance) {
    vigilance =
      complaint.vigilanceDecisionTrees && complaint.vigilanceDecisionTrees.length > 0
        ? complaint.vigilanceDecisionTrees[complaint.vigilanceDecisionTrees.length - 1]
        : null;
  }

  if (!vigilance) {
    vigilance = await prisma.vigilanceDecisionTree.create({
      data: {
        complaintId: complaint.id,
        orgId,
        status: "PENDING",
        assessmentStage: "INITIAL",
      },
      include: {
        attachments: true,
        owner: { select: { email: true, firstName: true, lastName: true } },
        approver: { select: { email: true, firstName: true, lastName: true } },
      },
    });
  }

  const activeVigilance = vigilance;

  return (
    <VigilanceEditForm
      orgSlug={orgSlug}
      complaintNumber={complaint.complaintNumber}
      initialQuestionAnswers={complaint.vigilanceQuestionAnswers.map((a) => ({
        questionId: a.questionId,
        answer: a.answer as any,
        structuredValue: a.structuredValue,
        rationale: a.rationale,
        evidence: Array.isArray(a.evidence) ? (a.evidence as string[]) : [],
        source: a.source as any,
        confidence: a.confidence,
        reviewStatus: a.reviewStatus as any,
        answeredBy: a.answeredById,
        answeredAt: a.answeredAt.toISOString(),
      }))}
      initialJurisdictionAssessments={complaint.vigilanceJurisdictionAssessments.map((ja) => ({
        id: ja.id,
        jurisdiction: ja.jurisdiction,
        regulator: ja.regulator,
        regulatoryFramework: ja.regulatoryFramework,
        rulesetVersion: ja.rulesetVersion,
        status: ja.status,
        reportingCategory: ja.reportingCategory,
        reportingReason: ja.reportingReason,
        deadline: ja.deadline?.toISOString() || null,
        deadlineType: ja.deadlineType,
        deadlineDays: ja.deadlineDays,
        requiredForm: ja.requiredForm,
        submissionMethod: ja.submissionMethod,
        triggeredRules: ja.triggeredRules,
        supportingQuestions: ja.supportingQuestions,
        unresolvedQuestions: ja.unresolvedQuestions,
        reviewerRequired: ja.reviewerRequired,
        approvedById: ja.approvedById,
        approvedAt: ja.approvedAt?.toISOString() || null,
      }))}
      vigilance={{
        ...activeVigilance,
        awarenessDate: activeVigilance.awarenessDate?.toISOString() || null,
        dueDate: activeVigilance.dueDate?.toISOString() || null,
      }}
    />
  );
}
