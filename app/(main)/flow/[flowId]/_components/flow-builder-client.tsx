"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  Smartphone,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Copy,
  Trash2,
  Settings2,
} from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useRouter } from "next/navigation";
import { arrayMove } from "@dnd-kit/sortable";
import type { ComponentType, FlowComponent, FlowConfig } from "@/lib/types";
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
import { CanvasToolbar, type ToolMode } from "./canvas-toolbar";
import { CanvasInteractionLayer } from "./canvas-interaction-layer";
import { LayersPanel } from "./layers-panel";
import { QuickInsertPalette } from "./quick-insert-palette";
import { InlineTextEditor } from "./inline-text-editor";
import { ScreenDropSurface } from "./screen-drop-surface";
import type { ComponentActions } from "./screens-list";
import { TabStyleSidebar, presetToTabComponentProps } from "./tab-style-sidebar";
import { useHistory } from "../_lib/use-history";
import { useKeyboardShortcuts } from "../_lib/use-keyboard-shortcuts";
import { saveDraft, autoSaveDraft, publishFlow, promoteDevelopmentToProduction } from "../actions";
import { TemplatePalette, QuickFlowTemplates } from "./template-picker";
import { ALL_TEMPLATES, type TemplateDefinition } from "../_lib/templates";
import type { ImportMode } from "../_lib/code-import";
import { CodeImportDialog } from "./code-import-dialog";
import {
  appendComponentNode,
  compileEditorDocument,
  convertScreenToAbsoluteLayout,
  duplicateNodeInScreen,
  type EditorComponentNode,
  flowConfigToEditorDocument,
  getComponentNode,
  removeNodeFromScreen,
  type EditorDocument,
  type EditorNodeTransform,
} from "../_lib/editor-document";
import { useEditorInteractionStore } from "../_lib/editor-interaction-store";
import { DEFAULT_FLOW_CONFIG } from "../_lib/default-flow-config";
import { applyImportedScreensToDocument } from "../_lib/import-flow";

import { DeviceFrame } from "./device-frame";
import { NodeRenderer } from "./node-renderer";
import {
  SidebarTabButtons,
  ScreenLogicPanel,
  BackIcon,
  type IndicatorSettings,
  mergeIndicator,
 } from "./sidebar-panels";
import type { ScreenTransitionConfig } from "../_lib/animation-presets";
import { FlowPreviewOverlay } from "./flow-preview-overlay";

type PositionedComponentProps = Record<string, unknown> & {
  position?: string;
};

type ButtonActionProps = Record<string, unknown> & {
  action?: string;
  actionTarget?: string;
  actionTargetScreenId?: string;
  label?: string;
};

type IndicatorAwareDocumentSettings = EditorDocument["settings"] & {
  indicator?: Partial<IndicatorSettings>;
};

type IndicatorAwareDocumentScreen = EditorDocument["screens"][number] & {
  indicator?: Partial<IndicatorSettings>;
};

type BuilderClipboardItem = {
  component: FlowComponent;
  transform: EditorNodeTransform;
};

type BuilderClipboard = {
  items: BuilderClipboardItem[];
  pasteCount: number;
};

type QuickInsertState = {
  screenIndex: number;
  x: number;
  y: number;
} | null;

type InlineTextEditState = {
  screenIndex: number;
  nodeId: string;
} | null;

const DEFAULT_ABSOLUTE_INSERT_SIZE = {
  width: 180,
  height: 80,
};

type OneClickInteractiveType =
  | "BUTTON"
  | "TEXT_INPUT"
  | "TAB_BUTTON"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "SLIDER"
  | "CAROUSEL";

const ONE_CLICK_INTERACTIVE_SIZES: Partial<
  Record<OneClickInteractiveType, { width: number; height: number }>
> = {
  BUTTON: { width: 220, height: 56 },
  TEXT_INPUT: { width: 240, height: 72 },
  TAB_BUTTON: { width: 280, height: 76 },
  SINGLE_SELECT: { width: 260, height: 180 },
  MULTI_SELECT: { width: 260, height: 140 },
  SLIDER: { width: 260, height: 96 },
  CAROUSEL: { width: 320, height: 220 },
};

function setValueAtPath<T extends object>(
  source: T,
  path: string,
  value: unknown,
): T {
  const segments = path.split(".");
  const result: Record<string, unknown> = { ...(source as Record<string, unknown>) };
  let cursor = result;

  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      cursor[segment] = value;
      return;
    }

    const current = cursor[segment];
    const next =
      current && typeof current === "object" && !Array.isArray(current)
        ? { ...(current as Record<string, unknown>) }
        : {};
    cursor[segment] = next;
    cursor = next;
  });

  return result as T;
}

function getComponentCanvasSize(component: FlowComponent) {
  const props = component.props as Record<string, unknown>;

  const width =
    typeof props.width === "number"
      ? props.width
      : typeof props.fixedWidth === "number"
        ? props.fixedWidth
        : component.layout?.width ?? DEFAULT_ABSOLUTE_INSERT_SIZE.width;

  const height =
    typeof props.height === "number"
      ? props.height
      : typeof props.fixedHeight === "number"
        ? props.fixedHeight
        : component.layout?.height ?? (component.type === "TEXT" ? 72 : DEFAULT_ABSOLUTE_INSERT_SIZE.height);

  return {
    width: Math.max(width, 20),
    height: Math.max(height, 20),
  };
}

function getComponentPrimaryCopy(component: FlowComponent) {
  const props = component.props as Record<string, unknown>;

  if (typeof props.label === "string" && props.label.trim()) return props.label.trim();
  if (typeof props.content === "string" && props.content.trim()) return props.content.trim();
  if (typeof props.text === "string" && props.text.trim()) return props.text.trim();
  if (typeof props.title === "string" && props.title.trim()) return props.title.trim();

  return "";
}

function getFieldKeyPrefix(type: ComponentType) {
  switch (type) {
    case "TEXT_INPUT":
      return "field";
    case "SINGLE_SELECT":
      return "select";
    case "MULTI_SELECT":
      return "multi";
    case "SLIDER":
      return "slider";
    default:
      return "value";
  }
}

function buildFieldKey(type: ComponentType, componentId: string) {
  const suffix = componentId.replace(/^comp_/, "").slice(-6).toLowerCase();
  return `${getFieldKeyPrefix(type)}_${suffix || "value"}`;
}

function buildOneClickInteractiveComponent(
  source: FlowComponent,
  nextType: OneClickInteractiveType,
): FlowComponent {
  if (source.type === nextType) return source;

  const nextComponent = createDefaultComponent(nextType, source.order);
  const nextProps = structuredClone(nextComponent.props) as Record<string, unknown>;
  const carryCopy = getComponentPrimaryCopy(source);

  if (typeof nextProps.fieldKey === "string") {
    nextProps.fieldKey = buildFieldKey(nextType, source.id);
  }

  if (
    carryCopy &&
    ["BUTTON", "TEXT_INPUT", "SINGLE_SELECT", "MULTI_SELECT", "SLIDER"].includes(nextType)
  ) {
    nextProps.label = carryCopy;
  }

  if (nextType === "TEXT_INPUT" && carryCopy) {
    nextProps.placeholder = `Enter ${carryCopy.toLowerCase()}...`;
  }

  if (nextType === "TAB_BUTTON" && carryCopy && Array.isArray(nextProps.tabs) && nextProps.tabs[0]) {
    nextProps.tabs = nextProps.tabs.map((tab, index) =>
      index === 0 && tab && typeof tab === "object"
        ? { ...(tab as Record<string, unknown>), label: carryCopy }
        : tab,
    );
  }

  if (nextType === "CAROUSEL" && carryCopy && Array.isArray(nextProps.items) && nextProps.items[0]) {
    nextProps.items = nextProps.items.map((item, index) =>
      index === 0 && item && typeof item === "object"
        ? { ...(item as Record<string, unknown>), title: carryCopy }
        : item,
    );
  }

  return {
    ...nextComponent,
    id: source.id,
    order: source.order,
    animation: source.animation,
    layout: source.layout,
    interactions: source.interactions,
    props: nextProps as typeof nextComponent.props,
  } as FlowComponent;
}

function getComponentDisplayName(component: FlowComponent, fallback: string) {
  const copy = getComponentPrimaryCopy(component);
  if (copy) return copy;

  const label = component.type
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

  return label || fallback;
}


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
  initialDocument,
  initialProjectId,
  initialDevelopmentVersion,
  initialProductionVersion,
  registryKeys,
  initialSelectedScreenIndex = 0,
}: {
  flowId: string;
  initialDocument: EditorDocument | null;
  initialProjectId: string | null;
  initialDevelopmentVersion: { id: string; version: number } | null;
  initialProductionVersion: { id: string; version: number } | null;
  registryKeys: { id: string; key: string; type: "SCREEN" | "COMPONENT"; description: string | null }[];
  initialSelectedScreenIndex?: number;
}) {
  const router = useRouter();
  const projectId = initialProjectId;
  const {
    canvasRef,
    zoom,
    panOffset,
    isPanning,
    isDraggingPhone,
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp,
    zoomIn,
    zoomOut,
    resetZoom,
    setCanvasView,
    resetView,
  } = useCanvas();

  const [selectedScreenIndex, setSelectedScreenIndex] = useState(initialSelectedScreenIndex);
  const [activeTab, setActiveTab] = useState<SidebarTab>("screens");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [tabSidebarOpen, setTabSidebarOpen] = useState(false);
  const [developmentVersion, setDevelopmentVersion] = useState(initialDevelopmentVersion);
  const [productionVersion, setProductionVersion] = useState(initialProductionVersion);
  const [codeImportOpen, setCodeImportOpen] = useState(false);

  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(
    ALL_DEVICES.find((d) => d.id === DEFAULT_DEVICE_ID) || ALL_DEVICES[0],
  );
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [fullScreenView, setFullScreenView] = useState(false);

  const [builderClipboard, setBuilderClipboard] = useState<BuilderClipboard | null>(null);
  const [copiedStyles, setCopiedStyles] = useState<Record<string, unknown> | null>(null);
  const [quickInsertState, setQuickInsertState] = useState<QuickInsertState>(null);
  const [inlineTextEdit, setInlineTextEdit] = useState<InlineTextEditState>(null);
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const absoluteNodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const defaultDocument = useMemo(() => flowConfigToEditorDocument(DEFAULT_FLOW_CONFIG), []);
  const history = useHistory<EditorDocument>(initialDocument || defaultDocument);
  const document = history.state;
  const config = useMemo(() => compileEditorDocument(document), [document]);
  const selectedNodeIds = useEditorInteractionStore((state) => state.selectedNodeIds);
  const focusedNodeId = useEditorInteractionStore((state) => state.focusedNodeId);
  const previewTransforms = useEditorInteractionStore((state) => state.previewTransforms);
  const selectNodes = useEditorInteractionStore((state) => state.selectNodes);
  const clearSelection = useEditorInteractionStore((state) => state.clearSelection);

  const currentScreenDoc = document.screens[selectedScreenIndex];
  const currentScreen = config.screens[selectedScreenIndex];
  const selectedComponentId =
    focusedNodeId && currentScreenDoc?.nodes[focusedNodeId] ? focusedNodeId : null;
  const selectedComponentNode = currentScreenDoc
    ? getComponentNode(currentScreenDoc, selectedComponentId)
    : null;
  const selectedComponent = selectedComponentNode?.component ?? null;
  const currentImportedCodePayload =
    currentScreenDoc?.source.kind === "imported-code" ? currentScreenDoc.source : null;
  const currentImportedFigmaPayload =
    currentScreenDoc?.source.kind === "imported-figma" ? currentScreenDoc.source : null;
  const isEditingImportedScreen = Boolean(currentImportedCodePayload);
  const codeImportDialogTitle = isEditingImportedScreen
    ? "Update imported code"
    : "Import React or React Native code";
  const codeImportDialogDescription = isEditingImportedScreen
    ? `Edit the stored source for ${currentImportedCodePayload?.componentName || currentScreen?.name || "this screen"}. Arlo will replace the current screen in place and keep it editable on the canvas.`
    : "Paste a component or upload a `.tsx`, `.jsx`, `.ts`, or `.js` file. Arlo will normalize supported elements into editable builder layers and preserve the original source for future updates.";
  const codeImportSubmitLabel = isEditingImportedScreen ? "Update screen" : "Import to builder";
  const screenRegistryKeys = registryKeys.filter((entry) => entry.type === "SCREEN");
  const frame = getFrameDimensions(selectedDevice, orientation);
  const effectiveTool: ToolMode = isSpacePressed ? "hand" : toolMode;

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // — Save draft handler —
  const handleSaveDraft = useCallback(async () => {
    if (!flowId || !history.isDirty) return;
    setSaveState("saving");
    try {
      await saveDraft({ flowId, document: history.state });
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
      const result = await publishFlow({
        flowId,
        document: history.state,
        environment: "DEVELOPMENT",
      });
      setDevelopmentVersion({
        id: result.versionId,
        version: result.version,
      });
      history.markSaved();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      console.error("Publish failed:", err);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, [flowId, history]);

  const handlePromoteToProduction = useCallback(async () => {
    if (!flowId) return;
    setSaveState("saving");
    try {
      const result = await promoteDevelopmentToProduction({ flowId });
      setProductionVersion({
        id: result.versionId,
        version: result.version,
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      console.error("Promote failed:", err);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, [flowId]);

  const autoSaveBeforeNavigation = useCallback(async () => {
    if (!flowId || !history.isDirty) return true;

    setSaveState("saving");
    try {
      await autoSaveDraft({ flowId, document: history.state });
      history.markSaved();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
      return true;
    } catch (err) {
      console.error("Auto-save before navigation failed:", err);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
      return false;
    }
  }, [flowId, history]);

  const navigateToImportRoute = useCallback(
    async (path: string) => {
      const canNavigate = await autoSaveBeforeNavigation();
      if (!canNavigate) return;
      router.push(path);
    },
    [autoSaveBeforeNavigation, router],
  );
  
  // — Auto-save on a 30s debounce when dirty —
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (!flowId || !history.isDirty) return;
  
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await autoSaveDraft({ flowId, document: history.state });
        history.markSaved();
      } catch {
        // Silent fail for auto-save — user can still manually save
      }
    }, 30_000);
  
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [flowId, history.isDirty, history.state, history]);

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

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && !isEditableTarget(event.target)) {
        event.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        setIsSpacePressed(false);
      }
    };
    const handleBlur = () => {
      setIsSpacePressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    if (!selectedComponentId) return;
    if (!currentScreenDoc?.nodes[selectedComponentId]) {
      clearSelection();
    }
  }, [clearSelection, currentScreenDoc, selectedComponentId]);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setTimeout(() => clearSelection(), 200);
  }, [clearSelection]);

  const updateConfig = history.set;
  const selectedNodeIdsOnCurrentScreen = useMemo(
    () =>
      selectedNodeIds.filter((nodeId) => Boolean(currentScreenDoc?.nodes[nodeId])),
    [currentScreenDoc?.nodes, selectedNodeIds],
  );
  const selectedComponentNodes = useMemo(
    () =>
      selectedNodeIdsOnCurrentScreen
        .map((nodeId) => (currentScreenDoc ? getComponentNode(currentScreenDoc, nodeId) : null))
        .filter((node): node is EditorComponentNode => Boolean(node)),
    [currentScreenDoc, selectedNodeIdsOnCurrentScreen],
  );

  const getAbsoluteNodeRefKey = useCallback((screenIdx: number, nodeId: string) => {
    return `${screenIdx}:${nodeId}`;
  }, []);

  const selectScreen = useCallback(
    (screenIndex: number) => {
      setSelectedScreenIndex((prevIndex) => {
        if (prevIndex !== screenIndex) {
          clearSelection();
        }
        return screenIndex;
      });
    },
    [clearSelection],
  );

  const selectComponent = useCallback(
    (screenIndex: number, componentId: string, additive = false) => {
      setSelectedScreenIndex(screenIndex);
      const nextSelection =
        additive && currentScreenDoc
          ? Array.from(new Set([...selectedNodeIdsOnCurrentScreen, componentId]))
          : [componentId];
      selectNodes(nextSelection, componentId);
      setSheetOpen(true);
    },
    [currentScreenDoc, selectNodes, selectedNodeIdsOnCurrentScreen],
  );

  const commitNodeTransforms = useCallback(
    (
      screenIndex: number,
      updates: Record<string, Partial<EditorNodeTransform>>,
    ) => {
      updateConfig((prev) => ({
        ...prev,
        screens: prev.screens.map((screen, currentScreenIndex) => {
          if (currentScreenIndex !== screenIndex) return screen;

          return {
            ...screen,
            nodes: Object.fromEntries(
              Object.entries(screen.nodes).map(([nodeId, node]) => {
                const patch = updates[nodeId];
                if (!patch) return [nodeId, node];

                return [
                  nodeId,
                  {
                    ...node,
                    transform: {
                      ...node.transform,
                      ...Object.fromEntries(
                        Object.entries(patch).filter(([, value]) => value !== undefined),
                      ),
                    },
                  },
                ];
              }),
            ) as typeof screen.nodes,
          };
        }),
      }));
    },
    [updateConfig],
  );

  const updateNodePresentation = useCallback(
    (
      nodeId: string,
      patch: Partial<{
        visible: boolean;
        locked: boolean;
        transform: Partial<EditorNodeTransform>;
      }>,
    ) => {
      updateConfig((prev) => ({
        ...prev,
        screens: prev.screens.map((screen, index) => {
          if (index !== selectedScreenIndex) return screen;
          const node = screen.nodes[nodeId];
          if (!node) return screen;

          return {
            ...screen,
            nodes: {
              ...screen.nodes,
              [nodeId]: {
                ...node,
                visible: patch.visible ?? node.visible,
                locked: patch.locked ?? node.locked,
                transform: patch.transform
                  ? {
                      ...node.transform,
                      ...patch.transform,
                    }
                  : node.transform,
              },
            },
          };
        }),
      }));
    },
    [selectedScreenIndex, updateConfig],
  );

  const updateSelectedNodesPresentation = useCallback(
    (
      patch: Partial<{
        visible: boolean;
        locked: boolean;
        transform: Partial<EditorNodeTransform>;
        constraints: EditorDocument["screens"][number]["nodes"][string]["constraints"];
      }>,
    ) => {
      if (selectedNodeIdsOnCurrentScreen.length === 0) return;

      updateConfig((prev) => ({
        ...prev,
        screens: prev.screens.map((screen, index) => {
          if (index !== selectedScreenIndex) return screen;

          return {
            ...screen,
            nodes: Object.fromEntries(
              Object.entries(screen.nodes).map(([nodeId, node]) => {
                if (!selectedNodeIdsOnCurrentScreen.includes(nodeId)) {
                  return [nodeId, node];
                }

                return [
                  nodeId,
                  {
                    ...node,
                    visible: patch.visible ?? node.visible,
                    locked: patch.locked ?? node.locked,
                    constraints:
                      patch.constraints && node.kind === "component"
                        ? {
                            ...node.constraints,
                            ...patch.constraints,
                          }
                        : node.constraints,
                    transform: patch.transform
                      ? {
                          ...node.transform,
                          ...patch.transform,
                        }
                      : node.transform,
                  },
                ];
              }),
            ) as typeof screen.nodes,
          };
        }),
      }));
    },
    [selectedNodeIdsOnCurrentScreen, selectedScreenIndex, updateConfig],
  );

  const updateCurrentScreenDoc = useCallback(
    (updater: (screen: EditorDocument["screens"][number]) => EditorDocument["screens"][number]) => {
      updateConfig((prev) => ({
        ...prev,
        screens: prev.screens.map((screen, index) =>
          index === selectedScreenIndex ? updater(screen) : screen,
        ),
      }));
    },
    [selectedScreenIndex, updateConfig],
  );

  const updateCurrentScreenStyle = useCallback(
    (patch: Record<string, unknown>) => {
      updateCurrentScreenDoc((screen) => ({
        ...screen,
        style: {
          ...(screen.style ?? {}),
          ...patch,
        },
      }));
    },
    [updateCurrentScreenDoc],
  );

  const updateCurrentScreenTransition = useCallback(
    (transition: ScreenTransitionConfig) => {
      updateCurrentScreenDoc((screen) => ({
        ...screen,
        animation: transition as unknown as EditorDocument["screens"][number]["animation"],
      }));
    },
    [updateCurrentScreenDoc],
  );

  const updateCurrentScreenArtboard = useCallback(
    (patch: Partial<EditorDocument["screens"][number]["artboard"]>) => {
      updateCurrentScreenDoc((screen) => ({
        ...screen,
        artboard: {
          ...screen.artboard,
          ...patch,
        },
      }));
    },
    [updateCurrentScreenDoc],
  );

  const updateCurrentScreenLayoutMode = useCallback(
    (layoutMode: "auto" | "absolute") => {
      updateCurrentScreenDoc((screen) => {
        if (layoutMode === "absolute") {
          return convertScreenToAbsoluteLayout(screen);
        }

        return {
          ...screen,
          layoutMode,
        };
      });
    },
    [updateCurrentScreenDoc],
  );

  const moveSelectedNodesInZOrder = useCallback(
    (direction: "forward" | "backward" | "front" | "back") => {
      if (selectedNodeIdsOnCurrentScreen.length === 0 || !currentScreenDoc) return;

      updateConfig((prev) => {
        const screens = [...prev.screens];
        const screen = screens[selectedScreenIndex];
        if (!screen) return prev;

        const selectedSet = new Set(selectedNodeIdsOnCurrentScreen);
        let nextRootNodeIds = [...screen.rootNodeIds];

        if (direction === "front") {
          nextRootNodeIds = [
            ...nextRootNodeIds.filter((nodeId) => !selectedSet.has(nodeId)),
            ...nextRootNodeIds.filter((nodeId) => selectedSet.has(nodeId)),
          ];
        } else if (direction === "back") {
          nextRootNodeIds = [
            ...nextRootNodeIds.filter((nodeId) => selectedSet.has(nodeId)),
            ...nextRootNodeIds.filter((nodeId) => !selectedSet.has(nodeId)),
          ];
        } else if (direction === "forward") {
          for (let index = nextRootNodeIds.length - 2; index >= 0; index -= 1) {
            const currentId = nextRootNodeIds[index]!;
            const nextId = nextRootNodeIds[index + 1]!;
            if (selectedSet.has(currentId) && !selectedSet.has(nextId)) {
              nextRootNodeIds[index] = nextId;
              nextRootNodeIds[index + 1] = currentId;
            }
          }
        } else {
          for (let index = 1; index < nextRootNodeIds.length; index += 1) {
            const currentId = nextRootNodeIds[index]!;
            const previousId = nextRootNodeIds[index - 1]!;
            if (selectedSet.has(currentId) && !selectedSet.has(previousId)) {
              nextRootNodeIds[index] = previousId;
              nextRootNodeIds[index - 1] = currentId;
            }
          }
        }

        screens[selectedScreenIndex] = {
          ...screen,
          rootNodeIds: nextRootNodeIds,
          nodes: Object.fromEntries(
            Object.entries(screen.nodes).map(([nodeId, node]) => [
              nodeId,
              nextRootNodeIds.includes(nodeId)
                ? {
                    ...node,
                    transform: {
                      ...node.transform,
                      zIndex: nextRootNodeIds.indexOf(nodeId),
                    },
                  }
                : node,
            ]),
          ) as typeof screen.nodes,
        };

        return { ...prev, screens };
      });
    },
    [currentScreenDoc, selectedNodeIdsOnCurrentScreen, selectedScreenIndex, updateConfig],
  );

  const deleteComponent = useCallback(
    (componentId: string) => {
      updateConfig((prev) => {
        const screens = [...prev.screens];
        const screen = screens[selectedScreenIndex];
        if (!screen) return prev;
        screens[selectedScreenIndex] = removeNodeFromScreen(screen, componentId);
        return { ...prev, screens };
      });
      closeSheet();
    },
    [selectedScreenIndex, updateConfig, closeSheet],
  );

  const updateComponentProp = useCallback(
    (componentId: string, key: string, value: unknown) => {
      updateConfig((prev) => {
        return {
          ...prev,
          screens: prev.screens.map((screen, index) => {
            if (index !== selectedScreenIndex) return screen;
            const node = screen.nodes[componentId];
            if (!node || node.kind !== "component") return screen;

            return {
              ...screen,
              nodes: {
                ...screen.nodes,
                [componentId]: {
                  ...node,
                  name:
                    key === "label" || key === "content" || key === "text"
                      ? String(value || node.name)
                      : node.name,
                  component: {
                    ...node.component,
                    props: key.includes(".")
                      ? setValueAtPath(node.component.props, key, value)
                      : { ...node.component.props, [key]: value },
                  } as FlowComponent,
                },
              },
            };
          }),
        };
      });
    },
    [selectedScreenIndex, updateConfig],
  );

  const convertSelectedComponentType = useCallback(
    (componentId: string, nextType: OneClickInteractiveType) => {
      updateConfig((prev) => {
        return {
          ...prev,
          screens: prev.screens.map((screen, index) => {
            if (index !== selectedScreenIndex) return screen;
            const node = screen.nodes[componentId];
            if (!node || node.kind !== "component") return screen;

            const nextComponent = buildOneClickInteractiveComponent(node.component, nextType);
            const suggestedSize =
              ONE_CLICK_INTERACTIVE_SIZES[nextType] ?? getComponentCanvasSize(nextComponent);

            return {
              ...screen,
              nodes: {
                ...screen.nodes,
                [componentId]: {
                  ...node,
                  name: getComponentDisplayName(nextComponent, node.name),
                  transform: {
                    ...node.transform,
                    width:
                      node.transform.width == null
                        ? suggestedSize.width
                        : Math.max(node.transform.width, suggestedSize.width),
                    height:
                      node.transform.height == null
                        ? suggestedSize.height
                        : Math.max(node.transform.height, suggestedSize.height),
                  },
                  component: nextComponent,
                },
              },
            };
          }),
        };
      });
    },
    [selectedScreenIndex, updateConfig],
  );

  const insertComponent = useCallback(
    (
      type: string,
      options?: {
        screenIndex?: number;
        x?: number;
        y?: number;
        interaction?: "sidebar" | "direct";
        override?: (component: FlowComponent) => void;
      },
    ) => {
      const targetScreenIndex = options?.screenIndex ?? selectedScreenIndex;
      const targetScreen = document.screens[targetScreenIndex];
      if (!targetScreen) return null;

      if (type === "TAB_BUTTON" && options?.interaction !== "direct") {
        setTabSidebarOpen(true);
        return null;
      }

      const targetScreenForPlacement =
        targetScreen.layoutMode === "absolute"
          ? targetScreen
          : convertScreenToAbsoluteLayout(targetScreen);
      const component = createDefaultComponent(type, targetScreen.rootNodeIds.length);
      options?.override?.(component);

      if (targetScreenForPlacement.layoutMode === "absolute") {
        const size = getComponentCanvasSize(component);
        const nextX = Math.max(
          0,
          Math.min(
            Math.round((options?.x ?? targetScreenForPlacement.artboard.width / 2) - size.width / 2),
            targetScreenForPlacement.artboard.width - size.width,
          ),
        );
        const nextY = Math.max(
          0,
          Math.min(
            Math.round((options?.y ?? targetScreenForPlacement.artboard.height / 2) - size.height / 2),
            targetScreenForPlacement.artboard.height - size.height,
          ),
        );

        component.layout = {
          ...component.layout,
          position: "absolute",
          x: nextX,
          y: nextY,
          width: size.width,
          height: size.height,
          rotation: component.layout?.rotation ?? 0,
          zIndex: targetScreen.rootNodeIds.length,
          visible: component.layout?.visible ?? true,
          locked: component.layout?.locked ?? false,
        };
      } else if (component.layout) {
        component.layout = {
          ...component.layout,
          position: "flow",
          x: undefined,
          y: undefined,
          rotation: undefined,
          zIndex: undefined,
          width: undefined,
          height: undefined,
        };
      }

      updateConfig((prev) => {
        const screens = [...prev.screens];
        const screen = screens[targetScreenIndex];
        if (!screen) return prev;
        const nextScreen =
          screen.layoutMode === "absolute"
            ? screen
            : convertScreenToAbsoluteLayout(screen);
        screens[targetScreenIndex] = appendComponentNode(nextScreen, component);
        return { ...prev, screens };
      });

      setSelectedScreenIndex(targetScreenIndex);
      selectNodes([component.id], component.id);
      setInlineTextEdit(null);
      setQuickInsertState(null);
      setSheetOpen(true);
      setActiveTab("layers");
      return component.id;
    },
    [document.screens, selectedScreenIndex, selectNodes, updateConfig],
  );

  const copyNodesToClipboard = useCallback(
    (nodeIds: string[]) => {
      if (!currentScreenDoc || nodeIds.length === 0) return;

      const items = nodeIds
        .map((nodeId) => getComponentNode(currentScreenDoc, nodeId))
        .filter((node): node is EditorComponentNode => Boolean(node))
        .map((node) => ({
          component: structuredClone(node.component),
          transform: structuredClone(node.transform),
        }));

      if (items.length === 0) return;
      setBuilderClipboard({
        items,
        pasteCount: 0,
      });
    },
    [currentScreenDoc],
  );

  const pasteClipboardToScreen = useCallback(
    (screenIndex: number) => {
      const targetScreen = document.screens[screenIndex];
      if (!builderClipboard || !targetScreen) return;

      const nextOffset = (builderClipboard.pasteCount + 1) * 16;
      const nextIds: string[] = [];

      updateConfig((prev) => {
        const screens = [...prev.screens];
        const screen = screens[screenIndex];
        if (!screen) return prev;

        let nextScreen =
          screen.layoutMode === "absolute"
            ? screen
            : convertScreenToAbsoluteLayout(screen);
        builderClipboard.items.forEach((item, index) => {
          const nextComponent = structuredClone(item.component);
          nextComponent.id = `comp_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`;
          nextComponent.order = nextScreen.rootNodeIds.length;

          if (nextScreen.layoutMode === "absolute") {
            nextComponent.layout = {
              ...nextComponent.layout,
              position: "absolute",
              x: Math.max(0, item.transform.x + nextOffset),
              y: Math.max(0, item.transform.y + nextOffset),
              width: item.transform.width ?? getComponentCanvasSize(nextComponent).width,
              height: item.transform.height ?? getComponentCanvasSize(nextComponent).height,
              rotation: item.transform.rotation,
              zIndex: nextScreen.rootNodeIds.length,
              visible: item.transform ? nextComponent.layout?.visible ?? true : true,
              locked: nextComponent.layout?.locked ?? false,
            };
          }

          nextScreen = appendComponentNode(nextScreen, nextComponent);
          nextIds.push(nextComponent.id);
        });

        screens[screenIndex] = nextScreen;
        return { ...prev, screens };
      });

      setBuilderClipboard((current) =>
        current
          ? {
              ...current,
              pasteCount: current.pasteCount + 1,
            }
          : current,
      );
      setSelectedScreenIndex(screenIndex);
      if (nextIds.length > 0) {
        selectNodes(nextIds, nextIds[nextIds.length - 1] ?? null);
        setSheetOpen(true);
      }
    },
    [builderClipboard, document.screens, selectNodes, updateConfig],
  );

  const duplicateSelectedNodes = useCallback(() => {
    if (!currentScreenDoc || selectedNodeIdsOnCurrentScreen.length === 0) return;

    const items = selectedNodeIdsOnCurrentScreen
      .map((nodeId) => getComponentNode(currentScreenDoc, nodeId))
      .filter((node): node is EditorComponentNode => Boolean(node))
      .map((node) => ({
        component: structuredClone(node.component),
        transform: structuredClone(node.transform),
      }));

    if (items.length === 0) return;

    const nextIds: string[] = [];

    updateConfig((prev) => {
      const screens = [...prev.screens];
      const screen = screens[selectedScreenIndex];
      if (!screen) return prev;

      let nextScreen =
        screen.layoutMode === "absolute"
          ? screen
          : convertScreenToAbsoluteLayout(screen);
      items.forEach((item, index) => {
        const nextComponent = structuredClone(item.component);
        nextComponent.id = `comp_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`;
        nextComponent.order = nextScreen.rootNodeIds.length;

        if (nextScreen.layoutMode === "absolute") {
          nextComponent.layout = {
            ...nextComponent.layout,
            position: "absolute",
            x: Math.max(0, item.transform.x + 16),
            y: Math.max(0, item.transform.y + 16),
            width: item.transform.width ?? getComponentCanvasSize(nextComponent).width,
            height: item.transform.height ?? getComponentCanvasSize(nextComponent).height,
            rotation: item.transform.rotation,
            zIndex: nextScreen.rootNodeIds.length,
          };
        }

        nextScreen = appendComponentNode(nextScreen, nextComponent);
        nextIds.push(nextComponent.id);
      });

      screens[selectedScreenIndex] = nextScreen;
      return { ...prev, screens };
    });

    if (nextIds.length > 0) {
      selectNodes(nextIds, nextIds[nextIds.length - 1] ?? null);
      setSheetOpen(true);
    }
  }, [
    currentScreenDoc,
    selectedNodeIdsOnCurrentScreen,
    selectedScreenIndex,
    selectNodes,
    updateConfig,
  ]);

  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodeIdsOnCurrentScreen.length === 0) return;

    updateConfig((prev) => {
      const screens = [...prev.screens];
      let nextScreen = screens[selectedScreenIndex];
      if (!nextScreen) return prev;

      selectedNodeIdsOnCurrentScreen.forEach((nodeId) => {
        nextScreen = removeNodeFromScreen(nextScreen, nodeId);
      });

      screens[selectedScreenIndex] = nextScreen;
      return { ...prev, screens };
    });

    clearSelection();
    setSheetOpen(false);
  }, [clearSelection, selectedNodeIdsOnCurrentScreen, selectedScreenIndex, updateConfig]);

  const updateSelectedComponentProps = useCallback(
    (key: string, value: unknown) => {
      if (selectedComponentNodes.length === 0) return;
      selectedComponentNodes.forEach((node) => {
        updateComponentProp(node.id, key, value);
      });
    },
    [selectedComponentNodes, updateComponentProp],
  );

  const alignSelectedNodes = useCallback(
    (mode: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      if (selectedComponentNodes.length < 2) return;

      const bounds = {
        left: Math.min(...selectedComponentNodes.map((node) => node.transform.x)),
        top: Math.min(...selectedComponentNodes.map((node) => node.transform.y)),
        right: Math.max(
          ...selectedComponentNodes.map(
            (node) => node.transform.x + (node.transform.width ?? getComponentCanvasSize(node.component).width),
          ),
        ),
        bottom: Math.max(
          ...selectedComponentNodes.map(
            (node) => node.transform.y + (node.transform.height ?? getComponentCanvasSize(node.component).height),
          ),
        ),
      };

      const updates = Object.fromEntries(
        selectedComponentNodes.map((node) => {
          const width = node.transform.width ?? getComponentCanvasSize(node.component).width;
          const height = node.transform.height ?? getComponentCanvasSize(node.component).height;

          if (mode === "left") return [node.id, { x: bounds.left }];
          if (mode === "center") {
            return [node.id, { x: Math.round(bounds.left + (bounds.right - bounds.left - width) / 2) }];
          }
          if (mode === "right") return [node.id, { x: Math.round(bounds.right - width) }];
          if (mode === "top") return [node.id, { y: bounds.top }];
          if (mode === "middle") {
            return [node.id, { y: Math.round(bounds.top + (bounds.bottom - bounds.top - height) / 2) }];
          }
          return [node.id, { y: Math.round(bounds.bottom - height) }];
        }),
      );

      commitNodeTransforms(selectedScreenIndex, updates);
    },
    [commitNodeTransforms, selectedComponentNodes, selectedScreenIndex],
  );

  const distributeSelectedNodes = useCallback(
    (axis: "horizontal" | "vertical") => {
      if (selectedComponentNodes.length < 3) return;

      const sortedNodes = [...selectedComponentNodes].sort((left, right) =>
        axis === "horizontal"
          ? left.transform.x - right.transform.x
          : left.transform.y - right.transform.y,
      );

      const first = sortedNodes[0];
      const last = sortedNodes[sortedNodes.length - 1];
      if (!first || !last) return;

      const firstStart = axis === "horizontal" ? first.transform.x : first.transform.y;
      const lastStart = axis === "horizontal" ? last.transform.x : last.transform.y;
      const gap = (lastStart - firstStart) / (sortedNodes.length - 1);

      const updates = Object.fromEntries(
        sortedNodes.map((node, index) => [
          node.id,
          axis === "horizontal"
            ? { x: Math.round(firstStart + gap * index) }
            : { y: Math.round(firstStart + gap * index) },
        ]),
      );

      commitNodeTransforms(selectedScreenIndex, updates);
    },
    [commitNodeTransforms, selectedComponentNodes, selectedScreenIndex],
  );

  const matchSelectedNodes = useCallback(
    (dimension: "width" | "height") => {
      if (selectedComponentNodes.length < 2) return;
      const [referenceNode] = selectedComponentNodes;
      if (!referenceNode) return;

      const value =
        dimension === "width"
          ? referenceNode.transform.width ?? getComponentCanvasSize(referenceNode.component).width
          : referenceNode.transform.height ?? getComponentCanvasSize(referenceNode.component).height;

      const updates = Object.fromEntries(
        selectedComponentNodes.map((node) => [
          node.id,
          dimension === "width" ? { width: value } : { height: value },
        ]),
      );

      commitNodeTransforms(selectedScreenIndex, updates);
    },
    [commitNodeTransforms, selectedComponentNodes, selectedScreenIndex],
  );

  const addComponent = useCallback(
    (type: string) => {
      insertComponent(type, { interaction: "sidebar" });
    },
    [insertComponent],
  );

  const selectAllNodes = useCallback(() => {
    if (!currentScreenDoc) return;
    const nodeIds = Object.values(currentScreenDoc.nodes)
      .filter((node): node is EditorComponentNode => node.kind === "component")
      .map((node) => node.id);

    if (nodeIds.length === 0) return;
    selectNodes(nodeIds, nodeIds[nodeIds.length - 1] ?? null);
    setSheetOpen(true);
  }, [currentScreenDoc, selectNodes]);

  const nudgeSelectedNodes = useCallback(
    (direction: "left" | "right" | "up" | "down", amount: number) => {
      if (!currentScreenDoc || currentScreenDoc.layoutMode !== "absolute") return;
      if (selectedComponentNodes.length === 0) return;

      const deltaX = direction === "left" ? -amount : direction === "right" ? amount : 0;
      const deltaY = direction === "up" ? -amount : direction === "down" ? amount : 0;
      const updates = Object.fromEntries(
        selectedComponentNodes.map((node) => [
          node.id,
          {
            x: node.transform.x + deltaX,
            y: node.transform.y + deltaY,
          },
        ]),
      );

      commitNodeTransforms(selectedScreenIndex, updates);
    },
    [commitNodeTransforms, currentScreenDoc, selectedComponentNodes, selectedScreenIndex],
  );


 const handleTabPresetSelect = useCallback(
   (preset: import("./tab-style-sidebar").TabPreset) => {
      updateConfig((prev) => {
        const screens = [...prev.screens];
        const screen = screens[selectedScreenIndex];
        if (!screen) return prev;
        const nextScreen =
          screen.layoutMode === "absolute"
            ? screen
            : convertScreenToAbsoluteLayout(screen);
        const comp = {
          id: `comp_${Date.now()}`,
          type: "TAB_BUTTON" as const,
          order: nextScreen.rootNodeIds.length,
          props: presetToTabComponentProps(preset),
        } as FlowComponent;
        const size = getComponentCanvasSize(comp);
        comp.layout = {
          ...comp.layout,
          position: "absolute",
          x: Math.max(0, Math.round((nextScreen.artboard.width - size.width) / 2)),
          y: Math.max(0, Math.round((nextScreen.artboard.height - size.height) / 2)),
          width: size.width,
          height: size.height,
          rotation: comp.layout?.rotation ?? 0,
          zIndex: nextScreen.rootNodeIds.length,
          visible: comp.layout?.visible ?? true,
          locked: comp.layout?.locked ?? false,
        };
        screens[selectedScreenIndex] = appendComponentNode(nextScreen, comp);
        return { ...prev, screens };
      });
      setActiveTab("layers");
      setTabSidebarOpen(false);
    },
    [selectedScreenIndex, updateConfig],
  );

  const componentActions: ComponentActions = useMemo(
    () => ({
      hasCopied: builderClipboard !== null,
      hasCopiedStyles: copiedStyles !== null,

      onRename: (componentId: string) => {
        const comp = currentScreenDoc ? getComponentNode(currentScreenDoc, componentId)?.component : null;
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
          const screen = screens[selectedScreenIndex];
          if (!screen) return prev;
          screens[selectedScreenIndex] = duplicateNodeInScreen(screen, componentId);
          return { ...prev, screens };
        });
      },

      onCopy: (componentId: string) => {
        copyNodesToClipboard([componentId]);
      },

      onPaste: (screenIndex: number) => {
        pasteClipboardToScreen(screenIndex);
      },

      onCopyStyles: (componentId: string) => {
        const comp = currentScreenDoc ? getComponentNode(currentScreenDoc, componentId)?.component : null;
        if (comp) setCopiedStyles(structuredClone(comp.props) as Record<string, unknown>);
      },

      onPasteStyles: (componentId: string) => {
        if (!copiedStyles) return;
        updateConfig((prev) => {
          return {
            ...prev,
            screens: prev.screens.map((screen, index) => {
              if (index !== selectedScreenIndex) return screen;
              const node = screen.nodes[componentId];
              if (!node || node.kind !== "component") return screen;

              return {
                ...screen,
                nodes: {
                  ...screen.nodes,
                  [componentId]: {
                    ...node,
                    component: {
                      ...node.component,
                      props: { ...node.component.props, ...copiedStyles },
                    } as FlowComponent,
                  },
                },
              };
            }),
          };
        });
      },

      onDelete: (componentId: string) => {
        deleteComponent(componentId);
      },
    }),
    [
      builderClipboard,
      copiedStyles,
      copyNodesToClipboard,
      currentScreenDoc,
      pasteClipboardToScreen,
      selectedScreenIndex,
      updateConfig,
      updateComponentProp,
      deleteComponent,
    ],
  );

  const addScreen = useCallback(() => {
    const order = document.screens.length;
    updateConfig((prev) => ({
      ...prev,
      screens: [
        ...prev.screens,
        flowConfigToEditorDocument({
          screens: [
            {
              id: `screen_${Date.now()}`,
              name: `Screen ${order + 1}`,
              order,
              layoutMode: "absolute",
              style: { backgroundColor: "#FFFFFF", padding: 24 },
              components: [],
            },
          ],
        }).screens[0]!,
      ],
    }));
    setSelectedScreenIndex(document.screens.length);
    clearSelection();
  }, [clearSelection, document.screens.length, updateConfig]);

  const deleteScreen = useCallback(
    (index: number) => {
      if (config.screens.length <= 1) return;
      updateConfig((prev) => ({
        ...prev,
        screens: prev.screens.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })),
      }));
      setSelectedScreenIndex((prev) => Math.max(0, prev - 1));
      clearSelection();
    },
    [clearSelection, config.screens.length, updateConfig],
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
        const screen = screens[screenIndex];
        if (!screen) return prev;
        const reorderedNodeIds = arrayMove(screen.rootNodeIds, fromIndex, toIndex);
        screens[screenIndex] = {
          ...screen,
          rootNodeIds: reorderedNodeIds,
          nodes: Object.fromEntries(
            Object.entries(screen.nodes).map(([nodeId, node]) => [
              nodeId,
              reorderedNodeIds.includes(nodeId)
                ? {
                    ...node,
                    transform: {
                      ...node.transform,
                      zIndex: reorderedNodeIds.indexOf(nodeId),
                    },
                  }
                : node,
            ]),
          ) as typeof screen.nodes,
        };
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
      screen.order = document.screens.length;
      const editorScreen = flowConfigToEditorDocument({
        screens: [screen],
      }).screens[0]!;

      updateConfig((prev) => ({
        ...prev,
        screens: [...prev.screens, editorScreen],
      }));
      setSelectedScreenIndex(document.screens.length);
      clearSelection();
      setActiveTab("insert");
    },
    [clearSelection, document.screens.length, updateConfig],
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
          order: document.screens.length + i,
        }));

      if (newScreens.length === 0) return;

      const editorScreens = flowConfigToEditorDocument({
        screens: newScreens,
      }).screens;

      updateConfig((prev) => ({
        ...prev,
        screens: [...prev.screens, ...editorScreens],
      }));
      setSelectedScreenIndex(document.screens.length);
      clearSelection();
    },
    [clearSelection, document.screens.length, updateConfig],
  );

  const handleImportScreen = useCallback(
    ({ screens: importedScreens, mode }: { screens: FlowConfig["screens"]; mode: ImportMode }) => {
      if (importedScreens.length === 0) return;

      const result = applyImportedScreensToDocument({
        document: history.state,
        importedScreens,
        mode,
        screenIndex: selectedScreenIndex,
      });

      history.set(result.document);
      setSelectedScreenIndex(result.selectedScreenIndex);

      clearSelection();
      setActiveTab("screens");
    },
    [clearSelection, history, selectedScreenIndex],
  );

  const handlePaletteDrop = useCallback(
    (event: DragEndEvent) => {
      const overData = event.over?.data.current as
        | {
            dropType?: string;
            screenIndex?: number;
            layoutMode?: "auto" | "absolute";
            artboard?: { width: number; height: number };
          }
        | undefined;
      const activeData = event.active.data.current as
        | {
            source?: string;
            componentType?: string;
          }
        | undefined;

      if (
        activeData?.source !== "palette" ||
        overData?.dropType !== "artboard" ||
        typeof overData.screenIndex !== "number" ||
        !activeData.componentType
      ) {
        return;
      }

      if (overData.layoutMode === "absolute" && event.over?.rect) {
        const dragRect = event.active.rect.current.translated ?? event.active.rect.current.initial;
        const centerX =
          dragRect?.left !== undefined && dragRect?.width !== undefined
            ? dragRect.left + dragRect.width / 2
            : event.over.rect.left + event.over.rect.width / 2;
        const centerY =
          dragRect?.top !== undefined && dragRect?.height !== undefined
            ? dragRect.top + dragRect.height / 2
            : event.over.rect.top + event.over.rect.height / 2;
        const xRatio = (centerX - event.over.rect.left) / Math.max(event.over.rect.width, 1);
        const yRatio = (centerY - event.over.rect.top) / Math.max(event.over.rect.height, 1);
        const artboard = overData.artboard ?? document.screens[overData.screenIndex]?.artboard;

        if (artboard) {
          insertComponent(activeData.componentType, {
            screenIndex: overData.screenIndex,
            interaction: "direct",
            x: Math.max(0, Math.min(artboard.width, Math.round(xRatio * artboard.width))),
            y: Math.max(0, Math.min(artboard.height, Math.round(yRatio * artboard.height))),
          });
          return;
        }
      }

      insertComponent(activeData.componentType, {
        screenIndex: overData.screenIndex,
        interaction: "direct",
      });
    },
    [document.screens, insertComponent],
  );

  const openQuickInsert = useCallback(
    (screenIndex: number, point: { x: number; y: number }) => {
      setSelectedScreenIndex(screenIndex);
      setQuickInsertState({
        screenIndex,
        x: point.x,
        y: point.y,
      });
      setInlineTextEdit(null);
    },
    [],
  );

  const beginInlineTextEdit = useCallback(
    (screenIndex: number, nodeId: string) => {
      setSelectedScreenIndex(screenIndex);
      selectNodes([nodeId], nodeId);
      setInlineTextEdit({
        screenIndex,
        nodeId,
      });
      setQuickInsertState(null);
      setSheetOpen(true);
    },
    [selectNodes],
  );

  const createFromTool = useCallback(
    (
      screenIndex: number,
      point: { x: number; y: number },
      tool: "text" | "frame" | "rectangle",
    ) => {
      if (tool === "text") {
        const nodeId = insertComponent("TEXT", {
          screenIndex,
          x: point.x,
          y: point.y,
          interaction: "direct",
        });
        if (nodeId) {
          beginInlineTextEdit(screenIndex, nodeId);
        }
        return;
      }

      insertComponent("STACK", {
        screenIndex,
        x: point.x,
        y: point.y,
        interaction: "direct",
        override: (component) => {
          component.props = {
            ...component.props,
            padding: tool === "frame" ? 16 : 0,
            backgroundColor: tool === "frame" ? "#F8FAFC" : "#E2E8F0",
            borderRadius: tool === "frame" ? 24 : 14,
            gap: 12,
          };
          component.layout = {
            ...component.layout,
            width: tool === "frame" ? 220 : 160,
            height: tool === "frame" ? 160 : 120,
          };
        },
      });
    },
    [beginInlineTextEdit, insertComponent],
  );

  /* ─── Per-screen content renderer ──── */
  const renderScreenContent = (screen: typeof config.screens[number], screenIdx: number) => {
      const screenDoc = document.screens[screenIdx];
      const sorted = screen?.components.length
        ? [...screen.components].sort((a, b) => a.order - b.order)
        : [];

      const bottomComponents = sorted.filter((component) => {
        const props = component.props as PositionedComponentProps;
        return props.position === "bottom";
      });

      const bgColor = screen?.style?.backgroundColor || "#FFFFFF";
      const padding = screen?.style?.padding ?? 24;
      const totalScreens = config.screens.length;
      const progress = totalScreens > 1 ? ((screenIdx + 1) / totalScreens) * 100 : 100;
      const dark = isDarkColor(bgColor);

      // Merge global + per-screen indicator settings
      const settingsWithIndicator = document.settings as IndicatorAwareDocumentSettings | undefined;
      const screenWithIndicator = screenDoc as IndicatorAwareDocumentScreen | undefined;
      const indicator = mergeIndicator(
        settingsWithIndicator?.indicator,
        screenWithIndicator?.indicator,
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
            className="flex-1"
            style={{
              padding: screen.layoutMode === "absolute" ? 0 : padding,
              overflowY: screen.layoutMode === "absolute" ? "hidden" : "auto",
            }}
          >
            {sorted.length === 0 ? (
              <ScreenDropSurface
                dropId={`artboard:${screenIdx}`}
                screenIndex={screenIdx}
                layoutMode={screenDoc?.layoutMode ?? "auto"}
                artboard={screenDoc?.artboard ?? { width: frame.viewportWidth, height: frame.viewportHeight }}
                className="relative h-full"
                onPointerDownEmpty={(event) => {
                  if (effectiveTool === "select" || effectiveTool === "hand") return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * (screenDoc?.artboard.width ?? rect.width);
                  const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * (screenDoc?.artboard.height ?? rect.height);
                  createFromTool(screenIdx, { x, y }, effectiveTool);
                }}
                onDoubleClickEmpty={(event) => {
                  if (effectiveTool !== "select") return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * (screenDoc?.artboard.width ?? rect.width);
                  const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * (screenDoc?.artboard.height ?? rect.height);
                  openQuickInsert(screenIdx, { x, y });
                }}
              >
                <div
                  data-screen-empty-state="true"
                  className="h-full flex flex-col items-center justify-center text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                    <Smartphone size={20} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">No components yet</p>
                  <p className="text-xs text-gray-300 mt-1">Double-click or drag a block here</p>
                </div>
                {quickInsertState?.screenIndex === screenIdx ? (
                  <QuickInsertPalette
                    open
                    x={quickInsertState.x}
                    y={quickInsertState.y}
                    onClose={() => setQuickInsertState(null)}
                    onInsert={(type) => {
                      insertComponent(type, {
                        screenIndex: screenIdx,
                        interaction: "direct",
                        x: quickInsertState.x,
                        y: quickInsertState.y,
                      });
                    }}
                  />
                ) : null}
              </ScreenDropSurface>
            ) : screen.layoutMode === "absolute" ? (
              <div className="relative h-full w-full overflow-hidden">
                <div className="absolute" style={{ inset: padding }}>
                  <ScreenDropSurface
                    dropId={`artboard:${screenIdx}`}
                    screenIndex={screenIdx}
                    layoutMode={screenDoc?.layoutMode ?? "absolute"}
                    artboard={screenDoc?.artboard ?? { width: frame.viewportWidth, height: frame.viewportHeight }}
                    className="relative h-full w-full overflow-hidden rounded-[24px] border border-black/5"
                    style={{
                      backgroundColor: bgColor,
                    }}
                    onDoubleClickEmpty={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * (screenDoc?.artboard.width ?? rect.width);
                      const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * (screenDoc?.artboard.height ?? rect.height);
                      openQuickInsert(screenIdx, { x, y });
                    }}
                  >
                    {screenDoc.rootNodeIds.map((nodeId) => (
                      <NodeRenderer
                        key={nodeId}
                        screen={screenDoc}
                        screenIndex={screenIdx}
                        nodeId={nodeId}
                        selectedComponentId={selectedComponentId}
                        onSelectComponent={(id) => {
                          if (id) selectComponent(screenIdx, id);
                        }}
                        previewTransforms={previewTransforms}
                        registerNode={(id, el) => {
                          absoluteNodeRefs.current[getAbsoluteNodeRefKey(screenIdx, id)] = el;
                        }}
                        inlineTextEdit={inlineTextEdit}
                        setInlineTextEdit={setInlineTextEdit}
                        beginInlineTextEdit={beginInlineTextEdit}
                        updateComponentProp={updateComponentProp}
                      />
                    ))}

                    {screenDoc ? (
                      <CanvasInteractionLayer
                        screen={screenDoc}
                        screenIndex={screenIdx}
                        isActiveScreen={screenIdx === selectedScreenIndex}
                        activeTool={effectiveTool}
                        getNodeElement={(nodeId) =>
                          absoluteNodeRefs.current[getAbsoluteNodeRefKey(screenIdx, nodeId)] ?? null
                        }
                        onSelectScreen={(index) => {
                          if (index !== selectedScreenIndex) {
                            clearSelection();
                          }
                          setSelectedScreenIndex(index);
                        }}
                        onCommitTransforms={commitNodeTransforms}
                        onActivateSelection={() => setSheetOpen(true)}
                        onOpenQuickInsert={openQuickInsert}
                        onBeginInlineTextEdit={beginInlineTextEdit}
                        onCreateFromTool={createFromTool}
                      />
                    ) : null}
                    {quickInsertState?.screenIndex === screenIdx ? (
                      <QuickInsertPalette
                        open
                        x={quickInsertState.x}
                        y={quickInsertState.y}
                        onClose={() => setQuickInsertState(null)}
                        onInsert={(type) => {
                          insertComponent(type, {
                            screenIndex: screenIdx,
                            interaction: "direct",
                            x: quickInsertState.x,
                            y: quickInsertState.y,
                          });
                        }}
                      />
                    ) : null}
                  </ScreenDropSurface>
                </div>
              </div>
            ) : (
              <ScreenDropSurface
                dropId={`artboard:${screenIdx}`}
                screenIndex={screenIdx}
                layoutMode={screenDoc?.layoutMode ?? "auto"}
                artboard={screenDoc?.artboard ?? { width: frame.viewportWidth, height: frame.viewportHeight }}
                className="relative flex min-h-full flex-col gap-3"
                onPointerDownEmpty={(event) => {
                  if (effectiveTool === "select" || effectiveTool === "hand") return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  createFromTool(
                    screenIdx,
                    {
                      x: event.clientX - rect.left,
                      y: event.clientY - rect.top,
                    },
                    effectiveTool,
                  );
                }}
                onDoubleClickEmpty={(event) => {
                  if (effectiveTool !== "select") return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  openQuickInsert(screenIdx, {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                  });
                }}
              >
                {screenDoc.rootNodeIds.map((nodeId) => (
                  <NodeRenderer
                    key={nodeId}
                    screen={screenDoc}
                    screenIndex={screenIdx}
                    nodeId={nodeId}
                    selectedComponentId={selectedComponentId}
                    onSelectComponent={(id) => {
                      if (id) selectComponent(screenIdx, id);
                    }}
                    previewTransforms={previewTransforms}
                    registerNode={(id, el) => {
                      absoluteNodeRefs.current[getAbsoluteNodeRefKey(screenIdx, id)] = el;
                    }}
                    inlineTextEdit={inlineTextEdit}
                    setInlineTextEdit={setInlineTextEdit}
                    beginInlineTextEdit={beginInlineTextEdit}
                    updateComponentProp={updateComponentProp}
                  />
                ))}
                {quickInsertState?.screenIndex === screenIdx ? (
                  <QuickInsertPalette
                    open
                    x={quickInsertState.x}
                    y={quickInsertState.y}
                    onClose={() => setQuickInsertState(null)}
                    onInsert={(type) => {
                      insertComponent(type, {
                        screenIndex: screenIdx,
                        interaction: "direct",
                      });
                    }}
                  />
                ) : null}
              </ScreenDropSurface>
            )}
          </div>

          {/* ── Bottom-pinned components ── */}
          {screen.layoutMode !== "absolute" && bottomComponents.length > 0 && (
            <div
              className="shrink-0 flex flex-col gap-2"
              style={{ padding: `12px ${padding}px ${padding}px` }}
            >
              {bottomComponents.map((comp) => (
                inlineTextEdit?.screenIndex === screenIdx &&
                inlineTextEdit.nodeId === comp.id &&
                comp.type === "TEXT" ? (
                  <InlineTextEditor
                    key={comp.id}
                    component={comp}
                    onCommit={(nextValue) => {
                      updateComponentProp(comp.id, "content", nextValue);
                      setInlineTextEdit(null);
                    }}
                    onCancel={() => setInlineTextEdit(null)}
                  />
                ) : (
                  <PhonePreviewComponent
                    key={comp.id}
                    component={comp}
                    isSelected={screenIdx === selectedScreenIndex && comp.id === selectedComponentId}
                    onSelect={() => {
                      selectComponent(screenIdx, comp.id);
                    }}
                    onDoubleClick={() => {
                      if (comp.type === "TEXT") {
                        beginInlineTextEdit(screenIdx, comp.id);
                      }
                    }}
                  />
                )
              ))}
            </div>
          )}
        </div>
      );
  };

  /* ─── Canvas layout constants ──── */
  const SCREEN_GAP = 80;
  const totalCanvasWidth =
    config.screens.length * frame.frameWidth +
    (config.screens.length - 1) * SCREEN_GAP;
  const canvasStartX = -totalCanvasWidth / 2;

  const zoomToActual = useCallback(() => {
    setCanvasView({ zoom: 1 });
  }, [setCanvasView]);

  const zoomToFit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const padding = 220;
    const nextZoom = Math.min(
      Math.max(
        Math.min(
          (canvas.clientWidth - padding) / Math.max(totalCanvasWidth, 1),
          (canvas.clientHeight - padding) / Math.max(frame.frameHeight, 1),
        ),
        0.4,
      ),
      1,
    );

    setCanvasView({
      zoom: nextZoom,
      panOffset: { x: 0, y: 0 },
    });
  }, [canvasRef, frame.frameHeight, setCanvasView, totalCanvasWidth]);

  useKeyboardShortcuts({
    onUndo: history.undo,
    onRedo: history.redo,
    onSave: handleSaveDraft,
    onCopy: () => copyNodesToClipboard(selectedNodeIdsOnCurrentScreen),
    onPaste: () => pasteClipboardToScreen(selectedScreenIndex),
    onSelectAll: selectAllNodes,
    onDuplicate: () => {
      if (selectedNodeIdsOnCurrentScreen.length > 0) {
        duplicateSelectedNodes();
      }
    },
    onDelete: () => {
      if (selectedNodeIdsOnCurrentScreen.length > 0) {
        deleteSelectedNodes();
      }
    },
    onNudge: nudgeSelectedNodes,
    onBringForward: () => moveSelectedNodesInZOrder("forward"),
    onSendBackward: () => moveSelectedNodesInZOrder("backward"),
    onBringToFront: () => moveSelectedNodesInZOrder("front"),
    onSendToBack: () => moveSelectedNodesInZOrder("back"),
    onZoomToFit: zoomToFit,
    onZoomToActual: zoomToActual,
    onSetToolMode: setToolMode,
  });

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
        const p = comp.props as ButtonActionProps;
        if (p.action === "NEXT_SCREEN" && p.actionTarget === "previous") {
          const toIdx = fromIdx - 1;
          if (toIdx >= 0) {
            connections.push({
              fromScreenIndex: fromIdx,
              toScreenIndex: toIdx,
              label: p.label || "Button",
              source: "button",
            });
          }
          return;
        }
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
    <DndContext sensors={sensors} onDragEnd={handlePaletteDrop}>
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
                  clearSelection();
                  setSheetOpen(true);
                }}
                selectedComponentId={selectedComponentId}
                onSelectComponent={(id) => {
                  if (!id) {
                    clearSelection();
                    return;
                  }
                  selectNodes([id], id);
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
            {activeTab === "insert" && <ComponentPalette onAdd={addComponent} />}
            {activeTab === "layers" && (
              <LayersPanel
                screen={currentScreenDoc || null}
                selectedNodeIds={selectedNodeIdsOnCurrentScreen}
                focusedNodeId={selectedComponentId}
                onSelectNode={(nodeId, additive) => {
                  if (additive) {
                    const nextSelection = selectedNodeIdsOnCurrentScreen.includes(nodeId)
                      ? selectedNodeIdsOnCurrentScreen.filter((currentId) => currentId !== nodeId)
                      : [...selectedNodeIdsOnCurrentScreen, nodeId];
                    selectNodes(nextSelection, nodeId);
                  } else {
                    selectNodes([nodeId], nodeId);
                  }
                  setSheetOpen(true);
                }}
                onToggleVisibility={(nodeId) => {
                  const node = currentScreenDoc?.nodes[nodeId];
                  if (!node) return;
                  updateNodePresentation(nodeId, { visible: !node.visible });
                }}
                onToggleLock={(nodeId) => {
                  const node = currentScreenDoc?.nodes[nodeId];
                  if (!node) return;
                  updateNodePresentation(nodeId, { locked: !node.locked });
                }}
                onBringForward={() => moveSelectedNodesInZOrder("forward")}
                onSendBackward={() => moveSelectedNodesInZOrder("backward")}
                onBringToFront={() => moveSelectedNodesInZOrder("front")}
                onSendToBack={() => moveSelectedNodesInZOrder("back")}
              />
            )}
            {activeTab === "templates" && (
              <div className="relative h-full">
                <QuickFlowTemplates onBuildFlow={handleBuildQuickFlow} />
                <div className="border-t border-white/[0.06] my-4" />
                <TemplatePalette onSelectTemplate={handleUseTemplate} />
              </div>
            )}
            {activeTab === "settings" && (
              <div className="space-y-4">
                <ScreenLogicPanel
                  currentScreen={currentScreen}
                  allScreens={config.screens}
                  screenRegistryKeys={screenRegistryKeys}
                  onEditImportedSource={() => {
                    if (currentImportedFigmaPayload) {
                      void navigateToImportRoute(
                        `/flow/${flowId}/import/figma?screenIndex=${selectedScreenIndex}`,
                      );
                      return;
                    }
                    setCodeImportOpen(true);
                  }}
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
                  onUpdateCustomScreen={(patch) => {
                    updateConfig((prev) => {
                      const screens = [...prev.screens];
                      screens[selectedScreenIndex] = {
                        ...screens[selectedScreenIndex],
                        ...patch,
                      } as typeof screens[number];
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
        ref={canvasRef}
        data-canvas-bg="true"
        className="flex-1 relative overflow-hidden select-none"
        style={{
          cursor:
            isPanning || isDraggingPhone
              ? "grabbing"
              : effectiveTool === "hand"
                ? "grab"
                : effectiveTool === "select"
                  ? "default"
                  : "crosshair",
          backgroundColor: "#0a0a0a",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)",
          backgroundSize: "24px 24px",
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <CanvasToolbar
          zoom={zoom}
          onBack={() =>
            router.push(`/dashboard/project/${projectId}`)
          }
          screenName={currentScreen?.name || "Untitled"}
          screenIndex={selectedScreenIndex}
          totalScreens={config.screens.length}
          selectedDevice={selectedDevice}
          orientation={orientation}
          fullScreenView={fullScreenView}
          onSelectDevice={(device) => {
            setSelectedDevice(device);
            resetView();
          }}
          onSelectOrientation={(o) => {
            setOrientation(o);
            resetView();
          }}
          onToggleFullScreen={() => setFullScreenView((p) => !p)}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
          onZoomToActual={zoomToActual}
          onZoomToFit={zoomToFit}
          onResetView={resetView}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={history.undo}
          onRedo={history.redo}
          isDirty={history.isDirty}
          saveState={saveState}
          onSaveDraft={handleSaveDraft}
          onOpenPreview={() => setPreviewOpen(true)}
          onPublish={handlePublish}
          onPromoteToProduction={handlePromoteToProduction}
          developmentVersion={developmentVersion}
          productionVersion={productionVersion}
          onImport={() => {
            void navigateToImportRoute(`/flow/${flowId}/import?screenIndex=${selectedScreenIndex}`);
          }}
          toolMode={toolMode}
          onSelectToolMode={setToolMode}
        />

        {previewOpen ? (
          <FlowPreviewOverlay
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            flowId={flowId}
            config={config}
            startScreenId={currentScreen?.id}
            device={selectedDevice}
            orientation={orientation}
          />
        ) : null}

        {codeImportOpen ? (
          <CodeImportDialog
            open={codeImportOpen}
            onOpenChange={setCodeImportOpen}
            currentScreenName={currentScreen?.name || "Untitled"}
            initialCode={currentImportedCodePayload?.sourceCode}
            initialFramework={currentImportedCodePayload?.framework ?? "auto"}
            defaultMode={currentImportedCodePayload ? "replace" : "append"}
            lockMode={Boolean(currentImportedCodePayload)}
            title={codeImportDialogTitle}
            description={codeImportDialogDescription}
            submitLabel={codeImportSubmitLabel}
            onImport={handleImportScreen}
          />
        ) : null}

        {/* World layer */}
        <div
          data-canvas-bg="true"
          className="absolute inset-0"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            transition: isPanning || isDraggingPhone ? "none" : "transform 0.08s ease-out",
          }}
        >
          <div
            data-canvas-bg="true"
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              transform: `scale(${zoom})`,
              transformOrigin: "0 0",
              transition: isPanning || isDraggingPhone ? "none" : "transform 0.15s ease-out",
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
                            selectScreen(idx);
                            clearSelection();
                            setSheetOpen(true);
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
                              selectScreen(idx);
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
                              showSystemChrome
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
        selectedNodes={selectedComponentNodes.map((node) => ({
          id: node.id,
          component: node.component,
          visible: node.visible,
          locked: node.locked,
          transform:
            (previewTransforms[node.id] && selectedComponentId === node.id
              ? previewTransforms[node.id]
              : node.transform) ?? node.transform,
          constraints: node.constraints,
        }))}
        currentScreen={currentScreenDoc || null}
        onClose={closeSheet}
        onDelete={
          selectedNodeIdsOnCurrentScreen.length > 0
            ? () =>
                selectedNodeIdsOnCurrentScreen.length > 1
                  ? deleteSelectedNodes()
                  : deleteComponent(selectedNodeIdsOnCurrentScreen[0]!)
            : undefined
        }
        onUpdateProp={
          selectedComponent ? (key, value) => updateComponentProp(selectedComponent.id, key, value) : undefined
        }
        onUpdateInteractions={
          selectedComponent
            ? (interactions) =>
                updateConfig((prev) => ({
                  ...prev,
                  screens: prev.screens.map((screen, index) => {
                    if (index !== selectedScreenIndex) return screen;
                    const node = screen.nodes[selectedComponent.id];
                    if (!node || node.kind !== "component") return screen;
                    return {
                      ...screen,
                      nodes: {
                        ...screen.nodes,
                        [selectedComponent.id]: {
                          ...node,
                          component: {
                            ...node.component,
                            interactions,
                          },
                        },
                      },
                    };
                  }),
                }))
            : undefined
        }
        onConvertComponent={
          selectedComponent
            ? (type) =>
                convertSelectedComponentType(
                  selectedComponent.id,
                  type as OneClickInteractiveType,
                )
            : undefined
        }
        onUpdateSelectionProps={updateSelectedComponentProps}
        onUpdateAnimation={
          selectedComponent
            ? (anim) =>
                updateConfig((prev) => ({
                  ...prev,
                  screens: prev.screens.map((screen, index) => {
                    if (index !== selectedScreenIndex) return screen;
                    const node = screen.nodes[selectedComponent.id];
                    if (!node || node.kind !== "component") return screen;
                    return {
                      ...screen,
                      nodes: {
                        ...screen.nodes,
                        [selectedComponent.id]: {
                          ...node,
                          component: {
                            ...node.component,
                            animation: anim,
                          },
                        },
                      },
                    };
                  }),
                }))
            : undefined
        }
        onUpdateScreenStyle={updateCurrentScreenStyle}
        onUpdateScreenLayoutMode={updateCurrentScreenLayoutMode}
        onUpdateScreenArtboard={updateCurrentScreenArtboard}
        onUpdateScreenTransition={updateCurrentScreenTransition}
        screens={config.screens}
        registryKeys={registryKeys}
        onUpdateVisualNode={
          selectedComponentId
            ? (patch) => updateNodePresentation(selectedComponentId, patch)
            : undefined
        }
        onUpdateSelectionVisualNodes={updateSelectedNodesPresentation}
        onBringForward={() => moveSelectedNodesInZOrder("forward")}
        onSendBackward={() => moveSelectedNodesInZOrder("backward")}
        onBringToFront={() => moveSelectedNodesInZOrder("front")}
        onSendToBack={() => moveSelectedNodesInZOrder("back")}
        onAlignSelection={alignSelectedNodes}
        onDistributeSelection={distributeSelectedNodes}
        onMatchSelection={matchSelectedNodes}
      />
      
      <TabStyleSidebar
        open={tabSidebarOpen}
        onClose={() => setTabSidebarOpen(false)}
        onSelect={handleTabPresetSelect}
      />
      </div>
    </DndContext>
  );
}
