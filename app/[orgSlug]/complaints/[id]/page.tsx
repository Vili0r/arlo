import {
  requireOrgAuth,
  verifySeparationOfDuties,
  PERMISSIONS,
} from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  FileCheck,
  UserCheck,
} from "lucide-react";
import { AuditAction, ComplaintStatus } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

interface ComplaintDetailPageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

// Server Action: Update Investigation Findings
async function updateInvestigationAction(
  complaintId: string,
  formData: FormData
) {
  "use server";

  const { userId, orgId } = await requireOrgAuth(
    PERMISSIONS.COMPLAINTS_INVESTIGATE
  );

  const investigationSummary = formData.get("investigationSummary") as string;
  const rootCause = formData.get("rootCause") as string;

  const existing = await prisma.complaint.findUnique({
    where: { id: complaintId, orgId },
  });

  if (!existing) throw new Error("Complaint not found.");

  const updated = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      investigationSummary,
      rootCause,
      assignedInvestigatorId: userId, // assign investigator
      status: "UNDER_INVESTIGATION",
    },
  });

  await createAuditLog({
    orgId,
    entityType: "Complaint",
    entityId: complaintId,
    action: AuditAction.INVESTIGATION_SUBMIT,
    changedById: userId,
    previousData: existing as unknown as Record<string, unknown>,
    newData: updated as unknown as Record<string, unknown>,
    reason: "Submitted root-cause investigation findings",
    complaintId,
  });

  redirect(`/complaints/${complaintId}`);
}

// Server Action: Approve & Close Record (Separation of Duties Enforced)
async function closeComplaintAction(
  complaintId: string,
  formData: FormData
) {
  "use server";

  const { userId, orgId } = await requireOrgAuth(
    PERMISSIONS.COMPLAINTS_APPROVE_CLOSE
  );

  const closureRationale = formData.get("closureRationale") as string;
  if (!closureRationale) {
    throw new Error("Closure rationale is required for regulatory audit.");
  }

  const existing = await prisma.complaint.findUnique({
    where: { id: complaintId, orgId },
  });

  if (!existing) throw new Error("Complaint not found.");

  // Strict 21 CFR Part 11 & ISO 13485 Separation of Duties check
  verifySeparationOfDuties(
    userId,
    existing.assignedInvestigatorId,
    "Complaint"
  );

  const updated = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status: "CLOSED",
      approvedById: userId,
      closureRationale,
    },
  });

  await createAuditLog({
    orgId,
    entityType: "Complaint",
    entityId: complaintId,
    action: AuditAction.APPROVE_CLOSE,
    changedById: userId,
    previousData: existing as unknown as Record<string, unknown>,
    newData: updated as unknown as Record<string, unknown>,
    reason: `Electronic Approval & Closure: ${closureRationale}`,
    complaintId,
  });

  redirect(`/complaints/${complaintId}`);
}

export default async function ComplaintDetailPage({
  params,
}: ComplaintDetailPageProps) {
  const { orgSlug, id } = await params;
  const { orgId } = await requireOrgAuth();
  const authContext = await auth();
  const currentUserId = authContext.userId;

  const complaint = await prisma.complaint.findUnique({
    where: { id, orgId, deletedAt: null },
    include: {
      createdBy: true,
      assignedInvestigator: true,
      approvedBy: true,
      auditLogs: {
        orderBy: { timestamp: "desc" },
        include: {
          changedBy: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  if (!complaint) {
    notFound();
  }

  // Separation of duties rule check for UI state
  const isInvestigator =
    complaint.assignedInvestigatorId &&
    complaint.assignedInvestigatorId === currentUserId;

  const canApprove =
    authContext.has({ permission: PERMISSIONS.COMPLAINTS_APPROVE_CLOSE }) &&
    !isInvestigator;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/complaints"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Complaints
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-primary">
              {complaint.complaintNumber}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                complaint.status === "CLOSED"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {complaint.status}
            </span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {complaint.severity}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight mt-2">
            {complaint.title}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Logged on {new Date(complaint.createdAt).toLocaleString()} by{" "}
            {complaint.createdBy?.email || complaint.createdById}
          </p>
        </div>
      </div>

      {/* Grid: Details & Investigation */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Device & Intake Info */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold border-b border-border pb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Device & Intake Details
          </h2>
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-muted-foreground">Device Model</dt>
              <dd className="font-medium text-foreground">
                {complaint.deviceModel || "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Serial Number</dt>
              <dd className="font-mono text-foreground">
                {complaint.deviceSerialNumber || "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Lot / Batch Number</dt>
              <dd className="font-mono text-foreground">
                {complaint.lotNumber || "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Adverse Event</dt>
              <dd className="font-medium text-foreground">
                {complaint.isAdverseEvent ? "Yes (Reportable)" : "No"}
              </dd>
            </div>
          </dl>
          <div>
            <span className="text-xs text-muted-foreground block mb-1">
              Event Narrative
            </span>
            <p className="rounded-md bg-muted/40 p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
              {complaint.description}
            </p>
          </div>
        </div>

        {/* Accountability & Approval Chain */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold border-b border-border pb-2 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" /> Accountability Chain (21 CFR Part 11)
          </h2>
          <div className="space-y-3 text-xs">
            <div className="rounded-lg border border-border p-3">
              <span className="text-muted-foreground block text-[11px]">
                Logged By (Intake)
              </span>
              <span className="font-semibold text-foreground">
                {complaint.createdBy?.email || complaint.createdById}
              </span>
              <span className="text-muted-foreground block text-[10px]">
                {new Date(complaint.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="rounded-lg border border-border p-3">
              <span className="text-muted-foreground block text-[11px]">
                Assigned Investigator
              </span>
              <span className="font-semibold text-foreground">
                {complaint.assignedInvestigator?.email ||
                  (complaint.assignedInvestigatorId
                    ? complaint.assignedInvestigatorId
                    : "Not yet assigned")}
              </span>
            </div>

            <div className="rounded-lg border border-border p-3">
              <span className="text-muted-foreground block text-[11px]">
                QA Manager Approver
              </span>
              <span className="font-semibold text-foreground">
                {complaint.approvedBy?.email ||
                  (complaint.status === "CLOSED" ? "Approved" : "Pending Closure")}
              </span>
              {complaint.closureRationale && (
                <p className="mt-1 text-[11px] text-muted-foreground italic">
                  Rationale: &quot;{complaint.closureRationale}&quot;
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Investigation Section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold border-b border-border pb-2 flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-500" /> Root-Cause Investigation Findings
        </h2>

        {complaint.status === "CLOSED" ? (
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground font-semibold block mb-1">
                Investigation Summary:
              </span>
              <p className="rounded-md bg-muted/40 p-3 text-xs text-foreground whitespace-pre-wrap">
                {complaint.investigationSummary || "No summary recorded."}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold block mb-1">
                Root Cause:
              </span>
              <p className="rounded-md bg-muted/40 p-3 text-xs text-foreground whitespace-pre-wrap">
                {complaint.rootCause || "No root cause identified."}
              </p>
            </div>
          </div>
        ) : (
          <form
            action={updateInvestigationAction.bind(null, complaint.id)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Investigation Summary
              </label>
              <textarea
                name="investigationSummary"
                defaultValue={complaint.investigationSummary || ""}
                rows={3}
                placeholder="Detail technical investigation findings, lab tests, device teardown..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Root Cause Determination
              </label>
              <textarea
                name="rootCause"
                defaultValue={complaint.rootCause || ""}
                rows={2}
                placeholder="Identify manufacturing, component, software, or user error root cause..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Save Investigation Findings
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Review & Closure Section (Separation of Duties Enforced) */}
      {complaint.status !== "CLOSED" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold border-b border-border pb-2 flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-600" /> Final QA Review & Closure
          </h2>

          {isInvestigator ? (
            /* Warning if user is the assigned investigator */
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs">
              <div className="flex items-center gap-2 font-semibold text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" /> Separation of Duties Enforced
              </div>
              <p className="mt-1 text-muted-foreground">
                You are recorded as the investigator for this complaint. Under ISO
                13485 and FDA 21 CFR Part 11, a separate QA Manager must conduct
                the final review and sign the electronic closure.
              </p>
            </div>
          ) : (
            <form
              action={closeComplaintAction.bind(null, complaint.id)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Closure Justification & Electronic Signature Rationale *
                </label>
                <textarea
                  name="closureRationale"
                  required
                  rows={2}
                  placeholder="State QA approval rationale and verify investigation completeness..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!canApprove}
                  className="rounded-md bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  Approve & Close Complaint (QA Authority)
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Immutable Audit Trail Section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold border-b border-border pb-2">
          Immutable Audit History for this Record ({complaint.auditLogs.length} events)
        </h2>
        <div className="divide-y divide-border text-xs">
          {complaint.auditLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-start justify-between">
              <div>
                <span className="font-semibold">{log.action}</span> by{" "}
                <span className="text-muted-foreground">
                  {log.changedBy?.email || log.changedById}
                </span>
                {log.reason && (
                  <p className="text-[11px] text-muted-foreground italic mt-0.5">
                    &quot;{log.reason}&quot;
                  </p>
                )}
              </div>
              <time className="text-[10px] text-muted-foreground font-mono">
                {new Date(log.timestamp).toLocaleString()}
              </time>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
