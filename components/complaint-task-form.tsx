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
  TaskStatus,
  TaskType,
  TaskSubType,
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
import { FileUploader } from "@/components/file-uploader";
import { StatusTransitionTracker } from "@/components/status-transition-tracker";
import { AuditHistoryDrawer } from "@/components/audit/audit-history-drawer";
import { formatUserName, cn } from "@/lib/utils";
import { createComplaintTask, updateComplaintTask } from "@/lib/actions/task";

/* ------------------------------------------------------------------ */
/* Types & Schema                                                      */
/* ------------------------------------------------------------------ */

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  [TaskType.CORRECTION]: "Correction",
  [TaskType.CUSTOMER_FOLLOW_UP]: "Customer Follow-Up",
  [TaskType.INTERNAL_FOLLOW_UP]: "Internal Follow-Up",
  [TaskType.REGULATORY_TASK]: "Regulatory Task",
};

export const TASK_SUB_TYPE_LABELS: Record<TaskSubType, string> = {
  [TaskSubType.RISK_REVIEW]: "Risk Review",
  [TaskSubType.COMPLAINT_HISTORY_REVIEW]: "Complaint History Review",
  [TaskSubType.HAZARD_DECISION_INVESTIGATION_FOLLOW_UP]:
    "Hazard Decision Investigation Follow-Up",
  [TaskSubType.MANUFACTURING_DEFECT_IDENTIFIED]:
    "Manufacturing Defect Identified",
  [TaskSubType.COMPLAINT_HISTORY_REVIEW_IDENTIFIED_ISSUE]:
    "Complaint History Review Identified Issue",
  [TaskSubType.DESIGN_ISSUE_DETECTED]: "Design Issue Detected",
  [TaskSubType.OTHER]: "Other",
};

export const taskFormSchema = z
  .object({
    shortDescription: z.string().min(1, "Short description is required"),
    taskDescription: z.string().optional().nullable(),
    taskType: z.nativeEnum(TaskType),
    taskSubType: z.nativeEnum(TaskSubType).optional().nullable(),
    assignedToId: z.string().optional().nullable(),
    dateDue: z.date().optional().nullable(),
    status: z.nativeEnum(TaskStatus),
    attachments: z.array(
      z.object({
        fileUrl: z.string(),
        fileName: z.string(),
        fileSize: z.number().nullable().optional(),
        mimeType: z.string().nullable().optional(),
      })
    ),
  })
  .refine(
    (data) => {
      if (data.taskType === TaskType.INTERNAL_FOLLOW_UP) {
        return !!data.taskSubType;
      }
      return true;
    },
    {
      message: "Sub-Type is required for Internal Follow-up tasks",
      path: ["taskSubType"],
    }
  );

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export interface ComplaintTaskData {
  id?: string;
  complaintId: string;
  shortDescription?: string;
  taskDescription?: string | null;
  taskType?: TaskType;
  taskSubType?: TaskSubType | null;
  assignedToId?: string | null;
  originatorId?: string;
  dateOfRequest?: Date | string;
  dateDue?: Date | string | null;
  status?: TaskStatus;
  originator?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  assignedTo?: {
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

export interface ComplaintTaskFormProps {
  orgSlug: string;
  complaintId: string;
  complaintNumber?: string;
  task?: ComplaintTaskData | null;
  onUpdated?: (updated: ComplaintTaskData) => void;
}

/* ------------------------------------------------------------------ */
/* Shared constants & small helpers                                    */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { id: "overview", label: "Task Overview" },
  { id: "assignment", label: "Assignment & Schedule" },
  { id: "instructions", label: "Instructions & Scope" },
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

export function ComplaintTaskForm({
  orgSlug,
  complaintId,
  complaintNumber,
  task: initialTask,
  onUpdated,
}: ComplaintTaskFormProps) {
  const router = useRouter();
  const isNew = !initialTask?.id;

  const { isReadOnly: isLockReadOnly } = useRecordLock({
    entityType: LockEntityType.Task,
    recordId: initialTask?.id || "",
    enabled: !isNew,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSection, setActiveSection] = React.useState<SectionId>("overview");
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = React.useState(false);

  const { memberships } = useOrganization({
    memberships: { pageSize: 100, keepPreviousData: true },
  });

  // Map of userId or email/identifier -> formatted Full Name
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
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      shortDescription: initialTask?.shortDescription || "",
      taskDescription: initialTask?.taskDescription || "",
      taskType: initialTask?.taskType || TaskType.CORRECTION,
      taskSubType: initialTask?.taskSubType || null,
      assignedToId: initialTask?.assignedToId || "",
      dateDue: parseDate(initialTask?.dateDue),
      status: initialTask?.status || TaskStatus.OPEN,
      attachments:
        initialTask?.attachments?.map((a: any) => ({
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
        })) || [],
    },
  });

  /* ---------- Watched values ---------- */

  const currentStatus = watch("status");
  const watchTaskType = watch("taskType");
  const watchTaskSubType = watch("taskSubType");
  const watchShortDescription = watch("shortDescription");
  const watchTaskDescription = watch("taskDescription");
  const watchAssignedToId = watch("assignedToId");
  const watchDateDue = watch("dateDue");
  const watchAttachments = watch("attachments");

  // Reset taskSubType when taskType is changed from INTERNAL_FOLLOW_UP
  React.useEffect(() => {
    if (watchTaskType !== TaskType.INTERNAL_FOLLOW_UP) {
      setValue("taskSubType", null);
    }
  }, [watchTaskType, setValue]);

  const isClosed = currentStatus === TaskStatus.CLOSED;
  const isFormDisabled = !isNew && (isClosed || isLockReadOnly);
  const isAssigned = Boolean(watchAssignedToId && watchAssignedToId.trim().length > 0);

  const assignedDisplayName = React.useMemo(() => {
    if (!watchAssignedToId) return "Unassigned";
    if (memberNameMap.has(watchAssignedToId)) {
      return memberNameMap.get(watchAssignedToId)!;
    }
    if (initialTask?.assignedToId === watchAssignedToId && initialTask.assignedTo) {
      return resolveUserDisplayName(
        initialTask.assignedTo,
        initialTask.assignedToId,
        "Assigned"
      );
    }
    return "Assigned";
  }, [
    watchAssignedToId,
    memberNameMap,
    initialTask?.assignedToId,
    initialTask?.assignedTo,
    resolveUserDisplayName,
  ]);

  const originatorDisplayName = React.useMemo(() => {
    if (isNew) return "Current User (Creator)";
    return resolveUserDisplayName(
      initialTask?.originator,
      initialTask?.originatorId,
      "Unknown User"
    );
  }, [
    isNew,
    initialTask?.originator,
    initialTask?.originatorId,
    resolveUserDisplayName,
  ]);

  /* ---------- Section completion status ---------- */

  const completion = React.useMemo<Record<SectionId, Completion>>(() => {
    // Overview completion
    let overviewComp: Completion = "attention";
    const hasShortDesc = Boolean(
      watchShortDescription && watchShortDescription.trim().length > 0
    );
    const hasSubTypeIfNeeded =
      watchTaskType !== TaskType.INTERNAL_FOLLOW_UP || Boolean(watchTaskSubType);
    if (hasShortDesc && hasSubTypeIfNeeded) {
      overviewComp = "done";
    }

    // Assignment completion
    let assignComp: Completion = "empty";
    if (isAssigned) {
      assignComp = "done";
    } else if (
      currentStatus === TaskStatus.IN_PROGRESS ||
      currentStatus === TaskStatus.CLOSED
    ) {
      assignComp = "attention";
    }

    // Instructions completion
    const instrComp: Completion =
      watchTaskDescription && watchTaskDescription.trim().length > 0
        ? "done"
        : "empty";

    return {
      overview: overviewComp,
      assignment: assignComp,
      instructions: instrComp,
    };
  }, [
    watchShortDescription,
    watchTaskType,
    watchTaskSubType,
    isAssigned,
    currentStatus,
    watchTaskDescription,
  ]);

  /* ---------- Scroll spy for navigation tabs ---------- */

  const rootRef = React.useRef<HTMLDivElement>(null);
  const pinnedRef = React.useRef<SectionId | null>(null);

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

    const LINE = 140; // px below the top of the scroll container

    const update = () => {
      if (pinnedRef.current) return;

      const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
        Boolean
      ) as HTMLElement[];
      if (els.length === 0) return;

      const scrollTop = scroller ? scroller.scrollTop : window.scrollY;
      const viewport = scroller ? scroller.clientHeight : window.innerHeight;
      const scrollHeight = scroller
        ? scroller.scrollHeight
        : document.documentElement.scrollHeight;
      const maxScroll = Math.max(0, scrollHeight - viewport);
      const containerTop = scroller ? scroller.getBoundingClientRect().top : 0;

      const thresholds = els.map((el, i) =>
        i === 0
          ? 0
          : el.getBoundingClientRect().top - containerTop + scrollTop - LINE
      );

      const k = thresholds.findIndex((t) => t > maxScroll);
      if (k > 0) {
        const base = thresholds[k - 1];
        const room = maxScroll - base;
        const count = thresholds.length - k;
        for (let i = k; i < thresholds.length; i++) {
          thresholds[i] = base + (room * (i - k + 1)) / count;
        }
      }

      let current = 0;
      for (let i = 0; i < thresholds.length; i++) {
        if (scrollTop >= thresholds[i] - 1) current = i;
      }
      setActiveSection(els[current].id as SectionId);
    };

    const unpin = () => {
      if (!pinnedRef.current) return;
      pinnedRef.current = null;
      update();
    };
    const onKey = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(
          e.key
        )
      )
        unpin();
    };

    update();
    target.addEventListener("scroll", update, { passive: true });
    target.addEventListener("wheel", unpin, { passive: true });
    target.addEventListener("touchmove", unpin, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", update);
    return () => {
      target.removeEventListener("scroll", update);
      target.removeEventListener("wheel", unpin);
      target.removeEventListener("touchmove", unpin);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollTo = (id: SectionId) => {
    pinnedRef.current = id;
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /* ---------- Submit handler ---------- */

  const onSubmit = async (data: TaskFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isNew) {
        const created = await createComplaintTask({
          orgSlug,
          complaintId,
          shortDescription: data.shortDescription,
          taskDescription: data.taskDescription || null,
          taskType: data.taskType,
          taskSubType:
            data.taskType === TaskType.INTERNAL_FOLLOW_UP
              ? data.taskSubType || null
              : null,
          assignedToId: data.assignedToId || null,
          dateDue: data.dateDue ? data.dateDue : null,
          status: data.status,
          attachments: data.attachments,
        });

        toast.success("Task created", {
          description: `Task "${created.shortDescription}" created successfully.`,
        });
        router.push(`/${orgSlug}/complaints/${complaintId}`);
        router.refresh();
      } else {
        const existingUrls = new Set(
          initialTask.attachments?.map((ea: any) => ea.fileUrl) || []
        );
        const newAttachments = data.attachments.filter(
          (a: any) => !existingUrls.has(a.fileUrl)
        );

        const updated = await updateComplaintTask({
          id: initialTask.id!,
          orgSlug,
          shortDescription: data.shortDescription,
          taskDescription: data.taskDescription || null,
          taskType: data.taskType,
          taskSubType:
            data.taskType === TaskType.INTERNAL_FOLLOW_UP
              ? data.taskSubType || null
              : null,
          assignedToId: data.assignedToId || null,
          dateDue: data.dateDue ? data.dateDue : null,
          status: data.status,
          newAttachments:
            newAttachments.length > 0 ? newAttachments : undefined,
        });

        if (onUpdated && updated) {
          onUpdated({
            ...updated,
            dateOfRequest: updated.dateOfRequest.toISOString(),
            dateDue: updated.dateDue ? updated.dateDue.toISOString() : null,
          });
        }

        toast.success("Changes saved");
        router.refresh();
      }
    } catch (err: any) {
      console.error("[ComplaintTask Form Error]", err);
      const errorMessage =
        err?.message || "Failed to save task details. Please try again.";
      setError(errorMessage);
      toast.error("Save Failed", { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const complaintsHref = orgSlug ? `/${orgSlug}/complaints` : "/complaints";
  const complaintHref = orgSlug
    ? `/${orgSlug}/complaints/${complaintId}`
    : `/complaints/${complaintId}`;

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
                className="text-xs font-mono text-muted-foreground transition-colors hover:text-foreground"
              >
                {complaintNumber || complaintId}
              </Link>
              <span className="text-xs text-muted-foreground/60">/</span>
              <span className="text-sm font-medium text-foreground">
                {isNew
                  ? "New Task"
                  : initialTask?.id
                  ? `Task #${initialTask.id.slice(-6)}`
                  : "Task"}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  currentStatus === TaskStatus.CLOSED &&
                    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                  currentStatus === TaskStatus.IN_PROGRESS &&
                    "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400",
                  currentStatus === TaskStatus.OPEN &&
                    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                  currentStatus === TaskStatus.CANCELLED &&
                    "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400"
                )}
              >
                {humanize(currentStatus)}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  isAssigned
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                )}
              >
                {isAssigned ? "Assigned" : "Unassigned"}
              </Badge>
              <Badge
                variant="outline"
                className="border-border bg-muted/30 text-muted-foreground"
              >
                {TASK_TYPE_LABELS[watchTaskType] || humanize(watchTaskType)}
              </Badge>
            </div>

            <div className="flex items-center gap-2 lg:mt-2">
              {!isNew && initialTask?.id && (
                <StatusTransitionTracker
                  entityType="ComplaintTask"
                  entityId={initialTask.id}
                  currentStatus={currentStatus}
                  disabled={isLockReadOnly}
                  onStatusChanged={(newStatus) => {
                    setValue("status", newStatus as TaskStatus);
                    router.refresh();
                  }}
                />
              )}

              <Button
                type="submit"
                form="task-form"
                size="sm"
                disabled={isSubmitting || isFormDisabled}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {isSubmitting
                  ? isNew
                    ? "Creating…"
                    : "Saving…"
                  : isNew
                  ? "Create task"
                  : "Save changes"}
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
          id="task-form"
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
            {/* ---------- Section 1: Task Overview ---------- */}
            <SectionCard
              id="overview"
              title="Task Overview & Classification"
              description="Define the task purpose, action type, and required follow-up category."
            >
              <div className="space-y-4">
                <Field
                  label="Short description"
                  htmlFor="shortDescription"
                  required
                  error={errors.shortDescription?.message}
                >
                  <Input
                    id="shortDescription"
                    placeholder="e.g., Conduct batch retention inspection, Customer replacement follow-up..."
                    className="text-xs disabled:bg-muted/30 disabled:cursor-not-allowed"
                    {...register("shortDescription")}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Clear and concise summary displayed across complaint sub-workflows and action logs.
                  </p>
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Task type" htmlFor="taskType" required>
                    <select
                      id="taskType"
                      disabled={isFormDisabled}
                      {...register("taskType")}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                    >
                      <option value={TaskType.CORRECTION}>Correction</option>
                      <option value={TaskType.CUSTOMER_FOLLOW_UP}>
                        Customer Follow-Up
                      </option>
                      <option value={TaskType.INTERNAL_FOLLOW_UP}>
                        Internal Follow-Up
                      </option>
                      <option value={TaskType.REGULATORY_TASK}>
                        Regulatory Task
                      </option>
                    </select>
                  </Field>

                  {watchTaskType === TaskType.INTERNAL_FOLLOW_UP ? (
                    <Field
                      label="Internal follow-up sub-type"
                      htmlFor="taskSubType"
                      required
                      error={errors.taskSubType?.message}
                    >
                      <select
                        id="taskSubType"
                        disabled={isFormDisabled}
                        {...register("taskSubType")}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                      >
                        <option value="">Select Sub-Type...</option>
                        {Object.entries(TASK_SUB_TYPE_LABELS).map(
                          ([val, label]) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </Field>
                  ) : (
                    <Field label="Status lifecycle">
                      <Input
                        value={`${humanize(currentStatus)} (${
                          isNew ? "Initial Creation" : "Controlled Lifecycle"
                        })`}
                        disabled
                        className="bg-muted/40 text-muted-foreground cursor-not-allowed text-xs"
                      />
                    </Field>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* ---------- Section 2: Assignment & Schedule ---------- */}
            <SectionCard
              id="assignment"
              title="Assignment & Schedule"
              description="Assign team member ownership, deadlines, and review tracking parameters."
            >
              <div className="space-y-4">
                {/* Banner indicating assignment state */}
                <div
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    isAssigned
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : "border-border bg-muted/20"
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      {isAssigned ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Clock4 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {isAssigned
                            ? `Task assigned to ${assignedDisplayName}`
                            : "Awaiting task assignment"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isAssigned
                            ? "Assignee is responsible for executing this sub-workflow and uploading deliverables."
                            : "Select an organization member to delegate this task and enforce accountability."}
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Assigned to" htmlFor="assignedToId">
                    <select
                      id="assignedToId"
                      disabled={isFormDisabled}
                      {...register("assignedToId")}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
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

                  <Field label="Due date">
                    <Controller
                      control={control}
                      name="dateDue"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={(d) => field.onChange(d)}
                          placeholder="Select due date"
                          disabled={isFormDisabled}
                        />
                      )}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Requested by (Originator)">
                    <Input
                      value={originatorDisplayName}
                      disabled
                      className="bg-muted/40 text-muted-foreground cursor-not-allowed text-xs"
                    />
                  </Field>

                  <Field label="Date of request">
                    <Input
                      value={formatDate(
                        initialTask?.dateOfRequest || (isNew ? new Date() : null)
                      )}
                      disabled
                      className="bg-muted/40 text-muted-foreground cursor-not-allowed text-xs font-mono"
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* ---------- Section 3: Task Description & Instructions ---------- */}
            <SectionCard
              id="instructions"
              title="Task Description & Instructions"
              description="Provide comprehensive delegation instructions, protocol references, and expected outputs."
            >
              <div className="space-y-4">
                <Field
                  label="Task description & instructions"
                  htmlFor="taskDescription"
                  error={errors.taskDescription?.message}
                >
                  <Textarea
                    id="taskDescription"
                    rows={5}
                    placeholder="Provide detailed instructions, expected outputs, testing protocols, or follow-up notes..."
                    className="leading-relaxed disabled:bg-muted/30 disabled:cursor-not-allowed text-xs"
                    {...register("taskDescription")}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Detailed delegation instructions visible to the assignee and captured in the 21 CFR Part 11 audit record.
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
                    {complaintNumber || complaintId}
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
                <dt className="shrink-0 text-xs text-muted-foreground">Type</dt>
                <dd className="text-right text-xs text-foreground">
                  {TASK_TYPE_LABELS[watchTaskType] || humanize(watchTaskType)}
                </dd>
              </div>

              {watchTaskType === TaskType.INTERNAL_FOLLOW_UP && watchTaskSubType && (
                <div className="flex items-start justify-between gap-3 py-2">
                  <dt className="shrink-0 text-xs text-muted-foreground">Sub-Type</dt>
                  <dd className="text-right text-xs text-foreground">
                    {TASK_SUB_TYPE_LABELS[watchTaskSubType] ||
                      humanize(watchTaskSubType)}
                  </dd>
                </div>
              )}

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Assignee</dt>
                <dd
                  className={cn(
                    "text-right text-xs font-medium break-words",
                    isAssigned
                      ? "text-foreground"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {assignedDisplayName}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Due Date</dt>
                <dd className="text-right text-xs font-mono text-foreground">
                  {formatDate(watchDateDue)}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Originator</dt>
                <dd className="text-right text-xs text-foreground break-words">
                  {originatorDisplayName}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Requested</dt>
                <dd className="text-right text-xs font-mono text-foreground">
                  {formatDate(
                    initialTask?.dateOfRequest || (isNew ? new Date() : null)
                  )}
                </dd>
              </div>

              <div className="flex items-center justify-between py-2 last:pb-0">
                <dt className="text-xs text-muted-foreground">Lock</dt>
                <dd
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    isNew
                      ? "text-muted-foreground"
                      : isLockReadOnly
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {isNew ? (
                    "New record"
                  ) : isLockReadOnly ? (
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
                  disabled={isFormDisabled}
                />
              )}
            />
            {(watchAttachments?.length ?? 0) === 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip className="h-3 w-3" /> Attach inspection reports, testing protocols, or corrective evidence.
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
                disabled={isNew}
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
      {!isNew && initialTask?.id && (
        <AuditHistoryDrawer
          isOpen={isAuditDrawerOpen}
          onClose={() => setIsAuditDrawerOpen(false)}
          entityType="ComplaintTask"
          entityId={initialTask.id}
          title="Complaint Task Audit History"
          subtitle={`Immutable 21 CFR Part 11 audit records for task #${initialTask.id.slice(-8)}`}
          identifier={initialTask.id}
        />
      )}
    </div>
  );
}
