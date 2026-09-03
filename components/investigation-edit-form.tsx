"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Lock,
  LockOpen,
  Paperclip,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { InvestigationStatus, ImdrfAnnex, LockEntityType } from "@prisma/client";
import { useRecordLock } from "@/hooks/useRecordLock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateInvestigation, type AttachmentInput } from "@/lib/actions/investigations";
import { useOrganization } from "@clerk/nextjs";
import { FileUploader } from "@/components/file-uploader";
import { CustomInvestigationSection } from "@/components/custom-investigation-section";
import { StatusTransitionTracker } from "@/components/status-transition-tracker";
import { cn, formatUserName } from "@/lib/utils";
import {
  IMDRF_ANNEX_B_CATEGORIES,
  IMDRF_ANNEX_B_SUBCAT_MAP,
  IMDRF_ANNEX_C_CATEGORIES,
  IMDRF_ANNEX_C_SUBCAT_MAP,
  IMDRF_ANNEX_D_CATEGORIES,
  IMDRF_ANNEX_D_SUBCAT_MAP,
  IMDRF_ANNEX_G_CATEGORIES,
  IMDRF_ANNEX_G_SUBCAT_MAP,
} from "@/lib/constants/qms-options";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ImdrfCodeInput {
  id?: string;
  productInformationId?: string | null;
  annex: ImdrfAnnex;
  category?: string;
  code: string;
  term: string;
  notes?: string | null;
}

interface InvestigationEditFormProps {
  orgSlug: string;
  complaintNumber: string;
  customSections?: any[];
  productInformation?: any[];
  investigation: {
    id: string;
    complaintId: string;
    status: InvestigationStatus;
    investigatorId?: string | null;
    notes?: string | null;

    sampleAnalysisAssignedDate?: string | null;
    sampleAnalysisCompleteDate?: string | null;
    sampleAnalysisRequired: boolean;
    sampleAnalysisExemptRationale?: string | null;
    decontaminatedAt?: string | null;
    sampleReceivedDate?: string | null;
    quantity?: number | null;
    sampleAnalysisResults?: string | null;

    riskReviewRequired: boolean;
    riskReviewExemptRationale?: string | null;
    riskReviewCompletedAt?: string | null;
    riskReviewCompletedById?: string | null;
    riskReviewResults?: string | null;

    investigationSummaryCompletedById?: string | null;
    investigationSummaryCompletedAt?: string | null;
    summaryText?: string | null;
    report?: string | null;
    capaFscaRationale?: string | null;
    capaRequired: boolean;
    capaRef?: string | null;
    fscaRequired: boolean;
    fscaRef?: string | null;
    reportabilityReviewRequired: boolean;
    imdrfCodes?: ImdrfCodeInput[];

    attachments?: Array<{
      id: string;
      fileUrl: string;
      fileName: string;
      fileSize: number | null;
      mimeType: string | null;
    }>;
  };
}

/* ------------------------------------------------------------------ */
/* Layout helpers                                                      */
/* ------------------------------------------------------------------ */

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type Completion = "done" | "attention" | "empty";

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "Under investigation",
  UNDER_REVIEW: "Under review",
  COMPLETED: "Completed",
  NOT_REQUIRED: "Not required",
};

const STATUS_TONE: Record<string, string> = {
  NOT_STARTED: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  IN_PROGRESS: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  UNDER_REVIEW: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  COMPLETED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  NOT_REQUIRED: "border-border bg-muted text-muted-foreground",
};

function humanize(value?: string | null) {
  if (!value) return "—";
  return STATUS_LABEL[value] ?? value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

function formatDate(d?: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
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
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
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
  id: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
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

/* "Required / Not required" segmented toggle used by Sample and Risk */
function RequiredToggle({
  value,
  onChange,
  label,
  hint,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div role="radiogroup" className="inline-flex shrink-0 rounded-md border border-border bg-background p-0.5">
        {[
          { label: "Required", v: true },
          { label: "Not required", v: false },
        ].map((opt) => {
          const selected = value === opt.v;
          return (
            <button
              key={opt.label}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.v)}
              className={cn(
                "rounded px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed",
                selected
                  ? "bg-foreground font-medium text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckRow({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-border accent-foreground"
      />
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function InvestigationEditForm({
  orgSlug,
  complaintNumber,
  investigation,
  productInformation = [],
  customSections = [],
}: InvestigationEditFormProps) {
  const router = useRouter();

  const { isReadOnly, isLoading: isLockLoading } = useRecordLock({
    entityType: LockEntityType.Investigation,
    recordId: investigation.id,
  });

  const [activeSection, setActiveSection] = React.useState("overview");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { memberships } = useOrganization({
    memberships: { pageSize: 100, keepPreviousData: true },
  });

  const toDateString = (isoString?: string | null) =>
    isoString ? new Date(isoString).toISOString().split("T")[0] : "";

  /* ---------- state (unchanged) ---------- */

  const [status, setStatus] = React.useState<InvestigationStatus>(investigation.status);
  const [investigatorId, setInvestigatorId] = React.useState(investigation.investigatorId || "");
  const [notes, setNotes] = React.useState(investigation.notes || "");
  const [attachments, setAttachments] = React.useState<AttachmentInput[]>(
    () =>
      investigation.attachments?.map((a) => ({
        fileUrl: a.fileUrl,
        fileName: a.fileName,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
      })) || []
  );

  const [sampleAnalysisAssignedDate, setSampleAnalysisAssignedDate] = React.useState(toDateString(investigation.sampleAnalysisAssignedDate));
  const [sampleAnalysisCompleteDate, setSampleAnalysisCompleteDate] = React.useState(toDateString(investigation.sampleAnalysisCompleteDate));
  const [sampleAnalysisRequired, setSampleAnalysisRequired] = React.useState(investigation.sampleAnalysisRequired);
  const [sampleAnalysisExemptRationale, setSampleAnalysisExemptRationale] = React.useState(investigation.sampleAnalysisExemptRationale || "");
  const [decontaminatedAt, setDecontaminatedAt] = React.useState(toDateString(investigation.decontaminatedAt));
  const [sampleReceivedDate, setSampleReceivedDate] = React.useState(toDateString(investigation.sampleReceivedDate));
  const [quantity, setQuantity] = React.useState<string>(
    investigation.quantity !== null && investigation.quantity !== undefined ? String(investigation.quantity) : ""
  );
  const [sampleAnalysisResults, setSampleAnalysisResults] = React.useState(investigation.sampleAnalysisResults || "");

  const [riskReviewRequired, setRiskReviewRequired] = React.useState(investigation.riskReviewRequired);
  const [riskReviewExemptRationale, setRiskReviewExemptRationale] = React.useState(investigation.riskReviewExemptRationale || "");
  const [riskReviewCompletedById, setRiskReviewCompletedById] = React.useState(investigation.riskReviewCompletedById || "");
  const [riskReviewCompletedAt, setRiskReviewCompletedAt] = React.useState(toDateString(investigation.riskReviewCompletedAt));
  const [riskReviewResults, setRiskReviewResults] = React.useState(investigation.riskReviewResults || "");

  const [investigationSummaryCompletedById, setInvestigationSummaryCompletedById] = React.useState(investigation.investigationSummaryCompletedById || "");
  const [investigationSummaryCompletedAt, setInvestigationSummaryCompletedAt] = React.useState(toDateString(investigation.investigationSummaryCompletedAt));
  const [summaryText, setSummaryText] = React.useState(investigation.summaryText || "");
  const [report, setReport] = React.useState(investigation.report || "");
  const [capaRequired, setCapaRequired] = React.useState(investigation.capaRequired);
  const [capaRef, setCapaRef] = React.useState(investigation.capaRef || "");
  const [fscaRequired, setFscaRequired] = React.useState(investigation.fscaRequired || false);
  const [fscaRef, setFscaRef] = React.useState(investigation.fscaRef || "");
  const [capaFscaRationale, setCapaFscaRationale] = React.useState(investigation.capaFscaRationale || "");
  const [reportabilityReviewRequired, setReportabilityReviewRequired] = React.useState(investigation.reportabilityReviewRequired);

  const [imdrfGroups, setImdrfGroups] = React.useState<ImdrfCodeInput[][]>(() => {
    const existingCodes = investigation.imdrfCodes || [];
    const groups: ImdrfCodeInput[][] = [];
    let currentGroup: ImdrfCodeInput[] = [];
    for (const code of existingCodes) {
      currentGroup.push({ ...code, category: code.code ? code.code.substring(0, 3) : "" });
      if (currentGroup.length === 4) {
        groups.push(currentGroup);
        currentGroup = [];
      }
    }
    if (currentGroup.length > 0) {
      while (currentGroup.length < 4) {
        const missing = [ImdrfAnnex.ANNEX_B, ImdrfAnnex.ANNEX_C, ImdrfAnnex.ANNEX_D, ImdrfAnnex.ANNEX_G].find(
          (a) => !currentGroup.some((c) => c.annex === a)
        );
        if (missing)
          currentGroup.push({ annex: missing, category: "", code: "", term: "", productInformationId: currentGroup[0]?.productInformationId });
      }
      groups.push(currentGroup);
    }
    if (groups.length === 0) {
      groups.push([
        { annex: ImdrfAnnex.ANNEX_B, category: "", code: "", term: "", productInformationId: null },
        { annex: ImdrfAnnex.ANNEX_C, category: "", code: "", term: "", productInformationId: null },
        { annex: ImdrfAnnex.ANNEX_D, category: "", code: "", term: "", productInformationId: null },
        { annex: ImdrfAnnex.ANNEX_G, category: "", code: "", term: "", productInformationId: null },
      ]);
    }
    return groups;
  });

  const [customSectionStates, setCustomSectionStates] = React.useState(customSections);

  React.useEffect(() => {
    setCustomSectionStates(customSections);
  }, [customSections]);

  const handleCustomSectionChange = (sectionId: string, field: string, value: any) => {
    setCustomSectionStates((prev) => prev.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s)));
  };

  const handleAddImdrfGroup = () => {
    setImdrfGroups([
      ...imdrfGroups,
      [
        { annex: ImdrfAnnex.ANNEX_B, category: "", code: "", term: "", productInformationId: null },
        { annex: ImdrfAnnex.ANNEX_C, category: "", code: "", term: "", productInformationId: null },
        { annex: ImdrfAnnex.ANNEX_D, category: "", code: "", term: "", productInformationId: null },
        { annex: ImdrfAnnex.ANNEX_G, category: "", code: "", term: "", productInformationId: null },
      ],
    ]);
  };

  const handleRemoveImdrfGroup = (index: number) => {
    if (imdrfGroups.length > 1) setImdrfGroups(imdrfGroups.filter((_, i) => i !== index));
  };

  const handleImdrfCodeChange = (groupIndex: number, codeIndex: number, field: keyof ImdrfCodeInput, value: string) => {
    setImdrfGroups((prevGroups) => {
      const newGroups = [...prevGroups];
      const newGroup = [...newGroups[groupIndex]];
      newGroup[codeIndex] = { ...newGroup[codeIndex], [field]: value };
      newGroups[groupIndex] = newGroup;
      return newGroups;
    });
  };

  const handleGroupNotesChange = (groupIndex: number, notes: string) => {
    setImdrfGroups((prevGroups) => {
      const newGroups = [...prevGroups];
      newGroups[groupIndex] = newGroups[groupIndex].map((c) => ({ ...c, notes }));
      return newGroups;
    });
  };

  const handleGroupProductChange = (groupIndex: number, productId: string) => {
    setImdrfGroups((prevGroups) => {
      const newGroups = [...prevGroups];
      newGroups[groupIndex] = newGroups[groupIndex].map((code) => ({ ...code, productInformationId: productId || null }));
      return newGroups;
    });
  };

  const isCompleted = (status as string) === "COMPLETED";
  const isFormDisabled = isReadOnly || isCompleted;

  /* ---------- derived ---------- */

  const memberOptions = React.useMemo(
    () =>
      memberships?.data?.map((m) => ({
        key: m.publicUserData?.userId || m.id,
        value: m.publicUserData?.userId || "",
        label: formatUserName(m.publicUserData, "User"),
      })) ?? [],
    [memberships]
  );

  const investigatorName = memberOptions.find((m) => m.value === investigatorId)?.label ?? "Unassigned";

  const sections = React.useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "sample", label: "Sample analysis" },
      { id: "risk", label: "Risk review" },
      { id: "summary", label: "Summary and CAPA" },
      ...customSectionStates.map((s) => ({
        id: `custom-${s.id}`,
        label: s.template?.sectionName || "Custom section",
      })),
    ],
    [customSectionStates]
  );

  const codedGroups = imdrfGroups.filter((g) => g.some((c) => c.code)).length;

  const completion = React.useMemo<Record<string, Completion>>(() => {
    const overview: Completion = investigatorId ? "done" : "attention";
    const sample: Completion = sampleAnalysisRequired
      ? sampleAnalysisResults.trim() && sampleAnalysisCompleteDate ? "done" : "attention"
      : sampleAnalysisExemptRationale.trim() ? "done" : "attention";
    const risk: Completion = riskReviewRequired
      ? riskReviewResults.trim() && riskReviewCompletedById && riskReviewCompletedAt ? "done" : "attention"
      : riskReviewExemptRationale.trim() ? "done" : "attention";
    const summaryDone =
      summaryText.trim() && report.trim() && capaFscaRationale.trim() && codedGroups > 0 && investigationSummaryCompletedById;
    const summary: Completion = summaryDone
      ? "done"
      : summaryText.trim() || report.trim() ? "attention" : "empty";
    const out: Record<string, Completion> = { overview, sample, risk, summary };
    for (const s of customSectionStates) {
      out[`custom-${s.id}`] = s.isRequired
        ? s.results ? "done" : "attention"
        : s.exemptRationale ? "done" : "empty";
    }
    return out;
  }, [
    investigatorId,
    sampleAnalysisRequired,
    sampleAnalysisResults,
    sampleAnalysisCompleteDate,
    sampleAnalysisExemptRationale,
    riskReviewRequired,
    riskReviewResults,
    riskReviewCompletedById,
    riskReviewCompletedAt,
    riskReviewExemptRationale,
    summaryText,
    report,
    capaFscaRationale,
    codedGroups,
    investigationSummaryCompletedById,
    customSectionStates,
  ]);

  /* ---------- scroll-spy ---------- */

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
      const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
      if (els.length === 0) return;

      const scrollTop = scroller ? scroller.scrollTop : window.scrollY;
      const viewport = scroller ? scroller.clientHeight : window.innerHeight;
      const scrollHeight = scroller ? scroller.scrollHeight : document.documentElement.scrollHeight;

      if (scrollTop + viewport >= scrollHeight - 4) {
        setActiveSection(els[els.length - 1].id);
        return;
      }

      const line = 140;
      const containerTop = scroller ? scroller.getBoundingClientRect().top : 0;
      let current = els[0].id;
      for (const el of els) {
        if (el.getBoundingClientRect().top - containerTop <= line) current = el.id;
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
  }, [sections]);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  React.useEffect(() => {
    const toastId = `investigation-completed-${investigation.id}`;
    if (isCompleted) {
      toast.info("This investigation is completed.", {
        id: toastId,
        description: "Fields are shown read only.",
        icon: <Lock className="size-4" />,
      });
    } else {
      toast.dismiss(toastId);
    }

    return () => {
      toast.dismiss(toastId);
    };
  }, [isCompleted, investigation.id]);

  /* ---------- submit (payload unchanged) ---------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCompleted) {
      toast.error("This investigation is completed and locked.");
      return;
    }
    if (isReadOnly) {
      toast.error("This record is locked by another user.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateInvestigation({
        id: investigation.id,
        complaintId: investigation.complaintId,
        orgSlug,
        status,
        investigatorId: investigatorId || null,
        notes: notes || null,
        newAttachments: attachments.filter((a) => !investigation.attachments?.some((ea) => ea.fileUrl === a.fileUrl)),

        sampleAnalysisAssignedDate: sampleAnalysisAssignedDate ? new Date(sampleAnalysisAssignedDate) : null,
        sampleAnalysisCompleteDate: sampleAnalysisCompleteDate ? new Date(sampleAnalysisCompleteDate) : null,
        sampleAnalysisRequired,
        sampleAnalysisExemptRationale: sampleAnalysisExemptRationale || null,
        decontaminatedAt: decontaminatedAt ? new Date(decontaminatedAt) : null,
        sampleReceivedDate: sampleReceivedDate ? new Date(sampleReceivedDate) : null,
        quantity: quantity ? parseInt(quantity, 10) : null,
        sampleAnalysisResults: sampleAnalysisResults || null,

        riskReviewRequired,
        riskReviewExemptRationale: riskReviewExemptRationale || null,
        riskReviewCompletedAt: riskReviewCompletedAt ? new Date(riskReviewCompletedAt) : null,
        riskReviewCompletedById: riskReviewCompletedById || null,
        riskReviewResults: riskReviewResults || null,

        investigationSummaryCompletedById: investigationSummaryCompletedById || null,
        investigationSummaryCompletedAt: investigationSummaryCompletedAt ? new Date(investigationSummaryCompletedAt) : null,
        summaryText: summaryText || null,
        report: report || null,
        capaFscaRationale: capaFscaRationale || null,
        capaRequired,
        capaRef: capaRef || null,
        fscaRequired,
        fscaRef: fscaRef || null,
        reportabilityReviewRequired,
        imdrfCodes: imdrfGroups.flat(),
        customSections: customSectionStates.map((cs) => ({
          id: cs.id,
          isRequired: !!cs.isRequired,
          assignedToId: cs.assignedToId || null,
          assignedDate: cs.assignedDate ? new Date(cs.assignedDate) : null,
          exemptRationale: cs.exemptRationale || null,
          results: cs.results || null,
        })),
      });

      toast.success("Changes saved");
      router.refresh();
    } catch (err: any) {
      console.error("[Investigation Update Error]", err);
      setError(err?.message || "Couldn't save the investigation. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const MemberSelect = ({
    id,
    value,
    onChange,
  }: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      <option value="">Unassigned</option>
      {memberOptions.map((m) => (
        <option key={m.key} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );

  const saveLabel = isSubmitting
    ? "Saving…"
    : isCompleted
      ? "Completed"
      : isReadOnly
        ? "Read only"
        : "Save changes";

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div ref={rootRef} className="-m-6 lg:-m-8">
      {/* ---------- Sticky record bar ---------- */}
      <div className="sticky -top-10 z-20 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="px-6 pt-3 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Link href="/complaints" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                Complaints
              </Link>
              <span className="text-xs text-muted-foreground/60">/</span>
              <Link
                href={`/complaints/${investigation.complaintId}`}
                className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {complaintNumber}
              </Link>
              <span className="text-xs text-muted-foreground/60">/</span>
              <span className="text-sm font-medium text-foreground">Investigation</span>
              <Badge variant="outline" className={STATUS_TONE[String(status)] ?? ""}>
                {humanize(String(status))}
              </Badge>
              {capaRequired && (
                <Badge variant="outline" className="text-muted-foreground">
                  CAPA
                </Badge>
              )}
              {fscaRequired && (
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400">
                  FSCA
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 lg:mt-2">
              <StatusTransitionTracker
                entityType="Investigation"
                entityId={investigation.id}
                currentStatus={status}
                disabled={isReadOnly}
                onStatusChanged={(newStatus) => {
                  setStatus(newStatus as InvestigationStatus);
                  router.refresh();
                }}
              />
              <Button
                type="submit"
                form="investigation-form"
                size="sm"
                disabled={isSubmitting || isFormDisabled || isLockLoading}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isFormDisabled ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {saveLabel}
              </Button>
            </div>
          </div>

          <nav className="-mb-px mt-2 flex gap-1 overflow-x-auto" aria-label="Sections">
            {sections.map((s) => {
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
                  <CompletionDot state={completion[s.id] ?? "empty"} />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ---------- Body ---------- */}
      <div className="grid gap-6 p-6 lg:p-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <form id="investigation-form" onSubmit={handleSubmit} className="min-w-0 max-w-5xl space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <fieldset disabled={isFormDisabled} className="contents space-y-6">
            {/* ---------- Overview ---------- */}
            <SectionCard
              id="overview"
              title="Overview"
              description="Who is running the investigation and any general notes."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Investigator" htmlFor="investigatorId" required>
                  <MemberSelect id="investigatorId" value={investigatorId} onChange={setInvestigatorId} />
                </Field>
                <Field label="Notes" htmlFor="notes" className="md:col-span-2">
                  <Textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="General investigation notes."
                  />
                </Field>
              </div>
            </SectionCard>

            {/* ---------- Sample analysis ---------- */}
            <SectionCard id="sample" title="Sample analysis" description="Physical evaluation of the returned device.">
              <div className="space-y-4">
                <RequiredToggle
                  value={sampleAnalysisRequired}
                  onChange={setSampleAnalysisRequired}
                  label="Sample analysis"
                  hint={sampleAnalysisRequired ? "Record receipt, analysis dates, and findings." : "Give a rationale for skipping it."}
                />

                {!sampleAnalysisRequired && (
                  <Field label="Exempt rationale" htmlFor="sampleAnalysisExemptRationale" required>
                    <Textarea
                      id="sampleAnalysisExemptRationale"
                      rows={2}
                      value={sampleAnalysisExemptRationale}
                      onChange={(e) => setSampleAnalysisExemptRationale(e.target.value)}
                    />
                  </Field>
                )}

                {sampleAnalysisRequired && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Quantity" htmlFor="quantity">
                        <Input id="quantity" type="number" className="font-mono" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                      </Field>
                      <Field label="Sample received" htmlFor="sampleReceivedDate">
                        <Input id="sampleReceivedDate" type="date" value={sampleReceivedDate} onChange={(e) => setSampleReceivedDate(e.target.value)} />
                      </Field>
                      <Field label="Decontaminated" htmlFor="decontaminatedAt">
                        <Input id="decontaminatedAt" type="date" value={decontaminatedAt} onChange={(e) => setDecontaminatedAt(e.target.value)} />
                      </Field>
                      <Field label="Analysis assigned" htmlFor="sampleAnalysisAssignedDate" required>
                        <Input id="sampleAnalysisAssignedDate" type="date" value={sampleAnalysisAssignedDate} onChange={(e) => setSampleAnalysisAssignedDate(e.target.value)} />
                      </Field>
                      <Field label="Analysis complete" htmlFor="sampleAnalysisCompleteDate" required>
                        <Input id="sampleAnalysisCompleteDate" type="date" value={sampleAnalysisCompleteDate} onChange={(e) => setSampleAnalysisCompleteDate(e.target.value)} />
                      </Field>
                    </div>
                    <Field label="Analysis results" htmlFor="sampleAnalysisResults">
                      <Textarea
                        id="sampleAnalysisResults"
                        rows={4}
                        value={sampleAnalysisResults}
                        onChange={(e) => setSampleAnalysisResults(e.target.value)}
                        placeholder="What was observed, tested, and concluded."
                      />
                    </Field>
                  </>
                )}
              </div>
            </SectionCard>

            {/* ---------- Risk review ---------- */}
            <SectionCard id="risk" title="Risk review" description="Assessment against the risk management file.">
              <div className="space-y-4">
                <RequiredToggle
                  value={riskReviewRequired}
                  onChange={setRiskReviewRequired}
                  label="Risk review"
                  hint={riskReviewRequired ? "Record who completed it, when, and the outcome." : "Give a rationale for skipping it."}
                />

                {!riskReviewRequired && (
                  <Field label="Exempt rationale" htmlFor="riskReviewExemptRationale" required>
                    <Textarea
                      id="riskReviewExemptRationale"
                      rows={2}
                      value={riskReviewExemptRationale}
                      onChange={(e) => setRiskReviewExemptRationale(e.target.value)}
                    />
                  </Field>
                )}

                {riskReviewRequired && (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Completed by" htmlFor="riskReviewCompletedById" required>
                        <MemberSelect id="riskReviewCompletedById" value={riskReviewCompletedById} onChange={setRiskReviewCompletedById} />
                      </Field>
                      <Field label="Completed on" htmlFor="riskReviewCompletedAt" required>
                        <Input id="riskReviewCompletedAt" type="date" value={riskReviewCompletedAt} onChange={(e) => setRiskReviewCompletedAt(e.target.value)} />
                      </Field>
                    </div>
                    <Field label="Risk review results" htmlFor="riskReviewResults" required>
                      <Textarea
                        id="riskReviewResults"
                        rows={4}
                        value={riskReviewResults}
                        onChange={(e) => setRiskReviewResults(e.target.value)}
                        placeholder="Hazard, harm, current controls, and whether residual risk is acceptable."
                      />
                    </Field>
                  </>
                )}
              </div>
            </SectionCard>
          </fieldset>

          {/* ---------- Summary and CAPA ---------- */}
          <SectionCard
            id="summary"
            title="Summary and CAPA"
            description="Conclusion, IMDRF coding, and whether corrective action or a field action is needed."
          >
            <div className="space-y-4">
              <fieldset disabled={isFormDisabled} className="space-y-4">
                <Field label="Summary" htmlFor="summaryText" required>
                  <Textarea id="summaryText" rows={3} value={summaryText} onChange={(e) => setSummaryText(e.target.value)} />
                </Field>
                <Field label="Report" htmlFor="report" required>
                  <Textarea id="report" rows={5} value={report} onChange={(e) => setReport(e.target.value)} />
                </Field>
              </fieldset>

              {/* IMDRF coding */}
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    IMDRF investigation codes <span className="text-destructive">*</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {codedGroups} of {imdrfGroups.length} coding {imdrfGroups.length === 1 ? "group" : "groups"} completed.
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      {isFormDisabled ? "View codes" : "Manage codes"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] xl:max-w-[1400px] w-full max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {isCompleted
                          ? "IMDRF coding groups (locked)"
                          : isFormDisabled
                          ? "IMDRF coding groups (read only)"
                          : "IMDRF coding groups"}
                      </DialogTitle>
                    </DialogHeader>
                      <div className="mt-4">
                        <div className="overflow-x-auto rounded-md border border-border bg-background">
                          <Table className="min-w-[1150px]">
                            <TableHeader>
                              <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="w-[200px]">Product</TableHead>
                                <TableHead className="w-[180px]">Annex B (type)</TableHead>
                                <TableHead className="w-[180px]">Annex C (findings)</TableHead>
                                <TableHead className="w-[180px]">Annex D (conclusion)</TableHead>
                                <TableHead className="w-[180px]">Annex G (component)</TableHead>
                                <TableHead className="w-[200px]">Notes</TableHead>
                                <TableHead className="w-[60px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {imdrfGroups.map((group, groupIdx) => {
                                const getCodeSelects = (annex: string) => {
                                  const codeIndex = group.findIndex((c) => c.annex === annex);
                                  const actualIndex = codeIndex >= 0 ? codeIndex : 0;
                                  const codeObj = group[actualIndex];

                                  const getCategoryOptions = () => {
                                    switch (annex) {
                                      case "ANNEX_B": return IMDRF_ANNEX_B_CATEGORIES;
                                      case "ANNEX_C": return IMDRF_ANNEX_C_CATEGORIES;
                                      case "ANNEX_D": return IMDRF_ANNEX_D_CATEGORIES;
                                      case "ANNEX_G": return IMDRF_ANNEX_G_CATEGORIES;
                                      default: return [];
                                    }
                                  };
                                  const getSubCodeOptions = () => {
                                    if (!codeObj?.category) return [];
                                    switch (annex) {
                                      case "ANNEX_B": return IMDRF_ANNEX_B_SUBCAT_MAP[codeObj.category] || [];
                                      case "ANNEX_C": return IMDRF_ANNEX_C_SUBCAT_MAP[codeObj.category] || [];
                                      case "ANNEX_D": return IMDRF_ANNEX_D_SUBCAT_MAP[codeObj.category] || [];
                                      case "ANNEX_G": return IMDRF_ANNEX_G_SUBCAT_MAP[codeObj.category] || [];
                                      default: return [];
                                    }
                                  };
                                  const categories = getCategoryOptions();
                                  const subCodes = getSubCodeOptions();
                                  const small = "w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

                                  return (
                                    <div className="flex flex-col gap-2">
                                      <select
                                        required
                                        disabled={isFormDisabled}
                                        value={codeObj?.category || ""}
                                        onChange={(e) => {
                                          const selectedCat = e.target.value;
                                          const categoryOption = categories.find((o) => o.value === selectedCat);
                                          handleImdrfCodeChange(groupIdx, actualIndex, "category", selectedCat);
                                          let catSubCodes: any[] = [];
                                          if (annex === "ANNEX_C") catSubCodes = IMDRF_ANNEX_C_SUBCAT_MAP[selectedCat] || [];
                                          if (annex === "ANNEX_D") catSubCodes = IMDRF_ANNEX_D_SUBCAT_MAP[selectedCat] || [];
                                          if (annex === "ANNEX_G") catSubCodes = IMDRF_ANNEX_G_SUBCAT_MAP[selectedCat] || [];
                                          if (annex === "ANNEX_B" || (selectedCat && catSubCodes.length === 0)) {
                                            handleImdrfCodeChange(groupIdx, actualIndex, "code", selectedCat);
                                            handleImdrfCodeChange(
                                              groupIdx,
                                              actualIndex,
                                              "term",
                                              categoryOption ? categoryOption.label.split(" - ")[1] || categoryOption.label : ""
                                            );
                                          } else {
                                            handleImdrfCodeChange(groupIdx, actualIndex, "code", "");
                                            handleImdrfCodeChange(groupIdx, actualIndex, "term", "");
                                          }
                                        }}
                                        className={small}
                                      >
                                        <option value="">{annex === "ANNEX_B" ? "Code" : "Category"}</option>
                                        {categories.map((opt) => (
                                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                      </select>

                                      {annex !== "ANNEX_B" && codeObj?.category && subCodes.length > 0 && (
                                        <select
                                          required
                                          disabled={isFormDisabled}
                                          value={codeObj?.code || ""}
                                          onChange={(e) => {
                                            const selectedVal = e.target.value;
                                            const option = subCodes.find((o) => o.value === selectedVal);
                                            handleImdrfCodeChange(groupIdx, actualIndex, "code", selectedVal);
                                            handleImdrfCodeChange(
                                              groupIdx,
                                              actualIndex,
                                              "term",
                                              option ? option.label.split(" - ")[1] || option.label : ""
                                            );
                                          }}
                                          className={small}
                                        >
                                          <option value="">Code</option>
                                          {subCodes.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                          ))}
                                        </select>
                                      )}

                                      {annex !== "ANNEX_B" && !codeObj?.category && (
                                        <select required disabled value="" className={cn(small, "opacity-50")}>
                                          <option value="">Code</option>
                                        </select>
                                      )}
                                    </div>
                                  );
                                };

                                return (
                                  <TableRow key={groupIdx} className="group align-top hover:bg-muted/10">
                                    <TableCell className="p-3">
                                      <select
                                        disabled={isFormDisabled}
                                        value={group[0]?.productInformationId || ""}
                                        onChange={(e) => handleGroupProductChange(groupIdx, e.target.value)}
                                        className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        <option value="">No product</option>
                                        {productInformation.map((p) => (
                                          <option key={p.id} value={p.id}>
                                            {p.materialDescription || p.materialNumber || p.id} {p.serialNumber ? `(SN: ${p.serialNumber})` : ""}
                                          </option>
                                        ))}
                                      </select>
                                    </TableCell>
                                    <TableCell className="min-w-[200px] p-3 align-top">{getCodeSelects("ANNEX_B")}</TableCell>
                                    <TableCell className="min-w-[200px] p-3 align-top">{getCodeSelects("ANNEX_C")}</TableCell>
                                    <TableCell className="min-w-[200px] p-3 align-top">{getCodeSelects("ANNEX_D")}</TableCell>
                                    <TableCell className="min-w-[200px] p-3 align-top">{getCodeSelects("ANNEX_G")}</TableCell>
                                    <TableCell className="min-w-[200px] p-3 align-top">
                                      <textarea
                                        disabled={isFormDisabled}
                                        placeholder="Notes (optional)"
                                        value={group[0]?.notes || ""}
                                        onChange={(e) => handleGroupNotesChange(groupIdx, e.target.value)}
                                        className="min-h-[60px] w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                      />
                                    </TableCell>
                                    <TableCell className="p-3 text-center align-middle opacity-0 transition-opacity group-hover:opacity-100">
                                      {!isFormDisabled && imdrfGroups.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleRemoveImdrfGroup(groupIdx)}
                                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                        {!isFormDisabled && (
                          <Button type="button" variant="outline" onClick={handleAddImdrfGroup} className="mt-4 w-full border-dashed">
                            <Plus className="mr-2 h-4 w-4" /> Add coding row
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

              <fieldset disabled={isFormDisabled} className="space-y-4">
                {/* CAPA / FSCA */}
                <div className="space-y-4 border-t border-border pt-4">
                  <p className="text-xs font-medium text-foreground">Corrective and field action</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-3">
                      <CheckRow id="capaRequired" checked={capaRequired} onChange={setCapaRequired} label="CAPA required" />
                      {capaRequired && (
                        <Field label="CAPA reference" htmlFor="capaRef">
                          <Input id="capaRef" className="font-mono" value={capaRef} onChange={(e) => setCapaRef(e.target.value)} placeholder="CAPA-2026-042" />
                        </Field>
                      )}
                    </div>
                    <div className="space-y-3">
                      <CheckRow id="fscaRequired" checked={fscaRequired} onChange={setFscaRequired} label="FSCA required" hint="Field safety corrective action" />
                      {fscaRequired && (
                        <Field label="FSCA reference" htmlFor="fscaRef">
                          <Input id="fscaRef" className="font-mono" value={fscaRef} onChange={(e) => setFscaRef(e.target.value)} placeholder="FSCA-2026-001" />
                        </Field>
                      )}
                    </div>
                  </div>
                  <Field label="CAPA and FSCA rationale" htmlFor="capaFscaRationale" required>
                    <Textarea
                      id="capaFscaRationale"
                      rows={2}
                      value={capaFscaRationale}
                      onChange={(e) => setCapaFscaRationale(e.target.value)}
                      placeholder="Why action is or is not required."
                    />
                  </Field>
                  <CheckRow
                    id="reportabilityReviewRequired"
                    checked={reportabilityReviewRequired}
                    onChange={setReportabilityReviewRequired}
                    label="Reportability review required"
                  />
                </div>

                {/* Sign-off */}
                <div className="space-y-4 border-t border-border pt-4">
                  <p className="text-xs font-medium text-foreground">Sign-off</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Summary completed by" htmlFor="investigationSummaryCompletedById" required>
                      <MemberSelect id="investigationSummaryCompletedById" value={investigationSummaryCompletedById} onChange={setInvestigationSummaryCompletedById} />
                    </Field>
                    <Field label="Summary completed on" htmlFor="investigationSummaryCompletedAt" required>
                      <Input id="investigationSummaryCompletedAt" type="date" value={investigationSummaryCompletedAt} onChange={(e) => setInvestigationSummaryCompletedAt(e.target.value)} />
                    </Field>
                  </div>
                </div>
              </fieldset>
            </div>
          </SectionCard>

          <fieldset disabled={isFormDisabled} className="contents space-y-6">
            {/* ---------- Custom sections ---------- */}
            {customSectionStates.map((section) => (
              <SectionCard
                key={section.id}
                id={`custom-${section.id}`}
                title={section.template?.sectionName || "Custom section"}
                description={section.template?.description || undefined}
              >
                <CustomInvestigationSection
                  section={section}
                  disabled={isFormDisabled}
                  onChange={(field, value) => handleCustomSectionChange(section.id, field, value)}
                />
              </SectionCard>
            ))}

            <div className="flex items-center justify-between pt-2">
              <Link
                href={`/complaints/${investigation.complaintId}`}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Back to complaint
              </Link>
            </div>
          </fieldset>
        </form>

        {/* ---------- Right context panel ---------- */}
        <aside className="space-y-4 xl:sticky xl:top-[120px] xl:self-start">
          <PanelCard title="Details">
            <dl className="divide-y divide-border">
              {[
                ["Complaint", complaintNumber],
                ["Investigator", investigatorName],
                ["Sample analysis", sampleAnalysisRequired ? "Required" : "Not required"],
                ["Risk review", riskReviewRequired ? "Required" : "Not required"],
                ["Summary signed", investigationSummaryCompletedAt ? formatDate(investigationSummaryCompletedAt) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <dt className="shrink-0 text-xs text-muted-foreground">{k}</dt>
                  <dd className="break-words text-right text-xs text-foreground">{v}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between py-2 last:pb-0">
                <dt className="text-xs text-muted-foreground">Lock</dt>
                <dd
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    isFormDisabled ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {isCompleted ? (
                    <><Lock className="h-3 w-3" /> Completed</>
                  ) : isReadOnly ? (
                    <><Lock className="h-3 w-3" /> Held by another user</>
                  ) : (
                    <><LockOpen className="h-3 w-3" /> Yours</>
                  )}
                </dd>
              </div>
            </dl>
          </PanelCard>

          <PanelCard title="IMDRF coding">
            <div className="space-y-2">
              {imdrfGroups.map((group, i) => {
                const codes = group.filter((c) => c.code).map((c) => c.code);
                const product = productInformation.find((p) => p.id === group[0]?.productInformationId);
                return (
                  <div key={i} className="rounded-md border border-border p-2.5">
                    <p className="truncate text-xs font-medium text-foreground">
                      {product?.materialDescription || product?.materialNumber || `Group ${i + 1}`}
                    </p>
                    <p className={cn("mt-0.5 font-mono text-xs", codes.length ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400")}>
                      {codes.length ? codes.join(" · ") : "No codes yet"}
                    </p>
                  </div>
                );
              })}
            </div>
          </PanelCard>

          <PanelCard title={`Attachments · ${attachments.length}`}>
            <FileUploader attachments={attachments} onChange={setAttachments} disabled={isFormDisabled} />
            {attachments.length === 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip className="h-3 w-3" /> Lab reports, photos, test data.
              </p>
            )}
          </PanelCard>
        </aside>
      </div>
    </div>
  );
}