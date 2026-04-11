import assert from "node:assert/strict";
import test from "node:test";

import type { FlowConfig } from "../lib/types";
import { flowConfigSchema } from "../lib/validations";

import { createImportedCodeScreen } from "../app/(main)/flow/[flowId]/_lib/imported-code-screen";
import { createImportedFigmaScreen } from "../app/(main)/flow/[flowId]/_lib/imported-figma-screen";
import {
  buildFigmaImport,
  collectFigmaSnapshotNodeIds,
  type FigmaNodesResponse,
} from "../app/(main)/flow/[flowId]/_lib/figma-import";
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

test("icon-only buttons validate without a text label", () => {
  const flow: FlowConfig = {
    screens: [
      {
        id: "screen_icon_only",
        name: "Icon only",
        order: 0,
        components: [
          {
            id: "comp_icon_button",
            type: "BUTTON",
            order: 0,
            props: {
              label: "",
              action: "NEXT_SCREEN",
              showIcon: true,
              iconName: "ArrowLeft",
              iconPosition: "only",
            },
          },
        ],
      },
    ],
  };

  const parsed = flowConfigSchema.safeParse(flow);

  assert.equal(parsed.success, true);
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

test("Figma text imports keep pixel line height and percentage opacity", () => {
  const response: FigmaNodesResponse = {
    name: "Typography",
    nodes: {
      "1:1": {
        document: {
          id: "1:1",
          name: "Text Frame",
          type: "FRAME",
          absoluteBoundingBox: {
            x: 0,
            y: 0,
            width: 390,
            height: 844,
          },
          children: [
            {
              id: "1:2",
              name: "Title",
              type: "TEXT",
              characters: "Imported text",
              opacity: 1,
              style: {
                fontSize: 24,
                fontWeight: 700,
                lineHeightPx: 32,
                letterSpacing: 0.5,
                fontFamily: "Inter",
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
                y: 80,
                width: 240,
                height: 40,
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

  const textComponent = analysis.screen.components.find(
    (component) => component.type === "TEXT",
  );

  assert.ok(textComponent);
  if (textComponent?.type === "TEXT") {
    const props = textComponent.props as {
      opacity?: number;
      lineHeight?: number;
      letterSpacing?: number;
      fontFamily?: string;
    };
    assert.equal(textComponent.props.opacity, 100);
    assert.equal(props.lineHeight, 32);
    assert.equal(props.letterSpacing, 0.5);
    assert.equal(props.fontFamily, "Inter");
  }
});

test("Figma visual groups import as image snapshots instead of fallback labels when exports are available", () => {
  const response: FigmaNodesResponse = {
    name: "Illustration",
    nodes: {
      "1:1": {
        document: {
          id: "1:1",
          name: "Illustration Frame",
          type: "FRAME",
          absoluteBoundingBox: {
            x: 0,
            y: 0,
            width: 390,
            height: 844,
          },
          children: [
            {
              id: "1:2",
              name: "Hero Illustration",
              type: "GROUP",
              absoluteBoundingBox: {
                x: 40,
                y: 120,
                width: 200,
                height: 180,
              },
              children: [
                {
                  id: "1:3",
                  name: "Vector Path",
                  type: "VECTOR",
                  absoluteBoundingBox: {
                    x: 40,
                    y: 120,
                    width: 200,
                    height: 180,
                  },
                },
              ],
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
    imageUrls: {
      "1:2": "https://example.com/hero.png",
    },
  });

  assert.equal(analysis.screen.components.length, 1);
  assert.equal(analysis.screen.components[0]?.type, "IMAGE");
  assert.ok(
    analysis.screen.components.every(
      (component) =>
        component.type !== "TEXT" ||
        !String(component.props.content ?? "").includes("[Figma fallback]"),
    ),
  );
});

test("Figma snapshot collection stops at the first visual container instead of exporting every descendant", () => {
  const root = {
    id: "1:1",
    name: "Illustration Frame",
    type: "FRAME",
    absoluteBoundingBox: {
      x: 0,
      y: 0,
      width: 390,
      height: 844,
    },
    children: [
      {
        id: "1:2",
        name: "Hero Illustration",
        type: "GROUP",
        absoluteBoundingBox: {
          x: 40,
          y: 120,
          width: 200,
          height: 180,
        },
        children: [
          {
            id: "1:3",
            name: "Vector A",
            type: "VECTOR",
            absoluteBoundingBox: {
              x: 40,
              y: 120,
              width: 80,
              height: 80,
            },
          },
          {
            id: "1:4",
            name: "Vector B",
            type: "VECTOR",
            absoluteBoundingBox: {
              x: 120,
              y: 160,
              width: 80,
              height: 80,
            },
          },
        ],
      },
    ],
  };

  assert.deepEqual(collectFigmaSnapshotNodeIds(root), ["1:2"]);
});

test("Figma visual-only groups are skipped cleanly when image snapshots are unavailable", () => {
  const response: FigmaNodesResponse = {
    name: "Illustration",
    nodes: {
      "1:1": {
        document: {
          id: "1:1",
          name: "Illustration Frame",
          type: "FRAME",
          absoluteBoundingBox: {
            x: 0,
            y: 0,
            width: 390,
            height: 844,
          },
          children: [
            {
              id: "1:2",
              name: "Hero Illustration",
              type: "GROUP",
              absoluteBoundingBox: {
                x: 40,
                y: 120,
                width: 200,
                height: 180,
              },
              children: [
                {
                  id: "1:3",
                  name: "Vector A",
                  type: "VECTOR",
                  absoluteBoundingBox: {
                    x: 40,
                    y: 120,
                    width: 80,
                    height: 80,
                  },
                },
              ],
            },
            {
              id: "1:4",
              name: "Title",
              type: "TEXT",
              characters: "Hello",
              style: {
                fontSize: 24,
              },
              fills: [
                {
                  type: "SOLID",
                  color: {
                    r: 0,
                    g: 0,
                    b: 0,
                  },
                },
              ],
              absoluteBoundingBox: {
                x: 24,
                y: 40,
                width: 120,
                height: 40,
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
    warnings: [
      "Figma rate limited image exports, so Arlo continued with text and layout but skipped some visual-only artwork. Retry in a minute for a higher-fidelity import.",
    ],
  });

  assert.equal(analysis.screen.components.length, 1);
  assert.equal(analysis.screen.components[0]?.type, "TEXT");
  assert.ok(
    analysis.warnings.some((warning) => warning.includes("rate limited image exports")),
  );
  assert.ok(
    analysis.warnings.some((warning) => warning.includes("Hero Illustration")),
  );
});
