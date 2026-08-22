import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ProjectsView } from "@/components/projects-view";
import { Eye } from "lucide-react";

interface OrgOverviewPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgOverviewPage({
  params,
}: OrgOverviewPageProps) {
  const { orgSlug } = await params;
  const { orgId } = await requireOrgAuth();

  // Parallel database queries strictly filtered by orgId (tenant isolation)
  const [complaintCount, openComplaints, criticalComplaints, capaCount, recentLogs] =
    await Promise.all([
      prisma.complaint.count({
        where: { orgId, deletedAt: null },
      }),
      prisma.complaint.count({
        where: { orgId, status: "OPEN", deletedAt: null },
      }),
      prisma.complaint.count({
        where: { orgId, severity: "CRITICAL", deletedAt: null },
      }),
      prisma.capa.count({
        where: { orgId, deletedAt: null },
      }),
      prisma.auditLog.findMany({
        where: { orgId },
        orderBy: { timestamp: "desc" },
        take: 5,
        include: {
          changedBy: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      }),
    ]);

  return (
    <ProjectsView
      orgSlug={orgSlug}
      complaintCount={complaintCount}
      openComplaints={openComplaints}
      capaCount={capaCount}
      auditLogCount={recentLogs.length}
      sideContent={
        <>
          {/* Alerts Card */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-foreground tracking-tight">Alerts</h3>
            <div className="rounded-xl border border-border bg-card p-6 text-center text-xs space-y-4 shadow-xs">
              <h4 className="font-semibold text-foreground">Get alerted for anomalies</h4>
              <p className="text-muted-foreground text-[11px] leading-relaxed max-w-xs mx-auto">
                Automatically monitor your projects for anomalies and get notified.
              </p>
              <button className="rounded-md bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold hover:bg-primary/90 transition-colors">
                Enable Observability Plus
              </button>
            </div>
          </div>

          {/* Recent Previews Card */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-foreground tracking-tight">Recent Previews</h3>
            <div className="rounded-xl border border-border bg-card p-8 text-center text-xs space-y-3 shadow-xs">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                <Eye className="h-5 w-5" />
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed max-w-xs mx-auto">
                Preview deployments that you have recently visited or created will appear here.
              </p>
            </div>
          </div>
        </>
      }
    />
  );
}
