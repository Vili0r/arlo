"use client";

import React, { ReactNode, useState } from "react";
import { SearchBar } from "@/components/dashboard/search-bar";
import { ProjectsSection } from "@/components/dashboard/projects-section";
import { ProjectListItem } from "@/lib/types";

interface DashboardShellProps {
  projects: ProjectListItem[];
  children: ReactNode;
}

export function DashboardShell({ projects, children }: DashboardShellProps) {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div className="space-y-6">
      <SearchBar view={view} onViewChange={setView} />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6">
        <div className="space-y-6">{children}</div>
        <div>
          <ProjectsSection projects={projects} view={view} />
        </div>
      </div>
    </div>
  );
}
