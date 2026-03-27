import type { Screen } from "@/lib/types";

import {
  getImportedCodePayload,
  type ImportedCodePayload,
} from "./imported-code-screen";
import {
  getImportedFigmaPayload,
  type ImportedFigmaPayload,
} from "./imported-figma-screen";

export type ImportedScreenPayload = ImportedCodePayload | ImportedFigmaPayload;

export function getImportedScreenPayload(screen: Screen): ImportedScreenPayload | null {
  const importedCodePayload = getImportedCodePayload(screen);
  if (importedCodePayload) return importedCodePayload;

  return getImportedFigmaPayload(screen);
}
