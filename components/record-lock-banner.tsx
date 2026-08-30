"use client";

import React from "react";
import { Lock, RefreshCw, WifiOff } from "lucide-react";
import { LockUserSummary } from "@/lib/actions/record-lock";

interface RecordLockBannerProps {
  isReadOnly: boolean;
  lockedByUser: LockUserSummary | null;
  message?: string | null;
  hasError?: boolean;
  onRetry?: () => void;
}

export function RecordLockBanner({
  isReadOnly,
  lockedByUser,
  message,
  hasError = false,
  onRetry,
}: RecordLockBannerProps) {
  if (!isReadOnly) return null;

  // Transient error state — show a softer "connection issue" banner, not "locked"
  if (hasError) {
    return (
      <div className="mb-6 rounded-lg border border-red-500/30 bg-red-50/80 dark:bg-red-950/30 p-4 text-red-900 dark:text-red-200 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="rounded-full bg-red-200/80 dark:bg-red-900/60 p-2 text-red-800 dark:text-red-300">
              <WifiOff className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-red-950 dark:text-red-100">
                Unable to Acquire Edit Lock
              </h4>
              <p className="text-sm text-red-800 dark:text-red-300">
                Could not verify record availability. This may be a temporary connection issue.
              </p>
              <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                Edits are disabled as a precaution. Click retry to attempt again.
              </p>
            </div>
          </div>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-300 dark:border-red-700 bg-white dark:bg-red-900/40 px-3 py-1.5 text-xs font-medium text-red-900 dark:text-red-100 hover:bg-red-100 dark:hover:bg-red-800/60 transition-colors shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Real lock — another user holds the record
  return (
    <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/30 p-4 text-amber-900 dark:text-amber-200 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="rounded-full bg-amber-200/80 dark:bg-amber-900/60 p-2 text-amber-800 dark:text-amber-300">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-950 dark:text-amber-100">
              Read-Only Mode: Record Locked
            </h4>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              {message ||
                (lockedByUser
                  ? `This record is currently being edited by ${lockedByUser.name} (${lockedByUser.email}).`
                  : "This record is currently locked by another user.")}
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              Edits are disabled to prevent concurrent modifications. The lock will automatically release if the other user leaves the page.
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-900/40 px-3 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-800/60 transition-colors shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Check Availability
          </button>
        )}
      </div>
    </div>
  );
}
