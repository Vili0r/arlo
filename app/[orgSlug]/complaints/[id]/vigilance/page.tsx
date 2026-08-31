import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { VigilanceEditForm } from "@/components/vigilance-edit-form";

interface VigilancePageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

export default async function VigilancePage({
  params,
}: VigilancePageProps) {
  const { orgSlug, id } = await params;
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
    },
  });

  if (!complaint) {
    notFound();
  }

  // Get the latest vigilance record or create an initial one if none exist
  let vigilance =
    complaint.vigilanceDecisionTrees && complaint.vigilanceDecisionTrees.length > 0
      ? complaint.vigilanceDecisionTrees[complaint.vigilanceDecisionTrees.length - 1]
      : null;

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
      vigilance={{
        ...activeVigilance,
        awarenessDate: activeVigilance.awarenessDate?.toISOString() || null,
        dueDate: activeVigilance.dueDate?.toISOString() || null,
      }}
    />
  );
}
