"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";

import type { EditorLayoutMode } from "../_lib/editor-document";

export function ScreenDropSurface({
  dropId,
  screenIndex,
  layoutMode,
  artboard,
  className,
  style,
  onDoubleClickEmpty,
  onPointerDownEmpty,
  children,
}: {
  dropId: string;
  screenIndex: number;
  layoutMode: EditorLayoutMode;
  artboard: {
    width: number;
    height: number;
  };
  className?: string;
  style?: React.CSSProperties;
  onDoubleClickEmpty?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onPointerDownEmpty?: (event: React.PointerEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: dropId,
    data: {
      dropType: "artboard",
      screenIndex,
      layoutMode,
      artboard,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={style}
      onPointerDown={(event) => {
        const target = event.target as HTMLElement;
        if (
          event.target === event.currentTarget ||
          target.closest("[data-screen-empty-state='true']")
        ) {
          onPointerDownEmpty?.(event);
        }
      }}
      onDoubleClick={(event) => {
        const target = event.target as HTMLElement;
        if (
          event.target === event.currentTarget ||
          target.closest("[data-screen-empty-state='true']")
        ) {
          onDoubleClickEmpty?.(event);
        }
      }}
    >
      {children}
      {isOver ? (
        <div className="pointer-events-none absolute inset-0 rounded-[24px] border border-blue-400/45 bg-blue-500/8 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.25)]" />
      ) : null}
    </div>
  );
}
