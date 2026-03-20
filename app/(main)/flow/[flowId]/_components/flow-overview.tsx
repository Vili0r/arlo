"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Smartphone,
  GitBranch,
  Play,
  Zap,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Image,
  Type,
  MousePointerClick,
} from "lucide-react";
import type { Screen, FlowConfig } from "@/lib/types";
import type { ScreenBranch } from "./screen-settings-panel";

/* ════════════════════════════════════════════════════════════
   FLOW OVERVIEW GRAPH
   
   A node-graph view showing all screens as connected cards,
   with branching paths visualized as curved lines.
   
   Replaces the phone canvas when toggled on.
   ════════════════════════════════════════════════════════════ */

const NODE_WIDTH = 180;
const NODE_HEIGHT = 240;
const NODE_GAP_X = 100;
const NODE_GAP_Y = 80;

interface NodePosition {
  x: number;
  y: number;
  screenIndex: number;
}

export function FlowOverview({
  config,
  selectedScreenIndex,
  onSelectScreen,
  onOpenScreenSettings,
}: {
  config: FlowConfig;
  selectedScreenIndex: number;
  onSelectScreen: (index: number) => void;
  onOpenScreenSettings: (index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.85);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const { screens } = config;

  /* ── Compute node positions ────────────────── */
  const positions = useMemo(() => {
    const pos: NodePosition[] = [];

    // Main flow: horizontal line
    screens.forEach((_, i) => {
      pos.push({
        x: i * (NODE_WIDTH + NODE_GAP_X),
        y: 0,
        screenIndex: i,
      });
    });

    return pos;
  }, [screens]);

  /* ── Compute edges ─────────────────────────── */
  const edges = useMemo(() => {
    const result: Array<{
      from: number;
      to: number;
      type: "default" | "branch";
      label?: string;
    }> = [];

    screens.forEach((screen, i) => {
      // Default next connection
      if (i < screens.length - 1) {
        result.push({ from: i, to: i + 1, type: "default" });
      }

      // Branch connections
      const branches: ScreenBranch[] = (screen as any).branches || [];
      branches.forEach((branch) => {
        const targetIdx = screens.findIndex((s) => s.id === branch.targetScreenId);
        if (targetIdx !== -1 && targetIdx !== i + 1) {
          result.push({
            from: i,
            to: targetIdx,
            type: "branch",
            label: `${branch.operator} "${branch.value}"`,
          });
        }
      });
    });

    return result;
  }, [screens]);

  /* ── Canvas pan and zoom ────────────────────── */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-node]")) return;
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y),
      });
    },
    [isPanning],
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(1.5, z - e.deltaY * 0.001)));
  }, []);

  const resetView = useCallback(() => {
    setZoom(0.85);
    // Center on the selected screen
    const pos = positions[selectedScreenIndex];
    if (pos && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: rect.width / 2 - pos.x * 0.85 - NODE_WIDTH * 0.85 / 2,
        y: rect.height / 2 - pos.y * 0.85 - NODE_HEIGHT * 0.85 / 2,
      });
    }
  }, [selectedScreenIndex, positions]);

  // Center view on mount
  useEffect(() => {
    resetView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── SVG edge paths ─────────────────────────── */
  const renderEdges = () => {
    return edges.map((edge, ei) => {
      const fromPos = positions[edge.from];
      const toPos = positions[edge.to];
      if (!fromPos || !toPos) return null;

      const x1 = fromPos.x + NODE_WIDTH;
      const y1 = fromPos.y + NODE_HEIGHT / 2;
      const x2 = toPos.x;
      const y2 = toPos.y + NODE_HEIGHT / 2;

      const isBranch = edge.type === "branch";
      const isBackward = edge.to < edge.from;

      let path: string;
      if (isBackward) {
        // Curved path going backward (above the nodes)
        const midY = Math.min(fromPos.y, toPos.y) - 80;
        path = `M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x1 + 50} ${midY}, ${(x1 + x2) / 2} ${midY} C ${(x1 + x2) / 2} ${midY}, ${x2 - 50} ${midY}, ${x2} ${y2}`;
      } else if (Math.abs(edge.to - edge.from) === 1) {
        // Straight-ish horizontal connection
        const midX = (x1 + x2) / 2;
        path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
      } else {
        // Curved connection skipping screens (below the nodes)
        const midY = Math.max(fromPos.y, toPos.y) + NODE_HEIGHT + 60;
        path = `M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x1 + 60} ${midY}, ${(x1 + x2) / 2} ${midY} C ${(x1 + x2) / 2} ${midY}, ${x2 - 60} ${midY}, ${x2} ${y2}`;
      }

      return (
        <g key={`edge-${ei}`}>
          <path
            d={path}
            fill="none"
            stroke={isBranch ? "#7C65F6" : "rgba(255,255,255,0.12)"}
            strokeWidth={isBranch ? 2 : 1.5}
            strokeDasharray={isBranch ? "6 3" : undefined}
          />
          {/* Arrow head */}
          <circle
            cx={x2}
            cy={y2}
            r={3}
            fill={isBranch ? "#7C65F6" : "rgba(255,255,255,0.2)"}
          />
          {/* Branch label */}
          {isBranch && edge.label && (
            <text
              x={(x1 + x2) / 2}
              y={Math.max(fromPos.y, toPos.y) + NODE_HEIGHT + 50}
              textAnchor="middle"
              fill="#7C65F6"
              fontSize="10"
              fontFamily="inherit"
              opacity="0.6"
            >
              {edge.label}
            </text>
          )}
        </g>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden select-none"
      style={{
        cursor: isPanning ? "grabbing" : "grab",
        backgroundColor: "#0a0a0a",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
        backgroundSize: "32px 32px",
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Zoom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/[0.06] backdrop-blur-md border border-white/[0.1] rounded-xl px-1 py-1">
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
          className="p-2 text-white/40 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
        >
          <ZoomOut size={13} />
        </button>
        <button
          onClick={() => setZoom(0.85)}
          className="px-2 min-w-[44px] text-center text-[11px] font-medium text-white/40 hover:text-white transition-colors"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
          className="p-2 text-white/40 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
        >
          <ZoomIn size={13} />
        </button>
        <button
          onClick={resetView}
          className="p-2 text-white/40 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
        >
          <Maximize2 size={13} />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-4 px-3 py-2 bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-lg">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-white/20 rounded" />
          <span className="text-[10px] text-white/30">Default</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-[#7C65F6] rounded" style={{ backgroundImage: "repeating-linear-gradient(90deg, #7C65F6 0, #7C65F6 4px, transparent 4px, transparent 7px)" }} />
          <span className="text-[10px] text-white/30">Branch</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap size={9} className="text-amber-400" />
          <span className="text-[10px] text-white/30">Skip logic</span>
        </div>
      </div>

      {/* World layer */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          transition: isPanning ? "none" : "transform 0.1s ease-out",
        }}
      >
        {/* SVG for edges */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{
            width: screens.length * (NODE_WIDTH + NODE_GAP_X) + 200,
            height: NODE_HEIGHT + 300,
            overflow: "visible",
          }}
        >
          {renderEdges()}
        </svg>

        {/* Screen nodes */}
        {positions.map((pos) => {
          const screen = screens[pos.screenIndex];
          const isSelected = pos.screenIndex === selectedScreenIndex;
          const hasBranches = ((screen as any).branches || []).length > 0;
          const hasSkip = (screen as any).skipCondition?.enabled;

          return (
            <div
              key={screen.id}
              data-node
              className="absolute"
              style={{
                left: pos.x,
                top: pos.y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
              }}
            >
              <OverviewNode
                screen={screen}
                index={pos.screenIndex}
                isSelected={isSelected}
                isFirst={pos.screenIndex === 0}
                isLast={pos.screenIndex === screens.length - 1}
                hasBranches={hasBranches}
                hasSkip={!!hasSkip}
                onClick={() => onSelectScreen(pos.screenIndex)}
                onDoubleClick={() => onOpenScreenSettings(pos.screenIndex)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   OVERVIEW NODE — a single screen card in the graph
   ════════════════════════════════════════════════════════════ */

function OverviewNode({
  screen,
  index,
  isSelected,
  isFirst,
  isLast,
  hasBranches,
  hasSkip,
  onClick,
  onDoubleClick,
}: {
  screen: Screen;
  index: number;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  hasBranches: boolean;
  hasSkip: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  const bgColor = screen.style?.backgroundColor || "#FFFFFF";
  const components = [...screen.components].sort((a, b) => a.order - b.order);

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`w-full h-full rounded-2xl border-2 transition-all cursor-pointer group overflow-hidden flex flex-col ${
        isSelected
          ? "border-[#7C65F6] shadow-[0_0_30px_rgba(124,101,246,0.25)]"
          : "border-white/[0.08] hover:border-white/[0.15] hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
      }`}
      style={{
        backgroundColor: "#111113",
      }}
    >
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold ${
            isSelected
              ? "bg-[#7C65F6] text-white"
              : "bg-white/[0.06] text-white/40"
          }`}
        >
          {index + 1}
        </div>
        <span className="text-[11px] font-medium text-white/70 truncate flex-1">
          {screen.name}
        </span>
        {/* Status indicators */}
        <div className="flex items-center gap-1">
          {isFirst && (
            <div className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[8px] font-bold">
              START
            </div>
          )}
          {isLast && (
            <div className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 text-[8px] font-bold">
              END
            </div>
          )}
          {hasSkip && <Zap size={10} className="text-amber-400" />}
          {hasBranches && <GitBranch size={10} className="text-purple-400" />}
        </div>
      </div>

      {/* Mini screen preview */}
      <div
        className="flex-1 m-2 rounded-lg overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        <div className="p-2 flex flex-col gap-1 h-full">
          {components.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <Smartphone size={16} className="text-gray-300/50" />
            </div>
          ) : (
            components.slice(0, 5).map((comp) => (
              <NodeComponentPreview key={comp.id} component={comp} />
            ))
          )}
          {components.length > 5 && (
            <div className="text-[8px] text-gray-400 text-center py-0.5">
              +{components.length - 5} more
            </div>
          )}
        </div>
      </div>

      {/* Component count footer */}
      <div className="px-3 py-1.5 border-t border-white/[0.06] flex items-center justify-between shrink-0">
        <span className="text-[9px] text-white/25">
          {components.length} component{components.length !== 1 ? "s" : ""}
        </span>
        <span className="text-[9px] text-white/15 opacity-0 group-hover:opacity-100 transition-opacity">
          Double-click for settings
        </span>
      </div>
    </div>
  );
}

/* ── Tiny component preview for the node ──── */

function NodeComponentPreview({ component }: { component: any }) {
  const p = component.props || {};

  if (component.type === "TEXT") {
    const isLarge = (p.fontSize || 16) > 20;
    return (
      <div className="flex items-center gap-1.5">
        <Type size={8} className="text-gray-400/50 shrink-0" />
        <div
          className="rounded-sm"
          style={{
            height: isLarge ? 5 : 3.5,
            width: isLarge ? "60%" : "80%",
            backgroundColor: p.color || "#1A1A1A",
            opacity: 0.3,
          }}
        />
      </div>
    );
  }

  if (component.type === "IMAGE" || component.type === "VIDEO") {
    return (
      <div
        className="rounded-md flex items-center justify-center"
        style={{
          height: 20,
          backgroundColor: component.type === "VIDEO" ? "#111" : "#f0f0f0",
        }}
      >
        {component.type === "VIDEO" ? (
          <Play size={6} className="text-white/40" />
        ) : (
          <Image size={6} className="text-gray-400" />
        )}
      </div>
    );
  }

  if (component.type === "BUTTON") {
    const bg = p.backgroundColor || p.style?.backgroundColor || "#007AFF";
    return (
      <div
        className="rounded-md h-5 flex items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <span className="text-[6px] text-white font-medium truncate px-1">
          {p.label || "Button"}
        </span>
      </div>
    );
  }

  // Default
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <div className="w-2 h-2 rounded-sm bg-gray-300/20" />
      <div className="flex-1 h-1.5 rounded-full bg-gray-300/10" />
    </div>
  );
}