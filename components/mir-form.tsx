"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Save,
  Loader2,
  AlertTriangle,
  Lock,
  LockOpen,
  ExternalLink,
  ShieldCheck,
  Info,
  CheckCircle2,
  Paperclip,
} from "lucide-react";
import { MIR, MIRStatus, MIRReportType, MIRClassification, LockEntityType } from "@prisma/client";
import { useRecordLock } from "@/hooks/useRecordLock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@clerk/nextjs";
import { updateMIR } from "@/lib/actions/mir";
import { StatusTransitionTracker } from "@/components/status-transition-tracker";
import { FileUploader } from "@/components/file-uploader";
import { cn } from "@/lib/utils";
import {
  mirSchema,
  MIRFormValues,
  STATUS_LABEL,
  REPORT_TYPE_OPTIONS,
  CLASSIFICATION_OPTIONS,
  AUTHORITY_PRESETS,
  SUBMISSION_METHODS,
  DEVICE_RELATEDNESS_OPTIONS,
  CAUSALITY_OPTIONS,
  SERIOUSNESS_OPTIONS,
  RISK_ASSESSMENT_OPTIONS,
} from "@/lib/validations/mir";

/* ------------------------------------------------------------------ */
/* Types & Layout Constants                                           */
/* ------------------------------------------------------------------ */

export interface MIREditFormProps {
  orgSlug: string;
  complaintNumber: string;
  mir: MIR | (Record<string, any> & { id: string; complaintId: string; status: MIRStatus });
  defaultReportType?: MIRReportType | string;
  users?: Array<{ id: string; email: string; firstName: string | null; lastName: string | null }>;
  initialTab?: "general" | "mir";
}

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export const SECTIONS = [
  { id: "admin", label: "1. Administrative Info" },
  { id: "device", label: "2. Medical Device Info" },
  { id: "incident", label: "3. Incident Details" },
  { id: "analysis", label: "4. Manufacturer Analysis" },
  { id: "comments", label: "5. Comments & Sign-Off" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
export type Completion = "done" | "attention" | "empty";

function humanize(value?: string | null) {
  if (!value) return "";
  return (
    STATUS_LABEL[value] ??
    value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ")
  );
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
  badge,
  action,
  children,
}: {
  id: string;
  title: string;
  description: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24 rounded-xl border border-border bg-card p-6 shadow-xs">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
            {badge}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function formatDate(d?: Date | string | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

export function MIREditForm({
  orgSlug,
  complaintNumber,
  mir,
  defaultReportType,
  users = [],
  initialTab,
}: MIREditFormProps) {
  const router = useRouter();
  const { isReadOnly: isLockReadOnly } = useRecordLock({
    entityType: LockEntityType.Vigilance,
    recordId: mir.id,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSection, setActiveSection] = React.useState<SectionId>("admin");

  const { memberships } = useOrganization({
    memberships: { pageSize: 100, keepPreviousData: true },
  });

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

  const initialReportType =
    (mir.reportType as string) || defaultReportType || "INITIAL";

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MIRFormValues>({
    resolver: zodResolver(mirSchema),
    defaultValues: {
      status: mir.status || MIRStatus.DRAFT,
      reportType: initialReportType,
      mirNumber: mir.mirNumber || "",

      // Section 1: Administrative Information
      ncaName: ((mir.ncaName || mir.competentAuthority) as string) || "",
      ncaEudamedNum: (mir.ncaEudamedNum as string) || "",
      ncaReportNo: ((mir.ncaReportNo || mir.competentAuthorityReference) as string) || "",
      refNumEudamed: (mir.refNumEudamed as string) || "",
      reportDate: parseDate(mir.reportDate as Date | string) || parseDate(mir.submissionDate),
      adverseEventDateFrom: parseDate(mir.adverseEventDateFrom as Date | string),
      adverseEventDateTo: parseDate(mir.adverseEventDateTo as Date | string),
      mfrAwarenessDate: parseDate(mir.mfrAwarenessDate as Date | string),
      mfrAwarenessReportDate: parseDate(mir.mfrAwarenessReportDate as Date | string),
      reportNextDate: parseDate(mir.reportNextDate as Date | string) || parseDate(mir.dueDate),
      expectedDayOfNextReport: parseDate(mir.expectedDayOfNextReport as Date | string) || parseDate(mir.reportNextDate as Date | string) || parseDate(mir.dueDate),
      eventClassification: (mir.eventClassification as string) || "",
      statusReporter: (mir.statusReporter as string) || "Manufacturer",
      reporterOtherText: (mir.reporterOtherText as string) || "",
      authorizedRepresentativeContact: (mir.authorizedRepresentativeContact as string) || "",
      arContact: ((mir as any).arContact as string) || "",
      submitterContact: (mir.submitterContact as string) || "",
      mfrRef: ((mir.mfrRef || mir.manufacturerReference) as string) || "",
      ncaRefMultiDev: (mir.ncaRefMultiDev as string) || "",
      eudamedRefMultiDev: (mir.eudamedRefMultiDev as string) || "",
      mfrRefMultiDev: (mir.mfrRefMultiDev as string) || "",
      ncaRefFSCA: (mir.ncaRefFSCA as string) || "",
      eudamedRefFSCA: (mir.eudamedRefFSCA as string) || "",
      mfrRefFSCA: (mir.mfrRefFSCA as string) || "",
      psrId: (mir.psrId as string) || "",
      pmcfpmpfQuestion: (mir.pmcfpmpfQuestion as boolean) || false,
      pmcfpmpfId: (mir.pmcfpmpfId as string) || "",
      mfrName: (mir.mfrName as string) || "",
      mfrSRN: (mir.mfrSRN as string) || "",
      mfrContactPersonFirstName: (mir.mfrContactPersonFirstName as string) || "",
      mfrContactPersonSecondName: (mir.mfrContactPersonSecondName as string) || "",
      mfrEmailAddress: (mir.mfrEmailAddress as string) || "",
      mfrPhone: (mir.mfrPhone as string) || "",
      mfrCountry: ((mir.mfrCountry || mir.submissionCountry) as string) || "",
      mfrOrgStreet: (mir.mfrOrgStreet as string) || "",
      mfrOrgStreetNum: (mir.mfrOrgStreetNum as string) || "",
      mfrAddress: (mir.mfrAddress as string) || "",
      mfrOrgPOBox: (mir.mfrOrgPOBox as string) || "",
      mfrCity: (mir.mfrCity as string) || "",
      mfrPostcode: (mir.mfrPostcode as string) || "",
      arName: (mir.arName as string) || "",
      arSRN: (mir.arSRN as string) || "",

      // Section 2: Medical Device Information
      udiDI: (mir.udiDI as string) || "",
      udiDIEntity: (mir.udiDIEntity as string) || "",
      udiPI: (mir.udiPI as string) || "",
      udiDIBasic: (mir.udiDIBasic as string) || "",
      nomenclatureCode: (mir.nomenclatureCode as string) || "",
      brandName: (mir.brandName as string) || "",
      deviceDescription: (mir.deviceDescription as string) || "",
      deviceNomenclature: (mir.deviceNomenclature as string) || "",
      modelNum: (mir.modelNum as string) || "",
      catalogNum: (mir.catalogNum as string) || "",
      serialNum: (mir.serialNum as string) || "",
      batchNum: (mir.batchNum as string) || "",
      deviceSoftwareVer: (mir.deviceSoftwareVer as string) || "",
      dateLotReleased: parseDate(mir.dateLotReleased as Date | string),
      expiryDate: parseDate(mir.expiryDate as Date | string) || parseDate(mir.deviceExpiryDate as Date | string),
      deviceExpiryDate: parseDate(mir.deviceExpiryDate as Date | string),
      dateOfImplantFrom: parseDate(mir.dateOfImplantFrom as Date | string) || parseDate(mir.implantedDateFrom as Date | string),
      dateOfImplantTo: parseDate(mir.dateOfImplantTo as Date | string) || parseDate(mir.implantedDateTo as Date | string),
      dateOfExplantFrom: parseDate(mir.dateOfExplantFrom as Date | string) || parseDate(mir.explantedDateFrom as Date | string),
      dateOfExplantTo: parseDate(mir.dateOfExplantTo as Date | string) || parseDate(mir.explantedDateTo as Date | string),
      implantDuration: (mir.implantDuration as string) || "",
      implantFacilityName: (mir.implantFacilityName as string) || "",
      explantFacilityName: (mir.explantFacilityName as string) || "",
      nbIdNum: (mir.nbIdNum as string) || "",
      notifiedBodyId: (mir.notifiedBodyId || mir.nbIdNum as string) || "",
      nbCertNum: (mir.nbCertNum as string) || "",
      notifiedBodyCerNoOfDevice: (mir.notifiedBodyCerNoOfDevice || mir.nbCertNum as string) || "",
      deviceClassMDD: (mir.deviceClassMDD as string) || "",
      mddClass: (mir.mddClass || mir.deviceClassMDD as string) || "",
      deviceClassMDR: (mir.deviceClassMDR as string) || "",
      mdrClass: (mir.mdrClass || mir.deviceClassMDR as string) || "",
      deviceClassIVDD: (mir.deviceClassIVDD as string) || "",
      ivddClass: (mir.ivddClass || mir.deviceClassIVDD as string) || "",
      deviceClassIVDR: (mir.deviceClassIVDR as string) || "",
      ivdrClass: (mir.ivdrClass || mir.deviceClassIVDR as string) || "",
      devicePlacedMarket: (mir.devicePlacedMarket as boolean) || false,
      devicePlacedOnMarket: (mir.devicePlacedOnMarket ?? mir.devicePlacedMarket) as boolean || false,
      marketDistributionOfDevice: (mir.marketDistributionOfDevice as string) || "",
      countriesDistributedTo: (mir.countriesDistributedTo || mir.otherCountries as string) || "",
      deviceAccessories: (mir.deviceAccessories as string) || "",
      relevantAccessories: (mir.relevantAccessories || mir.deviceAccessories as string) || "",
      deviceAssociated: (mir.deviceAssociated as string) || "",
      relevantAssociatedDevices: (mir.relevantAssociatedDevices || mir.deviceAssociated as string) || "",

      // Section 3: Incident Information Derived from Initial Reporter
      eventDescription: (mir.eventDescription as string) || "",
      imdrfA: (mir.imdrfA || mir.imdrfProblemCodes as any) || "",
      patientStatusIntervention: (mir.patientStatusIntervention || mir.patientRemedialAction as string) || "",
      imdrf3: (mir.imdrf3 || mir.imdrfClinicalCodes as any) || "",
      imdrfE: (mir.imdrfE || mir.imdrfClinicalCodes as any) || "",
      imdrfF: (mir.imdrfF || mir.imdrfHealthCodes as any) || "",
      imdrfCodeMissing: (mir.imdrfCodeMissing as string) || "",
      numPatientsInvolved: (mir.numPatientsInvolved as number) ?? 1,
      currentDeviceLocation: (mir.currentDeviceLocation as string) || "",
      deviceOperatorAtEvent: (mir.deviceOperatorAtEvent as string) || "",
      deviceUsage: (mir.deviceUsage as string) || "",
      patientRemedialAction: (mir.patientRemedialAction as string) || "",
      patientAgeYears: (mir.patientAgeYears as number) ?? null,
      gender: (mir.gender as string) || "",
      massKG: (mir.massKG as number) ?? null,
      heightCM: (mir.heightCM as number) ?? null,
      patientPriorMedication: (mir.patientPriorMedication as string) || "",
      initialReporterRole: (mir.initialReporterRole as string) || "",
      healthcareFacilityName: (mir.healthcareFacilityName as string) || "",
      healthcareFacilityCountry: (mir.healthcareFacilityCountry as string) || "",

      // Section 4: Manufacturer Analysis
      manufacturersPrelimAnalysis: ((mir.manufacturersPrelimAnalysis || mir.preliminaryConclusion) as string) || "",
      initialManufacturerCapa: (mir.initialManufacturerCapa as string) || "",
      suspicionRelationship: (mir.suspicionRelationship as boolean) || false,
      manufacturersInitialCorrecAction: (mir.manufacturersInitialCorrecAction as string) || "",
      furtherInvestigations: (mir.furtherInvestigations as string) || "",
      rootCauses: ((mir.rootCauses || mir.manufacturerConclusion) as string) || "",
      manufacturersWhyNotReportable: (mir.manufacturersWhyNotReportable as string) || "",
      reasonForNotReportable: (mir.reasonForNotReportable || mir.manufacturersWhyNotReportable as string) || "",
      rootCauseConfirmed: (mir.rootCauseConfirmed as boolean) || false,
      relationshipIncidentSubstance: (mir.relationshipIncidentSubstance as string) || "",
      riskAssReviewed: (mir.riskAssReviewed as boolean) || false,
      rationaleNoReview: (mir.rationaleNoReview as string) || "",
      riskAssAdequate: (mir.riskAssAdequate as boolean) || false,
      riskAssResults: (mir.riskAssResults as string) || "",
      imdrfG: (mir.imdrfG || mir.imdrfComponentCodes as any) || "",
      correctiveAction: (mir.correctiveAction as string) || "",
      anyActionTaken: (mir.anyActionTaken || mir.correctiveAction as string) || "",
      correctiveActionSchedule: (mir.correctiveActionSchedule as string) || "",
      actionImplementationSchedule: (mir.actionImplementationSchedule || mir.correctiveActionSchedule as string) || "",
      manufacturersFinalComments: ((mir.manufacturersFinalComments || mir.manufacturerFinalStatement) as string) || "",
      finalManufacturerComments: (mir.finalManufacturerComments || mir.manufacturersFinalComments || mir.manufacturerFinalStatement as string) || "",
      similarVariant: (mir.similarVariant as string) || "",
      similarVariantDetails: (mir.similarVariantDetails as string) || "",
      numberBasedOn: (mir.numberBasedOn as string) || "",
      howWereDetermined: (mir.howWereDetermined as string) || "",

      // Section 5: General Comments, Sign-off, Attachments & Late Reporting
      additionalComments: ((mir.additionalComments || mir.finalRiskAssessmentSummary) as string) || "",
      businessComments: (mir.businessComments as string) || "",
      lateReason: (mir.lateReason as string) || "",
      cidCapaForLateReportable: (mir.cidCapaForLateReportable as string) || "",
      commentsForLateReportable: (mir.commentsForLateReportable as string) || "",
      processStageForLateReportable: (mir.processStageForLateReportable as string) || "",
      attachments: ((mir as any).attachments as any[]) || [],
      preparedById: mir.preparedById || "",
      reviewedById: mir.reviewedById || "",
      approvedById: mir.approvedById || "",

      // Compatibility fields
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
      finalDeviceRelatedness: mir.finalDeviceRelatedness || "",
      finalCausalityAssessment: mir.finalCausalityAssessment || "",
      finalCausalityRationale: mir.finalCausalityRationale || "",
      manufacturerConclusion: mir.manufacturerConclusion || "",
      incidentConfirmed: mir.incidentConfirmed || false,
      deviceContributionConfirmed: mir.deviceContributionConfirmed || false,
      recurrencePotential: mir.recurrencePotential || "",
      finalRiskAssessmentSummary: mir.finalRiskAssessmentSummary || "",
      manufacturerFinalStatement: mir.manufacturerFinalStatement || "",
    },
  });

  const currentStatus = watch("status");
  const watchReportType = watch("reportType");
  const watchMirNumber = watch("mirNumber");
  const watchNcaName = watch("ncaName");
  const watchCompetentAuthority = watch("competentAuthority");
  const watchMfrRef = watch("mfrRef");
  const watchManufacturerReference = watch("manufacturerReference");
  const watchDueDate = watch("dueDate");
  const watchReportNextDate = watch("reportNextDate");
  const watchSubmissionDate = watch("submissionDate");
  const watchBrandName = watch("brandName");
  const watchUdiDI = watch("udiDI");
  const watchEventDescription = watch("eventDescription");
  const watchPrelimAnalysis = watch("manufacturersPrelimAnalysis");
  const watchPreliminaryConclusion = watch("preliminaryConclusion");
  const watchRootCauses = watch("rootCauses");
  const watchPreparedById = watch("preparedById");
  const watchReviewedById = watch("reviewedById");
  const watchApprovedById = watch("approvedById");
  const watchAttachments = watch("attachments");
  const watchAdditionalComments = watch("additionalComments");
  const watchEventClassification = watch("eventClassification");

  const displayedDrafter =
    allUserOptions.find((u) => u.id === watchPreparedById)?.name || "Unassigned";
  const displayedApprover =
    allUserOptions.find((u) => u.id === watchApprovedById)?.name || "Unassigned";

  const [activeMainTab, setActiveMainTab] = React.useState<"general" | "mir">(
    initialTab || "general"
  );

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTab = urlParams.get("tab");
      const savedTab = sessionStorage.getItem(`mir_active_tab_${mir.id}`);
      const preferred =
        urlTab === "mir" || urlTab === "general"
          ? urlTab
          : savedTab === "mir" || savedTab === "general"
          ? savedTab
          : initialTab || null;

      if (preferred && preferred !== activeMainTab) {
        setActiveMainTab(preferred as "general" | "mir");
      }
    }
  }, [mir.id, initialTab]);

  const switchTab = React.useCallback(
    (tab: "general" | "mir") => {
      setActiveMainTab(tab);
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(`mir_active_tab_${mir.id}`, tab);
          const url = new URL(window.location.href);
          url.searchParams.set("tab", tab);
          window.history.replaceState(null, "", url.toString());
        } catch {}
      }
    },
    [mir.id]
  );

  const isFinalVariant =
    watchReportType === "FINAL" ||
    watchReportType === "FINAL_NON_REPORTABLE" ||
    watchReportType === "COMBINED";

  const completion = React.useMemo<Record<SectionId, Completion>>(() => {
    const hasAnyId = watchMirNumber || watchMfrRef || watchManufacturerReference;
    const adminComp: Completion =
      watchMirNumber && (watchNcaName || watchCompetentAuthority)
        ? "done"
        : hasAnyId
        ? "attention"
        : "empty";

    const hasDevice = watchBrandName || watchUdiDI;
    const deviceComp: Completion = watchBrandName ? "done" : hasDevice ? "attention" : "empty";

    const incidentComp: Completion =
      watchEventDescription && watchEventDescription.trim().length > 10
        ? "done"
        : watchEventDescription
        ? "attention"
        : "empty";

    const hasAnalysis = isFinalVariant
      ? watchRootCauses && watchRootCauses.trim().length > 0
      : (watchPrelimAnalysis || watchPreliminaryConclusion) &&
        (watchPrelimAnalysis?.trim().length || 0) > 0;
    const analysisComp: Completion = hasAnalysis
      ? "done"
      : watchPrelimAnalysis || watchRootCauses
      ? "attention"
      : "empty";

    const commentsComp: Completion =
      watchAdditionalComments && watchAdditionalComments.trim().length > 0
        ? "done"
        : "empty";

    return {
      admin: adminComp,
      device: deviceComp,
      incident: incidentComp,
      analysis: analysisComp,
      comments: commentsComp,
    };
  }, [
    watchMirNumber,
    watchNcaName,
    watchCompetentAuthority,
    watchMfrRef,
    watchManufacturerReference,
    watchBrandName,
    watchUdiDI,
    watchEventDescription,
    isFinalVariant,
    watchRootCauses,
    watchPrelimAnalysis,
    watchPreliminaryConclusion,
    watchAdditionalComments,
  ]);

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
  }, [activeMainTab]);

  const scrollTo = (id: SectionId) => {
    if (activeMainTab !== "mir") {
      switchTab("mir");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const onSubmit = async (data: MIRFormValues) => {
    setIsSubmitting(true);
    setError(null);
    const tabToKeep = activeMainTab;

    try {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(`mir_active_tab_${mir.id}`, tabToKeep);
          const url = new URL(window.location.href);
          url.searchParams.set("tab", tabToKeep);
          window.history.replaceState(null, "", url.toString());
        } catch {}
      }

      const selectedAuthority =
        data.ncaName === "OTHER" && data.competentAuthority && data.competentAuthority !== "OTHER"
          ? data.competentAuthority
          : data.ncaName;

      await updateMIR(mir.id, {
        ...data,
        eventClassification: (data.eventClassification as MIRClassification) || null,
        ncaName: selectedAuthority,
        competentAuthority: selectedAuthority,
        competentAuthorityReference: data.ncaReportNo || data.competentAuthorityReference,
        manufacturerReference: data.mfrRef || data.manufacturerReference,
      } as any);

      toast.success("MIR report changes saved successfully");
      router.refresh();
      setActiveMainTab(tabToKeep);
    } catch (err: unknown) {
      console.error("[MIR Update Error]", err);
      const message =
        err instanceof Error ? err.message : "Failed to update MIR report. Please try again.";
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
              <span className="text-sm font-medium text-foreground">Manufacturer Incident Report</span>
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
                {REPORT_TYPE_OPTIONS.find((r) => r.value === watchReportType)?.label || watchReportType}
              </Badge>
            </div>

            <div className="flex items-center gap-2 lg:mt-2">
              <StatusTransitionTracker
                entityType="MIR"
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
                form="mir-unified-form"
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

          {/* Primary Tabs */}
          <div className="mt-3 flex items-center border-b border-border/60">
            <button
              type="button"
              onClick={() => switchTab("general")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-medium transition-colors -mb-px",
                activeMainTab === "general"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <span>General & Attachments</span>
              {(watchAttachments?.length ?? 0) > 0 && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {watchAttachments?.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => switchTab("mir")}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-medium transition-colors -mb-px",
                activeMainTab === "mir"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <span>MIR Form (Sections 1–5)</span>
            </button>
          </div>

          {/* Subheader: Sections 1-5 Anchor Navigation (Visible when MIR Form tab is active) */}
          {activeMainTab === "mir" && (
            <nav className="-mb-px flex gap-1 overflow-x-auto pt-1" aria-label="MIR Sections">
              {SECTIONS.map((s) => {
                const active = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollTo(s.id)}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-xs transition-colors",
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
          )}
        </div>
      </div>

      {/* ---------- Form Body ---------- */}
      <div className="grid gap-6 p-6 lg:p-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <form
          id="mir-unified-form"
          onSubmit={handleSubmit(onSubmit)}
          className="min-w-0 max-w-5xl space-y-6"
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
            {/* ============================================================= */}
            {/* TAB 1: GENERAL & ATTACHMENTS (NOT SUBMITTED TO NCA)           */}
            {/* ============================================================= */}
            <div className={cn("space-y-6", activeMainTab !== "general" && "hidden")}>
              {/* Regulatory Roles & Approvals */}
              <SectionCard
                id="regulatory-roles"
                title="Regulatory Roles & Approvals"
                description="Internal electronic sign-offs, statutory due date tracking, and submission timestamp verification."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Prepared by (Drafter)" htmlFor="preparedById">
                    <select id="preparedById" {...register("preparedById")} className={selectClass}>
                      <option value="">Unassigned</option>
                      {allUserOptions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Technical / QA Reviewer" htmlFor="reviewedById">
                    <select id="reviewedById" {...register("reviewedById")} className={selectClass}>
                      <option value="">Unassigned</option>
                      {allUserOptions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Regulatory Approver (Sign-Off)" htmlFor="approvedById">
                    <select id="approvedById" {...register("approvedById")} className={selectClass}>
                      <option value="">Unassigned</option>
                      {allUserOptions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Statutory Due Date">
                    <Controller
                      control={control}
                      name="reportNextDate"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value ? new Date(field.value) : null}
                          onChange={(d) => field.onChange(d)}
                          placeholder="Statutory filing due date"
                          disabled={isLockReadOnly}
                        />
                      )}
                    />
                  </Field>

                  <Field label="Actual Submission Date">
                    <Controller
                      control={control}
                      name="submissionDate"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value ? new Date(field.value) : null}
                          onChange={(d) => field.onChange(d)}
                          placeholder="Actual submission timestamp"
                          disabled={isLockReadOnly}
                        />
                      )}
                    />
                  </Field>
                </div>
              </SectionCard>
              
              {/* Business Comments */}
              <SectionCard
                id="general-business-comments"
                title="Business Comments"
                description="Internal business remarks, management comments, or administrative notes (internal only, not transmitted in EU MIR to NCA)."
              >
                <Field label="Business Comments" htmlFor="businessComments">
                  <Textarea
                    id="businessComments"
                    rows={3}
                    placeholder="Internal business comments, management remarks, or administrative notes..."
                    {...register("businessComments")}
                  />
                </Field>
              </SectionCard>

              {/* Late Reporting Justification & CAPA */}
              <SectionCard
                id="late-reporting"
                title="Late Reporting Justification & CAPA"
                description="Required rationale, process stage, and CAPA references if report is submitted past statutory deadline."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Process Stage for Late Reportable" htmlFor="processStageForLateReportable">
                    <Input
                      id="processStageForLateReportable"
                      placeholder="e.g. Intake / Triage / Investigation"
                      className={selectClass}
                      {...register("processStageForLateReportable")}
                    />
                  </Field>

                  <Field label="CID / CAPA for Late Reportable" htmlFor="cidCapaForLateReportable">
                    <Input
                      id="cidCapaForLateReportable"
                      placeholder="e.g. CAPA-2026-089 / Deviation-104"
                      className={selectClass}
                      {...register("cidCapaForLateReportable")}
                    />
                  </Field>

                  <Field label="Late Reason" htmlFor="lateReason">
                    <Input
                      id="lateReason"
                      placeholder="e.g. Delayed foreign distributor notification"
                      className={selectClass}
                      {...register("lateReason")}
                    />
                  </Field>

                  <Field label="Comments for Late Reportable" htmlFor="commentsForLateReportable">
                    <Input
                      id="commentsForLateReportable"
                      placeholder="Detailed explanation for reporting delay..."
                      className={selectClass}
                      {...register("commentsForLateReportable")}
                    />
                  </Field>
                </div>
              </SectionCard>
            </div>

            {/* ============================================================= */}
            {/* TAB 2: MIR FORM (SECTIONS 1-5 FOR NCA SUBMISSION)             */}
            {/* ============================================================= */}
            <div className={cn("space-y-6", activeMainTab !== "mir" && "hidden")}>
              {/* ============================================================= */}
              {/* SECTION 1: ADMINISTRATIVE INFORMATION                         */}
              {/* ============================================================= */}
              <SectionCard
                id="admin"
                title="1. Administrative Information"
                description="Competent authority details, submission metadata, incident classification, and submitter credentials (EU MIR v7.3.1 Section 1)."
              >
              <div className="space-y-6">
                {/* 1.1 Competent Authority */}
                <div>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    1.1 Responsible National Competent Authority (NCA)
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Receiving NCA / Competent Authority" htmlFor="ncaName" required error={errors.ncaName?.message}>
                      <select
                        id="ncaName"
                        {...register("ncaName", {
                          onChange: (e) => {
                            setValue("competentAuthority", e.target.value);
                          },
                        })}
                        className={selectClass}
                      >
                        <option value="">Select Competent Authority (NCA)...</option>
                        {AUTHORITY_PRESETS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                        {watchNcaName && !AUTHORITY_PRESETS.includes(watchNcaName) && watchNcaName !== "OTHER" && (
                          <option value={watchNcaName}>{watchNcaName}</option>
                        )}
                        <option value="OTHER">Other Authority (Specify below)...</option>
                      </select>
                    </Field>

                    {watchNcaName === "OTHER" && (
                      <Field label="Specify Authority Name" htmlFor="customAuthority">
                        <Input
                          id="customAuthority"
                          placeholder="e.g. State Medical Authority"
                          className={selectClass}
                          value={watchCompetentAuthority === "OTHER" ? "" : watchCompetentAuthority || ""}
                          onChange={(e) => {
                            setValue("competentAuthority", e.target.value);
                          }}
                        />
                      </Field>
                    )}

                    <Field label="NCA EUDAMED Number" htmlFor="ncaEudamedNum">
                      <Input
                        id="ncaEudamedNum"
                        placeholder="e.g. NCA-EUD-001"
                        className={selectClass}
                        {...register("ncaEudamedNum")}
                      />
                    </Field>

                    <Field label="NCA Incident Ref #" htmlFor="ncaReportNo">
                      <Input
                        id="ncaReportNo"
                        placeholder="Authority reference if known"
                        className={selectClass}
                        {...register("ncaReportNo")}
                      />
                    </Field>

                    <Field label="EUDAMED Incident Ref #" htmlFor="refNumEudamed">
                      <Input
                        id="refNumEudamed"
                        placeholder="Assigned by EUDAMED"
                        className={selectClass}
                        {...register("refNumEudamed")}
                      />
                    </Field>
                  </div>
                </div>

                {/* 1.2 Date, Type & Classification */}
                <div className="border-t border-border/40 pt-4">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    1.2 Date, Type, and Classification of Incident Report
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Report Type" htmlFor="reportType" required>
                      <select id="reportType" {...register("reportType")} className={selectClass}>
                        {REPORT_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="MIR Number" htmlFor="mirNumber" required error={errors.mirNumber?.message}>
                      <Input
                        id="mirNumber"
                        placeholder="e.g. MIR-2026-001"
                        className={selectClass}
                        {...register("mirNumber")}
                      />
                    </Field>

                    <Field label="Serious Incident Classification" htmlFor="eventClassification">
                      <select id="eventClassification" {...register("eventClassification")} className={selectClass}>
                        <option value="">Select classification...</option>
                        {CLASSIFICATION_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Field label="Date of Incident (Start)">
                      <Controller
                        control={control}
                        name="adverseEventDateFrom"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(d) => field.onChange(d)}
                            placeholder="Incident date"
                            disabled={isLockReadOnly}
                          />
                        )}
                      />
                    </Field>

                    <Field label="Date of Incident (End / Range)">
                      <Controller
                        control={control}
                        name="adverseEventDateTo"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(d) => field.onChange(d)}
                            placeholder="Range if timespan"
                            disabled={isLockReadOnly}
                          />
                        )}
                      />
                    </Field>

                    <Field label="Manufacturer Awareness Date">
                      <Controller
                        control={control}
                        name="mfrAwarenessDate"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(d) => field.onChange(d)}
                            placeholder="Awareness date"
                            disabled={isLockReadOnly}
                          />
                        )}
                      />
                    </Field>

                    <Field label="Awareness Date of Reportability">
                      <Controller
                        control={control}
                        name="mfrAwarenessReportDate"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(d) => field.onChange(d)}
                            placeholder="Reportability date"
                            disabled={isLockReadOnly}
                          />
                        )}
                      />
                    </Field>

                    <Field label="Expected Date of Next Report">
                      <Controller
                        control={control}
                        name="expectedDayOfNextReport"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(d) => field.onChange(d)}
                            placeholder="Next filing date"
                            disabled={isLockReadOnly}
                          />
                        )}
                      />
                    </Field>
                  </div>
                </div>

                {/* 1.3 Submitter & Manufacturer Information */}
                <div className="border-t border-border/40 pt-4">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    1.3 Submitter and Manufacturer Details
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Submitter Role" htmlFor="statusReporter">
                      <select id="statusReporter" {...register("statusReporter")} className={selectClass}>
                        <option value="Manufacturer">Manufacturer</option>
                        <option value="Authorised Representative">Authorised Representative</option>
                        <option value="Other">Other Submitter</option>
                      </select>
                    </Field>

                    <Field label="Authorized Representative Contact" htmlFor="authorizedRepresentativeContact">
                      <Input
                        id="authorizedRepresentativeContact"
                        placeholder="Contact name, phone, email"
                        className={selectClass}
                        {...register("authorizedRepresentativeContact")}
                      />
                    </Field>

                    <Field label="Submitter Contact" htmlFor="submitterContact">
                      <Input
                        id="submitterContact"
                        placeholder="Contact name, phone, email"
                        className={selectClass}
                        {...register("submitterContact")}
                      />
                    </Field>

                    <Field label="Manufacturer Reference #" htmlFor="mfrRef">
                      <Input
                        id="mfrRef"
                        placeholder="e.g. MFR-2026-042"
                        className={selectClass}
                        {...register("mfrRef")}
                      />
                    </Field>

                    <Field label="Previous MIR Reference" htmlFor="previousMirReference">
                      <Input
                        id="previousMirReference"
                        placeholder="Prior report ID if follow-up"
                        className={selectClass}
                        {...register("previousMirReference")}
                      />
                    </Field>

                    <Field label="Manufacturer Organisation Name" htmlFor="mfrName">
                      <Input
                        id="mfrName"
                        placeholder="e.g. Acme Medical Devices Corp."
                        className={selectClass}
                        {...register("mfrName")}
                      />
                    </Field>

                    <Field label="Single Registration Number (SRN)" htmlFor="mfrSRN">
                      <Input
                        id="mfrSRN"
                        placeholder="e.g. DE-MF-000012345"
                        className={selectClass}
                        {...register("mfrSRN")}
                      />
                    </Field>

                    <Field label="Manufacturer Country" htmlFor="mfrCountry">
                      <Input
                        id="mfrCountry"
                        placeholder="e.g. Germany, France, United States"
                        className={selectClass}
                        {...register("mfrCountry")}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ============================================================= */}
            {/* SECTION 2: MEDICAL DEVICE INFORMATION                         */}
            {/* ============================================================= */}
            <SectionCard
              id="device"
              title="2. Medical Device Information"
              description="UDI details, nomenclature (EMDN), commercial device specifications, and regulatory classification (EU MIR v7.3.1 Section 2)."
            >
              <div className="space-y-6">
                {/* 2.1 UDI */}
                <div>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    2.1 Unique Device Identification (UDI)
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Primary UDI-DI / EUDAMED ID" htmlFor="udiDI">
                      <Input
                        id="udiDI"
                        placeholder="GS1 / GTIN / HIBCC"
                        className={selectClass}
                        {...register("udiDI")}
                      />
                    </Field>

                    <Field label="UDI-DI Issuing Entity" htmlFor="udiDIEntity">
                      <Input
                        id="udiDIEntity"
                        placeholder="e.g. GS1, HIBCC, ICCBBA"
                        className={selectClass}
                        {...register("udiDIEntity")}
                      />
                    </Field>

                    <Field label="Production Identifier (UDI-PI)" htmlFor="udiPI">
                      <Input
                        id="udiPI"
                        placeholder="Lot/Serial/Software version"
                        className={selectClass}
                        {...register("udiPI")}
                      />
                    </Field>

                    <Field label="Basic UDI-DI / EUDAMED DI" htmlFor="udiDIBasic">
                      <Input
                        id="udiDIBasic"
                        placeholder="Basic UDI-DI"
                        className={selectClass}
                        {...register("udiDIBasic")}
                      />
                    </Field>
                  </div>
                </div>

                {/* 2.2 & 2.3 Description & Commercial Information */}
                <div className="border-t border-border/40 pt-4">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    2.2 & 2.3 Device Description & Commercial Specs
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Medical Device Name / Brand" htmlFor="brandName" required>
                      <Input
                        id="brandName"
                        placeholder="e.g. CardioFlow Pacemaker"
                        className={selectClass}
                        {...register("brandName")}
                      />
                    </Field>

                    <Field label="Model Number" htmlFor="modelNum">
                      <Input
                        id="modelNum"
                        placeholder="e.g. CF-9000X"
                        className={selectClass}
                        {...register("modelNum")}
                      />
                    </Field>

                    <Field label="Catalogue / Reference Number" htmlFor="catalogNum">
                      <Input
                        id="catalogNum"
                        placeholder="Catalogue #"
                        className={selectClass}
                        {...register("catalogNum")}
                      />
                    </Field>

                    <Field label="Serial / Lot Number" htmlFor="serialNum">
                      <Input
                        id="serialNum"
                        placeholder="Serial or Lot #"
                        className={selectClass}
                        {...register("serialNum")}
                      />
                    </Field>

                    <Field label="Software Version" htmlFor="deviceSoftwareVer">
                      <Input
                        id="deviceSoftwareVer"
                        placeholder="e.g. v2.4.1"
                        className={selectClass}
                        {...register("deviceSoftwareVer")}
                      />
                    </Field>

                    <Field label="EMDN Nomenclature Code" htmlFor="nomenclatureCode">
                      <Input
                        id="nomenclatureCode"
                        placeholder="e.g. J010101"
                        className={selectClass}
                        {...register("nomenclatureCode")}
                      />
                    </Field>

                    <Field label="MDR Risk Class" htmlFor="deviceClassMDR">
                      <select id="deviceClassMDR" {...register("deviceClassMDR")} className={selectClass}>
                        <option value="">Select MDR Class...</option>
                        <option value="Class I">Class I</option>
                        <option value="Class IIa">Class IIa</option>
                        <option value="Class IIb">Class IIb</option>
                        <option value="Class III">Class III</option>
                      </select>
                    </Field>

                    <Field label="Notified Body ID #" htmlFor="nbIdNum">
                      <Input
                        id="nbIdNum"
                        placeholder="e.g. 0123 (TÜV SÜD)"
                        className={selectClass}
                        {...register("nbIdNum")}
                      />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field label="Description of Device and Intended Purpose" htmlFor="deviceDescription">
                      <Textarea
                        id="deviceDescription"
                        rows={3}
                        placeholder="Describe device characteristics, mode of action, and intended clinical use as outlined in the IFU..."
                        {...register("deviceDescription")}
                      />
                    </Field>
                  </div>
                </div>

                {/* 2.3 Device Dates, Implant / Explant & Notified Body */}
                <div className="border-t border-border/40 pt-4">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Device Lifecycle, Implant / Explant & Notified Body Certification
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Date Lot Released">
                      <Controller
                        control={control}
                        name="dateLotReleased"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(d) => field.onChange(d)}
                            placeholder="Lot release date"
                            disabled={isLockReadOnly}
                          />
                        )}
                      />
                    </Field>

                    <Field label="Expiry Date">
                      <Controller
                        control={control}
                        name="expiryDate"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(d) => field.onChange(d)}
                            placeholder="Device expiry date"
                            disabled={isLockReadOnly}
                          />
                        )}
                      />
                    </Field>

                    <Field label="Date of Implant (From)">
                      <Controller
                        control={control}
                        name="dateOfImplantFrom"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(d) => field.onChange(d)}
                            placeholder="Implant start date"
                            disabled={isLockReadOnly}
                          />
                        )}
                      />
                    </Field>

                    <Field label="Date of Implant (To)">
                      <Controller
                        control={control}
                        name="dateOfImplantTo"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(d) => field.onChange(d)}
                            placeholder="Implant end date"
                            disabled={isLockReadOnly}
                          />
                        )}
                      />
                    </Field>

                    <Field label="Date of Explant (From)">
                      <Controller
                        control={control}
                        name="dateOfExplantFrom"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(d) => field.onChange(d)}
                            placeholder="Explant start date"
                            disabled={isLockReadOnly}
                          />
                        )}
                      />
                    </Field>

                    <Field label="Date of Explant (To)">
                      <Controller
                        control={control}
                        name="dateOfExplantTo"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(d) => field.onChange(d)}
                            placeholder="Explant end date"
                            disabled={isLockReadOnly}
                          />
                        )}
                      />
                    </Field>

                    <Field label="Implant Duration" htmlFor="implantDuration">
                      <Input
                        id="implantDuration"
                        placeholder="e.g. 18 months, 3 years"
                        className={selectClass}
                        {...register("implantDuration")}
                      />
                    </Field>

                    <Field label="Implant Facility Name" htmlFor="implantFacilityName">
                      <Input
                        id="implantFacilityName"
                        placeholder="Healthcare facility where implanted"
                        className={selectClass}
                        {...register("implantFacilityName")}
                      />
                    </Field>

                    <Field label="Explant Facility Name" htmlFor="explantFacilityName">
                      <Input
                        id="explantFacilityName"
                        placeholder="Healthcare facility where explanted"
                        className={selectClass}
                        {...register("explantFacilityName")}
                      />
                    </Field>

                    <Field label="Notified Body ID" htmlFor="notifiedBodyId">
                      <Input
                        id="notifiedBodyId"
                        placeholder="e.g. 0123"
                        className={selectClass}
                        {...register("notifiedBodyId")}
                      />
                    </Field>

                    <Field label="Notified Body Certificate No. of Device" htmlFor="notifiedBodyCerNoOfDevice">
                      <Input
                        id="notifiedBodyCerNoOfDevice"
                        placeholder="Certificate number (e.g. CE-987654)"
                        className={selectClass}
                        {...register("notifiedBodyCerNoOfDevice")}
                      />
                    </Field>
                  </div>
                </div>

                {/* 2.4 Device Placed on the Market & Regulatory Classification */}
                <div className="border-t border-border/40 pt-4">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    2.4 Device Placed on the Market & Regulatory Classification
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="flex items-center gap-3 pt-6">
                      <Controller
                        control={control}
                        name="devicePlacedOnMarket"
                        render={({ field }) => (
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                            <input
                              type="checkbox"
                              checked={!!field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                            />
                            Device Placed on Market
                          </label>
                        )}
                      />
                    </div>

                    <Field label="MDD Class" htmlFor="mddClass">
                      <Input
                        id="mddClass"
                        placeholder="e.g. Class I, IIa, IIb, III"
                        className={selectClass}
                        {...register("mddClass")}
                      />
                    </Field>

                    <Field label="MDR Class" htmlFor="mdrClass">
                      <select id="mdrClass" {...register("mdrClass")} className={selectClass}>
                        <option value="">Select MDR Class...</option>
                        <option value="Class I">Class I</option>
                        <option value="Class IIa">Class IIa</option>
                        <option value="Class IIb">Class IIb</option>
                        <option value="Class III">Class III</option>
                      </select>
                    </Field>

                    <Field label="IVDD Class" htmlFor="ivddClass">
                      <Input
                        id="ivddClass"
                        placeholder="e.g. General, List A, List B"
                        className={selectClass}
                        {...register("ivddClass")}
                      />
                    </Field>

                    <Field label="IVDR Class" htmlFor="ivdrClass">
                      <select id="ivdrClass" {...register("ivdrClass")} className={selectClass}>
                        <option value="">Select IVDR Class...</option>
                        <option value="Class A">Class A</option>
                        <option value="Class B">Class B</option>
                        <option value="Class C">Class C</option>
                        <option value="Class D">Class D</option>
                      </select>
                    </Field>
                  </div>
                </div>

                {/* 2.5 & 2.6 Market Distribution & Associated Devices */}
                <div className="border-t border-border/40 pt-4">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    2.5 & 2.6 Market Distribution & Associated Devices
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Market Distribution of Device" htmlFor="marketDistributionOfDevice">
                      <Input
                        id="marketDistributionOfDevice"
                        placeholder="e.g. EEA, Worldwide, Specific regions"
                        className={selectClass}
                        {...register("marketDistributionOfDevice")}
                      />
                    </Field>

                    <Field label="Countries Distributed To" htmlFor="countriesDistributedTo">
                      <Input
                        id="countriesDistributedTo"
                        placeholder="e.g. FR, DE, IT, ES, US"
                        className={selectClass}
                        {...register("countriesDistributedTo")}
                      />
                    </Field>

                    <Field label="Relevant Accessories" htmlFor="relevantAccessories">
                      <Textarea
                        id="relevantAccessories"
                        rows={2}
                        placeholder="List relevant accessories used in conjunction with this device..."
                        {...register("relevantAccessories")}
                      />
                    </Field>

                    <Field label="Relevant Associated Devices" htmlFor="relevantAssociatedDevices">
                      <Textarea
                        id="relevantAssociatedDevices"
                        rows={2}
                        placeholder="List associated devices used in conjunction with this device..."
                        {...register("relevantAssociatedDevices")}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ============================================================= */}
            {/* SECTION 3: INCIDENT DETAILS & CLINICAL INFORMATION            */}
            {/* ============================================================= */}
            <SectionCard
              id="incident"
              title="3. Incident Information Derived from Initial Reporter"
              description="First-hand event narration, IMDRF problem observation, clinical consequences, and reporting facility (EU MIR v7.3.1 Section 3)."
            >
              <div className="space-y-6">
                {/* 3.1 Nature of Incident */}
                <div>
                  <Field
                    label="Comprehensive Incident Description (What went wrong & clinical effects)"
                    htmlFor="eventDescription"
                    required
                    error={errors.eventDescription?.message}
                  >
                    <Textarea
                      id="eventDescription"
                      rows={4}
                      placeholder="Describe the incident comprehensively including: (1) what went wrong with the device, and (2) clinical signs, symptoms, conditions, and health effects on the patient or user..."
                      {...register("eventDescription")}
                    />
                  </Field>
                </div>

                {/* 3.2 Problem & Device Usage */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Patients Involved" htmlFor="numPatientsInvolved">
                    <Input
                      id="numPatientsInvolved"
                      type="number"
                      min={0}
                      className={selectClass}
                      {...register("numPatientsInvolved", { valueAsNumber: true })}
                    />
                  </Field>

                  <Field label="Current Location of Device" htmlFor="currentDeviceLocation">
                    <Input
                      id="currentDeviceLocation"
                      placeholder="e.g. Returned to manufacturer, Hospital"
                      className={selectClass}
                      {...register("currentDeviceLocation")}
                    />
                  </Field>

                  <Field label="Operator at Time of Event" htmlFor="deviceOperatorAtEvent">
                    <Input
                      id="deviceOperatorAtEvent"
                      placeholder="Healthcare professional, Patient, Lay user"
                      className={selectClass}
                      {...register("deviceOperatorAtEvent")}
                    />
                  </Field>

                  <Field label="Device Usage (As Intended)" htmlFor="deviceUsage">
                    <Input
                      id="deviceUsage"
                      placeholder="Initial use, Reuse, Single-use"
                      className={selectClass}
                      {...register("deviceUsage")}
                    />
                  </Field>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="IMDRF Annex A Problem Codes" htmlFor="imdrfA">
                      <Input
                        id="imdrfA"
                        placeholder="e.g. A0101, A0203 (comma-separated)"
                        className={selectClass}
                        {...register("imdrfA")}
                      />
                    </Field>

                    <Field label="Patient Status / Intervention" htmlFor="patientStatusIntervention">
                      <Input
                        id="patientStatusIntervention"
                        placeholder="e.g. Surgical revision required, Patient stabilized"
                        className={selectClass}
                        {...register("patientStatusIntervention")}
                      />
                    </Field>
                  </div>
                </div>

                {/* 3.3 Clinical Information & Demographics */}
                <div className="border-t border-border/40 pt-4">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    3.3 Patient Demographics & Health Effects
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Patient Age (Years)" htmlFor="patientAgeYears">
                      <Input
                        id="patientAgeYears"
                        type="number"
                        min={0}
                        max={130}
                        className={selectClass}
                        {...register("patientAgeYears", { valueAsNumber: true })}
                      />
                    </Field>

                    <Field label="Gender" htmlFor="gender">
                      <select id="gender" {...register("gender")} className={selectClass}>
                        <option value="">Select gender...</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                        <option value="Not Specified">Not Specified</option>
                      </select>
                    </Field>

                    <Field label="Body Weight (kg)" htmlFor="massKG">
                      <Input
                        id="massKG"
                        type="number"
                        step="0.1"
                        placeholder="kg"
                        className={selectClass}
                        {...register("massKG", { valueAsNumber: true })}
                      />
                    </Field>

                    <Field label="Height (cm)" htmlFor="heightCM">
                      <Input
                        id="heightCM"
                        type="number"
                        step="1"
                        placeholder="cm"
                        className={selectClass}
                        {...register("heightCM", { valueAsNumber: true })}
                      />
                    </Field>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="IMDRF Annex E / 3 (Clinical Signs & Symptoms)" htmlFor="imdrfE">
                      <Input
                        id="imdrfE"
                        placeholder="e.g. E0101, E2402"
                        className={selectClass}
                        {...register("imdrfE")}
                      />
                    </Field>

                    <Field label="IMDRF Annex F (Health Impact / Outcome)" htmlFor="imdrfF">
                      <Input
                        id="imdrfF"
                        placeholder="e.g. F01, F02, F28"
                        className={selectClass}
                        {...register("imdrfF")}
                      />
                    </Field>
                  </div>
                </div>

                {/* 3.4 Initial Reporter Details */}
                <div className="border-t border-border/40 pt-4">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    3.4 Initial Reporter Credentials
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Reporter Role" htmlFor="initialReporterRole">
                      <Input
                        id="initialReporterRole"
                        placeholder="Physician, Biomedical Engineer, Patient"
                        className={selectClass}
                        {...register("initialReporterRole")}
                      />
                    </Field>

                    <Field label="Healthcare Facility Name" htmlFor="healthcareFacilityName">
                      <Input
                        id="healthcareFacilityName"
                        placeholder="Hospital or clinic name"
                        className={selectClass}
                        {...register("healthcareFacilityName")}
                      />
                    </Field>

                    <Field label="Facility Country" htmlFor="healthcareFacilityCountry">
                      <Input
                        id="healthcareFacilityCountry"
                        placeholder="e.g. France, Germany"
                        className={selectClass}
                        {...register("healthcareFacilityCountry")}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ============================================================= */}
            {/* SECTION 4: MANUFACTURER ANALYSIS                              */}
            {/* ============================================================= */}
            <SectionCard
              id="analysis"
              title="4. Manufacturer Analysis"
              description="Root cause investigation, device relatedness, corrective/preventive actions, and similar incidents analysis (EU MIR v7.3.1 Section 4)."
              badge={
                isFinalVariant ? (
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    Final Investigation Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400">
                    Preliminary Stage
                  </Badge>
                )
              }
            >
              <div className="space-y-6">
                {/* 4.1 Preliminary Comments (Initial / Follow-Up) */}
                <div>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    4.1 Preliminary Comments & Initial Assessment
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Device Relatedness" htmlFor="initialDeviceRelatedness">
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

                    <Field label="Causality Assessment" htmlFor="initialCausalityAssessment">
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

                    <Field label="Seriousness Assessment" htmlFor="initialSeriousnessAssessment">
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

                    <Field label="Initial Risk Tier" htmlFor="initialRiskAssessment">
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

                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <Field
                      label="Preliminary Results and Conclusions of Investigation"
                      htmlFor="manufacturersPrelimAnalysis"
                    >
                      <Textarea
                        id="manufacturersPrelimAnalysis"
                        rows={3}
                        placeholder="Document initial engineering, clinical, or manufacturing analysis and immediate findings..."
                        {...register("manufacturersPrelimAnalysis")}
                      />
                    </Field>

                    <Field
                      label="Initial Manufacturer CAPA / FSCA / Remedial Action"
                      htmlFor="initialManufacturerCapa"
                    >
                      <Textarea
                        id="initialManufacturerCapa"
                        rows={3}
                        placeholder="Detail any initial remedial actions, CAPA triggers, or containment measures initiated..."
                        {...register("initialManufacturerCapa")}
                      />
                    </Field>
                  </div>
                </div>

                {/* 4.2 Cause Investigation & Conclusions (Mandatory for Final/Combined) */}
                <div className={cn("border-t border-border/40 pt-4", !isFinalVariant && "opacity-80")}>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      4.2 Cause Investigation and Final Conclusion
                    </h4>
                    {!isFinalVariant && (
                      <span className="text-[11px] text-muted-foreground italic">
                        (Active during Final / Combined reporting)
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Field
                      label="Description of Root Causes / Causative Factors and Final Conclusion"
                      htmlFor="rootCauses"
                    >
                      <Textarea
                        id="rootCauses"
                        rows={4}
                        placeholder="Detail the root cause investigation, engineering teardown, testing results, and final clinical conclusion..."
                        {...register("rootCauses")}
                      />
                    </Field>

                    <Field
                      label="Reason Incident is Considered Non-Reportable"
                      htmlFor="reasonForNotReportable"
                    >
                      <Textarea
                        id="reasonForNotReportable"
                        rows={3}
                        placeholder="Document comprehensive rationale demonstrating why incident or serious incident criteria were not met..."
                        {...register("reasonForNotReportable")}
                      />
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="IMDRF Annex G (Component Code)" htmlFor="imdrfG">
                        <Input
                          id="imdrfG"
                          placeholder="e.g. G0101, Component / subassembly"
                          className={selectClass}
                          {...register("imdrfG")}
                        />
                      </Field>

                      <Field label="Any Action Taken / Remedial Action" htmlFor="anyActionTaken">
                        <Input
                          id="anyActionTaken"
                          placeholder="CAPA-2026-004 / FSCA reference"
                          className={selectClass}
                          {...register("anyActionTaken")}
                        />
                      </Field>

                      <Field label="Action Implementation Schedule" htmlFor="actionImplementationSchedule">
                        <Input
                          id="actionImplementationSchedule"
                          placeholder="e.g. Q3 2026 completion"
                          className={selectClass}
                          {...register("actionImplementationSchedule")}
                        />
                      </Field>
                    </div>

                    <Field
                      label="Final Manufacturer Comments"
                      htmlFor="finalManufacturerComments"
                    >
                      <Textarea
                        id="finalManufacturerComments"
                        rows={3}
                        placeholder="Final remarks, summary of risk-benefit reassessment, or closing manufacturer comments..."
                        {...register("finalManufacturerComments")}
                      />
                    </Field>

                    <div className="flex items-center gap-3 pt-2">
                      <Controller
                        control={control}
                        name="rootCauseConfirmed"
                        render={({ field }) => (
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                            <input
                              type="checkbox"
                              checked={!!field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                            />
                            Root cause definitively confirmed
                          </label>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* 4.3 Similar Serious Incidents */}
                <div className={cn("border-t border-border/40 pt-4", !isFinalVariant && "opacity-80")}>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    4.3 Similar Serious Incidents & Market Denominator Data
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Basis for Similar Incidents Identification" htmlFor="similarVariant">
                      <Input
                        id="similarVariant"
                        placeholder="e.g. Same product platform / batch series"
                        className={selectClass}
                        {...register("similarVariant")}
                      />
                    </Field>

                    <Field label="Denominator Data Basis" htmlFor="numberBasedOn">
                      <Input
                        id="numberBasedOn"
                        placeholder="Active installed base, units distributed"
                        className={selectClass}
                        {...register("numberBasedOn")}
                      />
                    </Field>

                    <Field label="Comments on Similar Incidents Determination" htmlFor="howWereDetermined">
                      <Input
                        id="howWereDetermined"
                        placeholder="Calculation methodology"
                        className={selectClass}
                        {...register("howWereDetermined")}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ============================================================= */}
            {/* SECTION 5: GENERAL COMMENTS (EU MIR v7.3.1 Section 5)        */}
            {/* ============================================================= */}
            <SectionCard
              id="comments"
              title="5. General Comments"
              description="Additional narrative remarks and contextual information transmitted to the National Competent Authority (EU MIR v7.3.1 Section 5)."
            >
              <div className="space-y-6">
                <div>
                  <Field label="General Comments & Regulatory Remarks" htmlFor="additionalComments">
                    <Textarea
                      id="additionalComments"
                      rows={4}
                      placeholder="Enter any additional remarks or contextual information not captured in the earlier sections..."
                      {...register("additionalComments")}
                    />
                  </Field>
                </div>

              </div>
            </SectionCard>
          </div>

            {/* Footer action link */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href={complaintDetailHref}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel and return to complaint
              </Link>

              <Button
                type="submit"
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
          </fieldset>
        </form>

        {/* ---------- Right context panel ---------- */}
        <aside className="space-y-4 xl:sticky xl:top-[120px] xl:self-start">
          <PanelCard title="Assessment details">
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
                <dt className="shrink-0 text-xs text-muted-foreground">Reportable</dt>
                <dd
                  className={cn(
                    "text-right text-xs font-medium",
                    watchReportType !== "FINAL_NON_REPORTABLE"
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {watchReportType !== "FINAL_NON_REPORTABLE" ? "Yes (Mandatory)" : "No (Exempt)"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Decision</dt>
                <dd className="text-right text-xs text-foreground">
                  {CLASSIFICATION_OPTIONS.find((c) => c.value === watchEventClassification)?.label || humanize(watchEventClassification) || "—"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Report type</dt>
                <dd className="text-right text-xs text-foreground">
                  {REPORT_TYPE_OPTIONS.find((r) => r.value === watchReportType)?.label || humanize(watchReportType) || "—"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Jurisdiction</dt>
                <dd className="text-right text-xs text-foreground break-words">
                  {watchNcaName || watchCompetentAuthority || "—"}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Due date</dt>
                <dd className="text-right text-xs font-mono text-foreground">
                  {formatDate(watchReportNextDate || watchDueDate)}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">Drafter</dt>
                <dd className="text-right text-xs text-foreground break-words">
                  {displayedDrafter}
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
                  attachments={field.value || []}
                  onChange={(atts) => field.onChange(atts)}
                  disabled={isLockReadOnly}
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
