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
      title="Import Flow Assets"
      description={`Importing into ${currentScreenName || "Active Flow"}. Elements will be mapped to the Arlo Design System.`}
      onBack={() => router.push(buildBuilderHref())}
      footer={
        <>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!canImport || isPending}
            className="bg-white text-black hover:bg-white/90 px-8 h-11 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:scale-100 shadow-[0_0_30px_rgba(255,255,255,0.15)] disabled:shadow-none"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={14} className="mr-2" />}
            {tab === "figma"
              ? `Commit ${selectedImports.length || 0} screen${selectedImports.length === 1 ? "" : "s"}`
              : "Commit to builder"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-10">
        {/* Superior Tab Navigator */}
        <div className="flex justify-center">
          <div className="relative flex p-1.5 rounded-[24px] border border-white/[0.06] bg-black/40 backdrop-blur-md shadow-inner group/tabs">
            <div
              className={`absolute top-1.5 bottom-1.5 w-[140px] rounded-[18px] bg-white/[0.08] shadow-[0_2px_10px_rgba(0,0,0,0.2)] transition-[transform,border-color,background-color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border border-white/[0.1] ${
                tab === "figma" ? "translate-x-0" : "translate-x-[140px]"
              }`}
            />
            <button
              type="button"
              onClick={() => {
                setTab("figma");
                router.replace(buildImportHref("figma"));
              }}
              className={`relative z-10 flex w-[140px] items-center justify-center gap-2.5 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] transition-[color] duration-500 ${
                tab === "figma"
                  ? "text-white"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              <PenTool size={14} strokeWidth={tab === "figma" ? 3 : 2} className="transition-all" />
              Figma
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("code");
                router.replace(buildImportHref("code"));
              }}
              className={`relative z-10 flex w-[140px] items-center justify-center gap-2.5 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] transition-[color] duration-500 ${
                tab === "code"
                  ? "text-white"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              <Code2 size={14} strokeWidth={tab === "code" ? 3 : 2} className="transition-all" />
              Code
            </button>
          </div>
        </div>

        {/* Global Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
          <div className="min-w-0 space-y-8">
            <div className={`transition-[opacity,transform] duration-500 transform-gpu ${
                 tab === "figma" ? "opacity-100 translate-y-0 relative z-10" : "opacity-0 translate-y-8 absolute inset-x-0 pointer-events-none z-0"
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
            
            <div className={`transition-[opacity,transform] duration-500 transform-gpu ${
                 tab === "code" ? "opacity-100 translate-y-0 relative z-10" : "opacity-0 translate-y-8 absolute inset-x-0 pointer-events-none z-0"
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

          <aside className="space-y-6 sticky top-28">
            <ImportModeSelector
              mode={activeMode}
              onSelectMode={setActiveMode}
              currentScreenName={currentScreenName}
              screenCount={activeScreenCount}
            />

            {submitError && (
              <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/5 p-6 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 text-rose-400 mb-3">
                  <AlertTriangle size={18} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Deployment Failed</span>
                </div>
                <p className="text-[13px] text-rose-200/60 font-medium leading-relaxed">
                  {submitError}
                </p>
              </div>
            )}

            <div className="transition-[opacity,transform] duration-500 ease-out transform-gpu">
              {tab === "figma" ? (
                <FigmaImportSummary
                  primaryImport={primaryImport}
                  selectedCount={selectedImports.length}
                  helperText="Imported Figma screens are added as frozen reference assets with active sync links for future design iterations."
                />
              ) : (
                <CodeImportSummary parsed={parsed} />
              )}
            </div>
          </aside>
        </div>
      </div>
    </ImportPageShell>
  );
}
