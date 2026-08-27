"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { SIGNATURE_MEANINGS } from "@/lib/constants/status-transitions";
import {
  executeStatusTransition,
  type StatusTransitionResult,
} from "@/lib/actions/esignature";
import type { EntityType } from "@/lib/constants/status-transitions";

interface ESignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  entityId: string;
  currentStatus: string;
  targetStatus: string;
  targetStatusLabel: string;
  onSuccess?: (newStatus: string) => void;
}

export function ESignatureModal({
  open,
  onOpenChange,
  entityType,
  entityId,
  currentStatus,
  targetStatus,
  targetStatusLabel,
  onSuccess,
}: ESignatureModalProps) {
  const [state, setState] = React.useState<StatusTransitionResult | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (open) {
      setState(null);
      setIsPending(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setState(null);

    const formData = new FormData(e.currentTarget);
    formData.set("entityType", entityType);
    formData.set("entityId", entityId);
    formData.set("newStatus", targetStatus);

    try {
      const result = await executeStatusTransition(null, formData);
      setState(result);

      if (result.success) {
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.(targetStatus);
        }, 800);
      }
    } catch {
      setState({
        success: false,
        error: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Electronic Signature Required
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Action description */}
        <div className="rounded-md bg-muted/50 border px-4 py-3 mt-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            You are approving a status change on this{" "}
            <span className="font-medium text-foreground">{entityType}</span>{" "}
            record:
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center rounded-md bg-background px-2.5 py-1 text-xs font-medium border shadow-sm">
              {currentStatus.replace(/_/g, " ")}
            </span>
            <span className="text-muted-foreground text-xs">→</span>
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary border border-primary/20 shadow-sm">
              {targetStatusLabel}
            </span>
          </div>
        </div>

        {/* Error display */}
        {state?.error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 flex items-start gap-2.5 mt-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive leading-relaxed">
              {state.error}
            </p>
          </div>
        )}

        {/* Success display */}
        {state?.success && (
          <div className="rounded-md bg-green-500/10 border border-green-500/20 px-4 py-3 mt-2">
            <p className="text-xs text-green-600 dark:text-green-400 leading-relaxed flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Electronic signature verified. Status updated successfully.
            </p>
          </div>
        )}

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Meaning of Signature */}
          <div className="space-y-2">
            <Label htmlFor="meaningOfSignature" className="text-xs">
              Meaning of Signature <span className="text-destructive">*</span>
            </Label>
            <select
              id="meaningOfSignature"
              name="meaningOfSignature"
              required
              disabled={isPending || state?.success === true}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue=""
            >
              <option value="" disabled>
                Select meaning of signature…
              </option>
              {SIGNATURE_MEANINGS.map((meaning) => (
                <option key={meaning} value={meaning}>
                  {meaning}
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs">
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              disabled={isPending || state?.success === true}
              placeholder="Re-enter your password to sign"
              className="h-9"
            />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Your password is used solely for identity verification and is not
              stored. This constitutes an electronic signature.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || state?.success === true}
              className="gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : state?.success ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Signed
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Sign & Execute
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
