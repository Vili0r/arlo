import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { FinalMIREditForm } from "@/components/final-mir-form";

interface FinalMIRPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

export default async function FinalMIRPage({
  params,
}: FinalMIRPageProps) {
  const { orgSlug, id } = await params;
  const { orgId } = await requireOrgAuth();

  const complaint = await prisma.complaint.findUnique({
    where: { id, orgId, deletedAt: null },
    include: {
      finalMIR: true,
    },
  });

  if (!complaint || !complaint.finalMIR) {
    notFound();
  }

  const users = await prisma.user.findMany({
    where: {
      memberships: {
        some: { orgId }
      }
    }
  });

  return (
    <FinalMIREditForm
      orgSlug={orgSlug}
      complaintNumber={complaint.complaintNumber}
      mir={complaint.finalMIR}
      users={users}
    />
  );
}
