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
  
  // Query up to 100 complaints (10 pages max) strictly for this tenant
  const complaints = await prisma.complaint.findMany({
    where: {
      orgId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      createdBy: {
        select: { email: true, firstName: true, lastName: true },
      },
      complaintOwner: {
        select: { email: true, firstName: true, lastName: true },
      },
      assignedInvestigator: {
        select: { email: true, firstName: true, lastName: true },
      },
      approvedBy: {
        select: { email: true, firstName: true, lastName: true },
      },
      investigation: {
        include: {
          investigator: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      },
      vigilanceDecisionTree: true,
      customerCommunications: {
        orderBy: { communicationDate: "desc" },
        include: {
          author: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      },
      auditLogs: {
        orderBy: { timestamp: "desc" },
        include: {
          changedBy: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      },
      _count: {
        select: {
          customerCommunications: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6 max-w-8xl mx-auto pb-10">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Complaints
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Track and Investigate product complaints for{" "}
          <span className="font-semibold text-foreground">{orgSlug}</span>.
        </p>
      </div>

      {/* Complaints Action Toolbar & Dynamic Grid/List View with pagination */}
      <ComplaintsView orgSlug={orgSlug} complaints={complaints} />
    </div>
  );
}
