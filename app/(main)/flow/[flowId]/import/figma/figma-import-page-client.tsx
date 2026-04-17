"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { applyImportedScreens, fetchFigmaImportPreview, getFigmaConnectionStatus } from "../../actions";
import type { ImportMode } from "../../_lib/code-import";
import { createImportedFigmaScreen } from "../../_lib/imported-figma-screen";
import type { ParsedFigmaImport } from "../../_lib/figma-import";
import {
  FigmaImportContent,
  FigmaImportSummary,
  type FigmaConnectionStatus,
  ImportModeSelector,
  ImportPageShell,
} from "../../_components/import-page-sections";

export function FigmaImportPageClient({
  flowId,
  currentScreenName,
  screenIndex,
  initialSource,
  hasImportedSource,
  lastSyncedAt,
  fileName,
  nodeName,
}: {
  flowId: string;
  currentScreenName: string;
  screenIndex: number;
  initialSource: string;
  hasImportedSource: boolean;
  lastSyncedAt: string | null;
  fileName: string | null;
  nodeName: string | null;
}) {
  const router = useRouter();
  const [source, setSource] = useState(initialSource);
  const [mode, setMode] = useState<ImportMode>(hasImportedSource ? "replace" : "append");
  const [resolvedImports, setResolvedImports] = useState<ParsedFigmaImport[]>([]);
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<FigmaConnectionStatus | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedScreenIds, setSelectedScreenIds] = useState<Set<string>>(new Set());
  const [isPreviewPending, startPreviewTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();

  const primaryImport = resolvedImports[0] ?? null;
  const totalMappedLayers = useMemo(
    () => resolvedImports.reduce((count, item) => count + item.screen.components.length, 0),
    [resolvedImports],
  );
  const totalPreviewRoots = useMemo(
    () => resolvedImports.reduce((count, item) => count + item.previewTree.length, 0),
    [resolvedImports],
  );
  const isPreviewStale = useMemo(() => {
    if (!loadedSource) return false;
    return loadedSource !== source.trim();
  }, [loadedSource, source]);
  const needsOAuthConnection = connectionStatus?.mode === "oauth" && !connectionStatus.connected;

  const selectedImports = useMemo(
    () => resolvedImports.filter((item) => selectedScreenIds.has(item.nodeId)),
    [resolvedImports, selectedScreenIds],
  );

  useEffect(() => {
    startPreviewTransition(() => {
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
  }, [flowId]);

  const buildBuilderHref = (selectedIndex = screenIndex) => `/flow/${flowId}?screenIndex=${selectedIndex}`;

  function handleLoadPreview() {
    startPreviewTransition(() => {
      void (async () => {
        try {
          const imported = await fetchFigmaImportPreview({
            flowId,
            source,
          });
          setResolvedImports(imported);
          setSelectedScreenIds(new Set(imported.map((item) => item.nodeId)));
          setLoadedSource(source.trim());
          setError(null);
        } catch (nextError) {
          const message =
            nextError instanceof Error ? nextError.message : "Unable to load that Figma selection.";
          setError(message);
          if (message.includes("Connect your Figma account")) {
            setConnectionStatus((current) => (current ? { ...current, connected: false } : current));
          }
        }
      })();
    });
  }

  function handleToggleScreen(nodeId: string) {
    setSelectedScreenIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }

  const isPending = isPreviewPending || isSubmitting;
  const canImport = selectedImports.length > 0 && !isPreviewStale && !isPending;

  function handleImport() {
    if (!canImport) return;

    startSubmitTransition(() => {
      void (async () => {
        try {
          setSubmitError(null);
          const result = await applyImportedScreens({
            flowId,
            screenIndex,
            mode,
            screens: selectedImports.map((item) => createImportedFigmaScreen(item).screen),
          });
          router.replace(buildBuilderHref(result.selectedScreenIndex));
        } catch (nextError) {
          setSubmitError(
            nextError instanceof Error ? nextError.message : "Unable to save this Figma import right now.",
          );
        }
      })();
    });
  }

  return (
    <ImportPageShell
      title={hasImportedSource ? "Refresh Figma Import" : "Import from Figma"}
      description={
        hasImportedSource
          ? "Update the stored Figma source for this screen, choose exactly which mapped screens to bring in, and save the result directly into your draft."
          : "Import one or more screens from Figma into the builder, choose which screens to keep, and save the result directly into your draft."
      }
      onBack={() => router.push(buildBuilderHref())}
      footer={
        <>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!canImport}
            className="bg-white text-black hover:bg-white/90"
          >
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Import {selectedImports.length || 0} screen
            {selectedImports.length === 1 ? "" : "s"}
          </Button>
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col lg:flex-row">
        <div className="min-w-0 flex-1 border-b border-white/10 px-6 py-5 lg:border-b-0 lg:border-r">
          <FigmaImportContent
            source={source}
            onSourceChange={setSource}
            connectionStatus={connectionStatus}
            connectionError={connectionError}
            needsOAuthConnection={needsOAuthConnection}
            isPending={isPreviewPending}
            resolvedImports={resolvedImports}
            selectedScreenIds={selectedScreenIds}
            loadedSource={loadedSource}
            primaryImport={primaryImport}
            totalMappedLayers={totalMappedLayers}
            totalPreviewRoots={totalPreviewRoots}
            isPreviewStale={isPreviewStale}
            error={error}
            onLoadPreview={handleLoadPreview}
            onToggleScreen={handleToggleScreen}
            onSelectAll={() => setSelectedScreenIds(new Set(resolvedImports.map((item) => item.nodeId)))}
            onDeselectAll={() => setSelectedScreenIds(new Set())}
          />
        </div>

        <div className="w-full shrink-0 bg-white/[0.02] px-6 py-5 lg:w-[360px]">
          <div className="flex flex-col gap-4">
            <ImportModeSelector
              mode={mode}
              onSelectMode={setMode}
              currentScreenName={currentScreenName}
              screenCount={selectedImports.length}
            />

            {hasImportedSource ? (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                  Current Source
                </p>
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-base font-medium text-white">
                    {nodeName || currentScreenName || "Imported screen"}
                  </p>
                  {fileName ? (
                    <p className="mt-2 text-sm text-white/50">
                      File: <span className="text-white/75">{fileName}</span>
                    </p>
                  ) : null}
                  {lastSyncedAt ? (
                    <p className="mt-2 text-sm text-white/50">
                      Last synced:{" "}
                      <span className="text-white/75">
                        {new Date(lastSyncedAt).toLocaleString()}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-[24px] border border-rose-400/20 bg-rose-400/10 p-5 text-sm leading-6 text-rose-100/85">
                <div className="flex items-center gap-2 font-medium text-white">
                  <AlertTriangle size={16} className="text-rose-300" />
                  Import failed
                </div>
                <p className="mt-3">{submitError}</p>
              </div>
            ) : null}

            <FigmaImportSummary
              primaryImport={primaryImport}
              selectedCount={selectedImports.length}
              helperText="Arlo stores each imported screen with its direct Figma node URL, file metadata, warnings, and generated preview screen. Replacing will update the current screen first and insert any additional selected screens after it."
            />
          </div>
        </div>
      </div>
    </ImportPageShell>
  );
}
