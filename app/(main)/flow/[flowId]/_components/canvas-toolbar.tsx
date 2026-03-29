"use client";

import { useState } from "react";
import {
  Upload,
  ChevronLeft,
  Circle,
  Check,
  Loader2,
  Code2,
  PenTool,
  Minus,
  Plus,
  Maximize2,
  Save,
  Undo2,
  Redo2,
  MoreHorizontal,
  Hand,
  MousePointer2,
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
  onPublish,
  onPromoteToProduction,
  developmentVersion,
  productionVersion,
  onImportCode,
  onImportFigma,
  toolMode,
  onSelectToolMode,
  importCodeLabel = "Import Code",
  importFigmaLabel = "Import Figma",
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
  onPublish: () => void;
  onPromoteToProduction: () => void;
  developmentVersion: { id: string; version: number } | null;
  productionVersion: { id: string; version: number } | null;
  onImportCode: () => void;
  onImportFigma: () => void;
  toolMode: ToolMode;
  onSelectToolMode: (mode: ToolMode) => void;
  importCodeLabel?: string;
  importFigmaLabel?: string;
}) {
  const [publishAction, setPublishAction] = useState<string | undefined>(undefined);
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

    setPublishAction(undefined);

    if (value === "publish-dev") {
      onPublish();
      return;
    }

    if (value === "push-prod") {
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
            <button onClick={() => onSelectToolMode("select")} className={toolBtn(toolMode === "select")} title="Select (V)">
              <MousePointer2 size={14} />
            </button>
            <button onClick={() => onSelectToolMode("hand")} className={toolBtn(toolMode === "hand")} title="Hand (H)">
              <Hand size={14} />
            </button>
            <button onClick={() => onSelectToolMode("text")} className={toolBtn(toolMode === "text")} title="Text (T)">
              <Type size={14} />
            </button>
            <button onClick={() => onSelectToolMode("frame")} className={toolBtn(toolMode === "frame")} title="Frame (F)">
              <Square size={14} />
            </button>
            <button onClick={() => onSelectToolMode("rectangle")} className={toolBtn(toolMode === "rectangle")} title="Rectangle (R)">
              <Square size={14} className="fill-current" />
            </button>
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
          <SelectTrigger
            aria-label="Publish actions"
            className="h-8 min-w-8 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 text-white hover:bg-white/[0.08] [&>svg]:hidden"
          >
            <SelectValue placeholder={<MoreHorizontal size={16} className="text-white" />} />
          </SelectTrigger>
          <SelectContent
            align="end"
            sideOffset={8}
            className="min-w-48 rounded-xl border border-white/[0.1] bg-[#141414] p-1 text-white shadow-2xl"
          >
            <SelectItem value="publish-dev" className="rounded-lg px-2 py-2">
              <Upload size={14} />
              Publish Dev
            </SelectItem>
            <SelectItem
              value="push-prod"
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
          <button onClick={onUndo} disabled={!canUndo} className={iconBtn} aria-label="Undo">
            <Undo2 size={15} />
          </button>
          <button onClick={onRedo} disabled={!canRedo} className={iconBtn} aria-label="Redo">
            <Redo2 size={15} />
          </button>

          <div className="w-px h-5 bg-white/[0.1] mx-1" />

          {/* Import Figma */}
          <button onClick={onImportFigma} className={iconBtn} aria-label={importFigmaLabel} title={importFigmaLabel}>
            <PenTool size={15} />
          </button>

          {/* Import Code */}
          <button onClick={onImportCode} className={iconBtn} aria-label={importCodeLabel} title={importCodeLabel}>
            <Code2 size={15} />
          </button>

          {/* Save Draft */}
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

          <div className="w-px h-5 bg-white/[0.1] mx-1" />

          {/* Zoom controls */}
          <button onClick={onZoomOut} className={iconBtn} aria-label="Zoom out">
            <Minus size={14} />
          </button>
          <button
            onClick={onResetZoom}
            className="px-2 min-w-[44px] text-center text-[11px] font-medium text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={onZoomIn} className={iconBtn} aria-label="Zoom in">
            <Plus size={14} />
          </button>
          <button
            onClick={onZoomToActual}
            className="px-2 text-[11px] font-medium text-white/50 transition-colors hover:text-white"
            aria-label="Zoom to 100%"
            title="Zoom to 100%"
          >
            100%
          </button>
          <button
            onClick={onZoomToFit}
            className="px-2 text-[11px] font-medium text-white/50 transition-colors hover:text-white"
            aria-label="Zoom to fit"
            title="Zoom to fit"
          >
            Fit
          </button>
          <button onClick={onResetView} className={iconBtn} aria-label="Reset view" title="Reset View">
            <Maximize2 size={14} />
          </button>

          <div className="w-px h-5 bg-white/[0.1] mx-1" />

          {/* Versions */}
          <div className="flex items-center gap-1.5 px-0.5">
            <div className="flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.04] px-2 py-1 text-[10px] text-white/55">
              <Circle size={6} className={developmentVersion ? "text-emerald-400 fill-emerald-400" : "text-amber-400 fill-amber-400"} />
              <span>Dev{developmentVersion && ` v${developmentVersion.version}`}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.04] px-2 py-1 text-[10px] text-white/55">
              <Circle size={6} className={productionVersion ? "text-emerald-400 fill-emerald-400" : "text-amber-400 fill-amber-400"} />
              <span>Prod{productionVersion && ` v${productionVersion.version}`}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
