"use client";

import React, { useState, useEffect } from "react";
import { Check, Smartphone, Tablet, Monitor, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MOBILE_DEVICES,
  TABLET_DEVICES,
  type DevicePreset,
  type Orientation,
  type DeviceCategory,
} from "../_lib/device-presets";

/* ── Icons ───────────────────────────────────────────────── */
function PortraitIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? "text-white" : "text-white/40"}>
      <rect x="5" y="2" width="10" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function LandscapeIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? "text-white" : "text-white/40"}>
      <rect x="2" y="5" width="16" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ResponsiveIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? "text-white" : "text-white/40"}>
      <rect x="1" y="3" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="15" y="6" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/* ── Device Picker ─────────────────────────────────────── */
export function DevicePicker({
  selectedDevice,
  orientation,
  fullScreenView,
  onSelectDevice,
  onSelectOrientation,
  onToggleFullScreen,
  compact = false,
}: {
  selectedDevice: DevicePreset;
  orientation: Orientation;
  fullScreenView: boolean;
  onSelectDevice: (device: DevicePreset) => void;
  onSelectOrientation: (orientation: Orientation) => void;
  onToggleFullScreen: () => void; 
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<DeviceCategory>(selectedDevice.category);

  /* Synchronize category when selectedDevice changes externally */
  useEffect(() => {
    setActiveCategory(selectedDevice.category);
  }, [selectedDevice.category]);

  const devices = activeCategory === "mobile" ? MOBILE_DEVICES : TABLET_DEVICES;

  return (
    <div onMouseDown={(e) => e.stopPropagation()}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        {/* Trigger */}
        <DropdownMenuTrigger
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer focus:outline-none"
        >
          {selectedDevice.category === "mobile" ? (
            <Smartphone size={14} />
          ) : (
            <Tablet size={14} />
          )}
          {!compact && (
            <>
              {selectedDevice.name}
              <ChevronDown size={11} className={`text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
            </>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="center"
          side="bottom"
          sideOffset={8}
          className="w-[280px] bg-[#1a1a1e] border-white/[0.1] rounded-xl shadow-2xl p-0 overflow-hidden"
        >
          {/* ── Orientation & Category toggles ── */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2 gap-2">
            <div className="flex items-center gap-0.5 bg-white/[0.06] rounded-lg p-0.5">
              <button
                onClick={() => setActiveCategory("mobile")}
                className={`px-2.5 h-8 flex items-center justify-center rounded-md transition-all gap-1.5 ${
                  activeCategory === "mobile"
                    ? "bg-white/[0.12] ring-1 ring-white/[0.15] text-white"
                    : "text-white/40 hover:bg-white/[0.06] hover:text-white/60"
                }`}
              >
                <Smartphone size={13} />
                <span className="text-[11px] font-medium">Mobile</span>
              </button>
              <button
                onClick={() => setActiveCategory("tablet")}
                className={`px-2.5 h-8 flex items-center justify-center rounded-md transition-all gap-1.5 ${
                  activeCategory === "tablet"
                    ? "bg-white/[0.12] ring-1 ring-white/[0.15] text-white"
                    : "text-white/40 hover:bg-white/[0.06] hover:text-white/60"
                }`}
              >
                <Tablet size={13} />
                <span className="text-[11px] font-medium">Tablet</span>
              </button>
            </div>

            <div className="h-4 w-px bg-white/[0.1] mx-0.5" />

            <div className="flex items-center gap-0.5 bg-white/[0.06] rounded-lg p-0.5">
              <button
                onClick={() => onSelectOrientation("portrait")}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${
                  orientation === "portrait"
                    ? "bg-white/[0.12] ring-1 ring-white/[0.15]"
                    : "hover:bg-white/[0.06]"
                }`}
              >
                <PortraitIcon active={orientation === "portrait"} />
              </button>
              <button
                onClick={() => onSelectOrientation("landscape")}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${
                  orientation === "landscape"
                    ? "bg-white/[0.12] ring-1 ring-white/[0.15]"
                    : "hover:bg-white/[0.06]"
                }`}
              >
                <LandscapeIcon active={orientation === "landscape"} />
              </button>
            </div>
          </div>

          <DropdownMenuSeparator className="bg-white/[0.06]" />

          {/* ── Device list ── */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-white/40 font-semibold px-3 pt-2 pb-1">
              {activeCategory === "mobile" ? "Mobile" : "Tablet"}
            </DropdownMenuLabel>
            <div className="max-h-[380px] overflow-y-auto px-1 pb-1">
              {devices.map((device) => (
                <DropdownMenuItem
                  key={device.id}
                  onClick={() => {
                    onSelectDevice(device);
                    setOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    selectedDevice.id === device.id
                      ? "bg-white/[0.08] text-white"
                      : "text-white/60 focus:text-white focus:bg-white/[0.06]"
                  }`}
                >
                  <span className={`text-sm ${selectedDevice.id === device.id ? "font-semibold" : ""}`}>
                    {device.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30 tabular-nums">
                      {device.width}×{device.height}
                    </span>
                    {selectedDevice.id === device.id && <Check size={14} className="text-white/70" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-white/[0.06]" />

          {/* ── Full screen view ── */}
          <div className="px-3 py-2.5">
            <DropdownMenuItem
              onClick={() => {
                onToggleFullScreen();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] focus:bg-white/[0.06] transition-all"
            >
              <Monitor size={14} className="text-white/40" />
              <span className="text-sm text-white/60">Full screen view</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}