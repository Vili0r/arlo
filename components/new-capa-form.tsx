"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ClipboardCheck,
  FileText,
  ShieldAlert,
  Loader2,
  Save,
  ArrowLeft,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";
import { CapaType, CapaPhase } from "@prisma/client";
import { useOrganization, useUser } from "@clerk/nextjs";

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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileUploader } from "@/components/file-uploader";
import { createCapa, type AttachmentInput } from "@/lib/actions/capa";
import { formatUserName, cn } from "@/lib/utils";

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

interface NewCapaFormProps {
  orgSlug: string;
}

export function NewCapaForm({ orgSlug }: NewCapaFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const { memberships } = useOrganization({
    memberships: {
      pageSize: 100,
      keepPreviousData: true,
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // -------------------------------------------------------------
  // Form State: Core CAPA & Initiation Phase
  // -------------------------------------------------------------
  const [shortDescription, setShortDescription] = React.useState("");
  const [type, setType] = React.useState<CapaType>(CapaType.CORRECTIVE);
  const [ownerId, setOwnerId] = React.useState(user?.id || "");

  // CapaInitiation Fields
  const [problemStatement, setProblemStatement] = React.useState("");
  const [containmentAction, setContainmentAction] = React.useState("");
  const [dateDue, setDateDue] = React.useState("");
  const [source, setSource] = React.useState("Internal Quality Audit");
  const [repeatCapa, setRepeatCapa] = React.useState(false);
  const [capaReference, setCapaReference] = React.useState("");
  const [existingCapa, setExistingCapa] = React.useState(false);
  const [existingOpenCapaReference, setExistingOpenCapaReference] = React.useState("");
  const [existingCapaDueDate, setExistingCapaDueDate] = React.useState("");

  const [processOrProduct, setProcessOrProduct] = React.useState("Product");
  const [affectedArea, setAffectedArea] = React.useState("");
  const [productDetails, setProductDetails] = React.useState("");
  const [relatedProcess, setRelatedProcess] = React.useState("");

  const [severityRanking, setSeverityRanking] = React.useState("MAJOR");
  const [severityRationale, setSeverityRationale] = React.useState("");
  const [occurrenceRanking, setOccurrenceRanking] = React.useState("OCCASIONAL");
  const [occurrenceRationale, setOccurrenceRationale] = React.useState("");
  const [riskCategory, setRiskCategory] = React.useState("HIGH");

  const [capaRequired, setCapaRequired] = React.useState(true);
  const [capaTypeCategory, setCapaTypeCategory] = React.useState("Process Optimization");
  const [capaSummary, setCapaSummary] = React.useState("");

  const [fscaRequired, setFscaRequired] = React.useState(false);
  const [fscaRefNumber, setFscaRefNumber] = React.useState("");

  const [initiationPrimaryApproverId, setInitiationPrimaryApproverId] = React.useState("");
  const [initiationSecondaryApproverId, setInitiationSecondaryApproverId] = React.useState("");
  const [initiationCompletedById, setInitiationCompletedById] = React.useState(user?.id || "");
  const [initiationCompletedAt, setInitiationCompletedAt] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [initiationAttachments, setInitiationAttachments] = React.useState<AttachmentInput[]>([]);

  // Set default owner when Clerk user is loaded
  React.useEffect(() => {
    if (user?.id) {
      if (!ownerId) setOwnerId(user.id);
      if (!initiationCompletedById) setInitiationCompletedById(user.id);
    }
  }, [user, ownerId, initiationCompletedById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shortDescription.trim()) {
      toast.error("Validation Error", { description: "Please enter a Short Description for the CAPA." });
      return;
    }

    if (!problemStatement.trim()) {
      toast.error("Validation Error", { description: "Problem Statement is required." });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        shortDescription: shortDescription.trim(),
        type,
        currentPhase: CapaPhase.INITIATION,
        ownerId: ownerId || user?.id || "",
        cancellationRequested: false,
        cancellationJustification: null,

        // Initiation Phase data
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

        extensionRequests: [],
        attachments: [],
      };

      const newCapa = await createCapa(payload);

      toast.success("CAPA Initiated", {
        description: `CAPA ${newCapa.capaNumber} has been successfully created.`,
      });

      router.push(`/${orgSlug}/capa/${newCapa.capaId}`);
    } catch (err: any) {
      console.error("[Create CAPA Error]", err);
      setError(err?.message || "Failed to initiate CAPA. Please verify inputs.");
      toast.error("Creation Failed", { description: err?.message || "Please check required fields." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex justify-center py-6 px-4">
      <div className="w-full max-w-6xl space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/${orgSlug}/capa`}>CAPA</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Initiate New CAPA</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Main Card */}
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border pb-5 flex-row justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl font-bold">Initiate New CAPA</CardTitle>
                </div>
                <CardDescription className="mt-1 text-xs">
                  Record initial problem definition, containment actions, risk evaluation matrix.
                </CardDescription>
              </div>
            </div>

              {/* Phase Progression Status Indicator */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors bg-primary text-primary-foreground border-primary">
                  <span className="font-mono text-[12px]">1. Initiation</span>
                </div>
              </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Core CAPA Meta */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" /> Core Information & Ownership
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Short Description / Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="e.g., Catheter Tip Flare Dimension Deviation"
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
                      <option value={CapaType.CORRECTIVE}>Corrective Action (Root Cause Removal)</option>
                      <option value={CapaType.PREVENTIVE}>Preventive Action (Potential Issue Prevention)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Assigned Owner <span className="text-destructive">*</span>
                    </Label>
                    <select
                      value={ownerId}
                      onChange={(e) => setOwnerId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                      required
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
                      placeholder="e.g., Internal Audit / Post-Market Surveillance"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 2: Problem Statement & Containment */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Problem Definition & Immediate Containment
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Problem Statement <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      placeholder="Clearly define what happened, where, when, magnitude/quantity affected, and standard violated..."
                      value={problemStatement}
                      onChange={(e) => setProblemStatement(e.target.value)}
                      rows={4}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Immediate Containment Action Taken</Label>
                    <Textarea
                      placeholder="Document immediate actions (e.g., inventory quarantine, line stoppage, customer notification)..."
                      value={containmentAction}
                      onChange={(e) => setContainmentAction(e.target.value)}
                      rows={3}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 3: Repeat & Linkages */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Repeat Non-Conformance & Open Linkages
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Repeat CAPA */}
                  <div className="rounded-lg border border-border p-3.5 space-y-3 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="repeatCapa"
                        checked={repeatCapa}
                        onChange={(e) => setRepeatCapa(e.target.checked)}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      />
                      <Label htmlFor="repeatCapa" className="text-xs font-semibold cursor-pointer">
                        Is this a Repeat Non-Conformance?
                      </Label>
                    </div>
                    {repeatCapa && (
                      <div className="space-y-1.5 animate-in fade-in-50">
                        <Label className="text-xs">Prior CAPA / NCR Reference Number</Label>
                        <Input
                          placeholder="e.g., CAPA-2025-0014"
                          value={capaReference}
                          onChange={(e) => setCapaReference(e.target.value)}
                          className="text-xs h-8 bg-background"
                        />
                      </div>
                    )}
                  </div>

                  {/* Existing Open CAPA */}
                  <div className="rounded-lg border border-border p-3.5 space-y-3 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="existingCapa"
                        checked={existingCapa}
                        onChange={(e) => setExistingCapa(e.target.checked)}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      />
                      <Label htmlFor="existingCapa" className="text-xs font-semibold cursor-pointer">
                        Link to Existing Open Related CAPA?
                      </Label>
                    </div>
                    {existingCapa && (
                      <div className="grid grid-cols-2 gap-2 animate-in fade-in-50">
                        <div className="space-y-1">
                          <Label className="text-xs">Open CAPA Ref</Label>
                          <Input
                            placeholder="e.g., CAPA-2026-0002"
                            value={existingOpenCapaReference}
                            onChange={(e) => setExistingOpenCapaReference(e.target.value)}
                            className="text-xs h-8 bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Target Due Date</Label>
                          <Input
                            type="date"
                            value={existingCapaDueDate}
                            onChange={(e) => setExistingCapaDueDate(e.target.value)}
                            className="text-xs h-8 bg-background"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 4: Product & Process Impact */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Scope of Product & Process Impact
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Scope of Impact</Label>
                    <select
                      value={processOrProduct}
                      onChange={(e) => setProcessOrProduct(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="Product">Product Quality / Manufacturing</option>
                      <option value="Process">Process / Quality System / Procedure</option>
                      <option value="Software">Software / Firmware System</option>
                      <option value="Both">Both Product & Process Affected</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Affected Department / Area</Label>
                    <Input
                      placeholder="e.g., Cleanroom Assembly Line 2, Packaging"
                      value={affectedArea}
                      onChange={(e) => setAffectedArea(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Related QMS Procedure / SOP</Label>
                    <Input
                      placeholder="e.g., SOP-7.5.1 Device Packaging & Sealing"
                      value={relatedProcess}
                      onChange={(e) => setRelatedProcess(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Affected Product Family / Part Numbers</Label>
                    <Input
                      placeholder="e.g., Angioplasty Balloon Catheters (SKU-9001)"
                      value={productDetails}
                      onChange={(e) => setProductDetails(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 5: ISO 14971 Risk Matrix */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-500" /> ISO 14971 Risk Assessment Matrix
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-xs",
                      riskCategory === "HIGH"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : riskCategory === "MEDIUM"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    )}
                  >
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
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
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
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
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
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Severity Rationale</Label>
                    <Textarea
                      placeholder="Justification for chosen severity level..."
                      value={severityRationale}
                      onChange={(e) => setSeverityRationale(e.target.value)}
                      rows={2}
                      className="text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Occurrence Probability Rationale</Label>
                    <Textarea
                      placeholder="Historical occurrence rate, manufacturing volume, complaint trends..."
                      value={occurrenceRationale}
                      onChange={(e) => setOccurrenceRationale(e.target.value)}
                      rows={2}
                      className="text-xs bg-background"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 6: Determination & FSCA */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    CAPA Determination & Field Safety Actions
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">CAPA Scope Classification</Label>
                    <Input
                      placeholder="e.g., Design Control / Process Optimization"
                      value={capaTypeCategory}
                      onChange={(e) => setCapaTypeCategory(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Determination Summary</Label>
                    <Input
                      placeholder="e.g., Formal CAPA required due to non-conformance recurrence"
                      value={capaSummary}
                      onChange={(e) => setCapaSummary(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                {/* FSCA Banner */}
                <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="fscaRequired"
                      checked={fscaRequired}
                      onChange={(e) => setFscaRequired(e.target.checked)}
                      className="h-4 w-4 rounded border-input text-destructive focus:ring-destructive"
                    />
                    <Label htmlFor="fscaRequired" className="text-xs font-semibold cursor-pointer">
                      Field Safety Corrective Action (FSCA / Recall) Required?
                    </Label>
                  </div>
                  {fscaRequired && (
                    <div className="space-y-1.5 animate-in fade-in-50">
                      <Label className="text-xs font-semibold text-destructive">
                        FSCA / Regulatory Reference Tracking Number
                      </Label>
                      <Input
                        placeholder="e.g., FSCA-2026-004 / FDA Recall ID"
                        value={fscaRefNumber}
                        onChange={(e) => setFscaRefNumber(e.target.value)}
                        className="text-xs h-8 bg-background max-w-md"
                        required={fscaRequired}
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Section 7: Gate Sign-off & Approvers */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Gate Review & Sign-Off Authorization
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Primary Approver (QA Lead)</Label>
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
                    <Label className="text-xs font-semibold">Secondary Approver (Ops/Executive)</Label>
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
              </div>

              <Separator />

              {/* Section 8: Attachments */}
              <div className="space-y-3 pb-6">
                <div className="border-b border-border pb-2">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-blue-500" /> Initiation Supporting Documents & Attachments
                  </h3>
                </div>
                <FileUploader
                  attachments={initiationAttachments}
                  onChange={setInitiationAttachments}
                />
              </div>
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
                disabled={isSubmitting}
                className="text-xs h-9 gap-2 px-6 font-semibold shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Initiating CAPA...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Initiate CAPA Record</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
