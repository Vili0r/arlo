import { z } from "zod";

import { flowConfigSchema } from "@/lib/validations";
import type {
  BranchRule,
  ComponentConstraints,
  ComponentLayout,
  FlowComponent,
  FlowConfig,
  FlowSettings,
  Screen,
  ScreenStyle,
  SkipCondition,
} from "@/lib/types";

import type { ImportFramework } from "./code-import";
import { getImportedCodePayload } from "./imported-code-screen";
import { getImportedFigmaPayload } from "./imported-figma-screen";

const DEFAULT_ARTBOARD_WIDTH = 390;
const DEFAULT_ARTBOARD_HEIGHT = 844;

const constraintAnchorSchema = z.enum(["min", "max", "center", "stretch"]);

const componentSnapshotSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  order: z.number().int().min(0),
  props: z.record(z.string(), z.unknown()),
  animation: z.unknown().optional(),
  layout: z.unknown().optional(),
});

export const editorNodeTransformSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().positive().nullable(),
  height: z.number().finite().positive().nullable(),
  rotation: z.number().finite(),
  zIndex: z.number().int(),
});

export const editorConstraintsSchema = z.object({
  horizontal: constraintAnchorSchema.optional(),
  vertical: constraintAnchorSchema.optional(),
  keepAspectRatio: z.boolean().optional(),
});

const editorNodeSourceSchema = z
  .object({
    kind: z.enum(["manual", "legacy", "imported-code", "imported-figma"]),
    originalComponentId: z.string().optional(),
  })
  .optional();

const editorNodeBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  parentId: z.string().min(1).nullable(),
  childIds: z.array(z.string().min(1)),
  visible: z.boolean(),
  locked: z.boolean(),
  transform: editorNodeTransformSchema,
  constraints: editorConstraintsSchema.default({}),
  source: editorNodeSourceSchema,
});

const editorComponentNodeSchema = editorNodeBaseSchema.extend({
  kind: z.literal("component"),
  component: componentSnapshotSchema,
});

const editorGroupNodeSchema = editorNodeBaseSchema.extend({
  kind: z.literal("group"),
  layoutMode: z.enum(["auto", "absolute"]),
});

export const editorNodeSchema = z.discriminatedUnion("kind", [
  editorComponentNodeSchema,
  editorGroupNodeSchema,
]);

const importedCodeSourceSchema = z.object({
  kind: z.literal("imported-code"),
  framework: z.enum(["react", "react-native"]),
  componentName: z.string(),
  sourceCode: z.string(),
  warnings: z.array(z.string()),
});

const importedFigmaSourceSchema = z.object({
  kind: z.literal("imported-figma"),
  fileKey: z.string(),
  nodeId: z.string(),
  nodeName: z.string(),
  fileName: z.string(),
  sourceUrl: z.string(),
  lastSyncedAt: z.string(),
  warnings: z.array(z.string()),
});

const editorScreenSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("manual") }),
  z.object({ kind: z.literal("legacy") }),
  importedCodeSourceSchema,
  importedFigmaSourceSchema,
]);

export const editorScreenSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int().min(0),
  layoutMode: z.enum(["auto", "absolute"]),
  artboard: z.object({
    width: z.number().finite().positive(),
    height: z.number().finite().positive(),
  }),
  style: z.record(z.string(), z.unknown()).optional(),
  customScreenKey: z.string().optional(),
  customPayload: z.record(z.string(), z.unknown()).optional(),
  animation: z.unknown().optional(),
  branchRules: z.array(z.unknown()).optional(),
  skipWhen: z.array(z.unknown()).optional(),
  source: editorScreenSourceSchema,
  rootNodeIds: z.array(z.string().min(1)),
  nodes: z.record(z.string(), editorNodeSchema),
});

export const editorDocumentSchema = z.object({
  kind: z.literal("editor-document"),
  version: z.literal(1),
  settings: z.record(z.string(), z.unknown()).optional(),
  screens: z.array(editorScreenSchema).min(1),
});

export const storedEditorDocumentSchema = z.object({
  kind: z.literal("arlo-editor-document"),
  version: z.literal(1),
  document: editorDocumentSchema,
});

export type EditorLayoutMode = "auto" | "absolute";

export interface EditorNodeTransform {
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  rotation: number;
  zIndex: number;
}

export interface EditorNodeSource {
  kind: "manual" | "legacy" | "imported-code" | "imported-figma";
  originalComponentId?: string;
}

export interface EditorConstraints extends ComponentConstraints {}

export type EditorScreenSource =
  | { kind: "manual" }
  | { kind: "legacy" }
  | {
      kind: "imported-code";
      framework: ImportFramework;
      componentName: string;
      sourceCode: string;
      warnings: string[];
    }
  | {
      kind: "imported-figma";
      fileKey: string;
      nodeId: string;
      nodeName: string;
      fileName: string;
      sourceUrl: string;
      lastSyncedAt: string;
      warnings: string[];
    };

export interface EditorNodeBase {
  id: string;
  name: string;
  parentId: string | null;
  childIds: string[];
  visible: boolean;
  locked: boolean;
  transform: EditorNodeTransform;
  constraints: EditorConstraints;
  source?: EditorNodeSource;
}

export interface EditorComponentNode extends EditorNodeBase {
  kind: "component";
  component: FlowComponent;
}

export interface EditorGroupNode extends EditorNodeBase {
  kind: "group";
  layoutMode: EditorLayoutMode;
}

export type EditorNode = EditorComponentNode | EditorGroupNode;

export interface EditorScreen {
  id: string;
  name: string;
  order: number;
  layoutMode: EditorLayoutMode;
  artboard: {
    width: number;
    height: number;
  };
  style?: ScreenStyle;
  customScreenKey?: string;
  customPayload?: Record<string, unknown>;
  animation?: Screen["animation"];
  branchRules?: BranchRule[];
  skipWhen?: SkipCondition[];
  source: EditorScreenSource;
  rootNodeIds: string[];
  nodes: Record<string, EditorNode>;
  indicator?: unknown;
}

export interface EditorDocument {
  kind: "editor-document";
  version: 1;
  settings?: FlowSettings & {
    indicator?: unknown;
  };
  screens: EditorScreen[];
}

export interface StoredEditorDocument {
  kind: "arlo-editor-document";
  version: 1;
  document: EditorDocument;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function getComponentDisplayName(component: FlowComponent): string {
  const props = component.props as Record<string, unknown>;

  if (typeof props.label === "string" && props.label.trim()) return props.label;
  if (typeof props.content === "string" && props.content.trim()) {
    return props.content.trim().slice(0, 40);
  }
  if (typeof props.text === "string" && props.text.trim()) return props.text.trim().slice(0, 40);
  if (typeof props.title === "string" && props.title.trim()) return props.title.trim().slice(0, 40);

  return component.type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hasMeaningfulConstraints(constraints: ComponentConstraints | undefined): boolean {
  if (!constraints) return false;
  return Boolean(
    constraints.horizontal ||
      constraints.vertical ||
      constraints.keepAspectRatio,
  );
}

function hasMeaningfulLayout(layout: ComponentLayout | undefined): boolean {
  if (!layout) return false;

  return Boolean(
    layout.position === "absolute" ||
      layout.x !== undefined ||
      layout.y !== undefined ||
      layout.width !== undefined ||
      layout.height !== undefined ||
      layout.rotation !== undefined ||
      layout.zIndex !== undefined ||
      layout.visible === false ||
      layout.locked === true ||
      hasMeaningfulConstraints(layout.constraints),
  );
}

function getComponentDimensions(component: FlowComponent): {
  width: number | null;
  height: number | null;
} {
  const props = component.props as Record<string, unknown>;

  const width =
    typeof props.width === "number"
      ? props.width
      : typeof props.fixedWidth === "number"
        ? props.fixedWidth
        : typeof component.layout?.width === "number"
          ? component.layout.width
          : null;

  const height =
    typeof props.height === "number"
      ? props.height
      : typeof props.fixedHeight === "number"
        ? props.fixedHeight
        : typeof component.layout?.height === "number"
          ? component.layout.height
          : null;

  return { width, height };
}

function componentToEditorNode(
  component: FlowComponent,
  index: number,
  sourceKind: EditorScreenSource["kind"],
): EditorComponentNode {
  const { width, height } = getComponentDimensions(component);

  return {
    kind: "component",
    id: component.id,
    name: getComponentDisplayName(component),
    parentId: null,
    childIds: [],
    visible: component.layout?.visible ?? true,
    locked: component.layout?.locked ?? false,
    transform: {
      x: component.layout?.x ?? 0,
      y: component.layout?.y ?? 0,
      width,
      height,
      rotation: component.layout?.rotation ?? 0,
      zIndex: component.layout?.zIndex ?? index,
    },
    constraints: component.layout?.constraints ?? {},
    source: {
      kind: sourceKind,
      originalComponentId: component.id,
    },
    component: clone(component) as FlowComponent,
  };
}

function getEditableScreen(screen: Screen): {
  editableScreen: Screen;
  source: EditorScreenSource;
  preserveCustomScreenKey: string | undefined;
  preserveCustomPayload: Record<string, unknown> | undefined;
} {
  const importedCode = getImportedCodePayload(screen);
  if (importedCode) {
    return {
      editableScreen: {
        ...clone(importedCode.previewScreen),
        id: screen.id,
        name: screen.name,
        order: screen.order,
        style: clone(importedCode.previewScreen.style ?? screen.style),
        branchRules: clone(screen.branchRules),
        skipWhen: clone(screen.skipWhen),
      },
      source: {
        kind: "imported-code",
        framework: importedCode.framework as ImportFramework,
        componentName: importedCode.componentName,
        sourceCode: importedCode.sourceCode,
        warnings: clone(importedCode.warnings),
      },
      preserveCustomScreenKey: undefined,
      preserveCustomPayload: undefined,
    };
  }

  const importedFigma = getImportedFigmaPayload(screen);
  if (importedFigma) {
    return {
      editableScreen: {
        ...clone(importedFigma.previewScreen),
        id: screen.id,
        name: screen.name,
        order: screen.order,
        style: clone(importedFigma.previewScreen.style ?? screen.style),
        branchRules: clone(screen.branchRules),
        skipWhen: clone(screen.skipWhen),
      },
      source: {
        kind: "imported-figma",
        fileKey: importedFigma.fileKey,
        nodeId: importedFigma.nodeId,
        nodeName: importedFigma.nodeName,
        fileName: importedFigma.fileName,
        sourceUrl: importedFigma.sourceUrl,
        lastSyncedAt: importedFigma.lastSyncedAt,
        warnings: clone(importedFigma.warnings),
      },
      preserveCustomScreenKey: undefined,
      preserveCustomPayload: undefined,
    };
  }

  return {
    editableScreen: clone(screen),
    source: {
      kind:
        screen.layoutMode === "absolute" ||
        screen.components.some((component) => component.layout?.position === "absolute")
          ? "manual"
          : "legacy",
    },
    preserveCustomScreenKey: screen.customScreenKey,
    preserveCustomPayload: clone(screen.customPayload),
  };
}

export function flowConfigToEditorDocument(config: FlowConfig): EditorDocument {
  const orderedScreens = [...config.screens].sort((left, right) => left.order - right.order);

  return {
    kind: "editor-document",
    version: 1,
    settings: clone(config.settings) as EditorDocument["settings"],
    screens: orderedScreens.map((screen) => {
      const { editableScreen, source, preserveCustomPayload, preserveCustomScreenKey } =
        getEditableScreen(screen);
      const orderedComponents = [...editableScreen.components].sort(
        (left, right) => left.order - right.order,
      );
      const nodes = Object.fromEntries(
        orderedComponents.map((component, index) => [
          component.id,
          componentToEditorNode(component, index, source.kind),
        ]),
      ) as Record<string, EditorNode>;

      const inferredLayoutMode: EditorLayoutMode =
        editableScreen.layoutMode ??
        (orderedComponents.some((component) => component.layout?.position === "absolute")
          ? "absolute"
          : "auto");

      return {
        id: screen.id,
        name: screen.name,
        order: screen.order,
        layoutMode: inferredLayoutMode,
        artboard: {
          width: DEFAULT_ARTBOARD_WIDTH,
          height: DEFAULT_ARTBOARD_HEIGHT,
        },
        style: clone(editableScreen.style) as ScreenStyle | undefined,
        customScreenKey: preserveCustomScreenKey,
        customPayload: preserveCustomPayload,
        animation: clone(editableScreen.animation) as Screen["animation"],
        branchRules: clone(editableScreen.branchRules) as BranchRule[] | undefined,
        skipWhen: clone(editableScreen.skipWhen) as SkipCondition[] | undefined,
        source,
        rootNodeIds: orderedComponents.map((component) => component.id),
        nodes,
      } satisfies EditorScreen;
    }),
  };
}

function sortNodeIds(screen: EditorScreen, nodeIds: string[]): string[] {
  return [...nodeIds].sort((leftId, rightId) => {
    const left = screen.nodes[leftId];
    const right = screen.nodes[rightId];

    if (!left && !right) return 0;
    if (!left) return 1;
    if (!right) return -1;

    return left.transform.zIndex - right.transform.zIndex;
  });
}

function flattenComponentNodes(
  screen: EditorScreen,
  nodeIds: string[],
  parentTransform: EditorNodeTransform,
  components: FlowComponent[],
): void {
  for (const nodeId of sortNodeIds(screen, nodeIds)) {
    const node = screen.nodes[nodeId];
    if (!node) continue;

    const absoluteTransform: EditorNodeTransform = {
      x: parentTransform.x + node.transform.x,
      y: parentTransform.y + node.transform.y,
      width: node.transform.width,
      height: node.transform.height,
      rotation: parentTransform.rotation + node.transform.rotation,
      zIndex: parentTransform.zIndex + node.transform.zIndex,
    };

    if (node.kind === "group") {
      flattenComponentNodes(screen, node.childIds, absoluteTransform, components);
      continue;
    }

    const nextComponent = clone(node.component);
    const nextLayout: ComponentLayout | undefined =
      screen.layoutMode === "absolute" || hasMeaningfulLayout(node.component.layout)
        ? {
            position: screen.layoutMode === "absolute" ? "absolute" : node.component.layout?.position,
            x: screen.layoutMode === "absolute" ? absoluteTransform.x : node.component.layout?.x,
            y: screen.layoutMode === "absolute" ? absoluteTransform.y : node.component.layout?.y,
            width: absoluteTransform.width ?? node.component.layout?.width,
            height: absoluteTransform.height ?? node.component.layout?.height,
            rotation:
              absoluteTransform.rotation !== 0
                ? absoluteTransform.rotation
                : node.component.layout?.rotation,
            zIndex: absoluteTransform.zIndex,
            visible: node.visible === false ? false : node.component.layout?.visible,
            locked: node.locked === true ? true : node.component.layout?.locked,
            constraints: hasMeaningfulConstraints(node.constraints)
              ? node.constraints
              : node.component.layout?.constraints,
          }
        : node.component.layout;

    components.push({
      ...nextComponent,
      id: node.id,
      order: components.length,
      layout: nextLayout,
    });
  }
}

export function compileEditorDocument(document: EditorDocument): FlowConfig {
  return {
    settings: clone(document.settings) as FlowSettings | undefined,
    screens: [...document.screens]
      .sort((left, right) => left.order - right.order)
      .map((screen, screenIndex) => {
        const components: FlowComponent[] = [];

        flattenComponentNodes(
          screen,
          screen.rootNodeIds,
          {
            x: 0,
            y: 0,
            width: null,
            height: null,
            rotation: 0,
            zIndex: 0,
          },
          components,
        );

        return {
          id: screen.id,
          name: screen.name,
          order: screenIndex,
          style: clone(screen.style) as ScreenStyle | undefined,
          layoutMode: screen.layoutMode === "absolute" ? "absolute" : undefined,
          customScreenKey:
            screen.source.kind === "imported-code" || screen.source.kind === "imported-figma"
              ? undefined
              : screen.customScreenKey,
          customPayload:
            screen.source.kind === "imported-code" || screen.source.kind === "imported-figma"
              ? undefined
              : (clone(screen.customPayload) as Record<string, unknown> | undefined),
          components,
          animation: clone(screen.animation) as Screen["animation"],
          branchRules: clone(screen.branchRules) as BranchRule[] | undefined,
          skipWhen: clone(screen.skipWhen) as SkipCondition[] | undefined,
        } satisfies Screen;
      }),
  };
}

export function createStoredEditorDocument(document: EditorDocument): StoredEditorDocument {
  return {
    kind: "arlo-editor-document",
    version: 1,
    document,
  };
}

export function isStoredEditorDocument(value: unknown): value is StoredEditorDocument {
  return storedEditorDocumentSchema.safeParse(value).success;
}

export function readStoredFlow(value: unknown): {
  document: EditorDocument;
  runtimeConfig: FlowConfig;
  source: "editor-document" | "flow-config";
} {
  const storedDocument = storedEditorDocumentSchema.safeParse(value);
  if (storedDocument.success) {
    const document = storedDocument.data.document as unknown as EditorDocument;
    return {
      document,
      runtimeConfig: compileEditorDocument(document),
      source: "editor-document",
    };
  }

  const flowConfig = flowConfigSchema.safeParse(value);
  if (flowConfig.success) {
    const runtimeConfig = value as FlowConfig;
    return {
      document: flowConfigToEditorDocument(runtimeConfig),
      runtimeConfig,
      source: "flow-config",
    };
  }

  throw new Error("Stored flow payload is neither a FlowConfig nor an editor document.");
}

export function getEditorScreen(document: EditorDocument, screenIndex: number): EditorScreen | null {
  return document.screens[screenIndex] ?? null;
}

export function getScreenRootNodes(screen: EditorScreen): EditorNode[] {
  return sortNodeIds(screen, screen.rootNodeIds)
    .map((nodeId) => screen.nodes[nodeId])
    .filter((node): node is EditorNode => Boolean(node));
}

export function getComponentNode(
  screen: EditorScreen,
  nodeId: string | null,
): EditorComponentNode | null {
  if (!nodeId) return null;
  const node = screen.nodes[nodeId];
  return node?.kind === "component" ? (node as EditorComponentNode) : null;
}

export function updateEditorScreen(
  document: EditorDocument,
  screenIndex: number,
  updater: (screen: EditorScreen) => EditorScreen,
): EditorDocument {
  return {
    ...document,
    screens: document.screens.map((screen, index) =>
      index === screenIndex ? updater(screen) : screen,
    ),
  };
}

export function updateEditorNode(
  document: EditorDocument,
  screenIndex: number,
  nodeId: string,
  updater: (node: EditorNode) => EditorNode,
): EditorDocument {
  return updateEditorScreen(document, screenIndex, (screen) => {
    const node = screen.nodes[nodeId];
    if (!node) return screen;

    return {
      ...screen,
      nodes: {
        ...screen.nodes,
        [nodeId]: updater(node),
      },
    };
  });
}

export function appendComponentNode(
  screen: EditorScreen,
  component: FlowComponent,
): EditorScreen {
  const node = componentToEditorNode(component, screen.rootNodeIds.length, "manual");

  return {
    ...screen,
    rootNodeIds: [...screen.rootNodeIds, node.id],
    nodes: {
      ...screen.nodes,
      [node.id]: node,
    },
  };
}

export function removeNodeFromScreen(screen: EditorScreen, nodeId: string): EditorScreen {
  const nextNodes = { ...screen.nodes };
  const toDelete = new Set<string>();

  const visit = (currentNodeId: string) => {
    if (toDelete.has(currentNodeId)) return;
    toDelete.add(currentNodeId);
    const node = nextNodes[currentNodeId];
    if (!node) return;
    for (const childId of node.childIds) visit(childId);
  };

  visit(nodeId);

  for (const currentNodeId of toDelete) {
    delete nextNodes[currentNodeId];
  }

  return {
    ...screen,
    rootNodeIds: screen.rootNodeIds.filter((currentNodeId) => !toDelete.has(currentNodeId)),
    nodes: Object.fromEntries(
      Object.entries(nextNodes).map(([currentNodeId, node]) => [
        currentNodeId,
        {
          ...node,
          childIds: node.childIds.filter((childId) => !toDelete.has(childId)),
        },
      ]),
    ) as Record<string, EditorNode>,
  };
}

function cloneNodeTree(
  screen: EditorScreen,
  nodeId: string,
): { root: EditorNode; nodes: Record<string, EditorNode> } | null {
  const node = screen.nodes[nodeId];
  if (!node) return null;

  const nextId = `${node.id}_copy_${Math.random().toString(36).slice(2, 8)}`;

  if (node.kind === "group") {
    const childClones = node.childIds
      .map((childId) => cloneNodeTree(screen, childId))
      .filter(
        (
          child,
        ): child is {
          root: EditorNode;
          nodes: Record<string, EditorNode>;
        } => Boolean(child),
      );

    const clonedNode: EditorNode = {
      ...clone(node),
      id: nextId,
      childIds: childClones.map((child) => child.root.id),
    };

    return {
      root: clonedNode,
      nodes: {
        ...Object.assign({}, ...childClones.map((child) => child.nodes)),
        [nextId]: clonedNode,
      },
    };
  }

  const clonedNode: EditorNode = {
    ...clone(node),
    id: nextId,
    component: {
      ...clone(node.component),
      id: nextId,
    },
  };

  return {
    root: clonedNode,
    nodes: {
      [nextId]: clonedNode,
    },
  };
}

export function duplicateNodeInScreen(screen: EditorScreen, nodeId: string): EditorScreen {
  const clonedTree = cloneNodeTree(screen, nodeId);
  if (!clonedTree) return screen;

  return {
    ...screen,
    rootNodeIds: [...screen.rootNodeIds, clonedTree.root.id],
    nodes: {
      ...screen.nodes,
      ...clonedTree.nodes,
      [clonedTree.root.id]: {
        ...clonedTree.root,
        transform: {
          ...clonedTree.root.transform,
          x: clonedTree.root.transform.x + 16,
          y: clonedTree.root.transform.y + 16,
          zIndex: screen.rootNodeIds.length,
        },
      },
    },
  };
}
