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
  onImport: (payload: { screens: Screen[]; mode: ImportMode }) => void;
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
    artboard: payload.artboard,
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
  title = "Import from Figma",
  description = "Paste a Figma frame, section, or page URL that includes a node-id. Arlo will fetch the selection, generate a read-only preview, and store per-screen source metadata so you can re-sync imported screens later.",
  submitLabel = "Import to builder",
  onImport,
}: FigmaImportDialogProps) {
  const [source, setSource] = useState(initialSource ?? "");
  const [mode, setMode] = useState<ImportMode>(defaultMode);
  const [resolvedImports, setResolvedImports] = useState<ParsedFigmaImport[]>(
    initialImport ? [payloadToParsedImport(initialImport)] : [],
  );
  const [loadedSource, setLoadedSource] = useState<string | null>(() => {
    const value = (initialSource ?? initialImport?.sourceUrl ?? "").trim();
    return value ? value : null;
  });
  const [connectionStatus, setConnectionStatus] = useState<FigmaConnectionStatus | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const primaryImport = resolvedImports[0] ?? null;
  const totalMappedLayers = useMemo(
    () => resolvedImports.reduce((count, item) => count + item.screen.components.length, 0),
    [resolvedImports],
  );
  const totalPreviewRoots = useMemo(
    () => resolvedImports.reduce((count, item) => count + item.previewTree.length, 0),
    [resolvedImports],
  );
  const requiresSingleScreenForUpdate = lockMode && resolvedImports.length > 1;

  const isPreviewStale = useMemo(() => {
    if (!loadedSource) return false;
    return loadedSource !== source.trim();
  }, [loadedSource, source]);

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
          setResolvedImports(imported);
          setLoadedSource(source.trim());
          setError(null);
        } catch (nextError) {
          const message =
            nextError instanceof Error ? nextError.message : "Unable to load that Figma selection.";
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
    if (resolvedImports.length === 0 || isPreviewStale || requiresSingleScreenForUpdate) return;

    startTransition(() => {
      const screens = resolvedImports.map((item) => createImportedFigmaScreen(item).screen);
      onImport({ screens, mode });
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
                      Figma Source
                    </p>
                    <p className="mt-1 text-sm leading-6 text-white/45">
                      Use a share link for a specific frame, section, or page. The URL must include a `node-id`.
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
                    ) : resolvedImports.length > 0 ? (
                      <RefreshCcw size={15} />
                    ) : (
                      <PenTool size={15} />
                    )}
                    {resolvedImports.length > 0 ? "Refresh preview" : "Load preview"}
                  </Button>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="flex items-center gap-2">
                    {resolvedImports.length > 0 && !isPreviewStale && !error ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-400" />
                    )}
                    <p className="text-sm font-medium text-white">
                      {resolvedImports.length > 0 && !isPreviewStale && !error
                        ? "Ready to import"
                        : isPreviewStale
                          ? "Preview needs refresh"
                          : "Load a Figma selection"}
                    </p>
                  </div>

                  <div className="mt-3 space-y-2 text-sm text-white/60">
                    {error ? (
                      <p>{error}</p>
                    ) : primaryImport ? (
                      <>
                        <p>
                          {resolvedImports.length === 1 ? (
                            <>
                              Loaded <span className="font-medium text-white/80">{primaryImport.nodeName}</span> from{" "}
                              <span className="font-medium text-white/80">{primaryImport.fileName}</span>.
                            </>
                          ) : (
                            <>
                              Loaded <span className="font-medium text-white/80">{resolvedImports.length} screens</span> from{" "}
                              <span className="font-medium text-white/80">{primaryImport.fileName}</span>.
                            </>
                          )}
                        </p>
                        {isPreviewStale ? (
                          <p className="text-amber-300/80">
                            The URL changed after the last preview load. Refresh before importing.
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] uppercase tracking-[0.18em] text-white/35">
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                            {totalMappedLayers} mapped layers
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                            {totalPreviewRoots} preview root{totalPreviewRoots === 1 ? "" : "s"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p>
                        Arlo will fetch the selected node, map supported layers into builder-friendly content, and keep direct Figma links attached for later re-syncs.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {primaryImport ? (
                <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
                        {resolvedImports.length === 1 ? "Imported Screen" : "Imported Screens"}
                      </p>
                      <p className="mt-1 text-sm text-white/50">
                        {resolvedImports.length === 1
                          ? primaryImport.nodeName
                          : `${resolvedImports.length} screens ready to import`}
                      </p>
                    </div>
                    <a
                      href={loadedSource ?? primaryImport.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-white/65 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      Open in Figma
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  {resolvedImports.length > 1 ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/60">
                      <p className="font-medium text-white/80">Screens in this import</p>
                      <div className="mt-3 space-y-2">
                        {resolvedImports.slice(0, 8).map((item) => (
                          <div key={item.nodeId} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                            {item.screen.name}
                          </div>
                        ))}
                        {resolvedImports.length > 8 ? (
                          <p className="text-white/40">+{resolvedImports.length - 8} more screens</p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {primaryImport.warnings.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4">
                      <div className="flex items-center gap-2 text-amber-200">
                        <AlertTriangle size={16} />
                        <p className="text-sm font-medium">Import warnings</p>
                      </div>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-100/80">
                        {primaryImport.warnings.map((warning, index) => (
                          <li key={`${warning}-${index}`}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm text-emerald-100/85">
                      {resolvedImports.length === 1
                        ? "The screen mapped cleanly. You can import it as a read-only, Figma-backed screen."
                        : "These screens mapped cleanly. You can import them as read-only, Figma-backed screens."}
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
                    <>
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                        <p className="text-base font-medium text-white">Replace current screen</p>
                        <p className="mt-1 text-sm leading-6 text-white/45">
                          Re-syncs <span className="font-medium text-white/80">{currentScreenName || "this screen"}</span> in place with the latest mapped preview.
                        </p>
                      </div>
                      {requiresSingleScreenForUpdate ? (
                        <div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-4 text-sm leading-6 text-amber-100/85">
                          Updating an existing imported screen requires a link that resolves to exactly one screen. Paste a direct frame link instead of a page link.
                        </div>
                      ) : null}
                    </>
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
                              Keeps your current screen untouched and adds the imported Figma screen{resolvedImports.length === 1 ? "" : "s"}.
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
                              {resolvedImports.length > 1 ? (
                                <>
                                  Replaces <span className="font-medium">{currentScreenName || "this screen"}</span> with the first imported screen and adds the rest after it.
                                </>
                              ) : (
                                <>
                                  Overwrites <span className="font-medium">{currentScreenName || "this screen"}</span> while preserving its place in the flow.
                                </>
                              )}
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
                    Arlo stores each imported screen with its direct Figma node URL, file metadata, warnings, and generated preview screen. The imported result stays read-only in the builder, similar to code import.
                  </p>
                  {primaryImport ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/55">
                      Last synced:{" "}
                      <span className="font-medium text-white/75">
                        {new Date(primaryImport.lastSyncedAt).toLocaleString()}
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
            disabled={resolvedImports.length === 0 || isPreviewStale || isPending || requiresSingleScreenForUpdate}
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
