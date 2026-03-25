"use client";

import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { COMPONENT_TYPES, COLOR_MAP } from "../_lib/constants";

const FEATURED_COMPONENTS = [
  "TEXT",
  "BUTTON",
  "SINGLE_SELECT",
  "MULTI_SELECT",
  "IMAGE",
  "SOCIAL_PROOF",
];

const COMPONENT_HINTS: Record<string, string> = {
  TEXT: "Headlines, supporting copy, and microcopy.",
  IMAGE: "Hero visuals, screenshots, and illustrations.",
  VIDEO: "High-attention demo or explainer moments.",
  ICON_LIBRARY: "Small visual cues and lightweight decoration.",
  STACK: "Compose richer sections and nested layouts.",
  FOOTER: "Pin utility content and sticky actions.",
  TAB_BUTTON: "Bottom nav-like choices and segmented controls.",
  BUTTON: "Primary and secondary calls to action.",
  TEXT_INPUT: "Collect names, emails, and freeform answers.",
  SINGLE_SELECT: "One-tap questions for goals or preferences.",
  MULTI_SELECT: "Let users choose multiple motivations or needs.",
  SLIDER: "Numeric input, ranges, and picker-style controls.",
  CAROUSEL: "Swipeable feature stories and guided sequences.",
  SOCIAL_PROOF: "Ratings, reviews, and trust moments.",
  FEATURE_LIST: "Outcome-focused benefits and feature blocks.",
  AWARD: "Badges, recognition, and milestone framing.",
  CUSTOM_COMPONENT: "App-native components registered by the SDK.",
};

export function ComponentPalette({ onAdd }: { onAdd: (type: string) => void }) {
  const [search, setSearch] = useState("");

  const filteredComponents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return COMPONENT_TYPES;
    }

    return COMPONENT_TYPES.filter((component) => {
      const hint = COMPONENT_HINTS[component.type] || "";
      return (
        component.label.toLowerCase().includes(query) ||
        component.type.toLowerCase().includes(query) ||
        component.category.toLowerCase().includes(query) ||
        hint.toLowerCase().includes(query)
      );
    });
  }, [search]);

  const categories = useMemo(
    () => [...new Set(filteredComponents.map((component) => component.category))],
    [filteredComponents],
  );

  const featured = useMemo(
    () => COMPONENT_TYPES.filter((component) => FEATURED_COMPONENTS.includes(component.type)),
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Insert
            </p>
            <p className="mt-1 text-[11px] leading-5 text-white/32">
              Build faster with the same blocks used across modern onboarding flows.
            </p>
          </div>
          <div className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-white/40">
            {filteredComponents.length} blocks
          </div>
        </div>

        <div className="relative mt-3">
          <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search blocks, actions, or layouts..."
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 pl-9 pr-3 text-[12px] text-white placeholder:text-white/25 outline-none transition-colors focus:border-white/[0.16]"
          />
        </div>
      </div>

      {!search.trim() && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={13} className="text-amber-400" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
              Starter Blocks
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {featured.map((component) => {
              const colors = COLOR_MAP[component.color];
              return (
                <button
                  key={component.type}
                  onClick={() => onAdd(component.type)}
                  className="group rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition-all hover:border-white/[0.16] hover:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border ${colors.border} ${colors.bg}`}
                    >
                      <component.icon size={15} className={colors.text} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-white/72 group-hover:text-white">
                        {component.label}
                      </p>
                      <p className="text-[9px] uppercase tracking-[0.16em] text-white/24">
                        {component.category}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {categories.map((category) => (
        <div key={category}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
              {category}
            </p>
            <span className="text-[10px] text-white/18">
              {filteredComponents.filter((component) => component.category === category).length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {filteredComponents
              .filter((component) => component.category === category)
              .map((component) => {
                const colors = COLOR_MAP[component.color];

                return (
                  <button
                    key={component.type}
                    onClick={() => onAdd(component.type)}
                    className="group flex items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3 text-left transition-all hover:border-white/[0.16] hover:bg-white/[0.045]"
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${colors.border} ${colors.bg}`}
                    >
                      <component.icon size={16} className={colors.text} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[12px] font-medium text-white/70 group-hover:text-white">
                          {component.label}
                        </span>
                        <span className="rounded-full border border-white/[0.08] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-white/20">
                          {component.type.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-5 text-white/28">
                        {COMPONENT_HINTS[component.type] || "Flexible building block for richer onboarding screens."}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      {filteredComponents.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center">
          <p className="text-[12px] font-medium text-white/45">No matching blocks</p>
          <p className="mt-1 text-[11px] text-white/25">
            Try searching by component name, category, or use case.
          </p>
        </div>
      )}
    </div>
  );
}
