"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Save,
  Loader2,
  AlertTriangle,
  Lock,
  LockOpen,
  ExternalLink,
  Info,
  ClipboardCheck,
} from "lucide-react";
import { MIRStatus, LockEntityType } from "@prisma/client";
import { useRecordLock } from "@/hooks/useRecordLock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@clerk/nextjs";
import { updateFinalMIR } from "@/lib/actions/mir";
import { StatusTransitionTracker } from "@/components/status-transition-tracker";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types & Schema                                                      */
/* ------------------------------------------------------------------ */

const finalMirSchema = z.object({
  status: z.nativeEnum(MIRStatus),
  reportType: z.string().optional().nullable(),
  mirNumber: z.string().optional().nullable(),
  manufacturerReference: z.string().optional().nullable(),
  previousMirReference: z.string().optional().nullable(),
  competentAuthority: z.string().optional().nullable(),
  competentAuthorityReference: z.string().optional().nullable(),
  submissionCountry: z.string().optional().nullable(),
  submissionMethod: z.string().optional().nullable(),
  submittedBy: z.string().optional().nullable(),
  submissionDate: z.date().optional().nullable(),
  finalDeviceRelatedness: z.string().optional().nullable(),
  finalCausalityAssessment: z.string().optional().nullable(),
  finalCausalityRationale: z.string().optional().nullable(),
  manufacturerConclusion: z.string().optional().nullable(),
  incidentConfirmed: z.boolean().optional(),
  deviceContributionConfirmed: z.boolean().optional(),
  rootCauseConfirmed: z.boolean().optional(),
  recurrencePotential: z.string().optional().nullable(),
  finalRiskAssessmentSummary: z.string().optional().nullable(),
  manufacturerFinalStatement: z.string().optional().nullable(),
  preparedById: z.string().optional().nullable(),
  reviewedById: z.string().optional().nullable(),
  approvedById: z.string().optional().nullable(),
});

type FinalMIRFormValues = z.infer<typeof finalMirSchema>;

export interface FinalMIREditFormProps {
  orgSlug: string;
  complaintNumber: string;
  mir: {
    id: string;
    complaintId: string;
    status: MIRStatus;
    reportType?: string | null;
    mirNumber?: string | null;
    manufacturerReference?: string | null;
    previousMirReference?: string | null;
    competentAuthority?: string | null;
    competentAuthorityReference?: string | null;
    submissionCountry?: string | null;
    submissionMethod?: string | null;
    submittedBy?: string | null;
    submissionDate?: string | Date | null;
    finalDeviceRelatedness?: string | null;
    finalCausalityAssessment?: string | null;
    finalCausalityRationale?: string | null;
    manufacturerConclusion?: string | null;
    incidentConfirmed?: boolean;
    deviceContributionConfirmed?: boolean;
    rootCauseConfirmed?: boolean;
    recurrencePotential?: string | null;
    finalRiskAssessmentSummary?: string | null;
    manufacturerFinalStatement?: string | null;
    preparedById?: string | null;
    reviewedById?: string | null;
    approvedById?: string | null;
    [key: string]: unknown;
  };
  users?: Array<{ id: string; email: string; firstName: string | null; lastName: string | null }>;
}

/* ------------------------------------------------------------------ */
/* Shared constants & small helpers                                    */
/* ------------------------------------------------------------------ */

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const SECTIONS = [
  { id: "identification", label: "Report Identification" },
  { id: "submission", label: "Authority & Submission" },
  { id: "findings", label: "Final Causality & Findings" },
  { id: "conclusions", label: "Conclusions & Statements" },
  { id: "roles", label: "Regulatory Sign-Off" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];
type Completion = "done" | "attention" | "empty";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In Review",
  SUBMITTED: "Submitted",
  CANCELLED: "Cancelled",
};

const REPORT_TYPE_OPTIONS = [
  { value: "FINAL", label: "Final Report" },
  { value: "COMBINED", label: "Combined Initial & Final Report" },
  { value: "FOLLOW_UP_FINAL", label: "Follow-Up & Final Report" },
];

const AUTHORITY_PRESETS = [
  "BfArM (Germany)",
  "ANSM (France)",
  "MHRA (United Kingdom)",
  "HPRA (Ireland)",
  "AEMPS (Spain)",
  "Swissmedic (Switzerland)",
  "US FDA CDRH (21 CFR 803)",
  "Health Canada",
  "TGA (Australia)",
  "EUDAMED Central Portal",
];

const SUBMISSION_METHODS = [
  "EUDAMED Electronic XML",
  "National Authority Web Portal",
  "Electronic Mail / Signed PDF",
  "API / Machine-to-Machine",
  "Courier / Physical Filing",
];

const FINAL_DEVICE_RELATEDNESS_OPTIONS = [
  { value: "CONFIRMED", label: "Confirmed Device Related" },
  { value: "UNLIKELY", label: "Unlikely" },
  { value: "NOT_RELATED", label: "Not Related / Excluded" },
  { value: "USE_ERROR", label: "Use Error / Off-Label Use" },
];

const FINAL_CAUSALITY_OPTIONS = [
  { value: "DIRECT_CAUSE", label: "Direct Device Failure / Malfunction" },
  { value: "CONTRIBUTORY", label: "Contributory Factor" },
  { value: "COINCIDENTAL", label: "Coincidental / Pre-existing Pathology" },
  { value: "INCONCLUSIVE", label: "Inconclusive Root Cause" },
];

const RECURRENCE_POTENTIAL_OPTIONS = [
  { value: "NEGLIGIBLE", label: "Negligible / Unlikely" },
  { value: "LOW", label: "Low (Occasional / Non-Systemic)" },
  { value: "MODERATE", label: "Moderate (Known Failure Rate)" },
  { value: "HIGH", label: "High / Systematic Design or Manufacturing Issue" },
];

function humanize(value?: string | null) {
  if (!value) return "";
  return (
    STATUS_LABEL[value] ??
    value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ")
  );
}

function formatDate(d?: Date | string | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseDate(d?: string | Date | null): Date | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  return isNaN(date.getTime()) ? null : date;
}

function CompletionDot({ state }: { state: Completion }) {
  return (
    <span
      aria-hidden
      className={cn(
        "h-1.5 w-1.5 shrink-0 rounded-full",
        state === "done" && "bg-emerald-500",
        state === "attention" && "bg-amber-500",
        state === "empty" && "bg-border"
      )}
    />
  );
}

function Field({
  label,
  htmlFor,
  required,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SectionCard({
  id,
  title,
  description,
  action,
  children,
}: {
  id: SectionId;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-32 rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function PanelCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Component                                                      */
/* ------------------------------------------------------------------ */

export function FinalMIREditForm({
  orgSlug,
  complaintNumber,
  mir,
  users = [],
}: FinalMIREditFormProps) {
  const router = useRouter();
  const { isReadOnly: isLockReadOnly } = useRecordLock({
    entityType: LockEntityType.Vigilance,
    recordId: mir.id,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSection, setActiveSection] = React.useState<SectionId>("identification");

  const { memberships } = useOrganization({
    memberships: { pageSize: 100, keepPreviousData: true },
  });

  // Consolidated map of user identifiers -> display names
  const memberNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.email;
      if (u.id) map.set(u.id, name);
      if (u.email) map.set(u.email, name);
    });
    memberships?.data?.forEach((m) => {
      if (m.publicUserData) {
        const fullName = [m.publicUserData.firstName, m.publicUserData.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        const displayName = fullName || m.publicUserData.identifier || "";
        if (m.publicUserData.userId && displayName) {
          map.set(m.publicUserData.userId, displayName);
        }
        if (m.publicUserData.identifier && displayName) {
          map.set(m.publicUserData.identifier, displayName);
        }
      }
    });
    return map;
  }, [users, memberships]);

  const allUserOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.email;
      if (u.id) map.set(u.id, name);
    });
    memberships?.data?.forEach((m) => {
      const id = m.publicUserData?.userId;
      if (id) {
        const name =
          [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(" ").trim() ||
          m.publicUserData?.identifier ||
          id;
        map.set(id, name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [users, memberships]);

  const resolveUserDisplayName = React.useCallback(
    (userId?: string | null, fallback = "Unassigned") => {
      if (!userId) return fallback;
      return memberNameMap.get(userId) || fallback;
    },
    [memberNameMap]
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FinalMIRFormValues>({
    resolver: zodResolver(finalMirSchema),
    defaultValues: {
      status: mir.status || MIRStatus.DRAFT,
      reportType: mir.reportType || "FINAL",
      mirNumber: mir.mirNumber || "",
      manufacturerReference: mir.manufacturerReference || "",
      previousMirReference: mir.previousMirReference || "",
      competentAuthority: mir.competentAuthority || "",
      competentAuthorityReference: mir.competentAuthorityReference || "",
      submissionCountry: mir.submissionCountry || "",
      submissionMethod: mir.submissionMethod || "",
      submittedBy: mir.submittedBy || "",
      submissionDate: parseDate(mir.submissionDate),
      finalDeviceRelatedness: mir.finalDeviceRelatedness || "",
      finalCausalityAssessment: mir.finalCausalityAssessment || "",
      finalCausalityRationale: mir.finalCausalityRationale || "",
      manufacturerConclusion: mir.manufacturerConclusion || "",
      incidentConfirmed: mir.incidentConfirmed || false,
      deviceContributionConfirmed: mir.deviceContributionConfirmed || false,
      rootCauseConfirmed: mir.rootCauseConfirmed || false,
      recurrencePotential: mir.recurrencePotential || "",
      finalRiskAssessmentSummary: mir.finalRiskAssessmentSummary || "",
      manufacturerFinalStatement: mir.manufacturerFinalStatement || "",
      preparedById: mir.preparedById || "",
      reviewedById: mir.reviewedById || "",
      approvedById: mir.approvedById || "",
    },
  });

  /* ---------- Watched values ---------- */
  const currentStatus = watch("status");
  const watchReportType = watch("reportType");
  const watchMirNumber = watch("mirNumber");
  const watchManufacturerReference = watch("manufacturerReference");
  const watchCompetentAuthority = watch("competentAuthority");
  const watchSubmissionCountry = watch("submissionCountry");
  const watchSubmissionDate = watch("submissionDate");
  const watchFinalDeviceRelatedness = watch("finalDeviceRelatedness");
  const watchFinalCausality = watch("finalCausalityAssessment");
  const watchFinalCausalityRationale = watch("finalCausalityRationale");
  const watchManufacturerConclusion = watch("manufacturerConclusion");
  const watchIncidentConfirmed = watch("incidentConfirmed");
  const watchDeviceContributionConfirmed = watch("deviceContributionConfirmed");
  const watchRootCauseConfirmed = watch("rootCauseConfirmed");
  const watchRecurrencePotential = watch("recurrencePotential");
  const watchFinalRiskSummary = watch("finalRiskAssessmentSummary");
  const watchFinalStatement = watch("manufacturerFinalStatement");
  const watchPreparedById = watch("preparedById");
  const watchReviewedById = watch("reviewedById");
  const watchApprovedById = watch("approvedById");

  const displayedPreparedBy = React.useMemo(() => {
    return resolveUserDisplayName(watchPreparedById, "Unassigned");
  }, [watchPreparedById, resolveUserDisplayName]);

  const displayedReviewedBy = React.useMemo(() => {
    return resolveUserDisplayName(watchReviewedById, "Unassigned");
  }, [watchReviewedById, resolveUserDisplayName]);

  const displayedApprovedBy = React.useMemo(() => {
    return resolveUserDisplayName(watchApprovedById, "Unassigned");
  }, [watchApprovedById, resolveUserDisplayName]);

  /* ---------- Section completion status ---------- */
  const completion = React.useMemo<Record<SectionId, Completion>>(() => {
    // Identification
    const hasAnyId = watchMirNumber || watchManufacturerReference;
    const idComp: Completion =
      watchMirNumber && watchReportType ? "done" : hasAnyId ? "attention" : "empty";

    // Submission
    const hasAnySubmission =
      watchCompetentAuthority || watchSubmissionCountry || watchSubmissionDate;
    const submissionComp: Completion =
      watchCompetentAuthority && watchSubmissionDate
        ? "done"
        : hasAnySubmission
        ? "attention"
        : "empty";

    // Findings
    const hasAnyFindings =
      watchFinalDeviceRelatedness ||
      watchFinalCausality ||
      watchFinalCausalityRationale ||
      watchRecurrencePotential;
    const findingsComp: Completion =
      watchFinalDeviceRelatedness &&
      watchFinalCausalityRationale &&
      watchFinalCausalityRationale.trim().length > 0
        ? "done"
        : hasAnyFindings
        ? "attention"
        : "empty";

    // Conclusions
    const hasAnyConclusions =
      watchManufacturerConclusion || watchFinalRiskSummary || watchFinalStatement;
    const conclusionsComp: Completion =
      watchManufacturerConclusion && watchManufacturerConclusion.trim().length > 0
        ? "done"
        : hasAnyConclusions
        ? "attention"
        : "empty";

    // Roles
    const hasAnyRoles = watchPreparedById || watchReviewedById || watchApprovedById;
    const rolesComp: Completion =
      watchPreparedById && watchApprovedById ? "done" : hasAnyRoles ? "attention" : "empty";

    return {
      identification: idComp,
      submission: submissionComp,
      findings: findingsComp,
      conclusions: conclusionsComp,
      roles: rolesComp,
    };
  }, [
    watchMirNumber,
    watchReportType,
    watchManufacturerReference,
    watchCompetentAuthority,
    watchSubmissionCountry,
    watchSubmissionDate,
    watchFinalDeviceRelatedness,
    watchFinalCausality,
    watchFinalCausalityRationale,
    watchRecurrencePotential,
    watchManufacturerConclusion,
    watchFinalRiskSummary,
    watchFinalStatement,
    watchPreparedById,
    watchReviewedById,
    watchApprovedById,
  ]);

  /* ---------- Scroll spy for navigation tabs ---------- */
  const rootRef = React.useRef<HTMLDivElement>(null);
  const barRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let scroller: HTMLElement | null = root.parentElement;
    while (scroller && scroller !== document.body) {
      const { overflowY } = getComputedStyle(scroller);
      if (overflowY === "auto" || overflowY === "scroll") break;
      scroller = scroller.parentElement;
    }
    if (scroller === document.body) scroller = null;
    const target: HTMLElement | Window = scroller ?? window;

    const update = () => {
      const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
        Boolean
      ) as HTMLElement[];
      if (els.length === 0) return;

      const containerTop = scroller ? scroller.getBoundingClientRect().top : 0;
      const viewport = scroller ? scroller.clientHeight : window.innerHeight;
      const scrollTop = scroller ? scroller.scrollTop : window.scrollY;
      const scrollHeight = scroller
        ? scroller.scrollHeight
        : document.documentElement.scrollHeight;
      const maxScroll = Math.max(0, scrollHeight - viewport);

      const barBottom = (barRef.current?.getBoundingClientRect().bottom ?? 0) - containerTop;
      const line = barBottom + 16;

      // scrollTop at which each section's top would sit on the line
      const thresholds = els.map(
        (el) => scrollTop + el.getBoundingClientRect().top - containerTop - line
      );

      // Sections whose threshold the page can't scroll to (short tail) get
      // their thresholds compressed into the remaining scroll range, so no
      // tab is skipped and the last one activates exactly at the bottom.
      const MIN_RANGE = 48; // px of scroll each fitting section keeps
      let lastFit = -1;
      for (let i = 0; i < thresholds.length; i++) {
        if (thresholds[i] <= maxScroll - MIN_RANGE) lastFit = i;
      }
      if (lastFit < thresholds.length - 1) {
        const from = lastFit >= 0 ? thresholds[lastFit] : 0;
        const span = thresholds[thresholds.length - 1] - from;
        for (let i = lastFit + 1; i < thresholds.length; i++) {
          thresholds[i] =
            span > 0
              ? from + ((thresholds[i] - from) / span) * (maxScroll - from)
              : maxScroll;
        }
      }

      let current: SectionId = els[0].id as SectionId;
      for (let i = 0; i < els.length; i++) {
        if (scrollTop >= thresholds[i] - 1) current = els[i].id as SectionId;
      }

      setActiveSection((prev) => (prev === current ? prev : current));
    };

    update();
    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      target.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollTo = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ---------- Submit handler ---------- */
  const onSubmit = async (data: FinalMIRFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateFinalMIR(mir.id, {
        status: data.status,
        reportType: data.reportType || null,
        mirNumber: data.mirNumber || null,
        manufacturerReference: data.manufacturerReference || null,
        previousMirReference: data.previousMirReference || null,
        competentAuthority: data.competentAuthority || null,
        competentAuthorityReference: data.competentAuthorityReference || null,
        submissionCountry: data.submissionCountry || null,
        submissionMethod: data.submissionMethod || null,
        submittedBy: data.submittedBy || null,
        submissionDate: data.submissionDate || null,
        finalDeviceRelatedness: data.finalDeviceRelatedness || null,
        finalCausalityAssessment: data.finalCausalityAssessment || null,
        finalCausalityRationale: data.finalCausalityRationale || null,
        manufacturerConclusion: data.manufacturerConclusion || null,
        incidentConfirmed: data.incidentConfirmed ?? false,
        deviceContributionConfirmed: data.deviceContributionConfirmed ?? false,
        rootCauseConfirmed: data.rootCauseConfirmed ?? false,
        recurrencePotential: data.recurrencePotential || null,
        finalRiskAssessmentSummary: data.finalRiskAssessmentSummary || null,
        manufacturerFinalStatement: data.manufacturerFinalStatement || null,
        preparedById: data.preparedById || null,
        reviewedById: data.reviewedById || null,
        approvedById: data.approvedById || null,
      });

      toast.success("Final MIR report saved successfully");
      router.refresh();
    } catch (err: unknown) {
      console.error("[Final MIR Update Error]", err);
      const message =
        err instanceof Error ? err.message : "Failed to update Final MIR report. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const complaintsHref = orgSlug ? `/${orgSlug}/complaints` : "/complaints";
  const complaintDetailHref = orgSlug
    ? `/${orgSlug}/complaints/${mir.complaintId}`
    : `/complaints/${mir.complaintId}`;

  return (
    <div ref={rootRef} className="-m-6 lg:-m-8">
      {/* ---------- Sticky Record Bar ---------- */}
       <div
        ref={barRef}
        className="sticky -top-10 z-20 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      >
        <div className="px-6 pt-3 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Link
                href={complaintsHref}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Complaints
              </Link>
              <span className="text-xs text-muted-foreground/60">/</span>
              <Link
                href={complaintDetailHref}
                className="text-xs font-mono text-muted-foreground transition-colors hover:text-foreground"
              >
                {complaintNumber}
              </Link>
              <span className="text-xs text-muted-foreground/60">/</span>
              <span className="text-sm font-medium text-foreground">Final MIR</span>
              <Badge
                variant="outline"
                className={cn(
                  currentStatus === MIRStatus.SUBMITTED &&
                    "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400",
                  currentStatus === MIRStatus.IN_REVIEW &&
                    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                  currentStatus === MIRStatus.DRAFT &&
                    "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
                  currentStatus === MIRStatus.CANCELLED &&
                    "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400"
                )}
              >
                {humanize(currentStatus)}
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              >
                Final Investigation Report (Annex I)
              </Badge>
            </div>

            <div className="flex items-center gap-2 lg:mt-2">
              <StatusTransitionTracker
                entityType="FinalMIR"
                entityId={mir.id}
                currentStatus={currentStatus}
                disabled={isLockReadOnly}
                onStatusChanged={(newStatus) => {
                  setValue("status", newStatus as MIRStatus);
                  router.refresh();
                }}
              />

              <Button
                type="submit"
                form="final-mir-form"
                size="sm"
                disabled={isSubmitting || isLockReadOnly}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {isSubmitting ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>

          {/* Anchor tabs */}
          <nav className="-mb-px mt-2 flex gap-1 overflow-x-auto" aria-label="Sections">
            {SECTIONS.map((s) => {
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs transition-colors",
                    active
                      ? "border-foreground font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CompletionDot state={completion[s.id]} />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ---------- Body Grid ---------- */}
      <div className="grid gap-6 p-6 lg:p-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main form column */}
        <form
          id="final-mir-form"
          onSubmit={handleSubmit(onSubmit)}
          className="min-w-0 max-w-5xl space-y-4"
        >
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <fieldset disabled={isLockReadOnly} className="contents space-y-6">
            {/* ---------- Section 1: Report Identification ---------- */}
            <SectionCard
              id="identification"
              title="1. Report Identification"
              description="Final incident report identifiers, reference numbers, and classification per EUDAMED / Annex I."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field
                    label="MIR Number"
                    htmlFor="mirNumber"
                    required
                    error={errors.mirNumber?.message}
                  >
                    <Input
                      id="mirNumber"
                      placeholder="e.g. MIR-2026-001"
                      className={selectClass}
                      {...register("mirNumber")}
                    />
                  </Field>

                  <Field label="Report type" htmlFor="reportType">
                    <select
                      id="reportType"
                      {...register("reportType")}
                      className={selectClass}
                    >
                      {REPORT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Manufacturer reference"
                    htmlFor="manufacturerReference"
                  >
                    <Input
                      id="manufacturerReference"
                      placeholder="e.g. MFR-INC-2026-042"
                      className={selectClass}
                      {...register("manufacturerReference")}
                    />
                  </Field>

                  <Field
                    label="Previous MIR reference"
                    htmlFor="previousMirReference"
                  >
                    <Input
                      id="previousMirReference"
                      placeholder="Initial MIR ID / Authority filing ID"
                      className={selectClass}
                      {...register("previousMirReference")}
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* ---------- Section 2: Authority & Submission Details ---------- */}
            <SectionCard
              id="submission"
              title="2. Competent Authority & Final Submission"
              description="National regulatory authority, recipient contact, submission route, and closure filing date."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field
                    label="Competent authority"
                    htmlFor="competentAuthority"
                    required
                  >
                    <input
                      id="competentAuthority"
                      list="authority-presets-final"
                      placeholder="e.g. BfArM, ANSM, MHRA"
                      {...register("competentAuthority")}
                      className={selectClass}
                    />
                    <datalist id="authority-presets-final">
                      {AUTHORITY_PRESETS.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </Field>

                  <Field
                    label="Authority reference number"
                    htmlFor="competentAuthorityReference"
                  >
                    <Input
                      id="competentAuthorityReference"
                      placeholder="Authority file / case reference"
                      className={selectClass}
                      {...register("competentAuthorityReference")}
                    />
                  </Field>

                  <Field label="Submission country" htmlFor="submissionCountry">
                    <Input
                      id="submissionCountry"
                      placeholder="e.g. Germany, France, United States"
                      className={selectClass}
                      {...register("submissionCountry")}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Submission method" htmlFor="submissionMethod">
                    <input
                      id="submissionMethod"
                      list="submission-method-presets-final"
                      placeholder="e.g. EUDAMED XML, Portal"
                      {...register("submissionMethod")}
                      className={selectClass}
                    />
                    <datalist id="submission-method-presets-final">
                      {SUBMISSION_METHODS.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </Field>

                  <Field label="Submitted by" htmlFor="submittedBy">
                    <Input
                      id="submittedBy"
                      placeholder="Name / Title of regulatory filer"
                      className={selectClass}
                      {...register("submittedBy")}
                    />
                  </Field>

                  <Field label="Actual submission date" required>
                    <Controller
                      control={control}
                      name="submissionDate"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={(d) => field.onChange(d)}
                          placeholder="Select submission date"
                          disabled={isLockReadOnly}
                        />
                      )}
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* ---------- Section 3: Final Causality & Investigation Findings ---------- */}
            <SectionCard
              id="findings"
              title="3. Final Causality & Investigation Findings"
              description="Confirmation of incident occurrence, device causality, confirmed root causes, and recurrence probability."
            >
              <div className="space-y-4">
                {/* 3 Confirmation Badges / Toggles */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Toggle 1: Incident Confirmed */}
                  <div
                    className={cn(
                      "rounded-lg border p-3.5 transition-colors",
                      watchIncidentConfirmed
                        ? "border-amber-500/30 bg-amber-500/10"
                        : "border-border bg-muted/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-medium text-foreground">
                          Incident confirmed?
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Adverse event actually took place as reported.
                        </p>
                      </div>
                      <Controller
                        control={control}
                        name="incidentConfirmed"
                        render={({ field }) => (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={field.value}
                            disabled={isLockReadOnly}
                            onClick={() => field.onChange(!field.value)}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                              field.value ? "bg-amber-600" : "bg-muted-foreground/30"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                field.value ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        )}
                      />
                    </div>
                  </div>

                  {/* Toggle 2: Device Contribution Confirmed */}
                  <div
                    className={cn(
                      "rounded-lg border p-3.5 transition-colors",
                      watchDeviceContributionConfirmed
                        ? "border-red-500/30 bg-red-500/10"
                        : "border-border bg-muted/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-medium text-foreground">
                          Device contribution?
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Device caused or contributed to the adverse event.
                        </p>
                      </div>
                      <Controller
                        control={control}
                        name="deviceContributionConfirmed"
                        render={({ field }) => (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={field.value}
                            disabled={isLockReadOnly}
                            onClick={() => field.onChange(!field.value)}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                              field.value ? "bg-red-600" : "bg-muted-foreground/30"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                field.value ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        )}
                      />
                    </div>
                  </div>

                  {/* Toggle 3: Root Cause Confirmed */}
                  <div
                    className={cn(
                      "rounded-lg border p-3.5 transition-colors",
                      watchRootCauseConfirmed
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-border bg-muted/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-medium text-foreground">
                          Root cause identified?
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Underlying failure mechanism definitively verified.
                        </p>
                      </div>
                      <Controller
                        control={control}
                        name="rootCauseConfirmed"
                        render={({ field }) => (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={field.value}
                            disabled={isLockReadOnly}
                            onClick={() => field.onChange(!field.value)}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                              field.value ? "bg-emerald-600" : "bg-muted-foreground/30"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                field.value ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field
                    label="Final device relatedness"
                    htmlFor="finalDeviceRelatedness"
                    required
                  >
                    <select
                      id="finalDeviceRelatedness"
                      {...register("finalDeviceRelatedness")}
                      className={selectClass}
                    >
                      <option value="">Select relatedness...</option>
                      {FINAL_DEVICE_RELATEDNESS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Final causality assessment"
                    htmlFor="finalCausalityAssessment"
                  >
                    <select
                      id="finalCausalityAssessment"
                      {...register("finalCausalityAssessment")}
                      className={selectClass}
                    >
                      <option value="">Select causality...</option>
                      {FINAL_CAUSALITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Recurrence potential"
                    htmlFor="recurrencePotential"
                  >
                    <select
                      id="recurrencePotential"
                      {...register("recurrencePotential")}
                      className={selectClass}
                    >
                      <option value="">Select recurrence...</option>
                      {RECURRENCE_POTENTIAL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field
                  label="Final causality rationale & root cause analysis"
                  htmlFor="finalCausalityRationale"
                  required
                  error={errors.finalCausalityRationale?.message}
                >
                  <Textarea
                    id="finalCausalityRationale"
                    rows={4}
                    placeholder="Describe laboratory testing results, metallurgical/chemical analysis, software defect logs, or clinical evaluation establishing causality or lack thereof..."
                    className="leading-relaxed"
                    {...register("finalCausalityRationale")}
                  />
                </Field>
              </div>
            </SectionCard>

            {/* ---------- Section 4: Conclusions & Final Statements ---------- */}
            <SectionCard
              id="conclusions"
              title="4. Final Conclusions & Regulatory Statements"
              description="Manufacturer final evaluation, benefit-risk profile impact, and formal closing statement."
            >
              <div className="space-y-4">
                <Field
                  label="Final risk assessment summary"
                  htmlFor="finalRiskAssessmentSummary"
                >
                  <Textarea
                    id="finalRiskAssessmentSummary"
                    rows={3}
                    placeholder="Summarize whether overall benefit-risk profile remains favorable or if risk management documentation (FMEA / ISO 14971) requires updating..."
                    className="leading-relaxed"
                    {...register("finalRiskAssessmentSummary")}
                  />
                </Field>

                <Field
                  label="Manufacturer conclusion"
                  htmlFor="manufacturerConclusion"
                  required
                  error={errors.manufacturerConclusion?.message}
                >
                  <Textarea
                    id="manufacturerConclusion"
                    rows={4}
                    placeholder="Final engineering and quality determination regarding device performance, user training, batch conformity, and corrective actions..."
                    className="leading-relaxed"
                    {...register("manufacturerConclusion")}
                  />
                </Field>

                <Field
                  label="Manufacturer final regulatory statement"
                  htmlFor="manufacturerFinalStatement"
                >
                  <Textarea
                    id="manufacturerFinalStatement"
                    rows={3}
                    placeholder="Formal statement to competent authorities closing the incident file and citing any associated CAPA / FSCA reference numbers..."
                    className="leading-relaxed"
                    {...register("manufacturerFinalStatement")}
                  />
                </Field>
              </div>
            </SectionCard>

            {/* ---------- Section 5: Regulatory Roles & Sign-Off ---------- */}
            <SectionCard
              id="roles"
              title="5. Regulatory Review & Final Sign-Off"
              description="Independent review and regulatory sign-off authorizing file closure per 21 CFR Part 11 / ISO 13485."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Prepared by (Investigator)" htmlFor="preparedById">
                    <select
                      id="preparedById"
                      {...register("preparedById")}
                      className={selectClass}
                    >
                      <option value="">Unassigned</option>
                      {allUserOptions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Technical / QA reviewer" htmlFor="reviewedById">
                    <select
                      id="reviewedById"
                      {...register("reviewedById")}
                      className={selectClass}
                    >
                      <option value="">Unassigned</option>
                      {allUserOptions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Regulatory approver (Final Sign-Off)" htmlFor="approvedById">
                    <select
                      id="approvedById"
                      {...register("approvedById")}
                      className={selectClass}
                    >
                      <option value="">Unassigned</option>
                      {allUserOptions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {watchPreparedById && watchApprovedById && watchPreparedById === watchApprovedById && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      21 CFR Part 11 / ISO 13485 recommend independent separation of duties between the final MIR drafter and the sign-off approver.
                    </span>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Footer action link */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href={complaintDetailHref}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel and return to complaint
              </Link>
            </div>
          </fieldset>
        </form>

        {/* ---------- Right Context Aside ---------- */}
        <aside className="space-y-4 xl:sticky xl:top-[120px] xl:self-start">
          <PanelCard title="Final MIR details">
            <dl className="divide-y divide-border text-sm">
              <div className="flex items-start justify-between gap-3 py-2 first:pt-0">
                <dt className="shrink-0 text-xs text-muted-foreground">Complaint</dt>
                <dd className="text-right text-xs font-mono">
                  <Link
                    href={complaintDetailHref}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {complaintNumber}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Status</dt>
                <dd className="text-right text-xs font-medium text-foreground">
                  {humanize(currentStatus)}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">MIR Number</dt>
                <dd className="text-right text-xs font-mono text-foreground">
                  {watchMirNumber || "—"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Authority</dt>
                <dd className="text-right text-xs text-foreground break-words">
                  {watchCompetentAuthority || "—"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Country</dt>
                <dd className="text-right text-xs text-foreground">
                  {watchSubmissionCountry || "—"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Incident Confirmed</dt>
                <dd
                  className={cn(
                    "text-right text-xs font-medium",
                    watchIncidentConfirmed
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                  )}
                >
                  {watchIncidentConfirmed ? "Yes" : "No / Unconfirmed"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Root Cause</dt>
                <dd
                  className={cn(
                    "text-right text-xs font-medium",
                    watchRootCauseConfirmed
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  )}
                >
                  {watchRootCauseConfirmed ? "Identified" : "Undetermined"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Recurrence</dt>
                <dd className="text-right text-xs text-foreground">
                  {humanize(watchRecurrencePotential) || "—"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Submitted</dt>
                <dd className="text-right text-xs font-mono text-foreground">
                  {formatDate(watchSubmissionDate)}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Prepared by</dt>
                <dd className="text-right text-xs text-foreground break-words">
                  {displayedPreparedBy}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Reviewer</dt>
                <dd className="text-right text-xs text-foreground break-words">
                  {displayedReviewedBy}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Approver</dt>
                <dd className="text-right text-xs text-foreground break-words">
                  {displayedApprovedBy}
                </dd>
              </div>

              <div className="flex items-center justify-between py-2 last:pb-0">
                <dt className="text-xs text-muted-foreground">Lock</dt>
                <dd
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    isLockReadOnly
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {isLockReadOnly ? (
                    <>
                      <Lock className="h-3 w-3" /> Held by another user
                    </>
                  ) : (
                    <>
                      <LockOpen className="h-3 w-3" /> Yours
                    </>
                  )}
                </dd>
              </div>
            </dl>
          </PanelCard>
        </aside>
      </div>
    </div>
  );
}
