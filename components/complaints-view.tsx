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
          /* Grid View Layout (2 columns) with Nested Tree Extension */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredComplaints.map((c) => {
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
                            <DropdownMenuItem asChild>
                              <Link href="/capa" className="flex items-center gap-2">
                                <GitPullRequest className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Trigger CAPA</span>
                              </Link>
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
                        <span className="font-mono text-foreground">
                          {new Date(c.awarenessDate).toLocaleDateString()}
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
                              <div className="rounded-lg bg-muted/40 hover:bg-muted/70 p-2.5 border border-border/80 transition-colors space-y-1">
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
                              </div>
                            </div>
                          )}

                          {/* 2. Vigilance Decision Tree */}
                          {vigilance && (
                            <div className="relative group text-xs">
                              <div className="absolute -left-5 top-3 w-4 h-0.5 bg-primary/30" />
                              <div className="rounded-lg bg-muted/40 hover:bg-muted/70 p-2.5 border border-border/80 transition-colors space-y-1">
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
                              </div>
                            </div>
                          )}

                          {/* 3. Customer Communication */}
                          {communications.map((comm) => (
                            <div key={comm.id} className="relative group text-xs">
                              <div className="absolute -left-5 top-3 w-4 h-0.5 bg-primary/30" />
                              <div className="rounded-lg bg-muted/40 hover:bg-muted/70 p-2.5 border border-border/80 transition-colors space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                                    <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                                    Customer Follow-up ({comm.direction})
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {new Date(comm.communicationDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {comm.notes}
                                </p>
                              </div>
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
                  {filteredComplaints.map((c) => {
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
                          </td>

                          {/* Description */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <span className="font-medium text-foreground block truncate">
                              {c.shortDescription}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate block font-mono">
                              {c.deviceModel ? `Model: ${c.deviceModel}` : ""}{" "}
                              {c.lotNumber ? `(Lot: ${c.lotNumber})` : ""}
                            </span>
                          </td>

                          {/* Priority */}
                          <td className="py-3.5 px-4">{getPriorityBadge(c.priority)}</td>

                          {/* Status */}
                          <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>

                          {/* Complaint Owner */}
                          <td className="py-3.5 px-4 text-foreground font-medium">
                            {c.complaintOwner?.firstName
                              ? `${c.complaintOwner.firstName} ${c.complaintOwner.lastName ?? ""}`
                              : c.complaintOwner?.email || "Unassigned"}
                          </td>

                          {/* Awareness Date */}
                          <td className="py-3.5 px-4 text-muted-foreground font-mono">
                            {new Date(c.awarenessDate).toLocaleDateString()}
                          </td>

                          {/* Event Country */}
                          <td className="py-3.5 px-4 text-foreground">
                            {c.countryEventOccurred || "N/A"}
                          </td>

                          {/* Date Received */}
                          <td className="py-3.5 px-4 text-muted-foreground font-mono">
                            {new Date(c.dateReceived).toLocaleDateString()}
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
                                <DropdownMenuItem asChild>
                                  <Link href="/capa" className="flex items-center gap-2">
                                    <GitPullRequest className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>Trigger CAPA</span>
                                  </Link>
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

                        {/* Nested Tree Sub-Rows (Rendered when expanded) */}
                        {isExpanded && (
                          <tr className="bg-muted/15">
                            <td colSpan={9} className="p-0 border-b border-border/80">
                              <div className="py-3 px-6 space-y-2">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                                  <span>Hierarchy of Linked Records ({totalRelations})</span>
                                </div>

                                {/* Continuous vertical line matching user image */}
                                <div className="relative pl-6 ml-4 border-l-2 border-primary/40 space-y-2">
                                  {/* 1. Investigation Sub-Row */}
                                  {investigation && (
                                    <div className="relative flex items-center justify-between bg-card/90 hover:bg-card border border-border/80 rounded-lg p-2.5 transition-colors group">
                                      {/* Horizontal Branch Marker */}
                                      <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-0.5 bg-primary/40" />

                                      <div className="flex items-center gap-3">
                                        <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                          <SearchCode className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground text-xs">
                                              Root Cause Investigation
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
                                    </div>
                                  )}

                                  {/* 2. Vigilance Decision Tree Sub-Row */}
                                  {vigilance && (
                                    <div className="relative flex items-center justify-between bg-card/90 hover:bg-card border border-border/80 rounded-lg p-2.5 transition-colors group">
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
                                            {vigilance.reportable ? "🚨 Reportable Incident (Adverse Event)" : "🛡️ Non-Reportable"} • {vigilance.rationale || "Evaluation pending."}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground shrink-0">
                                        <span className="font-mono text-[10px]">
                                          Decision Tree #{vigilance.id.slice(-6)}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* 3. Customer Communications Sub-Row */}
                                  {communications.map((comm) => (
                                    <div
                                      key={comm.id}
                                      className="relative flex items-center justify-between bg-card/90 hover:bg-card border border-border/80 rounded-lg p-2.5 transition-colors group"
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
                                        <span>{new Date(comm.communicationDate).toLocaleString()}</span>
                                      </div>
                                    </div>
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
                      <Badge variant="outline" className="text-[10px] font-mono">
                        21 CFR Part 11
                      </Badge>
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
                <div className="flex items-center gap-1.5 border-b border-border/80 pb-1">
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
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. Customer Communications Section */}
                {(drawerTab === "all" || drawerTab === "communications") && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/80 pb-2">
                      <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-foreground">
                        <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                        Customer Communications ({activeHistoryComplaint.customerCommunications?.length || 0})
                      </span>
                    </div>

                    {!activeHistoryComplaint.customerCommunications ||
                    activeHistoryComplaint.customerCommunications.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-xs bg-muted/20 rounded-lg border border-dashed border-border/80">
                        <MessageSquare className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                        <p>No customer communications logged yet.</p>
                      </div>
                    ) : (
                      <div className="relative pl-5 border-l-2 border-blue-500/40 space-y-4">
                        {activeHistoryComplaint.customerCommunications.map((comm) => (
                          <div key={comm.id} className="relative group">
                            {/* Bullet dot */}
                            <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-card border-2 border-blue-500" />

                            <div className="rounded-xl border border-border bg-card p-3.5 space-y-2 shadow-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={comm.direction === "INBOUND" ? "secondary" : "outline"}
                                    className="text-[10px] font-mono"
                                  >
                                    {comm.direction === "INBOUND" ? "📥 INBOUND" : "📤 OUTBOUND"}
                                  </Badge>
                                  <span className="text-xs font-semibold text-foreground">
                                    Customer Contact
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  {new Date(comm.communicationDate).toLocaleString()}
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
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. System Audit Trail Section */}
                {(drawerTab === "all" || drawerTab === "audit") && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/80 pb-2">
                      <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-foreground">
                        <History className="h-3.5 w-3.5 text-amber-500" />
                        Electronic Audit Trail ({activeHistoryComplaint.auditLogs?.length || 0})
                      </span>
                    </div>

                    {!activeHistoryComplaint.auditLogs ||
                    activeHistoryComplaint.auditLogs.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-xs bg-muted/20 rounded-lg border border-dashed border-border/80">
                        <History className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
                        <p>No audit events recorded yet.</p>
                      </div>
                    ) : (
                      <div className="relative pl-5 border-l-2 border-primary/40 space-y-4">
                        {activeHistoryComplaint.auditLogs.map((log, index) => (
                          <div key={log.id} className="relative group">
                            {/* Bullet point on timeline */}
                            <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-card border-2 border-primary" />

                            <div className="rounded-xl border border-border bg-card p-3.5 space-y-2 shadow-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getAuditActionBadge(log.action)}
                                  <span className="text-xs font-semibold text-foreground">
                                    {log.reason || "Record Action"}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  #{activeHistoryComplaint.auditLogs!.length - index}
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
                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                              </div>

                              {/* Technical details or diff preview */}
                              {Boolean(log.fieldChanges) && (
                                <div className="pt-2 border-t border-border/80">
                                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Field Modifications:
                                  </span>
                                  <pre className="text-[10px] font-mono bg-muted/50 p-2 rounded overflow-x-auto text-foreground">
                                    {JSON.stringify(log.fieldChanges, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Append-only immutable record (21 CFR Part 11)
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
