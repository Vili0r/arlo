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
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Paperclip,
  Check,
} from "lucide-react";
import { Priority, Death } from "@prisma/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
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
import {
  ComplaintFormSchema,
  type ComplaintFormValues,
} from "@/lib/validations/complaint";
import { formatUserName, cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared styles and helpers                                           */
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

const PRIORITY_LABEL: Record<Priority, string> = {
  [Priority.LOW]: "Low",
  [Priority.MEDIUM]: "Medium",
  [Priority.HIGH]: "High",
  [Priority.CRITICAL]: "Critical",
};


function humanize(value: string) {
  return (
    value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ")
  );
}

function formatDate(date?: Date | null) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
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

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface NewComplaintFormProps {
  orgSlug: string;
}

export function NewComplaintForm({ orgSlug }: NewComplaintFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSection, setActiveSection] = React.useState<SectionId>("overview");
  const [openProduct, setOpenProduct] = React.useState<number | null>(0);
  const [openPatient, setOpenPatient] = React.useState<number | null>(0);

  const { memberships } = useOrganization({
    memberships: { pageSize: 100, keepPreviousData: true },
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
  } = useFieldArray({ control, name: "products" });

  const {
    fields: patientFields,
    append: appendPatient,
    remove: removePatient,
  } = useFieldArray({ control, name: "patients" });

  /* ---------- watched values ---------- */

  const watchProducts = watch("products");
  const watchPatients = watch("patients");
  const watchDeath = watch("death");
  const watchPriority = watch("priority");
  const watchShort = watch("shortDescription");
  const watchDescription = watch("description");
  const watchCustomer = watch("customerName");
  const watchReporterName = watch("initialReporterName");
  const watchReporterSurname = watch("initialReporterSurname");
  const watchEmail = watch("email");
  const watchRegion = watch("region");
  const watchAwareness = watch("awarenessDate");
  const watchReceived = watch("dateReceived");
  const watchOwnerId = watch("complaintOwnerId");
  const watchAttachments = watch("attachments");

  const isAdverse =
    watchDeath === Death.YES || watchPriority === Priority.CRITICAL;

  const ownerName = React.useMemo(() => {
    if (!watchOwnerId) return "Unassigned";
    const m = memberships?.data?.find(
      (x) => x.publicUserData?.userId === watchOwnerId
    );
    return m ? formatUserName(m.publicUserData, "User") : "Unassigned";
  }, [watchOwnerId, memberships]);

  const completion = React.useMemo<Record<SectionId, Completion>>(() => {
    const overview: Completion =
      watchShort && watchDescription ? "done" : watchShort ? "attention" : "empty";

    const reporter: Completion =
      watchCustomer && watchReporterName && watchReporterSurname && watchEmail
        ? "done"
        : watchCustomer || watchReporterName || watchEmail
          ? "attention"
          : "empty";

    const devicesFilled = watchProducts?.some(
      (p) => p.materialDescription || p.materialNumber || p.serialNumber || p.udi
    );
    const devicesCoded = watchProducts?.every(
      (p) =>
        !(p.materialDescription || p.materialNumber || p.serialNumber) ||
        p.asReportedCode1
    );
    const devices: Completion = !devicesFilled
      ? "empty"
      : devicesCoded
        ? "done"
        : "attention";

    const patientsFilled = watchPatients?.some(
      (pt) => pt.patientName || pt.patientImpact || pt.age
    );
    const patientsCoded = watchPatients?.every(
      (pt) => !(pt.patientName || pt.patientImpact) || pt.annexF_Code
    );
    const patients: Completion = !patientsFilled
      ? "empty"
      : patientsCoded
        ? "done"
        : "attention";

    return { overview, reporter, devices, patients };
  }, [
    watchShort,
    watchDescription,
    watchCustomer,
    watchReporterName,
    watchReporterSurname,
    watchEmail,
    watchProducts,
    watchPatients,
  ]);

  const readyToCreate =
    completion.overview === "done" && completion.reporter === "done";

  /* ---------- scroll-spy ---------- */

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
        isAdverseEvent:
          data.death === Death.YES || data.priority === Priority.CRITICAL,
        products: filteredProducts.length > 0 ? filteredProducts : undefined,
        patients: filteredPatients.length > 0 ? filteredPatients : undefined,
        attachments: data.attachments.length > 0 ? data.attachments : undefined,
      });

      toast.success("Complaint created");
      router.push("/complaints");
      router.refresh();
    } catch (err: any) {
      console.error("[Complaint Submission Error]", err);
      setError(err?.message || "Couldn't create the complaint. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  return (
    <div ref={rootRef} className="-m-6 lg:-m-8">
      {/* ---------- Sticky record bar ---------- */}
      <div className="sticky -top-10 z-20 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="px-6 pt-3 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mt-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Link
                href="/complaints"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Complaints
              </Link>
              <span className="text-xs text-muted-foreground/60">/</span>
              <span className="text-sm font-medium text-foreground">
                New complaint
              </span>
              <Badge variant="outline" className="text-muted-foreground">
                Draft
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

            <div className="flex items-center gap-2">
              <Link
                href="/complaints"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Cancel
              </Link>
              <Button
                type="submit"
                form="new-complaint-form"
                size="sm"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isSubmitting ? "Creating…" : "Create complaint"}
              </Button>
            </div>
          </div>

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
        <form
          id="new-complaint-form"
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

          <fieldset className="contents space-y-6">

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
                  placeholder="Infusion pump flow-rate sensor discrepancy during administration"
                  {...register("shortDescription")}
                />
              </Field>

              <Field
                label="Event narrative"
                htmlFor="description"
                required
                error={errors.description?.message}
              >
                <Textarea
                  id="description"
                  rows={5}
                  className="leading-relaxed"
                  placeholder="Describe the event, clinical context, operating environment, and initial findings."
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
                      <DatePicker value={field.value} onChange={field.onChange} />
                    )}
                  />
                </Field>

                <Field label="Date received" required>
                  <Controller
                    control={control}
                    name="dateReceived"
                    render={({ field }) => (
                      <DatePicker value={field.value} onChange={field.onChange} />
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
                  <Field label="Customer country" htmlFor="country" required>
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

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/complaints"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel and return
            </Link>
            {/* <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isSubmitting ? "Creating…" : "Create complaint"}
            </Button> */}
          </div>
        </fieldset>
        </form>

        {/* ---------- Right context panel ---------- */}
        <aside className="space-y-4 xl:sticky xl:top-[120px] xl:self-start">
          <PanelCard title="Summary">
            <dl className="divide-y divide-border">
              {[
                ["Priority", PRIORITY_LABEL[watchPriority] ?? "—"],
                ["Owner", ownerName],
                ["Region", REGIONS.find((r) => r.value === watchRegion)?.label ?? watchRegion ?? "—"],
                ["Awareness", formatDate(watchAwareness)],
                ["Received", formatDate(watchReceived)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <dt className="shrink-0 text-xs text-muted-foreground">{k}</dt>
                  <dd className="text-right text-xs text-foreground break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </PanelCard>

          <PanelCard title="Before you create">
            <ul className="space-y-2">
              {[
                { label: "Description and narrative", ok: completion.overview === "done" },
                { label: "Reporter contact details", ok: completion.reporter === "done" },
                { label: "At least one device coded", ok: completion.devices === "done" },
                { label: "Patient impact recorded", ok: completion.patients === "done" },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-xs">
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      item.ok
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-border text-transparent"
                    )}
                  >
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span className={item.ok ? "text-foreground" : "text-muted-foreground"}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
            {!readyToCreate && (
              <p className="mt-3 text-xs text-muted-foreground">
                The first two are required. Devices and patients can be added later.
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
    </div>
  );
}