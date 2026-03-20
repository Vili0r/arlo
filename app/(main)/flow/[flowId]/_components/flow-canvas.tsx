"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  Plus,
  Smartphone,
  Settings2,
  Copy,
  Trash2,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minus,
  GitBranch,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Screen, FlowConfig, FlowComponent } from "@/lib/types";
import { PhonePreviewComponent } from "./phone-preview";
import { AnimatedWrapper } from "./animated-wrapper";
import {
  getFrameDimensions,
  type DevicePreset,
  type Orientation,
} from "../_lib/device-presets";

/* ════════════════════════════════════════════════════════════
   FLOW CANVAS
   
   The primary editing surface. Renders ALL screens as
   interactive DeviceFrames laid out horizontally with
   SVG connection lines between them.
   
   Each phone is fully interactive — you can click components
   to select them, and the property sheet opens on the right.
   ════════════════════════════════════════════════════════════ */

const SCREEN_GAP = 100;

interface FlowCanvasProps {
  config: FlowConfig;
  selectedScreenIndex: number;
  selectedComponentId: string | null;
  onSelectScreen: (index: number) => void;
  onSelectComponent: (screenIndex: number, componentId: string | null) => void;
  onAddScreen: () => void;
  onDeleteScreen: (index: number) => void;
  onDuplicateScreen: (index: number) => void;
  onOpenScreenSettings: (index: number) => void;
  onRenameScreen: (index: number, newName: string) => void;
  device: DevicePreset;
  orientation: Orientation;
}

export function FlowCanvas({
  config,
  selectedScreenIndex,
  selectedComponentId,
  onSelectScreen,
  onSelectComponent,
  onAddScreen,
  onDeleteScreen,
  onDuplicateScreen,
  onOpenScreenSettings,
  onRenameScreen,
  device,
  orientation,
}: FlowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.65);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const frame = getFrameDimensions(device, orientation);
  const { screens } = config;

  /* ── Compute positions for each screen ────────── */
  const positions = useMemo(() => {
    return screens.map((_, i) => ({
      x: i * (frame.frameWidth + SCREEN_GAP),
      y: 0,
    }));
  }, [screens, frame.frameWidth]);

  /* ── Total canvas dimensions ────────────────────── */
  const totalWidth = useMemo(
    () =>
      screens.length * frame.frameWidth +
      (screens.length - 1) * SCREEN_GAP +
      200,
    [screens.length, frame.frameWidth],
  );

  /* ── Pan & Zoom ──────────────────────────────────── */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Don't pan if clicking inside a phone frame
      if ((e.target as HTMLElement).closest("[data-phone-frame]")) return;
      if ((e.target as HTMLElement).closest("[data-no-pan]")) return;
      setIsPanning(true);
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
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
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom((z) => Math.max(0.2, Math.min(1.2, z - e.deltaY * 0.002)));
    }
  }, []);

  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(1.2, z + 0.1)),
    [],
  );
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(0.2, z - 0.1)),
    [],
  );

  const resetView = useCallback(() => {
    setZoom(0.65);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX =
        rect.width / 2 -
        ((screens.length * (frame.frameWidth + SCREEN_GAP)) / 2) * 0.65;
      const centerY = rect.height / 2 - (frame.frameHeight / 2) * 0.65;
      setPan({ x: centerX, y: centerY });
    }
  }, [screens.length, frame.frameWidth, frame.frameHeight]);

  // Center on mount
  useEffect(() => {
    resetView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── SVG connection lines ────────────────────────── */
  const renderConnections = () => {
    return screens.slice(0, -1).map((_, i) => {
      const x1 = positions[i].x + frame.frameWidth;
      const y1 = positions[i].y + frame.frameHeight / 2;
      const x2 = positions[i + 1].x;
      const y2 = positions[i + 1].y + frame.frameHeight / 2;
      const midX = (x1 + x2) / 2;

      return (
        <g key={`conn-${i}`}>
          {/* Connection line */}
          <path
            d={`M ${x1 + 8} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2 - 8} ${y2}`}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
          {/* Arrow circle at target */}
          <circle
            cx={x2 - 8}
            cy={y2}
            r={4}
            fill="rgba(255,255,255,0.15)"
          />
          {/* Step number on connection */}
          <rect
            x={midX - 12}
            y={y1 - 10}
            width={24}
            height={20}
            rx={6}
            fill="rgba(255,255,255,0.06)"
          />
          <text
            x={midX}
            y={y1 + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.25)"
            fontSize="9"
            fontWeight="600"
            fontFamily="inherit"
          >
            →
          </text>
        </g>
      );
    });
  };

  /* ── Progress bar for a given screen ─────────────── */
  const makeProgressBar = (screenIndex: number) => {
    if (!config.settings?.showProgressBar) return null;
    return (
      <div className="h-1 bg-gray-100 shrink-0">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${((screenIndex + 1) / screens.length) * 100}%`,
            backgroundColor: config.settings.progressBarColor || "#007AFF",
          }}
        />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden select-none"
      style={{
        cursor: isPanning ? "grabbing" : "grab",
        backgroundColor: "#0a0a0a",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
        backgroundSize: "24px 24px",
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* ── Zoom controls ─────────────────────────── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/[0.06] backdrop-blur-md border border-white/[0.1] rounded-xl px-1 py-1">
        <button
          onClick={zoomOut}
          className="p-2 text-white/40 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
        >
          <Minus size={13} />
        </button>
        <button
          onClick={resetView}
          className="px-2 min-w-[44px] text-center text-[11px] font-medium text-white/40 hover:text-white transition-colors"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={zoomIn}
          className="p-2 text-white/40 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
        >
          <Plus size={13} />
        </button>
        <button
          onClick={resetView}
          className="p-2 text-white/40 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
        >
          <Maximize2 size={13} />
        </button>
      </div>

      {/* ── Screen count badge ─────────────────────── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.06] backdrop-blur-md border border-white/[0.1] rounded-lg">
          <GitBranch size={12} className="text-white/30" />
          <span className="text-[11px] text-white/40 font-medium">
            {screens.length} step{screens.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── World layer ────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transition: isPanning ? "none" : "transform 0.08s ease-out",
        }}
      >
        <div
          className="absolute"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "0 0",
            transition: isPanning ? "none" : "transform 0.15s ease-out",
          }}
        >
          {/* SVG connection lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{
              width: totalWidth,
              height: frame.frameHeight + 120,
              overflow: "visible",
            }}
          >
            {renderConnections()}
          </svg>

          {/* Screen frames */}
          {screens.map((screen, index) => {
            const pos = positions[index];
            const isSelected = index === selectedScreenIndex;

            return (
              <div
                key={screen.id}
                className="absolute"
                style={{
                  left: pos.x,
                  top: pos.y,
                }}
              >
                {/* Screen label above frame */}
                <ScreenLabel
                  screen={screen}
                  index={index}
                  isSelected={isSelected}
                  isFirst={index === 0}
                  isLast={index === screens.length - 1}
                  totalScreens={screens.length}
                  onSelect={() => {
                    onSelectScreen(index);
                    onSelectComponent(index, null);
                  }}
                  onDelete={() => onDeleteScreen(index)}
                  onDuplicate={() => onDuplicateScreen(index)}
                  onSettings={() => onOpenScreenSettings(index)}
                  onRename={(name) => onRenameScreen(index, name)}
                  canDelete={screens.length > 1}
                />

                {/* Interactive phone frame */}
                <div
                  data-phone-frame
                  className={`relative transition-all duration-150 cursor-default ${
                    isSelected
                      ? "ring-2 ring-blue-500/60 ring-offset-4 ring-offset-[#0a0a0a] rounded-[32px]"
                      : "hover:ring-1 hover:ring-white/[0.15] hover:ring-offset-2 hover:ring-offset-[#0a0a0a] rounded-[32px] opacity-80 hover:opacity-100"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectScreen(index);
                    // If clicked the frame bg (not a component), deselect component
                    if (
                      !(e.target as HTMLElement).closest(
                        "[data-component-item]",
                      )
                    ) {
                      onSelectComponent(index, null);
                    }
                  }}
                >
                  <InteractiveDeviceFrame
                    device={device}
                    orientation={orientation}
                    frame={frame}
                    screen={screen}
                    screenIndex={index}
                    selectedComponentId={
                      isSelected ? selectedComponentId : null
                    }
                    onSelectComponent={(compId) =>
                      onSelectComponent(index, compId)
                    }
                    progressBar={makeProgressBar(index)}
                  />
                </div>
              </div>
            );
          })}

          {/* "+ Add Screen" button after last screen */}
          <div
            data-no-pan
            className="absolute flex flex-col items-center justify-center"
            style={{
              left:
                screens.length * (frame.frameWidth + SCREEN_GAP) +
                20,
              top: frame.frameHeight / 2 - 50,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddScreen();
              }}
              className="w-[80px] h-[100px] rounded-2xl border-2 border-dashed border-white/[0.1] hover:border-white/[0.25] hover:bg-white/[0.03] flex flex-col items-center justify-center gap-2 text-white/25 hover:text-white/60 transition-all group"
            >
              <Plus
                size={22}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="text-[10px] font-medium">Add Step</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SCREEN LABEL — name badge above each phone frame
   ════════════════════════════════════════════════════════════ */

function ScreenLabel({
  screen,
  index,
  isSelected,
  isFirst,
  isLast,
  totalScreens,
  onSelect,
  onDelete,
  onDuplicate,
  onSettings,
  onRename,
  canDelete,
}: {
  screen: Screen;
  index: number;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  totalScreens: number;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onSettings: () => void;
  onRename: (name: string) => void;
  canDelete: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(screen.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== screen.name) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }, [editValue, screen.name, onRename]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div data-no-pan className="flex items-center justify-center gap-2 mb-3">
      <ContextMenu>
        <ContextMenuTrigger render={<div />}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditValue(screen.name);
              setIsEditing(true);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
              isSelected
                ? "bg-blue-500/15 border border-blue-500/30"
                : "bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12]"
            }`}
          >
            {/* Step number */}
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold ${
                isSelected
                  ? "bg-blue-500 text-white"
                  : "bg-white/[0.08] text-white/40"
              }`}
            >
              {index + 1}
            </div>

            {/* Name or edit input */}
            {isEditing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitRename();
                  }
                  if (e.key === "Escape") {
                    setEditValue(screen.name);
                    setIsEditing(false);
                  }
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-medium text-white bg-transparent outline-none border-b border-blue-500 px-0 py-0 w-[80px]"
              />
            ) : (
              <span
                className={`text-[11px] font-medium ${
                  isSelected ? "text-blue-300" : "text-white/50"
                }`}
              >
                {screen.name}
              </span>
            )}

            {/* Badges */}
            {isFirst && (
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                START
              </span>
            )}
            {isLast && (
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">
                END
              </span>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="min-w-[180px] bg-[#1a1a1e] border-white/[0.1] rounded-xl shadow-2xl p-1">
          <ContextMenuItem
            onClick={() => {
              setEditValue(screen.name);
              setIsEditing(true);
            }}
            className="text-white/80 focus:bg-white/[0.08] focus:text-white"
          >
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={onSettings}
            className="text-white/80 focus:bg-white/[0.08] focus:text-white"
          >
            <Settings2 size={14} className="mr-2 text-white/40" />
            Step Settings
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-white/[0.08]" />
          <ContextMenuItem
            onClick={onDuplicate}
            className="text-white/80 focus:bg-white/[0.08] focus:text-white"
          >
            <Copy size={14} className="mr-2 text-white/40" />
            Duplicate Step
          </ContextMenuItem>
          <ContextMenuSeparator className="bg-white/[0.08]" />
          <ContextMenuItem
            onClick={onDelete}
            disabled={!canDelete}
            className="text-red-400 focus:bg-red-500/10 focus:text-red-400 disabled:text-white/20"
          >
            <Trash2 size={14} className="mr-2" />
            Delete Step
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   INTERACTIVE DEVICE FRAME
   
   A DeviceFrame that renders a screen's components and lets
   you click on them to select. Each component is wrapped in
   a selectable container.
   ════════════════════════════════════════════════════════════ */

function InteractiveDeviceFrame({
  device,
  orientation,
  frame,
  screen,
  screenIndex,
  selectedComponentId,
  onSelectComponent,
  progressBar,
}: {
  device: DevicePreset;
  orientation: Orientation;
  frame: ReturnType<typeof getFrameDimensions>;
  screen: Screen;
  screenIndex: number;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  progressBar: React.ReactNode;
}) {
  const isLandscape = orientation === "landscape";
  const spec = device.frame;
  const sortedComponents = useMemo(
    () => [...screen.components].sort((a, b) => a.order - b.order),
    [screen.components],
  );

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
      {/* Side buttons */}
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

      {/* Home button (old iPhones) */}
      {spec.hasHomeButton && !isLandscape && (
        <>
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
        </>
      )}

      {/* Screen content */}
      <div
        className="w-full h-full overflow-hidden flex flex-col relative"
        style={{ borderRadius: frame.innerRadius, backgroundColor: "#fff" }}
      >
        {/* Status bar */}
        <MiniStatusBar device={device} spec={spec} isLandscape={isLandscape} />

        {/* Scrollable content area with interactive components */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            backgroundColor: screen.style?.backgroundColor || "#FFFFFF",
            padding: screen.style?.padding || 24,
            cursor: "default",
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {sortedComponents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-2">
                <Smartphone size={16} className="text-gray-300" />
              </div>
              <p className="text-[11px] font-medium text-gray-400">
                No content blocks
              </p>
              <p className="text-[9px] text-gray-300 mt-0.5">
                Add from the sidebar
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedComponents.map((comp) => (
                <div
                  key={comp.id}
                  data-component-item
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectComponent(comp.id);
                  }}
                >
                  <AnimatedWrapper
                    componentId={comp.id}
                    animation={comp.animation}
                    screenIndex={screenIndex}
                  >
                    <PhonePreviewComponent
                      component={comp}
                      isSelected={comp.id === selectedComponentId}
                      onSelect={() => onSelectComponent(comp.id)}
                    />
                  </AnimatedWrapper>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {progressBar}

        {/* Home indicator */}
        {!spec.hasHomeButton && spec.homeIndicatorHeight > 0 && (
          <div
            className="flex items-center justify-center shrink-0 bg-white"
            style={{ height: spec.homeIndicatorHeight }}
          >
            <div
              className="bg-black/20 rounded-full"
              style={{
                width: isLandscape
                  ? Math.min(200, frame.viewportWidth * 0.15)
                  : 134,
                height: 5,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Compact status bar ────────────────────────────────── */
function MiniStatusBar({
  device,
  spec,
  isLandscape,
}: {
  device: DevicePreset;
  spec: DevicePreset["frame"];
  isLandscape: boolean;
}) {
  if (spec.statusBarHeight === 0) return null;

  if (spec.notch === "dynamic-island") {
    return (
      <div
        className="relative flex items-end justify-between px-8 shrink-0"
        style={{ height: spec.statusBarHeight }}
      >
        <span className="text-[15px] font-semibold text-black tracking-tight pb-2">
          9:41
        </span>
        <div
          className="absolute left-1/2 -translate-x-1/2 bg-black rounded-full"
          style={{ top: 12, width: 120, height: 34 }}
        />
        <div className="pb-2">
          <StatusIcons />
        </div>
      </div>
    );
  }

  if (spec.notch === "notch") {
    return (
      <div
        className="relative flex items-end justify-between px-6 shrink-0"
        style={{ height: spec.statusBarHeight }}
      >
        <span className="text-[15px] font-semibold text-black tracking-tight pb-1">
          9:41
        </span>
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <svg width="164" height="32" viewBox="0 0 164 32" fill="none">
            <path
              d="M0 0H50C50 0 50 0 54 4C58 8 60 12 64 16C68 20 72 24 82 24C92 24 96 20 100 16C104 12 106 8 110 4C114 0 114 0 114 0H164V0H0Z"
              fill="black"
            />
            <rect x="50" y="0" width="64" height="4" fill="black" />
          </svg>
        </div>
        <div className="pb-1">
          <StatusIcons />
        </div>
      </div>
    );
  }

  // Default / punch-hole / home button
  return (
    <div
      className="flex items-center justify-between px-5 shrink-0"
      style={{ height: spec.statusBarHeight }}
    >
      <span className="text-[12px] font-semibold text-black">9:41</span>
      <StatusIcons />
    </div>
  );
}

function StatusIcons() {
  return (
    <div className="flex items-center gap-1" style={{ transform: "scale(0.8)", transformOrigin: "right center" }}>
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