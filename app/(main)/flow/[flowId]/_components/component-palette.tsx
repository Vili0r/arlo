"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { COMPONENT_TYPES } from "../_lib/constants";

export const COMPONENT_HINTS: Record<string, string> = {
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

/* ── Full-width card for category lists ── */
function ListCard({
  type,
  label,
  icon: Icon,
  hint,
  onAdd,
}: {
  type: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  hint: string;
  onAdd: (type: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { source: "palette", componentType: type, label },
  });

  return (
    <button
      ref={setNodeRef}
      onClick={() => onAdd(type)}
      className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.045]"
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
        <Icon size={15} className="text-white/50 group-hover:text-white/80 transition-colors" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-white/70 group-hover:text-white/90 transition-colors">
          {label}
        </p>
        <p className="mt-0.5 truncate text-[10px] leading-relaxed text-white/30">{hint}</p>
      </div>
    </button>
  );
}

export function ComponentPalette({ onAdd }: { onAdd: (type: string) => void }) {
  const [search, setSearch] = useState("");

  const filteredComponents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return COMPONENT_TYPES;
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
    () => [...new Set(filteredComponents.map((c) => c.category))],
    [filteredComponents],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ── Search ── */}
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search blocks..."
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 pl-9 pr-3 text-[12px] text-white placeholder:text-white/25 outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.06]"
        />
      </div>

      {/* ── Category lists ── */}
      {categories.map((category) => {
        const items = filteredComponents.filter((c) => c.category === category);
        return (
          <div key={category}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                {category}
              </p>
              <span className="text-[10px] tabular-nums text-white/25">{items.length}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {items.map((c) => (
                <ListCard
                  key={c.type}
                  type={c.type}
                  label={c.label}
                  icon={c.icon}
                  hint={COMPONENT_HINTS[c.type] || "Flexible building block."}
                  onAdd={onAdd}
                />
              ))}
            </div>
          </div>
        );
      })}

      {filteredComponents.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/[0.08] px-4 py-10 text-center">
          <p className="text-[12px] font-medium text-white/40">No matching blocks</p>
          <p className="mt-1 text-[11px] text-white/20">
            Try a different name or category.
          </p>
        </div>
      )}
    </div>
  );
}
