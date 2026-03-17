"use client";

import React, { useState } from "react";
import { X, ChevronRight } from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Tab Style Presets
   ──────────────────────────────────────────────────────────── */

export interface TabPreset {
  id: string;
  name: string;
  description: string;
  variant: string;
  tabs: { id: string; label: string; active: boolean; badge?: string }[];
  activeColor: string;
  inactiveColor: string;
  activeBgColor: string;
  inactiveBgColor: string;
  containerBgColor: string;
  containerBorderRadius: number;
  tabBorderRadius: number;
  containerPadding: number;
  tabPaddingV: number;
  tabPaddingH: number;
  fontSize: number;
  fontWeight: string;
  activeShadow: boolean;
  activeIndicator: "bg" | "underline";
}

export const TAB_PRESETS: TabPreset[] = [
  {
    id: "pill-simple",
    name: "Simple Pill",
    description: "Clean pill tabs with white active state",
    variant: "pill",
    tabs: [
      { id: "t1", label: "Standard", active: true },
      { id: "t2", label: "Premium", active: false },
    ],
    activeColor: "#1A1A1A",
    inactiveColor: "#999999",
    activeBgColor: "#FFFFFF",
    inactiveBgColor: "transparent",
    containerBgColor: "#F0F0F0",
    containerBorderRadius: 12,
    tabBorderRadius: 10,
    containerPadding: 4,
    tabPaddingV: 8,
    tabPaddingH: 16,
    fontSize: 13,
    fontWeight: "600",
    activeShadow: true,
    activeIndicator: "bg",
  },
  {
    id: "pill-filled",
    name: "Filled Pill",
    description: "Bold filled active tab with accent color",
    variant: "filled",
    tabs: [
      { id: "t1", label: "Standard", active: true },
      { id: "t2", label: "Premium", active: false },
    ],
    activeColor: "#FFFFFF",
    inactiveColor: "#1A1A1A",
    activeBgColor: "#6C5CE7",
    inactiveBgColor: "transparent",
    containerBgColor: "#F0F0F0",
    containerBorderRadius: 16,
    tabBorderRadius: 12,
    containerPadding: 4,
    tabPaddingV: 10,
    tabPaddingH: 20,
    fontSize: 13,
    fontWeight: "600",
    activeShadow: false,
    activeIndicator: "bg",
  },
  {
    id: "pill-badge",
    name: "With Badge",
    description: "Tabs with inline badge text on active tab",
    variant: "pill-badge",
    tabs: [
      { id: "t1", label: "Monthly", active: false },
      { id: "t2", label: "Yearly", active: true, badge: "Save 19%" },
    ],
    activeColor: "#FFFFFF",
    inactiveColor: "#1A1A1A",
    activeBgColor: "#6C5CE7",
    inactiveBgColor: "transparent",
    containerBgColor: "#F0F0F0",
    containerBorderRadius: 16,
    tabBorderRadius: 12,
    containerPadding: 4,
    tabPaddingV: 10,
    tabPaddingH: 16,
    fontSize: 13,
    fontWeight: "600",
    activeShadow: false,
    activeIndicator: "bg",
  },
  {
    id: "separated",
    name: "Separated Pills",
    description: "Individual pills with spacing between them",
    variant: "separated",
    tabs: [
      { id: "t1", label: "Standard", active: true },
      { id: "t2", label: "Premium", active: false },
    ],
    activeColor: "#FFFFFF",
    inactiveColor: "#1A1A1A",
    activeBgColor: "#6C5CE7",
    inactiveBgColor: "#FFFFFF",
    containerBgColor: "transparent",
    containerBorderRadius: 0,
    tabBorderRadius: 14,
    containerPadding: 0,
    tabPaddingV: 12,
    tabPaddingH: 24,
    fontSize: 13,
    fontWeight: "600",
    activeShadow: true,
    activeIndicator: "bg",
  },
  {
    id: "underline",
    name: "Underline",
    description: "Minimal underline indicator style",
    variant: "underline",
    tabs: [
      { id: "t1", label: "Standard", active: true },
      { id: "t2", label: "Premium", active: false },
    ],
    activeColor: "#1A1A1A",
    inactiveColor: "#999999",
    activeBgColor: "transparent",
    inactiveBgColor: "transparent",
    containerBgColor: "#FFFFFF",
    containerBorderRadius: 0,
    tabBorderRadius: 0,
    containerPadding: 0,
    tabPaddingV: 12,
    tabPaddingH: 24,
    fontSize: 14,
    fontWeight: "600",
    activeShadow: false,
    activeIndicator: "underline",
  },
];

/* ────────────────────────────────────────────────────────────
   Mini tab preview renderer
   ──────────────────────────────────────────────────────────── */
function TabPreviewMini({ preset }: { preset: TabPreset }) {
  const isUnderline = preset.activeIndicator === "underline";
  const isSeparated = preset.variant === "separated";

  return (
    <div
      className="flex items-center justify-center"
      style={{
        backgroundColor: preset.containerBgColor,
        borderRadius: preset.containerBorderRadius,
        padding: isSeparated ? 0 : preset.containerPadding,
        gap: isSeparated ? 6 : 0,
        borderBottom: isUnderline ? "1px solid #E5E7EB" : undefined,
      }}
    >
      {preset.tabs.map((tab) => (
        <div
          key={tab.id}
          className="flex items-center justify-center gap-1 text-center"
          style={{
            flex: isSeparated ? undefined : 1,
            paddingTop: preset.tabPaddingV * 0.5,
            paddingBottom: preset.tabPaddingV * 0.5,
            paddingLeft: preset.tabPaddingH * 0.6,
            paddingRight: preset.tabPaddingH * 0.6,
            borderRadius: preset.tabBorderRadius,
            backgroundColor: tab.active ? preset.activeBgColor : preset.inactiveBgColor,
            color: tab.active ? preset.activeColor : preset.inactiveColor,
            fontSize: 10,
            fontWeight: preset.fontWeight,
            boxShadow:
              tab.active && preset.activeShadow ? "0 1px 3px rgba(0,0,0,0.1)" : undefined,
            borderBottom:
              isUnderline && tab.active
                ? `2px solid ${preset.activeColor}`
                : isUnderline
                  ? "2px solid transparent"
                  : undefined,
            whiteSpace: "nowrap",
          }}
        >
          <span>{tab.label}</span>
          {tab.badge && tab.active && (
            <span className="text-[8px] font-bold" style={{ color: preset.activeColor, opacity: 0.8 }}>
              {tab.badge}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TAB STYLE SIDEBAR
   ════════════════════════════════════════════════════════════ */
export function TabStyleSidebar({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (preset: TabPreset) => void;
}) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 flex flex-col bg-[#0e0e10] border-l border-white/[0.08] shadow-[-8px_0_40px_rgba(0,0,0,0.5)] transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: 340 }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-white">Tab Styles</span>
            <button
              onClick={onClose}
              className="p-2 text-white/30 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-[12px] text-white/40 mt-1">
            Pick a style, then customise everything in the properties panel
          </p>
        </div>

        {/* Preset list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {TAB_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                onSelect(preset);
                onClose();
              }}
              className="w-full group flex flex-col gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:bg-white/[0.05] hover:border-white/[0.12] transition-all text-left"
            >
              {/* Live preview */}
              <div className="w-full flex items-center justify-center py-2.5 px-3 bg-white/[0.03] rounded-xl">
                <TabPreviewMini preset={preset} />
              </div>

              {/* Label + description */}
              <div className="flex items-center justify-between w-full">
                <div>
                  <span className="text-[13px] font-semibold text-white/80 group-hover:text-white transition-colors">
                    {preset.name}
                  </span>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    {preset.description}
                  </p>
                </div>
                <ChevronRight
                  size={14}
                  className="text-white/15 group-hover:text-white/40 transition-colors shrink-0"
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   Helper: convert a preset into a TABS compound component
   structure — each tab gets its own content stack.
   
   The structure mirrors what you see in the layer tree:
   
   TABS (root)
   ├─ TAB_BUTTON (the switching UI)
   └─ TAB_PANELS
      ├─ Panel 1 (content for Tab 1) — initially has a Text child
      └─ Panel 2 (content for Tab 2) — initially has a Text child
   
   For the builder, we flatten this into a single component
   with nested data:
   ──────────────────────────────────────────────────────────── */
export function presetToTabComponentProps(preset: TabPreset): Record<string, any> {
  const tabs = preset.tabs.map((t) => ({
    ...t,
    // Each tab owns a content stack
    children: [
      {
        id: `text_${t.id}_${Date.now()}`,
        type: "TEXT",
        content: "Text",
        fontSize: 14,
        color: "#1A1A1A",
      },
    ],
  }));

  return {
    variant: preset.variant,
    tabs,
    activeTabId: tabs.find((t) => t.active)?.id || tabs[0]?.id,
    activeColor: preset.activeColor,
    inactiveColor: preset.inactiveColor,
    activeBgColor: preset.activeBgColor,
    inactiveBgColor: preset.inactiveBgColor,
    containerBgColor: preset.containerBgColor,
    containerBorderRadius: preset.containerBorderRadius,
    tabBorderRadius: preset.tabBorderRadius,
    containerPadding: preset.containerPadding,
    tabPaddingV: preset.tabPaddingV,
    tabPaddingH: preset.tabPaddingH,
    fontSize: preset.fontSize,
    fontWeight: preset.fontWeight,
    activeShadow: preset.activeShadow,
    activeIndicator: preset.activeIndicator,
  };
}