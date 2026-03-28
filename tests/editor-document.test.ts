import assert from "node:assert/strict";
import test from "node:test";

import type { FlowConfig } from "../lib/types";

import { createImportedCodeScreen } from "../app/(main)/flow/[flowId]/_lib/imported-code-screen";
import {
  compileEditorDocument,
  createStoredEditorDocument,
  flowConfigToEditorDocument,
  readStoredFlow,
} from "../app/(main)/flow/[flowId]/_lib/editor-document";

function normalize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

test("legacy FlowConfig round-trips through the editor document", () => {
  const legacyFlow: FlowConfig = {
    screens: [
      {
        id: "screen_welcome",
        name: "Welcome",
        order: 0,
        style: {
          backgroundColor: "#FFFFFF",
          padding: 24,
        },
        components: [
          {
            id: "comp_title",
            type: "TEXT",
            order: 0,
            props: {
              content: "Welcome to Arlo",
              fontSize: 28,
              fontWeight: "bold",
              color: "#111111",
            },
          },
          {
            id: "comp_cta",
            type: "BUTTON",
            order: 1,
            props: {
              label: "Continue",
              action: "NEXT_SCREEN",
              style: {
                backgroundColor: "#111111",
                textColor: "#FFFFFF",
                borderRadius: 16,
              },
            },
          },
        ],
      },
      {
        id: "screen_details",
        name: "Details",
        order: 1,
        layoutMode: "absolute",
        style: {
          backgroundColor: "#F4F4F5",
          padding: 20,
        },
        components: [
          {
            id: "comp_badge",
            type: "TEXT",
            order: 0,
            layout: {
              position: "absolute",
              x: 28,
              y: 80,
              width: 220,
              rotation: 6,
              zIndex: 0,
            },
            props: {
              content: "Designed visually",
              fontSize: 20,
              fontWeight: "semibold",
              color: "#111111",
            },
          },
        ],
      },
    ],
    settings: {
      dismissible: true,
      transitionAnimation: "slide",
    },
  };

  const document = flowConfigToEditorDocument(legacyFlow);
  const compiled = compileEditorDocument(document);

  assert.deepEqual(normalize(compiled), normalize(legacyFlow));
});

test("stored editor documents decode back into runtime FlowConfig", () => {
  const flow: FlowConfig = {
    screens: [
      {
        id: "screen_1",
        name: "Intro",
        order: 0,
        components: [
          {
            id: "comp_1",
            type: "TEXT",
            order: 0,
            props: {
              content: "Hello",
            },
          },
        ],
      },
    ],
    settings: {
      dismissible: true,
    },
  };

  const document = flowConfigToEditorDocument(flow);
  const stored = createStoredEditorDocument(document);
  const resolved = readStoredFlow(stored);

  assert.equal(resolved.source, "editor-document");
  assert.deepEqual(normalize(resolved.runtimeConfig), normalize(flow));
});

test("imported code screens normalize into editable editor layers", () => {
  const imported = createImportedCodeScreen(`
    export default function WelcomeCard() {
      return (
        <div style={{ backgroundColor: "#ffffff", padding: 24 }}>
          <h1>Welcome</h1>
          <button>Get started</button>
        </div>
      );
    }
  `);

  const document = flowConfigToEditorDocument({
    screens: [imported.screen],
    settings: {
      dismissible: true,
    },
  });

  const [screen] = document.screens;
  const compiled = compileEditorDocument(document);
  const [compiledScreen] = compiled.screens;

  assert.equal(screen?.source.kind, "imported-code");
  assert.ok(screen);
  assert.ok(screen.rootNodeIds.length > 0);
  assert.equal(compiledScreen?.customScreenKey, undefined);
  assert.ok((compiledScreen?.components.length ?? 0) > 0);
});
