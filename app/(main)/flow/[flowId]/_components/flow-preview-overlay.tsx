"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  icons,
  Play,
  Puzzle,
  RotateCcw,
  Smile,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";

import type { FlowComponent, FlowConfig, Screen } from "@/lib/types";
import {
  createButtonPressedAnalyticsEvent,
  createComponentInteractionAnalyticsEvent,
} from "@/packages/arlo-sdk/src/analytics";
import {
  applyFlowSessionEffect,
  type FlowBridgeHandlers,
} from "@/packages/arlo-sdk/src/bridge";
import {
  createFlowSession,
  type FlowSessionEffect,
  type FlowSessionSnapshot,
} from "@/packages/arlo-sdk/src/runtime";
import type { ArloAnalyticsEvent, SDKFlowResponse } from "@/packages/arlo-sdk/src/types";

import { recordPreviewAnalyticsEvent } from "../actions";
import type { ScreenTransitionConfig } from "../_lib/animation-presets";
import { getFrameDimensions, type DevicePreset, type Orientation } from "../_lib/device-presets";
import { AnimatedWrapper, ScreenTransitionWrapper } from "./animated-wrapper";
import { DeviceFrame } from "./device-frame";
import { PhonePreviewComponent } from "./phone-preview";

type PreviewValue = string | string[] | number | boolean | null | undefined;

type PreviewNotice = {
  tone: "info" | "error" | "success";
  message: string;
} | null;

type InteractivePreviewComponent = Extract<
  FlowComponent,
  { type: "TEXT_INPUT" | "SINGLE_SELECT" | "MULTI_SELECT" | "SLIDER" }
>;

function findInteractiveComponent(
  screen: Screen | null,
  fieldKey: string,
): InteractivePreviewComponent | null {
  if (!screen) {
    return null;
  }

  return (
    screen.components.find((component): component is InteractivePreviewComponent => {
      if (
        component.type !== "TEXT_INPUT" &&
        component.type !== "SINGLE_SELECT" &&
        component.type !== "MULTI_SELECT" &&
        component.type !== "SLIDER"
      ) {
        return false;
      }

      return component.props.fieldKey === fieldKey;
    }) ?? null
  );
}

function findButtonComponent(
  screen: Screen | null,
  componentId: string,
): Extract<FlowComponent, { type: "BUTTON" }> | null {
  if (!screen) {
    return null;
  }

  return (
    screen.components.find(
      (component): component is Extract<FlowComponent, { type: "BUTTON" }> =>
        component.type === "BUTTON" && component.id === componentId,
    ) ?? null
  );
}

function getSpacing(
  props: Record<string, unknown>,
  prefix: "padding" | "margin",
): { top: number; right: number; bottom: number; left: number } {
  const top = props[`${prefix}Top`];
  const right = props[`${prefix}Right`];
  const bottom = props[`${prefix}Bottom`];
  const left = props[`${prefix}Left`];

  if (
    typeof top === "number" ||
    typeof right === "number" ||
    typeof bottom === "number" ||
    typeof left === "number"
  ) {
    return {
      top: typeof top === "number" ? top : 0,
      right: typeof right === "number" ? right : 0,
      bottom: typeof bottom === "number" ? bottom : 0,
      left: typeof left === "number" ? left : 0,
    };
  }

  const vertical = props[`${prefix}Vertical`];
  const horizontal = props[`${prefix}Horizontal`];

  return {
    top: typeof vertical === "number" ? vertical : 0,
    right: typeof horizontal === "number" ? horizontal : 0,
    bottom: typeof vertical === "number" ? vertical : 0,
    left: typeof horizontal === "number" ? horizontal : 0,
  };
}

function getWidthStyle(props: Record<string, unknown>): CSSProperties {
  const mode = props.widthMode;
  if (mode === "fixed") {
    return { width: typeof props.width === "number" ? props.width : 200 };
  }
  if (mode === "fit") {
    return { width: "fit-content" };
  }
  return { width: "100%" };
}

function getHeightStyle(props: Record<string, unknown>): CSSProperties {
  const mode = props.heightMode;
  if (mode === "fill") {
    return { height: "100%" };
  }
  if (mode === "fixed") {
    return { height: typeof props.height === "number" ? props.height : 100 };
  }
  return { height: "auto" };
}

function getBoxShadow(props: Record<string, unknown>): string | undefined {
  const x = typeof props.shadowX === "number" ? props.shadowX : 0;
  const y = typeof props.shadowY === "number" ? props.shadowY : 0;
  const blur = typeof props.shadowBlur === "number" ? props.shadowBlur : 0;
  const color = typeof props.shadowColor === "string" ? props.shadowColor : "rgba(0,0,0,0.2)";

  if (x === 0 && y === 0 && blur === 0) return undefined;
  return `${x}px ${y}px ${blur}px ${color}`;
}

function getScreenPadding(screen: Screen | null) {
  return {
    top: screen?.style?.paddingTop ?? screen?.style?.padding ?? 24,
    right: screen?.style?.paddingHorizontal ?? screen?.style?.padding ?? 20,
    bottom: screen?.style?.paddingBottom ?? screen?.style?.padding ?? 24,
    left: screen?.style?.paddingHorizontal ?? screen?.style?.padding ?? 20,
  };
}

function getOuterMarginStyle(component: FlowComponent): CSSProperties {
  const props = component.props as unknown as Record<string, unknown>;
  const margin = getSpacing(props, "margin");

  return {
    marginTop: margin.top || undefined,
    marginRight: margin.right || undefined,
    marginBottom: margin.bottom || undefined,
    marginLeft: margin.left || undefined,
  };
}

function collectPreviewInitialValues(config: FlowConfig): Record<string, PreviewValue> {
  const values: Record<string, PreviewValue> = {};

  for (const screen of config.screens) {
    for (const component of screen.components) {
      if (component.type === "TEXT_INPUT" && values[component.props.fieldKey] === undefined) {
        values[component.props.fieldKey] = "";
      }

      if (component.type === "SINGLE_SELECT" && values[component.props.fieldKey] === undefined) {
        values[component.props.fieldKey] = "";
      }

      if (component.type === "MULTI_SELECT" && values[component.props.fieldKey] === undefined) {
        values[component.props.fieldKey] = [];
      }

      if (component.type === "SLIDER" && values[component.props.fieldKey] === undefined) {
        values[component.props.fieldKey] =
          component.props.defaultValue ?? component.props.min ?? 0;
      }
    }
  }

  return values;
}

function sortComponentsForPreview(components: FlowComponent[]) {
  return [...components].sort(
    (left, right) =>
      (left.layout?.zIndex ?? left.order) - (right.layout?.zIndex ?? right.order),
  );
}

function sortComponentsForFlow(screen: Screen) {
  if (screen.layoutMode === "absolute") {
    return sortComponentsForPreview(screen.components);
  }

  return [...screen.components].sort((left, right) => left.order - right.order);
}

function resolveScreenTransition(
  config: FlowConfig,
  screen: Screen | null,
): ScreenTransitionConfig | undefined {
  const screenTransition = screen?.animation as ScreenTransitionConfig | undefined;
  if (screenTransition) return screenTransition;
  if (config.settings?.screenTransition) return config.settings.screenTransition;

  const legacyTransition = config.settings?.transitionAnimation;
  if (legacyTransition === "fade") {
    return { type: "fade", duration: 300, easing: "ease-in-out" };
  }

  if (legacyTransition === "none") {
    return { type: "none", duration: 0, easing: "linear" };
  }

  if (legacyTransition === "slide") {
    return { type: "slide-left", duration: 300, easing: "ease-in-out" };
  }

  return undefined;
}

function PreviewField({
  label,
  error,
  children,
}: {
  label?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
          {label}
        </p>
      ) : null}
      {children}
      {error ? <p className="text-[11px] text-rose-500">{error}</p> : null}
    </div>
  );
}

function PreviewButton({
  component,
  onPress,
}: {
  component: Extract<FlowComponent, { type: "BUTTON" }>;
  onPress: () => void;
}) {
  const props = component.props as unknown as Record<string, unknown>;
  const padding = getSpacing(props, "padding");
  const widthStyle = getWidthStyle(props);
  const heightStyle = getHeightStyle(props);

  const borderRadius =
    props.shape === "circle"
      ? "50%"
      : props.shape === "pill"
        ? 999
        : props.shape === "rounded"
          ? 16
          : typeof props.borderRadius === "number"
            ? props.borderRadius
            : typeof props.style === "object" && props.style && typeof (props.style as { borderRadius?: unknown }).borderRadius === "number"
              ? (props.style as { borderRadius: number }).borderRadius
              : 12;

  const textColor =
    typeof props.style === "object" && props.style && typeof (props.style as { textColor?: unknown }).textColor === "string"
      ? (props.style as { textColor: string }).textColor
      : "#FFFFFF";

  const backgroundColor =
    typeof props.backgroundColor === "string"
      ? props.backgroundColor
      : typeof props.style === "object" &&
          props.style &&
          typeof (props.style as { backgroundColor?: unknown }).backgroundColor === "string"
        ? (props.style as { backgroundColor: string }).backgroundColor
        : "#007AFF";

  return (
    <div style={{ ...getOuterMarginStyle(component), ...widthStyle }}>
      <button
        type="button"
        onClick={onPress}
        className="relative flex items-center justify-center text-center text-sm font-semibold transition-transform duration-150 active:scale-[0.985]"
        style={{
          ...heightStyle,
          width: "100%",
          minHeight: 48,
          backgroundColor,
          color: textColor,
          borderRadius,
          border:
            typeof props.borderWidth === "number" && props.borderWidth > 0
              ? `${props.borderWidth}px solid ${typeof props.borderColor === "string" ? props.borderColor : "#000000"}`
              : undefined,
          boxShadow: getBoxShadow(props),
          paddingTop: padding.top || 14,
          paddingRight: padding.right || 16,
          paddingBottom: padding.bottom || 14,
          paddingLeft: padding.left || 16,
        }}
      >
        {component.props.label}
      </button>
    </div>
  );
}

function PreviewTextInput({
  component,
  snapshot,
  onValueChange,
}: {
  component: Extract<FlowComponent, { type: "TEXT_INPUT" }>;
  snapshot: FlowSessionSnapshot;
  onValueChange: (fieldKey: string, value: PreviewValue) => void;
}) {
  const value = typeof snapshot.values[component.props.fieldKey] === "string"
    ? (snapshot.values[component.props.fieldKey] as string)
    : "";
  const error = snapshot.validationErrorsByField[component.props.fieldKey] ?? null;

  return (
    <div style={getOuterMarginStyle(component)}>
      <PreviewField label={component.props.label} error={error}>
        <input
          value={value}
          onChange={(event) => onValueChange(component.props.fieldKey, event.target.value)}
          placeholder={component.props.placeholder ?? "Enter text..."}
          maxLength={component.props.maxLength}
          type={
            component.props.keyboardType === "email"
              ? "email"
              : component.props.keyboardType === "numeric"
                ? "number"
                : component.props.keyboardType === "phone"
                  ? "tel"
                  : "text"
          }
          className="w-full rounded-2xl border bg-white px-4 py-3 text-sm text-black outline-none transition-colors placeholder:text-black/35 focus:border-black/25"
          style={{
            borderColor: error ? "#f43f5e" : "rgba(15,23,42,0.08)",
            boxShadow: error ? "0 0 0 3px rgba(244,63,94,0.08)" : undefined,
          }}
        />
      </PreviewField>
    </div>
  );
}

function PreviewSingleSelect({
  component,
  snapshot,
  onValueChange,
}: {
  component: Extract<FlowComponent, { type: "SINGLE_SELECT" }>;
  snapshot: FlowSessionSnapshot;
  onValueChange: (fieldKey: string, value: PreviewValue) => void;
}) {
  const value =
    typeof snapshot.values[component.props.fieldKey] === "string"
      ? (snapshot.values[component.props.fieldKey] as string)
      : "";
  const error = snapshot.validationErrorsByField[component.props.fieldKey] ?? null;

  return (
    <div style={getOuterMarginStyle(component)}>
      <PreviewField label={component.props.label} error={error}>
        <div className="space-y-2">
          {component.props.options.map((option) => {
            const active = value === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onValueChange(component.props.fieldKey, option.id)}
                className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors"
                style={{
                  borderColor: active ? "#111827" : "rgba(15,23,42,0.08)",
                  backgroundColor: active ? "#111827" : "#FFFFFF",
                  color: active ? "#FFFFFF" : "#111827",
                }}
              >
                <span>{option.label}</span>
                {active ? <CheckCircle2 size={16} /> : null}
              </button>
            );
          })}
        </div>
      </PreviewField>
    </div>
  );
}

function PreviewMultiSelect({
  component,
  snapshot,
  onValueChange,
}: {
  component: Extract<FlowComponent, { type: "MULTI_SELECT" }>;
  snapshot: FlowSessionSnapshot;
  onValueChange: (fieldKey: string, value: PreviewValue) => void;
}) {
  const currentValue = snapshot.values[component.props.fieldKey];
  const selected = Array.isArray(currentValue)
    ? currentValue.filter((item): item is string => typeof item === "string")
    : [];
  const error = snapshot.validationErrorsByField[component.props.fieldKey] ?? null;

  return (
    <div style={getOuterMarginStyle(component)}>
      <PreviewField label={component.props.label} error={error}>
        <div className="flex flex-wrap gap-2">
          {component.props.options.map((option) => {
            const active = selected.includes(option.id);

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  const nextValue = active
                    ? selected.filter((item) => item !== option.id)
                    : [...selected, option.id];
                  onValueChange(component.props.fieldKey, nextValue);
                }}
                className="rounded-full border px-3 py-2 text-sm transition-colors"
                style={{
                  borderColor: active ? "#111827" : "rgba(15,23,42,0.08)",
                  backgroundColor: active ? "#111827" : "#FFFFFF",
                  color: active ? "#FFFFFF" : "#111827",
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </PreviewField>
    </div>
  );
}

function PreviewSlider({
  component,
  snapshot,
  onValueChange,
}: {
  component: Extract<FlowComponent, { type: "SLIDER" }>;
  snapshot: FlowSessionSnapshot;
  onValueChange: (fieldKey: string, value: PreviewValue) => void;
}) {
  const rawValue = snapshot.values[component.props.fieldKey];
  const value =
    typeof rawValue === "number"
      ? rawValue
      : component.props.defaultValue ?? component.props.min;
  const min = component.props.min;
  const max = component.props.max;
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div style={getOuterMarginStyle(component)}>
      <PreviewField label={component.props.label}>
        <div className="rounded-2xl border border-black/8 bg-white px-4 py-4">
          <input
            type="range"
            min={min}
            max={max}
            step={component.props.step ?? 1}
            value={value}
            onChange={(event) => onValueChange(component.props.fieldKey, Number(event.target.value))}
            className="w-full accent-black"
            style={{
              background: `linear-gradient(to right, #111827 0%, #111827 ${percent}%, #E5E7EB ${percent}%, #E5E7EB 100%)`,
            }}
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-black/45">
            <span>{component.props.minLabel ?? min}</span>
            <span className="font-semibold text-black">{value}</span>
            <span>{component.props.maxLabel ?? max}</span>
          </div>
        </div>
      </PreviewField>
    </div>
  );
}

function PreviewProgressBar({
  component,
  snapshot,
}: {
  component: Extract<FlowComponent, { type: "PROGRESS_BAR" }>;
  snapshot: FlowSessionSnapshot;
}) {
  const height = component.props.height ?? 8;
  const progress =
    snapshot.totalScreens > 0
      ? Math.min(100, ((snapshot.currentScreenIndex + 1) / snapshot.totalScreens) * 100)
      : 0;

  return (
    <div style={getOuterMarginStyle(component)}>
      <div
        className="overflow-hidden rounded-full"
        style={{
          height,
          backgroundColor: component.props.backgroundColor ?? "#E5E7EB",
        }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: component.props.color ?? "#111827",
          }}
        />
      </div>
    </div>
  );
}

function PreviewPageIndicator({
  component,
  snapshot,
}: {
  component: Extract<FlowComponent, { type: "PAGE_INDICATOR" }>;
  snapshot: FlowSessionSnapshot;
}) {
  const dotSize = component.props.size ?? 8;
  const count = Math.max(snapshot.totalScreens, 1);

  return (
    <div style={getOuterMarginStyle(component)}>
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: count }).map((_, index) => (
          <span
            key={index}
            className="rounded-full transition-all duration-300"
            style={{
              width: dotSize,
              height: dotSize,
              backgroundColor:
                index === snapshot.currentScreenIndex
                  ? component.props.activeColor ?? "#111827"
                  : component.props.inactiveColor ?? "#D1D5DB",
              opacity: index === snapshot.currentScreenIndex ? 1 : 0.7,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PreviewIcon({
  component,
}: {
  component: Extract<FlowComponent, { type: "ICON" }>;
}) {
  const LucideIcon =
    (icons as Record<string, ComponentType<{ size?: number; color?: string }>>)[component.props.name] ||
    Smile;

  return (
    <div style={getOuterMarginStyle(component)}>
      <LucideIcon
        size={component.props.size ?? 24}
        color={component.props.color ?? "#111827"}
      />
    </div>
  );
}

function PreviewLottie({
  component,
}: {
  component: Extract<FlowComponent, { type: "LOTTIE" }>;
}) {
  return (
    <div style={getOuterMarginStyle(component)}>
      <div
        className="relative overflow-hidden rounded-3xl border border-black/8 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.75),_rgba(255,255,255,0.35)_40%,_rgba(241,245,249,0.9))] px-4 py-6"
        style={{
          width: component.props.width ?? "100%",
          height: component.props.height ?? 180,
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent,rgba(255,255,255,0.6),transparent)] animate-[pulse_2.4s_ease-in-out_infinite]" />
        <div className="relative flex h-full flex-col items-center justify-center gap-2 text-center">
          <Sparkles size={20} className="text-black/55" />
          <p className="text-sm font-semibold text-black/75">Lottie Preview</p>
          <p className="max-w-48 text-xs leading-relaxed text-black/45">
            This block will animate in the app runtime. Arlo is showing a stylized placeholder here.
          </p>
        </div>
      </div>
    </div>
  );
}

function PreviewCustomComponent({
  component,
}: {
  component: Extract<FlowComponent, { type: "CUSTOM_COMPONENT" }>;
}) {
  return (
    <div style={getOuterMarginStyle(component)}>
      <div className="rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/8 px-4 py-4 text-fuchsia-950">
        <div className="flex items-center gap-2">
          <Puzzle size={16} className="text-fuchsia-700" />
          <span className="text-sm font-semibold">
            {component.props.registryKey || "Custom component"}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-fuchsia-950/70">
          Custom components render in the native SDK. The builder preview shows a placeholder so
          you can still test flow navigation around it.
        </p>
      </div>
    </div>
  );
}

function FlowPreviewComponent({
  component,
  snapshot,
  onValueChange,
  onPressButton,
}: {
  component: FlowComponent;
  snapshot: FlowSessionSnapshot;
  onValueChange: (fieldKey: string, value: PreviewValue) => void;
  onPressButton: (componentId: string) => void;
}) {
  switch (component.type) {
    case "BUTTON":
      return <PreviewButton component={component} onPress={() => onPressButton(component.id)} />;
    case "TEXT_INPUT":
      return (
        <PreviewTextInput
          component={component}
          snapshot={snapshot}
          onValueChange={onValueChange}
        />
      );
    case "SINGLE_SELECT":
      return (
        <PreviewSingleSelect
          component={component}
          snapshot={snapshot}
          onValueChange={onValueChange}
        />
      );
    case "MULTI_SELECT":
      return (
        <PreviewMultiSelect
          component={component}
          snapshot={snapshot}
          onValueChange={onValueChange}
        />
      );
    case "SLIDER":
      return (
        <PreviewSlider
          component={component}
          snapshot={snapshot}
          onValueChange={onValueChange}
        />
      );
    case "PROGRESS_BAR":
      return <PreviewProgressBar component={component} snapshot={snapshot} />;
    case "PAGE_INDICATOR":
      return <PreviewPageIndicator component={component} snapshot={snapshot} />;
    case "ICON":
      return <PreviewIcon component={component} />;
    case "LOTTIE":
      return <PreviewLottie component={component} />;
    case "CUSTOM_COMPONENT":
      return <PreviewCustomComponent component={component} />;
    default:
      return (
        <PhonePreviewComponent
          component={component}
          interactionMode="preview"
          isSelected={false}
        />
      );
  }
}

function PreviewNoticeBadge({ notice }: { notice: PreviewNotice }) {
  if (!notice) return null;

  const palette =
    notice.tone === "error"
      ? "border-rose-400/25 bg-rose-500/12 text-rose-100"
      : notice.tone === "success"
        ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
        : "border-white/15 bg-white/10 text-white";

  const Icon =
    notice.tone === "error"
      ? AlertCircle
      : notice.tone === "success"
        ? CheckCircle2
        : ExternalLink;

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${palette}`}>
      <Icon size={14} />
      <span>{notice.message}</span>
    </div>
  );
}

function createPreviewEffectHandlers(
  setNotice: Dispatch<SetStateAction<PreviewNotice>>,
  onAnalyticsEvent?: (event: ArloAnalyticsEvent) => void,
): FlowBridgeHandlers {
  return {
    onAnalyticsEvent: ({ event }) => {
      onAnalyticsEvent?.(event);
    },
    onOpenUrl: ({ url }) => {
      window.open(url, "_blank", "noopener,noreferrer");
      setNotice({
        tone: "info",
        message: `Opened ${url}`,
      });
    },
    onDeepLink: ({ url }) => {
      setNotice({
        tone: "info",
        message: `Deep link triggered: ${url}`,
      });
    },
    onCustomEvent: ({ eventName }) => {
      setNotice({
        tone: "info",
        message: `Custom event fired: ${eventName}`,
      });
    },
    onRequestNotifications: () => {
      setNotice({
        tone: "info",
        message: "Notifications request triggered",
      });
    },
    onRequestTracking: () => {
      setNotice({
        tone: "info",
        message: "Tracking request triggered",
      });
    },
    onRestorePurchases: () => {
      setNotice({
        tone: "info",
        message: "Restore purchases triggered",
      });
    },
    onValidationFailed: ({ effect: validationEffect }) => {
      setNotice({
        tone: "error",
        message: validationEffect.errors[0]?.message ?? "Fix the highlighted fields to continue.",
      });
    },
    onCompleted: () => {
      setNotice({
        tone: "success",
        message: "Flow completed",
      });
    },
    onDismissed: () => {
      setNotice({
        tone: "info",
        message: "Flow dismissed",
      });
    },
  };
}

export function FlowPreviewOverlay({
  open,
  onClose,
  flowId,
  flowSlug,
  projectId,
  config,
  startScreenId,
  device,
  orientation,
}: {
  open: boolean;
  onClose: () => void;
  flowId: string;
  flowSlug: string;
  projectId: string | null;
  config: FlowConfig;
  startScreenId?: string;
  device: DevicePreset;
  orientation: Orientation;
}) {
  const [sessionSeed, setSessionSeed] = useState(0);
  const [snapshot, setSnapshot] = useState<FlowSessionSnapshot | null>(null);
  const [notice, setNotice] = useState<PreviewNotice>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  const frame = useMemo(
    () => getFrameDimensions(device, orientation),
    [device, orientation],
  );
  const previewScale = useMemo(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0) return 1;

    const horizontalPadding = 96;
    const verticalPadding = 176;
    const availableWidth = Math.max(viewportSize.width - horizontalPadding, 240);
    const availableHeight = Math.max(viewportSize.height - verticalPadding, 240);

    return Math.min(
      availableWidth / Math.max(frame.frameWidth, 1),
      availableHeight / Math.max(frame.frameHeight, 1),
      1,
    );
  }, [frame.frameHeight, frame.frameWidth, viewportSize.height, viewportSize.width]);
  const response = useMemo<SDKFlowResponse>(
    () => ({
      flow: {
        slug: flowSlug,
        version: 0,
        config: config as SDKFlowResponse["flow"]["config"],
      },
    }),
    [config, flowSlug],
  );
  const initialValues = useMemo(() => collectPreviewInitialValues(config), [config]);
  const trackPreviewAnalyticsEvent = useCallback(
    (event: ArloAnalyticsEvent) => {
      void recordPreviewAnalyticsEvent({ flowId, event }).catch((error) => {
        console.error("Failed to record preview analytics event", error);
      });
    },
    [flowId],
  );
  const session = useMemo(() => {
    void sessionSeed;
    return createFlowSession(response, { initialValues, projectId });
  }, [initialValues, projectId, response, sessionSeed]);
  const effectHandlers = useMemo(
    () => createPreviewEffectHandlers(setNotice, trackPreviewAnalyticsEvent),
    [trackPreviewAnalyticsEvent],
  );

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const syncViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    syncViewportSize();
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", syncViewportSize);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", syncViewportSize);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const updateSnapshot = () => {
      if (cancelled) return;
      startTransition(() => {
        setSnapshot(session.getSnapshot());
      });
    };

    const applyEffect = async (effect: FlowSessionEffect) => {
      await applyFlowSessionEffect(session, effect, effectHandlers);

      updateSnapshot();
    };

    const boot = async () => {
      setNotice(null);
      await applyEffect(session.start());

      if (startScreenId) {
        try {
          await applyEffect(session.goToScreenId(startScreenId));
        } catch {
          updateSnapshot();
        }
      }
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, [effectHandlers, open, session, startScreenId]);

  if (!open || !snapshot) return null;

  const currentScreen = snapshot.status === "active" ? snapshot.currentScreen : null;
  const fallbackScreen = snapshot.currentScreen;
  const screenPadding = getScreenPadding(currentScreen ?? fallbackScreen);
  const screenTransition = resolveScreenTransition(config, currentScreen);
  const screenBgColor = (currentScreen ?? fallbackScreen)?.style?.backgroundColor ?? "#FFFFFF";
  const screenProgress =
    snapshot.totalScreens > 0
      ? ((snapshot.currentScreenIndex + 1) / snapshot.totalScreens) * 100
      : 0;
  const sortedComponents = currentScreen
    ? sortComponentsForFlow(currentScreen)
    : [];
  const mainComponents = sortedComponents.filter((component) => {
    const props = component.props as { position?: string };
    return props.position !== "bottom";
  });
  const bottomComponents = sortedComponents.filter((component) => {
    const props = component.props as { position?: string };
    return props.position === "bottom";
  });

  const renderScreenComponent = (component: FlowComponent) => (
    <AnimatedWrapper
      componentId={component.id}
      animation={component.animation}
      screenIndex={snapshot.currentScreenIndex}
    >
      <FlowPreviewComponent
        component={component}
        snapshot={snapshot}
        onValueChange={(fieldKey, value) => {
          const nextSnapshot = session.setValue(fieldKey, value);
          session.validateCurrentScreen();
          const interactiveComponent = findInteractiveComponent(
            nextSnapshot.currentScreen,
            fieldKey,
          );

          if (interactiveComponent) {
            trackPreviewAnalyticsEvent(
              createComponentInteractionAnalyticsEvent(
                nextSnapshot,
                interactiveComponent as Parameters<
                  typeof createComponentInteractionAnalyticsEvent
                >[1],
                value,
              ),
            );
          }

          startTransition(() => {
            setSnapshot(session.getSnapshot());
          });
        }}
        onPressButton={(componentId) => {
          const currentSnapshot = session.getSnapshot();
          const buttonComponent = findButtonComponent(
            currentSnapshot.currentScreen,
            componentId,
          );

          if (buttonComponent) {
            trackPreviewAnalyticsEvent(
              createButtonPressedAnalyticsEvent(
                currentSnapshot,
                buttonComponent as Parameters<typeof createButtonPressedAnalyticsEvent>[1],
              ),
            );
          }

          const effect = session.pressButton(componentId);
          void applyFlowSessionEffect(session, effect, effectHandlers).finally(() => {
            startTransition(() => {
              setSnapshot(session.getSnapshot());
            });
          });
        }}
      />
    </AnimatedWrapper>
  );

  const screenContent = currentScreen ? (
    currentScreen.layoutMode === "absolute" ? (
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScreenTransitionWrapper
          screenIndex={snapshot.currentScreenIndex}
          transition={screenTransition}
        >
          <div
            className="relative h-full w-full"
            style={{
              backgroundColor: screenBgColor,
              backgroundImage: currentScreen.style?.backgroundImage,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div
              className="absolute"
              style={{
                top: screenPadding.top,
                right: screenPadding.right,
                bottom: screenPadding.bottom,
                left: screenPadding.left,
              }}
            >
              {sortedComponents.map((component) => (
                <div
                  key={component.id}
                  className="absolute left-0 top-0"
                  style={{
                    width: component.layout?.width,
                    height: component.layout?.height,
                    display: component.layout?.visible === false ? "none" : undefined,
                    zIndex: component.layout?.zIndex ?? component.order,
                    transform: `translate3d(${component.layout?.x ?? 0}px, ${component.layout?.y ?? 0}px, 0px) rotate(${component.layout?.rotation ?? 0}deg)`,
                    transformOrigin: "top left",
                  }}
                >
                  {renderScreenComponent(component)}
                </div>
              ))}
            </div>
          </div>
        </ScreenTransitionWrapper>
      </div>
    ) : (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ScreenTransitionWrapper
          screenIndex={snapshot.currentScreenIndex}
          transition={screenTransition}
        >
          <div
            className="flex min-h-full flex-col"
            style={{
              backgroundColor: screenBgColor,
              backgroundImage: currentScreen.style?.backgroundImage,
              backgroundSize: "cover",
              backgroundPosition: "center",
              justifyContent: currentScreen.style?.justifyContent ?? "flex-start",
              alignItems: currentScreen.style?.alignItems ?? "stretch",
              paddingTop: screenPadding.top,
              paddingRight: screenPadding.right,
              paddingBottom: bottomComponents.length > 0 ? 12 : screenPadding.bottom,
              paddingLeft: screenPadding.left,
            }}
          >
            {mainComponents.length === 0 && bottomComponents.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5">
                  <Smartphone size={20} className="text-black/25" />
                </div>
                <p className="text-sm font-medium text-black/45">This screen is empty</p>
                <p className="mt-1 text-xs text-black/30">Add blocks in the builder to preview them here.</p>
              </div>
            ) : null}

            {mainComponents.map((component) => (
              <div key={component.id}>{renderScreenComponent(component)}</div>
            ))}
          </div>
        </ScreenTransitionWrapper>
      </div>
    )
  ) : (
    <div
      className="flex flex-1 flex-col items-center justify-center px-8 text-center"
      style={{ backgroundColor: screenBgColor }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/6">
        <CheckCircle2 size={26} className="text-emerald-500" />
      </div>
      <p className="mt-4 text-lg font-semibold text-black">Preview finished</p>
      <p className="mt-2 max-w-64 text-sm leading-relaxed text-black/55">
        The current flow reached its end state. You can restart it from the same screen you launched.
      </p>
      <button
        type="button"
        onClick={() => setSessionSeed((value) => value + 1)}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-transform duration-150 active:scale-[0.985]"
      >
        <RotateCcw size={14} />
        Restart preview
      </button>
    </div>
  );

  const bottomContent =
    currentScreen && currentScreen.layoutMode !== "absolute" && bottomComponents.length > 0 ? (
      <div
        className="shrink-0"
        style={{
          backgroundColor: screenBgColor,
          paddingTop: 12,
          paddingRight: screenPadding.right,
          paddingBottom: screenPadding.bottom,
          paddingLeft: screenPadding.left,
        }}
      >
        <div className="flex flex-col gap-2">
          {bottomComponents.map((component) => (
            <div key={component.id}>{renderScreenComponent(component)}</div>
          ))}
        </div>
      </div>
    ) : null;

  const progressBar = config.settings?.showProgressBar ? (
    <div className="h-1 shrink-0 bg-black/6">
      <div
        className="h-full transition-[width] duration-300"
        style={{
          width: `${screenProgress}%`,
          backgroundColor: config.settings?.progressBarColor ?? "#111827",
        }}
      />
    </div>
  ) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[radial-gradient(circle_at_top,_rgba(29,78,216,0.14),_transparent_28%),linear-gradient(180deg,_rgba(2,6,23,0.94),_rgba(2,6,23,0.98))]"
      role="dialog"
      aria-modal="true"
      aria-label="Flow preview"
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
              <Play size={15} className="fill-current" />
            </div>
            <div>
              <p className="text-sm font-semibold">Live Preview</p>
              <p className="text-xs text-white/55">
                Running the current draft with navigation, validation, and transitions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/55">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              {device.name}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 capitalize">
              {orientation}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              {snapshot.currentScreenIndex + 1} / {Math.max(snapshot.totalScreens, 1)}
            </span>
            {fallbackScreen ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                {fallbackScreen.name}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PreviewNoticeBadge notice={notice} />
          <button
            type="button"
            onClick={() => setSessionSeed((value) => value + 1)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <RotateCcw size={14} />
            Restart
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white transition-colors hover:bg-white/10"
            aria-label="Close preview"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-6 py-8">
        <div className="relative flex max-h-full w-full items-center justify-center">
          <div
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: "center center",
            }}
          >
            <DeviceFrame
              device={device}
              orientation={orientation}
              frame={frame}
              screenBgColor={screenBgColor}
              progressBar={progressBar}
              screenContent={
                <>
                  {screenContent}
                  {bottomContent}
                </>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
