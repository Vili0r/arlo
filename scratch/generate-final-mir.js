const fs = require('fs');
const content = `"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Save,
  Loader2,
  Lock,
  LockOpen,
} from "lucide-react";
import {
  MIRStatus,
} from "@prisma/client";
import { useRecordLock } from "@/hooks/useRecordLock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@clerk/nextjs";
import { updateFinalMIR } from "@/lib/actions/mir";

const finalMirSchema = z.object({
  status: z.nativeEnum(MIRStatus),
  reportType: z.string().optional().nullable(),
  mirNumber: z.string().optional().nullable(),
  manufacturerReference: z.string().optional().nullable(),
  previousMirReference: z.string().optional().nullable(),
  competentAuthority: z.string().optional().nullable(),
  competentAuthorityReference: z.string().optional().nullable(),
  submissionCountry: z.string().optional().nullable(),
  submissionMethod: z.string().optional().nullable(),
  submittedBy: z.string().optional().nullable(),
  submissionDate: z.date().optional().nullable(),
  finalDeviceRelatedness: z.string().optional().nullable(),
  finalCausalityAssessment: z.string().optional().nullable(),
  finalCausalityRationale: z.string().optional().nullable(),
  manufacturerConclusion: z.string().optional().nullable(),
  incidentConfirmed: z.boolean().optional(),
  deviceContributionConfirmed: z.boolean().optional(),
  rootCauseConfirmed: z.boolean().optional(),
  recurrencePotential: z.string().optional().nullable(),
  finalRiskAssessmentSummary: z.string().optional().nullable(),
  manufacturerFinalStatement: z.string().optional().nullable(),
  preparedById: z.string().optional().nullable(),
  reviewedById: z.string().optional().nullable(),
  approvedById: z.string().optional().nullable(),
});

type FinalMIRFormValues = z.infer<typeof finalMirSchema>;

export interface FinalMIREditFormProps {
  orgSlug: string;
  complaintNumber: string;
  mir: any;
  users: Array<{ id: string; email: string; firstName: string | null; lastName: string | null }>;
}

export function FinalMIREditForm({
  orgSlug,
  complaintNumber,
  mir,
  users,
}: FinalMIREditFormProps) {
  const router = useRouter();
  const { organization } = useOrganization();
  const orgId = organization?.id || "";

  const [isSaving, setIsSaving] = React.useState(false);

  const { isLocked, isLockedByCurrentUser, lockOwner, requestLock, releaseLock } =
    useRecordLock(orgId, "Vigilance", mir.id);

  const form = useForm<FinalMIRFormValues>({
    resolver: zodResolver(finalMirSchema),
    defaultValues: {
      status: mir.status || MIRStatus.DRAFT,
      reportType: mir.reportType || "FINAL",
      mirNumber: mir.mirNumber || "",
      manufacturerReference: mir.manufacturerReference || "",
      previousMirReference: mir.previousMirReference || "",
      competentAuthority: mir.competentAuthority || "",
      competentAuthorityReference: mir.competentAuthorityReference || "",
      submissionCountry: mir.submissionCountry || "",
      submissionMethod: mir.submissionMethod || "",
      submittedBy: mir.submittedBy || "",
      submissionDate: mir.submissionDate ? new Date(mir.submissionDate) : null,
      finalDeviceRelatedness: mir.finalDeviceRelatedness || "",
      finalCausalityAssessment: mir.finalCausalityAssessment || "",
      finalCausalityRationale: mir.finalCausalityRationale || "",
      manufacturerConclusion: mir.manufacturerConclusion || "",
      incidentConfirmed: mir.incidentConfirmed || false,
      deviceContributionConfirmed: mir.deviceContributionConfirmed || false,
      rootCauseConfirmed: mir.rootCauseConfirmed || false,
      recurrencePotential: mir.recurrencePotential || "",
      finalRiskAssessmentSummary: mir.finalRiskAssessmentSummary || "",
      manufacturerFinalStatement: mir.manufacturerFinalStatement || "",
      preparedById: mir.preparedById || "",
      reviewedById: mir.reviewedById || "",
      approvedById: mir.approvedById || "",
    },
  });

  const onSubmit = async (data: FinalMIRFormValues) => {
    if (!isLockedByCurrentUser) {
      toast.error("You must lock the record to save changes.");
      return;
    }
    try {
      setIsSaving(true);
      await updateFinalMIR(mir.id, data);
      toast.success("Final MIR updated successfully.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update Final MIR");
    } finally {
      setIsSaving(false);
    }
  };

  const isReadOnly = !isLockedByCurrentUser;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Final Manufacturer Incident Report (MIR)
          </h2>
          <p className="text-muted-foreground mt-1">
            Complaint: {complaintNumber}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLocked ? (
            isLockedByCurrentUser ? (
              <Button variant="outline" className="gap-2 bg-muted/50 border-destructive/20 text-destructive hover:bg-destructive/10" onClick={releaseLock}>
                <LockOpen className="h-4 w-4" /> Release Lock
              </Button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                <Lock className="h-4 w-4" /> <span className="text-sm font-medium">Locked by {lockOwner}</span>
              </div>
            )
          ) : (
            <Button variant="outline" className="gap-2" onClick={requestLock}>
              <Lock className="h-4 w-4" /> Lock to Edit
            </Button>
          )}
          <Button onClick={form.handleSubmit(onSubmit)} disabled={!isLockedByCurrentUser || isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-foreground">1. Report Identification</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>MIR Number</Label>
                  <Input {...form.register("mirNumber")} disabled={isReadOnly} />
                </div>
                <div className="space-y-2">
                  <Label>Previous MIR Reference</Label>
                  <Input {...form.register("previousMirReference")} disabled={isReadOnly} />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t">
              <div>
                <h3 className="text-lg font-medium text-foreground">27. Final MIR Conclusion</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" {...form.register("incidentConfirmed")} disabled={isReadOnly} />
                  <Label>Incident Confirmed</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" {...form.register("rootCauseConfirmed")} disabled={isReadOnly} />
                  <Label>Root Cause Confirmed</Label>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label>Final Risk Assessment Summary</Label>
                <Textarea {...form.register("finalRiskAssessmentSummary")} disabled={isReadOnly} />
              </div>
              <div className="space-y-2 mt-4">
                <Label>Manufacturer Conclusion</Label>
                <Textarea {...form.register("manufacturerConclusion")} disabled={isReadOnly} />
              </div>
            </div>
          </form>
        </div>
        <div className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-5 border">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Badge variant="outline" className="bg-background">MIR Status</Badge>
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Phase</span>
                <span className="font-medium">{mir.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('components/final-mir-form.tsx', content);
