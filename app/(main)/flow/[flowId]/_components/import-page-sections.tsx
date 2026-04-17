"use client";

import { memo, type ChangeEvent, ReactNode } from "react";
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
      className="flex h-screen flex-col overflow-hidden text-white selection:bg-[#7C65F6]/30"
      style={{
        backgroundColor: "#050505",
        backgroundImage:
          "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.015) 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Optimized Grain Overlay - using a static SVG pattern for better performance */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] z-[100] mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      <div className="border-b border-white/[0.04] bg-[#050505]/40 backdrop-blur-md sticky top-0 z-50 transition-[background-color,backdrop-filter] duration-300">
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-6 px-8 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="group flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/50 transition-all hover:bg-white/[0.05] hover:text-white hover:border-white/[0.12] px-4 h-10"
          >
            <div className="transition-transform group-hover:-translate-x-0.5">←</div>
            <span className="text-xs font-semibold tracking-wide uppercase">Back</span>
          </Button>

          <div className="h-6 w-[1px] bg-white/[0.08]" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-[20px] font-bold tracking-tight text-white leading-none">
                {title}
              </h1>
              <span className="px-2 py-0.5 rounded-full border border-[#7C65F6]/30 bg-[#7C65F6]/10 text-[10px] font-bold text-[#9D8BFF] uppercase tracking-widest leading-none">
                Import Mode
              </span>
            </div>
            <p className="mt-1.5 text-sm text-white/40 font-medium truncate">
              {description}
            </p>
          </div>

          <div className="h-6 w-[1px] bg-white/[0.08]" />

          <div className="flex items-center gap-4 text-xs text-white/30 font-medium">
            <div className="flex items-center gap-1.5 uppercase tracking-wider">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Draft Auto-saved
            </div>
          </div>

          <div className="flex items-center gap-4">
            {footer}
          </div>
        </div>
      </div>

      <div className="flex-1 relative z-10 px-8 py-8 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1440px]">
          {children}
        </div>
      </div>
    </div>
  );
}

export const ImportModeSelector = memo(function ImportModeSelector({
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
    <div className="rounded-[24px] border border-white/[0.04] bg-[#0A0A0A]/40 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md group/container overflow-hidden relative">
       {/* Subtle background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#7C65F6]/5 blur-[64px] rounded-full pointer-events-none" />
      
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-[#7C65F6]" />
        Import Strategy
      </div>
      <div className="mt-5 space-y-3">
        {(["append", "replace"] as const).map((m) => {
          const isActive = mode === m;
          const isAppend = m === "append";
          
          return (
            <button
              key={m}
              type="button"
              onClick={() => onSelectMode(m)}
              className={`group relative block w-full overflow-hidden rounded-[20px] border px-5 py-4 text-left transition-[border-color,background-color,transform,box-shadow,ring] duration-300 ease-out active:scale-[0.98] ${
                isActive
                  ? "border-[#7C65F6]/40 bg-[#7C65F6]/[0.03] shadow-[0_0_40px_rgba(124,101,246,0.05)] ring-1 ring-[#7C65F6]/20"
                  : "border-white/[0.04] bg-white/[0.01] text-white/40 hover:border-white/[0.1] hover:bg-white/[0.03] hover:text-white/80"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-[border-color,background-color] duration-300 ${
                    isActive ? "border-[#7C65F6] bg-[#7C65F6]/10" : "border-white/10"
                  }`}
                >
                  <div className={`h-2 w-2 rounded-full bg-[#7C65F6] transition-all duration-500 transform ${isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold tracking-tight transition-colors duration-500 ${isActive ? "text-white" : "text-white/60"}`}>
                    {isAppend ? `Create new screen${screenCount > 1 ? "s" : ""}` : "Replace current screen"}
                  </p>
                  <p
                    className={`mt-1.5 text-[13px] leading-relaxed transition-colors duration-500 ${isActive ? "text-white/50" : "text-white/30"}`}
                  >
                    {isAppend 
                      ? `Keeps your current screen untouched and adds the imported screen${screenCount > 1 ? "s" : ""}.`
                      : <>Overwrites <span className="font-bold text-white/60">{currentScreenName || "this screen"}</span> while preserving its place in the flow.</>
                    }
                  </p>
                </div>
              </div>
              
              {/* Active hover indicator */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-tr from-[#7C65F6]/5 to-transparent pointer-events-none opacity-50" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export const FigmaImportContent = memo(function FigmaImportContent({
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out will-change-[transform,opacity]">
      <div className="relative rounded-[32px] border border-white/[0.04] bg-[#0A0A0A]/40 p-8 backdrop-blur-lg shadow-[0_24px_48px_rgba(0,0,0,0.4)] overflow-hidden group/figma">
        {/* Decorative elements */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#7C65F6]/5 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-md bg-[#7C65F6] flex items-center justify-center">
                  <PenTool size={10} className="text-white" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9D8BFF]">
                  Figma Integration
                </p>
              </div>
              <p className="text-sm text-white/40 font-medium max-w-lg">
                Paste a frame or section URL. Arlo will map your layers into production-ready components.
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-start lg:self-center">
               <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${
                 connectionStatus?.connected 
                   ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" 
                   : "border-amber-500/20 bg-amber-500/5 text-amber-400"
               }`}>
                 {connectionStatus?.connected ? "System Connected" : "Action Required"}
               </div>
            </div>
          </div>

          <div className="mt-8 relative group/input">
            <div className="absolute -inset-px rounded-[24px] bg-gradient-to-r from-[#7C65F6]/20 via-blue-500/20 to-[#7C65F6]/20 opacity-0 blur-lg transition-opacity duration-500 group-focus-within/input:opacity-100" />
            <div className="relative flex flex-col sm:flex-row items-center gap-3 p-2 rounded-[24px] border border-white/[0.06] bg-black/40 backdrop-blur-lg shadow-inner transition-[background-color,border-color,box-shadow] duration-300 group-focus-within/input:border-white/10 group-focus-within/input:bg-black/60">
              <Input
                value={source}
                onChange={(event) => onSourceChange(event.target.value)}
                placeholder="https://www.figma.com/file/..."
                className="h-12 border-none bg-transparent px-4 text-sm text-white placeholder:text-white/20 focus-visible:ring-0 shadow-none flex-1"
              />
              <Button
                type="button"
                onClick={onLoadPreview}
                disabled={!source.trim() || isPending || needsOAuthConnection || connectionStatus?.mode === "none"}
                className={`h-12 rounded-[18px] px-6 font-bold text-xs uppercase tracking-widest transition-all duration-500 active:scale-95 disabled:scale-100 ${
                  resolvedImports.length > 0 
                    ? "bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.1] hover:border-white/20" 
                    : "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                }`}
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : resolvedImports.length > 0 ? (
                  <RefreshCcw size={14} className="mr-2" />
                ) : (
                  <Upload size={14} className="mr-2" />
                )}
                {resolvedImports.length > 0 ? "Re-sync" : "Fetch Designs"}
              </Button>
            </div>
          </div>

          {/* Connection & Status messages */}
          <div className="mt-6 flex flex-col gap-4">
            {connectionStatus?.mode === "oauth" && !connectionStatus.connected && connectionStatus.connectUrl && (
              <div className="p-4 rounded-2xl border border-[#7C65F6]/20 bg-[#7C65F6]/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-[#7C65F6]/10 flex items-center justify-center text-[#7C65F6]">
                    <Link2 size={16} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-white leading-none">Connect Figma</p>
                    <p className="mt-1 text-xs text-white/40 font-medium">Authentication required to fetch private files.</p>
                  </div>
                </div>
                <a
                  href={connectionStatus.connectUrl}
                  className="px-4 py-2 rounded-xl bg-white text-black text-[11px] font-bold uppercase tracking-wider hover:bg-white/90 transition-all active:scale-95"
                >
                  Connect Now
                </a>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <AlertTriangle size={16} />
                </div>
                <p className="text-xs text-rose-200/80 font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {(resolvedImports.length > 0 || isPreviewStale) && !error && (
              <div className="flex flex-col sm:flex-row items-center gap-4 px-2">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full shadow-[0_0_8px_currentColor] animate-pulse ${isPreviewStale ? "text-amber-400" : "text-emerald-400"}`} />
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest leading-none">
                    {isPreviewStale ? "Out of sync" : "Sync Success"}
                  </p>
                </div>
                <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{totalMappedLayers} layers</span>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{totalPreviewRoots} screen{totalPreviewRoots === 1 ? "" : "s"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {resolvedImports.length > 0 && !isPreviewStale && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <div className="flex items-center justify-between px-2">
             <div className="space-y-1">
               <h3 className="text-sm font-bold text-white tracking-tight uppercase tracking-[0.1em]">Target Screens</h3>
               <p className="text-xs text-white/30 font-medium">{selectedScreenIds.size} screens selected for import</p>
             </div>
             <button
               type="button"
               onClick={allSelected ? onDeselectAll : onSelectAll}
               className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
             >
               {allSelected ? "Deselect All" : "Select All"}
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {resolvedImports.map((item, idx) => {
              const isSelected = selectedScreenIds.has(item.nodeId);
              return (
                <button
                  key={item.nodeId}
                  type="button"
                  onClick={() => onToggleScreen(item.nodeId)}
                  className={`group relative flex items-center gap-4 rounded-[24px] border p-4 text-left transition-all duration-500 ease-out ${
                    isSelected
                      ? "border-[#7C65F6]/30 bg-[#7C65F6]/[0.05] shadow-[0_8px_24px_rgba(124,101,246,0.1)]"
                      : "border-white/[0.04] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]"
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-500 ${
                      isSelected ? "border-[#7C65F6] bg-[#7C65F6] shadow-[0_0_12px_rgba(124,101,246,0.5)]" : "border-white/10 bg-black/40 group-hover:border-white/20"
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-bold tracking-tight transition-colors duration-500 ${isSelected ? "text-white" : "text-white/60"}`}>
                      {item.screen.name || item.nodeName}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                      {item.screen.components.length} components
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {primaryImport && primaryImport.warnings.length > 0 && (
            <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/5 p-6 shadow-inner">
               <div className="flex items-center gap-2 text-amber-400 mb-4">
                 <AlertTriangle size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Import Warnings</span>
               </div>
               <ul className="space-y-2.5">
                 {primaryImport.warnings.map((warning, index) => (
                   <li key={`${warning}-${index}`} className="text-[13px] text-amber-200/60 font-medium leading-relaxed flex items-start gap-2">
                     <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500/40" />
                     {warning}
                   </li>
                 ))}
               </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export const CodeImportContent = memo(function CodeImportContent({
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out will-change-[transform,opacity]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
             <div className="h-4 w-4 rounded-md bg-[#7C65F6] flex items-center justify-center">
               <FileCode2 size={10} className="text-white" />
             </div>
             <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9D8BFF]">
               Developer Engine
             </p>
          </div>
          
          <div className="flex p-1.5 rounded-[22px] border border-white/[0.06] bg-black/40 backdrop-blur-md shadow-inner">
            {(["auto", "react", "react-native"] as const).map((option) => {
              const isActive = framework === option;
              return (
                 <button
                    key={option}
                    type="button"
                    onClick={() => onFrameworkChange(option)}
                    className={`relative px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-[color,transform] duration-300 rounded-[16px] overflow-hidden ${
                       isActive
                          ? "text-white"
                          : "text-white/30 hover:text-white/60"
                    }`}
                 >
                    {isActive && (
                       <div className="absolute inset-0 bg-white/[0.08] border border-white/10 shadow-sm transition-[background-color,border-color] duration-300" />
                    )}
                    <span className="relative z-10">
                    {option === "auto"
                      ? "Auto detect"
                      : option === "react-native"
                        ? "React Native"
                        : "React"}
                    </span>
                 </button>
              );
            })}
          </div>
        </div>

        <label className="group flex items-center gap-3 cursor-pointer rounded-[22px] border border-white/[0.06] bg-white/[0.02] px-6 py-3.5 transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.12] hover:-translate-y-0.5 active:scale-95">
          <Upload size={14} className="text-white/40 group-hover:text-white/80 transition-colors" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Upload .tsx Source</span>
          <input
            type="file"
            accept=".tsx,.jsx,.ts,.js"
            onChange={onFileImport}
            className="hidden"
          />
        </label>
      </div>

      <div className="relative rounded-[32px] border border-white/[0.04] bg-[#0A0A0A]/60 shadow-[0_24px_48px_rgba(0,0,0,0.4)] backdrop-blur-lg overflow-hidden group/editor">
        {/* Subtle glow behind editor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C65F6]/5 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="px-6 py-4 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="h-1.5 w-1.5 rounded-full bg-[#7C65F6] shadow-[0_0_8px_rgba(124,101,246,0.5)]" />
             <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 leading-none">
               JSX Input Buffer
             </p>
           </div>
           <div className="text-[10px] font-bold uppercase tracking-widest text-[#7C65F6] opacity-0 group-hover/editor:opacity-100 transition-opacity">
              Ready to parse
           </div>
        </div>
        <div className="bg-black/20">
          <CodeEditorSurface value={code} onChange={onCodeChange} framework={framework} />
        </div>
      </div>
    </div>
  );
});

export const CodeImportSummary = memo(function CodeImportSummary({
  parsed,
}: {
  parsed: {
    result: ReturnType<typeof parseImportedCode> | null;
    error: string | null;
  };
}) {
  return (
    <div className="rounded-[24px] border border-white/[0.04] bg-[#0A0A0A]/40 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-md relative overflow-hidden group/summary">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#7C65F6]/5 blur-[60px] rounded-full pointer-events-none" />
      
      <div className="flex items-center gap-3">
        <div className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-colors duration-500 ${
           parsed.result ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-rose-500/20 bg-rose-500/10 text-rose-400"
        }`}>
          {parsed.result ? <CheckCircle2 size={12} strokeWidth={3} /> : <AlertTriangle size={12} strokeWidth={3} />}
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
          Source Analysis
        </p>
      </div>

      {parsed.result ? (
        <div className="mt-6 space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <span className="text-[11px] font-bold text-white/20 uppercase tracking-[0.15em]">Framework</span>
               <span className="text-[11px] font-bold text-white uppercase tracking-wider bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                 {parsed.result.framework === "react-native" ? "React Native" : "React"}
               </span>
            </div>
            
            <div className="p-4 rounded-2xl border border-white/[0.04] bg-white/[0.01]">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/20 mb-3">Detected Target</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white tracking-tight">{parsed.result.screen.name}</span>
                <span className="text-[10px] font-bold text-[#7C65F6] uppercase tracking-widest">{parsed.result.screen.components.length} components</span>
              </div>
            </div>

            <div className="space-y-3">
               <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/20 px-1">
                 <FileCode2 size={12} />
                 Conversion Log
               </p>
               {parsed.result.warnings.length > 0 ? (
                 <ul className="space-y-2 px-1">
                   {parsed.result.warnings.map((warning, idx) => (
                     <li key={idx} className="text-[12px] leading-relaxed text-amber-200/50 font-medium flex items-start gap-2">
                       <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500/30" />
                       {warning}
                     </li>
                   ))}
                 </ul>
               ) : (
                 <p className="text-[12px] text-white/30 font-medium leading-relaxed px-1 italic">
                   Dynamic preview mapping successful. Strict JSX preservation active.
                 </p>
               )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-200/80 font-medium leading-relaxed">
          {parsed.error}
        </div>
      )}
    </div>
  );
});

export const FigmaImportSummary = memo(function FigmaImportSummary({
  primaryImport,
  selectedCount,
  helperText,
}: {
  primaryImport: ParsedFigmaImport | null;
  selectedCount: number;
  helperText: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/[0.04] bg-[#0A0A0A]/40 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-md relative overflow-hidden group/summary">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#7C65F6]/5 blur-[60px] rounded-full pointer-events-none" />
      
      <div className="flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg border-2 border-sky-500/20 bg-sky-500/10 text-sky-400 font-bold transition-colors duration-500">
           <Layers size={12} strokeWidth={3} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
          Package Metadata
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <div className="text-[13px] leading-relaxed text-white/40 font-medium px-1">
          {helperText}
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 transition-all animate-in fade-in zoom-in-95 duration-500">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <p className="text-[13px] font-bold text-white tracking-tight">
              {selectedCount} screen{selectedCount === 1 ? "" : "s"} staged for import
            </p>
          </div>
        )}

        {primaryImport && (
          <div className="p-4 rounded-2xl border border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Last Synced</span>
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
              {new Date(primaryImport.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
