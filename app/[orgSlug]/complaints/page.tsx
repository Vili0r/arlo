import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ComplaintsView } from "@/components/complaints-view";

interface ComplaintsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function ComplaintsPage({
  params,
}: ComplaintsPageProps) {
  const { orgSlug } = await params;
  const { orgId } = await requireOrgAuth();

  // Query complaints strictly for this tenant
  const complaints = await prisma.complaint.findMany({
    where: {
      orgId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: { email: true, firstName: true, lastName: true },
      },
      assignedInvestigator: {
        select: { email: true, firstName: true, lastName: true },
      },
      approvedBy: {
        select: { email: true, firstName: true, lastName: true },
      },
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Post-Market Surveillance Complaints
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Track, investigate, and resolve medical device product complaints for{" "}
          <span className="font-semibold text-foreground">{orgSlug}</span>.
        </p>
      </div>

      {/* Complaints Action Toolbar & Dynamic Grid/List View */}
      <ComplaintsView orgSlug={orgSlug} complaints={complaints} />
    </div>
  );
}
