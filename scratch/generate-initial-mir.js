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
  AlertTriangle,
  Lock,
  LockOpen,
} from "lucide-react";
import {
  MIRStatus,
  LockEntityType,
} from "@prisma/client";
import { useRecordLock } from "@/hooks/useRecordLock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@clerk/nextjs";
import { updateInitialMIR } from "@/lib/actions/mir";
import { formatUserName, cn } from "@/lib/utils";

const initialMirSchema = z.object({
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
  dueDate: z.date().optional().nullable(),
  initialDeviceRelatedness: z.string().optional().nullable(),
  initialCausalityAssessment: z.string().optional().nullable(),
  initialSeriousnessAssessment: z.string().optional().nullable(),
  initialRiskAssessment: z.string().optional().nullable(),
  preliminaryConclusion: z.string().optional().nullable(),
  investigationStarted: z.boolean().optional(),
  investigationStartDate: z.date().optional().nullable(),
  preparedById: z.string().optional().nullable(),
  reviewedById: z.string().optional().nullable(),
  approvedById: z.string().optional().nullable(),
});

type InitialMIRFormValues = z.infer<typeof initialMirSchema>;

export interface InitialMIREditFormProps {
  orgSlug: string;
  complaintNumber: string;
  mir: any;
  users: Array<{ id: string; email: string; firstName: string | null; lastName: string | null }>;
}

export function InitialMIREditForm({
  orgSlug,
  complaintNumber,
  mir,
  users,
}: InitialMIREditFormProps) {
  const router = useRouter();
  const { organization } = useOrganization();
  const orgId = organization?.id || "";

  const [isSaving, setIsSaving] = React.useState(false);

  const { isLocked, isLockedByCurrentUser, lockOwner, requestLock, releaseLock } =
    useRecordLock(orgId, "Vigilance", mir.id); // Reusing Vigilance lock type or we should add MIR lock type.

  const form = useForm<InitialMIRFormValues>({
    resolver: zodResolver(initialMirSchema),
    defaultValues: {
      status: mir.status || MIRStatus.DRAFT,
      reportType: mir.reportType || "INITIAL",
      mirNumber: mir.mirNumber || "",
      manufacturerReference: mir.manufacturerReference || "",
      previousMirReference: mir.previousMirReference || "",
      competentAuthority: mir.competentAuthority || "",
      competentAuthorityReference: mir.competentAuthorityReference || "",
      submissionCountry: mir.submissionCountry || "",
      submissionMethod: mir.submissionMethod || "",
      submittedBy: mir.submittedBy || "",
      submissionDate: mir.submissionDate ? new Date(mir.submissionDate) : null,
      dueDate: mir.dueDate ? new Date(mir.dueDate) : null,
      initialDeviceRelatedness: mir.initialDeviceRelatedness || "",
      initialCausalityAssessment: mir.initialCausalityAssessment || "",
      initialSeriousnessAssessment: mir.initialSeriousnessAssessment || "",
      initialRiskAssessment: mir.initialRiskAssessment || "",
      preliminaryConclusion: mir.preliminaryConclusion || "",
      investigationStarted: mir.investigationStarted || false,
      investigationStartDate: mir.investigationStartDate ? new Date(mir.investigationStartDate) : null,
      preparedById: mir.preparedById || "",
      reviewedById: mir.reviewedById || "",
      approvedById: mir.approvedById || "",
    },
  });

  const onSubmit = async (data: InitialMIRFormValues) => {
    if (!isLockedByCurrentUser) {
      toast.error("You must lock the record to save changes.");
      return;
    }
    try {
      setIsSaving(true);
      await updateInitialMIR(mir.id, data);
      toast.success("Initial MIR updated successfully.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update Initial MIR");
    } finally {
      setIsSaving(false);
    }
  };

  const isReadOnly = !isLockedByCurrentUser;

  return (
    <div className="space-y-8 pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Initial Manufacturer Incident Report (MIR)
          </h2>
          <p className="text-muted-foreground mt-1">
            Complaint: {complaintNumber}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLocked ? (
            isLockedByCurrentUser ? (
              <Button
                variant="outline"
                className="gap-2 bg-muted/50 border-destructive/20 text-destructive hover:bg-destructive/10"
                onClick={releaseLock}
              >
                <LockOpen className="h-4 w-4" />
                Release Lock
              </Button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Locked by {lockOwner}
                </span>
              </div>
            )
          ) : (
            <Button variant="outline" className="gap-2" onClick={requestLock}>
              <Lock className="h-4 w-4" />
              Lock to Edit
            </Button>
          )}

          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={!isLockedByCurrentUser || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* MAIN FORM */}
        <div className="md:col-span-2 space-y-8">
          <form id="initial-mir-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* 1. REPORT IDENTIFICATION */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-foreground">1. Report Identification</h3>
                <p className="text-sm text-muted-foreground">Basic identifiers for this report submission.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>MIR Number</Label>
                  <Input {...form.register("mirNumber")} disabled={isReadOnly} placeholder="E.g., MIR-2026-001" />
                </div>
                <div className="space-y-2">
                  <Label>Manufacturer Reference</Label>
                  <Input {...form.register("manufacturerReference")} disabled={isReadOnly} />
                </div>
              </div>
            </div>

            {/* 4. SUBMISSION INFORMATION */}
            <div className="space-y-6 pt-6 border-t">
              <div>
                <h3 className="text-lg font-medium text-foreground">4. Submission Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Competent Authority</Label>
                  <Input {...form.register("competentAuthority")} disabled={isReadOnly} />
                </div>
                <div className="space-y-2">
                  <Label>Competent Authority Reference</Label>
                  <Input {...form.register("competentAuthorityReference")} disabled={isReadOnly} />
                </div>
                <div className="space-y-2">
                  <Label>Submission Country</Label>
                  <Input {...form.register("submissionCountry")} disabled={isReadOnly} />
                </div>
                <div className="space-y-2">
                  <Label>Submission Method</Label>
                  <Input {...form.register("submissionMethod")} disabled={isReadOnly} />
                </div>
                <div className="space-y-2 flex flex-col mt-2">
                  <Label className="mb-2">Due Date</Label>
                  <Controller
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <DatePicker
                        date={field.value || undefined}
                        setDate={field.onChange}
                        disabled={isReadOnly}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2 flex flex-col mt-2">
                  <Label className="mb-2">Submission Date</Label>
                  <Controller
                    control={form.control}
                    name="submissionDate"
                    render={({ field }) => (
                      <DatePicker
                        date={field.value || undefined}
                        setDate={field.onChange}
                        disabled={isReadOnly}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* 17. INITIAL ASSESSMENT */}
            <div className="space-y-6 pt-6 border-t">
              <div>
                <h3 className="text-lg font-medium text-foreground">17. Initial Manufacturer Assessment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Initial Device Relatedness</Label>
                  <Input {...form.register("initialDeviceRelatedness")} disabled={isReadOnly} />
                </div>
                <div className="space-y-2">
                  <Label>Initial Causality Assessment</Label>
                  <Input {...form.register("initialCausalityAssessment")} disabled={isReadOnly} />
                </div>
                <div className="space-y-2">
                  <Label>Initial Seriousness Assessment</Label>
                  <Input {...form.register("initialSeriousnessAssessment")} disabled={isReadOnly} />
                </div>
                <div className="space-y-2">
                  <Label>Initial Risk Assessment</Label>
                  <Input {...form.register("initialRiskAssessment")} disabled={isReadOnly} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preliminary Conclusion</Label>
                <Textarea {...form.register("preliminaryConclusion")} disabled={isReadOnly} className="min-h-[100px]" />
              </div>
            </div>
            
          </form>
        </div>

        {/* SIDEBAR */}
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
fs.writeFileSync('components/initial-mir-form.tsx', content);
