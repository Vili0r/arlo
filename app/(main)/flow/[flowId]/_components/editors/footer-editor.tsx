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

export function FooterEditor({
  component,
  onUpdateProp,
}: {
  component: FlowComponent;
  onUpdateProp: (key: string, value: unknown) => void;
}) {
  const p = component.props as Record<string, any>;
    return (
      <div>
        <div className="px-4 py-3 text-sm text-white/60 border-b border-white/[0.06]">
          The footer and any added children components will be fixed to the
          bottom.
        </div>

        <Divider />

        <PropRow label="Axis">
          <PropAxisToggle
            value={p.axis || "vertical"}
            onChange={(v) => onUpdateProp("axis", v)}
          />
        </PropRow>

        <PropRow label="Alignment">
          <PropAlignmentToggle
            value={p.alignment || "start"}
            onChange={(v) => onUpdateProp("alignment", v)}
          />
        </PropRow>

        <PropRow label="Distribution">
          <PropSelect
            value={p.distribution || "start"}
            onChange={(v) => onUpdateProp("distribution", v)}
            options={[
              { value: "start", label: "Start" },
              { value: "center", label: "Center" },
              { value: "end", label: "End" },
              { value: "space-between", label: "Space Between" },
              { value: "space-around", label: "Space Around" },
              { value: "space-evenly", label: "Space Evenly" },
            ]}
          />
        </PropRow>

        <PropRow label="Child spacing">
          <PropNumberUnit
            value={p.childSpacing ?? 0}
            onChange={(v) => onUpdateProp("childSpacing", v)}
            unit="px"
          />
        </PropRow>

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
                value={p.height || 200}
                onChange={(v) => onUpdateProp("height", v)}
                unit="px"
              />
            </PropRow>
          )}
        </Section>

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

        <CollapsibleSection title="Appearance">
          <PropRow label="Shape">
            <PropSelect
              value={p.shape || "rectangle"}
              onChange={(v) => onUpdateProp("shape", v)}
              options={[
                { value: "rectangle", label: "Rectangle" },
                { value: "circle", label: "Circle" },
                { value: "rounded", label: "Rounded" },
                { value: "pill", label: "Pill" },
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

        <CollapsibleSection title="Fill">
          <PropRow label="Background" fullWidth>
            <PropBackgroundTypeToggle
              value={p.backgroundType || "color"}
              onChange={(v) => onUpdateProp("backgroundType", v)}
            />
          </PropRow>
          {(p.backgroundType || "color") === "color" && (
            <PropRow label="Color" fullWidth>
              <PropColorInput
                value={p.backgroundColor || "#FFFFFF"}
                onChange={(v) => onUpdateProp("backgroundColor", v)}
                showOpacity
              />
            </PropRow>
          )}
          {p.backgroundType === "image" && (
            <>
              <PropFileUpload label="Image" accept="image/*" />
              <PropRow label="Image URL" fullWidth>
                <PropInput
                  value={p.backgroundImage || ""}
                  onChange={(v) => onUpdateProp("backgroundImage", v)}
                  placeholder="https://..."
                />
              </PropRow>
              <PropRow label="Fit">
                <PropSelect
                  value={p.backgroundFit || "cover"}
                  onChange={(v) => onUpdateProp("backgroundFit", v)}
                  options={[
                    { value: "cover", label: "Cover" },
                    { value: "contain", label: "Contain" },
                    { value: "fill", label: "Fill" },
                    { value: "fit", label: "Fit" },
                  ]}
                />
              </PropRow>
            </>
          )}
          {p.backgroundType === "video" && (
            <>
              <PropVideoUpload />
              <PropRow label="Video URL" fullWidth>
                <PropInput
                  value={p.backgroundVideo || ""}
                  onChange={(v) => onUpdateProp("backgroundVideo", v)}
                  placeholder="https://..."
                />
              </PropRow>
            </>
          )}
        </CollapsibleSection>

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
              value={p.borderWidth ?? 1}
              onChange={(v) => onUpdateProp("borderWidth", v)}
              unit="px"
            />
          </PropRow>
        </CollapsibleSection>

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
                  value={p.shadowY ?? -4}
                  onChange={(v) => onUpdateProp("shadowY", v)}
                  className="w-[60px]"
                />
              </div>
            </div>
          </PropRow>
          <PropRow label="Blur">
            <PropNumberUnit
              value={p.shadowBlur ?? 16}
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
