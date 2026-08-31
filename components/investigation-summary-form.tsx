"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, Save, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  saveInvestigationSummaryDraft,
  signAndCompleteInvestigationSummary,
} from "@/lib/actions/investigation-summary";

const summarySchema = z.object({
  summary: z.string().nullable().optional(),
  report: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  capaRequired: z.boolean(),
  capaRef: z.string().nullable().optional(),
  fscaRequired: z.boolean(),
  fscaRef: z.string().nullable().optional(),
  capaFscaRationale: z.string().nullable().optional(),
  reportabilityReviewRequired: z.boolean(),
});

type SummaryFormValues = z.infer<typeof summarySchema>;

interface InvestigationSummaryFormProps {
  investigationId: string;
  initialData?: Partial<SummaryFormValues> & { completedAt?: Date | string | null };
}

export function InvestigationSummaryForm({
  investigationId,
  initialData,
}: InvestigationSummaryFormProps) {
  const isLocked = !!initialData?.completedAt;
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSigning, setIsSigning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SummaryFormValues>({
    resolver: zodResolver(summarySchema),
    defaultValues: {
      summary: initialData?.summary || "",
      report: initialData?.report || "",
      notes: initialData?.notes || "",
      capaRequired: initialData?.capaRequired || false,
      capaRef: initialData?.capaRef || "",
      fscaRequired: initialData?.fscaRequired || false,
      fscaRef: initialData?.fscaRef || "",
      capaFscaRationale: initialData?.capaFscaRationale || "",
      reportabilityReviewRequired: initialData?.reportabilityReviewRequired || false,
    },
  });

  const capaRequired = watch("capaRequired");
  const fscaRequired = watch("fscaRequired");
  const reportabilityReviewRequired = watch("reportabilityReviewRequired");

  const onSaveDraft = async (data: SummaryFormValues) => {
    if (isLocked) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveInvestigationSummaryDraft({
        investigationId,
        summary: data.summary || null,
        report: data.report || null,
        capaRequired: data.capaRequired,
        capaRef: data.capaRef || null,
        fscaRequired: data.fscaRequired,
        fscaRef: data.fscaRef || null,
        capaFscaRationale: data.capaFscaRationale || null,
        reportabilityReviewRequired: data.reportabilityReviewRequired,
        notes: data.notes || null,
      });
      toast.success("Draft Saved", { description: "Summary draft has been successfully saved." });
    } catch (err: any) {
      setError(err.message || "Failed to save draft.");
    } finally {
      setIsSaving(false);
    }
  };

  const onSignAndComplete = async (data: SummaryFormValues) => {
    if (isLocked) return;
    setIsSigning(true);
    setError(null);
    try {
      await signAndCompleteInvestigationSummary({
        investigationId,
        summary: data.summary || null,
        report: data.report || null,
        capaRequired: data.capaRequired,
        capaRef: data.capaRef || null,
        fscaRequired: data.fscaRequired,
        fscaRef: data.fscaRef || null,
        capaFscaRationale: data.capaFscaRationale || null,
        reportabilityReviewRequired: data.reportabilityReviewRequired,
        notes: data.notes || null,
      });
      toast.success("Completed", { description: "Investigation has been signed and completed." });
    } catch (err: any) {
      setError(err.message || "Failed to sign and complete.");
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto dark text-zinc-100">
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-md shadow-2xl">
        
        {isLocked && (
          <div className="absolute top-0 left-0 w-full bg-purple-900/40 border-b border-purple-500/30 px-6 py-3 flex items-center justify-center gap-2">
            <Lock className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-200">
              Completed and Locked
            </span>
          </div>
        )}

        <div className={`p-8 ${isLocked ? "pt-16 opacity-80 pointer-events-none" : ""}`}>
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Investigation Summary
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Final conclusion, rationale, CAPA, and FSCA determination for this investigation.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <form className="space-y-8">
            {/* Main Textareas */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="summary" className="text-zinc-300">Executive Summary</Label>
                <Textarea
                  id="summary"
                  rows={4}
                  {...register("summary")}
                  className="bg-zinc-950/50 border-white/10 focus-visible:ring-purple-500/50"
                  placeholder="Summarize the findings of the investigation..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report" className="text-zinc-300">Detailed Report / Conclusion</Label>
                <Textarea
                  id="report"
                  rows={8}
                  {...register("report")}
                  className="bg-zinc-950/50 border-white/10 focus-visible:ring-purple-500/50"
                  placeholder="Provide the comprehensive narrative..."
                />
              </div>
            </div>

            {/* Decisions Section */}
            <div className="space-y-6 border-t border-white/10 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CAPA Required */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="capaRequired"
                      className="h-4 w-4 rounded border-white/10 bg-zinc-950 accent-purple-600 focus:ring-purple-500/50"
                      {...register("capaRequired")}
                    />
                    <Label htmlFor="capaRequired" className="font-medium text-zinc-200">
                      CAPA Required
                    </Label>
                  </div>
                  
                  {capaRequired && (
                    <div className="space-y-2 pl-6 border-l-2 border-purple-500/30 animate-in fade-in slide-in-from-left-2 duration-300">
                      <Label htmlFor="capaRef" className="text-xs text-zinc-400">CAPA Reference #</Label>
                      <Input
                        id="capaRef"
                        {...register("capaRef")}
                        className="bg-zinc-950/50 border-white/10 focus-visible:ring-purple-500/50 h-9"
                        placeholder="e.g. CAPA-2026-042"
                      />
                    </div>
                  )}
                </div>

                {/* FSCA Required */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="fscaRequired"
                      className="h-4 w-4 rounded border-white/10 bg-zinc-950 accent-purple-600 focus:ring-purple-500/50"
                      {...register("fscaRequired")}
                    />
                    <Label htmlFor="fscaRequired" className="font-medium text-zinc-200">
                      FSCA Required
                    </Label>
                  </div>
                  
                  {fscaRequired && (
                    <div className="space-y-2 pl-6 border-l-2 border-purple-500/30 animate-in fade-in slide-in-from-left-2 duration-300">
                      <Label htmlFor="fscaRef" className="text-xs text-zinc-400">FSCA Reference #</Label>
                      <Input
                        id="fscaRef"
                        {...register("fscaRef")}
                        className="bg-zinc-950/50 border-white/10 focus-visible:ring-purple-500/50 h-9"
                        placeholder="e.g. FSCA-2026-001"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* CAPA / FSCA Rationale */}
              <div className="space-y-2">
                <Label htmlFor="capaFscaRationale" className="text-xs text-zinc-400">CAPA / FSCA Rationale</Label>
                <Textarea
                  id="capaFscaRationale"
                  rows={2}
                  {...register("capaFscaRationale")}
                  className="bg-zinc-950/50 border-white/10 focus-visible:ring-purple-500/50"
                  placeholder="Provide rationale for CAPA and FSCA determination..."
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2 border-t border-white/10 pt-8">
              <Label htmlFor="notes" className="text-zinc-300">Internal Notes</Label>
              <Textarea
                id="notes"
                rows={2}
                {...register("notes")}
                className="bg-zinc-950/50 border-white/10 focus-visible:ring-purple-500/50"
                placeholder="Optional administrative notes..."
              />
            </div>

            {/* Reportability Review */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reportabilityReviewRequired"
                  className="h-4 w-4 rounded border-white/10 bg-zinc-950 accent-purple-600 focus:ring-purple-500/50"
                  {...register("reportabilityReviewRequired")}
                />
                <Label htmlFor="reportabilityReviewRequired" className="font-medium text-zinc-200">
                  Reportability Review Required
                </Label>
              </div>

              {reportabilityReviewRequired && (
                <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-3 animate-in fade-in duration-300">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200/90 leading-tight">
                    This will automatically trigger a Vigilance Decision Tree upon completion.
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Action Bar */}
        {!isLocked && (
          <div className="flex items-center justify-end gap-3 px-8 py-4 bg-zinc-950/50 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              className="text-zinc-300 hover:text-white hover:bg-white/10"
              onClick={handleSubmit(onSaveDraft)}
              disabled={isSaving || isSigning}
            >
              <Save className="h-4 w-4 mr-2 opacity-70" />
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              type="button"
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20"
              onClick={handleSubmit(onSignAndComplete)}
              disabled={isSaving || isSigning}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              {isSigning ? "Signing..." : "Sign & Complete"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
