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
  ShieldCheck,
  Info,
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
import { updateInitialMIR } from "@/lib/actions/mir";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types & Schema                                                      */
/* ------------------------------------------------------------------ */

const initialMirSchema = z.object({
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
  dueDate: z.date().optional().nullable(),
  initialDeviceRelatedness: z.string().optional().nullable(),
  initialCausalityAssessment: z.string().optional().nullable(),
  initialSeriousnessAssessment: z.string().optional().nullable(),
  initialRiskAssessment: z.string().optional().nullable(),
  preliminaryConclusion: z.string().optional().nullable(),
  investigationStarted: z.boolean().optional(),
  investigationStartDate: z.date().optional().nullable(),
  preparedById: z.string().optional().nullable(),
  reviewedById: z.string().optional().nullable(),
  approvedById: z.string().optional().nullable(),
});

type InitialMIRFormValues = z.infer<typeof initialMirSchema>;

export interface InitialMIREditFormProps {
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
    dueDate?: string | Date | null;
    initialDeviceRelatedness?: string | null;
    initialCausalityAssessment?: string | null;
    initialSeriousnessAssessment?: string | null;
    initialRiskAssessment?: string | null;
    preliminaryConclusion?: string | null;
    investigationStarted?: boolean;
    investigationStartDate?: string | Date | null;
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
  { id: "assessment", label: "Initial Assessment" },
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
  { value: "INITIAL", label: "Initial Report" },
  { value: "FOLLOW_UP", label: "Follow-Up Report" },
  { value: "COMBINED", label: "Combined Initial & Final" },
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

const DEVICE_RELATEDNESS_OPTIONS = [
  { value: "CONFIRMED", label: "Confirmed Device Related" },
  { value: "PROBABLE", label: "Probable" },
  { value: "POSSIBLE", label: "Possible" },
  { value: "UNLIKELY", label: "Unlikely" },
  { value: "NOT_RELATED", label: "Not Related" },
  { value: "UNDER_EVALUATION", label: "Under Evaluation" },
];

const CAUSALITY_OPTIONS = [
  { value: "CAUSAL", label: "Direct Causality Established" },
  { value: "CONTRIBUTORY", label: "Device Contributed to Incident" },
  { value: "COINCIDENTAL", label: "Coincidental / Unrelated Condition" },
  { value: "INCONCLUSIVE", label: "Inconclusive / Pending Investigation" },
];

const SERIOUSNESS_OPTIONS = [
  { value: "DEATH", label: "Death of a Patient or User" },
  { value: "SERIOUS_DETERIORATION", label: "Serious Deterioration in State of Health" },
  { value: "PUBLIC_HEALTH_THREAT", label: "Serious Public Health Threat" },
  { value: "NEAR_INCIDENT", label: "Potential Serious Incident (Near Incident)" },
  { value: "NON_SERIOUS", label: "Non-Serious" },
];

const RISK_ASSESSMENT_OPTIONS = [
  { value: "CRITICAL", label: "Critical (Unacceptable Risk)" },
  { value: "HIGH", label: "High Risk" },
  { value: "MEDIUM", label: "Medium / ALARP" },
  { value: "LOW", label: "Low / Acceptable" },
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

export function InitialMIREditForm({
  orgSlug,
  complaintNumber,
  mir,
  users = [],
}: InitialMIREditFormProps) {
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
  } = useForm<InitialMIRFormValues>({
    resolver: zodResolver(initialMirSchema),
    defaultValues: {
      status: mir.status || MIRStatus.DRAFT,
      reportType: mir.reportType || "INITIAL",
      mirNumber: mir.mirNumber || "",
      manufacturerReference: mir.manufacturerReference || "",
      previousMirReference: mir.previousMirReference || "",
      competentAuthority: mir.competentAuthority || "",
      competentAuthorityReference: mir.competentAuthorityReference || "",
      submissionCountry: mir.submissionCountry || "",
      submissionMethod: mir.submissionMethod || "",
      submittedBy: mir.submittedBy || "",
      submissionDate: parseDate(mir.submissionDate),
      dueDate: parseDate(mir.dueDate),
      initialDeviceRelatedness: mir.initialDeviceRelatedness || "",
      initialCausalityAssessment: mir.initialCausalityAssessment || "",
      initialSeriousnessAssessment: mir.initialSeriousnessAssessment || "",
      initialRiskAssessment: mir.initialRiskAssessment || "",
      preliminaryConclusion: mir.preliminaryConclusion || "",
      investigationStarted: mir.investigationStarted || false,
      investigationStartDate: parseDate(mir.investigationStartDate),
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
  const watchDueDate = watch("dueDate");
  const watchSubmissionDate = watch("submissionDate");
  const watchDeviceRelatedness = watch("initialDeviceRelatedness");
  const watchCausality = watch("initialCausalityAssessment");
  const watchSeriousness = watch("initialSeriousnessAssessment");
  const watchPreliminaryConclusion = watch("preliminaryConclusion");
  const watchInvestigationStarted = watch("investigationStarted");
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
      watchCompetentAuthority || watchSubmissionCountry || watchDueDate || watchSubmissionDate;
    const submissionComp: Completion =
      watchCompetentAuthority && watchDueDate ? "done" : hasAnySubmission ? "attention" : "empty";

    // Assessment
    const hasAnyAssessment =
      watchDeviceRelatedness || watchCausality || watchSeriousness || watchPreliminaryConclusion;
    const assessmentComp: Completion =
      watchDeviceRelatedness && watchPreliminaryConclusion && watchPreliminaryConclusion.trim().length > 0
        ? "done"
        : hasAnyAssessment
        ? "attention"
        : "empty";

    // Roles
    const hasAnyRoles = watchPreparedById || watchReviewedById || watchApprovedById;
    const rolesComp: Completion =
      watchPreparedById && watchApprovedById ? "done" : hasAnyRoles ? "attention" : "empty";

    return {
      identification: idComp,
      submission: submissionComp,
      assessment: assessmentComp,
      roles: rolesComp,
    };
  }, [
    watchMirNumber,
    watchReportType,
    watchManufacturerReference,
    watchCompetentAuthority,
    watchSubmissionCountry,
    watchDueDate,
    watchSubmissionDate,
    watchDeviceRelatedness,
    watchCausality,
    watchSeriousness,
    watchPreliminaryConclusion,
    watchPreparedById,
    watchReviewedById,
    watchApprovedById,
  ]);

  /* ---------- Scroll spy for navigation tabs ---------- */
  const rootRef = React.useRef<HTMLDivElement>(null);

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

      const scrollTop = scroller ? scroller.scrollTop : window.scrollY;
      const viewport = scroller ? scroller.clientHeight : window.innerHeight;
      const scrollHeight = scroller
        ? scroller.scrollHeight
        : document.documentElement.scrollHeight;

      if (scrollTop + viewport >= scrollHeight - 4) {
        setActiveSection(els[els.length - 1].id as SectionId);
        return;
      }

      const line = 140;
      const containerTop = scroller ? scroller.getBoundingClientRect().top : 0;
      let current: SectionId = els[0].id as SectionId;
      for (const el of els) {
        const top = el.getBoundingClientRect().top - containerTop;
        if (top <= line) current = el.id as SectionId;
      }
      setActiveSection(current);
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
  const onSubmit = async (data: InitialMIRFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateInitialMIR(mir.id, {
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
        dueDate: data.dueDate || null,
        initialDeviceRelatedness: data.initialDeviceRelatedness || null,
        initialCausalityAssessment: data.initialCausalityAssessment || null,
        initialSeriousnessAssessment: data.initialSeriousnessAssessment || null,
        initialRiskAssessment: data.initialRiskAssessment || null,
        preliminaryConclusion: data.preliminaryConclusion || null,
        investigationStarted: data.investigationStarted ?? false,
        investigationStartDate: data.investigationStartDate || null,
        preparedById: data.preparedById || null,
        reviewedById: data.reviewedById || null,
        approvedById: data.approvedById || null,
      });

      toast.success("Initial MIR changes saved");
      router.refresh();
    } catch (err: unknown) {
      console.error("[Initial MIR Update Error]", err);
      const message = err instanceof Error ? err.message : "Failed to update Initial MIR report. Please try again.";
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
      <div className="sticky -top-10 z-20 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
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
              <span className="text-sm font-medium text-foreground">Initial MIR</span>
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
                className="border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400"
              >
                Initial Report (Annex I)
              </Badge>
            </div>

            <div className="flex items-center gap-2 lg:mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground hidden sm:inline">Status:</span>
                <select
                  value={currentStatus}
                  disabled={isLockReadOnly || isSubmitting}
                  onChange={(e) => setValue("status", e.target.value as MIRStatus)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {Object.keys(STATUS_LABEL).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                form="initial-mir-form"
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
          id="initial-mir-form"
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
              description="Basic identifiers, MIR reference numbers, and report classification per EUDAMED / Annex I."
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
                      placeholder="Previous report ID if follow-up"
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
              title="2. Competent Authority & Submission"
              description="Target national competent authority, submission method, and statutory reporting timeline."
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
                      list="authority-presets"
                      placeholder="e.g. BfArM, ANSM, MHRA"
                      {...register("competentAuthority")}
                      className={selectClass}
                    />
                    <datalist id="authority-presets">
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
                      placeholder="Authority assigned filing ID"
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Submission method" htmlFor="submissionMethod">
                    <input
                      id="submissionMethod"
                      list="submission-method-presets"
                      placeholder="e.g. EUDAMED XML, Portal"
                      {...register("submissionMethod")}
                      className={selectClass}
                    />
                    <datalist id="submission-method-presets">
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

                  <Field label="Statutory due date" required>
                    <Controller
                      control={control}
                      name="dueDate"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={(d) => field.onChange(d)}
                          placeholder="Select due date"
                          disabled={isLockReadOnly}
                        />
                      )}
                    />
                  </Field>

                  <Field label="Actual submission date">
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

            {/* ---------- Section 3: Initial Assessment & Findings ---------- */}
            <SectionCard
              id="assessment"
              title="3. Initial Assessment & Preliminary Findings"
              description="Preliminary evaluation of device relatedness, causality, seriousness, and investigation initiation."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field
                    label="Device relatedness"
                    htmlFor="initialDeviceRelatedness"
                    required
                  >
                    <select
                      id="initialDeviceRelatedness"
                      {...register("initialDeviceRelatedness")}
                      className={selectClass}
                    >
                      <option value="">Select relatedness...</option>
                      {DEVICE_RELATEDNESS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Causality assessment"
                    htmlFor="initialCausalityAssessment"
                  >
                    <select
                      id="initialCausalityAssessment"
                      {...register("initialCausalityAssessment")}
                      className={selectClass}
                    >
                      <option value="">Select causality...</option>
                      {CAUSALITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Seriousness assessment"
                    htmlFor="initialSeriousnessAssessment"
                  >
                    <select
                      id="initialSeriousnessAssessment"
                      {...register("initialSeriousnessAssessment")}
                      className={selectClass}
                    >
                      <option value="">Select seriousness...</option>
                      {SERIOUSNESS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Initial risk tier"
                    htmlFor="initialRiskAssessment"
                  >
                    <select
                      id="initialRiskAssessment"
                      {...register("initialRiskAssessment")}
                      className={selectClass}
                    >
                      <option value="">Select risk tier...</option>
                      {RISK_ASSESSMENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Investigation initiation banner */}
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Internal investigation initiated?
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Indicate whether sample retrieval, testing, or device history record (DHR) review is underway.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Controller
                        control={control}
                        name="investigationStarted"
                        render={({ field }) => (
                          <div
                            role="radiogroup"
                            className="inline-flex shrink-0 rounded-md border border-border bg-background p-0.5"
                          >
                            {[
                              { label: "No", value: false },
                              { label: "Yes", value: true },
                            ].map((opt) => {
                              const selected = field.value === opt.value;
                              return (
                                <button
                                  key={String(opt.value)}
                                  type="button"
                                  role="radio"
                                  aria-checked={selected}
                                  disabled={isLockReadOnly}
                                  onClick={() => field.onChange(opt.value)}
                                  className={cn(
                                    "rounded px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                    selected
                                      ? "bg-foreground font-medium text-background shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      />

                      {watchInvestigationStarted && (
                        <div className="w-48">
                          <Controller
                            control={control}
                            name="investigationStartDate"
                            render={({ field }) => (
                              <DatePicker
                                value={field.value}
                                onChange={(d) => field.onChange(d)}
                                placeholder="Start date"
                                disabled={isLockReadOnly}
                              />
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Field
                  label="Preliminary conclusion & clinical observations"
                  htmlFor="preliminaryConclusion"
                  required
                  error={errors.preliminaryConclusion?.message}
                >
                  <Textarea
                    id="preliminaryConclusion"
                    rows={4}
                    placeholder="Document preliminary engineering, clinical, or manufacturing assessment and rationale for the initial incident report filing..."
                    className="leading-relaxed"
                    {...register("preliminaryConclusion")}
                  />
                </Field>
              </div>
            </SectionCard>

            {/* ---------- Section 4: Regulatory Roles & Sign-Off ---------- */}
            <SectionCard
              id="roles"
              title="4. Regulatory Review & Sign-Off"
              description="Preparation, independent technical review, and regulatory management authorization."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Prepared by (Drafter)" htmlFor="preparedById">
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

                  <Field label="Regulatory approver (Sign-Off)" htmlFor="approvedById">
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
                      21 CFR Part 11 / ISO 13485 recommend independent separation of duties between the initial MIR drafter and the sign-off approver.
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
          <PanelCard title="Initial MIR details">
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
                <dt className="shrink-0 text-xs text-muted-foreground">Statutory Due</dt>
                <dd className="text-right text-xs font-mono text-foreground">
                  {formatDate(watchDueDate)}
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

          <PanelCard title="Statutory Guidance">
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Info className="h-3.5 w-3.5 mt-0.5 text-sky-500 shrink-0" />
                <p>
                  <strong>EU MDR Article 87(3):</strong> Serious public health threats must be reported within <strong>2 days</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                <p>
                  <strong>EU MDR Article 87(4):</strong> Death or unanticipated serious health deterioration within <strong>10 days</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                <p>
                  <strong>General incidents:</strong> All other reportable incidents within <strong>15 days</strong> of awareness.
                </p>
              </div>
            </div>
          </PanelCard>
        </aside>
      </div>
    </div>
  );
}
