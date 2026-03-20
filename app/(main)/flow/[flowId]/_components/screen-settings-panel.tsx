"use client";

import React, { useState } from "react";
import {
  X,
  GitBranch,
  Zap,
  ArrowRight,
  Plus,
  Trash2,
  ChevronDown,
} from "lucide-react";
import type { Screen, FlowComponent } from "@/lib/types";
import { ScreenTransitionEditor } from "./animation-property-editor";
import type { ScreenTransitionConfig } from "../_lib/animation-presets";

/* ════════════════════════════════════════════════════════════
   SCREEN SETTINGS PANEL
   
   A slide-out panel for screen-level settings:
   - Background color
   - Screen transition to next screen
   - Skip logic / branching conditions
   - Screen-level padding
   
   Opens when user clicks "Settings" on a screen card
   ════════════════════════════════════════════════════════════ */

export interface ScreenBranch {
  id: string;
  componentId: string;       // which component's value to check
  operator: "equals" | "contains" | "not_equals" | "greater_than" | "less_than";
  value: string;
  targetScreenId: string;    // which screen to jump to
}

export interface ScreenSettings {
  // Stored on the screen directly
  skipCondition?: {
    enabled: boolean;
    // Skip this screen when:
    rule: "always" | "variable_equals" | "variable_not_equals";
    variableKey?: string;
    variableValue?: string;
  };
  branches?: ScreenBranch[];
  transition?: ScreenTransitionConfig;
}

export function ScreenSettingsPanel({
  open,
  screen,
  screenIndex,
  screens,
  onClose,
  onUpdateScreen,
  onUpdateTransition,
}: {
  open: boolean;
  screen: Screen | null;
  screenIndex: number;
  screens: Screen[];
  onClose: () => void;
  onUpdateScreen: (patch: Partial<Screen>) => void;
  onUpdateTransition: (transition: ScreenTransitionConfig) => void;
}) {
  const [activeSection, setActiveSection] = useState<"style" | "transition" | "logic">("style");

  if (!screen) return null;

  const otherScreens = screens.filter((_, i) => i !== screenIndex);
  const branches: ScreenBranch[] = (screen as any).branches || [];
  const skipCondition = (screen as any).skipCondition || { enabled: false, rule: "always" };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 flex flex-col bg-[#0e0e10] border-l border-white/[0.08] shadow-[-8px_0_40px_rgba(0,0,0,0.5)] transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: 360 }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-white">
              {screen.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.06] text-white/30">
              Screen {screenIndex + 1}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/30 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-white/[0.08] shrink-0">
          {(
            [
              { id: "style", label: "Style" },
              { id: "transition", label: "Transition" },
              { id: "logic", label: "Logic" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex-1 py-2.5 text-[12px] font-medium transition-all border-b-2 ${
                activeSection === tab.id
                  ? "text-white border-[#7C65F6]"
                  : "text-white/40 border-transparent hover:text-white/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeSection === "style" && (
            <StyleSection screen={screen} onUpdate={onUpdateScreen} />
          )}
          {activeSection === "transition" && (
            <TransitionSection
              transition={(screen as any).transition}
              onUpdate={onUpdateTransition}
            />
          )}
          {activeSection === "logic" && (
            <LogicSection
              screen={screen}
              screens={screens}
              screenIndex={screenIndex}
              branches={branches}
              skipCondition={skipCondition}
              onUpdateScreen={onUpdateScreen}
            />
          )}
        </div>
      </div>
    </>
  );
}

/* ── STYLE SECTION ────────────────────────── */

function StyleSection({
  screen,
  onUpdate,
}: {
  screen: Screen;
  onUpdate: (patch: Partial<Screen>) => void;
}) {
  const bgColor = screen.style?.backgroundColor || "#FFFFFF";
  const padding = screen.style?.padding || 24;

  return (
    <div className="space-y-4">
      <div className="text-[13px] font-semibold text-white/90 mb-3">Appearance</div>

      {/* Background color */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-white/50">Background</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={bgColor}
            onChange={(e) =>
              onUpdate({
                style: { ...screen.style, backgroundColor: e.target.value },
              })
            }
            className="w-7 h-7 rounded-md border border-white/[0.08] bg-transparent cursor-pointer shrink-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none"
          />
          <input
            type="text"
            value={bgColor}
            onChange={(e) =>
              onUpdate({
                style: { ...screen.style, backgroundColor: e.target.value },
              })
            }
            className="w-[80px] bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-[12px] text-white font-mono focus:outline-none focus:border-white/[0.2]"
          />
        </div>
      </div>

      {/* Padding */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-white/50">Padding</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={48}
            step={4}
            value={padding}
            onChange={(e) =>
              onUpdate({
                style: { ...screen.style, padding: Number(e.target.value) },
              })
            }
            className="w-[100px] accent-[#7C65F6] h-1"
          />
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-md overflow-hidden w-[56px] h-7">
            <input
              type="number"
              value={padding}
              min={0}
              max={64}
              onChange={(e) =>
                onUpdate({
                  style: { ...screen.style, padding: Number(e.target.value) || 0 },
                })
              }
              className="w-full bg-transparent px-2 py-1 text-[11px] text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>

      {/* Content alignment */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-white/50">Align content</span>
        <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-lg overflow-hidden">
          {(["flex-start", "center", "flex-end", "space-between"] as const).map(
            (val) => {
              const isActive = (screen.style?.justifyContent || "flex-start") === val;
              const labels: Record<string, string> = {
                "flex-start": "Top",
                center: "Mid",
                "flex-end": "End",
                "space-between": "Spread",
              };
              return (
                <button
                  key={val}
                  onClick={() =>
                    onUpdate({
                      style: { ...screen.style, justifyContent: val },
                    })
                  }
                  className={`px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                    isActive
                      ? "bg-[#7C65F6]/20 text-[#7C65F6]"
                      : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {labels[val]}
                </button>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

/* ── TRANSITION SECTION ───────────────────── */

function TransitionSection({
  transition,
  onUpdate,
}: {
  transition?: ScreenTransitionConfig;
  onUpdate: (transition: ScreenTransitionConfig) => void;
}) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-white/90 mb-3">
        Screen transition
      </div>
      <p className="text-[11px] text-white/30 mb-4 leading-relaxed">
        Animation when navigating from this screen to the next. This overrides the global flow transition for this specific screen.
      </p>
      <ScreenTransitionEditor transition={transition} onUpdate={onUpdate} />
    </div>
  );
}

/* ── LOGIC SECTION ────────────────────────── */

function LogicSection({
  screen,
  screens,
  screenIndex,
  branches,
  skipCondition,
  onUpdateScreen,
}: {
  screen: Screen;
  screens: Screen[];
  screenIndex: number;
  branches: ScreenBranch[];
  skipCondition: { enabled: boolean; rule: string; variableKey?: string; variableValue?: string };
  onUpdateScreen: (patch: Partial<Screen>) => void;
}) {
  const otherScreens = screens.filter((_, i) => i !== screenIndex);
  const interactiveComponents = screen.components.filter((c) =>
    ["TEXT_INPUT", "SINGLE_SELECT", "MULTI_SELECT", "SLIDER", "BUTTON"].includes(c.type)
  );

  return (
    <div className="space-y-6">
      {/* Skip condition */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={13} className="text-amber-400" />
          <span className="text-[13px] font-semibold text-white/90">
            Skip condition
          </span>
        </div>
        <p className="text-[11px] text-white/30 mb-3 leading-relaxed">
          Skip this screen when a condition is met. Useful for showing screens only to certain user segments.
        </p>

        <button
          onClick={() =>
            onUpdateScreen({
              ...screen,
              skipCondition: {
                ...skipCondition,
                enabled: !skipCondition.enabled,
              },
            } as any)
          }
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${
            skipCondition.enabled
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]"
          }`}
        >
          <span className="text-[12px] text-white/60">Enable skip logic</span>
          <div
            className={`w-8 h-4.5 rounded-full transition-colors relative ${
              skipCondition.enabled ? "bg-amber-500" : "bg-white/10"
            }`}
          >
            <div
              className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
                skipCondition.enabled ? "translate-x-[14px]" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>

        {skipCondition.enabled && (
          <div className="mt-3 space-y-2 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/40 shrink-0">When</span>
              <select
                value={skipCondition.rule}
                onChange={(e) =>
                  onUpdateScreen({
                    ...screen,
                    skipCondition: { ...skipCondition, rule: e.target.value },
                  } as any)
                }
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-[11px] text-white focus:outline-none appearance-none cursor-pointer"
              >
                <option value="always" className="bg-[#1a1a1a]">Always skip</option>
                <option value="variable_equals" className="bg-[#1a1a1a]">Variable equals</option>
                <option value="variable_not_equals" className="bg-[#1a1a1a]">Variable not equals</option>
              </select>
            </div>

            {skipCondition.rule !== "always" && (
              <>
                <input
                  type="text"
                  placeholder="Variable key (e.g. user.plan)"
                  value={skipCondition.variableKey || ""}
                  onChange={(e) =>
                    onUpdateScreen({
                      ...screen,
                      skipCondition: {
                        ...skipCondition,
                        variableKey: e.target.value,
                      },
                    } as any)
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.2]"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={skipCondition.variableValue || ""}
                  onChange={(e) =>
                    onUpdateScreen({
                      ...screen,
                      skipCondition: {
                        ...skipCondition,
                        variableValue: e.target.value,
                      },
                    } as any)
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.2]"
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Branching */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <GitBranch size={13} className="text-purple-400" />
          <span className="text-[13px] font-semibold text-white/90">
            Branching
          </span>
        </div>
        <p className="text-[11px] text-white/30 mb-3 leading-relaxed">
          Route users to different screens based on their input on this screen. Without branches, users proceed to the next screen in order.
        </p>

        {interactiveComponents.length === 0 ? (
          <div className="px-3 py-4 border border-dashed border-white/[0.08] rounded-lg text-center">
            <p className="text-[11px] text-white/25">
              Add an interactive component (input, select, slider) to this screen to enable branching.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {branches.map((branch, bi) => (
              <BranchRow
                key={branch.id}
                branch={branch}
                components={interactiveComponents}
                otherScreens={otherScreens}
                onUpdate={(patch) => {
                  const updated = [...branches];
                  updated[bi] = { ...branch, ...patch };
                  onUpdateScreen({ ...screen, branches: updated } as any);
                }}
                onDelete={() => {
                  onUpdateScreen({
                    ...screen,
                    branches: branches.filter((_, i) => i !== bi),
                  } as any);
                }}
              />
            ))}

            <button
              onClick={() => {
                const newBranch: ScreenBranch = {
                  id: `branch_${Date.now()}`,
                  componentId: interactiveComponents[0]?.id || "",
                  operator: "equals",
                  value: "",
                  targetScreenId: otherScreens[0]?.id || "",
                };
                onUpdateScreen({
                  ...screen,
                  branches: [...branches, newBranch],
                } as any);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium text-purple-300/60 hover:text-purple-300 hover:bg-purple-500/5 rounded-lg border border-dashed border-purple-500/20 hover:border-purple-500/40 transition-all"
            >
              <Plus size={11} /> Add branch
            </button>
          </div>
        )}

        {/* Default next */}
        {branches.length > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg">
            <ArrowRight size={11} className="text-white/25 shrink-0" />
            <span className="text-[11px] text-white/30">
              Default: proceed to next screen in order
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Branch row ───────────────────────────── */

function BranchRow({
  branch,
  components,
  otherScreens,
  onUpdate,
  onDelete,
}: {
  branch: ScreenBranch;
  components: FlowComponent[];
  otherScreens: Screen[];
  onUpdate: (patch: Partial<ScreenBranch>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-purple-300/50 font-medium uppercase tracking-wider">
          If
        </span>
        <button
          onClick={onDelete}
          className="p-1 text-white/20 hover:text-red-400 rounded transition-colors"
        >
          <Trash2 size={10} />
        </button>
      </div>

      {/* Component selector */}
      <select
        value={branch.componentId}
        onChange={(e) => onUpdate({ componentId: e.target.value })}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-[11px] text-white focus:outline-none appearance-none cursor-pointer"
      >
        {components.map((c) => {
          const label = (c.props as any).label || (c.props as any).placeholder || c.type;
          return (
            <option key={c.id} value={c.id} className="bg-[#1a1a1a]">
              {c.type}: {label}
            </option>
          );
        })}
      </select>

      {/* Operator + value */}
      <div className="flex gap-1.5">
        <select
          value={branch.operator}
          onChange={(e) => onUpdate({ operator: e.target.value as any })}
          className="w-[100px] bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-[11px] text-white focus:outline-none appearance-none cursor-pointer shrink-0"
        >
          <option value="equals" className="bg-[#1a1a1a]">equals</option>
          <option value="not_equals" className="bg-[#1a1a1a]">not equals</option>
          <option value="contains" className="bg-[#1a1a1a]">contains</option>
          <option value="greater_than" className="bg-[#1a1a1a]">{">"}</option>
          <option value="less_than" className="bg-[#1a1a1a]">{"<"}</option>
        </select>
        <input
          type="text"
          placeholder="Value"
          value={branch.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.2]"
        />
      </div>

      {/* Target screen */}
      <div className="flex items-center gap-1.5">
        <ArrowRight size={11} className="text-purple-400/50 shrink-0" />
        <span className="text-[10px] text-white/30 shrink-0">Go to</span>
        <select
          value={branch.targetScreenId}
          onChange={(e) => onUpdate({ targetScreenId: e.target.value })}
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1.5 text-[11px] text-white focus:outline-none appearance-none cursor-pointer"
        >
          {otherScreens.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#1a1a1a]">
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}