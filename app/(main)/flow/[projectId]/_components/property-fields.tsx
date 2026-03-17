import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Search,
} from "lucide-react";

/* ─── Horizontal divider ─────────────────────────────── */
export function Divider({ spacing = "md" }: { spacing?: "sm" | "md" | "lg" }) {
  const py = spacing === "sm" ? "my-2" : spacing === "lg" ? "my-5" : "my-3.5";
  return <div className={`w-full h-px bg-white/[0.06] ${py}`} />;
}

/* ─── Section divider with title ─────────────────────── */
export function Section({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
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
export function PropRow({
  label,
  children,
  fullWidth = false,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
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
export function PropInput({
  value,
  onChange,
  type = "text",
  placeholder,
  className: cx,
}: {
  value: any;
  onChange: (v: any) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) =>
        onChange(type === "number" ? Number(e.target.value) : e.target.value)
      }
      placeholder={placeholder}
      className={`bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/[0.2] hover:border-white/[0.12] transition-all ${cx || "w-full"}`}
    />
  );
}

/* ─── Number input with unit suffix (px, %, etc) ─────── */
export function PropNumberUnit({
  value,
  onChange,
  unit = "px",
  min,
  max,
  className: cx,
}: {
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg overflow-hidden hover:border-white/[0.12] transition-all ${cx || "w-[90px]"}`}
    >
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
export function PropSelect({
  value,
  onChange,
  options,
  className: cx,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={`relative ${cx || "w-full"}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-white/[0.2] hover:border-white/[0.12] transition-all appearance-none cursor-pointer pr-8"
      >
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
            className="bg-[#1a1a1a] text-white"
          >
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
      />
    </div>
  );
}

/* ─── Color picker with hex + optional opacity ───────── */

/* ─── Searchable Icon Combobox ───────────────────────── */
export function PropIconCombobox({
  value,
  onChange,
  icons: iconMap,
}: {
  value: string;
  onChange: (v: string) => void;
  icons: Record<string, any>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allNames = Object.keys(iconMap).sort();
  const filtered = search
    ? allNames.filter((n) => n.toLowerCase().includes(search.toLowerCase()))
    : allNames;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const SelectedIcon = value ? iconMap[value] : null;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white hover:border-white/[0.12] transition-all"
      >
        {SelectedIcon && (
          <SelectedIcon size={14} className="text-white/60 shrink-0" />
        )}
        <span className={`flex-1 text-left truncate ${value ? "text-white" : "text-white/30"}`}>
          {value || "Select an icon"}
        </span>
        <ChevronDown
          size={12}
          className={`text-white/30 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1a1a1c] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
            <Search size={13} className="text-white/25 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="flex-1 bg-transparent text-[12px] text-white placeholder:text-white/25 focus:outline-none min-w-0"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-white/25 hover:text-white/50"
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Icon grid */}
          <div
            ref={listRef}
            className="max-h-[220px] overflow-y-auto p-2"
          >
            {filtered.length === 0 ? (
              <p className="text-[11px] text-white/25 text-center py-4">
                No icons found
              </p>
            ) : (
              <div className="grid grid-cols-6 gap-0.5">
                {filtered.slice(0, 120).map((name) => {
                  const Icon = iconMap[name];
                  const isSelected = name === value;
                  return (
                    <button
                      key={name}
                      title={name}
                      onClick={() => {
                        onChange(name);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full aspect-square flex items-center justify-center rounded-lg transition-all ${
                        isSelected
                          ? "bg-[#6C5CE7] text-white"
                          : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                      }`}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            )}
            {filtered.length > 120 && (
              <p className="text-[10px] text-white/20 text-center mt-2">
                Showing 120 of {filtered.length} — refine your search
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function PropColorInput({
  value,
  onChange,
  showOpacity = false,
}: {
  value: string;
  onChange: (v: string) => void;
  showOpacity?: boolean;
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
export function PropCheckbox({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-2 group"
    >
      <span className="text-[13px] text-white/60 group-hover:text-white/80 transition-colors">
        {label}
      </span>
      <div
        className={`w-5 h-5 rounded flex items-center justify-center transition-all border ${
          value
            ? "bg-blue-500 border-blue-500"
            : "bg-white/[0.04] border-white/[0.12] hover:border-white/[0.2]"
        }`}
      >
        {value && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6L5 8.5L9.5 4"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </button>
  );
}

/* ─── Toggle switch (for on/off settings) ────────────── */
export function PropToggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:border-white/[0.15] transition-all"
    >
      <span className="text-[13px] text-white/60">{label}</span>
      <div
        className={`w-9 h-5 rounded-full transition-colors relative ${value ? "bg-blue-500" : "bg-white/10"}`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </div>
    </button>
  );
}

/* ─── Alignment toggle group (left/center/right) ─────── */
export function PropAlignmentToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
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
export function PropTextarea({
  value,
  onChange,
  rows = 2,
  showToolbar = false,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  showToolbar?: boolean;
  placeholder?: string;
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

/* ─── File upload drop zone with drag-and-drop + preview ─ */
export function PropFileUpload({
  label,
  accept,
  onUpload,
  preview,
  onRemove,
}: {
  label: string;
  accept?: string;
  onUpload?: (file: File) => void;
  preview?: string;
  onRemove?: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (onUpload) onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Show preview if image is set
  if (preview) {
    return (
      <div className="mb-3 relative group">
        <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02]">
          <img
            src={preview}
            alt={label}
            className="w-full h-[120px] object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
            <label className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium rounded-lg cursor-pointer transition-colors backdrop-blur-sm">
              Replace
              <input
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
            {onRemove && (
              <button
                onClick={onRemove}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-medium rounded-lg transition-colors backdrop-blur-sm"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          isDragging
            ? "border-[#6C5CE7]/50 bg-[#6C5CE7]/5"
            : "border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]"
        } group`}
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-colors ${
            isDragging
              ? "bg-[#6C5CE7]/20 text-[#6C5CE7]"
              : "bg-white/[0.04] text-white/20 group-hover:text-white/40"
          }`}
        >
          <Upload size={16} />
        </div>
        <p className="text-[12px] text-white/30 group-hover:text-white/50 transition-colors">
          Drop a file here, or{" "}
          <span className="text-blue-400 group-hover:text-blue-300">
            click to select
          </span>
        </p>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>
    </div>
  );
}

/* ─── Video upload drop zone with drag-and-drop + preview ─ */
export function PropVideoUpload({
  onUpload,
  preview,
  onRemove,
}: {
  onUpload?: (file: File) => void;
  preview?: string;
  onRemove?: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (onUpload) onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Show preview if video is set
  if (preview) {
    return (
      <div className="mb-3 relative group">
        <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-black h-[120px] flex items-center justify-center">
          <video
            src={preview}
            className="w-full h-full object-cover"
            muted
          />
          {/* Play icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-white ml-0.5" />
            </div>
          </div>
          {/* Hover actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
            <label className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium rounded-lg cursor-pointer transition-colors backdrop-blur-sm">
              Replace
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
            {onRemove && (
              <button
                onClick={onRemove}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-medium rounded-lg transition-colors backdrop-blur-sm"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          isDragging
            ? "border-[#6C5CE7]/50 bg-[#6C5CE7]/5"
            : "border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]"
        } group`}
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-colors ${
            isDragging
              ? "bg-[#6C5CE7]/20 text-[#6C5CE7]"
              : "bg-white/[0.04] text-white/20 group-hover:text-white/40"
          }`}
        >
          <Upload size={16} />
        </div>
        <p className="text-[12px] text-blue-400/60 group-hover:text-blue-400 transition-colors">
          Drop a video here, or{" "}
          <span className="text-blue-400 group-hover:text-blue-300">
            click to select
          </span>
        </p>
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PropSpacingInput — ENHANCED with linked / individual toggle
   
   LINKED mode  (2-value):
   ┌──────┐ ┌─────────────────────────┐ ┌─────────────────────────┐ ┌──┐
   │Label │ │ ↕  100  px              │ │ ↔  100  px              │ │□ │
   └──────┘ └─────────────────────────┘ └─────────────────────────┘ └──┘
   
   INDIVIDUAL mode (4-value):
   ┌──────┐ ┌─────┐┌─────┐┌─────┐┌─────┐      ┌──┐
   │Label │ │  0  ││  0  ││  0  ││  0  │  px  │⊞│
   └──────┘ └─────┘└─────┘└─────┘└─────┘      └──┘
   ════════════════════════════════════════════════════════════ */

export interface SpacingValues {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function PropSpacingInput({
  label,
  values,
  onChange,
}: {
  label: string;
  values: SpacingValues;
  onChange: (values: SpacingValues) => void;
}) {
  // Auto-detect starting mode
  const [mode, setMode] = useState<"linked" | "individual">(() => {
    if (values.top === values.bottom && values.left === values.right) {
      return "linked";
    }
    return "individual";
  });

  const toggleMode = () => {
    if (mode === "individual") {
      // Switch to linked: collapse to vertical (top) / horizontal (left)
      onChange({
        top: values.top,
        right: values.left,
        bottom: values.top,
        left: values.left,
      });
      setMode("linked");
    } else {
      setMode("individual");
    }
  };

  return (
    <div className="flex items-center gap-1 mb-2.5 min-w-0 overflow-hidden">
      {/* Label */}
      <span className="text-[11px] text-white/50 w-[46px] shrink-0">
        {label}
      </span>

      {mode === "linked" ? (
        /* ── LINKED (2-value): vertical + horizontal ── */
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {/* Vertical group */}
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-md overflow-hidden hover:border-white/[0.12] transition-all flex-1 min-w-0 h-7">
            <div className="pl-1.5 text-white/25 shrink-0">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 1v10M3.5 3L6 1l2.5 2M3.5 9L6 11l2.5-2"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <input
              type="number"
              value={values.top}
              onChange={(e) => {
                const v = Number(e.target.value) || 0;
                onChange({ ...values, top: v, bottom: v });
              }}
              className="w-full bg-transparent py-1 text-[11px] text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0"
            />
            <span className="text-[9px] text-white/20 pr-1.5 shrink-0">
              px
            </span>
          </div>

          {/* Horizontal group */}
          <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-md overflow-hidden hover:border-white/[0.12] transition-all flex-1 min-w-0 h-7">
            <div className="pl-1.5 text-white/25 shrink-0">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path
                  d="M1 6h10M3 3.5L1 6l2 2.5M9 3.5L11 6l-2 2.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <input
              type="number"
              value={values.left}
              onChange={(e) => {
                const v = Number(e.target.value) || 0;
                onChange({ ...values, left: v, right: v });
              }}
              className="w-full bg-transparent py-1 text-[11px] text-white text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-0"
            />
            <span className="text-[9px] text-white/20 pr-1.5 shrink-0">
              px
            </span>
          </div>
        </div>
      ) : (
        /* ── INDIVIDUAL (4-value): top / right / bottom / left ── */
        <div className="flex items-center gap-0.5 flex-1 min-w-0">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <input
              key={side}
              type="number"
              title={side.charAt(0).toUpperCase() + side.slice(1)}
              value={values[side]}
              onChange={(e) =>
                onChange({
                  ...values,
                  [side]: Number(e.target.value) || 0,
                })
              }
              className="flex-1 min-w-0 w-0 bg-white/[0.04] border border-white/[0.08] rounded-md px-0.5 py-1 h-7 text-[11px] text-white text-center focus:outline-none focus:border-white/[0.2] hover:border-white/[0.12] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          ))}
          <span className="text-[9px] text-white/20 shrink-0 pl-0.5">
            px
          </span>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={toggleMode}
        title={
          mode === "linked"
            ? "Switch to individual (top, right, bottom, left)"
            : "Switch to linked (vertical, horizontal)"
        }
        className={`w-6 h-6 shrink-0 flex items-center justify-center rounded-md border transition-all ${
          mode === "individual"
            ? "border-[#6C5CE7]/60 bg-[#6C5CE7]/15 text-[#8B7CF7]"
            : "border-white/[0.08] bg-white/[0.04] text-white/25 hover:text-white/45 hover:border-white/[0.15]"
        }`}
      >
        {mode === "linked" ? (
          <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
            <rect
              x="1.5"
              y="1.5"
              width="10"
              height="10"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
            <rect
              x="1.5"
              y="1.5"
              width="10"
              height="10"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <rect x="3" y="3" width="2" height="2" rx="0.5" fill="currentColor" />
            <rect x="8" y="3" width="2" height="2" rx="0.5" fill="currentColor" />
            <rect x="3" y="8" width="2" height="2" rx="0.5" fill="currentColor" />
            <rect x="8" y="8" width="2" height="2" rx="0.5" fill="currentColor" />
          </svg>
        )}
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

/* ─── Collapsible section (with + icon) ──────────────── */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-white/[0.06] pt-3 mt-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full mb-2 cursor-pointer"
      >
        <span className="text-[13px] font-semibold text-white/90">
          {title}
        </span>
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
export function PropField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
        {label}
      </label>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return (
    <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mt-3 mb-1">
      {children}
    </div>
  );
}