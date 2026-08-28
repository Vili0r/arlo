import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CommunicationDetail } from "@/components/CommunicationDetail";

interface CommunicationPageProps {
  params: Promise<{ orgSlug: string; id: string; communicationId: string }>;
}

export default async function CommunicationPage({
  params,
}: CommunicationPageProps) {
  const { orgSlug, id, communicationId } = await params;
  const { orgId } = await requireOrgAuth();

  const complaint = await prisma.complaint.findUnique({
    where: { id, orgId, deletedAt: null },
    include: {
      customerCommunications: {
        where: { id: communicationId },
        include: {
          author: {
            select: { email: true, firstName: true, lastName: true },
          },
          attachments: true,
        },
      },
    },
  });

  if (!complaint || complaint.customerCommunications.length === 0) {
    notFound();
  }

  const communication = complaint.customerCommunications[0];

  return (
    <CommunicationDetail
      orgSlug={orgSlug}
      complaintNumber={complaint.complaintNumber}
      communication={{
        ...communication,
        communicationDate: communication.communicationDate.toISOString(),
      }}
    />
  );
}
