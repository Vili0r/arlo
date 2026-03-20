"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  ChevronLeft,
  X,
  ArrowLeft,
  EyeOff,
} from "lucide-react";
import { SIDEBAR_TABS, type SidebarTab } from "../_lib/constants";

/* ── TYPES ── */
export type BackButtonStyle = "chevron" | "arrow" | "x" | "none";

export interface IndicatorSettings {
  visible: boolean;
  backButtonStyle: BackButtonStyle;
  backButtonBgColor: string;
  progressColor: string;
  trackColor: string;
  height: number;
  autoAdapt: boolean;
}

const DEFAULT_INDICATOR: IndicatorSettings = {
  visible: true,
  backButtonStyle: "chevron",
  backButtonBgColor: "",
  progressColor: "",
  trackColor: "",
  height: 3,
  autoAdapt: true,
};

export function mergeIndicator(
  global: Partial<IndicatorSettings> | undefined,
  perScreen: Partial<IndicatorSettings> | undefined,
): IndicatorSettings {
  return {
    ...DEFAULT_INDICATOR,
    ...global,
    ...perScreen,
  };
}

/* ── HELPER: BACK ICON ── */
export function BackIcon({ style, color, size = 18 }: { style: BackButtonStyle; color: string; size?: number }) {
  switch (style) {
    case "chevron":
      return <ChevronLeft size={size} strokeWidth={2} style={{ color }} />;
    case "arrow":
      return <ArrowLeft size={size} strokeWidth={2} style={{ color }} />;
    case "x":
      return <X size={size - 2} strokeWidth={2} style={{ color }} />;
    case "none":
    default:
      return <div style={{ width: size }} />;
  }
}

/* ── SIDEBAR TAB BUTTONS ── */
export function SidebarTabButtons({
  activeTab,
  sidebarExpanded,
  onTabClick,
}: {
  activeTab: SidebarTab;
  sidebarExpanded: boolean;
  onTabClick: (tab: SidebarTab) => void;
}) {
  return (
    <>
      {SIDEBAR_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative group ${
            activeTab === tab.id && sidebarExpanded
              ? "bg-white/[0.1] text-white"
              : "text-white/35 hover:text-white/70 hover:bg-white/[0.05]"
          }`}
        >
          <tab.icon size={18} />
          {!sidebarExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-white/10 backdrop-blur-md border border-white/[0.12] rounded-lg text-[11px] text-white font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {tab.label}
            </div>
          )}
        </button>
      ))}
    </>
  );
}

/* ── INDICATOR SETTINGS PANEL ── */
const BACK_BUTTON_OPTIONS: { value: BackButtonStyle; label: string; icon: React.ReactNode }[] = [
  { value: "chevron", label: "‹", icon: <ChevronLeft size={12} /> },
  { value: "arrow", label: "←", icon: <ArrowLeft size={12} /> },
  { value: "x", label: "✕", icon: <X size={11} /> },
  { value: "none", label: "—", icon: <EyeOff size={11} /> },
];

export function IndicatorSettingsPanel({
  globalIndicator,
  screenIndicator,
  onUpdateGlobal,
  onUpdateScreen,
  onClearScreenOverride,
  hasScreenOverride,
  screenName,
}: {
  globalIndicator: Partial<IndicatorSettings> | undefined;
  screenIndicator: Partial<IndicatorSettings> | undefined;
  onUpdateGlobal: (patch: Partial<IndicatorSettings>) => void;
  onUpdateScreen: (patch: Partial<IndicatorSettings>) => void;
  onClearScreenOverride: () => void;
  hasScreenOverride: boolean;
  screenName: string;
}) {
  const merged = mergeIndicator(globalIndicator, screenIndicator);
  const [showPerScreen, setShowPerScreen] = useState(hasScreenOverride);

  useEffect(() => {
    setShowPerScreen(hasScreenOverride);
  }, [hasScreenOverride]);

  const onUpdate = showPerScreen ? onUpdateScreen : onUpdateGlobal;

  return (
    <div className="px-3 pt-3 pb-2 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
          Indicator
        </span>
        <span className="text-[9px] text-white/20">
          {showPerScreen ? `Override: ${screenName}` : "All screens"}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/50">Show indicator</span>
        <button
          onClick={() => onUpdate({ visible: !merged.visible })}
          className={`relative w-8 h-[18px] rounded-full transition-colors ${
            merged.visible ? "bg-blue-500" : "bg-white/[0.12]"
          }`}
        >
          <div
            className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform ${
              merged.visible ? "left-[16px]" : "left-[2px]"
            }`}
          />
        </button>
      </div>

      {merged.visible && (
        <>
          <div className="space-y-1.5">
            <span className="text-[11px] text-white/50">Back button</span>
            <div className="flex items-center gap-1">
              {BACK_BUTTON_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ backButtonStyle: opt.value })}
                  className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    merged.backButtonStyle === opt.value
                      ? "bg-white/[0.12] text-white ring-1 ring-white/[0.15]"
                      : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
                  }`}
                  title={opt.label}
                >
                  {opt.icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/50">Back btn bg</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onUpdate({ backButtonBgColor: "" })}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                  !merged.backButtonBgColor
                    ? "bg-white/[0.12] text-white"
                    : "text-white/30 hover:text-white/50"
                }`}
              >
                Auto
              </button>
              <div className="relative shrink-0">
                <div
                  className="w-5 h-5 rounded-md border border-white/[0.15]"
                  style={{ backgroundColor: merged.backButtonBgColor || "transparent" }}
                />
                <input
                  type="color"
                  value={merged.backButtonBgColor || "#000000"}
                  onChange={(e) => onUpdate({ backButtonBgColor: e.target.value })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/50">Bar colour</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onUpdate({ progressColor: "", autoAdapt: true })}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                  merged.autoAdapt && !merged.progressColor
                    ? "bg-white/[0.12] text-white"
                    : "text-white/30 hover:text-white/50"
                }`}
              >
                Auto
              </button>
              <div className="relative shrink-0">
                <div
                  className="w-5 h-5 rounded-md border border-white/[0.15]"
                  style={{ backgroundColor: merged.progressColor || "#666" }}
                />
                <input
                  type="color"
                  value={merged.progressColor || "#666666"}
                  onChange={(e) => onUpdate({ progressColor: e.target.value, autoAdapt: false })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/50">Track colour</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onUpdate({ trackColor: "", autoAdapt: true })}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                  merged.autoAdapt && !merged.trackColor
                    ? "bg-white/[0.12] text-white"
                    : "text-white/30 hover:text-white/50"
                }`}
              >
                Auto
              </button>
              <div className="relative shrink-0">
                <div
                  className="w-5 h-5 rounded-md border border-white/[0.15]"
                  style={{ backgroundColor: merged.trackColor || "#ccc" }}
                />
                <input
                  type="color"
                  value={merged.trackColor || "#cccccc"}
                  onChange={(e) => onUpdate({ trackColor: e.target.value, autoAdapt: false })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/50">Thickness</span>
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={merged.height}
                onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                className="w-14 accent-blue-500"
              />
              <span className="text-[10px] text-white/30 font-mono w-[16px] text-right">
                {merged.height}
              </span>
            </div>
          </div>
        </>
      )}

      <div className="border-t border-white/[0.06] pt-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/35">Override for this screen</span>
          <button
            onClick={() => {
              if (showPerScreen) {
                onClearScreenOverride();
                setShowPerScreen(false);
              } else {
                setShowPerScreen(true);
              }
            }}
            className={`relative w-8 h-[18px] rounded-full transition-colors ${
              showPerScreen ? "bg-blue-500" : "bg-white/[0.12]"
            }`}
          >
            <div
              className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform ${
                showPerScreen ? "left-[16px]" : "left-[2px]"
              }`}
            />
          </button>
        </div>
        {showPerScreen && (
          <p className="text-[9px] text-white/20 mt-1">
            Changes above now apply only to "{screenName}"
          </p>
        )}
      </div>
    </div>
  );
}

/* ── SCREEN STYLE SECTION ── */
export function ScreenStyleSection({
  currentScreen,
  onUpdateStyle,
}: {
  currentScreen: any;
  onUpdateStyle: (patch: any) => void;
}) {
  if (!currentScreen) return null;

  return (
    <div className="px-3 pt-3 pb-2 space-y-3 border-t border-white/[0.06]">
      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
        Screen Style
      </span>

      <div className="space-y-2">
        <span className="text-[11px] text-white/50">Background</span>
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <div
              className="w-9 h-9 rounded-lg border border-white/[0.15] shadow-inner"
              style={{ backgroundColor: currentScreen.style?.backgroundColor || "#FFFFFF" }}
            />
            <input
              type="color"
              value={currentScreen.style?.backgroundColor || "#FFFFFF"}
              onChange={(e) => onUpdateStyle({ backgroundColor: e.target.value })}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <input
            type="text"
            value={(currentScreen.style?.backgroundColor || "#FFFFFF").toUpperCase()}
            onChange={(e) => {
              let val = e.target.value;
              if (!val.startsWith("#")) val = "#" + val;
              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                onUpdateStyle({ backgroundColor: val });
              }
            }}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white/70 placeholder:text-white/25 focus:outline-none focus:border-white/[0.2] transition-colors"
            placeholder="#FFFFFF"
            maxLength={7}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {["#FFFFFF", "#F9FAFB", "#F3F4F6", "#111111", "#0F172A", "#FFF7ED", "#F0FDF4", "#EFF6FF"].map(
          (color) => (
            <button
              key={color}
              onClick={() => onUpdateStyle({ backgroundColor: color })}
              className={`w-5 h-5 rounded-md border transition-all ${
                (currentScreen.style?.backgroundColor || "#FFFFFF") === color
                  ? "border-blue-500 ring-1 ring-blue-500 scale-110"
                  : "border-white/[0.15] hover:border-white/[0.3]"
              }`}
              style={{ backgroundColor: color }}
            />
          ),
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/50">Padding</span>
        <div className="flex items-center gap-1.5">
          <input
            type="range"
            min={0}
            max={48}
            step={4}
            value={currentScreen.style?.padding ?? 24}
            onChange={(e) => onUpdateStyle({ padding: Number(e.target.value) })}
            className="w-16 accent-blue-500"
          />
          <span className="text-[10px] text-white/30 font-mono w-[22px] text-right">
            {currentScreen.style?.padding ?? 24}
          </span>
        </div>
      </div>
    </div>
  );
}
