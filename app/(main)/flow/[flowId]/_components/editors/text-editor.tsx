import React from "react";
import type { FlowComponent } from "@/lib/types";
import {
  Divider,
  Section,
  PropRow,
  PropInput,
  PropNumberUnit,
  PropSelect,
  PropColorInput,
  PropCheckbox,
  PropToggle,
  PropAlignmentToggle,
  PropTextarea,
  PropFileUpload,
  PropVideoUpload,
  PropSpacingInput,
  PropIconCombobox,
  AddVariableLink,
  CollapsibleSection,
  PropField,
  SectionLabel,
} from "../property-fields";
import { icons, X, Plus } from "lucide-react";
import { getSpacingValues, makeSpacingOnChange, PropAxisToggle, PropBackgroundTypeToggle, PropPositionGrid } from "./shared";

export function TextEditor({
  component,
  onUpdateProp,
}: {
  component: FlowComponent;
  onUpdateProp: (key: string, value: unknown) => void;
}) {
  const p = component.props as Record<string, any>;
    return (
      <div>
        {/* Text content */}
        <PropRow label="Text" fullWidth>
          <PropTextarea
            value={p.content || ""}
            onChange={(v) => onUpdateProp("content", v)}
            rows={2}
            showToolbar
          />
          <AddVariableLink />
        </PropRow>

        {/* Alignment */}
        <PropRow label="Alignment">
          <PropAlignmentToggle
            value={p.textAlign || "left"}
            onChange={(v) => onUpdateProp("textAlign", v)}
          />
        </PropRow>

        {/* Font family */}
        <PropRow label="Font family">
          <PropSelect
            value={p.fontFamily || "system"}
            onChange={(v) => onUpdateProp("fontFamily", v)}
            options={[
              { value: "system", label: "System Font" },
              { value: "serif", label: "Serif" },
              { value: "mono", label: "Monospace" },
              { value: "rounded", label: "Rounded" },
            ]}
          />
        </PropRow>

        {/* Font weight */}
        <PropRow label="Font weight">
          <PropSelect
            value={p.fontWeight || "normal"}
            onChange={(v) => onUpdateProp("fontWeight", v)}
            options={[
              { value: "normal", label: "Regular" },
              { value: "500", label: "Medium" },
              { value: "600", label: "Semibold" },
              { value: "bold", label: "Bold" },
              { value: "800", label: "Extra Bold" },
            ]}
          />
        </PropRow>

        {/* Font size */}
        <PropRow label="Font size">
          <PropNumberUnit
            value={p.fontSize || 14}
            onChange={(v) => onUpdateProp("fontSize", v)}
            unit=""
            className="w-[80px]"
          />
        </PropRow>

        {/* Line height */}
        <PropRow label="Line height">
          <PropNumberUnit
            value={p.lineHeight ?? 0}
            onChange={(v) => onUpdateProp("lineHeight", v)}
            unit=""
            className="w-[80px]"
          />
        </PropRow>

        {/* Letter spacing */}
        <PropRow label="Letter spacing">
          <PropNumberUnit
            value={p.letterSpacing ?? 0}
            onChange={(v) => onUpdateProp("letterSpacing", v)}
            unit=""
            className="w-[80px]"
          />
        </PropRow>

        <Divider />

        {/* Color */}
        <PropRow label="Color" fullWidth>
          <PropColorInput
            value={p.color || "#000000"}
            onChange={(v) => onUpdateProp("color", v)}
            showOpacity
          />
        </PropRow>

        {/* Background */}
        <PropRow label="Background" fullWidth>
          <PropColorInput
            value={p.backgroundColor || "transparent"}
            onChange={(v) => onUpdateProp("backgroundColor", v)}
          />
        </PropRow>

        {/* ── Size ── */}
        <Section title="Size">
          <PropRow label="Width">
            <PropSelect
              value={p.widthMode || "fill"}
              onChange={(v) => onUpdateProp("widthMode", v)}
              options={[
                { value: "fit", label: "Fit" },
                { value: "fill", label: "Fill" },
                { value: "fixed", label: "Fixed" },
              ]}
            />
          </PropRow>
          {p.widthMode === "fixed" && (
            <PropRow label="">
              <PropNumberUnit
                value={p.fixedWidth || 200}
                onChange={(v) => onUpdateProp("fixedWidth", v)}
                unit="px"
              />
            </PropRow>
          )}
          <PropRow label="Height">
            <PropSelect
              value={p.heightMode || "fit"}
              onChange={(v) => onUpdateProp("heightMode", v)}
              options={[
                { value: "fit", label: "Fit" },
                { value: "fill", label: "Fill" },
                { value: "fixed", label: "Fixed" },
              ]}
            />
          </PropRow>
          {p.heightMode === "fixed" && (
            <PropRow label="">
              <PropNumberUnit
                value={p.fixedHeight || 100}
                onChange={(v) => onUpdateProp("fixedHeight", v)}
                unit="px"
              />
            </PropRow>
          )}
        </Section>

        {/* ── Layout (padding + margin with linked/individual toggle) ── */}
        <Section title="Layout">
          <PropSpacingInput
            label="Padding"
            values={getSpacingValues(p, "padding")}
            onChange={makeSpacingOnChange(onUpdateProp, "padding")}
          />
          <PropSpacingInput
            label="Margin"
            values={getSpacingValues(p, "margin")}
            onChange={makeSpacingOnChange(onUpdateProp, "margin")}
          />
        </Section>

        {/* ── Appearance ── */}
        <CollapsibleSection title="Appearance">
          <PropRow label="Corner radius">
            <PropNumberUnit
              value={p.borderRadius ?? 0}
              onChange={(v) => onUpdateProp("borderRadius", v)}
              unit="px"
            />
          </PropRow>
          <PropRow label="Opacity">
            <PropNumberUnit
              value={p.opacity ?? 100}
              onChange={(v) => onUpdateProp("opacity", v)}
              unit="%"
              min={0}
              max={100}
              className="w-[80px]"
            />
          </PropRow>
        </CollapsibleSection>

        {/* ── Border ── */}
        <CollapsibleSection title="Border">
          <PropRow label="Border color" fullWidth>
            <PropColorInput
              value={p.borderColor || "#000000"}
              onChange={(v) => onUpdateProp("borderColor", v)}
              showOpacity
            />
          </PropRow>
          <PropRow label="Border width">
            <PropNumberUnit
              value={p.borderWidth ?? 0}
              onChange={(v) => onUpdateProp("borderWidth", v)}
              unit="px"
            />
          </PropRow>
        </CollapsibleSection>

        {/* ── Drop Shadow ── */}
        <CollapsibleSection title="Drop Shadow">
          <PropRow label="Position">
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-white/40">X</span>
                <PropNumberUnit
                  value={p.shadowX ?? 0}
                  onChange={(v) => onUpdateProp("shadowX", v)}
                  className="w-[60px]"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-white/40">Y</span>
                <PropNumberUnit
                  value={p.shadowY ?? 0}
                  onChange={(v) => onUpdateProp("shadowY", v)}
                  className="w-[60px]"
                />
              </div>
            </div>
          </PropRow>
          <PropRow label="Blur">
            <PropNumberUnit
              value={p.shadowBlur ?? 0}
              onChange={(v) => onUpdateProp("shadowBlur", v)}
              unit="px"
            />
          </PropRow>
          <PropRow label="Color" fullWidth>
            <PropColorInput
              value={p.shadowColor || "#000000"}
              onChange={(v) => onUpdateProp("shadowColor", v)}
              showOpacity
            />
          </PropRow>
        </CollapsibleSection>
      </div>
    );
}
