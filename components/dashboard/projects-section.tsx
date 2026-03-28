import React from "react";
import Image from "next/image";
import { MoreHorizontal, Layers, Key } from "lucide-react";
import { ProjectListItem } from "@/lib/types";
import Link from "next/link";

interface ProjectsSectionProps {
  projects: ProjectListItem[];
  view: "grid" | "list";
}

export function ProjectsSection({ projects, view }: ProjectsSectionProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white mb-3">Projects</h2>
      <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col gap-3"}>
        {(projects ?? []).length === 0 ? (
          <p className={`text-sm text-white/40 py-6 text-center ${view === "grid" ? "col-span-full" : ""}`}>
            No projects yet. Create your first project to get started.
          </p>
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} view={view} />
          ))
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project, view }: { project: ProjectListItem; view: "grid" | "list" }) {
  const flowCount = project._count.flows;
  const apiKeyCount = project._count.apiKeys;
  const hasPublished = project.flows.some((f) => f.status === "PUBLISHED");

  return (
    <Link href={`/dashboard/project/${project.id}`} className="block">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.15] transition-all duration-200 group hover:bg-white/[0.04] cursor-pointer">
        {/* Top row */}
        <div className={`flex justify-between mb-3 gap-4 ${view === "list" ? "items-center" : "items-start"}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {project.iconUrl ? (
              <Image
                src={project.iconUrl}
                alt={project.name}
                width={32}
                height={32}
                className="w-8 h-8 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                <span className="text-black font-bold text-sm">
                  {project.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">{project.name}</h3>
              <p className="text-xs text-white/40 truncate">{project.platform.replace("_", " ")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button className="p-1 rounded-md hover:bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal size={16} className="text-white/50" />
            </button>
          </div>
        </div>

        <div className={`flex gap-3 text-[11px] text-white/40 ${view === "list" ? "items-center justify-between flex-wrap" : "flex-col"}`}>
          <div className={view === "list" ? "" : "mb-0"}>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 ${
                hasPublished
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-white/[0.06] border border-white/[0.08] text-white/60"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  hasPublished ? "bg-emerald-400" : "bg-white/30"
                }`}
              />
              {hasPublished ? "Live" : "Draft"}
            </span>
          </div>

          <div className={`flex items-center gap-3 ${view === "list" ? "flex-wrap" : ""}`}>
            <span className="flex items-center gap-1">
              <Layers size={11} className="text-white/30" />
              {flowCount} {flowCount === 1 ? "flow" : "flows"}
            </span>
            <span className="flex items-center gap-1">
              <Key size={11} className="text-white/30" />
              {apiKeyCount} {apiKeyCount === 1 ? "key" : "keys"}
            </span>
            <span className={view === "grid" ? "ml-auto" : ""}>
              {new Date(project.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
