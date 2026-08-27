"use client";

import * as React from "react";
import { Check, ChevronRight, ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  getStatusConfig,
  getNextStatuses,
  type EntityType,
  type StatusStepConfig,
} from "@/lib/constants/status-transitions";
import { ESignatureModal } from "@/components/e-signature-modal";

interface StatusTransitionTrackerProps {
  entityType: EntityType;
  entityId: string;
  currentStatus: string;
  onStatusChanged?: (newStatus: string) => void;
}

export function StatusTransitionTracker({
  entityType,
  entityId,
  currentStatus,
  onStatusChanged,
}: StatusTransitionTrackerProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedTarget, setSelectedTarget] =
    React.useState<StatusStepConfig | null>(null);

  const config = getStatusConfig(entityType);
  const nextStatuses = getNextStatuses(entityType, currentStatus);

  const mainSteps = config.steps.filter((s) => s.value !== "REOPENED");
  const currentIndex = mainSteps.findIndex((s) => s.value === currentStatus);

  function handleAdvanceClick(target: StatusStepConfig) {
    setSelectedTarget(target);
    setModalOpen(true);
  }

  function handleSignatureSuccess(newStatus: string) {
    setSelectedTarget(null);
    onStatusChanged?.(newStatus);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Horizontal Stepper */}
      <div className="flex items-center gap-1.5">
        {mainSteps.map((step, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = step.value === currentStatus;
          const isFuture = currentIndex < index;

          return (
            <React.Fragment key={step.value}>
              <div className="flex items-center gap-1.5 group relative">
                {/* Dot */}
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] transition-all",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "border border-primary bg-primary/10 text-primary font-bold",
                    isFuture && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium max-w-[100px] truncate",
                    isCompleted && "text-foreground",
                    isCurrent && "text-primary font-semibold",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>

                {/* Tooltip on hover */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded bg-popover border text-popover-foreground text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-md">
                  {step.description}
                </div>
              </div>

              {/* Connector line */}
              {index < mainSteps.length - 1 && (
                <div
                  className={cn(
                    "h-px w-4 transition-all",
                    currentIndex > index ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Action Buttons */}
      {nextStatuses.length > 0 && (
        <div className="flex items-center gap-2 border-l pl-4 border-border">
          {nextStatuses.map((target) => (
            <Button
              key={target.value}
              size="xs"
              variant="default"
              onClick={() => handleAdvanceClick(target)}
              className="gap-1 h-6"
            >
              {nextStatuses.length === 1 ? (
                <>
                  Move to {target.label}
                  <ArrowRight className="h-3 w-3" />
                </>
              ) : (
                <>
                  <ChevronRight className="h-3 w-3" />
                  {target.label}
                </>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Terminal state indicator */}
      {nextStatuses.length === 0 && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground border-l pl-4 border-border">
          <Lock className="h-3 w-3" />
          Terminal Status
        </div>
      )}

      {/* E-Signature Modal */}
      {selectedTarget && (
        <ESignatureModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          entityType={entityType}
          entityId={entityId}
          currentStatus={currentStatus}
          targetStatus={selectedTarget.value}
          targetStatusLabel={selectedTarget.label}
          onSuccess={handleSignatureSuccess}
        />
      )}
    </div>
  );
}
