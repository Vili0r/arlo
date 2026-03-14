"use client";

import React from "react";
import { MoreHorizontal, AlertTriangle, GitBranch } from "lucide-react";

interface Project {
  name: string;
  url: string;
  orgBadge: string;
  lastCommit: string;
  date: string;
  branch: string;
  hasWarning?: boolean;
}

const projects: Project[] = [
  {
    name: "cv-forge",
    url: "www.cvmark.io",
    orgBadge: "Vili0r/CVForge",
    lastCommit: "total redesign & mock intview functionality",
    date: "Feb 9",
    branch: "main",
    hasWarning: true,
  },
  {
    name: "my-spoons",
    url: "www.myspoonsjournal...",
    orgBadge: "Vili0r/my-spoons",
    lastCommit: "indexing page update",
    date: "12/4/25",
    branch: "main",
    hasWarning: true,
  },
  {
    name: "memo-wesbite",
    url: "www.memonotes.app",
    orgBadge: "Vili0r/memo-wesbite",
    lastCommit: "new design",
    date: "Feb 15",
    branch: "main",
  },
];

export function ProjectsSection() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white mb-3">Projects</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 hover:border-white/[0.15] transition-all duration-200 group hover:bg-white/[0.04] cursor-pointer">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-black font-bold text-sm">
              {project.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{project.name}</h3>
            <p className="text-xs text-white/40 truncate">{project.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {project.hasWarning && (
            <div className="p-1 rounded-full">
              <AlertTriangle size={14} className="text-amber-400" />
            </div>
          )}
          <button className="p-1 rounded-md hover:bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal size={16} className="text-white/50" />
          </button>
        </div>
      </div>

      {/* Org badge */}
      <div className="mb-3">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-white/[0.06] border border-white/[0.08] rounded-full px-2 py-0.5 text-white/60">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          {project.orgBadge}
        </span>
      </div>

      {/* Commit info */}
      <p className="text-xs text-white/60 mb-1 line-clamp-1">{project.lastCommit}</p>
      <div className="flex items-center gap-1.5 text-[11px] text-white/40">
        <span>{project.date}</span>
        <span>on</span>
        <GitBranch size={11} className="text-white/30" />
        <span className="font-mono">{project.branch}</span>
      </div>
    </div>
  );
}
