"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

interface UsageRow {
  label: string;
  value: string;
}

const usageRows: UsageRow[] = [
  { label: "Function Invocations", value: "$0.60" },
  { label: "Blob Data Transfer", value: "$0.21" },
];

export function UsageSection() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white mb-3">Usage</h2>
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden">
        {/* Billing header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06]">
          <span className="text-sm text-white/80">14 days remaining in cycle</span>
          <button className="text-xs font-medium text-white border border-white/[0.15] rounded-md px-3 py-1 hover:bg-white/[0.06] transition-colors">
            Billing
          </button>
        </div>

        {/* Credit info */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/50">Included Credit</span>
            <span className="text-xs text-white/50">On-Demand Charges</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">$0.94 / $20</span>
            <span className="text-sm font-medium text-white">$0</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: "4.7%" }}
            />
          </div>
        </div>

        {/* Usage rows */}
        {usageRows.map((row, i) => (
          <div
            key={row.label}
            className={`px-4 py-2.5 flex items-center justify-between ${
              i < usageRows.length - 1 ? "border-b border-white/[0.06]" : ""
            }`}
          >
            <span className="text-sm text-white/70">{row.label}</span>
            <span className="text-sm text-white/90 font-medium">{row.value}</span>
          </div>
        ))}

        {/* Show more */}
        <div className="flex justify-center py-1.5 border-t border-white/[0.06]">
          <button className="p-1 rounded-full hover:bg-white/[0.06] transition-colors">
            <ChevronDown size={16} className="text-white/30" />
          </button>
        </div>
      </div>
    </div>
  );
}
