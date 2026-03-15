"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Plus, Smartphone, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type { FlowConfig } from "@/lib/types";
import { SIDEBAR_TABS, type SidebarTab } from "./_lib/constants";
import { createDefaultComponent } from "./_lib/defaults";
import { useCanvas } from "./_lib/use-canvas";
import { ScreensList } from "./_components/screens-list";
import { ComponentPalette } from "./_components/component-palette";
import { PropertySheet } from "./_components/property-sheet";
import { PhonePreviewComponent } from "./_components/phone-preview";
import { CanvasToolbar } from "./_components/canvas-toolbar";

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

  const currentScreen = config.screens[selectedScreenIndex];
  const selectedComponent = currentScreen?.components.find((c) => c.id === selectedComponentId);

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

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* ─── SIDEBAR ─────────────────────────────────── */}
      <div className="flex shrink-0 h-full">
        <div className="w-[52px] bg-white/[0.02] border-r border-white/[0.08] flex flex-col items-center py-3 gap-1 shrink-0">
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
          <div className="px-4 py-3 border-b border-white/[0.08] shrink-0">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              {SIDEBAR_TABS.find((t) => t.id === activeTab)?.label}
            </span>
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
          <button
            onClick={() => setSidebarExpanded((p) => !p)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-all"
          >
            {sidebarExpanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
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
                left: canvas.phonePosition.x - 195,
                top: canvas.phonePosition.y - 422,
                cursor: canvas.isDraggingPhone ? "grabbing" : "grab",
              }}
            >
              <div className="w-[390px] h-[844px] rounded-[55px] bg-gradient-to-b from-[#2a2a2e] to-[#1a1a1e] p-[10px] shadow-[0_20px_70px_rgba(0,0,0,0.5)]">
                <div className="w-full h-full rounded-[46px] bg-white overflow-hidden flex flex-col">
                  {/* Status bar */}
                  <div className="h-[54px] flex items-center justify-between px-8 shrink-0 relative">
                    <span className="text-[15px] font-semibold text-black tracking-tight">9:41</span>
                    <div className="absolute left-1/2 -translate-x-1/2 top-[12px] w-[126px] h-[36px] bg-black rounded-full" />
                    <div className="flex items-center gap-1">
                      <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
                        <rect x="0" y="3" width="3" height="9" rx="1" fill="black" />
                        <rect x="5" y="2" width="3" height="10" rx="1" fill="black" />
                        <rect x="10" y="1" width="3" height="11" rx="1" fill="black" />
                        <rect x="15" y="0" width="3" height="12" rx="1" fill="black" />
                      </svg>
                      <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                        <path d="M8 3.3C10 3.3 11.8 4.1 13 5.5L14.4 4C12.8 2.3 10.5 1.2 8 1.2S3.2 2.3 1.6 4L3 5.5C4.2 4.1 6 3.3 8 3.3Z" fill="black" />
                        <path d="M8 6.7C9.2 6.7 10.3 7.2 11 8L12.4 6.5C11.3 5.4 9.7 4.7 8 4.7S4.7 5.4 3.6 6.5L5 8C5.7 7.2 6.8 6.7 8 6.7Z" fill="black" />
                        <circle cx="8" cy="10.5" r="1.5" fill="black" />
                      </svg>
                      <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
                        <rect x="0" y="1" width="23" height="11" rx="3.5" stroke="black" strokeWidth="1" />
                        <rect x="24.5" y="4.5" width="2" height="4" rx="1" fill="black" opacity="0.4" />
                        <rect x="1.5" y="2.5" width="20" height="8" rx="2" fill="black" />
                      </svg>
                    </div>
                  </div>

                  {/* Screen content */}
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

                  {/* Progress bar */}
                  {config.settings?.showProgressBar && (
                    <div className="h-1 bg-gray-100 shrink-0">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${((selectedScreenIndex + 1) / config.screens.length) * 100}%`,
                          backgroundColor: config.settings.progressBarColor || "#007AFF",
                        }}
                      />
                    </div>
                  )}

                  {/* Home indicator */}
                  <div className="h-[34px] flex items-center justify-center shrink-0 bg-white">
                    <div className="w-[134px] h-[5px] bg-black/20 rounded-full" />
                  </div>
                </div>
              </div>
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
