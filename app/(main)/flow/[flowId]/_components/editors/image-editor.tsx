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

export function ImageEditor({
  component,
  onUpdateProp,
}: {
  component: FlowComponent;
  onUpdateProp: (key: string, value: unknown) => void;
}) {
  const p = component.props as Record<string, any>;
    const handleImageUpload = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) onUpdateProp("src", dataUrl);
      };
      reader.readAsDataURL(file);
    };

    return (
      <div>
        {/* File upload with preview */}
        <PropFileUpload
          label="Image"
          accept="image/*"
          preview={p.src || undefined}
          onUpload={handleImageUpload}
          onRemove={() => onUpdateProp("src", "")}
        />

        {/* Or URL fallback */}
        <PropRow label="Image URL" fullWidth>
          <PropInput
            value={p.src || ""}
            onChange={(v) => onUpdateProp("src", v)}
            placeholder="https://..."
          />
        </PropRow>

        <Divider />

        {/* Fit mode */}
        <PropRow label="Fit mode">
          <PropSelect
            value={p.fitMode || "fit"}
            onChange={(v) => onUpdateProp("fitMode", v)}
            options={[
              { value: "fit", label: "Fit" },
              { value: "fill", label: "Fill" },
              { value: "cover", label: "Cover" },
              { value: "contain", label: "Contain" },
            ]}
          />
        </PropRow>

        {/* ── Size ── */}
        <Section title="Size">
          <PropRow label="Width">
            <PropSelect
              value={p.widthMode || "fill"}
              onChange={(v) => onUpdateProp("widthMode", v)}
              options={[
                { value: "fill", label: "Fill" },
                { value: "fit", label: "Fit" },
                { value: "fixed", label: "Fixed" },
              ]}
            />
          </PropRow>
          {p.widthMode === "fixed" && (
            <PropRow label="">
              <PropNumberUnit
                value={p.width || 300}
                onChange={(v) => onUpdateProp("width", v)}
                unit="px"
              />
            </PropRow>
          )}
          <PropRow label="Height">
            <PropSelect
              value={p.heightMode || "fixed"}
              onChange={(v) => onUpdateProp("heightMode", v)}
              options={[
                { value: "fit", label: "Fit" },
                { value: "fill", label: "Fill" },
                { value: "fixed", label: "Fixed" },
              ]}
            />
          </PropRow>
          {(p.heightMode === "fixed" || !p.heightMode) && (
            <PropRow label="">
              <PropNumberUnit
                value={p.height || 200}
                onChange={(v) => onUpdateProp("height", v)}
                unit="px"
              />
            </PropRow>
          )}
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

        {/* ── Mask ── */}
        <Section title="Mask">
          <PropRow label="Mask shape">
            <PropSelect
              value={p.maskShape || "rectangle"}
              onChange={(v) => onUpdateProp("maskShape", v)}
              options={[
                { value: "rectangle", label: "Rectangle" },
                { value: "circle", label: "Circle" },
                { value: "rounded", label: "Rounded" },
              ]}
            />
          </PropRow>
          <PropRow label="Corner radius">
            <PropNumberUnit
              value={p.borderRadius || 0}
              onChange={(v) => onUpdateProp("borderRadius", v)}
              unit="px"
            />
          </PropRow>
        </Section>

        {/* ── Overlay ── */}
        <CollapsibleSection title="Overlay">
          <PropRow label="Color" fullWidth>
            <PropColorInput
              value={p.overlayColor || "#000000"}
              onChange={(v) => onUpdateProp("overlayColor", v)}
              showOpacity
            />
          </PropRow>
          <PropRow label="Opacity">
            <PropNumberUnit
              value={p.overlayOpacity ?? 0}
              onChange={(v) => onUpdateProp("overlayOpacity", v)}
              unit="%"
              min={0}
              max={100}
              className="w-[80px]"
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
