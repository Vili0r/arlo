import type { Screen } from "@/lib/types";

import {
  parseImportedCode,
  type ImportFramework,
  type ImportedPreviewNode,
  type ParsedCodeImport,
} from "./code-import";

export const IMPORTED_CODE_SCREEN_KEY = "__arlo_imported_code__";

export interface ImportedCodePayload {
  kind: "imported-code";
  version: 1;
  framework: ImportFramework;
  componentName: string;
  sourceCode: string;
  warnings: string[];
  previewScreen: Screen;
  previewTree?: ImportedPreviewNode[];
  artboard?: {
    width: number;
    height: number;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasArtboard(value: unknown): value is { width: number; height: number } {
  return (
    isRecord(value) &&
    typeof value.width === "number" &&
    typeof value.height === "number"
  );
}

export function isImportedCodePayload(value: unknown): value is ImportedCodePayload {
  if (!isRecord(value)) return false;
  if (value.kind !== "imported-code" || value.version !== 1) return false;
  if (typeof value.framework !== "string" || typeof value.componentName !== "string" || typeof value.sourceCode !== "string") {
    return false;
  }
  if (!Array.isArray(value.warnings)) return false;
  if (value.artboard !== undefined && !hasArtboard(value.artboard)) return false;
  return isRecord(value.previewScreen);
}

export function getImportedCodePayload(screen: Screen): ImportedCodePayload | null {
  if (screen.customScreenKey !== IMPORTED_CODE_SCREEN_KEY) return null;
  if (!isImportedCodePayload(screen.customPayload)) return null;

  const payload = screen.customPayload;
  if (payload.previewTree && payload.previewTree.length > 0) return payload;

  try {
    const analysis = parseImportedCode(payload.sourceCode, payload.framework);
    return {
      ...payload,
      previewScreen: analysis.screen,
      previewTree: analysis.previewTree,
    };
  } catch {
    return payload;
  }
}

export function createImportedCodeScreen(
  code: string,
  preferred?: ImportFramework | "auto",
): { screen: Screen; analysis: ParsedCodeImport } {
  const analysis = parseImportedCode(code, preferred);

  const screen: Screen = {
    id: analysis.screen.id,
    name: analysis.screen.name,
    order: analysis.screen.order,
    style: analysis.screen.style,
    customScreenKey: IMPORTED_CODE_SCREEN_KEY,
    customPayload: {
      kind: "imported-code",
      version: 1,
      framework: analysis.framework,
      componentName: analysis.screen.name,
      sourceCode: code,
      warnings: analysis.warnings,
      previewScreen: analysis.screen,
      previewTree: analysis.previewTree,
      artboard: analysis.artboard,
    } satisfies ImportedCodePayload,
    components: [],
  };

  return { screen, analysis };
}
