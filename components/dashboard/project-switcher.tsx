"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProjects } from "@/app/(main)/dashboard/project/actions";
import { ProjectListItem } from "@/lib/types";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getProjects();
        setProjects(data as ProjectListItem[]);
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  // Determine current value
  // If we are on /dashboard/project/[id], value is the project id
  // Otherwise, if we are on /dashboard, value is "all"
  const currentProjectId = params?.id as string | undefined;
  const currentValue = currentProjectId && pathname.includes(`/dashboard/project/${currentProjectId}`) 
    ? currentProjectId 
    : "all";

  const handleValueChange = (value: string | null) => {
    if (!value) return;
    if (value === "all") {
      router.push("/dashboard");
    } else {
      router.push(`/dashboard/project/${value}`);
    }
  };

  if (loading) {
    return (
      <div className="h-8 w-32 bg-white/5 animate-pulse rounded-md" />
    );
  }

  return (
    <Select value={currentValue} onValueChange={handleValueChange}>
      <SelectTrigger 
        className="h-8 border-none bg-transparent hover:bg-white/5 px-2 gap-2 text-sm font-medium transition-colors focus:ring-0 focus:ring-offset-0"
      >
        <SelectValue placeholder="Select project">
           <div className="flex items-center gap-2">
            <LayoutGrid size={14} className="text-white/40" />
            <span className="text-white/70">
              {currentValue === "all" 
                ? "All Projects" 
                : projects.find(p => p.id === currentValue)?.name || "Project"}
            </span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="bg-[#111111] border-white/10 text-white min-w-[200px]">
        <SelectItem value="all" className="focus:bg-white/10 focus:text-white">
          <div className="flex items-center gap-2">
            <LayoutGrid size={14} className="text-white/40" />
            <span>All Projects</span>
          </div>
        </SelectItem>
        {projects.length > 0 && (
          <div className="h-px bg-white/5 my-1" />
        )}
        {projects.map((project) => (
          <SelectItem 
            key={project.id} 
            value={project.id}
            className="focus:bg-white/10 focus:text-white"
          >
            <div className="flex items-center gap-2">
              {project.iconUrl ? (
                <img src={project.iconUrl} alt="" className="size-4 rounded-sm object-cover" />
              ) : (
                <div className="size-4 bg-blue-500/20 rounded-sm" />
              )}
              <span className="truncate">{project.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
