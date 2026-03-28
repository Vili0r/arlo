"use client";

import React from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react";

interface SearchBarProps {
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

export function SearchBar({ view, onViewChange }: SearchBarProps) {
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
        <button type="button" className="p-2 hover:bg-white/[0.06] transition-colors border-r border-white/[0.1]">
          <SlidersHorizontal size={16} className="text-white/40" />
        </button>
        <button
          type="button"
          onClick={() => onViewChange("grid")}
          aria-pressed={view === "grid"}
          className={`p-2 transition-colors border-r border-white/[0.1] ${
            view === "grid" ? "bg-white/[0.08]" : "hover:bg-white/[0.06]"
          }`}
        >
          <LayoutGrid size={16} className={view === "grid" ? "text-white/70" : "text-white/40"} />
        </button>
        <button
          type="button"
          onClick={() => onViewChange("list")}
          aria-pressed={view === "list"}
          className={`p-2 transition-colors ${
            view === "list" ? "bg-white/[0.08]" : "hover:bg-white/[0.06]"
          }`}
        >
          <List size={16} className={view === "list" ? "text-white/70" : "text-white/40"} />
        </button>
      </div>

      {/* Add New button */}
      <Link href="/dashboard/project" className="flex items-center gap-1.5 bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors group">
        <span>Add New Project</span>
      </Link>
    </div>
  );
}
