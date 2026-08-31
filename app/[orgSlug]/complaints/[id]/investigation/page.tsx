import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { InvestigationEditForm } from "@/components/investigation-edit-form";

interface InvestigationPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

export default async function InvestigationPage({
  params,
}: InvestigationPageProps) {
  const { orgSlug, id } = await params;
  const { orgId } = await requireOrgAuth();

  const complaint = await prisma.complaint.findUnique({
    where: { id, orgId, deletedAt: null },
    include: {
      investigation: {
        include: {
          investigator: {
            select: { email: true, firstName: true, lastName: true },
          },
          riskReviewCompletedBy: {
            select: { email: true, firstName: true, lastName: true },
          },
          summary: {
            include: {
              completedBy: {
                select: { email: true, firstName: true, lastName: true },
              },
              imdrfCodes: true,
            }
          },
          attachments: true,
        }
      },
      productInformation: true,
    }
  });

  if (!complaint) {
    notFound();
  }

  let investigation = complaint.investigation;

  if (!investigation) {
    investigation = await prisma.investigation.create({
      data: {
        complaintId: complaint.id,
        orgId,
        status: "NOT_STARTED",
      },
      include: {
        investigator: {
          select: { email: true, firstName: true, lastName: true },
        },
        riskReviewCompletedBy: {
          select: { email: true, firstName: true, lastName: true },
        },
        summary: {
          include: {
            completedBy: {
              select: { email: true, firstName: true, lastName: true },
            },
            imdrfCodes: true,
          },
        },
        attachments: true,
      },
    });
  }

  const activeInvestigation = investigation;

  // Initialize any new active custom section templates for this investigation
  const { initializeCustomSections, getCustomSections } = await import("@/lib/actions/investigation-templates");
  await initializeCustomSections(activeInvestigation.id, orgId);
  const customSections = await getCustomSections(activeInvestigation.id);

  return (
    <InvestigationEditForm
      orgSlug={orgSlug}
      complaintNumber={complaint.complaintNumber}
      customSections={customSections.map(cs => ({
        ...cs,
        assignedDate: cs.assignedDate?.toISOString() || null,
        completedAt: cs.completedAt?.toISOString() || null,
        createdAt: cs.createdAt?.toISOString() || null,
        updatedAt: cs.updatedAt?.toISOString() || null,
        template: cs.template ? {
          ...cs.template,
          createdAt: cs.template.createdAt?.toISOString() || null,
          updatedAt: cs.template.updatedAt?.toISOString() || null,
        } : null,
      }))}
      productInformation={complaint.productInformation || []}
      investigation={{
        ...activeInvestigation,
        sampleAnalysisAssignedDate: activeInvestigation.sampleAnalysisAssignedDate?.toISOString() || null,
        sampleAnalysisCompleteDate: activeInvestigation.sampleAnalysisCompleteDate?.toISOString() || null,
        decontaminatedAt: activeInvestigation.decontaminatedAt?.toISOString() || null,
        sampleReceivedDate: activeInvestigation.sampleReceivedDate?.toISOString() || null,
        riskReviewCompletedAt: activeInvestigation.riskReviewCompletedAt?.toISOString() || null,
        investigationSummaryCompletedAt: activeInvestigation.summary?.completedAt?.toISOString() || null,
        investigationSummaryCompletedById: activeInvestigation.summary?.completedById || null,
        summaryText: activeInvestigation.summary?.summary || null, // renamed from summary to avoid conflict with relation
        report: activeInvestigation.summary?.report || null,
        capaFscaRationale: activeInvestigation.summary?.capaFscaRationale || null,
        capaRequired: activeInvestigation.summary?.capaRequired || false,
        capaRef: activeInvestigation.summary?.capaRef || null,
        fscaRequired: activeInvestigation.summary?.fscaRequired || false,
        fscaRef: activeInvestigation.summary?.fscaRef || null,
        notes: activeInvestigation.summary?.notes || null,
        reportabilityReviewRequired: activeInvestigation.summary?.reportabilityReviewRequired || false,
        imdrfCodes: activeInvestigation.summary?.imdrfCodes || [],
      }}
    />
  );
}
