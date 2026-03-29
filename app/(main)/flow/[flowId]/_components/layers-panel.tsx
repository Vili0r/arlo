"use client";

import React, { useMemo } from "react";
import {
  Eye,
  EyeOff,
  Layers3,
  Lock,
  LockOpen,
  MoveDown,
  MoveUp,
  PanelTop,
  PanelBottom,
  SquareStack,
} from "lucide-react";

import type { EditorNode, EditorScreen } from "../_lib/editor-document";

interface LayerRow {
  id: string;
  depth: number;
  node: EditorNode;
}

function collectLayerRows(
  screen: EditorScreen,
  nodeIds: string[],
  depth = 0,
): LayerRow[] {
  return [...nodeIds]
    .sort((leftId, rightId) => {
      const left = screen.nodes[leftId];
      const right = screen.nodes[rightId];
      return (right?.transform.zIndex ?? 0) - (left?.transform.zIndex ?? 0);
    })
    .flatMap((nodeId) => {
      const node = screen.nodes[nodeId];
      if (!node) return [];

      return [
        { id: nodeId, depth, node },
        ...collectLayerRows(screen, node.childIds, depth + 1),
      ];
    });
}

export function LayersPanel({
  screen,
  selectedNodeIds,
  focusedNodeId,
  onSelectNode,
  onToggleVisibility,
  onToggleLock,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}: {
  screen: EditorScreen | null;
  selectedNodeIds: string[];
  focusedNodeId: string | null;
  onSelectNode: (nodeId: string, additive?: boolean) => void;
  onToggleVisibility: (nodeId: string) => void;
  onToggleLock: (nodeId: string) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}) {
  const rows = useMemo(() => {
    if (!screen) return [];
    return collectLayerRows(screen, screen.rootNodeIds);
  }, [screen]);

  if (!screen) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
        <div>
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
            <Layers3 size={16} className="text-white/20" />
          </div>
          <p className="text-xs text-white/35">Select a screen to inspect its layers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
              {screen.name}
            </p>
            <p className="mt-1 text-[12px] text-white/45">
              {screen.rootNodeIds.length} layer{screen.rootNodeIds.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-full border border-white/[0.08] bg-black/20 px-2.5 py-1 text-[10px] font-medium text-white/45">
            {screen.layoutMode}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onBringForward}
            className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] font-medium text-white/65 transition-colors hover:text-white hover:bg-white/[0.06]"
          >
            <MoveUp size={12} />
            Forward
          </button>
          <button
            onClick={onSendBackward}
            className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] font-medium text-white/65 transition-colors hover:text-white hover:bg-white/[0.06]"
          >
            <MoveDown size={12} />
            Backward
          </button>
          <button
            onClick={onBringToFront}
            className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] font-medium text-white/65 transition-colors hover:text-white hover:bg-white/[0.06]"
          >
            <PanelTop size={12} />
            Front
          </button>
          <button
            onClick={onSendToBack}
            className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] font-medium text-white/65 transition-colors hover:text-white hover:bg-white/[0.06]"
          >
            <PanelBottom size={12} />
            Back
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center">
            <p className="text-xs text-white/30">This screen does not have any editable layers yet.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {rows.map((row) => {
              const isSelected = selectedNodeIds.includes(row.id);
              const isFocused = focusedNodeId === row.id;
              const metaLabel =
                row.node.kind === "component"
                  ? row.node.component.type.replaceAll("_", " ")
                  : "Group";

              return (
                <button
                  key={row.id}
                  onClick={(event) => onSelectNode(row.id, event.shiftKey)}
                  className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors ${
                    isSelected
                      ? "bg-blue-500/14 text-white ring-1 ring-blue-500/25"
                      : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                  }`}
                  style={{ paddingLeft: `${row.depth * 14 + 10}px` }}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? "bg-blue-500/16 text-blue-300" : "bg-white/[0.05] text-white/35"
                    }`}
                  >
                    {row.node.kind === "group" ? <SquareStack size={13} /> : <Layers3 size={13} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`truncate text-[12px] font-medium ${isFocused ? "text-white" : ""}`}>
                        {row.node.name}
                      </span>
                      {row.node.locked ? (
                        <Lock size={10} className="shrink-0 text-amber-300/75" />
                      ) : null}
                    </div>
                    <p className="truncate text-[10px] uppercase tracking-[0.14em] text-white/28">
                      {metaLabel}
                    </p>
                  </div>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleVisibility(row.id);
                    }}
                    className="rounded-lg p-1.5 text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/70"
                    title={row.node.visible ? "Hide layer" : "Show layer"}
                  >
                    {row.node.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleLock(row.id);
                    }}
                    className="rounded-lg p-1.5 text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/70"
                    title={row.node.locked ? "Unlock layer" : "Lock layer"}
                  >
                    {row.node.locked ? <Lock size={13} /> : <LockOpen size={13} />}
                  </button>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
