"use client";

import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { getAuditHistory } from "@/lib/actions/audit";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AuditHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
}

export function AuditHistoryDrawer({
  isOpen,
  onClose,
  entityType,
  entityId,
}: AuditHistoryDrawerProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      getAuditHistory(entityType, entityId)
        .then((data) => setLogs(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, entityType, entityId]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Audit History</SheetTitle>
          <SheetDescription>
            Activity and changes for this {entityType.toLowerCase()}.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-md">
              Failed to load history: {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-muted-foreground text-sm text-center p-8">
              No audit history found.
            </div>
          ) : (
            <div className="space-y-6">
              {logs.map((log) => (
                <div key={log.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-sm">
                      {log.changedBy?.firstName} {log.changedBy?.lastName}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({log.changedBy?.email})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {new Date(log.timestamp).toLocaleString("en-US", { timeZone: "UTC" })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {log.action}
                    </Badge>
                    {log.reason && (
                      <span className="text-xs text-muted-foreground italic">
                        &quot;{log.reason}&quot;
                      </span>
                    )}
                  </div>
                  {log.fieldChanges && Array.isArray(log.fieldChanges) && log.fieldChanges.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Field Modifications ({log.fieldChanges.length})
                      </div>
                      <div className="space-y-2">
                        {log.fieldChanges.map((change: any, idx: number) => {
                          const rawKey = String(change.field || change.fieldId || "");
                          const fieldLabel = String(change.fieldLabel || rawKey);
                          const isComplex =
                            typeof change.oldValue === "object" ||
                            typeof change.newValue === "object";

                          return (
                            <div key={idx} className="rounded-lg border border-border/60 bg-muted/30 p-2.5 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-foreground text-[11px]">
                                  {fieldLabel}
                                </span>
                                {isComplex && (
                                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                                    Structured Data
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 bg-background/80 p-1.5 rounded border border-border/50 text-[11px] font-mono">
                                <span className="line-through text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded break-all">
                                  {typeof change.oldValue === "object" && change.oldValue !== null
                                    ? JSON.stringify(change.oldValue)
                                    : String(change.oldValue ?? "null")}
                                </span>
                                <span className="text-muted-foreground">&rarr;</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded break-all">
                                  {typeof change.newValue === "object" && change.newValue !== null
                                    ? JSON.stringify(change.newValue)
                                    : String(change.newValue ?? "null")}
                                </span>
                              </div>
                              {isComplex && (
                                <details className="text-[10px] font-mono pt-1 text-muted-foreground cursor-pointer group">
                                  <summary className="hover:text-foreground transition-colors select-none">
                                    View raw formatted JSON
                                  </summary>
                                  <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-card p-2 rounded border border-border">
                                    <div>
                                      <span className="block text-[9px] uppercase tracking-wider font-semibold text-rose-500 mb-1">
                                        Previous
                                      </span>
                                      <pre className="p-2 rounded bg-rose-500/5 text-rose-700 dark:text-rose-300 overflow-x-auto text-[10px] leading-tight border border-rose-500/10 max-h-48 overflow-y-auto">
                                        {JSON.stringify(change.oldValue, null, 2)}
                                      </pre>
                                    </div>
                                    <div>
                                      <span className="block text-[9px] uppercase tracking-wider font-semibold text-emerald-500 mb-1">
                                        Updated
                                      </span>
                                      <pre className="p-2 rounded bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 overflow-x-auto text-[10px] leading-tight border border-emerald-500/10 max-h-48 overflow-y-auto">
                                        {JSON.stringify(change.newValue, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                </details>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
