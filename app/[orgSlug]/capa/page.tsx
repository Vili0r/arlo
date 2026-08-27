import { requireOrgAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClipboardCheck, Plus, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { CapaStatus } from "@prisma/client";

interface CapaPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function CapaPage({ params }: CapaPageProps) {
  const { orgSlug } = await params;
  const { orgId } = await requireOrgAuth();

  const capas = await prisma.capa.findMany({
    where: { orgId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { email: true } },
      assignedOwner: { select: { email: true } },
      approvedBy: { select: { email: true } },
      complaint: { select: { complaintNumber: true, shortDescription: true } },
    },
  });

  const getCapaStatusBadge = (status: CapaStatus) => {
    switch (status) {
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Closed
          </span>
        );
      case "IMPLEMENTATION":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            <Clock className="h-3 w-3" /> In Implementation
          </span>
        );
      case "ACTION_PLANNING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            Action Planning
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Corrective & Preventive Actions (CAPA)
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Systematic CAPA management under ISO 13485:2016 for{" "}
            <span className="font-semibold text-foreground">{orgSlug}</span>.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {capas.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck className="mx-auto h-8 w-8 text-muted-foreground/60 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">
              No CAPAs currently initiated
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              CAPAs can be triggered from critical complaint investigations or
              internal quality audits.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">CAPA Number</th>
                  <th className="py-3 px-4">Title & Problem Statement</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Source Complaint</th>
                  <th className="py-3 px-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {capas.map((capa) => (
                  <tr key={capa.id} className="hover:bg-muted/30">
                    <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                      {capa.capaNumber}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-medium text-foreground block truncate">
                        {capa.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground block truncate">
                        {capa.problemStatement}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono">
                        {capa.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getCapaStatusBadge(capa.status)}</td>
                    <td className="py-3.5 px-4 font-mono text-muted-foreground">
                      {capa.complaint?.complaintNumber || "Direct Quality Trigger"}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono" suppressHydrationWarning>
                      {new Date(capa.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
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
