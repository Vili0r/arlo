"use client";

import * as React from "react";
import { AddNewDropdown } from "./add-new-dropdown";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ChevronsUpDown,
  AlertTriangle,
  GitBranch,
  Activity,
  ShieldCheck,
  X,
  ChevronRight,
} from "lucide-react";

interface ProjectsViewProps {
  orgSlug: string;
  complaintCount: number;
  openComplaints: number;
  capaCount: number;
  auditLogCount: number;
  sideContent: React.ReactNode;
}

export function ProjectsView({
  orgSlug,
  complaintCount,
  openComplaints,
  capaCount,
  auditLogCount,
  sideContent,
}: ProjectsViewProps) {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Persist view mode preference in localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("arlo-projects-view-mode");
    if (saved === "grid" || saved === "list") {
      setViewMode(saved);
    }
  }, []);

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("arlo-projects-view-mode", mode);
  };

  const projects = [
    {
      id: "arlo-quality-capa-system",
      title: "arlo-quality-capa-system",
      domain: `${orgSlug}.quality`,
      href: "/capa",
      iconBg: "bg-neutral-900 border border-neutral-800",
      iconText: "CP",
      statusIcon: Activity,
      statusColor: "text-neutral-400",
      branch: `CAPAs: ${capaCount}`,
      repo: "",
      date: "Active",
    },
    {
      id: "arlo-quality-complaints-system",
      title: "arlo-quality-complaints-system",
      domain: `${orgSlug}.quality`,
      href: "/complaints",
      iconBg: "bg-emerald-600",
      iconText: "CM",
      statusIcon: ShieldCheck,
      statusColor: "text-emerald-400",
      branch: `Complaints: ${complaintCount} (Open: ${openComplaints})`,
      repo: "",
      date: "Active",
    },
  ];

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full max-w-8xl mx-auto">
      {/* FULL WIDTH Vercel Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        {/* Full-width Search Bar */}
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search Projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-10 pr-9 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-3 text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-muted">
              /
            </kbd>
          )}
        </div>

        {/* Action Controls Group */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Filter Button */}
          <button
            title="Filter projects"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          {/* Grid / List Layout Interactive Toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => handleViewModeChange("grid")}
              title="Grid View"
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleViewModeChange("list")}
              title="List View"
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                viewMode === "list"
                  ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Add New Dropdown Menu */}
          <AddNewDropdown />
        </div>
      </div>

      {/* Main 2-Column Grid Layout Underneath Full-Width Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-1">
        {/* Left Column: Projects Header & Cards Grid */}
        <div className="lg:col-span-8 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-foreground tracking-tight">Projects</h3>
            <span className="text-[11px] font-mono text-muted-foreground">
              Showing {filteredProjects.length} of {projects.length}
            </span>
          </div>

          {/* Dynamic View Rendering: Grid vs List */}
          {filteredProjects.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
              No projects found matching &quot;{searchQuery}&quot;
            </div>
          ) : viewMode === "grid" ? (
            /* Grid View Layout (2 columns) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {filteredProjects.map((p) => {
                const StatusIcon = p.statusIcon;
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-border bg-card p-5 space-y-4 hover:border-neutral-400 dark:hover:border-neutral-700 transition-all group shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-white font-bold text-xs shrink-0 ${p.iconBg}`}
                        >
                          {p.iconText}
                        </div>
                        <div>
                          <Link href={p.href} className="text-sm font-bold text-foreground hover:underline block">
                            {p.title}
                          </Link>
                          <span className="text-[11px] text-muted-foreground hover:text-foreground block truncate font-mono">
                            {p.domain}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <StatusIcon className={`h-4 w-4 ${p.statusColor}`} />
                        <ChevronsUpDown className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    <div className="pt-2 text-xs space-y-1 text-muted-foreground font-mono border-t border-border">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{p.branch}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate flex items-center justify-between">
                        <span>{p.repo}</span>
                        <span>{p.date}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View Layout (Sleek Horizontal Table/Rows) */
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden shadow-xs pt-1">
              {filteredProjects.map((p) => {
                const StatusIcon = p.statusIcon;
                return (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-accent/50 transition-colors gap-3 group"
                  >
                    {/* Left: Icon & Project Info */}
                    <div className="flex items-center gap-3.5 truncate">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-white font-bold text-xs shrink-0 ${p.iconBg}`}
                      >
                        {p.iconText}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <Link href={p.href} className="text-sm font-bold text-foreground hover:underline truncate">
                            {p.title}
                          </Link>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono block truncate">
                          {p.domain}
                        </span>
                      </div>
                    </div>

                    {/* Right: Branch Info, Status, Date, Link Chevron */}
                    <div className="flex items-center gap-4 sm:gap-6 text-xs text-muted-foreground shrink-0 font-mono justify-between sm:justify-end">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate max-w-[140px] sm:max-w-none">{p.branch}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${p.statusColor}`} />
                        <span className="text-[11px] text-muted-foreground">{p.date}</span>
                        <Link
                          href={p.href}
                          className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Side Cards (Alerts & Recent Previews) */}
        <div className="lg:col-span-4 space-y-6">
          {sideContent}
        </div>
      </div>
    </div>
  );
}
