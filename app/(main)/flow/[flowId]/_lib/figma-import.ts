import type { FlowComponent, Screen, ScreenStyle } from "@/lib/types";
import type { CSSProperties } from "react";
import type { ImportedPreviewNode } from "./code-import";

interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

interface FigmaVector {
  x: number;
  y: number;
}

interface FigmaBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FigmaTypeStyle {
  fontSize?: number;
  fontWeight?: number;
  lineHeightPx?: number;
  textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  fontFamily?: string;
  italic?: boolean;
  letterSpacing?: number;
  textCase?: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE" | "SMALL_CAPS" | "SMALL_CAPS_FORCED";
  textDecoration?: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
}

interface FigmaPaint {
  type: string;
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  imageRef?: string;
  scaleMode?: "FILL" | "FIT" | "CROP" | "TILE" | "STRETCH";
}

interface FigmaEffect {
  type: string;
  visible?: boolean;
  color?: FigmaColor;
  radius?: number;
  offset?: FigmaVector;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  opacity?: number;
  absoluteBoundingBox?: FigmaBoundingBox;
  children?: FigmaNode[];
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  cornerRadius?: number;
  rectangleCornerRadii?: number[];
  clipsContent?: boolean;
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
  primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "BASELINE";
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  itemSpacing?: number;
  layoutGrow?: number;
  layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL";
  layoutSizingVertical?: "FIXED" | "HUG" | "FILL";
  characters?: string;
  style?: FigmaTypeStyle;
  effects?: FigmaEffect[];
}

export interface FigmaNodesResponse {
  name: string;
  lastModified?: string;
  nodes: Record<
    string,
    {
      document?: FigmaNode;
    }
  >;
}

export interface ParsedFigmaSource {
  fileKey: string;
  nodeId: string;
  sourceUrl: string;
}

export interface ParsedFigmaImport {
  fileKey: string;
  nodeId: string;
  nodeName: string;
  fileName: string;
  lastSyncedAt: string;
  sourceUrl: string;
  warnings: string[];
  previewTree: ImportedPreviewNode[];
  artboard: {
    width: number;
    height: number;
  };
  screen: Screen;
}

export function collectFigmaImageNodeIds(node: FigmaNode): string[] {
  const ids = new Set<string>();

  const visit = (current: FigmaNode) => {
    if (getImagePaint(current)) {
      ids.add(current.id);
    }

    for (const child of collectVisibleChildren(current)) {
      visit(child);
    }
  };

  visit(node);
  return [...ids];
}

interface BuildFigmaImportInput {
  fileKey: string;
  nodeId: string;
  sourceUrl: string;
  response: FigmaNodesResponse;
  imageUrls?: Record<string, string>;
}

function createId(prefix: "screen" | "comp"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function prettifyName(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeNodeId(raw: string): string {
  const decoded = decodeURIComponent(raw).trim();
  return decoded.includes(":") ? decoded : decoded.replace(/-/g, ":");
}

function formatNodeIdForUrl(nodeId: string): string {
  return nodeId.replace(/:/g, "-");
}

function buildSourceUrlForNode(sourceUrl: string, nodeId: string): string {
  const url = new URL(sourceUrl);
  url.searchParams.set("node-id", formatNodeIdForUrl(nodeId));
  return url.toString();
}

export function parseFigmaSource(raw: string): ParsedFigmaSource {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Paste a Figma URL before importing.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    throw new Error("Paste a valid Figma URL.");
  }

  if (!/figma\.com$/i.test(parsedUrl.hostname)) {
    throw new Error("Paste a Figma URL from figma.com.");
  }

  const pathMatch = parsedUrl.pathname.match(/^\/(?:file|design|proto|board|slides)\/([A-Za-z0-9]+)(?:\/|$)/i);
  const fileKey = pathMatch?.[1];
  const nodeId = parsedUrl.searchParams.get("node-id");

  if (!fileKey || !nodeId) {
    throw new Error("The Figma URL must include both a file key and a node-id.");
  }

  return {
    fileKey,
    nodeId: normalizeNodeId(nodeId),
    sourceUrl: trimmed,
  };
}

function isVisible(node: FigmaNode): boolean {
  return node.visible !== false;
}

function isFrameLike(node: FigmaNode): boolean {
  return [
    "FRAME",
    "GROUP",
    "INSTANCE",
    "COMPONENT",
    "COMPONENT_SET",
    "SECTION",
    "RECTANGLE",
    "ELLIPSE",
    "VECTOR",
    "STAR",
    "POLYGON",
  ].includes(node.type);
}

function isImportContainerNode(node: FigmaNode): boolean {
  return ["CANVAS", "SECTION"].includes(node.type);
}

function isImportScreenCandidate(node: FigmaNode): boolean {
  return [
    "FRAME",
    "GROUP",
    "INSTANCE",
    "COMPONENT",
    "COMPONENT_SET",
  ].includes(node.type);
}

function isTextNode(node: FigmaNode): boolean {
  return node.type === "TEXT";
}

function isTextInputLike(node: FigmaNode): boolean {
  return /(input|text field|textfield|email|password|search|phone|otp)/i.test(node.name);
}

function getBounds(node: FigmaNode): FigmaBoundingBox | null {
  if (!node.absoluteBoundingBox) return null;
  const { x, y, width, height } = node.absoluteBoundingBox;
  if (![x, y, width, height].every((value) => Number.isFinite(value))) return null;
  return node.absoluteBoundingBox;
}

function toChannel(value: number): number {
  return clamp(Math.round(value * 255), 0, 255);
}

function colorToHex(color: FigmaColor | undefined): string | undefined {
  if (!color) return undefined;
  const r = toChannel(color.r).toString(16).padStart(2, "0");
  const g = toChannel(color.g).toString(16).padStart(2, "0");
  const b = toChannel(color.b).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`.toUpperCase();
}

function colorToCss(
  color: FigmaColor | undefined,
  alphaOverride?: number,
): string | undefined {
  if (!color) return undefined;
  const alpha = clamp(alphaOverride ?? color.a ?? 1, 0, 1);
  return `rgba(${toChannel(color.r)}, ${toChannel(color.g)}, ${toChannel(color.b)}, ${round(alpha)})`;
}

function findVisiblePaint(
  paints: FigmaPaint[] | undefined,
  predicate?: (paint: FigmaPaint) => boolean,
): FigmaPaint | null {
  if (!Array.isArray(paints)) return null;
  for (const paint of paints) {
    if (paint.visible === false) continue;
    if (predicate && !predicate(paint)) continue;
    return paint;
  }
  return null;
}

function getSolidFillHex(node: FigmaNode): string | undefined {
  const fill = findVisiblePaint(node.fills, (paint) => paint.type === "SOLID");
  return colorToHex(fill?.color);
}

function getSolidFillCss(node: FigmaNode): string | undefined {
  const fill = findVisiblePaint(node.fills, (paint) => paint.type === "SOLID");
  if (!fill?.color) return undefined;
  return colorToCss(fill.color, fill.opacity);
}

function getStrokeStyle(node: FigmaNode): Pick<CSSProperties, "border" | "borderColor" | "borderWidth"> {
  const stroke = findVisiblePaint(node.strokes, (paint) => paint.type === "SOLID");
  const borderColor = colorToCss(stroke?.color, stroke?.opacity);
  const borderWidth = node.strokeWeight && node.strokeWeight > 0 ? node.strokeWeight : undefined;

  if (!borderColor || !borderWidth) return {};

  return {
    border: `${borderWidth}px solid ${borderColor}`,
    borderColor,
    borderWidth,
  };
}

function getImagePaint(node: FigmaNode): FigmaPaint | null {
  return findVisiblePaint(node.fills, (paint) => paint.type === "IMAGE");
}

function getImageUrl(node: FigmaNode, imageUrls: Record<string, string> | undefined): string | undefined {
  if (!imageUrls) return undefined;
  return imageUrls[node.id];
}

function getBorderRadius(node: FigmaNode): number | string | undefined {
  if (typeof node.cornerRadius === "number") return node.cornerRadius;
  if (!Array.isArray(node.rectangleCornerRadii) || node.rectangleCornerRadii.length !== 4) return undefined;

  const [topLeft, topRight, bottomRight, bottomLeft] = node.rectangleCornerRadii;
  if ([topLeft, topRight, bottomRight, bottomLeft].every((value) => value === topLeft)) {
    return topLeft;
  }

  return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
}

function getBoxShadow(node: FigmaNode): string | undefined {
  if (!Array.isArray(node.effects)) return undefined;

  const parts = node.effects
    .filter((effect) => effect.visible !== false && effect.type === "DROP_SHADOW" && effect.color)
    .map((effect) => {
      const offsetX = effect.offset?.x ?? 0;
      const offsetY = effect.offset?.y ?? 0;
      const blur = effect.radius ?? 0;
      const color = colorToCss(effect.color);
      return color ? `${offsetX}px ${offsetY}px ${blur}px ${color}` : null;
    })
    .filter((value): value is string => Boolean(value));

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function getTextTransform(style: FigmaTypeStyle | undefined): CSSProperties["textTransform"] {
  switch (style?.textCase) {
    case "UPPER":
      return "uppercase";
    case "LOWER":
      return "lowercase";
    case "TITLE":
      return "capitalize";
    default:
      return undefined;
  }
}

function getTextDecoration(style: FigmaTypeStyle | undefined): CSSProperties["textDecoration"] {
  switch (style?.textDecoration) {
    case "UNDERLINE":
      return "underline";
    case "STRIKETHROUGH":
      return "line-through";
    default:
      return undefined;
  }
}

function normalizeFontWeight(value: number | undefined): "normal" | "medium" | "semibold" | "bold" | undefined {
  if (typeof value !== "number") return undefined;
  if (value >= 700) return "bold";
  if (value >= 600) return "semibold";
  if (value >= 500) return "medium";
  return "normal";
}

function inferFieldKey(source: string): string {
  const normalized = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || `field_${Date.now()}`;
}

function buildAbsoluteLayout(
  node: FigmaNode,
  rootBounds: FigmaBoundingBox | null,
  order: number,
  locked = false,
): FlowComponent["layout"] | undefined {
  const bounds = getBounds(node);
  if (!bounds || !rootBounds) {
    return locked ? { locked: true } : undefined;
  }

  return {
    position: "absolute",
    x: Math.round(bounds.x - rootBounds.x),
    y: Math.round(bounds.y - rootBounds.y),
    width: Math.max(20, Math.round(bounds.width)),
    height: Math.max(20, Math.round(bounds.height)),
    zIndex: order,
    locked: locked || undefined,
  };
}

function getPrimaryJustifyContent(node: FigmaNode): ScreenStyle["justifyContent"] | undefined {
  if (node.layoutMode !== "VERTICAL") return undefined;
  switch (node.primaryAxisAlignItems) {
    case "CENTER":
      return "center";
    case "MAX":
      return "flex-end";
    case "SPACE_BETWEEN":
      return "space-between";
    default:
      return "flex-start";
  }
}

function getCounterAlignItems(node: FigmaNode): ScreenStyle["alignItems"] | undefined {
  switch (node.counterAxisAlignItems) {
    case "CENTER":
      return "center";
    case "MAX":
      return "flex-end";
    case "MIN":
      return "flex-start";
    default:
      return node.layoutMode ? "stretch" : undefined;
  }
}

function buildScreenStyle(root: FigmaNode): ScreenStyle {
  const fill = getSolidFillHex(root) || "#FFFFFF";
  const paddingTop = clamp(Math.round(root.paddingTop ?? 0), 0, 100);
  const paddingBottom = clamp(Math.round(root.paddingBottom ?? 0), 0, 100);
  const paddingHorizontal = clamp(
    Math.round(((root.paddingLeft ?? 0) + (root.paddingRight ?? 0)) / 2),
    0,
    100,
  );
  const paddingValues = [root.paddingTop, root.paddingRight, root.paddingBottom, root.paddingLeft].every(
    (value) => typeof value === "number",
  )
    ? [root.paddingTop!, root.paddingRight!, root.paddingBottom!, root.paddingLeft!]
    : null;

  if (paddingValues && paddingValues.every((value) => value === paddingValues[0])) {
    return {
      backgroundColor: fill,
      padding: clamp(Math.round(paddingValues[0]), 0, 100),
      justifyContent: getPrimaryJustifyContent(root),
      alignItems: getCounterAlignItems(root),
    };
  }

  return {
    backgroundColor: fill,
    paddingTop,
    paddingBottom,
    paddingHorizontal,
    justifyContent: getPrimaryJustifyContent(root),
    alignItems: getCounterAlignItems(root),
  };
}

function collectVisibleChildren(node: FigmaNode): FigmaNode[] {
  return Array.isArray(node.children) ? node.children.filter(isVisible) : [];
}

function collectTextNodes(node: FigmaNode): FigmaNode[] {
  const result: FigmaNode[] = [];

  if (isTextNode(node) && node.characters?.trim()) {
    result.push(node);
  }

  for (const child of collectVisibleChildren(node)) {
    result.push(...collectTextNodes(child));
  }

  return result;
}

function getTextLabel(node: FigmaNode): string {
  return collectTextNodes(node)
    .map((child) => child.characters?.trim() ?? "")
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function isButtonLike(node: FigmaNode): boolean {
  if (!isFrameLike(node) || isTextInputLike(node)) return false;
  const bounds = getBounds(node);
  if (bounds && (bounds.width > 320 || bounds.height > 120)) return false;

  const directChildren = collectVisibleChildren(node);
  const directTextChildren = directChildren.filter((child) => isTextNode(child));
  const hasOnlySimpleChildren = directChildren.every((child) =>
    isTextNode(child) || ["VECTOR", "ELLIPSE", "RECTANGLE", "STAR"].includes(child.type),
  );

  return (
    directTextChildren.length === 1 &&
    hasOnlySimpleChildren &&
    Boolean(getSolidFillHex(node))
  );
}

function buildTextComponent(
  node: FigmaNode,
  order: number,
  rootBounds: FigmaBoundingBox | null,
): FlowComponent | null {
  const content = node.characters?.trim();
  if (!content) return null;

  return {
    id: createId("comp"),
    type: "TEXT",
    order,
    layout: buildAbsoluteLayout(node, rootBounds, order),
    props: {
      content,
      fontSize: node.style?.fontSize ? Math.round(node.style.fontSize) : 16,
      fontWeight: normalizeFontWeight(node.style?.fontWeight) ?? "normal",
      color: getSolidFillHex(node) ?? "#111827",
      textAlign:
        node.style?.textAlignHorizontal === "CENTER"
          ? "center"
          : node.style?.textAlignHorizontal === "RIGHT"
            ? "right"
            : "left",
      lineHeight:
        node.style?.lineHeightPx && node.style?.fontSize
          ? round(node.style.lineHeightPx / node.style.fontSize)
          : undefined,
      opacity: clamp(node.opacity ?? 1, 0, 1),
    },
  };
}

function buildButtonComponent(
  node: FigmaNode,
  order: number,
  rootBounds: FigmaBoundingBox | null,
): FlowComponent | null {
  const label = getTextLabel(node);
  if (!label) return null;

  const labelNode = collectTextNodes(node)[0];

  return {
    id: createId("comp"),
    type: "BUTTON",
    order,
    layout: buildAbsoluteLayout(node, rootBounds, order),
    props: {
      label,
      action: "NEXT_SCREEN",
      style: {
        backgroundColor: getSolidFillHex(node) ?? "#111827",
        textColor: getSolidFillHex(labelNode) ?? "#FFFFFF",
        borderRadius:
          typeof getBorderRadius(node) === "number" ? (getBorderRadius(node) as number) : 16,
        borderColor: colorToHex(findVisiblePaint(node.strokes, (paint) => paint.type === "SOLID")?.color),
        borderWidth: node.strokeWeight && node.strokeWeight > 0 ? node.strokeWeight : undefined,
      },
    },
  };
}

function buildImageComponent(
  node: FigmaNode,
  order: number,
  imageUrls: Record<string, string> | undefined,
  rootBounds: FigmaBoundingBox | null,
): FlowComponent | null {
  const imageUrl = getImageUrl(node, imageUrls);
  const bounds = getBounds(node);
  if (!imageUrl || !bounds) return null;

  return {
    id: createId("comp"),
    type: "IMAGE",
    order,
    layout: buildAbsoluteLayout(node, rootBounds, order),
    props: {
      src: imageUrl,
      alt: node.name,
      width: Math.round(bounds.width),
      height: Math.round(bounds.height),
      borderRadius: typeof getBorderRadius(node) === "number" ? (getBorderRadius(node) as number) : undefined,
      resizeMode: "cover",
    },
  };
}

function buildTextInputComponent(
  node: FigmaNode,
  order: number,
  rootBounds: FigmaBoundingBox | null,
): FlowComponent {
  return {
    id: createId("comp"),
    type: "TEXT_INPUT",
    order,
    layout: buildAbsoluteLayout(node, rootBounds, order),
    props: {
      placeholder: getTextLabel(node) || prettifyName(node.name),
      fieldKey: inferFieldKey(node.name),
      keyboardType: "default",
    },
  };
}

function buildFallbackComponent(
  node: FigmaNode,
  order: number,
  rootBounds: FigmaBoundingBox | null,
  reason: string,
): FlowComponent {
  return {
    id: createId("comp"),
    type: "TEXT",
    order,
    layout: buildAbsoluteLayout(node, rootBounds, order, true),
    props: {
      content: `[Figma fallback] ${prettifyName(node.name || node.type)}: ${reason}`,
      fontSize: 12,
      fontWeight: "medium",
      color: "#92400E",
      opacity: 85,
    },
  };
}

function buildComponentFromNode(
  node: FigmaNode,
  order: number,
  imageUrls: Record<string, string> | undefined,
  rootBounds: FigmaBoundingBox | null,
): FlowComponent | null {
  if (isTextNode(node)) {
    return buildTextComponent(node, order, rootBounds);
  }

  if (isTextInputLike(node)) {
    return buildTextInputComponent(node, order, rootBounds);
  }

  if (isButtonLike(node)) {
    return buildButtonComponent(node, order, rootBounds);
  }

  if (getImagePaint(node)) {
    return buildImageComponent(node, order, imageUrls, rootBounds);
  }

  return null;
}

function collectMappedComponents(
  node: FigmaNode,
  components: FlowComponent[],
  imageUrls: Record<string, string> | undefined,
  rootBounds: FigmaBoundingBox | null,
  warnings: string[],
): void {
  const component = buildComponentFromNode(node, components.length, imageUrls, rootBounds);
  if (component) {
    components.push(component);
    return;
  }

  if (getImagePaint(node) && !getImageUrl(node, imageUrls)) {
    warnings.push(`Created a fallback for ${node.name} because its image fill could not be resolved.`);
    components.push(buildFallbackComponent(node, components.length, rootBounds, "image fill unavailable"));
    return;
  }

  const children = collectVisibleChildren(node);
  if (children.length === 0 && node.type !== "LINE") {
    warnings.push(`Created a fallback layer for unsupported Figma node ${node.type} (${node.name}).`);
    components.push(buildFallbackComponent(node, components.length, rootBounds, `unsupported ${node.type.toLowerCase()} layer`));
    return;
  }

  for (const child of children) {
    collectMappedComponents(child, components, imageUrls, rootBounds, warnings);
  }
}

function getLayoutStyle(node: FigmaNode): CSSProperties {
  if (!node.layoutMode || node.layoutMode === "NONE") {
    return {
      position: "relative",
    };
  }

  return {
    display: "flex",
    flexDirection: node.layoutMode === "HORIZONTAL" ? "row" : "column",
    justifyContent:
      node.primaryAxisAlignItems === "CENTER"
        ? "center"
        : node.primaryAxisAlignItems === "MAX"
          ? "flex-end"
          : node.primaryAxisAlignItems === "SPACE_BETWEEN"
            ? "space-between"
            : "flex-start",
    alignItems:
      node.counterAxisAlignItems === "CENTER"
        ? "center"
        : node.counterAxisAlignItems === "MAX"
          ? "flex-end"
          : node.counterAxisAlignItems === "MIN"
            ? "flex-start"
            : "stretch",
    gap: node.itemSpacing ?? undefined,
    paddingTop: node.paddingTop ?? undefined,
    paddingRight: node.paddingRight ?? undefined,
    paddingBottom: node.paddingBottom ?? undefined,
    paddingLeft: node.paddingLeft ?? undefined,
  };
}

function getFillStyle(
  node: FigmaNode,
  imageUrls: Record<string, string> | undefined,
): CSSProperties {
  const imagePaint = getImagePaint(node);
  const imageUrl = getImageUrl(node, imageUrls);
  if (imagePaint && imageUrl) {
    return {
      backgroundImage: `url("${imageUrl}")`,
      backgroundPosition: "center",
      backgroundRepeat: imagePaint.scaleMode === "TILE" ? "repeat" : "no-repeat",
      backgroundSize:
        imagePaint.scaleMode === "FIT"
          ? "contain"
          : imagePaint.scaleMode === "STRETCH"
            ? "100% 100%"
            : "cover",
    };
  }

  const backgroundColor = getSolidFillCss(node);
  return backgroundColor ? { backgroundColor } : {};
}

function getNodeBaseStyle(
  node: FigmaNode,
  imageUrls: Record<string, string> | undefined,
): CSSProperties {
  const bounds = getBounds(node);
  const borderRadius = getBorderRadius(node);
  const boxShadow = getBoxShadow(node);

  return {
    ...(bounds
      ? {
          width: bounds.width,
          minHeight: isTextNode(node) ? undefined : bounds.height,
        }
      : {}),
    ...getLayoutStyle(node),
    ...getFillStyle(node, imageUrls),
    ...getStrokeStyle(node),
    borderRadius,
    boxShadow,
    opacity: typeof node.opacity === "number" ? clamp(node.opacity, 0, 1) : undefined,
    overflow: node.clipsContent ? "hidden" : undefined,
    flexGrow: node.layoutGrow === 1 ? 1 : undefined,
    alignSelf:
      node.layoutSizingHorizontal === "FILL"
        ? "stretch"
        : undefined,
  };
}

function getChildPlacementStyle(
  node: FigmaNode,
  parent: FigmaNode | null,
): CSSProperties {
  const parentBounds = parent ? getBounds(parent) : null;
  const bounds = getBounds(node);

  if (!parent || !bounds) return {};
  if (parent.layoutMode && parent.layoutMode !== "NONE") return {};
  if (!parentBounds) return {};

  return {
    position: "absolute",
    left: bounds.x - parentBounds.x,
    top: bounds.y - parentBounds.y,
  };
}

function buildTextPreviewNode(
  node: FigmaNode,
  parent: FigmaNode | null,
): ImportedPreviewNode | null {
  const content = node.characters;
  if (!content) return null;

  const bounds = getBounds(node);

  return {
    kind: "element",
    tagName: "p",
    style: {
      ...getChildPlacementStyle(node, parent),
      width: bounds?.width,
      minHeight: bounds?.height,
      margin: 0,
      color: colorToCss(findVisiblePaint(node.fills, (paint) => paint.type === "SOLID")?.color) ?? "#111827",
      fontSize: node.style?.fontSize,
      fontWeight: node.style?.fontWeight,
      lineHeight: node.style?.lineHeightPx ? `${node.style.lineHeightPx}px` : undefined,
      letterSpacing: node.style?.letterSpacing ? `${node.style.letterSpacing}px` : undefined,
      fontFamily: node.style?.fontFamily,
      fontStyle: node.style?.italic ? "italic" : undefined,
      textAlign:
        node.style?.textAlignHorizontal === "CENTER"
          ? "center"
          : node.style?.textAlignHorizontal === "RIGHT"
            ? "right"
            : node.style?.textAlignHorizontal === "JUSTIFIED"
              ? "justify"
              : "left",
      textTransform: getTextTransform(node.style),
      textDecoration: getTextDecoration(node.style),
      whiteSpace: "pre-wrap",
      opacity: typeof node.opacity === "number" ? clamp(node.opacity, 0, 1) : undefined,
    } as Record<string, unknown>,
    children: [{ kind: "text", text: content }],
  };
}

function buildPreviewNode(
  node: FigmaNode,
  imageUrls: Record<string, string> | undefined,
  parent: FigmaNode | null,
  isRoot: boolean,
): ImportedPreviewNode | null {
  if (!isVisible(node)) return null;

  // Ignore raw line layers in the read-only preview. They are not mapped into
  // editable screen components and often show up as stray separators.
  if (node.type === "LINE") return null;

  if (isTextNode(node)) {
    return buildTextPreviewNode(node, parent);
  }

  const children = collectVisibleChildren(node)
    .map((child) => buildPreviewNode(child, imageUrls, node, false))
    .filter((child): child is ImportedPreviewNode => Boolean(child));

  const bounds = getBounds(node);
  const style: CSSProperties = {
    ...getNodeBaseStyle(node, imageUrls),
    ...getChildPlacementStyle(node, parent),
  };

  if (isRoot) {
    style.width = bounds?.width ?? "100%";
    style.minHeight = bounds?.height ?? "100%";
  }

  if (
    node.type === "RECTANGLE" &&
    !children.length &&
    !getImagePaint(node) &&
    !getSolidFillCss(node) &&
    !style.border
  ) {
    return null;
  }

  return {
    kind: "element",
    tagName: "div",
    style: style as Record<string, unknown>,
    children,
  };
}

function collectImportRoots(root: FigmaNode): FigmaNode[] {
  if (!isImportContainerNode(root)) {
    return [root];
  }

  const roots: FigmaNode[] = [];

  for (const child of collectVisibleChildren(root)) {
    if (isImportContainerNode(child)) {
      roots.push(...collectImportRoots(child));
      continue;
    }

    if (isImportScreenCandidate(child)) {
      roots.push(child);
    }
  }

  return roots.length > 0 ? roots : [root];
}

function buildSingleFigmaImport(
  input: BuildFigmaImportInput,
  root: FigmaNode,
  warnings: string[],
  lastSyncedAt: string,
): ParsedFigmaImport | null {
  const components: FlowComponent[] = [];
  const rootBounds = getBounds(root);
  collectMappedComponents(root, components, input.imageUrls, rootBounds, warnings);

  const previewRoot = buildPreviewNode(root, input.imageUrls, null, true);
  const previewTree = previewRoot ? [previewRoot] : [];

  if (previewTree.length === 0 && components.length === 0) {
    return null;
  }

  return {
    fileKey: input.fileKey,
    nodeId: root.id,
    nodeName: root.name,
    fileName: input.response.name,
    lastSyncedAt,
    sourceUrl: buildSourceUrlForNode(input.sourceUrl, root.id),
    warnings: [...warnings],
    previewTree,
    artboard: {
      width: Math.max(320, Math.round(rootBounds?.width ?? 390)),
      height: Math.max(568, Math.round(rootBounds?.height ?? 844)),
    },
    screen: {
      id: createId("screen"),
      name: prettifyName(root.name || "Imported Figma Screen"),
      order: 0,
      layoutMode: "absolute",
      style: {
        ...buildScreenStyle(root),
        padding: 0,
        paddingTop: 0,
        paddingBottom: 0,
        paddingHorizontal: 0,
      },
      components,
    },
  };
}

export function buildFigmaImport(input: BuildFigmaImportInput): ParsedFigmaImport {
  return buildFigmaImports(input)[0]!;
}

export function buildFigmaImports(input: BuildFigmaImportInput): ParsedFigmaImport[] {
  const nodeEntry = input.response.nodes[input.nodeId];
  const root = nodeEntry?.document;

  if (!root) {
    throw new Error("That Figma node could not be found. Make sure the URL includes a valid node-id.");
  }

  const warnings: string[] = [];

  if (collectVisibleChildren(root).some((child) => Boolean(getImagePaint(child))) && !input.imageUrls) {
    warnings.push("Image fills could not be resolved, so some image layers may appear as placeholders.");
  }

  if (Object.values(input.imageUrls ?? {}).length > 0) {
    warnings.push("Figma-hosted image URLs can expire over time. Re-import if preview images disappear.");
  }

  const lastSyncedAt = new Date().toISOString();
  const imports = collectImportRoots(root)
    .map((importRoot) => buildSingleFigmaImport(input, importRoot, warnings, lastSyncedAt))
    .filter((value): value is ParsedFigmaImport => Boolean(value));

  if (imports.length === 0) {
    throw new Error("No supported content was found in that Figma selection.");
  }

  return imports;
}
