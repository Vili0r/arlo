"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ListTodo,
  Save,
  Loader2,
  Calendar,
  User as UserIcon,
  Tag,
  FolderTree,
  FileText,
} from "lucide-react";
import {
  TaskStatus,
  TaskType,
  TaskSubType,
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
import { useOrganization } from "@clerk/nextjs";
import { FileUploader } from "@/components/file-uploader";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { StatusTransitionTracker } from "@/components/status-transition-tracker";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { createComplaintTask, updateComplaintTask } from "@/lib/actions/task";

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  [TaskType.CORRECTION]: "Correction",
  [TaskType.CUSTOMER_FOLLOW_UP]: "Customer Follow-Up",
  [TaskType.INTERNAL_FOLLOW_UP]: "Internal Follow-Up",
  [TaskType.REGULATORY_TASK]: "Regulatory Task",
};

export const TASK_SUB_TYPE_LABELS: Record<TaskSubType, string> = {
  [TaskSubType.RISK_REVIEW]: "Risk Review",
  [TaskSubType.COMPLAINT_HISTORY_REVIEW]: "Complaint History Review",
  [TaskSubType.HAZARD_DECISION_INVESTIGATION_FOLLOW_UP]: "Hazard Decision Investigation Follow-Up",
  [TaskSubType.MANUFACTURING_DEFECT_IDENTIFIED]: "Manufacturing Defect Identified",
  [TaskSubType.COMPLAINT_HISTORY_REVIEW_IDENTIFIED_ISSUE]: "Complaint History Review Identified Issue",
  [TaskSubType.DESIGN_ISSUE_DETECTED]: "Design Issue Detected",
  [TaskSubType.OTHER]: "Other",
};

const taskFormSchema = z
  .object({
    shortDescription: z.string().min(1, "Short description is required"),
    taskDescription: z.string().optional().nullable(),
    taskType: z.nativeEnum(TaskType),
    taskSubType: z.nativeEnum(TaskSubType).optional().nullable(),
    assignedToId: z.string().optional().nullable(),
    dateDue: z.string().optional().nullable(),
    status: z.nativeEnum(TaskStatus),
    attachments: z.array(z.any()),
  })
  .refine(
    (data) => {
      if (data.taskType === TaskType.INTERNAL_FOLLOW_UP) {
        return !!data.taskSubType;
      }
      return true;
    },
    {
      message: "Sub-Type is required for Internal Follow-up tasks",
      path: ["taskSubType"],
    }
  );

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export interface ComplaintTaskData {
  id?: string;
  complaintId: string;
  shortDescription?: string;
  taskDescription?: string | null;
  taskType?: TaskType;
  taskSubType?: TaskSubType | null;
  assignedToId?: string | null;
  originatorId?: string;
  dateOfRequest?: Date | string;
  dateDue?: Date | string | null;
  status?: TaskStatus;
  originator?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  assignedTo?: {
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

interface ComplaintTaskFormProps {
  orgSlug: string;
  complaintId: string;
  complaintNumber: string;
  task?: ComplaintTaskData | null;
}

export function ComplaintTaskForm({
  orgSlug,
  complaintId,
  complaintNumber,
  task,
}: ComplaintTaskFormProps) {
  const router = useRouter();
  const isNew = !task?.id;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { memberships } = useOrganization({
    memberships: {
      pageSize: 100,
      keepPreviousData: true,
    },
  });

  const toDateString = (isoString?: Date | string | null) =>
    isoString ? new Date(isoString).toISOString().split("T")[0] : "";

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      shortDescription: task?.shortDescription || "",
      taskDescription: task?.taskDescription || "",
      taskType: task?.taskType || TaskType.CORRECTION,
      taskSubType: task?.taskSubType || null,
      assignedToId: task?.assignedToId || "",
      dateDue: toDateString(task?.dateDue),
      status: task?.status || TaskStatus.OPEN,
      attachments:
        task?.attachments?.map((a) => ({
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
        })) || [],
    },
  });

  const selectedTaskType = form.watch("taskType");
  const currentStatus = form.watch("status");

  // Reset taskSubType when taskType is changed from INTERNAL_FOLLOW_UP
  React.useEffect(() => {
    if (selectedTaskType !== TaskType.INTERNAL_FOLLOW_UP) {
      form.setValue("taskSubType", null);
    }
  }, [selectedTaskType, form]);

  const onSubmit = async (data: TaskFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isNew) {
        const created = await createComplaintTask({
          orgSlug,
          complaintId,
          shortDescription: data.shortDescription,
          taskDescription: data.taskDescription || null,
          taskType: data.taskType,
          taskSubType:
            data.taskType === TaskType.INTERNAL_FOLLOW_UP
              ? data.taskSubType || null
              : null,
          assignedToId: data.assignedToId || null,
          dateDue: data.dateDue ? new Date(data.dateDue) : null,
          status: data.status,
          attachments: data.attachments,
        });

        toast.success("Task Created", {
          description: `Task "${created.shortDescription}" created successfully.`,
        });
        router.push(`/${orgSlug}/complaints/${complaintId}`);
        router.refresh();
      } else {
        const existingUrls = new Set(
          task.attachments?.map((ea) => ea.fileUrl) || []
        );
        const newAttachments = data.attachments.filter(
          (a: { fileUrl: string }) => !existingUrls.has(a.fileUrl)
        );

        await updateComplaintTask({
          id: task.id!,
          orgSlug,
          shortDescription: data.shortDescription,
          taskDescription: data.taskDescription || null,
          taskType: data.taskType,
          taskSubType:
            data.taskType === TaskType.INTERNAL_FOLLOW_UP
              ? data.taskSubType || null
              : null,
          assignedToId: data.assignedToId || null,
          dateDue: data.dateDue ? new Date(data.dateDue) : null,
          status: data.status,
          newAttachments:
            newAttachments.length > 0 ? newAttachments : undefined,
        });

        toast.success("Task Saved", {
          description: "Task details and audit logs updated successfully.",
        });
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("[ComplaintTask Form Error]", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save task.";
      setError(errorMessage);
      toast.error("Save Failed", { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const complaintsHref = `/${orgSlug}/complaints`;
  const complaintHref = `/${orgSlug}/complaints/${complaintId}`;

  return (
    <div className="w-full flex justify-center py-6 px-4">
      <div className="w-full max-w-5xl space-y-6">
        {/* Breadcrumbs matching Vigilance aesthetic */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={complaintsHref}>Complaints</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={complaintHref}>
                {complaintNumber || complaintId}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isNew ? "New Task" : task.shortDescription || "Task Detail"}
              </BreadcrumbPage>
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
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <ListTodo className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl font-bold text-foreground">
                      {isNew ? "Create Ad-Hoc Task" : `Task: ${task.shortDescription}`}
                    </CardTitle>
                    {!isNew && (
                      <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted border border-border">
                        {complaintNumber}
                      </span>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    Sub-workflow task delegation attached directly to complaint {complaintNumber}
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isNew && task?.id && (
                  <StatusTransitionTracker
                    entityType="ComplaintTask"
                    entityId={task.id}
                    currentStatus={currentStatus}
                    onStatusChanged={(newStatus) => {
                      form.setValue("status", newStatus as TaskStatus);
                      router.refresh();
                    }}
                  />
                )}
              </div>
            </div>
          </CardHeader>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-6">
              {/* Short Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>Short Description</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...form.register("shortDescription")}
                  placeholder="e.g. Conduct batch retention inspection, Customer replacement follow-up..."
                />
                {form.formState.errors.shortDescription && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.shortDescription.message}
                  </p>
                )}
              </div>

              {/* Grid for Task Type, Sub-Type, Status, Assignee, Due Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Task Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    <span>Task Type</span>
                    <span className="text-destructive">*</span>
                  </Label>
                  <select
                    {...form.register("taskType")}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value={TaskType.CORRECTION}>Correction</option>
                    <option value={TaskType.CUSTOMER_FOLLOW_UP}>Customer Follow-Up</option>
                    <option value={TaskType.INTERNAL_FOLLOW_UP}>Internal Follow-Up</option>
                    <option value={TaskType.REGULATORY_TASK}>Regulatory Task</option>
                  </select>
                </div>

                {/* Conditional Task SubType (Only rendered when TaskType is INTERNAL_FOLLOW_UP) */}
                {selectedTaskType === TaskType.INTERNAL_FOLLOW_UP ? (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <FolderTree className="h-3.5 w-3.5 text-primary" />
                      <span>Internal Follow-Up Sub-Type</span>
                      <span className="text-destructive">*</span>
                    </Label>
                    <select
                      {...form.register("taskSubType")}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Select Sub-Type...</option>
                      <option value={TaskSubType.RISK_REVIEW}>Risk Review</option>
                      <option value={TaskSubType.COMPLAINT_HISTORY_REVIEW}>
                        Complaint History Review
                      </option>
                      <option value={TaskSubType.HAZARD_DECISION_INVESTIGATION_FOLLOW_UP}>
                        Hazard Decision Investigation Follow-Up
                      </option>
                      <option value={TaskSubType.MANUFACTURING_DEFECT_IDENTIFIED}>
                        Manufacturing Defect Identified
                      </option>
                      <option value={TaskSubType.COMPLAINT_HISTORY_REVIEW_IDENTIFIED_ISSUE}>
                        Complaint History Review Identified Issue
                      </option>
                      <option value={TaskSubType.DESIGN_ISSUE_DETECTED}>
                        Design Issue Detected
                      </option>
                      <option value={TaskSubType.OTHER}>Other</option>
                    </select>
                    {form.formState.errors.taskSubType && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.taskSubType.message}
                      </p>
                    )}
                  </div>
                ) : (
                  /* Status display when not showing SubType */
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted/40 text-sm gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          currentStatus === TaskStatus.CLOSED
                            ? "bg-emerald-500"
                            : currentStatus === TaskStatus.IN_PROGRESS
                            ? "bg-blue-500"
                            : "bg-amber-500"
                        )}
                      />
                      <span className="font-medium text-foreground">
                        {currentStatus.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-auto font-mono">
                        {isNew ? "Initial State" : "Controlled lifecycle"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Assigned To User Select */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Assigned To</span>
                  </Label>
                  <select
                    {...form.register("assignedToId")}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Unassigned</option>
                    {memberships?.data?.map((m) => {
                      const first = m.publicUserData?.firstName;
                      const last = m.publicUserData?.lastName;
                      const identifier = m.publicUserData?.identifier;
                      const name =
                        first || last
                          ? `${first || ""} ${last || ""}`.trim()
                          : identifier
                          ? identifier.split("@")[0]
                          : "Unknown User";
                      return (
                        <option
                          key={m.publicUserData?.userId || m.id}
                          value={m.publicUserData?.userId || ""}
                        >
                          {name} {identifier ? `(${identifier})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Due Date</span>
                  </Label>
                  <Input
                    type="date"
                    {...form.register("dateDue")}
                  />
                </div>
              </div>

              {/* Task Description Textarea */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Task Description & Instructions</Label>
                <Textarea
                  rows={4}
                  {...form.register("taskDescription")}
                  placeholder="Provide detailed instructions, expected outputs, testing protocols, or follow-up notes..."
                />
                <span className="text-[11px] text-muted-foreground block">
                  Detailed delegation instructions visible to the assignee and captured in the 21 CFR Part 11 audit record.
                </span>
              </div>

              {/* Attachments Section */}
              <div className="space-y-1.5 pt-4 border-t border-border mb-6">
                <Label className="text-sm font-medium">Task Attachments & Evidence</Label>
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
                  Upload files, inspection reports, or corrective evidence linked directly to this Task ID.
                </span>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 border-t border-border pt-4 pb-4">
              <Link
                href={complaintHref}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Cancel
              </Link>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>{isNew ? "Creating Task..." : "Saving Task..."}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" />
                    <span>{isNew ? "Create Task" : "Save Task"}</span>
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
