"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_STORAGE_KEY = "arlo:tinybird:session-id";
const LAST_TRACKED_STORAGE_KEY = "arlo:tinybird:last-page-view";
const DUPLICATE_WINDOW_MS = 1500;

let memorySessionId: string | null = null;
let memoryLastTracked: { pathname: string; trackedAt: number } | null = null;

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (existing) {
      return existing;
    }

    const sessionId = createSessionId();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    return sessionId;
  } catch {
    if (!memorySessionId) {
      memorySessionId = createSessionId();
    }

    return memorySessionId;
  }
}

function wasRecentlyTracked(pathname: string) {
  const now = Date.now();

  try {
    const rawValue = window.sessionStorage.getItem(LAST_TRACKED_STORAGE_KEY);

    if (!rawValue) {
      return false;
    }

    const lastTracked = JSON.parse(rawValue) as {
      pathname?: string;
      trackedAt?: number;
    };

    return (
      lastTracked.pathname === pathname &&
      typeof lastTracked.trackedAt === "number" &&
      now - lastTracked.trackedAt < DUPLICATE_WINDOW_MS
    );
  } catch {
    return (
      memoryLastTracked?.pathname === pathname &&
      now - memoryLastTracked.trackedAt < DUPLICATE_WINDOW_MS
    );
  }
}

function markTracked(pathname: string) {
  const trackedAt = Date.now();
  memoryLastTracked = { pathname, trackedAt };

  try {
    window.sessionStorage.setItem(
      LAST_TRACKED_STORAGE_KEY,
      JSON.stringify({ pathname, trackedAt }),
    );
  } catch {
    // Ignore storage failures and keep the in-memory fallback.
  }
}

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || wasRecentlyTracked(pathname)) {
      return;
    }

    markTracked(pathname);

    void fetch("/api/analytics/page-view", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        pathname,
        sessionId: getSessionId(),
      }),
      keepalive: true,
    }).catch(() => {
      // Analytics should never interrupt app usage.
    });
  }, [pathname]);

  return null;
}
