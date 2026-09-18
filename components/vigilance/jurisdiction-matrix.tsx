"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  HelpCircle,
  Info,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { approveJurisdictionAssessment } from "@/lib/actions/vigilance-engine";
import { toast } from "sonner";

export interface JurisdictionMatrixItem {
  id: string;
  jurisdiction: string;
  regulator: string;
  regulatoryFramework: string;
  rulesetVersion: string;
  status: string; // REPORTABLE, NOT_REPORTABLE, PENDING_INFORMATION, REQUIRES_REVIEW, EXEMPT
  reportingCategory?: string | null;
  reportingReason?: string | null;
  deadline?: string | null;
  deadlineType?: string | null;
  deadlineDays?: number | null;
  requiredForm?: string | null;
  submissionMethod?: string | null;
  triggeredRules?: any;
  supportingQuestions?: any;
  unresolvedQuestions?: any;
  reviewerRequired?: boolean;
  approvedById?: string | null;
  approvedAt?: string | null;
}

export interface JurisdictionMatrixProps {
  complaintId: string;
  orgSlug: string;
  assessments: JurisdictionMatrixItem[];
  onRefresh?: () => void;
  isReadOnly?: boolean;
}

const JURISDICTION_FLAG_MAP: Record<string, { flag: string; name: string }> = {
  EU: { flag: "🇪🇺", name: "European Union (EU MDR)" },
  US_FDA: { flag: "🇺🇸", name: "United States (FDA 21 CFR 803)" },
  CA_HEALTH_CANADA: { flag: "🇨🇦", name: "Canada (Health Canada)" },
  AU_TGA: { flag: "🇦🇺", name: "Australia (TGA)" },
  CN_NMPA: { flag: "🇨🇳", name: "China (NMPA)" },
  JP_PMDA: { flag: "🇯🇵", name: "Japan (PMDA)" },
  GB_MHRA: { flag: "🇬🇧", name: "United Kingdom (MHRA)" },
  BR_ANVISA: { flag: "🇧🇷", name: "Brazil (ANVISA)" },
  MX_COFEPRIS: { flag: "🇲🇽", name: "Mexico (COFEPRIS)" },
  AR_ANMAT: { flag: "🇦🇷", name: "Argentina (ANMAT)" },
  CO_INVIMA: { flag: "🇨🇴", name: "Colombia (INVIMA)" },
  CL_ISP: { flag: "🇨🇱", name: "Chile (ISP)" },
};

function formatAssessmentDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function JurisdictionMatrix({
  complaintId,
  orgSlug,
  assessments,
  onRefresh,
  isReadOnly,
}: JurisdictionMatrixProps) {
  const [approvingId, setApprovingId] = React.useState<string | null>(null);

  const handleApprove = async (assessmentId: string) => {
    if (isReadOnly) return;
    setApprovingId(assessmentId);
    try {
      await approveJurisdictionAssessment({
        assessmentId,
        complaintId,
        orgSlug,
        reason: "Regulatory officer approved reportability determination",
      });
      toast.success("Jurisdiction assessment approved and locked.");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve assessment.");
    } finally {
      setApprovingId(null);
    }
  };

  if (!assessments || assessments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
        <h4 className="mt-3 text-sm font-medium text-foreground">
          No Jurisdiction Assessments Evaluated Yet
        </h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Answer the canonical questions in the Facts tab and click "Evaluate Reportability" to
          generate multi-jurisdiction regulatory conclusions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Multi-Jurisdiction Regulatory Determinations
          </h3>
          <p className="text-xs text-muted-foreground">
            Independent evaluations based on the shared canonical facts. Every decision is
            deterministic and auditable.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {assessments.map((a) => {
          const meta = JURISDICTION_FLAG_MAP[a.jurisdiction] || {
            flag: "🌐",
            name: a.jurisdiction,
          };
          const isReportable = a.status === "REPORTABLE";
          const isPending = a.status === "PENDING_INFORMATION";
          const isApproved = Boolean(a.approvedAt);
          const triggeredRulesList: string[] = Array.isArray(a.triggeredRules)
            ? a.triggeredRules
            : [];
          const unresolvedList: string[] = Array.isArray(a.unresolvedQuestions)
            ? a.unresolvedQuestions
            : [];

          return (
            <div
              key={a.id || a.jurisdiction}
              className={cn(
                "rounded-xl border p-5 transition-all shadow-xs space-y-4",
                isReportable
                  ? "border-red-500/30 bg-red-500/5 dark:bg-red-950/10"
                  : isPending
                  ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10"
                  : "border-border bg-card"
              )}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl" role="img" aria-label={meta.name}>
                    {meta.flag}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{meta.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      {a.regulatoryFramework} · {a.rulesetVersion}
                    </p>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    isReportable &&
                      "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400",
                    isPending &&
                      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                    a.status === "NOT_REPORTABLE" &&
                      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                    a.status === "EXEMPT" &&
                      "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-400"
                  )}
                >
                  {a.status.replace(/_/g, " ")}
                </Badge>
              </div>

              {/* Core Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Classification:</span>
                  <p className="font-medium text-foreground">
                    {a.reportingCategory?.replace(/_/g, " ") || "Non-reportable"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Statutory Deadline:</span>
                  <p className="font-mono font-medium text-foreground">
                    {a.deadline ? (
                      <span className="text-red-600 dark:text-red-400">
                        {formatAssessmentDate(a.deadline)} ({a.deadlineDays}d)
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Required Form:</span>
                  <p className="text-foreground truncate">{a.requiredForm || "None"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Submission Method:</span>
                  <p className="text-foreground truncate">{a.submissionMethod || "None"}</p>
                </div>
              </div>

              {/* Rationale & Explainability */}
              <div className="rounded-lg bg-background/80 border border-border/80 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  <span>Why this decision?</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {a.reportingReason || "No rules triggered."}
                </p>

                {triggeredRulesList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground">Triggered:</span>
                    {triggeredRulesList.map((r) => (
                      <Badge
                        key={r}
                        variant="secondary"
                        className="text-[10px] font-mono py-0"
                      >
                        {r}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Missing Information / Pending Banner */}
              {isPending && unresolvedList.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5 text-xs text-amber-800 dark:text-amber-300">
                  <div className="flex items-center gap-1.5 font-medium">
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    <span>Information required to finalize assessment:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {unresolvedList.map((qid) => (
                      <li key={qid}>
                        <span className="font-mono">{qid}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Approval Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <div>
                  {isApproved ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approved on {formatAssessmentDate(a.approvedAt)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Pending regulatory sign-off</span>
                  )}
                </div>

                {!isApproved && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isReadOnly || approvingId === a.id}
                    onClick={() => handleApprove(a.id)}
                    className="text-xs h-7 px-2.5"
                  >
                    {approvingId === a.id ? "Approving…" : "Approve Decision"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
