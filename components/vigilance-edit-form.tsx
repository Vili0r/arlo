"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ShieldAlert, Save, Loader2 } from "lucide-react";
import { VigilanceStatus, VigilanceReportabilityDecision, VigilanceReportType } from "@prisma/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useOrganization } from "@clerk/nextjs";
import { updateVigilance } from "@/lib/actions/vigilance";
import { FileUploader } from "@/components/file-uploader";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { StatusTransitionTracker } from "@/components/status-transition-tracker";
import { cn, formatUserName } from "@/lib/utils";
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

  const currentStatus = form.watch("status");

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
      <div className="w-full max-w-7xl space-y-6">
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

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border pb-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Vigilance: {complaintNumber}</CardTitle>
                  <CardDescription className="mt-1">Manage reportability decisions and regulatory tracking</CardDescription>
                </div>
              </div>
              <div className="flex items-center">
                <StatusTransitionTracker
                  entityType="Vigilance"
                  entityId={vigilance.id}
                  currentStatus={currentStatus}
                  onStatusChanged={(newStatus) => {
                    form.setValue("status", newStatus as VigilanceStatus);
                    router.refresh();
                  }}
                />
              </div>
            </div>
          </CardHeader>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted/40 text-sm gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        currentStatus === VigilanceStatus.SUBMITTED
                          ? "bg-purple-500"
                          : currentStatus === VigilanceStatus.REPORTABLE
                          ? "bg-red-500"
                          : currentStatus === VigilanceStatus.NOT_REPORTABLE
                          ? "bg-green-500"
                          : "bg-zinc-500"
                      )}
                    />
                    <span className="font-medium text-foreground">
                      {currentStatus.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      Managed via e-signature stepper
                    </span>
                  </div>
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
                    {memberships?.data?.map((m) => (
                      <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                        {formatUserName(m.publicUserData, "User")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Approver</Label>
                  <select
                    {...form.register("approverId")}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Unassigned</option>
                    {memberships?.data?.map((m) => (
                      <option key={m.publicUserData?.userId || m.id} value={m.publicUserData?.userId || ""}>
                        {formatUserName(m.publicUserData, "User")}
                      </option>
                    ))}
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
              
              <div className="space-y-1.5 pt-4 mb-6">
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
            </CardContent>

            <CardFooter className="flex justify-end gap-3 border-t border-border pt-4 pb-4">
              <Link
                href={`/complaints/${vigilance.complaintId}`}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Cancel
              </Link>
              <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-[150px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1.5" /> Save Vigilance
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
