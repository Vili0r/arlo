import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ComplaintTaskForm } from "@/components/ComplaintTaskForm";

interface NewComplaintTaskPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

export default async function NewComplaintTaskPage({
  params,
}: NewComplaintTaskPageProps) {
  const { orgSlug, id } = await params;
  const { orgId } = await requireOrgAuth();

  const complaint = await prisma.complaint.findUnique({
    where: { id, orgId, deletedAt: null },
    select: {
      id: true,
      complaintNumber: true,
    },
  });

  if (!complaint) {
    notFound();
  }

  return (
    <ComplaintTaskForm
      orgSlug={orgSlug}
      complaintId={complaint.id}
      complaintNumber={complaint.complaintNumber}
    />
  );
}
