"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  ChevronLeft,
  X,
  ArrowLeft,
  EyeOff,
  GitBranch,
  SkipForward,
  Trash2,
} from "lucide-react";
import { SIDEBAR_TABS, type SidebarTab } from "../_lib/constants";
import type { Screen, BranchRule, SkipCondition, RuleOperator } from "@/lib/types";

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

/* ══════════════════════════════════════════════════════════════
   SCREEN LOGIC PANEL

   Configure branch rules (conditional navigation) and
   skip conditions for a screen. Each screen can have multiple
   rules evaluated top-to-bottom, with fallback to default flow.
   ══════════════════════════════════════════════════════════════ */

const OPERATOR_OPTIONS: { value: RuleOperator; label: string }[] = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "is_set", label: "is answered" },
  { value: "is_not_set", label: "is not answered" },
];

/** Extract all fieldKeys from a screen's input components */
function getFieldKeys(screen: Screen): { fieldKey: string; label: string; type: string }[] {
  const inputTypes = ["TEXT_INPUT", "SINGLE_SELECT", "MULTI_SELECT", "SLIDER"];
  return screen.components
    .filter((c) => inputTypes.includes(c.type))
    .map((c) => {
      const p = c.props as Record<string, any>;
      return {
        fieldKey: p.fieldKey || c.id,
        label: p.label || p.placeholder || p.fieldKey || c.type,
        type: c.type,
      };
    });
}

function RuleRow({
  fieldKeys,
  fieldKey,
  operator,
  value,
  onChangeField,
  onChangeOperator,
  onChangeValue,
  onDelete,
  children,
}: {
  fieldKeys: { fieldKey: string; label: string; type: string }[];
  fieldKey: string;
  operator: RuleOperator;
  value?: string | string[];
  onChangeField: (v: string) => void;
  onChangeOperator: (v: RuleOperator) => void;
  onChangeValue: (v: string) => void;
  onDelete: () => void;
  children?: React.ReactNode;
}) {
  const needsValue = operator !== "is_set" && operator !== "is_not_set";

  return (
    <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-2 relative group/rule">
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 p-1 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover/rule:opacity-100"
      >
        <Trash2 size={11} />
      </button>

      {/* Field picker */}
      <div className="space-y-1">
        <span className="text-[9px] text-white/30 uppercase tracking-wider">When</span>
        <select
          value={fieldKey}
          onChange={(e) => onChangeField(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[11px] text-white/70 focus:outline-none focus:border-white/[0.2] appearance-none cursor-pointer"
        >
          <option value="">Select field…</option>
          {fieldKeys.map((f) => (
            <option key={f.fieldKey} value={f.fieldKey}>
              {f.label} ({f.fieldKey})
            </option>
          ))}
        </select>
      </div>

      {/* Operator */}
      <select
        value={operator}
        onChange={(e) => onChangeOperator(e.target.value as RuleOperator)}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[11px] text-white/70 focus:outline-none focus:border-white/[0.2] appearance-none cursor-pointer"
      >
        {OPERATOR_OPTIONS.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {/* Value (hidden for is_set / is_not_set) */}
      {needsValue && (
        <input
          type="text"
          value={typeof value === "string" ? value : (value || []).join(", ")}
          onChange={(e) => onChangeValue(e.target.value)}
          placeholder="Value to match…"
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[11px] text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/[0.2]"
        />
      )}

      {/* Extra content (target screen for branch rules) */}
      {children}
    </div>
  );
}

export function ScreenLogicPanel({
  currentScreen,
  allScreens,
  onUpdateBranchRules,
  onUpdateSkipConditions,
}: {
  currentScreen: Screen;
  allScreens: Screen[];
  onUpdateBranchRules: (rules: BranchRule[]) => void;
  onUpdateSkipConditions: (conditions: SkipCondition[]) => void;
}) {
  const fieldKeys = getFieldKeys(currentScreen);
  const branchRules = currentScreen.branchRules || [];
  const skipConditions = currentScreen.skipWhen || [];
  const otherScreens = allScreens.filter((s) => s.id !== currentScreen.id);

  const addBranchRule = () => {
    onUpdateBranchRules([
      ...branchRules,
      {
        id: `rule_${Date.now()}`,
        fieldKey: fieldKeys[0]?.fieldKey || "",
        operator: "equals",
        value: "",
        targetScreenId: otherScreens[0]?.id || "",
      },
    ]);
  };

  const updateBranchRule = (index: number, patch: Partial<BranchRule>) => {
    const updated = [...branchRules];
    updated[index] = { ...updated[index], ...patch };
    onUpdateBranchRules(updated);
  };

  const deleteBranchRule = (index: number) => {
    onUpdateBranchRules(branchRules.filter((_, i) => i !== index));
  };

  const addSkipCondition = () => {
    onUpdateSkipConditions([
      ...skipConditions,
      {
        id: `skip_${Date.now()}`,
        fieldKey: fieldKeys[0]?.fieldKey || "",
        operator: "is_set",
      },
    ]);
  };

  const updateSkipCondition = (index: number, patch: Partial<SkipCondition>) => {
    const updated = [...skipConditions];
    updated[index] = { ...updated[index], ...patch };
    onUpdateSkipConditions(updated);
  };

  const deleteSkipCondition = (index: number) => {
    onUpdateSkipConditions(skipConditions.filter((_, i) => i !== index));
  };

  return (
    <div className="px-3 pt-3 pb-2 space-y-4 border-t border-white/[0.06]">
      {/* ── Branch Rules ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <GitBranch size={12} className="text-purple-400/60" />
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
            Branch Rules
          </span>
        </div>
        <p className="text-[10px] text-white/25 leading-relaxed">
          Route to a specific screen based on user input. Rules are checked top-to-bottom; first match wins.
        </p>

        {fieldKeys.length === 0 && branchRules.length === 0 && (
          <p className="text-[10px] text-white/20 italic py-2">
            Add input components (select, text input, slider) to this screen to create branch rules.
          </p>
        )}

        {branchRules.map((rule, i) => (
          <RuleRow
            key={rule.id}
            fieldKeys={fieldKeys}
            fieldKey={rule.fieldKey}
            operator={rule.operator}
            value={rule.value}
            onChangeField={(v) => updateBranchRule(i, { fieldKey: v })}
            onChangeOperator={(v) => updateBranchRule(i, { operator: v })}
            onChangeValue={(v) => updateBranchRule(i, { value: v })}
            onDelete={() => deleteBranchRule(i)}
          >
            {/* Target screen picker */}
            <div className="space-y-1">
              <span className="text-[9px] text-white/30 uppercase tracking-wider">Go to</span>
              <select
                value={rule.targetScreenId}
                onChange={(e) => updateBranchRule(i, { targetScreenId: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-[11px] text-white/70 focus:outline-none focus:border-white/[0.2] appearance-none cursor-pointer"
              >
                <option value="">Select screen…</option>
                {otherScreens.map((s, si) => (
                  <option key={s.id} value={s.id}>
                    {allScreens.indexOf(s) + 1}. {s.name}
                  </option>
                ))}
              </select>
            </div>
          </RuleRow>
        ))}

        {(fieldKeys.length > 0 || branchRules.length > 0) && (
          <button
            onClick={addBranchRule}
            className="flex items-center justify-center gap-1.5 w-full py-2 bg-white/[0.02] border border-dashed border-white/[0.08] rounded-xl text-[11px] text-white/30 hover:text-white/60 hover:border-white/[0.15] transition-all"
          >
            <Plus size={12} />
            Add Branch Rule
          </button>
        )}
      </div>

      {/* ── Skip Conditions ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <SkipForward size={12} className="text-amber-400/60" />
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
            Skip Conditions
          </span>
        </div>
        <p className="text-[10px] text-white/25 leading-relaxed">
          Skip this screen entirely when conditions are met. Conditions check answers from previous screens.
        </p>

        {skipConditions.map((cond, i) => (
          <RuleRow
            key={cond.id}
            fieldKeys={
              // For skip conditions, gather fieldKeys from ALL previous screens
              allScreens
                .slice(0, allScreens.indexOf(currentScreen))
                .flatMap(getFieldKeys)
            }
            fieldKey={cond.fieldKey}
            operator={cond.operator}
            value={cond.value}
            onChangeField={(v) => updateSkipCondition(i, { fieldKey: v })}
            onChangeOperator={(v) => updateSkipCondition(i, { operator: v })}
            onChangeValue={(v) => updateSkipCondition(i, { value: v })}
            onDelete={() => deleteSkipCondition(i)}
          />
        ))}

        <button
          onClick={addSkipCondition}
          className="flex items-center justify-center gap-1.5 w-full py-2 bg-white/[0.02] border border-dashed border-white/[0.08] rounded-xl text-[11px] text-white/30 hover:text-white/60 hover:border-white/[0.15] transition-all"
        >
          <Plus size={12} />
          Add Skip Condition
        </button>
      </div>
    </div>
  );
}
