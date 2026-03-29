"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import { COLOR_MAP, COMPONENT_TYPES } from "../_lib/constants";
import { COMPONENT_HINTS } from "./component-palette";

export function QuickInsertPalette({
  open,
  x,
  y,
  onClose,
  onInsert,
}: {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onInsert: (type: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  const filteredComponents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return COMPONENT_TYPES;
    }

    return COMPONENT_TYPES.filter((component) => {
      return (
        component.label.toLowerCase().includes(normalizedQuery) ||
        component.type.toLowerCase().includes(normalizedQuery) ||
        component.category.toLowerCase().includes(normalizedQuery) ||
        (COMPONENT_HINTS[component.type] || "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query]);

  useEffect(() => {
    if (!open) return;

    inputRef.current?.focus();

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }

      if (event.key === "Enter" && filteredComponents[0]) {
        event.preventDefault();
        onInsert(filteredComponents[0].type);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [filteredComponents, handleClose, onInsert, open]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-[120] w-[280px] overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0f1116]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      style={{
        left: Math.max(12, x),
        top: Math.max(12, y),
      }}
    >
      <div className="border-b border-white/[0.08] px-3 py-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
          Quick Insert
        </div>
        <div className="relative">
          <Search
            size={13}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search blocks..."
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 pl-9 pr-3 text-[12px] text-white placeholder:text-white/25 outline-none transition-colors focus:border-white/[0.16]"
          />
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto p-2">
        <div className="space-y-1">
          {filteredComponents.slice(0, 14).map((component, index) => {
            const colors = COLOR_MAP[component.color];

            return (
              <button
                key={component.type}
                onClick={() => onInsert(component.type)}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  index === 0
                    ? "bg-white/[0.06] text-white"
                    : "text-white/72 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${colors.border} ${colors.bg}`}
                >
                  <component.icon size={15} className={colors.text} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[12px] font-medium">{component.label}</span>
                    <span className="rounded-full border border-white/[0.08] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-white/22">
                      {component.category}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-4 text-white/35">
                    {COMPONENT_HINTS[component.type]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
