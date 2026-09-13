import { requireOrgAuth, PERMISSIONS } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { History } from "lucide-react";
import { formatUserName, formatRoleName } from "@/lib/utils";

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
      complaint: {
        select: { complaintNumber: true },
      },
      capa: {
        select: { capaNumber: true },
      },
    },
    take: 100,
  });

  const formatRecordName = (log: any): string => {
    const num =
      log.complaint?.complaintNumber ||
      log.capa?.capaNumber ||
      (log.newData as any)?.complaintNumber ||
      (log.newData as any)?.complaint?.complaintNumber ||
      (log.newData as any)?.capaNumber;
    const numSuffix = num ? ` ${num}` : "";

    switch (log.entityType) {
      case "Complaint":
        return `Complaint${numSuffix}`;
      case "Capa":
        return `CAPA${numSuffix}`;
      case "Investigation":
        return num ? `Investigation (${num})` : "Investigation";
      case "InvestigationSummary":
        return num ? `Investigation Summary (${num})` : "Investigation Summary";
      case "VigilanceDecisionTree":
      case "Vigilance":
        return num ? `Vigilance (${num})` : "Vigilance";
      case "CustomerCommunication":
        return num ? `Customer Communication (${num})` : "Customer Communication";
      case "InitialMIR":
        return num ? `Initial MIR (${num})` : "Initial MIR";
      case "FinalMIR":
        return num ? `Final MIR (${num})` : "Final MIR";
      case "ComplaintTask":
        return num ? `Complaint Task (${num})` : "Complaint Task";
      case "SampleManagement":
        return num ? `Sample Management (${num})` : "Sample Management";
      default:
        return num ? `${log.entityType} (${num})` : log.entityType;
    }
  };

  const formatAuditDate = (date: Date): string => {
    const d = new Date(date);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  };

  const formatFieldValue = (val: unknown): string => {
    if (val === null || val === undefined) return "(none)";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "string") {
      if (/^[A-Z0-9_]+$/.test(val)) {
        return val
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }
      return val;
    }
    if (typeof val === "number") return String(val);
    return JSON.stringify(val);
  };

  const formatFieldLabel = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower === "priority" || lower === "severity") return "Severity";
    if (lower === "shortdescription") return "Short Description";
    if (lower === "currentphase") return "Phase";
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Electronic Audit Trail
            </h1>
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
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Record</th>
                  <th className="py-3 px-4">Field Modifications</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Changed By</th>
                  <th className="py-3 px-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  const changes = (
                    Array.isArray(log.fieldChanges)
                      ? (log.fieldChanges as Array<{ field?: string; oldValue?: any; newValue?: any }>)
                      : []
                  ).filter(
                    (c) =>
                      c.field &&
                      ![
                        "id",
                        "orgId",
                        "createdAt",
                        "updatedAt",
                        "deletedAt",
                        "complaintId",
                        "capaId",
                        "investigationId",
                        "vigilanceId",
                        "vigilanceDecisionTreeId",
                        "communicationId",
                        "customerCommunicationId",
                        "sampleManagementId",
                        "taskId",
                        "complaintTaskId",
                        "initialMIRId",
                        "finalMIRId",
                      ].includes(c.field)
                  );

                  return (
                    <tr key={log.id} className="hover:bg-muted/30 align-top">
                      <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        {formatAuditDate(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                        <div className="font-bold text-primary">
                          {formatRecordName(log)}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {log.entityType} ({log.entityId.slice(0, 8)}...)
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        {changes.length > 0 ? (
                          <div className="space-y-1.5">
                            {changes.map((c, idx) => {
                              const rawField = c.field || "field";
                              const label = formatFieldLabel(rawField);
                              return (
                                <div
                                  key={idx}
                                  className="p-1.5 rounded bg-muted/40 border border-border/60 text-[11px] space-y-1"
                                >
                                  <div className="font-semibold text-foreground">
                                    <span className="text-muted-foreground font-normal">Field: </span>
                                    {label}
                                  </div>
                                  <div className="flex items-center gap-2 font-mono text-[10px]">
                                    <span className="text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded">
                                      Old: {formatFieldValue(c.oldValue)}
                                    </span>
                                    <span>&rarr;</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded font-semibold">
                                      New: {formatFieldValue(c.newValue)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">
                            No field diffs recorded
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold font-mono ${
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
                      <td className="py-3 px-4 text-foreground whitespace-nowrap font-medium">
                        <div>
                          {log.signerName || formatUserName(log.changedBy, log.changedById)}
                        </div>
                        {log.signerRole && (
                          <div className="text-[10px] text-muted-foreground font-normal">
                            Role: <span className="font-medium text-foreground">{formatRoleName(log.signerRole)}</span>
                          </div>
                        )}
                        {log.organizationName && (
                          <div className="text-[9px] text-muted-foreground font-mono">
                            Org: {log.organizationName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-[11px] max-w-xs break-words space-y-1">
                        {log.signatureMeaning && (
                          <div className="font-semibold text-foreground text-[11px]">
                            <span className="text-muted-foreground font-normal text-[10px] uppercase">Meaning: </span>
                            {log.signatureMeaning}
                          </div>
                        )}
                        {log.recordVersion && (
                          <div className="text-[10px] font-mono text-muted-foreground">
                            <span>Version: </span>{log.recordVersion}
                          </div>
                        )}
                        <div className="italic text-muted-foreground/90">
                          {log.reason || "Standard system operation"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
