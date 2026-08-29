import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ComplaintTaskForm } from "@/components/ComplaintTaskForm";

interface ComplaintTaskDetailPageProps {
  params: Promise<{ orgSlug: string; id: string; taskId: string }>;
}

export default async function ComplaintTaskDetailPage({
  params,
}: ComplaintTaskDetailPageProps) {
  const { orgSlug, id, taskId } = await params;
  const { orgId } = await requireOrgAuth();

  const complaint = await prisma.complaint.findUnique({
    where: { id, orgId, deletedAt: null },
    include: {
      tasks: {
        where: { id: taskId },
        include: {
          originator: {
            select: { email: true, firstName: true, lastName: true },
          },
          assignedTo: {
            select: { email: true, firstName: true, lastName: true },
          },
          attachments: true,
        },
      },
    },
  });

  if (!complaint || complaint.tasks.length === 0) {
    notFound();
  }

  const task = complaint.tasks[0];

  return (
    <ComplaintTaskForm
      orgSlug={orgSlug}
      complaintId={complaint.id}
      complaintNumber={complaint.complaintNumber}
      task={{
        ...task,
        dateOfRequest: task.dateOfRequest.toISOString(),
        dateDue: task.dateDue ? task.dateDue.toISOString() : null,
      }}
    />
  );
}
