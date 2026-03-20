"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  Smartphone,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ChevronRight,
  Copy,
  Trash2,
  Settings2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useParams, useRouter } from "next/navigation";
import { arrayMove } from "@dnd-kit/sortable";
import type { FlowConfig, FlowComponent } from "@/lib/types";
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
import type { ComponentActions } from "./_components/screens-list";
import { TabStyleSidebar, presetToTabComponentProps } from "./_components/tab-style-sidebar";
import { useHistory } from "./_lib/use-history";
import { useKeyboardShortcuts } from "./_lib/use-keyboard-shortcuts";
import { saveDraft, autoSaveDraft, publishFlow, getFlow } from "./actions";
import { TemplatePalette, QuickFlowTemplates } from "./_components/template-picker";
import { ALL_TEMPLATES, type TemplateDefinition } from "./_lib/templates";

export default function FlowBuilderPage() {
  const router = useRouter();
  const { flowId: flowIdParam } = useParams();
  const [projectId, setProjectId] = useState<string | null>(null);
  const canvas = useCanvas();

  const defaultConfig: FlowConfig = {
    screens: [
      {
        id: "screen_1",
        name: "Welcome",
        order: 0,
        style: { backgroundColor: "#FFFFFF", padding: 24 },
        components: [],
      },
    ],
    settings: {
      dismissible: true,
      showProgressBar: true,
      transitionAnimation: "slide",
    },
  };

  const [selectedScreenIndex, setSelectedScreenIndex] = useState(0);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>("screens");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tabSidebarOpen, setTabSidebarOpen] = useState(false);

  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(
    ALL_DEVICES.find((d) => d.id === DEFAULT_DEVICE_ID) || ALL_DEVICES[0],
  );
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [fullScreenView, setFullScreenView] = useState(false);

  const [copiedComponent, setCopiedComponent] = useState<FlowComponent | null>(null);
  const [copiedStyles, setCopiedStyles] = useState<Record<string, unknown> | null>(null);
  const history = useHistory<FlowConfig>(defaultConfig);
  const config = history.state;

  const currentScreen = config.screens[selectedScreenIndex];
  const selectedComponent = currentScreen?.components.find((c) => c.id === selectedComponentId);
  const frame = getFrameDimensions(selectedDevice, orientation);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const flowId = typeof flowIdParam === "string" ? flowIdParam : null;

  useEffect(() => {
    if (selectedComponentId) setSheetOpen(true);
  }, [selectedComponentId]);

  useEffect(() => {
    if (!flowId) return;

    getFlow(flowId).then((data) => {
      setProjectId(data.projectId);
      if (data.config) {
        history.reset(data.config);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId]);

  // — Save draft handler —
  const handleSaveDraft = useCallback(async () => {
    if (!flowId || !history.isDirty) return;
    setSaveState("saving");
    try {
      await saveDraft({ flowId, config: history.state });
      history.markSaved();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, [flowId, history]);
  
  // — Publish handler —
  const handlePublish = useCallback(async () => {
    if (!flowId) return;
    setSaveState("saving");
    try {
      await publishFlow({ flowId, config: history.state });
      history.markSaved();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      console.error("Publish failed:", err);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, [flowId, history]);
  
  // — Auto-save on a 30s debounce when dirty —
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (!flowId || !history.isDirty) return;
  
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await autoSaveDraft({ flowId, config: history.state });
        history.markSaved();
      } catch {
        // Silent fail for auto-save — user can still manually save
      }
    }, 30_000);
  
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [flowId, history.isDirty, history.state, history]);

  useKeyboardShortcuts({
    onUndo: history.undo,
    onRedo: history.redo,
    onSave: handleSaveDraft,
  });

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (history.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [history.isDirty]);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setTimeout(() => setSelectedComponentId(null), 200);
  }, []);

  const updateConfig = history.set;

  const addComponent = useCallback(
    (type: string) => {
      if (type === "TAB_BUTTON") {
        setTabSidebarOpen(true);
        return;
      }
 
      updateConfig((prev) => {
        const screens = [...prev.screens];
        const screen = { ...screens[selectedScreenIndex] };
        screen.components = [
          ...screen.components,
          createDefaultComponent(type, screen.components.length),
        ];
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

 const handleTabPresetSelect = useCallback(
    (preset: import("./_components/tab-style-sidebar").TabPreset) => {
      updateConfig((prev) => {
        const screens = [...prev.screens];
        const screen = { ...screens[selectedScreenIndex] };
        const comp = {
          id: `comp_${Date.now()}`,
          type: "TAB_BUTTON" as const,
          order: screen.components.length,
          props: presetToTabComponentProps(preset),
        } as FlowComponent;
        screen.components = [...screen.components, comp];
        screens[selectedScreenIndex] = screen;
        return { ...prev, screens };
      });
      setActiveTab("screens");
      setTabSidebarOpen(false);
    },
    [selectedScreenIndex, updateConfig],
  );

  const componentActions: ComponentActions = useMemo(
    () => ({
      hasCopied: copiedComponent !== null,
      hasCopiedStyles: copiedStyles !== null,

      onRename: (componentId: string) => {
        const comp = currentScreen?.components.find((c) => c.id === componentId);
        if (!comp) return;
        const label = "label" in comp.props ? (comp.props.label as string) : comp.type;
        const newName = window.prompt("Rename component", label);
        if (newName !== null) {
          updateComponentProp(componentId, "label", newName);
        }
      },

      onDuplicate: (componentId: string) => {
        updateConfig((prev) => {
          const screens = [...prev.screens];
          const screen = { ...screens[selectedScreenIndex] };
          const source = screen.components.find((c) => c.id === componentId);
          if (!source) return prev;
          const clone = {
            ...structuredClone(source),
            id: `comp_${Date.now()}`,
            order: screen.components.length,
          };
          screen.components = [...screen.components, clone];
          screens[selectedScreenIndex] = screen;
          return { ...prev, screens };
        });
      },

      onCopy: (componentId: string) => {
        const comp = currentScreen?.components.find((c) => c.id === componentId);
        if (comp) setCopiedComponent(structuredClone(comp));
      },

      onPaste: (screenIndex: number) => {
        if (!copiedComponent) return;
        updateConfig((prev) => {
          const screens = [...prev.screens];
          const screen = { ...screens[screenIndex] };
          const pasted = {
            ...structuredClone(copiedComponent),
            id: `comp_${Date.now()}`,
            order: screen.components.length,
          };
          screen.components = [...screen.components, pasted];
          screens[screenIndex] = screen;
          return { ...prev, screens };
        });
      },

      onCopyStyles: (componentId: string) => {
        const comp = currentScreen?.components.find((c) => c.id === componentId);
        if (comp) setCopiedStyles(structuredClone(comp.props) as Record<string, unknown>);
      },

      onPasteStyles: (componentId: string) => {
        if (!copiedStyles) return;
        updateConfig((prev) => {
          const screens = [...prev.screens];
          const screen = { ...screens[selectedScreenIndex] };
          screen.components = screen.components.map((c) =>
            c.id === componentId
              ? ({ ...c, props: { ...c.props, ...copiedStyles } } as typeof c)
              : c,
          );
          screens[selectedScreenIndex] = screen;
          return { ...prev, screens };
        });
      },

      onDelete: (componentId: string) => {
        deleteComponent(componentId);
      },
    }),
    [
      copiedComponent,
      copiedStyles,
      currentScreen,
      selectedScreenIndex,
      updateConfig,
      updateComponentProp,
      deleteComponent,
    ],
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

  /* ── Reorder screens via drag-and-drop ── */
  const reorderScreens = useCallback(
    (fromIndex: number, toIndex: number) => {
      updateConfig((prev) => ({
        ...prev,
        screens: arrayMove(prev.screens, fromIndex, toIndex).map((s, i) => ({
          ...s,
          order: i,
        })),
      }));
      setSelectedScreenIndex(toIndex);
    },
    [updateConfig],
  );

  /* ── Reorder components within a screen via drag-and-drop ── */
  const reorderComponents = useCallback(
    (screenIndex: number, fromIndex: number, toIndex: number) => {
      updateConfig((prev) => {
        const screens = [...prev.screens];
        const screen = { ...screens[screenIndex] };
        const sorted = [...screen.components].sort((a, b) => a.order - b.order);
        const reordered = arrayMove(sorted, fromIndex, toIndex).map((c, i) => ({
          ...c,
          order: i,
        }));
        screen.components = reordered;
        screens[screenIndex] = screen;
        return { ...prev, screens };
      });
    },
    [updateConfig],
  );

  const handleTabClick = (tab: SidebarTab) => {
    if (activeTab === tab && sidebarExpanded) setSidebarExpanded(false);
    else {
      setActiveTab(tab);
      setSidebarExpanded(true);
    }
  };

  const handleUseTemplate = useCallback(
    (template: TemplateDefinition) => {
      const screen = template.build();
      screen.order = config.screens.length;

      updateConfig((prev) => ({
        ...prev,
        screens: [...prev.screens, screen],
      }));
      setSelectedScreenIndex(config.screens.length);
      setSelectedComponentId(null);
      setActiveTab("add"); // Switch to content tab after insertion
    },
    [config.screens.length, updateConfig],
  );

  // Quick Start flow builder — generates multiple screens at once
  const handleBuildQuickFlow = useCallback(
    (templateIds: string[]) => {
      const newScreens = templateIds
        .map((id) => {
          const tpl = ALL_TEMPLATES.find((t) => t.id === id);
          return tpl ? tpl.build() : null;
        })
        .filter(Boolean)
        .map((screen, i) => ({
          ...screen!,
          order: config.screens.length + i,
        }));

      if (newScreens.length === 0) return;

      updateConfig((prev) => ({
        ...prev,
        screens: [...prev.screens, ...newScreens],
      }));
      setSelectedScreenIndex(config.screens.length);
      setSelectedComponentId(null);
    },
    [config.screens.length, updateConfig],
  );

  /* ─── Per-screen content renderer ──── */
  const renderScreenContent = useCallback(
    (screen: typeof config.screens[number], screenIdx: number) => (
      <div
        className="flex-1 overflow-y-auto"
        style={{
          backgroundColor: screen?.style?.backgroundColor || "#FFFFFF",
          padding: screen?.style?.padding || 24,
          cursor: "default",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {screen?.components.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Smartphone size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No components yet</p>
            <p className="text-xs text-gray-300 mt-1">Add components from the sidebar</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {[...screen.components]
              .sort((a, b) => a.order - b.order)
              .map((comp) => (
                <PhonePreviewComponent
                  key={comp.id}
                  component={comp}
                  isSelected={screenIdx === selectedScreenIndex && comp.id === selectedComponentId}
                  onSelect={() => {
                    setSelectedScreenIndex(screenIdx);
                    setSelectedComponentId(comp.id);
                  }}
                />
              ))}
          </div>
        )}
      </div>
    ),
    [selectedScreenIndex, selectedComponentId],
  );

  const renderProgressBar = useCallback(
    (screenIdx: number) =>
      config.settings?.showProgressBar ? (
        <div className="h-1 bg-gray-100 shrink-0">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((screenIdx + 1) / config.screens.length) * 100}%`,
              backgroundColor: config.settings.progressBarColor || "#007AFF",
            }}
          />
        </div>
      ) : null,
    [config.settings?.showProgressBar, config.settings?.progressBarColor, config.screens.length],
  );

  /* ─── Canvas layout constants ──── */
  const SCREEN_GAP = 80;
  const totalCanvasWidth =
    config.screens.length * frame.frameWidth +
    (config.screens.length - 1) * SCREEN_GAP;
  const canvasStartX = -totalCanvasWidth / 2;

  const duplicateScreen = useCallback(
    (index: number) => {
      updateConfig((prev) => {
        const source = prev.screens[index];
        const clone = {
          ...structuredClone(source),
          id: `screen_${Date.now()}`,
          name: `${source.name} (copy)`,
          order: prev.screens.length,
        };
        return { ...prev, screens: [...prev.screens, clone] };
      });
    },
    [updateConfig],
  );

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* ─── SIDEBAR ─────────────────────────────────── */}
      <div className="flex shrink-0 h-full">
        <div className="w-[52px] bg-white/[0.02] border-r border-white/[0.08] flex flex-col items-center shrink-0">
          <div className="flex flex-col items-center py-3 gap-1 flex-1">
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
        </div>

        <div
          className={`border-r border-white/[0.08] bg-white/[0.015] flex flex-col overflow-hidden transition-all duration-200 ease-out ${
            sidebarExpanded ? "w-[260px] opacity-100" : "w-0 opacity-0"
          }`}
        >
          <div className="h-[53px] px-4 border-b border-white/[0.08] shrink-0 flex items-center justify-between">
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
                onReorderScreens={reorderScreens}
                onReorderComponents={reorderComponents}
                componentActions={componentActions}
                onRenameScreen={(i, newName) => {
                  updateConfig((prev) => {
                    const screens = [...prev.screens];
                    screens[i] = { ...screens[i], name: newName };
                    return { ...prev, screens };
                  });
                }}
                onDuplicateScreen={(i) => {
                  updateConfig((prev) => {
                    const source = prev.screens[i];
                    const clone = {
                      ...structuredClone(source),
                      id: `screen_${Date.now()}`,
                      name: `${source.name} (copy)`,
                      order: prev.screens.length,
                    };
                    return { ...prev, screens: [...prev.screens, clone] };
                  });
                }}
              />
            )}
            {activeTab === "add" && <ComponentPalette onAdd={addComponent} />}
            {activeTab === "templates" && (
              <div className="relative h-full">
                {/* Quick Start flows at top */}
                <QuickFlowTemplates onBuildFlow={handleBuildQuickFlow} />

                {/* Divider */}
                <div className="border-t border-white/[0.06] my-4" />

                {/* Full template browser */}
                <TemplatePalette onSelectTemplate={handleUseTemplate} />
              </div>
            )}
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
          onBack={() =>
            router.push(`/dashboard/project/${projectId}`)
          }
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
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={history.undo}
          onRedo={history.redo}
          isDirty={history.isDirty}
          saveState={saveState}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
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
            {/* All screens laid out horizontally */}
            <div className="absolute flex items-start" style={{ top: -frame.frameHeight / 2 }}>
              {config.screens.map((screen, idx) => {
                const xPos = canvasStartX + idx * (frame.frameWidth + SCREEN_GAP);
                const isSelected = idx === selectedScreenIndex;

                return (
                  <React.Fragment key={screen.id}>
                    {/* Connection arrow between screens */}
                    {idx > 0 && (
                      <div
                        className="absolute flex items-center justify-center"
                        style={{
                          left: canvasStartX + (idx - 1) * (frame.frameWidth + SCREEN_GAP) + frame.frameWidth,
                          top: frame.frameHeight / 2 - 12,
                          width: SCREEN_GAP,
                          height: 24,
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <div className="h-px bg-white/[0.15]" style={{ width: SCREEN_GAP - 32 }} />
                          <ChevronRight size={14} className="text-white/25 shrink-0" />
                        </div>
                      </div>
                    )}

                    {/* Screen frame with context menu */}
                    <div
                      className="absolute"
                      style={{ left: xPos, top: 0 }}
                    >
                      {/* Screen label above frame */}
                      <div
                        className={`flex items-center justify-between mb-3 px-1 transition-colors ${
                          isSelected ? "opacity-100" : "opacity-60 hover:opacity-80"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isSelected
                                ? "bg-blue-500 text-white"
                                : "bg-white/[0.08] text-white/60"
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <span
                            className={`text-[11px] font-medium ${
                              isSelected ? "text-white" : "text-white/50"
                            }`}
                          >
                            {screen.name}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="p-1 text-white/20 hover:text-white/60 hover:bg-white/[0.06] rounded transition-colors"
                        >
                          <Settings2 size={11} />
                        </button>
                      </div>

                      <ContextMenu>
                        <ContextMenuTrigger render={<div />}>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setSelectedScreenIndex(idx);
                              setSelectedComponentId(null);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className={`rounded-[4px] transition-all cursor-pointer ${
                              isSelected
                                ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0a0a0a] shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                                : "ring-1 ring-transparent hover:ring-white/[0.15] opacity-75 hover:opacity-100"
                            }`}
                          >
                            <DeviceFrame
                              device={selectedDevice}
                              orientation={orientation}
                              frame={frame}
                              screenContent={renderScreenContent(screen, idx)}
                              progressBar={renderProgressBar(idx)}
                            />
                          </div>
                        </ContextMenuTrigger>

                        <ContextMenuContent className="min-w-[180px] bg-[#1a1a1e] border-white/[0.1] rounded-xl shadow-2xl p-1">
                          <ContextMenuItem
                            onClick={() => duplicateScreen(idx)}
                            className="text-white/80 focus:bg-white/[0.08] focus:text-white"
                          >
                            <Copy size={14} className="mr-2 text-white/40" />
                            Duplicate Screen
                          </ContextMenuItem>
                          <ContextMenuSeparator className="bg-white/[0.08]" />
                          <ContextMenuItem
                            onClick={() => deleteScreen(idx)}
                            disabled={config.screens.length <= 1}
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-400 disabled:text-white/20"
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete Screen
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    </div>
                  </React.Fragment>
                );
              })}
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
      
      <TabStyleSidebar
        open={tabSidebarOpen}
        onClose={() => setTabSidebarOpen(false)}
        onSelect={handleTabPresetSelect}
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
      {frame.isMobile && !isLandscape && (
        <>
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

      {spec.hasHomeButton && !isLandscape && (
        <div
          className="absolute flex flex-col items-center gap-1.5"
          style={{ top: 16, left: "50%", transform: "translateX(-50%)" }}
        >
          <div
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: "rgba(0,0,0,0.25)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
          <div
            className="rounded-full"
            style={{ width: 40, height: 5, backgroundColor: "rgba(0,0,0,0.2)" }}
          />
        </div>
      )}

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

      <div
        className="w-full h-full overflow-hidden flex flex-col relative"
        style={{ borderRadius: frame.innerRadius, backgroundColor: "#fff" }}
      >
        <StatusBar device={device} frame={frame} isLandscape={isLandscape} />
        {screenContent}
        {progressBar}
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

  if (spec.hasHomeButton) {
    return (
      <div className="flex items-center justify-between px-4 shrink-0" style={{ height: spec.statusBarHeight }}>
        <span className="text-[11px] font-semibold text-black">9:41</span>
        <StatusBarIcons size="small" />
      </div>
    );
  }

  if (spec.notch === "notch") {
    return (
      <div className="relative flex items-end justify-between px-6 shrink-0" style={{ height: spec.statusBarHeight }}>
        <span className="text-[15px] font-semibold text-black tracking-tight pb-1">9:41</span>
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <svg width="164" height="32" viewBox="0 0 164 32" fill="none">
            <path d="M0 0H50C50 0 50 0 54 4C58 8 60 12 64 16C68 20 72 24 82 24C92 24 96 20 100 16C104 12 106 8 110 4C114 0 114 0 114 0H164V0H0Z" fill="black" />
            <rect x="50" y="0" width="64" height="4" fill="black" />
          </svg>
        </div>
        <div className="pb-1">
          <StatusBarIcons size="normal" />
        </div>
      </div>
    );
  }

  if (spec.notch === "dynamic-island") {
    return (
      <div className="relative flex items-end justify-between px-8 shrink-0" style={{ height: spec.statusBarHeight }}>
        <span className="text-[15px] font-semibold text-black tracking-tight pb-2">9:41</span>
        <div className="absolute left-1/2 -translate-x-1/2 bg-black rounded-full" style={{ top: 12, width: 120, height: 34 }} />
        <div className="pb-2">
          <StatusBarIcons size="normal" />
        </div>
      </div>
    );
  }

  if (spec.notch === "punch-hole") {
    const isPixel = device.id.startsWith("pixel");
    return (
      <div className="relative flex items-center justify-between px-5 shrink-0" style={{ height: spec.statusBarHeight }}>
        <span className="text-[12px] font-medium text-black">{isPixel ? "12:30" : "9:41"}</span>
        <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black" style={{ width: 10, height: 10, top: "50%", transform: "translate(-50%, -50%)" }} />
        <StatusBarIcons size="small" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-6 shrink-0" style={{ height: spec.statusBarHeight }}>
      <span className="text-[13px] font-semibold text-black tracking-tight">9:41</span>
      <StatusBarIcons size="normal" />
    </div>
  );
}

/* ── HOME AREA ──────────────────────────────────────────── */
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
  if (spec.hasHomeButton) return null;

  if (spec.homeIndicatorHeight > 0) {
    return (
      <div className="flex items-center justify-center shrink-0 bg-white" style={{ height: spec.homeIndicatorHeight }}>
        <div
          className="bg-black/20 rounded-full"
          style={{ width: isLandscape ? Math.min(200, frame.viewportWidth * 0.15) : 134, height: 5 }}
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
  );
}