"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  ClipboardCheck,
  ChevronsUpDown,
  Plus,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export function AddNewDropdown() {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={containerRef}>
      {/* Add New Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm active:scale-95"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Add New</span>
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-70 ml-0.5" />
      </button>

      {/* Popover Card Dropdown Menu (shadcn UI style) */}
      {isOpen && (
        <div className="absolute right-0 top-11 w-80 z-50 rounded-xl border border-border bg-popover text-popover-foreground p-2 shadow-2xl animate-in fade-in-50 zoom-in-95 space-y-1">
          <div className="px-3 py-2 border-b border-border">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Select Action
            </span>
          </div>

          {/* Option 1: Log Product Complaint */}
          <Link
            href="/complaints/new"
            onClick={() => setIsOpen(false)}
            className="group flex items-start gap-3 rounded-lg p-2.5 hover:bg-accent transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0 mt-0.5 group-hover:bg-amber-500/20 transition-colors">
              <FileSpreadsheet className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground group-hover:text-amber-500 transition-colors">
                  Product Complaint
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Log a post-market device incident, malfunction, or adverse event.
              </p>
            </div>
          </Link>

          {/* Option 2: CAPA Action */}
          <Link
            href="/capa"
            onClick={() => setIsOpen(false)}
            className="group flex items-start gap-3 rounded-lg p-2.5 hover:bg-accent transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 shrink-0 mt-0.5 group-hover:bg-blue-500/20 transition-colors">
              <ClipboardCheck className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground group-hover:text-blue-500 transition-colors">
                  CAPA
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Initiate corrective & preventive action for root cause resolution.
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
