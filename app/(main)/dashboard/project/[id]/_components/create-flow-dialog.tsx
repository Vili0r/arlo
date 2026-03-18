"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createFlow } from "@/app/(main)/dashboard/project/[id]/actions";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateFlowButton({ projectId }: { projectId: string }) {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-[#e5e5e5] transition-colors">
        <Plus size={13} />
        New Flow
      </DialogTrigger>

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
  );
}
