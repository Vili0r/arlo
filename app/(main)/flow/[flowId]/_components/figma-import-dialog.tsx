"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Link2,
  ExternalLink,
  Layers,
  Loader2,
  PenTool,
  RefreshCcw,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Screen } from "@/lib/types";
import { fetchFigmaImportPreview, getFigmaConnectionStatus } from "../actions";
import type { ImportMode } from "../_lib/code-import";
import { createImportedFigmaScreen, type ImportedFigmaPayload } from "../_lib/imported-figma-screen";
import type { ParsedFigmaImport } from "../_lib/figma-import";

interface FigmaImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowId: string;
  currentScreenName: string;
  initialSource?: string;
  initialImport?: ImportedFigmaPayload | null;
  defaultMode?: ImportMode;
  lockMode?: boolean;
  title?: string;
  description?: string;
  submitLabel?: string;
  onImport: (payload: { screen: Screen; mode: ImportMode }) => void;
}

interface FigmaConnectionStatus {
  mode: "oauth" | "token" | "none";
  connected: boolean;
  accountLabel: string | null;
  expiresAt: string | null;
  connectUrl: string | null;
}

function payloadToParsedImport(payload: ImportedFigmaPayload): ParsedFigmaImport {
  return {
    fileKey: payload.fileKey,
    nodeId: payload.nodeId,
    nodeName: payload.nodeName,
    fileName: payload.fileName,
    sourceUrl: payload.sourceUrl,
    lastSyncedAt: payload.lastSyncedAt,
    warnings: payload.warnings,
    previewTree: payload.previewTree,
    screen: payload.previewScreen,
  };
}

export function FigmaImportDialog({
  open,
  onOpenChange,
  flowId,
  currentScreenName,
  initialSource,
  initialImport,
  defaultMode = "append",
  lockMode = false,
  title = "Import a Figma frame",
  description = "Paste a Figma frame URL that includes a node-id. Arlo will fetch the frame, generate a read-only preview, and store the source metadata so you can re-sync it later.",
  submitLabel = "Import to builder",
  onImport,
}: FigmaImportDialogProps) {
  const [source, setSource] = useState(initialSource ?? "");
  const [mode, setMode] = useState<ImportMode>(defaultMode);
  const [resolvedImport, setResolvedImport] = useState<ParsedFigmaImport | null>(
    initialImport ? payloadToParsedImport(initialImport) : null,
  );
  const [connectionStatus, setConnectionStatus] = useState<FigmaConnectionStatus | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isPreviewStale = useMemo(() => {
    if (!resolvedImport) return false;
    return resolvedImport.sourceUrl.trim() !== source.trim();
  }, [resolvedImport, source]);

  const needsOAuthConnection = connectionStatus?.mode === "oauth" && !connectionStatus.connected;

  useEffect(() => {
    if (!open) return;

    startTransition(() => {
      void (async () => {
        try {
          const status = await getFigmaConnectionStatus({ flowId });
          setConnectionStatus(status);
          setConnectionError(null);
        } catch (nextError) {
          setConnectionError(
            nextError instanceof Error ? nextError.message : "Unable to check your Figma connection.",
          );
        }
      })();
    });
  }, [flowId, open]);

  function handleLoadPreview() {
    startTransition(() => {
      void (async () => {
        try {
          const imported = await fetchFigmaImportPreview({
            flowId,
            source,
          });
          setResolvedImport(imported);
          setError(null);
        } catch (nextError) {
          const message =
            nextError instanceof Error ? nextError.message : "Unable to load that Figma frame.";
          setError(message);
          if (message.includes("Connect your Figma account")) {
            setConnectionStatus((current) =>
              current ? { ...current, connected: false } : current,
            );
          }
        }
      })();
    });
  }

  function handleImport() {
    if (!resolvedImport || isPreviewStale) return;

    startTransition(() => {
      const imported = createImportedFigmaScreen(resolvedImport);
      onImport({ screen: imported.screen, mode });
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="h-[100dvh] w-screen max-w-none gap-0 overflow-hidden border-white/10 bg-[#0f1115] p-0 text-white sm:w-[min(94vw,1040px)] sm:max-w-none"
      >
        <SheetHeader className="border-b border-white/10 px-6 py-5 pr-14">
          <SheetTitle className="text-[22px] font-semibold text-white">{title}</SheetTitle>
          <SheetDescription className="max-w-3xl text-[15px] leading-6 text-white/55">
            {description}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex min-h-full flex-col gap-0 lg:flex-row">
            <div className="flex-1 min-w-0 border-b border-white/10 px-6 py-5 lg:border-b-0 lg:border-r">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
                      Frame Source
                    </p>
                    <p className="mt-1 text-sm leading-6 text-white/45">
                      Use a share link for a specific frame or layer. The URL must include a `node-id`.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/45">
                    {connectionStatus?.mode === "oauth"
                      ? connectionStatus.connected
                        ? "OAuth connected"
                        : "OAuth required"
                      : connectionStatus?.mode === "token"
                        ? "Server token"
                        : "Setup required"}
                  </div>
                </div>

                {connectionStatus?.mode === "oauth" ? (
                  <div className={`mt-4 rounded-2xl border px-4 py-4 ${
                    connectionStatus.connected
                      ? "border-emerald-400/20 bg-emerald-400/10"
                      : "border-sky-400/20 bg-sky-400/10"
                  }`}>
                    <div className="flex items-center gap-2">
                      {connectionStatus.connected ? (
                        <CheckCircle2 size={16} className="text-emerald-300" />
                      ) : (
                        <Link2 size={16} className="text-sky-300" />
                      )}
                      <p className="text-sm font-medium text-white">
                        {connectionStatus.connected ? "Figma connected" : "Connect your Figma account"}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      {connectionStatus.connected
                        ? `Connected as ${connectionStatus.accountLabel || "your Figma account"}.`
                        : "Each Arlo user connects their own Figma account before importing production content."}
                    </p>
                    {!connectionStatus.connected && connectionStatus.connectUrl ? (
                      <a
                        href={connectionStatus.connectUrl}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.08] px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/[0.12] hover:text-white"
                      >
                        <Link2 size={14} />
                        Connect Figma
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {connectionStatus?.mode === "token" ? (
                  <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm leading-6 text-amber-100/85">
                    This environment is using a server-level Figma token fallback. That works for internal testing, but production should use OAuth per user.
                  </div>
                ) : null}

                {connectionStatus?.mode === "none" ? (
                  <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm leading-6 text-rose-100/85">
                    Figma is not configured on this server yet. Add OAuth credentials before importing.
                  </div>
                ) : null}

                {connectionError ? (
                  <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm leading-6 text-rose-100/85">
                    {connectionError}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    placeholder="https://www.figma.com/design/...?...node-id=123-456"
                    className="h-11 rounded-2xl border-white/10 bg-black/20 px-4 text-sm text-white placeholder:text-white/25 focus-visible:border-white/20 focus-visible:ring-white/10"
                  />
                  <Button
                    type="button"
                    onClick={handleLoadPreview}
                    disabled={!source.trim() || isPending || needsOAuthConnection || connectionStatus?.mode === "none"}
                    className="h-11 rounded-2xl bg-white text-black hover:bg-white/90"
                  >
                    {isPending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : resolvedImport ? (
                      <RefreshCcw size={15} />
                    ) : (
                      <PenTool size={15} />
                    )}
                    {resolvedImport ? "Refresh preview" : "Load preview"}
                  </Button>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="flex items-center gap-2">
                    {resolvedImport && !isPreviewStale && !error ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-400" />
                    )}
                    <p className="text-sm font-medium text-white">
                      {resolvedImport && !isPreviewStale && !error
                        ? "Ready to import"
                        : isPreviewStale
                          ? "Preview needs refresh"
                          : "Load a Figma frame"}
                    </p>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-white/60">
                    {error ? (
                      <p>{error}</p>
                    ) : resolvedImport ? (
                      <>
                        <p>
                          Loaded <span className="font-medium text-white/80">{resolvedImport.nodeName}</span> from{" "}
                          <span className="font-medium text-white/80">{resolvedImport.fileName}</span>.
                        </p>
                        {isPreviewStale ? (
                          <p className="text-amber-300/80">
                            The URL changed after the last preview load. Refresh before importing.
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] uppercase tracking-[0.18em] text-white/35">
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                            {resolvedImport.screen.components.length} mapped layers
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                            {resolvedImport.previewTree.length} preview root{resolvedImport.previewTree.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p>
                        Arlo will fetch the selected node, map supported layers into builder-friendly content, and keep the original Figma source attached for re-syncs.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {resolvedImport ? (
                <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
                        Imported Frame
                      </p>
                      <p className="mt-1 text-sm text-white/50">
                        {resolvedImport.nodeName}
                      </p>
                    </div>
                    <a
                      href={resolvedImport.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-white/65 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      Open in Figma
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  {resolvedImport.warnings.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4">
                      <div className="flex items-center gap-2 text-amber-200">
                        <AlertTriangle size={16} />
                        <p className="text-sm font-medium">Import warnings</p>
                      </div>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-100/80">
                        {resolvedImport.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm text-emerald-100/85">
                      The frame mapped cleanly. You can import it as a read-only, Figma-backed screen.
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="w-full shrink-0 bg-white/[0.02] px-6 py-5 lg:w-[360px]">
              <div className="flex flex-col gap-4">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                    {lockMode ? "Update Target" : "Import Into"}
                  </p>
                  {lockMode ? (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                      <p className="text-base font-medium text-white">Replace current screen</p>
                      <p className="mt-1 text-sm leading-6 text-white/45">
                        Re-syncs <span className="font-medium text-white/80">{currentScreenName || "this screen"}</span> in place with the latest mapped preview.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <button
                        type="button"
                        onClick={() => setMode("append")}
                        className={`block w-full overflow-hidden rounded-2xl border px-4 py-4 text-left transition ${
                          mode === "append"
                            ? "border-white bg-white text-black shadow-[0_18px_50px_rgba(255,255,255,0.12)]"
                            : "border-white/10 bg-black/20 text-white/70 hover:border-white/20 hover:bg-white/[0.03] hover:text-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${mode === "append" ? "border-black bg-black" : "border-white/25"}`} />
                          <div className="min-w-0">
                            <p className="break-words text-base font-medium">Create new screen</p>
                            <p className={`mt-1 break-words text-sm leading-6 ${mode === "append" ? "text-black/70" : "text-white/45"}`}>
                              Keeps your current screen untouched and adds a new Figma-backed one.
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("replace")}
                        className={`block w-full overflow-hidden rounded-2xl border px-4 py-4 text-left transition ${
                          mode === "replace"
                            ? "border-white bg-white text-black shadow-[0_18px_50px_rgba(255,255,255,0.12)]"
                            : "border-white/10 bg-black/20 text-white/70 hover:border-white/20 hover:bg-white/[0.03] hover:text-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${mode === "replace" ? "border-black bg-black" : "border-white/25"}`} />
                          <div className="min-w-0">
                            <p className="break-words text-base font-medium">Replace current screen</p>
                            <p className={`mt-1 break-words text-sm leading-6 ${mode === "replace" ? "text-black/70" : "text-white/45"}`}>
                              Overwrites <span className="font-medium">{currentScreenName || "this screen"}</span> while preserving its place in the flow.
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-sky-300" />
                    <p className="text-sm font-medium text-white">What gets stored</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    Arlo stores the selected Figma URL, file metadata, warnings, and a generated preview screen. The imported result stays read-only in the builder, similar to code import.
                  </p>
                  {resolvedImport ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/55">
                      Last synced:{" "}
                      <span className="font-medium text-white/75">
                        {new Date(resolvedImport.lastSyncedAt).toLocaleString()}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="border-t border-white/10 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-white/70 hover:bg-white/[0.06] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!resolvedImport || isPreviewStale || isPending}
            className="rounded-xl bg-white text-black hover:bg-white/90"
          >
            {isPending ? <Loader2 size={15} className="animate-spin" /> : null}
            {submitLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
