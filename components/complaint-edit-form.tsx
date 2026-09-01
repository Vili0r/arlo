"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Package,
  HeartPulse,
  Activity,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle,
  AlertOctagon,
  Globe,
  Box,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
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
import { ComplaintFormSchema, type ComplaintFormValues } from "@/lib/validations/complaint";
import { StatusTransitionTracker } from "@/components/status-transition-tracker";
import { formatUserName } from "@/lib/utils";

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
    complaintOwner?: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
    createdBy?: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
}

export function ComplaintEditForm({
  orgSlug,
  complaint,
}: ComplaintEditFormProps) {
  const router = useRouter();
  const { isReadOnly: isLockReadOnly } = useRecordLock({
    entityType: LockEntityType.Complaint,
    recordId: complaint.id,
  });

  const [activeTab, setActiveTab] = React.useState("intake");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { memberships } = useOrganization({
    memberships: {
      pageSize: 100,
      keepPreviousData: true,
    },
  });

  // Setup Default Products
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

  // Setup Default Patients
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
      attachments: complaint.attachments?.map((a) => ({
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
  } = useFieldArray({
    control,
    name: "products",
  });

  const {
    fields: patientFields,
    append: appendPatient,
    remove: removePatient,
  } = useFieldArray({
    control,
    name: "patients",
  });

  // Sample Management State
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
            p.asReportedCode1 ||
            (p.annexA_Category ? p.annexA_Category : null),
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
          eventOccurred: pt.eventOccurred ? new Date(pt.eventOccurred) : data.awarenessDate,
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
        isAdverseEvent: data.death === Death.YES || data.priority === Priority.CRITICAL,
        products: filteredProducts,
        patients: filteredPatients,
        newAttachments: data.attachments.filter(
          (a) => !complaint.attachments?.some((ea) => ea.fileUrl === a.fileUrl)
        ),
      });

      toast.success("Success", { description: "Complaint details updated successfully." });
      router.refresh();
    } catch (err: any) {
      console.error("[Complaint Update Error]", err);
      setError(err?.message || "Failed to update complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Sample Management Handler
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
      toast.success("Success", { description: "Sample & RMA management updated successfully." });
      router.refresh();
    } catch (err: any) {
      console.error("[Sample Update Error]", err);
      setError(err?.message || "Failed to update sample management.");
    } finally {
      setIsUpdatingSample(false);
    }
  };

  const watchProducts = watch("products");

  return (
    <div className="w-full flex justify-center py-6 px-4">
      {/* Centered Container */}
      <div className="w-full max-w-6xl space-y-6">
        {/* Navigation & Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/complaints">Complaints</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{complaint.complaintNumber}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <StatusTransitionTracker
              entityType="Complaint"
              entityId={complaint.id}
              currentStatus={complaint.status}
              disabled={isLockReadOnly}
              onStatusChanged={() => {
                router.refresh();
              }}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
            <span className="font-semibold block">Error</span>
            {error}
          </div>
        )}

        {/* Shadcn Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full sm:w-auto flex flex-wrap h-auto p-1 bg-muted/50 gap-1 rounded-lg">
            <TabsTrigger value="intake" className="gap-2 text-xs py-2">
              <Activity className="h-4 w-4" /> Intake &amp; Overview
            </TabsTrigger>
            <TabsTrigger value="sample" className="gap-2 text-xs py-2">
              <Box className="h-4 w-4" /> Sample &amp; RMA
            </TabsTrigger>
          </TabsList>
          <div className="mt-6 bg-card border border-border rounded-xl p-6">
          {/* TAB 1: Intake & Overview Form */}
          <TabsContent value="intake" className="mt-0 outline-none">
            <div className="border-b border-border pb-5 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Complaint Details &amp; Intake Form
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    View and update post-market surveillance data, customer details, device metrics, and IMDRF coding.
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-1 text-[11px] text-muted-foreground">
                  <span>
                    Owner:{" "}
                    <strong className="text-foreground">
                      {formatUserName(complaint.complaintOwner, "Unassigned")}
                    </strong>
                  </span>
                  <span>
                    Logged by:{" "}
                    <strong className="text-foreground">
                      {formatUserName(complaint.createdBy, "System")}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <fieldset disabled={isLockReadOnly} className="contents space-y-8">
                <div className="space-y-8">
                {/* SECTION 1: Core Complaint Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Activity className="h-4 w-4 text-primary" />
                      <span>Complaint Core Information</span>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="shortDescription" className="text-xs">
                        Short Description / Title{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="shortDescription"
                        placeholder="Brief summary of the issue..."
                        {...register("shortDescription")}
                        className="text-xs h-9"
                      />
                      {errors.shortDescription && (
                        <p className="text-destructive text-xs">{errors.shortDescription.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="description" className="text-xs">
                        Detailed Event Narrative / Description
                      </Label>
                      <Textarea
                        id="description"
                        rows={4}
                        placeholder="Provide a comprehensive narrative of the incident..."
                        {...register("description")}
                        className="text-xs leading-relaxed"
                      />
                      {errors.description && (
                        <p className="text-destructive text-xs">{errors.description.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs">Attachments</Label>
                      <Controller
                        control={control}
                        name="attachments"
                        render={({ field }) => (
                          <FileUploader attachments={field.value} onChange={field.onChange} />
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="priority" className="text-xs">
                          Priority / Severity <span className="text-destructive">*</span>
                        </Label>
                        <select
                          id="priority"
                          {...register("priority")}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value={Priority.LOW}>Low</option>
                          <option value={Priority.MEDIUM}>Medium</option>
                          <option value={Priority.HIGH}>High</option>
                          <option value={Priority.CRITICAL}>Critical</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="complaintOwnerId" className="text-xs">
                          Complaint Owner
                        </Label>
                        <select
                          id="complaintOwnerId"
                          {...register("complaintOwnerId")}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Awareness Date <span className="text-destructive">*</span>
                        </Label>
                        <Controller
                          control={control}
                          name="awarenessDate"
                          render={({ field }) => (
                            <DatePicker
                              value={field.value}
                              onChange={(d) => d && field.onChange(d)}
                              placeholder="Select awareness date"
                            />
                          )}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Date Received <span className="text-destructive">*</span>
                        </Label>
                        <Controller
                          control={control}
                          name="dateReceived"
                          render={({ field }) => (
                            <DatePicker
                              value={field.value}
                              onChange={(d) => d && field.onChange(d)}
                              placeholder="Select received date"
                            />
                          )}
                        />
                      </div>
                    </div>

                    {/* Patient Death / Serious Injury Alert Radio Group */}
                    <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <AlertOctagon className="h-4 w-4 text-amber-500" />
                        <span>Did the incident involve Patient Death or Serious Injury?</span>
                      </div>
                      <div className="flex items-center gap-6 pt-1">
                        {[
                          { label: "No (Standard Incident)", value: Death.NO },
                          { label: "Yes (Adverse Event / Death)", value: Death.YES },
                          { label: "Unknown / Under Evaluation", value: Death.UNKNOWN },
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className="flex items-center gap-2 text-xs cursor-pointer select-none"
                          >
                            <input
                              type="radio"
                              value={opt.value}
                              {...register("death")}
                              className="h-3.5 w-3.5 text-primary border-border focus:ring-ring"
                            />
                            <span className="text-foreground">
                              {opt.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* SECTION 2: Customer & Initial Reporter Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <User className="h-4 w-4 text-primary" />
                      <span>Customer &amp; Initial Reporter Information</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="customerName" className="text-xs">
                          Customer / Hospital / Clinic Name{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="customerName"
                          placeholder="e.g. St. Jude Regional Hospital"
                          {...register("customerName")}
                          className="text-xs h-9"
                        />
                        {errors.customerName && (
                          <p className="text-destructive text-xs">{errors.customerName.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="customerType" className="text-xs">
                          Customer Facility Type <span className="text-destructive">*</span>
                        </Label>
                        <select
                          id="customerType"
                          {...register("customerType")}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {CUSTOMER_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="initialReporterName" className="text-xs">
                          Reporter First Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="initialReporterName"
                          placeholder="e.g. Dr. Sarah"
                          {...register("initialReporterName")}
                          className="text-xs h-9"
                        />
                        {errors.initialReporterName && (
                          <p className="text-destructive text-xs">{errors.initialReporterName.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="initialReporterSurname" className="text-xs">
                          Reporter Surname <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="initialReporterSurname"
                          placeholder="e.g. Jenkins"
                          {...register("initialReporterSurname")}
                          className="text-xs h-9"
                        />
                        {errors.initialReporterSurname && (
                          <p className="text-destructive text-xs">{errors.initialReporterSurname.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs">
                          Reporter Email Address <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="s.jenkins@hospital.org"
                          {...register("email")}
                          className="text-xs h-9"
                        />
                        {errors.email && (
                          <p className="text-destructive text-xs">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="telNumber" className="text-xs">
                          Reporter Contact Phone
                        </Label>
                        <Input
                          id="telNumber"
                          placeholder="+1 (555) 019-2834"
                          {...register("telNumber")}
                          className="text-xs h-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-xs">
                        Customer Physical Address
                      </Label>
                      <Input
                        id="address"
                        placeholder="100 Medical Center Blvd, Suite 400"
                        {...register("address")}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* SECTION 3: Geographic & Location Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Globe className="h-4 w-4 text-primary" />
                      <span>Geographic &amp; Location Information</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="country" className="text-xs">
                          Reporter Country <span className="text-destructive">*</span>
                        </Label>
                        <select
                          id="country"
                          {...register("country")}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="countryEventOccurred" className="text-xs">
                          Country Event Occurred <span className="text-destructive">*</span>
                        </Label>
                        <select
                          id="countryEventOccurred"
                          {...register("countryEventOccurred")}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="region" className="text-xs">
                          Regulatory Region <span className="text-destructive">*</span>
                        </Label>
                        <select
                          id="region"
                          {...register("region")}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          {REGIONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* SECTION 4: Product / Medical Device Information (1:N) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Package className="h-4 w-4 text-primary" />
                        <span>Medical Devices ({productFields.length})</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => appendProduct({
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
                        })}
                        className="gap-1 text-xs"
                      >
                        <Plus className="h-3 w-3" /> Add Device
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {productFields.map((field, index) => {
                        const currentCat = watchProducts?.[index]?.annexA_Category;
                        const subcatList = currentCat
                          ? IMDRF_ANNEX_A_SUBCAT_MAP[currentCat] || []
                          : [];

                        return (
                          <div
                            key={field.id}
                            className="rounded-lg border border-border bg-card p-4 space-y-4 relative"
                          >
                            <div className="flex items-center justify-between border-b border-border pb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] font-mono">
                                  #{index + 1}
                                </Badge>
                              </div>
                              {productFields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => removeProduct(index)}
                                  className="text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                              <div className="space-y-1">
                                <Label className="text-[11px]">Occurrence Label</Label>
                                <Input
                                  placeholder="e.g. Primary Implant"
                                  {...register(`products.${index}.occurrence` as const)}
                                  className="text-xs h-8"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[11px]">Model / Description</Label>
                                <Input
                                  placeholder="e.g. EndoVent Ventilator V2"
                                  {...register(`products.${index}.materialDescription` as const)}
                                  className="text-xs h-8"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[11px]">Material Number</Label>
                                <Input
                                  placeholder="e.g. MAT-94812"
                                  {...register(`products.${index}.materialNumber` as const)}
                                  className="text-xs h-8 font-mono"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[11px]">Serial Number</Label>
                                <Input
                                  placeholder="e.g. SN-8921-X"
                                  {...register(`products.${index}.serialNumber` as const)}
                                  className="text-xs h-8 font-mono"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[11px]">Lot / Batch Number</Label>
                                <Input
                                  placeholder="e.g. LOT-2026-04"
                                  {...register(`products.${index}.batchNumber` as const)}
                                  className="text-xs h-8 font-mono"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[11px]">UDI (Unique Device Identifier)</Label>
                                <Input
                                  placeholder="e.g. (01)00844588003287"
                                  {...register(`products.${index}.udi` as const)}
                                  className="text-xs h-8 font-mono"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-[11px]">Software Version</Label>
                                <Input
                                  placeholder="e.g. v3.4.1"
                                  {...register(`products.${index}.softwareVersion` as const)}
                                  className="text-xs h-8 font-mono"
                                />
                              </div>

                              {/* IMDRF Annex A Level 1 */}
                              <div className="space-y-1">
                                <Label className="text-[11px]">IMDRF Problem Category</Label>
                                <select
                                  {...register(`products.${index}.annexA_Category` as const)}
                                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                  <option value="">-- Select Category --</option>
                                  {IMDRF_ANNEX_A_CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* IMDRF Annex A Level 2 */}
                              <div className="space-y-1">
                                <Label className="text-[11px]">IMDRF Problem Code</Label>
                                <select
                                  disabled={!currentCat || subcatList.length === 0}
                                  {...register(`products.${index}.asReportedCode1` as const)}
                                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                                >
                                  <option value="">
                                    {currentCat ? "-- Select Specific Code --" : "-- Select Category First --"}
                                  </option>
                                  {subcatList.map((code) => (
                                    <option key={code.value} value={code.value}>
                                      {code.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* SECTION 5: Patient Impact & Health Effects (1:N) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <HeartPulse className="h-4 w-4 text-primary" />
                        <span>Patient Impact &amp; Clinical Health Effects ({patientFields.length})</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => appendPatient({
                          patientName: "",
                          patientImpact: "",
                          patientImpactDesc: "",
                          sex: "UNKNOWN",
                          age: "",
                          eventOccurred: undefined,
                          annexE_Code: "",
                          annexF_Code: "",
                        })}
                        className="gap-1 text-xs"
                      >
                        <Plus className="h-3 w-3" /> Add Patient
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {patientFields.map((pt, index) => (
                        <div
                          key={pt.id}
                          className="rounded-lg border border-border bg-card p-4 space-y-4"
                        >
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] font-mono">
                                Patient #{index + 1}
                              </Badge>
                            </div>
                            {patientFields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() => removePatient(index)}
                                className="text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                            <div className="space-y-1">
                              <Label className="text-[11px]">Patient Identifier / Name</Label>
                              <Input
                                placeholder="e.g. PT-4019 or Anonymous"
                                {...register(`patients.${index}.patientName` as const)}
                                className="text-xs h-8"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[11px]">Date of Event</Label>
                              <Controller
                                control={control}
                                name={`patients.${index}.eventOccurred`}
                                render={({ field }) => (
                                  <DatePicker
                                    value={field.value ? new Date(field.value) : null}
                                    onChange={(date) => field.onChange(date)}
                                    placeholder="Pick event date"
                                  />
                                )}
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[11px]">Biological Sex</Label>
                              <select
                                {...register(`patients.${index}.sex` as const)}
                                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                              >
                                <option value="UNKNOWN">Unknown / Not Reported</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[11px]">Age (Years)</Label>
                              <Input
                                type="number"
                                placeholder="e.g. 58"
                                {...register(`patients.${index}.age` as const)}
                                className="text-xs h-8 font-mono"
                              />
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                              <Label className="text-[11px]">IMDRF Annex E (Clinical Signs)</Label>
                              <select
                                {...register(`patients.${index}.annexE_Code` as const)}
                                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                              >
                                <option value="">-- Select Annex E Code --</option>
                                {IMDRF_ANNEX_E_CODES.map((eCode) => (
                                  <option key={eCode.value} value={eCode.value}>
                                    {eCode.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                              <Label className="text-[11px]">IMDRF Annex F (Health Impact)</Label>
                              <select
                                {...register(`patients.${index}.annexF_Code` as const)}
                                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                              >
                                <option value="">-- Select Annex F Code --</option>
                                {IMDRF_ANNEX_F_CODES.map((fCode) => (
                                  <option key={fCode.value} value={fCode.value}>
                                    {fCode.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1 sm:col-span-4">
                              <Label className="text-[11px]">Clinical Impact Narrative</Label>
                              <Input
                                placeholder="e.g. Transient arrhythmia requiring medical intervention"
                                {...register(`patients.${index}.patientImpactDesc` as const)}
                                className="text-xs h-8"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border mt-5 pt-5 flex items-center justify-between">
                  <Link
                    href="/complaints"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel &amp; Return
                  </Link>
                  <div className="flex items-center gap-3">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting || isLockReadOnly}
                      className="gap-2 text-xs font-semibold"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </fieldset>
            </form>
          </TabsContent>

          {/* TAB 2: Sample & RMA Management */}
          <TabsContent value="sample" className="mt-0 outline-none">
            <div className="border-b border-border pb-5 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Box className="h-5 w-5 text-amber-500" />
                    <span>Physical Sample &amp; RMA Management</span>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track the return authorization, courier logistics, lab custody, and decontamination status of the complaint device.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSample}>
              <fieldset disabled={isLockReadOnly} className="contents space-y-6">
                <div className="space-y-6">
                {/* Sample Availability Toggle */}
                  <div className="rounded-lg border border-border p-4 bg-muted/20 space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sampleAvailable}
                        onChange={(e) => setSampleAvailable(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-ring mt-0.5"
                      />
                      <div>
                        <span className="text-xs font-semibold text-foreground block">
                          Physical Device Sample Available for Return
                        </span>
                        <span className="text-[11px] text-muted-foreground block leading-relaxed">
                          Check this if the customer or hospital agreed to return the physical medical device for lab evaluation and root-cause analysis.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="sampleStatus" className="text-xs">
                        Physical Sample Status *
                      </Label>
                      <select
                        id="sampleStatus"
                        value={sampleStatus}
                        onChange={(e) => setSampleStatus(e.target.value as SampleStatus)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value={SampleStatus.PENDING}>Pending Return from Customer</option>
                        <option value={SampleStatus.RECEIVED}>Received at Evaluation Facility</option>
                        <option value={SampleStatus.UNDER_EVALUATION}>Under Evaluation / Lab Analysis</option>
                        <option value={SampleStatus.RETURNED}>Returned to Customer</option>
                        <option value={SampleStatus.DISPOSED}>Disposed / Biohazard Scrapped</option>
                        <option value={SampleStatus.NOT_AVAILABLE}>Not Available / Destroyed at Site</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Sample Receipt Date</Label>
                      <DatePicker
                        value={sampleReceivedDate}
                        onChange={(d) => setSampleReceivedDate(d)}
                        placeholder="Select receipt date"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sampleTracking" className="text-xs">
                      RMA Number &amp; Courier Tracking Details
                    </Label>
                    <Input
                      id="sampleTracking"
                      placeholder="e.g. RMA-2026-0891 (FedEx Tracking # 7829-1928-4912)"
                      value={sampleTracking}
                      onChange={(e) => setSampleTracking(e.target.value)}
                      className="text-xs h-9 font-mono"
                    />
                    <span className="text-[10px] text-muted-foreground block">
                      Include return merchandise authorization (RMA) identifier, courier service, tracking numbers, or lab bin location.
                    </span>
                  </div>
                </div>
                <div className="border-t border-border mt-5 pt-5 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isUpdatingSample || isLockReadOnly}
                    className="gap-2 text-xs font-semibold"
                  >
                    {isUpdatingSample ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Updating Sample Status...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Sample Details</span>
                      </>
                    )}
                  </Button>
                </div>
              </fieldset>
            </form>
          </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
