"use client";

import { useState, useTransition } from "react";
import { MapPinned, ArrowRight, Plus, Copy, Trash2 } from "lucide-react";
import { createPlacement, deletePlacement } from "@/app/(main)/dashboard/project/[id]/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FlowOption {
  id: string;
  name: string;
  slug: string;
  status: string;
}

interface PlacementData {
  id: string;
  key: string;
  name: string | null;
  flow: FlowOption;
  createdAt: string;
}

interface PlacementsCardProps {
  projectId: string;
  placements: PlacementData[];
  flows: FlowOption[];
}

export function PlacementsCard({
  projectId,
  placements,
  flows,
}: PlacementsCardProps) {
  const [listOpen, setListOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [flowId, setFlowId] = useState(flows.find((flow) => flow.status === "PUBLISHED")?.id ?? flows[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!key.trim() || !flowId) return;

    startTransition(async () => {
      try {
        await createPlacement(projectId, {
          key,
          name,
          flowId,
        });
        setDialogOpen(false);
        setName("");
        setKey("");
      } catch (error) {
        console.error(error);
      }
    });
  };

  const handleDelete = (placementId: string) => {
    startTransition(async () => {
      try {
        await deletePlacement(projectId, placementId);
      } catch (error) {
        console.error(error);
      }
    });
  };

  const publishedCount = placements.filter((placement) => placement.flow.status === "PUBLISHED").length;

  return (
    <>
      <section
        onClick={() => setListOpen(true)}
        className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.15] transition-all duration-200 group hover:bg-white/[0.04] cursor-pointer"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Placements</h3>
          <span className="p-1.5 rounded-lg text-[#444] group-hover:text-white transition-colors">
            <ArrowRight size={14} />
          </span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#1f1f1f] flex items-center justify-center">
            <MapPinned size={16} className="text-cyan-400/80" />
          </div>
          <div>
            <span className="text-xl font-bold text-white leading-none">
              {placements.length}
            </span>
            <span className="text-xs text-[#555] ml-1.5">live entry points</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0a0a] border border-[#1f1f1f] text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[#888]">{publishedCount} Published</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0a0a] border border-[#1f1f1f] text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#666]" />
            <span className="text-[#888]">{placements.length - publishedCount} Unpublished</span>
          </span>
        </div>
      </section>

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="bg-[#141414] border border-[#1f1f1f] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Placements</DialogTitle>
            <DialogDescription>
              Map SDK placement keys to published flows in your project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {placements.length === 0 ? (
              <div className="text-center py-8">
                <MapPinned size={20} className="mx-auto text-[#333] mb-3" />
                <p className="text-sm text-[#555]">No placements yet</p>
                <p className="text-xs text-[#333] mt-1">
                  Create placements like <code className="font-mono">onboarding_home</code> to resolve flows from your app.
                </p>
              </div>
            ) : (
              placements.map((placement) => (
                <div
                  key={placement.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] group/item"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {placement.name || placement.key}
                      </span>
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          placement.flow.status === "PUBLISHED"
                            ? "bg-emerald-400/10 text-emerald-400"
                            : "bg-[#222] text-[#777]"
                        }`}
                      >
                        {placement.flow.status === "PUBLISHED" ? "Live" : placement.flow.status}
                      </span>
                    </div>
                    <code className="text-[11px] font-mono text-[#7c8aff] mt-0.5 block">
                      {placement.key}
                    </code>
                    <p className="text-[11px] text-[#444] mt-1">
                      Resolves to {placement.flow.name} ({placement.flow.slug})
                    </p>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      navigator.clipboard.writeText(placement.key);
                    }}
                    className="p-1.5 text-[#333] hover:text-[#888] transition-colors"
                    title="Copy placement key"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(placement.id);
                    }}
                    className="p-1.5 text-[#333] hover:text-red-400 transition-colors opacity-0 group-hover/item:opacity-100"
                    title="Delete placement"
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
              Create Placement
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#141414] border border-[#1f1f1f] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Placement</DialogTitle>
            <DialogDescription>
              Placements let the app request a stable key and resolve the right flow at runtime.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                Display Name
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder='e.g. "Home Onboarding"'
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#333]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                Placement Key
              </label>
              <input
                value={key}
                onChange={(event) => setKey(event.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, ""))}
                placeholder="e.g. onboarding_home"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] text-sm text-white font-mono placeholder:text-[#333] focus:outline-none focus:border-[#333]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                Flow
              </label>
              <select
                value={flowId}
                onChange={(event) => setFlowId(event.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] text-sm text-white focus:outline-none focus:border-[#333]"
              >
                {flows.map((flow) => (
                  <option key={flow.id} value={flow.id}>
                    {flow.name} ({flow.slug})
                  </option>
                ))}
              </select>
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
              disabled={isPending || !key.trim() || !flowId}
              className="px-5 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-[#e5e5e5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Creating..." : "Create Placement"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
