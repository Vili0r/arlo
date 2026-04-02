import type { FlowConfig } from "@/lib/types";

import type { ImportMode } from "./code-import";
import { flowConfigToEditorDocument, type EditorDocument } from "./editor-document";

export function resolveTargetScreenIndex(
  screenIndex: number | undefined,
  screenCount: number,
): number {
  if (screenCount <= 0) return 0;
  if (typeof screenIndex !== "number" || Number.isNaN(screenIndex)) return 0;
  return Math.min(Math.max(Math.floor(screenIndex), 0), screenCount - 1);
}

export function applyImportedScreensToDocument(input: {
  document: EditorDocument;
  importedScreens: FlowConfig["screens"];
  mode: ImportMode;
  screenIndex: number;
}): { document: EditorDocument; selectedScreenIndex: number } {
  const { document, importedScreens, mode } = input;

  if (importedScreens.length === 0) {
    return {
      document,
      selectedScreenIndex: resolveTargetScreenIndex(input.screenIndex, document.screens.length),
    };
  }

  const importedEditorScreens = flowConfigToEditorDocument({
    screens: importedScreens.map((screen, index) => ({ ...screen, order: index })),
  }).screens;

  if (document.screens.length === 0) {
    return {
      document: {
        ...document,
        screens: importedEditorScreens.map((screen, index) => ({
          ...screen,
          order: index,
        })),
      },
      selectedScreenIndex: 0,
    };
  }

  const targetIndex = resolveTargetScreenIndex(input.screenIndex, document.screens.length);

  if (mode === "replace") {
    const screens = [...document.screens];
    const existing = screens[targetIndex];

    if (!existing) {
      return {
        document: {
          ...document,
          screens: [
            ...screens,
            ...importedEditorScreens.map((screen, index) => ({
              ...screen,
              order: screens.length + index,
            })),
          ],
        },
        selectedScreenIndex: screens.length,
      };
    }

    const nextScreens = importedEditorScreens.map((screen, index) => ({
      ...screen,
      id: index === 0 ? existing.id : screen.id,
    }));

    screens.splice(targetIndex, 1, ...nextScreens);

    return {
      document: {
        ...document,
        screens: screens.map((screen, index) => ({
          ...screen,
          order: index,
        })),
      },
      selectedScreenIndex: targetIndex,
    };
  }

  return {
    document: {
      ...document,
      screens: [
        ...document.screens,
        ...importedEditorScreens.map((screen, index) => ({
          ...screen,
          order: document.screens.length + index,
        })),
      ],
    },
    selectedScreenIndex: document.screens.length,
  };
}
