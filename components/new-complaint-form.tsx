"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
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

interface ProductEntry {
  id: string;
  occurrence: string;
  materialNumber: string;
  materialDescription: string;
  serialNumber: string;
  batchNumber: string;
  annexA_Category: string; // e.g. "A01", "A02", etc.
  asReportedCode1: string; // e.g. "A0101", "A0102", etc.
  asReportedCode2: string;
  softwareVersion: string;
}

interface PatientEntry {
  id: string;
  patientName: string;
  patientImpact: string;
  patientImpactDesc: string;
  sex: string;
  age: string;
  annexE_Code: string;
  annexF_Code: string;
}

interface NewComplaintFormProps {
  orgSlug: string;
}

export function NewComplaintForm({ orgSlug }: NewComplaintFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Core Form State
  const [shortDescription, setShortDescription] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>(Priority.MEDIUM);
  const [awarenessDate, setAwarenessDate] = React.useState<Date>(new Date());
  const [dateReceived, setDateReceived] = React.useState<Date>(new Date());
  const [death, setDeath] = React.useState<Death>(Death.NO);

  // Customer & Reporter State
  const [customerName, setCustomerName] = React.useState("");
  const [customerType, setCustomerType] = React.useState(
    CUSTOMER_TYPES[0].value
  );
  const [initialReporterName, setInitialReporterName] = React.useState("");
  const [initialReporterSurname, setInitialReporterSurname] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [country, setCountry] = React.useState("United States");
  const [telNumber, setTelNumber] = React.useState("");
  const [countryEventOccurred, setCountryEventOccurred] = React.useState(
    "United States"
  );
  const [region, setRegion] = React.useState(REGIONS[0].value);

  // Dynamic Multiple Products State
  const [products, setProducts] = React.useState<ProductEntry[]>([
    {
      id: crypto.randomUUID(),
      occurrence: "Device #1 (Primary)",
      materialNumber: "",
      materialDescription: "",
      serialNumber: "",
      batchNumber: "",
      annexA_Category: "",
      asReportedCode1: "",
      asReportedCode2: "",
      softwareVersion: "",
    },
  ]);

  // Dynamic Multiple Patients State
  const [patients, setPatients] = React.useState<PatientEntry[]>([
    {
      id: crypto.randomUUID(),
      patientName: "",
      patientImpact: "",
      patientImpactDesc: "",
      sex: "UNKNOWN",
      age: "",
      annexE_Code: "",
      annexF_Code: "",
    },
  ]);

  // Product Actions
  const handleAddProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        occurrence: `Device #${prev.length + 1}`,
        materialNumber: "",
        materialDescription: "",
        serialNumber: "",
        batchNumber: "",
        annexA_Category: "",
        asReportedCode1: "",
        asReportedCode2: "",
        softwareVersion: "",
      },
    ]);
  };

  const handleRemoveProduct = (id: string) => {
    if (products.length === 1) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateProduct = (
    id: string,
    field: keyof ProductEntry,
    value: string
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        // If changing Level 1 category, reset Level 2 specific code
        if (field === "annexA_Category") {
          return { ...p, annexA_Category: value, asReportedCode1: "" };
        }
        return { ...p, [field]: value };
      })
    );
  };

  // Patient Actions
  const handleAddPatient = () => {
    setPatients((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        patientName: "",
        patientImpact: "",
        patientImpactDesc: "",
        sex: "UNKNOWN",
        age: "",
        annexE_Code: "",
        annexF_Code: "",
      },
    ]);
  };

  const handleRemovePatient = (id: string) => {
    if (patients.length === 1) return;
    setPatients((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePatient = (
    id: string,
    field: keyof PatientEntry,
    value: string
  ) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Filter non-empty products
      const filteredProducts = products
        .filter(
          (p) =>
            p.materialNumber ||
            p.materialDescription ||
            p.serialNumber ||
            p.batchNumber ||
            p.asReportedCode1 ||
            p.annexA_Category
        )
        .map((p) => ({
          occurrence: p.occurrence || null,
          materialNumber: p.materialNumber || null,
          materialDescription: p.materialDescription || null,
          serialNumber: p.serialNumber || null,
          batchNumber: p.batchNumber || null,
          asReportedCode1: p.asReportedCode1 || (p.annexA_Category ? p.annexA_Category : null),
          asReportedCode2: p.asReportedCode2 || null,
          softwareVersion: p.softwareVersion || null,
        }));

      // Filter non-empty patients
      const filteredPatients = patients
        .filter(
          (pt) =>
            pt.patientName ||
            pt.patientImpact ||
            pt.patientImpactDesc ||
            pt.age ||
            pt.annexE_Code ||
            pt.annexF_Code
        )
        .map((pt) => ({
          patientName: pt.patientName || null,
          patientImpact: pt.patientImpact || null,
          patientImpactDesc: pt.patientImpactDesc || null,
          sex: pt.sex || null,
          age: pt.age ? parseInt(pt.age, 10) : null,
          eventOccurred: awarenessDate,
          annexE_Codes: pt.annexE_Code ? [pt.annexE_Code] : [],
          annexF_Codes: pt.annexF_Code ? [pt.annexF_Code] : [],
        }));

      await createComplaintWithRelations({
        shortDescription,
        description: description || shortDescription,
        priority,
        awarenessDate,
        dateReceived,
        customerName,
        customerType,
        initialReporterName,
        initialReporterSurname,
        email,
        address: address || "N/A",
        country,
        telNumber: telNumber || "N/A",
        countryEventOccurred,
        region,
        death,
        customerResponseNeeded: true,
        followUpRequired: true,
        investigationRequired: true,
        deviceModel: filteredProducts[0]?.materialDescription || null,
        deviceSerialNumber: filteredProducts[0]?.serialNumber || null,
        lotNumber: filteredProducts[0]?.batchNumber || null,
        isAdverseEvent: death === Death.YES || priority === Priority.CRITICAL,
        products: filteredProducts.length > 0 ? filteredProducts : undefined,
        patients: filteredPatients.length > 0 ? filteredPatients : undefined,
      });

      router.push("/complaints");
      router.refresh();
    } catch (err: any) {
      console.error("[Complaint Submission Error]", err);
      setError(err?.message || "Failed to create complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex justify-center py-6 px-4">
      {/* Centered Form Container */}
      <div className="w-full max-w-4xl space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link
            href="/complaints"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Complaints
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-mono">
              21 CFR Part 11
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              {orgSlug}
            </Badge>
          </div>
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

          <form onSubmit={handleSubmit}>
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
                    required
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="e.g. Infusion pump flow rate sensor discrepancy during clinical administration"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="priority">Priority Classification *</Label>
                    <select
                      id="priority"
                      required
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                      className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <option value="CRITICAL">
                        CRITICAL (Patient Safety Risk / Death)
                      </option>
                      <option value="HIGH">
                        HIGH (Device Malfunction / Severe Impact)
                      </option>
                      <option value="MEDIUM">
                        MEDIUM (Non-critical Performance Discrepancy)
                      </option>
                      <option value="LOW">
                        LOW (Cosmetic / Packaging / Inconvenience)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="awarenessDate">Awareness Date *</Label>
                    <DatePicker
                      id="awarenessDate"
                      value={awarenessDate}
                      onChange={(date) => setAwarenessDate(date)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dateReceived">Date Received / Logged *</Label>
                    <DatePicker
                      id="dateReceived"
                      value={dateReceived}
                      onChange={(date) => setDateReceived(date)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">
                    Detailed Description & Narrative *
                  </Label>
                  <Textarea
                    id="description"
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide exact narrative of the event, clinical context, operating environment, and initial findings..."
                  />
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
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. St. Jude Regional Hospital"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="customerType">Customer Type *</Label>
                    <select
                      id="customerType"
                      required
                      value={customerType}
                      onChange={(e) => setCustomerType(e.target.value)}
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
                      required
                      value={initialReporterName}
                      onChange={(e) => setInitialReporterName(e.target.value)}
                      placeholder="e.g. Sarah"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="initialReporterSurname">Reporter Surname *</Label>
                    <Input
                      id="initialReporterSurname"
                      required
                      value={initialReporterSurname}
                      onChange={(e) => setInitialReporterSurname(e.target.value)}
                      placeholder="e.g. Jenkins"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Reporter Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sarah.jenkins@stjude.org"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="700 Care Way, Suite 400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="country">Customer Country *</Label>
                    <select
                      id="country"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
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
                      required
                      value={countryEventOccurred}
                      onChange={(e) => setCountryEventOccurred(e.target.value)}
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
                      required
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
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

              {/* SECTION 3: Dynamic Multiple Product / Device Information (Two-Tier IMDRF Annex A) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Package className="h-4 w-4 text-primary" />
                    <span>Product & Device Information ({products.length})</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleAddProduct}
                    className="gap-1 text-primary hover:text-primary font-semibold"
                  >
                    <Plus className="h-3 w-3" /> Add Another Device
                  </Button>
                </div>

                <div className="space-y-4">
                  {products.map((product, idx) => {
                    const subCodes = product.annexA_Category
                      ? IMDRF_ANNEX_A_SUBCAT_MAP[product.annexA_Category] || []
                      : [];

                    return (
                      <div
                        key={product.id}
                        className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 relative group"
                      >
                        <div className="flex items-center justify-between pb-1 border-b border-border/60">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] font-semibold">
                              Device #{idx + 1}
                            </Badge>
                            <span className="text-xs font-medium text-foreground">
                              {product.materialDescription || "Medical Device Record"}
                            </span>
                          </div>
                          {products.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleRemoveProduct(product.id)}
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
                              value={product.materialNumber}
                              onChange={(e) =>
                                handleUpdateProduct(
                                  product.id,
                                  "materialNumber",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. MAT-9021"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px]">Material Description</Label>
                            <Input
                              value={product.materialDescription}
                              onChange={(e) =>
                                handleUpdateProduct(
                                  product.id,
                                  "materialDescription",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. CardiaSense Monitor Pro"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px]">Serial Number</Label>
                            <Input
                              value={product.serialNumber}
                              onChange={(e) =>
                                handleUpdateProduct(
                                  product.id,
                                  "serialNumber",
                                  e.target.value
                                )
                              }
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
                            {/* Step 1: Category Selection (A01, A02, A03...) */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-foreground flex items-center h-5">
                                1. Annex A Category (A01, A02, A03...) *
                              </Label>
                              <select
                                value={product.annexA_Category}
                                onChange={(e) =>
                                  handleUpdateProduct(
                                    product.id,
                                    "annexA_Category",
                                    e.target.value
                                  )
                                }
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

                            {/* Step 2: Specific Sub-Code Selection (A0101, A0102...) */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-foreground flex items-center h-5">
                                2. Specific Problem Code ({product.annexA_Category || "Axx"}...) *
                              </Label>
                              <select
                                value={product.asReportedCode1}
                                disabled={!product.annexA_Category}
                                onChange={(e) =>
                                  handleUpdateProduct(
                                    product.id,
                                    "asReportedCode1",
                                    e.target.value
                                  )
                                }
                                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-xs shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {!product.annexA_Category ? (
                                  <option value="">← Select Level 1 Category first</option>
                                ) : (
                                  <>
                                    <option value="">
                                      Select specific {product.annexA_Category} code...
                                    </option>
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

                        {/* Batch & Software Version */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-[11px]">Batch / Lot Number</Label>
                            <Input
                              value={product.batchNumber}
                              onChange={(e) =>
                                handleUpdateProduct(
                                  product.id,
                                  "batchNumber",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. BATCH-2026-08"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px]">Software Version</Label>
                            <Input
                              value={product.softwareVersion}
                              onChange={(e) =>
                                handleUpdateProduct(
                                  product.id,
                                  "softwareVersion",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. v3.4.1"
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <HeartPulse className="h-4 w-4 text-primary" />
                    <span>Patient Information & Health Impact ({patients.length})</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleAddPatient}
                    className="gap-1 text-primary hover:text-primary font-semibold"
                  >
                    <Plus className="h-3 w-3" /> Add Another Patient
                  </Button>
                </div>

                <div className="space-y-4">
                  {patients.map((patient, idx) => (
                    <div
                      key={patient.id}
                      className="rounded-lg border border-border bg-muted/20 p-4 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] font-semibold">
                            Patient #{idx + 1}
                          </Badge>
                          <span className="text-xs font-medium text-foreground">
                            {patient.patientName || "Patient Safety Profile"}
                          </span>
                        </div>
                        {patients.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleRemovePatient(patient.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Remove patient"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Patient Death? *</Label>
                          <select
                            value={death}
                            onChange={(e) => setDeath(e.target.value as Death)}
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
                            value={patient.patientName}
                            onChange={(e) =>
                              handleUpdatePatient(
                                patient.id,
                                "patientName",
                                e.target.value
                              )
                            }
                            placeholder="e.g. PT-8820"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">Patient Age (Years)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="120"
                            value={patient.age}
                            onChange={(e) =>
                              handleUpdatePatient(
                                patient.id,
                                "age",
                                e.target.value
                              )
                            }
                            placeholder="e.g. 54"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px]">Sex</Label>
                          <select
                            value={patient.sex}
                            onChange={(e) =>
                              handleUpdatePatient(
                                patient.id,
                                "sex",
                                e.target.value
                              )
                            }
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
                            value={patient.patientImpact}
                            onChange={(e) =>
                              handleUpdatePatient(
                                patient.id,
                                "patientImpact",
                                e.target.value
                              )
                            }
                            placeholder="e.g. Temporary Discomfort / None"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] flex items-center gap-1">
                            <Stethoscope className="h-3 w-3 text-blue-500" />
                            IMDRF Annex E (Clinical Signs)
                          </Label>
                          <select
                            value={patient.annexE_Code}
                            onChange={(e) =>
                              handleUpdatePatient(
                                patient.id,
                                "annexE_Code",
                                e.target.value
                              )
                            }
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
                            value={patient.annexF_Code}
                            onChange={(e) =>
                              handleUpdatePatient(
                                patient.id,
                                "annexF_Code",
                                e.target.value
                              )
                            }
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
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Cancel
              </Link>
              <Button type="submit" size="sm" disabled={isSubmitting}>
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
