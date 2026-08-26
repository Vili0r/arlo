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

  if (!complaint || !complaint.investigation) {
    notFound();
  }

  const investigation = complaint.investigation;

  // Initialize any new active custom section templates for this investigation
  const { initializeCustomSections, getCustomSections } = await import("@/lib/actions/investigation-templates");
  await initializeCustomSections(investigation.id, orgId);
  const customSections = await getCustomSections(investigation.id);

  return (
    <InvestigationEditForm
      orgSlug={orgSlug}
      complaintNumber={complaint.complaintNumber}
      customSections={customSections}
      productInformation={complaint.productInformation || []}
      investigation={{
        ...investigation,
        sampleAnalysisAssignedDate: investigation.sampleAnalysisAssignedDate?.toISOString() || null,
        sampleAnalysisCompleteDate: investigation.sampleAnalysisCompleteDate?.toISOString() || null,
        decontaminatedAt: investigation.decontaminatedAt?.toISOString() || null,
        sampleReceivedDate: investigation.sampleReceivedDate?.toISOString() || null,
        riskReviewCompletedAt: investigation.riskReviewCompletedAt?.toISOString() || null,
        investigationSummaryCompletedAt: investigation.summary?.completedAt?.toISOString() || null,
        investigationSummaryCompletedById: investigation.summary?.completedById || null,
        summaryText: investigation.summary?.summary || null, // renamed from summary to avoid conflict with relation
        report: investigation.summary?.report || null,
        capaRationale: investigation.summary?.capaRationale || null,
        capaRequired: investigation.summary?.capaRequired || false,
        capaRef: investigation.summary?.capaRef || null,
        notes: investigation.summary?.notes || null,
        reportabilityReviewRequired: investigation.summary?.reportabilityReviewRequired || false,
        imdrfCodes: investigation.summary?.imdrfCodes || [],
      }}
    />
  );
}
