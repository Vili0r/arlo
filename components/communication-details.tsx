"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  MessageSquare,
  Save,
  MoreVertical,
  Clock4,
  AlertCircle,
  CheckCircle2,
  History,
  Lock,
  Loader2,
} from "lucide-react";
import {
  CommunicationStatus,
} from "@prisma/client";
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
import { FileUploader } from "@/components/file-uploader";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn, formatUserName } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { StatusTransitionTracker } from "@/components/status-transition-tracker";
import { updateCustomerCommunication } from "@/lib/actions/communication";
import { AuditHistoryDrawer } from "@/components/audit/audit-history-drawer";
import type { AttachmentInput } from "@/lib/actions/complaints";

const formSchema = z.object({
  status: z.nativeEnum(CommunicationStatus),
  communicationDate: z.string().optional().nullable(),
  questionAsked: z.string().optional().nullable(),
  customerResponse: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  attachments: z.array(z.any()),
});

type FormValues = z.infer<typeof formSchema>;

export interface CommunicationDetailData {
  id: string;
  complaintId: string;
  communicationDate: Date | string;
  status: CommunicationStatus;
  questionAsked: string | null;
  customerResponse: string | null;
  internalNotes: string | null;
  authorId: string;
  author?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  attachments?: Array<{
    id?: string;
    fileUrl: string;
    fileName: string;
    fileSize?: number | null;
    mimeType?: string | null;
  }>;
}

interface CommunicationDetailProps {
  orgSlug?: string;
  complaintNumber?: string;
  communication: CommunicationDetailData;
  onUpdated?: (updated: CommunicationDetailData) => void;
}

export function CommunicationDetail({
  orgSlug,
  complaintNumber,
  communication: initialComm,
  onUpdated,
}: CommunicationDetailProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = React.useState(false);

  const toDateString = (isoString?: Date | string | null) =>
    isoString ? new Date(isoString).toISOString().split("T")[0] : "";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: initialComm.status || CommunicationStatus.OPEN,
      communicationDate: toDateString(initialComm.communicationDate),
      questionAsked: initialComm.questionAsked || "",
      customerResponse: initialComm.customerResponse || "",
      internalNotes: initialComm.internalNotes || "",
      attachments:
        initialComm.attachments?.map((a: any) => ({
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
        })) || [],
    },
  });

  const currentStatus = form.watch("status");
  const isClosed = currentStatus === CommunicationStatus.CLOSED;

  // Handle status changes via top-right dropdown action menu
  const handleStatusChange = async (newStatus: CommunicationStatus) => {
    if (newStatus === currentStatus || isStatusUpdating) return;
    setIsStatusUpdating(true);
    setError(null);

    try {
      const updated = await updateCustomerCommunication({
        communicationId: initialComm.id,
        status: newStatus,
        reason: `Status updated to ${newStatus}`,
      });

      form.setValue("status", newStatus);
      const transformed: CommunicationDetailData = {
        ...updated,
        communicationDate: updated.communicationDate.toISOString(),
      };
      onUpdated?.(transformed);

      toast.success("Status Updated", {
        description: `Communication status set to ${newStatus.replace("_", " ")}.`,
      });
      router.refresh();
    } catch (err: any) {
      console.error("[Status Update Error]", err);
      setError(err?.message || "Failed to update status.");
      toast.error("Status Update Failed", { description: err?.message });
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const existingUrls = new Set(
        initialComm.attachments?.map((ea: any) => ea.fileUrl) || []
      );
      const newAttachments = data.attachments.filter(
        (a: any) => !existingUrls.has(a.fileUrl)
      );

      const updated = await updateCustomerCommunication({
        communicationId: initialComm.id,
        status: data.status,
        communicationDate: data.communicationDate
          ? new Date(data.communicationDate)
          : undefined,
        questionAsked: data.questionAsked || null,
        customerResponse: data.customerResponse || null,
        internalNotes: data.internalNotes || null,
        newAttachments: newAttachments.length > 0 ? newAttachments : undefined,
      });

      const transformed: CommunicationDetailData = {
        ...updated,
        communicationDate: updated.communicationDate.toISOString(),
      };
      onUpdated?.(transformed);

      toast.success("Success", {
        description: "Customer communication details saved successfully.",
      });
      router.refresh();
    } catch (err: any) {
      console.error("[Communication Update Error]", err);
      setError(err?.message || "Failed to save communication details.");
      toast.error("Save Failed", { description: err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const authorName = formatUserName(initialComm.author, "Unknown User");

  const complaintsHref = orgSlug ? `/${orgSlug}/complaints` : "/complaints";
  const complaintHref = orgSlug
    ? `/${orgSlug}/complaints/${initialComm.complaintId}`
    : `/complaints/${initialComm.complaintId}`;

  return (
    <div className="w-full flex justify-center py-6 px-4">
      <div className="w-full max-w-7xl space-y-6">
        {/* Breadcrumb matching Vigilance pattern */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={complaintsHref}>Complaints</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={complaintHref}>
                {complaintNumber || initialComm.complaintId}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Customer Follow-up Log</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
            <span className="font-semibold block">Error</span>
            {error}
          </div>
        )}

        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border pb-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">
                    Customer Follow-up: {complaintNumber || initialComm.complaintId}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Manage customer communications, inquiries, replies, and follow-up evidence
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center">
                <StatusTransitionTracker
                  entityType="CustomerCommunication"
                  entityId={initialComm.id}
                  currentStatus={currentStatus}
                  onStatusChanged={(newStatus) => {
                    form.setValue("status", newStatus as CommunicationStatus);
                    router.refresh();
                  }}
                />
              </div>
            </div>
          </CardHeader>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              {/* Row 1: Status (first half) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Display Box */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted/40 text-sm gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        currentStatus === CommunicationStatus.CLOSED
                          ? "bg-emerald-500"
                          : currentStatus === CommunicationStatus.IN_PROGRESS
                          ? "bg-purple-500"
                          : "bg-amber-500"
                      )}
                    />
                    <span className="font-medium text-foreground">
                      {currentStatus.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      Managed via status dropdown menu
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Communication Date & Logged By */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Communication Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Communication Date</Label>
                  <Input
                    type="date"
                    disabled={isClosed}
                    {...form.register("communicationDate")}
                    className="disabled:bg-muted/40 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Author / Logged By */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Logged By (Author)</Label>
                  <Input
                    value={authorName}
                    disabled
                    className="bg-muted/40 text-muted-foreground cursor-not-allowed text-sm"
                  />
                </div>
              </div>

              {/* Question Asked Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Question Asked / Manufacturer Request
                  </Label>
                  {isClosed && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                      <Lock className="h-3 w-3" /> Read-Only (Closed)
                    </span>
                  )}
                </div>
                <Textarea
                  rows={3}
                  disabled={isClosed}
                  {...form.register("questionAsked")}
                  placeholder="Log the specific question or clarification requested from the customer..."
                  className="disabled:bg-muted/30 disabled:cursor-not-allowed"
                />
                <span className="text-[11px] text-muted-foreground block">
                  Log the specific inquiry or request sent to the customer (e.g. lot number verification, usage details, defect photo).
                </span>
              </div>

              {/* Customer Response Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Customer Response / Clarification
                  </Label>
                  {isClosed && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                      <Lock className="h-3 w-3" /> Read-Only (Closed)
                    </span>
                  )}
                </div>
                <Textarea
                  rows={4}
                  disabled={isClosed}
                  {...form.register("customerResponse")}
                  placeholder="Record the customer's response or answers received..."
                  className="disabled:bg-muted/30 disabled:cursor-not-allowed"
                />
                <span className="text-[11px] text-muted-foreground block">
                  Capture the verbal or written reply provided by the customer.
                </span>
              </div>

              {/* Internal Notes Textarea */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Internal Notes</Label>
                <Textarea
                  rows={3}
                  {...form.register("internalNotes")}
                  placeholder="Internal commentary, investigator notes, follow-up next steps..."
                />
                <span className="text-[11px] text-muted-foreground block">
                  Internal context only.
                </span>
              </div>

              {/* Attachments Section */}
              <div className="space-y-1.5 pt-4 border-t border-border mb-6">
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
                <span className="text-[11px] text-muted-foreground block">
                  Upload customer correspondence, email exports, or photos linked directly to this communication record.
                </span>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 border-t border-border pt-4 pb-4">
              <Link
                href={complaintHref}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Cancel
              </Link>
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" />
                    <span>Save Communication</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* 21 CFR Part 11 Audit History Drawer */}
      <AuditHistoryDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        entityType="CustomerCommunication"
        entityId={initialComm.id}
        title="Customer Communication Audit History"
        subtitle={`Immutable 21 CFR Part 11 audit records for communication #${initialComm.id.slice(-8)}`}
        identifier={initialComm.id}
      />
    </div>
  );
}
