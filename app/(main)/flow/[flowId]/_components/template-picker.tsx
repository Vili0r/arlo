"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  LayoutTemplate,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";
import {
  ALL_TEMPLATES,
  TEMPLATE_CATEGORIES,
  searchTemplates,
  getTemplatesByCategory,
  type TemplateDefinition,
  type TemplateCategory,
} from "../_lib/templates";

/* ════════════════════════════════════════════════════════════
   TEMPLATE PICKER
   
   Browsable gallery of onboarding screen templates.
   Lives in the sidebar — can be shown as a tab or modal.
   
   Props:
     onSelectTemplate — called with the built Screen config
     when the user picks a template.
   ════════════════════════════════════════════════════════════ */

interface TemplatePalette {
  onSelectTemplate: (template: TemplateDefinition) => void;
}

export function TemplatePalette({ onSelectTemplate }: TemplatePalette) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    TemplateCategory | "all"
  >("all");
  const [previewTemplate, setPreviewTemplate] =
    useState<TemplateDefinition | null>(null);

  const filtered = useMemo(() => {
    if (search.trim()) return searchTemplates(search);
    if (activeCategory === "all") return ALL_TEMPLATES;
    return getTemplatesByCategory(activeCategory);
  }, [search, activeCategory]);

  return (
    <div className="flex flex-col h-full -m-3">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 space-y-2">
        <div className="flex items-center gap-2">
          <LayoutTemplate size={14} className="text-white/40" />
          <span className="text-[12px] font-semibold text-white/60 uppercase tracking-wider">
            Templates
          </span>
          <span className="ml-auto text-[10px] text-white/30">
            {filtered.length} templates
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-[12px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/[0.15] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
              activeCategory === "all"
                ? "bg-white/[0.12] text-white"
                : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
            }`}
          >
            All
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-white/[0.12] text-white"
                  : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <LayoutTemplate size={20} className="text-white/15 mb-2" />
            <p className="text-[11px] text-white/30">
              No templates match your search
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {filtered.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                onSelect={() => onSelectTemplate(tpl)}
                onPreview={() => setPreviewTemplate(tpl)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview panel (slides up from bottom) */}
      {previewTemplate && (
        <TemplatePreviewPanel
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUse={() => {
            onSelectTemplate(previewTemplate);
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TEMPLATE CARD — compact card in the grid
   ════════════════════════════════════════════════════════════ */

function TemplateCard({
  template,
  onSelect,
  onPreview,
}: {
  template: TemplateDefinition;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const categoryMeta = TEMPLATE_CATEGORIES.find(
    (c) => c.id === template.category,
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect();
      }}
      className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all cursor-pointer overflow-hidden"
    >
      {/* Preview area */}
      <div className="h-[72px] flex items-center justify-center bg-white/[0.015] relative">
        <span className="text-[28px]">{template.icon}</span>

        {/* Category dot */}
        <div
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: categoryMeta?.color || "#666" }}
        />

        {/* Hover: info button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          className="absolute bottom-1 right-1 p-1 rounded-md bg-white/[0.06] text-white/0 group-hover:text-white/40 hover:!text-white/70 hover:!bg-white/[0.1] transition-all"
        >
          <ChevronRight size={10} />
        </button>
      </div>

      {/* Label */}
      <div className="px-2 py-2">
        <p className="text-[10px] font-semibold text-white/70 truncate">
          {template.name}
        </p>
        <p className="text-[9px] text-white/30 truncate mt-0.5">
          {template.description}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TEMPLATE PREVIEW PANEL — expanded view with component list
   ════════════════════════════════════════════════════════════ */

function TemplatePreviewPanel({
  template,
  onClose,
  onUse,
}: {
  template: TemplateDefinition;
  onClose: () => void;
  onUse: () => void;
}) {
  const screen = template.build();
  const categoryMeta = TEMPLATE_CATEGORIES.find(
    (c) => c.id === template.category,
  );

  return (
    <div className="absolute inset-0 bg-[#0e0e10]/95 backdrop-blur-sm z-10 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
        <button
          onClick={onClose}
          className="p-1 text-white/30 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
        >
          <X size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate">
            {template.icon} {template.name}
          </p>
          <p className="text-[10px] text-white/40">{template.description}</p>
        </div>
      </div>

      {/* Component breakdown */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="px-2 py-0.5 rounded-full text-[9px] font-bold"
            style={{
              backgroundColor: `${categoryMeta?.color}20`,
              color: categoryMeta?.color,
            }}
          >
            {categoryMeta?.label}
          </div>
          <span className="text-[10px] text-white/30">
            {screen.components.length} components
          </span>
        </div>

         {screen.components.map((comp, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg"
          >
            <div className="w-5 h-5 rounded-md bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-white/30">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-white/60 truncate">
                {comp.type}
              </p>
              {(() => {
                const p = comp.props as any;
                const preview = p.content || p.text || p.label || p.title || p.placeholder;
                if (!preview) return null;
                return (
                  <p className="text-[9px] text-white/25 truncate">
                    {String(preview).slice(0, 40)}
                    {String(preview).length > 40 ? "..." : ""}
                  </p>
                );
              })()}
            </div>
          </div>
        ))}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 pt-2">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[9px] text-white/25"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Use template CTA */}
      <div className="px-4 py-3 border-t border-white/[0.08]">
        <button
          onClick={onUse}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold rounded-xl transition-colors"
        >
          <Sparkles size={14} />
          Use Template
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   QUICK FLOW BUILDER — generates a multi-screen flow
   from a set of templates in one click
   ════════════════════════════════════════════════════════════ */

export function QuickFlowTemplates({
  onBuildFlow,
}: {
  onBuildFlow: (templateIds: string[]) => void;
}) {
  const PRESET_FLOWS = [
    {
      id: "fitness-onboarding",
      name: "Fitness App",
      icon: "💪",
      description: "Gender → Goal → Activity → Height/Weight → Results",
      templateIds: [
        "welcome-hero",
        "single-select-simple",
        "single-select-icons",
        "measurement-picker",
        "date-picker",
        "value-prop-chart",
        "trust-screen",
        "permission-request",
      ],
    },
    {
      id: "saas-onboarding",
      name: "SaaS App",
      icon: "🚀",
      description: "Welcome → Goal → Role → Integration → Social Proof",
      templateIds: [
        "welcome-hero",
        "single-select-simple",
        "multi-select-icons",
        "attribution",
        "integration-connect",
        "social-proof-rating",
      ],
    },
    {
      id: "health-onboarding",
      name: "Health & Wellness",
      icon: "🧘",
      description: "Welcome → Goal → Diet → Barriers → Trust → Paywall",
      templateIds: [
        "welcome-hero",
        "single-select-simple",
        "multi-select-icons",
        "binary-choice",
        "value-prop-chart",
        "trust-screen",
        "social-proof-rating",
        "permission-request",
      ],
    },
    {
      id: "minimal-onboarding",
      name: "Minimal (3 screens)",
      icon: "✨",
      description: "Welcome → One question → Get started",
      templateIds: ["welcome-hero", "single-select-icons", "trust-screen"],
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Sparkles size={12} className="text-amber-400" />
        <span className="text-[11px] font-semibold text-white/50">
          Quick Start Flows
        </span>
      </div>

      {PRESET_FLOWS.map((flow) => (
        <button
          key={flow.id}
          onClick={() => onBuildFlow(flow.templateIds)}
          className="w-full flex items-start gap-3 px-3 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all text-left group"
        >
          <span className="text-[20px] mt-0.5">{flow.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white/70 group-hover:text-white/90">
              {flow.name}
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">
              {flow.description}
            </p>
            <p className="text-[9px] text-white/20 mt-1">
              {flow.templateIds.length} screens
            </p>
          </div>
          <ChevronRight
            size={14}
            className="text-white/15 group-hover:text-white/40 mt-1 shrink-0 transition-colors"
          />
        </button>
      ))}
    </div>
  );
}
       

     