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
    <div className="flex min-h-screen flex-col bg-[#0f1115] text-white">
      <div className="border-b border-white/10 bg-[#0f1115]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] items-start gap-4 px-6 py-5">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="mt-0.5 rounded-xl border border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white"
          >
            Back to builder
          </Button>
          <div className="min-w-0">
            <h1 className="text-[24px] font-semibold tracking-tight text-white">{title}</h1>
            <p className="mt-2 max-w-4xl text-[15px] leading-6 text-white/55">{description}</p>
          </div>
        </div>
      </div>

      <div className="flex-1">{children}</div>

      <div className="border-t border-white/10 bg-[#101217]">
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
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
        Import Into
      </p>
      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={() => onSelectMode("append")}
          className={`block w-full overflow-hidden rounded-2xl border px-4 py-4 text-left transition ${
            mode === "append"
              ? "border-white bg-white text-black shadow-[0_18px_50px_rgba(255,255,255,0.12)]"
              : "border-white/10 bg-black/20 text-white/70 hover:border-white/20 hover:bg-white/[0.03] hover:text-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${mode === "append" ? "border-black bg-black" : "border-white/25"}`}
            />
            <div className="min-w-0">
              <p className="break-words text-base font-medium">
                Create new screen{screenCount > 1 ? "s" : ""}
              </p>
              <p
                className={`mt-1 break-words text-sm leading-6 ${mode === "append" ? "text-black/70" : "text-white/45"}`}
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
          className={`block w-full overflow-hidden rounded-2xl border px-4 py-4 text-left transition ${
            mode === "replace"
              ? "border-white bg-white text-black shadow-[0_18px_50px_rgba(255,255,255,0.12)]"
              : "border-white/10 bg-black/20 text-white/70 hover:border-white/20 hover:bg-white/[0.03] hover:text-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${mode === "replace" ? "border-black bg-black" : "border-white/25"}`}
            />
            <div className="min-w-0">
              <p className="break-words text-base font-medium">Replace current screen</p>
              <p
                className={`mt-1 break-words text-sm leading-6 ${mode === "replace" ? "text-black/70" : "text-white/45"}`}
              >
                Overwrites{" "}
                <span className="font-medium">{currentScreenName || "this screen"}</span> while
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
    <>
      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
              Figma Source
            </p>
            <p className="mt-1 text-sm leading-6 text-white/45">
              Paste a share link for a frame, section, or page. The URL must include a{" "}
              <code className="text-white/60">node-id</code>.
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
          <div
            className={`mt-4 rounded-2xl border px-4 py-4 ${
              connectionStatus.connected
                ? "border-emerald-400/20 bg-emerald-400/10"
                : "border-sky-400/20 bg-sky-400/10"
            }`}
          >
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
                : "Each Arlo user connects their own Figma account before importing."}
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
            This environment is using a server-level Figma token fallback. That works for internal
            testing, but production should use OAuth per user.
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
            onChange={(event) => onSourceChange(event.target.value)}
            placeholder="https://www.figma.com/design/...?...node-id=123-456"
            className="h-11 rounded-2xl border-white/10 bg-black/20 px-4 text-sm text-white placeholder:text-white/25 focus-visible:border-white/20 focus-visible:ring-white/10"
          />
          <Button
            type="button"
            onClick={onLoadPreview}
            disabled={
              !source.trim() ||
              isPending ||
              needsOAuthConnection ||
              connectionStatus?.mode === "none"
            }
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
                Arlo will fetch the selected node, map supported layers into builder-friendly content,
                and keep direct Figma links attached for later re-syncs.
              </p>
            )}
          </div>
        </div>
      </div>

      {resolvedImports.length > 0 && !isPreviewStale ? (
        <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
                Select Screens to Import
              </p>
              <p className="mt-1 text-sm text-white/50">
                {selectedScreenIds.size} of {resolvedImports.length} selected
              </p>
            </div>
            {loadedSource || primaryImport ? (
              <a
                href={loadedSource ?? primaryImport?.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-white/65 transition hover:bg-white/[0.06] hover:text-white"
              >
                Open in Figma
                <ExternalLink size={12} />
              </a>
            ) : null}
          </div>

          {resolvedImports.length > 1 ? (
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={allSelected ? onDeselectAll : onSelectAll}
                className="flex items-center gap-2 text-xs font-medium text-white/50 transition hover:text-white"
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                    allSelected
                      ? "border-white bg-white"
                      : "border-white/25 bg-transparent hover:border-white/40"
                  }`}
                >
                  {allSelected ? <Check size={10} className="text-black" /> : null}
                </div>
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>
          ) : null}

          <div className="mt-3 space-y-2">
            {resolvedImports.map((item) => {
              const isSelected = selectedScreenIds.has(item.nodeId);
              return (
                <button
                  key={item.nodeId}
                  type="button"
                  onClick={() => onToggleScreen(item.nodeId)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    isSelected
                      ? "border-white/20 bg-white/[0.06]"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                      isSelected ? "border-white bg-white" : "border-white/25 bg-transparent"
                    }`}
                  >
                    {isSelected ? <Check size={10} className="text-black" /> : null}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm text-white/80">
                    {item.screen.name || item.nodeName}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-white/35">
                    {item.screen.components.length} layers
                  </span>
                </button>
              );
            })}
          </div>

          {primaryImport && primaryImport.warnings.length > 0 ? (
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
          ) : resolvedImports.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm text-emerald-100/85">
              {resolvedImports.length === 1
                ? "The screen mapped cleanly. You can import it as a read-only, Figma-backed screen."
                : "These screens mapped cleanly. You can import them as read-only, Figma-backed screens."}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
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
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
            Framework
          </p>
          <div className="mt-2 grid grid-cols-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 sm:inline-flex sm:grid-cols-none sm:flex-wrap">
            {(["auto", "react", "react-native"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onFrameworkChange(option)}
                className={`rounded-xl px-4 py-2.5 text-left text-sm font-medium transition sm:text-center ${
                  framework === option
                    ? "bg-white text-black shadow-[0_12px_30px_rgba(255,255,255,0.12)]"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {option === "auto"
                  ? "Auto detect"
                  : option === "react-native"
                    ? "React Native"
                    : "React"}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/75 transition hover:bg-white/[0.06] hover:text-white">
          <Upload size={14} />
          Upload file
          <input
            type="file"
            accept=".tsx,.jsx,.ts,.js"
            onChange={onFileImport}
            className="hidden"
          />
        </label>
      </div>

      <div className="mt-4">
        <div className="mb-3 px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">
            Source Code
          </p>
          <p className="mt-1 text-xs text-white/35">
            Paste a component, screen, or snippet and we&apos;ll map supported JSX into editable
            layers.
          </p>
        </div>
        <CodeEditorSurface value={code} onChange={onCodeChange} framework={framework} />
      </div>
    </>
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
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {parsed.result ? (
          <CheckCircle2 size={16} className="text-emerald-400" />
        ) : (
          <AlertTriangle size={16} className="text-amber-400" />
        )}
        <p className="text-sm font-medium text-white">
          {parsed.result ? "Ready to import" : "Needs attention"}
        </p>
      </div>

      {parsed.result ? (
        <div className="mt-3 space-y-3 text-sm text-white/70">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">Detected</p>
            <p className="mt-3 text-base font-medium text-white">
              {parsed.result.framework === "react-native" ? "React Native" : "React"} snippet
            </p>
            <p className="mt-2 text-sm text-white/45">
              New screen: <span className="text-white/80">{parsed.result.screen.name}</span>
            </p>
            <p className="mt-1 text-sm text-white/45">
              Preview blocks:{" "}
              <span className="text-white/80">{parsed.result.screen.components.length}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
              <FileCode2 size={13} />
              Conversion notes
            </p>
            {parsed.result.warnings.length > 0 ? (
              <ul className="mt-2 space-y-2 text-xs leading-5 text-white/60">
                {parsed.result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-white/50">
                This import preserves the source code and uses the extracted preview for builder
                display.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-white/60">{parsed.error}</p>
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
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Layers size={16} className="text-sky-300" />
        <p className="text-sm font-medium text-white">What gets stored</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/60">{helperText}</p>
      {selectedCount > 0 ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/55">
          Ready to save {selectedCount} screen{selectedCount === 1 ? "" : "s"}.
        </div>
      ) : null}
      {primaryImport ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/55">
          Last synced:{" "}
          <span className="font-medium text-white/75">
            {new Date(primaryImport.lastSyncedAt).toLocaleString()}
          </span>
        </div>
      ) : null}
    </div>
  );
}
