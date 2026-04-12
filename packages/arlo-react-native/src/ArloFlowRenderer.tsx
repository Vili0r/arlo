import { startTransition, useEffect, useMemo, useState, useRef } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const SafeView: any = SafeAreaView;

import {
  applyFlowSessionEffect,
  createButtonPressedAnalyticsEvent,
  createComponentInteractionAnalyticsEvent,
} from "arlo-sdk";
import type {
  FlowComponent,
  FlowBridgeHandlers,
  FlowSessionSnapshot,
  Screen,
} from "arlo-sdk";

import type {
  ArloComponentRenderContext,
  ArloComponentRendererMap,
  ArloFlowRendererProps,
  ArloIconRenderer,
} from "./types";

// ─── Theme Detection ────────────────────────────────────────────────────────

interface ScreenTheme {
  isLight: boolean;
  textPrimary: string;
  textSecondary: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  pillBackground: string;
  pillBorder: string;
  pillText: string;
  pillSelectedBackground: string;
  pillSelectedBorder: string;
  pillSelectedText: string;
  sliderCardBackground: string;
  sliderCardBorder: string;
  sliderValueText: string;
  progressTrackBackground: string;
  progressFillColor: string;
  indicatorActive: string;
  indicatorInactive: string;
  placeholderText: string;
  errorText: string;
  errorBorder: string;
}

const LIGHT_THEME: ScreenTheme = {
  isLight: true,
  textPrimary: "#111111",
  textSecondary: "#555555",
  inputBackground: "#ffffff",
  inputBorder: "#d4d4d8",
  inputText: "#111111",
  pillBackground: "#ffffff",
  pillBorder: "#d4d4d8",
  pillText: "#111111",
  pillSelectedBackground: "#111111",
  pillSelectedBorder: "#111111",
  pillSelectedText: "#ffffff",
  sliderCardBackground: "#f4f4f5",
  sliderCardBorder: "#e4e4e7",
  sliderValueText: "#111111",
  progressTrackBackground: "#e4e4e7",
  progressFillColor: "#111111",
  indicatorActive: "#111111",
  indicatorInactive: "#d4d4d8",
  placeholderText: "#a1a1aa",
  errorText: "#dc2626",
  errorBorder: "#f87171",
};

const DARK_THEME: ScreenTheme = {
  isLight: false,
  textPrimary: "#ffffff",
  textSecondary: "#a1a1aa",
  inputBackground: "#141419",
  inputBorder: "#2c2c34",
  inputText: "#ffffff",
  pillBackground: "#15151b",
  pillBorder: "#30303a",
  pillText: "#f1f1f3",
  pillSelectedBackground: "#ffffff",
  pillSelectedBorder: "#ffffff",
  pillSelectedText: "#111111",
  sliderCardBackground: "#15151b",
  sliderCardBorder: "#2b2b34",
  sliderValueText: "#ffffff",
  progressTrackBackground: "#26262b",
  progressFillColor: "#ffffff",
  indicatorActive: "#ffffff",
  indicatorInactive: "#4b4b55",
  placeholderText: "#7a7a85",
  errorText: "#f59cb3",
  errorBorder: "#f36b8d",
};

type InteractiveComponent = Extract<
  FlowComponent,
  { type: "TEXT_INPUT" | "SINGLE_SELECT" | "MULTI_SELECT" | "SLIDER" }
>;

function findInteractiveComponent(
  screen: Screen | null,
  fieldKey: string
): InteractiveComponent | null {
  if (!screen) {
    return null;
  }

  return (
    screen.components.find((component): component is InteractiveComponent => {
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
  componentId: string
): Extract<FlowComponent, { type: "BUTTON" }> | null {
  if (!screen) {
    return null;
  }

  return (
    screen.components.find(
      (component): component is Extract<FlowComponent, { type: "BUTTON" }> =>
        component.type === "BUTTON" && component.id === componentId
    ) ?? null
  );
}

function emitAnalyticsEvent(
  handlers: FlowBridgeHandlers | undefined,
  session: ArloComponentRenderContext["session"],
  snapshot: FlowSessionSnapshot,
  event: ReturnType<typeof createButtonPressedAnalyticsEvent> | ReturnType<typeof createComponentInteractionAnalyticsEvent>
): void {
  if (!handlers?.onAnalyticsEvent) {
    return;
  }

  void handlers.onAnalyticsEvent({
    session,
    snapshot,
    event,
  });
}

/**
 * Compute relative luminance of a color.
 * Returns a value between 0 (black) and 1 (white).
 */
function getRelativeLuminance(color: string): number {
  if (!color || color === "transparent") return 1;

  const hex = color;

  // Handle rgba/rgb
  if (color.startsWith("rgb")) {
    const matches = color.match(/\d+(\.\d+)?/g);
    if (!matches || matches.length < 3) return 1;
    const r = parseInt(matches[0], 10) / 255;
    const g = parseInt(matches[1], 10) / 255;
    const b = parseInt(matches[2], 10) / 255;
    if (matches.length >= 4 && parseFloat(matches[3]) === 0) return 1;
    const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  }

  // Handle named colors (basic)
  if (color === "white") return 1;
  if (color === "black") return 0;

  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  
  if (clean.length < 6) return 1;
  
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  if (isNaN(r) || isNaN(g) || isNaN(b)) return 1;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getThemeForScreen(screen: Screen): ScreenTheme {
  const bg = screen.style?.backgroundColor;
  if (!bg || bg === "transparent") return LIGHT_THEME;
  const luminance = getRelativeLuminance(bg);
  return luminance > 0.5 ? LIGHT_THEME : DARK_THEME;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const IMPORTED_SCREEN_KEYS = new Set([
  "__arlo_imported_code__",
  "__arlo_imported_figma__",
]);

function isImportedPreviewPayload(
  value: unknown
): value is { kind: "imported-code" | "imported-figma"; version: 1; previewScreen?: Screen } {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      ["imported-code", "imported-figma"].includes(
        String((value as { kind?: unknown }).kind ?? "")
      ) &&
      (value as { version?: unknown }).version === 1
  );
}

function getImportedPreviewScreen(screen: Screen): Screen | null {
  if (!screen.customScreenKey || !IMPORTED_SCREEN_KEYS.has(screen.customScreenKey)) return null;
  return isImportedPreviewPayload(screen.customPayload) && screen.customPayload.previewScreen
    ? screen.customPayload.previewScreen
    : null;
}

function getScreenContainerStyle(screen: Screen) {
  const padding = getScreenPadding(screen);

  return {
    backgroundColor: screen.style?.backgroundColor ?? "#FFFFFF",
    paddingTop: padding.top,
    paddingBottom: padding.bottom,
    paddingRight: padding.right,
    paddingLeft: padding.left,
    justifyContent: screen.style?.justifyContent ?? "flex-start",
    alignItems: screen.style?.alignItems ?? "stretch",
  } as const;
}

function getScreenPadding(screen: Screen) {
  const p = screen.style?.padding;
  const pV = screen.style?.paddingVertical ?? p ?? (screen.layoutMode === "absolute" ? 0 : 24);
  const pH = screen.style?.paddingHorizontal ?? p ?? (screen.layoutMode === "absolute" ? 0 : 24);

  return {
    top: screen.style?.paddingTop ?? pV,
    right: screen.style?.paddingRight ?? pH,
    bottom: screen.style?.paddingBottom ?? pV,
    left: screen.style?.paddingLeft ?? pH,
  };
}

function splitAutoLayoutComponents(components: FlowComponent[]) {
  return {
    main: components.filter((component) => {
      const props = component.props as { position?: string };
      return props.position !== "bottom";
    }),
    bottom: components.filter((component) => {
      const props = component.props as { position?: string };
      return props.position === "bottom";
    }),
  };
}

/** Components that size to their own content rather than stretching to fill width */
const SELF_SIZING_TYPES = new Set(["ICON_LIBRARY", "ICON", "PAGE_INDICATOR"]);

function getSpacing(
  props: Record<string, unknown>,
  prefix: "padding" | "margin"
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

function getComponentMarginStyle(component: FlowComponent) {
  const props = component.props as Record<string, unknown>;
  const margin = getSpacing(props, "margin");

  return {
    marginTop: margin.top || undefined,
    marginRight: margin.right || undefined,
    marginBottom: margin.bottom || undefined,
    marginLeft: margin.left || undefined,
  };
}

function getComponentWidthMode(component: FlowComponent): "fill" | "fit" | "fixed" {
  const props = component.props as Record<string, unknown>;

  if (props.widthMode === "fill" || props.widthMode === "fit" || props.widthMode === "fixed") {
    return props.widthMode as "fill" | "fit" | "fixed";
  }

  if (component.type === "BUTTON" || SELF_SIZING_TYPES.has(component.type)) {
    return "fit";
  }

  return "fill";
}

function getFixedComponentWidth(component: FlowComponent): number | undefined {
  const props = component.props as Record<string, unknown>;

  if (typeof props.width === "number") return props.width;
  if (typeof props.fixedWidth === "number") return props.fixedWidth;

  if (component.type === "BUTTON") return 300;
  if (component.type === "TEXT") return 200;

  return undefined;
}

function getAutoLayoutWrapperStyle(
  component: FlowComponent,
  parentAlignItems: "flex-start" | "center" | "flex-end" | "stretch" = "stretch"
) {
  const widthMode = getComponentWidthMode(component);

  if (widthMode === "fill") {
    return {
      alignSelf: "stretch" as const,
    };
  }

  const alignSelf =
    parentAlignItems === "center"
      ? "center"
      : parentAlignItems === "flex-end"
        ? "flex-end"
        : "flex-start";

  if (widthMode === "fixed") {
    return {
      width: getFixedComponentWidth(component),
      alignSelf,
    };
  }

  return {
    alignSelf,
  };
}

function getComponentWrapperStyle(
  component: FlowComponent,
  isAbsoluteScreen: boolean,
  parentAlignItems: "flex-start" | "center" | "flex-end" | "stretch" = "stretch"
) {
  const layout = component.layout;
  const blockStyle = SELF_SIZING_TYPES.has(component.type) ? {} : styles.componentBlock;
  const marginStyle = getComponentMarginStyle(component);

  if (!layout) {
    return isAbsoluteScreen
      ? { position: "absolute" as const, zIndex: component.order }
      : {
          ...blockStyle,
          ...marginStyle,
          ...getAutoLayoutWrapperStyle(component, parentAlignItems),
        };
  }

  const baseStyle = {
    display: layout.visible === false ? ("none" as const) : ("flex" as const),
    zIndex: layout.zIndex ?? component.order,
  };

  if (!isAbsoluteScreen && layout.position !== "absolute") {
    return {
      ...blockStyle,
      ...marginStyle,
      ...getAutoLayoutWrapperStyle(component, parentAlignItems),
      ...baseStyle,
    };
  }

  return {
    ...baseStyle,
    position: "absolute" as const,
    left: layout.x ?? marginStyle.marginLeft ?? 0,
    top: layout.y ?? marginStyle.marginTop ?? 0,
    width: layout.width,
    height: layout.height,
    transform: layout.rotation ? [{ rotate: `${layout.rotation}deg` }] : undefined,
  };
}

function coerceStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function coerceStringArrayValue(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function coerceNumberValue(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

function renderFallbackIcon(name: string, size: number, color: string) {
  const normalized = name.toLowerCase().replace(/[-_]/g, "");

  let glyph = "\u2022";
  if (normalized.includes("chevronleft") || normalized === "back") glyph = "\u2039";
  else if (normalized.includes("arrowleft") || normalized.endsWith("left")) glyph = "\u2190";
  else if (normalized.includes("chevronright") || normalized === "next") glyph = "\u203A";
  else if (normalized.includes("arrowright") || normalized.endsWith("right")) glyph = "\u2192";
  else if (normalized === "x" || normalized.includes("close")) glyph = "\u2715";
  else if (normalized.includes("check")) glyph = "\u2713";
  else if (normalized.includes("plus")) glyph = "+";
  else if (normalized.includes("minus")) glyph = "\u2212";

  return (
    <Text
      style={{
        fontSize: size,
        color,
        textAlign: "center",
        includeFontPadding: false,
        lineHeight: size,
      }}
    >
      {glyph}
    </Text>
  );
}

function getFieldError(snapshot: FlowSessionSnapshot, fieldKey: string): string | null {
  return snapshot.validationErrorsByField[fieldKey] ?? null;
}

// ─── Default Components ─────────────────────────────────────────────────────

function DefaultTextComponent({
  component,
  theme,
  parentAlignItems = "stretch",
}: {
  component: Extract<FlowComponent, { type: "TEXT" }>;
  theme: ScreenTheme;
  parentAlignItems?: "flex-start" | "center" | "flex-end" | "stretch";
}) {
  const defaultTextAlign =
    parentAlignItems === "center"
      ? "center"
      : parentAlignItems === "flex-end"
        ? "right"
        : "left";

  return (
    <Text
      style={{
        color: component.props.color ?? theme.textPrimary,
        fontSize: component.props.fontSize ?? 16,
        fontWeight: component.props.fontWeight ?? "normal",
        textAlign: component.props.textAlign ?? defaultTextAlign,
        lineHeight:
          component.props.lineHeight && component.props.fontSize
            ? component.props.lineHeight * component.props.fontSize
            : undefined,
        opacity: component.props.opacity ?? 1,
      }}
    >
      {component.props.content}
    </Text>
  );
}

function DefaultImageComponent({ component }: { component: Extract<FlowComponent, { type: "IMAGE" }> }) {
  return (
    <Image
      source={{ uri: component.props.src }}
      alt={component.props.alt ?? ""}
      accessibilityLabel={component.props.alt}
      resizeMode={component.props.resizeMode ?? "cover"}
      style={{
        width: component.props.width ?? "100%",
        height: component.props.height ?? 220,
        borderRadius: component.props.borderRadius ?? 0,
      }}
    />
  );
}

function DefaultIconLibraryComponent({
  component,
  iconRenderer,
}: {
  component: Extract<FlowComponent, { type: "ICON_LIBRARY" }>;
  iconRenderer?: ArloIconRenderer;
}) {
  const props = component.props as Record<string, unknown>;
  const iconName = (props.iconName as string) ?? "";
  const size = (props.size as number) ?? 24;
  const color = (props.color as string) ?? "#ffffff";
  const bgColor = (props.backgroundColor as string) ?? undefined;
  const width = (props.width as number) ?? size + 16;
  const height = (props.height as number) ?? size + 16;
  const opacity = (props.opacity as number) ?? 1;
  const borderRadius = Math.min(width, height) / 2;

  const iconContent = iconRenderer
    ? iconRenderer(iconName, size, color)
    : renderFallbackIcon(iconName, size, color);

  return (
    <View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: bgColor,
        opacity,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: (props.paddingVertical as number) ?? 0,
        paddingHorizontal: (props.paddingHorizontal as number) ?? 0,
        marginVertical: (props.marginVertical as number) ?? 0,
        marginHorizontal: (props.marginHorizontal as number) ?? 0,
      }}
    >
      {iconContent}
    </View>
  );
}

function DefaultButtonComponent({
  component,
  onPress,
  iconRenderer,
}: {
  component: Extract<FlowComponent, { type: "BUTTON" }>;
  onPress: () => Promise<void>;
  iconRenderer?: ArloIconRenderer;
}) {
  const props = component.props as Record<string, unknown>;
  const padding = getSpacing(props, "padding");
  const showIcon = props.showIcon === true;
  const iconName = (props.iconName as string) ?? "";
  const iconPosition = (props.iconPosition as string) ?? "left";
  const iconSize = (props.iconSize as number) ?? 20;
  const textColor = (props.textColor as string) ?? component.props.style?.textColor ?? "#ffffff";
  const iconColor = (props.iconColor as string) ?? textColor;
  const iconSpacing = (props.iconSpacing as number) ?? 8;
  const fontSize = (props.fontSize as number) ?? 16;
  const fontWeight = (
    props.fontWeight as
      | "normal"
      | "bold"
      | "100"
      | "200"
      | "300"
      | "400"
      | "500"
      | "600"
      | "700"
      | "800"
      | "900"
      | undefined
  ) ?? "600";
  const widthMode = getComponentWidthMode(component);
  const heightMode =
    props.heightMode === "fit" || props.heightMode === "fill" || props.heightMode === "fixed"
      ? (props.heightMode as "fit" | "fill" | "fixed")
      : "fit";
  const backgroundColor =
    (props.backgroundColor as string) ?? component.props.style?.backgroundColor ?? "#007AFF";
  const borderRadius =
    props.shape === "circle"
      ? 999
      : props.shape === "pill"
        ? 999
        : props.shape === "rounded"
          ? 16
          : (props.borderRadius as number) ?? component.props.style?.borderRadius ?? 14;
  const borderColor =
    (props.borderColor as string) ?? component.props.style?.borderColor ?? "transparent";
  const borderWidth =
    (props.borderWidth as number) ?? component.props.style?.borderWidth ?? 0;
  const fixedHeight =
    typeof props.height === "number"
      ? props.height
      : typeof props.fixedHeight === "number"
        ? props.fixedHeight
        : 48;

  const iconElement =
    showIcon && iconName
      ? (iconRenderer
          ? iconRenderer(iconName, iconSize, iconColor)
          : renderFallbackIcon(iconName, iconSize, iconColor))
      : null;

  const isIconOnly = showIcon && iconPosition === "only";
  const isCircularIconOnlyButton = props.shape === "circle" && isIconOnly;

  return (
    <Pressable
      onPress={() => {
        void onPress();
      }}
      style={[
        styles.button,
        {
          width: isCircularIconOnlyButton ? fixedHeight : widthMode === "fit" ? undefined : "100%",
          minHeight: isCircularIconOnlyButton ? fixedHeight : heightMode === "fit" ? 48 : undefined,
          height: isCircularIconOnlyButton ? fixedHeight : heightMode === "fixed" ? fixedHeight : undefined,
          backgroundColor,
          borderRadius,
          borderColor,
          borderWidth,
          paddingTop: isCircularIconOnlyButton ? 0 : padding.top || 14,
          paddingRight: isCircularIconOnlyButton ? 0 : padding.right || 16,
          paddingBottom: isCircularIconOnlyButton ? 0 : padding.bottom || 14,
          paddingLeft: isCircularIconOnlyButton ? 0 : padding.left || 16,
        },
      ]}
    >
      <View
        style={[
          styles.buttonContent,
          {
            width: widthMode === "fit" ? undefined : "100%",
            gap: isIconOnly ? 0 : iconSpacing,
          },
        ]}
      >
        {iconElement && (iconPosition === "left" || isIconOnly) ? iconElement : null}
        {!isIconOnly ? (
          <Text
            style={[
              styles.buttonText,
              {
                color: textColor,
                fontSize,
                fontWeight,
                textAlign: (props.textAlign as "left" | "center" | "right") ?? "center",
              },
            ]}
          >
            {component.props.label}
          </Text>
        ) : null}
        {iconElement && iconPosition === "right" ? iconElement : null}
      </View>
    </Pressable>
  );
}

function DefaultTextInputComponent({
  component,
  context,
  theme,
  parentAlignItems = "stretch",
}: {
  component: Extract<FlowComponent, { type: "TEXT_INPUT" }>;
  context: ArloComponentRenderContext;
  theme: ScreenTheme;
  parentAlignItems?: "flex-start" | "center" | "flex-end" | "stretch";
}) {
  const value = coerceStringValue(context.snapshot.values[component.props.fieldKey]);
  const error = getFieldError(context.snapshot, component.props.fieldKey);

  return (
    <View style={styles.fieldGroup}>
      {component.props.label ? (
        <Text
          style={[
            styles.fieldLabel,
            {
              color: theme.textSecondary,
              textAlign:
                parentAlignItems === "center"
                  ? "center"
                  : parentAlignItems === "flex-end"
                    ? "right"
                    : "left",
            },
          ]}
        >
          {component.props.label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={(nextValue: string) =>
          context.onValueChange(component.props.fieldKey, nextValue)
        }
        placeholder={component.props.placeholder}
        placeholderTextColor={theme.placeholderText}
        keyboardType={
          component.props.keyboardType === "email"
            ? "email-address"
            : component.props.keyboardType === "numeric"
              ? "numeric"
              : component.props.keyboardType === "phone"
                ? "phone-pad"
                : "default"
        }
        maxLength={component.props.maxLength}
        style={[
          styles.input,
          {
            width: "100%",
            backgroundColor: theme.inputBackground,
            borderColor: error ? theme.errorBorder : theme.inputBorder,
            color: theme.inputText,
          },
        ]}
      />
      {error ? <Text style={[styles.fieldError, { color: theme.errorText }]}>{error}</Text> : null}
    </View>
  );
}

function OptionPill({
  label,
  selected,
  theme,
  onPress,
}: {
  label: string;
  selected: boolean;
  theme: ScreenTheme;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionPill,
        {
          backgroundColor: selected ? theme.pillSelectedBackground : theme.pillBackground,
          borderColor: selected ? theme.pillSelectedBorder : theme.pillBorder,
        },
      ]}
    >
      <Text
        style={[
          styles.optionPillText,
          { color: selected ? theme.pillSelectedText : theme.pillText },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DefaultSingleSelectComponent({
  component,
  context,
  theme,
  parentAlignItems = "stretch",
}: {
  component: Extract<FlowComponent, { type: "SINGLE_SELECT" }>;
  context: ArloComponentRenderContext;
  theme: ScreenTheme;
  parentAlignItems?: "flex-start" | "center" | "flex-end" | "stretch";
}) {
  const value = coerceStringValue(context.snapshot.values[component.props.fieldKey]);
  const error = getFieldError(context.snapshot, component.props.fieldKey);

  return (
    <View style={styles.fieldGroup}>
      {component.props.label ? (
        <Text
          style={[
            styles.fieldLabel,
            {
              color: theme.textSecondary,
              textAlign:
                parentAlignItems === "center"
                  ? "center"
                  : parentAlignItems === "flex-end"
                    ? "right"
                    : "left",
            },
          ]}
        >
          {component.props.label}
        </Text>
      ) : null}
      <View style={styles.selectList}>
        {component.props.options.map((option) => (
          <Pressable
            key={option.id}
            style={[
              styles.selectOption,
              {
                borderColor: value === option.id ? theme.textPrimary : theme.inputBorder,
                backgroundColor: value === option.id ? theme.textPrimary : theme.inputBackground,
              },
            ]}
            onPress={() => context.onValueChange(component.props.fieldKey, option.id)}
          >
            <Text
              style={[
                styles.selectOptionText,
                { color: value === option.id ? "#ffffff" : theme.textPrimary },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={[styles.fieldError, { color: theme.errorText }]}>{error}</Text> : null}
    </View>
  );
}

function DefaultMultiSelectComponent({
  component,
  context,
  theme,
  parentAlignItems = "stretch",
}: {
  component: Extract<FlowComponent, { type: "MULTI_SELECT" }>;
  context: ArloComponentRenderContext;
  theme: ScreenTheme;
  parentAlignItems?: "flex-start" | "center" | "flex-end" | "stretch";
}) {
  const values = coerceStringArrayValue(context.snapshot.values[component.props.fieldKey]);
  const error = getFieldError(context.snapshot, component.props.fieldKey);

  return (
    <View style={styles.fieldGroup}>
      {component.props.label ? (
        <Text
          style={[
            styles.fieldLabel,
            {
              color: theme.textSecondary,
              textAlign:
                parentAlignItems === "center"
                  ? "center"
                  : parentAlignItems === "flex-end"
                    ? "right"
                    : "left",
            },
          ]}
        >
          {component.props.label}
        </Text>
      ) : null}
      <View style={styles.optionGroup}>
        {component.props.options.map((option) => {
          const selected = values.includes(option.id);

          return (
            <OptionPill
              key={option.id}
              label={option.label}
              selected={selected}
              theme={theme}
              onPress={() => {
                const nextValues = selected
                  ? values.filter((value) => value !== option.id)
                  : [...values, option.id];

                context.onValueChange(component.props.fieldKey, nextValues);
              }}
            />
          );
        })}
      </View>
      {error ? <Text style={[styles.fieldError, { color: theme.errorText }]}>{error}</Text> : null}
    </View>
  );
}

function DefaultSliderComponent({
  component,
  context,
  theme,
  parentAlignItems = "stretch",
}: {
  component: Extract<FlowComponent, { type: "SLIDER" }>;
  context: ArloComponentRenderContext;
  theme: ScreenTheme;
  parentAlignItems?: "flex-start" | "center" | "flex-end" | "stretch";
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const currentValue = coerceNumberValue(
    context.snapshot.values[component.props.fieldKey],
    component.props.defaultValue ?? component.props.min
  );

  const step = component.props.step ?? 1;
  const clampedValue = Math.min(component.props.max, Math.max(component.props.min, currentValue));
  const range = component.props.max - component.props.min;
  const progress = range <= 0 ? 0 : ((clampedValue - component.props.min) / range) * 100;
  const thumbSize = 18;
  const thumbLeft =
    trackWidth <= 0
      ? 0
      : Math.min(
          Math.max((progress / 100) * trackWidth - thumbSize / 2, 0),
          Math.max(trackWidth - thumbSize, 0)
        );

  const updateFromLocation = (locationX: number) => {
    if (trackWidth <= 0 || range <= 0) return;

    const ratio = Math.min(Math.max(locationX / trackWidth, 0), 1);
    const rawValue = component.props.min + ratio * range;
    const steppedValue =
      Math.round((rawValue - component.props.min) / step) * step + component.props.min;
    const nextValue = Math.min(
      component.props.max,
      Math.max(component.props.min, Number(steppedValue.toFixed(4)))
    );

    context.onValueChange(component.props.fieldKey, nextValue);
  };

  const handleTrackLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const handleTrackInteraction = (event: { nativeEvent: { locationX: number } }) => {
    updateFromLocation(event.nativeEvent.locationX);
  };

  return (
    <View style={styles.fieldGroup}>
      {component.props.label ? (
        <Text
          style={[
            styles.fieldLabel,
            {
              color: theme.textSecondary,
              textAlign:
                parentAlignItems === "center"
                  ? "center"
                  : parentAlignItems === "flex-end"
                    ? "right"
                    : "left",
            },
          ]}
        >
          {component.props.label}
        </Text>
      ) : null}
      <View style={styles.sliderField}
      >
        <View
          onLayout={handleTrackLayout}
          onStartShouldSetResponder={() => true}
          onResponderGrant={handleTrackInteraction}
          onResponderMove={handleTrackInteraction}
          style={styles.sliderTouchArea}
        >
          <View
            style={[
              styles.sliderTrack,
              {
                backgroundColor: theme.progressTrackBackground,
              },
            ]}
          />
          <View
            style={[
              styles.sliderFill,
              {
                width: `${progress}%`,
                backgroundColor: "#3B82F6",
              },
            ]}
          />
          <View
            style={[
              styles.sliderThumb,
              {
                left: thumbLeft,
                backgroundColor: "#3B82F6",
                borderColor: theme.inputBackground,
              },
            ]}
          />
        </View>
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabel, { color: theme.placeholderText }]}>
            {String(component.props.minLabel ?? component.props.min)}
          </Text>
          <Text style={[styles.sliderLabel, { color: theme.placeholderText }]}>
            {String(component.props.maxLabel ?? component.props.max)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function DefaultProgressBarComponent({
  snapshot,
  component,
  theme,
}: {
  snapshot: FlowSessionSnapshot;
  component: Extract<FlowComponent, { type: "PROGRESS_BAR" }>;
  theme: ScreenTheme;
}) {
  const progress =
    snapshot.totalScreens > 1
      ? ((snapshot.currentScreenIndex + 1) / snapshot.totalScreens) * 100
      : 100;

  return (
    <View
      style={[
        styles.progressTrack,
        {
          backgroundColor: component.props.backgroundColor ?? theme.progressTrackBackground,
          height: component.props.height ?? 6,
        },
      ]}
    >
      <View
        style={{
          width: `${progress}%`,
          backgroundColor: component.props.color ?? theme.progressFillColor,
          height: "100%",
          borderRadius: 999,
        }}
      />
    </View>
  );
}

function DefaultPageIndicatorComponent({
  snapshot,
  component,
  theme,
}: {
  snapshot: FlowSessionSnapshot;
  component: Extract<FlowComponent, { type: "PAGE_INDICATOR" }>;
  theme: ScreenTheme;
}) {
  const size = component.props.size ?? 8;

  return (
    <View style={styles.pageIndicatorRow}>
      {Array.from({ length: snapshot.totalScreens }).map((_, index) => (
        <View
          key={index}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor:
              index === snapshot.currentScreenIndex
                ? component.props.activeColor ?? theme.indicatorActive
                : component.props.inactiveColor ?? theme.indicatorInactive,
          }}
        />
      ))}
    </View>
  );
}

// ─── Render Dispatch ────────────────────────────────────────────────────────

function renderDefaultComponent(
  component: FlowComponent,
  context: ArloComponentRenderContext,
  theme: ScreenTheme,
  registry?: ArloFlowRendererProps["registry"],
  iconRenderer?: ArloIconRenderer,
  parentAlignItems: "flex-start" | "center" | "flex-end" | "stretch" = "stretch"
) {
  switch (component.type) {
    case "TEXT":
      return (
        <DefaultTextComponent
          component={component}
          theme={theme}
          parentAlignItems={parentAlignItems}
        />
      );
    case "IMAGE":
      return <DefaultImageComponent component={component} />;
    case "ICON_LIBRARY":
      return <DefaultIconLibraryComponent component={component} iconRenderer={iconRenderer} />;
    case "BUTTON":
      return (
        <DefaultButtonComponent
          component={component}
          onPress={() => context.onPressButton(component.id)}
          iconRenderer={iconRenderer}
        />
      );
    case "TEXT_INPUT":
      return (
        <DefaultTextInputComponent
          component={component}
          context={context}
          theme={theme}
          parentAlignItems={parentAlignItems}
        />
      );
    case "SINGLE_SELECT":
      return (
        <DefaultSingleSelectComponent
          component={component}
          context={context}
          theme={theme}
          parentAlignItems={parentAlignItems}
        />
      );
    case "MULTI_SELECT":
      return (
        <DefaultMultiSelectComponent
          component={component}
          context={context}
          theme={theme}
          parentAlignItems={parentAlignItems}
        />
      );
    case "SLIDER":
      return (
        <DefaultSliderComponent
          component={component}
          context={context}
          theme={theme}
          parentAlignItems={parentAlignItems}
        />
      );
    case "PROGRESS_BAR":
      return <DefaultProgressBarComponent component={component} snapshot={context.snapshot} theme={theme} />;
    case "PAGE_INDICATOR":
      return <DefaultPageIndicatorComponent component={component} snapshot={context.snapshot} theme={theme} />;
    case "CUSTOM_COMPONENT": {
      const registered = registry?.getComponent(component.props.registryKey);
      return registered
        ? registered({
            session: context.session,
            snapshot: context.snapshot,
            screen: context.snapshot.currentScreen!,
            component,
          })
        : null;
    }
    default:
      return null;
  }
}

// ─── Main Renderer ──────────────────────────────────────────────────────────

export function ArloFlowRenderer({
  session,
  handlers,
  componentRenderers,
  registry,
  iconRenderer,
  autoStart = true,
  emptyState = null,
  unsupportedComponent,
  unsupportedScreen,
  onSnapshotChange,
}: ArloFlowRendererProps) {
  const [snapshot, setSnapshot] = useState(() => session.getSnapshot());

  const savedOnSnapshotChange = useRef(onSnapshotChange);
  const savedHandlers = useRef(handlers);
  
  useEffect(() => {
    savedOnSnapshotChange.current = onSnapshotChange;
    savedHandlers.current = handlers;
  }, [onSnapshotChange, handlers]);

  useEffect(() => {
    const nextSnapshot = session.getSnapshot();
    startTransition(() => {
      setSnapshot(nextSnapshot);
    });
    savedOnSnapshotChange.current?.(nextSnapshot);

    if (autoStart && session.getSnapshot().status === "idle") {
      const effect = session.start();
      const startedSnapshot = session.getSnapshot();
      startTransition(() => {
        setSnapshot(startedSnapshot);
      });
      savedOnSnapshotChange.current?.(startedSnapshot);
      void applyFlowSessionEffect(session, effect, savedHandlers.current);
    }
  }, [autoStart, session]);

  const sortedComponents = useMemo(
    () =>
      [...(snapshot.currentScreen?.components ?? [])].sort((a, b) => a.order - b.order),
    [snapshot.currentScreen]
  );

  const theme = useMemo(
    () => (snapshot.currentScreen ? getThemeForScreen(snapshot.currentScreen) : LIGHT_THEME),
    [snapshot.currentScreen]
  );

  const context: ArloComponentRenderContext = {
    session,
    snapshot,
    handlers,
    iconRenderer,
    onValueChange: (fieldKey, value) => {
      const nextSnapshot = session.setValue(fieldKey, value);
      setSnapshot(nextSnapshot);
      onSnapshotChange?.(nextSnapshot);

      const component = findInteractiveComponent(nextSnapshot.currentScreen, fieldKey);

      if (component) {
        emitAnalyticsEvent(
          handlers,
          session,
          nextSnapshot,
          createComponentInteractionAnalyticsEvent(nextSnapshot, component, value)
        );
      }
    },
    onPressButton: async (componentId) => {
      const currentSnapshot = session.getSnapshot();
      const currentHandlers = handlers;
      const buttonComponent = findButtonComponent(currentSnapshot.currentScreen, componentId);

      if (buttonComponent) {
        emitAnalyticsEvent(
          currentHandlers,
          session,
          currentSnapshot,
          createButtonPressedAnalyticsEvent(currentSnapshot, buttonComponent)
        );
      }

      const effect = session.pressButton(componentId);
      const immediateSnapshot = session.getSnapshot();
      setSnapshot(immediateSnapshot);
      onSnapshotChange?.(immediateSnapshot);
      await applyFlowSessionEffect(session, effect, currentHandlers);
      const finalSnapshot = session.getSnapshot();
      setSnapshot(finalSnapshot);
      onSnapshotChange?.(finalSnapshot);
    },
  };

  const renderComponentNode = (
    component: FlowComponent,
    renderContext: ArloComponentRenderContext,
    renderTheme: ScreenTheme,
    isAbsoluteScreen: boolean,
    parentAlignItems: "flex-start" | "center" | "flex-end" | "stretch" = "stretch"
  ) => {
    const customRenderer = componentRenderers?.[component.type] as
      | ArloComponentRendererMap[typeof component.type]
      | undefined;

    const content = customRenderer
      ? customRenderer(component as never, renderContext as never)
      : renderDefaultComponent(
          component,
          renderContext,
          renderTheme,
          registry,
          iconRenderer,
          parentAlignItems
        );

    if (content === null) {
      return (
        <View key={component.id} style={styles.unsupported}>
          {unsupportedComponent ? (
            unsupportedComponent(component)
          ) : (
            <Text style={styles.unsupportedText}>
              Unsupported component: {component.type}
            </Text>
          )}
        </View>
      );
    }

    return (
      <View
        key={component.id}
        style={getComponentWrapperStyle(component, isAbsoluteScreen, parentAlignItems)}
      >
        {content}
      </View>
    );
  };

  const renderAutoLayoutScreen = (
    screen: Screen,
    components: FlowComponent[],
    renderContext: ArloComponentRenderContext,
    renderTheme: ScreenTheme
  ) => {
    const padding = getScreenPadding(screen);
    const backgroundColor = screen.style?.backgroundColor ?? "#FFFFFF";
    const justifyContent = screen.style?.justifyContent ?? "flex-start";
    const alignItems = screen.style?.alignItems ?? "center";
    const { main, bottom } = splitAutoLayoutComponents(components);

    return (
      <SafeView style={{ flex: 1, backgroundColor }}>
        <ScrollView
          style={{ flex: 1, width: "100%" }}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.container,
            {
              backgroundColor,
              paddingTop: padding.top,
              paddingRight: padding.right,
              paddingBottom: bottom.length > 0 ? 12 : padding.bottom,
              paddingLeft: padding.left,
            },
          ]}
        >
          <View
            style={[
              styles.autoLayoutMain,
              {
                backgroundColor,
                justifyContent,
                alignItems,
              },
            ]}
          >
            {main.map((component) =>
              renderComponentNode(component, renderContext, renderTheme, false, alignItems)
            )}
          </View>
        </ScrollView>

        {bottom.length > 0 ? (
          <View
            style={[
              styles.autoLayoutBottom,
              {
                backgroundColor,
                paddingTop: 12,
                paddingRight: padding.right,
                paddingBottom: padding.bottom,
                paddingLeft: padding.left,
              },
            ]}
          >
            {bottom.map((component) =>
              renderComponentNode(component, renderContext, renderTheme, false, alignItems)
            )}
          </View>
        ) : null}
      </SafeView>
    );
  };

  if (!snapshot.currentScreen) {
    return <>{emptyState}</>;
  }

  if (snapshot.currentScreen.customScreenKey) {
    const registeredScreen = registry?.getScreen(snapshot.currentScreen.customScreenKey);
    const importedPreviewScreen = getImportedPreviewScreen(snapshot.currentScreen);

    if (registeredScreen) {
      return (
        <>
          {registeredScreen({
            session,
            snapshot,
            screen: snapshot.currentScreen,
          })}
        </>
      );
    }

    if (importedPreviewScreen) {
      const previewComponents = [...(importedPreviewScreen.components ?? [])].sort(
        (a, b) => a.order - b.order
      );
      const previewTheme = getThemeForScreen(importedPreviewScreen);
      const previewContext: ArloComponentRenderContext = {
        ...context,
        onValueChange: () => undefined,
        onPressButton: async () => undefined,
      };

      return renderAutoLayoutScreen(
        importedPreviewScreen,
        previewComponents,
        previewContext,
        previewTheme
      );
    }

    return (
      <>
        {unsupportedScreen ? (
          unsupportedScreen(snapshot.currentScreen)
        ) : (
          <View style={styles.unsupported}>
            <Text style={styles.unsupportedText}>
              Unsupported screen: {snapshot.currentScreen.customScreenKey}
            </Text>
          </View>
        )}
      </>
    );
  }

  if (snapshot.currentScreen.layoutMode === "absolute") {
    const bgColor = snapshot.currentScreen.style?.backgroundColor ?? "#FFFFFF";
    return (
      <View style={{ flex: 1, backgroundColor: bgColor }}>
        <View style={[{ flex: 1 }, getScreenContainerStyle(snapshot.currentScreen)]}>
          <View style={styles.absoluteContainer}>
            {sortedComponents.map((component) =>
              renderComponentNode(component, context, theme, true)
            )}
          </View>
        </View>
      </View>
    );
  }

  return renderAutoLayoutScreen(snapshot.currentScreen, sortedComponents, context, theme);
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    width: "100%",
  },
  componentBlock: {
    alignSelf: "stretch" as const,
  },
  autoLayoutMain: {
    flexGrow: 1,
    width: "100%",
    gap: 16,
  },
  autoLayoutBottom: {
    width: "100%",
    gap: 12,
  },
  absoluteContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldError: {
    fontSize: 12,
    fontWeight: "500",
  },
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  selectList: {
    gap: 8,
  },
  selectOption: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  optionPillText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sliderField: {
    gap: 6,
  },
  sliderTouchArea: {
    height: 28,
    justifyContent: "center",
    position: "relative",
  },
  sliderTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 11,
    height: 6,
    borderRadius: 999,
  },
  sliderThumb: {
    position: "absolute",
    top: 5,
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 3,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: {
    fontSize: 11,
  },
  progressTrack: {
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
  },
  pageIndicatorRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  unsupported: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3a2430",
    backgroundColor: "#21151a",
  },
  unsupportedText: {
    color: "#f5b4c6",
    fontSize: 13,
  },
});
