import { requireOrgAuth, PERMISSIONS } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { History, Lock, ShieldCheck, User } from "lucide-react";

interface AuditTrailPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function AuditTrailPage({
  params,
}: AuditTrailPageProps) {
  const { orgSlug } = await params;
  const { orgId } = await requireOrgAuth(PERMISSIONS.SYSTEM_AUDIT_READ);

  const logs = await prisma.auditLog.findMany({
    where: { orgId },
    orderBy: { timestamp: "desc" },
    include: {
      changedBy: {
        select: { email: true, firstName: true, lastName: true },
      },
    },
    take: 100,
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Electronic Audit Trail
            </h1>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
              <Lock className="h-3 w-3" /> 21 CFR Part 11 Compliant
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Immutable, append-only chronological record of all quality operations for{" "}
            <span className="font-semibold text-foreground">{orgSlug}</span>.
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            <History className="mx-auto h-8 w-8 text-muted-foreground/60 mb-3" />
            No audit records found for this organization.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Entity & ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Operator (Clerk User)</th>
                  <th className="py-3 px-4">Reason / Electronic Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 font-mono">
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(log.timestamp).toISOString().replace("T", " ").replace("Z", "")}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono mr-1.5 text-muted-foreground">
                        {log.entityType}
                      </span>
                      <span className="text-xs font-mono text-primary">
                        {log.entityId.slice(0, 12)}...
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                          log.action === "APPROVE_CLOSE"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : log.action === "CREATE"
                            ? "bg-blue-500/10 text-blue-600"
                            : log.action === "SOFT_DELETE"
                            ? "bg-rose-500/10 text-rose-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-muted-foreground">
                      {log.changedBy?.email || log.changedById}
                    </td>
                    <td className="py-3 px-4 font-sans text-muted-foreground italic max-w-xs truncate">
                      {log.reason || "Standard system operation"}
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
