"use client";

import { useEffect, useMemo, useState, useTransition, type ChangeEvent } from "react";
import { AlertTriangle, Code2, Loader2, PenTool, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { applyImportedScreens, fetchFigmaImportPreview, getFigmaConnectionStatus } from "../actions";
import type { ImportFramework, ImportMode } from "../_lib/code-import";
import { createImportedCodeScreen } from "../_lib/imported-code-screen";
import { parseImportedCode } from "../_lib/code-import";
import { createImportedFigmaScreen } from "../_lib/imported-figma-screen";
import type { ParsedFigmaImport } from "../_lib/figma-import";
import {
  CodeImportContent,
  CodeImportSummary,
  FigmaImportContent,
  FigmaImportSummary,
  type FigmaConnectionStatus,
  ImportModeSelector,
  ImportPageShell,
  SAMPLE_NATIVE,
} from "../_components/import-page-sections";

type ImportTab = "figma" | "code";

export function ImportPageClient({
  flowId,
  currentScreenName,
  screenIndex,
  initialTab,
}: {
  flowId: string;
  currentScreenName: string;
  screenIndex: number;
  initialTab: ImportTab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<ImportTab>(initialTab);

  const [figmaSource, setFigmaSource] = useState("");
  const [figmaMode, setFigmaMode] = useState<ImportMode>("append");
  const [resolvedImports, setResolvedImports] = useState<ParsedFigmaImport[]>([]);
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<FigmaConnectionStatus | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [figmaError, setFigmaError] = useState<string | null>(null);
  const [selectedScreenIds, setSelectedScreenIds] = useState<Set<string>>(new Set());
  const [isFigmaPending, startFigmaTransition] = useTransition();

  const [code, setCode] = useState(SAMPLE_NATIVE);
  const [framework, setFramework] = useState<ImportFramework | "auto">("auto");
  const [codeMode, setCodeMode] = useState<ImportMode>("append");

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
    return loadedSource !== figmaSource.trim();
  }, [loadedSource, figmaSource]);
  const needsOAuthConnection = connectionStatus?.mode === "oauth" && !connectionStatus.connected;

  const selectedImports = useMemo(
    () => resolvedImports.filter((item) => selectedScreenIds.has(item.nodeId)),
    [resolvedImports, selectedScreenIds],
  );

  const parsed = useMemo(() => {
    try {
      const result = parseImportedCode(code, framework);
      return { result, error: null as string | null };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : "Unable to parse this snippet.",
      };
    }
  }, [code, framework]);

  useEffect(() => {
    startFigmaTransition(() => {
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

  const buildImportHref = (nextTab: ImportTab) => {
    const params = new URLSearchParams();
    if (nextTab !== "figma") params.set("tab", nextTab);
    if (screenIndex > 0) params.set("screenIndex", String(screenIndex));
    const query = params.toString();
    return query ? `/flow/${flowId}/import?${query}` : `/flow/${flowId}/import`;
  };

  function handleLoadPreview() {
    startFigmaTransition(() => {
      void (async () => {
        try {
          const imported = await fetchFigmaImportPreview({
            flowId,
            source: figmaSource,
          });
          setResolvedImports(imported);
          setSelectedScreenIds(new Set(imported.map((item) => item.nodeId)));
          setLoadedSource(figmaSource.trim());
          setFigmaError(null);
        } catch (nextError) {
          const message =
            nextError instanceof Error ? nextError.message : "Unable to load that Figma selection.";
          setFigmaError(message);
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

  function handleFileImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCode(reader.result);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  const isPending = isFigmaPending || isSubmitting;
  const canImport =
    tab === "figma"
      ? selectedImports.length > 0 && !isPreviewStale && !isFigmaPending
      : Boolean(parsed.result);
  const activeMode = tab === "figma" ? figmaMode : codeMode;
  const setActiveMode = tab === "figma" ? setFigmaMode : setCodeMode;
  const activeScreenCount = tab === "figma" ? selectedImports.length : 1;

  function handleImport() {
    if (!canImport) return;

    startSubmitTransition(() => {
      void (async () => {
        try {
          setSubmitError(null);
          const screens =
            tab === "figma"
              ? selectedImports.map((item) => createImportedFigmaScreen(item).screen)
              : [createImportedCodeScreen(code, framework).screen];
          const mode = tab === "figma" ? figmaMode : codeMode;
          const result = await applyImportedScreens({
            flowId,
            screenIndex,
            mode,
            screens,
          });
          router.replace(buildBuilderHref(result.selectedScreenIndex));
        } catch (error) {
          setSubmitError(
            error instanceof Error ? error.message : "Unable to save this import right now.",
          );
        }
      })();
    });
  }

  return (
    <ImportPageShell
      title="Import to Flow Builder"
      description="Import screens from Figma designs or React and React Native code into the builder. The import is saved to your draft immediately, then you’ll return to the flow."
      onBack={() => router.push(buildBuilderHref())}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(buildBuilderHref())}
            className="border-white/10 bg-transparent text-white hover:bg-white/[0.06] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!canImport || isPending}
            className="bg-white text-black hover:bg-white/90"
          >
            {isPending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {tab === "figma"
              ? `Import ${selectedImports.length || 0} screen${selectedImports.length === 1 ? "" : "s"}`
              : "Import to builder"}
          </Button>
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col">
        <div className="border-b border-white/10 px-6">
          <div className="flex gap-0">
            <button
              type="button"
              onClick={() => {
                setTab("figma");
                router.replace(buildImportHref("figma"));
              }}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === "figma"
                  ? "border-white text-white"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              <PenTool size={14} />
              Figma
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("code");
                router.replace(buildImportHref("code"));
              }}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === "code"
                  ? "border-white text-white"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              <Code2 size={14} />
              Code
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col lg:flex-row">
          <div className="min-w-0 flex-1 border-b border-white/10 px-6 py-5 lg:border-b-0 lg:border-r">
            {tab === "figma" ? (
              <FigmaImportContent
                source={figmaSource}
                onSourceChange={setFigmaSource}
                connectionStatus={connectionStatus}
                connectionError={connectionError}
                needsOAuthConnection={needsOAuthConnection}
                isPending={isFigmaPending}
                resolvedImports={resolvedImports}
                selectedScreenIds={selectedScreenIds}
                loadedSource={loadedSource}
                primaryImport={primaryImport}
                totalMappedLayers={totalMappedLayers}
                totalPreviewRoots={totalPreviewRoots}
                isPreviewStale={isPreviewStale}
                error={figmaError}
                onLoadPreview={handleLoadPreview}
                onToggleScreen={handleToggleScreen}
                onSelectAll={() => setSelectedScreenIds(new Set(resolvedImports.map((item) => item.nodeId)))}
                onDeselectAll={() => setSelectedScreenIds(new Set())}
              />
            ) : (
              <CodeImportContent
                code={code}
                onCodeChange={setCode}
                framework={framework}
                onFrameworkChange={setFramework}
                onFileImport={handleFileImport}
              />
            )}
          </div>

          <div className="w-full shrink-0 bg-white/[0.02] px-6 py-5 lg:w-[360px]">
            <div className="flex flex-col gap-4">
              <ImportModeSelector
                mode={activeMode}
                onSelectMode={setActiveMode}
                currentScreenName={currentScreenName}
                screenCount={activeScreenCount}
              />

              {submitError ? (
                <div className="rounded-[24px] border border-rose-400/20 bg-rose-400/10 p-5 text-sm leading-6 text-rose-100/85">
                  <div className="flex items-center gap-2 font-medium text-white">
                    <AlertTriangle size={16} className="text-rose-300" />
                    Import failed
                  </div>
                  <p className="mt-3">{submitError}</p>
                </div>
              ) : null}

              {tab === "figma" ? (
                <FigmaImportSummary
                  primaryImport={primaryImport}
                  selectedCount={selectedImports.length}
                  helperText="Arlo stores each imported screen with its direct Figma node URL, file metadata, warnings, and generated preview screen. The imported result stays read-only in the builder."
                />
              ) : (
                <CodeImportSummary parsed={parsed} />
              )}
            </div>
          </div>
        </div>
      </div>
    </ImportPageShell>
  );
}
