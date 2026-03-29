import type { Screen } from "@/lib/types";

import type { ImportedPreviewNode } from "./code-import";
import type { ParsedFigmaImport } from "./figma-import";

export const IMPORTED_FIGMA_SCREEN_KEY = "__arlo_imported_figma__";

export interface ImportedFigmaPayload {
  kind: "imported-figma";
  version: 1;
  fileKey: string;
  nodeId: string;
  nodeName: string;
  fileName: string;
  sourceUrl: string;
  lastSyncedAt: string;
  warnings: string[];
  previewScreen: Screen;
  previewTree: ImportedPreviewNode[];
  artboard: {
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

export function isImportedFigmaPayload(value: unknown): value is ImportedFigmaPayload {
  if (!isRecord(value)) return false;
  if (value.kind !== "imported-figma" || value.version !== 1) return false;
  if (
    typeof value.fileKey !== "string" ||
    typeof value.nodeId !== "string" ||
    typeof value.nodeName !== "string" ||
    typeof value.fileName !== "string" ||
    typeof value.sourceUrl !== "string" ||
    typeof value.lastSyncedAt !== "string"
  ) {
    return false;
  }
  if (!hasArtboard(value.artboard)) return false;
  if (!Array.isArray(value.warnings) || !Array.isArray(value.previewTree)) return false;
  return isRecord(value.previewScreen);
}

export function getImportedFigmaPayload(screen: Screen): ImportedFigmaPayload | null {
  if (screen.customScreenKey !== IMPORTED_FIGMA_SCREEN_KEY) return null;
  return isImportedFigmaPayload(screen.customPayload) ? screen.customPayload : null;
}

export function createImportedFigmaScreen(
  analysis: ParsedFigmaImport,
): { screen: Screen; analysis: ParsedFigmaImport } {
  const screen: Screen = {
    id: analysis.screen.id,
    name: analysis.screen.name,
    order: analysis.screen.order,
    style: analysis.screen.style,
    customScreenKey: IMPORTED_FIGMA_SCREEN_KEY,
    customPayload: {
      kind: "imported-figma",
      version: 1,
      fileKey: analysis.fileKey,
      nodeId: analysis.nodeId,
      nodeName: analysis.nodeName,
      fileName: analysis.fileName,
      sourceUrl: analysis.sourceUrl,
      lastSyncedAt: analysis.lastSyncedAt,
      warnings: analysis.warnings,
      previewScreen: analysis.screen,
      previewTree: analysis.previewTree,
      artboard: analysis.artboard,
    } satisfies ImportedFigmaPayload,
    components: [],
  };

  return { screen, analysis };
}
