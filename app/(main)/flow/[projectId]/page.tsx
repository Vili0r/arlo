"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Plus, Smartphone, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type { FlowConfig } from "@/lib/types";
import { SIDEBAR_TABS, type SidebarTab } from "./_lib/constants";
import { createDefaultComponent } from "./_lib/defaults";
import { useCanvas } from "./_lib/use-canvas";
import {
  ALL_DEVICES,
  DEFAULT_DEVICE_ID,
  getFrameDimensions,
  type DevicePreset,
  type Orientation,
} from "./_lib/device-presets";
import { ScreensList } from "./_components/screens-list";
import { ComponentPalette } from "./_components/component-palette";
import { PropertySheet } from "./_components/property-sheet";
import { PhonePreviewComponent } from "./_components/phone-preview";
import { CanvasToolbar } from "./_components/canvas-toolbar";
import Link from "next/link";

export default function FlowBuilderPage() {
  const router = useRouter();
  const { projectId } = useParams();
  const canvas = useCanvas();

  const [config, setConfig] = useState<FlowConfig>({
    screens: [
      { id: "screen_1", name: "Welcome", order: 0, style: { backgroundColor: "#FFFFFF", padding: 24 }, components: [] },
    ],
    settings: { dismissible: true, showProgressBar: true, transitionAnimation: "slide" },
  });

  const [selectedScreenIndex, setSelectedScreenIndex] = useState(0);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>("screens");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(
    ALL_DEVICES.find((d) => d.id === DEFAULT_DEVICE_ID) || ALL_DEVICES[0],
  );
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [fullScreenView, setFullScreenView] = useState(false);

  const currentScreen = config.screens[selectedScreenIndex];
  const selectedComponent = currentScreen?.components.find((c) => c.id === selectedComponentId);
  const frame = getFrameDimensions(selectedDevice, orientation);

  useEffect(() => {
    if (selectedComponentId) setSheetOpen(true);
  }, [selectedComponentId]);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setTimeout(() => setSelectedComponentId(null), 200);
  }, []);

  const updateConfig = useCallback(
    (updater: (prev: FlowConfig) => FlowConfig) => setConfig(updater),
    [],
  );

  const addComponent = useCallback(
    (type: string) => {
      updateConfig((prev) => {
        const screens = [...prev.screens];
        const screen = { ...screens[selectedScreenIndex] };
        screen.components = [...screen.components, createDefaultComponent(type, screen.components.length)];
        screens[selectedScreenIndex] = screen;
        return { ...prev, screens };
      });
      setActiveTab("screens");
    },
    [selectedScreenIndex, updateConfig],
  );

  const deleteComponent = useCallback(
    (componentId: string) => {
      updateConfig((prev) => {
        const screens = [...prev.screens];
        const screen = { ...screens[selectedScreenIndex] };
        screen.components = screen.components
          .filter((c) => c.id !== componentId)
          .map((c, i) => ({ ...c, order: i }));
        screens[selectedScreenIndex] = screen;
        return { ...prev, screens };
      });
      closeSheet();
    },
    [selectedScreenIndex, updateConfig, closeSheet],
  );

  const updateComponentProp = useCallback(
    (componentId: string, key: string, value: unknown) => {
      updateConfig((prev) => {
        const screens = [...prev.screens];
        const screen = { ...screens[selectedScreenIndex] };
        screen.components = screen.components.map((c) =>
          c.id === componentId ? ({ ...c, props: { ...c.props, [key]: value } } as typeof c) : c,
        );
        screens[selectedScreenIndex] = screen;
        return { ...prev, screens };
      });
    },
    [selectedScreenIndex, updateConfig],
  );

  const addScreen = useCallback(() => {
    const order = config.screens.length;
    updateConfig((prev) => ({
      ...prev,
      screens: [
        ...prev.screens,
        {
          id: `screen_${Date.now()}`,
          name: `Screen ${order + 1}`,
          order,
          style: { backgroundColor: "#FFFFFF", padding: 24 },
          components: [],
        },
      ],
    }));
    setSelectedScreenIndex(config.screens.length);
    setSelectedComponentId(null);
  }, [config.screens.length, updateConfig]);

  const deleteScreen = useCallback(
    (index: number) => {
      if (config.screens.length <= 1) return;
      updateConfig((prev) => ({
        ...prev,
        screens: prev.screens.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })),
      }));
      setSelectedScreenIndex((prev) => Math.max(0, prev - 1));
      setSelectedComponentId(null);
    },
    [config.screens.length, updateConfig],
  );

  const handleTabClick = (tab: SidebarTab) => {
    if (activeTab === tab && sidebarExpanded) setSidebarExpanded(false);
    else {
      setActiveTab(tab);
      setSidebarExpanded(true);
    }
  };

  /* ─── Screen content (shared across all frames) ──── */
  const screenContent = (
    <div
      className="flex-1 overflow-y-auto"
      style={{
        backgroundColor: currentScreen?.style?.backgroundColor || "#FFFFFF",
        padding: currentScreen?.style?.padding || 24,
        cursor: "default",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {currentScreen?.components.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <Smartphone size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400">No components yet</p>
          <p className="text-xs text-gray-300 mt-1">Add components from the sidebar</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {[...currentScreen.components]
            .sort((a, b) => a.order - b.order)
            .map((comp) => (
              <PhonePreviewComponent
                key={comp.id}
                component={comp}
                isSelected={comp.id === selectedComponentId}
                onSelect={() => setSelectedComponentId(comp.id)}
              />
            ))}
        </div>
      )}
    </div>
  );

  const progressBar = config.settings?.showProgressBar ? (
    <div className="h-1 bg-gray-100 shrink-0">
      <div
        className="h-full transition-all duration-300"
        style={{
          width: `${((selectedScreenIndex + 1) / config.screens.length) * 100}%`,
          backgroundColor: config.settings.progressBarColor || "#007AFF",
        }}
      />
    </div>
  ) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* ─── SIDEBAR ─────────────────────────────────── */}
      <div className="flex shrink-0 h-full">
        <div className="w-[52px] bg-white/[0.02] border-r border-white/[0.08] flex flex-col items-center py-3 gap-1 shrink-0">
          <Link
            href={`/dashboard/new/${projectId}`}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-all"
          >
            <X size={16} />
          </Link>
          {SIDEBAR_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
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
          <div className="flex-1" />
          <button
            onClick={() => setSidebarExpanded((p) => !p)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-all"
          >
            {sidebarExpanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        </div>

        <div
          className={`border-r border-white/[0.08] bg-white/[0.015] flex flex-col overflow-hidden transition-all duration-200 ease-out ${
            sidebarExpanded ? "w-[260px] opacity-100" : "w-0 opacity-0"
          }`}
        >
          <div className="px-4 py-3 border-b border-white/[0.08] shrink-0 flex items-center justify-between">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              {SIDEBAR_TABS.find((t) => t.id === activeTab)?.label}
            </span>
            <button
              onClick={() => setSidebarExpanded((p) => !p)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-all"
            >
              {sidebarExpanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {activeTab === "screens" && (
              <ScreensList
                screens={config.screens}
                selectedIndex={selectedScreenIndex}
                onSelect={(i) => {
                  setSelectedScreenIndex(i);
                  setSelectedComponentId(null);
                  setSheetOpen(false);
                }}
                selectedComponentId={selectedComponentId}
                onSelectComponent={(id) => {
                  setSelectedComponentId(id);
                  if (id) setSheetOpen(true);
                }}
                onDeleteScreen={deleteScreen}
              />
            )}
            {activeTab === "add" && <ComponentPalette onAdd={addComponent} />}
          </div>
          {activeTab === "screens" && (
            <div className="p-3 border-t border-white/[0.08] shrink-0">
              <button
                onClick={addScreen}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.05] rounded-lg border border-dashed border-white/[0.15] hover:border-white/[0.25] transition-all"
              >
                <Plus size={14} /> Add Screen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── INFINITE CANVAS ─────────────────────────── */}
      <div
        ref={canvas.canvasRef}
        data-canvas-bg="true"
        className="flex-1 relative overflow-hidden select-none"
        style={{
          cursor: canvas.isPanning || canvas.isDraggingPhone ? "grabbing" : "grab",
          backgroundColor: "#0a0a0a",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)",
          backgroundSize: "24px 24px",
          backgroundPosition: `${canvas.panOffset.x}px ${canvas.panOffset.y}px`,
        }}
        onMouseDown={canvas.handleCanvasMouseDown}
        onMouseMove={canvas.handleMouseMove}
        onMouseUp={canvas.handleMouseUp}
        onMouseLeave={canvas.handleMouseUp}
      >
        <CanvasToolbar
          zoom={canvas.zoom}
          screenName={currentScreen?.name || "Untitled"}
          screenIndex={selectedScreenIndex}
          totalScreens={config.screens.length}
          onZoomIn={canvas.zoomIn}
          onZoomOut={canvas.zoomOut}
          onResetZoom={canvas.resetZoom}
          onResetView={canvas.resetView}
          onBack={() => router.push(`/dashboard/projects/${projectId}`)}
          selectedDevice={selectedDevice}
          orientation={orientation}
          fullScreenView={fullScreenView}
          onSelectDevice={(device) => {
            setSelectedDevice(device);
            canvas.resetView();
          }}
          onSelectOrientation={(o) => {
            setOrientation(o);
            canvas.resetView();
          }}
          onToggleFullScreen={() => setFullScreenView((p) => !p)}
        />

        {/* World layer */}
        <div
          data-canvas-bg="true"
          className="absolute inset-0"
          style={{
            transform: `translate(${canvas.panOffset.x}px, ${canvas.panOffset.y}px)`,
            transition: canvas.isPanning || canvas.isDraggingPhone ? "none" : "transform 0.08s ease-out",
          }}
        >
          <div
            data-canvas-bg="true"
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              transform: `scale(${canvas.zoom})`,
              transformOrigin: "0 0",
              transition: canvas.isPanning || canvas.isDraggingPhone ? "none" : "transform 0.15s ease-out",
            }}
          >
            <div
              onMouseDown={canvas.handlePhoneMouseDown}
              className="absolute"
              style={{
                left: canvas.phonePosition.x - frame.frameWidth / 2,
                top: canvas.phonePosition.y - frame.frameHeight / 2,
                cursor: canvas.isDraggingPhone ? "grabbing" : "grab",
              }}
            >
              <DeviceFrame
                device={selectedDevice}
                orientation={orientation}
                frame={frame}
                screenContent={screenContent}
                progressBar={progressBar}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT SHEET ─────────────────────────────── */}
      <PropertySheet
        open={sheetOpen}
        component={selectedComponent || null}
        onClose={closeSheet}
        onDelete={selectedComponent ? () => deleteComponent(selectedComponent.id) : undefined}
        onUpdateProp={
          selectedComponent ? (key, value) => updateComponentProp(selectedComponent.id, key, value) : undefined
        }
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   DEVICE FRAME — renders the correct chrome per device
   ════════════════════════════════════════════════════════════ */
function DeviceFrame({
  device,
  orientation,
  frame,
  screenContent,
  progressBar,
}: {
  device: DevicePreset;
  orientation: Orientation;
  frame: ReturnType<typeof getFrameDimensions>;
  screenContent: React.ReactNode;
  progressBar: React.ReactNode;
}) {
  const isLandscape = orientation === "landscape";
  const spec = device.frame;

  return (
    <div
      className="shadow-[0_20px_70px_rgba(0,0,0,0.5)] relative"
      style={{
        width: frame.frameWidth,
        height: frame.frameHeight,
        borderRadius: frame.outerRadius,
        background: `linear-gradient(to bottom, ${frame.frameGradient.from}, ${frame.frameGradient.to})`,
        paddingTop: frame.bezel.top,
        paddingRight: frame.bezel.right,
        paddingBottom: frame.bezel.bottom,
        paddingLeft: frame.bezel.left,
      }}
    >
      {/* Side buttons (power/volume) — subtle lines on the frame */}
      {frame.isMobile && !isLandscape && (
        <>
          {/* Right side — power button */}
          <div
            className="absolute rounded-full"
            style={{
              right: -1,
              top: spec.hasHomeButton ? 100 : 160,
              width: 3,
              height: 36,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />
          {/* Left side — volume buttons */}
          <div
            className="absolute rounded-full"
            style={{
              left: -1,
              top: spec.hasHomeButton ? 90 : 140,
              width: 3,
              height: 28,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              left: -1,
              top: spec.hasHomeButton ? 126 : 176,
              width: 3,
              height: 28,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />
        </>
      )}

      {/* iPhone SE — earpiece + front camera in top bezel */}
      {spec.hasHomeButton && !isLandscape && (
        <div
          className="absolute flex flex-col items-center gap-1.5"
          style={{
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {/* Front camera */}
          <div
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
          {/* Earpiece */}
          <div
            className="rounded-full"
            style={{
              width: 40,
              height: 5,
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          />
        </div>
      )}

      {/* iPhone SE — physical home button in bottom bezel */}
      {spec.hasHomeButton && !isLandscape && (
        <div
          className="absolute"
          style={{
            bottom: 14,
            left: "50%",
            transform: "translateX(-50%)",
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "2px solid rgba(0,0,0,0.15)",
            backgroundColor: "rgba(0,0,0,0.04)",
          }}
        />
      )}

      {/* Inner screen */}
      <div
        className="w-full h-full overflow-hidden flex flex-col relative"
        style={{
          borderRadius: frame.innerRadius,
          backgroundColor: "#fff",
        }}
      >
        {/* ── STATUS BAR ── */}
        <StatusBar
          device={device}
          frame={frame}
          isLandscape={isLandscape}
        />

        {/* ── SCREEN CONTENT ── */}
        {screenContent}

        {/* ── PROGRESS BAR ── */}
        {progressBar}

        {/* ── HOME INDICATOR / HOME BUTTON ── */}
        <HomeArea device={device} frame={frame} isLandscape={isLandscape} />
      </div>
    </div>
  );
}

/* ── STATUS BAR ─────────────────────────────────────────── */
function StatusBar({
  device,
  frame,
  isLandscape,
}: {
  device: DevicePreset;
  frame: ReturnType<typeof getFrameDimensions>;
  isLandscape: boolean;
}) {
  const spec = device.frame;
  if (spec.statusBarHeight === 0) return null;

  /* iPhone SE style — simple thin status bar */
  if (spec.hasHomeButton) {
    return (
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ height: spec.statusBarHeight }}
      >
        <span className="text-[11px] font-semibold text-black">9:41</span>
        <StatusBarIcons size="small" />
      </div>
    );
  }

  /* iPhones with notch */
  if (spec.notch === "notch") {
    return (
      <div
        className="relative flex items-end justify-between px-6 shrink-0"
        style={{ height: spec.statusBarHeight }}
      >
        <span className="text-[15px] font-semibold text-black tracking-tight pb-1">9:41</span>
        {/* Notch shape */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <svg width="164" height="32" viewBox="0 0 164 32" fill="none">
            <path
              d="M0 0H50C50 0 50 0 54 4C58 8 60 12 64 16C68 20 72 24 82 24C92 24 96 20 100 16C104 12 106 8 110 4C114 0 114 0 114 0H164V0H0Z"
              fill="black"
            />
            {/* Extend black area to fill the top */}
            <rect x="50" y="0" width="64" height="4" fill="black" />
          </svg>
        </div>
        <div className="pb-1">
          <StatusBarIcons size="normal" />
        </div>
      </div>
    );
  }

  /* iPhones with Dynamic Island — NO visible camera, just clean status bar with pill cutout area */
  if (spec.notch === "dynamic-island") {
    return (
      <div
        className="relative flex items-end justify-between px-8 shrink-0"
        style={{ height: spec.statusBarHeight }}
      >
        <span className="text-[15px] font-semibold text-black tracking-tight pb-2">9:41</span>
        {/* Dynamic Island pill — subtle, no camera */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bg-black rounded-full"
          style={{ top: 12, width: 120, height: 34 }}
        />
        <div className="pb-2">
          <StatusBarIcons size="normal" />
        </div>
      </div>
    );
  }

  /* Android punch-hole — small dot, minimal top bar */
  if (spec.notch === "punch-hole") {
    const isPixel = device.id.startsWith("pixel");
    return (
      <div
        className="relative flex items-center justify-between px-5 shrink-0"
        style={{ height: spec.statusBarHeight }}
      >
        <span className="text-[12px] font-medium text-black">
          {isPixel ? "12:30" : "9:41"}
        </span>
        {/* Punch-hole camera dot */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
          style={{ width: 10, height: 10, top: "50%", transform: "translate(-50%, -50%)" }}
        />
        <StatusBarIcons size="small" />
      </div>
    );
  }

  /* Tablets / fallback — clean minimal bar */
  return (
    <div
      className="flex items-center justify-between px-6 shrink-0"
      style={{ height: spec.statusBarHeight }}
    >
      <span className="text-[13px] font-semibold text-black tracking-tight">9:41</span>
      <StatusBarIcons size="normal" />
    </div>
  );
}

/* ── HOME AREA (indicator or physical button) ─────────── */
function HomeArea({
  device,
  frame,
  isLandscape,
}: {
  device: DevicePreset;
  frame: ReturnType<typeof getFrameDimensions>;
  isLandscape: boolean;
}) {
  const spec = device.frame;

  /* iPhone SE — physical home button rendered in the bezel, not inside screen.
     Just leave a small bottom area if needed */
  if (spec.hasHomeButton) {
    return null; /* Home button is in the bezel, drawn separately */
  }

  /* Gesture bar indicator */
  if (spec.homeIndicatorHeight > 0) {
    return (
      <div
        className="flex items-center justify-center shrink-0 bg-white"
        style={{ height: spec.homeIndicatorHeight }}
      >
        <div
          className="bg-black/20 rounded-full"
          style={{
            width: isLandscape ? Math.min(200, frame.viewportWidth * 0.15) : 134,
            height: 5,
          }}
        />
      </div>
    );
  }

  return null;
}

/* ── STATUS BAR ICONS ─────────────────────────────────── */
function StatusBarIcons({ size = "normal" }: { size?: "small" | "normal" }) {
  const s = size === "small" ? 0.75 : 1;
  return (
    <div className="flex items-center gap-1" style={{ transform: `scale(${s})`, transformOrigin: "right center" }}>
      {/* Signal bars */}
      <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
        <rect x="0" y="3" width="3" height="9" rx="1" fill="black" />
        <rect x="5" y="2" width="3" height="10" rx="1" fill="black" />
        <rect x="10" y="1" width="3" height="11" rx="1" fill="black" />
        <rect x="15" y="0" width="3" height="12" rx="1" fill="black" />
      </svg>
      {/* WiFi */}
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
        <path d="M8 3.3C10 3.3 11.8 4.1 13 5.5L14.4 4C12.8 2.3 10.5 1.2 8 1.2S3.2 2.3 1.6 4L3 5.5C4.2 4.1 6 3.3 8 3.3Z" fill="black" />
        <path d="M8 6.7C9.2 6.7 10.3 7.2 11 8L12.4 6.5C11.3 5.4 9.7 4.7 8 4.7S4.7 5.4 3.6 6.5L5 8C5.7 7.2 6.8 6.7 8 6.7Z" fill="black" />
        <circle cx="8" cy="10.5" r="1.5" fill="black" />
      </svg>
      {/* Battery */}
      <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
        <rect x="0" y="1" width="23" height="11" rx="3.5" stroke="black" strokeWidth="1" />
        <rect x="24.5" y="4.5" width="2" height="4" rx="1" fill="black" opacity="0.4" />
        <rect x="1.5" y="2.5" width="20" height="8" rx="2" fill="black" />
      </svg>
    </div>
  );
}