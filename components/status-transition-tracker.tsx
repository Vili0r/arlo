"use client";

import * as React from "react";
import { Check, ChevronDown, ArrowRight, RotateCcw, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  getStatusConfig,
  getStepConfig,
  getNextStatuses,
  getPreviousStatuses,
  getCancelStepConfig,
  canCancelStatus,
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

function formatEntityLabel(entityType: EntityType): string {
  switch (entityType) {
    case "Complaint":
      return "Complaint";
    case "Investigation":
      return "Investigation";
    case "Vigilance":
      return "Vigilance Assessment";
    case "CustomerCommunication":
      return "Communication";
    case "ComplaintTask":
      return "Task";
    case "Capa":
      return "CAPA";
    default:
      return entityType;
  }
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
  const [isReverting, setIsReverting] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);

  const config = getStatusConfig(entityType);
  const nextStatuses = getNextStatuses(entityType, currentStatus);
  const previousStatuses = getPreviousStatuses(entityType, currentStatus);
  const currentStepConfig = getStepConfig(entityType, currentStatus);
  const canCancel = canCancelStatus(currentStatus);

  const mainSteps = config.steps.filter((s) => !s.isBranch);
  const isBranchStatus = currentStepConfig?.isBranch;
  const currentIndex = mainSteps.findIndex((s) => s.value === currentStatus);

  function handleAdvanceClick(target: StatusStepConfig, isRevert: boolean = false) {
    setSelectedTarget(target);
    setIsReverting(isRevert);
    setIsCancelling(false);
    setModalOpen(true);
  }

  function handleCancelClick() {
    const cancelTarget = getCancelStepConfig(entityType);
    setSelectedTarget(cancelTarget);
    setIsReverting(false);
    setIsCancelling(true);
    setModalOpen(true);
  }

  function handleSignatureSuccess(newStatus: string) {
    setSelectedTarget(null);
    setIsReverting(false);
    setIsCancelling(false);
    onStatusChanged?.(newStatus);
  }

  const hasActions =
    previousStatuses.length > 0 || nextStatuses.length > 0 || canCancel;

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      {/* Horizontal Stepper or Branch Badge */}
      {isBranchStatus ? (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/80 border text-xs">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              currentStepConfig?.color || "bg-muted-foreground"
            )}
          />
          <span className="font-semibold text-foreground">
            {currentStepConfig?.label || currentStatus.replace(/_/g, " ")}
          </span>
        </div>
      ) : (
        <>
          {/* Mobile view (< md): Only show current state */}
          <div className="flex lg:hidden items-center gap-2 px-2.5 py-1 rounded-md bg-muted/80 border border-border text-xs shrink-0">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                currentStepConfig?.color || "bg-primary"
              )}
            />
            <span className="font-semibold text-foreground">
              {currentStepConfig?.label || currentStatus.replace(/_/g, " ")}
            </span>
          </div>

          {/* Desktop / Tablet view (>= md): Full horizontal stepper */}
          <div className="hidden lg:flex items-center gap-1 sm:gap-1.5 flex-nowrap shrink-0">
            {mainSteps.map((step, index) => {
              const isCompleted = currentIndex > index;
              const isCurrent = step.value === currentStatus;
              const isFuture = currentIndex < index;

              return (
                <React.Fragment key={step.value}>
                  <div className="flex items-center gap-1 sm:gap-1.5 group relative shrink-0">
                    {/* Dot */}
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] transition-all shrink-0",
                        isCompleted && "bg-primary text-primary-foreground",
                        isCurrent &&
                          "border border-primary bg-primary/10 text-primary font-bold",
                        isFuture && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>

                    {/* Label: Full label for current stage, gracefully truncated for non-current stages */}
                    <span
                      title={step.label}
                      className={cn(
                        "text-xs font-medium transition-all",
                        isCompleted && "text-foreground",
                        isCurrent && "text-primary font-semibold max-w-[140px]",
                        isFuture && "text-muted-foreground",
                        !isCurrent && "max-w-[46px] sm:max-w-[56px] md:max-w-[64px] truncate"
                      )}
                    >
                      {step.label}
                    </span>

                    {/* Tooltip on hover */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded bg-popover border text-popover-foreground text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-md">
                      <span className="font-semibold">{step.label}</span>
                      {step.description && <span className="block text-[9px] text-muted-foreground">{step.description}</span>}
                    </div>
                  </div>

                  {/* Connector line — compact and responsive */}
                  {index < mainSteps.length - 1 && (
                    <div
                      className={cn(
                        "h-px w-2 sm:w-3 transition-all",
                        currentIndex > index ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </>
      )}

      {/* Unified Action Dropdown Menu */}
      {hasActions && (
        <div className="flex items-center border-l pl-2 sm:pl-3 border-border shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shadow-sm transition-colors cursor-pointer"
            >
              <span>Action</span>
              <ChevronDown className="h-3 w-3 opacity-80" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1">
              {nextStatuses.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                    Advance Stage
                  </DropdownMenuLabel>
                  {nextStatuses.map((target) => (
                    <DropdownMenuItem
                      key={`advance-${target.value}`}
                      onClick={() => handleAdvanceClick(target, false)}
                      className="cursor-pointer gap-2 px-2 py-1.5 text-xs font-medium"
                    >
                      <ArrowRight className="h-3.5 w-3.5 text-primary" />
                      <span>Move to {target.label}</span>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {nextStatuses.length > 0 && previousStatuses.length > 0 && (
                <DropdownMenuSeparator className="my-1" />
              )}

              {previousStatuses.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                    Revert Stage
                  </DropdownMenuLabel>
                  {previousStatuses.map((target) => (
                    <DropdownMenuItem
                      key={`revert-${target.value}`}
                      onClick={() => handleAdvanceClick(target, true)}
                      className="cursor-pointer gap-2 px-2 py-1.5 text-xs font-medium text-foreground"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Revert to {target.label}</span>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {canCancel && (
                <>
                  {(nextStatuses.length > 0 || previousStatuses.length > 0) && (
                    <DropdownMenuSeparator className="my-1" />
                  )}
                  <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-destructive px-2 py-1">
                    Cancel Record
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    key="action-cancel"
                    onClick={handleCancelClick}
                    className="cursor-pointer gap-2 px-2 py-1.5 text-xs font-medium text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Ban className="h-3.5 w-3.5 text-destructive" />
                    <span>Cancel {formatEntityLabel(entityType)}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
          isRevert={isReverting}
          isCancel={isCancelling}
          onSuccess={handleSignatureSuccess}
        />
      )}
    </div>
  );
}
