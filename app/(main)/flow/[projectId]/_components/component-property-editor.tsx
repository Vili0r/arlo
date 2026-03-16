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
  AddVariableLink,
  CollapsibleSection,
  PropField,
  SectionLabel,
} from "./property-fields";
import { icons, X, Plus } from "lucide-react";

/* ────────────────────────────────────────────────────────────
   Axis Toggle  (→  ↓  ⬇)
   A small inline 3-button group for Stack axis selection.
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
            vertical={p.paddingVertical ?? 0}
            horizontal={p.paddingHorizontal ?? 0}
            onChangeVertical={(v) => onUpdateProp("paddingVertical", v)}
            onChangeHorizontal={(v) => onUpdateProp("paddingHorizontal", v)}
          />
          <PropSpacingInput
            label="Margin"
            vertical={p.marginVertical ?? 0}
            horizontal={p.marginHorizontal ?? 0}
            onChangeVertical={(v) => onUpdateProp("marginVertical", v)}
            onChangeHorizontal={(v) => onUpdateProp("marginHorizontal", v)}
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

          {/* Color fill */}
          {(p.backgroundType || "color") === "color" && (
            <PropRow label="Color" fullWidth>
              <PropColorInput
                value={p.backgroundColor || "#FFFFFF"}
                onChange={(v) => onUpdateProp("backgroundColor", v)}
                showOpacity
              />
            </PropRow>
          )}

          {/* Image fill */}
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

          {/* Video fill */}
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
          {/* Badge text */}
          <PropRow label="" fullWidth>
            <PropTextarea
              value={p.badgeText || "Badge"}
              onChange={(v) => onUpdateProp("badgeText", v)}
              rows={2}
              showToolbar
            />
            <AddVariableLink />
          </PropRow>

          {/* Badge alignment */}
          <PropRow label="Alignment">
            <PropAlignmentToggle
              value={p.badgeAlignment || "center"}
              onChange={(v) => onUpdateProp("badgeAlignment", v)}
            />
          </PropRow>

          {/* Badge font family */}
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

          {/* Badge font weight */}
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

          {/* Badge font size */}
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

          {/* Badge text color */}
          <PropRow label="Color" fullWidth>
            <PropColorInput
              value={p.badgeColor || "#000000"}
              onChange={(v) => onUpdateProp("badgeColor", v)}
              showOpacity
            />
          </PropRow>

          {/* Badge background */}
          <PropRow label="Background" fullWidth>
            <PropColorInput
              value={p.badgeBackgroundColor || "transparent"}
              onChange={(v) => onUpdateProp("badgeBackgroundColor", v)}
            />
          </PropRow>
        </CollapsibleSection>

        {/* ── Badge Intro Offer Text ── */}
        <CollapsibleSection title="Badge intro offer text">
          <PropRow label="" fullWidth>
            <PropTextarea
              value={p.badgeIntroOfferText || ""}
              onChange={(v) => onUpdateProp("badgeIntroOfferText", v)}
              rows={2}
              showToolbar
            />
            <AddVariableLink />
          </PropRow>
        </CollapsibleSection>

        {/* ── Badge Multi-phase Offers Text ── */}
        <CollapsibleSection title="Badge multi-phase offers text">
          <PropRow label="" fullWidth>
            <PropTextarea
              value={p.badgeMultiPhaseText || ""}
              onChange={(v) => onUpdateProp("badgeMultiPhaseText", v)}
              rows={2}
              showToolbar
            />
            <AddVariableLink />
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
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     FOOTER PROPERTIES
     ════════════════════════════════════════════════════════ */
  if (component.type === "FOOTER") {
    return (
      <div>
        {/* Description banner */}
        <div className="px-4 py-3 text-sm text-white/60 border-b border-white/[0.06]">
          The footer and any added children components will be fixed to the
          bottom.
        </div>

        <Divider />

        {/* ── Core Stack-like Controls ── */}

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
            vertical={p.paddingVertical ?? 0}
            horizontal={p.paddingHorizontal ?? 0}
            onChangeVertical={(v) => onUpdateProp("paddingVertical", v)}
            onChangeHorizontal={(v) => onUpdateProp("paddingHorizontal", v)}
          />
          <PropSpacingInput
            label="Margin"
            vertical={p.marginVertical ?? 0}
            horizontal={p.marginHorizontal ?? 0}
            onChangeVertical={(v) => onUpdateProp("marginVertical", v)}
            onChangeHorizontal={(v) => onUpdateProp("marginHorizontal", v)}
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

          {/* Color fill */}
          {(p.backgroundType || "color") === "color" && (
            <PropRow label="Color" fullWidth>
              <PropColorInput
                value={p.backgroundColor || "#FFFFFF"}
                onChange={(v) => onUpdateProp("backgroundColor", v)}
                showOpacity
              />
            </PropRow>
          )}

          {/* Image fill */}
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

          {/* Video fill */}
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
     TEXT PROPERTIES
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
              value={p.width || "fit"}
              onChange={(v) => onUpdateProp("width", v)}
              options={[
                { value: "fit", label: "Fit" },
                { value: "fill", label: "Fill" },
                { value: "fixed", label: "Fixed" },
              ]}
            />
          </PropRow>
          <PropRow label="Height">
            <PropSelect
              value={p.height || "fit"}
              onChange={(v) => onUpdateProp("height", v)}
              options={[
                { value: "fit", label: "Fit" },
                { value: "fill", label: "Fill" },
                { value: "fixed", label: "Fixed" },
              ]}
            />
          </PropRow>
        </Section>

        {/* ── Layout ── */}
        <Section title="Layout">
          <PropSpacingInput
            label="Padding"
            vertical={p.paddingVertical || 0}
            horizontal={p.paddingHorizontal || 0}
            onChangeVertical={(v) => onUpdateProp("paddingVertical", v)}
            onChangeHorizontal={(v) => onUpdateProp("paddingHorizontal", v)}
          />
          <PropSpacingInput
            label="Margin"
            vertical={p.marginVertical || 0}
            horizontal={p.marginHorizontal || 0}
            onChangeVertical={(v) => onUpdateProp("marginVertical", v)}
            onChangeHorizontal={(v) => onUpdateProp("marginHorizontal", v)}
          />
        </Section>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     IMAGE PROPERTIES
     ════════════════════════════════════════════════════════ */
  if (component.type === "IMAGE") {
    return (
      <div>
        {/* File upload */}
        <PropFileUpload label="Image" accept="image/*" />

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
            className="w-[100px]"
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
          {(p.heightMode === "fixed" || !p.heightMode) && (
            <PropRow label="">
              <PropNumberUnit
                value={p.height || 200}
                onChange={(v) => onUpdateProp("height", v)}
              />
            </PropRow>
          )}
        </Section>

        {/* ── Layout ── */}
        <Section title="Layout">
          <PropSpacingInput
            label="Padding"
            vertical={p.paddingVertical || 0}
            horizontal={p.paddingHorizontal || 0}
            onChangeVertical={(v) => onUpdateProp("paddingVertical", v)}
            onChangeHorizontal={(v) => onUpdateProp("paddingHorizontal", v)}
          />
          <PropSpacingInput
            label="Margin"
            vertical={p.marginVertical || 0}
            horizontal={p.marginHorizontal || 0}
            onChangeVertical={(v) => onUpdateProp("marginVertical", v)}
            onChangeHorizontal={(v) => onUpdateProp("marginHorizontal", v)}
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
            />
          </PropRow>
        </Section>

        {/* ── Collapsible extras ── */}
        <CollapsibleSection title="Overlay" />
        <CollapsibleSection title="Border" />
        <CollapsibleSection title="Drop Shadow" />
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     VIDEO PROPERTIES
     ════════════════════════════════════════════════════════ */
  if (component.type === "VIDEO") {
    return (
      <div>
        {/* Video upload */}
        <PropVideoUpload />

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
            className="w-[100px]"
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
          {(p.heightMode === "fixed" || !p.heightMode) && (
            <PropRow label="">
              <PropNumberUnit
                value={p.height || 200}
                onChange={(v) => onUpdateProp("height", v)}
              />
            </PropRow>
          )}
        </Section>

        {/* ── Layout ── */}
        <Section title="Layout">
          <PropSpacingInput
            label="Padding"
            vertical={p.paddingVertical || 0}
            horizontal={p.paddingHorizontal || 0}
            onChangeVertical={(v) => onUpdateProp("paddingVertical", v)}
            onChangeHorizontal={(v) => onUpdateProp("paddingHorizontal", v)}
          />
          <PropSpacingInput
            label="Margin"
            vertical={p.marginVertical || 0}
            horizontal={p.marginHorizontal || 0}
            onChangeVertical={(v) => onUpdateProp("marginVertical", v)}
            onChangeHorizontal={(v) => onUpdateProp("marginHorizontal", v)}
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
            />
          </PropRow>
        </Section>

        {/* ── Collapsible extras ── */}
        <CollapsibleSection title="Overlay" />
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     ICON LIBRARY PROPERTIES
     ════════════════════════════════════════════════════════ */
  if (component.type === "ICON_LIBRARY") {
    return (
      <div>
        <PropRow label="Icon" fullWidth>
          <PropSelect
            value={p.iconName || ""}
            onChange={(v) => onUpdateProp("iconName", v)}
            options={[
              { value: "", label: "Select an icon" },
              ...Object.keys(icons)
                .sort()
                .map((name) => ({
                  value: name,
                  label: name,
                })),
            ]}
          />
        </PropRow>

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
            />
          </PropRow>
          <PropRow label="Height">
            <PropNumberUnit
              value={p.height || 24}
              onChange={(v) => onUpdateProp("height", v)}
            />
          </PropRow>
        </Section>

        {/* ── Layout ── */}
        <Section title="Layout">
          <PropSpacingInput
            label="Padding"
            vertical={p.paddingVertical || 0}
            horizontal={p.paddingHorizontal || 0}
            onChangeVertical={(v) => onUpdateProp("paddingVertical", v)}
            onChangeHorizontal={(v) => onUpdateProp("paddingHorizontal", v)}
          />
          <PropSpacingInput
            label="Margin"
            vertical={p.marginVertical || 0}
            horizontal={p.marginHorizontal || 0}
            onChangeVertical={(v) => onUpdateProp("marginVertical", v)}
            onChangeHorizontal={(v) => onUpdateProp("marginHorizontal", v)}
          />
        </Section>

        <Divider />

        {/* ── Background ── */}
        <PropRow label="Background" fullWidth>
          <PropColorInput
            value={p.backgroundColor || "transparent"}
            onChange={(v) => onUpdateProp("backgroundColor", v)}
          />
        </PropRow>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     ALL OTHER COMPONENT TYPES (existing editors)
     ════════════════════════════════════════════════════════ */
  const fallbackEditors: Record<string, React.ReactNode> = {
    TAB_BUTTON: (
      <>
        <PropField label="Active Color">
          <PropColorInput
            value={p.activeColor || "#007AFF"}
            onChange={(v) => onUpdateProp("activeColor", v)}
          />
        </PropField>
        <PropField label="Inactive Color">
          <PropColorInput
            value={p.inactiveColor || "#999"}
            onChange={(v) => onUpdateProp("inactiveColor", v)}
          />
        </PropField>
        <SectionLabel>Tabs</SectionLabel>
        {p.tabs?.map(
          (tab: { id: string; label: string }, i: number) => (
            <div key={tab.id} className="mt-1.5">
              <PropInput
                value={tab.label}
                onChange={(v) => {
                  const tabs = [...p.tabs];
                  tabs[i] = { ...tabs[i], label: v };
                  onUpdateProp("tabs", tabs);
                }}
              />
            </div>
          )
        )}
      </>
    ),
    BUTTON: (
      <>
        <PropField label="Label">
          <PropInput
            value={p.label}
            onChange={(v) => onUpdateProp("label", v)}
          />
        </PropField>
        <PropField label="Action">
          <PropSelect
            value={p.action || "NEXT_SCREEN"}
            onChange={(v) => onUpdateProp("action", v)}
            options={[
              { value: "NEXT_SCREEN", label: "Next Screen" },
              { value: "DISMISS", label: "Dismiss" },
              { value: "URL", label: "Open URL" },
            ]}
          />
        </PropField>
        <PropField label="Background">
          <PropColorInput
            value={p.style?.backgroundColor || "#007AFF"}
            onChange={(v) =>
              onUpdateProp("style", { ...p.style, backgroundColor: v })
            }
          />
        </PropField>
        <PropField label="Text Color">
          <PropColorInput
            value={p.style?.textColor || "#FFFFFF"}
            onChange={(v) =>
              onUpdateProp("style", { ...p.style, textColor: v })
            }
          />
        </PropField>
        <PropField label="Border Radius">
          <PropInput
            value={p.style?.borderRadius || 12}
            onChange={(v) =>
              onUpdateProp("style", { ...p.style, borderRadius: v })
            }
            type="number"
          />
        </PropField>
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
        {p.options?.map(
          (opt: { id: string; label: string }, i: number) => (
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
          )
        )}
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
        {p.options?.map(
          (opt: { id: string; label: string }, i: number) => (
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
          )
        )}
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