"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import type { FlowComponent } from "@/lib/types";

const FONT_FAMILY_MAP: Record<string, string> = {
  system:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", Menlo, monospace',
  rounded:
    '"SF Pro Rounded", "Nunito", -apple-system, BlinkMacSystemFont, sans-serif',
};

function getSpacing(
  props: Record<string, unknown>,
  prefix: "padding" | "margin",
): { top: number; right: number; bottom: number; left: number } {
  if (
    props[`${prefix}Top`] !== undefined ||
    props[`${prefix}Right`] !== undefined ||
    props[`${prefix}Bottom`] !== undefined ||
    props[`${prefix}Left`] !== undefined
  ) {
    return {
      top: Number(props[`${prefix}Top`] ?? 0),
      right: Number(props[`${prefix}Right`] ?? 0),
      bottom: Number(props[`${prefix}Bottom`] ?? 0),
      left: Number(props[`${prefix}Left`] ?? 0),
    };
  }

  const vertical = Number(props[`${prefix}Vertical`] ?? 0);
  const horizontal = Number(props[`${prefix}Horizontal`] ?? 0);

  return {
    top: vertical,
    right: horizontal,
    bottom: vertical,
    left: horizontal,
  };
}

function getBoxShadow(props: Record<string, unknown>) {
  const x = Number(props.shadowX ?? 0);
  const y = Number(props.shadowY ?? 0);
  const blur = Number(props.shadowBlur ?? 0);
  const color = String(props.shadowColor || "rgba(0,0,0,0.2)");

  if (x === 0 && y === 0 && blur === 0) return undefined;
  return `${x}px ${y}px ${blur}px ${color}`;
}

function getTextContent(element: HTMLElement) {
  return element.innerText.replace(/\u00A0/g, " ").replace(/\r/g, "");
}

export function InlineTextEditor({
  component,
  onCommit,
  onCancel,
}: {
  component: FlowComponent;
  onCommit: (nextValue: string) => void;
  onCancel: () => void;
}) {
  const props = component.props as Record<string, unknown>;
  const [value, setValue] = useState(String(props.content ?? ""));
  const editorRef = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef(false);

  const outerSpacing = useMemo(() => getSpacing(props, "margin"), [props]);
  const innerSpacing = useMemo(() => getSpacing(props, "padding"), [props]);
  const fontFamily = FONT_FAMILY_MAP[String(props.fontFamily || "system")] || FONT_FAMILY_MAP.system;
  const lineHeight =
    props.lineHeight && Number(props.lineHeight) > 0
      ? `${Number(props.lineHeight)}px`
      : undefined;
  const letterSpacing =
    props.letterSpacing && Number(props.letterSpacing) !== 0
      ? `${Number(props.letterSpacing)}px`
      : undefined;

  useEffect(() => {
    const element = editorRef.current;
    if (!element) return;

    element.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  return (
    <div
      style={{
        marginTop: outerSpacing.top || undefined,
        marginRight: outerSpacing.right || undefined,
        marginBottom: outerSpacing.bottom || undefined,
        marginLeft: outerSpacing.left || undefined,
        width: "100%",
        height: "100%",
      }}
      className="rounded-xl ring-2 ring-blue-500 ring-offset-2 ring-offset-white"
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor:
            props.backgroundColor && props.backgroundColor !== "transparent"
              ? String(props.backgroundColor)
              : undefined,
          borderRadius: Number(props.borderRadius ?? 0) || undefined,
          border:
            Number(props.borderWidth ?? 0) > 0
              ? `${Number(props.borderWidth)}px solid ${String(props.borderColor || "#000000")}`
              : undefined,
          boxShadow: getBoxShadow(props),
          opacity:
            props.opacity !== undefined && Number(props.opacity) !== 100
              ? Number(props.opacity) / 100
              : undefined,
          overflow: Number(props.borderRadius ?? 0) > 0 ? "hidden" : undefined,
        }}
      >
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(event) => setValue(getTextContent(event.currentTarget))}
          onBlur={() => {
            if (cancelledRef.current) {
              cancelledRef.current = false;
              return;
            }
            onCommit(value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onCommit(getTextContent(event.currentTarget));
            }

            if (event.key === "Escape") {
              event.preventDefault();
              cancelledRef.current = true;
              onCancel();
            }
          }}
          style={{
            width: "100%",
            height: "100%",
            minHeight: "100%",
            paddingTop: innerSpacing.top,
            paddingRight: innerSpacing.right,
            paddingBottom: innerSpacing.bottom,
            paddingLeft: innerSpacing.left,
            fontSize: Number(props.fontSize ?? 16),
            fontWeight: String(props.fontWeight || "normal"),
            fontFamily,
            color: String(props.color || "#1A1A1A"),
            textAlign: (props.textAlign as React.CSSProperties["textAlign"]) || "left",
            lineHeight,
            letterSpacing,
            outline: "none",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
