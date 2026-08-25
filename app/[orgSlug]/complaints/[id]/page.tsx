import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ComplaintEditForm } from "@/components/complaint-edit-form";

interface ComplaintDetailPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

export default async function ComplaintDetailPage({
  params,
}: ComplaintDetailPageProps) {
  const { orgSlug, id } = await params;
  const { orgId } = await requireOrgAuth();

  const complaint = await prisma.complaint.findUnique({
    where: { id, orgId, deletedAt: null },
    include: {
      createdBy: {
        select: { email: true, firstName: true, lastName: true },
      },
      complaintOwner: {
        select: { email: true, firstName: true, lastName: true },
      },
      productInformation: true,
      patientInformation: true,
      customerCommunications: {
        orderBy: { communicationDate: "desc" },
        include: {
          author: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      },
      sampleManagement: true,
    },
  });

  if (!complaint) {
    notFound();
  }

  return (
    <ComplaintEditForm
      orgSlug={orgSlug}
      complaint={{
        ...complaint,
        awarenessDate: complaint.awarenessDate.toISOString(),
        dateReceived: complaint.dateReceived.toISOString(),
        patientInformation: complaint.patientInformation.map((pt) => ({
          ...pt,
          eventOccurred: pt.eventOccurred ? pt.eventOccurred.toISOString() : null,
        })),
        customerCommunications: complaint.customerCommunications.map((c) => ({
          ...c,
          communicationDate: c.communicationDate.toISOString(),
        })),
        sampleManagement: complaint.sampleManagement
          ? {
              ...complaint.sampleManagement,
              receivedDate: complaint.sampleManagement.receivedDate
                ? complaint.sampleManagement.receivedDate.toISOString()
                : null,
            }
          : null,
      }}
    />
  );
}
