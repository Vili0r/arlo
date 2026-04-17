"use client";

import { useState, useTransition } from "react";
import { MapPinned, ArrowRight, Plus, Copy, Trash2 } from "lucide-react";
import { createEntryPoint, deleteEntryPoint, updateEntryPointAllocations } from "@/app/(main)/dashboard/project/[id]/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface FlowOption {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  developmentVersion: { id: string; version: number } | null;
  productionVersion: { id: string; version: number } | null;
}

interface EntryPointVariant {
  id: string;
  flowId: string;
  percentage: number;
  order: number;
  flow: FlowOption;
}

interface EntryPointData {
  id: string;
  key: string;
  name: string | null;
  environment: "DEVELOPMENT" | "PRODUCTION";
  flow: FlowOption;
  variants: EntryPointVariant[];
  createdAt: string;
}

interface EntryPointsCardProps {
  projectId: string;
  entryPoints: EntryPointData[];
  flows: FlowOption[];
}

const toEntryPointKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

export function EntryPointsCard({
  projectId,
  entryPoints,
  flows,
}: EntryPointsCardProps) {
  const [listOpen, setListOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [environment, setEnvironment] = useState<"DEVELOPMENT" | "PRODUCTION">("DEVELOPMENT");
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const selectableFlows = flows.filter((flow) =>
    environment === "PRODUCTION" ? flow.productionVersion : flow.developmentVersion
  );
  
  const [flowId, setFlowId] = useState(selectableFlows[0]?.id ?? "");
  const [variants, setVariants] = useState<{ flowId: string; percentage: number }[]>([]);
  
  // State for Editing Allocations
  const [editingEntryPoint, setEditingEntryPoint] = useState<EntryPointData | null>(null);
  const [editVariants, setEditVariants] = useState<{ flowId: string; percentage: number }[]>([]);
  
  const [isPending, startTransition] = useTransition();
  const resolvedFlowId = selectableFlows.some((flow) => flow.id === flowId)
    ? flowId
    : selectableFlows[0]?.id ?? "";
  const variantFlowOptions = selectableFlows.filter((flow) => flow.id !== resolvedFlowId);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!keyTouched) {
      setKey(toEntryPointKey(value));
    }
  };

  const handleKeyChange = (value: string) => {
    const nextKey = toEntryPointKey(value);
    setKeyTouched(nextKey.length > 0);
    setKey(nextKey);
  };

  const developmentCount = entryPoints.filter(
    (entryPoint) => entryPoint.environment === "DEVELOPMENT"
  ).length;
  const productionCount = entryPoints.filter(
    (entryPoint) => entryPoint.environment === "PRODUCTION"
  ).length;

  const isFlowPublishedForEnvironment = (
    flow: FlowOption,
    nextEnvironment: "DEVELOPMENT" | "PRODUCTION"
  ) =>
    nextEnvironment === "PRODUCTION"
      ? Boolean(flow.productionVersion)
      : Boolean(flow.developmentVersion);

  const isEntryPointSplitReady = (entryPoint: EntryPointData) =>
    entryPoint.variants.length < 2 ||
    entryPoint.variants.every((variant) =>
      isFlowPublishedForEnvironment(variant.flow, entryPoint.environment)
    );

  const isEntryPointLive = (entryPoint: EntryPointData) =>
    isFlowPublishedForEnvironment(entryPoint.flow, entryPoint.environment) &&
    isEntryPointSplitReady(entryPoint);

  const flowLabel = (flow: FlowOption) => {
    const version =
      environment === "PRODUCTION" ? flow.productionVersion : flow.developmentVersion;
    return version
      ? `${flow.name} (${flow.slug}) · v${version.version}`
      : `${flow.name} (${flow.slug})`;
  };

  const resetForm = () => {
    const nextPrimaryFlow = selectableFlows[0]?.id ?? "";

    setName("");
    setKey("");
    setKeyTouched(false);
    setFlowId(nextPrimaryFlow);
    setAbTestEnabled(false);
    setVariants([]);
  };

  const handleCreate = () => {
    if (!key.trim() || !resolvedFlowId) return;

    startTransition(async () => {
      try {
        await createEntryPoint(projectId, {
          key,
          name,
          flowId: resolvedFlowId,
          environment,
          variants: abTestEnabled ? variants : undefined,
        });
        setDialogOpen(false);
        resetForm();
      } catch (error) {
        console.error(error);
      }
    });
  };

  const handleUpdateAllocations = () => {
    if (!editingEntryPoint) return;

    startTransition(async () => {
      try {
        await updateEntryPointAllocations(projectId, editingEntryPoint.id, {
          variants: editVariants,
        });
        setEditingEntryPoint(null);
      } catch (error) {
        console.error(error);
      }
    });
  };

  const currentVariantsSum = variants.reduce((sum, v) => sum + v.percentage, 0);
  const isVariantsSumValid = !abTestEnabled || currentVariantsSum === 100;

  const toggleAbTest = (checked: boolean) => {
    if (checked) {
      // Enable A/B test: initialize with 2 variants
      const primaryFlow = selectableFlows.find(f => f.id === resolvedFlowId) || selectableFlows[0];
      const secondFlow = selectableFlows.find(f => f.id !== primaryFlow?.id);
      
      if (primaryFlow && secondFlow) {
        setVariants([
          { flowId: primaryFlow.id, percentage: 50 },
          { flowId: secondFlow.id, percentage: 50 }
        ]);
        setAbTestEnabled(true);
      }
    } else {
      setAbTestEnabled(false);
      setVariants([]);
    }
  };

  const addVariant = () => {
    const usedFlowIds = variants.map(v => v.flowId);
    const availableFlow = selectableFlows.find(f => !usedFlowIds.includes(f.id));
    if (availableFlow) {
      setVariants([...variants, { flowId: availableFlow.id, percentage: 0 }]);
    }
  };

  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    if (newVariants.length < 2) {
      setAbTestEnabled(false);
      setVariants([]);
    } else {
      setVariants(newVariants);
    }
  };

  const updateVariant = (index: number, updates: Partial<{ flowId: string, percentage: number }>) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], ...updates };
    setVariants(newVariants);
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
    const nextPrimaryFlow = nextFlows[0]?.id ?? "";
    setFlowId(nextPrimaryFlow);
    setAbTestEnabled(false);
    setVariants([]);
  };

  const handleFlowChange = (nextFlowId: string) => {
    setFlowId(nextFlowId);
    if (abTestEnabled && variants.length > 0) {
      // If we change the primary flow, we might need to update the first variant
      const newVariants = [...variants];
      newVariants[0] = { ...newVariants[0], flowId: nextFlowId };
      setVariants(newVariants);
    }
  };

  const canCreateSplit = variantFlowOptions.length > 0;

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
                    {entryPoint.variants && entryPoint.variants.length > 0 ? (
                      <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1.5 pt-1.5 border-t border-[#1f1f1f]">
                        {entryPoint.variants.map((v) => (
                          <span key={v.id} className="text-[10px] text-[#666] flex items-center gap-1">
                            <span className="font-medium text-[#888]">{v.percentage}%</span>
                            <span className="truncate max-w-[80px]">{v.flow.slug}</span>
                          </span>
                        ))}
                        <button
                          onClick={() => {
                            setEditingEntryPoint(entryPoint);
                            setEditVariants(entryPoint.variants.map(v => ({ flowId: v.flowId, percentage: v.percentage })));
                          }}
                          className="text-[9px] text-cyan-400 hover:text-cyan-300 ml-auto font-medium transition-colors"
                        >
                          Edit Allocations
                        </button>
                      </div>
                    ) : null}
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
        <DialogContent className="bg-[#141414] border border-[#1f1f1f] px-6 pt-5 pb-4 sm:max-w-lg">
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
                onChange={(event) => handleNameChange(event.target.value)}
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
                onChange={(event) => handleKeyChange(event.target.value)}
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
                Control Flow
              </label>
              <select
                value={resolvedFlowId}
                onChange={(event) => handleFlowChange(event.target.value)}
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
            <div className="space-y-2 rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                    A/B Test
                  </label>
                  <p className="mt-1 text-xs text-[#555]">
                    Route a percentage of users to a second published onboarding flow.
                  </p>
                </div>                
                <Switch
                  checked={abTestEnabled}
                  onCheckedChange={toggleAbTest}
                  disabled={!canCreateSplit}
                />
              </div>

              {abTestEnabled ? (
                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    {variants.map((v, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <div className="flex-1 min-w-0">
                          <select
                            value={v.flowId}
                            onChange={(e) => updateVariant(i, { flowId: e.target.value })}
                            className="w-full rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#333]"
                          >
                            {selectableFlows.map((flow) => (
                              <option key={flow.id} value={flow.id} disabled={variants.some((other, oi) => oi !== i && other.flowId === flow.id)}>
                                {flow.name} ({flow.slug})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-20 relative">
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={v.percentage}
                            onChange={(e) => updateVariant(i, { percentage: parseInt(e.target.value) || 0 })}
                            className="w-full rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2 text-[11px] text-white pr-6 focus:outline-none focus:border-[#333]"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-[#444]">%</span>
                        </div>
                        <button
                          onClick={() => removeVariant(i)}
                          className="p-2 text-[#444] hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={addVariant}
                      disabled={variants.length >= selectableFlows.length}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus size={10} /> Add Flow
                    </button>
                    <span className={`text-[10px] font-mono ${currentVariantsSum === 100 ? "text-emerald-400" : "text-amber-400"}`}>
                      Sum: {currentVariantsSum}%
                    </span>
                  </div>
                  
                  {currentVariantsSum !== 100 && (
                    <p className="text-[10px] text-amber-400/80">Total must sum exactly to 100%</p>
                  )}
                </div>
              ) : (
                !canCreateSplit ? (
                  <p className="text-xs text-[#444] pt-2">
                    Publish at least two flows in this environment to create a split test.
                  </p>
                ) : null
              )}
            </div>
          </div>

          <DialogFooter className="-mx-6 -mb-4 px-6">
            <button
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 text-sm text-[#555] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={
                isPending ||
                !key.trim() ||
                !resolvedFlowId ||
                !isVariantsSumValid ||
                (abTestEnabled && (variants.length < 2 || variants.some(v => !v.flowId)))
              }
              className="px-5 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-[#e5e5e5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Creating..." : "Create Entry Point"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingEntryPoint} onOpenChange={(open) => !open && setEditingEntryPoint(null)}>
        <DialogContent className="bg-[#141414] border border-[#1f1f1f] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Traffic Allocation</DialogTitle>
            <DialogDescription>
              Adjust how traffic is distributed across flows for <code>{editingEntryPoint?.key}</code>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {editVariants.map((v, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate font-medium">
                    {selectableFlows.find(f => f.id === v.flowId)?.name || "Unknown Flow"}
                  </p>
                  <p className="text-[10px] text-[#555] font-mono">
                    {selectableFlows.find(f => f.id === v.flowId)?.slug}
                  </p>
                </div>
                <div className="w-24 relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={v.percentage}
                    onChange={(e) => {
                      const newVariants = [...editVariants];
                      newVariants[i] = { ...newVariants[i], percentage: parseInt(e.target.value) || 0 };
                      setEditVariants(newVariants);
                    }}
                    className="w-full rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2 text-sm text-white pr-7 focus:outline-none focus:border-[#333]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#444]">%</span>
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-[#1f1f1f] flex justify-between items-center">
               <span className={`text-[11px] font-mono ${editVariants.reduce((s, v) => s + v.percentage, 0) === 100 ? "text-emerald-400" : "text-amber-400"}`}>
                  Total Allocation: {editVariants.reduce((s, v) => s + v.percentage, 0)}%
               </span>
               {editVariants.reduce((s, v) => s + v.percentage, 0) !== 100 && (
                 <span className="text-[10px] text-amber-400/80">Must sum to 100%</span>
               )}
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setEditingEntryPoint(null)}
              className="px-4 py-2 text-sm text-[#555] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateAllocations}
              disabled={isPending || editVariants.reduce((s, v) => s + v.percentage, 0) !== 100}
              className="px-5 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-[#e5e5e5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving..." : "Save Allocations"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
