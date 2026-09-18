"use client";

import * as React from "react";
import {
  CANONICAL_QUESTION_BANK,
  CanonicalAnswerValue,
  CanonicalQuestionDefinition,
  QuestionCategory,
  StoredQuestionAnswer,
} from "@/lib/vigilance/question-bank";
import { batchSaveQuestionAnswers, runGlobalAssessment } from "@/lib/actions/vigilance-engine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuestionnaireFlowProps {
  complaintId: string;
  vigilanceId?: string;
  orgSlug: string;
  initialAnswers: StoredQuestionAnswer[];
  onAssessmentsUpdated?: () => void;
  isReadOnly?: boolean;
}

const CATEGORY_ORDER: Array<{ id: QuestionCategory; label: string }> = [
  { id: "EVENT", label: "1. Event Basics" },
  { id: "CAUSALITY", label: "2. Causality" },
  { id: "OUTCOME", label: "3. Patient / User Outcome" },
  { id: "POTENTIAL", label: "4. Recurrence & Near-Miss" },
  { id: "MALFUNCTION", label: "5. Device Malfunction" },
  { id: "USE", label: "6. Use & Operational Context" },
  { id: "EXPECTEDNESS", label: "7. Expectedness & Labeling" },
  { id: "DEVICE_STATUS", label: "8. Device Status & Expiry" },
  { id: "REGULATORY", label: "9. Regulatory Agreements" },
];

const ANSWER_CHOICES: Array<{ value: CanonicalAnswerValue; label: string; color: string }> = [
  { value: "YES", label: "Yes", color: "bg-emerald-600 text-white hover:bg-emerald-700" },
  { value: "NO", label: "No", color: "bg-zinc-700 text-white hover:bg-zinc-800 dark:bg-zinc-600" },
  { value: "UNKNOWN", label: "Unknown", color: "bg-amber-600 text-white hover:bg-amber-700" },
  { value: "NOT_APPLICABLE", label: "N/A", color: "bg-zinc-400 text-white hover:bg-zinc-500" },
  { value: "NOT_YET_DETERMINED", label: "Pending", color: "bg-blue-600 text-white hover:bg-blue-700" },
];

export function QuestionnaireFlow({
  complaintId,
  vigilanceId,
  orgSlug,
  initialAnswers,
  onAssessmentsUpdated,
  isReadOnly,
}: QuestionnaireFlowProps) {
  const [answers, setAnswers] = React.useState<Map<string, StoredQuestionAnswer>>(() => {
    const map = new Map<string, StoredQuestionAnswer>();
    for (const a of initialAnswers) {
      map.set(a.questionId, a);
    }
    return map;
  });

  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({
    EVENT: true,
    CAUSALITY: true,
    OUTCOME: true,
    POTENTIAL: false,
    MALFUNCTION: false,
    USE: false,
    EXPECTEDNESS: false,
    DEVICE_STATUS: false,
    REGULATORY: false,
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const [activeRationaleId, setActiveRationaleId] = React.useState<string | null>(null);

  // Check question visibility based on parent dependencies
  const isQuestionVisible = React.useCallback(
    (q: CanonicalQuestionDefinition): boolean => {
      if (!q.dependencies || q.dependencies.length === 0) return true;
      for (const dep of q.dependencies) {
        const parent = answers.get(dep.parentQuestionId);
        const parentVal = parent?.answer ?? "NOT_YET_DETERMINED";
        if (Array.isArray(dep.expectedAnswer)) {
          if (!dep.expectedAnswer.includes(parentVal)) return false;
        } else if (dep.expectedAnswer && parentVal !== dep.expectedAnswer) {
          return false;
        }
      }
      return true;
    },
    [answers]
  );

  const handleSelectAnswer = (qId: string, val: CanonicalAnswerValue) => {
    if (isReadOnly) return;
    const existing = answers.get(qId);
    const updated = new Map(answers);
    updated.set(qId, {
      questionId: qId,
      answer: val,
      rationale: existing?.rationale || null,
      source: "USER",
      reviewStatus: "APPROVED",
    });
    setAnswers(updated);
  };

  const handleRationaleChange = (qId: string, text: string) => {
    if (isReadOnly) return;
    const existing = answers.get(qId);
    const updated = new Map(answers);
    updated.set(qId, {
      questionId: qId,
      answer: existing?.answer || "NOT_YET_DETERMINED",
      rationale: text,
      source: existing?.source || "USER",
      reviewStatus: "APPROVED",
    });
    setAnswers(updated);
  };

  const handleSaveAndEvaluate = async () => {
    setIsSaving(true);
    try {
      const itemsToSave = Array.from(answers.values());
      await batchSaveQuestionAnswers({
        complaintId,
        vigilanceId,
        orgSlug,
        answers: itemsToSave.map((item) => ({
          questionId: item.questionId,
          answer: item.answer,
          structuredValue: item.structuredValue,
          rationale: item.rationale,
          evidence: item.evidence,
          source: item.source,
          confidence: item.confidence,
          reviewStatus: item.reviewStatus,
        })),
        reason: "User updated canonical factual questions and requested re-evaluation",
      });

      await runGlobalAssessment({
        complaintId,
        vigilanceId,
        orgSlug,
      });

      toast.success("Factual answers saved and global reportability recalculated.");
      if (onAssessmentsUpdated) {
        onAssessmentsUpdated();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to evaluate answers.");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate completion stats
  const visibleQuestions = React.useMemo(() => {
    return CANONICAL_QUESTION_BANK.filter(isQuestionVisible);
  }, [isQuestionVisible]);

  const answeredCount = React.useMemo(() => {
    return visibleQuestions.filter((q) => {
      const a = answers.get(q.id);
      return a && a.answer !== "NOT_YET_DETERMINED";
    }).length;
  }, [visibleQuestions, answers]);

  const progressPercent = Math.round(
    visibleQuestions.length > 0 ? (answeredCount / visibleQuestions.length) * 100 : 0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner with Progress and Action */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Canonical Incident Facts (Factual Layer)
            </h3>
            <Badge variant="outline" className="text-xs font-normal">
              {answeredCount} of {visibleQuestions.length} answered ({progressPercent}%)
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Facts are global and objective. Answer each question; the deterministic rule engine
            will interpret them across all jurisdictions (EU, FDA, Canada, Australia, China, Japan).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleSaveAndEvaluate}
            disabled={isSaving || isReadOnly}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isSaving ? "Evaluating…" : "Evaluate Reportability"}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Categories Accordion */}
      <div className="space-y-4">
        {CATEGORY_ORDER.map((cat) => {
          const categoryQuestions = visibleQuestions.filter((q) => q.category === cat.id);
          if (categoryQuestions.length === 0) return null;

          const isExpanded = expandedCategories[cat.id] ?? false;
          const answeredInCat = categoryQuestions.filter((q) => {
            const a = answers.get(q.id);
            return a && a.answer !== "NOT_YET_DETERMINED";
          }).length;

          return (
            <div key={cat.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setExpandedCategories((prev) => ({
                    ...prev,
                    [cat.id]: !isExpanded,
                  }))
                }
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-foreground">{cat.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({answeredInCat}/{categoryQuestions.length})
                  </span>
                </div>
                {answeredInCat === categoryQuestions.length ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                )}
              </button>

              {isExpanded && (
                <div className="divide-y divide-border border-t border-border bg-background/50">
                  {categoryQuestions.map((q) => {
                    const current = answers.get(q.id);
                    const selectedValue = current?.answer ?? "NOT_YET_DETERMINED";
                    const isAI = current?.source === "AI_SUGGESTED";
                    const hasRationale = Boolean(current?.rationale);
                    const isRationaleOpen = activeRationaleId === q.id || hasRationale;

                    return (
                      <div key={q.id} className="p-4 space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-primary">
                                {q.id}
                              </span>
                              {q.legacyEuQuestionMapping && (
                                <Badge variant="secondary" className="text-[10px] py-0">
                                  {q.legacyEuQuestionMapping}
                                </Badge>
                              )}
                              {isAI && (
                                <Badge
                                  variant="outline"
                                  className="border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[10px] py-0"
                                >
                                  AI Suggested ({Math.round((current?.confidence || 0) * 100)}%)
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground">{q.prompt}</p>
                            {q.guidance && (
                              <p className="text-xs text-muted-foreground">{q.guidance}</p>
                            )}
                          </div>

                          {/* Choice Button Group */}
                          <div className="inline-flex shrink-0 rounded-md border border-border bg-card p-0.5">
                            {ANSWER_CHOICES.map((choice) => {
                              const active = selectedValue === choice.value;
                              return (
                                <button
                                  key={choice.value}
                                  type="button"
                                  disabled={isReadOnly}
                                  onClick={() => handleSelectAnswer(q.id, choice.value)}
                                  className={cn(
                                    "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                                    active
                                      ? choice.color
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {choice.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Rationale toggle & area */}
                        <div className="pt-1">
                          {!isRationaleOpen ? (
                            <button
                              type="button"
                              onClick={() => setActiveRationaleId(q.id)}
                              className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                            >
                              + Add factual rationale / clinical evidence
                            </button>
                          ) : (
                            <div className="space-y-1">
                              <Textarea
                                rows={2}
                                value={current?.rationale || ""}
                                disabled={isReadOnly}
                                onChange={(e) => handleRationaleChange(q.id, e.target.value)}
                                placeholder="State clinical observation, device telemetry reference, or investigation finding..."
                                className="text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
