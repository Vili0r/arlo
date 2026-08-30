"use client";

import React, { useCallback } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { ShieldAlert, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOTAL_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes
const WARNING_DURATION_MS = 2 * 60 * 1000; // 2 Minutes Warning

export function IdleSessionManager() {
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();

  // Helper to release all database locks held by this user
  const releaseAllUserLocks = useCallback(() => {
    if (typeof window === "undefined") return;

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/record-locks/release-all");
    } else {
      fetch("/api/record-locks/release-all", {
        method: "POST",
        keepalive: true,
      });
    }
  }, []);

  // Execution when the timer hits 0
  const handleTimeout = useCallback(async () => {
    releaseAllUserLocks();
    await signOut({ redirectUrl: "/sign-in?reason=idle_timeout" });
  }, [releaseAllUserLocks, signOut]);

  const { isWarningOpen, remainingSeconds, resetTimer } = useIdleTimeout({
    timeoutMs: TOTAL_TIMEOUT_MS,
    warningDurationMs: WARNING_DURATION_MS,
    onTimeout: handleTimeout,
    enabled: isSignedIn,
  });

  const handleManualSignOut = async () => {
    releaseAllUserLocks();
    await signOut({ redirectUrl: "/sign-in" });
  };

  if (!isWarningOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progressPercent = (remainingSeconds / (WARNING_DURATION_MS / 1000)) * 100;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-lg transition-all animate-in zoom-in-95 duration-200">
        {/* Content */}
        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          {/* Icon */}
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
            <ShieldAlert className="h-6 w-6" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold tracking-tight text-popover-foreground">
            Session Timeout Warning
          </h3>

          {/* Description */}
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">
            Per 21 CFR Part 11 compliance standards, your session will be locked
            due to inactivity to protect sensitive quality records.
          </p>

          {/* Countdown */}
          <div className="mt-6 mb-2 flex flex-col items-center">
            <div className="font-mono text-4xl font-bold tracking-wider text-popover-foreground tabular-nums">
              {formattedTime}
            </div>
            <span className="mt-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
              Remaining until auto-lockout
            </span>

            {/* Progress Bar */}
            <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-foreground/80 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions — separated by border like Command footer */}
        <div className="flex items-center border-t border-border bg-muted/50 px-6 py-4 gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleManualSignOut}
            className="flex-1 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>

          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={resetTimer}
            className="flex-1 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Stay Signed In
          </Button>
        </div>
      </div>
    </div>
  );
}
