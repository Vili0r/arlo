import { Search, ChevronDown, Globe, Eye, Minus, Plus, Maximize2, Save, Upload, ChevronLeft } from "lucide-react";
import { DevicePicker } from "./device-picker";
import type { DevicePreset, Orientation } from "../_lib/device-presets";

export function CanvasToolbar({
  zoom,
  screenName,
  screenIndex,
  totalScreens,
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
}: {
  zoom: number;
  screenName: string;
  screenIndex: number;
  totalScreens: number;
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
  return (
    <>
      {/* Center toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 pointer-events-auto">
        <div className="flex items-center bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-xl px-1 py-1 gap-0.5">
          <button className="p-2 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer">
            <Search size={14} />
          </button>
          {/* ── Device Picker (replaces static iPhone button) ── */}
          <DevicePicker
            selectedDevice={selectedDevice}
            orientation={orientation}
            fullScreenView={fullScreenView}
            onSelectDevice={onSelectDevice}
            onSelectOrientation={onSelectOrientation}
            onToggleFullScreen={onToggleFullScreen}
          />
        </div>
        <div className="flex items-center bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-xl px-1 py-1">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer">
            <Globe size={13} /> English (US) <ChevronDown size={11} className="text-white/40" />
          </button>
        </div>
        <div className="flex items-center bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-xl px-1 py-1">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer">
            <Eye size={13} /> Default
          </button>
        </div>
        <div className="flex items-center bg-white/[0.08] backdrop-blur-md border border-white/[0.1] rounded-xl px-1 py-1 gap-0.5 ml-2">
          <button onClick={onZoomOut} className="p-2 text-white/50 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer">
            <Minus size={13} />
          </button>
          <button
            onClick={onResetZoom}
            className="px-2 min-w-[44px] text-center text-[11px] font-medium text-white/50 hover:text-white transition-colors cursor-pointer"
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

      {/* Right actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg border border-white/[0.1] backdrop-blur-md transition-colors cursor-pointer">
          <Save size={13} /> Save Draft
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-black hover:bg-white/90 rounded-lg transition-colors cursor-pointer">
          <Upload size={13} /> Publish
        </button>
      </div>

      {/* Left breadcrumb */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
        <button onClick={onBack} className="p-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-white/60 font-medium">{screenName}</span>
        <span className="text-[11px] text-white/30">
          {screenIndex + 1}/{totalScreens}
        </span>
      </div>
    </>
  );
}