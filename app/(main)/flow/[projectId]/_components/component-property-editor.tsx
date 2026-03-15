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
import { icons } from "lucide-react";

export function ComponentPropertyEditor({
  component,
  onUpdateProp,
}: {
  component: FlowComponent;
  onUpdateProp: (key: string, value: unknown) => void;
}) {
  const p = component.props as Record<string, any>;

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
              ...Object.keys(icons).sort().map((name) => ({
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
    STACK: (
      <>
        <PropField label="Direction"><PropSelect value={p.direction || "vertical"} onChange={(v) => onUpdateProp("direction", v)} options={[{ value: "vertical", label: "Vertical" }, { value: "horizontal", label: "Horizontal" }]} /></PropField>
        <PropField label="Gap"><PropInput value={p.gap} onChange={(v) => onUpdateProp("gap", v)} type="number" /></PropField>
        <PropField label="Padding"><PropInput value={p.padding} onChange={(v) => onUpdateProp("padding", v)} type="number" /></PropField>
        <PropField label="Background"><PropColorInput value={p.backgroundColor || "#F8F8F8"} onChange={(v) => onUpdateProp("backgroundColor", v)} /></PropField>
        <PropField label="Border Radius"><PropInput value={p.borderRadius} onChange={(v) => onUpdateProp("borderRadius", v)} type="number" /></PropField>
      </>
    ),
    FOOTER: (
      <>
        <PropField label="Text"><PropInput value={p.text} onChange={(v) => onUpdateProp("text", v)} /></PropField>
        <PropField label="Font Size"><PropInput value={p.fontSize} onChange={(v) => onUpdateProp("fontSize", v)} type="number" /></PropField>
        <PropField label="Text Color"><PropColorInput value={p.textColor || "#999999"} onChange={(v) => onUpdateProp("textColor", v)} /></PropField>
        <PropToggle value={p.showDivider || false} onChange={(v) => onUpdateProp("showDivider", v)} label="Show Divider" />
      </>
    ),
    TAB_BUTTON: (
      <>
        <PropField label="Active Color"><PropColorInput value={p.activeColor || "#007AFF"} onChange={(v) => onUpdateProp("activeColor", v)} /></PropField>
        <PropField label="Inactive Color"><PropColorInput value={p.inactiveColor || "#999"} onChange={(v) => onUpdateProp("inactiveColor", v)} /></PropField>
        <SectionLabel>Tabs</SectionLabel>
        {p.tabs?.map((tab: { id: string; label: string }, i: number) => (<div key={tab.id} className="mt-1.5"><PropInput value={tab.label} onChange={(v) => { const tabs = [...p.tabs]; tabs[i] = { ...tabs[i], label: v }; onUpdateProp("tabs", tabs); }} /></div>))}
      </>
    ),
    BUTTON: (
      <>
        <PropField label="Label"><PropInput value={p.label} onChange={(v) => onUpdateProp("label", v)} /></PropField>
        <PropField label="Action"><PropSelect value={p.action || "NEXT_SCREEN"} onChange={(v) => onUpdateProp("action", v)} options={[{ value: "NEXT_SCREEN", label: "Next Screen" }, { value: "DISMISS", label: "Dismiss" }, { value: "URL", label: "Open URL" }]} /></PropField>
        <PropField label="Background"><PropColorInput value={p.style?.backgroundColor || "#007AFF"} onChange={(v) => onUpdateProp("style", { ...p.style, backgroundColor: v })} /></PropField>
        <PropField label="Text Color"><PropColorInput value={p.style?.textColor || "#FFFFFF"} onChange={(v) => onUpdateProp("style", { ...p.style, textColor: v })} /></PropField>
        <PropField label="Border Radius"><PropInput value={p.style?.borderRadius || 12} onChange={(v) => onUpdateProp("style", { ...p.style, borderRadius: v })} type="number" /></PropField>
      </>
    ),
    TEXT_INPUT: (
      <>
        <PropField label="Placeholder"><PropInput value={p.placeholder} onChange={(v) => onUpdateProp("placeholder", v)} /></PropField>
        <PropField label="Field Key"><PropInput value={p.fieldKey} onChange={(v) => onUpdateProp("fieldKey", v)} /></PropField>
        <PropToggle value={p.required || false} onChange={(v) => onUpdateProp("required", v)} label="Required" />
      </>
    ),
    SINGLE_SELECT: (
      <>
        <PropField label="Label"><PropInput value={p.label} onChange={(v) => onUpdateProp("label", v)} /></PropField>
        <PropField label="Field Key"><PropInput value={p.fieldKey} onChange={(v) => onUpdateProp("fieldKey", v)} /></PropField>
        <SectionLabel>Options</SectionLabel>
        {p.options?.map((opt: { id: string; label: string }, i: number) => (<div key={opt.id} className="mt-1.5"><PropInput value={opt.label} onChange={(v) => { const opts = [...p.options]; opts[i] = { ...opts[i], label: v }; onUpdateProp("options", opts); }} /></div>))}
      </>
    ),
    MULTI_SELECT: (
      <>
        <PropField label="Label"><PropInput value={p.label} onChange={(v) => onUpdateProp("label", v)} /></PropField>
        <PropField label="Field Key"><PropInput value={p.fieldKey} onChange={(v) => onUpdateProp("fieldKey", v)} /></PropField>
        <SectionLabel>Options</SectionLabel>
        {p.options?.map((opt: { id: string; label: string }, i: number) => (<div key={opt.id} className="mt-1.5"><PropInput value={opt.label} onChange={(v) => { const opts = [...p.options]; opts[i] = { ...opts[i], label: v }; onUpdateProp("options", opts); }} /></div>))}
      </>
    ),
    SLIDER: (
      <>
        <PropField label="Label"><PropInput value={p.label} onChange={(v) => onUpdateProp("label", v)} /></PropField>
        <PropField label="Min"><PropInput value={p.min} onChange={(v) => onUpdateProp("min", v)} type="number" /></PropField>
        <PropField label="Max"><PropInput value={p.max} onChange={(v) => onUpdateProp("max", v)} type="number" /></PropField>
        <PropField label="Step"><PropInput value={p.step} onChange={(v) => onUpdateProp("step", v)} type="number" /></PropField>
        <PropField label="Default"><PropInput value={p.defaultValue} onChange={(v) => onUpdateProp("defaultValue", v)} type="number" /></PropField>
      </>
    ),
    CAROUSEL: (
      <>
        <PropField label="Variant"><PropSelect value={p.variant || "image"} onChange={(v) => onUpdateProp("variant", v)} options={[{ value: "image", label: "Images" }, { value: "card", label: "Cards" }]} /></PropField>
        <PropField label="Height"><PropInput value={p.height} onChange={(v) => onUpdateProp("height", v)} type="number" /></PropField>
        <PropToggle value={p.showDots || false} onChange={(v) => onUpdateProp("showDots", v)} label="Show Dots" />
        <SectionLabel>Slides</SectionLabel>
        {p.items?.map((item: { id: string; title: string; subtitle: string }, i: number) => (<div key={item.id} className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl mt-1.5 space-y-1.5"><PropInput value={item.title} onChange={(v) => { const items = [...p.items]; items[i] = { ...items[i], title: v }; onUpdateProp("items", items); }} placeholder="Title" /><PropInput value={item.subtitle} onChange={(v) => { const items = [...p.items]; items[i] = { ...items[i], subtitle: v }; onUpdateProp("items", items); }} placeholder="Subtitle" /></div>))}
      </>
    ),
    SOCIAL_PROOF: (
      <>
        <PropField label="Rating"><PropInput value={p.rating} onChange={(v) => onUpdateProp("rating", v)} type="number" /></PropField>
        <PropField label="Total Reviews"><PropInput value={p.totalReviews} onChange={(v) => onUpdateProp("totalReviews", v)} type="number" /></PropField>
        <PropToggle value={p.showStars || false} onChange={(v) => onUpdateProp("showStars", v)} label="Show Stars" />
        <PropToggle value={p.compact || false} onChange={(v) => onUpdateProp("compact", v)} label="Compact Mode" />
        <SectionLabel>Reviews</SectionLabel>
        {p.reviews?.map((rev: { id: string; author: string; rating: number; text: string }, i: number) => (<div key={rev.id} className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl mt-1.5 space-y-1.5"><PropInput value={rev.author} onChange={(v) => { const r = [...p.reviews]; r[i] = { ...r[i], author: v }; onUpdateProp("reviews", r); }} placeholder="Author" /><PropInput value={rev.rating} onChange={(v) => { const r = [...p.reviews]; r[i] = { ...r[i], rating: v }; onUpdateProp("reviews", r); }} type="number" placeholder="Rating" /><textarea value={rev.text || ""} onChange={(e) => { const r = [...p.reviews]; r[i] = { ...r[i], text: e.target.value }; onUpdateProp("reviews", r); }} rows={2} placeholder="Review text" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none" /></div>))}
      </>
    ),
    FEATURE_LIST: (
      <>
        <PropField label="Title"><PropInput value={p.title} onChange={(v) => onUpdateProp("title", v)} /></PropField>
        <PropField label="Icon Color"><PropColorInput value={p.iconColor || "#34C759"} onChange={(v) => onUpdateProp("iconColor", v)} /></PropField>
        <PropField label="Text Color"><PropColorInput value={p.textColor || "#1A1A1A"} onChange={(v) => onUpdateProp("textColor", v)} /></PropField>
        <SectionLabel>Features</SectionLabel>
        {p.features?.map((f: { id: string; label: string }, i: number) => (<div key={f.id} className="mt-1.5"><PropInput value={f.label} onChange={(v) => { const fs = [...p.features]; fs[i] = { ...fs[i], label: v }; onUpdateProp("features", fs); }} /></div>))}
      </>
    ),
    AWARD: (
      <>
        <PropField label="Variant"><PropSelect value={p.variant || "badge"} onChange={(v) => onUpdateProp("variant", v)} options={[{ value: "badge", label: "Badge Card" }, { value: "laurel", label: "Laurel Wreath" }, { value: "minimal", label: "Minimal" }]} /></PropField>
        <PropField label="Title"><PropInput value={p.title} onChange={(v) => onUpdateProp("title", v)} /></PropField>
        <PropField label="Subtitle"><PropInput value={p.subtitle} onChange={(v) => onUpdateProp("subtitle", v)} /></PropField>
        <PropField label="Issuer"><PropInput value={p.issuer} onChange={(v) => onUpdateProp("issuer", v)} /></PropField>
        <PropField label="Background"><PropColorInput value={p.backgroundColor || "#1C1C1E"} onChange={(v) => onUpdateProp("backgroundColor", v)} /></PropField>
        <PropField label="Text Color"><PropColorInput value={p.textColor || "#FFFFFF"} onChange={(v) => onUpdateProp("textColor", v)} /></PropField>
        <PropToggle value={p.showLaurels || false} onChange={(v) => onUpdateProp("showLaurels", v)} label="Show Laurels" />
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