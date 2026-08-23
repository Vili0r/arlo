"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  FileSpreadsheet,
  X,
  Plus,
} from "lucide-react";
import { AddNewDropdown } from "./add-new-dropdown";
import { Severity, ComplaintStatus } from "@prisma/client";

interface ComplaintRecord {
  id: string;
  complaintNumber: string;
  title: string;
  description: string;
  severity: Severity;
  status: ComplaintStatus;
  deviceModel: string | null;
  lotNumber: string | null;
  dateReceived: Date;
  createdById: string;
  createdBy: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

interface ComplaintsViewProps {
  orgSlug: string;
  complaints: ComplaintRecord[];
}

export function ComplaintsView({ orgSlug, complaints }: ComplaintsViewProps) {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Persist view mode preference in localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("arlo-complaints-view-mode");
    if (saved === "grid" || saved === "list") {
      setViewMode(saved);
    }
  }, []);

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("arlo-complaints-view-mode", mode);
  };

  const filteredComplaints = complaints.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaintNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.deviceModel &&
        c.deviceModel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.lotNumber &&
        c.lotNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-3 w-3" /> Critical
          </span>
        );
      case "MAJOR":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Major
          </span>
        );
      case "MINOR":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Minor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
            Cosmetic
          </span>
        );
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="h-3 w-3" /> Closed
          </span>
        );
      case "UNDER_INVESTIGATION":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Clock className="h-3 w-3" /> Investigating
          </span>
        );
      case "PENDING_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400 border border-purple-500/20">
            Pending Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Open
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Full-Width Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        {/* Full-width Real-time Search Input */}
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search Complaints by ID, title, model, or lot..."
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
            title="Filter complaints"
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

          {/* Direct Add New Button to /complaints/new */}
          <Link
            href="/complaints/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add New</span>
          </Link>
        </div>
      </div>

      {/* Dynamic View Rendering: Grid vs List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Complaints Records
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            Showing {filteredComplaints.length} of {complaints.length}
          </span>
        </div>

        {filteredComplaints.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/60 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">
              No complaints found
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No records matched your search query "${searchQuery}".`
                : "Get started by logging your first medical device complaint into the system."}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View Layout (2 columns) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredComplaints.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-border bg-card p-5 space-y-4 hover:border-neutral-400 dark:hover:border-neutral-700 transition-all group shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
                      <FileSpreadsheet className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <Link
                        href={`/complaints/${c.id}`}
                        className="text-sm font-bold text-foreground hover:underline block"
                      >
                        {c.complaintNumber}
                      </Link>
                      <span className="text-[11px] text-muted-foreground block truncate font-mono">
                        {c.deviceModel ? `Model: ${c.deviceModel}` : ""}{" "}
                        {c.lotNumber ? `(Lot: ${c.lotNumber})` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(c.severity)}
                  </div>
                </div>

                <div className="space-y-1">
                  <Link
                    href={`/complaints/${c.id}`}
                    className="text-xs font-semibold text-foreground hover:underline block line-clamp-1"
                  >
                    {c.title}
                  </Link>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="pt-3 text-xs flex items-center justify-between text-muted-foreground font-mono border-t border-border">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(c.status)}
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span>{new Date(c.dateReceived).toLocaleDateString()}</span>
                    <Link
                      href={`/complaints/${c.id}`}
                      className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View Layout (Horizontal Table) */
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Record ID</th>
                    <th className="py-3 px-4">Title & Details</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Logged By</th>
                    <th className="py-3 px-4">Date Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredComplaints.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-accent/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                        <Link
                          href={`/complaints/${c.id}`}
                          className="hover:underline"
                        >
                          {c.complaintNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link
                          href={`/complaints/${c.id}`}
                          className="font-medium text-foreground hover:underline block truncate"
                        >
                          {c.title}
                        </Link>
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {c.deviceModel ? `Model: ${c.deviceModel}` : ""}{" "}
                          {c.lotNumber ? `(Lot: ${c.lotNumber})` : ""}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{getSeverityBadge(c.severity)}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {c.createdBy?.firstName
                          ? `${c.createdBy.firstName} ${c.createdBy.lastName ?? ""}`
                          : c.createdBy?.email || c.createdById}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono">
                        {new Date(c.dateReceived).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
