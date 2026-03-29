"use client";

import { create } from "zustand";

import type { EditorNodeTransform } from "./editor-document";
import type { CanvasRect, ResizeHandle } from "./canvas-geometry";

export interface MarqueeSelection extends CanvasRect {
  screenIndex: number;
}

export interface TransformReadout {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface ActiveGuides {
  screenIndex: number | null;
  vertical: number[];
  horizontal: number[];
}

export interface ActiveTransform {
  screenIndex: number;
  mode: "move" | "resize" | "rotate";
  nodeIds: string[];
  focusNodeId: string;
  handle?: ResizeHandle;
}

interface EditorInteractionState {
  selectedNodeIds: string[];
  focusedNodeId: string | null;
  marquee: MarqueeSelection | null;
  previewTransforms: Record<string, EditorNodeTransform>;
  activeTransform: ActiveTransform | null;
  guides: ActiveGuides;
  readout: TransformReadout | null;
  selectNodes: (nodeIds: string[], focusNodeId?: string | null) => void;
  toggleNode: (nodeId: string) => void;
  clearSelection: () => void;
  setMarquee: (marquee: MarqueeSelection | null) => void;
  setPreviewTransforms: (transforms: Record<string, EditorNodeTransform>) => void;
  clearPreviewTransforms: () => void;
  startTransform: (transform: ActiveTransform) => void;
  endTransform: () => void;
  setGuides: (guides: ActiveGuides) => void;
  clearGuides: () => void;
  setReadout: (readout: TransformReadout | null) => void;
}

export const useEditorInteractionStore = create<EditorInteractionState>((set) => ({
  selectedNodeIds: [],
  focusedNodeId: null,
  marquee: null,
  previewTransforms: {},
  activeTransform: null,
  guides: {
    screenIndex: null,
    vertical: [],
    horizontal: [],
  },
  readout: null,
  selectNodes: (nodeIds, focusNodeId = nodeIds[nodeIds.length - 1] ?? null) =>
    set({
      selectedNodeIds: Array.from(new Set(nodeIds)),
      focusedNodeId: focusNodeId ?? null,
    }),
  toggleNode: (nodeId) =>
    set((state) => {
      const exists = state.selectedNodeIds.includes(nodeId);
      const nextNodeIds = exists
        ? state.selectedNodeIds.filter((currentId) => currentId !== nodeId)
        : [...state.selectedNodeIds, nodeId];

      return {
        selectedNodeIds: nextNodeIds,
        focusedNodeId: exists
          ? nextNodeIds[nextNodeIds.length - 1] ?? null
          : nodeId,
      };
    }),
  clearSelection: () =>
    set({
      selectedNodeIds: [],
      focusedNodeId: null,
    }),
  setMarquee: (marquee) => set({ marquee }),
  setPreviewTransforms: (previewTransforms) => set({ previewTransforms }),
  clearPreviewTransforms: () => set({ previewTransforms: {} }),
  startTransform: (activeTransform) => set({ activeTransform }),
  endTransform: () =>
    set({
      activeTransform: null,
      previewTransforms: {},
      guides: {
        screenIndex: null,
        vertical: [],
        horizontal: [],
      },
      readout: null,
    }),
  setGuides: (guides) => set({ guides }),
  clearGuides: () =>
    set({
      guides: {
        screenIndex: null,
        vertical: [],
        horizontal: [],
      },
    }),
  setReadout: (readout) => set({ readout }),
}));
