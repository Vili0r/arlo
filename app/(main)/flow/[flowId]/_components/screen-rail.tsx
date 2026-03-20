"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Plus,
  Trash2,
  Copy,
  MoreHorizontal,
  GripVertical,
  Pencil,
  ChevronRight,
  Settings2,
  Smartphone,
  Image,
  Type,
  Square,
  Play,
  MousePointerClick,
  Star,
  Rows3,
  LayoutGrid,
  CheckCircle,
  Award,
  Sliders,
  ToggleLeft,
  List,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Screen, FlowComponent } from "@/lib/types";

/* ─────────────────────────────────────────────
   ICON MAP — maps component type to a preview icon
   ───────────────────────────────────────────── */

const COMPONENT_ICON_MAP: Record<string, React.ElementType> = {
  TEXT: Type,
  IMAGE: Image,
  VIDEO: Play,
  ICON_LIBRARY: Star,
  BUTTON: MousePointerClick,
  TEXT_INPUT: ToggleLeft,
  SINGLE_SELECT: List,
  MULTI_SELECT: LayoutGrid,
  SLIDER: Sliders,
  STACK: Rows3,
  FOOTER: Square,
  TAB_BUTTON: LayoutGrid,
  CAROUSEL: Image,
  SOCIAL_PROOF: Star,
  FEATURE_LIST: CheckCircle,
  AWARD: Award,
};

/* ─────────────────────────────────────────────
   MINI SCREEN PREVIEW — renders a tiny visual
   representation of the screen's components
   ───────────────────────────────────────────── */

function MiniScreenPreview({
  screen,
  isSelected,
}: {
  screen: Screen;
  isSelected: boolean;
}) {
  const bgColor = screen.style?.backgroundColor || "#FFFFFF";
  const components = [...screen.components].sort((a, b) => a.order - b.order);

  return (
    <div
      className="w-full aspect-[9/16] rounded-md overflow-hidden border transition-all"
      style={{
        backgroundColor: bgColor,
        borderColor: isSelected ? "rgba(124, 101, 246, 0.6)" : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="w-full h-full flex flex-col p-1.5 gap-0.5">
        {/* Fake status bar */}
        <div className="flex items-center justify-between px-1 mb-0.5">
          <div className="w-4 h-0.5 rounded-full bg-black/20" />
          <div className="w-6 h-1.5 rounded-full bg-black/30" />
          <div className="w-3 h-0.5 rounded-full bg-black/20" />
        </div>

        {components.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Smartphone size={10} className="text-gray-300" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-[2px] overflow-hidden">
            {components.slice(0, 6).map((comp) => (
              <MiniComponentBlock key={comp.id} component={comp} screenBg={bgColor} />
            ))}
            {components.length > 6 && (
              <div className="text-[4px] text-center text-gray-400">
                +{components.length - 6}
              </div>
            )}
          </div>
        )}

        {/* Fake home indicator */}
        <div className="flex justify-center mt-auto pt-0.5">
          <div className="w-6 h-0.5 rounded-full bg-black/15" />
        </div>
      </div>
    </div>
  );
}

/* ─── Tiny component representation ───────── */

function MiniComponentBlock({
  component,
  screenBg,
}: {
  component: FlowComponent;
  screenBg: string;
}) {
  const p = component.props as Record<string, any>;

  // TEXT → show a few small lines
  if (component.type === "TEXT") {
    const fontSize = (p.fontSize || 16) > 20 ? 5 : 3.5;
    const weight = (p.fontWeight === "bold" || p.fontWeight === "semibold") ? 600 : 400;
    return (
      <div className="px-0.5">
        <div
          className="rounded-[1px]"
          style={{
            height: fontSize,
            width: fontSize > 4 ? "75%" : "90%",
            backgroundColor: p.color || "#1A1A1A",
            opacity: 0.6,
            fontWeight: weight,
          }}
        />
      </div>
    );
  }

  // IMAGE / VIDEO → colored rect
  if (component.type === "IMAGE" || component.type === "VIDEO") {
    return (
      <div
        className="rounded-[2px] flex items-center justify-center"
        style={{
          height: 14,
          backgroundColor: component.type === "VIDEO" ? "#111" : "#f0f0f0",
        }}
      >
        {component.type === "VIDEO" ? (
          <Play size={5} className="text-white/50" />
        ) : (
          <Image size={5} className="text-gray-400" />
        )}
      </div>
    );
  }

  // BUTTON → small pill
  if (component.type === "BUTTON") {
    const bg = p.backgroundColor || p.style?.backgroundColor || "#007AFF";
    return (
      <div
        className="rounded-[2px] mx-0.5"
        style={{
          height: 6,
          backgroundColor: bg,
        }}
      />
    );
  }

  // STACK → bordered rect
  if (component.type === "STACK") {
    return (
      <div
        className="rounded-[1px] border border-dashed flex items-center justify-center"
        style={{
          height: 10,
          borderColor: "rgba(0,0,0,0.12)",
          backgroundColor: p.backgroundColor || "rgba(0,0,0,0.02)",
        }}
      >
        <Rows3 size={4} className="text-gray-400" />
      </div>
    );
  }

  // Default → generic block
  const Icon = COMPONENT_ICON_MAP[component.type] || Square;
  return (
    <div className="flex items-center gap-0.5 px-0.5">
      <div className="w-1.5 h-1.5 rounded-[0.5px] bg-gray-300" />
      <div className="flex-1 h-1 rounded-full bg-gray-200" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SORTABLE SCREEN CARD — single screen in the rail
   ════════════════════════════════════════════════════════════ */

function SortableScreenCard({
  screen,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onRename,
  onOpenSettings,
  canDelete,
}: {
  screen: Screen;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onOpenSettings: () => void;
  canDelete: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: screen.id });

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        onClick={onSelect}
        className={`relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
          isSelected
            ? "border-[#7C65F6] bg-[#7C65F6]/5 shadow-[0_0_20px_rgba(124,101,246,0.15)]"
            : "border-transparent hover:border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.04]"
        }`}
      >
        {/* Screen number badge */}
        <div
          className={`absolute top-1.5 left-1.5 z-10 w-4 h-4 rounded-md flex items-center justify-center text-[8px] font-bold ${
            isSelected
              ? "bg-[#7C65F6] text-white"
              : "bg-black/40 text-white/60"
          }`}
        >
          {index + 1}
        </div>

        {/* Drag handle — top right */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 right-1 z-10 p-1 rounded-md text-white/20 hover:text-white/50 hover:bg-white/10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical size={10} />
        </div>

        {/* Thumbnail */}
        <div className="p-1.5 pb-0">
          <MiniScreenPreview screen={screen} isSelected={isSelected} />
        </div>

        {/* Screen name + actions row */}
        <div className="px-2 py-1.5 flex items-center justify-between gap-1">
          <span
            className={`text-[11px] font-medium truncate flex-1 ${
              isSelected ? "text-white/90" : "text-white/50"
            }`}
          >
            {screen.name}
          </span>

          {/* Context menu trigger */}
          <div ref={menuRef} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              className="p-0.5 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={12} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-[#1a1a1c] border border-white/[0.1] rounded-lg shadow-2xl py-1 text-[12px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Pencil size={12} /> Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Copy size={12} /> Duplicate
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSettings();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Settings2 size={12} /> Settings
                </button>
                {canDelete && (
                  <>
                    <div className="h-px bg-white/[0.06] my-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Connection line to next screen */}
        {isSelected && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-px h-3 bg-[#7C65F6]/40" />
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SCREEN RAIL — the full vertical filmstrip
   ════════════════════════════════════════════════════════════ */

export function ScreenRail({
  screens,
  selectedIndex,
  onSelect,
  onAddScreen,
  onDeleteScreen,
  onDuplicateScreen,
  onRenameScreen,
  onReorderScreens,
  onOpenScreenSettings,
}: {
  screens: Screen[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAddScreen: () => void;
  onDeleteScreen: (index: number) => void;
  onDuplicateScreen: (index: number) => void;
  onRenameScreen: (index: number) => void;
  onReorderScreens: (fromIndex: number, toIndex: number) => void;
  onOpenScreenSettings: (index: number) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const fromIndex = screens.findIndex((s) => s.id === active.id);
      const toIndex = screens.findIndex((s) => s.id === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        onReorderScreens(fromIndex, toIndex);
      }
    },
    [screens, onReorderScreens],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-white/70">
            Screens
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.06] text-white/30 font-medium">
            {screens.length}
          </span>
        </div>
      </div>

      {/* Scrollable rail */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1 pb-2 space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={screens.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {screens.map((screen, i) => (
              <SortableScreenCard
                key={screen.id}
                screen={screen}
                index={i}
                isSelected={i === selectedIndex}
                onSelect={() => onSelect(i)}
                onDelete={() => onDeleteScreen(i)}
                onDuplicate={() => onDuplicateScreen(i)}
                onRename={() => onRenameScreen(i)}
                onOpenSettings={() => onOpenScreenSettings(i)}
                canDelete={screens.length > 1}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add screen button */}
      <div className="pt-2 border-t border-white/[0.06] shrink-0">
        <button
          onClick={onAddScreen}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] rounded-lg border border-dashed border-white/[0.1] hover:border-white/[0.2] transition-all"
        >
          <Plus size={12} /> Add screen
        </button>
      </div>
    </div>
  );
}