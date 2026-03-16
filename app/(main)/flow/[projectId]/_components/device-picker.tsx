"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, Smartphone, Tablet, Monitor, ChevronDown } from "lucide-react";
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

/* ── Device row ──────────────────────────────────────────── */
function DeviceRow({
  device,
  isActive,
  onSelect,
}: {
  device: DevicePreset;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
        isActive
          ? "bg-white/[0.08] text-white"
          : "text-white/60 hover:text-white hover:bg-white/[0.06]"
      }`}
    >
      <span className={`text-sm ${isActive ? "font-semibold" : ""}`}>
        {device.name}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/30 tabular-nums">
          {device.width}×{device.height}
        </span>
        {isActive && <Check size={14} className="text-white/70" />}
      </div>
    </button>
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
}: {
  selectedDevice: DevicePreset;
  orientation: Orientation;
  fullScreenView: boolean;
  onSelectDevice: (device: DevicePreset) => void;
  onSelectOrientation: (orientation: Orientation) => void;
  onToggleFullScreen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<DeviceCategory>(selectedDevice.category);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Synchronize category when selectedDevice changes externally */
  useEffect(() => {
    setActiveCategory(selectedDevice.category);
  }, [selectedDevice.category]);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleSelectDevice = (device: DevicePreset) => {
    onSelectDevice(device);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative" onMouseDown={(e) => e.stopPropagation()}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer focus:outline-none"
      >
        {selectedDevice.category === "mobile" ? (
          <Smartphone size={13} />
        ) : (
          <Tablet size={13} />
        )}
        {selectedDevice.name}
        <ChevronDown size={11} className={`text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-[280px] bg-[#1a1a1e] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
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

          <div className="h-px bg-white/[0.06]" />

          {/* ── Device list ── */}
          <div className="max-h-[380px] overflow-y-auto py-1 px-1">
            {activeCategory === "mobile" ? (
              <>
                <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold px-2 pt-2 pb-1">
                  Mobile
                </p>
                {MOBILE_DEVICES.map((device) => (
                  <DeviceRow
                    key={device.id}
                    device={device}
                    isActive={selectedDevice.id === device.id}
                    onSelect={() => handleSelectDevice(device)}
                  />
                ))}
              </>
            ) : (
              <>
                <p className="text-[11px] uppercase tracking-wider text-white/40 font-semibold px-2 pt-2 pb-1">
                  Tablet
                </p>
                {TABLET_DEVICES.map((device) => (
                  <DeviceRow
                    key={device.id}
                    device={device}
                    isActive={selectedDevice.id === device.id}
                    onSelect={() => handleSelectDevice(device)}
                  />
                ))}
              </>
            )}
          </div>

          <div className="h-px bg-white/[0.06]" />

          {/* ── Full screen view ── */}
          <div className="px-3 py-2.5">
            <button
              onClick={() => {
                onToggleFullScreen();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-all"
            >
              <Monitor size={14} className="text-white/40" />
              <span className="text-sm text-white/60">Full screen view</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}