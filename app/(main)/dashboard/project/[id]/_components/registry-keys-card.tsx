"use client";

import { useState, useTransition } from "react";
import { AppWindow, ArrowRight, Copy, Plus, Puzzle, Trash2 } from "lucide-react";
import { createRegistryKey, deleteRegistryKey } from "@/app/(main)/dashboard/project/[id]/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RegistryKeyData {
  id: string;
  key: string;
  type: "SCREEN" | "COMPONENT";
  description: string | null;
  createdAt: string;
}

interface RegistryKeysCardProps {
  projectId: string;
  registryKeys: RegistryKeyData[];
}

export function RegistryKeysCard({
  projectId,
  registryKeys,
}: RegistryKeysCardProps) {
  const [listOpen, setListOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"SCREEN" | "COMPONENT">("SCREEN");
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!key.trim()) return;

    startTransition(async () => {
      try {
        await createRegistryKey(projectId, {
          key,
          type,
          description,
        });
        setDialogOpen(false);
        setKey("");
        setDescription("");
        setType("SCREEN");
      } catch (error) {
        console.error(error);
      }
    });
  };

  const handleDelete = (registryKeyId: string) => {
    startTransition(async () => {
      try {
        await deleteRegistryKey(projectId, registryKeyId);
      } catch (error) {
        console.error(error);
      }
    });
  };

  const screenKeys = registryKeys.filter((entry) => entry.type === "SCREEN").length;

  return (
    <>
      <section
        onClick={() => setListOpen(true)}
        className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.15] transition-all duration-200 group hover:bg-white/[0.04] cursor-pointer"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Registry Keys</h3>
          <span className="p-1.5 rounded-lg text-[#444] group-hover:text-white transition-colors">
            <ArrowRight size={14} />
          </span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#1f1f1f] flex items-center justify-center">
            <Puzzle size={16} className="text-fuchsia-400/80" />
          </div>
          <div>
            <span className="text-xl font-bold text-white leading-none">
              {registryKeys.length}
            </span>
            <span className="text-xs text-[#555] ml-1.5">native extension keys</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0a0a] border border-[#1f1f1f] text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
            <span className="text-[#888]">{screenKeys} Screens</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0a0a] border border-[#1f1f1f] text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-[#888]">{registryKeys.length - screenKeys} Components</span>
          </span>
        </div>
      </section>

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="bg-[#141414] border border-[#1f1f1f] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registry Keys</DialogTitle>
            <DialogDescription>
              Document the native screens and components your host app registers so builders can reference them safely.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {registryKeys.length === 0 ? (
              <div className="text-center py-8">
                <Puzzle size={20} className="mx-auto text-[#333] mb-3" />
                <p className="text-sm text-[#555]">No registry keys yet</p>
                <p className="text-xs text-[#333] mt-1">
                  Add keys like <code className="font-mono">paywall_v1</code> or <code className="font-mono">native_benefits_card</code>.
                </p>
              </div>
            ) : (
              registryKeys.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] group/item"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#121212] border border-[#1f1f1f] flex items-center justify-center flex-shrink-0">
                    {entry.type === "SCREEN" ? (
                      <AppWindow size={15} className="text-fuchsia-400/80" />
                    ) : (
                      <Puzzle size={15} className="text-blue-400/80" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-white truncate">
                        {entry.key}
                      </code>
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          entry.type === "SCREEN"
                            ? "bg-fuchsia-400/10 text-fuchsia-400"
                            : "bg-blue-400/10 text-blue-400"
                        }`}
                      >
                        {entry.type === "SCREEN" ? "Screen" : "Component"}
                      </span>
                    </div>
                    {entry.description ? (
                      <p className="text-[11px] text-[#444] mt-1 leading-relaxed">
                        {entry.description}
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#333] mt-1">
                        No description yet
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      navigator.clipboard.writeText(entry.key);
                    }}
                    className="p-1.5 text-[#333] hover:text-[#888] transition-colors"
                    title="Copy registry key"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(entry.id);
                    }}
                    className="p-1.5 text-[#333] hover:text-red-400 transition-colors opacity-0 group-hover/item:opacity-100"
                    title="Delete registry key"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setListOpen(false);
                setDialogOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-[#e5e5e5] transition-colors"
            >
              <Plus size={14} />
              Add Key
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#141414] border border-[#1f1f1f] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Registry Key</DialogTitle>
            <DialogDescription>
              Track the custom keys your mobile app registers so flow authors know which native surfaces exist.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["SCREEN", "COMPONENT"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setType(option)}
                    className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      type === option
                        ? option === "SCREEN"
                          ? "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-400"
                          : "border-blue-400/40 bg-blue-400/10 text-blue-400"
                        : "border-[#1f1f1f] bg-[#0a0a0a] text-[#555] hover:text-[#888] hover:border-[#333]"
                    }`}
                  >
                    {option === "SCREEN" ? "Screen" : "Component"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                Registry Key
              </label>
              <input
                value={key}
                onChange={(event) => setKey(event.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, ""))}
                placeholder={type === "SCREEN" ? "e.g. paywall_v1" : "e.g. native_benefits_card"}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] text-sm text-white font-mono placeholder:text-[#333] focus:outline-none focus:border-[#333]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                Description
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional notes for builders about what this native screen or component does."
                className="w-full min-h-[96px] px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#333] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 text-sm text-[#555] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isPending || !key.trim()}
              className="px-5 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-[#e5e5e5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving..." : "Add Key"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
