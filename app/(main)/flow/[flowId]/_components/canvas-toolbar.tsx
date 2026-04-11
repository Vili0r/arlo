"use client";

import { useState, type ReactNode } from "react";
import {
  Upload,
  Download,
  ChevronLeft,
  Circle,
  Check,
  Loader2,
  Minus,
  Plus,
  Maximize2,
  Save,
  Undo2,
  Redo2,
  MoreHorizontal,
  Hand,
  MousePointer2,
  Play,
  Square,
  Type,
} from "lucide-react";
import { DevicePicker } from "./device-picker";
import type { DevicePreset, Orientation } from "../_lib/device-presets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SaveState = "idle" | "saving" | "saved" | "error";
export type ToolMode = "select" | "hand" | "text" | "frame" | "rectangle";

function FloatingToolbarLabel({
  label,
  children,
  showOnFocus = true,
}: {
  label: string;
  children: ReactNode;
  showOnFocus?: boolean;
}) {
  return (
    <div className="group/floating-label relative flex items-center">
      {children}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg border border-white/[0.1] bg-[#141414] px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-2xl transition-all duration-150 group-hover/floating-label:translate-y-0 group-hover/floating-label:opacity-100 ${
          showOnFocus
            ? "group-focus-within/floating-label:translate-y-0 group-focus-within/floating-label:opacity-100"
            : ""
        }`}
      >
        {label}
      </div>
    </div>
  );
}

export function CanvasToolbar({
  zoom,
  onBack,
  screenName,
  screenIndex,
  totalScreens,
  selectedDevice,
  orientation,
  fullScreenView,
  onSelectDevice,
  onSelectOrientation,
  onToggleFullScreen,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onZoomToActual,
  onZoomToFit,
  onResetView,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isDirty,
  saveState,
  onSaveDraft,
  onOpenPreview,
  onPublish,
  onPromoteToProduction,
  developmentVersion,
  productionVersion,
  onImport,
  toolMode,
  onSelectToolMode,
}: {
  zoom: number;
  onBack: () => void;
  screenName: string;
  screenIndex: number;
  totalScreens: number;
  selectedDevice: DevicePreset;
  orientation: Orientation;
  fullScreenView: boolean;
  onSelectDevice: (device: DevicePreset) => void;
  onSelectOrientation: (orientation: Orientation) => void;
  onToggleFullScreen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onZoomToActual: () => void;
  onZoomToFit: () => void;
  onResetView: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isDirty: boolean;
  saveState: SaveState;
  onSaveDraft: () => void;
  onOpenPreview: () => void;
  onPublish: () => void;
  onPromoteToProduction: () => void;
  developmentVersion: { id: string; version: number } | null;
  productionVersion: { id: string; version: number } | null;
  onImport: () => void;
  toolMode: ToolMode;
  onSelectToolMode: (mode: ToolMode) => void;
}) {
  const [publishAction, setPublishAction] = useState("");
  const iconBtn =
    "p-2 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed";
  const toolBtn = (active: boolean) =>
    `flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-medium transition-colors ${
      active
        ? "bg-blue-500/18 text-blue-200 ring-1 ring-blue-400/30"
        : "text-white/45 hover:bg-white/[0.06] hover:text-white"
    }`;

  const handlePublishAction = (value: string | null) => {
    if (!value) return;

    setPublishAction("");

    if (value === "publishDev") {
      onPublish();
      return;
    }

    if (value === "pushProd") {
      onPromoteToProduction();
    }
  };

  return (
    <>
      {/* ── Top-left — back button + screen info ── */}
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
      </div>

      {/* ── Top-center — device picker ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.08] px-1 py-1 backdrop-blur-md">
          <div className="flex items-center rounded-xl border border-white/[0.08] bg-black/20 p-1">
            <FloatingToolbarLabel label="Select (V)">
              <button onClick={() => onSelectToolMode("select")} className={toolBtn(toolMode === "select")} title="Select (V)">
                <MousePointer2 size={14} />
              </button>
            </FloatingToolbarLabel>
            <FloatingToolbarLabel label="Hand (H)">
              <button onClick={() => onSelectToolMode("hand")} className={toolBtn(toolMode === "hand")} title="Hand (H)">
                <Hand size={14} />
              </button>
            </FloatingToolbarLabel>
            <FloatingToolbarLabel label="Text (T)">
              <button onClick={() => onSelectToolMode("text")} className={toolBtn(toolMode === "text")} title="Text (T)">
                <Type size={14} />
              </button>
            </FloatingToolbarLabel>
            <FloatingToolbarLabel label="Frame (F)">
              <button onClick={() => onSelectToolMode("frame")} className={toolBtn(toolMode === "frame")} title="Frame (F)">
                <Square size={14} />
              </button>
            </FloatingToolbarLabel>
            <FloatingToolbarLabel label="Rectangle (R)">
              <button onClick={() => onSelectToolMode("rectangle")} className={toolBtn(toolMode === "rectangle")} title="Rectangle (R)">
                <Square size={14} className="fill-current" />
              </button>
            </FloatingToolbarLabel>
          </div>
          <DevicePicker
            selectedDevice={selectedDevice}
            orientation={orientation}
            fullScreenView={fullScreenView}
            onSelectDevice={onSelectDevice}
            onSelectOrientation={onSelectOrientation}
            onToggleFullScreen={onToggleFullScreen}
          />
        </div>
      </div>

      {/* ── Top-right — status + publish ── */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
        <div className="flex items-center gap-1.5 px-2.5 bg-white/[0.04] border border-white/[0.1] backdrop-blur-md rounded-lg h-[32px]">
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
                    ? "Unsaved"
                    : "Up to date"}
          </span>
        </div>

        <Select value={publishAction} onValueChange={handlePublishAction}>
          <FloatingToolbarLabel label="Publish Actions" showOnFocus={false}>
            <SelectTrigger
              aria-label="Publish actions"
              className="h-8 min-w-8 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 text-white hover:bg-white/[0.08] [&>svg]:hidden"
            >
              <SelectValue placeholder={<MoreHorizontal size={16} className="text-white" />} />
            </SelectTrigger>
          </FloatingToolbarLabel>
          <SelectContent
            align="end"
            sideOffset={8}
            className="min-w-48 rounded-xl border border-white/[0.1] bg-[#141414] p-1 text-white shadow-2xl"
          >
            <SelectItem value="publishDev" className="rounded-lg px-2 py-2">
              <Upload size={14} />
              Publish Dev
            </SelectItem>
            <SelectItem
              value="pushProd"
              className="rounded-lg px-2 py-2"
              disabled={saveState === "saving" || !developmentVersion}
            >
              <Upload size={14} />
              Push to Prod
            </SelectItem>
          </SelectContent>
        </Select>
      </div>


      {/* ── Bottom-center — Figma-style floating toolbar ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="flex items-center bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-2xl px-1.5 py-1.5 gap-0.5">
          {/* Undo / Redo */}
          <FloatingToolbarLabel label="Undo">
            <button onClick={onUndo} disabled={!canUndo} className={iconBtn} aria-label="Undo">
              <Undo2 size={15} />
            </button>
          </FloatingToolbarLabel>
          <FloatingToolbarLabel label="Redo">
            <button onClick={onRedo} disabled={!canRedo} className={iconBtn} aria-label="Redo">
              <Redo2 size={15} />
            </button>
          </FloatingToolbarLabel>

          <div className="w-px h-5 bg-white/[0.1] mx-1" />

          {/* Import */}
          <FloatingToolbarLabel label="Import">
            <button onClick={onImport} className={iconBtn} aria-label="Import" title="Import">
              <Download size={15} />
            </button>
          </FloatingToolbarLabel>

          {/* Save Draft */}
          <FloatingToolbarLabel label="Save Draft">
            <button
              onClick={onSaveDraft}
              disabled={!isDirty || saveState === "saving"}
              className={iconBtn}
              aria-label="Save Draft"
              title="Save Draft"
            >
              {saveState === "saving" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
            </button>
          </FloatingToolbarLabel>

          <FloatingToolbarLabel label="Preview">
            <button
              onClick={onOpenPreview}
              className={iconBtn}
              aria-label="Open live preview"
              title="Open live preview"
            >
              <Play size={15} className="fill-current" />
            </button>
          </FloatingToolbarLabel>

          <div className="w-px h-5 bg-white/[0.1] mx-1" />

          {/* Zoom controls */}
          <FloatingToolbarLabel label="Zoom Out">
            <button onClick={onZoomOut} className={iconBtn} aria-label="Zoom out">
              <Minus size={14} />
            </button>
          </FloatingToolbarLabel>
          <FloatingToolbarLabel label="Reset Zoom">
            <button
              onClick={onResetZoom}
              className="px-2 min-w-[44px] text-center text-[11px] font-medium text-white/50 hover:text-white transition-colors cursor-pointer"
              aria-label="Reset zoom"
              title="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
          </FloatingToolbarLabel>
          <FloatingToolbarLabel label="Zoom In">
            <button onClick={onZoomIn} className={iconBtn} aria-label="Zoom in">
              <Plus size={14} />
            </button>
          </FloatingToolbarLabel>
          <FloatingToolbarLabel label="Zoom to 100%">
            <button
              onClick={onZoomToActual}
              className="px-2 text-[11px] font-medium text-white/50 transition-colors hover:text-white"
              aria-label="Zoom to 100%"
              title="Zoom to 100%"
            >
              100%
            </button>
          </FloatingToolbarLabel>
          <FloatingToolbarLabel label="Zoom to Fit">
            <button
              onClick={onZoomToFit}
              className="px-2 text-[11px] font-medium text-white/50 transition-colors hover:text-white"
              aria-label="Zoom to fit"
              title="Zoom to fit"
            >
              Fit
            </button>
          </FloatingToolbarLabel>
          <FloatingToolbarLabel label="Reset View">
            <button onClick={onResetView} className={iconBtn} aria-label="Reset view" title="Reset View">
              <Maximize2 size={14} />
            </button>
          </FloatingToolbarLabel>

          <div className="w-px h-5 bg-white/[0.1] mx-1" />

          {/* Versions */}
          <div className="flex items-center gap-1.5 px-0.5">
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/70">
              <Circle size={6} className={developmentVersion ? "text-emerald-400 fill-emerald-400" : "text-amber-400 fill-amber-400"} />
              <span className="leading-none">Dev</span>
              {developmentVersion ? (
                <span className="leading-none text-white/45">{`v${developmentVersion.version}`}</span>
              ) : null}
            </div>
            <div className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/70">
              <Circle size={6} className={productionVersion ? "text-emerald-400 fill-emerald-400" : "text-amber-400 fill-amber-400"} />
              <span className="leading-none">Prod</span>
              {productionVersion ? (
                <span className="leading-none text-white/45">{`v${productionVersion.version}`}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
