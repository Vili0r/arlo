import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { InitialMIREditForm } from "@/components/initial-mir-form";

interface InitialMIRPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}

export default async function InitialMIRPage({
  params,
  searchParams,
}: InitialMIRPageProps) {
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
      (m) => m.reportType === "INITIAL" || m.reportType === "COMBINED"
    ) || complaint?.mirs[0];

  if (!complaint || !mir) {
    notFound();
  }

  // Get users for dropdowns (even if not used heavily yet)
  const users = await prisma.user.findMany({
    where: {
      memberships: {
        some: { orgId },
      },
    },
  });

  return (
    <InitialMIREditForm
      orgSlug={orgSlug}
      complaintNumber={complaint.complaintNumber}
      mir={mir}
      users={users}
      initialTab={initialTab}
    />
  );
}
