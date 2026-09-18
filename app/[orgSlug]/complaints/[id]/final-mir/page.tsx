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

  if (!complaint) {
    notFound();
  }

  let mir =
    complaint.mirs.find(
      (m) =>
        m.reportType === "FINAL" || m.reportType === "FINAL_NON_REPORTABLE"
    ) || complaint.mirs[0];

  if (!mir) {
    const count = await prisma.mIR.count({ where: { orgId } });
    const mirNumber = `MIR-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
    mir = await prisma.mIR.create({
      data: {
        orgId,
        complaintId: complaint.id,
        status: "DRAFT",
        reportType: "FINAL",
        mirNumber,
      },
    });
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
