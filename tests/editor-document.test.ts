import assert from "node:assert/strict";
import test from "node:test";

import type { FlowConfig } from "../lib/types";

import { createImportedCodeScreen } from "../app/(main)/flow/[flowId]/_lib/imported-code-screen";
import { createImportedFigmaScreen } from "../app/(main)/flow/[flowId]/_lib/imported-figma-screen";
import { buildFigmaImport, type FigmaNodesResponse } from "../app/(main)/flow/[flowId]/_lib/figma-import";
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

test("unsupported code imports become locked fallback layers that still publish through the editor", () => {
  const imported = createImportedCodeScreen(`
    export default function ComplexWelcome() {
      return (
        <div style={{ backgroundColor: "#ffffff", padding: 24, width: 390, height: 844 }}>
          <Chart data={[1, 2, 3]} />
          <button>Continue</button>
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
  assert.equal(screen?.source.kind, "imported-code");
  assert.equal(screen?.artboard.width, 390);
  assert.equal(screen?.artboard.height, 844);

  const fallbackNode = screen?.rootNodeIds
    .map((nodeId) => screen.nodes[nodeId])
    .find((node) => node?.kind === "component" && node.component.type === "TEXT");

  assert.ok(fallbackNode);
  assert.equal(fallbackNode?.locked, true);
  assert.match(
    String((fallbackNode as { component: { props: { content?: string } } }).component.props.content),
    /Imported fallback/i,
  );

  (fallbackNode as { component: { props: { content?: string } } }).component.props.content =
    "Reviewed import fallback";

  const compiled = compileEditorDocument(document);
  const stored = createStoredEditorDocument(document);
  const published = readStoredFlow(stored).runtimeConfig;

  assert.equal(compiled.screens[0]?.customScreenKey, undefined);
  assert.equal(published.screens[0]?.customPayload, undefined);
  assert.ok(
    compiled.screens[0]?.components.some(
      (component) =>
        component.type === "TEXT" &&
        component.props.content === "Reviewed import fallback" &&
        component.layout?.locked === true,
    ),
  );
});

test("Figma imports normalize positioned layers into editable nodes and publish cleanly", () => {
  const response: FigmaNodesResponse = {
    name: "Onboarding",
    nodes: {
      "1:1": {
        document: {
          id: "1:1",
          name: "Welcome Frame",
          type: "FRAME",
          absoluteBoundingBox: {
            x: 0,
            y: 0,
            width: 390,
            height: 844,
          },
          fills: [
            {
              type: "SOLID",
              color: {
                r: 1,
                g: 1,
                b: 1,
              },
            },
          ],
          children: [
            {
              id: "1:2",
              name: "Heading",
              type: "TEXT",
              characters: "Welcome aboard",
              style: {
                fontSize: 28,
                fontWeight: 700,
                textAlignHorizontal: "LEFT",
              },
              fills: [
                {
                  type: "SOLID",
                  color: {
                    r: 0.07,
                    g: 0.07,
                    b: 0.07,
                  },
                },
              ],
              absoluteBoundingBox: {
                x: 24,
                y: 84,
                width: 240,
                height: 40,
              },
            },
            {
              id: "1:3",
              name: "Unsupported Sticky",
              type: "STICKY",
              absoluteBoundingBox: {
                x: 280,
                y: 120,
                width: 48,
                height: 48,
              },
            },
          ],
        },
      },
    },
  };

  const analysis = buildFigmaImport({
    fileKey: "test-file",
    nodeId: "1:1",
    sourceUrl: "https://www.figma.com/file/test-file/demo?node-id=1-1",
    response,
  });
  const imported = createImportedFigmaScreen(analysis);
  const document = flowConfigToEditorDocument({
    screens: [imported.screen],
  });

  const [screen] = document.screens;
  assert.equal(screen?.source.kind, "imported-figma");
  assert.equal(screen?.layoutMode, "absolute");
  assert.equal(screen?.artboard.width, 390);
  assert.equal(screen?.artboard.height, 844);

  const fallbackNode = screen?.rootNodeIds
    .map((nodeId) => screen.nodes[nodeId])
    .find((node) => node?.kind === "component" && node.component.type === "TEXT" && node.locked);
  assert.ok(fallbackNode);

  const editableTextNode = screen?.rootNodeIds
    .map((nodeId) => screen.nodes[nodeId])
    .find((node) => node?.kind === "component" && node.component.type === "TEXT" && !node.locked);

  assert.ok(editableTextNode);
  if (editableTextNode?.kind === "component") {
    (editableTextNode.component.props as { content?: string }).content = "Edited in builder";
  }

  const compiled = compileEditorDocument(document);

  assert.equal(compiled.screens[0]?.customScreenKey, undefined);
  assert.ok(
    compiled.screens[0]?.components.some(
      (component) =>
        component.type === "TEXT" &&
        component.props.content === "Edited in builder" &&
        component.layout?.position === "absolute",
    ),
  );
});
