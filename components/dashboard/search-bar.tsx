"use client";

import React from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, LayoutGrid, List, ChevronDown, Plus } from "lucide-react";

export function SearchBar() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search input */}
      <div className="flex-1 min-w-[200px] relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Search Projects..."
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 transition-colors"
        />
      </div>

      {/* View toggles */}
      <div className="flex items-center border border-white/[0.1] rounded-lg overflow-hidden">
        <button className="p-2 hover:bg-white/[0.06] transition-colors border-r border-white/[0.1]">
          <SlidersHorizontal size={16} className="text-white/40" />
        </button>
        <button className="p-2 bg-white/[0.08] transition-colors border-r border-white/[0.1]">
          <LayoutGrid size={16} className="text-white/70" />
        </button>
        <button className="p-2 hover:bg-white/[0.06] transition-colors">
          <List size={16} className="text-white/40" />
        </button>
      </div>

      {/* Add New button */}
      <Link href="/dashboard/new" className="flex items-center gap-1.5 bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors group">
        <span>Add New Project</span>
      </Link>
    </div>
  );
}
