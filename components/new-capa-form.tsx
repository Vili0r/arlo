"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Paperclip,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { CapaType, CapaPhase } from "@prisma/client";
import { useOrganization, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileUploader } from "@/components/file-uploader";
import { createCapa, type AttachmentInput } from "@/lib/actions/capa";
import { formatUserName, cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Options                                                             */
/* ------------------------------------------------------------------ */

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
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];
type Completion = "done" | "attention" | "empty";

const PHASE_STEPS: Array<{ phase: string; label: string }> = [
  { phase: "INITIATION", label: "Initiation" },
  { phase: "INVESTIGATION", label: "Investigation" },
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

interface NewCapaFormProps {
  orgSlug: string;
}

export function NewCapaForm({ orgSlug }: NewCapaFormProps) {
  const router = useRouter();
  const { user } = useUser();

  const { memberships } = useOrganization({
    memberships: { pageSize: 100, keepPreviousData: true },
  });

  const [activeSection, setActiveSection] = React.useState<SectionId>("initiation");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /* ---------- State (Phase 1: Initiation Only) ---------- */

  const [shortDescription, setShortDescription] = React.useState("");
  const [type, setType] = React.useState<CapaType>(CapaType.CORRECTIVE);
  const currentPhase = CapaPhase.INITIATION;
  const [ownerId, setOwnerId] = React.useState(user?.id || "");

  // Initiation details
  const [problemStatement, setProblemStatement] = React.useState("");
  const [containmentAction, setContainmentAction] = React.useState("");
  const [dateDue, setDateDue] = React.useState("");
  const [source, setSource] = React.useState("");

  // Risk assessment
  const [severityRanking, setSeverityRanking] = React.useState("MAJOR");
  const [occurrenceRanking, setOccurrenceRanking] = React.useState("OCCASIONAL");
  const [riskCategory, setRiskCategory] = React.useState("HIGH");

  // Approval
  const [initiationPrimaryApproverId, setInitiationPrimaryApproverId] = React.useState("");
  const [initiationSecondaryApproverId, setInitiationSecondaryApproverId] = React.useState("");
  const [initiationCompletedById, setInitiationCompletedById] = React.useState(user?.id || "");
  const [initiationCompletedAt, setInitiationCompletedAt] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [initiationAttachments, setInitiationAttachments] = React.useState<AttachmentInput[]>([]);

  // Record attachments
  const [rootAttachments, setRootAttachments] = React.useState<AttachmentInput[]>([]);

  // Auto-populate owner and completed by once Clerk user loads
  React.useEffect(() => {
    if (user?.id) {
      if (!ownerId) setOwnerId(user.id);
      if (!initiationCompletedById) setInitiationCompletedById(user.id);
    }
  }, [user, ownerId, initiationCompletedById]);

  /* ---------- Derived ---------- */

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
    return { initiation };
  }, [shortDescription, problemStatement]);

  const phaseIndex = PHASE_STEPS.findIndex((p) => p.phase === String(currentPhase));

  /* ---------- Scroll-spy ---------- */

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
      const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
      if (els.length === 0) return;

      const scrollTop = scroller ? scroller.scrollTop : window.scrollY;
      const viewport = scroller ? scroller.clientHeight : window.innerHeight;
      const scrollHeight = scroller ? scroller.scrollHeight : document.documentElement.scrollHeight;

      if (scrollTop + viewport >= scrollHeight - 4) {
        setActiveSection(els[els.length - 1].id as SectionId);
        return;
      }

      const line = 140;
      const containerTop = scroller ? scroller.getBoundingClientRect().top : 0;
      let current: SectionId = els[0].id as SectionId;
      for (const el of els) {
        if (el.getBoundingClientRect().top - containerTop <= line) current = el.id as SectionId;
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

  const scrollTo = (id: SectionId) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  /* ---------- Submit ---------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shortDescription.trim()) {
      toast.error("Enter a short description");
      scrollTo("initiation");
      return;
    }
    if (!problemStatement.trim()) {
      toast.error("Problem statement is required");
      scrollTo("initiation");
      return;
    }

    const effectiveOwnerId = ownerId || user?.id || "";
    if (!effectiveOwnerId) {
      toast.error("Please assign an owner to the CAPA");
      scrollTo("initiation");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        shortDescription: shortDescription.trim(),
        type,
        currentPhase,
        ownerId: effectiveOwnerId,
        cancellationRequested: false,
        cancellationJustification: null,

        initiation: {
          problemStatement: problemStatement.trim(),
          containmentAction: containmentAction.trim() || null,
          dateDue: dateDue ? new Date(dateDue) : null,
          source: source.trim() || null,
          repeatCapa: false,
          capaReference: null,
          existingCapa: false,
          existingOpenCapaReference: null,
          existingCapaDueDate: null,
          processOrProduct: "Product",
          affectedArea: null,
          productDetails: null,
          relatedProcess: null,
          severityRanking: severityRanking || null,
          severityRationale: null,
          occurrenceRanking: occurrenceRanking || null,
          occurrenceRationale: null,
          riskCategory: riskCategory || null,
          capaRequired: true,
          capaType: "Process Optimization",
          capaSummary: null,
          fscaRequired: false,
          fscaRefNumber: null,
          primaryApproverId: initiationPrimaryApproverId || null,
          secondaryApproverId: initiationSecondaryApproverId || null,
          completedById: initiationCompletedById || null,
          completedAt: initiationCompletedAt ? new Date(initiationCompletedAt) : null,
          attachments: initiationAttachments,
        },

        extensionRequests: [],
        attachments: rootAttachments,
      };

      const newCapa = await createCapa(payload);
      toast.success("CAPA Initiated", {
        description: `CAPA ${newCapa.capaNumber} has been successfully created.`,
      });
      router.push(`/${orgSlug}/capa/${newCapa.capaId}`);
    } catch (err: any) {
      console.error("[Create CAPA Error]", err);
      setError(err?.message || "Couldn't initiate the CAPA. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- Reusable member select ---------- */

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
    <div ref={rootRef} className="-m-6 lg:-m-8">
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
              <span className="font-mono text-sm font-medium text-foreground">New CAPA</span>
              <Badge
                variant="outline"
                className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
              >
                {humanize(String(currentPhase))}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {type === CapaType.CORRECTIVE ? "Corrective" : "Preventive"}
              </Badge>
            </div>

            <div className="flex items-center gap-2 lg:mt-2">
              <Button
                type="submit"
                form="capa-form"
                size="sm"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {isSubmitting ? "Initiating…" : "Initiate CAPA"}
              </Button>
            </div>
          </div>

          <nav className="-mb-px mt-2 flex gap-1 overflow-x-auto" aria-label="Phases">
            {SECTIONS.map((s, i) => {
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
                  {i + 1}. {s.label}
                </button>
              );
            })}
          </nav>
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

          <fieldset className="contents space-y-6">
            {/* ---------- 1. Initiation Phase ---------- */}
            <SectionCard
              id="initiation"
              title="Initiation and problem definition"
              description="Problem statement, origin, containment, and risk evaluation."
              badge={<Badge variant="outline" className="font-mono text-[11px]">Phase 1</Badge>}
            >
              <div className="space-y-4">
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
                  <Field label="Owner" htmlFor="ownerId" required>
                    <MemberSelect id="ownerId" value={ownerId} onChange={setOwnerId} placeholder="Unassigned" />
                  </Field>
                  <Field label="Initiation due date" htmlFor="dateDue">
                    <Input id="dateDue" type="date" value={dateDue} onChange={(e) => setDateDue(e.target.value)} />
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
                ["Opened", "Today"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <dt className="shrink-0 text-xs text-muted-foreground">{k}</dt>
                  <dd className="break-words text-right text-xs text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </PanelCard>

          <PanelCard title="Phase progress">
            <ol className="space-y-2">
              {PHASE_STEPS.map((step, i) => {
                const state = i === 0 ? "current" : "todo";
                return (
                  <li key={step.phase} className="flex items-center gap-2.5 text-xs">
                    <span
                      aria-hidden
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        state === "current" && "bg-foreground ring-4 ring-foreground/10",
                        state === "todo" && "bg-border"
                      )}
                    />
                    <span
                      className={cn(
                        state === "current" && "font-medium text-foreground",
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
              Investigation and implementation will become available after initiation.
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
    </div>
  );
}
