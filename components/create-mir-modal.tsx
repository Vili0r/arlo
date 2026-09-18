"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createMIR } from "@/lib/actions/mir";

interface CreateMirModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: {
    id: string;
    complaintNumber: string;
    shortDescription: string;
    deviceModel?: string | null;
    lotNumber?: string | null;
    initialMIR?: { status?: string } | null;
    finalMIR?: { status?: string } | null;
  } | null;
  orgSlug: string;
}

export function CreateMirModal({
  isOpen,
  onClose,
  complaint,
  orgSlug,
}: CreateMirModalProps) {
  const router = useRouter();
  const defaultType = complaint?.initialMIR && !complaint?.finalMIR ? "FINAL" : "INITIAL";
  const [selectedType, setSelectedType] = React.useState<"INITIAL" | "FINAL">(defaultType);
  const [prevId, setPrevId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Sync selected type when complaint changes
  if (complaint && complaint.id !== prevId) {
    setPrevId(complaint.id);
    setSelectedType(defaultType);
  }

  if (!complaint) return null;

  const handleCreate = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading(`Creating ${selectedType === "FINAL" ? "Final" : "Initial"} MIR...`);

    try {
      const res = await createMIR(complaint.id, selectedType, orgSlug);
      if (res && res.success) {
        toast.success(
          `${selectedType === "FINAL" ? "Final" : "Initial"} MIR created successfully!`,
          { id: toastId }
        );
        onClose();
        const targetPath =
          selectedType === "FINAL"
            ? `/${orgSlug}/complaints/${complaint.id}/final-mir`
            : `/${orgSlug}/complaints/${complaint.id}/initial-mir`;
        router.push(targetPath);
      } else {
        toast.error("Failed to create MIR record.", { id: toastId });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred while creating the MIR.";
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-background border border-border shadow-2xl rounded-xl">
        {/* Header */}
        <div className="p-6 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center border border-sky-500/20">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Create Manufacturer Incident Report (MIR)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Provision a statutory EU MDR / IVDR electronic reporting form for{" "}
                <span className="font-mono font-bold text-foreground">
                  {complaint.complaintNumber}
                </span>
              </DialogDescription>
            </div>
          </div>

          {(complaint.deviceModel || complaint.lotNumber) && (
            <div className="mt-2 text-[11px] font-mono text-muted-foreground bg-background/80 px-2.5 py-1 rounded border border-border/60">
              {complaint.deviceModel && <span>Model: {complaint.deviceModel}</span>}
              {complaint.deviceModel && complaint.lotNumber && <span> • </span>}
              {complaint.lotNumber && <span>Lot: {complaint.lotNumber}</span>}
            </div>
          )}
        </div>

        {/* Content & Options */}
        <div className="p-6 space-y-4">
          <div className="text-xs font-semibold text-foreground tracking-wide uppercase">
            Select Report Type
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Initial MIR Option */}
            <div
              onClick={() => !isSubmitting && setSelectedType("INITIAL")}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex flex-col gap-1.5 ${
                selectedType === "INITIAL"
                  ? "border-sky-500 bg-sky-500/5 shadow-xs"
                  : "border-border hover:border-border/80 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      selectedType === "INITIAL"
                        ? "border-sky-500 bg-sky-500"
                        : "border-muted-foreground"
                    }`}
                  >
                    {selectedType === "INITIAL" && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">Initial MIR</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-sky-500/10 text-sky-600 border-sky-500/20 font-mono"
                >
                  Article 87 Initial
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                Statutory first notification to Competent Authorities following initial reportability
                determination (mandatory 2, 10, 15, or 30 day submission timeline).
              </p>

              {complaint.initialMIR && (
                <div className="mt-1 ml-6 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>
                    Initial MIR already exists (Status: {complaint.initialMIR.status})
                  </span>
                </div>
              )}
            </div>

            {/* Final MIR Option */}
            <div
              onClick={() => !isSubmitting && setSelectedType("FINAL")}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex flex-col gap-1.5 ${
                selectedType === "FINAL"
                  ? "border-indigo-500 bg-indigo-500/5 shadow-xs"
                  : "border-border hover:border-border/80 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      selectedType === "FINAL"
                        ? "border-indigo-500 bg-indigo-500"
                        : "border-muted-foreground"
                    }`}
                  >
                    {selectedType === "FINAL" && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">Final MIR</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-mono"
                >
                  Investigation Closure
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                Comprehensive incident report submitted following complete root cause investigation,
                clinical risk evaluation, and corrective action implementation.
              </p>

              {complaint.finalMIR && (
                <div className="mt-1 ml-6 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>
                    Final MIR already exists (Status: {complaint.finalMIR.status})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/80 bg-muted/10 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Creating MIR...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Create {selectedType === "FINAL" ? "Final" : "Initial"} MIR</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
