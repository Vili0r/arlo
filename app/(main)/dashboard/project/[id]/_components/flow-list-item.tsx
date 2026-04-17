"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Layers, Trash2 } from "lucide-react";
import { deleteFlow } from "@/app/(main)/dashboard/project/[id]/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FlowListItemProps {
  projectId: string;
  flow: {
    id: string;
    name: string;
    slug: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    developmentVersion: { id: string; version: number } | null;
    productionVersion: { id: string; version: number } | null;
    updatedAt: string;
    versionCount: number;
  };
}

export function FlowListItem({ projectId, flow }: FlowListItemProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const liveLabel =
    flow.developmentVersion && flow.productionVersion
      ? "Dev + Prod"
      : flow.productionVersion
        ? "Prod only"
        : flow.developmentVersion
          ? "Dev only"
          : flow.status.charAt(0) + flow.status.slice(1).toLowerCase();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteFlow(projectId, flow.id);
        setDialogOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <div className="group flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 transition-all hover:border-white/[0.15] hover:bg-white/[0.04]">
      <Link
        href={`/flow/${flow.id}`}
        className="flex min-w-0 flex-1 items-center gap-4 rounded-lg p-2"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1f1f1f] bg-[#1a1a1a]">
          <Layers size={15} className="text-orange-400/80" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-white">
              {flow.name}
            </span>
            <code className="text-[10px] font-mono text-[#444]">
              {flow.slug}
            </code>
          </div>
          <span className="text-[11px] text-[#444]">
            {flow.versionCount} version{flow.versionCount !== 1 ? "s" : ""} ·
            Updated{" "}
            {new Date(flow.updatedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </Link>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogTrigger
          disabled={isPending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-[#333] transition-colors hover:text-red-300/70 disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
          aria-label={`Delete ${flow.name}`}
        >
          <Trash2 size={14} />
        </AlertDialogTrigger>

        <AlertDialogContent
          size="sm"
          className="border-[#1f1f1f] bg-[#141414] text-white"
        >
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle>Delete {flow.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-left text-[#777]">
              This permanently deletes the flow, its saved versions, and any
              entry points pointing to it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-[#1f1f1f] bg-[#101010]">
            <AlertDialogCancel
              variant="outline"
              className="border-[#2a2a2a] bg-[#141414] text-[#cfcfcf] hover:bg-[#1b1b1b] hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
            >
              {isPending ? "Deleting..." : "Delete Flow"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
          flow.developmentVersion || flow.productionVersion
            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
            : flow.status === "ARCHIVED"
            ? "border-[#1f1f1f] bg-[#0a0a0a] text-[#444]"
            : "border-[#1f1f1f] bg-[#0a0a0a] text-[#666]"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            flow.developmentVersion || flow.productionVersion ? "bg-emerald-400" : "bg-[#444]"
          }`}
        />
        {liveLabel}
      </span>

      <Link
        href={`/flow/${flow.id}`}
        aria-label={`Open ${flow.name}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#333] transition-colors hover:text-white"
      >
        <ArrowRight
          size={14}
          className="text-[#333] transition-colors group-hover:text-white"
        />
      </Link>
    </div>
  );
}
