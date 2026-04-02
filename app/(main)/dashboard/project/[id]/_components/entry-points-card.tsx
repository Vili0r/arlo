"use client";

import { useState, useTransition } from "react";
import { MapPinned, ArrowRight, Plus, Copy, Trash2 } from "lucide-react";
import { createEntryPoint, deleteEntryPoint } from "@/app/(main)/dashboard/project/[id]/actions";
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
  developmentVersion: { id: string; version: number } | null;
  productionVersion: { id: string; version: number } | null;
}

interface EntryPointData {
  id: string;
  key: string;
  name: string | null;
  environment: "DEVELOPMENT" | "PRODUCTION";
  flow: FlowOption;
  createdAt: string;
}

interface EntryPointsCardProps {
  projectId: string;
  entryPoints: EntryPointData[];
  flows: FlowOption[];
}

export function EntryPointsCard({
  projectId,
  entryPoints,
  flows,
}: EntryPointsCardProps) {
  const [listOpen, setListOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [environment, setEnvironment] = useState<"DEVELOPMENT" | "PRODUCTION">("DEVELOPMENT");
  const selectableFlows = flows.filter((flow) =>
    environment === "PRODUCTION" ? flow.productionVersion : flow.developmentVersion
  );
  const [flowId, setFlowId] = useState(selectableFlows[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const developmentCount = entryPoints.filter(
    (entryPoint) => entryPoint.environment === "DEVELOPMENT"
  ).length;
  const productionCount = entryPoints.filter(
    (entryPoint) => entryPoint.environment === "PRODUCTION"
  ).length;

  const isEntryPointLive = (entryPoint: EntryPointData) =>
    entryPoint.environment === "PRODUCTION"
      ? Boolean(entryPoint.flow.productionVersion)
      : Boolean(entryPoint.flow.developmentVersion);

  const flowLabel = (flow: FlowOption) => {
    const version =
      environment === "PRODUCTION" ? flow.productionVersion : flow.developmentVersion;
    return version
      ? `${flow.name} (${flow.slug}) · v${version.version}`
      : `${flow.name} (${flow.slug})`;
  };

  const handleCreate = () => {
    if (!key.trim() || !flowId) return;

    startTransition(async () => {
      try {
        await createEntryPoint(projectId, {
          key,
          name,
          flowId,
          environment,
        });
        setDialogOpen(false);
        setName("");
        setKey("");
      } catch (error) {
        console.error(error);
      }
    });
  };

  const handleDelete = (entryPointId: string) => {
    startTransition(async () => {
      try {
        await deleteEntryPoint(projectId, entryPointId);
      } catch (error) {
        console.error(error);
      }
    });
  };

  const liveCount = entryPoints.filter(isEntryPointLive).length;

  const handleEnvironmentChange = (nextEnvironment: "DEVELOPMENT" | "PRODUCTION") => {
    setEnvironment(nextEnvironment);
    const nextFlows = flows.filter((flow) =>
      nextEnvironment === "PRODUCTION" ? flow.productionVersion : flow.developmentVersion
    );
    setFlowId(nextFlows[0]?.id ?? "");
  };

  return (
    <>
      <section
        onClick={() => setListOpen(true)}
        className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.15] transition-all duration-200 group hover:bg-white/[0.04] cursor-pointer"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Entry Points</h3>
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
              {entryPoints.length}
            </span>
            <span className="text-xs text-[#555] ml-1.5">live entry points</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0a0a] border border-[#1f1f1f] text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[#888]">{liveCount} Live</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0a0a] border border-[#1f1f1f] text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#666]" />
            <span className="text-[#888]">{developmentCount} Dev</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0a0a] border border-[#1f1f1f] text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
            <span className="text-[#888]">{productionCount} Prod</span>
          </span>
        </div>
      </section>

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="bg-[#141414] border border-[#1f1f1f] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Entry Points</DialogTitle>
            <DialogDescription>
              Map SDK entry point keys to published flows in your project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {entryPoints.length === 0 ? (
              <div className="text-center py-8">
                <MapPinned size={20} className="mx-auto text-[#333] mb-3" />
                <p className="text-sm text-[#555]">No entry points yet</p>
                <p className="text-xs text-[#333] mt-1">
                  Create entry points like <code className="font-mono">onboarding_home</code> to resolve flows from your app.
                </p>
              </div>
            ) : (
              entryPoints.map((entryPoint) => (
                <div
                  key={entryPoint.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] group/item"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {entryPoint.name || entryPoint.key}
                      </span>
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isEntryPointLive(entryPoint)
                            ? "bg-emerald-400/10 text-emerald-400"
                            : "bg-[#222] text-[#777]"
                        }`}
                      >
                        {entryPoint.environment === "PRODUCTION" ? "Prod" : "Dev"}
                      </span>
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isEntryPointLive(entryPoint)
                            ? "bg-emerald-400/10 text-emerald-400"
                            : "bg-[#222] text-[#777]"
                        }`}
                      >
                        {isEntryPointLive(entryPoint) ? "Live" : "Missing Publish"}
                      </span>
                    </div>
                    <code className="text-[11px] font-mono text-[#7c8aff] mt-0.5 block">
                      {entryPoint.key}
                    </code>
                    <p className="text-[11px] text-[#444] mt-1">
                      Resolves to {entryPoint.flow.name} ({entryPoint.flow.slug})
                    </p>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      navigator.clipboard.writeText(entryPoint.key);
                    }}
                    className="p-1.5 text-[#333] hover:text-[#888] transition-colors"
                    title="Copy entry point key"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(entryPoint.id);
                    }}
                    className="p-1.5 text-[#333] hover:text-red-400 transition-colors opacity-0 group-hover/item:opacity-100"
                    title="Delete entry point"
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
              Create Entry Point
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#141414] border border-[#1f1f1f] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Entry Point</DialogTitle>
            <DialogDescription>
              Entry points let the app request a stable key and resolve the right flow at runtime.
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
                Entry Point Key
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
                Environment
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleEnvironmentChange("DEVELOPMENT")}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    environment === "DEVELOPMENT"
                      ? "border-blue-400/40 bg-blue-400/10 text-blue-200"
                      : "border-[#1f1f1f] bg-[#0a0a0a] text-[#777]"
                  }`}
                >
                  Development
                </button>
                <button
                  type="button"
                  onClick={() => handleEnvironmentChange("PRODUCTION")}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    environment === "PRODUCTION"
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                      : "border-[#1f1f1f] bg-[#0a0a0a] text-[#777]"
                  }`}
                >
                  Production
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                Flow
              </label>
              <select
                value={flowId}
                onChange={(event) => setFlowId(event.target.value)}
                disabled={selectableFlows.length === 0}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] text-sm text-white focus:outline-none focus:border-[#333]"
              >
                {selectableFlows.length === 0 ? (
                  <option value="">No {environment === "PRODUCTION" ? "production" : "development"} published flows</option>
                ) : (
                  selectableFlows.map((flow) => (
                    <option key={flow.id} value={flow.id}>
                      {flowLabel(flow)}
                    </option>
                  ))
                )}
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
              {isPending ? "Creating..." : "Create Entry Point"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
