"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";

import type {
  EditorComponentNode,
  EditorNodeTransform,
  EditorScreen,
} from "../_lib/editor-document";
import {
  GRID_SIZE,
  MIN_NODE_SIZE,
  RESIZE_HANDLES,
  SNAP_THRESHOLD,
  clamp,
  clientPointToElementPoint,
  getAngleBetweenPoints,
  getBoundingRect,
  getRectCenter,
  normalizeRect,
  rectsIntersect,
  rotateVector,
  roundToGrid,
  snapAngle,
  type CanvasPoint,
  type CanvasRect,
  type ResizeHandle,
} from "../_lib/canvas-geometry";
import { useEditorInteractionStore } from "../_lib/editor-interaction-store";

interface TransformSession {
  screenIndex: number;
  mode: "move" | "resize" | "rotate";
  nodeIds: string[];
  focusNodeId: string;
  handle?: ResizeHandle;
  startPoint: CanvasPoint;
  initialTransforms: Record<string, EditorNodeTransform>;
  initialSelectionBounds: CanvasRect | null;
  initialFocusRect: CanvasRect;
  initialAngle?: number;
  moved: boolean;
}

interface MarqueeSession {
  screenIndex: number;
  startPoint: CanvasPoint;
  baseSelection: string[];
  moved: boolean;
}

function handleCursor(handle: ResizeHandle): string {
  switch (handle) {
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "nw":
    case "se":
    default:
      return "nwse-resize";
  }
}

export function CanvasInteractionLayer({
  screen,
  screenIndex,
  isActiveScreen,
  activeTool = "select",
  getNodeElement,
  onSelectScreen,
  onCommitTransforms,
  onActivateSelection,
  onOpenQuickInsert,
  onBeginInlineTextEdit,
  onCreateFromTool,
}: {
  screen: EditorScreen;
  screenIndex: number;
  isActiveScreen: boolean;
  activeTool?: "select" | "hand" | "text" | "frame" | "rectangle";
  getNodeElement: (nodeId: string) => HTMLDivElement | null;
  onSelectScreen: (screenIndex: number) => void;
  onCommitTransforms: (
    screenIndex: number,
    updates: Record<string, Partial<EditorNodeTransform>>,
  ) => void;
  onActivateSelection?: () => void;
  onOpenQuickInsert?: (screenIndex: number, point: CanvasPoint) => void;
  onBeginInlineTextEdit?: (screenIndex: number, nodeId: string) => void;
  onCreateFromTool?: (
    screenIndex: number,
    point: CanvasPoint,
    tool: "text" | "frame" | "rectangle",
  ) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const transformSessionRef = useRef<TransformSession | null>(null);
  const marqueeSessionRef = useRef<MarqueeSession | null>(null);

  const selectedNodeIds = useEditorInteractionStore((state) => state.selectedNodeIds);
  const focusedNodeId = useEditorInteractionStore((state) => state.focusedNodeId);
  const previewTransforms = useEditorInteractionStore((state) => state.previewTransforms);
  const marquee = useEditorInteractionStore((state) => state.marquee);
  const guides = useEditorInteractionStore((state) => state.guides);
  const readout = useEditorInteractionStore((state) => state.readout);
  const selectNodes = useEditorInteractionStore((state) => state.selectNodes);
  const toggleNode = useEditorInteractionStore((state) => state.toggleNode);
  const clearSelection = useEditorInteractionStore((state) => state.clearSelection);
  const setMarquee = useEditorInteractionStore((state) => state.setMarquee);
  const setPreviewTransforms = useEditorInteractionStore((state) => state.setPreviewTransforms);
  const clearPreviewTransforms = useEditorInteractionStore((state) => state.clearPreviewTransforms);
  const startTransform = useEditorInteractionStore((state) => state.startTransform);
  const endTransform = useEditorInteractionStore((state) => state.endTransform);
  const setGuides = useEditorInteractionStore((state) => state.setGuides);
  const clearGuides = useEditorInteractionStore((state) => state.clearGuides);
  const setReadout = useEditorInteractionStore((state) => state.setReadout);

  const componentNodeIds = useMemo(
    () =>
      Object.values(screen.nodes)
        .filter((node): node is EditorComponentNode => node.kind === "component")
        .sort((left, right) => left.transform.zIndex - right.transform.zIndex)
        .map((node) => node.id),
    [screen.nodes],
  );

  const activeSelectionIds = isActiveScreen
    ? selectedNodeIds.filter((nodeId) => Boolean(screen.nodes[nodeId]))
    : [];
  const activeFocusedNodeId =
    isActiveScreen && focusedNodeId && screen.nodes[focusedNodeId] ? focusedNodeId : null;

  const getResolvedTransform = useCallback((nodeId: string): EditorNodeTransform | null => {
    const node = screen.nodes[nodeId];
    if (!node) return null;

    const preview = previewTransforms[nodeId] ?? node.transform;
    const element = getNodeElement(nodeId);
    const measuredWidth =
      preview.width ??
      node.transform.width ??
      element?.offsetWidth ??
      MIN_NODE_SIZE;
    const measuredHeight =
      preview.height ??
      node.transform.height ??
      element?.offsetHeight ??
      MIN_NODE_SIZE;

    return {
      ...preview,
      width: Math.max(measuredWidth, MIN_NODE_SIZE),
      height: Math.max(measuredHeight, MIN_NODE_SIZE),
    };
  }, [getNodeElement, previewTransforms, screen.nodes]);

  const getNodeRect = useCallback((nodeId: string): CanvasRect | null => {
    const transform = getResolvedTransform(nodeId);
    if (!transform || transform.width === null || transform.height === null) return null;

    return {
      x: transform.x,
      y: transform.y,
      width: transform.width,
      height: transform.height,
    };
  }, [getResolvedTransform]);

  const selectionRects = activeSelectionIds
    .map((nodeId) => getNodeRect(nodeId))
    .filter((rect): rect is CanvasRect => Boolean(rect));
  const selectionBounds = getBoundingRect(selectionRects);
  const focusTransform = activeFocusedNodeId ? getResolvedTransform(activeFocusedNodeId) : null;
  const focusRect = activeFocusedNodeId ? getNodeRect(activeFocusedNodeId) : null;

  const getGuideCandidates = useCallback((excludedNodeIds: string[]) => {
    const overlay = overlayRef.current;
    const width = overlay?.offsetWidth ?? screen.artboard.width;
    const height = overlay?.offsetHeight ?? screen.artboard.height;
    const excluded = new Set(excludedNodeIds);

    const vertical = [0, width / 2, width];
    const horizontal = [0, height / 2, height];

    componentNodeIds.forEach((nodeId) => {
      if (excluded.has(nodeId)) return;

      const node = screen.nodes[nodeId];
      if (!node || !node.visible) return;

      const rect = getNodeRect(nodeId);
      if (!rect) return;

      vertical.push(rect.x, rect.x + rect.width / 2, rect.x + rect.width);
      horizontal.push(rect.y, rect.y + rect.height / 2, rect.y + rect.height);
    });

    return { vertical, horizontal, width, height };
  }, [componentNodeIds, getNodeRect, screen.artboard.height, screen.artboard.width, screen.nodes]);

  const findAxisSnap = (positions: number[], guidesToCheck: number[]) => {
    let bestOffset = 0;
    let bestGuide: number | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    guidesToCheck.forEach((guide) => {
      positions.forEach((position) => {
        const distance = Math.abs(position - guide);
        if (distance <= SNAP_THRESHOLD && distance < bestDistance) {
          bestDistance = distance;
          bestOffset = guide - position;
          bestGuide = guide;
        }
      });
    });

    return {
      offset: bestGuide === null ? 0 : bestOffset,
      guide: bestGuide,
    };
  };

  const beginMove = (event: React.PointerEvent, nodeId: string) => {
    if (event.button !== 0) return;
    const overlay = overlayRef.current;
    const node = screen.nodes[nodeId];
    if (!overlay || !node || node.kind !== "component") return;

    onSelectScreen(screenIndex);
    event.stopPropagation();
    event.preventDefault();

    if (event.shiftKey) {
      toggleNode(nodeId);
      return;
    }

    const nextSelection = activeSelectionIds.includes(nodeId)
      ? activeSelectionIds
      : [nodeId];
    selectNodes(nextSelection, nodeId);
    onActivateSelection?.();

    if (node.locked) return;

    const startPoint = clientPointToElementPoint(event.clientX, event.clientY, overlay);
    const initialTransforms = Object.fromEntries(
      nextSelection
        .map((selectedId) => {
          const transform = getResolvedTransform(selectedId);
          return transform ? [selectedId, transform] : null;
        })
        .filter((entry): entry is [string, EditorNodeTransform] => Boolean(entry)),
    );

    const initialSelectionBounds = getBoundingRect(
      Object.keys(initialTransforms)
        .map((selectedId) => ({
          x: initialTransforms[selectedId]!.x,
          y: initialTransforms[selectedId]!.y,
          width: initialTransforms[selectedId]!.width ?? MIN_NODE_SIZE,
          height: initialTransforms[selectedId]!.height ?? MIN_NODE_SIZE,
        })),
    );
    const initialFocusRect = {
      x: initialTransforms[nodeId]!.x,
      y: initialTransforms[nodeId]!.y,
      width: initialTransforms[nodeId]!.width ?? MIN_NODE_SIZE,
      height: initialTransforms[nodeId]!.height ?? MIN_NODE_SIZE,
    };

    transformSessionRef.current = {
      screenIndex,
      mode: "move",
      nodeIds: nextSelection,
      focusNodeId: nodeId,
      startPoint,
      initialTransforms,
      initialSelectionBounds,
      initialFocusRect,
      moved: false,
    };

    startTransform({
      screenIndex,
      mode: "move",
      nodeIds: nextSelection,
      focusNodeId: nodeId,
    });
  };

  const beginResize = (
    event: React.PointerEvent,
    nodeId: string,
    handle: ResizeHandle,
  ) => {
    if (event.button !== 0) return;
    const overlay = overlayRef.current;
    const transform = getResolvedTransform(nodeId);
    if (!overlay || !transform) return;

    onSelectScreen(screenIndex);
    event.stopPropagation();
    event.preventDefault();
    selectNodes([nodeId], nodeId);
    onActivateSelection?.();

    transformSessionRef.current = {
      screenIndex,
      mode: "resize",
      nodeIds: [nodeId],
      focusNodeId: nodeId,
      handle,
      startPoint: clientPointToElementPoint(event.clientX, event.clientY, overlay),
      initialTransforms: {
        [nodeId]: transform,
      },
      initialSelectionBounds: {
        x: transform.x,
        y: transform.y,
        width: transform.width ?? MIN_NODE_SIZE,
        height: transform.height ?? MIN_NODE_SIZE,
      },
      initialFocusRect: {
        x: transform.x,
        y: transform.y,
        width: transform.width ?? MIN_NODE_SIZE,
        height: transform.height ?? MIN_NODE_SIZE,
      },
      moved: false,
    };

    startTransform({
      screenIndex,
      mode: "resize",
      nodeIds: [nodeId],
      focusNodeId: nodeId,
      handle,
    });
  };

  const beginRotate = (event: React.PointerEvent, nodeId: string) => {
    if (event.button !== 0) return;
    const overlay = overlayRef.current;
    const transform = getResolvedTransform(nodeId);
    if (!overlay || !transform) return;

    onSelectScreen(screenIndex);
    event.stopPropagation();
    event.preventDefault();
    selectNodes([nodeId], nodeId);
    onActivateSelection?.();

    const initialFocusRect = {
      x: transform.x,
      y: transform.y,
      width: transform.width ?? MIN_NODE_SIZE,
      height: transform.height ?? MIN_NODE_SIZE,
    };
    const center = getRectCenter(initialFocusRect);
    const startPoint = clientPointToElementPoint(event.clientX, event.clientY, overlay);

    transformSessionRef.current = {
      screenIndex,
      mode: "rotate",
      nodeIds: [nodeId],
      focusNodeId: nodeId,
      startPoint,
      initialTransforms: {
        [nodeId]: transform,
      },
      initialSelectionBounds: initialFocusRect,
      initialFocusRect,
      initialAngle: getAngleBetweenPoints(center, startPoint),
      moved: false,
    };

    startTransform({
      screenIndex,
      mode: "rotate",
      nodeIds: [nodeId],
      focusNodeId: nodeId,
    });
  };

  const beginMarquee = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (activeTool === "text" || activeTool === "frame" || activeTool === "rectangle") {
      event.stopPropagation();
      event.preventDefault();
      onCreateFromTool?.(
        screenIndex,
        clientPointToElementPoint(event.clientX, event.clientY, overlay),
        activeTool,
      );
      return;
    }

    onSelectScreen(screenIndex);
    event.stopPropagation();

    const startPoint = clientPointToElementPoint(event.clientX, event.clientY, overlay);
    marqueeSessionRef.current = {
      screenIndex,
      startPoint,
      baseSelection: event.shiftKey ? activeSelectionIds : [],
      moved: false,
    };

    setMarquee({
      screenIndex,
      x: startPoint.x,
      y: startPoint.y,
      width: 0,
      height: 0,
    });
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const overlay = overlayRef.current;
      const session = transformSessionRef.current;
      const marqueeSession = marqueeSessionRef.current;
      if (!overlay) return;

      if (session && session.screenIndex === screenIndex) {
        const point = clientPointToElementPoint(event.clientX, event.clientY, overlay);
        const guideCandidates = getGuideCandidates(session.nodeIds);

        if (session.mode === "move" && session.initialSelectionBounds) {
          let deltaX = point.x - session.startPoint.x;
          let deltaY = point.y - session.startPoint.y;

          let nextX = roundToGrid(session.initialSelectionBounds.x + deltaX, GRID_SIZE);
          let nextY = roundToGrid(session.initialSelectionBounds.y + deltaY, GRID_SIZE);

          nextX = clamp(nextX, 0, Math.max(0, guideCandidates.width - session.initialSelectionBounds.width));
          nextY = clamp(nextY, 0, Math.max(0, guideCandidates.height - session.initialSelectionBounds.height));

          const verticalSnap = findAxisSnap(
            [
              nextX,
              nextX + session.initialSelectionBounds.width / 2,
              nextX + session.initialSelectionBounds.width,
            ],
            guideCandidates.vertical,
          );
          const horizontalSnap = findAxisSnap(
            [
              nextY,
              nextY + session.initialSelectionBounds.height / 2,
              nextY + session.initialSelectionBounds.height,
            ],
            guideCandidates.horizontal,
          );

          nextX = clamp(
            nextX + verticalSnap.offset,
            0,
            Math.max(0, guideCandidates.width - session.initialSelectionBounds.width),
          );
          nextY = clamp(
            nextY + horizontalSnap.offset,
            0,
            Math.max(0, guideCandidates.height - session.initialSelectionBounds.height),
          );

          deltaX = nextX - session.initialSelectionBounds.x;
          deltaY = nextY - session.initialSelectionBounds.y;

          const nextTransforms = Object.fromEntries(
            Object.entries(session.initialTransforms).map(([nodeId, transform]) => [
              nodeId,
              {
                ...transform,
                x: roundToGrid(transform.x + deltaX, GRID_SIZE),
                y: roundToGrid(transform.y + deltaY, GRID_SIZE),
              },
            ]),
          );

          session.moved = session.moved || Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0;
          setPreviewTransforms(nextTransforms);
          setGuides({
            screenIndex,
            vertical: verticalSnap.guide === null ? [] : [verticalSnap.guide],
            horizontal: horizontalSnap.guide === null ? [] : [horizontalSnap.guide],
          });

          const focusTransform = nextTransforms[session.focusNodeId]!;
          setReadout({
            x: focusTransform.x,
            y: focusTransform.y,
            width: focusTransform.width ?? MIN_NODE_SIZE,
            height: focusTransform.height ?? MIN_NODE_SIZE,
            rotation: focusTransform.rotation,
          });
          return;
        }

        if (session.mode === "resize") {
          const initial = session.initialTransforms[session.focusNodeId];
          if (!initial || !session.handle) return;

          const delta = rotateVector(
            point.x - session.startPoint.x,
            point.y - session.startPoint.y,
            -initial.rotation,
          );

          let nextX = initial.x;
          let nextY = initial.y;
          let nextWidth = initial.width ?? MIN_NODE_SIZE;
          let nextHeight = initial.height ?? MIN_NODE_SIZE;

          if (session.handle.includes("e")) {
            nextWidth = roundToGrid(nextWidth + delta.x, GRID_SIZE);
          }
          if (session.handle.includes("s")) {
            nextHeight = roundToGrid(nextHeight + delta.y, GRID_SIZE);
          }
          if (session.handle.includes("w")) {
            const proposedWidth = roundToGrid(nextWidth - delta.x, GRID_SIZE);
            nextX = roundToGrid(initial.x + (nextWidth - proposedWidth), GRID_SIZE);
            nextWidth = proposedWidth;
          }
          if (session.handle.includes("n")) {
            const proposedHeight = roundToGrid(nextHeight - delta.y, GRID_SIZE);
            nextY = roundToGrid(initial.y + (nextHeight - proposedHeight), GRID_SIZE);
            nextHeight = proposedHeight;
          }

          nextWidth = Math.max(nextWidth, MIN_NODE_SIZE);
          nextHeight = Math.max(nextHeight, MIN_NODE_SIZE);
          nextX = clamp(nextX, 0, Math.max(0, guideCandidates.width - MIN_NODE_SIZE));
          nextY = clamp(nextY, 0, Math.max(0, guideCandidates.height - MIN_NODE_SIZE));
          nextWidth = Math.min(nextWidth, guideCandidates.width - nextX);
          nextHeight = Math.min(nextHeight, guideCandidates.height - nextY);

          let verticalGuides: number[] = [];
          let horizontalGuides: number[] = [];

          if (session.handle.includes("e")) {
            const snap = findAxisSnap([nextX + nextWidth], guideCandidates.vertical);
            if (snap.guide !== null) {
              nextWidth = clamp(nextWidth + snap.offset, MIN_NODE_SIZE, guideCandidates.width - nextX);
              verticalGuides = [snap.guide];
            }
          }
          if (session.handle.includes("w")) {
            const snap = findAxisSnap([nextX], guideCandidates.vertical);
            if (snap.guide !== null) {
              const right = nextX + nextWidth;
              nextX = clamp(nextX + snap.offset, 0, right - MIN_NODE_SIZE);
              nextWidth = right - nextX;
              verticalGuides = [snap.guide];
            }
          }
          if (session.handle.includes("s")) {
            const snap = findAxisSnap([nextY + nextHeight], guideCandidates.horizontal);
            if (snap.guide !== null) {
              nextHeight = clamp(nextHeight + snap.offset, MIN_NODE_SIZE, guideCandidates.height - nextY);
              horizontalGuides = [snap.guide];
            }
          }
          if (session.handle.includes("n")) {
            const snap = findAxisSnap([nextY], guideCandidates.horizontal);
            if (snap.guide !== null) {
              const bottom = nextY + nextHeight;
              nextY = clamp(nextY + snap.offset, 0, bottom - MIN_NODE_SIZE);
              nextHeight = bottom - nextY;
              horizontalGuides = [snap.guide];
            }
          }

          const nextTransform: EditorNodeTransform = {
            ...initial,
            x: roundToGrid(nextX, GRID_SIZE),
            y: roundToGrid(nextY, GRID_SIZE),
            width: roundToGrid(nextWidth, GRID_SIZE),
            height: roundToGrid(nextHeight, GRID_SIZE),
          };

          session.moved =
            session.moved ||
            nextTransform.x !== initial.x ||
            nextTransform.y !== initial.y ||
            nextTransform.width !== initial.width ||
            nextTransform.height !== initial.height;

          setPreviewTransforms({
            [session.focusNodeId]: nextTransform,
          });
          setGuides({
            screenIndex,
            vertical: verticalGuides,
            horizontal: horizontalGuides,
          });
          setReadout({
            x: nextTransform.x,
            y: nextTransform.y,
            width: nextTransform.width ?? MIN_NODE_SIZE,
            height: nextTransform.height ?? MIN_NODE_SIZE,
            rotation: nextTransform.rotation,
          });
          return;
        }

        if (session.mode === "rotate") {
          const initial = session.initialTransforms[session.focusNodeId];
          if (!initial || session.initialAngle === undefined) return;

          const center = getRectCenter(session.initialFocusRect);
          const currentAngle = getAngleBetweenPoints(center, point);
          const nextRotation = snapAngle(
            initial.rotation + (currentAngle - session.initialAngle),
            event.altKey,
          );

          session.moved = session.moved || nextRotation !== initial.rotation;
          setPreviewTransforms({
            [session.focusNodeId]: {
              ...initial,
              rotation: nextRotation,
            },
          });
          clearGuides();
          setReadout({
            x: initial.x,
            y: initial.y,
            width: initial.width ?? MIN_NODE_SIZE,
            height: initial.height ?? MIN_NODE_SIZE,
            rotation: nextRotation,
          });
        }

        return;
      }

      if (marqueeSession && marqueeSession.screenIndex === screenIndex) {
        const point = clientPointToElementPoint(event.clientX, event.clientY, overlay);
        const nextMarquee = normalizeRect(marqueeSession.startPoint, point);
        marqueeSession.moved =
          marqueeSession.moved || nextMarquee.width > 2 || nextMarquee.height > 2;

        setMarquee({
          screenIndex,
          ...nextMarquee,
        });

        const intersectingNodeIds = componentNodeIds.filter((nodeId) => {
          const rect = getNodeRect(nodeId);
          return rect ? rectsIntersect(nextMarquee, rect) : false;
        });

        const nextSelection = Array.from(
          new Set([...marqueeSession.baseSelection, ...intersectingNodeIds]),
        );
        selectNodes(nextSelection, intersectingNodeIds[intersectingNodeIds.length - 1] ?? null);
      }
    };

    const handlePointerUp = () => {
      const session = transformSessionRef.current;
      const marqueeSession = marqueeSessionRef.current;

      if (session && session.screenIndex === screenIndex) {
        const nextPreviewTransforms = useEditorInteractionStore.getState().previewTransforms;
        if (session.moved) {
          const updates = Object.fromEntries(
            Object.entries(nextPreviewTransforms).map(([nodeId, transform]) => {
              const initial = session.initialTransforms[nodeId];
              return [
                nodeId,
                {
                  x: transform.x,
                  y: transform.y,
                  width:
                    transform.width !== initial?.width ? transform.width : undefined,
                  height:
                    transform.height !== initial?.height ? transform.height : undefined,
                  rotation:
                    transform.rotation !== initial?.rotation
                      ? transform.rotation
                      : undefined,
                  zIndex:
                    transform.zIndex !== initial?.zIndex ? transform.zIndex : undefined,
                } satisfies Partial<EditorNodeTransform>,
              ];
            }),
          );
          onCommitTransforms(screenIndex, updates);
        }

        transformSessionRef.current = null;
        endTransform();
      }

      if (marqueeSession && marqueeSession.screenIndex === screenIndex) {
        const state = useEditorInteractionStore.getState();
        if (!marqueeSession.moved && marqueeSession.baseSelection.length === 0) {
          clearSelection();
          setReadout(null);
        } else if (state.selectedNodeIds.length > 0) {
          onActivateSelection?.();
        }
        marqueeSessionRef.current = null;
        state.setMarquee(null);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    clearGuides,
    clearSelection,
    clearPreviewTransforms,
    componentNodeIds,
    endTransform,
    getNodeElement,
    getGuideCandidates,
    getNodeRect,
    onCreateFromTool,
    onCommitTransforms,
    onActivateSelection,
    screen,
    screenIndex,
    selectNodes,
    setGuides,
    setMarquee,
    setPreviewTransforms,
    setReadout,
    activeTool,
  ]);

  useEffect(() => {
    if (!isActiveScreen && activeSelectionIds.length > 0) {
      clearPreviewTransforms();
      clearGuides();
      setReadout(null);
    }
  }, [
    activeSelectionIds.length,
    clearGuides,
    clearPreviewTransforms,
    isActiveScreen,
    setReadout,
  ]);

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-20 touch-none"
      onPointerDown={beginMarquee}
      onDoubleClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const overlay = overlayRef.current;
        if (!overlay) return;

        onOpenQuickInsert?.(
          screenIndex,
          clientPointToElementPoint(event.clientX, event.clientY, overlay),
        );
      }}
    >
      {componentNodeIds.map((nodeId) => {
        const node = screen.nodes[nodeId];
        const transform = getResolvedTransform(nodeId);
        if (!node || !transform || node.visible === false) return null;

        return (
          <div
            key={`hit-${nodeId}`}
            className="absolute left-0 top-0"
            style={{
              width: transform.width ?? MIN_NODE_SIZE,
              height: transform.height ?? MIN_NODE_SIZE,
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0px)`,
              zIndex: (transform.zIndex ?? 0) + 40,
              overflow: "visible",
            }}
          >
            <button
              onPointerDown={(event) => beginMove(event, nodeId)}
              onDoubleClick={(event) => {
                event.stopPropagation();
                if (node.kind === "component" && node.component.type === "TEXT") {
                  onBeginInlineTextEdit?.(screenIndex, nodeId);
                }
              }}
              className="h-full w-full rounded-[18px] border border-transparent bg-transparent"
              style={{
                transform: transform.rotation
                  ? `rotate(${transform.rotation}deg)`
                  : undefined,
                transformOrigin: "center center",
                cursor: node.locked ? "default" : "move",
              }}
              aria-label={`Select ${node.name}`}
            />
          </div>
        );
      })}

      {guides.screenIndex === screenIndex
        ? guides.vertical.map((line) => (
            <div
              key={`v-${line}`}
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-cyan-400/70"
              style={{ left: line }}
            />
          ))
        : null}
      {guides.screenIndex === screenIndex
        ? guides.horizontal.map((line) => (
            <div
              key={`h-${line}`}
              className="pointer-events-none absolute left-0 right-0 h-px bg-cyan-400/70"
              style={{ top: line }}
            />
          ))
        : null}

      {activeSelectionIds.map((nodeId) => {
        const transform = getResolvedTransform(nodeId);
        if (!transform) return null;

        const isFocused = activeFocusedNodeId === nodeId;

        return (
          <div
            key={`selection-${nodeId}`}
            className="pointer-events-none absolute left-0 top-0"
            style={{
              width: transform.width ?? MIN_NODE_SIZE,
              height: transform.height ?? MIN_NODE_SIZE,
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0px)`,
              zIndex: 60,
              overflow: "visible",
            }}
          >
            <div
              className={`h-full w-full rounded-[18px] border ${
                isFocused
                  ? "border-blue-400 shadow-[0_0_0_1px_rgba(96,165,250,0.3)]"
                  : "border-blue-300/65"
              }`}
              style={{
                transform: transform.rotation
                  ? `rotate(${transform.rotation}deg)`
                  : undefined,
                transformOrigin: "center center",
              }}
            />
          </div>
        );
      })}

      {activeSelectionIds.length > 1 && selectionBounds ? (
        <div
          className="pointer-events-none absolute rounded-[22px] border border-dashed border-blue-300/70 bg-blue-500/6"
          style={{
            left: selectionBounds.x,
            top: selectionBounds.y,
            width: selectionBounds.width,
            height: selectionBounds.height,
            zIndex: 58,
          }}
        />
      ) : null}

      {activeFocusedNodeId && focusTransform && focusRect ? (
        <div
          className="absolute left-0 top-0"
          style={{
            width: focusTransform.width ?? MIN_NODE_SIZE,
            height: focusTransform.height ?? MIN_NODE_SIZE,
            transform: `translate3d(${focusTransform.x}px, ${focusTransform.y}px, 0px)`,
            zIndex: 80,
            overflow: "visible",
          }}
        >
          <div
            className="pointer-events-none relative h-full w-full rounded-[18px] border-2 border-blue-400"
            style={{
              transform: focusTransform.rotation
                ? `rotate(${focusTransform.rotation}deg)`
                : undefined,
              transformOrigin: "center center",
            }}
          >
            {RESIZE_HANDLES.map((handle) => {
              const style: React.CSSProperties = {
                position: "absolute",
                width: 12,
                height: 12,
                borderRadius: 9999,
                backgroundColor: "#0f172a",
                border: "2px solid rgb(96 165 250)",
                cursor: handleCursor(handle),
              };

              if (handle.includes("n")) style.top = -8;
              if (handle.includes("s")) style.bottom = -8;
              if (handle.includes("w")) style.left = -8;
              if (handle.includes("e")) style.right = -8;
              if (handle === "n" || handle === "s") style.left = "50%";
              if (handle === "e" || handle === "w") style.top = "50%";
              if (handle === "n" || handle === "s") style.transform = "translateX(-50%)";
              if (handle === "e" || handle === "w") style.transform = "translateY(-50%)";

              return (
                <button
                  key={handle}
                  type="button"
                  onPointerDown={(event) => beginResize(event, activeFocusedNodeId, handle)}
                  className="pointer-events-auto"
                  style={style}
                  aria-label={`Resize ${handle}`}
                />
              );
            })}

            <button
              type="button"
              onPointerDown={(event) => beginRotate(event, activeFocusedNodeId)}
              className="pointer-events-auto absolute left-1/2 top-[-34px] h-4 w-4 -translate-x-1/2 rounded-full border-2 border-blue-400 bg-slate-950"
              aria-label="Rotate selection"
            />
            <div className="pointer-events-none absolute left-1/2 top-[-20px] h-3 w-px -translate-x-1/2 bg-blue-400/80" />
          </div>
        </div>
      ) : null}

      {marquee?.screenIndex === screenIndex ? (
        <div
          className="pointer-events-none absolute rounded-xl border border-blue-400/70 bg-blue-500/12"
          style={{
            left: marquee.x,
            top: marquee.y,
            width: marquee.width,
            height: marquee.height,
            zIndex: 90,
          }}
        />
      ) : null}

      {readout && isActiveScreen ? (
        <div
          className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/[0.12] bg-black/75 px-3 py-1.5 text-[10px] font-medium tracking-[0.14em] text-white/80 backdrop-blur"
          style={{ zIndex: 95 }}
        >
          {`X ${Math.round(readout.x)}  Y ${Math.round(readout.y)}  W ${Math.round(
            readout.width,
          )}  H ${Math.round(readout.height)}  R ${Math.round(readout.rotation)}°`}
        </div>
      ) : null}
    </div>
  );
}
