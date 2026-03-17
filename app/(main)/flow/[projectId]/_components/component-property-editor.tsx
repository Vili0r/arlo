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
} from "./property-fields";
import type { SpacingValues } from "./property-fields";
import { icons, X, Plus } from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Helper: read spacing values from props (supports both old
   vertical/horizontal format and new top/right/bottom/left)
   ──────────────────────────────────────────────────────────── */
function getSpacingValues(
  p: Record<string, any>,
  prefix: "padding" | "margin"
): SpacingValues {
  // New individual format takes priority
  if (
    p[`${prefix}Top`] !== undefined ||
    p[`${prefix}Right`] !== undefined ||
    p[`${prefix}Bottom`] !== undefined ||
    p[`${prefix}Left`] !== undefined
  ) {
    return {
      top: p[`${prefix}Top`] ?? 0,
      right: p[`${prefix}Right`] ?? 0,
      bottom: p[`${prefix}Bottom`] ?? 0,
      left: p[`${prefix}Left`] ?? 0,
    };
  }
  // Fall back to old vertical/horizontal format
  const v = p[`${prefix}Vertical`] ?? 0;
  const h = p[`${prefix}Horizontal`] ?? 0;
  return { top: v, right: h, bottom: v, left: h };
}

function makeSpacingOnChange(
  onUpdateProp: (key: string, value: unknown) => void,
  prefix: "padding" | "margin"
) {
  return (vals: SpacingValues) => {
    onUpdateProp(`${prefix}Top`, vals.top);
    onUpdateProp(`${prefix}Right`, vals.right);
    onUpdateProp(`${prefix}Bottom`, vals.bottom);
    onUpdateProp(`${prefix}Left`, vals.left);
    // Also sync the old vertical/horizontal props for backward compat
    onUpdateProp(`${prefix}Vertical`, vals.top);
    onUpdateProp(`${prefix}Horizontal`, vals.left);
  };
}

/* ────────────────────────────────────────────────────────────
   Axis Toggle  (→  ↓  ⬇)
   ──────────────────────────────────────────────────────────── */
function PropAxisToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const options: { val: string; label: React.ReactNode; title: string }[] = [
    {
      val: "horizontal",
      title: "Horizontal",
      label: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8h10M10 5l3 3-3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      val: "vertical",
      title: "Vertical",
      label: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 3v10M5 10l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      val: "z-stack",
      title: "Z-Stack (Layers)",
      label: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M2 10l6 3 6-3M2 7l6 3 6-3M2 4l6 3 6-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center rounded-lg overflow-hidden border border-white/[0.08]">
      {options.map((opt) => (
        <button
          key={opt.val}
          title={opt.title}
          onClick={() => onChange(opt.val)}
          className={`flex items-center justify-center w-9 h-8 transition-colors ${
            value === opt.val
              ? "bg-[#6C5CE7] text-white"
              : "bg-white/[0.04] text-white/50 hover:text-white/80"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Background Type Toggle  (Color | Image | Video)
   ──────────────────────────────────────────────────────────── */
function PropBackgroundTypeToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const options = ["Color", "Image", "Video"];
  return (
    <div className="flex items-center rounded-lg overflow-hidden border border-white/[0.08]">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt.toLowerCase())}
          className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
            value === opt.toLowerCase()
              ? "bg-[#6C5CE7] text-white"
              : "bg-white/[0.04] text-white/50 hover:text-white/80"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Badge Position Grid  (3×3 alignment picker)
   ──────────────────────────────────────────────────────────── */
function PropPositionGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const positions = [
    ["top-left", "top-center", "top-right"],
    ["center-left", "center-center", "center-right"],
    ["bottom-left", "bottom-center", "bottom-right"],
  ];

  return (
    <div className="inline-grid grid-cols-3 gap-0.5 rounded-lg overflow-hidden border border-white/[0.08]">
      {positions.flat().map((pos) => (
        <button
          key={pos}
          onClick={() => onChange(pos)}
          className={`w-8 h-8 flex items-center justify-center transition-colors ${
            value === pos
              ? "bg-[#6C5CE7] text-white"
              : "bg-white/[0.04] text-white/30 hover:text-white/60"
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect
              x="1"
              y="1"
              width="10"
              height="10"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export function ComponentPropertyEditor({
  component,
  onUpdateProp,
}: {
  component: FlowComponent;
  onUpdateProp: (key: string, value: unknown) => void;
}) {
  const p = component.props as Record<string, any>;

  /* ════════════════════════════════════════════════════════
     STACK PROPERTIES
     ════════════════════════════════════════════════════════ */
  if (component.type === "STACK") {
    return (
      <div>
        {/* ── Core Stack Controls ── */}

        {/* Axis */}
        <PropRow label="Axis">
          <PropAxisToggle
            value={p.axis || "vertical"}
            onChange={(v) => onUpdateProp("axis", v)}
          />
        </PropRow>

        {/* Alignment */}
        <PropRow label="Alignment">
          <PropAlignmentToggle
            value={p.alignment || "start"}
            onChange={(v) => onUpdateProp("alignment", v)}
          />
        </PropRow>

        {/* Distribution */}
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

        {/* Child spacing */}
        <PropRow label="Child spacing">
          <PropNumberUnit
            value={p.childSpacing ?? 0}
            onChange={(v) => onUpdateProp("childSpacing", v)}
            unit="px"
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

        {/* ── Appearance ── */}
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

        {/* ── Fill ── */}
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
              value={p.borderWidth ?? 1}
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

        {/* ── Badge ── */}
        <CollapsibleSection title="Badge">
          <PropRow label="" fullWidth>
            <PropTextarea
              value={p.badgeText || "Badge"}
              onChange={(v) => onUpdateProp("badgeText", v)}
              rows={2}
              showToolbar
            />
            <AddVariableLink />
          </PropRow>
          <PropRow label="Alignment">
            <PropAlignmentToggle
              value={p.badgeAlignment || "center"}
              onChange={(v) => onUpdateProp("badgeAlignment", v)}
            />
          </PropRow>
          <PropRow label="Font family">
            <PropSelect
              value={p.badgeFontFamily || "system"}
              onChange={(v) => onUpdateProp("badgeFontFamily", v)}
              options={[
                { value: "system", label: "System Font" },
                { value: "serif", label: "Serif" },
                { value: "mono", label: "Monospace" },
                { value: "rounded", label: "Rounded" },
              ]}
            />
          </PropRow>
          <PropRow label="Font weight">
            <PropSelect
              value={p.badgeFontWeight || "normal"}
              onChange={(v) => onUpdateProp("badgeFontWeight", v)}
              options={[
                { value: "normal", label: "Regular" },
                { value: "500", label: "Medium" },
                { value: "600", label: "Semibold" },
                { value: "bold", label: "Bold" },
                { value: "800", label: "Extra Bold" },
              ]}
            />
          </PropRow>
          <PropRow label="Font size">
            <PropSelect
              value={p.badgeFontSize || "14"}
              onChange={(v) => onUpdateProp("badgeFontSize", v)}
              options={[
                { value: "10", label: "10" },
                { value: "12", label: "12" },
                { value: "14", label: "14" },
                { value: "16", label: "16" },
                { value: "18", label: "18" },
                { value: "20", label: "20" },
                { value: "24", label: "24" },
              ]}
            />
          </PropRow>
          <PropRow label="Color" fullWidth>
            <PropColorInput
              value={p.badgeColor || "#000000"}
              onChange={(v) => onUpdateProp("badgeColor", v)}
              showOpacity
            />
          </PropRow>
          <PropRow label="Background" fullWidth>
            <PropColorInput
              value={p.badgeBackgroundColor || "transparent"}
              onChange={(v) => onUpdateProp("badgeBackgroundColor", v)}
            />
          </PropRow>
        </CollapsibleSection>

        {/* ── Badge Position ── */}
        <Section title="Badge position">
          <PropRow label="Style">
            <PropSelect
              value={p.badgePositionStyle || "overlaid"}
              onChange={(v) => onUpdateProp("badgePositionStyle", v)}
              options={[
                { value: "overlaid", label: "Overlaid" },
                { value: "inline", label: "Inline" },
                { value: "above", label: "Above" },
                { value: "below", label: "Below" },
              ]}
            />
          </PropRow>
          <PropRow label="Alignment">
            <PropPositionGrid
              value={p.badgePositionAlignment || "top-center"}
              onChange={(v) => onUpdateProp("badgePositionAlignment", v)}
            />
          </PropRow>
        </Section>

        {/* ── Badge Layout ── */}
        <Section title="Badge layout">
          <PropSpacingInput
            label="Padding"
            values={{
              top: p.badgePaddingTop ?? 4,
              right: p.badgePaddingRight ?? 8,
              bottom: p.badgePaddingBottom ?? 4,
              left: p.badgePaddingLeft ?? 8,
            }}
            onChange={(vals) => {
              onUpdateProp("badgePaddingTop", vals.top);
              onUpdateProp("badgePaddingRight", vals.right);
              onUpdateProp("badgePaddingBottom", vals.bottom);
              onUpdateProp("badgePaddingLeft", vals.left);
            }}
          />
          <PropSpacingInput
            label="Margin"
            values={{
              top: p.badgeMarginTop ?? 0,
              right: p.badgeMarginRight ?? 0,
              bottom: p.badgeMarginBottom ?? 0,
              left: p.badgeMarginLeft ?? 0,
            }}
            onChange={(vals) => {
              onUpdateProp("badgeMarginTop", vals.top);
              onUpdateProp("badgeMarginRight", vals.right);
              onUpdateProp("badgeMarginBottom", vals.bottom);
              onUpdateProp("badgeMarginLeft", vals.left);
            }}
          />
        </Section>

        {/* ── Badge Appearance ── */}
        <CollapsibleSection title="Badge appearance">
          <PropRow label="Shape">
            <PropSelect
              value={p.badgeShape || "pill"}
              onChange={(v) => onUpdateProp("badgeShape", v)}
              options={[
                { value: "rectangle", label: "Rectangle" },
                { value: "rounded", label: "Rounded" },
                { value: "pill", label: "Pill" },
                { value: "circle", label: "Circle" },
              ]}
            />
          </PropRow>
        </CollapsibleSection>

        {/* ── Badge Fill ── */}
        <CollapsibleSection title="Badge fill">
          <PropRow label="Background" fullWidth>
            <PropColorInput
              value={p.badgeFillColor || "#11D483"}
              onChange={(v) => onUpdateProp("badgeFillColor", v)}
              showOpacity
            />
          </PropRow>
        </CollapsibleSection>

        {/* ── Badge Border ── */}
        <CollapsibleSection title="Badge border">
          <PropRow label="Border color" fullWidth>
            <PropColorInput
              value={p.badgeBorderColor || "#000000"}
              onChange={(v) => onUpdateProp("badgeBorderColor", v)}
              showOpacity
            />
          </PropRow>
          <PropRow label="Border width">
            <PropNumberUnit
              value={p.badgeBorderWidth ?? 0}
              onChange={(v) => onUpdateProp("badgeBorderWidth", v)}
              unit="px"
            />
          </PropRow>
        </CollapsibleSection>

        {/* ── Badge Drop Shadow ── */}
        <CollapsibleSection title="Badge drop shadow">
          <PropRow label="Position">
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-white/40">X</span>
                <PropNumberUnit
                  value={p.badgeShadowX ?? 0}
                  onChange={(v) => onUpdateProp("badgeShadowX", v)}
                  className="w-[60px]"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-white/40">Y</span>
                <PropNumberUnit
                  value={p.badgeShadowY ?? 2}
                  onChange={(v) => onUpdateProp("badgeShadowY", v)}
                  className="w-[60px]"
                />
              </div>
            </div>
          </PropRow>
          <PropRow label="Blur">
            <PropNumberUnit
              value={p.badgeShadowBlur ?? 6}
              onChange={(v) => onUpdateProp("badgeShadowBlur", v)}
              unit="px"
            />
          </PropRow>
          <PropRow label="Color" fullWidth>
            <PropColorInput
              value={p.badgeShadowColor || "#000000"}
              onChange={(v) => onUpdateProp("badgeShadowColor", v)}
              showOpacity
            />
          </PropRow>
        </CollapsibleSection>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     FOOTER PROPERTIES
     ════════════════════════════════════════════════════════ */
  if (component.type === "FOOTER") {
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

  /* ════════════════════════════════════════════════════════
     TEXT PROPERTIES  ★ ENRICHED — every prop reflects on device
     ════════════════════════════════════════════════════════ */
  if (component.type === "TEXT") {
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

  /* ════════════════════════════════════════════════════════
     IMAGE PROPERTIES  ★ ENRICHED — every prop reflects on device
     ════════════════════════════════════════════════════════ */
  if (component.type === "IMAGE") {
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

  /* ════════════════════════════════════════════════════════
     VIDEO PROPERTIES  ★ ENRICHED — every prop reflects on device
     ════════════════════════════════════════════════════════ */
  if (component.type === "VIDEO") {
    const handleVideoUpload = (file: File) => {
      const url = URL.createObjectURL(file);
      onUpdateProp("src", url);
    };

    return (
      <div>
        {/* Video upload with preview */}
        <PropVideoUpload
          preview={p.src || undefined}
          onUpload={handleVideoUpload}
          onRemove={() => onUpdateProp("src", "")}
        />

        {/* Or URL fallback */}
        <PropRow label="Video URL" fullWidth>
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

        {/* ── Interaction ── */}
        <Section title="Interaction">
          <PropCheckbox
            value={p.loop ?? true}
            onChange={(v) => onUpdateProp("loop", v)}
            label="Loop"
          />
          <PropCheckbox
            value={p.muted ?? true}
            onChange={(v) => onUpdateProp("muted", v)}
            label="Mute audio"
          />
          <PropCheckbox
            value={p.autoplay ?? false}
            onChange={(v) => onUpdateProp("autoplay", v)}
            label="Auto play"
          />
          <PropCheckbox
            value={p.showControls ?? false}
            onChange={(v) => onUpdateProp("showControls", v)}
            label="Playback controls"
          />
        </Section>

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

  /* ════════════════════════════════════════════════════════
     ICON LIBRARY PROPERTIES  ★ ENRICHED
     ════════════════════════════════════════════════════════ */
  if (component.type === "ICON_LIBRARY") {
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

  /* ════════════════════════════════════════════════════════
     BUTTON PROPERTIES  ★ FULLY ENRICHED
     Mirrors the Stack editor with Action/Option at the top,
     full layout, appearance, fill, border, shadow, and badge.
     ════════════════════════════════════════════════════════ */
  if (component.type === "BUTTON") {
    return (
      <div>
        {/* ── Action ── */}
        <PropRow label="Action">
          <PropSelect
            value={p.action || "NEXT_SCREEN"}
            onChange={(v) => onUpdateProp("action", v)}
            options={[
              { value: "NEXT_SCREEN", label: "Navigate to" },
              { value: "DISMISS", label: "Dismiss" },
              { value: "URL", label: "Open URL" },
              { value: "RESTORE_PURCHASES", label: "Restore Purchases" },
            ]}
          />
        </PropRow>

        {/* Option — contextual sub-field */}
        {p.action === "NEXT_SCREEN" && (
          <PropRow label="Option">
            <PropSelect
              value={p.actionTarget || ""}
              onChange={(v) => onUpdateProp("actionTarget", v)}
              options={[
                { value: "", label: "Next Screen" },
                { value: "first", label: "First Screen" },
                { value: "last", label: "Last Screen" },
                { value: "specific", label: "Specific Screen…" },
              ]}
            />
          </PropRow>
        )}
        {p.action === "URL" && (
          <PropRow label="URL" fullWidth>
            <PropInput
              value={p.actionUrl || ""}
              onChange={(v) => onUpdateProp("actionUrl", v)}
              placeholder="https://..."
            />
          </PropRow>
        )}

        <Divider />

        {/* ── Axis ── */}
        <PropRow label="Axis">
          <PropAxisToggle
            value={p.axis || "vertical"}
            onChange={(v) => onUpdateProp("axis", v)}
          />
        </PropRow>

        {/* ── Alignment ── */}
        <PropRow label="Alignment">
          <PropAlignmentToggle
            value={p.alignment || "center"}
            onChange={(v) => onUpdateProp("alignment", v)}
          />
        </PropRow>

        {/* ── Distribution ── */}
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

        {/* ── Child spacing ── */}
        <PropRow label="Child spacing">
          <PropNumberUnit
            value={p.childSpacing ?? 0}
            onChange={(v) => onUpdateProp("childSpacing", v)}
            unit="px"
          />
        </PropRow>

        {/* ── Size ── */}
        <Section title="Size">
          <PropRow label="Width">
            <PropSelect
              value={p.widthMode || "fit"}
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
                value={p.height || 48}
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

        {/* ── Appearance ── */}
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
              value={p.borderRadius ?? 12}
              onChange={(v) => onUpdateProp("borderRadius", v)}
              unit="px"
            />
          </PropRow>
        </CollapsibleSection>

        {/* ── Fill ── */}
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
                value={p.backgroundColor || p.style?.backgroundColor || "#007AFF"}
                onChange={(v) => {
                  onUpdateProp("backgroundColor", v);
                  // Keep legacy style prop in sync
                  onUpdateProp("style", { ...p.style, backgroundColor: v });
                }}
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

        {/* ── Badge ── */}
        <CollapsibleSection title="Badge">
          <PropRow label="" fullWidth>
            <PropTextarea
              value={p.badgeText || "Badge"}
              onChange={(v) => onUpdateProp("badgeText", v)}
              rows={2}
              showToolbar
            />
            <AddVariableLink />
          </PropRow>
          <PropRow label="Alignment">
            <PropAlignmentToggle
              value={p.badgeAlignment || "center"}
              onChange={(v) => onUpdateProp("badgeAlignment", v)}
            />
          </PropRow>
          <PropRow label="Font family">
            <PropSelect
              value={p.badgeFontFamily || "system"}
              onChange={(v) => onUpdateProp("badgeFontFamily", v)}
              options={[
                { value: "system", label: "System Font" },
                { value: "serif", label: "Serif" },
                { value: "mono", label: "Monospace" },
                { value: "rounded", label: "Rounded" },
              ]}
            />
          </PropRow>
          <PropRow label="Font weight">
            <PropSelect
              value={p.badgeFontWeight || "normal"}
              onChange={(v) => onUpdateProp("badgeFontWeight", v)}
              options={[
                { value: "normal", label: "Regular" },
                { value: "500", label: "Medium" },
                { value: "600", label: "Semibold" },
                { value: "bold", label: "Bold" },
                { value: "800", label: "Extra Bold" },
              ]}
            />
          </PropRow>
          <PropRow label="Font size">
            <PropSelect
              value={p.badgeFontSize || "14"}
              onChange={(v) => onUpdateProp("badgeFontSize", v)}
              options={[
                { value: "10", label: "10" },
                { value: "12", label: "12" },
                { value: "14", label: "14" },
                { value: "16", label: "16" },
                { value: "18", label: "18" },
                { value: "20", label: "20" },
                { value: "24", label: "24" },
              ]}
            />
          </PropRow>
          <PropRow label="Color" fullWidth>
            <PropColorInput
              value={p.badgeColor || "#000000"}
              onChange={(v) => onUpdateProp("badgeColor", v)}
              showOpacity
            />
          </PropRow>
          <PropRow label="Background" fullWidth>
            <PropColorInput
              value={p.badgeBackgroundColor || "transparent"}
              onChange={(v) => onUpdateProp("badgeBackgroundColor", v)}
            />
          </PropRow>
        </CollapsibleSection>

        {/* ── Badge Position ── */}
        <Section title="Badge position">
          <PropRow label="Style">
            <PropSelect
              value={p.badgePositionStyle || "overlaid"}
              onChange={(v) => onUpdateProp("badgePositionStyle", v)}
              options={[
                { value: "overlaid", label: "Overlaid" },
                { value: "inline", label: "Inline" },
                { value: "above", label: "Above" },
                { value: "below", label: "Below" },
              ]}
            />
          </PropRow>
          <PropRow label="Alignment">
            <PropPositionGrid
              value={p.badgePositionAlignment || "top-center"}
              onChange={(v) => onUpdateProp("badgePositionAlignment", v)}
            />
          </PropRow>
        </Section>

        {/* ── Badge Layout ── */}
        <Section title="Badge layout">
          <PropSpacingInput
            label="Padding"
            values={{
              top: p.badgePaddingTop ?? 4,
              right: p.badgePaddingRight ?? 8,
              bottom: p.badgePaddingBottom ?? 4,
              left: p.badgePaddingLeft ?? 8,
            }}
            onChange={(vals) => {
              onUpdateProp("badgePaddingTop", vals.top);
              onUpdateProp("badgePaddingRight", vals.right);
              onUpdateProp("badgePaddingBottom", vals.bottom);
              onUpdateProp("badgePaddingLeft", vals.left);
            }}
          />
          <PropSpacingInput
            label="Margin"
            values={{
              top: p.badgeMarginTop ?? 0,
              right: p.badgeMarginRight ?? 0,
              bottom: p.badgeMarginBottom ?? 0,
              left: p.badgeMarginLeft ?? 0,
            }}
            onChange={(vals) => {
              onUpdateProp("badgeMarginTop", vals.top);
              onUpdateProp("badgeMarginRight", vals.right);
              onUpdateProp("badgeMarginBottom", vals.bottom);
              onUpdateProp("badgeMarginLeft", vals.left);
            }}
          />
        </Section>

        {/* ── Badge Appearance ── */}
        <CollapsibleSection title="Badge appearance">
          <PropRow label="Shape">
            <PropSelect
              value={p.badgeShape || "pill"}
              onChange={(v) => onUpdateProp("badgeShape", v)}
              options={[
                { value: "rectangle", label: "Rectangle" },
                { value: "rounded", label: "Rounded" },
                { value: "pill", label: "Pill" },
                { value: "circle", label: "Circle" },
              ]}
            />
          </PropRow>
        </CollapsibleSection>

        {/* ── Badge Fill ── */}
        <CollapsibleSection title="Badge fill">
          <PropRow label="Background" fullWidth>
            <PropColorInput
              value={p.badgeFillColor || "#11D483"}
              onChange={(v) => onUpdateProp("badgeFillColor", v)}
              showOpacity
            />
          </PropRow>
        </CollapsibleSection>

        {/* ── Badge Border ── */}
        <CollapsibleSection title="Badge border">
          <PropRow label="Border color" fullWidth>
            <PropColorInput
              value={p.badgeBorderColor || "#000000"}
              onChange={(v) => onUpdateProp("badgeBorderColor", v)}
              showOpacity
            />
          </PropRow>
          <PropRow label="Border width">
            <PropNumberUnit
              value={p.badgeBorderWidth ?? 0}
              onChange={(v) => onUpdateProp("badgeBorderWidth", v)}
              unit="px"
            />
          </PropRow>
        </CollapsibleSection>

        {/* ── Badge Drop Shadow ── */}
        <CollapsibleSection title="Badge drop shadow">
          <PropRow label="Position">
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-white/40">X</span>
                <PropNumberUnit
                  value={p.badgeShadowX ?? 0}
                  onChange={(v) => onUpdateProp("badgeShadowX", v)}
                  className="w-[60px]"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-white/40">Y</span>
                <PropNumberUnit
                  value={p.badgeShadowY ?? 2}
                  onChange={(v) => onUpdateProp("badgeShadowY", v)}
                  className="w-[60px]"
                />
              </div>
            </div>
          </PropRow>
          <PropRow label="Blur">
            <PropNumberUnit
              value={p.badgeShadowBlur ?? 6}
              onChange={(v) => onUpdateProp("badgeShadowBlur", v)}
              unit="px"
            />
          </PropRow>
          <PropRow label="Color" fullWidth>
            <PropColorInput
              value={p.badgeShadowColor || "#000000"}
              onChange={(v) => onUpdateProp("badgeShadowColor", v)}
              showOpacity
            />
          </PropRow>
        </CollapsibleSection>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     ALL OTHER COMPONENT TYPES (existing editors)
     ════════════════════════════════════════════════════════ */
  const fallbackEditors: Record<string, React.ReactNode> = {
    TAB_BUTTON: (
      <>
        {/* ── Active tab selector (like screenshot: "Tab 1" dropdown) ── */}
        <div className="mb-4">
          <PropSelect
            value={p.activeTabId || p.tabs?.[0]?.id || ""}
            onChange={(v) => {
              onUpdateProp("activeTabId", v);
              // Also update active flags
              const tabs = p.tabs?.map((t: any) => ({
                ...t,
                active: t.id === v,
              }));
              if (tabs) onUpdateProp("tabs", tabs);
            }}
            options={
              p.tabs?.map((t: any) => ({
                value: t.id,
                label: t.label,
              })) || []
            }
          />
        </div>

        <Divider />

        {/* ── Tab Button Style ── */}
        <PropField label="Style">
          <PropSelect
            value={p.variant || "pill"}
            onChange={(v) => onUpdateProp("variant", v)}
            options={[
              { value: "pill", label: "Simple Pill" },
              { value: "filled", label: "Filled Pill" },
              { value: "pill-badge", label: "With Badge" },
              { value: "separated", label: "Separated" },
              { value: "underline", label: "Underline" },
            ]}
          />
        </PropField>

        <PropField label="Indicator">
          <PropSelect
            value={p.activeIndicator || "bg"}
            onChange={(v) => onUpdateProp("activeIndicator", v)}
            options={[
              { value: "bg", label: "Background" },
              { value: "underline", label: "Underline" },
            ]}
          />
        </PropField>

        <Divider />

        {/* ── Colors ── */}
        <PropField label="Active text">
          <PropColorInput
            value={p.activeColor || "#FFFFFF"}
            onChange={(v) => onUpdateProp("activeColor", v)}
          />
        </PropField>
        <PropField label="Active bg">
          <PropColorInput
            value={p.activeBgColor || "#6C5CE7"}
            onChange={(v) => onUpdateProp("activeBgColor", v)}
          />
        </PropField>
        <PropField label="Inactive text">
          <PropColorInput
            value={p.inactiveColor || "#999"}
            onChange={(v) => onUpdateProp("inactiveColor", v)}
          />
        </PropField>
        <PropField label="Inactive bg">
          <PropColorInput
            value={p.inactiveBgColor || "transparent"}
            onChange={(v) => onUpdateProp("inactiveBgColor", v)}
          />
        </PropField>
        <PropField label="Container bg">
          <PropColorInput
            value={p.containerBgColor || "#F0F0F0"}
            onChange={(v) => onUpdateProp("containerBgColor", v)}
          />
        </PropField>

        <Divider />

        {/* ── Shape ── */}
        <PropField label="Container radius">
          <PropNumberUnit
            value={p.containerBorderRadius ?? 12}
            onChange={(v) => onUpdateProp("containerBorderRadius", v)}
            unit="px"
          />
        </PropField>
        <PropField label="Tab radius">
          <PropNumberUnit
            value={p.tabBorderRadius ?? 10}
            onChange={(v) => onUpdateProp("tabBorderRadius", v)}
            unit="px"
          />
        </PropField>
        <PropField label="Container padding">
          <PropNumberUnit
            value={p.containerPadding ?? 4}
            onChange={(v) => onUpdateProp("containerPadding", v)}
            unit="px"
          />
        </PropField>

        <Divider />

        {/* ── Typography ── */}
        <PropField label="Font size">
          <PropNumberUnit
            value={p.fontSize ?? 13}
            onChange={(v) => onUpdateProp("fontSize", v)}
            unit=""
          />
        </PropField>
        <PropField label="Font weight">
          <PropSelect
            value={p.fontWeight || "600"}
            onChange={(v) => onUpdateProp("fontWeight", v)}
            options={[
              { value: "normal", label: "Regular" },
              { value: "500", label: "Medium" },
              { value: "600", label: "Semibold" },
              { value: "bold", label: "Bold" },
            ]}
          />
        </PropField>
        <PropField label="Tab padding V">
          <PropNumberUnit
            value={p.tabPaddingV ?? 8}
            onChange={(v) => onUpdateProp("tabPaddingV", v)}
            unit="px"
          />
        </PropField>
        <PropField label="Tab padding H">
          <PropNumberUnit
            value={p.tabPaddingH ?? 16}
            onChange={(v) => onUpdateProp("tabPaddingH", v)}
            unit="px"
          />
        </PropField>

        <PropToggle
          value={p.activeShadow ?? true}
          onChange={(v) => onUpdateProp("activeShadow", v)}
          label="Active shadow"
        />

        <Divider />

        {/* ── Tab List (tree-like structure) ── */}
        <SectionLabel>Tabs</SectionLabel>
        {p.tabs?.map(
          (
            tab: {
              id: string;
              label: string;
              active: boolean;
              badge?: string;
              children?: any[];
            },
            i: number
          ) => {
            const isActive =
              tab.id === (p.activeTabId || p.tabs?.[0]?.id);

            return (
              <div
                key={tab.id}
                className={`p-3 border rounded-xl mt-1.5 space-y-2 relative group/tab transition-colors ${
                  isActive
                    ? "bg-[#6C5CE7]/5 border-[#6C5CE7]/20"
                    : "bg-white/[0.02] border-white/[0.06]"
                }`}
              >
                {/* Delete button */}
                {(p.tabs?.length || 0) > 1 && (
                  <button
                    onClick={() => {
                      const tabs = [...p.tabs];
                      tabs.splice(i, 1);
                      if (tabs.length > 0 && !tabs.some((t: any) => t.active)) {
                        tabs[0] = { ...tabs[0], active: true };
                      }
                      onUpdateProp("tabs", tabs);
                      if (p.activeTabId === tab.id) {
                        onUpdateProp("activeTabId", tabs[0]?.id);
                      }
                    }}
                    className="absolute top-2 right-2 p-1 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover/tab:opacity-100"
                  >
                    <X size={12} />
                  </button>
                )}

                {/* Tab header: icon + label */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? "bg-[#6C5CE7] text-white"
                        : "bg-white/[0.06] text-white/30"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <PropInput
                    value={tab.label}
                    onChange={(v) => {
                      const tabs = [...p.tabs];
                      tabs[i] = { ...tabs[i], label: v };
                      onUpdateProp("tabs", tabs);
                    }}
                    placeholder="Tab label"
                    className="flex-1"
                  />
                </div>

                {/* Badge (if variant supports it) */}
                {(p.variant === "pill-badge" || tab.badge) && (
                  <PropInput
                    value={tab.badge || ""}
                    onChange={(v) => {
                      const tabs = [...p.tabs];
                      tabs[i] = { ...tabs[i], badge: v };
                      onUpdateProp("tabs", tabs);
                    }}
                    placeholder="Badge text (optional)"
                  />
                )}

                {/* Set active / view button */}
                <button
                  onClick={() => {
                    const tabs = p.tabs.map((t: any) => ({
                      ...t,
                      active: t.id === tab.id,
                    }));
                    onUpdateProp("tabs", tabs);
                    onUpdateProp("activeTabId", tab.id);
                  }}
                  className={`text-[11px] px-2 py-1 rounded-md transition-colors w-full text-center ${
                    isActive
                      ? "bg-[#6C5CE7]/20 text-[#6C5CE7]"
                      : "text-white/30 hover:text-white/60 hover:bg-white/[0.04] border border-white/[0.06]"
                  }`}
                >
                  {isActive ? "✓ Viewing this tab" : "Switch to this tab"}
                </button>

                {/* Tab children preview */}
                {isActive && tab.children && tab.children.length > 0 && (
                  <div className="ml-5 pl-3 border-l border-white/[0.06] space-y-1">
                    {tab.children.map((child: any, ci: number) => (
                      <div
                        key={child.id}
                        className="flex items-center gap-2 py-1 text-[11px] text-white/40"
                      >
                        <span className="text-white/20">T</span>
                        <PropInput
                          value={child.content || ""}
                          onChange={(v) => {
                            const tabs = [...p.tabs];
                            const children = [...(tabs[i].children || [])];
                            children[ci] = { ...children[ci], content: v };
                            tabs[i] = { ...tabs[i], children };
                            onUpdateProp("tabs", tabs);
                          }}
                          placeholder="Text content"
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
        )}

        <button
          onClick={() => {
            const newTab = {
              id: `tab_${Date.now()}`,
              label: `Tab ${(p.tabs?.length || 0) + 1}`,
              active: false,
              children: [
                {
                  id: `text_${Date.now()}`,
                  type: "TEXT",
                  content: "Text",
                  fontSize: 14,
                  color: "#1A1A1A",
                },
              ],
            };
            onUpdateProp("tabs", [...(p.tabs || []), newTab]);
          }}
          className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 bg-white/[0.03] border border-dashed border-white/[0.1] rounded-xl text-white/40 hover:text-white/60 hover:border-white/[0.2] hover:bg-white/[0.05] transition-all text-sm"
        >
          <Plus size={14} />
          Add Tab
        </button>
      </>
    ),
    TEXT_INPUT: (
      <>
        <PropField label="Placeholder">
          <PropInput
            value={p.placeholder}
            onChange={(v) => onUpdateProp("placeholder", v)}
          />
        </PropField>
        <PropField label="Field Key">
          <PropInput
            value={p.fieldKey}
            onChange={(v) => onUpdateProp("fieldKey", v)}
          />
        </PropField>
        <PropToggle
          value={p.required || false}
          onChange={(v) => onUpdateProp("required", v)}
          label="Required"
        />
      </>
    ),
    SINGLE_SELECT: (
      <>
        <PropField label="Label">
          <PropInput
            value={p.label}
            onChange={(v) => onUpdateProp("label", v)}
          />
        </PropField>
        <PropField label="Field Key">
          <PropInput
            value={p.fieldKey}
            onChange={(v) => onUpdateProp("fieldKey", v)}
          />
        </PropField>
        <SectionLabel>Options</SectionLabel>
        {p.options?.map((opt: { id: string; label: string }, i: number) => (
          <div key={opt.id} className="mt-1.5">
            <PropInput
              value={opt.label}
              onChange={(v) => {
                const opts = [...p.options];
                opts[i] = { ...opts[i], label: v };
                onUpdateProp("options", opts);
              }}
            />
          </div>
        ))}
      </>
    ),
    MULTI_SELECT: (
      <>
        <PropField label="Label">
          <PropInput
            value={p.label}
            onChange={(v) => onUpdateProp("label", v)}
          />
        </PropField>
        <PropField label="Field Key">
          <PropInput
            value={p.fieldKey}
            onChange={(v) => onUpdateProp("fieldKey", v)}
          />
        </PropField>
        <SectionLabel>Options</SectionLabel>
        {p.options?.map((opt: { id: string; label: string }, i: number) => (
          <div key={opt.id} className="mt-1.5">
            <PropInput
              value={opt.label}
              onChange={(v) => {
                const opts = [...p.options];
                opts[i] = { ...opts[i], label: v };
                onUpdateProp("options", opts);
              }}
            />
          </div>
        ))}
      </>
    ),
    SLIDER: (
      <>
        <PropField label="Label">
          <PropInput
            value={p.label}
            onChange={(v) => onUpdateProp("label", v)}
          />
        </PropField>
        <PropField label="Min">
          <PropInput
            value={p.min}
            onChange={(v) => onUpdateProp("min", v)}
            type="number"
          />
        </PropField>
        <PropField label="Max">
          <PropInput
            value={p.max}
            onChange={(v) => onUpdateProp("max", v)}
            type="number"
          />
        </PropField>
        <PropField label="Step">
          <PropInput
            value={p.step}
            onChange={(v) => onUpdateProp("step", v)}
            type="number"
          />
        </PropField>
        <PropField label="Default">
          <PropInput
            value={p.defaultValue}
            onChange={(v) => onUpdateProp("defaultValue", v)}
            type="number"
          />
        </PropField>
      </>
    ),
    CAROUSEL: (
      <>
        <PropField label="Variant">
          <PropSelect
            value={p.variant || "image"}
            onChange={(v) => onUpdateProp("variant", v)}
            options={[
              { value: "image", label: "Images" },
              { value: "card", label: "Cards" },
            ]}
          />
        </PropField>
        <PropField label="Height">
          <PropInput
            value={p.height}
            onChange={(v) => onUpdateProp("height", v)}
            type="number"
          />
        </PropField>
        <PropToggle
          value={p.showDots || false}
          onChange={(v) => onUpdateProp("showDots", v)}
          label="Show Dots"
        />
        <SectionLabel>Slides</SectionLabel>
        {p.items?.map(
          (
            item: { id: string; title: string; subtitle: string },
            i: number
          ) => (
            <div
              key={item.id}
              className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl mt-1.5 space-y-1.5"
            >
              <PropInput
                value={item.title}
                onChange={(v) => {
                  const items = [...p.items];
                  items[i] = { ...items[i], title: v };
                  onUpdateProp("items", items);
                }}
                placeholder="Title"
              />
              <PropInput
                value={item.subtitle}
                onChange={(v) => {
                  const items = [...p.items];
                  items[i] = { ...items[i], subtitle: v };
                  onUpdateProp("items", items);
                }}
                placeholder="Subtitle"
              />
            </div>
          )
        )}
      </>
    ),
    SOCIAL_PROOF: (
      <>
        <PropField label="Rating">
          <PropInput
            value={p.rating}
            onChange={(v) => onUpdateProp("rating", v)}
            type="number"
          />
        </PropField>
        <PropField label="Total Reviews">
          <PropInput
            value={p.totalReviews}
            onChange={(v) => onUpdateProp("totalReviews", v)}
            type="number"
          />
        </PropField>
        <PropToggle
          value={p.showStars || false}
          onChange={(v) => onUpdateProp("showStars", v)}
          label="Show Stars"
        />
        <PropToggle
          value={p.compact || false}
          onChange={(v) => onUpdateProp("compact", v)}
          label="Compact Mode"
        />
        <SectionLabel>Reviews</SectionLabel>
        {(p.reviews || []).map(
          (
            rev: {
              id: string;
              author: string;
              rating: number;
              text: string;
            },
            i: number
          ) => (
            <div
              key={rev.id || i}
              className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl mt-1.5 space-y-3 relative group/review"
            >
              <button
                onClick={() => {
                  const r = [...p.reviews];
                  r.splice(i, 1);
                  onUpdateProp("reviews", r);
                }}
                className="absolute top-2 right-2 p-1.5 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover/review:opacity-100"
                title="Delete review"
              >
                <X size={14} />
              </button>

              <PropField label="Author">
                <PropInput
                  value={rev.author}
                  onChange={(v) => {
                    const r = [...p.reviews];
                    r[i] = { ...r[i], author: v };
                    onUpdateProp("reviews", r);
                  }}
                  placeholder="Reviewer Name"
                />
              </PropField>

              <PropField label="Rating">
                <PropInput
                  value={rev.rating}
                  onChange={(v) => {
                    const r = [...p.reviews];
                    r[i] = { ...r[i], rating: v };
                    onUpdateProp("reviews", r);
                  }}
                  type="number"
                  placeholder="5"
                />
              </PropField>

              <PropField label="Review Content">
                <textarea
                  value={rev.text || ""}
                  onChange={(e) => {
                    const r = [...p.reviews];
                    r[i] = { ...r[i], text: e.target.value };
                    onUpdateProp("reviews", r);
                  }}
                  rows={3}
                  placeholder="Write something nice..."
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
                />
              </PropField>
            </div>
          )
        )}

        <button
          onClick={() => {
            const newReview = {
              id: Math.random().toString(36).substr(2, 9),
              author: "New Reviewer",
              rating: 5,
              text: "",
            };
            onUpdateProp("reviews", [...(p.reviews || []), newReview]);
          }}
          className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 bg-white/[0.03] border border-dashed border-white/[0.1] rounded-xl text-white/40 hover:text-white/60 hover:border-white/[0.2] hover:bg-white/[0.05] transition-all text-sm"
        >
          <Plus size={14} />
          Add Review
        </button>
      </>
    ),
    FEATURE_LIST: (
      <>
        <PropField label="Title">
          <PropInput
            value={p.title}
            onChange={(v) => onUpdateProp("title", v)}
          />
        </PropField>
        <PropField label="Icon Color">
          <PropColorInput
            value={p.iconColor || "#34C759"}
            onChange={(v) => onUpdateProp("iconColor", v)}
          />
        </PropField>
        <PropField label="Text Color">
          <PropColorInput
            value={p.textColor || "#1A1A1A"}
            onChange={(v) => onUpdateProp("textColor", v)}
          />
        </PropField>
        <SectionLabel>Features</SectionLabel>
        {p.features?.map(
          (f: { id: string; label: string }, i: number) => (
            <div key={f.id} className="mt-1.5">
              <PropInput
                value={f.label}
                onChange={(v) => {
                  const fs = [...p.features];
                  fs[i] = { ...fs[i], label: v };
                  onUpdateProp("features", fs);
                }}
              />
            </div>
          )
        )}
      </>
    ),
    AWARD: (
      <>
        <PropField label="Variant">
          <PropSelect
            value={p.variant || "badge"}
            onChange={(v) => onUpdateProp("variant", v)}
            options={[
              { value: "badge", label: "Badge Card" },
              { value: "laurel", label: "Laurel Wreath" },
              { value: "minimal", label: "Minimal" },
            ]}
          />
        </PropField>
        <PropField label="Title">
          <PropInput
            value={p.title}
            onChange={(v) => onUpdateProp("title", v)}
          />
        </PropField>
        <PropField label="Subtitle">
          <PropInput
            value={p.subtitle}
            onChange={(v) => onUpdateProp("subtitle", v)}
          />
        </PropField>
        <PropField label="Issuer">
          <PropInput
            value={p.issuer}
            onChange={(v) => onUpdateProp("issuer", v)}
          />
        </PropField>
        <PropField label="Background">
          <PropColorInput
            value={p.backgroundColor || "#1C1C1E"}
            onChange={(v) => onUpdateProp("backgroundColor", v)}
          />
        </PropField>
        <PropField label="Text Color">
          <PropColorInput
            value={p.textColor || "#FFFFFF"}
            onChange={(v) => onUpdateProp("textColor", v)}
          />
        </PropField>
        <PropToggle
          value={p.showLaurels || false}
          onChange={(v) => onUpdateProp("showLaurels", v)}
          label="Show Laurels"
        />
      </>
    ),
  };

  return (
    <div className="flex flex-col gap-4">
      {fallbackEditors[component.type] || (
        <p className="text-xs text-white/30">No editor available</p>
      )}
    </div>
  );
}