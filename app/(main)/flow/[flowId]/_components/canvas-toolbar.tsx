import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronDown,
  Globe,
  Eye,
  Minus,
  Plus,
  Maximize2,
  Save,
  Upload,
  ChevronLeft,
  Undo2,
  Redo2,
  Circle,
  Check,
  Loader2,
} from "lucide-react";
import { DevicePicker } from "./device-picker";
import type { DevicePreset, Orientation } from "../_lib/device-presets";

function useCompact(breakpoint = 768) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setCompact(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCompact(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return compact;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function CanvasToolbar({
  zoom,
  screenName,
  screenIndex,
  totalScreens,
  componentCount,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onResetView,
  onBack,
  selectedDevice,
  orientation,
  fullScreenView,
  onSelectDevice,
  onSelectOrientation,
  onToggleFullScreen,
  // New props
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isDirty,
  saveState,
  onSaveDraft,
  onPublish,
}: {
  zoom: number;
  screenName: string;
  screenIndex: number;
  totalScreens: number;
  componentCount: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  saveState: SaveState;
  onSaveDraft: () => void;
  onPublish: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onResetView: () => void;
  onBack: () => void;
  selectedDevice: DevicePreset;
  orientation: Orientation;
  fullScreenView: boolean;
  onSelectDevice: (device: DevicePreset) => void;
  onSelectOrientation: (orientation: Orientation) => void;
  onToggleFullScreen: () => void;
}) {
  const compact = useCompact();

  if (compact) {
    return (
      <>
        {/* ── Single merged pill — icon-only ── */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="flex items-center bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-2xl px-2 py-2 gap-1">
            <button className="p-2.5 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors cursor-pointer">
              <Search size={18} />
            </button>
            {/* Device picker — render icon-only variant or just the icon */}
            <DevicePicker
              selectedDevice={selectedDevice}
              orientation={orientation}
              fullScreenView={fullScreenView}
              onSelectDevice={onSelectDevice}
              onSelectOrientation={onSelectOrientation}
              onToggleFullScreen={onToggleFullScreen}
              compact
            />
            <button className="p-2.5 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors cursor-pointer">
              <Globe size={18} />
            </button>
            <button className="p-2.5 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors cursor-pointer">
              <Eye size={18} />
            </button>
          </div>
        </div>

        {/* ── Zoom — bottom center ── */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="flex items-center bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-xl px-1 py-1 gap-0.5">
            <button onClick={onZoomOut} className="p-2 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer">
              <Minus size={13} />
            </button>
            <button
              onClick={onResetZoom}
              className="px-2 min-w-[40px] text-center text-[11px] font-medium text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={onZoomIn} className="p-2 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer">
              <Plus size={13} />
            </button>
            <button onClick={onResetView} className="p-2 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer">
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        {/* ── Top-right actions — icon-only ── */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
          <button
            onClick={onSaveDraft}
            disabled={!isDirty || saveState === "saving"}
            className="p-2 text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg border border-white/[0.1] backdrop-blur-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveState === "saving" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
          </button>
          <button
            onClick={onPublish}
            disabled={saveState === "saving"}
            className="p-2 bg-white text-black hover:bg-white/90 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={14} />
          </button>
        </div>

        {/* ── Top-left — back only, no label ── */}
        <div className="absolute top-4 left-4 z-20">
          <button onClick={onBack} className="p-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer">
            <ChevronLeft size={16} />
          </button>
        </div>
      </>
    );
  }

  /* ── Full / desktop layout ── */
  return (
    <>
      {/* ── Center Toolbar ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 pointer-events-auto">
        <div className="flex items-center bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-xl px-1 py-1 gap-0.5">
          <DevicePicker
            selectedDevice={selectedDevice}
            orientation={orientation}
            fullScreenView={fullScreenView}
            onSelectDevice={onSelectDevice}
            onSelectOrientation={onSelectOrientation}
            onToggleFullScreen={onToggleFullScreen}
          />
        </div>
        {/* <div className="flex items-center bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-xl px-1 py-1">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer">
            <Globe size={13} /> English (US) <ChevronDown size={11} className="text-white/40" />
          </button>
        </div> */}
        {/* <div className="flex items-center bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-xl px-1 py-1">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer">
            <Eye size={13} /> Default
          </button>
        </div> */}
        <div className="flex items-center bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-xl px-1 py-1 gap-0.5 ml-2">
          <button onClick={onZoomOut} className="p-2 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer">
            <Minus size={13} />
          </button>
          <button onClick={onResetZoom} className="px-2 min-w-[44px] text-center text-[11px] font-medium text-white/50 hover:text-white transition-colors cursor-pointer">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={onZoomIn} className="p-1.5 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer">
            <Plus size={13} />
          </button>
          <button onClick={onResetView} className="p-1.5 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer">
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* ── Left Toolbar — includes undo/redo and status ── */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
        <div className="flex items-center gap-2 mr-10">
          <button onClick={onBack} className="p-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer">
            <ChevronLeft size={16} />
          </button>
          <div className="flex flex-col">
            <span className="text-xs text-white/60 font-medium leading-none">{screenName}</span>
            <span className="text-[10px] text-white/30 leading-tight">{screenIndex + 1}/{totalScreens}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 py-1.5 backdrop-blur-md">
          <span className="text-[10px] font-medium text-white/55">{componentCount}</span>
          <span className="text-[10px] text-white/28">
            {componentCount === 1 ? "layer" : "layers"}
          </span>
        </div>

        {/* Undo / Redo cluster */}
        <div className="flex items-center bg-white/[0.04] border border-white/[0.1] backdrop-blur-md rounded-lg overflow-hidden">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="px-2 py-1.5 text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Undo2 size={14} />
          </button>
          <div className="w-px h-3 bg-white/[0.08]" />
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="px-2 py-1.5 text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Dirty indicator */}
        <div className="flex items-center gap-1.5 px-2 bg-white/[0.04] border border-white/[0.1] backdrop-blur-md rounded-lg h-[29px]">
          {isDirty ? (
            <Circle size={6} className="text-amber-400 fill-amber-400" />
          ) : (
            <Check size={10} className="text-emerald-400" />
          )}
          <span className="text-[10px] text-white/40 font-medium">
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
                ? "Saved"
                : saveState === "error"
                  ? "Save failed"
                  : isDirty
                    ? "Unsaved changes"
                    : "Up to date"}
          </span>
        </div>
      </div>

      {/* ── Right Toolbar — Save and Publish ── */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
        <button
          onClick={onSaveDraft}
          disabled={!isDirty || saveState === "saving"}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg border border-white/[0.1] backdrop-blur-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveState === "saving" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Save size={13} />
          )}
          Save Draft
        </button>

        <button
          onClick={onPublish}
          disabled={saveState === "saving"}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-black hover:bg-white/90 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload size={13} />
          Publish
        </button>
      </div>
    </>
  );
}
