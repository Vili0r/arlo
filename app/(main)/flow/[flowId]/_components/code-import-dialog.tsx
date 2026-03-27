"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, FileCode2, Loader2, Upload } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Screen } from "@/lib/types";
import { parseImportedCode, type ImportFramework, type ImportMode } from "../_lib/code-import";
import { createImportedCodeScreen } from "../_lib/imported-code-screen";
import { CodeEditorSurface } from "./code-editor-surface";

interface CodeImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentScreenName: string;
  initialCode?: string;
  initialFramework?: ImportFramework | "auto";
  defaultMode?: ImportMode;
  lockMode?: boolean;
  title?: string;
  description?: string;
  submitLabel?: string;
  onImport: (payload: { screen: Screen; mode: ImportMode }) => void;
}

const SAMPLE_NATIVE = `import { View, Text, TextInput, Pressable } from "react-native";

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

export function CodeImportDialog({
  open,
  onOpenChange,
  currentScreenName,
  initialCode,
  initialFramework = "auto",
  defaultMode = "append",
  lockMode = false,
  title = "Import React or React Native code",
  description = "Paste a component or upload a `.tsx`, `.jsx`, `.ts`, or `.js` file. Arlo will store it as a code-backed screen and keep a read-only preview in the builder.",
  submitLabel = "Import to builder",
  onImport,
}: CodeImportDialogProps) {
  const [code, setCode] = useState(initialCode ?? SAMPLE_NATIVE);
  const [framework, setFramework] = useState<ImportFramework | "auto">(initialFramework);
  const [mode, setMode] = useState<ImportMode>(defaultMode);
  const [isPending, startTransition] = useTransition();

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

  function handleFileImport(event: React.ChangeEvent<HTMLInputElement>) {
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

  function handleImport() {
    if (!parsed.result) return;

    startTransition(() => {
      const imported = createImportedCodeScreen(code, framework);
      onImport({ screen: imported.screen, mode });
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
        side="right"
        className="h-[100dvh] w-screen max-w-none gap-0 overflow-hidden border-white/10 bg-[#0f1115] p-0 text-white sm:w-[min(94vw,1120px)] sm:max-w-none"
      >
        <SheetHeader className="border-b border-white/10 px-6 py-5 pr-14">
          <SheetTitle className="text-[22px] font-semibold text-white">{title}</SheetTitle>
          <SheetDescription className="max-w-3xl text-[15px] leading-6 text-white/55">
            {description}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="flex flex-col lg:flex-row min-h-full gap-0">
            <div className="flex-1 min-w-0 border-b border-white/10 px-6 py-5 lg:border-b-0 lg:border-r">
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
                      onClick={() => setFramework(option)}
                        className={`rounded-xl px-4 py-2.5 text-left text-sm font-medium transition sm:text-center ${
                        framework === option
                            ? "bg-white text-black shadow-[0_12px_30px_rgba(255,255,255,0.12)]"
                            : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                        {option === "auto" ? "Auto detect" : option === "react-native" ? "React Native" : "React"}
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
                    onChange={handleFileImport}
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
                    Paste a component, screen, or snippet and we&apos;ll map supported JSX into editable layers.
                  </p>
                </div>
                <CodeEditorSurface value={code} onChange={setCode} framework={framework} />
              </div>
            </div>

            <div className="w-full lg:w-[380px] shrink-0 bg-white/[0.02] px-6 py-5">
              <div className="flex flex-col gap-4">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                    {lockMode ? "Update Target" : "Import Into"}
                  </p>
                  {lockMode ? (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                      <p className="text-base font-medium text-white">Replace current screen</p>
                      <p className="mt-1 text-sm leading-6 text-white/45">
                        Updates <span className="font-medium text-white/80">{currentScreenName || "this screen"}</span> in place and refreshes its imported source.
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
                              Keeps your current screen untouched and adds a new imported one.
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
                      Preview blocks extracted: <span className="text-white/80">{parsed.result.screen.components.length}</span>
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
                            This import will preserve the source code in the screen payload and use the extracted preview only for builder display.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-white/60">{parsed.error}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="border-t border-white/10 bg-[#101217] px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 bg-transparent text-white hover:bg-white/[0.06] hover:text-white">
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsed.result || isPending}
            className="bg-white text-black hover:bg-white/90"
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Upload />}
            {submitLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
