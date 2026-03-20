"use client";

import React from "react";
import {
  Smartphone,
  Image,
  Type,
  Play,
  Star,
  MousePointerClick,
  Rows3,
  LayoutGrid,
  CheckCircle,
  Award,
  Sliders,
  ToggleLeft,
  List,
  Square,
} from "lucide-react";
import type { Screen, FlowComponent } from "@/lib/types";

/* ─────────────────────────────────────────────
   ICON MAP — component type → tiny icon
   ───────────────────────────────────────────── */
const COMPONENT_ICON_MAP: Record<string, React.ElementType> = {
  TEXT: Type,
  IMAGE: Image,
  VIDEO: Play,
  ICON_LIBRARY: Star,
  BUTTON: MousePointerClick,
  TEXT_INPUT: ToggleLeft,
  SINGLE_SELECT: List,
  MULTI_SELECT: LayoutGrid,
  SLIDER: Sliders,
  STACK: Rows3,
  FOOTER: Square,
  TAB_BUTTON: LayoutGrid,
  CAROUSEL: Image,
  SOCIAL_PROOF: Star,
  FEATURE_LIST: CheckCircle,
  AWARD: Award,
};

/* ════════════════════════════════════════════════════════════
   MINI SCREEN THUMBNAIL
   
   Renders a tiny ~9:16 preview of a screen's actual content.
   Drop this into your SortableScreenRow in screens-list.tsx.
   
   Usage:
     <MiniScreenThumbnail screen={screen} isSelected={isSelected} />
   ════════════════════════════════════════════════════════════ */

export function MiniScreenThumbnail({
  screen,
  isSelected,
  onClick,
}: {
  screen: Screen;
  isSelected: boolean;
  onClick?: () => void;
}) {
  const bgColor = screen.style?.backgroundColor || "#FFFFFF";
  const components = [...screen.components].sort((a, b) => a.order - b.order);

  return (
    <div
      onClick={onClick}
      className={`w-full aspect-[9/16] rounded-lg overflow-hidden border-[1.5px] transition-all cursor-pointer ${
        isSelected
          ? "border-blue-500/60 shadow-[0_0_8px_rgba(59,130,246,0.15)]"
          : "border-white/[0.06] hover:border-white/[0.12]"
      }`}
      style={{ backgroundColor: bgColor }}
    >
      <div className="w-full h-full flex flex-col p-[5px] gap-[2px]">
        {/* Mini status bar */}
        <div className="flex items-center justify-between px-[3px] mb-[1px] shrink-0">
          <div className="w-[10px] h-[2px] rounded-full bg-black/15" />
          <div className="w-[16px] h-[4px] rounded-full bg-black/25" />
          <div className="w-[8px] h-[2px] rounded-full bg-black/15" />
        </div>

        {/* Component previews */}
        {components.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Smartphone size={10} className="text-gray-300/60" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-[1.5px] overflow-hidden">
            {components.slice(0, 7).map((comp) => (
              <MiniComponentBlock key={comp.id} component={comp} />
            ))}
            {components.length > 7 && (
              <div className="text-center" style={{ fontSize: 4, color: "#aaa" }}>
                +{components.length - 7}
              </div>
            )}
          </div>
        )}

        {/* Home indicator */}
        <div className="flex justify-center pt-[1px] shrink-0">
          <div className="w-[14px] h-[2px] rounded-full bg-black/12" />
        </div>
      </div>
    </div>
  );
}

/* ─── Tiny component block ────────────────── */

function MiniComponentBlock({ component }: { component: FlowComponent }) {
  const p = component.props as Record<string, any>;

  // TEXT → show a small colored line, thicker for headings
  if (component.type === "TEXT") {
    const isHeading = (p.fontSize || 16) > 20;
    return (
      <div className="px-[2px]">
        <div
          className="rounded-[0.5px]"
          style={{
            height: isHeading ? 4.5 : 3,
            width: isHeading ? "65%" : "85%",
            backgroundColor: p.color || "#1A1A1A",
            opacity: 0.25,
          }}
        />
      </div>
    );
  }

  // IMAGE → gray rect with tiny icon
  if (component.type === "IMAGE") {
    return (
      <div
        className="rounded-[2px] flex items-center justify-center shrink-0"
        style={{ height: 12, backgroundColor: "#f0f0f0" }}
      >
        <Image size={5} className="text-gray-300" />
      </div>
    );
  }

  // VIDEO → dark rect with play icon
  if (component.type === "VIDEO") {
    return (
      <div
        className="rounded-[2px] flex items-center justify-center shrink-0"
        style={{ height: 12, backgroundColor: "#111" }}
      >
        <Play size={4} className="text-white/40" />
      </div>
    );
  }

  // BUTTON → colored pill
  if (component.type === "BUTTON") {
    const bg = p.backgroundColor || p.style?.backgroundColor || "#007AFF";
    return (
      <div
        className="rounded-[2px] mx-[1px] shrink-0"
        style={{ height: 6, backgroundColor: bg }}
      />
    );
  }

  // STACK → bordered container
  if (component.type === "STACK") {
    return (
      <div
        className="rounded-[1px] border border-dashed flex items-center justify-center shrink-0"
        style={{
          height: 10,
          borderColor: "rgba(0,0,0,0.1)",
          backgroundColor: p.backgroundColor || "rgba(0,0,0,0.015)",
        }}
      >
        <Rows3 size={4} className="text-gray-300" />
      </div>
    );
  }

  // SINGLE_SELECT / MULTI_SELECT → small option rows
  if (component.type === "SINGLE_SELECT" || component.type === "MULTI_SELECT") {
    const optionCount = Math.min((p.options || []).length, 3);
    return (
      <div className="flex flex-col gap-[1px] px-[1px]">
        {Array.from({ length: optionCount || 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[1px]"
            style={{ height: 3, backgroundColor: "rgba(0,0,0,0.06)" }}
          />
        ))}
      </div>
    );
  }

  // SLIDER → thin line with dot
  if (component.type === "SLIDER") {
    return (
      <div className="flex items-center gap-[1px] px-[2px]">
        <div className="flex-1 h-[1.5px] rounded-full bg-blue-400/30" />
        <div className="w-[3px] h-[3px] rounded-full bg-blue-500/40" />
        <div className="flex-1 h-[1.5px] rounded-full bg-gray-200" />
      </div>
    );
  }

  // CAROUSEL → overlapping cards
  if (component.type === "CAROUSEL") {
    return (
      <div className="flex gap-[1px] px-[1px] overflow-hidden shrink-0">
        <div className="w-[70%] h-[10px] rounded-[1px] bg-gray-100 shrink-0" />
        <div className="w-[30%] h-[10px] rounded-[1px] bg-gray-200/60 shrink-0" />
      </div>
    );
  }

  // SOCIAL_PROOF → stars
  if (component.type === "SOCIAL_PROOF") {
    return (
      <div className="flex items-center gap-[1px] px-[2px]">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-[2px] h-[2px] rounded-[0.5px]"
            style={{ backgroundColor: i <= 4 ? "#FBBF24" : "#D1D5DB" }}
          />
        ))}
        <div className="flex-1 h-[2px] rounded-full bg-gray-200 ml-[2px]" />
      </div>
    );
  }

  // FEATURE_LIST → check + line rows
  if (component.type === "FEATURE_LIST") {
    const count = Math.min((p.features || []).length, 3);
    return (
      <div className="flex flex-col gap-[1.5px] px-[2px]">
        {Array.from({ length: count || 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-[2px]">
            <div className="w-[2.5px] h-[2.5px] rounded-full bg-green-400/40 shrink-0" />
            <div className="flex-1 h-[2px] rounded-full bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  // TAB_BUTTON → tab bar
  if (component.type === "TAB_BUTTON") {
    const tabCount = Math.min((p.tabs || []).length, 3);
    return (
      <div className="flex gap-[1px] px-[1px]">
        {Array.from({ length: tabCount || 2 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[4px] rounded-[1px]"
            style={{
              backgroundColor: i === 0 ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.05)",
            }}
          />
        ))}
      </div>
    );
  }

  // AWARD → small badge
  if (component.type === "AWARD") {
    return (
      <div
        className="rounded-[2px] flex items-center justify-center shrink-0"
        style={{
          height: 10,
          backgroundColor: p.backgroundColor || "#1C1C1E",
        }}
      >
        <Award size={4} style={{ color: p.textColor || "#fff", opacity: 0.5 }} />
      </div>
    );
  }

  // Default fallback — generic block
  return (
    <div className="flex items-center gap-[2px] px-[2px]">
      <div className="w-[3px] h-[3px] rounded-[0.5px] bg-gray-200" />
      <div className="flex-1 h-[2px] rounded-full bg-gray-200/60" />
    </div>
  );
}