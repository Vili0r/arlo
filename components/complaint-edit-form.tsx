"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Lock,
  LockOpen,
  Box,
  Paperclip,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { CustomerReportModal } from "@/components/customer-report-modal";
import {
  Priority,
  Death,
  ComplaintStatus,
  SampleStatus,
  LockEntityType,
} from "@prisma/client";
import { useRecordLock } from "@/hooks/useRecordLock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  updateComplaintWithRelations,
  updateSampleManagement,
} from "@/lib/actions/complaints";
import {
  CUSTOMER_TYPES,
  REGIONS,
  COUNTRIES,
  IMDRF_ANNEX_A_CATEGORIES,
  IMDRF_ANNEX_A_SUBCAT_MAP,
  IMDRF_ANNEX_E_CODES,
  IMDRF_ANNEX_F_CODES,
} from "@/lib/constants/qms-options";
import { useOrganization } from "@clerk/nextjs";
import { FileUploader } from "@/components/file-uploader";
import {
  ComplaintFormSchema,
  type ComplaintFormValues,
} from "@/lib/validations/complaint";
import { StatusTransitionTracker } from "@/components/status-transition-tracker";
import { formatUserName, cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface SampleManagementData {
  id: string;
  sampleAvailable: boolean;
  trackingDetails: string | null;
  status: SampleStatus;
  receivedDate: string | null;
}

interface ComplaintEditFormProps {
  orgSlug: string;
  complaint: {
    id: string;
    complaintNumber: string;
    shortDescription: string;
    description: string;
    priority: Priority;
    status: ComplaintStatus;
    awarenessDate: string;
    dateReceived: string;
    regulatoryReportingReference?: string | null;
    customerName: string;
    customerType: string;
    initialReporterName: string;
    initialReporterSurname: string;
    email: string;
    address: string;
    country: string;
    telNumber: string;
    countryEventOccurred: string;
    region: string;
    death: Death;
    deviceModel?: string | null;
    deviceSerialNumber?: string | null;
    lotNumber?: string | null;
    complaintOwnerId: string;
    productInformation?: Array<{
      id: string;
      occurrence?: string | null;
      materialNumber?: string | null;
      materialDescription?: string | null;
      serialNumber?: string | null;
      batchNumber?: string | null;
      udi?: string | null;
      asReportedCode1?: string | null;
      asReportedCode2?: string | null;
      softwareVersion?: string | null;
    }>;
    patientInformation?: Array<{
      id: string;
      patientName?: string | null;
      patientImpact?: string | null;
      patientImpactDesc?: string | null;
      sex?: string | null;
      age?: number | null;
      eventOccurred?: string | Date | null;
      annexE_Codes: string[];
      annexF_Codes: string[];
    }>;
    attachments?: Array<{
      id: string;
      fileUrl: string;
      fileName: string;
      fileSize: number | null;
      mimeType: string | null;
    }>;
    sampleManagement?: SampleManagementData | null;
    investigation?: {
      id?: string;
      status?: string;
      summary?: {
        id?: string;
        report?: string | null;
        summary?: string | null;
      } | null;
    } | null;
    complaintOwner?: {
      id?: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
    createdBy?: {
      id?: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
    createdById?: string | null;
  };
}

/* ------------------------------------------------------------------ */
/* Shared styles and small helpers                                     */
/* ------------------------------------------------------------------ */

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "reporter", label: "Reporter" },
  { id: "devices", label: "Devices" },
  { id: "patients", label: "Patients" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];
type Completion = "done" | "attention" | "empty";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  UNDER_INVESTIGATION: "Under investigation",
  PENDING_REVIEW: "Pending review",
  CLOSED: "Closed",
};

const SAMPLE_STEPS: Array<{ status: SampleStatus; label: string }> = [
  { status: SampleStatus.PENDING, label: "Pending return" },
  { status: SampleStatus.RECEIVED, label: "Received" },
  { status: SampleStatus.UNDER_EVALUATION, label: "Under evaluation" },
  { status: SampleStatus.RETURNED, label: "Returned" },
];

function humanize(value: string) {
  return (
    STATUS_LABEL[value] ??
    value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ")
  );
}

function formatDate(d?: Date | string | null) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function ComplaintEditForm({
  orgSlug,
  complaint,
}: ComplaintEditFormProps) {
  const router = useRouter();
  const { isReadOnly: isLockReadOnly } = useRecordLock({
    entityType: LockEntityType.Complaint,
    recordId: complaint.id,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
  const [isSampleSheetOpen, setIsSampleSheetOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<SectionId>("overview");
  const [openProduct, setOpenProduct] = React.useState<number | null>(0);
  const [openPatient, setOpenPatient] = React.useState<number | null>(0);

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
      // 1. Direct First + Last name if available
      if (user) {
        const directFullName = [user.firstName, user.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (directFullName) return directFullName;
      }

      // 2. Lookup in Clerk organization memberships map by userId
      const targetId = userId || user?.id;
      if (targetId && memberNameMap.has(targetId)) {
        return memberNameMap.get(targetId)!;
      }

      // 3. Lookup in Clerk organization memberships map by email
      if (user?.email && memberNameMap.has(user.email)) {
        return memberNameMap.get(user.email)!;
      }

      // 4. Fallback to formatUserName (which uses email if no name), or fallback
      if (user) {
        return formatUserName(user, fallback);
      }
      return fallback;
    },
    [memberNameMap]
  );

  /* ---------- defaults (unchanged from original) ---------- */

  const defaultProducts = React.useMemo(() => {
    if (complaint.productInformation && complaint.productInformation.length > 0) {
      return complaint.productInformation.map((p) => {
        const code1 = p.asReportedCode1 || "";
        const matchedCat = code1 ? code1.slice(0, 3) : "";
        return {
          id: p.id,
          occurrence: p.occurrence || "Device #1",
          materialNumber: p.materialNumber || "",
          materialDescription: p.materialDescription || complaint.deviceModel || "",
          serialNumber: p.serialNumber || complaint.deviceSerialNumber || "",
          batchNumber: p.batchNumber || complaint.lotNumber || "",
          udi: p.udi || "",
          annexA_Category: matchedCat,
          asReportedCode1: code1,
          asReportedCode2: p.asReportedCode2 || "",
          softwareVersion: p.softwareVersion || "",
        };
      });
    }
    return [
      {
        occurrence: "Device #1 (Primary)",
        materialNumber: "",
        materialDescription: complaint.deviceModel || "",
        serialNumber: complaint.deviceSerialNumber || "",
        batchNumber: complaint.lotNumber || "",
        udi: "",
        annexA_Category: "",
        asReportedCode1: "",
        asReportedCode2: "",
        softwareVersion: "",
      },
    ];
  }, [complaint]);

  const defaultPatients = React.useMemo(() => {
    if (complaint.patientInformation && complaint.patientInformation.length > 0) {
      return complaint.patientInformation.map((pt) => ({
        id: pt.id,
        patientName: pt.patientName || "",
        patientImpact: pt.patientImpact || "",
        patientImpactDesc: pt.patientImpactDesc || "",
        sex: pt.sex || "UNKNOWN",
        age: pt.age ? String(pt.age) : "",
        eventOccurred: pt.eventOccurred ? new Date(pt.eventOccurred) : undefined,
        annexE_Code: pt.annexE_Codes?.[0] || "",
        annexF_Code: pt.annexF_Codes?.[0] || "",
      }));
    }
    return [
      {
        patientName: "",
        patientImpact: "",
        patientImpactDesc: "",
        sex: "UNKNOWN",
        age: "",
        eventOccurred: undefined,
        annexE_Code: "",
        annexF_Code: "",
      },
    ];
  }, [complaint]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ComplaintFormValues>({
    resolver: zodResolver(ComplaintFormSchema),
    defaultValues: {
      shortDescription: complaint.shortDescription || "",
      description: complaint.description || "",
      priority: complaint.priority,
      status: complaint.status,
      awarenessDate: new Date(complaint.awarenessDate),
      dateReceived: new Date(complaint.dateReceived),
      death: complaint.death || Death.NO,
      complaintOwnerId: complaint.complaintOwnerId || "",
      customerName: complaint.customerName || "",
      customerType: complaint.customerType || CUSTOMER_TYPES[0].value,
      initialReporterName: complaint.initialReporterName || "",
      initialReporterSurname: complaint.initialReporterSurname || "",
      email: complaint.email || "",
      address: complaint.address || "",
      country: complaint.country || "United States",
      telNumber: complaint.telNumber || "",
      countryEventOccurred: complaint.countryEventOccurred || "United States",
      region: complaint.region || REGIONS[0].value,
      attachments:
        complaint.attachments?.map((a) => ({
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
        })) || [],
      products: defaultProducts,
      patients: defaultPatients,
    },
  });

  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
  } = useFieldArray({ control, name: "products" });

  const {
    fields: patientFields,
    append: appendPatient,
    remove: removePatient,
  } = useFieldArray({ control, name: "patients" });

  /* ---------- sample management state (unchanged) ---------- */

  const [sampleAvailable, setSampleAvailable] = React.useState(
    complaint.sampleManagement?.sampleAvailable ?? false
  );
  const [sampleTracking, setSampleTracking] = React.useState(
    complaint.sampleManagement?.trackingDetails || ""
  );
  const [sampleStatus, setSampleStatus] = React.useState<SampleStatus>(
    complaint.sampleManagement?.status || SampleStatus.PENDING
  );
  const [sampleReceivedDate, setSampleReceivedDate] = React.useState<Date | undefined>(
    complaint.sampleManagement?.receivedDate
      ? new Date(complaint.sampleManagement.receivedDate)
      : undefined
  );
  const [isUpdatingSample, setIsUpdatingSample] = React.useState(false);

  /* ---------- watched values for header / completion ---------- */

  const watchProducts = watch("products");
  const watchPatients = watch("patients");
  const watchDeath = watch("death");
  const watchPriority = watch("priority");
  const watchShort = watch("shortDescription");
  const watchCustomer = watch("customerName");
  const watchReporterName = watch("initialReporterName");
  const watchEmail = watch("email");
  const watchAttachments = watch("attachments");
  const watchComplaintOwnerId = watch("complaintOwnerId");

  const displayedOwner = React.useMemo(() => {
    const currentOwnerId = watchComplaintOwnerId !== undefined ? watchComplaintOwnerId : complaint.complaintOwnerId;
    if (!currentOwnerId) return "Unassigned";
    return resolveUserDisplayName(
      complaint.complaintOwner,
      currentOwnerId,
      "Unassigned"
    );
  }, [watchComplaintOwnerId, complaint.complaintOwnerId, complaint.complaintOwner, resolveUserDisplayName]);

  const displayedLoggedBy = React.useMemo(() => {
    return resolveUserDisplayName(
      complaint.createdBy,
      complaint.createdById,
      "System"
    );
  }, [complaint.createdBy, complaint.createdById, resolveUserDisplayName]);

  const isAdverse =
    watchDeath === Death.YES || watchPriority === Priority.CRITICAL;

  const completion = React.useMemo<Record<SectionId, Completion>>(() => {
    const overview: Completion = watchShort ? "done" : "attention";
    const reporter: Completion =
      watchCustomer && watchReporterName && watchEmail ? "done" : "attention";

    const devicesFilled = watchProducts?.some(
      (p) => p.materialDescription || p.serialNumber || p.batchNumber || p.udi
    );
    const devicesCoded = watchProducts?.every(
      (p) => !(p.materialDescription || p.serialNumber) || p.asReportedCode1
    );
    const devices: Completion = !devicesFilled
      ? "empty"
      : devicesCoded
        ? "done"
        : "attention";

    const patientsFilled = watchPatients?.some(
      (pt) => pt.patientName || pt.patientImpactDesc || pt.age
    );
    const patientsCoded = watchPatients?.every(
      (pt) => !(pt.patientName || pt.patientImpactDesc) || pt.annexF_Code
    );
    const patients: Completion = !patientsFilled
      ? "empty"
      : patientsCoded
        ? "done"
        : "attention";

    return { overview, reporter, devices, patients };
  }, [
    watchShort,
    watchCustomer,
    watchReporterName,
    watchEmail,
    watchProducts,
    watchPatients,
  ]);

  /* ---------- scroll-spy for the anchor tabs ---------- */

  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // WorkspaceShell's <main> is the scroll container, not window.
    // Walk up until we find whatever actually scrolls.
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

      // At (or within a few px of) the bottom, the last section is active
      // even if its top never reaches the activation line.
      if (scrollTop + viewport >= scrollHeight - 4) {
        setActiveSection(els[els.length - 1].id as SectionId);
        return;
      }

      // Otherwise: the last section whose top has crossed the activation
      // line, which sits just under the sticky record bar.
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

  /* ---------- submit (logic unchanged) ---------- */

  const onSubmit = async (data: ComplaintFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const filteredProducts = data.products
        .filter(
          (p) =>
            p.materialNumber ||
            p.materialDescription ||
            p.serialNumber ||
            p.batchNumber ||
            p.udi ||
            p.asReportedCode1 ||
            p.annexA_Category
        )
        .map((p) => ({
          id: (p as any).id || undefined,
          occurrence: p.occurrence || null,
          materialNumber: p.materialNumber || null,
          materialDescription: p.materialDescription || null,
          serialNumber: p.serialNumber || null,
          batchNumber: p.batchNumber || null,
          udi: p.udi || null,
          asReportedCode1:
            p.asReportedCode1 || (p.annexA_Category ? p.annexA_Category : null),
          asReportedCode2: p.asReportedCode2 || null,
          softwareVersion: p.softwareVersion || null,
        }));

      const filteredPatients = data.patients
        .filter(
          (pt) =>
            pt.patientName ||
            pt.patientImpact ||
            pt.patientImpactDesc ||
            pt.age ||
            pt.eventOccurred ||
            pt.annexE_Code ||
            pt.annexF_Code
        )
        .map((pt) => ({
          id: (pt as any).id || undefined,
          patientName: pt.patientName || null,
          patientImpact: pt.patientImpact || null,
          patientImpactDesc: pt.patientImpactDesc || null,
          sex: pt.sex || null,
          age: pt.age ? parseInt(pt.age, 10) : null,
          eventOccurred: pt.eventOccurred
            ? new Date(pt.eventOccurred)
            : data.awarenessDate,
          annexE_Codes: pt.annexE_Code ? [pt.annexE_Code] : [],
          annexF_Codes: pt.annexF_Code ? [pt.annexF_Code] : [],
        }));

      await updateComplaintWithRelations({
        complaintId: complaint.id,
        shortDescription: data.shortDescription,
        description: data.description || data.shortDescription,
        priority: data.priority,
        status: data.status || complaint.status,
        awarenessDate: data.awarenessDate,
        dateReceived: data.dateReceived,
        customerName: data.customerName,
        customerType: data.customerType,
        initialReporterName: data.initialReporterName,
        initialReporterSurname: data.initialReporterSurname,
        email: data.email,
        address: data.address || "N/A",
        country: data.country,
        telNumber: data.telNumber || "N/A",
        countryEventOccurred: data.countryEventOccurred,
        region: data.region,
        death: data.death,
        complaintOwnerId: data.complaintOwnerId || undefined,
        deviceModel: filteredProducts[0]?.materialDescription || null,
        deviceSerialNumber: filteredProducts[0]?.serialNumber || null,
        lotNumber: filteredProducts[0]?.batchNumber || null,
        isAdverseEvent:
          data.death === Death.YES || data.priority === Priority.CRITICAL,
        products: filteredProducts,
        patients: filteredPatients,
        newAttachments: data.attachments.filter(
          (a) => !complaint.attachments?.some((ea) => ea.fileUrl === a.fileUrl)
        ),
      });

      toast.success("Changes saved");
      router.refresh();
    } catch (err: any) {
      console.error("[Complaint Update Error]", err);
      setError(err?.message || "Couldn't save the complaint. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSample = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSample(true);
    setError(null);
    try {
      await updateSampleManagement({
        complaintId: complaint.id,
        sampleAvailable,
        trackingDetails: sampleTracking,
        status: sampleStatus,
        receivedDate: sampleReceivedDate ? sampleReceivedDate.toISOString() : null,
      });
      toast.success("Sample details saved");
      setIsSampleSheetOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error("[Sample Update Error]", err);
      setError(err?.message || "Couldn't save the sample details.");
    } finally {
      setIsUpdatingSample(false);
    }
  };

  const sampleStepIndex = SAMPLE_STEPS.findIndex((s) => s.status === sampleStatus);
  const sampleIsTerminal =
    sampleStatus === SampleStatus.DISPOSED ||
    sampleStatus === SampleStatus.NOT_AVAILABLE;

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
              <Link
                href="/complaints"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Complaints
              </Link>
              <span className="text-xs text-muted-foreground/60">/</span>
              <span className="font-mono text-sm font-medium text-foreground">
                {complaint.complaintNumber}
              </span>
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                {humanize(complaint.status)}
              </Badge>
              {isAdverse && (
                <Badge
                  variant="outline"
                  className="border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
                >
                  Adverse event
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 lg:mt-2">
              <StatusTransitionTracker
                entityType="Complaint"
                entityId={complaint.id}
                currentStatus={complaint.status}
                disabled={isLockReadOnly}
                onGenerateReport={() => setIsReportModalOpen(true)}
                onStatusChanged={() => router.refresh()}
              />
              <Button
                type="submit"
                form="complaint-form"
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

      {/* ---------- Body ---------- */}
      <div className="grid gap-6 p-6 lg:p-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main column */}
        <form
          id="complaint-form"
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
            {/* ---------- Overview ---------- */}
            <SectionCard
              id="overview"
              title="Overview"
              description="What happened, how severe it is, and when you learned of it."
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
                    placeholder="Audible alarm failed during low-pressure event"
                    {...register("shortDescription")}
                  />
                </Field>

                <Field
                  label="Event narrative"
                  htmlFor="description"
                  error={errors.description?.message}
                >
                  <Textarea
                    id="description"
                    rows={5}
                    placeholder="Describe the incident in full: setting, sequence of events, device behaviour, and any intervention."
                    className="leading-relaxed"
                    {...register("description")}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Priority" htmlFor="priority" required>
                    <select id="priority" {...register("priority")} className={selectClass}>
                      <option value={Priority.LOW}>Low</option>
                      <option value={Priority.MEDIUM}>Medium</option>
                      <option value={Priority.HIGH}>High</option>
                      <option value={Priority.CRITICAL}>Critical</option>
                    </select>
                  </Field>

                  <Field label="Owner" htmlFor="complaintOwnerId">
                    <select
                      id="complaintOwnerId"
                      {...register("complaintOwnerId")}
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

                  <Field label="Awareness date" required>
                    <Controller
                      control={control}
                      name="awarenessDate"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={(d) => d && field.onChange(d)}
                          placeholder="Select date"
                        />
                      )}
                    />
                  </Field>

                  <Field label="Date received" required>
                    <Controller
                      control={control}
                      name="dateReceived"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={(d) => d && field.onChange(d)}
                          placeholder="Select date"
                        />
                      )}
                    />
                  </Field>
                </div>

                {/* Death / serious injury segmented control */}
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Did the incident involve death or serious injury?
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Yes flags this record as an adverse event for reporting.
                        </p>
                      </div>
                    </div>
                    <Controller
                      control={control}
                      name="death"
                      render={({ field }) => (
                        <div
                          role="radiogroup"
                          className="inline-flex shrink-0 rounded-md border border-border bg-background p-0.5"
                        >
                          {[
                            { label: "No", value: Death.NO },
                            { label: "Yes", value: Death.YES },
                            { label: "Unknown", value: Death.UNKNOWN },
                          ].map((opt) => {
                            const selected = field.value === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => field.onChange(opt.value)}
                                className={cn(
                                  "rounded px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
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
                      )}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ---------- Reporter and location ---------- */}
            <SectionCard
              id="reporter"
              title="Reporter and location"
              description="Who reported it, where they are, and where the event occurred."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Customer or facility"
                    htmlFor="customerName"
                    required
                    error={errors.customerName?.message}
                  >
                    <Input
                      id="customerName"
                      placeholder="St. Jude Regional Hospital"
                      {...register("customerName")}
                    />
                  </Field>
                  <Field label="Facility type" htmlFor="customerType" required>
                    <select
                      id="customerType"
                      {...register("customerType")}
                      className={selectClass}
                    >
                      {CUSTOMER_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Reporter first name"
                    htmlFor="initialReporterName"
                    required
                    error={errors.initialReporterName?.message}
                  >
                    <Input
                      id="initialReporterName"
                      placeholder="Sarah"
                      {...register("initialReporterName")}
                    />
                  </Field>
                  <Field
                    label="Reporter surname"
                    htmlFor="initialReporterSurname"
                    required
                    error={errors.initialReporterSurname?.message}
                  >
                    <Input
                      id="initialReporterSurname"
                      placeholder="Jenkins"
                      {...register("initialReporterSurname")}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Reporter email"
                    htmlFor="email"
                    required
                    error={errors.email?.message}
                  >
                    <Input
                      id="email"
                      type="email"
                      placeholder="s.jenkins@hospital.org"
                      {...register("email")}
                    />
                  </Field>
                  <Field label="Reporter phone" htmlFor="telNumber">
                    <Input
                      id="telNumber"
                      placeholder="+44 20 7946 0958"
                      {...register("telNumber")}
                    />
                  </Field>
                </div>

                <Field label="Customer address" htmlFor="address">
                  <Input
                    id="address"
                    placeholder="100 Medical Center Blvd, Suite 400"
                    {...register("address")}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-3">
                  <Field label="Reporter country" htmlFor="country" required>
                    <select id="country" {...register("country")} className={selectClass}>
                      {COUNTRIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Country event occurred"
                    htmlFor="countryEventOccurred"
                    required
                  >
                    <select
                      id="countryEventOccurred"
                      {...register("countryEventOccurred")}
                      className={selectClass}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Regulatory region" htmlFor="region" required>
                    <select id="region" {...register("region")} className={selectClass}>
                      {REGIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* ---------- Devices ---------- */}
            <SectionCard
              id="devices"
              title={`Devices · ${productFields.length}`}
              description="Every device involved, with identifiers and IMDRF problem coding."
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    appendProduct({
                      occurrence: `Device #${productFields.length + 1}`,
                      materialNumber: "",
                      materialDescription: "",
                      serialNumber: "",
                      batchNumber: "",
                      udi: "",
                      annexA_Category: "",
                      asReportedCode1: "",
                      asReportedCode2: "",
                      softwareVersion: "",
                    });
                    setOpenProduct(productFields.length);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Add device
                </Button>
              }
            >
              <div className="space-y-2">
                {productFields.map((field, index) => {
                  const current = watchProducts?.[index];
                  const currentCat = current?.annexA_Category;
                  const subcatList = currentCat
                    ? IMDRF_ANNEX_A_SUBCAT_MAP[currentCat] || []
                    : [];
                  const isOpen = openProduct === index;
                  const identifiers = [
                    current?.serialNumber,
                    current?.batchNumber,
                    current?.asReportedCode1,
                  ].filter(Boolean);
                  const needsCode =
                    (current?.materialDescription || current?.serialNumber) &&
                    !current?.asReportedCode1;

                  return (
                    <div
                      key={field.id}
                      className="rounded-lg border border-border bg-background"
                    >
                      {/* Row summary */}
                      <button
                        type="button"
                        onClick={() => setOpenProduct(isOpen ? null : index)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left"
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-foreground">
                              {current?.materialDescription || current?.occurrence || `Device #${index + 1}`}
                            </span>
                            {index === 0 && (
                              <Badge variant="secondary" className="text-[11px]">
                                Primary
                              </Badge>
                            )}
                          </div>
                          <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                            {identifiers.length > 0
                              ? identifiers.join(" · ")
                              : "No identifiers yet"}
                            {needsCode && (
                              <span className="ml-2 font-sans text-amber-600 dark:text-amber-400">
                                IMDRF code missing
                              </span>
                            )}
                          </div>
                        </div>
                        {productFields.length > 1 && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeProduct(index);
                              setOpenProduct(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                removeProduct(index);
                                setOpenProduct(null);
                              }
                            }}
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Remove device"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </button>

                      {/* Row detail */}
                      {isOpen && (
                        <div className="grid grid-cols-1 gap-3 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
                          <Field label="Occurrence label">
                            <Input
                              placeholder="Primary implant"
                              {...register(`products.${index}.occurrence` as const)}
                            />
                          </Field>
                          <Field label="Model or description">
                            <Input
                              placeholder="EndoVent Ventilator V2"
                              {...register(`products.${index}.materialDescription` as const)}
                            />
                          </Field>
                          <Field label="Material number">
                            <Input
                              placeholder="MAT-94812"
                              className="font-mono"
                              {...register(`products.${index}.materialNumber` as const)}
                            />
                          </Field>
                          <Field label="Serial number">
                            <Input
                              placeholder="SN-8921-X"
                              className="font-mono"
                              {...register(`products.${index}.serialNumber` as const)}
                            />
                          </Field>
                          <Field label="Lot or batch number">
                            <Input
                              placeholder="LOT-2026-04"
                              className="font-mono"
                              {...register(`products.${index}.batchNumber` as const)}
                            />
                          </Field>
                          <Field label="UDI">
                            <Input
                              placeholder="(01)00844588003287"
                              className="font-mono"
                              {...register(`products.${index}.udi` as const)}
                            />
                          </Field>
                          <Field label="Software version">
                            <Input
                              placeholder="v3.4.1"
                              className="font-mono"
                              {...register(`products.${index}.softwareVersion` as const)}
                            />
                          </Field>
                          <Field label="IMDRF problem category">
                            <select
                              {...register(`products.${index}.annexA_Category` as const)}
                              className={selectClass}
                            >
                              <option value="">Select category</option>
                              {IMDRF_ANNEX_A_CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="IMDRF problem code">
                            <select
                              disabled={!currentCat || subcatList.length === 0}
                              {...register(`products.${index}.asReportedCode1` as const)}
                              className={selectClass}
                            >
                              <option value="">
                                {currentCat ? "Select code" : "Select a category first"}
                              </option>
                              {subcatList.map((code) => (
                                <option key={code.value} value={code.value}>
                                  {code.label}
                                </option>
                              ))}
                            </select>
                          </Field>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* ---------- Patients ---------- */}
            <SectionCard
              id="patients"
              title={`Patients · ${patientFields.length}`}
              description="Clinical impact and IMDRF health-effect coding for each patient."
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    appendPatient({
                      patientName: "",
                      patientImpact: "",
                      patientImpactDesc: "",
                      sex: "UNKNOWN",
                      age: "",
                      eventOccurred: undefined,
                      annexE_Code: "",
                      annexF_Code: "",
                    });
                    setOpenPatient(patientFields.length);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Add patient
                </Button>
              }
            >
              <div className="space-y-2">
                {patientFields.map((pt, index) => {
                  const current = watchPatients?.[index];
                  const isOpen = openPatient === index;
                  const summary = [
                    current?.age ? `${current.age} y` : null,
                    current?.sex && current.sex !== "UNKNOWN"
                      ? humanize(current.sex)
                      : null,
                    current?.annexF_Code,
                  ].filter(Boolean);

                  return (
                    <div
                      key={pt.id}
                      className="rounded-lg border border-border bg-background"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenPatient(isOpen ? null : index)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left"
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-foreground">
                            {current?.patientName || `Patient #${index + 1}`}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {current?.patientImpactDesc ||
                              (summary.length > 0 ? summary.join(" · ") : "No details yet")}
                          </div>
                        </div>
                        {patientFields.length > 1 && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              removePatient(index);
                              setOpenPatient(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                removePatient(index);
                                setOpenPatient(null);
                              }
                            }}
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Remove patient"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </button>

                      {isOpen && (
                        <div className="grid grid-cols-1 gap-3 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
                          <Field label="Patient identifier">
                            <Input
                              placeholder="PT-4019 or Anonymous"
                              {...register(`patients.${index}.patientName` as const)}
                            />
                          </Field>
                          <Field label="Date of event">
                            <Controller
                              control={control}
                              name={`patients.${index}.eventOccurred`}
                              render={({ field }) => (
                                <DatePicker
                                  value={field.value ? new Date(field.value) : null}
                                  onChange={(date) => field.onChange(date)}
                                  placeholder="Select date"
                                />
                              )}
                            />
                          </Field>
                          <Field label="Biological sex">
                            <select
                              {...register(`patients.${index}.sex` as const)}
                              className={selectClass}
                            >
                              <option value="UNKNOWN">Unknown or not reported</option>
                              <option value="MALE">Male</option>
                              <option value="FEMALE">Female</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </Field>
                          <Field label="Age (years)">
                            <Input
                              type="number"
                              placeholder="58"
                              className="font-mono"
                              {...register(`patients.${index}.age` as const)}
                            />
                          </Field>
                          <Field label="IMDRF Annex E (clinical signs)" className="sm:col-span-2">
                            <select
                              {...register(`patients.${index}.annexE_Code` as const)}
                              className={selectClass}
                            >
                              <option value="">Select Annex E code</option>
                              {IMDRF_ANNEX_E_CODES.map((eCode) => (
                                <option key={eCode.value} value={eCode.value}>
                                  {eCode.label}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="IMDRF Annex F (health impact)" className="sm:col-span-2">
                            <select
                              {...register(`patients.${index}.annexF_Code` as const)}
                              className={selectClass}
                            >
                              <option value="">Select Annex F code</option>
                              {IMDRF_ANNEX_F_CODES.map((fCode) => (
                                <option key={fCode.value} value={fCode.value}>
                                  {fCode.label}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Clinical impact narrative" className="sm:col-span-2 lg:col-span-4">
                            <Input
                              placeholder="Transient arrhythmia requiring medical intervention"
                              {...register(`patients.${index}.patientImpactDesc` as const)}
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Footer actions (duplicate of header save for long scrolls) */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href="/complaints"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel and return
              </Link>
              {/* <Button
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
              </Button> */}
            </div>
          </fieldset>
        </form>

        {/* ---------- Right context panel ---------- */}
        <aside className="space-y-4 xl:sticky xl:top-[120px] xl:self-start">
          <PanelCard title="Details">
            <dl className="divide-y divide-border text-sm">
              {[
                ["Owner", displayedOwner],
                ["Logged by", displayedLoggedBy],
                ["Region", complaint.region || "—"],
                ["Received", formatDate(complaint.dateReceived)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <dt className="shrink-0 text-xs text-muted-foreground">{k}</dt>
                  <dd className="text-right text-xs text-foreground break-words">{v}</dd>
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

          <PanelCard
            title="Sample custody"
            action={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={isLockReadOnly}
                onClick={() => setIsSampleSheetOpen(true)}
              >
                Update
              </Button>
            }
          >
            {sampleIsTerminal ? (
              <p className="text-sm text-foreground">{humanize(sampleStatus)}</p>
            ) : (
              <ol className="space-y-2">
                {SAMPLE_STEPS.map((step, i) => {
                  const state =
                    i < sampleStepIndex ? "done" : i === sampleStepIndex ? "current" : "todo";
                  return (
                    <li key={step.status} className="flex items-center gap-2.5 text-xs">
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
                        {step.status === SampleStatus.RECEIVED && sampleReceivedDate && (
                          <span className="ml-1 text-muted-foreground">
                            {formatDate(sampleReceivedDate)}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
            {sampleTracking && (
              <p className="mt-3 truncate font-mono text-xs text-muted-foreground">
                {sampleTracking}
              </p>
            )}
            {!sampleAvailable && !sampleIsTerminal && (
              <p className="mt-3 text-xs text-muted-foreground">
                Customer hasn't agreed to return the device.
              </p>
            )}
          </PanelCard>

          <PanelCard title={`Attachments · ${watchAttachments?.length ?? 0}`}>
            <Controller
              control={control}
              name="attachments"
              render={({ field }) => (
                <FileUploader attachments={field.value} onChange={field.onChange} />
              )}
            />
            {(watchAttachments?.length ?? 0) === 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Paperclip className="h-3 w-3" /> Add photos, logs, or statements.
              </p>
            )}
          </PanelCard>
        </aside>
      </div>

      {/* ---------- Sample and RMA sheet ---------- */}
      <Sheet open={isSampleSheetOpen} onOpenChange={setIsSampleSheetOpen}>
        <SheetContent className="sm:max-w-md p-0 flex flex-col gap-0 overflow-hidden">
          <form onSubmit={handleSaveSample} className="flex h-full flex-col min-h-0">
            <SheetHeader className="border-b border-border/70 bg-muted/20 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background text-foreground shadow-xs">
                  <Box className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-base font-semibold tracking-tight text-foreground">
                    Sample and RMA
                  </SheetTitle>
                  <SheetDescription className="mt-0.5 text-xs text-muted-foreground">
                    Track return authorisation, courier logistics, and lab custody for the complaint device.
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <fieldset disabled={isLockReadOnly} className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-5">
              {/* Device Return Agreement Toggle Card */}
              <div
                onClick={() => !isLockReadOnly && setSampleAvailable(!sampleAvailable)}
                className={cn(
                  "relative flex cursor-pointer select-none items-start gap-3.5 rounded-xl border p-4 transition-all duration-150",
                  sampleAvailable
                    ? "border-primary/40 bg-primary/[0.03] ring-1 ring-primary/20 shadow-xs"
                    : "border-border bg-card/60 hover:border-border/80 hover:bg-muted/30",
                  isLockReadOnly && "pointer-events-none opacity-60"
                )}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    id="sampleAvailable"
                    checked={sampleAvailable}
                    onChange={(e) => setSampleAvailable(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary focus:ring-primary"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="sampleAvailable"
                      className="text-sm font-medium text-foreground cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Device available for return
                    </label>
                    <Badge
                      variant={sampleAvailable ? "default" : "secondary"}
                      className="text-[11px] font-normal"
                    >
                      {sampleAvailable ? "Agreed" : "Pending"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    The customer agreed to return the device for lab evaluation.
                  </p>
                </div>
              </div>

              {/* Custody Status Card */}
              <div className="space-y-4 rounded-xl border border-border/80 bg-card/50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Custody & Status
                </div>

                <Field label="Sample status" htmlFor="sampleStatus" required>
                  <div className="relative">
                    <select
                      id="sampleStatus"
                      value={sampleStatus}
                      onChange={(e) => setSampleStatus(e.target.value as SampleStatus)}
                      className={cn(selectClass, "appearance-none pr-9 font-medium")}
                    >
                      <option value={SampleStatus.PENDING}>Pending return from customer</option>
                      <option value={SampleStatus.RECEIVED}>Received at evaluation facility</option>
                      <option value={SampleStatus.UNDER_EVALUATION}>Under evaluation in lab</option>
                      <option value={SampleStatus.RETURNED}>Returned to customer</option>
                      <option value={SampleStatus.DISPOSED}>Disposed / Decontaminated</option>
                      <option value={SampleStatus.NOT_AVAILABLE}>Not available</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </Field>

                <Field label="Receipt date" htmlFor="sampleReceivedDate">
                  <DatePicker
                    value={sampleReceivedDate}
                    onChange={(d) => setSampleReceivedDate(d)}
                    placeholder="Select receipt date"
                  />
                </Field>
              </div>

              {/* Logistics & Tracking Card */}
              <div className="space-y-4 rounded-xl border border-border/80 bg-card/50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Truck className="h-3.5 w-3.5 text-primary" />
                  Logistics & Tracking
                </div>

                <Field label="RMA number and courier tracking" htmlFor="sampleTracking">
                  <Input
                    id="sampleTracking"
                    placeholder="e.g. RMA-2026-0891, FedEx 7829-1928-4912"
                    value={sampleTracking}
                    onChange={(e) => setSampleTracking(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    RMA identifier, courier, tracking number, or lab bin location.
                  </p>
                </Field>
              </div>
            </fieldset>

            <SheetFooter className="mt-auto border-t border-border/80 bg-muted/20 px-6 py-4 flex flex-row items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSampleSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUpdatingSample || isLockReadOnly}
                className="gap-2"
              >
                {isUpdatingSample ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {isUpdatingSample ? "Saving…" : "Save sample details"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <CustomerReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        complaint={complaint}
        orgName={orgSlug}
      />
    </div>
  );
}