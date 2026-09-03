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
  Lock,
  LockOpen,
  Paperclip,
  ExternalLink,
  History,
  CheckCircle2,
  Clock4,
  ShieldCheck,
} from "lucide-react";
import {
  CommunicationStatus,
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
import { updateCustomerCommunication } from "@/lib/actions/communication";
import { FileUploader } from "@/components/file-uploader";
import { StatusTransitionTracker } from "@/components/status-transition-tracker";
import { AuditHistoryDrawer } from "@/components/audit/audit-history-drawer";
import { formatUserName, cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types & Schema                                                      */
/* ------------------------------------------------------------------ */

const communicationSchema = z.object({
  status: z.nativeEnum(CommunicationStatus),
  communicationDate: z.date().optional().nullable(),
  questionAsked: z.string().optional().nullable(),
  customerResponse: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  attachments: z.array(
    z.object({
      fileUrl: z.string(),
      fileName: z.string(),
      fileSize: z.number().nullable().optional(),
      mimeType: z.string().nullable().optional(),
    })
  ),
});

type CommunicationFormValues = z.infer<typeof communicationSchema>;

export interface CommunicationDetailData {
  id: string;
  complaintId: string;
  communicationDate: Date | string;
  status: CommunicationStatus;
  questionAsked: string | null;
  customerResponse: string | null;
  internalNotes: string | null;
  authorId: string;
  author?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  attachments?: Array<{
    id?: string;
    fileUrl: string;
    fileName: string;
    fileSize?: number | null;
    mimeType?: string | null;
  }>;
}

export interface CommunicationDetailProps {
  orgSlug?: string;
  complaintNumber?: string;
  communication: CommunicationDetailData;
  onUpdated?: (updated: CommunicationDetailData) => void;
}

/* ------------------------------------------------------------------ */
/* Shared constants & small helpers                                    */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { id: "inquiry", label: "Inquiry Details" },
  { id: "response", label: "Customer Response" },
  { id: "notes", label: "Internal Notes" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];
type Completion = "done" | "attention" | "empty";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

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

export function CommunicationDetail({
  orgSlug,
  complaintNumber,
  communication: initialComm,
  onUpdated,
}: CommunicationDetailProps) {
  const router = useRouter();
  const { isReadOnly: isLockReadOnly } = useRecordLock({
    entityType: LockEntityType.FollowUp,
    recordId: initialComm.id,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSection, setActiveSection] = React.useState<SectionId>("inquiry");
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = React.useState(false);

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
      fallback = "Unknown User"
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
  } = useForm<CommunicationFormValues>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      status: initialComm.status || CommunicationStatus.OPEN,
      communicationDate: parseDate(initialComm.communicationDate),
      questionAsked: initialComm.questionAsked || "",
      customerResponse: initialComm.customerResponse || "",
      internalNotes: initialComm.internalNotes || "",
      attachments:
        initialComm.attachments?.map((a: any) => ({
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
        })) || [],
    },
  });

  /* ---------- Watched values ---------- */

  const currentStatus = watch("status");
  const watchCommunicationDate = watch("communicationDate");
  const watchQuestionAsked = watch("questionAsked");
  const watchCustomerResponse = watch("customerResponse");
  const watchInternalNotes = watch("internalNotes");
  const watchAttachments = watch("attachments");

  const isClosed = currentStatus === CommunicationStatus.CLOSED;
  const isFormDisabled = isClosed || isLockReadOnly;
  const hasCustomerResponse = Boolean(
    watchCustomerResponse && watchCustomerResponse.trim().length > 0
  );

  const authorDisplayName = React.useMemo(() => {
    return resolveUserDisplayName(
      initialComm.author,
      initialComm.authorId,
      "Unknown User"
    );
  }, [initialComm.author, initialComm.authorId, resolveUserDisplayName]);

  /* ---------- Section completion status ---------- */

  const completion = React.useMemo<Record<SectionId, Completion>>(() => {
    // Inquiry completion
    const inquiryComp: Completion =
      watchQuestionAsked && watchQuestionAsked.trim().length > 0
        ? "done"
        : "attention";

    // Customer Response completion
    let responseComp: Completion = "empty";
    if (watchCustomerResponse && watchCustomerResponse.trim().length > 0) {
      responseComp = "done";
    } else if (currentStatus === CommunicationStatus.CLOSED) {
      responseComp = "attention";
    }

    // Internal Notes completion
    const notesComp: Completion =
      watchInternalNotes && watchInternalNotes.trim().length > 0
        ? "done"
        : "empty";

    return {
      inquiry: inquiryComp,
      response: responseComp,
      notes: notesComp,
    };
  }, [watchQuestionAsked, watchCustomerResponse, currentStatus, watchInternalNotes]);

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
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /* ---------- Submit handler ---------- */

  const onSubmit = async (data: CommunicationFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const existingUrls = new Set(
        initialComm.attachments?.map((ea: any) => ea.fileUrl) || []
      );
      const newAttachments = data.attachments.filter(
        (a: any) => !existingUrls.has(a.fileUrl)
      );

      const updated = await updateCustomerCommunication({
        communicationId: initialComm.id,
        status: data.status,
        communicationDate: data.communicationDate
          ? data.communicationDate
          : undefined,
        questionAsked: data.questionAsked || null,
        customerResponse: data.customerResponse || null,
        internalNotes: data.internalNotes || null,
        newAttachments: newAttachments.length > 0 ? newAttachments : undefined,
      });

      const transformed: CommunicationDetailData = {
        ...updated,
        communicationDate: updated.communicationDate.toISOString(),
      };
      onUpdated?.(transformed);

      toast.success("Changes saved");
      router.refresh();
    } catch (err: any) {
      console.error("[Communication Update Error]", err);
      setError(
        err?.message ||
          "Failed to save communication details. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const complaintsHref = orgSlug ? `/${orgSlug}/complaints` : "/complaints";
  const complaintHref = orgSlug
    ? `/${orgSlug}/complaints/${initialComm.complaintId}`
    : `/complaints/${initialComm.complaintId}`;

  return (
    <div ref={rootRef} className="-m-6 lg:-m-8">
      {/* ---------- Sticky record bar ---------- */}
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
                href={complaintHref}
                className="font-mono text-sm font-medium text-foreground hover:underline"
              >
                {complaintNumber || initialComm.complaintId}
              </Link>
              <span className="text-xs text-muted-foreground/60">/</span>
              <span className="text-xs font-medium text-muted-foreground">
                Follow-up #{initialComm.id.slice(-6)}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  currentStatus === CommunicationStatus.CLOSED &&
                    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                  currentStatus === CommunicationStatus.IN_PROGRESS &&
                    "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400",
                  currentStatus === CommunicationStatus.OPEN &&
                    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                  currentStatus === CommunicationStatus.CANCELLED &&
                    "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400"
                )}
              >
                {humanize(currentStatus)}
              </Badge>
              {hasCustomerResponse ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                >
                  Response received
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                >
                  Awaiting response
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 lg:mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAuditDrawerOpen(true)}
                className="gap-1.5 h-8 text-xs"
              >
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Audit log</span>
              </Button>

              <StatusTransitionTracker
                entityType="CustomerCommunication"
                entityId={initialComm.id}
                currentStatus={currentStatus}
                disabled={isFormDisabled}
                onStatusChanged={(newStatus) => {
                  setValue("status", newStatus as CommunicationStatus);
                  router.refresh();
                }}
              />

              <Button
                type="submit"
                form="communication-form"
                size="sm"
                disabled={isSubmitting || isFormDisabled}
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
          <nav
            className="-mb-px mt-2 flex gap-1 overflow-x-auto"
            aria-label="Sections"
          >
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

      {/* ---------- Body ---------- */}
      <div className="grid gap-6 p-6 lg:p-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main form column */}
        <form
          id="communication-form"
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

          <fieldset disabled={isFormDisabled} className="contents space-y-6">
            {/* ---------- Section 1: Manufacturer Inquiry ---------- */}
            <SectionCard
              id="inquiry"
              title="Manufacturer Inquiry & Clarification"
              description="Record the formal question, lot verification, or clarification requested from the customer."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Communication date" required>
                    <Controller
                      control={control}
                      name="communicationDate"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={(d) => field.onChange(d)}
                          placeholder="Select communication date"
                          disabled={isFormDisabled}
                        />
                      )}
                    />
                  </Field>

                  <Field label="Logged by (Author)">
                    <Input
                      value={authorDisplayName}
                      disabled
                      className="bg-muted/40 text-muted-foreground cursor-not-allowed text-xs"
                    />
                  </Field>
                </div>

                <Field
                  label="Question asked / Information requested"
                  htmlFor="questionAsked"
                  required
                  error={errors.questionAsked?.message}
                >
                  <Textarea
                    id="questionAsked"
                    rows={4}
                    placeholder="Log the specific question or clarification requested from the customer (e.g., lot number confirmation, storage conditions, clinical intervention details)..."
                    className="leading-relaxed disabled:bg-muted/30 disabled:cursor-not-allowed"
                    {...register("questionAsked")}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Formally record inquiries sent to the customer, facility, or distributor.
                  </p>
                </Field>
              </div>
            </SectionCard>

            {/* ---------- Section 2: Customer Response ---------- */}
            <SectionCard
              id="response"
              title="Customer Response & Evidence"
              description="Capture the customer's verbal, written, or documented reply and clinical clarifications."
            >
              <div className="space-y-4">
                {/* Banner indicating response state */}
                <div
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    hasCustomerResponse
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : "border-border bg-muted/20"
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      {hasCustomerResponse ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Clock4 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {hasCustomerResponse
                            ? "Customer response logged"
                            : "Awaiting customer response"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {hasCustomerResponse
                            ? "Customer statements and clarifications have been documented below."
                            : "Record the clinic's response once verbal or written feedback is obtained."}
                        </p>
                      </div>
                    </div>
                    {isClosed && (
                      <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                        <Lock className="h-3 w-3" /> Read-Only (Closed)
                      </span>
                    )}
                  </div>
                </div>

                <Field
                  label="Customer response narrative"
                  htmlFor="customerResponse"
                  error={errors.customerResponse?.message}
                >
                  <Textarea
                    id="customerResponse"
                    rows={5}
                    placeholder="Record the customer's response, statements, clinical outcomes, or findings provided..."
                    className="leading-relaxed disabled:bg-muted/30 disabled:cursor-not-allowed"
                    {...register("customerResponse")}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Record verbatim customer feedback, email extracts, or phone call summaries.
                  </p>
                </Field>
              </div>
            </SectionCard>

            {/* ---------- Section 3: Internal Notes ---------- */}
            <SectionCard
              id="notes"
              title="Internal Notes & Investigation Context"
              description="Investigator commentary, follow-up next steps, and internal compliance observations."
            >
              <div className="space-y-4">
                <Field
                  label="Internal review notes"
                  htmlFor="internalNotes"
                  error={errors.internalNotes?.message}
                >
                  <Textarea
                    id="internalNotes"
                    rows={4}
                    placeholder="Internal investigator notes, CAPA linkages, or next actions for complaint team..."
                    className="leading-relaxed disabled:bg-muted/30 disabled:cursor-not-allowed"
                    {...register("internalNotes")}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Confidential internal remarks. Not included in customer-facing summary reports.
                  </p>
                </Field>
              </div>
            </SectionCard>

            {/* Footer action link */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href={complaintHref}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel and return to complaint
              </Link>
            </div>
          </fieldset>
        </form>

        {/* ---------- Right context panel ---------- */}
        <aside className="space-y-4 xl:sticky xl:top-[120px] xl:self-start">
          <PanelCard title="Record details">
            <dl className="divide-y divide-border text-sm">
              <div className="flex items-start justify-between gap-3 py-2 first:pt-0">
                <dt className="shrink-0 text-xs text-muted-foreground">Complaint</dt>
                <dd className="text-right text-xs font-mono">
                  <Link
                    href={complaintHref}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {complaintNumber || initialComm.complaintId}
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
                <dt className="shrink-0 text-xs text-muted-foreground">Response</dt>
                <dd
                  className={cn(
                    "text-right text-xs font-medium",
                    hasCustomerResponse
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {hasCustomerResponse ? "Received" : "Pending"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Date</dt>
                <dd className="text-right text-xs font-mono text-foreground">
                  {formatDate(watchCommunicationDate)}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Author</dt>
                <dd className="text-right text-xs text-foreground break-words">
                  {authorDisplayName}
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
                <Paperclip className="h-3 w-3" /> Attach emails, letters, or defect evidence.
              </p>
            )}
          </PanelCard>

          <PanelCard title="Compliance & Audit">
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>
                  All changes are cryptographically tracked under 21 CFR Part 11 for FDA/ISO audit readiness.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAuditDrawerOpen(true)}
                className="w-full gap-1.5 text-xs h-8"
              >
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <span>View audit history</span>
              </Button>
            </div>
          </PanelCard>
        </aside>
      </div>

      {/* 21 CFR Part 11 Audit History Drawer */}
      <AuditHistoryDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        entityType="CustomerCommunication"
        entityId={initialComm.id}
        title="Customer Communication Audit History"
        subtitle={`Immutable 21 CFR Part 11 audit records for follow-up #${initialComm.id.slice(-8)}`}
        identifier={initialComm.id}
      />
    </div>
  );
}
