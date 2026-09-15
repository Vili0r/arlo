"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Lock,
  LockOpen,
  Paperclip,
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Calendar,
} from "lucide-react";
import { CapaType, CapaPhase, ExtensionRequestStatus, LockEntityType } from "@prisma/client";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useRecordLock } from "@/hooks/useRecordLock";
import { StatusTransitionTracker } from "@/components/status-transition-tracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileUploader } from "@/components/file-uploader";
import {
  updateCapa,
  createExtensionRequest,
  reviewExtensionRequest,
  approveCapaPhase,
  type AttachmentInput,
} from "@/lib/actions/capa";
import { formatUserName, cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Options (unchanged)                                                 */
/* ------------------------------------------------------------------ */

const ROOT_CAUSE_TOOLS_OPTIONS = [
  "5 Whys Analysis",
  "Fishbone / Ishikawa Diagram",
  "Failure Mode and Effects Analysis (FMEA)",
  "Fault Tree Analysis (FTA)",
  "Is / Is Not Comparative Analysis",
  "Process Flow & Value Stream Mapping",
  "Pareto Analysis (80/20)",
  "Barrier & Change Analysis",
  "Human Error Assessment (HEART)",
  "Gemba Walk & Direct Observation",
];

const SEVERITY_OPTIONS = [
  { value: "CRITICAL", label: "Critical - Severe patient harm or life threat" },
  { value: "MAJOR", label: "Major - Reversible injury or significant clinical impact" },
  { value: "MODERATE", label: "Moderate - Minor injury or localized disruption" },
  { value: "MINOR", label: "Minor - Negligible impact, inconvenience only" },
  { value: "NEGLIGIBLE", label: "Negligible - No patient or product impact" },
];

const OCCURRENCE_OPTIONS = [
  { value: "FREQUENT", label: "Frequent - Likely to occur repeatedly" },
  { value: "PROBABLE", label: "Probable - Will occur several times" },
  { value: "OCCASIONAL", label: "Occasional - Likely to occur sometime" },
  { value: "REMOTE", label: "Remote - Unlikely, but possible" },
  { value: "IMPROBABLE", label: "Improbable - So unlikely, can be assumed not to occur" },
];

const RISK_CATEGORIES = [
  { value: "HIGH", label: "High Risk (Unacceptable - Immediate CAPA Required)" },
  { value: "MEDIUM", label: "Medium Risk (ALARP - As Low As Reasonably Practicable)" },
  { value: "LOW", label: "Low Risk (Acceptable with containment/monitoring)" },
];

/* ------------------------------------------------------------------ */
/* Layout helpers                                                      */
/* ------------------------------------------------------------------ */

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const SECTIONS = [
  { id: "initiation", label: "Initiation" },
  { id: "investigation", label: "Investigation" },
  { id: "planning", label: "Planning" },
  { id: "implementation", label: "Implementation" },
  { id: "effectiveness", label: "Effectiveness" },
  { id: "controls", label: "Controls" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];
type Completion = "done" | "attention" | "empty";

const PHASE_STEPS: Array<{ phase: string; label: string }> = [
  { phase: "INITIATION", label: "Initiation" },
  { phase: "INVESTIGATION", label: "Investigation" },
  { phase: "PLANNING", label: "Planning" },
  { phase: "IMPLEMENTATION", label: "Implementation" },
  { phase: "EFFECTIVENESS", label: "Effectiveness" },
  { phase: "CLOSED", label: "Closed" },
];

function humanize(value?: string | null) {
  if (!value) return "—";
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

function formatDate(d?: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const RISK_TONE: Record<string, string> = {
  HIGH: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  MEDIUM: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  LOW: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

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
  badge,
  children,
}: {
  id: SectionId;
  title: string;
  description?: string;
  badge?: React.ReactNode;
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
        {badge}
      </div>
      {children}
    </section>
  );
}

function PanelCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

/* Sub-group inside a section: a quiet bordered block with a small heading */
function SubGroup({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 border-t border-border pt-4", className)}>
      <p className="text-xs font-medium text-foreground">{title}</p>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface CapaEditFormProps {
  orgSlug: string;
  capa: any;
}

export function CapaEditForm({ orgSlug, capa }: CapaEditFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const { isReadOnly: isLockReadOnly } = useRecordLock({
    entityType: LockEntityType.Capa,
    recordId: capa.id,
  });
  const isReadOnly = isLockReadOnly;

  const { memberships } = useOrganization({
    memberships: { pageSize: 100, keepPreviousData: true },
  });

  const toDateString = (iso?: string | Date | null) =>
    iso ? new Date(iso).toISOString().split("T")[0] : "";

  const [activeSection, setActiveSection] = React.useState<SectionId>("initiation");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /* ---------- state (unchanged from original) ---------- */

  const [shortDescription, setShortDescription] = React.useState(capa.shortDescription || "");
  const [type, setType] = React.useState<CapaType>(capa.type || CapaType.CORRECTIVE);
  const [currentPhase, setCurrentPhase] = React.useState<CapaPhase>(capa.currentPhase || CapaPhase.INITIATION);
  const [ownerId, setOwnerId] = React.useState(capa.ownerId || "");

  const init = capa.initiation || {};
  const [problemStatement, setProblemStatement] = React.useState(init.problemStatement || "");
  const [containmentAction, setContainmentAction] = React.useState(init.containmentAction || "");
  const [dateDue, setDateDue] = React.useState(toDateString(init.dateDue));
  const [source, setSource] = React.useState(init.source || "");
  const [repeatCapa, setRepeatCapa] = React.useState(init.repeatCapa || false);
  const [capaReference, setCapaReference] = React.useState(init.capaReference || "");
  const [existingCapa, setExistingCapa] = React.useState(init.existingCapa || false);
  const [existingOpenCapaReference, setExistingOpenCapaReference] = React.useState(init.existingOpenCapaReference || "");
  const [existingCapaDueDate, setExistingCapaDueDate] = React.useState(toDateString(init.existingCapaDueDate));
  const [processOrProduct, setProcessOrProduct] = React.useState(init.processOrProduct || "Product");
  const [affectedArea, setAffectedArea] = React.useState(init.affectedArea || "");
  const [productDetails, setProductDetails] = React.useState(init.productDetails || "");
  const [relatedProcess, setRelatedProcess] = React.useState(init.relatedProcess || "");
  const [severityRanking, setSeverityRanking] = React.useState(init.severityRanking || "MAJOR");
  const [severityRationale, setSeverityRationale] = React.useState(init.severityRationale || "");
  const [occurrenceRanking, setOccurrenceRanking] = React.useState(init.occurrenceRanking || "OCCASIONAL");
  const [occurrenceRationale, setOccurrenceRationale] = React.useState(init.occurrenceRationale || "");
  const [riskCategory, setRiskCategory] = React.useState(init.riskCategory || "HIGH");
  const [capaRequired, setCapaRequired] = React.useState(init.capaRequired ?? true);
  const [capaTypeCategory, setCapaTypeCategory] = React.useState(init.capaType || "Process Optimization");
  const [capaSummary, setCapaSummary] = React.useState(init.capaSummary || "");
  const [fscaRequired, setFscaRequired] = React.useState(init.fscaRequired || false);
  const [fscaRefNumber, setFscaRefNumber] = React.useState(init.fscaRefNumber || "");
  const [initiationPrimaryApproverId, setInitiationPrimaryApproverId] = React.useState(init.primaryApproverId || "");
  const [initiationSecondaryApproverId, setInitiationSecondaryApproverId] = React.useState(init.secondaryApproverId || "");
  const [initiationCompletedById, setInitiationCompletedById] = React.useState(init.completedById || "");
  const [initiationCompletedAt, setInitiationCompletedAt] = React.useState(toDateString(init.completedAt));
  const [initiationAttachments, setInitiationAttachments] = React.useState<AttachmentInput[]>(
    init.attachments?.map((a: any) => ({ fileUrl: a.fileUrl, fileName: a.fileName, fileSize: a.fileSize, mimeType: a.mimeType })) || []
  );

  const inv = capa.investigation || {};
  const [investigationContainmentSummary, setInvestigationContainmentSummary] = React.useState(inv.containmentSummary || "");
  const [investigationSummary, setInvestigationSummary] = React.useState(inv.investigationSummary || "");
  const [rootCauseDescription, setRootCauseDescription] = React.useState(inv.rootCauseDescription || "");
  const [selectedRootCauseTools, setSelectedRootCauseTools] = React.useState<string[]>(inv.rootCauseTools || ["5 Whys Analysis"]);
  const [impactProductQuality, setImpactProductQuality] = React.useState(inv.impactProductQuality || false);
  const [impactProductQualityRationale, setImpactProductQualityRationale] = React.useState(inv.impactProductQualityRationale || "");
  const [investigationPlanDueDate, setInvestigationPlanDueDate] = React.useState(toDateString(inv.planDueDate));
  const [investigatorId, setInvestigatorId] = React.useState(inv.investigatorId || "");
  const [investigationPrimaryApproverId, setInvestigationPrimaryApproverId] = React.useState(inv.primaryApproverId || "");
  const [investigationSecondaryApproverId, setInvestigationSecondaryApproverId] = React.useState(inv.secondaryApproverId || "");
  const [investigationAttachments, setInvestigationAttachments] = React.useState<AttachmentInput[]>(
    inv.attachments?.map((a: any) => ({ fileUrl: a.fileUrl, fileName: a.fileName, fileSize: a.fileSize, mimeType: a.mimeType })) || []
  );

  const plan = capa.planning || {};
  const [capaPlanDueDate, setCapaPlanDueDate] = React.useState(toDateString(plan.capaPlanDueDate));
  const [planningActionPlan, setPlanningActionPlan] = React.useState(plan.actionPlan || "");
  const [planningEffectivenessCheckPlan, setPlanningEffectivenessCheckPlan] = React.useState(plan.effectivenessCheckPlan || "");
  const [planningPrimaryApproverId, setPlanningPrimaryApproverId] = React.useState(plan.primaryApproverId || "");
  const [planningSecondaryApproverId, setPlanningSecondaryApproverId] = React.useState(plan.secondaryApproverId || "");
  const [planningAttachments, setPlanningAttachments] = React.useState<AttachmentInput[]>(
    plan.attachments?.map((a: any) => ({ fileUrl: a.fileUrl, fileName: a.fileName, fileSize: a.fileSize, mimeType: a.mimeType })) || []
  );

  const impl = capa.implementation || {};
  const [implementationDateDue, setImplementationDateDue] = React.useState(toDateString(impl.dateDue || impl.implementationDueDate));
  const [implementationActionPlan, setImplementationActionPlan] = React.useState(impl.actionPlan || "");
  const [implementationEffectivenessCheckPlan, setImplementationEffectivenessCheckPlan] = React.useState(impl.effectivenessCheckPlan || "");
  const [implementationEffectivenessDueDate, setImplementationEffectivenessDueDate] = React.useState(toDateString(impl.effectivenessDueDate));
  const [implementationValidateComments, setImplementationValidateComments] = React.useState(impl.validateComments || "");
  const [implementationActionPlanSummary, setImplementationActionPlanSummary] = React.useState(impl.actionPlanSummary || "");
  const [implementationRiskEvaluation, setImplementationRiskEvaluation] = React.useState(impl.riskEvaluation || "");
  const [implementationPrimaryApproverId, setImplementationPrimaryApproverId] = React.useState(impl.primaryApproverId || "");
  const [implementationSecondaryApproverId, setImplementationSecondaryApproverId] = React.useState(impl.secondaryApproverId || "");
  const [implementationAttachments, setImplementationAttachments] = React.useState<AttachmentInput[]>(
    impl.attachments?.map((a: any) => ({ fileUrl: a.fileUrl, fileName: a.fileName, fileSize: a.fileSize, mimeType: a.mimeType })) || []
  );

  const eff = capa.effectiveness || {};
  const [effectivenessVerificationSummary, setEffectivenessVerificationSummary] = React.useState(eff.effectivenessVerificationSummary || "");
  const [ineffectiveJustification, setIneffectiveJustification] = React.useState(eff.ineffectiveJustification || "");
  const [effectivenessDateDue, setEffectivenessDateDue] = React.useState(toDateString(eff.dateDue));
  const [effectivenessPrimaryApproverId, setEffectivenessPrimaryApproverId] = React.useState(eff.primaryApproverId || "");
  const [effectivenessSecondaryApproverId, setEffectivenessSecondaryApproverId] = React.useState(eff.secondaryApproverId || "");
  const [effectivenessAttachments, setEffectivenessAttachments] = React.useState<AttachmentInput[]>(
    eff.attachments?.map((a: any) => ({ fileUrl: a.fileUrl, fileName: a.fileName, fileSize: a.fileSize, mimeType: a.mimeType })) || []
  );

  const [cancellationRequested, setCancellationRequested] = React.useState(capa.cancellationRequested || false);
  const [cancellationJustification, setCancellationJustification] = React.useState(capa.cancellationJustification || "");
  const [rootAttachments, setRootAttachments] = React.useState<AttachmentInput[]>(
    capa.attachments?.map((a: any) => ({ fileUrl: a.fileUrl, fileName: a.fileName, fileSize: a.fileSize, mimeType: a.mimeType })) || []
  );

  // Due Date Immutability: Once a due date has been saved for any phase, it cannot be edited directly.
  const isInitiationDateDueLocked = Boolean(init.dateDue);
  const isInvestigationPlanDueDateLocked = Boolean(inv.planDueDate);
  const isPlanningDueDateLocked = Boolean(plan.capaPlanDueDate);
  const isImplementationDueDateLocked = Boolean(impl.dateDue || impl.implementationDueDate);
  const isEffectivenessDueDateLocked = Boolean(eff.dateDue);

  // Investigation Phase Locking: If CAPA is in Investigation phase, lock all fields and tabs before and after.
  const isInvestigationPhase = currentPhase === CapaPhase.INVESTIGATION;

  // Approvers designated for the current phase:
  const currentPhaseApprovers = React.useMemo(() => {
    switch (currentPhase) {
      case CapaPhase.INITIATION:
        return {
          primaryId: initiationPrimaryApproverId,
          secondaryId: initiationSecondaryApproverId,
        };
      case CapaPhase.INVESTIGATION:
        return {
          primaryId: investigationPrimaryApproverId,
          secondaryId: investigationSecondaryApproverId,
        };
      case CapaPhase.PLANNING:
        return {
          primaryId: planningPrimaryApproverId,
          secondaryId: planningSecondaryApproverId,
        };
      case CapaPhase.IMPLEMENTATION:
        return {
          primaryId: implementationPrimaryApproverId,
          secondaryId: implementationSecondaryApproverId,
        };
      case CapaPhase.EFFECTIVENESS:
        return {
          primaryId: effectivenessPrimaryApproverId,
          secondaryId: effectivenessSecondaryApproverId,
        };
      default:
        return { primaryId: "", secondaryId: "" };
    }
  }, [
    currentPhase,
    initiationPrimaryApproverId,
    initiationSecondaryApproverId,
    investigationPrimaryApproverId,
    investigationSecondaryApproverId,
    planningPrimaryApproverId,
    planningSecondaryApproverId,
    implementationPrimaryApproverId,
    implementationSecondaryApproverId,
    effectivenessPrimaryApproverId,
    effectivenessSecondaryApproverId,
  ]);

  // Phase Approval Status:
  const isCurrentPhaseApproved = React.useMemo(() => {
    const hasApprovalLog = Boolean(
      capa.auditLogs?.some((log: any) => {
        const data = log.newData as Record<string, any> | null;
        return (
          log.entityType === "CapaPhaseApproval" &&
          data?.phase === currentPhase &&
          data?.status === "APPROVED"
        );
      })
    );
    if (hasApprovalLog) return true;

    // Investigation phase strictly requires designated approval
    if (currentPhase === CapaPhase.INVESTIGATION) {
      return false;
    }

    if (currentPhase === CapaPhase.INITIATION) {
      if (init.completedAt) return true;
      if (currentPhaseApprovers.primaryId) return false;
      return true;
    }

    if (currentPhaseApprovers.primaryId) {
      return false;
    }

    return true;
  }, [capa, currentPhase, init.completedAt, currentPhaseApprovers.primaryId]);

  const currentPhaseApprovalInfo = React.useMemo(() => {
    const log = capa.auditLogs?.find((l: any) => {
      const data = l.newData as Record<string, any> | null;
      return (
        l.entityType === "CapaPhaseApproval" &&
        data?.phase === currentPhase &&
        data?.status === "APPROVED"
      );
    });
    if (log) {
      return {
        approver: log.changedBy,
        approvedAt: log.timestamp,
      };
    }
    if (currentPhase === CapaPhase.INITIATION && init.completedAt) {
      return {
        approver: init.completedBy,
        approvedAt: init.completedAt,
      };
    }
    return null;
  }, [capa, currentPhase, init.completedAt, init.completedBy]);

  const canCurrentUserApprove = React.useMemo(() => {
    if (!user?.id) return false;
    return (
      user.id === currentPhaseApprovers.primaryId ||
      user.id === currentPhaseApprovers.secondaryId
    );
  }, [user?.id, currentPhaseApprovers]);

  const [isApprovingPhase, setIsApprovingPhase] = React.useState(false);

  const handleApprovePhase = async () => {
    if (!currentPhaseApprovers.primaryId) {
      toast.error("Please assign a primary approver before approving this phase.");
      return;
    }
    try {
      setIsApprovingPhase(true);
      await approveCapaPhase(capa.id, currentPhase);
      toast.success(`${humanize(currentPhase)} phase approved successfully`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve phase");
    } finally {
      setIsApprovingPhase(false);
    }
  };

  // Extension request UI state
  const [showExtensionForm, setShowExtensionForm] = React.useState(false);
  const [extTargetPhase, setExtTargetPhase] = React.useState<CapaPhase>(CapaPhase.INITIATION);
  const [extRequestedDueDate, setExtRequestedDueDate] = React.useState("");
  const [extJustification, setExtJustification] = React.useState("");
  const [extRiskRationale, setExtRiskRationale] = React.useState("");
  const [extPrimaryApproverId, setExtPrimaryApproverId] = React.useState("");
  const [extSecondaryApproverId, setExtSecondaryApproverId] = React.useState("");
  const [isSubmittingExt, setIsSubmittingExt] = React.useState(false);
  const [reviewingExtId, setReviewingExtId] = React.useState<string | null>(null);

  const getPhaseCurrentDueDate = (phase: CapaPhase) => {
    switch (phase) {
      case CapaPhase.INITIATION:
        return init.dateDue ? formatDate(init.dateDue) : "Not set";
      case CapaPhase.INVESTIGATION:
        return inv.planDueDate ? formatDate(inv.planDueDate) : "Not set";
      case CapaPhase.PLANNING:
        return plan.capaPlanDueDate ? formatDate(plan.capaPlanDueDate) : "Not set";
      case CapaPhase.IMPLEMENTATION:
        return (impl.dateDue || impl.implementationDueDate)
          ? formatDate(impl.dateDue || impl.implementationDueDate)
          : "Not set";
      case CapaPhase.EFFECTIVENESS:
        return eff.dateDue ? formatDate(eff.dateDue) : "Not set";
      default:
        return "Not set";
    }
  };

  const handleCreateExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extRequestedDueDate) {
      toast.error("Please specify a requested due date");
      return;
    }
    if (!extJustification.trim()) {
      toast.error("Justification is required for an extension request");
      return;
    }

    try {
      setIsSubmittingExt(true);
      await createExtensionRequest({
        capaId: capa.id,
        targetPhase: extTargetPhase,
        requestedDueDate: new Date(extRequestedDueDate),
        justification: extJustification.trim(),
        riskEvaluationRationale: extRiskRationale.trim() || null,
        primaryApproverId: extPrimaryApproverId || null,
        secondaryApproverId: extSecondaryApproverId || null,
      });
      toast.success("Extension request submitted successfully");
      setShowExtensionForm(false);
      setExtRequestedDueDate("");
      setExtJustification("");
      setExtRiskRationale("");
      setExtPrimaryApproverId("");
      setExtSecondaryApproverId("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit extension request");
    } finally {
      setIsSubmittingExt(false);
    }
  };

  const handleReviewExtension = async (extensionRequestId: string, decision: "APPROVED" | "REJECTED") => {
    try {
      setReviewingExtId(extensionRequestId);
      await reviewExtensionRequest({
        extensionRequestId,
        decision,
      });
      toast.success(`Extension request ${decision.toLowerCase()} successfully`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${decision.toLowerCase()} extension request`);
    } finally {
      setReviewingExtId(null);
    }
  };

  const toggleRootCauseTool = (tool: string) => {
    setSelectedRootCauseTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

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

  const ownerName =
    memberOptions.find((m) => m.value === ownerId)?.label ??
    (ownerId ? "Assigned" : "Unassigned");

  const completion = React.useMemo<Record<SectionId, Completion>>(() => {
    const initiation: Completion =
      shortDescription.trim() && problemStatement.trim() ? "done" : "attention";
    const investigation: Completion =
      investigationSummary.trim() || rootCauseDescription.trim()
        ? rootCauseDescription.trim() ? "done" : "attention"
        : "empty";
    const planning: Completion =
      planningActionPlan.trim() ? (planningEffectivenessCheckPlan.trim() ? "done" : "attention") : "empty";
    const implementation: Completion =
      implementationActionPlanSummary.trim() || implementationValidateComments.trim()
        ? (implementationValidateComments.trim() ? "done" : "attention")
        : "empty";
    const effectiveness: Completion = effectivenessVerificationSummary.trim() ? "done" : "empty";
    const controls: Completion = cancellationRequested
      ? cancellationJustification.trim() ? "done" : "attention"
      : "empty";
    return { initiation, investigation, planning, implementation, effectiveness, controls };
  }, [
    shortDescription,
    problemStatement,
    investigationSummary,
    rootCauseDescription,
    planningActionPlan,
    planningEffectivenessCheckPlan,
    implementationActionPlanSummary,
    implementationValidateComments,
    effectivenessVerificationSummary,
    cancellationRequested,
    cancellationJustification,
  ]);

  const phaseIndex = PHASE_STEPS.findIndex((p) => p.phase === String(currentPhase));

  /* ---------- submit (payload unchanged) ---------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shortDescription.trim()) {
      toast.error("Enter a short description");
      setActiveSection("initiation");
      return;
    }
    if (!problemStatement.trim()) {
      toast.error("Problem statement is required");
      setActiveSection("initiation");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        shortDescription: shortDescription.trim(),
        type,
        currentPhase,
        ownerId: ownerId || user?.id || "",
        cancellationRequested,
        cancellationJustification: cancellationRequested ? cancellationJustification.trim() : null,

        initiation: {
          problemStatement: problemStatement.trim(),
          containmentAction: containmentAction.trim() || null,
          dateDue: dateDue ? new Date(dateDue) : null,
          source: source.trim() || null,
          repeatCapa,
          capaReference: repeatCapa ? capaReference.trim() || null : null,
          existingCapa,
          existingOpenCapaReference: existingCapa ? existingOpenCapaReference.trim() || null : null,
          existingCapaDueDate: existingCapa && existingCapaDueDate ? new Date(existingCapaDueDate) : null,
          processOrProduct: processOrProduct || null,
          affectedArea: affectedArea.trim() || null,
          productDetails: productDetails.trim() || null,
          relatedProcess: relatedProcess.trim() || null,
          severityRanking: severityRanking || null,
          severityRationale: severityRationale.trim() || null,
          occurrenceRanking: occurrenceRanking || null,
          occurrenceRationale: occurrenceRationale.trim() || null,
          riskCategory: riskCategory || null,
          capaRequired,
          capaType: capaTypeCategory.trim() || null,
          capaSummary: capaSummary.trim() || null,
          fscaRequired,
          fscaRefNumber: fscaRequired ? fscaRefNumber.trim() || null : null,
          primaryApproverId: initiationPrimaryApproverId || null,
          secondaryApproverId: initiationSecondaryApproverId || null,
          completedById: initiationCompletedById || null,
          completedAt: initiationCompletedAt ? new Date(initiationCompletedAt) : null,
          attachments: initiationAttachments,
        },

        investigation: {
          containmentSummary: investigationContainmentSummary.trim() || null,
          investigationSummary: investigationSummary.trim() || null,
          rootCauseDescription: rootCauseDescription.trim() || null,
          rootCauseTools: selectedRootCauseTools,
          impactProductQuality,
          impactProductQualityRationale: impactProductQuality ? impactProductQualityRationale.trim() || null : null,
          planDueDate: investigationPlanDueDate ? new Date(investigationPlanDueDate) : null,
          investigatorId: investigatorId || null,
          primaryApproverId: investigationPrimaryApproverId || null,
          secondaryApproverId: investigationSecondaryApproverId || null,
          attachments: investigationAttachments,
        },

        planning: {
          capaPlanDueDate: capaPlanDueDate ? new Date(capaPlanDueDate) : null,
          actionPlan: planningActionPlan.trim() || null,
          effectivenessCheckPlan: planningEffectivenessCheckPlan.trim() || null,
          primaryApproverId: planningPrimaryApproverId || null,
          secondaryApproverId: planningSecondaryApproverId || null,
          attachments: planningAttachments,
        },

        implementation: {
          dateDue: implementationDateDue ? new Date(implementationDateDue) : null,
          implementationDueDate: implementationDateDue ? new Date(implementationDateDue) : null,
          actionPlan: implementationActionPlan.trim() || null,
          effectivenessCheckPlan: implementationEffectivenessCheckPlan.trim() || null,
          effectivenessDueDate: implementationEffectivenessDueDate ? new Date(implementationEffectivenessDueDate) : null,
          validateComments: implementationValidateComments.trim() || null,
          actionPlanSummary: implementationActionPlanSummary.trim() || null,
          riskEvaluation: implementationRiskEvaluation.trim() || null,
          primaryApproverId: implementationPrimaryApproverId || null,
          secondaryApproverId: implementationSecondaryApproverId || null,
          attachments: implementationAttachments,
        },

        effectiveness: {
          effectivenessVerificationSummary: effectivenessVerificationSummary.trim() || null,
          ineffectiveJustification: ineffectiveJustification.trim() || null,
          dateDue: effectivenessDateDue ? new Date(effectivenessDateDue) : null,
          primaryApproverId: effectivenessPrimaryApproverId || null,
          secondaryApproverId: effectivenessSecondaryApproverId || null,
          attachments: effectivenessAttachments,
        },

        extensionRequests: [],
        attachments: rootAttachments,
      };

      await updateCapa(capa.id, payload);
      toast.success("Changes saved");
      router.refresh();
    } catch (err: any) {
      console.error("[Update CAPA Error]", err);
      setError(err?.message || "Couldn't save the CAPA. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- reusable member select ---------- */

  const MemberSelect = ({
    id,
    value,
    onChange,
    placeholder = "Select",
  }: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      <option value="">{placeholder}</option>
      {memberOptions.map((m) => (
        <option key={m.key} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <Tabs
      value={activeSection}
      onValueChange={(val) => setActiveSection(val as SectionId)}
      className="-m-6 lg:-m-8 gap-0"
    >
      {/* ---------- Sticky record bar ---------- */}
      <div className="sticky -top-10 z-20 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="px-6 pt-3 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Link
                href={`/${orgSlug}/capa`}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                CAPA
              </Link>
              <span className="text-xs text-muted-foreground/60">/</span>
              <span className="font-mono text-sm font-medium text-foreground">{capa.capaNumber}</span>
              <Badge
                variant="outline"
                className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
              >
                {humanize(String(currentPhase))}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {type === CapaType.CORRECTIVE ? "Corrective" : "Preventive"}
              </Badge>
              {cancellationRequested && (
                <Badge
                  variant="outline"
                  className="border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
                >
                  Cancellation requested
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 lg:mt-2">
              <StatusTransitionTracker
                entityType="Capa"
                entityId={capa.id}
                currentStatus={currentPhase}
                disabled={isLockReadOnly}
                isAdvanceDisabled={!isCurrentPhaseApproved}
                advanceDisabledReason={`The ${humanize(currentPhase)} phase must be approved by the designated approver before moving to the next step.`}
                onStatusChanged={(newStatus) => {
                  setCurrentPhase(newStatus as CapaPhase);
                  router.refresh();
                }}
              />
              <Button
                type="submit"
                form="capa-form"
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

          <TabsList
            className="-mb-px mt-2 flex h-auto w-full gap-1 overflow-x-auto bg-transparent p-0 justify-start"
            aria-label="Phases"
          >
            {SECTIONS.map((s, i) => {
              const active = activeSection === s.id;
              return (
                <TabsTrigger
                  key={s.id}
                  value={s.id}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-none border-b-2 px-3 py-2.5 text-xs transition-colors bg-transparent shadow-none hover:bg-transparent data-[active]:border-foreground data-[selected]:border-foreground",
                    active
                      ? "border-foreground font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <CompletionDot state={completion[s.id]} />
                  {i < 5 ? `${i + 1}. ` : ""}
                  <span>{s.label}</span>
                  {isInvestigationPhase &&
                    (s.id === "initiation" ||
                      s.id === "planning" ||
                      s.id === "implementation" ||
                      s.id === "effectiveness") && (
                      <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                    )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </div>

      {/* ---------- Body ---------- */}
      <div className="grid gap-6 p-6 lg:p-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <form id="capa-form" onSubmit={handleSubmit} className="min-w-0 max-w-5xl space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <fieldset disabled={isLockReadOnly} className="contents space-y-6">
            {/* ---------- 1. Initiation ---------- */}
            <TabsContent value="initiation">
              <fieldset disabled={isLockReadOnly || isInvestigationPhase} className="contents">
                <SectionCard
                  id="initiation"
                  title="Initiation and problem definition"
                  description="Problem statement, origin, containment, and risk evaluation."
                  badge={<Badge variant="outline" className="font-mono text-[11px]">Phase 1</Badge>}
                >
                  <div className="space-y-4">
                    {isInvestigationPhase && (
                      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                        <Lock className="h-4 w-4 shrink-0 text-amber-600" />
                        <div>
                          <span className="font-semibold">Initiation Phase Locked:</span> All fields in this phase are locked because the CAPA has advanced to the Investigation phase.
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Field label="Short description" htmlFor="shortDescription" required className="md:col-span-2">
                      <Input
                        id="shortDescription"
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                        placeholder="Recurring sensor drift in lot 2026-04"
                        required
                      />
                    </Field>
                    <Field label="CAPA type" htmlFor="type">
                      <select
                        id="type"
                        value={type}
                        onChange={(e) => setType(e.target.value as CapaType)}
                        className={selectClass}
                      >
                        <option value={CapaType.CORRECTIVE}>Corrective action</option>
                        <option value={CapaType.PREVENTIVE}>Preventive action</option>
                      </select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Owner" htmlFor="ownerId">
                      <MemberSelect id="ownerId" value={ownerId} onChange={setOwnerId} placeholder="Unassigned" />
                    </Field>
                    <Field label="Initiation due date" htmlFor="dateDue">
                      <Input
                        id="dateDue"
                        type="date"
                        value={dateDue}
                        onChange={(e) => setDateDue(e.target.value)}
                        disabled={isInitiationDateDueLocked || isReadOnly}
                      />
                      {isInitiationDateDueLocked && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                          <Lock className="h-3 w-3 shrink-0" />
                          <span>Locked. Request extension in Controls.</span>
                        </p>
                      )}
                    </Field>
                    <Field label="Origin or trigger" htmlFor="source">
                      <Input
                        id="source"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder="Complaint CMP-2026-0418"
                      />
                    </Field>
                  </div>

                  <Field label="Problem statement" htmlFor="problemStatement" required>
                    <Textarea
                      id="problemStatement"
                      rows={4}
                      value={problemStatement}
                      onChange={(e) => setProblemStatement(e.target.value)}
                      placeholder="What is wrong, where it was observed, and the impact so far."
                      required
                    />
                  </Field>

                  <Field label="Immediate containment action" htmlFor="containmentAction">
                    <Textarea
                      id="containmentAction"
                      rows={3}
                      value={containmentAction}
                      onChange={(e) => setContainmentAction(e.target.value)}
                      placeholder="Quarantine, hold, or interim control already in place."
                    />
                  </Field>

                  {/* Risk assessment */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">ISO 14971 risk assessment</p>
                      </div>
                      <Badge variant="outline" className={cn("font-medium", RISK_TONE[riskCategory])}>
                        {humanize(riskCategory)} risk
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <Field label="Severity" htmlFor="severityRanking">
                        <select
                          id="severityRanking"
                          value={severityRanking}
                          onChange={(e) => setSeverityRanking(e.target.value)}
                          className={selectClass}
                        >
                          {SEVERITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Occurrence" htmlFor="occurrenceRanking">
                        <select
                          id="occurrenceRanking"
                          value={occurrenceRanking}
                          onChange={(e) => setOccurrenceRanking(e.target.value)}
                          className={selectClass}
                        >
                          {OCCURRENCE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Risk category" htmlFor="riskCategory">
                        <select
                          id="riskCategory"
                          value={riskCategory}
                          onChange={(e) => setRiskCategory(e.target.value)}
                          className={selectClass}
                        >
                          {RISK_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>

                  <SubGroup title="Approval">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Primary approver">
                        <MemberSelect value={initiationPrimaryApproverId} onChange={setInitiationPrimaryApproverId} />
                      </Field>
                      <Field label="Secondary approver">
                        <MemberSelect value={initiationSecondaryApproverId} onChange={setInitiationSecondaryApproverId} />
                      </Field>
                      <Field label="Completed by">
                        <MemberSelect value={initiationCompletedById} onChange={setInitiationCompletedById} />
                      </Field>
                      <Field label="Completed on">
                        <Input type="date" value={initiationCompletedAt} onChange={(e) => setInitiationCompletedAt(e.target.value)} />
                      </Field>
                    </div>
                  </SubGroup>

                  <SubGroup title={`Attachments · ${initiationAttachments.length}`}>
                    <FileUploader attachments={initiationAttachments} onChange={setInitiationAttachments} />
                  </SubGroup>
                </div>
              </SectionCard>
              </fieldset>
            </TabsContent>

            {/* ---------- 2. Investigation ---------- */}
            <TabsContent value="investigation">
              <SectionCard
                id="investigation"
                title="Root cause investigation"
                description="Analysis method, findings, and containment verification."
                badge={<Badge variant="outline" className="font-mono text-[11px]">Phase 2</Badge>}
              >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Investigation summary" htmlFor="investigationSummary">
                    <Textarea
                      id="investigationSummary"
                      rows={4}
                      value={investigationSummary}
                      onChange={(e) => setInvestigationSummary(e.target.value)}
                    />
                  </Field>
                  <Field label="Containment verification" htmlFor="investigationContainmentSummary">
                    <Textarea
                      id="investigationContainmentSummary"
                      rows={4}
                      value={investigationContainmentSummary}
                      onChange={(e) => setInvestigationContainmentSummary(e.target.value)}
                    />
                  </Field>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Root cause tools applied</Label>
                  <div className="flex flex-wrap gap-2">
                    {ROOT_CAUSE_TOOLS_OPTIONS.map((tool) => {
                      const on = selectedRootCauseTools.includes(tool);
                      return (
                        <button
                          key={tool}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleRootCauseTool(tool)}
                          className={cn(
                            "rounded-md border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                            on
                              ? "border-foreground bg-foreground font-medium text-background"
                              : "border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                          )}
                        >
                          {tool}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Field label="Root cause description" htmlFor="rootCauseDescription">
                  <Textarea
                    id="rootCauseDescription"
                    rows={4}
                    value={rootCauseDescription}
                    onChange={(e) => setRootCauseDescription(e.target.value)}
                    placeholder="The underlying cause, with evidence from the tools above."
                  />
                </Field>

                <SubGroup title="Ownership and approval">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Lead investigator">
                      <MemberSelect value={investigatorId} onChange={setInvestigatorId} />
                    </Field>
                    <Field label="Investigation due date">
                      <Input
                        type="date"
                        value={investigationPlanDueDate}
                        onChange={(e) => setInvestigationPlanDueDate(e.target.value)}
                        disabled={isInvestigationPlanDueDateLocked || isReadOnly}
                      />
                      {isInvestigationPlanDueDateLocked && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                          <Lock className="h-3 w-3 shrink-0" />
                          <span>Locked. Request extension in Controls.</span>
                        </p>
                      )}
                    </Field>
                    <Field label="Primary approver">
                      <MemberSelect value={investigationPrimaryApproverId} onChange={setInvestigationPrimaryApproverId} />
                    </Field>
                    <Field label="Secondary approver">
                      <MemberSelect value={investigationSecondaryApproverId} onChange={setInvestigationSecondaryApproverId} />
                    </Field>
                  </div>

                  {/* Phase Approval Status & Sign-off */}
                  <div className="mt-2 pt-3 border-t border-border">
                    {isCurrentPhaseApproved && currentPhase === CapaPhase.INVESTIGATION ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-semibold">Investigation Phase Approved:</span>{" "}
                            Approved by {currentPhaseApprovalInfo?.approver ? formatUserName(currentPhaseApprovalInfo.approver) : "Designated Approver"}
                            {currentPhaseApprovalInfo?.approvedAt ? ` on ${formatDate(currentPhaseApprovalInfo.approvedAt)}` : ""}.
                          </div>
                        </div>
                        <Badge className="bg-emerald-600 text-white font-medium border-0">
                          Ready to Advance
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-semibold">Approval Required:</span>{" "}
                            The approver must approve this phase before it can be moved to the next step (Planning).
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleApprovePhase}
                          disabled={isApprovingPhase || !investigationPrimaryApproverId || isLockReadOnly}
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        >
                          {isApprovingPhase ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              Approve Investigation Phase
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </SubGroup>

                <SubGroup title={`Attachments · ${investigationAttachments.length}`}>
                  <FileUploader attachments={investigationAttachments} onChange={setInvestigationAttachments} />
                </SubGroup>
              </div>
            </SectionCard>
            </TabsContent>

            {/* ---------- 3. Planning ---------- */}
            <TabsContent value="planning">
              <fieldset disabled={isLockReadOnly || isInvestigationPhase} className="contents">
                <SectionCard
                  id="planning"
                  title="Action planning"
                  description="Capa plan due date, action plan, effectiveness check plan, attachments, and approvals."
                  badge={<Badge variant="outline" className="font-mono text-[11px]">Phase 3</Badge>}
                >
                <div className="space-y-4">
                  {isInvestigationPhase && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                      <Lock className="h-4 w-4 shrink-0" />
                      <div>
                        <span className="font-semibold">Phase Locked:</span> Action Planning is locked until the Investigation phase is completed, approved, and advanced.
                      </div>
                    </div>
                  )}

                  <Field label="Action plan" htmlFor="planningActionPlan">
                    <Textarea
                      id="planningActionPlan"
                      rows={4}
                      value={planningActionPlan}
                      onChange={(e) => setPlanningActionPlan(e.target.value)}
                      placeholder="One task per line: what, who, by when."
                    />
                  </Field>

                  <Field label="Effectiveness check plan" htmlFor="planningEffectivenessCheckPlan">
                    <Textarea
                      id="planningEffectivenessCheckPlan"
                      rows={3}
                      value={planningEffectivenessCheckPlan}
                      onChange={(e) => setPlanningEffectivenessCheckPlan(e.target.value)}
                      placeholder="Measurable criteria and the data that will be reviewed."
                    />
                  </Field>

                  <SubGroup title="Dates and approval">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Field label="Capa plan due date">
                        <Input
                          type="date"
                          value={capaPlanDueDate}
                          onChange={(e) => setCapaPlanDueDate(e.target.value)}
                          disabled={isPlanningDueDateLocked || isReadOnly}
                        />
                        {isPlanningDueDateLocked && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                            <Lock className="h-3 w-3 shrink-0" />
                            <span>Locked. Request extension in Controls.</span>
                          </p>
                        )}
                      </Field>
                      <Field label="Primary approver">
                        <MemberSelect value={planningPrimaryApproverId} onChange={setPlanningPrimaryApproverId} />
                      </Field>
                      <Field label="Secondary approver">
                        <MemberSelect value={planningSecondaryApproverId} onChange={setPlanningSecondaryApproverId} />
                      </Field>
                    </div>
                  </SubGroup>

                  <SubGroup title={`Capa plan attachments · ${planningAttachments.length}`}>
                    <FileUploader attachments={planningAttachments} onChange={setPlanningAttachments} />
                  </SubGroup>
                </div>
              </SectionCard>
              </fieldset>
            </TabsContent>

            {/* ---------- 4. Implementation ---------- */}
            <TabsContent value="implementation">
              <fieldset disabled={isLockReadOnly || isInvestigationPhase} className="contents">
                <SectionCard
                  id="implementation"
                  title="Action implementation"
                  description="Execution details, validate comments, action plan summary, attachments, and approvals."
                  badge={<Badge variant="outline" className="font-mono text-[11px]">Phase 4</Badge>}
                >
                <div className="space-y-4">
                  {isInvestigationPhase && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                      <Lock className="h-4 w-4 shrink-0" />
                      <div>
                        <span className="font-semibold">Phase Locked:</span> Action Implementation is locked until the Investigation and Planning phases are completed and approved.
                      </div>
                    </div>
                  )}

                  <Field label="Action plan" htmlFor="implementationActionPlan">
                    <Textarea
                      id="implementationActionPlan"
                      rows={4}
                      value={implementationActionPlan}
                      onChange={(e) => setImplementationActionPlan(e.target.value)}
                      placeholder="Execution details of the action plan tasks."
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Action plan summary" htmlFor="implementationActionPlanSummary">
                      <Textarea
                        id="implementationActionPlanSummary"
                        rows={3}
                        value={implementationActionPlanSummary}
                        onChange={(e) => setImplementationActionPlanSummary(e.target.value)}
                      />
                    </Field>
                    <Field label="Validate comments" htmlFor="implementationValidateComments">
                      <Textarea
                        id="implementationValidateComments"
                        rows={3}
                        value={implementationValidateComments}
                        onChange={(e) => setImplementationValidateComments(e.target.value)}
                        placeholder="Validation and verification comments on executed actions."
                      />
                    </Field>
                  </div>

                  <Field label="Effectiveness check plan" htmlFor="implementationEffectivenessCheckPlan">
                    <Textarea
                      id="implementationEffectivenessCheckPlan"
                      rows={3}
                      value={implementationEffectivenessCheckPlan}
                      onChange={(e) => setImplementationEffectivenessCheckPlan(e.target.value)}
                      placeholder="Measurable criteria and verification execution details."
                    />
                  </Field>

                  <SubGroup title="Dates and approval">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Date due">
                        <Input
                          type="date"
                          value={implementationDateDue}
                          onChange={(e) => setImplementationDateDue(e.target.value)}
                          disabled={isImplementationDueDateLocked || isReadOnly}
                        />
                        {isImplementationDueDateLocked && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                            <Lock className="h-3 w-3 shrink-0" />
                            <span>Locked. Request extension in Controls.</span>
                          </p>
                        )}
                      </Field>
                      <Field label="Effectiveness date due">
                        <Input type="date" value={implementationEffectivenessDueDate} onChange={(e) => setImplementationEffectivenessDueDate(e.target.value)} />
                      </Field>
                      <Field label="Primary approver">
                        <MemberSelect value={implementationPrimaryApproverId} onChange={setImplementationPrimaryApproverId} />
                      </Field>
                      <Field label="Secondary approver">
                        <MemberSelect value={implementationSecondaryApproverId} onChange={setImplementationSecondaryApproverId} />
                      </Field>
                    </div>
                  </SubGroup>

                  <SubGroup title={`Attachments · ${implementationAttachments.length}`}>
                    <FileUploader attachments={implementationAttachments} onChange={setImplementationAttachments} />
                  </SubGroup>
                </div>
              </SectionCard>
              </fieldset>
            </TabsContent>

            {/* ---------- 5. Effectiveness ---------- */}
            <TabsContent value="effectiveness">
              <fieldset disabled={isLockReadOnly || isInvestigationPhase} className="contents">
                <SectionCard
                  id="effectiveness"
                  title="Effectiveness verification"
                  description="Evidence of non-recurrence and closeout authorisation."
                  badge={<Badge variant="outline" className="font-mono text-[11px]">Phase 5</Badge>}
                >
                <div className="space-y-4">
                  {isInvestigationPhase && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                      <Lock className="h-4 w-4 shrink-0" />
                      <div>
                        <span className="font-semibold">Phase Locked:</span> Effectiveness Verification is locked until preceding phases are completed and approved.
                      </div>
                    </div>
                  )}

                  <Field label="Verification summary" htmlFor="effectivenessVerificationSummary">
                    <Textarea
                      id="effectivenessVerificationSummary"
                      rows={4}
                      value={effectivenessVerificationSummary}
                      onChange={(e) => setEffectivenessVerificationSummary(e.target.value)}
                    />
                  </Field>

                  <Field label="Ineffective action justification" htmlFor="ineffectiveJustification">
                    <Textarea
                      id="ineffectiveJustification"
                      rows={3}
                      value={ineffectiveJustification}
                      onChange={(e) => setIneffectiveJustification(e.target.value)}
                      placeholder="Only if the actions did not meet the criteria."
                    />
                  </Field>

                  <SubGroup title="Dates and approval">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Field label="Verification due">
                        <Input
                          type="date"
                          value={effectivenessDateDue}
                          onChange={(e) => setEffectivenessDateDue(e.target.value)}
                          disabled={isEffectivenessDueDateLocked || isReadOnly}
                        />
                        {isEffectivenessDueDateLocked && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                            <Lock className="h-3 w-3 shrink-0" />
                            <span>Locked. Request extension in Controls.</span>
                          </p>
                        )}
                      </Field>
                      <Field label="Primary approver">
                        <MemberSelect value={effectivenessPrimaryApproverId} onChange={setEffectivenessPrimaryApproverId} />
                      </Field>
                      <Field label="Secondary approver">
                        <MemberSelect value={effectivenessSecondaryApproverId} onChange={setEffectivenessSecondaryApproverId} />
                      </Field>
                    </div>
                  </SubGroup>

                  <SubGroup title={`Attachments · ${effectivenessAttachments.length}`}>
                    <FileUploader attachments={effectivenessAttachments} onChange={setEffectivenessAttachments} />
                  </SubGroup>
                </div>
              </SectionCard>
              </fieldset>
            </TabsContent>

            {/* ---------- 5. Controls ---------- */}
            <TabsContent value="controls" className="space-y-6">
              <SectionCard
                id="controls"
                title="Phase due date extensions"
                description="Formal due date extension requests subject to regulatory review and approval."
                badge={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExtensionForm((prev) => !prev)}
                    className="h-7 text-xs"
                    disabled={isReadOnly}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    {showExtensionForm ? "Cancel" : "New request"}
                  </Button>
                }
              >
                <div className="space-y-4">
                  {showExtensionForm && (
                    <div className="rounded-lg border border-primary/20 bg-muted/40 p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <span className="text-xs font-semibold text-foreground">
                          Submit Stage Extension Request
                        </span>
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          Current: {getPhaseCurrentDueDate(extTargetPhase)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Target stage" htmlFor="extTargetPhase" required>
                          <select
                            id="extTargetPhase"
                            value={extTargetPhase}
                            onChange={(e) => setExtTargetPhase(e.target.value as CapaPhase)}
                            className={selectClass}
                          >
                            <option value={CapaPhase.INITIATION}>Initiation</option>
                            <option value={CapaPhase.INVESTIGATION}>Investigation</option>
                            <option value={CapaPhase.PLANNING}>Planning</option>
                            <option value={CapaPhase.IMPLEMENTATION}>Implementation</option>
                            <option value={CapaPhase.EFFECTIVENESS}>Effectiveness</option>
                          </select>
                        </Field>

                        <Field label="New requested due date" htmlFor="extRequestedDueDate" required>
                          <Input
                            id="extRequestedDueDate"
                            type="date"
                            value={extRequestedDueDate}
                            onChange={(e) => setExtRequestedDueDate(e.target.value)}
                            required
                          />
                        </Field>
                      </div>

                      <Field label="Justification" htmlFor="extJustification" required>
                        <Textarea
                          id="extJustification"
                          rows={3}
                          value={extJustification}
                          onChange={(e) => setExtJustification(e.target.value)}
                          placeholder="Provide root-cause delay explanation and technical justification."
                          required
                        />
                      </Field>

                      <Field label="Risk evaluation rationale" htmlFor="extRiskRationale">
                        <Textarea
                          id="extRiskRationale"
                          rows={2}
                          value={extRiskRationale}
                          onChange={(e) => setExtRiskRationale(e.target.value)}
                          placeholder="Assessment of impact on product quality and patient safety during extension."
                        />
                      </Field>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Primary approver">
                          <MemberSelect
                            value={extPrimaryApproverId}
                            onChange={setExtPrimaryApproverId}
                            placeholder="Select QA / Lead Approver"
                          />
                        </Field>
                        <Field label="Secondary approver">
                          <MemberSelect
                            value={extSecondaryApproverId}
                            onChange={setExtSecondaryApproverId}
                            placeholder="Select Secondary Approver"
                          />
                        </Field>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowExtensionForm(false)}
                          disabled={isSubmittingExt}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateExtension}
                          disabled={isSubmittingExt || !extRequestedDueDate || !extJustification.trim()}
                        >
                          {isSubmittingExt ? (
                            <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit extension request"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Extension Requests List */}
                  {(!capa.extensionRequests || capa.extensionRequests.length === 0) ? (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                      No extension requests recorded. Phase due dates can be extended by submitting a formal request above.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {capa.extensionRequests.map((req: any) => {
                        const isPending = req.status === ExtensionRequestStatus.PENDING;
                        const isApproved = req.status === ExtensionRequestStatus.APPROVED;
                        const isRejected = req.status === ExtensionRequestStatus.REJECTED;

                        return (
                          <div
                            key={req.id}
                            className="rounded-lg border border-border bg-card p-4 space-y-3 transition-colors"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="font-mono text-[11px] font-medium">
                                  {humanize(req.targetPhase)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Requested date:{" "}
                                  <strong className="text-foreground">
                                    {formatDate(req.requestedDueDate)}
                                  </strong>
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {isPending && (
                                  <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-400 gap-1">
                                    <Clock className="h-3 w-3" />
                                    Pending Review
                                  </Badge>
                                )}
                                {isApproved && (
                                  <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Approved
                                  </Badge>
                                )}
                                {isRejected && (
                                  <Badge className="border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-400 gap-1">
                                    <XCircle className="h-3 w-3" />
                                    Rejected
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <div className="text-foreground">
                                <span className="font-medium text-muted-foreground">Justification: </span>
                                {req.justification}
                              </div>
                              {req.riskEvaluationRationale && (
                                <div className="text-muted-foreground">
                                  <span className="font-medium">Risk rationale: </span>
                                  {req.riskEvaluationRationale}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground">
                                <span>
                                  Requester: <strong className="text-foreground">{formatUserName(req.requester)}</strong>
                                </span>
                                {req.primaryApprover && (
                                  <span>
                                    Primary: <strong className="text-foreground">{formatUserName(req.primaryApprover)}</strong>
                                  </span>
                                )}
                                {req.secondaryApprover && (
                                  <span>
                                    Secondary: <strong className="text-foreground">{formatUserName(req.secondaryApprover)}</strong>
                                  </span>
                                )}
                                <span>Created: {formatDate(req.createdAt)}</span>
                              </div>
                            </div>

                            {isPending && !isReadOnly && (
                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => handleReviewExtension(req.id, "REJECTED")}
                                  disabled={reviewingExtId === req.id}
                                >
                                  {reviewingExtId === req.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Reject"
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => handleReviewExtension(req.id, "APPROVED")}
                                  disabled={reviewingExtId === req.id}
                                >
                                  {reviewingExtId === req.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Approve extension"
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                id="controls"
                title="Formal cancellation"
                description="Void this CAPA record subject to regulatory justification and signoff."
              >
                <div
                  className={cn(
                    "rounded-lg border p-4 transition-colors",
                    cancellationRequested
                      ? "border-red-500/30 bg-red-500/10"
                      : "border-border bg-muted/30"
                  )}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={cancellationRequested}
                      onChange={(e) => setCancellationRequested(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border accent-red-600"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        Request formal cancellation
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Voids this CAPA. Requires a justification and approval.
                      </span>
                    </span>
                  </label>

                  {cancellationRequested && (
                    <div className="mt-4">
                      <Field label="Cancellation justification" htmlFor="cancellationJustification" required>
                        <Textarea
                          id="cancellationJustification"
                          rows={3}
                          value={cancellationJustification}
                          onChange={(e) => setCancellationJustification(e.target.value)}
                          className="bg-background"
                          required={cancellationRequested}
                          placeholder="Why this CAPA is no longer required, with regulatory rationale."
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </SectionCard>
            </TabsContent>

            <div className="flex items-center justify-between pt-2">
              <Link
                href={`/${orgSlug}/capa`}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel and return
              </Link>
            </div>
          </fieldset>
        </form>

        {/* ---------- Right context panel ---------- */}
        <aside className="space-y-4 xl:sticky xl:top-[120px] xl:self-start">
          <PanelCard title="Details">
            <dl className="divide-y divide-border">
              {[
                ["Owner", ownerName],
                ["Type", type === CapaType.CORRECTIVE ? "Corrective" : "Preventive"],
                ["Risk", `${humanize(riskCategory)}`],
                ["Initiation due", dateDue ? formatDate(dateDue) : "—"],
                ["Opened", formatDate(capa.createdAt)],
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

          <PanelCard title="Phase progress">
            <ol className="space-y-2">
              {PHASE_STEPS.map((step, i) => {
                const state = i < phaseIndex ? "done" : i === phaseIndex ? "current" : "todo";
                return (
                  <li key={step.phase} className="flex items-center gap-2.5 text-xs">
                    <span
                      aria-hidden
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        state === "done" && "bg-emerald-500",
                        state === "current" && "bg-foreground ring-4 ring-foreground/10",
                        state === "todo" && "bg-border"
                      )}
                    />
                    <span
                      className={cn(
                        state === "current" && "font-medium text-foreground",
                        state === "done" && "text-foreground",
                        state === "todo" && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              Advance phases with the status control in the header.
            </p>
          </PanelCard>

          <PanelCard title={`Record attachments · ${rootAttachments.length}`}>
            <FileUploader attachments={rootAttachments} onChange={setRootAttachments} />
            {rootAttachments.length === 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip className="h-3 w-3" /> Memos and cross-phase evidence.
              </p>
            )}
          </PanelCard>
        </aside>
      </div>
    </Tabs>
  );
}