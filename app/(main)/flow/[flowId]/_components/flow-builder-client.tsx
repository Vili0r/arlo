"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  Smartphone,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Copy,
  Trash2,
  Settings2,
  Eye,
  EyeOff,
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
import { SIDEBAR_TABS, type SidebarTab } from "../_lib/constants";
import { createDefaultComponent } from "../_lib/defaults";
import { useCanvas } from "../_lib/use-canvas";
import {
  ALL_DEVICES,
  DEFAULT_DEVICE_ID,
  getFrameDimensions,
  type DevicePreset,
  type Orientation,
} from "../_lib/device-presets";
import { ScreensList } from "./screens-list";
import { ComponentPalette } from "./component-palette";
import { PropertySheet } from "./property-sheet";
import { PhonePreviewComponent } from "./phone-preview";
import { CanvasToolbar } from "./canvas-toolbar";
import type { ComponentActions } from "./screens-list";
import { TabStyleSidebar, presetToTabComponentProps } from "./tab-style-sidebar";
import { useHistory } from "../_lib/use-history";
import { useKeyboardShortcuts } from "../_lib/use-keyboard-shortcuts";
import { saveDraft, autoSaveDraft, publishFlow, getFlow } from "../actions";
import { TemplatePalette, QuickFlowTemplates } from "./template-picker";
import { ALL_TEMPLATES, type TemplateDefinition } from "../_lib/templates";

import { DeviceFrame } from "./device-frame";
import {
  SidebarTabButtons,
  IndicatorSettingsPanel,
  ScreenStyleSection,
  ScreenLogicPanel,
  BackIcon,
  type IndicatorSettings,
  mergeIndicator,
 } from "./sidebar-panels";


/* ── DARK BG HELPER (for indicator bar) ────────────────── */
function isDarkColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}



export function FlowBuilderClient({
  flowId,
  initialData,
  initialProjectId,
}: {
  flowId: string;
  initialData: FlowConfig | null;
  initialProjectId: string | null;
}) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(initialProjectId);
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
  const history = useHistory<FlowConfig>(initialData || defaultConfig);
  const config = history.state;

  const currentScreen = config.screens[selectedScreenIndex];
  const selectedComponent = currentScreen?.components.find((c) => c.id === selectedComponentId);
  const frame = getFrameDimensions(selectedDevice, orientation);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (selectedComponentId) setSheetOpen(true);
  }, [selectedComponentId]);

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
    (preset: import("./tab-style-sidebar").TabPreset) => {
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
      setActiveTab("add");
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
    (screen: typeof config.screens[number], screenIdx: number) => {
      const sorted = screen?.components.length
        ? [...screen.components].sort((a, b) => a.order - b.order)
        : [];

      // Split into main content vs bottom-pinned components
      const mainComponents = sorted.filter(
        (c) => !(c.props as any)?.position || (c.props as any)?.position !== "bottom",
      );
      const bottomComponents = sorted.filter(
        (c) => (c.props as any)?.position === "bottom",
      );

      const bgColor = screen?.style?.backgroundColor || "#FFFFFF";
      const padding = screen?.style?.padding ?? 24;
      const totalScreens = config.screens.length;
      const progress = totalScreens > 1 ? ((screenIdx + 1) / totalScreens) * 100 : 100;
      const dark = isDarkColor(bgColor);

      // Merge global + per-screen indicator settings
      const indicator = mergeIndicator(
        (config.settings as any)?.indicator,
        (screen as any)?.indicator,
      );

      // Resolve colours: use explicit colours or auto-adapt to bg
      const resolvedProgressColor =
        indicator.progressColor || (indicator.autoAdapt
          ? (dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.25)")
          : "rgba(0,0,0,0.25)");
      const resolvedTrackColor =
        indicator.trackColor || (indicator.autoAdapt
          ? (dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)")
          : "rgba(0,0,0,0.08)");
      const resolvedIconColor = indicator.autoAdapt
        ? (dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)")
        : "rgba(0,0,0,0.4)";

      return (
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ backgroundColor: bgColor, cursor: "default" }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* ── Top indicator: back button + progress line ── */}
          {indicator.visible && (
            <div
              className="flex items-center gap-2.5 shrink-0"
              style={{
                paddingLeft: padding * 0.6,
                paddingRight: padding * 0.6,
                paddingTop: 8,
                paddingBottom: 6,
              }}
            >
              {/* Back button — visible on screens after the first */}
              <div 
                className="shrink-0 w-[26px] h-[26px] flex items-center justify-center rounded-full"
                style={{ backgroundColor: indicator.backButtonBgColor || "transparent" }}
              >
                {screenIdx > 0 && indicator.backButtonStyle !== "none" ? (
                  <BackIcon style={indicator.backButtonStyle} color={resolvedIconColor} size={16} />
                ) : (
                  <div className="w-4" />
                )}
              </div>

              {/* Progress line */}
              <div
                className="flex-1 rounded-full overflow-hidden"
                style={{
                  height: indicator.height,
                  backgroundColor: resolvedTrackColor,
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: resolvedProgressColor,
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Scrollable main content ── */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ padding }}
          >
            {sorted.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <Smartphone size={20} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">No components yet</p>
                <p className="text-xs text-gray-300 mt-1">Add components from the sidebar</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {mainComponents.map((comp) => (
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

          {/* ── Bottom-pinned components ── */}
          {bottomComponents.length > 0 && (
            <div
              className="shrink-0 flex flex-col gap-2"
              style={{ padding: `12px ${padding}px ${padding}px` }}
            >
              {bottomComponents.map((comp) => (
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
      );
    },
    [selectedScreenIndex, selectedComponentId, config.screens.length, config.settings],
  );

  /* ─── Canvas layout constants ──── */
  const SCREEN_GAP = 80;
  const totalCanvasWidth =
    config.screens.length * frame.frameWidth +
    (config.screens.length - 1) * SCREEN_GAP;
  const canvasStartX = -totalCanvasWidth / 2;

  /* ─── Branch connections: buttons targeting specific screens ──── */
  const branchConnections = useMemo(() => {
    const connections: {
      fromScreenIndex: number;
      toScreenIndex: number;
      label: string;
      source: "button" | "rule" | "skip";
    }[] = [];

    const screenIdToIndex = new Map(
      config.screens.map((s, i) => [s.id, i])
    );

    config.screens.forEach((screen, fromIdx) => {
      // Button-level branches
      screen.components.forEach((comp) => {
        if (comp.type !== "BUTTON") return;
        const p = comp.props as Record<string, any>;
        if (p.action === "NEXT_SCREEN" && p.actionTarget === "specific" && p.actionTargetScreenId) {
          const toIdx = screenIdToIndex.get(p.actionTargetScreenId);
          if (toIdx !== undefined && toIdx !== fromIdx) {
            connections.push({
              fromScreenIndex: fromIdx,
              toScreenIndex: toIdx,
              label: p.label || "Button",
              source: "button",
            });
          }
        }
      });

      // Screen-level branch rules
      screen.branchRules?.forEach((rule) => {
        if (!rule.targetScreenId) return;
        const toIdx = screenIdToIndex.get(rule.targetScreenId);
        if (toIdx !== undefined && toIdx !== fromIdx) {
          connections.push({
            fromScreenIndex: fromIdx,
            toScreenIndex: toIdx,
            label: `${rule.fieldKey} ${rule.operator}`,
            source: "rule",
          });
        }
      });
    });

    return connections;
  }, [config.screens]);

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
    <div className="relative flex h-screen overflow-hidden bg-black">
      {/* ─── SIDEBAR ─────────────────────────────────── */}
      <div className="flex shrink-0 h-full">
        <div className="w-[52px] bg-white/[0.02] border-r border-white/[0.08] flex flex-col items-center shrink-0">
          <div className="flex flex-col items-center py-3 gap-1 flex-1">
            <SidebarTabButtons
              activeTab={activeTab}
              sidebarExpanded={sidebarExpanded}
              onTabClick={handleTabClick}
            />
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
                <QuickFlowTemplates onBuildFlow={handleBuildQuickFlow} />
                <div className="border-t border-white/[0.06] my-4" />
                <TemplatePalette onSelectTemplate={handleUseTemplate} />
              </div>
            )}
            {activeTab === "settings" && (
              <div className="space-y-4">
                <IndicatorSettingsPanel
                  globalIndicator={(config.settings as any)?.indicator}
                  screenIndicator={(currentScreen as any)?.indicator}
                  onUpdateGlobal={(patch) => {
                    updateConfig((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        indicator: {
                          ...(prev.settings as any)?.indicator,
                          ...patch,
                        },
                      },
                    }));
                  }}
                  onUpdateScreen={(patch) => {
                    updateConfig((prev) => {
                      const screens = [...prev.screens];
                      screens[selectedScreenIndex] = {
                        ...screens[selectedScreenIndex],
                        indicator: {
                          ...(screens[selectedScreenIndex] as any)?.indicator,
                          ...patch,
                        },
                      } as any;
                      return { ...prev, screens };
                    });
                  }}
                  onClearScreenOverride={() => {
                    updateConfig((prev) => {
                      const screens = [...prev.screens];
                      const { indicator, ...rest } = screens[selectedScreenIndex] as any;
                      screens[selectedScreenIndex] = rest;
                      return { ...prev, screens };
                    });
                  }}
                  hasScreenOverride={!!(currentScreen as any)?.indicator}
                  screenName={currentScreen?.name || ""}
                />

                <ScreenStyleSection
                  currentScreen={currentScreen}
                  onUpdateStyle={(patch) => {
                    updateConfig((prev) => {
                      const screens = [...prev.screens];
                      screens[selectedScreenIndex] = {
                        ...screens[selectedScreenIndex],
                        style: { ...screens[selectedScreenIndex].style, ...patch },
                      };
                      return { ...prev, screens };
                    });
                  }}
                />

                <ScreenLogicPanel
                  currentScreen={currentScreen}
                  allScreens={config.screens}
                  onUpdateBranchRules={(rules) => {
                    updateConfig((prev) => {
                      const screens = [...prev.screens];
                      screens[selectedScreenIndex] = {
                        ...screens[selectedScreenIndex],
                        branchRules: rules,
                      };
                      return { ...prev, screens };
                    });
                  }}
                  onUpdateSkipConditions={(conditions) => {
                    updateConfig((prev) => {
                      const screens = [...prev.screens];
                      screens[selectedScreenIndex] = {
                        ...screens[selectedScreenIndex],
                        skipWhen: conditions,
                      };
                      return { ...prev, screens };
                    });
                  }}
                />
              </div>
            )}
          </div>
          {activeTab === "screens" && (
            <div className="border-t border-white/[0.08] shrink-0 p-3 pt-2">
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
            {/* Branch connection arrows (buttons targeting specific screens) */}
            {branchConnections.length > 0 && (
              <svg
                className="absolute pointer-events-none"
                style={{
                  left: 0,
                  top: -frame.frameHeight / 2,
                  width: totalCanvasWidth + 200,
                  height: frame.frameHeight + 160,
                  overflow: "visible",
                }}
              >
                <defs>
                  <marker
                    id="branch-arrow"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M 0 1 L 6 4 L 0 7" fill="none" stroke="rgba(168,85,247,0.6)" strokeWidth="1.5" />
                  </marker>
                  <marker
                    id="branch-arrow-back"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M 0 1 L 6 4 L 0 7" fill="none" stroke="rgba(251,146,60,0.6)" strokeWidth="1.5" />
                  </marker>
                  <marker
                    id="branch-arrow-rule"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M 0 1 L 6 4 L 0 7" fill="none" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" />
                  </marker>
                </defs>
                {branchConnections.map((conn, i) => {
                  const fromX = canvasStartX + conn.fromScreenIndex * (frame.frameWidth + SCREEN_GAP) + frame.frameWidth / 2;
                  const toX = canvasStartX + conn.toScreenIndex * (frame.frameWidth + SCREEN_GAP) + frame.frameWidth / 2;
                  const isForward = conn.toScreenIndex > conn.fromScreenIndex;
                  const arcY = isForward
                    ? frame.frameHeight + 40 + i * 28
                    : -30 - i * 28;
                  // Color by source: purple for buttons, cyan for rules, orange for backward
                  const color = !isForward
                    ? "rgba(251,146,60,0.5)"
                    : conn.source === "rule"
                      ? "rgba(34,211,238,0.5)"
                      : "rgba(168,85,247,0.5)";
                  const textColor = !isForward
                    ? "rgba(251,146,60,0.8)"
                    : conn.source === "rule"
                      ? "rgba(34,211,238,0.8)"
                      : "rgba(168,85,247,0.8)";
                  const marker = !isForward
                    ? "url(#branch-arrow-back)"
                    : conn.source === "rule"
                      ? "url(#branch-arrow-rule)"
                      : "url(#branch-arrow)";
                  const startY = isForward ? frame.frameHeight : 0;
                  const endY = startY;
                  const cpY = arcY;
                  const prefix = conn.source === "rule" ? "IF " : "";

                  return (
                    <g key={`branch-${i}`}>
                      <path
                        d={`M ${fromX} ${startY} C ${fromX} ${cpY}, ${toX} ${cpY}, ${toX} ${endY}`}
                        fill="none"
                        stroke={color}
                        strokeWidth={2}
                        strokeDasharray={conn.source === "rule" ? "4 3" : "6 4"}
                        markerEnd={marker}
                      />
                      {/* Label on the branch */}
                      <rect
                        x={(fromX + toX) / 2 - 36}
                        y={cpY - 10}
                        width={72}
                        height={20}
                        rx={6}
                        fill="rgba(0,0,0,0.7)"
                        stroke={color}
                        strokeWidth={1}
                      />
                      <text
                        x={(fromX + toX) / 2}
                        y={cpY + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={textColor}
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="inherit"
                      >
                        {(() => {
                          const full = prefix + conn.label;
                          return full.length > 10 ? full.slice(0, 9) + "…" : full;
                        })()}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

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
                              progressBar={null}
                              screenBgColor={screen.style?.backgroundColor || "#FFFFFF"}
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
        screens={config.screens}
      />
      
      <TabStyleSidebar
        open={tabSidebarOpen}
        onClose={() => setTabSidebarOpen(false)}
        onSelect={handleTabPresetSelect}
      />
    </div>
  );
}
