import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  FileSpreadsheet,
  ClipboardCheck,
  AlertTriangle,
  History,
  Plus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

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
    <div className="space-y-8 max-w-6xl">
      {/* Header & Quick Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Quality Management Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Post-Market Surveillance and CAPA tracking for{" "}
            <span className="font-semibold text-foreground">{orgSlug}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/complaints/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Log Complaint
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground uppercase font-semibold">
            <span>Total Complaints</span>
            <FileSpreadsheet className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-3 text-3xl font-bold text-foreground">
            {complaintCount}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Active PMS quality records
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 uppercase font-semibold">
            <span>Open & Investigating</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="mt-3 text-3xl font-bold text-foreground">
            {openComplaints}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Requires root-cause analysis
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 uppercase font-semibold">
            <span>Critical Severity</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="mt-3 text-3xl font-bold text-foreground">
            {criticalComplaints}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Potential adverse events / vigilance
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-xs text-primary uppercase font-semibold">
            <span>Active CAPAs</span>
            <ClipboardCheck className="h-4 w-4" />
          </div>
          <p className="mt-3 text-3xl font-bold text-foreground">{capaCount}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Corrective & Preventive actions
          </p>
        </div>
      </div>

      {/* Compliance & Audit Activity Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Audit Trail Log */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Recent Audit Trail Activity</h2>
            </div>
            <Link
              href="/audit-trail"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              View Full Trail <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No audit events logged yet for this organization.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="py-3 flex items-start justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-foreground">
                      {log.entityType}
                    </span>{" "}
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {log.action}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      By {log.changedBy?.email || log.changedById}{" "}
                      {log.reason ? `• "${log.reason}"` : ""}
                    </p>
                  </div>
                  <time className="text-[10px] text-muted-foreground font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Regulatory Status Box */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Compliance Status
          </div>

          <div className="space-y-3 text-xs">
            <div className="rounded-lg border border-border p-3 bg-muted/20">
              <span className="font-semibold text-foreground block">
                FDA 21 CFR Part 11
              </span>
              <span className="text-muted-foreground text-[11px]">
                Audit trail is immutable, automated, and append-only.
              </span>
            </div>

            <div className="rounded-lg border border-border p-3 bg-muted/20">
              <span className="font-semibold text-foreground block">
                ISO 13485:2016
              </span>
              <span className="text-muted-foreground text-[11px]">
                Separation of duties enforced for review and approval.
              </span>
            </div>

            <div className="rounded-lg border border-border p-3 bg-muted/20">
              <span className="font-semibold text-foreground block">
                Tenant Isolation
              </span>
              <span className="text-muted-foreground text-[11px]">
                Database queries strictly isolated to org:{" "}
                <code className="font-mono">{orgId}</code>.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
