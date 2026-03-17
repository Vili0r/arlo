"use client";

import React from "react";
import { Undo2, Redo2, Save, Upload, Loader2, Check, Circle } from "lucide-react";

type SaveState = "idle" | "saving" | "saved" | "error";

interface SaveToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  saveState: SaveState;
  onUndo: () => void;
  onRedo: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  historyLength: number;
}

export function SaveToolbar({
  canUndo,
  canRedo,
  isDirty,
  saveState,
  onUndo,
  onRedo,
  onSaveDraft,
  onPublish,
  historyLength,
}: SaveToolbarProps) {
  return (
    <div className="flex items-center gap-1.5">
      {/* Undo / Redo cluster */}
      <div className="flex items-center bg-white/[0.04] border border-white/[0.1] backdrop-blur-md rounded-lg overflow-hidden transition-colors">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (⌘Z)"
          className="px-2 py-1.5 text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Undo2 size={14} />
        </button>
        <div className="w-px h-4 bg-white/[0.08]" />
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (⌘⇧Z)"
          className="px-2 py-1.5 text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Redo2 size={14} />
        </button>
      </div>

      {/* Dirty indicator */}
      <div className="flex items-center gap-1.5 px-2">
        {isDirty ? (
          <Circle size={6} className="text-amber-400 fill-amber-400" />
        ) : (
          <Check size={10} className="text-emerald-400" />
        )}
        <span className="text-[10px] text-white/40 font-medium">
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "Saved"
              : saveState === "error"
                ? "Save failed"
                : isDirty
                  ? "Unsaved changes"
                  : "Up to date"}
        </span>
      </div>

      {/* Save Draft */}
      <button
        onClick={onSaveDraft}
        disabled={!isDirty || saveState === "saving"}
        title="Save Draft (⌘S)"
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg border border-white/[0.1] backdrop-blur-md transition-colors cursor-pointer"
      >
        {saveState === "saving" ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Save size={13} />
        )}
        Save Draft
      </button>

      {/* Publish */}
      <button
        onClick={onPublish}
        disabled={saveState === "saving"}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-black hover:bg-white/90 rounded-lg transition-colors cursor-pointer"
      >
        <Upload size={13} />
        Publish
      </button>
    </div>
  );
}