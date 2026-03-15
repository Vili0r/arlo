import React, { useState } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code2,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Plus,
  X,
  Settings2,
  MoveHorizontal,
  MoveVertical,
  Square,
  Upload,
} from "lucide-react";

/* ─── Horizontal divider ─────────────────────────────── */
export function Divider({ spacing = "md" }: { spacing?: "sm" | "md" | "lg" }) {
  const py = spacing === "sm" ? "my-2" : spacing === "lg" ? "my-5" : "my-3.5";
  return <div className={`w-full h-px bg-white/[0.06] ${py}`} />;
}

/* ─── Section divider with title ─────────────────────── */
export function Section({ title, children, collapsible = false, defaultOpen = true }: {
  title: string; children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-white/[0.06] pt-4 mt-1">
      <button
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
        className={`flex items-center justify-between w-full mb-3 ${collapsible ? "cursor-pointer" : "cursor-default"}`}
      >
        <span className="text-[13px] font-semibold text-white/90">{title}</span>
        {collapsible && (
          <Plus
            size={14}
            className={`text-white/30 transition-transform ${open ? "rotate-45" : ""}`}
          />
        )}
      </button>
      {open && children}
    </div>
  );
}

/* ─── Row: label left, control right ─────────────────── */
export function PropRow({ label, children, fullWidth = false }: {
  label: string; children: React.ReactNode; fullWidth?: boolean;
}) {
  if (fullWidth) {
    return (
      <div className="mb-3">
        <span className="text-[12px] text-white/50 block mb-1.5">{label}</span>
        {children}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 mb-3 min-h-[36px]">
      <span className="text-[12px] text-white/50 shrink-0">{label}</span>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  );
}

/* ─── Text input (inline, right-aligned) ─────────────── */
export function PropInput({ value, onChange, type = "text", placeholder, className: cx }: {
  value: any; onChange: (v: any) => void; type?: string; placeholder?: string; className?: string;
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
      placeholder={placeholder}
      className={`bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.2] hover:border-white/[0.12] transition-all ${cx || "w-full"}`}
    />
  );
}

/* ─── Number input with unit suffix (px, %, etc) ─────── */
export function PropNumberUnit({ value, onChange, unit = "px", min, max, className: cx }: {
  value: number; onChange: (v: number) => void; unit?: string; min?: number; max?: number; className?: string;
}) {
  return (
    <div className={`flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg overflow-hidden hover:border-white/[0.12] transition-all ${cx || "w-[90px]"}`}>
      <input
        type="number"
        value={value ?? 0}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 bg-transparent px-2.5 py-2 text-[13px] text-white focus:outline-none w-full min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-[11px] text-white/25 pr-2.5 shrink-0">{unit}</span>
    </div>
  );
}

/* ─── Select dropdown ────────────────────────────────── */
export function PropSelect({ value, onChange, options, className: cx }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string;
}) {
  return (
    <div className={`relative ${cx || "w-full"}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-white/[0.2] hover:border-white/[0.12] transition-all appearance-none cursor-pointer pr-8"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#1a1a1a] text-white">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
    </div>
  );
}

/* ─── Color picker with hex + optional opacity ───────── */
export function PropColorInput({ value, onChange, showOpacity = false }: {
  value: string; onChange: (v: string) => void; showOpacity?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 w-full">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded-lg border border-white/[0.08] bg-transparent cursor-pointer shrink-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
      />
      <div className="flex-1 flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg overflow-hidden hover:border-white/[0.12] transition-all">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent px-2.5 py-2 text-[13px] text-white font-mono focus:outline-none min-w-0"
        />
        {showOpacity && (
          <>
            <div className="w-px h-4 bg-white/[0.08]" />
            <span className="text-[12px] text-white/40 px-2.5">100%</span>
          </>
        )}
      </div>
      <button className="p-1.5 text-white/20 hover:text-white/40 transition-colors shrink-0">
        <Settings2 size={14} />
      </button>
    </div>
  );
}

/* ─── Toggle / Checkbox (filled blue square) ─────────── */
export function PropCheckbox({ value, onChange, label }: {
  value: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-2 group"
    >
      <span className="text-[13px] text-white/60 group-hover:text-white/80 transition-colors">{label}</span>
      <div className={`w-5 h-5 rounded flex items-center justify-center transition-all border ${
        value
          ? "bg-blue-500 border-blue-500"
          : "bg-white/[0.04] border-white/[0.12] hover:border-white/[0.2]"
      }`}>
        {value && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
  );
}

/* ─── Toggle switch (for on/off settings) ────────────── */
export function PropToggle({ value, onChange, label }: {
  value: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:border-white/[0.15] transition-all"
    >
      <span className="text-[13px] text-white/60">{label}</span>
      <div className={`w-9 h-5 rounded-full transition-colors relative ${value ? "bg-blue-500" : "bg-white/10"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}

/* ─── Alignment toggle group (left/center/right) ─────── */
export function PropAlignmentToggle({ value, onChange }: {
  value: string; onChange: (v: string) => void;
}) {
  const options = [
    { value: "left", icon: AlignLeft },
    { value: "center", icon: AlignCenter },
    { value: "right", icon: AlignRight },
  ];
  return (
    <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-lg overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 flex items-center justify-center py-2 px-3 transition-all ${
            value === opt.value
              ? "bg-blue-500/80 text-white"
              : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
          }`}
        >
          <opt.icon size={14} />
        </button>
      ))}
    </div>
  );
}

/* ─── Rich text toolbar (B, I, S, Code, Link) ────────── */
export function RichTextToolbar() {
  const tools = [
    { icon: Bold, label: "Bold" },
    { icon: Italic, label: "Italic" },
    { icon: Strikethrough, label: "Strikethrough" },
    { icon: Code2, label: "Code" },
    { icon: Link2, label: "Link" },
  ];
  return (
    <div className="flex items-center gap-0.5 mt-1.5">
      {tools.map((tool) => (
        <button
          key={tool.label}
          className="p-2 text-white/40 hover:text-white/80 hover:bg-white/[0.06] rounded-lg transition-colors"
          title={tool.label}
        >
          <tool.icon size={15} />
        </button>
      ))}
    </div>
  );
}

/* ─── Textarea with optional rich text toolbar ───────── */
export function PropTextarea({ value, onChange, rows = 2, showToolbar = false, placeholder }: {
  value: string; onChange: (v: string) => void; rows?: number; showToolbar?: boolean; placeholder?: string;
}) {
  return (
    <div className="w-full">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder || "Text"}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.2] hover:border-white/[0.12] resize-none transition-all"
      />
      {showToolbar && <RichTextToolbar />}
    </div>
  );
}

/* ─── File upload drop zone ──────────────────────────── */
export function PropFileUpload({ label, accept, onUpload }: {
  label: string; accept?: string; onUpload?: (file: File) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <label className="flex-1 flex flex-col items-center justify-center py-5 border-2 border-dashed border-white/[0.08] rounded-xl cursor-pointer hover:border-white/[0.15] hover:bg-white/[0.02] transition-all group">
          <p className="text-[12px] text-white/30 group-hover:text-white/50 transition-colors">
            Drop a file here, or{" "}
            <span className="text-blue-400 group-hover:text-blue-300">click to select</span>
          </p>
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onUpload) onUpload(file);
            }}
          />
        </label>
        <button className="p-2 text-white/20 hover:text-white/40 transition-colors shrink-0">
          <Settings2 size={16} />
        </button>
      </div>
    </div>
  );
}

/* ─── Video upload drop zone ─────────────────────────── */
export function PropVideoUpload({ onUpload }: { onUpload?: (file: File) => void }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <label className="flex-1 flex flex-col items-center justify-center py-5 border-2 border-dashed border-white/[0.08] rounded-xl cursor-pointer hover:border-white/[0.15] hover:bg-white/[0.02] transition-all group">
          <p className="text-[12px] text-blue-400/60 group-hover:text-blue-400 transition-colors">
            Click to select video from gallery
          </p>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onUpload) onUpload(file);
            }}
          />
        </label>
        <button className="p-2 text-white/20 hover:text-white/40 transition-colors shrink-0">
          <Settings2 size={16} />
        </button>
      </div>
    </div>
  );
}

/* ─── Padding / Margin directional inputs ────────────── */
export function PropSpacingInput({ label, vertical, horizontal, onChangeVertical, onChangeHorizontal }: {
  label: string;
  vertical: number;
  horizontal: number;
  onChangeVertical: (v: number) => void;
  onChangeHorizontal: (v: number) => void;
}) {
  const isMargin = label === "Margin";
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="text-[12px] text-white/50 w-[52px] shrink-0">{label}</span>
      {/* Vertical */}
      <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg overflow-hidden hover:border-white/[0.12] transition-all">
        <div className="px-1.5 text-white/20">
          <MoveVertical size={12} />
        </div>
        <input
          type="number"
          value={vertical}
          onChange={(e) => onChangeVertical(Number(e.target.value))}
          className="w-[32px] bg-transparent py-1.5 text-[12px] text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[10px] text-white/20 pr-1.5">px</span>
      </div>
      {/* Horizontal */}
      <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg overflow-hidden hover:border-white/[0.12] transition-all">
        <div className="px-1.5 text-white/20">
          <MoveHorizontal size={12} />
        </div>
        <input
          type="number"
          value={horizontal}
          onChange={(e) => onChangeHorizontal(Number(e.target.value))}
          className="w-[32px] bg-transparent py-1.5 text-[12px] text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-[10px] text-white/20 pr-1.5">px</span>
      </div>
      {/* Link toggle */}
      <button className="p-1 text-white/15 hover:text-white/40 transition-colors">
        <Square size={13} />
      </button>
    </div>
  );
}

/* ─── Add variable link ──────────────────────────────── */
export function AddVariableLink() {
  return (
    <button className="flex items-center gap-1 text-[12px] text-blue-400/70 hover:text-blue-400 transition-colors mt-1 mb-2 ml-auto">
      <Plus size={12} />
      Add variable
    </button>
  );
}

/* ─── Collapsible section (with + icon, for overlay/border/shadow) */
export function CollapsibleSection({ title, children, defaultOpen = false }: {
  title: string; children?: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-white/[0.06] pt-3 mt-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full mb-2 cursor-pointer"
      >
        <span className="text-[13px] font-semibold text-white/90">{title}</span>
        <Plus
          size={14}
          className={`text-white/30 transition-transform ${open ? "rotate-45" : ""}`}
        />
      </button>
      {open && children && <div className="pb-1">{children}</div>}
    </div>
  );
}

/* ─── Legacy exports for backward compatibility ──────── */
export function PropField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">{label}</label>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mt-3 mb-1">{children}</div>;
}