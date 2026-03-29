import type { FlowComponent, Screen, ScreenStyle } from "@/lib/types";
import { resolveImportedPreviewClassName } from "./imported-code-preview-styles";

export type ImportFramework = "react" | "react-native";
export type ImportMode = "append" | "replace";

type ParsedAttributeValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[]
  | undefined;

interface JsxElementNode {
  type: "element";
  name: string;
  attributes: Record<string, ParsedAttributeValue>;
  children: JsxNode[];
}

interface JsxExpressionNode {
  type: "expression";
  code: string;
}

type JsxNode = JsxElementNode | JsxExpressionNode | string;

export interface ParsedCodeImport {
  framework: ImportFramework;
  screen: Screen;
  warnings: string[];
  previewTree: ImportedPreviewNode[];
  artboard?: {
    width: number;
    height: number;
  };
}

export type ImportedPreviewNode =
  | ImportedPreviewTextNode
  | ImportedPreviewIconNode
  | ImportedPreviewElementNode;

export interface ImportedPreviewTextNode {
  kind: "text";
  text: string;
}

export interface ImportedPreviewIconNode {
  kind: "icon";
  name: string;
  className?: string;
  strokeWidth?: number;
  size?: number;
  color?: string;
}

export interface ImportedPreviewElementNode {
  kind: "element";
  tagName: string;
  className?: string;
  attributes?: Record<string, unknown>;
  style?: Record<string, unknown>;
  children: ImportedPreviewNode[];
}

interface ImportParseContext {
  values: Record<string, ResolvedValue>;
  derivedExpressions: Record<string, string>;
}

interface ResolvedJsxValue {
  kind: "jsx";
  jsx: string;
}

interface ResolvedExpressionValue {
  kind: "expression";
  code: string;
}

interface ResolvedObject {
  [key: string]: ResolvedValue;
}

type ResolvedValue =
  | string
  | number
  | boolean
  | null
  | ResolvedObject
  | ResolvedValue[]
  | ResolvedJsxValue
  | ResolvedExpressionValue
  | undefined;

function createId(prefix: "screen" | "comp"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function prettifyName(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function detectFramework(code: string, preferred?: ImportFramework | "auto"): ImportFramework {
  if (preferred && preferred !== "auto") return preferred;
  if (/from\s+["']react-native["']/.test(code) || /\b(View|Text|Pressable|TouchableOpacity|TextInput|ScrollView)\b/.test(code)) {
    return "react-native";
  }
  return "react";
}

function detectComponentName(code: string): string | null {
  const patterns = [
    /export\s+default\s+function\s+([A-Z][A-Za-z0-9_]*)/,
    /export\s+function\s+([A-Z][A-Za-z0-9_]*)/,
    /function\s+([A-Z][A-Za-z0-9_]*)/,
    /const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*\(/,
    /const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*[^=]*=>/,
  ];

  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function extractBalancedSegment(input: string, startIndex: number, openChar: string, closeChar: string): { value: string; endIndex: number } | null {
  let depth = 0;
  let quote: '"' | "'" | "`" | null = null;

  for (let index = startIndex; index < input.length; index += 1) {
    const char = input[index];
    const previous = input[index - 1];

    if (quote) {
      if (char === quote && previous !== "\\") quote = null;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === openChar) depth += 1;
    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return {
          value: input.slice(startIndex + 1, index),
          endIndex: index,
        };
      }
    }
  }

  return null;
}

function extractPrimaryJsx(code: string): string | null {
  const returnMatch = /return\s*\(/g;
  let match = returnMatch.exec(code);
  while (match) {
    const openIndex = match.index + match[0].length - 1;
    const balanced = extractBalancedSegment(code, openIndex, "(", ")");
    if (balanced && balanced.value.includes("<")) return balanced.value.trim();
    match = returnMatch.exec(code);
  }

  const arrowMatch = /=>\s*\(/g;
  match = arrowMatch.exec(code);
  while (match) {
    const openIndex = match.index + match[0].length - 1;
    const balanced = extractBalancedSegment(code, openIndex, "(", ")");
    if (balanced && balanced.value.includes("<")) return balanced.value.trim();
    match = arrowMatch.exec(code);
  }

  const firstTagIndex = code.indexOf("<");
  if (firstTagIndex >= 0) return code.slice(firstTagIndex).trim();

  return null;
}

function normalizeJsx(jsx: string): string {
  return jsx
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/<>\s*/g, "<Fragment>")
    .replace(/\s*<\/>/g, "</Fragment>");
}

function parseObjectLiteral(raw: string): ParsedAttributeValue {
  const normalized = raw
    .replace(/([,{]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/'/g, '"')
    .replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(`{${normalized}}`) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function parseArrayLiteral(raw: string): ParsedAttributeValue {
  const normalized = raw
    .replace(/([,{]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/'/g, '"')
    .replace(/\bas const\b/g, "")
    .replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(`[${normalized}]`) as unknown[];
  } catch {
    return undefined;
  }
}

function parseExpressionValue(expression: string): ParsedAttributeValue {
  const trimmed = expression.trim();

  if (!trimmed) return undefined;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return parseObjectLiteral(trimmed.slice(1, -1));
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return parseArrayLiteral(trimmed.slice(1, -1));
  if (trimmed.startsWith("`") && trimmed.endsWith("`")) return trimmed.slice(1, -1);

  return trimmed;
}

function splitTopLevel(input: string, delimiter = ","): string[] {
  const parts: string[] = [];
  let current = "";
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;
  let quote: '"' | "'" | "`" | null = null;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const previous = input[index - 1];

    if (quote) {
      current += char;
      if (char === quote && previous !== "\\") quote = null;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      current += char;
      continue;
    }

    if (char === "{") braceDepth += 1;
    if (char === "}") braceDepth = Math.max(0, braceDepth - 1);
    if (char === "[") bracketDepth += 1;
    if (char === "]") bracketDepth = Math.max(0, bracketDepth - 1);
    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth = Math.max(0, parenDepth - 1);

    if (
      char === delimiter &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      parenDepth === 0
    ) {
      if (current.trim()) parts.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function findTopLevelColon(input: string): number {
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;
  let quote: '"' | "'" | "`" | null = null;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const previous = input[index - 1];

    if (quote) {
      if (char === quote && previous !== "\\") quote = null;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") braceDepth += 1;
    if (char === "}") braceDepth = Math.max(0, braceDepth - 1);
    if (char === "[") bracketDepth += 1;
    if (char === "]") bracketDepth = Math.max(0, bracketDepth - 1);
    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth = Math.max(0, parenDepth - 1);

    if (char === ":" && braceDepth === 0 && bracketDepth === 0 && parenDepth === 0) {
      return index;
    }
  }

  return -1;
}

function normalizeLiteralSource(raw: string): string {
  return raw.trim().replace(/\s+as const$/g, "");
}

function parseRichValue(raw: string): ResolvedValue {
  const trimmed = normalizeLiteralSource(raw);

  if (!trimmed) return undefined;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  }
  if (trimmed.startsWith("`") && trimmed.endsWith("`")) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    const inner = trimmed.slice(1, -1).trim();
    if (inner.startsWith("<")) {
      return { kind: "jsx", jsx: inner };
    }
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return splitTopLevel(inner).map((part) => parseRichValue(part));
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return {};
    const record: ResolvedObject = {};

    for (const entry of splitTopLevel(inner)) {
      const separatorIndex = findTopLevelColon(entry);
      if (separatorIndex === -1) continue;
      const rawKey = entry.slice(0, separatorIndex).trim();
      const rawValue = entry.slice(separatorIndex + 1).trim();
      const key = rawKey.replace(/^["']|["']$/g, "");
      record[key] = parseRichValue(rawValue);
    }

    return record;
  }

  return { kind: "expression", code: trimmed };
}

function parseAttributes(raw: string): Record<string, ParsedAttributeValue> {
  const attributes: Record<string, ParsedAttributeValue> = {};
  let index = 0;

  while (index < raw.length) {
    while (index < raw.length && /\s/.test(raw[index])) index += 1;
    if (index >= raw.length) break;

    if (raw.slice(index, index + 3) === "...") {
      const nextSpace = raw.indexOf(" ", index);
      if (nextSpace === -1) break;
      index = nextSpace + 1;
      continue;
    }

    let key = "";
    while (index < raw.length && /[^\s=/]/.test(raw[index])) {
      key += raw[index];
      index += 1;
    }

    while (index < raw.length && /\s/.test(raw[index])) index += 1;

    if (!key) {
      index += 1;
      continue;
    }

    if (raw[index] !== "=") {
      attributes[key] = true;
      continue;
    }

    index += 1;
    while (index < raw.length && /\s/.test(raw[index])) index += 1;

    if (raw[index] === '"' || raw[index] === "'") {
      const quote = raw[index];
      index += 1;
      const start = index;
      while (index < raw.length && !(raw[index] === quote && raw[index - 1] !== "\\")) index += 1;
      attributes[key] = raw.slice(start, index);
      index += 1;
      continue;
    }

    if (raw[index] === "{") {
      const balanced = extractBalancedSegment(raw, index, "{", "}");
      if (!balanced) {
        attributes[key] = undefined;
        break;
      }
      attributes[key] = parseExpressionValue(balanced.value);
      index = balanced.endIndex + 1;
      continue;
    }

    const start = index;
    while (index < raw.length && /[^\s>]/.test(raw[index])) index += 1;
    attributes[key] = raw.slice(start, index);
  }

  return attributes;
}

function findTagEnd(input: string, startIndex: number): number {
  let quote: '"' | "'" | "`" | null = null;
  let braceDepth = 0;

  for (let index = startIndex; index < input.length; index += 1) {
    const char = input[index];
    const previous = input[index - 1];

    if (quote) {
      if (char === quote && previous !== "\\") quote = null;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      braceDepth += 1;
      continue;
    }

    if (char === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }

    if (char === ">" && braceDepth === 0) return index;
  }

  return -1;
}

function parseJsx(jsx: string): JsxElementNode {
  const root: JsxElementNode = {
    type: "element",
    name: "Fragment",
    attributes: {},
    children: [],
  };
  const stack: JsxElementNode[] = [root];
  let index = 0;

  while (index < jsx.length) {
    if (jsx[index] === "<") {
      if (jsx.slice(index, index + 4) === "<!--") {
        const end = jsx.indexOf("-->", index + 4);
        index = end >= 0 ? end + 3 : jsx.length;
        continue;
      }

      const tagEnd = findTagEnd(jsx, index + 1);
      if (tagEnd === -1) break;

      const rawTag = jsx.slice(index + 1, tagEnd).trim();
      index = tagEnd + 1;

      if (!rawTag) continue;
      if (rawTag.startsWith("!")) continue;

      if (rawTag.startsWith("/")) {
        if (stack.length > 1) stack.pop();
        continue;
      }

      const selfClosing = rawTag.endsWith("/");
      const innerTag = selfClosing ? rawTag.slice(0, -1).trim() : rawTag;
      const firstSpace = innerTag.search(/\s/);
      const tagName = firstSpace === -1 ? innerTag : innerTag.slice(0, firstSpace);
      const rawAttributes = firstSpace === -1 ? "" : innerTag.slice(firstSpace + 1);

      const element: JsxElementNode = {
        type: "element",
        name: tagName,
        attributes: parseAttributes(rawAttributes),
        children: [],
      };

      stack[stack.length - 1].children.push(element);
      if (!selfClosing) stack.push(element);
      continue;
    }

    if (jsx[index] === "{") {
      const balanced = extractBalancedSegment(jsx, index, "{", "}");
      if (!balanced) break;
      const rawExpression = balanced.value.trim();
      const isQuotedLiteral =
        (rawExpression.startsWith('"') && rawExpression.endsWith('"')) ||
        (rawExpression.startsWith("'") && rawExpression.endsWith("'"));

      if (isQuotedLiteral) {
        const value = parseExpressionValue(rawExpression);
        if (typeof value === "string") {
          const normalizedValue = value
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t");
          stack[stack.length - 1].children.push(normalizedValue);
        }
      } else {
        stack[stack.length - 1].children.push({
          type: "expression",
          code: rawExpression,
        });
      }
      index = balanced.endIndex + 1;
      continue;
    }

    const nextTag = jsx.indexOf("<", index);
    const nextExpression = jsx.indexOf("{", index);
    const nextBoundaryCandidates = [nextTag, nextExpression].filter((value) => value >= 0);
    const nextBoundary =
      nextBoundaryCandidates.length > 0 ? Math.min(...nextBoundaryCandidates) : -1;
    const chunk = jsx.slice(index, nextBoundary === -1 ? jsx.length : nextBoundary);
    const text = chunk.replace(/\s+/g, " ").trim();
    if (text) stack[stack.length - 1].children.push(text);
    index = nextBoundary === -1 ? jsx.length : nextBoundary;
  }

  return root;
}

function resolvedValueToText(value: ResolvedValue): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function getNodeText(node: JsxNode, context: ImportParseContext): string {
  if (typeof node === "string") return node;
  if (node.type === "expression") {
    return resolvedValueToText(resolveExpression(node.code, context));
  }
  return node.children.map((child) => getNodeText(child, context)).join(" ").replace(/\s+/g, " ").trim();
}

function getNodeTextPreservingBreaks(node: JsxNode, context: ImportParseContext): string {
  if (typeof node === "string") return node;
  if (node.type === "expression") {
    return resolvedValueToText(resolveExpression(node.code, context));
  }
  return node.children
    .map((child) => getNodeTextPreservingBreaks(child, context))
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeWeight(value: unknown): "normal" | "medium" | "semibold" | "bold" | undefined {
  if (typeof value === "number") {
    if (value >= 700) return "bold";
    if (value >= 600) return "semibold";
    if (value >= 500) return "medium";
    return "normal";
  }

  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower.includes("bold")) return "bold";
    if (lower.includes("semi")) return "semibold";
    if (lower.includes("medium")) return "medium";
    if (lower.includes("normal") || lower.includes("regular")) return "normal";
  }

  return undefined;
}

function getStyleObject(node: JsxElementNode): Record<string, unknown> {
  const style = node.attributes.style;
  const inlineStyle = style && typeof style === "object" && !Array.isArray(style) ? style as Record<string, unknown> : {};
  const classStyle = resolveImportedPreviewClassName(
    toStringValue(node.attributes.className) || toStringValue(node.attributes.class),
  ).style;
  return { ...classStyle, ...inlineStyle };
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value.trim())) return Number(value);
  return undefined;
}

function toStringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getNodeClassName(node: JsxElementNode): string | undefined {
  return toStringValue(node.attributes.className) || toStringValue(node.attributes.class);
}

function inferFieldKey(node: JsxElementNode, order: number): string {
  const source =
    toStringValue(node.attributes.name) ||
    toStringValue(node.attributes.id) ||
    toStringValue(node.attributes.placeholder) ||
    `field_${order + 1}`;

  return source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || `field_${order + 1}`;
}

function isContainerTag(name: string): boolean {
  return ["Fragment", "View", "ScrollView", "SafeAreaView", "KeyboardAvoidingView", "div", "section", "main", "article", "header", "footer"].includes(name);
}

function isTextTag(name: string): boolean {
  return ["Text", "p", "span", "label", "h1", "h2", "h3", "h4", "h5", "h6"].includes(name);
}

function isImageTag(name: string): boolean {
  return ["Image", "img"].includes(name);
}

function isButtonTag(name: string): boolean {
  return ["Button", "Pressable", "TouchableOpacity", "TouchableHighlight", "TouchableWithoutFeedback", "a", "button"].includes(name);
}

function isInputTag(name: string): boolean {
  return ["TextInput", "input", "textarea"].includes(name);
}

function mapTextComponent(node: JsxElementNode, order: number, context: ImportParseContext): FlowComponent | null {
  const style = getStyleObject(node);
  const content = getNodeTextPreservingBreaks(node, context);
  if (!content) return null;

  return {
    id: createId("comp"),
    type: "TEXT",
    order,
    props: {
      content,
      fontSize: toNumber(style.fontSize) ?? (node.name === "h1" ? 32 : node.name === "h2" ? 28 : node.name === "h3" ? 24 : 16),
      fontWeight: normalizeWeight(style.fontWeight) ?? (node.name.startsWith("h") ? "bold" : "normal"),
      color: toStringValue(style.color) ?? "#111827",
      textAlign: (toStringValue(style.textAlign) as "left" | "center" | "right" | undefined) ?? "left",
      lineHeight: toNumber(style.lineHeight),
      opacity: toNumber(style.opacity),
    },
  };
}

function extractLiteralConstants(code: string): Record<string, ResolvedValue> {
  const constants: Record<string, ResolvedValue> = {};
  const constPattern = /const\s+([A-Za-z_$][\w$]*)\s*=\s*/g;
  let match = constPattern.exec(code);

  while (match) {
    const name = match[1];
    const valueStart = match.index + match[0].length;
    const opener = code[valueStart];
    const closer = opener === "[" ? "]" : opener === "{" ? "}" : null;

    if (!closer) {
      match = constPattern.exec(code);
      continue;
    }

    const balanced = extractBalancedSegment(code, valueStart, opener, closer);
    if (balanced) {
      constants[name] = parseRichValue(`${opener}${balanced.value}${closer}`);
    }
    match = constPattern.exec(code);
  }

  return constants;
}

function extractStateInitialValues(code: string): Record<string, ResolvedValue> {
  const values: Record<string, ResolvedValue> = {};
  const statePattern = /const\s*\[\s*([A-Za-z_$][\w$]*)\s*,\s*[A-Za-z_$][\w$]*\s*\]\s*=\s*useState\(([^)]*)\)/g;
  let match = statePattern.exec(code);

  while (match) {
    values[match[1]] = parseRichValue(match[2].trim());
    match = statePattern.exec(code);
  }

  return values;
}

function extractDerivedExpressions(code: string): Record<string, string> {
  const expressions: Record<string, string> = {};
  const lines = code.split("\n");

  for (const line of lines) {
    const match = line.match(/^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*(.+);\s*$/);
    if (!match) continue;
    const [, name, expression] = match;
    expressions[name] = expression.trim();
  }

  return expressions;
}

function isResolvedJsxValue(value: ResolvedValue): value is ResolvedJsxValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && "kind" in value && value.kind === "jsx");
}

function isResolvedExpressionValue(value: ResolvedValue): value is ResolvedExpressionValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && "kind" in value && value.kind === "expression");
}

function resolveIdentifier(name: string, context: ImportParseContext, seen: Set<string>): ResolvedValue {
  if (name in context.values) return context.values[name];
  if (seen.has(name)) return undefined;

  const derived = context.derivedExpressions[name];
  if (!derived) return undefined;

  seen.add(name);
  const resolved = resolveExpression(derived, context, seen);
  if (resolved !== undefined) {
    context.values[name] = resolved;
  }
  seen.delete(name);
  return resolved;
}

function resolveMemberAccess(code: string, context: ImportParseContext, seen: Set<string>): ResolvedValue {
  const trimmed = code.trim();
  const baseMatch = trimmed.match(/^([A-Za-z_$][\w$]*)/);
  if (!baseMatch) return undefined;

  let cursor = baseMatch[1].length;
  let current = resolveIdentifier(baseMatch[1], context, seen);

  while (cursor < trimmed.length && current !== undefined) {
    if (trimmed[cursor] === ".") {
      cursor += 1;
      const propertyMatch = trimmed.slice(cursor).match(/^([A-Za-z_$][\w$]*)/);
      if (!propertyMatch) return undefined;
      const property = propertyMatch[1];
      cursor += property.length;

      if (Array.isArray(current) && property === "length") {
        current = current.length;
        continue;
      }

      if (current && typeof current === "object" && !Array.isArray(current) && !("kind" in current)) {
        current = (current as ResolvedObject)[property];
        continue;
      }

      return undefined;
    }

    if (trimmed[cursor] === "[") {
      const balanced = extractBalancedSegment(trimmed, cursor, "[", "]");
      if (!balanced) return undefined;
      const rawIndex = balanced.value.trim();
      const resolvedIndex = resolveExpression(rawIndex, context, seen);
      cursor = balanced.endIndex + 1;

      if (Array.isArray(current) && typeof resolvedIndex === "number") {
        current = current[resolvedIndex];
        continue;
      }

      if (current && typeof current === "object" && !Array.isArray(current) && !("kind" in current) && typeof resolvedIndex === "string") {
        current = (current as ResolvedObject)[resolvedIndex];
        continue;
      }

      return undefined;
    }

    return undefined;
  }

  return current;
}

function resolveExpression(code: string, context: ImportParseContext, seen = new Set<string>()): ResolvedValue {
  const trimmed = code.trim();
  if (!trimmed) return undefined;

  const literal = parseRichValue(trimmed);
  if (!isResolvedExpressionValue(literal)) return literal;

  const arithmeticMatch = trimmed.match(/^(.+?)\s*([+\-*/])\s*(.+)$/);
  if (arithmeticMatch) {
    const left = resolveExpression(arithmeticMatch[1], context, seen);
    const right = resolveExpression(arithmeticMatch[3], context, seen);
    if (typeof left === "number" && typeof right === "number") {
      switch (arithmeticMatch[2]) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          return right === 0 ? undefined : left / right;
      }
    }
  }

  return resolveMemberAccess(trimmed, context, seen);
}

function normalizePreviewTagName(node: JsxElementNode): string {
  const rawName = node.name.includes(".") ? node.name.split(".").pop() || node.name : node.name;

  if (rawName === "Fragment") return "fragment";
  if (["View", "ScrollView", "SafeAreaView", "KeyboardAvoidingView"].includes(rawName)) return "div";
  if (rawName === "Text") return "p";
  if (rawName === "Image") return "img";
  if (rawName === "TextInput") return "input";
  if (["Pressable", "TouchableOpacity", "TouchableHighlight", "TouchableWithoutFeedback", "Button"].includes(rawName)) {
    return "button";
  }
  if (rawName === "Badge") return "span";

  if (/^[A-Z]/.test(rawName)) {
    return node.children.length === 0 ? "icon" : "div";
  }

  return rawName;
}

function resolvePreviewAttributeValue(
  key: string,
  value: ParsedAttributeValue,
  context: ImportParseContext,
): unknown {
  if (key === "className" || key === "class") return toStringValue(value);

  if (key === "style") {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : undefined;
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    Array.isArray(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const resolved = resolveExpression(value, context);
    if (resolved !== undefined && !isResolvedExpressionValue(resolved) && !isResolvedJsxValue(resolved)) {
      return resolved;
    }
    return value;
  }

  if (value && typeof value === "object") return value;
  return undefined;
}

function buildPreviewNodesFromCallbackBody(
  body: string,
  context: ImportParseContext,
): ImportedPreviewNode[] {
  const trimmed = body.trim();
  if (!trimmed) return [];

  const blockMatch = trimmed.match(/^\{([\s\S]*)\}$/);
  if (blockMatch) {
    const blockContent = blockMatch[1].trim();
    const returnedJsx = extractPrimaryJsx(blockContent);
    if (returnedJsx) {
      const parsedTree = parseJsx(normalizeJsx(returnedJsx));
      return parsedTree.children.flatMap((child) => buildImportedPreviewNodes(child, context));
    }

    const returnMatch = blockContent.match(/return\s+([^;]+);?/);
    if (returnMatch) {
      return buildPreviewNodesFromCallbackBody(returnMatch[1], context);
    }

    return [];
  }

  const parenthesized = trimmed.startsWith("(") && trimmed.endsWith(")")
    ? trimmed.slice(1, -1).trim()
    : trimmed;

  if (parenthesized.startsWith("<")) {
    const parsedTree = parseJsx(normalizeJsx(parenthesized));
    return parsedTree.children.flatMap((child) => buildImportedPreviewNodes(child, context));
  }

  const resolved = resolveExpression(parenthesized, context);
  if (isResolvedJsxValue(resolved)) {
    const parsedTree = parseJsx(normalizeJsx(resolved.jsx));
    return parsedTree.children.flatMap((child) => buildImportedPreviewNodes(child, context));
  }

  const text = resolvedValueToText(resolved).trim();
  return text ? [{ kind: "text", text }] : [];
}

function buildPreviewNodesFromMapExpression(
  expression: string,
  context: ImportParseContext,
): ImportedPreviewNode[] | null {
  const mapIndex = expression.indexOf(".map(");
  if (mapIndex === -1) return null;

  const source = expression.slice(0, mapIndex).trim();
  const openIndex = expression.indexOf("(", mapIndex + 4);
  if (openIndex === -1) return null;

  const balanced = extractBalancedSegment(expression, openIndex, "(", ")");
  if (!balanced) return null;

  const callback = balanced.value.trim();
  const arrowIndex = callback.indexOf("=>");
  if (arrowIndex === -1) return null;

  const paramsRaw = callback.slice(0, arrowIndex).trim();
  const bodyRaw = callback.slice(arrowIndex + 2).trim();
  const params = paramsRaw
    .replace(/^\(/, "")
    .replace(/\)$/, "")
    .split(",")
    .map((param) => param.trim())
    .filter(Boolean);

  const itemName = params[0];
  const indexName = params[1];
  if (!itemName) return null;

  const resolvedItems = resolveExpression(source, context);
  const items = Array.isArray(resolvedItems) ? resolvedItems : undefined;
  if (!items || items.length === 0) return null;

  return items.flatMap((item, index) => {
    const scopedContext: ImportParseContext = {
      ...context,
      values: {
        ...context.values,
        [itemName]: item,
        ...(indexName ? { [indexName]: index } : {}),
      },
    };
    return buildPreviewNodesFromCallbackBody(bodyRaw, scopedContext);
  });
}

function buildImportedPreviewNodes(
  node: JsxNode,
  context: ImportParseContext,
): ImportedPreviewNode[] {
  if (typeof node === "string") {
    const text = node.replace(/\s+/g, " ").trim();
    return text ? [{ kind: "text", text }] : [];
  }

  if (node.type === "expression") {
    const mappedNodes = buildPreviewNodesFromMapExpression(node.code, context);
    if (mappedNodes) return mappedNodes;

    const resolved = resolveExpression(node.code, context);
    if (isResolvedJsxValue(resolved)) {
      const parsedTree = parseJsx(normalizeJsx(resolved.jsx));
      return parsedTree.children.flatMap((child) => buildImportedPreviewNodes(child, context));
    }

    const text = resolvedValueToText(resolved).trim();
    return text ? [{ kind: "text", text }] : [];
  }

  const tagName = normalizePreviewTagName(node);
  if (tagName === "fragment") {
    return node.children.flatMap((child) => buildImportedPreviewNodes(child, context));
  }

  if (tagName === "icon") {
    return [{
      kind: "icon",
      name: node.name.includes(".") ? node.name.split(".").pop() || node.name : node.name,
      className: getNodeClassName(node),
      strokeWidth: toNumber(resolvePreviewAttributeValue("strokeWidth", node.attributes.strokeWidth, context)),
      size: toNumber(resolvePreviewAttributeValue("size", node.attributes.size, context)),
      color: toStringValue(resolvePreviewAttributeValue("color", node.attributes.color, context)),
    }];
  }

  const attributes = Object.entries(node.attributes).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (key === "key" || key === "initial" || key === "animate" || key === "transition" || key === "whileHover" || key === "whileTap") {
      return acc;
    }

    const resolved = resolvePreviewAttributeValue(key, value, context);
    if (resolved !== undefined) acc[key] = resolved;
    return acc;
  }, {});

  const children = node.children.flatMap((child) => buildImportedPreviewNodes(child, context));
  const className = getNodeClassName(node);
  const style = attributes.style && typeof attributes.style === "object" && !Array.isArray(attributes.style)
    ? attributes.style as Record<string, unknown>
    : undefined;

  delete attributes.class;
  delete attributes.className;
  delete attributes.style;

  return [{
    kind: "element",
    tagName,
    className,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    style,
    children,
  }];
}

function buildFeatureListFromExpression(
  expression: string,
  order: number,
  context: ImportParseContext,
): FlowComponent | null {
  const match = expression.match(/^([\s\S]+?)\.map\s*\(/);
  if (!match) return null;

  const source = match[1].trim();
  const resolvedItems = resolveExpression(source, context);
  const items = Array.isArray(resolvedItems) ? resolvedItems : undefined;
  if (!Array.isArray(items) || items.length === 0) return null;

  const features = items
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `feature_${index + 1}`,
          label: item,
        };
      }
      if (!item || typeof item !== "object" || Array.isArray(item) || "kind" in item) return null;
      const record = item as Record<string, ResolvedValue>;
      const label = toStringValue(record.label);
      if (!label) return null;
      return {
        id: `feature_${index + 1}`,
        label,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (features.length === 0) return null;

  return {
    id: createId("comp"),
    type: "FEATURE_LIST",
    order,
    props: {
      features,
      iconColor: "#FFFFFF",
      textColor: "#6B7280",
    },
  };
}

function mapImageComponent(node: JsxElementNode, order: number): FlowComponent | null {
  const style = getStyleObject(node);
  const sourceAttribute = node.attributes.source;
  const sourceObject =
    sourceAttribute && typeof sourceAttribute === "object" && !Array.isArray(sourceAttribute)
      ? sourceAttribute as Record<string, unknown>
      : null;
  const src =
    toStringValue(node.attributes.src) ||
    toStringValue(sourceObject?.uri) ||
    toStringValue(node.attributes.alt);

  if (!src) return null;

  return {
    id: createId("comp"),
    type: "IMAGE",
    order,
    props: {
      src,
      alt: toStringValue(node.attributes.alt),
      width: toNumber(node.attributes.width) ?? toNumber(style.width) ?? 240,
      height: toNumber(node.attributes.height) ?? toNumber(style.height) ?? 160,
      borderRadius: toNumber(style.borderRadius),
      resizeMode: (toStringValue(style.resizeMode) as "cover" | "contain" | "stretch" | "center" | undefined) ?? "cover",
    },
  };
}

function mapButtonComponent(node: JsxElementNode, order: number, context: ImportParseContext): FlowComponent {
  const style = getStyleObject(node);
  const label =
    toStringValue(node.attributes.title) ||
    toStringValue(node.attributes["aria-label"]) ||
    getNodeText(node, context) ||
    "Continue";

  const href = toStringValue(node.attributes.href);

  return {
    id: createId("comp"),
    type: "BUTTON",
    order,
    props: {
      label,
      action: href ? "OPEN_URL" : "NEXT_SCREEN",
      url: href,
      style: {
        backgroundColor: toStringValue(style.backgroundColor) ?? "#111827",
        textColor: toStringValue(style.color) ?? "#FFFFFF",
        borderRadius: toNumber(style.borderRadius) ?? 14,
        borderColor: toStringValue(style.borderColor),
        borderWidth: toNumber(style.borderWidth),
      },
    },
  };
}

function mapInputComponent(node: JsxElementNode, order: number): FlowComponent {
  return {
    id: createId("comp"),
    type: "TEXT_INPUT",
    order,
    props: {
      placeholder: toStringValue(node.attributes.placeholder) ?? "Type here",
      label: toStringValue(node.attributes.label) ?? toStringValue(node.attributes["aria-label"]),
      fieldKey: inferFieldKey(node, order),
      required: node.attributes.required === true,
      keyboardType: "default",
    },
  };
}

function createFallbackComponent(
  label: string,
  order: number,
): FlowComponent {
  return {
    id: createId("comp"),
    type: "TEXT",
    order,
    layout: {
      locked: true,
    },
    props: {
      content: `[Imported fallback] ${label}`,
      fontSize: 13,
      fontWeight: "medium",
      color: "#92400E",
      opacity: 88,
    },
  };
}

function rootScreenStyle(node: JsxElementNode | null): ScreenStyle | undefined {
  if (!node) return undefined;
  const style = getStyleObject(node);

  const backgroundColor = toStringValue(style.backgroundColor);
  const padding = toNumber(style.padding);
  const paddingTop = toNumber(style.paddingTop);
  const paddingBottom = toNumber(style.paddingBottom);
  const paddingHorizontal = toNumber(style.paddingHorizontal);
  const justifyContent = toStringValue(style.justifyContent) as ScreenStyle["justifyContent"] | undefined;
  const alignItems = toStringValue(style.alignItems) as ScreenStyle["alignItems"] | undefined;

  if (
    backgroundColor === undefined &&
    padding === undefined &&
    paddingTop === undefined &&
    paddingBottom === undefined &&
    paddingHorizontal === undefined &&
    justifyContent === undefined &&
    alignItems === undefined
  ) {
    return undefined;
  }

  return {
    backgroundColor,
    padding,
    paddingTop,
    paddingBottom,
    paddingHorizontal,
    justifyContent,
    alignItems,
  };
}

function getRootArtboard(node: JsxElementNode | null) {
  if (!node) return undefined;
  const style = getStyleObject(node);
  const width = toNumber(style.width);
  const height = toNumber(style.height) ?? toNumber(style.minHeight);

  if (!width || !height) return undefined;

  return {
    width,
    height,
  };
}

function collectComponents(
  node: JsxNode,
  components: FlowComponent[],
  warnings: string[],
  unsupported: Set<string>,
  context: ImportParseContext,
): void {
  if (typeof node === "string") {
    if (node.trim()) {
      components.push({
        id: createId("comp"),
        type: "TEXT",
        order: components.length,
        props: {
          content: node.trim(),
          fontSize: 16,
          fontWeight: "normal",
          color: "#111827",
          textAlign: "left",
        },
      });
    }
    return;
  }

  if (node.type === "expression") {
    const mappedComponent = buildFeatureListFromExpression(node.code, components.length, context);
    if (mappedComponent) {
      components.push(mappedComponent);
      return;
    }

    const resolved = resolveExpression(node.code, context);
    if (isResolvedJsxValue(resolved)) {
      const parsedTree = parseJsx(normalizeJsx(resolved.jsx));
      for (const child of parsedTree.children) {
        collectComponents(child, components, warnings, unsupported, context);
      }
      return;
    }

    const resolvedText = resolvedValueToText(resolved).trim();
    if (resolvedText) {
      components.push({
        id: createId("comp"),
        type: "TEXT",
        order: components.length,
        props: {
          content: resolvedText,
          fontSize: 16,
          fontWeight: "normal",
          color: "#111827",
          textAlign: "left",
        },
      });
    }
    return;
  }

  if (isTextTag(node.name)) {
    const component = mapTextComponent(node, components.length, context);
    if (component) components.push(component);
    return;
  }

  if (isImageTag(node.name)) {
    const component = mapImageComponent(node, components.length);
    if (component) {
      components.push(component);
    } else {
      warnings.push(`Skipped ${node.name} because no image source could be resolved.`);
      components.push(createFallbackComponent(`Missing image source for <${node.name}>`, components.length));
    }
    return;
  }

  if (isButtonTag(node.name)) {
    components.push(mapButtonComponent(node, components.length, context));
    return;
  }

  if (isInputTag(node.name)) {
    components.push(mapInputComponent(node, components.length));
    return;
  }

  if (!isContainerTag(node.name) && !unsupported.has(node.name)) {
    unsupported.add(node.name);
    warnings.push(`Converted around unsupported tag <${node.name}> and kept any supported children it contained.`);
    components.push(createFallbackComponent(`Unsupported JSX tag <${node.name}>`, components.length));
  }

  for (const child of node.children) {
    collectComponents(child, components, warnings, unsupported, context);
  }
}

export function parseImportedCode(code: string, preferred?: ImportFramework | "auto"): ParsedCodeImport {
  const trimmedCode = code.trim();
  if (!trimmedCode) {
    throw new Error("Paste a React or React Native component before importing.");
  }

  const framework = detectFramework(trimmedCode, preferred);
  const componentName = detectComponentName(trimmedCode);
  const jsx = extractPrimaryJsx(trimmedCode);
  const context: ImportParseContext = {
    values: {
      ...extractLiteralConstants(trimmedCode),
      ...extractStateInitialValues(trimmedCode),
    },
    derivedExpressions: extractDerivedExpressions(trimmedCode),
  };

  if (!jsx) {
    throw new Error("I couldn't find JSX to import. Paste a component that returns JSX.");
  }

  const parsedTree = parseJsx(normalizeJsx(jsx));
  const rootElement = parsedTree.children.find(
    (child): child is JsxElementNode => typeof child !== "string" && child.type === "element",
  ) ?? null;
  const warnings: string[] = [];
  const components: FlowComponent[] = [];
  const unsupported = new Set<string>();
  const previewTree = parsedTree.children.flatMap((child) => buildImportedPreviewNodes(child, context));
  const artboard = getRootArtboard(rootElement);

  for (const child of parsedTree.children) {
    collectComponents(child, components, warnings, unsupported, context);
  }

  if (components.length === 0 && previewTree.length === 0) {
    throw new Error("No supported UI elements were found. Try Text, Image, Button, Pressable, TextInput, div, View, or similar JSX.");
  }

  return {
    framework,
    warnings,
    previewTree,
    artboard,
    screen: {
      id: createId("screen"),
      name: componentName ? prettifyName(componentName) : framework === "react-native" ? "Imported Native Screen" : "Imported React Screen",
      order: 0,
      style: rootScreenStyle(rootElement) ?? { backgroundColor: "#FFFFFF", padding: 24 },
      components,
    },
  };
}
