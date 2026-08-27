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
  GitMerge,
  SearchCode,
  ShieldAlert,
  MessageSquare,
  Package,
  HeartPulse,
  GitPullRequest,
  Globe,
  Calendar,
  User,
  MoreHorizontal,
  Eye,
  Copy,
  Check,
  History,
  ShieldCheck,
  FileText,
  ArrowRight,
} from "lucide-react";
import {
  Priority,
  ComplaintStatus,
  VigilanceStatus,
  InvestigationStatus,
  AuditAction,
} from "@prisma/client";
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

export interface RelatedProduct {
  id: string;
  occurrence?: string | null;
  materialNumber?: string | null;
  materialDescription?: string | null;
  serialNumber?: string | null;
  batchNumber?: string | null;
  asReportedCode1?: string | null;
  asReportedCode2?: string | null;
  softwareVersion?: string | null;
}

export interface RelatedPatient {
  id: string;
  patientName?: string | null;
  patientImpact?: string | null;
  patientImpactDesc?: string | null;
  sex?: string | null;
  age?: number | null;
  eventOccurred?: Date | string | null;
  annexE_Codes: string[];
  annexF_Codes: string[];
}

export interface RelatedCommunication {
  id: string;
  communicationDate: Date | string;
  notes: string;
  direction: string;
  author?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export interface RelatedInvestigation {
  id: string;
  status: InvestigationStatus;
  investigatorId?: string | null;
  rootCauseDesc?: string | null;
  investigationRequired?: boolean;
  investigator?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export interface RelatedVigilance {
  id: string;
  status: VigilanceStatus;
  reportable: boolean;
  rationale?: string | null;
}

export interface RelatedCapa {
  id: string;
  capaNumber: string;
  title: string;
  status: string;
  type: string;
}

export interface RelatedSample {
  id: string;
  sampleAvailable: boolean;
  status: string;
  trackingDetails?: string | null;
}

export interface RelatedAuditLog {
  id: string;
  action: AuditAction;
  timestamp: Date | string;
  reason: string | null;
  changedById: string;
  changedBy?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  previousData?: unknown;
  newData?: unknown;
  fieldChanges?: unknown;
}

export interface ComplaintRecord {
  id: string;
  complaintNumber: string;
  shortDescription: string;
  description: string;
  priority: Priority;
  status: ComplaintStatus;
  awarenessDate: Date | string;
  dateReceived: Date | string;
  countryEventOccurred: string;
  deviceModel: string | null;
  lotNumber: string | null;
  deviceSerialNumber?: string | null;
  createdById: string;
  createdBy?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  complaintOwner?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  assignedInvestigator?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  approvedBy?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  investigation?: RelatedInvestigation | null;
  vigilanceDecisionTree?: RelatedVigilance | null;
  productInformation?: RelatedProduct[];
  patientInformation?: RelatedPatient[];
  customerCommunications?: RelatedCommunication[];
  sampleManagement?: RelatedSample | null;
  capas?: RelatedCapa[];
  auditLogs?: RelatedAuditLog[];
  _count?: {
    productInformation?: number;
    patientInformation?: number;
    customerCommunications?: number;
    capas?: number;
    auditLogs?: number;
  };
}

interface ComplaintsViewProps {
  orgSlug: string;
  complaints: ComplaintRecord[];
}

export function ComplaintsView({ orgSlug, complaints }: ComplaintsViewProps) {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [activeHistoryComplaint, setActiveHistoryComplaint] =
    React.useState<ComplaintRecord | null>(null);
  const [drawerTab, setDrawerTab] = React.useState<
    "all" | "communications" | "audit"
  >("all");
  const [historyPage, setHistoryPage] = React.useState(1);
  const [complaintsPage, setComplaintsPage] = React.useState(1);

  // Reset complaints page when search query changes
  React.useEffect(() => {
    setComplaintsPage(1);
  }, [searchQuery]);

  // Reset history page when complaint or tab changes
  React.useEffect(() => {
    setHistoryPage(1);
  }, [activeHistoryComplaint?.id, drawerTab]);

  // Copy helper with temporary check indicator
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Close drawer on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeHistoryComplaint) {
        setActiveHistoryComplaint(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeHistoryComplaint]);

  // Toggle expansion of a complaint's related records
  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

  // Deterministic date formatters to prevent SSR/client hydration mismatch
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    });
  };

  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
    });
  };

  // Clean metadata and noise from JSON objects for audit trail diffing
  const cleanNoise = (val: unknown): unknown => {
    if (val === null || val === undefined) return val;
    if (Array.isArray(val)) {
      return val.map(cleanNoise);
    }
    if (typeof val === "object") {
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (["orgId", "createdAt", "updatedAt", "deletedAt", "complaintId"].includes(k)) continue;
        cleaned[k] = cleanNoise(v);
      }
      return cleaned;
    }
    return val;
  };

  const formatFieldTitle = (name: string): string => {
    if (!name) return "Field";
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatScalarValue = (val: unknown): string => {
    if (val === null || val === undefined) return "null";
    if (typeof val === "boolean") return val ? "true" : "false";
    if (typeof val === "string") {
      if (val === "") return '"" (empty)';
      return val;
    }
    if (typeof val === "number") return String(val);
    return JSON.stringify(cleanNoise(val));
  };

  const extractDetailedDiffs = (
    oldVal: unknown,
    newVal: unknown
  ): Array<{ label: string; oldDisplay: string; newDisplay: string }> => {
    const isOldObj = typeof oldVal === "object" && oldVal !== null;
    const isNewObj = typeof newVal === "object" && newVal !== null;

    if (!isOldObj && !isNewObj) {
      return [
        {
          label: "",
          oldDisplay: formatScalarValue(oldVal),
          newDisplay: formatScalarValue(newVal),
        },
      ];
    }

    if (Array.isArray(oldVal) || Array.isArray(newVal)) {
      const oldArr = Array.isArray(oldVal) ? oldVal : oldVal ? [oldVal] : [];
      const newArr = Array.isArray(newVal) ? newVal : newVal ? [newVal] : [];
      const maxLen = Math.max(oldArr.length, newArr.length);
      const diffs: Array<{ label: string; oldDisplay: string; newDisplay: string }> = [];

      for (let i = 0; i < maxLen; i++) {
        const oItem = oldArr[i];
        const nItem = newArr[i];
        const prefix = maxLen > 1 ? `[Item ${i + 1}] ` : "";

        if (oItem !== undefined && nItem === undefined) {
          diffs.push({
            label: `${prefix}Item Removed`,
            oldDisplay: formatScalarValue(cleanNoise(oItem)),
            newDisplay: "(removed)",
          });
        } else if (oItem === undefined && nItem !== undefined) {
          diffs.push({
            label: `${prefix}Item Added`,
            oldDisplay: "(none)",
            newDisplay: formatScalarValue(cleanNoise(nItem)),
          });
        } else if (typeof oItem === "object" && typeof nItem === "object" && oItem !== null && nItem !== null) {
          const cOld = cleanNoise(oItem) as Record<string, unknown>;
          const cNew = cleanNoise(nItem) as Record<string, unknown>;
          const allKeys = Array.from(new Set([...Object.keys(cOld), ...Object.keys(cNew)]));

          let subDiffFound = false;
          for (const k of allKeys) {
            const oSub = cOld[k];
            const nSub = cNew[k];
            if (JSON.stringify(oSub) !== JSON.stringify(nSub)) {
              subDiffFound = true;
              diffs.push({
                label: `${prefix}${k}`,
                oldDisplay: formatScalarValue(oSub),
                newDisplay: formatScalarValue(nSub),
              });
            }
          }
          if (!subDiffFound) {
            diffs.push({
              label: `${prefix}Record updated`,
              oldDisplay: "modified",
              newDisplay: "re-saved",
            });
          }
        } else {
          diffs.push({
            label: `${prefix}`,
            oldDisplay: formatScalarValue(oItem),
            newDisplay: formatScalarValue(nItem),
          });
        }
      }
      return diffs.length > 0
        ? diffs
        : [
            {
              label: "",
              oldDisplay: formatScalarValue(oldVal),
              newDisplay: formatScalarValue(newVal),
            },
          ];
    }

    if (isOldObj && isNewObj) {
      const cOld = cleanNoise(oldVal) as Record<string, unknown>;
      const cNew = cleanNoise(newVal) as Record<string, unknown>;
      const allKeys = Array.from(new Set([...Object.keys(cOld), ...Object.keys(cNew)]));
      const diffs: Array<{ label: string; oldDisplay: string; newDisplay: string }> = [];

      for (const k of allKeys) {
        const oSub = cOld[k];
        const nSub = cNew[k];
        if (JSON.stringify(oSub) !== JSON.stringify(nSub)) {
          diffs.push({
            label: k,
            oldDisplay: formatScalarValue(oSub),
            newDisplay: formatScalarValue(nSub),
          });
        }
      }
      return diffs.length > 0
        ? diffs
        : [
            {
              label: "",
              oldDisplay: formatScalarValue(oldVal),
              newDisplay: formatScalarValue(newVal),
            },
          ];
    }

    return [
      {
        label: "",
        oldDisplay: formatScalarValue(oldVal),
        newDisplay: formatScalarValue(newVal),
      },
    ];
  };

  const filteredComplaints = complaints.filter(
    (c) =>
      c.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complaintNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.deviceModel &&
        c.deviceModel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.lotNumber &&
        c.lotNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.countryEventOccurred &&
        c.countryEventOccurred.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.complaintOwner?.email &&
        c.complaintOwner.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.complaintOwner?.firstName &&
        c.complaintOwner.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.complaintOwner?.lastName &&
        c.complaintOwner.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const MAX_COMPLAINTS_PAGES = 10;
  const COMPLAINTS_PER_PAGE = 10;

  const totalComplaintsItems = filteredComplaints.length;
  const totalComplaintsPages = Math.min(
    MAX_COMPLAINTS_PAGES,
    Math.max(1, Math.ceil(totalComplaintsItems / COMPLAINTS_PER_PAGE))
  );
  const currentComplaintsPage = Math.min(complaintsPage, totalComplaintsPages);

  const paginatedComplaints = React.useMemo(() => {
    const startIndex = (currentComplaintsPage - 1) * COMPLAINTS_PER_PAGE;
    return filteredComplaints.slice(
      startIndex,
      startIndex + COMPLAINTS_PER_PAGE
    );
  }, [filteredComplaints, currentComplaintsPage]);

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-3 w-3" /> Critical
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            High
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
            Low
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

  const getAuditActionBadge = (action: AuditAction) => {
    switch (action) {
      case "CREATE":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] font-mono">
            CREATE
          </Badge>
        );
      case "UPDATE":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-mono">
            UPDATE
          </Badge>
        );
      case "APPROVE_CLOSE":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-mono">
            APPROVE_CLOSE
          </Badge>
        );
      case "INVESTIGATION_SUBMIT":
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[10px] font-mono">
            INVESTIGATION
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] font-mono">
            {action}
          </Badge>
        );
    }
  };

  const MAX_HISTORY_PAGES = 5;
  const HISTORY_ITEMS_PER_PAGE = 5;

  type HistoryTimelineItem =
    | {
        type: "communication";
        id: string;
        timestamp: number;
        data: RelatedCommunication;
      }
    | {
        type: "audit";
        id: string;
        timestamp: number;
        logIndex: number;
        data: RelatedAuditLog;
      };

  const activeHistoryItems = React.useMemo<HistoryTimelineItem[]>(() => {
    if (!activeHistoryComplaint) return [];

    const items: HistoryTimelineItem[] = [];

    if (drawerTab === "all" || drawerTab === "communications") {
      (activeHistoryComplaint.customerCommunications || []).forEach((comm) => {
        items.push({
          type: "communication",
          id: comm.id,
          timestamp: new Date(comm.communicationDate).getTime() || 0,
          data: comm,
        });
      });
    }

    if (drawerTab === "all" || drawerTab === "audit") {
      const logs = activeHistoryComplaint.auditLogs || [];
      logs.forEach((log, index) => {
        items.push({
          type: "audit",
          id: log.id,
          timestamp: new Date(log.timestamp).getTime() || 0,
          logIndex: logs.length - index,
          data: log,
        });
      });
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [activeHistoryComplaint, drawerTab]);

  const totalHistoryItems = activeHistoryItems.length;
  const totalHistoryPages = Math.min(
    MAX_HISTORY_PAGES,
    Math.max(1, Math.ceil(totalHistoryItems / HISTORY_ITEMS_PER_PAGE))
  );
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);

  const paginatedHistoryItems = React.useMemo(() => {
    const startIndex = (currentHistoryPage - 1) * HISTORY_ITEMS_PER_PAGE;
    return activeHistoryItems.slice(
      startIndex,
      startIndex + HISTORY_ITEMS_PER_PAGE
    );
  }, [activeHistoryItems, currentHistoryPage]);

  return (
    <div className="space-y-6 w-full max-w-8xl mx-auto">
      {/* Full-Width Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        {/* Full-width Real-time Search Input */}
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search Complaints by ID, title, owner, country, model, or lot..."
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
            Showing {paginatedComplaints.length} of {totalComplaintsItems}
            {totalComplaintsPages > 1
              ? ` (Page ${currentComplaintsPage} of ${totalComplaintsPages})`
              : ""}
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
          /* Grid View Layout (2 columns) with Nested Tree Extension */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedComplaints.map((c) => {
              const isExpanded = expandedIds.has(c.id);
              const communications = c.customerCommunications || [];
              const investigation = c.investigation;
              const vigilance = c.vigilanceDecisionTree;
              const totalRelations =
                (investigation ? 1 : 0) +
                (vigilance ? 1 : 0) +
                communications.length;

              return (
                <div
                  key={c.id}
                  className={`rounded-xl border transition-all shadow-xs flex flex-col justify-between ${
                    isExpanded
                      ? "border-primary/50 bg-card ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-neutral-400 dark:hover:border-neutral-700"
                  } p-5 space-y-4`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
                          <FileSpreadsheet className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/complaints/${c.id}`}
                              className="text-sm font-bold text-foreground hover:underline font-mono"
                            >
                              {c.complaintNumber}
                            </Link>

                            {/* Git-Merge Trigger Button right next to Record ID */}
                            <button
                              type="button"
                              onClick={(e) => toggleExpand(c.id, e)}
                              title={
                                isExpanded
                                  ? "Collapse related records"
                                  : `Expand ${totalRelations} related records`
                              }
                              className={`flex h-6 w-6 items-center justify-center rounded-md border transition-all cursor-pointer ${
                                isExpanded
                                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                  : "bg-muted/80 hover:bg-accent border-border text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <GitMerge className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="text-[11px] text-muted-foreground block truncate font-mono">
                            {c.deviceModel ? `Model: ${c.deviceModel}` : ""}{" "}
                            {c.lotNumber ? `(Lot: ${c.lotNumber})` : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {getPriorityBadge(c.priority)}

                        {/* Three-Dots Actions Dropdown Menu */}
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
                            <DropdownMenuLabel>Complaint Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/complaints/${c.id}`} className="flex items-center gap-2">
                                <Eye className="h-3.5 w-3.5 text-primary" />
                                <span>View / Edit Details</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setActiveHistoryComplaint(c)}
                              className="flex items-center gap-2"
                            >
                              <History className="h-3.5 w-3.5 text-amber-500" />
                              <span>View History</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => copyToClipboard(c.complaintNumber)}
                              className="flex items-center gap-2"
                            >
                              {copiedId === c.complaintNumber ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span>
                                {copiedId === c.complaintNumber ? "Copied ID!" : "Copy Identifier"}
                              </span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-foreground block line-clamp-1">
                        {c.shortDescription}
                      </span>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    {/* Owner, Awareness Date, Country Metadata Row */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] bg-muted/20 rounded-lg p-2 border border-border/60">
                      <div>
                        <span className="text-muted-foreground block text-[10px] flex items-center gap-1">
                          <User className="h-2.5 w-2.5" /> Owner
                        </span>
                        <span className="font-medium text-foreground truncate block">
                          {c.complaintOwner?.firstName
                            ? `${c.complaintOwner.firstName} ${c.complaintOwner.lastName ?? ""}`
                            : c.complaintOwner?.email || "Unassigned"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" /> Awareness Date
                        </span>
                        <span className="font-mono text-foreground" suppressHydrationWarning>
                          {formatDate(c.awarenessDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] flex items-center gap-1">
                          <Globe className="h-2.5 w-2.5" /> Country
                        </span>
                        <span className="font-medium text-foreground truncate block">
                          {c.countryEventOccurred || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Tree Section in Grid Card */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-border animate-in fade-in slide-in-from-top-1 duration-150 space-y-3">
                        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          <span>Auto-Generated & Related Quality Records</span>
                          <span className="font-mono text-primary font-semibold">
                            {totalRelations} records
                          </span>
                        </div>

                        {/* Vertical Tree Connector */}
                        <div className="relative pl-5 ml-2 border-l-2 border-primary/30 space-y-2.5">
                          {/* 1. Investigation */}
                          {investigation && (
                            <div className="relative group text-xs">
                              {/* Horizontal branch line */}
                              <div className="absolute -left-5 top-3 w-4 h-0.5 bg-primary/30" />
                              <Link href={`/complaints/${c.id}/investigation`} className="block rounded-lg bg-muted/40 hover:bg-muted/70 p-2.5 border border-border/80 transition-colors space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                                    <SearchCode className="h-3.5 w-3.5 text-indigo-500" />
                                    Investigation
                                  </span>
                                  <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                                    {investigation.status}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {investigation.rootCauseDesc || "Root cause investigation open / not started."}
                                </p>
                              </Link>
                            </div>
                          )}

                          {/* 2. Vigilance Decision Tree */}
                          {vigilance && (
                            <div className="relative group text-xs">
                              <div className="absolute -left-5 top-3 w-4 h-0.5 bg-primary/30" />
                              <Link href={`/complaints/${c.id}/vigilance`} className="block rounded-lg bg-muted/40 hover:bg-muted/70 p-2.5 border border-border/80 transition-colors space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                                    <ShieldAlert className="h-3.5 w-3.5 text-purple-500" />
                                    Vigilance Decision Tree
                                  </span>
                                  <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20">
                                    {vigilance.status}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {vigilance.reportable ? "🚨 Reportable Incident" : "🛡️ Non-Reportable Evaluation"} • {vigilance.rationale || "Initial decision tree pending."}
                                </p>
                              </Link>
                            </div>
                          )}

                          {/* 3. Customer Communication */}
                          {communications.map((comm) => (
                            <div key={comm.id} className="relative group text-xs">
                              <div className="absolute -left-5 top-3 w-4 h-0.5 bg-primary/30" />
                              <Link href={`/complaints/${c.id}/communications/${comm.id}`} className="block rounded-lg bg-muted/40 hover:bg-muted/70 p-2.5 border border-border/80 transition-colors space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                                    <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                                    Customer Follow-up ({comm.direction})
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono" suppressHydrationWarning>
                                    {formatDate(comm.communicationDate)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {comm.notes}
                                </p>
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 text-xs flex items-center justify-between text-muted-foreground font-mono border-t border-border">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(c.status)}
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span suppressHydrationWarning>{formatDate(c.dateReceived)}</span>
                      <Link
                        href={`/complaints/${c.id}`}
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
        ) : (
          /* List View Layout (Horizontal Table with Tree Sub-Rows) */
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Record ID</th>
                    <th className="py-3 px-4">Description & Details</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Complaint Owner</th>
                    <th className="py-3 px-4">Awareness Date</th>
                    <th className="py-3 px-4">Event Country</th>
                    <th className="py-3 px-4">Date Received</th>
                    <th className="py-3 px-4 w-10 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedComplaints.map((c) => {
                    const isExpanded = expandedIds.has(c.id);
                    const communications = c.customerCommunications || [];
                    const investigation = c.investigation;
                    const vigilance = c.vigilanceDecisionTree;
                    const totalRelations =
                      (investigation ? 1 : 0) +
                      (vigilance ? 1 : 0) +
                      communications.length;

                    return (
                      <React.Fragment key={c.id}>
                        {/* Parent Complaint Row */}
                        <tr
                          className={`transition-colors ${
                            isExpanded ? "bg-muted/30 font-medium" : "hover:bg-accent/40"
                          }`}
                        >
                          {/* Record ID with Git-Merge Button */}
                          <td className="py-3.5 px-4 font-mono font-semibold text-primary">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/complaints/${c.id}`}
                                className="hover:underline flex items-center gap-1"
                              >
                                {c.complaintNumber}
                              </Link>

                              {/* Expand/Collapse Toggle Button */}
                              {totalRelations > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => toggleExpand(c.id, e)}
                                  className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-transform cursor-pointer"
                                  title={
                                    isExpanded
                                      ? "Collapse related records"
                                      : "Expand related records"
                                  }
                                >
                                  <ChevronRight
                                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                      isExpanded ? "rotate-90 text-primary" : ""
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Short Description */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <span
                              className="text-xs font-semibold text-foreground truncate block"
                              title={c.shortDescription}
                            >
                              {c.shortDescription}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate block">
                              {c.deviceModel ? `Model: ${c.deviceModel}` : "Standard Device"}
                            </span>
                          </td>

                          {/* Priority */}
                          <td className="py-3.5 px-4">{getPriorityBadge(c.priority)}</td>

                          {/* Status */}
                          <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>

                          {/* Complaint Owner */}
                          <td className="py-3.5 px-4 text-xs text-muted-foreground">
                            {c.complaintOwner?.firstName
                              ? `${c.complaintOwner.firstName} ${c.complaintOwner.lastName ?? ""}`
                              : c.complaintOwner?.email || "Unassigned"}
                          </td>

                          {/* Awareness Date */}
                          <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground" suppressHydrationWarning>
                            {formatDate(c.awarenessDate)}
                          </td>

                          {/* Event Country */}
                          <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                            {c.countryEventOccurred || "US"}
                          </td>

                          {/* Date Received */}
                          <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground" suppressHydrationWarning>
                            {formatDate(c.dateReceived)}
                          </td>

                          {/* Three-Dots Actions Dropdown Menu */}
                          <td className="py-3.5 px-4 text-right">
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
                                <DropdownMenuLabel>Complaint Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/complaints/${c.id}`} className="flex items-center gap-2">
                                    <Eye className="h-3.5 w-3.5 text-primary" />
                                    <span>View / Edit Details</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setActiveHistoryComplaint(c)}
                                  className="flex items-center gap-2"
                                >
                                  <History className="h-3.5 w-3.5 text-amber-500" />
                                  <span>View History</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => copyToClipboard(c.complaintNumber)}
                                  className="flex items-center gap-2"
                                >
                                  {copiedId === c.complaintNumber ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <span>
                                    {copiedId === c.complaintNumber ? "Copied ID!" : "Copy Identifier"}
                                  </span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>

                        {/* Nested Expansion Rows */}
                        {isExpanded && totalRelations > 0 && (
                          <tr className="bg-muted/15">
                            <td colSpan={9} className="p-0 border-b border-border/80">
                              <div className="py-3 px-6 pl-12 space-y-2 border-l-2 border-primary/50 ml-6 my-2">
                                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                  Related Workflows &amp; Direct Linkages:
                                </div>
                                <div className="space-y-1.5">
                                  {/* 1. Investigation Workflow Sub-Row */}
                                  {investigation && (
                                    <Link
                                      href={`/complaints/${c.id}/investigation`}
                                      className="relative flex items-center justify-between bg-card/90 hover:bg-card border border-border/80 rounded-lg p-2.5 transition-colors group block"
                                    >
                                      <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-0.5 bg-primary/40" />

                                      <div className="flex items-center gap-3">
                                        <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                          <SearchCode className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground text-xs">
                                              Formal Investigation Workflow
                                            </span>
                                            <Badge variant="outline" className="text-[9px] bg-indigo-500/10 text-indigo-600 border-indigo-500/20 py-0">
                                              {investigation.status}
                                            </Badge>
                                          </div>
                                          <span className="text-[11px] text-muted-foreground">
                                            {investigation.rootCauseDesc || "Investigation workflow initialized and open."}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground shrink-0">
                                        <span>
                                          Investigator:{" "}
                                          <strong className="text-foreground font-medium">
                                            {investigation.investigator?.email || "Unassigned"}
                                          </strong>
                                        </span>
                                      </div>
                                    </Link>
                                  )}

                                  {/* 2. Vigilance Decision Tree Sub-Row */}
                                  {vigilance && (
                                    <Link
                                      href={`/complaints/${c.id}/vigilance`}
                                      className="relative flex items-center justify-between bg-card/90 hover:bg-card border border-border/80 rounded-lg p-2.5 transition-colors group block"
                                    >
                                      <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-0.5 bg-primary/40" />

                                      <div className="flex items-center gap-3">
                                        <div className="flex h-6 w-6 items-center justify-center rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                                          <ShieldAlert className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground text-xs">
                                              Vigilance Decision Tree (MDR / FDA)
                                            </span>
                                            <Badge variant="outline" className="text-[9px] bg-purple-500/10 text-purple-600 border-purple-500/20 py-0">
                                              {vigilance.status}
                                            </Badge>
                                          </div>
                                          <span className="text-[11px] text-muted-foreground">
                                            {vigilance.reportable ? "🚨 Reportable Incident (Adverse Event)" : "🛡️ Non-Reportable"} &bull; {vigilance.rationale || "Evaluation pending."}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground shrink-0">
                                        <span className="font-mono text-[10px]">
                                          Decision Tree #{vigilance.id.slice(-6)}
                                        </span>
                                      </div>
                                    </Link>
                                  )}

                                  {/* 3. Customer Communications Sub-Row */}
                                  {communications.map((comm) => (
                                    <Link
                                      key={comm.id}
                                      href={`/complaints/${c.id}/communications/${comm.id}`}
                                      className="relative flex items-center justify-between bg-card/90 hover:bg-card border border-border/80 rounded-lg p-2.5 transition-colors group block"
                                    >
                                      <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-0.5 bg-primary/40" />

                                      <div className="flex items-center gap-3">
                                        <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                          <MessageSquare className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground text-xs">
                                              Customer Follow-up Log
                                            </span>
                                            <Badge variant="secondary" className="text-[9px] py-0 font-mono">
                                              {comm.direction}
                                            </Badge>
                                          </div>
                                          <span className="text-[11px] text-muted-foreground">
                                            {comm.notes}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-mono shrink-0">
                                        <span suppressHydrationWarning>{formatDateTime(comm.communicationDate)}</span>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Controls for Grid & Row (List) view */}
        {totalComplaintsPages > 1 && (
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-mono text-muted-foreground">
              Showing {(currentComplaintsPage - 1) * COMPLAINTS_PER_PAGE + 1} -{" "}
              {Math.min(
                currentComplaintsPage * COMPLAINTS_PER_PAGE,
                totalComplaintsItems
              )}{" "}
              of {totalComplaintsItems} complaints &bull; Page {currentComplaintsPage} of {totalComplaintsPages} (Max {MAX_COMPLAINTS_PAGES} pages)
            </span>
            <Pagination className="w-auto mx-0 justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentComplaintsPage > 1) {
                        setComplaintsPage((p) => Math.max(1, p - 1));
                      }
                    }}
                    className={
                      currentComplaintsPage <= 1
                        ? "pointer-events-none opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {Array.from({ length: totalComplaintsPages }).map((_, i) => {
                  const pageNumber = i + 1;
                  if (
                    totalComplaintsPages <= 7 ||
                    pageNumber === 1 ||
                    pageNumber === totalComplaintsPages ||
                    (pageNumber >= currentComplaintsPage - 1 &&
                      pageNumber <= currentComplaintsPage + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          isActive={currentComplaintsPage === pageNumber}
                          onClick={(e) => {
                            e.preventDefault();
                            setComplaintsPage(pageNumber);
                          }}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    pageNumber === currentComplaintsPage - 2 ||
                    pageNumber === currentComplaintsPage + 2
                  ) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentComplaintsPage < totalComplaintsPages) {
                        setComplaintsPage((p) => Math.min(totalComplaintsPages, p + 1));
                      }
                    }}
                    className={
                      currentComplaintsPage >= totalComplaintsPages
                        ? "pointer-events-none opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Slide-over Audit Trail & Communications History Drawer */}
      {activeHistoryComplaint && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in-0 duration-200">
          {/* Backdrop */}
          <div
            onClick={() => setActiveHistoryComplaint(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-card border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-border space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">
                        {activeHistoryComplaint.complaintNumber}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {orgSlug}
                      </Badge>
                    </div>
                    <h2 className="text-base font-bold text-foreground">
                      Complaint History &amp; Audit Trail
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {activeHistoryComplaint.shortDescription}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveHistoryComplaint(null)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close drawer</span>
                  </button>
                </div>

                {/* Sub-tab Filter Selector */}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setDrawerTab("all")}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                      drawerTab === "all"
                        ? "font-bold text-foreground bg-muted"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All History (
                    {(activeHistoryComplaint.customerCommunications?.length || 0) +
                      (activeHistoryComplaint.auditLogs?.length || 0)}
                    )
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerTab("communications")}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                      drawerTab === "communications"
                        ? "font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className="h-3 w-3" />
                    Follow-ups (
                    {activeHistoryComplaint.customerCommunications?.length || 0}
                    )
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerTab("audit")}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                      drawerTab === "audit"
                        ? "font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <History className="h-3 w-3" />
                    Audit Logs (
                    {activeHistoryComplaint.auditLogs?.length || 0}
                    )
                  </button>
                </div>
              </div>

              {/* Drawer Content / Timeline */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/80 pb-2">
                    <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-foreground">
                      {drawerTab === "communications" ? (
                        <>
                          <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                          Customer Communications ({activeHistoryComplaint.customerCommunications?.length || 0})
                        </>
                      ) : drawerTab === "audit" ? (
                        <>
                          <History className="h-3.5 w-3.5 text-amber-500" />
                          Electronic Audit Trail ({activeHistoryComplaint.auditLogs?.length || 0})
                        </>
                      ) : (
                        <>
                          <History className="h-3.5 w-3.5 text-primary" />
                          Activity Timeline ({totalHistoryItems})
                        </>
                      )}
                    </span>
                    {totalHistoryPages > 1 && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        Page {currentHistoryPage} of {totalHistoryPages} (Max {MAX_HISTORY_PAGES})
                      </span>
                    )}
                  </div>

                  {paginatedHistoryItems.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-xs bg-muted/20 rounded-lg border border-dashed border-border/80">
                      {drawerTab === "communications" ? (
                        <>
                          <MessageSquare className="h-7 w-7 mx-auto mb-2 opacity-40 text-blue-500" />
                          <p>No customer communications logged yet.</p>
                        </>
                      ) : drawerTab === "audit" ? (
                        <>
                          <History className="h-7 w-7 mx-auto mb-2 opacity-40 text-amber-500" />
                          <p>No audit events recorded yet.</p>
                        </>
                      ) : (
                        <>
                          <History className="h-7 w-7 mx-auto mb-2 opacity-40" />
                          <p>No history or audit events recorded yet.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="relative pl-5 border-l-2 border-border space-y-4">
                      {paginatedHistoryItems.map((item) => {
                        if (item.type === "communication") {
                          const comm = item.data;
                          return (
                            <div key={`comm-${comm.id}`} className="relative group">
                              {/* Bullet dot */}
                              <div className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full bg-card border-2 border-blue-500 ring-4 ring-background" />

                              <div className="rounded-xl border border-border bg-card p-3.5 space-y-2 shadow-xs hover:border-blue-500/30 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={comm.direction === "INBOUND" ? "secondary" : "outline"}
                                      className="text-[10px] font-mono"
                                    >
                                      {comm.direction === "INBOUND" ? "📥 INBOUND" : "📤 OUTBOUND"}
                                    </Badge>
                                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                      <MessageSquare className="h-3 w-3 text-blue-500" />
                                      Customer Contact
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-muted-foreground" suppressHydrationWarning>
                                    {formatDateTime(comm.communicationDate)}
                                  </span>
                                </div>

                                <div className="text-[11px] text-muted-foreground">
                                  Logged by:{" "}
                                  <strong className="text-foreground font-sans font-medium">
                                    {comm.author?.firstName
                                      ? `${comm.author.firstName} ${comm.author.lastName ?? ""}`
                                      : comm.author?.email || "System"}
                                  </strong>
                                </div>

                                <div className="rounded-lg bg-muted/40 p-2.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap border border-border/40">
                                  {comm.notes}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        if (item.type === "audit") {
                          const log = item.data;
                          return (
                            <div key={`audit-${log.id}`} className="relative group">
                              {/* Bullet point on timeline */}
                              <div className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full bg-card border-2 border-amber-500 ring-4 ring-background" />

                              <div className="rounded-xl border border-border bg-card p-3.5 space-y-2 shadow-xs hover:border-amber-500/30 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {getAuditActionBadge(log.action)}
                                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                      <History className="h-3 w-3 text-amber-500" />
                                      {log.reason || "Record Action"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    #{item.logIndex}
                                  </span>
                                </div>

                                <div className="text-[11px] text-muted-foreground flex items-center justify-between font-mono">
                                  <span>
                                    By:{" "}
                                    <strong className="text-foreground font-sans font-medium">
                                      {log.changedBy?.firstName
                                        ? `${log.changedBy.firstName} ${log.changedBy.lastName ?? ""}`
                                        : log.changedBy?.email || log.changedById}
                                    </strong>
                                  </span>
                                  <span suppressHydrationWarning>{formatDateTime(log.timestamp)}</span>
                                </div>

                                {/* Technical details or diff preview */}
                                {Boolean(log.fieldChanges) &&
                                  Array.isArray(log.fieldChanges) &&
                                  (log.fieldChanges as Record<string, unknown>[]).length > 0 && (
                                    <div className="pt-2 border-t border-border/80 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                          Field Modifications:
                                        </span>
                                        <span className="text-[10px] font-mono text-muted-foreground">
                                          {(log.fieldChanges as Record<string, unknown>[]).length} field{(log.fieldChanges as Record<string, unknown>[]).length > 1 ? "s" : ""} changed
                                        </span>
                                      </div>

                                      <div className="space-y-2">
                                        {(log.fieldChanges as Record<string, unknown>[]).map(
                                          (change: Record<string, unknown>, idx: number) => {
                                            const rawKey = String(change.field || change.fieldId || "");
                                            const fieldLabel = String(change.fieldLabel || formatFieldTitle(rawKey));
                                            const isComplex =
                                              typeof change.oldValue === "object" ||
                                              typeof change.newValue === "object";
                                            const diffs = extractDetailedDiffs(change.oldValue, change.newValue);

                                            return (
                                              <div
                                                key={idx}
                                                className="rounded-lg border border-border/60 bg-muted/30 p-2.5 space-y-1.5 text-xs"
                                              >
                                                {/* Field Label Header */}
                                                <div className="flex items-center justify-between gap-2">
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                    <span className="font-semibold text-foreground text-[11px] font-sans">
                                                      {fieldLabel}
                                                    </span>
                                                    {rawKey && rawKey !== fieldLabel && (
                                                      <span className="text-[10px] font-mono text-muted-foreground">
                                                        ({rawKey})
                                                      </span>
                                                    )}
                                                  </div>
                                                  {isComplex && (
                                                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                                                      Structured Data
                                                    </span>
                                                  )}
                                                </div>

                                                {/* Visual Diff Badges */}
                                                <div className="space-y-1.5">
                                                  {diffs.map((diff, dIdx) => (
                                                    <div
                                                      key={dIdx}
                                                      className="flex flex-col sm:flex-row sm:items-center gap-1.5 bg-background/80 p-1.5 rounded border border-border/50 text-[11px] font-mono"
                                                    >
                                                      {diff.label && (
                                                        <span className="text-muted-foreground font-medium text-[10px] sm:min-w-[110px] shrink-0">
                                                          {diff.label}:
                                                        </span>
                                                      )}
                                                      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                                                        <span className="line-through text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded text-[11px] break-all">
                                                          {diff.oldDisplay}
                                                        </span>
                                                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[11px] break-all">
                                                          {diff.newDisplay}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>

                                                {/* Expandable formatted raw JSON for deep inspection */}
                                                {isComplex && (
                                                  <details className="text-[10px] font-mono pt-1 text-muted-foreground cursor-pointer group">
                                                    <summary className="hover:text-foreground transition-colors select-none">
                                                      View raw formatted JSON
                                                    </summary>
                                                    <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-card p-2 rounded border border-border">
                                                      <div>
                                                        <span className="block text-[9px] uppercase tracking-wider font-semibold text-rose-500 mb-1">
                                                          Previous (Old)
                                                        </span>
                                                        <pre className="p-2 rounded bg-rose-500/5 text-rose-700 dark:text-rose-300 overflow-x-auto text-[10px] leading-tight border border-rose-500/10 max-h-48 overflow-y-auto">
                                                          {JSON.stringify(cleanNoise(change.oldValue), null, 2)}
                                                        </pre>
                                                      </div>
                                                      <div>
                                                        <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500 mb-1">
                                                          Updated (New)
                                                        </span>
                                                        <pre className="p-2 rounded bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 overflow-x-auto text-[10px] leading-tight border border-emerald-500/10 max-h-48 overflow-y-auto">
                                                          {JSON.stringify(cleanNoise(change.newValue), null, 2)}
                                                        </pre>
                                                      </div>
                                                    </div>
                                                  </details>
                                                )}
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalHistoryItems > 0 && (
                  <div className="pt-4 border-t border-border/80 space-y-2">
                    <Pagination className="w-full justify-center">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentHistoryPage > 1) {
                                setHistoryPage((p) => Math.max(1, p - 1));
                              }
                            }}
                            className={
                              currentHistoryPage <= 1
                                ? "pointer-events-none opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>

                        {Array.from({ length: totalHistoryPages }).map((_, i) => {
                          const pageNum = i + 1;
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                isActive={currentHistoryPage === pageNum}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setHistoryPage(pageNum);
                                }}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentHistoryPage < totalHistoryPages) {
                                setHistoryPage((p) => Math.min(totalHistoryPages, p + 1));
                              }
                            }}
                            className={
                              currentHistoryPage >= totalHistoryPages
                                ? "pointer-events-none opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    <div className="text-[11px] text-muted-foreground text-center font-mono">
                      Page {currentHistoryPage} of {totalHistoryPages} (Max {MAX_HISTORY_PAGES} pages) &bull; {totalHistoryItems} total records
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  History record &bull; Max {MAX_HISTORY_PAGES} pages
                </span>
                <button
                  type="button"
                  onClick={() => setActiveHistoryComplaint(null)}
                  className="rounded-lg bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
