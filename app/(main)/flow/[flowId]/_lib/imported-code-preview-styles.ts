type StyleValue = string | number | undefined;

export interface ImportedPreviewClassStyle {
  style: Record<string, StyleValue>;
  childGapY?: number;
}

const SPACING_SCALE: Record<string, number> = {
  "0": 0,
  "0.5": 2,
  "1": 4,
  "1.5": 6,
  "2": 8,
  "2.5": 10,
  "3": 12,
  "3.5": 14,
  "4": 16,
  "5": 20,
  "6": 24,
  "7": 28,
  "8": 32,
  "9": 36,
  "10": 40,
  "11": 44,
  "12": 48,
  "14": 56,
  "16": 64,
  "20": 80,
  "24": 96,
  "28": 112,
  "32": 128,
};

const FONT_WEIGHTS: Record<string, number> = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

const LETTER_SPACING: Record<string, string> = {
  tighter: "-0.05em",
  tight: "-0.025em",
  normal: "0em",
  wide: "0.025em",
  wider: "0.05em",
  widest: "0.1em",
};

const SHADOW_PRESETS: Record<string, string> = {
  sm: "0 1px 2px rgba(0,0,0,0.06)",
  md: "0 4px 6px rgba(0,0,0,0.12)",
  lg: "0 10px 15px rgba(0,0,0,0.18)",
  xl: "0 20px 25px rgba(0,0,0,0.2)",
  "2xl": "0 25px 50px rgba(0,0,0,0.25)",
};

const PALETTE: Record<string, string> = {
  white: "#ffffff",
  black: "#000000",
  "zinc-50": "#fafafa",
  "zinc-100": "#f4f4f5",
  "zinc-200": "#e4e4e7",
  "zinc-400": "#a1a1aa",
  "zinc-500": "#71717a",
  "zinc-600": "#52525b",
  "zinc-700": "#3f3f46",
  "zinc-800": "#27272a",
  "zinc-900": "#18181b",
  "zinc-950": "#09090b",
  "violet-500": "#8b5cf6",
  "cyan-400": "#22d3ee",
  "fuchsia-500": "#d946ef",
  "emerald-400": "#34d399",
  "gray-100": "#f3f4f6",
  "gray-200": "#e5e7eb",
  "gray-300": "#d1d5db",
  "gray-400": "#9ca3af",
  "gray-500": "#6b7280",
  "gray-600": "#4b5563",
  "gray-700": "#374151",
  "gray-800": "#1f2937",
  "gray-900": "#111827",
};

function stripVariantPrefix(token: string): string {
  if (!token.includes(":")) return token;
  return "";
}

function parseArbitraryValue(raw: string): string {
  return raw.replace(/_/g, " ");
}

function parseNumericValue(raw: string): number | undefined {
  if (raw in SPACING_SCALE) return SPACING_SCALE[raw];
  if (raw.startsWith("[") && raw.endsWith("]")) {
    const inner = raw.slice(1, -1).trim();
    if (inner.endsWith("px")) {
      const value = Number(inner.slice(0, -2));
      return Number.isFinite(value) ? value : undefined;
    }
    const numeric = Number(inner);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  return undefined;
}

function withOpacity(hex: string, opacity: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const value = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${normalized}${value}`;
}

function parseOpacity(raw: string): number | undefined {
  if (raw.startsWith("[") && raw.endsWith("]")) {
    const value = Number(raw.slice(1, -1));
    return Number.isFinite(value) ? value : undefined;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value / 100 : undefined;
}

function resolveColorToken(token: string): string | undefined {
  const slashIndex = token.lastIndexOf("/");
  if (slashIndex > 0) {
    const base = token.slice(0, slashIndex);
    const opacity = parseOpacity(token.slice(slashIndex + 1));
    const color = resolveColorToken(base);
    if (color && opacity !== undefined && color.startsWith("#") && color.length === 7) {
      return withOpacity(color, opacity);
    }
    return color;
  }

  if (token.startsWith("[") && token.endsWith("]")) {
    return parseArbitraryValue(token.slice(1, -1));
  }

  return PALETTE[token];
}

function resolveGradientDirection(token: string): string | undefined {
  const direction = token.replace("bg-gradient-to-", "");
  const map: Record<string, string> = {
    t: "to top",
    tr: "to top right",
    r: "to right",
    br: "to bottom right",
    b: "to bottom",
    bl: "to bottom left",
    l: "to left",
    tl: "to top left",
  };
  return map[direction];
}

function assignDirectionalSpacing(
  style: Record<string, StyleValue>,
  prefix: "padding" | "margin",
  direction: string,
  value: number,
): void {
  if (direction === "x") {
    style[`${prefix}Left`] = value;
    style[`${prefix}Right`] = value;
    return;
  }
  if (direction === "y") {
    style[`${prefix}Top`] = value;
    style[`${prefix}Bottom`] = value;
    return;
  }
  if (direction === "t") {
    style[`${prefix}Top`] = value;
    return;
  }
  if (direction === "r") {
    style[`${prefix}Right`] = value;
    return;
  }
  if (direction === "b") {
    style[`${prefix}Bottom`] = value;
    return;
  }
  if (direction === "l") {
    style[`${prefix}Left`] = value;
    return;
  }
  style[prefix] = value;
}

function parseSpacingToken(
  style: Record<string, StyleValue>,
  token: string,
): boolean {
  const match = token.match(/^([mp])([trblxy])?-(.+)$/);
  if (!match) return false;

  const value = parseNumericValue(match[3]);
  if (value === undefined) return false;

  const prefix = match[1] === "p" ? "padding" : "margin";
  const direction = match[2] || "";
  assignDirectionalSpacing(style, prefix, direction, value);
  return true;
}

function parseDimensionToken(
  style: Record<string, StyleValue>,
  token: string,
): boolean {
  const mapping: Array<[RegExp, keyof typeof style]> = [
    [/^w-(.+)$/, "width"],
    [/^h-(.+)$/, "height"],
    [/^min-w-(.+)$/, "minWidth"],
    [/^min-h-(.+)$/, "minHeight"],
    [/^max-w-(.+)$/, "maxWidth"],
    [/^max-h-(.+)$/, "maxHeight"],
  ];

  for (const [pattern, key] of mapping) {
    const match = token.match(pattern);
    if (!match) continue;

    const raw = match[1];
    if (raw === "full") {
      style[key] = "100%";
      return true;
    }
    if (raw === "screen") {
      style[key] = "100%";
      return true;
    }
    if (raw === "fit") {
      style[key] = "fit-content";
      return true;
    }
    const value = parseNumericValue(raw);
    if (value !== undefined) {
      style[key] = value;
      return true;
    }
  }

  return false;
}

function parseTextSize(style: Record<string, StyleValue>, token: string): boolean {
  if (!token.startsWith("text-[")) return false;
  const value = token.slice(5);
  if (!value.endsWith("]")) return false;
  const inner = value.slice(1, -1);
  if (!inner.endsWith("px")) return false;
  const size = Number(inner.slice(0, -2));
  if (!Number.isFinite(size)) return false;
  style.fontSize = size;
  return true;
}

function parseLeading(style: Record<string, StyleValue>, token: string): boolean {
  if (!token.startsWith("leading-")) return false;
  const value = token.replace("leading-", "");
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1);
    const numeric = Number(inner);
    style.lineHeight = Number.isFinite(numeric) ? numeric : inner;
    return true;
  }
  const numeric = parseNumericValue(value);
  if (numeric !== undefined) {
    style.lineHeight = `${numeric}px`;
    return true;
  }
  return false;
}

function parseTracking(style: Record<string, StyleValue>, token: string): boolean {
  if (!token.startsWith("tracking-")) return false;
  const value = token.replace("tracking-", "");
  if (value in LETTER_SPACING) {
    style.letterSpacing = LETTER_SPACING[value];
    return true;
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    style.letterSpacing = value.slice(1, -1);
    return true;
  }
  return false;
}

function parseRounded(style: Record<string, StyleValue>, token: string): boolean {
  if (token === "rounded-full") {
    style.borderRadius = 9999;
    return true;
  }
  const match = token.match(/^rounded(?:-[trbl]{1,2})?-(.+)$/);
  if (!match) return false;
  const value = parseNumericValue(match[1]);
  if (value === undefined) return false;
  style.borderRadius = value;
  return true;
}

function parseBorder(style: Record<string, StyleValue>, token: string): boolean {
  if (token === "border") {
    style.borderWidth = 1;
    style.borderStyle = "solid";
    return true;
  }
  if (token === "border-0") {
    style.borderWidth = 0;
    return true;
  }
  if (token.startsWith("border-")) {
    const value = token.replace("border-", "");
    const width = parseNumericValue(value);
    if (width !== undefined) {
      style.borderWidth = width;
      style.borderStyle = "solid";
      return true;
    }
    const color = resolveColorToken(value);
    if (color) {
      style.borderColor = color;
      style.borderStyle = "solid";
      if (style.borderWidth === undefined) style.borderWidth = 1;
      return true;
    }
  }
  return false;
}

export function resolveImportedPreviewClassName(
  className?: string,
): ImportedPreviewClassStyle {
  const style: Record<string, StyleValue> = {};
  if (!className) return { style };

  let gradientDirection: string | undefined;
  let gradientFrom: string | undefined;
  let gradientVia: string | undefined;
  let gradientTo: string | undefined;
  let childGapY: number | undefined;

  const tokens = className
    .split(/\s+/)
    .map((token) => stripVariantPrefix(token.trim()))
    .filter(Boolean);

  for (const token of tokens) {
    if (parseSpacingToken(style, token) || parseDimensionToken(style, token) || parseTextSize(style, token) || parseLeading(style, token) || parseTracking(style, token) || parseRounded(style, token) || parseBorder(style, token)) {
      continue;
    }

    if (token === "flex") {
      style.display = "flex";
      continue;
    }
    if (token === "inline-flex") {
      style.display = "inline-flex";
      continue;
    }
    if (token === "flex-col") {
      style.display = style.display || "flex";
      style.flexDirection = "column";
      continue;
    }
    if (token === "items-center") {
      style.alignItems = "center";
      continue;
    }
    if (token === "justify-center") {
      style.justifyContent = "center";
      continue;
    }
    if (token === "justify-between") {
      style.justifyContent = "space-between";
      continue;
    }
    if (token === "relative") {
      style.position = "relative";
      continue;
    }
    if (token === "absolute") {
      style.position = "absolute";
      continue;
    }
    if (token === "inset-0") {
      style.top = 0;
      style.right = 0;
      style.bottom = 0;
      style.left = 0;
      continue;
    }
    if (token === "overflow-hidden") {
      style.overflow = "hidden";
      continue;
    }
    if (token === "mx-auto") {
      style.marginLeft = "auto";
      style.marginRight = "auto";
      continue;
    }
    if (token === "mt-auto") {
      style.marginTop = "auto";
      continue;
    }
    if (token === "min-w-0") {
      style.minWidth = 0;
      continue;
    }
    if (token === "shrink-0") {
      style.flexShrink = 0;
      continue;
    }
    if (token === "text-center") {
      style.textAlign = "center";
      continue;
    }
    if (token.startsWith("font-")) {
      const weight = FONT_WEIGHTS[token.replace("font-", "")];
      if (weight) {
        style.fontWeight = weight;
        continue;
      }
    }
    if (token.startsWith("text-")) {
      const color = resolveColorToken(token.replace("text-", ""));
      if (color) {
        style.color = color;
        continue;
      }
    }
    if (token.startsWith("bg-[")) {
      style.backgroundImage = parseArbitraryValue(token.slice(4, -1));
      continue;
    }
    if (token.startsWith("bg-gradient-to-")) {
      gradientDirection = resolveGradientDirection(token);
      continue;
    }
    if (token.startsWith("from-")) {
      gradientFrom = resolveColorToken(token.replace("from-", ""));
      continue;
    }
    if (token.startsWith("via-")) {
      gradientVia = resolveColorToken(token.replace("via-", ""));
      continue;
    }
    if (token.startsWith("to-")) {
      gradientTo = resolveColorToken(token.replace("to-", ""));
      continue;
    }
    if (token.startsWith("bg-")) {
      const color = resolveColorToken(token.replace("bg-", ""));
      if (color) {
        style.backgroundColor = color;
        continue;
      }
    }
    if (token.startsWith("gap-")) {
      const value = parseNumericValue(token.replace("gap-", ""));
      if (value !== undefined) {
        style.gap = value;
        continue;
      }
    }
    if (token.startsWith("space-y-")) {
      const value = parseNumericValue(token.replace("space-y-", ""));
      if (value !== undefined) {
        childGapY = value;
        continue;
      }
    }
    if (token.startsWith("shadow-[")) {
      style.boxShadow = parseArbitraryValue(token.slice(8, -1));
      continue;
    }
    if (token === "shadow-2xl" || token === "shadow-xl" || token === "shadow-lg" || token === "shadow-md" || token === "shadow-sm") {
      style.boxShadow = SHADOW_PRESETS[token.replace("shadow-", "")];
      continue;
    }
    if (token === "backdrop-blur-sm") {
      style.backdropFilter = "blur(4px)";
      continue;
    }
  }

  if (!style.backgroundImage && gradientDirection && gradientFrom && gradientTo) {
    const stops = gradientVia ? `${gradientFrom}, ${gradientVia}, ${gradientTo}` : `${gradientFrom}, ${gradientTo}`;
    style.backgroundImage = `linear-gradient(${gradientDirection}, ${stops})`;
  }

  return { style, childGapY };
}
