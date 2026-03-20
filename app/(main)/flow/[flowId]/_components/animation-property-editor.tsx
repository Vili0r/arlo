"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Play, RotateCcw, Sparkles, ChevronDown, Zap } from "lucide-react";
import {
  ENTRANCE_PRESETS,
  EXIT_PRESETS,
  EASING_OPTIONS,
  DEFAULT_ANIMATION,
  type AnimationConfig,
  type ComponentAnimation,
  type EasingPreset,
  getEntrancePreset,
  getExitPreset,
  getEasingCSS,
  keyframesToCSS,
} from "../_lib/animation-presets";

/* ════════════════════════════════════════════════════════════
   ANIMATION PROPERTY EDITOR
   
   Renders as a collapsible section in the property sheet.
   Props:
     animation: ComponentAnimation | undefined
     onUpdate: (animation: ComponentAnimation) => void
     componentId: string  — used for unique keyframe names
   ════════════════════════════════════════════════════════════ */

export function AnimationPropertyEditor({
  animation,
  onUpdate,
  componentId,
}: {
  animation: ComponentAnimation | undefined;
  onUpdate: (animation: ComponentAnimation) => void;
  componentId: string;
}) {
  const entrance = animation?.entrance || { ...DEFAULT_ANIMATION };
  const exit = animation?.exit || { ...DEFAULT_ANIMATION };
  const [previewKey, setPreviewKey] = useState(0);
  const [activePhase, setActivePhase] = useState<"entrance" | "exit">("entrance");

  const updateEntrance = useCallback(
    (patch: Partial<AnimationConfig>) => {
      onUpdate({
        ...animation,
        entrance: { ...entrance, ...patch },
      });
    },
    [animation, entrance, onUpdate],
  );

  const updateExit = useCallback(
    (patch: Partial<AnimationConfig>) => {
      onUpdate({
        ...animation,
        exit: { ...exit, ...patch },
      });
    },
    [animation, exit, onUpdate],
  );

  const hasEntrance = entrance.type !== "none";
  const hasExit = exit.type !== "none";
  const hasAny = hasEntrance || hasExit;

  return (
    <div className="border-t border-white/[0.06] pt-4 mt-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-purple-400" />
          <span className="text-[13px] font-semibold text-white/90">Animation</span>
          {hasAny && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium">
              {hasEntrance && hasExit ? "In + Out" : hasEntrance ? "In" : "Out"}
            </span>
          )}
        </div>
        {hasAny && (
          <button
            onClick={() => setPreviewKey((k) => k + 1)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 rounded-md transition-colors"
          >
            <Play size={10} fill="currentColor" /> Preview
          </button>
        )}
      </div>

      {/* Phase toggle */}
      <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-lg p-0.5 mb-3">
        {(["entrance", "exit"] as const).map((phase) => (
          <button
            key={phase}
            onClick={() => setActivePhase(phase)}
            className={`flex-1 text-[12px] font-medium py-1.5 rounded-md transition-all ${
              activePhase === phase
                ? "bg-white/[0.08] text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {phase === "entrance" ? "Entrance" : "Exit"}
          </button>
        ))}
      </div>

      {/* Active phase editor */}
      {activePhase === "entrance" ? (
        <AnimationPhaseEditor
          config={entrance}
          presets={ENTRANCE_PRESETS}
          onUpdate={updateEntrance}
          componentId={componentId}
          phase="entrance"
          previewKey={previewKey}
        />
      ) : (
        <AnimationPhaseEditor
          config={exit}
          presets={EXIT_PRESETS}
          onUpdate={updateExit}
          componentId={componentId}
          phase="exit"
          previewKey={previewKey}
        />
      )}

      {/* Stagger hint */}
      {hasEntrance && entrance.delay === 0 && (
        <div className="mt-3 px-3 py-2 bg-white/[0.02] border border-white/[0.06] rounded-lg">
          <div className="flex items-start gap-2">
            <Zap size={12} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-white/35 leading-relaxed">
              <span className="text-white/50 font-medium">Tip:</span> Add a delay to stagger
              animations when multiple components animate on the same screen.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ANIMATION PHASE EDITOR — single entrance or exit config
   ════════════════════════════════════════════════════════════ */

function AnimationPhaseEditor({
  config,
  presets,
  onUpdate,
  componentId,
  phase,
  previewKey,
}: {
  config: AnimationConfig;
  presets: typeof ENTRANCE_PRESETS;
  onUpdate: (patch: Partial<AnimationConfig>) => void;
  componentId: string;
  phase: "entrance" | "exit";
  previewKey: number;
}) {
  const isActive = config.type !== "none";

  return (
    <div className="space-y-3">
      {/* Preset grid */}
      <div>
        <span className="text-[11px] text-white/40 mb-2 block">Preset</span>
        <div className="grid grid-cols-3 gap-1">
          {presets.map((preset) => (
            <PresetButton
              key={preset.value}
              preset={preset}
              isSelected={config.type === preset.value}
              onSelect={() => onUpdate({ type: preset.value })}
              componentId={componentId}
              phase={phase}
              previewKey={previewKey}
              config={config}
            />
          ))}
        </div>
      </div>

      {/* Timing controls — only show when an animation is selected */}
      {isActive && (
        <>
          {/* Duration */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-white/50 shrink-0">Duration</span>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <input
                type="range"
                min={100}
                max={2000}
                step={50}
                value={config.duration}
                onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
                className="flex-1 max-w-[120px] accent-purple-500 h-1"
              />
              <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-md overflow-hidden w-[72px] h-7">
                <input
                  type="number"
                  value={config.duration}
                  min={50}
                  max={5000}
                  step={50}
                  onChange={(e) => onUpdate({ duration: Number(e.target.value) || 400 })}
                  className="w-full bg-transparent px-2 py-1 text-[11px] text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[9px] text-white/20 pr-2 shrink-0">ms</span>
              </div>
            </div>
          </div>

          {/* Delay */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-white/50 shrink-0">Delay</span>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <input
                type="range"
                min={0}
                max={2000}
                step={50}
                value={config.delay}
                onChange={(e) => onUpdate({ delay: Number(e.target.value) })}
                className="flex-1 max-w-[120px] accent-purple-500 h-1"
              />
              <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-md overflow-hidden w-[72px] h-7">
                <input
                  type="number"
                  value={config.delay}
                  min={0}
                  max={5000}
                  step={50}
                  onChange={(e) => onUpdate({ delay: Number(e.target.value) || 0 })}
                  className="w-full bg-transparent px-2 py-1 text-[11px] text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[9px] text-white/20 pr-2 shrink-0">ms</span>
              </div>
            </div>
          </div>

          {/* Easing */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-white/50 shrink-0">Easing</span>
            <div className="relative flex-1 max-w-[160px]">
              <select
                value={config.easing}
                onChange={(e) => onUpdate({ easing: e.target.value as EasingPreset })}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[12px] text-white focus:outline-none focus:border-white/[0.2] hover:border-white/[0.12] transition-all appearance-none cursor-pointer pr-7"
              >
                {EASING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1a1a1a] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={10}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PRESET BUTTON — with inline animation preview on hover
   ════════════════════════════════════════════════════════════ */

function PresetButton({
  preset,
  isSelected,
  onSelect,
  componentId,
  phase,
  previewKey,
  config,
}: {
  preset: (typeof ENTRANCE_PRESETS)[number];
  isSelected: boolean;
  onSelect: () => void;
  componentId: string;
  phase: "entrance" | "exit";
  previewKey: number;
  config: AnimationConfig;
}) {
  const [hovering, setHovering] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const dotRef = useRef<HTMLDivElement>(null);
  const hasKeyframes = Object.keys(preset.keyframes).length > 0;

  // Replay animation on hover
  useEffect(() => {
    if (hovering && hasKeyframes) {
      setAnimKey((k) => k + 1);
    }
  }, [hovering, hasKeyframes]);

  // Replay when global preview is triggered
  useEffect(() => {
    if (isSelected && previewKey > 0) {
      setAnimKey((k) => k + 1);
    }
  }, [previewKey, isSelected]);

  // Build inline keyframe CSS for the preview dot
  const kfName = `prev-${phase}-${preset.value}-${animKey}`;
  const kfCSS = hasKeyframes ? keyframesToCSS(kfName, preset.keyframes) : "";
  const easing = getEasingCSS(config.easing);

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`flex flex-col items-center gap-1.5 py-2 px-1 rounded-lg border transition-all text-center ${
        isSelected
          ? "border-purple-500/50 bg-purple-500/10 text-purple-200"
          : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white/70"
      }`}
    >
      {/* Mini preview dot */}
      <div className="w-full h-5 flex items-center justify-center overflow-hidden">
        {kfCSS && <style>{kfCSS}</style>}
        <div
          key={animKey}
          ref={dotRef}
          className="w-2.5 h-2.5 rounded-full"
          style={{
            backgroundColor: isSelected ? "#a78bfa" : "rgba(255,255,255,0.3)",
            animation:
              hasKeyframes && (hovering || (isSelected && previewKey > 0))
                ? `${kfName} 500ms ${easing} both`
                : undefined,
          }}
        />
      </div>
      <span className="text-[10px] font-medium leading-tight">{preset.label}</span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   SCREEN TRANSITION EDITOR — for screen-level transitions
   ════════════════════════════════════════════════════════════ */

import { SCREEN_TRANSITION_PRESETS, type ScreenTransitionConfig, DEFAULT_SCREEN_TRANSITION } from "../_lib/animation-presets";

export function ScreenTransitionEditor({
  transition,
  onUpdate,
}: {
  transition: ScreenTransitionConfig | undefined;
  onUpdate: (transition: ScreenTransitionConfig) => void;
}) {
  const config = transition || { ...DEFAULT_SCREEN_TRANSITION };

  return (
    <div className="space-y-3">
      <span className="text-[11px] text-white/40 block">Screen Transition</span>
      <div className="grid grid-cols-2 gap-1">
        {SCREEN_TRANSITION_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onUpdate({ ...config, type: preset.value })}
            className={`flex flex-col items-start px-2.5 py-2 rounded-lg border transition-all ${
              config.type === preset.value
                ? "border-purple-500/50 bg-purple-500/10"
                : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
            }`}
          >
            <span
              className={`text-[11px] font-medium ${
                config.type === preset.value ? "text-purple-200" : "text-white/60"
              }`}
            >
              {preset.label}
            </span>
            <span className="text-[9px] text-white/25">{preset.description}</span>
          </button>
        ))}
      </div>

      {config.type !== "none" && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-white/50 shrink-0">Duration</span>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <input
              type="range"
              min={100}
              max={1000}
              step={50}
              value={config.duration}
              onChange={(e) => onUpdate({ ...config, duration: Number(e.target.value) })}
              className="flex-1 max-w-[120px] accent-purple-500 h-1"
            />
            <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-md overflow-hidden w-[72px] h-7">
              <input
                type="number"
                value={config.duration}
                min={50}
                max={2000}
                onChange={(e) => onUpdate({ ...config, duration: Number(e.target.value) || 300 })}
                className="w-full bg-transparent px-2 py-1 text-[11px] text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[9px] text-white/20 pr-2 shrink-0">ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}