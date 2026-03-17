"use client";

import { useEffect } from "react";

interface ShortcutHandlers {
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
}

/**
 * Registers Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo), Cmd/Ctrl+S (save).
 */
export function useKeyboardShortcuts({ onUndo, onRedo, onSave }: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        onRedo();
      } else if (e.key === "s") {
        e.preventDefault();
        onSave();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onUndo, onRedo, onSave]);
}