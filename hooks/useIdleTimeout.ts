"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface UseIdleTimeoutOptions {
  timeoutMs?: number; // Total idle duration (Default: 15 mins)
  warningDurationMs?: number; // Warning modal window (Default: 2 mins)
  throttleMs?: number; // Throttle interval for event listeners (Default: 1s)
  onTimeout?: () => void | Promise<void>;
  enabled?: boolean;
}

const BROADCAST_CHANNEL_NAME = "eqms_idle_sync_channel";
const STORAGE_KEY = "eqms_last_activity_timestamp";

export function useIdleTimeout({
  timeoutMs = 15 * 60 * 1000, // 15 minutes
  warningDurationMs = 2 * 60 * 1000, // 2 minutes
  throttleMs = 1000, // 1 second
  onTimeout,
  enabled = true,
}: UseIdleTimeoutOptions = {}) {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.floor(warningDurationMs / 1000)
  );

  const lastActivityRef = useRef<number>(Date.now());
  const lastThrottleRef = useRef<number>(0);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const warningThresholdMs = timeoutMs - warningDurationMs;

  // Broadcast activity to all other tabs
  const broadcastActivity = useCallback((timestamp: number) => {
    try {
      if (channelRef.current) {
        channelRef.current.postMessage({ type: "ACTIVITY_RESET", timestamp });
      }
      localStorage.setItem(STORAGE_KEY, timestamp.toString());
    } catch {
      // Ignore private mode / local storage quota errors
    }
  }, []);

  // Reset timer on active user interaction
  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    setIsWarningOpen(false);
    setRemainingSeconds(Math.floor(warningDurationMs / 1000));
    broadcastActivity(now);
  }, [broadcastActivity, warningDurationMs]);

  // Throttled event handler for user interactions
  const handleUserActivity = useCallback(() => {
    if (!enabled || isWarningOpen) return; // Freeze auto-resets when warning modal is actively displayed
    const now = Date.now();
    if (now - lastThrottleRef.current >= throttleMs) {
      lastThrottleRef.current = now;
      lastActivityRef.current = now;
      broadcastActivity(now);
    }
  }, [enabled, isWarningOpen, throttleMs, broadcastActivity]);

  useEffect(() => {
    if (!enabled) return;

    // 1. Setup BroadcastChannel for Multi-Tab Sync
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channelRef.current.onmessage = (event) => {
        if (event.data?.type === "ACTIVITY_RESET") {
          lastActivityRef.current = event.data.timestamp;
          setIsWarningOpen(false);
          setRemainingSeconds(Math.floor(warningDurationMs / 1000));
        }
      };
    }

    // 2. Storage event fallback for cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        lastActivityRef.current = parseInt(e.newValue, 10);
        setIsWarningOpen(false);
        setRemainingSeconds(Math.floor(warningDurationMs / 1000));
      }
    };
    window.addEventListener("storage", handleStorage);

    // 3. User Activity Listeners
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "wheel",
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // 4. Main Timer Tick (Calculates exact time difference every 1 second)
    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= timeoutMs) {
        // Session Expired
        setIsWarningOpen(false);
        clearInterval(intervalId);
        onTimeoutRef.current?.();
      } else if (elapsed >= warningThresholdMs) {
        // Warning Window Active
        setIsWarningOpen(true);
        const timeLeftMs = Math.max(0, timeoutMs - elapsed);
        setRemainingSeconds(Math.ceil(timeLeftMs / 1000));
      } else {
        if (isWarningOpen) {
          setIsWarningOpen(false);
        }
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      window.removeEventListener("storage", handleStorage);
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [enabled, handleUserActivity, isWarningOpen, timeoutMs, warningDurationMs, warningThresholdMs]);

  return {
    isWarningOpen,
    remainingSeconds,
    resetTimer,
  };
}
