import React from "react";
import type { FlowComponent } from "@/lib/types";
import {
  Divider,
  Section,
  PropRow,
  PropInput,
  PropNumberUnit,
  PropSelect,
  PropColorInput,
  PropCheckbox,
  PropToggle,
  PropAlignmentToggle,
  PropTextarea,
  PropFileUpload,
  PropVideoUpload,
  PropSpacingInput,
  PropIconCombobox,
  AddVariableLink,
  CollapsibleSection,
  PropField,
  SectionLabel,
} from "../property-fields";
import type { SpacingValues } from "../property-fields";
import { icons, X, Plus } from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Helper: read spacing values from props (supports both old
   vertical/horizontal format and new top/right/bottom/left)
   ──────────────────────────────────────────────────────────── */
export function getSpacingValues(
  p: Record<string, any>,
  prefix: "padding" | "margin"
): SpacingValues {
  // New individual format takes priority
  if (
    p[`${prefix}Top`] !== undefined ||
    p[`${prefix}Right`] !== undefined ||
    p[`${prefix}Bottom`] !== undefined ||
    p[`${prefix}Left`] !== undefined
  ) {
    return {
      top: p[`${prefix}Top`] ?? 0,
      right: p[`${prefix}Right`] ?? 0,
      bottom: p[`${prefix}Bottom`] ?? 0,
      left: p[`${prefix}Left`] ?? 0,
    };
  }
  // Fall back to old vertical/horizontal format
  const v = p[`${prefix}Vertical`] ?? 0;
  const h = p[`${prefix}Horizontal`] ?? 0;
  return { top: v, right: h, bottom: v, left: h };
}

export function makeSpacingOnChange(
  onUpdateProp: (key: string, value: unknown) => void,
  prefix: "padding" | "margin"
) {
  return (vals: SpacingValues) => {
    onUpdateProp(`${prefix}Top`, vals.top);
    onUpdateProp(`${prefix}Right`, vals.right);
    onUpdateProp(`${prefix}Bottom`, vals.bottom);
    onUpdateProp(`${prefix}Left`, vals.left);
    // Also sync the old vertical/horizontal props for backward compat
    onUpdateProp(`${prefix}Vertical`, vals.top);
    onUpdateProp(`${prefix}Horizontal`, vals.left);
  };
}

/* ────────────────────────────────────────────────────────────
   Axis Toggle  (→  ↓  ⬇)
   ──────────────────────────────────────────────────────────── */
export function PropAxisToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const options: { val: string; label: React.ReactNode; title: string }[] = [
    {
      val: "horizontal",
      title: "Horizontal",
      label: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8h10M10 5l3 3-3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      val: "vertical",
      title: "Vertical",
      label: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 3v10M5 10l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      val: "z-stack",
      title: "Z-Stack (Layers)",
      label: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M2 10l6 3 6-3M2 7l6 3 6-3M2 4l6 3 6-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center rounded-lg overflow-hidden border border-white/[0.08]">
      {options.map((opt) => (
        <button
          key={opt.val}
          title={opt.title}
          onClick={() => onChange(opt.val)}
          className={`flex items-center justify-center w-9 h-8 transition-colors ${
            value === opt.val
              ? "bg-[#6C5CE7] text-white"
              : "bg-white/[0.04] text-white/50 hover:text-white/80"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Background Type Toggle  (Color | Image | Video)
   ──────────────────────────────────────────────────────────── */
export function PropBackgroundTypeToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const options = ["Color", "Image", "Video"];
  return (
    <div className="flex items-center rounded-lg overflow-hidden border border-white/[0.08]">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt.toLowerCase())}
          className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.toLowerCase()
              ? "bg-[#6C5CE7] text-white"
              : "bg-white/[0.04] text-white/50 hover:text-white/80"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Badge Position Grid  (3×3 alignment picker)
   ──────────────────────────────────────────────────────────── */
export function PropPositionGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const positions = [
    ["top-left", "top-center", "top-right"],
    ["center-left", "center-center", "center-right"],
    ["bottom-left", "bottom-center", "bottom-right"],
  ];

  return (
    <div className="inline-grid grid-cols-3 gap-0.5 rounded-lg overflow-hidden border border-white/[0.08]">
      {positions.flat().map((pos) => (
        <button
          key={pos}
          onClick={() => onChange(pos)}
          className={`w-8 h-8 flex items-center justify-center transition-colors ${
            value === pos
              ? "bg-[#6C5CE7] text-white"
              : "bg-white/[0.04] text-white/30 hover:text-white/60"
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect
              x="1"
              y="1"
              width="10"
              height="10"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
