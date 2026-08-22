import { requireOrgAuth, PERMISSIONS } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Severity, AuditAction } from "@prisma/client";

interface NewComplaintPageProps {
  params: Promise<{ orgSlug: string }>;
}

async function createComplaintAction(formData: FormData) {
  "use server";

  const { userId, orgId } = await requireOrgAuth(PERMISSIONS.COMPLAINTS_CREATE);

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const severity = (formData.get("severity") as Severity) || "MINOR";
  const dateReceivedStr = formData.get("dateReceived") as string;
  const deviceModel = formData.get("deviceModel") as string;
  const deviceSerialNumber = formData.get("deviceSerialNumber") as string;
  const lotNumber = formData.get("lotNumber") as string;
  const isAdverseEvent = formData.get("isAdverseEvent") === "on";

  if (!title || !description) {
    throw new Error("Title and description are required.");
  }

  // Generate sequence complaint number
  const count = await prisma.complaint.count({ where: { orgId } });
  const year = new Date().getFullYear();
  const complaintNumber = `CMP-${year}-${String(count + 1).padStart(4, "0")}`;

  const dateReceived = dateReceivedStr
    ? new Date(dateReceivedStr)
    : new Date();

  // Create complaint record
  const complaint = await prisma.complaint.create({
    data: {
      orgId,
      complaintNumber,
      title,
      description,
      severity,
      dateReceived,
      deviceModel: deviceModel || null,
      deviceSerialNumber: deviceSerialNumber || null,
      lotNumber: lotNumber || null,
      isAdverseEvent,
      createdById: userId,
      status: "OPEN",
    },
  });

  // Create immutable 21 CFR Part 11 Audit Log
  await createAuditLog({
    orgId,
    entityType: "Complaint",
    entityId: complaint.id,
    action: AuditAction.CREATE,
    changedById: userId,
    newData: complaint as unknown as Record<string, unknown>,
    reason: `Initial complaint logging (${complaintNumber})`,
    complaintId: complaint.id,
  });

  redirect("/complaints");
}

export default async function NewComplaintPage({
  params,
}: NewComplaintPageProps) {
  const { orgSlug } = await params;
  await requireOrgAuth(PERMISSIONS.COMPLAINTS_CREATE);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/complaints"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Complaints
        </Link>
      </div>

      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold tracking-tight">
          Log New Product Complaint
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Enter initial post-market surveillance data for{" "}
          <span className="font-semibold text-foreground">{orgSlug}</span>.
        </p>
      </div>

      <form
        action={createComplaintAction}
        className="rounded-xl border border-border bg-card p-6 space-y-6"
      >
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground block">
            Complaint Title *
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. Device display flickering during calibration"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Severity & Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Severity Classification *
            </label>
            <select
              name="severity"
              required
              defaultValue="MINOR"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="CRITICAL">Critical (Patient Safety / Harm Risk)</option>
              <option value="MAJOR">Major (Device Malfunction)</option>
              <option value="MINOR">Minor (Non-critical Performance)</option>
              <option value="COSMETIC">Cosmetic (Packaging / Labeling)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Date Received *
            </label>
            <input
              type="date"
              name="dateReceived"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Device Information */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Device Model / Name
            </label>
            <input
              type="text"
              name="deviceModel"
              placeholder="e.g. CardiaMonitor X3"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Serial Number
            </label>
            <input
              type="text"
              name="deviceSerialNumber"
              placeholder="e.g. SN-883921"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Lot / Batch Number
            </label>
            <input
              type="text"
              name="lotNumber"
              placeholder="e.g. LOT-2026-B"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground block">
            Detailed Description & Customer Feedback *
          </label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="Provide exact narrative of the event, customer findings, operating conditions..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Adverse Event Checkbox */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isAdverseEvent"
              className="mt-0.5 rounded border-amber-500 text-primary focus:ring-primary"
            />
            <div>
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                Reportable Adverse Event (Vigilance Trigger)
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Check if this incident resulted in serious patient injury, death,
                or could lead to serious health deterioration (MDR/Vigilance).
              </p>
            </div>
          </label>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/complaints"
            className="rounded-md border border-input bg-background px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-md bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Create & Log Record
          </button>
        </div>
      </form>
    </div>
  );
}
