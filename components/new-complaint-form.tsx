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
  Sparkles,
  Loader2,
  Stethoscope,
  AlertOctagon,
} from "lucide-react";
import { Priority, Death } from "@prisma/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
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
import { createComplaintWithRelations } from "@/lib/actions/complaints";
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
import { formatUserName } from "@/lib/utils";

interface NewComplaintFormProps {
  orgSlug: string;
}

export function NewComplaintForm({ orgSlug }: NewComplaintFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { memberships } = useOrganization({
    memberships: {
      pageSize: 100,
      keepPreviousData: true,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ComplaintFormValues>({
    resolver: zodResolver(ComplaintFormSchema),
    defaultValues: {
      shortDescription: "",
      description: "",
      priority: Priority.MEDIUM,
      awarenessDate: new Date(),
      dateReceived: new Date(),
      death: Death.NO,
      complaintOwnerId: "",
      customerName: "",
      customerType: CUSTOMER_TYPES[0].value,
      initialReporterName: "",
      initialReporterSurname: "",
      email: "",
      address: "",
      country: "United States",
      telNumber: "",
      countryEventOccurred: "United States",
      region: REGIONS[0].value,
      attachments: [],
      products: [
        {
          occurrence: "Device #1 (Primary)",
          materialNumber: "",
          materialDescription: "",
          serialNumber: "",
          batchNumber: "",
          udi: "",
          annexA_Category: "",
          asReportedCode1: "",
          asReportedCode2: "",
          softwareVersion: "",
        },
      ],
      patients: [
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
      ],
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

  const onSubmit = async (data: ComplaintFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Filter non-empty products
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
          occurrence: p.occurrence || null,
          materialNumber: p.materialNumber || null,
          materialDescription: p.materialDescription || null,
          serialNumber: p.serialNumber || null,
          batchNumber: p.batchNumber || null,
          udi: p.udi || null,
          asReportedCode1: p.asReportedCode1 || (p.annexA_Category ? p.annexA_Category : null),
          asReportedCode2: p.asReportedCode2 || null,
          softwareVersion: p.softwareVersion || null,
        }));

      // Filter non-empty patients
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
          patientName: pt.patientName || null,
          patientImpact: pt.patientImpact || null,
          patientImpactDesc: pt.patientImpactDesc || null,
          sex: pt.sex || null,
          age: pt.age ? parseInt(pt.age, 10) : null,
          eventOccurred: pt.eventOccurred ? new Date(pt.eventOccurred) : data.awarenessDate,
          annexE_Codes: pt.annexE_Code ? [pt.annexE_Code] : [],
          annexF_Codes: pt.annexF_Code ? [pt.annexF_Code] : [],
        }));

      await createComplaintWithRelations({
        shortDescription: data.shortDescription,
        description: data.description || data.shortDescription,
        priority: data.priority,
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
        detailDescriptionNativeLanguage: null,
        complaintOwnerId: data.complaintOwnerId || undefined,
        customerResponseNeeded: true,
        investigationRequired: true,
        deviceModel: filteredProducts[0]?.materialDescription || null,
        deviceSerialNumber: filteredProducts[0]?.serialNumber || null,
        lotNumber: filteredProducts[0]?.batchNumber || null,
        isAdverseEvent: data.death === Death.YES || data.priority === Priority.CRITICAL,
        products: filteredProducts.length > 0 ? filteredProducts : undefined,
        patients: filteredPatients.length > 0 ? filteredPatients : undefined,
        attachments: data.attachments.length > 0 ? data.attachments : undefined,
      });

      toast.success("Complaint Created", { description: "The new complaint has been successfully created." });
      router.push("/complaints");
      router.refresh();
    } catch (err: any) {
      console.error("[Complaint Submission Error]", err);
      setError(err?.message || "Failed to create complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchProducts = watch("products");

  return (
    <div className="w-full flex justify-center py-6 px-4">
      {/* Centered Form Container */}
      <div className="w-full max-w-5xl space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/complaints">Complaints</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>New Complaint</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
            <span className="font-semibold block">Error creating complaint</span>
            {error}
          </div>
        )}

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border pb-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">
                  Log New Product Complaint
                </CardTitle>
                <CardDescription className="mt-1">
                  Enter post-market surveillance data with hierarchical IMDRF Annex A/E/F coding and patient metrics.
                </CardDescription>
              </div>
              <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-8 pt-6">
              {/* SECTION 1: Core Complaint Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Activity className="h-4 w-4 text-primary" />
                  <span>Complaint Core Information</span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="shortDescription">
                    Short Description / Event Title *
                  </Label>
                  <Input
                    id="shortDescription"
                    {...register("shortDescription")}
                    placeholder="e.g. Infusion pump flow rate sensor discrepancy during clinical administration"
                  />
                  {errors.shortDescription && <p className="text-destructive text-xs">{errors.shortDescription.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Attachments</Label>
                  <Controller
                    control={control}
                    name="attachments"
                    render={({ field }) => (
                      <FileUploader attachments={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="priority">Priority Classification *</Label>
                    <select
                      id="priority"
                      {...register("priority")}
                      className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="complaintOwnerId">Complaint Owner</Label>
                    <select
                      id="complaintOwnerId"
                      {...register("complaintOwnerId")}
                      className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
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
                    <Label>Awareness Date *</Label>
                    <Controller
                      control={control}
                      name="awarenessDate"
                      render={({ field }) => (
                        <DatePicker value={field.value} onChange={field.onChange} />
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Date Received *</Label>
                    <Controller
                      control={control}
                      name="dateReceived"
                      render={({ field }) => (
                        <DatePicker value={field.value} onChange={field.onChange} />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">
                    Detailed Description & Narrative *
                  </Label>
                  <Textarea
                    id="description"
                    rows={3}
                    {...register("description")}
                    placeholder="Provide exact narrative of the event, clinical context, operating environment, and initial findings..."
                  />
                  {errors.description && <p className="text-destructive text-xs">{errors.description.message}</p>}
                </div>
              </div>

              <Separator />

              {/* SECTION 2: Customer & Initial Reporter */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <User className="h-4 w-4 text-primary" />
                  <span>Customer & Reporter Information</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="customerName">Customer / Facility Name *</Label>
                    <Input
                      id="customerName"
                      {...register("customerName")}
                      placeholder="e.g. St. Jude Regional Hospital"
                    />
                    {errors.customerName && <p className="text-destructive text-xs">{errors.customerName.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="customerType">Customer Type *</Label>
                    <select
                      id="customerType"
                      {...register("customerType")}
                      className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {CUSTOMER_TYPES.map((ct) => (
                        <option key={ct.value} value={ct.value}>
                          {ct.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="initialReporterName">Reporter First Name *</Label>
                    <Input
                      id="initialReporterName"
                      {...register("initialReporterName")}
                      placeholder="e.g. Sarah"
                    />
                    {errors.initialReporterName && <p className="text-destructive text-xs">{errors.initialReporterName.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="initialReporterSurname">Reporter Surname *</Label>
                    <Input
                      id="initialReporterSurname"
                      {...register("initialReporterSurname")}
                      placeholder="e.g. Jenkins"
                    />
                    {errors.initialReporterSurname && <p className="text-destructive text-xs">{errors.initialReporterSurname.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Reporter Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="sarah.jenkins@stjude.org"
                    />
                    {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...register("address")}
                      placeholder="700 Care Way, Suite 400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="country">Customer Country *</Label>
                    <select
                      id="country"
                      {...register("country")}
                      className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="countryEventOccurred">
                      Country Event Occurred *
                    </Label>
                    <select
                      id="countryEventOccurred"
                      {...register("countryEventOccurred")}
                      className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="region">Regulatory Region *</Label>
                    <select
                      id="region"
                      {...register("region")}
                      className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
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

              {/* SECTION 3: Dynamic Multiple Product / Device Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Package className="h-4 w-4 text-primary" />
                    <span>Product & Device Information ({productFields.length})</span>
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
                    className="gap-1 text-primary hover:text-primary font-semibold"
                  >
                    <Plus className="h-3 w-3" /> Add Another Device
                  </Button>
                </div>

                <div className="space-y-4">
                  {productFields.map((field, idx) => {
                    const currentAnnexACategory = watchProducts?.[idx]?.annexA_Category;
                    const subCodes = currentAnnexACategory
                      ? IMDRF_ANNEX_A_SUBCAT_MAP[currentAnnexACategory] || []
                      : [];

                    return (
                      <div
                        key={field.id}
                        className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 relative group"
                      >
                        <div className="flex items-center justify-between pb-1 border-b border-border/60">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] font-semibold">
                              Device #{idx + 1}
                            </Badge>
                          </div>
                          {productFields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => removeProduct(idx)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove device"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        {/* Identification Fields */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="space-y-1">
                            <Label className="text-[11px]">Material Number / Model</Label>
                            <Input
                              {...register(`products.${idx}.materialNumber` as const)}
                              placeholder="e.g. MAT-9021"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px]">Material Description</Label>
                            <Input
                              {...register(`products.${idx}.materialDescription` as const)}
                              placeholder="e.g. CardiaSense Monitor Pro"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px]">Serial Number</Label>
                            <Input
                              {...register(`products.${idx}.serialNumber` as const)}
                              placeholder="e.g. SN-49202"
                            />
                          </div>
                        </div>

                        {/* Two-Tier IMDRF Annex A Problem Coding */}
                        <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3.5 space-y-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                            <AlertOctagon className="h-4 w-4 shrink-0" />
                            <span>IMDRF Annex A - Device Problem (Two-Tier Classification)</span>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-foreground flex items-center h-5">
                                1. Annex A Category (A01, A02, A03...) *
                              </Label>
                              <select
                                {...register(`products.${idx}.annexA_Category` as const)}
                                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-xs shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
                              >
                                <option value="">Select Category (A01 - A15)...</option>
                                {IMDRF_ANNEX_A_CATEGORIES.map((cat) => (
                                  <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-foreground flex items-center h-5">
                                2. Specific Problem Code *
                              </Label>
                              <select
                                {...register(`products.${idx}.asReportedCode1` as const)}
                                disabled={!currentAnnexACategory}
                                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-xs shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {!currentAnnexACategory ? (
                                  <option value="">← Select Level 1 Category first</option>
                                ) : (
                                  <>
                                    <option value="">Select specific code...</option>
                                    {subCodes.map((code) => (
                                      <option key={code.value} value={code.value}>
                                        {code.label}
                                      </option>
                                    ))}
                                  </>
                                )}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Batch, Software Version & UDI */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="space-y-1">
                            <Label className="text-[11px]">Batch / Lot Number</Label>
                            <Input
                              {...register(`products.${idx}.batchNumber` as const)}
                              placeholder="e.g. BATCH-2026-08"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px]">Software Version</Label>
                            <Input
                              {...register(`products.${idx}.softwareVersion` as const)}
                              placeholder="e.g. v3.4.1"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px]">UDI (Unique Device Identifier)</Label>
                            <Input
                              {...register(`products.${idx}.udi` as const)}
                              placeholder="e.g. (01)00844588003287"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* SECTION 4: Dynamic Multiple Patient Information (IMDRF Annex E & F) */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <HeartPulse className="h-4 w-4 text-primary" />
                    <span>Patient Information & Health Impact ({patientFields.length})</span>
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
                    className="gap-1 text-primary hover:text-primary font-semibold"
                  >
                    <Plus className="h-3 w-3" /> Add Another Patient
                  </Button>
                </div>

                <div className="space-y-4">
                  {patientFields.map((patient, idx) => (
                    <div
                      key={patient.id}
                      className="rounded-lg border border-border bg-muted/20 p-4 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] font-semibold">
                            Patient #{idx + 1}
                          </Badge>
                        </div>
                        {patientFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => removePatient(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Remove patient"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Patient Death? *</Label>
                          <select
                            {...register("death")}
                            className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
                          >
                            <option value="NO">NO - No Patient Death</option>
                            <option value="YES">YES - Patient Death Reported</option>
                            <option value="UNKNOWN">UNKNOWN</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">Patient Name / Identifier</Label>
                          <Input
                            {...register(`patients.${idx}.patientName` as const)}
                            placeholder="e.g. PT-8820"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">Date of Event</Label>
                          <Controller
                            control={control}
                            name={`patients.${idx}.eventOccurred`}
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
                          <Label className="text-[11px]">Patient Age (Years)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="120"
                            {...register(`patients.${idx}.age` as const)}
                            placeholder="e.g. 54"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">Sex</Label>
                          <select
                            {...register(`patients.${idx}.sex` as const)}
                            className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
                          >
                            <option value="UNKNOWN">Unknown / Not Specified</option>
                            <option value="FEMALE">Female</option>
                            <option value="MALE">Male</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Patient Impact / Outcome</Label>
                          <Input
                            {...register(`patients.${idx}.patientImpact` as const)}
                            placeholder="e.g. Temporary Discomfort / None"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] flex items-center gap-1">
                            <Stethoscope className="h-3 w-3 text-blue-500" />
                            IMDRF Annex E (Clinical Signs)
                          </Label>
                          <select
                            {...register(`patients.${idx}.annexE_Code` as const)}
                            className="border-input flex h-9 w-full rounded-md border bg-transparent px-2.5 py-1 text-xs shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
                          >
                            <option value="">Select Annex E Clinical Sign...</option>
                            {IMDRF_ANNEX_E_CODES.map((code) => (
                              <option key={code.value} value={code.value}>
                                {code.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] flex items-center gap-1">
                            <HeartPulse className="h-3 w-3 text-rose-500" />
                            IMDRF Annex F (Health Impact)
                          </Label>
                          <select
                            {...register(`patients.${idx}.annexF_Code` as const)}
                            className="border-input flex h-9 w-full rounded-md border bg-transparent px-2.5 py-1 text-xs shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
                          >
                            <option value="">Select Annex F Health Impact...</option>
                            {IMDRF_ANNEX_F_CODES.map((code) => (
                              <option key={code.value} value={code.value}>
                                {code.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 border-t border-border pt-4 pb-0">
              <Link
                href="/complaints"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Cancel
              </Link>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Creating Record...
                  </>
                ) : (
                  "Create Complaint"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
