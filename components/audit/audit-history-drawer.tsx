"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getAuditHistory } from "@/lib/actions/audit";
import {
  Loader2,
  X,
  History,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  SearchCode,
  ShieldAlert,
  ChevronDown,
  ClipboardCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AuditAction } from "@prisma/client";
import { cn, formatUserName } from "@/lib/utils";
import { useOrganization } from "@clerk/nextjs";
import { generateAuditDiff } from "@/utils/auditDiff";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface AuditHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  title?: string;
  subtitle?: string;
  identifier?: string;
}

export function AuditHistoryDrawer({
  isOpen,
  onClose,
  entityType,
  entityId,
  title,
  subtitle,
  identifier,
}: AuditHistoryDrawerProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  const { memberships } = useOrganization({
    memberships: {
      pageSize: 100,
      keepPreviousData: true,
    },
  });

  const memberNameMap = useMemo(() => {
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

  const resolveUserDisplayName = (
    user?: {
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null,
    userId?: string | null,
    fallback = "Unassigned"
  ) => {
    if (userId && memberNameMap.has(userId)) {
      return memberNameMap.get(userId)!;
    }
    if (user?.email && memberNameMap.has(user.email)) {
      return memberNameMap.get(user.email)!;
    }
    if (user) {
      return formatUserName(user, fallback);
    }
    return fallback;
  };

  const toggleLogAccordion = (logId: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const MAX_HISTORY_PAGES = 5;
  const HISTORY_ITEMS_PER_PAGE = 5;

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setHistoryPage(1);
      setExpandedLogIds(new Set());
      getAuditHistory(entityType, entityId)
        .then((data) => setLogs(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, entityType, entityId]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Diffing helpers
  const cleanNoise = (val: unknown): unknown => {
    if (val === null || val === undefined) return val;
    if (Array.isArray(val)) {
      return val.map(cleanNoise);
    }
    if (typeof val === "object") {
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (
          ["orgId", "createdAt", "updatedAt", "deletedAt", "complaintId"].includes(k)
        )
          continue;
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

  const formatDateTime = (dateStr: Date | string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
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
      const diffs: Array<{ label: string; oldDisplay: string; newDisplay: string }> =
        [];

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
        } else if (
          typeof oItem === "object" &&
          typeof nItem === "object" &&
          oItem !== null &&
          nItem !== null
        ) {
          const cOld = cleanNoise(oItem) as Record<string, unknown>;
          const cNew = cleanNoise(nItem) as Record<string, unknown>;
          const allKeys = Array.from(
            new Set([...Object.keys(cOld), ...Object.keys(cNew)])
          );

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
      const allKeys = Array.from(
        new Set([...Object.keys(cOld), ...Object.keys(cNew)])
      );
      const diffs: Array<{ label: string; oldDisplay: string; newDisplay: string }> =
        [];

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
      case "STATUS_CHANGE":
        return (
          <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-[10px] font-mono">
            STATUS_CHANGE
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

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "Capa":
        return <ClipboardCheck className="h-4 w-4 text-blue-500" />;
      case "Investigation":
      case "InvestigationSummary":
        return <SearchCode className="h-4 w-4 text-indigo-500" />;
      case "VigilanceDecisionTree":
      case "Vigilance":
        return <ShieldAlert className="h-4 w-4 text-purple-500" />;
      case "CustomerCommunication":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      default:
        return <History className="h-4 w-4 text-amber-500" />;
    }
  };

  const totalHistoryItems = logs.length;
  const totalHistoryPages = Math.min(
    MAX_HISTORY_PAGES,
    Math.max(1, Math.ceil(totalHistoryItems / HISTORY_ITEMS_PER_PAGE))
  );
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentHistoryPage - 1) * HISTORY_ITEMS_PER_PAGE;
    return logs.slice(startIndex, startIndex + HISTORY_ITEMS_PER_PAGE);
  }, [logs, currentHistoryPage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in-0 duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
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
                    {identifier
                      ? `#${identifier.slice(-8)}`
                      : entityType.toUpperCase()}
                  </span>
                  <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                    {entityType}
                  </Badge>
                </div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  {getEntityIcon(entityType)}
                  <span>{title || `${entityType} History & Audit Trail`}</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  {subtitle ||
                    `Immutable 21 CFR Part 11 audit records for this ${entityType.toLowerCase()}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close drawer</span>
              </button>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <div className="px-2.5 py-1 text-xs rounded-md bg-muted font-bold text-foreground flex items-center gap-1.5">
                <History className="h-3 w-3 text-amber-500" />
                <span>Audit Trail ({logs.length} events)</span>
              </div>
            </div>
          </div>

          {/* Drawer Content / Timeline */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/80 pb-2">
                <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-foreground">
                  <History className="h-3.5 w-3.5 text-amber-500" />
                  Activity Timeline ({totalHistoryItems})
                </span>
                {totalHistoryPages > 1 && (
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Page {currentHistoryPage} of {totalHistoryPages} (Max {MAX_HISTORY_PAGES})
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Loading audit history...</span>
                </div>
              ) : error ? (
                <div className="text-destructive text-xs p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  Failed to load audit history: {error}
                </div>
              ) : paginatedLogs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-xs bg-muted/20 rounded-lg border border-dashed border-border/80">
                  <History className="h-7 w-7 mx-auto mb-2 opacity-40 text-amber-500" />
                  <p>No audit events recorded for this {entityType.toLowerCase()} yet.</p>
                </div>
              ) : (
                <div className="relative pl-5 border-l-2 border-border space-y-4">
                  {paginatedLogs.map((log, index) => {
                    const logIndex = logs.length - ((currentHistoryPage - 1) * HISTORY_ITEMS_PER_PAGE + index);

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
                              #{logIndex}
                            </span>
                          </div>

                          <div className="text-[11px] text-muted-foreground flex items-center justify-between font-mono">
                            <span>
                              By:{" "}
                              <strong className="text-foreground font-sans font-medium">
                                {resolveUserDisplayName(log.changedBy, log.changedById, log.changedById)}
                              </strong>
                            </span>
                            <span suppressHydrationWarning>{formatDateTime(log.timestamp)}</span>
                          </div>

                          {/* Technical details / Diff preview with accordion */}
                          {(() => {
                            const rawChanges =
                              Array.isArray(log.fieldChanges) &&
                              (log.fieldChanges as Record<string, unknown>[]).length > 0
                                ? (log.fieldChanges as Record<string, unknown>[])
                                : log.previousData &&
                                  log.newData &&
                                  typeof log.previousData === "object" &&
                                  typeof log.newData === "object"
                                ? (generateAuditDiff(
                                    log.previousData as Record<string, any>,
                                    log.newData as Record<string, any>
                                  ) as unknown as Record<string, unknown>[])
                                : [];

                            const fieldChangesList = rawChanges;
                            const isExpanded = expandedLogIds.has(log.id);

                            if (fieldChangesList.length === 0) return null;

                            return (
                              <div className="pt-2 border-t border-border/80 space-y-2">
                                <button
                                  type="button"
                                  onClick={() => toggleLogAccordion(log.id)}
                                  className="w-full flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/50 cursor-pointer font-medium"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <ChevronDown
                                      className={cn(
                                        "h-3.5 w-3.5 transition-transform duration-200 text-amber-500",
                                        isExpanded ? "rotate-180" : ""
                                      )}
                                    />
                                    <span className="text-[11px] font-sans font-semibold">
                                      {isExpanded
                                        ? "Hide Field Modifications"
                                        : "View Field Modifications"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border/60 text-muted-foreground">
                                    {fieldChangesList.length} field
                                    {fieldChangesList.length > 1 ? "s" : ""} changed
                                  </span>
                                </button>

                                {isExpanded && (
                                  <div className="space-y-2 pt-1 animate-in fade-in-0 duration-150">
                                    {fieldChangesList.map(
                                      (change: Record<string, unknown>, idx: number) => {
                                        const rawKey = String(
                                          change.field || change.fieldId || ""
                                        );
                                        const fieldLabel = String(
                                          change.fieldLabel || formatFieldTitle(rawKey)
                                        );
                                        const isComplex =
                                          typeof change.oldValue === "object" ||
                                          typeof change.newValue === "object";
                                        const diffs = extractDetailedDiffs(
                                          change.oldValue,
                                          change.newValue
                                        );

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

                                            {/* Expandable formatted raw JSON */}
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
                                                      {JSON.stringify(
                                                        cleanNoise(change.oldValue),
                                                        null,
                                                        2
                                                      )}
                                                    </pre>
                                                  </div>
                                                  <div>
                                                    <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500 mb-1">
                                                      Updated (New)
                                                    </span>
                                                    <pre className="p-2 rounded bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 overflow-x-auto text-[10px] leading-tight border border-emerald-500/10 max-h-48 overflow-y-auto">
                                                      {JSON.stringify(
                                                        cleanNoise(change.newValue),
                                                        null,
                                                        2
                                                      )}
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
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
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
                            setHistoryPage((p) =>
                              Math.min(totalHistoryPages, p + 1)
                            );
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
                  Page {currentHistoryPage} of {totalHistoryPages} (Max {MAX_HISTORY_PAGES}{" "}
                  pages) &bull; {totalHistoryItems} total records
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between text-xs">
            <span className="text-muted-foreground text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              21 CFR Part 11 Audit Trail &bull; Max {MAX_HISTORY_PAGES} pages
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
