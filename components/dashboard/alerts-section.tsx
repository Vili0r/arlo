"use client";

import React from "react";

export function AlertsSection() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white mb-3">Alerts</h2>
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 flex flex-col items-center justify-center text-center">
        <h3 className="text-sm font-semibold text-white mb-1">
          Get alerted for anomalies
        </h3>
        <p className="text-xs text-white/50 mb-4 max-w-[220px]">
          Automatically monitor your projects for anomalies and get notified.
        </p>
        <button className="text-sm font-medium text-white border border-white/[0.2] rounded-lg px-4 py-2 hover:bg-white/[0.06] transition-colors">
          Upgrade to Observability Plus
        </button>
      </div>
    </div>
  );
}
