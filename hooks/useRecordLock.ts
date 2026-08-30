"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { LockEntityType } from "@prisma/client";
import {
  acquireRecordLock,
  refreshRecordLock,
  releaseRecordLock,
  LockUserSummary,
} from "@/lib/actions/record-lock";

interface UseRecordLockOptions {
  entityType: LockEntityType;
  recordId: string;
  enabled?: boolean;
  heartbeatIntervalMs?: number; // default: 30000 (30 seconds)
}

const MAX_INITIAL_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

export function useRecordLock({
  entityType,
  recordId,
  enabled = true,
  heartbeatIntervalMs = 30000,
}: UseRecordLockOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [lockedByUser, setLockedByUser] = useState<LockUserSummary | null>(null);
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  // Mounted guard — prevents setting state after unmount (React Strict Mode races)
  const mountedRef = useRef(true);
  const isLockedByMeRef = useRef(isLockedByMe);
  isLockedByMeRef.current = isLockedByMe;

  // 1. Acquire Lock (with automatic retry for transient auth/network errors)
  const acquire = useCallback(async (retryCount = 0): Promise<void> => {
    if (!enabled || !recordId) return;
    if (retryCount === 0) setIsLoading(true);

    try {
      const res = await acquireRecordLock(entityType, recordId);

      if (!mountedRef.current) return; // Component unmounted mid-flight

      if (res.success && res.isLockedByMe) {
        setIsLockedByMe(true);
        setLockedByUser(null);
        setLockMessage(null);
        setHasError(false);
      } else {
        // Genuinely locked by another user — the server returned a real lock holder
        setIsLockedByMe(false);
        setLockedByUser(res.lockedBy || null);
        setLockMessage(res.message || "Record is locked by another user.");
        setHasError(false);
      }
    } catch (err) {
      console.error("[useRecordLock] Failed to acquire lock:", err);

      if (!mountedRef.current) return;

      // Transient error (auth not ready, network issue, etc.)
      // Retry a few times with exponential back-off before giving up
      if (retryCount < MAX_INITIAL_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
        await new Promise((r) => setTimeout(r, delay));

        if (!mountedRef.current) return;
        return acquire(retryCount + 1);
      }

      // Exhausted retries — mark as error, NOT as "locked by another user"
      setIsLockedByMe(false);
      setLockedByUser(null);
      setLockMessage(null);
      setHasError(true);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [entityType, recordId, enabled]);

  // 2. Heartbeat Refresh
  const heartbeat = useCallback(async () => {
    if (!isLockedByMeRef.current || !enabled || !recordId) return;

    try {
      const res = await refreshRecordLock(entityType, recordId);

      if (!mountedRef.current) return;

      if (!res.success) {
        setIsLockedByMe(false);
        setLockedByUser(res.lockedBy || null);
        setLockMessage(res.message || "Lock expired and was claimed by another user.");
        setHasError(false);
      }
    } catch (err) {
      console.warn("[useRecordLock] Heartbeat error:", err);
      // Don't flip to error state on heartbeat failure — the TTL will handle it
      // and the next heartbeat will retry automatically
    }
  }, [entityType, recordId, enabled]);

  // 3. Graceful Release
  const release = useCallback(async () => {
    if (!isLockedByMeRef.current || !recordId) return;
    try {
      await releaseRecordLock(entityType, recordId);
      if (mountedRef.current) {
        setIsLockedByMe(false);
      }
    } catch (err) {
      console.error("[useRecordLock] Failed to release lock:", err);
    }
  }, [entityType, recordId]);

  // Unload Beacon Helper (tab close / browser close only — NOT HMR)
  // We only fire this for genuine tab/window close, not React cleanup
  const sendUnloadBeacon = useCallback(() => {
    // Guard: only release if WE hold the lock and are still mounted
    if (!isLockedByMeRef.current || !recordId) return;

    const payload = JSON.stringify({ entityType, recordId });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/record-locks/release", blob);
    } else if (typeof fetch !== "undefined") {
      fetch("/api/record-locks/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    }
  }, [entityType, recordId]);

  // Lifecycle: Mount, Heartbeat, and Unload listeners
  useEffect(() => {
    if (!enabled || !recordId) return;

    // Reset mounted guard (handles React Strict Mode remount)
    mountedRef.current = true;

    acquire();

    // Setup Heartbeat Interval
    const intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        heartbeat();
      }
    }, heartbeatIntervalMs);

    // Visibility change handler (refresh immediately when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        heartbeat();
      }
    };

    // Tab close / window unload handlers
    // These fire on genuine tab close AND on HMR in dev, but the beacon
    // is guarded by isLockedByMeRef which we clear during React cleanup
    const handleBeforeUnload = () => {
      sendUnloadBeacon();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      // Mark as unmounted FIRST — this prevents the beacon from firing
      // during React Strict Mode's synchronous unmount+remount cycle,
      // because the remount's acquire() will re-set mountedRef.current = true
      mountedRef.current = false;

      clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Release lock on unmount (navigating away within the SPA)
      // This is safe because mountedRef is false, so the setState in release()
      // will be skipped, avoiding React warnings
      releaseRecordLock(entityType, recordId).catch(() => {
        // Swallow errors on cleanup — TTL auto-expiry is the safety net
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, recordId, enabled, heartbeatIntervalMs]);

  // Persistent toast notification for lock state
  const LOCK_TOAST_ID = `record-lock-${recordId}`;

  useEffect(() => {
    if (isLoading) return;

    if (hasError) {
      toast.error("Unable to Acquire Edit Lock", {
        id: LOCK_TOAST_ID,
        description: "Could not verify record availability. This may be a temporary connection issue. Edits are disabled as a precaution.",
        duration: Infinity,
        closeButton: true,
        action: {
          label: "Retry",
          onClick: () => acquire(),
        },
      });
    } else if (!isLockedByMe && !isLoading) {
      const description = lockMessage ||
        (lockedByUser
          ? `This record is currently being edited by ${lockedByUser.name} (${lockedByUser.email}). Edits are disabled to prevent concurrent modifications.`
          : "This record is currently locked by another user. Edits are disabled to prevent concurrent modifications.");

      toast.warning("Read-Only Mode: Record Locked", {
        id: LOCK_TOAST_ID,
        description,
        duration: Infinity,
        closeButton: true,
      });
    } else {
      // Lock acquired — dismiss any existing toast
      toast.dismiss(LOCK_TOAST_ID);
    }

    return () => {
      toast.dismiss(LOCK_TOAST_ID);
    };
  }, [isLoading, isLockedByMe, hasError, lockedByUser, lockMessage, LOCK_TOAST_ID, acquire]);

  return {
    isLoading,
    isLockedByMe,
    isReadOnly: !isLoading && !isLockedByMe,
    lockedByUser,
    lockMessage,
    hasError,
    retryAcquisition: acquire,
    release,
  };
}
