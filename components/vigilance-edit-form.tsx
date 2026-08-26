"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldAlert, Save } from "lucide-react";
import { VigilanceStatus, VigilanceReportabilityDecision, VigilanceReportType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@clerk/nextjs";
import { updateVigilance } from "@/lib/actions/vigilance";
import { FileUploader } from "@/components/file-uploader";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const formSchema = z.object({
  status: z.nativeEnum(VigilanceStatus),
  reportable: z.boolean(),
  decision: z.string().optional().nullable(),
  reportType: z.string().optional().nullable(),
  targetRegion: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  approverId: z.string().optional().nullable(),
  awarenessDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  rationale: z.string().optional().nullable(),
  cancelledRationale: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  attachments: z.array(z.any()),
});

type FormValues = z.infer<typeof formSchema>;

export function VigilanceEditForm({
  orgSlug,
  complaintNumber,
  vigilance,
}: any) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { memberships } = useOrganization({
    memberships: {
      pageSize: 100,
      keepPreviousData: true,
    },
  });

  const toDateString = (isoString?: string | null) => isoString ? new Date(isoString).toISOString().split('T')[0] : "";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: vigilance.status || VigilanceStatus.PENDING,
      reportable: vigilance.reportable || false,
      decision: vigilance.decision || "",
      reportType: vigilance.reportType || "",
      targetRegion: vigilance.targetRegion || "",
      ownerId: vigilance.ownerId || "",
      approverId: vigilance.approverId || "",
      awarenessDate: toDateString(vigilance.awarenessDate),
      dueDate: toDateString(vigilance.dueDate),
      rationale: vigilance.rationale || "",
      cancelledRationale: vigilance.cancelledRationale || "",
      notes: vigilance.notes || "",
      attachments: vigilance.attachments?.map((a: any) => ({
        fileUrl: a.fileUrl,
        fileName: a.fileName,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
      })) || [],
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateVigilance({
        id: vigilance.id,
        orgSlug,
        ...data,
        decision: data.decision || null,
        reportType: data.reportType || null,
        newAttachments: data.attachments.filter(a => !vigilance.attachments?.some((ea: any) => ea.fileUrl === a.fileUrl)),
      });

      toast.success("Success", { description: "Vigilance details saved successfully." });
      router.refresh();
    } catch (err: any) {
      console.error("[Vigilance Update Error]", err);
      setError(err?.message || "Failed to save vigilance details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex justify-center py-6 px-4">
      <div className="w-full max-w-5xl space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/complaints">Complaints</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/complaints/${vigilance.complaintId}`}>{complaintNumber}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Vigilance Decision Tree</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Vigilance: {complaintNumber}</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage reportability decisions and regulatory tracking</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
             <span className="font-semibold block">Error</span>
             {error}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <select
                  {...form.register("status")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                >
                  <option value="PENDING">Pending</option>
                  <option value="REPORTABLE">Reportable</option>
                  <option value="NOT_REPORTABLE">Not Reportable</option>
                  <option value="SUBMITTED">Submitted</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2 pt-8">
                <input 
                  type="checkbox"
                  id="reportable"
                  {...form.register("reportable")}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="reportable" className="font-medium">Is this event reportable?</Label>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Decision</Label>
                <select
                  {...form.register("decision")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select...</option>
                  <option value="NON_REPORTABLE">Non-Reportable</option>
                  <option value="REPORTABLE_30_DAY">30 Day Reportable</option>
                  <option value="REPORTABLE_15_DAY">15 Day Reportable</option>
                  <option value="REPORTABLE_5_DAY">5 Day Reportable</option>
                  <option value="REPORTABLE_OTHER">Other</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Report Type</Label>
                <select
                  {...form.register("reportType")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select...</option>
                  <option value="INITIAL">Initial</option>
                  <option value="FOLLOW_UP">Follow-Up</option>
                  <option value="FINAL">Final</option>
                  <option value="COMBINED_INITIAL_FINAL">Combined Initial & Final</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Target Region</Label>
                <Input {...form.register("targetRegion")} placeholder="e.g. US FDA, EU MDR" />
              </div>

              <div className="space-y-2"></div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Owner</Label>
                <select
                  {...form.register("ownerId")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {memberships?.data?.map((m) => {
                    const first = m.publicUserData?.firstName;
                    const last = m.publicUserData?.lastName;
                    const identifier = m.publicUserData?.identifier;
                    const name = first || last ? `${first || ''} ${last || ''}`.trim() : (identifier ? identifier.split('@')[0] : 'Unknown User');
                    return (
                      <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Approver</Label>
                <select
                  {...form.register("approverId")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {memberships?.data?.map((m) => {
                    const first = m.publicUserData?.firstName;
                    const last = m.publicUserData?.lastName;
                    const identifier = m.publicUserData?.identifier;
                    const name = first || last ? `${first || ''} ${last || ''}`.trim() : (identifier ? identifier.split('@')[0] : 'Unknown User');
                    return (
                      <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Awareness Date</Label>
                <Input type="date" {...form.register("awarenessDate")} />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Due Date</Label>
                <Input type="date" {...form.register("dueDate")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Rationale</Label>
              <Textarea rows={4} {...form.register("rationale")} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Cancelled Rationale</Label>
              <Textarea rows={2} {...form.register("cancelledRationale")} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea rows={2} {...form.register("notes")} />
            </div>
            
            <div className="space-y-1.5 pt-4">
              <Label className="text-sm font-medium">Attachments</Label>
              <Controller
                control={form.control}
                name="attachments"
                render={({ field }) => (
                  <FileUploader 
                    attachments={field.value} 
                    onChange={field.onChange} 
                  />
                )}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting} className="gap-2 bg-neutral-900 text-white hover:bg-neutral-800">
              <Save className="h-4 w-4" /> Save Vigilance
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
