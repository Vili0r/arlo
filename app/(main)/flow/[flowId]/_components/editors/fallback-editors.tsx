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

function CustomComponentEditor({
  registryKeys,
  props,
  onUpdateProp,
}: {
  registryKeys?: { id: string; key: string; type: "SCREEN" | "COMPONENT"; description: string | null }[];
  props: Record<string, any>;
  onUpdateProp: (key: string, value: unknown) => void;
}) {
  const componentRegistryEntries = (registryKeys || []).filter((entry) => entry.type === "COMPONENT");
  const componentRegistryOptions = componentRegistryEntries.map((entry) => ({
    value: entry.key,
    label: entry.key,
  }));
  const selectedRegistryEntry =
    componentRegistryEntries.find((entry) => entry.key === props.registryKey) || null;
  const [payloadInput, setPayloadInput] = React.useState(
    JSON.stringify(props.payload || {}, null, 2)
  );
  const [payloadError, setPayloadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPayloadInput(JSON.stringify(props.payload || {}, null, 2));
    setPayloadError(null);
  }, [props.payload, props.registryKey]);

  return (
    <>
      <PropField label="Registry key">
        <PropSelect
          value={props.registryKey || ""}
          onChange={(value) => onUpdateProp("registryKey", value)}
          options={
            componentRegistryOptions.length > 0
              ? componentRegistryOptions
              : [{ value: "", label: "No component keys yet" }]
          }
        />
      </PropField>

      {selectedRegistryEntry?.description ? (
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
            Registry Notes
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/50">
            {selectedRegistryEntry.description}
          </p>
        </div>
      ) : null}

      <PropField label="Payload JSON">
        <div className="space-y-2">
          <PropTextarea
            value={payloadInput}
            onChange={(value) => {
              setPayloadInput(value);
              try {
                const parsed = value.trim() ? JSON.parse(value) : {};
                onUpdateProp("payload", parsed);
                setPayloadError(null);
              } catch {
                setPayloadError("Payload must be valid JSON before it can be saved.");
              }
            }}
            placeholder='e.g. { "variant": "hero" }'
            rows={7}
          />
          {payloadError ? (
            <p className="text-[11px] text-rose-300/80">{payloadError}</p>
          ) : (
            <p className="text-[11px] text-white/25">
              Passed through to the native registered component as structured props.
            </p>
          )}
        </div>
      </PropField>
    </>
  );
}

export function getFallbackEditors(
  component: FlowComponent,
  onUpdateProp: (key: string, value: unknown) => void,
  registryKeys?: { id: string; key: string; type: "SCREEN" | "COMPONENT"; description: string | null }[]
) {
  const p = component.props as Record<string, any>;
  const fallbackEditors: Record<string, React.ReactNode> = {
    CUSTOM_COMPONENT: (
      <CustomComponentEditor
        registryKeys={registryKeys}
        props={p}
        onUpdateProp={onUpdateProp}
      />
    ),
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
        <PropToggle
          value={p.required || false}
          onChange={(v) => onUpdateProp("required", v)}
          label="Required"
        />
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
        <PropToggle
          value={p.required || false}
          onChange={(v) => onUpdateProp("required", v)}
          label="Required"
        />
        <PropField label="Min Selections">
          <PropInput
            value={p.minSelections ?? ""}
            onChange={(v) => onUpdateProp("minSelections", v ? Number(v) : undefined)}
            type="number"
            placeholder="0"
          />
        </PropField>
        <PropField label="Max Selections">
          <PropInput
            value={p.maxSelections ?? ""}
            onChange={(v) => onUpdateProp("maxSelections", v ? Number(v) : undefined)}
            type="number"
            placeholder="No limit"
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

  return fallbackEditors;
}
