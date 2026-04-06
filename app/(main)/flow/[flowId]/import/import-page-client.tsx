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
            className="border-white/[0.08] bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15] transition-all rounded-xl h-11"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!canImport || isPending}
            className="bg-white text-black hover:bg-white/90 h-11 rounded-xl font-medium transition-transform active:scale-95 disabled:hover:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:shadow-none"
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
        <div className="border-b border-white/[0.06] px-6 py-4 flex justify-center bg-[#0a0a0a]/50 backdrop-blur-sm z-10 sticky top-[80px]">
          <div className="relative flex p-1 rounded-full bg-white/[0.02] border border-white/[0.08] shadow-inner items-center">
            <div
              className={`absolute top-1 bottom-1 w-[130px] rounded-full bg-white/[0.12] shadow-sm transition-transform duration-300 ease-out border border-white/[0.08] ${
                tab === "figma" ? "translate-x-0" : "translate-x-full"
              }`}
            />
            <button
              type="button"
              onClick={() => {
                setTab("figma");
                router.replace(buildImportHref("figma"));
              }}
              className={`relative z-10 flex w-[130px] items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                tab === "figma"
                  ? "text-white"
                  : "text-white/50 hover:text-white/80"
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
              className={`relative z-10 flex w-[130px] items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                tab === "code"
                  ? "text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Code2 size={14} />
              Code
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col lg:flex-row bg-[#0a0a0a]/20">
          <div className="min-w-0 flex-1 border-b border-white/[0.06] px-6 py-8 lg:border-b-0 lg:border-r relative overflow-hidden">
            <div className={`transition-all duration-500 transform-gpu ${
                 tab === "figma" ? "opacity-100 translate-y-0 relative z-10" : "opacity-0 translate-y-4 absolute inset-x-6 pointer-events-none z-0"
               }`}>
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
            </div>
            <div className={`transition-all duration-500 transform-gpu ${
                 tab === "code" ? "opacity-100 translate-y-0 relative z-10" : "opacity-0 translate-y-4 absolute inset-x-6 top-8 pointer-events-none z-0"
               }`}>
              <CodeImportContent
                code={code}
                onCodeChange={setCode}
                framework={framework}
                onFrameworkChange={setFramework}
                onFileImport={handleFileImport}
              />
            </div>
          </div>

          <div className="w-full shrink-0 bg-[#0f1115]/80 backdrop-blur-md px-6 py-6 lg:w-[380px] relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
            <div className="flex flex-col gap-5 sticky top-[160px]">
              <ImportModeSelector
                mode={activeMode}
                onSelectMode={setActiveMode}
                currentScreenName={currentScreenName}
                screenCount={activeScreenCount}
              />

              {submitError ? (
                <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/5 p-5 text-sm leading-6 text-rose-200/90 shadow-inner animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 font-medium text-white mb-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10 text-rose-400">
                       <AlertTriangle size={14} />
                    </div>
                    Import failed
                  </div>
                  <p className="ml-8">{submitError}</p>
                </div>
              ) : null}

              <div className="transition-all duration-500">
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
      </div>
    </ImportPageShell>
  );
}
