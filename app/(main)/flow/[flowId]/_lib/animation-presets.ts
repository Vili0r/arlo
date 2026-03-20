/* ════════════════════════════════════════════════════════════
   ANIMATION PRESETS — entrance, exit, and screen transitions
   
   Stored on each component as:
     animation?: {
       entrance?: AnimationConfig;
       exit?: AnimationConfig;
     }
   
   Stored on each screen as:
     transition?: ScreenTransitionConfig;
   ════════════════════════════════════════════════════════════ */

/* ── Types ────────────────────────────────────────────── */

export type EasingPreset =
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "linear"
  | "spring"
  | "bounce";

export interface AnimationConfig {
  type: string;        // preset name e.g. "fade-in", "slide-up"
  duration: number;    // ms
  delay: number;       // ms (relative to screen mount)
  easing: EasingPreset;
}

export interface ScreenTransitionConfig {
  type: string;        // "slide-left" | "slide-up" | "fade" | "crossfade" | "none"
  duration: number;    // ms
  easing: EasingPreset;
}

export interface ComponentAnimation {
  entrance?: AnimationConfig;
  exit?: AnimationConfig;
}

/* ── Defaults ─────────────────────────────────────────── */

export const DEFAULT_ANIMATION: AnimationConfig = {
  type: "none",
  duration: 400,
  delay: 0,
  easing: "ease-out",
};

export const DEFAULT_SCREEN_TRANSITION: ScreenTransitionConfig = {
  type: "slide-left",
  duration: 300,
  easing: "ease-in-out",
};

/* ── Entrance presets ─────────────────────────────────── */

export const ENTRANCE_PRESETS: {
  value: string;
  label: string;
  description: string;
  keyframes: Record<string, React.CSSProperties>;
}[] = [
  {
    value: "none",
    label: "None",
    description: "No animation",
    keyframes: {},
  },
  {
    value: "fade-in",
    label: "Fade In",
    description: "Opacity 0 → 1",
    keyframes: {
      "0%": { opacity: 0 },
      "100%": { opacity: 1 },
    },
  },
  {
    value: "slide-up",
    label: "Slide Up",
    description: "Slides in from below",
    keyframes: {
      "0%": { opacity: 0, transform: "translateY(24px)" },
      "100%": { opacity: 1, transform: "translateY(0)" },
    },
  },
  {
    value: "slide-down",
    label: "Slide Down",
    description: "Slides in from above",
    keyframes: {
      "0%": { opacity: 0, transform: "translateY(-24px)" },
      "100%": { opacity: 1, transform: "translateY(0)" },
    },
  },
  {
    value: "slide-left",
    label: "Slide Left",
    description: "Slides in from the right",
    keyframes: {
      "0%": { opacity: 0, transform: "translateX(24px)" },
      "100%": { opacity: 1, transform: "translateX(0)" },
    },
  },
  {
    value: "slide-right",
    label: "Slide Right",
    description: "Slides in from the left",
    keyframes: {
      "0%": { opacity: 0, transform: "translateX(-24px)" },
      "100%": { opacity: 1, transform: "translateX(0)" },
    },
  },
  {
    value: "scale-in",
    label: "Scale In",
    description: "Grows from 80% to 100%",
    keyframes: {
      "0%": { opacity: 0, transform: "scale(0.8)" },
      "100%": { opacity: 1, transform: "scale(1)" },
    },
  },
  {
    value: "scale-up",
    label: "Scale Up",
    description: "Grows from 50% with bounce",
    keyframes: {
      "0%": { opacity: 0, transform: "scale(0.5)" },
      "70%": { opacity: 1, transform: "scale(1.05)" },
      "100%": { opacity: 1, transform: "scale(1)" },
    },
  },
  {
    value: "bounce-in",
    label: "Bounce In",
    description: "Bouncy entrance from below",
    keyframes: {
      "0%": { opacity: 0, transform: "translateY(30px) scale(0.95)" },
      "50%": { opacity: 1, transform: "translateY(-4px) scale(1.02)" },
      "70%": { transform: "translateY(2px) scale(0.99)" },
      "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
    },
  },
  {
    value: "spring",
    label: "Spring",
    description: "Elastic overshoot entrance",
    keyframes: {
      "0%": { opacity: 0, transform: "scale(0.6)" },
      "55%": { opacity: 1, transform: "scale(1.08)" },
      "75%": { transform: "scale(0.97)" },
      "90%": { transform: "scale(1.02)" },
      "100%": { opacity: 1, transform: "scale(1)" },
    },
  },
  {
    value: "flip-in",
    label: "Flip In",
    description: "3D flip entrance",
    keyframes: {
      "0%": { opacity: 0, transform: "perspective(400px) rotateX(-15deg)" },
      "100%": { opacity: 1, transform: "perspective(400px) rotateX(0deg)" },
    },
  },
  {
    value: "blur-in",
    label: "Blur In",
    description: "Fade in with blur dissolve",
    keyframes: {
      "0%": { opacity: 0, filter: "blur(8px)" },
      "100%": { opacity: 1, filter: "blur(0px)" },
    },
  },
];

/* ── Exit presets ─────────────────────────────────────── */

export const EXIT_PRESETS: {
  value: string;
  label: string;
  description: string;
  keyframes: Record<string, React.CSSProperties>;
}[] = [
  {
    value: "none",
    label: "None",
    description: "No animation",
    keyframes: {},
  },
  {
    value: "fade-out",
    label: "Fade Out",
    description: "Opacity 1 → 0",
    keyframes: {
      "0%": { opacity: 1 },
      "100%": { opacity: 0 },
    },
  },
  {
    value: "slide-up-out",
    label: "Slide Up",
    description: "Slides out upward",
    keyframes: {
      "0%": { opacity: 1, transform: "translateY(0)" },
      "100%": { opacity: 0, transform: "translateY(-24px)" },
    },
  },
  {
    value: "slide-down-out",
    label: "Slide Down",
    description: "Slides out downward",
    keyframes: {
      "0%": { opacity: 1, transform: "translateY(0)" },
      "100%": { opacity: 0, transform: "translateY(24px)" },
    },
  },
  {
    value: "scale-out",
    label: "Scale Out",
    description: "Shrinks to 80%",
    keyframes: {
      "0%": { opacity: 1, transform: "scale(1)" },
      "100%": { opacity: 0, transform: "scale(0.8)" },
    },
  },
  {
    value: "blur-out",
    label: "Blur Out",
    description: "Fade out with blur",
    keyframes: {
      "0%": { opacity: 1, filter: "blur(0px)" },
      "100%": { opacity: 0, filter: "blur(8px)" },
    },
  },
];

/* ── Screen transition presets ────────────────────────── */

export const SCREEN_TRANSITION_PRESETS: {
  value: string;
  label: string;
  description: string;
}[] = [
  { value: "slide-left", label: "Slide Left", description: "iOS-style horizontal slide" },
  { value: "slide-up", label: "Slide Up", description: "Vertical slide from bottom" },
  { value: "fade", label: "Fade", description: "Simple crossfade" },
  { value: "crossfade", label: "Crossfade", description: "Overlap dissolve" },
  { value: "scale-fade", label: "Scale + Fade", description: "Shrink current, grow next" },
  { value: "none", label: "None", description: "Instant switch" },
];

/* ── Easing options ───────────────────────────────────── */

export const EASING_OPTIONS: {
  value: EasingPreset;
  label: string;
  css: string;
}[] = [
  { value: "ease", label: "Ease", css: "ease" },
  { value: "ease-in", label: "Ease In", css: "ease-in" },
  { value: "ease-out", label: "Ease Out", css: "ease-out" },
  { value: "ease-in-out", label: "Ease In Out", css: "ease-in-out" },
  { value: "linear", label: "Linear", css: "linear" },
  { value: "spring", label: "Spring", css: "cubic-bezier(0.175, 0.885, 0.32, 1.275)" },
  { value: "bounce", label: "Bounce", css: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
];

/* ── Helpers ──────────────────────────────────────────── */

export function getEntrancePreset(type: string) {
  return ENTRANCE_PRESETS.find((p) => p.value === type) || ENTRANCE_PRESETS[0];
}

export function getExitPreset(type: string) {
  return EXIT_PRESETS.find((p) => p.value === type) || EXIT_PRESETS[0];
}

export function getEasingCSS(easing: EasingPreset): string {
  return EASING_OPTIONS.find((e) => e.value === easing)?.css || "ease-out";
}

/**
 * Generate a unique CSS keyframe name for a component animation.
 * This avoids collisions when multiple components animate.
 */
export function getKeyframeName(componentId: string, phase: "entrance" | "exit"): string {
  return `anim-${phase}-${componentId.replace(/[^a-zA-Z0-9]/g, "")}`;
}

/**
 * Convert keyframes object to a CSS @keyframes string.
 */
export function keyframesToCSS(
  name: string,
  keyframes: Record<string, React.CSSProperties>,
): string {
  if (Object.keys(keyframes).length === 0) return "";

  const frames = Object.entries(keyframes)
    .map(([pct, styles]) => {
      const props = Object.entries(styles)
        .map(([k, v]) => {
          // Convert camelCase to kebab-case
          const kebab = k.replace(/([A-Z])/g, "-$1").toLowerCase();
          return `${kebab}: ${v}`;
        })
        .join("; ");
      return `  ${pct} { ${props} }`;
    })
    .join("\n");

  return `@keyframes ${name} {\n${frames}\n}`;
}

/**
 * Build the full CSS animation shorthand for a component's entrance.
 */
export function buildEntranceCSS(
  componentId: string,
  config: AnimationConfig,
): { keyframeCSS: string; animationStyle: string; keyframeName: string } | null {
  if (config.type === "none") return null;

  const preset = getEntrancePreset(config.type);
  if (!preset || Object.keys(preset.keyframes).length === 0) return null;

  const name = getKeyframeName(componentId, "entrance");
  const keyframeCSS = keyframesToCSS(name, preset.keyframes);
  const easing = getEasingCSS(config.easing);
  const animationStyle = `${name} ${config.duration}ms ${easing} ${config.delay}ms both`;

  return { keyframeCSS, animationStyle, keyframeName: name };
}