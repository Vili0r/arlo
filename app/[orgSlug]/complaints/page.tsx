import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Severity, ComplaintStatus } from "@prisma/client";

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

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-3 w-3" /> Critical
          </span>
        );
      case "MAJOR":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            Major
          </span>
        );
      case "MINOR":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            Minor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            Cosmetic
          </span>
        );
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" /> Closed
          </span>
        );
      case "UNDER_INVESTIGATION":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            <Clock className="h-3 w-3" /> Investigating
          </span>
        );
      case "PENDING_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400">
            Pending Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            Open
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Post-Market Surveillance Complaints
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track, investigate, and resolve medical device product complaints
            for <span className="font-semibold text-foreground">{orgSlug}</span>.
          </p>
        </div>

        <Link
          href="/complaints/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Log Complaint
        </Link>
      </div>

      {/* Complaints Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {complaints.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/60 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">
              No complaints logged yet
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Get started by logging your first medical device complaint into the
              system.
            </p>
            <div className="mt-4">
              <Link
                href="/complaints/new"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" /> Log First Complaint
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Logged By</th>
                  <th className="py-3 px-4">Date Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {complaints.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                      <Link
                        href={`/complaints/${c.id}`}
                        className="hover:underline"
                      >
                        {c.complaintNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <Link
                        href={`/complaints/${c.id}`}
                        className="font-medium text-foreground hover:underline block truncate"
                      >
                        {c.title}
                      </Link>
                      <span className="text-[11px] text-muted-foreground truncate block">
                        {c.deviceModel ? `Model: ${c.deviceModel}` : ""}{" "}
                        {c.lotNumber ? `(Lot: ${c.lotNumber})` : ""}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getSeverityBadge(c.severity)}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {c.createdBy?.firstName
                        ? `${c.createdBy.firstName} ${c.createdBy.lastName ?? ""}`
                        : c.createdBy?.email || c.createdById}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono">
                      {new Date(c.dateReceived).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
