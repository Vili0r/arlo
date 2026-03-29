"use client";

import { useEffect } from "react";

interface ShortcutHandlers {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onNudge?: (direction: "left" | "right" | "up" | "down", amount: number) => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onZoomToFit?: () => void;
  onZoomToActual?: () => void;
  onSetToolMode?: (mode: "select" | "hand" | "text" | "frame" | "rectangle") => void;
}

/**
 * Registers Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo), Cmd/Ctrl+S (save).
 */
export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onSave,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onSelectAll,
  onGroup,
  onUngroup,
  onNudge,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onZoomToFit,
  onZoomToActual,
  onSetToolMode,
}: ShortcutHandlers) {
  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
      );
    };

    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const editableTarget = isEditableTarget(e.target);

      if (
        !mod &&
        !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
      ) {
        if (!editableTarget && onSetToolMode) {
          const lower = e.key.toLowerCase();
          if (lower === "v") onSetToolMode("select");
          else if (lower === "h") onSetToolMode("hand");
          else if (lower === "t") onSetToolMode("text");
          else if (lower === "f") onSetToolMode("frame");
          else if (lower === "r") onSetToolMode("rectangle");
        }
        return;
      }

      if (editableTarget && !(mod && e.key.toLowerCase() === "s")) return;

      const key = e.key.toLowerCase();

      if (key === "z" && !e.shiftKey && mod) {
        e.preventDefault();
        onUndo();
      } else if (((key === "z" && e.shiftKey) || key === "y") && mod) {
        e.preventDefault();
        onRedo();
      } else if (key === "s" && mod) {
        e.preventDefault();
        onSave();
      } else if (key === "c" && mod && onCopy) {
        e.preventDefault();
        onCopy();
      } else if (key === "v" && mod && onPaste) {
        e.preventDefault();
        onPaste();
      } else if (key === "a" && mod && onSelectAll) {
        e.preventDefault();
        onSelectAll();
      } else if (key === "d" && mod && onDuplicate) {
        e.preventDefault();
        onDuplicate();
      } else if (key === "g" && mod && e.shiftKey && onUngroup) {
        e.preventDefault();
        onUngroup();
      } else if (key === "g" && mod && onGroup) {
        e.preventDefault();
        onGroup();
      } else if (key === "]" && mod && e.shiftKey && onBringToFront) {
        e.preventDefault();
        onBringToFront();
      } else if (key === "]" && mod && onBringForward) {
        e.preventDefault();
        onBringForward();
      } else if (key === "[" && mod && e.shiftKey && onSendToBack) {
        e.preventDefault();
        onSendToBack();
      } else if (key === "[" && mod && onSendBackward) {
        e.preventDefault();
        onSendBackward();
      } else if (key === "1" && e.shiftKey && onZoomToFit) {
        e.preventDefault();
        onZoomToFit();
      } else if (key === "0" && e.shiftKey && onZoomToActual) {
        e.preventDefault();
        onZoomToActual();
      } else if ((key === "backspace" || key === "delete") && onDelete) {
        e.preventDefault();
        onDelete();
      } else if (key.startsWith("arrow") && onNudge) {
        e.preventDefault();
        const direction =
          key === "arrowleft"
            ? "left"
            : key === "arrowright"
              ? "right"
              : key === "arrowup"
                ? "up"
                : "down";
        onNudge(direction, e.shiftKey ? 10 : 1);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    onBringForward,
    onBringToFront,
    onCopy,
    onDelete,
    onDuplicate,
    onGroup,
    onNudge,
    onPaste,
    onRedo,
    onSave,
    onSelectAll,
    onSendBackward,
    onSendToBack,
    onSetToolMode,
    onUndo,
    onUngroup,
    onZoomToActual,
    onZoomToFit,
  ]);
}
