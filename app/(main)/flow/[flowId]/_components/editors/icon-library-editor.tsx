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

export function IconLibraryEditor({
  component,
  onUpdateProp,
}: {
  component: FlowComponent;
  onUpdateProp: (key: string, value: unknown) => void;
}) {
  const p = component.props as Record<string, any>;
    return (
      <div>
        {/* Icon picker — searchable combobox */}
        <PropRow label="Type" fullWidth>
          <PropIconCombobox
            value={p.iconName || ""}
            onChange={(v) => onUpdateProp("iconName", v)}
            icons={icons}
          />
        </PropRow>

        {/* Icon color */}
        <PropRow label="Color" fullWidth>
          <PropColorInput
            value={p.color || "#000000"}
            onChange={(v) => onUpdateProp("color", v)}
            showOpacity
          />
        </PropRow>

        {/* ── Size ── */}
        <Section title="Size">
          <PropRow label="Width">
            <PropNumberUnit
              value={p.width || 24}
              onChange={(v) => onUpdateProp("width", v)}
              unit="px"
            />
          </PropRow>
          <PropRow label="Height">
            <PropNumberUnit
              value={p.height || 24}
              onChange={(v) => onUpdateProp("height", v)}
              unit="px"
            />
          </PropRow>
        </Section>

        {/* ── Layout ── */}
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

        {/* ── Icon Background ── */}
        <CollapsibleSection title="Icon background">
          <PropRow label="Background" fullWidth>
            <PropColorInput
              value={p.backgroundColor || "#FFFFFF"}
              onChange={(v) => onUpdateProp("backgroundColor", v)}
              showOpacity
            />
          </PropRow>
          <PropRow label="Shape">
            <PropSelect
              value={p.bgShape || "rectangle"}
              onChange={(v) => onUpdateProp("bgShape", v)}
              options={[
                { value: "rectangle", label: "Rectangle" },
                { value: "circle", label: "Circle" },
                { value: "rounded", label: "Rounded" },
              ]}
            />
          </PropRow>
          <PropRow label="Corner radius">
            <PropNumberUnit
              value={p.borderRadius ?? 0}
              onChange={(v) => onUpdateProp("borderRadius", v)}
              unit="px"
            />
          </PropRow>
        </CollapsibleSection>

        {/* ── Border ── */}
        <CollapsibleSection title="Border">
          <PropRow label="Width">
            <PropNumberUnit
              value={p.borderWidth ?? 0}
              onChange={(v) => onUpdateProp("borderWidth", v)}
              unit="px"
            />
          </PropRow>
          <PropRow label="Color" fullWidth>
            <PropColorInput
              value={p.borderColor || "#000000"}
              onChange={(v) => onUpdateProp("borderColor", v)}
              showOpacity
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
                  value={p.shadowY ?? 2}
                  onChange={(v) => onUpdateProp("shadowY", v)}
                  className="w-[60px]"
                />
              </div>
            </div>
          </PropRow>
          <PropRow label="Blur">
            <PropNumberUnit
              value={p.shadowBlur ?? 6}
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
