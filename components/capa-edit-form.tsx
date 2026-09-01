"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ClipboardCheck,
  FileText,
  SearchCode,
  CheckCircle2,
  Target,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Loader2,
  Save,
  ArrowLeft,
  Wrench,
  ShieldAlert,
  Layers,
  UserCheck,
} from "lucide-react";
import { CapaType, CapaPhase, ExtensionRequestStatus, LockEntityType } from "@prisma/client";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useRecordLock } from "@/hooks/useRecordLock";

import { StatusTransitionTracker } from "@/components/status-transition-tracker";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
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
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileUploader } from "@/components/file-uploader";
import { updateCapa, type AttachmentInput } from "@/lib/actions/capa";
import { formatUserName, cn } from "@/lib/utils";

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

  const { memberships } = useOrganization({
    memberships: {
      pageSize: 100,
      keepPreviousData: true,
    },
  });

  const toDateString = (iso?: string | Date | null) =>
    iso ? new Date(iso).toISOString().split("T")[0] : "";

  const [activeTab, setActiveTab] = React.useState("initiation");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Core CAPA
  const [shortDescription, setShortDescription] = React.useState(capa.shortDescription || "");
  const [type, setType] = React.useState<CapaType>(capa.type || CapaType.CORRECTIVE);
  const [currentPhase, setCurrentPhase] = React.useState<CapaPhase>(capa.currentPhase || CapaPhase.INITIATION);
  const [ownerId, setOwnerId] = React.useState(capa.ownerId || "");

  // Initiation
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
    init.attachments?.map((a: any) => ({
      fileUrl: a.fileUrl,
      fileName: a.fileName,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
    })) || []
  );

  // Investigation
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
    inv.attachments?.map((a: any) => ({
      fileUrl: a.fileUrl,
      fileName: a.fileName,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
    })) || []
  );

  // Implementation
  const impl = capa.implementation || {};
  const [actionPlan, setActionPlan] = React.useState(impl.actionPlan || "");
  const [actionPlanSummary, setActionPlanSummary] = React.useState(impl.actionPlanSummary || "");
  const [riskEvaluation, setRiskEvaluation] = React.useState(impl.riskEvaluation || "");
  const [implementationDueDate, setImplementationDueDate] = React.useState(toDateString(impl.implementationDueDate));
  const [effectivenessCheckPlan, setEffectivenessCheckPlan] = React.useState(impl.effectivenessCheckPlan || "");
  const [effectivenessDueDate, setEffectivenessDueDate] = React.useState(toDateString(impl.effectivenessDueDate));
  const [implementationPrimaryApproverId, setImplementationPrimaryApproverId] = React.useState(impl.primaryApproverId || "");
  const [implementationSecondaryApproverId, setImplementationSecondaryApproverId] = React.useState(impl.secondaryApproverId || "");
  const [implementationAttachments, setImplementationAttachments] = React.useState<AttachmentInput[]>(
    impl.attachments?.map((a: any) => ({
      fileUrl: a.fileUrl,
      fileName: a.fileName,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
    })) || []
  );

  // Effectiveness
  const eff = capa.effectiveness || {};
  const [effectivenessVerificationSummary, setEffectivenessVerificationSummary] = React.useState(eff.effectivenessVerificationSummary || "");
  const [ineffectiveJustification, setIneffectiveJustification] = React.useState(eff.ineffectiveJustification || "");
  const [effectivenessDateDue, setEffectivenessDateDue] = React.useState(toDateString(eff.dateDue));
  const [effectivenessPrimaryApproverId, setEffectivenessPrimaryApproverId] = React.useState(eff.primaryApproverId || "");
  const [effectivenessSecondaryApproverId, setEffectivenessSecondaryApproverId] = React.useState(eff.secondaryApproverId || "");
  const [effectivenessAttachments, setEffectivenessAttachments] = React.useState<AttachmentInput[]>(
    eff.attachments?.map((a: any) => ({
      fileUrl: a.fileUrl,
      fileName: a.fileName,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
    })) || []
  );

  // Cancellation & Extensions
  const [cancellationRequested, setCancellationRequested] = React.useState(capa.cancellationRequested || false);
  const [cancellationJustification, setCancellationJustification] = React.useState(capa.cancellationJustification || "");
  const [rootAttachments, setRootAttachments] = React.useState<AttachmentInput[]>(
    capa.attachments?.map((a: any) => ({
      fileUrl: a.fileUrl,
      fileName: a.fileName,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
    })) || []
  );

  const toggleRootCauseTool = (tool: string) => {
    setSelectedRootCauseTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shortDescription.trim()) {
      toast.error("Validation Error", { description: "Please enter a Short Description." });
      setActiveTab("initiation");
      return;
    }

    if (!problemStatement.trim()) {
      toast.error("Validation Error", { description: "Problem Statement is required." });
      setActiveTab("initiation");
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

        implementation: {
          actionPlan: actionPlan.trim() || null,
          actionPlanSummary: actionPlanSummary.trim() || null,
          riskEvaluation: riskEvaluation.trim() || null,
          implementationDueDate: implementationDueDate ? new Date(implementationDueDate) : null,
          effectivenessCheckPlan: effectivenessCheckPlan.trim() || null,
          effectivenessDueDate: effectivenessDueDate ? new Date(effectivenessDueDate) : null,
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

      toast.success("CAPA Updated", {
        description: `Changes to ${capa.capaNumber} have been saved.`,
      });

      router.refresh();
    } catch (err: any) {
      console.error("[Update CAPA Error]", err);
      setError(err?.message || "Failed to update CAPA.");
      toast.error("Save Failed", { description: err?.message || "Please check required fields." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex justify-center py-6 px-4">
      <div className="w-full max-w-8xl space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${orgSlug}/capa`}>CAPA</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{capa.capaNumber}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Main Card */}
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border pb-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <ClipboardCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl font-bold">{capa.capaNumber}: {capa.shortDescription}</CardTitle>
                    {capa.cancellationRequested && (
                      <Badge variant="destructive" className="text-[10px] uppercase font-mono">
                        Cancellation Requested
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    Manage all phase assessments, risk matrix, action plans, and effectiveness verification.
                  </CardDescription>
                </div>
              </div>

              {/* 21 CFR Part 11 Status Transition Tracker with E-Signature */}
              <StatusTransitionTracker
                entityType="Capa"
                entityId={capa.id}
                currentStatus={currentPhase}
                disabled={isLockReadOnly}
                onStatusChanged={(newStatus) => {
                  setCurrentPhase(newStatus as CapaPhase);
                  router.refresh();
                }}
              />
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <fieldset disabled={isLockReadOnly} className="contents">
              <CardContent className="space-y-6 pt-6">
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
                <TabsList className="w-full sm:w-auto flex flex-wrap h-auto p-1 bg-muted/50 gap-1 rounded-lg">
                  <TabsTrigger value="initiation" className="gap-2 text-xs py-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    1. Initiation Phase
                  </TabsTrigger>
                  <TabsTrigger value="investigation" className="gap-2 text-xs py-2">
                    <SearchCode className="h-4 w-4 text-indigo-500" />
                    2. Investigation Phase
                  </TabsTrigger>
                  <TabsTrigger value="implementation" className="gap-2 text-xs py-2">
                    <Wrench className="h-4 w-4 text-amber-500" />
                    3. Implementation Phase
                  </TabsTrigger>
                  <TabsTrigger value="effectiveness" className="gap-2 text-xs py-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    4. Effectiveness Phase
                  </TabsTrigger>
                  <TabsTrigger value="extensions" className="gap-2 text-xs py-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    5. Extensions & Cancellation
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: Initiation */}
                <div className="mt-6 rounded-xl border border-border bg-muted/15 p-6">
                  <TabsContent value="initiation" className="mt-0 space-y-6 outline-none">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Initiation & Problem Definition</h2>
                        <p className="text-xs text-muted-foreground">
                          Core problem statement, origin, containment, and strict risk evaluations.
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono text-[11px]">Phase 1</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-xs font-semibold">Short Description / Title <span className="text-destructive">*</span></Label>
                        <Input
                          value={shortDescription}
                          onChange={(e) => setShortDescription(e.target.value)}
                          className="text-xs h-9"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">CAPA Type</Label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as CapaType)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value={CapaType.CORRECTIVE}>Corrective Action</option>
                          <option value={CapaType.PREVENTIVE}>Preventive Action</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">CAPA Owner</Label>
                        <select
                          value={ownerId}
                          onChange={(e) => setOwnerId(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value="">Select Owner...</option>
                          {memberships?.data?.map((m) => (
                            <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                              {formatUserName(m.publicUserData, "User")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Initiation Target Due Date</Label>
                        <Input
                          type="date"
                          value={dateDue}
                          onChange={(e) => setDateDue(e.target.value)}
                          className="text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Origin / Trigger Source</Label>
                        <Input
                          value={source}
                          onChange={(e) => setSource(e.target.value)}
                          className="text-xs h-9"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Problem Statement <span className="text-destructive">*</span></Label>
                        <Textarea
                          value={problemStatement}
                          onChange={(e) => setProblemStatement(e.target.value)}
                          rows={4}
                          className="text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Immediate Containment Action</Label>
                        <Textarea
                          value={containmentAction}
                          onChange={(e) => setContainmentAction(e.target.value)}
                          rows={3}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Risk Section */}
                    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-amber-500" /> ISO 14971 Risk Assessment Matrix
                        </h3>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {riskCategory} RISK
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Severity Ranking</Label>
                          <select
                            value={severityRanking}
                            onChange={(e) => setSeverityRanking(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                          >
                            {SEVERITY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Occurrence Ranking</Label>
                          <select
                            value={occurrenceRanking}
                            onChange={(e) => setOccurrenceRanking(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                          >
                            {OCCURRENCE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Calculated Risk Category</Label>
                          <select
                            value={riskCategory}
                            onChange={(e) => setRiskCategory(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                          >
                            {RISK_CATEGORIES.map((cat) => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Dual Approvers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Primary Approver</Label>
                        <select
                          value={initiationPrimaryApproverId}
                          onChange={(e) => setInitiationPrimaryApproverId(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value="">Select Approver...</option>
                          {memberships?.data?.map((m) => (
                            <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                              {formatUserName(m.publicUserData, "User")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Secondary Approver</Label>
                        <select
                          value={initiationSecondaryApproverId}
                          onChange={(e) => setInitiationSecondaryApproverId(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value="">Select Approver...</option>
                          {memberships?.data?.map((m) => (
                            <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                              {formatUserName(m.publicUserData, "User")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Completed By</Label>
                        <select
                          value={initiationCompletedById}
                          onChange={(e) => setInitiationCompletedById(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value="">Select User...</option>
                          {memberships?.data?.map((m) => (
                            <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                              {formatUserName(m.publicUserData, "User")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Completed Date</Label>
                        <Input
                          type="date"
                          value={initiationCompletedAt}
                          onChange={(e) => setInitiationCompletedAt(e.target.value)}
                          className="text-xs h-9"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Initiation Attachments</Label>
                      <FileUploader
                        attachments={initiationAttachments}
                        onChange={setInitiationAttachments}
                      />
                    </div>
                  </TabsContent>

                  {/* TAB 2: Investigation */}
                  <TabsContent value="investigation" className="mt-0 space-y-6 outline-none">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Root Cause Investigation</h2>
                        <p className="text-xs text-muted-foreground">Perform root cause analysis and impact assessment.</p>
                      </div>
                      <Badge variant="outline" className="font-mono text-[11px]">Phase 2</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Investigation Summary</Label>
                        <Textarea
                          value={investigationSummary}
                          onChange={(e) => setInvestigationSummary(e.target.value)}
                          rows={4}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Containment Verification</Label>
                        <Textarea
                          value={investigationContainmentSummary}
                          onChange={(e) => setInvestigationContainmentSummary(e.target.value)}
                          rows={4}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label className="text-xs font-semibold">Root Cause Analysis Tools Applied</Label>
                      <div className="flex flex-wrap gap-2">
                        {ROOT_CAUSE_TOOLS_OPTIONS.map((tool) => {
                          const isSelected = selectedRootCauseTools.includes(tool);
                          return (
                            <button
                              key={tool}
                              type="button"
                              onClick={() => toggleRootCauseTool(tool)}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                                isSelected
                                  ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300"
                                  : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                              )}
                            >
                              <span className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-indigo-500" : "bg-muted-foreground/40")} />
                              {tool}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Root Cause Detailed Description</Label>
                      <Textarea
                        value={rootCauseDescription}
                        onChange={(e) => setRootCauseDescription(e.target.value)}
                        rows={4}
                        className="text-xs"
                      />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Lead Investigator</Label>
                        <select
                          value={investigatorId}
                          onChange={(e) => setInvestigatorId(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value="">Select Investigator...</option>
                          {memberships?.data?.map((m) => (
                            <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                              {formatUserName(m.publicUserData, "User")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Plan Due Date</Label>
                        <Input
                          type="date"
                          value={investigationPlanDueDate}
                          onChange={(e) => setInvestigationPlanDueDate(e.target.value)}
                          className="text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Primary Approver</Label>
                        <select
                          value={investigationPrimaryApproverId}
                          onChange={(e) => setInvestigationPrimaryApproverId(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value="">Select Approver...</option>
                          {memberships?.data?.map((m) => (
                            <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                              {formatUserName(m.publicUserData, "User")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Secondary Approver</Label>
                        <select
                          value={investigationSecondaryApproverId}
                          onChange={(e) => setInvestigationSecondaryApproverId(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                        >
                          <option value="">Select Approver...</option>
                          {memberships?.data?.map((m) => (
                            <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                              {formatUserName(m.publicUserData, "User")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Investigation Attachments</Label>
                      <FileUploader
                        attachments={investigationAttachments}
                        onChange={setInvestigationAttachments}
                      />
                    </div>
                  </TabsContent>

                  {/* TAB 3: Implementation */}
                  <TabsContent value="implementation" className="mt-0 space-y-6 outline-none">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Action Implementation</h2>
                        <p className="text-xs text-muted-foreground">Action plans, ECOs, and effectiveness verification criteria.</p>
                      </div>
                      <Badge variant="outline" className="font-mono text-[11px]">Phase 3</Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Action Plan Implementation Tasks</Label>
                        <Textarea
                          value={actionPlan}
                          onChange={(e) => setActionPlan(e.target.value)}
                          rows={4}
                          className="text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Action Plan Summary</Label>
                          <Textarea
                            value={actionPlanSummary}
                            onChange={(e) => setActionPlanSummary(e.target.value)}
                            rows={3}
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Risk Evaluation of Changes</Label>
                          <Textarea
                            value={riskEvaluation}
                            onChange={(e) => setRiskEvaluation(e.target.value)}
                            rows={3}
                            className="text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Effectiveness Verification Criteria</Label>
                        <Textarea
                          value={effectivenessCheckPlan}
                          onChange={(e) => setEffectivenessCheckPlan(e.target.value)}
                          rows={3}
                          className="text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Implementation Due Date</Label>
                          <Input
                            type="date"
                            value={implementationDueDate}
                            onChange={(e) => setImplementationDueDate(e.target.value)}
                            className="text-xs h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Effectiveness Check Due Date</Label>
                          <Input
                            type="date"
                            value={effectivenessDueDate}
                            onChange={(e) => setEffectivenessDueDate(e.target.value)}
                            className="text-xs h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Primary Approver</Label>
                          <select
                            value={implementationPrimaryApproverId}
                            onChange={(e) => setImplementationPrimaryApproverId(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="">Select Approver...</option>
                            {memberships?.data?.map((m) => (
                              <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                                {formatUserName(m.publicUserData, "User")}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Secondary Approver</Label>
                          <select
                            value={implementationSecondaryApproverId}
                            onChange={(e) => setImplementationSecondaryApproverId(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="">Select Approver...</option>
                            {memberships?.data?.map((m) => (
                              <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                                {formatUserName(m.publicUserData, "User")}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Implementation Attachments</Label>
                      <FileUploader
                        attachments={implementationAttachments}
                        onChange={setImplementationAttachments}
                      />
                    </div>
                  </TabsContent>

                  {/* TAB 4: Effectiveness */}
                  <TabsContent value="effectiveness" className="mt-0 space-y-6 outline-none">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Effectiveness Verification</h2>
                        <p className="text-xs text-muted-foreground">Verify non-recurrence and closeout authorization.</p>
                      </div>
                      <Badge variant="outline" className="font-mono text-[11px]">Phase 4</Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Effectiveness Verification Summary</Label>
                        <Textarea
                          value={effectivenessVerificationSummary}
                          onChange={(e) => setEffectivenessVerificationSummary(e.target.value)}
                          rows={4}
                          className="text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Ineffective Action Justification (if any)</Label>
                        <Textarea
                          value={ineffectiveJustification}
                          onChange={(e) => setIneffectiveJustification(e.target.value)}
                          rows={3}
                          className="text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Verification Due Date</Label>
                          <Input
                            type="date"
                            value={effectivenessDateDue}
                            onChange={(e) => setEffectivenessDateDue(e.target.value)}
                            className="text-xs h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Primary Approver</Label>
                          <select
                            value={effectivenessPrimaryApproverId}
                            onChange={(e) => setEffectivenessPrimaryApproverId(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="">Select Approver...</option>
                            {memberships?.data?.map((m) => (
                              <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                                {formatUserName(m.publicUserData, "User")}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Secondary Approver</Label>
                          <select
                            value={effectivenessSecondaryApproverId}
                            onChange={(e) => setEffectivenessSecondaryApproverId(e.target.value)}
                            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="">Select Approver...</option>
                            {memberships?.data?.map((m) => (
                              <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                                {formatUserName(m.publicUserData, "User")}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Effectiveness Verification Attachments</Label>
                      <FileUploader
                        attachments={effectivenessAttachments}
                        onChange={setEffectivenessAttachments}
                      />
                    </div>
                  </TabsContent>

                  {/* TAB 5: Extensions & Cancellation */}
                  <TabsContent value="extensions" className="mt-0 space-y-6 outline-none">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Extensions & Cancellation</h2>
                        <p className="text-xs text-muted-foreground">Due-date extensions and formal cancellation memos.</p>
                      </div>
                      <Badge variant="outline" className="font-mono text-[11px]">Controls</Badge>
                    </div>

                    {/* Cancellation Block */}
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="cancellationRequested"
                          checked={cancellationRequested}
                          onChange={(e) => setCancellationRequested(e.target.checked)}
                          className="h-4 w-4 rounded border-input text-destructive focus:ring-destructive"
                        />
                        <Label htmlFor="cancellationRequested" className="text-xs font-semibold text-destructive cursor-pointer">
                          Request Formal CAPA Cancellation (Voiding Action)
                        </Label>
                      </div>

                      {cancellationRequested && (
                        <div className="space-y-2 animate-in fade-in-50">
                          <Label className="text-xs font-semibold text-destructive">
                            Cancellation Justification & Regulatory Rationalization <span className="text-destructive">*</span>
                          </Label>
                          <Textarea
                            value={cancellationJustification}
                            onChange={(e) => setCancellationJustification(e.target.value)}
                            rows={3}
                            className="text-xs bg-background"
                            required={cancellationRequested}
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Root Attachments & Cancellation Memos</Label>
                      <FileUploader
                        attachments={rootAttachments}
                        onChange={setRootAttachments}
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>

            <CardFooter className="border-t border-border bg-muted/20 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href={`/${orgSlug}/capa`}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs")}
              >
                Cancel
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting || isLockReadOnly}
                className="text-xs h-9 gap-2 px-5 font-semibold shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save CAPA Record</span>
                  </>
                )}
              </Button>
            </CardFooter>
            </fieldset>
          </form>
        </Card>
      </div>
    </div>
  );
}
