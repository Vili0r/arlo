"use client";

import React, { useRef, useState, useEffect } from "react";
import { icons, Smile } from "lucide-react";
import type { ImportedPreviewNode } from "../_lib/code-import";
import { resolveImportedPreviewClassName } from "../_lib/imported-code-preview-styles";

type PreviewIconComponent = React.ComponentType<{
  size?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
}>;

function toStyleRecord(
  value: Record<string, unknown> | undefined,
): React.CSSProperties {
  if (!value) return {};
  return value as React.CSSProperties;
}

function baseElementStyle(tagName: string): React.CSSProperties {
  if (["div", "span", "section", "main", "article", "header", "footer"].includes(tagName)) {
    return { boxSizing: "border-box" };
  }

  if (["p", "h1", "h2", "h3", "h4", "h5", "h6", "label"].includes(tagName)) {
    return { boxSizing: "border-box", margin: 0 };
  }

  if (tagName === "button") {
    return {
      boxSizing: "border-box",
      appearance: "none",
      border: "none",
      background: "transparent",
      padding: 0,
      margin: 0,
      font: "inherit",
      color: "inherit",
      textAlign: "inherit",
    };
  }

  if (tagName === "img") {
    return { boxSizing: "border-box", display: "block", maxWidth: "100%" };
  }

  return { boxSizing: "border-box" };
}

function renderPreviewNode(
  node: ImportedPreviewNode,
  key: React.Key,
): React.ReactNode {
  if (node.kind === "text") {
    return <React.Fragment key={key}>{node.text}</React.Fragment>;
  }

  if (node.kind === "icon") {
    const classStyle = resolveImportedPreviewClassName(node.className);
    const iconStyle = classStyle.style as React.CSSProperties;
    const LucideIcon = (icons as Record<string, PreviewIconComponent>)[node.name] || Smile;
    const size =
      node.size ||
      (typeof iconStyle.width === "number" ? iconStyle.width : undefined) ||
      (typeof iconStyle.height === "number" ? iconStyle.height : undefined) ||
      24;

    return (
      <LucideIcon
        key={key}
        size={size}
        strokeWidth={node.strokeWidth}
        style={{
          color: node.color || iconStyle.color || "#111827",
          width: iconStyle.width,
          height: iconStyle.height,
          flexShrink: iconStyle.flexShrink,
        }}
      />
    );
  }

  if (node.tagName === "br") {
    return <br key={key} />;
  }

  const classStyle = resolveImportedPreviewClassName(node.className);
  const mergedStyle: React.CSSProperties = {
    ...baseElementStyle(node.tagName),
    ...classStyle.style,
    ...toStyleRecord(node.style),
  };

  if (classStyle.childGapY !== undefined) {
    if (!mergedStyle.display) mergedStyle.display = "flex";
    if (!mergedStyle.flexDirection) mergedStyle.flexDirection = "column";
    if (mergedStyle.gap === undefined) mergedStyle.gap = classStyle.childGapY;
  }

  if (node.tagName === "img") {
    const src = typeof node.attributes?.src === "string" ? node.attributes.src : undefined;
    if (!src) return null;

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={key}
        src={src}
        alt={typeof node.attributes?.alt === "string" ? node.attributes.alt : ""}
        style={mergedStyle}
      />
    );
  }

  const Tag = node.tagName === "button" ? "div" : node.tagName;
  const children = node.children.map((child, index) =>
    renderPreviewNode(child, `${String(key)}-${index}`),
  );

  return React.createElement(
    Tag,
    {
      key,
      style: mergedStyle,
    },
    children,
  );
}

function getRootPixelWidth(nodes: ImportedPreviewNode[]): number | null {
  const root = nodes[0];
  if (!root || root.kind !== "element") return null;
  const w = root.style?.width;
  return typeof w === "number" && w > 0 ? w : null;
}

function getRootPixelHeight(nodes: ImportedPreviewNode[]): number | null {
  const root = nodes[0];
  if (!root || root.kind !== "element") return null;
  const h = root.style?.minHeight ?? root.style?.height;
  return typeof h === "number" && h > 0 ? h : null;
}

export function ImportedCodePreview({
  nodes,
}: {
  nodes: ImportedPreviewNode[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const designWidth = getRootPixelWidth(nodes);
  const designHeight = getRootPixelHeight(nodes);

  useEffect(() => {
    if (!designWidth) return;

    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw === 0 || ch === 0) return;

      const s = cw / designWidth;
      setScale(s);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, [designWidth]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          transformOrigin: "top center",
          transform: designWidth ? `scale(${scale})` : undefined,
        }}
      >
        {nodes.map((node, index) => renderPreviewNode(node, index))}
      </div>
    </div>
  );
}
