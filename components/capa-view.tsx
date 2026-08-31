"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ClipboardCheck,
  X,
  Plus,
  GitMerge,
  SearchCode,
  ShieldAlert,
  Calendar,
  User,
  MoreHorizontal,
  Eye,
  Copy,
  Check,
  Wrench,
  Target,
  FileText,
  History,
} from "lucide-react";
import { CapaPhase, CapaType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { AuditHistoryDrawer } from "@/components/audit/audit-history-drawer";
import { cn, formatUserName } from "@/lib/utils";
import { useOrganization } from "@clerk/nextjs";

export interface CapaRecordItem {
  id: string;
  capaNumber: string;
  shortDescription: string;
  type: CapaType;
  currentPhase: CapaPhase;
  ownerId?: string | null;
  cancellationRequested?: boolean;
  cancellationJustification?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
  owner?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  initiation?: {
    problemStatement: string;
    source?: string | null;
    dateDue?: Date | string | null;
    riskCategory?: string | null;
    fscaRequired?: boolean;
  } | null;
  investigation?: {
    investigationSummary?: string | null;
    planDueDate?: Date | string | null;
  } | null;
  implementation?: {
    implementationDueDate?: Date | string | null;
  } | null;
  effectiveness?: {
    dateDue?: Date | string | null;
  } | null;
  extensionRequests?: Array<{
    id: string;
    status: string;
  }>;
}

interface CapaViewProps {
  orgSlug: string;
  capas: CapaRecordItem[];
}

export function CapaView({ orgSlug, capas }: CapaViewProps) {
  const { memberships } = useOrganization({
    memberships: {
      pageSize: 100,
      keepPreviousData: true,
    },
  });

  // Map of userId or email -> formatted Full Name (First + Last Name)
  const memberNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    memberships?.data?.forEach((m) => {
      if (m.publicUserData) {
        const fullName = [m.publicUserData.firstName, m.publicUserData.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        const displayName = fullName || m.publicUserData.identifier || "User";
        if (m.publicUserData.userId) {
          map.set(m.publicUserData.userId, displayName);
        }
        if (m.publicUserData.identifier) {
          map.set(m.publicUserData.identifier, displayName);
        }
      }
    });
    return map;
  }, [memberships]);

  const getOwnerDisplayName = (capa: CapaRecordItem) => {
    // 1. Match by ownerId from Clerk memberships
    if (capa.ownerId && memberNameMap.has(capa.ownerId)) {
      return memberNameMap.get(capa.ownerId)!;
    }
    // 2. Match by email identifier from Clerk memberships
    if (capa.owner?.email && memberNameMap.has(capa.owner.email)) {
      return memberNameMap.get(capa.owner.email)!;
    }
    // 3. Fallback to Prisma user object (firstName + lastName)
    if (capa.owner) {
      return formatUserName(capa.owner, "Unassigned");
    }
    return "Unassigned";
  };

  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");
  const [phaseFilter, setPhaseFilter] = React.useState<string>("ALL");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [activeHistoryCapa, setActiveHistoryCapa] = React.useState<CapaRecordItem | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Persist view mode preference in localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("arlo-capa-view-mode");
    if (saved === "grid" || saved === "list") {
      setViewMode(saved);
    }
  }, []);

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("arlo-capa-view-mode", mode);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    });
  };

  // Keyboard shortcut '/' for search focus
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        const searchInput = document.getElementById("capa-search-input");
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getPhaseBadge = (phase: CapaPhase) => {
    switch (phase) {
      case "INITIATION":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock className="h-3 w-3" /> Initiation
          </span>
        );
      case "INVESTIGATION":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <SearchCode className="h-3 w-3" /> Investigation
          </span>
        );
      case "IMPLEMENTATION":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Wrench className="h-3 w-3" /> Implementation
          </span>
        );
      case "EFFECTIVENESS":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Target className="h-3 w-3" /> Effectiveness
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
            {phase}
          </span>
        );
    }
  };

  const getTypeBadge = (type: CapaType) => {
    return (
      <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
        {type === "CORRECTIVE" ? "Corrective" : "Preventive"}
      </span>
    );
  };

  const getPhaseDueDate = (capa: CapaRecordItem) => {
    switch (capa.currentPhase) {
      case "INITIATION":
        return capa.initiation?.dateDue;
      case "INVESTIGATION":
        return capa.investigation?.planDueDate;
      case "IMPLEMENTATION":
        return capa.implementation?.implementationDueDate;
      case "EFFECTIVENESS":
        return capa.effectiveness?.dateDue;
      case "CLOSED":
        return null;
      default:
        return null;
    }
  };

  // Filtered CAPAs
  const filteredCapas = React.useMemo(() => {
    return capas.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.capaNumber.toLowerCase().includes(q) ||
        c.shortDescription.toLowerCase().includes(q) ||
        (c.initiation?.problemStatement && c.initiation.problemStatement.toLowerCase().includes(q)) ||
        (c.initiation?.source && c.initiation.source.toLowerCase().includes(q)) ||
        (c.owner && (
          c.owner.email.toLowerCase().includes(q) ||
          `${c.owner.firstName} ${c.owner.lastName}`.toLowerCase().includes(q)
        )) ||
        c.currentPhase.toLowerCase().includes(q);

      const matchesPhase = phaseFilter === "ALL" || c.currentPhase === phaseFilter;
      const matchesType = typeFilter === "ALL" || c.type === typeFilter;

      return matchesSearch && matchesPhase && matchesType;
    });
  }, [capas, searchQuery, phaseFilter, typeFilter]);

  // Pagination calculation
  const totalItems = filteredCapas.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentPageClamped = Math.min(currentPage, totalPages);

  const paginatedCapas = React.useMemo(() => {
    const start = (currentPageClamped - 1) * itemsPerPage;
    return filteredCapas.slice(start, start + itemsPerPage);
  }, [filteredCapas, currentPageClamped, itemsPerPage]);

  return (
    <div className="space-y-6 w-full max-w-8xl mx-auto">
      {/* Full-Width Action Toolbar matching Complaints exactly */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        {/* Full-width Real-time Search Input */}
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            id="capa-search-input"
            type="text"
            placeholder="Search CAPA records by ID, description, owner, source, or phase..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-border bg-card pl-10 pr-9 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors shadow-xs"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
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
          {/* Phase Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                title="Filter CAPA records"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border transition-colors",
                  (phaseFilter !== "ALL" || typeFilter !== "ALL") && "bg-accent text-accent-foreground border-primary/40"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 space-y-2">
              <div>
                <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 py-0.5">
                  Filter by Phase
                </DropdownMenuLabel>
                <div className="space-y-1 mt-1">
                  {["ALL", "INITIATION", "INVESTIGATION", "IMPLEMENTATION", "EFFECTIVENESS", "CLOSED"].map((phase) => (
                    <button
                      key={phase}
                      onClick={() => {
                        setPhaseFilter(phase);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        "w-full text-left text-xs px-2 py-1 rounded flex items-center justify-between",
                        phaseFilter === phase ? "bg-accent font-semibold text-accent-foreground" : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <span>{phase === "ALL" ? "All Phases" : phase}</span>
                      {phaseFilter === phase && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
              <DropdownMenuSeparator />
              <div>
                <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 py-0.5">
                  Filter by Type
                </DropdownMenuLabel>
                <div className="space-y-1 mt-1">
                  {["ALL", "CORRECTIVE", "PREVENTIVE"].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTypeFilter(t);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        "w-full text-left text-xs px-2 py-1 rounded flex items-center justify-between",
                        typeFilter === t ? "bg-accent font-semibold text-accent-foreground" : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      <span>{t === "ALL" ? "All Types" : t === "CORRECTIVE" ? "Corrective" : "Preventive"}</span>
                      {typeFilter === t && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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

          {/* Direct Add New Button to /capa/new */}
          <Link
            href={`/${orgSlug}/capa/new`}
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
            CAPA Records
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            Showing {paginatedCapas.length} of {totalItems}
            {totalPages > 1 ? ` (Page ${currentPageClamped} of ${totalPages})` : ""}
          </span>
        </div>

        {filteredCapas.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/60 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">
              No CAPA records found
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No records matched your search query "${searchQuery}".`
                : "Get started by initiating your first CAPA record."}
            </p>
            <div className="mt-4">
              <Link
                href={`/${orgSlug}/capa/new`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Initiate CAPA
              </Link>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View Layout (2 columns) matching Complaints design */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedCapas.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-border bg-card hover:border-neutral-400 dark:hover:border-neutral-700 transition-all shadow-xs flex flex-col justify-between p-5 space-y-4"
              >
                <div className="space-y-4">
                  {/* Card Top Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 shrink-0">
                        <ClipboardCheck className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/${orgSlug}/capa/${c.id}`}
                            className="text-sm font-bold text-foreground hover:underline font-mono"
                          >
                            {c.capaNumber}
                          </Link>
                          {c.cancellationRequested && (
                            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase bg-destructive/15 text-destructive border border-destructive/20 font-mono">
                              Void Req
                            </span>
                          )}
                          {c.extensionRequests && c.extensionRequests.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase bg-purple-500/15 text-purple-600 border border-purple-500/20 font-mono">
                              Ext
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground block truncate font-mono">
                          {c.initiation?.source || "Direct Trigger"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {getTypeBadge(c.type)}

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                          title="Actions menu"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel>CAPA Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/${orgSlug}/capa/${c.id}`} className="flex items-center gap-2">
                              <Eye className="h-3.5 w-3.5 text-primary" />
                              <span>View / Edit CAPA</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setActiveHistoryCapa(c)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <History className="h-3.5 w-3.5 text-amber-500" />
                            <span>View History</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(c.capaNumber)}
                            className="flex items-center gap-2"
                          >
                            {copiedId === c.capaNumber ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span>
                              {copiedId === c.capaNumber ? "Copied ID!" : "Copy Identifier"}
                            </span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-foreground block line-clamp-1">
                      {c.shortDescription}
                    </span>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {c.initiation?.problemStatement || "No problem statement recorded."}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-3 gap-2 text-[11px] bg-muted/20 rounded-lg p-2 border border-border/60">
                    <div>
                      <span className="text-muted-foreground block text-[10px] flex items-center gap-1">
                        <User className="h-2.5 w-2.5" /> Owner
                      </span>
                      <span className="font-medium text-foreground truncate block">
                        {getOwnerDisplayName(c)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" /> Target Date
                      </span>
                      <span className="font-mono text-foreground" suppressHydrationWarning>
                        {formatDate(c.initiation?.dateDue)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] flex items-center gap-1">
                        <ShieldAlert className="h-2.5 w-2.5" /> Risk Level
                      </span>
                      <span className="font-medium text-foreground truncate block">
                        {c.initiation?.riskCategory ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] px-1.5 py-0 h-4 font-mono",
                              c.initiation.riskCategory === "HIGH"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : c.initiation.riskCategory === "MEDIUM"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            )}
                          >
                            {c.initiation.riskCategory}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Row */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {getPhaseBadge(c.currentPhase)}
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span suppressHydrationWarning className="font-mono">{formatDate(c.createdAt)}</span>
                    <Link
                      href={`/${orgSlug}/capa/${c.id}`}
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
          /* List View Layout matching Complaints Table exactly */
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Record ID</th>
                    <th className="py-3 px-4">Description & Details</th>
                    <th className="py-3 px-4">Status / Phase</th>
                    <th className="py-3 px-4">Phase Due Date</th>
                    <th className="py-3 px-4">CAPA Owner</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Origin Source</th>
                    <th className="py-3 px-4">Date Created</th>
                    <th className="py-3 px-4 w-10 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedCapas.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-accent/40 transition-colors"
                    >
                      {/* Record ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-primary whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/${orgSlug}/capa/${c.id}`}
                            className="hover:underline flex items-center gap-1"
                          >
                            {c.capaNumber}
                          </Link>
                          {c.cancellationRequested && (
                            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase bg-destructive/15 text-destructive border border-destructive/20 font-mono">
                              Void
                            </span>
                          )}
                          {c.extensionRequests && c.extensionRequests.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase bg-purple-500/15 text-purple-600 border border-purple-500/20 font-mono">
                              Ext
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Short Description & Problem Statement */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link href={`/${orgSlug}/capa/${c.id}`} className="block group">
                          <span
                            className="text-xs font-semibold text-foreground truncate block group-hover:text-primary transition-colors"
                            title={c.shortDescription}
                          >
                            {c.shortDescription}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate block">
                            {c.initiation?.problemStatement || "No problem statement recorded"}
                          </span>
                        </Link>
                      </td>

                      {/* Status / Phase */}
                      <td className="py-3.5 px-4 whitespace-nowrap">{getPhaseBadge(c.currentPhase)}</td>

                      {/* Phase Due Date */}
                      <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
                        {formatDate(getPhaseDueDate(c))}
                      </td>

                      {/* CAPA Owner */}
                      <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {getOwnerDisplayName(c)}
                      </td>

                      {/* Risk Level */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {c.initiation?.riskCategory ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono",
                              c.initiation.riskCategory === "HIGH"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : c.initiation.riskCategory === "MEDIUM"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            )}
                          >
                            {c.initiation.riskCategory}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Origin Source */}
                      <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground whitespace-nowrap truncate max-w-[140px]">
                        {c.initiation?.source || "Direct Quality Trigger"}
                      </td>

                      {/* Date Created */}
                      <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
                        {formatDate(c.createdAt)}
                      </td>

                      {/* Actions Menu */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                            title="Actions menu"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>CAPA Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/${orgSlug}/capa/${c.id}`} className="flex items-center gap-2">
                                <Eye className="h-3.5 w-3.5 text-primary" />
                                <span>View / Edit CAPA</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setActiveHistoryCapa(c)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <History className="h-3.5 w-3.5 text-amber-500" />
                              <span>View History</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => copyToClipboard(c.capaNumber)}
                              className="flex items-center gap-2"
                            >
                              {copiedId === c.capaNumber ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span>
                                {copiedId === c.capaNumber ? "Copied ID!" : "Copy Identifier"}
                              </span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pt-2 flex justify-end">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPageClamped > 1) setCurrentPage((p) => p - 1);
                    }}
                    className={cn(currentPageClamped <= 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPageClamped === page}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPageClamped < totalPages) setCurrentPage((p) => p + 1);
                    }}
                    className={cn(currentPageClamped >= totalPages && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* 21 CFR Part 11 Audit History Drawer for CAPA & Related Phases */}
      <AuditHistoryDrawer
        isOpen={!!activeHistoryCapa}
        onClose={() => setActiveHistoryCapa(null)}
        entityType="Capa"
        entityId={activeHistoryCapa?.id || ""}
        identifier={activeHistoryCapa?.capaNumber}
        title={`${activeHistoryCapa?.capaNumber}: History & Audit Trail`}
        subtitle={activeHistoryCapa?.shortDescription}
      />
    </div>
  );
}
