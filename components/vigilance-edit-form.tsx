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
  Paperclip,
  ExternalLink,
} from "lucide-react";
import {
  VigilanceStatus,
  VigilanceReportabilityDecision,
  VigilanceReportType,
  LockEntityType,
} from "@prisma/client";
import { useRecordLock } from "@/hooks/useRecordLock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@clerk/nextjs";
import { updateVigilance } from "@/lib/actions/vigilance";
import { FileUploader } from "@/components/file-uploader";
import { StatusTransitionTracker } from "@/components/status-transition-tracker";
import { formatUserName, cn } from "@/lib/utils";

import { QuestionnaireFlow } from "@/components/vigilance/questionnaire-flow";
import { JurisdictionMatrix } from "@/components/vigilance/jurisdiction-matrix";
import { StoredQuestionAnswer } from "@/lib/vigilance/question-bank";

/* ------------------------------------------------------------------ */
/* Types & Schema                                                      */
/* ------------------------------------------------------------------ */

const vigilanceSchema = z.object({
  status: z.nativeEnum(VigilanceStatus),
  reportable: z.boolean(),
  decision: z.string().optional().nullable(),
  reportType: z.string().optional().nullable(),
  targetRegion: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  approverId: z.string().optional().nullable(),
  awarenessDate: z.date().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  rationale: z.string().optional().nullable(),
  cancelledRationale: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  attachments: z.array(
    z.object({
      fileUrl: z.string(),
      fileName: z.string(),
      fileSize: z.number().nullable().optional(),
      mimeType: z.string().nullable().optional(),
    })
  ),
});

type VigilanceFormValues = z.infer<typeof vigilanceSchema>;

export interface VigilanceEditFormProps {
  orgSlug: string;
  complaintNumber: string;
  initialQuestionAnswers?: StoredQuestionAnswer[];
  initialJurisdictionAssessments?: any[];
  vigilance: {
    id: string;
    complaintId: string;
    status: VigilanceStatus;
    assessmentStage?: string | null;
    reportable: boolean;
    ownerId?: string | null;
    approverId?: string | null;
    targetRegion?: string | null;
    decision?: VigilanceReportabilityDecision | string | null;
    reportType?: VigilanceReportType | string | null;
    awarenessDate?: string | Date | null;
    dueDate?: string | Date | null;
    rationale?: string | null;
    cancelledRationale?: string | null;
    notes?: string | null;
    attachments?: Array<{
      id: string;
      fileUrl: string;
      fileName: string;
      fileSize: number | null;
      mimeType: string | null;
    }>;
    owner?: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
    approver?: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
}

/* ------------------------------------------------------------------ */
/* Shared constants & small helpers                                    */
/* ------------------------------------------------------------------ */

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const SECTIONS = [
  { id: "section-decision", label: "Reportability" },
  { id: "section-timeline", label: "Timeline & Owners" },
  { id: "section-rationale", label: "Rationale & Notes" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];
type Completion = "done" | "attention" | "empty";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  REPORTABLE: "Reportable",
  NOT_REPORTABLE: "Not reportable",
  SUBMITTED: "Submitted",
  CANCELLED: "Cancelled",
};

const DECISION_OPTIONS = [
  { value: "NON_REPORTABLE", label: "Non-Reportable" },
  { value: "REPORTABLE_30_DAY", label: "30-Day Expedited Report" },
  { value: "REPORTABLE_15_DAY", label: "15-Day Expedited Report" },
  { value: "REPORTABLE_5_DAY", label: "5-Day Expedited Report (Serious Threat)" },
  { value: "REPORTABLE_OTHER", label: "Other Mandatory Timeline" },
];

const REPORT_TYPE_OPTIONS = [
  { value: "INITIAL", label: "Initial Report" },
  { value: "FOLLOW_UP", label: "Follow-Up Report" },
  { value: "FINAL", label: "Final Report" },
  { value: "COMBINED_INITIAL_FINAL", label: "Combined Initial & Final" },
];

const TARGET_REGION_PRESETS = [
  "US FDA (21 CFR 803)",
  "EU MDR (2017/745 EUDAMED)",
  "Health Canada (MDR SOR/98-282)",
  "UK MHRA",
  "PMDA (Japan)",
  "TGA (Australia)",
  "ANVISA (Brazil)",
  "NMPA (China)",
  "Global / Multiple Regions",
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

export function VigilanceEditForm({
  orgSlug,
  complaintNumber,
  initialQuestionAnswers = [],
  initialJurisdictionAssessments = [],
  vigilance,
}: VigilanceEditFormProps) {
  const router = useRouter();
  const { isReadOnly: isLockReadOnly } = useRecordLock({
    entityType: LockEntityType.Vigilance,
    recordId: vigilance.id,
  });

  const [activeTab, setActiveTab] = React.useState<"facts" | "global-matrix" | "legacy-form">("facts");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSection, setActiveSection] = React.useState<SectionId>("section-decision");

  const { memberships } = useOrganization({
    memberships: { pageSize: 100, keepPreviousData: true },
  });

  // Map of userId or email/identifier -> formatted Full Name (First + Last Name)
  const memberNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
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
  }, [memberships]);

  const resolveUserDisplayName = React.useCallback(
    (
      user?: {
        id?: string | null;
        email?: string | null;
        firstName?: string | null;
        lastName?: string | null;
      } | null,
      userId?: string | null,
      fallback = "Unassigned"
    ) => {
      if (user) {
        const directFullName = [user.firstName, user.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (directFullName) return directFullName;
      }

      const targetId = userId || user?.id;
      if (targetId && memberNameMap.has(targetId)) {
        return memberNameMap.get(targetId)!;
      }

      if (user?.email && memberNameMap.has(user.email)) {
        return memberNameMap.get(user.email)!;
      }

      if (user) {
        return formatUserName(user, fallback);
      }
      return fallback;
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
  } = useForm<VigilanceFormValues>({
    resolver: zodResolver(vigilanceSchema),
    defaultValues: {
      status: vigilance.status || VigilanceStatus.PENDING,
      reportable: vigilance.reportable ?? false,
      decision: vigilance.decision || "",
      reportType: vigilance.reportType || "",
      targetRegion: vigilance.targetRegion || "",
      ownerId: vigilance.ownerId || "",
      approverId: vigilance.approverId || "",
      awarenessDate: parseDate(vigilance.awarenessDate),
      dueDate: parseDate(vigilance.dueDate),
      rationale: vigilance.rationale || "",
      cancelledRationale: vigilance.cancelledRationale || "",
      notes: vigilance.notes || "",
      attachments:
        vigilance.attachments?.map((a) => ({
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
        })) || [],
    },
  });

  /* ---------- Watched values ---------- */

  const currentStatus = watch("status");
  const watchReportable = watch("reportable");
  const watchDecision = watch("decision");
  const watchReportType = watch("reportType");
  const watchTargetRegion = watch("targetRegion");
  const watchOwnerId = watch("ownerId");
  const watchApproverId = watch("approverId");
  const watchAwarenessDate = watch("awarenessDate");
  const watchDueDate = watch("dueDate");
  const watchRationale = watch("rationale");
  const watchCancelledRationale = watch("cancelledRationale");
  const watchAttachments = watch("attachments");

  const displayedOwner = React.useMemo(() => {
    const currentOwnerId = watchOwnerId !== undefined ? watchOwnerId : vigilance.ownerId;
    if (!currentOwnerId) return "Unassigned";
    return resolveUserDisplayName(vigilance.owner, currentOwnerId, "Unassigned");
  }, [watchOwnerId, vigilance.ownerId, vigilance.owner, resolveUserDisplayName]);

  const displayedApprover = React.useMemo(() => {
    const currentApproverId = watchApproverId !== undefined ? watchApproverId : vigilance.approverId;
    if (!currentApproverId) return "Unassigned";
    return resolveUserDisplayName(vigilance.approver, currentApproverId, "Unassigned");
  }, [watchApproverId, vigilance.approverId, vigilance.approver, resolveUserDisplayName]);

  /* ---------- Section completion status ---------- */

  const completion = React.useMemo<Record<SectionId, Completion>>(() => {
    // Decision completion
    let decisionComp: Completion = "empty";
    if (watchReportable) {
      decisionComp = watchDecision && watchReportType ? "done" : "attention";
    } else {
      decisionComp = watchDecision ? "done" : "attention";
    }

    // Timeline completion
    const hasAnyTimeline = watchAwarenessDate || watchDueDate || watchOwnerId || watchApproverId;
    let timelineComp: Completion = "empty";
    if (hasAnyTimeline) {
      timelineComp = watchAwarenessDate && (!watchReportable || watchDueDate) ? "done" : "attention";
    }

    // Rationale completion
    const rationaleComp: Completion = watchRationale && watchRationale.trim().length > 0 ? "done" : "attention";

    return {
      "section-decision": decisionComp,
      "section-timeline": timelineComp,
      "section-rationale": rationaleComp,
    };
  }, [watchReportable, watchDecision, watchReportType, watchAwarenessDate, watchDueDate, watchOwnerId, watchApproverId, watchRationale]);

  /* ---------- Scroll spy for navigation tabs ---------- */

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
      const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
      if (!els.length) return;

      const containerTop = scroller ? scroller.getBoundingClientRect().top : 0;
      const viewport = scroller ? scroller.clientHeight : window.innerHeight;
      const scrollTop = scroller ? scroller.scrollTop : window.scrollY;
      const scrollHeight = scroller ? scroller.scrollHeight : document.documentElement.scrollHeight;
      const maxScroll = Math.max(0, scrollHeight - viewport);

      const barBottom = (barRef.current?.getBoundingClientRect().bottom ?? 0) - containerTop;
      const line = barBottom + 16;

      // scrollTop at which each section's top would sit on the line
      const thresholds = els.map(
        (el) => scrollTop + el.getBoundingClientRect().top - containerTop - line
      );

      // Compress thresholds the page can't scroll to into the remaining range
      const MIN_RANGE = 48;
      let lastFit = -1;
      for (let i = 0; i < thresholds.length; i++) {
        if (thresholds[i] <= maxScroll - MIN_RANGE) lastFit = i;
      }
      if (lastFit < thresholds.length - 1) {
        const from = lastFit >= 0 ? thresholds[lastFit] : 0;
        const span = thresholds[thresholds.length - 1] - from;
        for (let i = lastFit + 1; i < thresholds.length; i++) {
          thresholds[i] =
            span > 0 ? from + ((thresholds[i] - from) / span) * (maxScroll - from) : maxScroll;
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
  }, []);;

  const scrollTo = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ---------- Submit handler ---------- */

  const onSubmit = async (data: VigilanceFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateVigilance({
        id: vigilance.id,
        orgSlug,
        status: data.status,
        reportable: data.reportable,
        decision: data.decision || null,
        reportType: data.reportType || null,
        targetRegion: data.targetRegion || null,
        ownerId: data.ownerId || null,
        approverId: data.approverId || null,
        awarenessDate: data.awarenessDate ? data.awarenessDate.toISOString() : null,
        dueDate: data.dueDate ? data.dueDate.toISOString() : null,
        rationale: data.rationale || null,
        cancelledRationale: data.cancelledRationale || null,
        notes: data.notes || null,
        newAttachments: data.attachments.filter(
          (a) => !vigilance.attachments?.some((ea: any) => ea.fileUrl === a.fileUrl)
        ),
      });

      toast.success("Changes saved");
      router.refresh();
    } catch (err: any) {
      console.error("[Vigilance Update Error]", err);
      setError(err?.message || "Failed to save vigilance assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={rootRef} className="-m-6 lg:-m-8">
      {/* ---------- Sticky record bar ---------- */}
      <div ref={barRef} className="sticky -top-10 z-20 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        {/* Top breadcrumb & action bar */}
        <div className="border-b border-border/50 px-6 py-3 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Link
                href="/complaints"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Complaints
              </Link>
              <span className="text-xs text-muted-foreground/60">/</span>
              <Link
                href={`/complaints/${vigilance.complaintId}`}
                className="text-xs font-mono text-muted-foreground transition-colors hover:text-foreground"
              >
                {complaintNumber}
              </Link>
              <span className="text-xs text-muted-foreground/60">/</span>
              <span className="text-sm font-medium text-foreground">Vigilance</span>
              <Badge
                variant="outline"
                className={cn(
                  currentStatus === VigilanceStatus.SUBMITTED &&
                    "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400",
                  currentStatus === VigilanceStatus.REPORTABLE &&
                    "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
                  currentStatus === VigilanceStatus.NOT_REPORTABLE &&
                    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                  currentStatus === VigilanceStatus.CANCELLED &&
                    "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
                  currentStatus === VigilanceStatus.PENDING &&
                    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                )}
              >
                {humanize(currentStatus)}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <StatusTransitionTracker
                entityType="Vigilance"
                entityId={vigilance.id}
                currentStatus={currentStatus}
                disabled={isLockReadOnly}
                onStatusChanged={(newStatus) => {
                  setValue("status", newStatus as VigilanceStatus);
                  router.refresh();
                }}
              />
              <Button
                type="submit"
                form="vigilance-form"
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
        </div>

        {/* Header: Primary View Navigation */}
        <div className="border-b border-border/60 px-6 lg:px-8">
          <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Vigilance Header Navigation">
            {[
              { id: "legacy-form", label: "Decision Record" },
              { id: "facts", label: "Canonical Facts" },
              { id: "global-matrix", label: "Global Determinations" },
            ].map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as any)}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
                    active
                      ? "border-foreground font-semibold text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Subheader: Reportability, Timeline, Rationale */}
        <div className="px-6 lg:px-8">
          <nav className="-mb-px flex items-center gap-1 overflow-x-auto" aria-label="Subheader Navigation">
            {SECTIONS.map((s) => {
              const active = activeTab === "legacy-form" && activeSection === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (activeTab !== "legacy-form") {
                      setActiveTab("legacy-form");
                      setTimeout(() => scrollTo(s.id), 50);
                    } else {
                      scrollTo(s.id);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-xs transition-colors bg-transparent",
                    active
                      ? "border-foreground font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <CompletionDot state={completion[s.id]} />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ---------- Body ---------- */}
      <div className="grid gap-6 p-6 lg:p-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main column */}
        <div className="min-w-0 max-w-5xl space-y-6">
          {activeTab === "facts" && (
            <QuestionnaireFlow
              complaintId={vigilance.complaintId}
              vigilanceId={vigilance.id}
              orgSlug={orgSlug}
              initialAnswers={initialQuestionAnswers}
              isReadOnly={isLockReadOnly}
              onAssessmentsUpdated={() => router.refresh()}
            />
          )}

          {activeTab === "global-matrix" && (
            <JurisdictionMatrix
              complaintId={vigilance.complaintId}
              orgSlug={orgSlug}
              assessments={initialJurisdictionAssessments}
              isReadOnly={isLockReadOnly}
              onRefresh={() => router.refresh()}
            />
          )}

          {activeTab === "legacy-form" && (
            <form
              id="vigilance-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
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
            {/* ---------- Section 1: Reportability ---------- */}
            <SectionCard
              id="section-decision"
              title="Reportability & Classification"
              description="Determine reportability status, regulatory decision classification, and authority filing tier."
            >
              <div className="space-y-4">
                {/* Segmented control banner for reportability */}
                <div
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    watchReportable
                      ? "border-red-500/30 bg-red-500/10"
                      : "border-border bg-muted/20"
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          watchReportable
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                        )}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Is this adverse incident reportable to regulatory authorities?
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Reportable incidents require expedited notification to competent authorities (e.g. FDA, MDR).
                        </p>
                      </div>
                    </div>
                    <Controller
                      control={control}
                      name="reportable"
                      render={({ field }) => (
                        <div
                          role="radiogroup"
                          className="inline-flex shrink-0 rounded-md border border-border bg-background p-0.5"
                        >
                          {[
                            { label: "Non-Reportable", value: false },
                            { label: "Reportable", value: true },
                          ].map((opt) => {
                            const selected = field.value === opt.value;
                            return (
                              <button
                                key={String(opt.value)}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => field.onChange(opt.value)}
                                className={cn(
                                  "rounded px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                  selected
                                    ? opt.value
                                      ? "bg-red-600 font-medium text-white shadow-xs"
                                      : "bg-foreground font-medium text-background shadow-xs"
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
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field
                    label="Regulatory decision"
                    htmlFor="decision"
                    required={watchReportable}
                    error={errors.decision?.message}
                  >
                    <select
                      id="decision"
                      {...register("decision")}
                      className={selectClass}
                    >
                      <option value="">Select decision...</option>
                      {DECISION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Report type"
                    htmlFor="reportType"
                    required={watchReportable}
                    error={errors.reportType?.message}
                  >
                    <select
                      id="reportType"
                      {...register("reportType")}
                      className={selectClass}
                    >
                      <option value="">Select report type...</option>
                      {REPORT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Target jurisdiction / authority"
                    htmlFor="targetRegion"
                  >
                    <input
                      id="targetRegion"
                      list="target-region-presets"
                      placeholder="e.g. US FDA, EU MDR"
                      {...register("targetRegion")}
                      className={selectClass}
                    />
                    <datalist id="target-region-presets">
                      {TARGET_REGION_PRESETS.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* ---------- Section 2: Timeline & Owners ---------- */}
            <SectionCard
              id="section-timeline"
              title="Timeline & Regulatory Roles"
              description="Statutory deadlines, manufacturer awareness dates, and separation of review duties."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Awareness date">
                    <Controller
                      control={control}
                      name="awarenessDate"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={(d) => field.onChange(d)}
                          placeholder="Select awareness date"
                        />
                      )}
                    />
                  </Field>

                  <Field label="Statutory due date" required={watchReportable}>
                    <Controller
                      control={control}
                      name="dueDate"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={(d) => field.onChange(d)}
                          placeholder="Select due date"
                        />
                      )}
                    />
                  </Field>

                  <Field label="Assessment drafter / owner" htmlFor="ownerId">
                    <select
                      id="ownerId"
                      {...register("ownerId")}
                      className={selectClass}
                    >
                      <option value="">Unassigned</option>
                      {memberships?.data?.map((m) => (
                        <option
                          key={m.publicUserData?.userId || m.id}
                          value={m.publicUserData?.userId || ""}
                        >
                          {formatUserName(m.publicUserData, "User")}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Regulatory approver" htmlFor="approverId">
                    <select
                      id="approverId"
                      {...register("approverId")}
                      className={selectClass}
                    >
                      <option value="">Unassigned</option>
                      {memberships?.data?.map((m) => (
                        <option
                          key={m.publicUserData?.userId || m.id}
                          value={m.publicUserData?.userId || ""}
                        >
                          {formatUserName(m.publicUserData, "User")}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                {watchOwnerId && watchApproverId && watchOwnerId === watchApproverId && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      21 CFR Part 11 / ISO 13485 recommend independent separation of duties between the drafter and the sign-off approver.
                    </span>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* ---------- Section 3: Rationale & Notes ---------- */}
            <SectionCard
              id="section-rationale"
              title="Clinical & Regulatory Rationale"
              description="Document legal justification, authority communication, or rationale for non-reportability."
            >
              <div className="space-y-4">
                <Field
                  label="Decision rationale"
                  htmlFor="rationale"
                  required
                  error={errors.rationale?.message}
                >
                  <Textarea
                    id="rationale"
                    rows={5}
                    placeholder="Provide full technical, clinical, and regulatory reasoning for the reportability decision citing relevant legislation (e.g. MDR Art 87, 21 CFR 803)..."
                    className="leading-relaxed"
                    {...register("rationale")}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Cancellation rationale" htmlFor="cancelledRationale">
                    <Textarea
                      id="cancelledRationale"
                      rows={3}
                      placeholder="Document rationale if this vigilance assessment was cancelled, superseded, or withdrawn..."
                      {...register("cancelledRationale")}
                    />
                  </Field>

                  <Field label="Internal review notes" htmlFor="notes">
                    <Textarea
                      id="notes"
                      rows={3}
                      placeholder="Internal team notes, authority communication reference numbers, or submission tracking details..."
                      {...register("notes")}
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* Footer action link */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href={`/complaints/${vigilance.complaintId}`}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel and return to complaint
              </Link>
            </div>
          </fieldset>
        </form>
        )}
      </div>

        {/* ---------- Right context panel ---------- */}
        <aside className="space-y-4 xl:sticky xl:top-[120px] xl:self-start">
          <PanelCard title="Assessment details">
            <dl className="divide-y divide-border text-sm">
              <div className="flex items-start justify-between gap-3 py-2 first:pt-0">
                <dt className="shrink-0 text-xs text-muted-foreground">Complaint</dt>
                <dd className="text-right text-xs font-mono">
                  <Link
                    href={`/complaints/${vigilance.complaintId}`}
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
                <dt className="shrink-0 text-xs text-muted-foreground">Reportable</dt>
                <dd
                  className={cn(
                    "text-right text-xs font-medium",
                    watchReportable
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {watchReportable ? "Yes (Mandatory)" : "No (Exempt)"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Decision</dt>
                <dd className="text-right text-xs text-foreground">
                  {humanize(watchDecision) || "—"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Report type</dt>
                <dd className="text-right text-xs text-foreground">
                  {humanize(watchReportType) || "—"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Jurisdiction</dt>
                <dd className="text-right text-xs text-foreground break-words">
                  {watchTargetRegion || "—"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Due date</dt>
                <dd className="text-right text-xs font-mono text-foreground">
                  {formatDate(watchDueDate)}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Drafter</dt>
                <dd className="text-right text-xs text-foreground break-words">
                  {displayedOwner}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Approver</dt>
                <dd className="text-right text-xs text-foreground break-words">
                  {displayedApprover}
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

          <PanelCard title={`Attachments · ${watchAttachments?.length ?? 0}`}>
            <Controller
              control={control}
              name="attachments"
              render={({ field }) => (
                <FileUploader
                  attachments={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {(watchAttachments?.length ?? 0) === 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip className="h-3 w-3" /> Attach regulatory correspondence, forms, or decisions.
              </p>
            )}
          </PanelCard>
        </aside>
      </div>
    </div>
  );
}
