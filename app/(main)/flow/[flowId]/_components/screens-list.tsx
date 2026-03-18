"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  GripVertical,
  Layers,
  MoreHorizontal,
  Pencil,
  Copy,
  ClipboardPaste,
  CopyPlus,
  Paintbrush,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  MeasuringStrategy,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Screen, FlowComponent } from "@/lib/types";
import { COMPONENT_TYPES } from "../_lib/constants";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
export interface ComponentActions {
  onDuplicate: (componentId: string) => void;
  onCopy: (componentId: string) => void;
  onPaste: (screenIndex: number) => void;
  onCopyStyles: (componentId: string) => void;
  onPasteStyles: (componentId: string) => void;
  onDelete: (componentId: string) => void;
  hasCopied: boolean;
  hasCopiedStyles: boolean;
}

export interface ScreenActions {
  onRename: (screenIndex: number) => void;
  onDuplicate: (screenIndex: number) => void;
  onDelete: (screenIndex: number) => void;
}

/* ═══════════════════════════════════════════════════════════
   DROP INDICATOR
   ═══════════════════════════════════════════════════════════ */
function DropIndicator() {
  return (
    <div className="relative h-0.5 mx-1 my-[-1px] z-10">
      <div className="absolute inset-x-0 h-0.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
      <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.6)]" />
      <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.6)]" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED MENU ITEMS — used by both ContextMenu and DropdownMenu
   ═══════════════════════════════════════════════════════════ */
function ComponentMenuItems({
  componentId,
  screenIndex,
  actions,
  MenuItem,
  MenuSeparator,
  MenuShortcut,
}: {
  componentId: string;
  screenIndex: number;
  actions: ComponentActions;
  MenuItem: typeof ContextMenuItem | typeof DropdownMenuItem;
  MenuSeparator: typeof ContextMenuSeparator | typeof DropdownMenuSeparator;
  MenuShortcut: typeof ContextMenuShortcut | typeof DropdownMenuShortcut;
}) {
  return (
    <>
      <MenuItem
        onClick={() => actions.onCopy(componentId)}
        className="text-white/80 focus:bg-white/[0.08] focus:text-white"
      >
        <Copy size={14} className="mr-2 text-white/40" />
        Copy layer
        <MenuShortcut>⌘C</MenuShortcut>
      </MenuItem>
      <MenuItem
        onClick={() => actions.onPaste(screenIndex)}
        disabled={!actions.hasCopied}
        className="text-white/80 focus:bg-white/[0.08] focus:text-white disabled:text-white/20"
      >
        <ClipboardPaste size={14} className="mr-2 text-white/40" />
        Paste layer
        <MenuShortcut>⌘V</MenuShortcut>
      </MenuItem>
      <MenuItem
        onClick={() => actions.onDuplicate(componentId)}
        className="text-white/80 focus:bg-white/[0.08] focus:text-white"
      >
        <CopyPlus size={14} className="mr-2 text-white/40" />
        Duplicate layer
        <MenuShortcut>⌘D</MenuShortcut>
      </MenuItem>

      <MenuSeparator className="bg-white/[0.08]" />

      <MenuItem
        onClick={() => actions.onCopyStyles(componentId)}
        className="text-white/80 focus:bg-white/[0.08] focus:text-white"
      >
        <Paintbrush size={14} className="mr-2 text-white/40" />
        Copy styles
        <MenuShortcut>⌘⌥C</MenuShortcut>
      </MenuItem>
      <MenuItem
        onClick={() => actions.onPasteStyles(componentId)}
        disabled={!actions.hasCopiedStyles}
        className="text-white/80 focus:bg-white/[0.08] focus:text-white disabled:text-white/20"
      >
        <Paintbrush size={14} className="mr-2 text-white/40" />
        Paste styles
        <MenuShortcut>⌘⌥V</MenuShortcut>
      </MenuItem>

      <MenuSeparator className="bg-white/[0.08]" />

      <MenuItem
        onClick={() => actions.onDelete(componentId)}
        className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
      >
        <Trash2 size={14} className="mr-2" />
        Delete
        <MenuShortcut>⌘⌫</MenuShortcut>
      </MenuItem>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN MENU ITEMS — used by both ContextMenu and DropdownMenu
   ═══════════════════════════════════════════════════════════ */
function ScreenMenuItems({
  screenIndex,
  actions,
  canDelete,
  MenuItem,
  MenuSeparator,
  MenuShortcut,
}: {
  screenIndex: number;
  actions: ScreenActions;
  canDelete: boolean;
  MenuItem: typeof ContextMenuItem | typeof DropdownMenuItem;
  MenuSeparator: typeof ContextMenuSeparator | typeof DropdownMenuSeparator;
  MenuShortcut: typeof ContextMenuShortcut | typeof DropdownMenuShortcut;
}) {
  return (
    <>
      <MenuItem
        onClick={() => actions.onRename(screenIndex)}
        className="text-white/80 focus:bg-white/[0.08] focus:text-white"
      >
        <Pencil size={14} className="mr-2 text-white/40" />
        Rename
        <MenuShortcut>↵</MenuShortcut>
      </MenuItem>

      <MenuSeparator className="bg-white/[0.08]" />

      <MenuItem
        onClick={() => actions.onDuplicate(screenIndex)}
        className="text-white/80 focus:bg-white/[0.08] focus:text-white"
      >
        <CopyPlus size={14} className="mr-2 text-white/40" />
        Duplicate screen
        <MenuShortcut>⌘D</MenuShortcut>
      </MenuItem>

      <MenuSeparator className="bg-white/[0.08]" />

      <MenuItem
        onClick={() => actions.onDelete(screenIndex)}
        disabled={!canDelete}
        className="text-red-400 focus:bg-red-500/10 focus:text-red-400 disabled:text-white/20"
      >
        <Trash2 size={14} className="mr-2" />
        Delete
        <MenuShortcut>⌘⌫</MenuShortcut>
      </MenuItem>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SORTABLE SCREEN ROW
   ═══════════════════════════════════════════════════════════ */
function SortableScreenRow({
  screen,
  index,
  isSelected,
  isOverBefore,
  isOverAfter,
  selectedComponentId,
  onSelect,
  onSelectComponent,
  onReorderComponents,
  componentActions,
  screenActions,
  canDeleteScreen,
  onRenameScreen,
}: {
  screen: Screen;
  index: number;
  isSelected: boolean;
  isOverBefore: boolean;
  isOverAfter: boolean;
  selectedComponentId: string | null;
  onSelect: () => void;
  onSelectComponent: (id: string | null) => void;
  onReorderComponents: (screenIndex: number, fromIndex: number, toIndex: number) => void;
  componentActions: ComponentActions;
  screenActions: ScreenActions;
  canDeleteScreen: boolean;
  onRenameScreen: (screenIndex: number, newName: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(screen.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: screen.id,
    data: { type: "screen", index },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : ("auto" as const),
  };

  const sortedComponents = useMemo(
    () => [...screen.components].sort((a, b) => a.order - b.order),
    [screen.components],
  );

  const menuContentClass =
    "min-w-[200px] bg-[#1a1a1e] border-white/[0.1] rounded-xl shadow-2xl p-1";

  const startEditing = useCallback(() => {
    setEditValue(screen.name);
    setIsEditing(true);
  }, [screen.name]);

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== screen.name) {
      onRenameScreen(index, trimmed);
    }
    setIsEditing(false);
  }, [editValue, screen.name, index, onRenameScreen]);

  const cancelEditing = useCallback(() => {
    setEditValue(screen.name);
    setIsEditing(false);
  }, [screen.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  /* Override screenActions.onRename to trigger inline editing */
  const localScreenActions: ScreenActions = useMemo(
    () => ({
      ...screenActions,
      onRename: () => {
        onSelect();
        onSelectComponent(null);
        startEditing();
      },
    }),
    [screenActions, onSelect, onSelectComponent, startEditing],
  );

  return (
    <div ref={setNodeRef} style={style}>
      {isOverBefore && <DropIndicator />}

      <ContextMenu>
        <ContextMenuTrigger render={<div />}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!isEditing) {
                onSelect();
                onSelectComponent(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!isEditing) {
                  onSelect();
                  onSelectComponent(null);
                }
              }
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors group ${
              isSelected && !selectedComponentId
                ? "bg-white/[0.08] text-white"
                : "text-white/50 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing shrink-0 p-0.5 -m-0.5 rounded hover:bg-white/[0.06] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={12} className="text-white/20" />
            </div>
            <Layers size={13} className="shrink-0" />

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
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    cancelEditing();
                  }
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-medium truncate bg-white/[0.08] text-white rounded px-1.5 py-0.5 -my-0.5 outline-none ring-1 ring-blue-500/60 focus:ring-blue-500 w-full min-w-0"
              />
            ) : (
              <span className="text-xs font-medium truncate">{screen.name}</span>
            )}

            {!isEditing && (
              <>
                <span className="text-[10px] text-white/30 ml-auto mr-1">{screen.components.length}</span>

                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      nativeButton={false}
                      render={
                        <div
                          className={`p-0.5 rounded transition-colors cursor-pointer ${
                            isSelected && !selectedComponentId
                              ? "text-white/30 hover:text-white/60 hover:bg-white/[0.08]"
                              : "text-transparent group-hover:text-white/20 hover:!text-white/50 hover:bg-white/[0.06]"
                          }`}
                        />
                      }
                    >
                      <MoreHorizontal size={12} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="right"
                      sideOffset={8}
                      className={menuContentClass}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <ScreenMenuItems
                        screenIndex={index}
                        actions={localScreenActions}
                        canDelete={canDeleteScreen}
                        MenuItem={DropdownMenuItem}
                        MenuSeparator={DropdownMenuSeparator}
                        MenuShortcut={DropdownMenuShortcut}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent
          className={menuContentClass}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ScreenMenuItems
            screenIndex={index}
            actions={localScreenActions}
            canDelete={canDeleteScreen}
            MenuItem={ContextMenuItem}
            MenuSeparator={ContextMenuSeparator}
            MenuShortcut={ContextMenuShortcut}
          />
        </ContextMenuContent>
      </ContextMenu>

      {isSelected && sortedComponents.length > 0 && (
        <ComponentList
          components={sortedComponents}
          screenIndex={index}
          selectedComponentId={selectedComponentId}
          onSelectComponent={onSelectComponent}
          onReorder={onReorderComponents}
          componentActions={componentActions}
        />
      )}
      {isOverAfter && <DropIndicator />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SORTABLE COMPONENT ROW
   ═══════════════════════════════════════════════════════════ */
function SortableComponentRow({
  component,
  screenIndex,
  isSelected,
  isOverBefore,
  isOverAfter,
  onSelect,
  actions,
}: {
  component: FlowComponent;
  screenIndex: number;
  isSelected: boolean;
  isOverBefore: boolean;
  isOverAfter: boolean;
  onSelect: () => void;
  actions: ComponentActions;
}) {
  const meta = COMPONENT_TYPES.find((c) => c.type === component.type);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: component.id,
    data: { type: "component" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : ("auto" as const),
  };

  const menuContentClass =
    "min-w-[200px] bg-[#1a1a1e] border-white/[0.1] rounded-xl shadow-2xl p-1";

  return (
    <div ref={setNodeRef} style={style}>
      {isOverBefore && <DropIndicator />}

      <ContextMenu>
        <ContextMenuTrigger
          render={<div />}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors group cursor-default ${
              isSelected
                ? "bg-white/[0.10] text-white"
                : "text-white/70 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing shrink-0 p-0.5 -m-0.5 rounded hover:bg-white/[0.06] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={12} className="text-white/20" />
            </div>
            {meta && <meta.icon size={11} className="shrink-0 opacity-50" />}
            <span className="text-[11px] truncate">{meta?.label || component.type}</span>

            <div className="ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  nativeButton={false}
                  render={
                    <div
                      className={`p-0.5 rounded transition-colors cursor-pointer ${
                        isSelected
                          ? "text-white/30 hover:text-white/60 hover:bg-white/[0.08]"
                          : "text-transparent group-hover:text-white/20 hover:!text-white/50 hover:bg-white/[0.06]"
                      }`}
                    />
                  }
                >
                  <MoreHorizontal size={12} />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="right"
                  sideOffset={8}
                  className={menuContentClass}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <ComponentMenuItems
                    componentId={component.id}
                    screenIndex={screenIndex}
                    actions={actions}
                    MenuItem={DropdownMenuItem}
                    MenuSeparator={DropdownMenuSeparator}
                    MenuShortcut={DropdownMenuShortcut}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent
          className={menuContentClass}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ComponentMenuItems
            componentId={component.id}
            screenIndex={screenIndex}
            actions={actions}
            MenuItem={ContextMenuItem}
            MenuSeparator={ContextMenuSeparator}
            MenuShortcut={ContextMenuShortcut}
          />
        </ContextMenuContent>
      </ContextMenu>

      {isOverAfter && <DropIndicator />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT LIST — nested DnD context
   ═══════════════════════════════════════════════════════════ */
function ComponentList({
  components,
  screenIndex,
  selectedComponentId,
  onSelectComponent,
  onReorder,
  componentActions,
}: {
  components: FlowComponent[];
  screenIndex: number;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onReorder: (screenIndex: number, fromIndex: number, toIndex: number) => void;
  componentActions: ComponentActions;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const ids = useMemo(() => components.map((c) => c.id), [components]);

  const activeIndex = activeId ? ids.indexOf(activeId) : -1;
  const overIndex = overId ? ids.indexOf(overId) : -1;

  const overSide: "before" | "after" =
    activeIndex !== -1 && overIndex !== -1 && activeIndex < overIndex
      ? "after"
      : "before";

  const activeComponent = activeId ? components.find((c) => c.id === activeId) : null;
  const activeMeta = activeComponent
    ? COMPONENT_TYPES.find((c) => c.type === activeComponent.type)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const id = event.over?.id as string | undefined;
    setOverId(id && id !== activeId ? id : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    onReorder(screenIndex, oldIndex, newIndex);
  }

  function handleDragCancel() {
    setActiveId(null);
    setOverId(null);
  }

  return (
    <div className="ml-5 pl-3 border-l border-white/[0.08] mt-0.5 mb-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {components.map((comp) => (
            <SortableComponentRow
              key={comp.id}
              component={comp}
              screenIndex={screenIndex}
              isSelected={selectedComponentId === comp.id}
              isOverBefore={overId === comp.id && overSide === "before"}
              isOverAfter={overId === comp.id && overSide === "after"}
              onSelect={() => onSelectComponent(comp.id)}
              actions={componentActions}
            />
          ))}
        </SortableContext>

        <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
          {activeComponent && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-white/[0.12] text-white border border-white/[0.15] backdrop-blur-md shadow-xl">
              <GripVertical size={12} className="text-white/30" />
              {activeMeta && <activeMeta.icon size={11} className="shrink-0 opacity-60" />}
              <span className="text-[11px] truncate">
                {activeMeta?.label || activeComponent.type}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREENS LIST — top-level DnD context
   ═══════════════════════════════════════════════════════════ */
export function ScreensList({
  screens,
  selectedIndex,
  onSelect,
  selectedComponentId,
  onSelectComponent,
  onDeleteScreen,
  onRenameScreen,
  onDuplicateScreen,
  onReorderScreens,
  onReorderComponents,
  componentActions,
}: {
  screens: Screen[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onDeleteScreen: (i: number) => void;
  onRenameScreen: (i: number, newName: string) => void;
  onDuplicateScreen: (i: number) => void;
  onReorderScreens: (fromIndex: number, toIndex: number) => void;
  onReorderComponents: (screenIndex: number, fromIndex: number, toIndex: number) => void;
  componentActions: ComponentActions;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const screenIds = useMemo(() => screens.map((s) => s.id), [screens]);

  const activeIndex = activeId ? screenIds.indexOf(activeId) : -1;
  const overIndex = overId ? screenIds.indexOf(overId) : -1;

  const overSide: "before" | "after" =
    activeIndex !== -1 && overIndex !== -1 && activeIndex < overIndex
      ? "after"
      : "before";

  const activeScreen = activeId ? screens.find((s) => s.id === activeId) : null;

  const screenActions: ScreenActions = useMemo(
    () => ({
      onRename: () => {},
      onDuplicate: onDuplicateScreen,
      onDelete: onDeleteScreen,
    }),
    [onDuplicateScreen, onDeleteScreen],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const id = event.over?.id as string | undefined;
    const isScreen = event.over?.data.current?.type === "screen";
    setOverId(id && isScreen && id !== activeId ? id : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;
    if (active.data.current?.type !== "screen" || over.data.current?.type !== "screen") return;

    const oldIndex = screenIds.indexOf(active.id as string);
    const newIndex = screenIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    onReorderScreens(oldIndex, newIndex);
  }

  function handleDragCancel() {
    setActiveId(null);
    setOverId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <SortableContext items={screenIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1">
          {screens.map((screen, index) => (
            <SortableScreenRow
              key={screen.id}
              screen={screen}
              index={index}
              isSelected={selectedIndex === index}
              isOverBefore={overId === screen.id && overSide === "before"}
              isOverAfter={overId === screen.id && overSide === "after"}
              selectedComponentId={selectedComponentId}
              onSelect={() => onSelect(index)}
              onSelectComponent={onSelectComponent}
              onReorderComponents={onReorderComponents}
              componentActions={componentActions}
              screenActions={screenActions}
              canDeleteScreen={screens.length > 1}
              onRenameScreen={onRenameScreen}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeScreen && (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.12] text-white border border-white/[0.15] backdrop-blur-md shadow-xl">
            <GripVertical size={12} className="text-white/30" />
            <Layers size={13} />
            <span className="text-xs font-medium">{activeScreen.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}