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

export function ButtonEditor({
  component,
  onUpdateProp,
  screens,
}: {
  component: FlowComponent;
  onUpdateProp: (key: string, value: unknown) => void;
  screens?: import("@/lib/types").Screen[];
}) {
  const p = component.props as Record<string, any>;
    return (
      <div>
        <PropRow label="Label" fullWidth>
          <PropInput
            value={p.label || ""}
            onChange={(v) => onUpdateProp("label", v)}
            placeholder="Continue"
          />
        </PropRow>

        {/* ── Typography ── */}
        <PropRow label="Text color" fullWidth>
          <PropColorInput
            value={p.style?.textColor || p.textColor || "#FFFFFF"}
            onChange={(v) => {
              onUpdateProp("textColor", v);
              onUpdateProp("style", { ...p.style, textColor: v });
            }}
            showOpacity
          />
        </PropRow>

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

        <PropRow label="Font weight">
          <PropSelect
            value={p.fontWeight || "600"}
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

        <PropRow label="Font size">
          <PropNumberUnit
            value={p.fontSize || 16}
            onChange={(v) => onUpdateProp("fontSize", v)}
            unit=""
            className="w-[80px]"
          />
        </PropRow>

        <PropRow label="Alignment">
          <PropAlignmentToggle
            value={p.textAlign || "center"}
            onChange={(v) => onUpdateProp("textAlign", v)}
          />
        </PropRow>

        <Divider />

        {/* ── Icon ── */}
        <Section title="Icon">
          <PropToggle
            value={p.showIcon ?? false}
            onChange={(v) => onUpdateProp("showIcon", v)}
            label="Show icon"
          />
          {p.showIcon && (
            <>
              <PropRow label="Icon" fullWidth>
                <PropIconCombobox
                  value={p.iconName || ""}
                  onChange={(v) => onUpdateProp("iconName", v)}
                  icons={icons}
                />
              </PropRow>
              <PropRow label="Position">
                <PropSelect
                  value={p.iconPosition || "left"}
                  onChange={(v) => onUpdateProp("iconPosition", v)}
                  options={[
                    { value: "left", label: "Left of label" },
                    { value: "right", label: "Right of label" },
                    { value: "only", label: "Icon only" },
                  ]}
                />
              </PropRow>
              <PropRow label="Size">
                <PropNumberUnit
                  value={p.iconSize || 18}
                  onChange={(v) => onUpdateProp("iconSize", v)}
                  unit="px"
                  className="w-[95px]"
                />
              </PropRow>
              <PropRow label="Color" fullWidth>
                <PropColorInput
                  value={p.iconColor || p.style?.textColor || p.textColor || "#FFFFFF"}
                  onChange={(v) => onUpdateProp("iconColor", v)}
                  showOpacity
                />
              </PropRow>
              <PropRow label="Spacing">
                <PropNumberUnit
                  value={p.iconSpacing ?? 8}
                  onChange={(v) => onUpdateProp("iconSpacing", v)}
                  unit="px"
                  className="w-[95px]"
                />
              </PropRow>
            </>
          )}
        </Section>

        <Divider />

        {/* ── Action ── */}
        <PropRow label="Action">
          <PropSelect
            value={p.action || "NEXT_SCREEN"}
            onChange={(v) => onUpdateProp("action", v)}
            options={[
              { value: "NEXT_SCREEN", label: "Navigate to" },
              { value: "PREV_SCREEN", label: "Previous Screen" },
              { value: "DISMISS", label: "Dismiss" },
              { value: "CLOSE_FLOW", label: "Close Flow" },
              { value: "OPEN_URL", label: "Open URL" },
              { value: "DEEP_LINK", label: "Deep Link" },
              { value: "REQUEST_NOTIFICATIONS", label: "Request Notifications" },
              { value: "REQUEST_TRACKING", label: "Request Tracking (ATT)" },
              { value: "RESTORE_PURCHASES", label: "Restore Purchases" },
              { value: "CUSTOM_EVENT", label: "Custom Event" },
            ]}
          />
        </PropRow>

        {/* Option — contextual sub-fields */}
        {p.action === "NEXT_SCREEN" && (
          <PropRow label="Target">
            <PropSelect
              value={p.actionTarget || ""}
              onChange={(v) => {
                onUpdateProp("actionTarget", v);
                if (v !== "specific") onUpdateProp("actionTargetScreenId", "");
              }}
              options={[
                { value: "", label: "Next Screen" },
                { value: "previous", label: "Previous Screen" },
                { value: "first", label: "First Screen" },
                { value: "last", label: "Last Screen" },
                { value: "specific", label: "Specific Screen…" },
              ]}
            />
          </PropRow>
        )}
        {p.action === "NEXT_SCREEN" && p.actionTarget === "specific" && screens && (
          <PropRow label="Screen">
            <PropSelect
              value={p.actionTargetScreenId || ""}
              onChange={(v) => onUpdateProp("actionTargetScreenId", v)}
              options={screens.map((s, i) => ({
                value: s.id,
                label: `${i + 1}. ${s.name}`,
              }))}
            />
          </PropRow>
        )}
        {(p.action === "OPEN_URL" || p.action === "URL") && (
          <PropRow label="URL" fullWidth>
            <PropInput
              value={p.actionUrl || p.url || ""}
              onChange={(v) => onUpdateProp("actionUrl", v)}
              placeholder="https://..."
            />
          </PropRow>
        )}
        {p.action === "DEEP_LINK" && (
          <PropRow label="Deep Link" fullWidth>
            <PropInput
              value={p.deepLinkUrl || ""}
              onChange={(v) => onUpdateProp("deepLinkUrl", v)}
              placeholder="myapp://screen/profile"
            />
          </PropRow>
        )}
        {p.action === "CUSTOM_EVENT" && (
          <PropRow label="Event Name" fullWidth>
            <PropInput
              value={p.eventName || ""}
              onChange={(v) => onUpdateProp("eventName", v)}
              placeholder="e.g. onboarding_cta_tap"
            />
          </PropRow>
        )}
        {p.action === "REQUEST_NOTIFICATIONS" && (
          <PropRow label="On Deny">
            <PropSelect
              value={p.onDenyAction || "continue"}
              onChange={(v) => onUpdateProp("onDenyAction", v)}
              options={[
                { value: "continue", label: "Continue to next" },
                { value: "stay", label: "Stay on screen" },
              ]}
            />
          </PropRow>
        )}
        {p.action === "REQUEST_TRACKING" && (
          <PropRow label="On Deny">
            <PropSelect
              value={p.onDenyAction || "continue"}
              onChange={(v) => onUpdateProp("onDenyAction", v)}
              options={[
                { value: "continue", label: "Continue to next" },
                { value: "stay", label: "Stay on screen" },
              ]}
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
          <PropRow label="Text color" fullWidth>
            <PropColorInput
              value={p.style?.textColor || "#FFFFFF"}
              onChange={(v) => onUpdateProp("style", { ...p.style, textColor: v })}
              showOpacity
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
