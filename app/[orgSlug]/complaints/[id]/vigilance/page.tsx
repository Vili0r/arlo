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
      vigilanceDecisionTree: {
        include: {
          attachments: true
        }
      },
    }
  });

  if (!complaint) {
    notFound();
  }

  let vigilance = complaint.vigilanceDecisionTree;

  if (!vigilance) {
    vigilance = await prisma.vigilanceDecisionTree.create({
      data: {
        complaintId: complaint.id,
        orgId,
        status: "PENDING",
      },
      include: {
        attachments: true,
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
