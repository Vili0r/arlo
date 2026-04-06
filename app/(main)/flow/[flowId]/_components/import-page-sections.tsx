"use client";

import type { ChangeEvent, ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  Layers,
  Link2,
  Loader2,
  PenTool,
  RefreshCcw,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { ParsedFigmaImport } from "../_lib/figma-import";
import type { ImportFramework, ImportMode } from "../_lib/code-import";
import { parseImportedCode } from "../_lib/code-import";
import { CodeEditorSurface } from "./code-editor-surface";

export interface FigmaConnectionStatus {
  mode: "oauth" | "token" | "none";
  connected: boolean;
  accountLabel: string | null;
  expiresAt: string | null;
  connectUrl: string | null;
}

export const SAMPLE_NATIVE = `import { View, Text, TextInput, Pressable } from "react-native";

export function WelcomeScreen() {
  return (
    <View style={{ backgroundColor: "#ffffff", padding: 24 }}>
      <Text style={{ fontSize: 30, fontWeight: "700", color: "#111827" }}>
        Welcome back
      </Text>
      <Text style={{ fontSize: 16, color: "#6b7280" }}>
        Let's get you into the app.
      </Text>
      <TextInput placeholder="Email address" />
      <Pressable style={{ backgroundColor: "#111827", borderRadius: 16 }}>
        <Text style={{ color: "#ffffff" }}>Continue</Text>
      </Pressable>
    </View>
  );
}`;

export function ImportPageShell({
  title,
  description,
  onBack,
  children,
  footer,
}: {
  title: string;
  description: string;
  onBack: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen flex-col text-white"
      style={{
        backgroundColor: "#0a0a0a",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
        backgroundSize: "32px 32px",
      }}
    >
      <div className="border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-10 transition-colors">
        <div className="mx-auto flex w-full max-w-[1440px] items-start gap-4 px-6 py-5">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="mt-0.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-white/60 transition-all hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15]"
          >
            Back to builder
          </Button>
          <div className="min-w-0">
            <h1 className="text-[24px] font-semibold tracking-tight text-white bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent transform-gpu">{title}</h1>
            <p className="mt-2 max-w-4xl text-[15px] leading-6 text-white/50">{description}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 drop-shadow-2xl">{children}</div>

      <div className="border-t border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl sticky bottom-0 z-10">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          {footer}
        </div>
      </div>
    </div>
  );
}

export function ImportModeSelector({
  mode,
  onSelectMode,
  currentScreenName,
  screenCount,
}: {
  mode: ImportMode;
  onSelectMode: (mode: ImportMode) => void;
  currentScreenName: string;
  screenCount: number;
}) {
  return (
    <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-5 shadow-sm backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
        Import Into
      </p>
      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={() => onSelectMode("append")}
          className={`group block w-full overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-300 ${
            mode === "append"
              ? "border-[#7C65F6] bg-[#7C65F6]/10 shadow-[0_0_30px_rgba(124,101,246,0.15)]"
              : "border-white/[0.06] bg-black/20 text-white/60 hover:border-white/20 hover:bg-white/[0.04] hover:text-white hover:-translate-y-[1px]"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                mode === "append" ? "border-[#7C65F6] bg-transparent" : "border-white/20"
              }`}
            >
              {mode === "append" && <div className="h-2.5 w-2.5 rounded-full bg-[#7C65F6]" />}
            </div>
            <div className="min-w-0">
              <p className={`break-words text-base font-medium transition-colors ${mode === "append" ? "text-white" : "text-white/80 group-hover:text-white"}`}>
                Create new screen{screenCount > 1 ? "s" : ""}
              </p>
              <p
                className={`mt-1 break-words text-sm leading-6 transition-colors ${mode === "append" ? "text-white/70" : "text-white/40 group-hover:text-white/60"}`}
              >
                Keeps your current screen untouched and adds the imported screen
                {screenCount > 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onSelectMode("replace")}
          className={`group block w-full overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-300 ${
            mode === "replace"
              ? "border-[#7C65F6] bg-[#7C65F6]/10 shadow-[0_0_30px_rgba(124,101,246,0.15)]"
              : "border-white/[0.06] bg-black/20 text-white/60 hover:border-white/20 hover:bg-white/[0.04] hover:text-white hover:-translate-y-[1px]"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                mode === "replace" ? "border-[#7C65F6] bg-transparent" : "border-white/20"
              }`}
            >
              {mode === "replace" && <div className="h-2.5 w-2.5 rounded-full bg-[#7C65F6]" />}
            </div>
            <div className="min-w-0">
              <p className={`break-words text-base font-medium transition-colors ${mode === "replace" ? "text-white" : "text-white/80 group-hover:text-white"}`}>Replace current screen</p>
              <p
                className={`mt-1 break-words text-sm leading-6 transition-colors ${mode === "replace" ? "text-white/70" : "text-white/40 group-hover:text-white/60"}`}
              >
                Overwrites{" "}
                <span className="font-medium text-white/90">{currentScreenName || "this screen"}</span> while
                preserving its place in the flow.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

export function FigmaImportContent({
  source,
  onSourceChange,
  connectionStatus,
  connectionError,
  needsOAuthConnection,
  isPending,
  resolvedImports,
  selectedScreenIds,
  loadedSource,
  primaryImport,
  totalMappedLayers,
  totalPreviewRoots,
  isPreviewStale,
  error,
  onLoadPreview,
  onToggleScreen,
  onSelectAll,
  onDeselectAll,
}: {
  source: string;
  onSourceChange: (value: string) => void;
  connectionStatus: FigmaConnectionStatus | null;
  connectionError: string | null;
  needsOAuthConnection: boolean;
  isPending: boolean;
  resolvedImports: ParsedFigmaImport[];
  selectedScreenIds: Set<string>;
  loadedSource: string | null;
  primaryImport: ParsedFigmaImport | null;
  totalMappedLayers: number;
  totalPreviewRoots: number;
  isPreviewStale: boolean;
  error: string | null;
  onLoadPreview: () => void;
  onToggleScreen: (nodeId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}) {
  const allSelected = selectedScreenIds.size === resolvedImports.length && resolvedImports.length > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
              Figma Source
            </p>
            <p className="mt-1.5 text-sm leading-6 text-white/50">
              Paste a share link for a frame, section, or page. The URL must include a{" "}
              <code className="text-white/70 bg-white/[0.06] px-1.5 py-0.5 rounded font-mono text-xs">node-id</code>.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] font-medium text-white/50 shadow-inner">
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
          <div
            className={`mt-5 rounded-2xl border px-5 py-4 transition-all ${
              connectionStatus.connected
                ? "border-emerald-500/20 bg-emerald-500-[0.03] bg-gradient-to-br from-emerald-500/5 to-transparent"
                : "border-sky-400/20 bg-sky-400-[0.03] bg-gradient-to-br from-sky-400/5 to-transparent"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {connectionStatus.connected ? (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 size={14} />
                </div>
              ) : (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-400/10 text-sky-400">
                  <Link2 size={14} />
                </div>
              )}
              <p className="text-sm font-medium text-white">
                {connectionStatus.connected ? "Figma connected" : "Connect your Figma account"}
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/60 ml-8">
              {connectionStatus.connected
                ? `Connected as ${connectionStatus.accountLabel || "your Figma account"}.`
                : "Each Arlo user connects their own Figma account before importing."}
            </p>
            {!connectionStatus.connected && connectionStatus.connectUrl ? (
              <a
                href={connectionStatus.connectUrl}
                className="mt-3 ml-8 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/90 transition-all hover:bg-white/[0.1] hover:text-white"
              >
                <Link2 size={14} />
                Connect Figma
              </a>
            ) : null}
          </div>
        ) : null}

        {connectionStatus?.mode === "token" ? (
          <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 text-sm leading-6 text-amber-200/90 shadow-inner">
            This environment is using a server-level Figma token fallback. That works for internal
            testing, but production should use OAuth per user.
          </div>
        ) : null}

        {connectionStatus?.mode === "none" ? (
          <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/5 px-5 py-4 text-sm leading-6 text-rose-200/90 shadow-inner">
            Figma is not configured on this server yet. Add OAuth credentials before importing.
          </div>
        ) : null}

        {connectionError ? (
          <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/5 px-5 py-4 text-sm leading-6 text-rose-200/90 shadow-inner">
            {connectionError}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row relative z-0">
          <div className="relative flex-1 group">
             <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#7C65F6]/30 to-blue-500/30 opacity-0 blur transition-opacity duration-500 group-focus-within:opacity-100" />
            <Input
              value={source}
              onChange={(event) => onSourceChange(event.target.value)}
              placeholder="https://www.figma.com/design/...?...node-id=123-456"
              className="relative h-12 w-full rounded-2xl border-white/[0.08] bg-black/40 px-4 text-sm text-white placeholder:text-white/30 backdrop-blur-xl transition focus-visible:border-white/20 focus-visible:ring-[#7C65F6]/40 focus-visible:ring-2 focus-visible:bg-black/60 shadow-inner"
            />
          </div>
          <Button
            type="button"
            onClick={onLoadPreview}
            disabled={
              !source.trim() ||
              isPending ||
              needsOAuthConnection ||
              connectionStatus?.mode === "none"
            }
            className="h-12 rounded-2xl shrink-0 bg-white text-black font-semibold hover:bg-white/90 transition-all active:scale-95 disabled:hover:scale-100 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : resolvedImports.length > 0 ? (
              <RefreshCcw size={16} />
            ) : (
              <PenTool size={16} />
            )}
            {resolvedImports.length > 0 ? "Refresh preview" : "Load preview"}
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.04] bg-white/[0.01] px-5 py-4 transition-all">
          <div className="flex items-center gap-3">
            {resolvedImports.length > 0 && !isPreviewStale && !error ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={14} />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-white/40">
                <AlertTriangle size={14} className={isPreviewStale || error ? "text-amber-400" : ""} />
              </div>
            )}
            <p className="text-sm font-medium text-white/90">
              {resolvedImports.length > 0 && !isPreviewStale && !error
                ? "Ready to import"
                : isPreviewStale
                  ? "Preview needs refresh"
                  : "Load a Figma selection"}
            </p>
          </div>

          <div className="mt-3 ml-9 space-y-2 text-sm text-white/50">
            {error ? (
              <p className="text-rose-300/80">{error}</p>
            ) : primaryImport ? (
              <>
                <p>
                  {resolvedImports.length === 1 ? (
                    <>
                      Loaded{" "}
                      <span className="font-medium text-white/80">{primaryImport.nodeName}</span>{" "}
                      from <span className="font-medium text-white/80">{primaryImport.fileName}</span>.
                    </>
                  ) : (
                    <>
                      Loaded{" "}
                      <span className="font-medium text-white/80">
                        {resolvedImports.length} screens
                      </span>{" "}
                      from <span className="font-medium text-white/80">{primaryImport.fileName}</span>.
                    </>
                  )}
                </p>
                {isPreviewStale ? (
                  <p className="text-amber-300/80">
                    The URL changed after the last preview load. Refresh before importing.
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] uppercase tracking-[0.15em] text-white/40">
                  <span className="rounded-md border border-white/[0.08] bg-black/30 px-2 py-1 shadow-inner">
                    {totalMappedLayers} mapped layers
                  </span>
                  <span className="rounded-md border border-white/[0.08] bg-black/30 px-2 py-1 shadow-inner">
                    {totalPreviewRoots} preview root{totalPreviewRoots === 1 ? "" : "s"}
                  </span>
                </div>
              </>
            ) : (
              <p>
                Arlo will fetch the selected node, map supported layers into builder-friendly content,
                and keep direct Figma links attached for later re-syncs.
              </p>
            )}
          </div>
        </div>
      </div>

      {resolvedImports.length > 0 && !isPreviewStale ? (
        <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.2)] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
                Select Screens
              </p>
              <p className="mt-1 text-sm text-[#7C65F6] font-medium">
                {selectedScreenIds.size} of {resolvedImports.length} selected
              </p>
            </div>
            {loadedSource || primaryImport ? (
              <a
                href={loadedSource ?? primaryImport?.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/70 transition-all hover:bg-white/[0.08] hover:text-white"
              >
                Open in Figma
                <ExternalLink size={14} />
              </a>
            ) : null}
          </div>

          {resolvedImports.length > 1 ? (
            <div className="mt-4 flex items-center gap-3 border-b border-white/[0.06] pb-3">
              <button
                type="button"
                onClick={allSelected ? onDeselectAll : onSelectAll}
                className="flex items-center gap-2.5 text-xs font-medium text-white/60 transition hover:text-white"
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${
                    allSelected
                      ? "border-[#7C65F6] bg-[#7C65F6]"
                      : "border-white/20 bg-black/20 hover:border-white/40"
                  }`}
                >
                  {allSelected ? <Check size={10} className="text-white" strokeWidth={3} /> : null}
                </div>
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>
          ) : null}

          <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {resolvedImports.map((item) => {
              const isSelected = selectedScreenIds.has(item.nodeId);
              return (
                <button
                  key={item.nodeId}
                  type="button"
                  onClick={() => onToggleScreen(item.nodeId)}
                  className={`group flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-all duration-300 ${
                    isSelected
                      ? "border-[#7C65F6]/40 bg-[#7C65F6]/[0.08]"
                      : "border-transparent bg-transparent hover:bg-white/[0.04]"
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                      isSelected ? "border-[#7C65F6] bg-[#7C65F6]" : "border-white/20 bg-black/20 group-hover:border-white/40"
                    }`}
                  >
                    {isSelected ? <Check size={10} className="text-white" strokeWidth={3} /> : null}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">
                    {item.screen.name || item.nodeName}
                  </span>
                  <span className="rounded-md border border-white/[0.08] bg-black/20 px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-white/40">
                    {item.screen.components.length} layers
                  </span>
                </button>
              );
            })}
          </div>

          {primaryImport && primaryImport.warnings.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-5 py-4">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle size={16} />
                <p className="text-sm font-medium">Import warnings</p>
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-200/80 pl-6 list-disc">
                {primaryImport.warnings.map((warning, index) => (
                  <li key={`${warning}-${index}`}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : resolvedImports.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-sm text-emerald-200/90 shadow-inner">
              <div className="flex items-start gap-2.5">
                 <CheckCircle2 size={16} className="text-emerald-400 mt-0.5" />
                 <p>
                    {resolvedImports.length === 1
                    ? "The screen mapped cleanly. You can import it as a read-only, Figma-backed screen."
                    : "These screens mapped cleanly. You can import them as read-only, Figma-backed screens."}
                 </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function CodeImportContent({
  code,
  onCodeChange,
  framework,
  onFrameworkChange,
  onFileImport,
}: {
  code: string;
  onCodeChange: (value: string) => void;
  framework: ImportFramework | "auto";
  onFrameworkChange: (value: ImportFramework | "auto") => void;
  onFileImport: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40 ml-1">
            Framework
          </p>
          <div className="mt-3 flex p-1.5 rounded-[20px] border border-white/[0.08] bg-black/40 backdrop-blur-md shadow-inner self-start">
            {(["auto", "react", "react-native"] as const).map((option) => (
               <button
                  key={option}
                  type="button"
                  onClick={() => onFrameworkChange(option)}
                  className={`relative rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300 outline-none ${
                     framework === option
                        ? "text-white"
                        : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]"
                  }`}
               >
                  {framework === option && (
                     <div className="absolute inset-0 rounded-xl bg-white/[0.12] shadow-sm border border-white/[0.08]" />
                  )}
                  <span className="relative z-10">
                  {option === "auto"
                    ? "Auto detect"
                    : option === "react-native"
                      ? "React Native"
                      : "React"}
                  </span>
               </button>
            ))}
          </div>
        </div>

        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[20px] border border-white/[0.08] bg-white/[0.02] px-5 py-3 text-sm font-medium text-white/80 transition-all hover:bg-white/[0.06] hover:text-white hover:-translate-y-[1px] backdrop-blur-md">
          <Upload size={16} />
          Upload .tsx file
          <input
            type="file"
            accept=".tsx,.jsx,.ts,.js"
            onChange={onFileImport}
            className="hidden"
          />
        </label>
      </div>

      <div className="rounded-[24px] border border-white/[0.06] bg-[#0f1115]/80 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
          <div>
             <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
               Source Code
             </p>
             <p className="mt-1 text-xs text-white/40">
               Paste a component, screen, or snippet. We'll map supported JSX.
             </p>
          </div>
        </div>
        <div className="bg-[#0f1115]">
          <CodeEditorSurface value={code} onChange={onCodeChange} framework={framework} />
        </div>
      </div>
    </div>
  );
}

export function CodeImportSummary({
  parsed,
}: {
  parsed: {
    result: ReturnType<typeof parseImportedCode> | null;
    error: string | null;
  };
}) {
  return (
    <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        {parsed.result ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
             <CheckCircle2 size={14} />
          </div>
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">
             <AlertTriangle size={14} />
          </div>
        )}
        <p className="text-sm font-medium text-white">
          {parsed.result ? "Ready to import" : "Needs attention"}
        </p>
      </div>

      {parsed.result ? (
        <div className="mt-4 space-y-3 text-sm text-white/70">
          <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5 shadow-inner">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold mb-3">Detected</p>
            <p className="text-base font-medium text-white">
              {parsed.result.framework === "react-native" ? "React Native" : "React"} snippet
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm text-white/50">
               <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-white/30 mb-1">New Screen</span>
                  <span className="text-white/90 font-medium">{parsed.result.screen.name}</span>
               </div>
               <div className="w-[1px] h-8 bg-white/10" />
               <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Preview Blocks</span>
                  <span className="text-white/90 font-medium truncate">{parsed.result.screen.components.length}</span>
               </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5 shadow-inner">
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">
              <FileCode2 size={14} />
              Conversion notes
            </p>
            {parsed.result.warnings.length > 0 ? (
              <ul className="mt-3 space-y-2 text-xs leading-5 text-white/60 list-disc pl-5">
                {parsed.result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-white/50 leading-relaxed">
                This import preserves the source code strictly and uses the extracted preview for builder
                display.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-rose-300/80 bg-rose-400/5 border border-rose-400/10 p-4 rounded-xl">{parsed.error}</p>
      )}
    </div>
  );
}

export function FigmaImportSummary({
  primaryImport,
  selectedCount,
  helperText,
}: {
  primaryImport: ParsedFigmaImport | null;
  selectedCount: number;
  helperText: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-5 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-400/10 text-sky-400">
           <Layers size={14} />
        </div>
        <p className="text-sm font-medium text-white">What gets stored</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/50">{helperText}</p>
      {selectedCount > 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200/90 shadow-inner">
          <CheckCircle2 size={16} className="text-emerald-400" />
          Ready to save {selectedCount} screen{selectedCount === 1 ? "" : "s"}.
        </div>
      ) : null}
      {primaryImport ? (
        <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-xs text-white/40 shadow-inner flex justify-between items-center">
          <span>Last synced</span>
          <span className="font-medium text-white/80">
            {new Date(primaryImport.lastSyncedAt).toLocaleString()}
          </span>
        </div>
      ) : null}
    </div>
  );
}
