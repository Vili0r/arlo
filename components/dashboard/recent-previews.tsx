"use client";

import React from "react";
import { Eye } from "lucide-react";

export function RecentPreviews() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white mb-3">Recent Previews</h2>
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[120px]">
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/[0.12] flex items-center justify-center mb-3">
          <Eye size={18} className="text-white/20" />
        </div>
        <p className="text-xs text-white/30">No recent previews</p>
      </div>
    </div>
  );
}
