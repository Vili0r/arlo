"use client";

import React from "react";
import { X, Trash2, ChevronRight } from "lucide-react";
import type { FlowComponent } from "@/lib/types";
import { COMPONENT_TYPES, COLOR_MAP } from "../_lib/constants";
import { ComponentPropertyEditor } from "./component-property-editor";
import { AnimationPropertyEditor } from "./animation-property-editor";
import type { ComponentAnimation } from "../_lib/animation-presets";

/* ════════════════════════════════════════════════════════════
   PROPERTY SHEET — Appcues-style right panel
   
   Slides in from the right as a persistent panel (no overlay).
   Shows component properties, styling, and animation controls.
   ════════════════════════════════════════════════════════════ */

export function PropertySheet({
  open,
  component,
  onClose,
  onDelete,
  onUpdateProp,
  onUpdateAnimation,
}: {
  open: boolean;
  component: FlowComponent | null;
  onClose: () => void;
  onDelete?: () => void;
  onUpdateProp?: (key: string, value: unknown) => void;
  onUpdateAnimation?: (anim: ComponentAnimation) => void;
}) {
  const meta = component
    ? COMPONENT_TYPES.find((c) => c.type === component.type)
    : null;
  const colors = meta
    ? COLOR_MAP[meta.color] || COLOR_MAP["blue"]
    : COLOR_MAP["blue"];

  return (
    <div
      className={`h-full border-l border-white/[0.08] bg-[#0e0e10] flex flex-col shrink-0 transition-all duration-200 ease-out overflow-hidden ${
        open ? "w-[340px]" : "w-0"
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {meta && (
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${colors?.bg || "rgba(255,255,255,0.06)"}` }}
            >
              <meta.icon size={12} style={{ color: colors?.text || "#fff" }} />
            </div>
          )}
          <span className="text-[13px] font-semibold text-white truncate">
            {meta?.label || "Properties"}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 text-white/25 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete component"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-white/25 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            title="Close panel"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {component && onUpdateProp ? (
          <div className="px-4 py-4">
            <ComponentPropertyEditor
              component={component}
              onUpdateProp={onUpdateProp}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
              <ChevronRight size={16} className="text-white/15" />
            </div>
            <p className="text-xs text-white/30">Select a content block to edit</p>
          </div>
        )}

        {/* Animation section */}
        {component && onUpdateAnimation && (
          <div className="px-4 pb-4">
            <AnimationPropertyEditor
              animation={component.animation}
              onUpdate={onUpdateAnimation}
              componentId={component.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}