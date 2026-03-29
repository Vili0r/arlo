"use client";

import React from "react";
import {
  AlignCenter,
  AlignHorizontalJustifyCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  ChevronRight,
  Columns3,
  MoveDown,
  MoveUp,
  PanelBottom,
  PanelTop,
  Rows3,
  Trash2,
  X,
} from "lucide-react";

import type { FlowComponent, Screen } from "@/lib/types";
import { COLOR_MAP, COMPONENT_TYPES } from "../_lib/constants";
import type {
  EditorConstraints,
  EditorNodeTransform,
  EditorScreen,
} from "../_lib/editor-document";
import type {
  ComponentAnimation,
  ScreenTransitionConfig,
} from "../_lib/animation-presets";
import { AnimationPropertyEditor, ScreenTransitionEditor } from "./animation-property-editor";
import { ComponentPropertyEditor } from "./component-property-editor";
import { PropNumberUnit, PropRow, PropToggle, Section } from "./property-fields";

interface InspectorNode {
  id: string;
  component: FlowComponent;
  visible: boolean;
  locked: boolean;
  transform: EditorNodeTransform;
  constraints: EditorConstraints;
}

type SharedValue<T> =
  | { kind: "value"; value: T }
  | { kind: "mixed" };

function getSharedValue<T>(values: T[]): SharedValue<T> {
  if (values.length === 0) return { kind: "mixed" };
  const first = values[0];
  const same = values.every((value) => Object.is(value, first));
  return same ? { kind: "value", value: first } : { kind: "mixed" };
}

function getValueAtPath(source: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    return (value as Record<string, unknown>)[segment];
  }, source);
}

function resolveRadiusPath(component: FlowComponent) {
  const props = component.props as Record<string, unknown>;
  return props.style && typeof props.style === "object" ? "style.borderRadius" : "borderRadius";
}

function resolveRadiusValue(component: FlowComponent) {
  const props = component.props as Record<string, unknown>;
  const nested = getValueAtPath(props, "style.borderRadius");
  if (typeof nested === "number") return nested;
  return typeof props.borderRadius === "number" ? props.borderRadius : 0;
}

function resolveOpacityValue(component: FlowComponent) {
  const props = component.props as Record<string, unknown>;
  return typeof props.opacity === "number" ? props.opacity : 100;
}

function SectionCard({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
      <Section title={title} collapsible={collapsible} defaultOpen={defaultOpen}>
        {children}
      </Section>
    </div>
  );
}

function SegmentButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${
        active
          ? "bg-blue-500/18 text-blue-200 ring-1 ring-blue-400/35"
          : "text-white/38 hover:bg-white/[0.05] hover:text-white/70"
      }`}
    >
      {label}
    </button>
  );
}

function MixedBadge() {
  return (
    <span className="rounded-full border border-white/[0.08] bg-black/20 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-white/35">
      Mixed
    </span>
  );
}

export function PropertySheet({
  open,
  component,
  selectedNodes,
  currentScreen,
  screens,
  registryKeys,
  onClose,
  onDelete,
  onUpdateProp,
  onUpdateSelectionProps,
  onUpdateAnimation,
  onUpdateScreenStyle,
  onUpdateScreenLayoutMode,
  onUpdateScreenArtboard,
  onUpdateScreenTransition,
  onUpdateVisualNode,
  onUpdateSelectionVisualNodes,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onAlignSelection,
  onDistributeSelection,
  onMatchSelection,
}: {
  open: boolean;
  component: FlowComponent | null;
  selectedNodes: InspectorNode[];
  currentScreen: EditorScreen | null;
  screens?: Screen[];
  registryKeys?: { id: string; key: string; type: "SCREEN" | "COMPONENT"; description: string | null }[];
  onClose: () => void;
  onDelete?: () => void;
  onUpdateProp?: (key: string, value: unknown) => void;
  onUpdateSelectionProps?: (key: string, value: unknown) => void;
  onUpdateAnimation?: (anim: ComponentAnimation) => void;
  onUpdateScreenStyle?: (patch: Record<string, unknown>) => void;
  onUpdateScreenLayoutMode?: (layoutMode: "auto" | "absolute") => void;
  onUpdateScreenArtboard?: (patch: Partial<EditorScreen["artboard"]>) => void;
  onUpdateScreenTransition?: (transition: ScreenTransitionConfig) => void;
  onUpdateVisualNode?: (patch: {
    visible?: boolean;
    locked?: boolean;
    transform?: Partial<EditorNodeTransform>;
    constraints?: EditorConstraints;
  }) => void;
  onUpdateSelectionVisualNodes?: (patch: {
    visible?: boolean;
    locked?: boolean;
    transform?: Partial<EditorNodeTransform>;
    constraints?: EditorConstraints;
  }) => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onAlignSelection?: (mode: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  onDistributeSelection?: (axis: "horizontal" | "vertical") => void;
  onMatchSelection?: (dimension: "width" | "height") => void;
}) {
  const selectionCount = selectedNodes.length;
  const isSingle = selectionCount === 1;
  const isMulti = selectionCount > 1;
  const singleNode = isSingle ? selectedNodes[0] ?? null : null;
  const meta = component
    ? COMPONENT_TYPES.find((entry) => entry.type === component.type)
    : null;
  const colors = meta ? COLOR_MAP[meta.color] || COLOR_MAP.blue : COLOR_MAP.blue;

  const sharedVisible = getSharedValue(selectedNodes.map((node) => node.visible));
  const sharedLocked = getSharedValue(selectedNodes.map((node) => node.locked));
  const sharedOpacity = getSharedValue(
    selectedNodes.map((node) => resolveOpacityValue(node.component)),
  );
  const sharedRadius = getSharedValue(
    selectedNodes.map((node) => resolveRadiusValue(node.component)),
  );

  return (
    <div
      className={`absolute right-0 top-0 z-50 flex h-full shrink-0 flex-col overflow-hidden border-l border-white/[0.08] bg-[#0e0e10] shadow-[-8px_0_40px_rgba(0,0,0,0.5)] transition-all duration-200 ease-out ${
        open ? "w-[360px]" : "w-0"
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {meta ? (
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md shrink-0"
                style={{ backgroundColor: colors.bg || "rgba(255,255,255,0.06)" }}
              >
                <meta.icon size={12} style={{ color: colors.text || "#fff" }} />
              </div>
            ) : null}
            <span className="truncate text-[13px] font-semibold text-white">
              {isMulti
                ? `${selectionCount} Layers`
                : component
                  ? meta?.label || component.type
                  : currentScreen?.name || "Screen"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-white/38">
            {isMulti
              ? "Align, distribute, and edit shared values."
              : component
                ? "Transform, style, and fine-tune this layer."
                : "Edit the current artboard and screen transition."}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onDelete ? (
            <button
              onClick={onDelete}
              className="rounded-lg p-1.5 text-white/25 transition-colors hover:bg-red-500/10 hover:text-red-400"
              title="Delete selection"
            >
              <Trash2 size={13} />
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white"
            title="Close panel"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!isSingle && !isMulti ? (
          currentScreen ? (
            <div className="space-y-4">
              <SectionCard title="Screen">
                <PropRow label="Background">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={String(currentScreen.style?.backgroundColor || "#FFFFFF")}
                      onChange={(event) =>
                        onUpdateScreenStyle?.({ backgroundColor: event.target.value })
                      }
                      className="h-9 w-9 cursor-pointer rounded-lg border border-white/[0.08] bg-transparent"
                    />
                    <input
                      type="text"
                      value={String(currentScreen.style?.backgroundColor || "#FFFFFF")}
                      onChange={(event) =>
                        onUpdateScreenStyle?.({ backgroundColor: event.target.value })
                      }
                      className="w-[104px] rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none transition-colors focus:border-white/[0.16]"
                    />
                  </div>
                </PropRow>

                <PropRow label="Layout">
                  <div className="flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
                    <SegmentButton
                      active={currentScreen.layoutMode === "auto"}
                      label="Auto"
                      onClick={() => onUpdateScreenLayoutMode?.("auto")}
                    />
                    <SegmentButton
                      active={currentScreen.layoutMode === "absolute"}
                      label="Absolute"
                      onClick={() => onUpdateScreenLayoutMode?.("absolute")}
                    />
                  </div>
                </PropRow>

                <div className="grid grid-cols-2 gap-2">
                  <PropRow label="Width">
                    <PropNumberUnit
                      value={currentScreen.artboard.width}
                      onChange={(value) => onUpdateScreenArtboard?.({ width: value })}
                      min={280}
                      className="w-full"
                    />
                  </PropRow>
                  <PropRow label="Height">
                    <PropNumberUnit
                      value={currentScreen.artboard.height}
                      onChange={(value) => onUpdateScreenArtboard?.({ height: value })}
                      min={480}
                      className="w-full"
                    />
                  </PropRow>
                </div>
              </SectionCard>

              <SectionCard title="Animation">
                <ScreenTransitionEditor
                  transition={currentScreen.animation as ScreenTransitionConfig | undefined}
                  onUpdate={(transition) => onUpdateScreenTransition?.(transition)}
                />
              </SectionCard>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
                <ChevronRight size={16} className="text-white/15" />
              </div>
              <p className="text-xs text-white/30">Select a screen or layer to edit</p>
            </div>
          )
        ) : null}

        {isSingle && singleNode && component ? (
          <div className="space-y-4">
            <SectionCard title="Transform">
              <div className="grid grid-cols-2 gap-2">
                <PropRow label="X">
                  <PropNumberUnit
                    value={singleNode.transform.x}
                    onChange={(value) => onUpdateVisualNode?.({ transform: { x: value } })}
                    className="w-full"
                  />
                </PropRow>
                <PropRow label="Y">
                  <PropNumberUnit
                    value={singleNode.transform.y}
                    onChange={(value) => onUpdateVisualNode?.({ transform: { y: value } })}
                    className="w-full"
                  />
                </PropRow>
                <PropRow label="W">
                  <PropNumberUnit
                    value={singleNode.transform.width ?? 0}
                    onChange={(value) => onUpdateVisualNode?.({ transform: { width: value } })}
                    min={20}
                    className="w-full"
                  />
                </PropRow>
                <PropRow label="H">
                  <PropNumberUnit
                    value={singleNode.transform.height ?? 0}
                    onChange={(value) => onUpdateVisualNode?.({ transform: { height: value } })}
                    min={20}
                    className="w-full"
                  />
                </PropRow>
              </div>

              <PropRow label="Rotation">
                <PropNumberUnit
                  value={Math.round(singleNode.transform.rotation)}
                  onChange={(value) => onUpdateVisualNode?.({ transform: { rotation: value } })}
                  unit="deg"
                  className="w-[132px]"
                />
              </PropRow>

              <div className="space-y-2">
                <PropToggle
                  value={singleNode.visible}
                  onChange={(value) => onUpdateVisualNode?.({ visible: value })}
                  label="Visible"
                />
                <PropToggle
                  value={singleNode.locked}
                  onChange={(value) => onUpdateVisualNode?.({ locked: value })}
                  label="Locked"
                />
              </div>
            </SectionCard>

            <SectionCard title="Constraints">
              <PropRow label="Horizontal" fullWidth>
                <div className="grid grid-cols-4 gap-1">
                  {(["min", "center", "stretch", "max"] as const).map((value) => (
                    <SegmentButton
                      key={value}
                      active={singleNode.constraints.horizontal === value}
                      label={value}
                      onClick={() =>
                        onUpdateVisualNode?.({
                          constraints: {
                            ...singleNode.constraints,
                            horizontal: value,
                          },
                        })
                      }
                    />
                  ))}
                </div>
              </PropRow>

              <PropRow label="Vertical" fullWidth>
                <div className="grid grid-cols-4 gap-1">
                  {(["min", "center", "stretch", "max"] as const).map((value) => (
                    <SegmentButton
                      key={value}
                      active={singleNode.constraints.vertical === value}
                      label={value}
                      onClick={() =>
                        onUpdateVisualNode?.({
                          constraints: {
                            ...singleNode.constraints,
                            vertical: value,
                          },
                        })
                      }
                    />
                  ))}
                </div>
              </PropRow>

              <PropToggle
                value={Boolean(singleNode.constraints.keepAspectRatio)}
                onChange={(value) =>
                  onUpdateVisualNode?.({
                    constraints: {
                      ...singleNode.constraints,
                      keepAspectRatio: value,
                    },
                  })
                }
                label="Keep aspect ratio"
              />
            </SectionCard>

            <SectionCard title="Style">
              <PropRow label="Opacity">
                <PropNumberUnit
                  value={resolveOpacityValue(component)}
                  onChange={(value) => onUpdateProp?.("opacity", value)}
                  unit="%"
                  min={0}
                  max={100}
                  className="w-[132px]"
                />
              </PropRow>

              <PropRow label="Radius">
                <PropNumberUnit
                  value={resolveRadiusValue(component)}
                  onChange={(value) => onUpdateProp?.(resolveRadiusPath(component), value)}
                  min={0}
                  className="w-[132px]"
                />
              </PropRow>

              <div className="grid grid-cols-2 gap-2">
                <PropRow label="Shadow X">
                  <PropNumberUnit
                    value={Number((component.props as Record<string, unknown>).shadowX ?? 0)}
                    onChange={(value) => onUpdateProp?.("shadowX", value)}
                    className="w-full"
                  />
                </PropRow>
                <PropRow label="Shadow Y">
                  <PropNumberUnit
                    value={Number((component.props as Record<string, unknown>).shadowY ?? 0)}
                    onChange={(value) => onUpdateProp?.("shadowY", value)}
                    className="w-full"
                  />
                </PropRow>
                <PropRow label="Blur">
                  <PropNumberUnit
                    value={Number((component.props as Record<string, unknown>).shadowBlur ?? 0)}
                    onChange={(value) => onUpdateProp?.("shadowBlur", value)}
                    className="w-full"
                  />
                </PropRow>
                <PropRow label="Padding">
                  <PropNumberUnit
                    value={Number((component.props as Record<string, unknown>).paddingVertical ?? 0)}
                    onChange={(value) => onUpdateProp?.("paddingVertical", value)}
                    className="w-full"
                  />
                </PropRow>
              </div>
            </SectionCard>

            <SectionCard title="Layer Order">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={onBringForward}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <MoveUp size={12} />
                  Forward
                </button>
                <button
                  onClick={onSendBackward}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <MoveDown size={12} />
                  Backward
                </button>
                <button
                  onClick={onBringToFront}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <PanelTop size={12} />
                  Front
                </button>
                <button
                  onClick={onSendToBack}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <PanelBottom size={12} />
                  Back
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Component" collapsible defaultOpen>
              <ComponentPropertyEditor
                component={component}
                onUpdateProp={(key, value) => onUpdateProp?.(key, value)}
                screens={screens}
                registryKeys={registryKeys}
              />
            </SectionCard>

            <SectionCard title="Animation" collapsible defaultOpen>
              <AnimationPropertyEditor
                animation={component.animation}
                onUpdate={(animation) => onUpdateAnimation?.(animation)}
                componentId={component.id}
              />
            </SectionCard>
          </div>
        ) : null}

        {isMulti ? (
          <div className="space-y-4">
            <SectionCard title="Arrange">
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onAlignSelection?.("left")}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <AlignLeft size={12} />
                  Left
                </button>
                <button
                  onClick={() => onAlignSelection?.("center")}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <AlignCenter size={12} />
                  Center
                </button>
                <button
                  onClick={() => onAlignSelection?.("right")}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <AlignRight size={12} />
                  Right
                </button>
                <button
                  onClick={() => onAlignSelection?.("top")}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <Rows3 size={12} />
                  Top
                </button>
                <button
                  onClick={() => onAlignSelection?.("middle")}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <AlignVerticalJustifyCenter size={12} />
                  Middle
                </button>
                <button
                  onClick={() => onAlignSelection?.("bottom")}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <Columns3 size={12} />
                  Bottom
                </button>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onDistributeSelection?.("horizontal")}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <AlignHorizontalJustifyCenter size={12} />
                  Distribute H
                </button>
                <button
                  onClick={() => onDistributeSelection?.("vertical")}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <AlignJustify size={12} />
                  Distribute V
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Match Size">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onMatchSelection?.("width")}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  Match width
                </button>
                <button
                  onClick={() => onMatchSelection?.("height")}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-[11px] text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  Match height
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Shared">
              <PropRow label="Visible">
                <div className="flex items-center gap-2">
                  {sharedVisible.kind === "mixed" ? <MixedBadge /> : null}
                  <PropToggle
                    value={sharedVisible.kind === "value" ? sharedVisible.value : true}
                    onChange={(value) => onUpdateSelectionVisualNodes?.({ visible: value })}
                    label=""
                  />
                </div>
              </PropRow>

              <PropRow label="Locked">
                <div className="flex items-center gap-2">
                  {sharedLocked.kind === "mixed" ? <MixedBadge /> : null}
                  <PropToggle
                    value={sharedLocked.kind === "value" ? sharedLocked.value : false}
                    onChange={(value) => onUpdateSelectionVisualNodes?.({ locked: value })}
                    label=""
                  />
                </div>
              </PropRow>

              <PropRow label="Opacity">
                <div className="flex items-center gap-2">
                  {sharedOpacity.kind === "mixed" ? <MixedBadge /> : null}
                  <PropNumberUnit
                    value={sharedOpacity.kind === "value" ? sharedOpacity.value : 100}
                    onChange={(value) => onUpdateSelectionProps?.("opacity", value)}
                    unit="%"
                    min={0}
                    max={100}
                    className="w-[132px]"
                  />
                </div>
              </PropRow>

              <PropRow label="Radius">
                <div className="flex items-center gap-2">
                  {sharedRadius.kind === "mixed" ? <MixedBadge /> : null}
                  <PropNumberUnit
                    value={sharedRadius.kind === "value" ? sharedRadius.value : 0}
                    onChange={(value) => {
                      const firstComponent = selectedNodes[0]?.component;
                      if (!firstComponent) return;
                      onUpdateSelectionProps?.(resolveRadiusPath(firstComponent), value);
                    }}
                    min={0}
                    className="w-[132px]"
                  />
                </div>
              </PropRow>
            </SectionCard>
          </div>
        ) : null}
      </div>
    </div>
  );
}
