"use client";

import { useState, useTransition } from "react";
import { Layers, ArrowRight, Plus } from "lucide-react";
import { createFlow } from "@/app/(main)/dashboard/project/[id]/actions";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface FlowsCardProps {
  projectId: string;
  flowCount: number;
  publishedCount: number;
}

export function FlowsCard({ projectId, flowCount, publishedCount }: FlowsCardProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  const handleSubmit = () => {
    if (!name.trim() || !slug.trim()) return;
    startTransition(async () => {
      try {
        const flow = await createFlow(projectId, { name, slug });
        setOpen(false);
        setName("");
        setSlug("");
        router.push(`/flow/${flow.id}`);
      } catch (err) {
        console.error(err);
      }
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)}>
        <section className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.15] transition-all duration-200 group hover:bg-white/[0.04] cursor-pointer">
            <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Flows</h3>
            <span className="p-1.5 rounded-lg text-[#444] group-hover:text-white transition-colors">
                <ArrowRight size={14} />
            </span>
            </div>
            <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#1f1f1f] flex items-center justify-center">
                <Layers size={16} className="text-orange-400/80" />
            </div>
            <div>
                <span className="text-xl font-bold text-white leading-none">
                {flowCount}
                </span>
                <span className="text-xs text-[#555] ml-1.5">total flows</span>
            </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0a0a] border border-[#1f1f1f] text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[#888]">{publishedCount} Published</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0a0a0a] border border-[#1f1f1f] text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#444]" />
                <span className="text-[#666]">{flowCount - publishedCount} Drafts</span>
            </span>
            </div>
        </section>
      </button>

      {/* Create Flow Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#141414] border border-[#1f1f1f] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Flow</DialogTitle>
            <DialogDescription>
              Add a new flow to your project. The slug is used as the SDK identifier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                Flow Name
              </label>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Welcome Onboarding"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#333]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#444] uppercase font-semibold tracking-widest">
                Slug (SDK identifier)
              </label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. welcome-onboarding"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] text-sm text-white font-mono placeholder:text-[#333] focus:outline-none focus:border-[#333]"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-[#555] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !name.trim() || !slug.trim()}
              className="px-5 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-[#e5e5e5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Creating..." : "Create Flow"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}