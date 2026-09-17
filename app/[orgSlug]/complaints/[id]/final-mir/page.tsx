import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { FinalMIREditForm } from "@/components/final-mir-form";

interface FinalMIRPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}

export default async function FinalMIRPage({
  params,
  searchParams,
}: FinalMIRPageProps) {
  const { orgSlug, id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialTab =
    resolvedSearchParams?.tab === "mir" || resolvedSearchParams?.tab === "general"
      ? resolvedSearchParams.tab
      : undefined;
  const { orgId } = await requireOrgAuth();

  const complaint = await prisma.complaint.findUnique({
    where: { id, orgId, deletedAt: null },
    include: {
      mirs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const mir =
    complaint?.mirs.find(
      (m) =>
        m.reportType === "FINAL" || m.reportType === "FINAL_NON_REPORTABLE"
    ) || complaint?.mirs[0];

  if (!complaint || !mir) {
    notFound();
  }

  const users = await prisma.user.findMany({
    where: {
      memberships: {
        some: { orgId },
      },
    },
  });

  return (
    <FinalMIREditForm
      orgSlug={orgSlug}
      complaintNumber={complaint.complaintNumber}
      mir={mir}
      users={users}
      initialTab={initialTab}
    />
  );
}
