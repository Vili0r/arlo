"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArloFlowRenderer = ArloFlowRenderer;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const SafeView = react_native_safe_area_context_1.SafeAreaView;
const arlo_sdk_1 = require("arlo-sdk");
const LIGHT_THEME = {
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
const DARK_THEME = {
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
function findInteractiveComponent(screen, fieldKey) {
    if (!screen) {
        return null;
    }
    return (screen.components.find((component) => {
        if (component.type !== "TEXT_INPUT" &&
            component.type !== "SINGLE_SELECT" &&
            component.type !== "MULTI_SELECT" &&
            component.type !== "SLIDER") {
            return false;
        }
        return component.props.fieldKey === fieldKey;
    }) ?? null);
}
function findButtonComponent(screen, componentId) {
    if (!screen) {
        return null;
    }
    return (screen.components.find((component) => component.type === "BUTTON" && component.id === componentId) ?? null);
}
function emitAnalyticsEvent(handlers, session, snapshot, event) {
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
function getRelativeLuminance(color) {
    if (!color || color === "transparent")
        return 1;
    const hex = color;
    // Handle rgba/rgb
    if (color.startsWith("rgb")) {
        const matches = color.match(/\d+(\.\d+)?/g);
        if (!matches || matches.length < 3)
            return 1;
        const r = parseInt(matches[0], 10) / 255;
        const g = parseInt(matches[1], 10) / 255;
        const b = parseInt(matches[2], 10) / 255;
        if (matches.length >= 4 && parseFloat(matches[3]) === 0)
            return 1;
        const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
        return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    }
    // Handle named colors (basic)
    if (color === "white")
        return 1;
    if (color === "black")
        return 0;
    let clean = hex.replace("#", "");
    if (clean.length === 3) {
        clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    if (clean.length < 6)
        return 1;
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    if (isNaN(r) || isNaN(g) || isNaN(b))
        return 1;
    const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
function getThemeForScreen(screen) {
    const bg = screen.style?.backgroundColor;
    if (!bg || bg === "transparent")
        return LIGHT_THEME;
    const luminance = getRelativeLuminance(bg);
    return luminance > 0.5 ? LIGHT_THEME : DARK_THEME;
}
// ─── Helpers ────────────────────────────────────────────────────────────────
const IMPORTED_SCREEN_KEYS = new Set([
    "__arlo_imported_code__",
    "__arlo_imported_figma__",
]);
function isImportedPreviewPayload(value) {
    return Boolean(value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        ["imported-code", "imported-figma"].includes(String(value.kind ?? "")) &&
        value.version === 1);
}
function getImportedPreviewScreen(screen) {
    if (!screen.customScreenKey || !IMPORTED_SCREEN_KEYS.has(screen.customScreenKey))
        return null;
    return isImportedPreviewPayload(screen.customPayload) && screen.customPayload.previewScreen
        ? screen.customPayload.previewScreen
        : null;
}
function getScreenContainerStyle(screen) {
    const padding = getScreenPadding(screen);
    return {
        backgroundColor: screen.style?.backgroundColor ?? "#FFFFFF",
        paddingTop: padding.top,
        paddingBottom: padding.bottom,
        paddingRight: padding.right,
        paddingLeft: padding.left,
        justifyContent: screen.style?.justifyContent ?? "flex-start",
        alignItems: screen.style?.alignItems ?? "stretch",
    };
}
function getScreenPadding(screen) {
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
function splitAutoLayoutComponents(components) {
    return {
        main: components.filter((component) => {
            const props = component.props;
            return props.position !== "bottom";
        }),
        bottom: components.filter((component) => {
            const props = component.props;
            return props.position === "bottom";
        }),
    };
}
/** Components that size to their own content rather than stretching to fill width */
const SELF_SIZING_TYPES = new Set(["ICON_LIBRARY", "ICON", "PAGE_INDICATOR"]);
function getSpacing(props, prefix) {
    const top = props[`${prefix}Top`];
    const right = props[`${prefix}Right`];
    const bottom = props[`${prefix}Bottom`];
    const left = props[`${prefix}Left`];
    if (typeof top === "number" ||
        typeof right === "number" ||
        typeof bottom === "number" ||
        typeof left === "number") {
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
function getComponentMarginStyle(component) {
    const props = component.props;
    const margin = getSpacing(props, "margin");
    return {
        marginTop: margin.top || undefined,
        marginRight: margin.right || undefined,
        marginBottom: margin.bottom || undefined,
        marginLeft: margin.left || undefined,
    };
}
function getComponentWidthMode(component) {
    const props = component.props;
    if (props.widthMode === "fill" || props.widthMode === "fit" || props.widthMode === "fixed") {
        return props.widthMode;
    }
    if (component.type === "BUTTON" || SELF_SIZING_TYPES.has(component.type)) {
        return "fit";
    }
    return "fill";
}
function getFixedComponentWidth(component) {
    const props = component.props;
    if (typeof props.width === "number")
        return props.width;
    if (typeof props.fixedWidth === "number")
        return props.fixedWidth;
    if (component.type === "BUTTON")
        return 300;
    if (component.type === "TEXT")
        return 200;
    return undefined;
}
function getAutoLayoutWrapperStyle(component, parentAlignItems = "stretch") {
    const widthMode = getComponentWidthMode(component);
    if (widthMode === "fill") {
        return {
            alignSelf: "stretch",
        };
    }
    const alignSelf = parentAlignItems === "center"
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
function getComponentWrapperStyle(component, isAbsoluteScreen, parentAlignItems = "stretch") {
    const layout = component.layout;
    const blockStyle = SELF_SIZING_TYPES.has(component.type) ? {} : styles.componentBlock;
    const marginStyle = getComponentMarginStyle(component);
    if (!layout) {
        return isAbsoluteScreen
            ? { position: "absolute", zIndex: component.order }
            : {
                ...blockStyle,
                ...marginStyle,
                ...getAutoLayoutWrapperStyle(component, parentAlignItems),
            };
    }
    const baseStyle = {
        display: layout.visible === false ? "none" : "flex",
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
        position: "absolute",
        left: layout.x ?? marginStyle.marginLeft ?? 0,
        top: layout.y ?? marginStyle.marginTop ?? 0,
        width: layout.width,
        height: layout.height,
        transform: layout.rotation ? [{ rotate: `${layout.rotation}deg` }] : undefined,
    };
}
function coerceStringValue(value) {
    return typeof value === "string" ? value : "";
}
function coerceStringArrayValue(value) {
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}
function coerceNumberValue(value, fallback) {
    return typeof value === "number" ? value : fallback;
}
function renderFallbackIcon(name, size, color) {
    const normalized = name.toLowerCase().replace(/[-_]/g, "");
    let glyph = "\u2022";
    if (normalized.includes("chevronleft") || normalized === "back")
        glyph = "\u2039";
    else if (normalized.includes("arrowleft") || normalized.endsWith("left"))
        glyph = "\u2190";
    else if (normalized.includes("chevronright") || normalized === "next")
        glyph = "\u203A";
    else if (normalized.includes("arrowright") || normalized.endsWith("right"))
        glyph = "\u2192";
    else if (normalized === "x" || normalized.includes("close"))
        glyph = "\u2715";
    else if (normalized.includes("check"))
        glyph = "\u2713";
    else if (normalized.includes("plus"))
        glyph = "+";
    else if (normalized.includes("minus"))
        glyph = "\u2212";
    return ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: {
            fontSize: size,
            color,
            textAlign: "center",
            includeFontPadding: false,
            lineHeight: size,
        }, children: glyph }));
}
function getFieldError(snapshot, fieldKey) {
    return snapshot.validationErrorsByField[fieldKey] ?? null;
}
// ─── Default Components ─────────────────────────────────────────────────────
function DefaultTextComponent({ component, theme, parentAlignItems = "stretch", }) {
    const defaultTextAlign = parentAlignItems === "center"
        ? "center"
        : parentAlignItems === "flex-end"
            ? "right"
            : "left";
    return ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: {
            color: component.props.color ?? theme.textPrimary,
            fontSize: component.props.fontSize ?? 16,
            fontWeight: component.props.fontWeight ?? "normal",
            textAlign: component.props.textAlign ?? defaultTextAlign,
            lineHeight: component.props.lineHeight && component.props.fontSize
                ? component.props.lineHeight * component.props.fontSize
                : undefined,
            opacity: component.props.opacity ?? 1,
        }, children: component.props.content }));
}
function DefaultImageComponent({ component }) {
    return ((0, jsx_runtime_1.jsx)(react_native_1.Image, { source: { uri: component.props.src }, alt: component.props.alt ?? "", accessibilityLabel: component.props.alt, resizeMode: component.props.resizeMode ?? "cover", style: {
            width: component.props.width ?? "100%",
            height: component.props.height ?? 220,
            borderRadius: component.props.borderRadius ?? 0,
        } }));
}
function DefaultIconLibraryComponent({ component, iconRenderer, }) {
    const props = component.props;
    const iconName = props.iconName ?? "";
    const size = props.size ?? 24;
    const color = props.color ?? "#ffffff";
    const bgColor = props.backgroundColor ?? undefined;
    const width = props.width ?? size + 16;
    const height = props.height ?? size + 16;
    const opacity = props.opacity ?? 1;
    const borderRadius = Math.min(width, height) / 2;
    const iconContent = iconRenderer
        ? iconRenderer(iconName, size, color)
        : renderFallbackIcon(iconName, size, color);
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: {
            width,
            height,
            borderRadius,
            backgroundColor: bgColor,
            opacity,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: props.paddingVertical ?? 0,
            paddingHorizontal: props.paddingHorizontal ?? 0,
            marginVertical: props.marginVertical ?? 0,
            marginHorizontal: props.marginHorizontal ?? 0,
        }, children: iconContent }));
}
function DefaultButtonComponent({ component, onPress, iconRenderer, }) {
    const props = component.props;
    const padding = getSpacing(props, "padding");
    const showIcon = props.showIcon === true;
    const iconName = props.iconName ?? "";
    const iconPosition = props.iconPosition ?? "left";
    const iconSize = props.iconSize ?? 20;
    const textColor = props.textColor ?? component.props.style?.textColor ?? "#ffffff";
    const iconColor = props.iconColor ?? textColor;
    const iconSpacing = props.iconSpacing ?? 8;
    const fontSize = props.fontSize ?? 16;
    const fontWeight = props.fontWeight ?? "600";
    const widthMode = getComponentWidthMode(component);
    const heightMode = props.heightMode === "fit" || props.heightMode === "fill" || props.heightMode === "fixed"
        ? props.heightMode
        : "fit";
    const backgroundColor = props.backgroundColor ?? component.props.style?.backgroundColor ?? "#007AFF";
    const borderRadius = props.shape === "circle"
        ? 999
        : props.shape === "pill"
            ? 999
            : props.shape === "rounded"
                ? 16
                : props.borderRadius ?? component.props.style?.borderRadius ?? 14;
    const borderColor = props.borderColor ?? component.props.style?.borderColor ?? "transparent";
    const borderWidth = props.borderWidth ?? component.props.style?.borderWidth ?? 0;
    const fixedHeight = typeof props.height === "number"
        ? props.height
        : typeof props.fixedHeight === "number"
            ? props.fixedHeight
            : 48;
    const iconElement = showIcon && iconName
        ? (iconRenderer
            ? iconRenderer(iconName, iconSize, iconColor)
            : renderFallbackIcon(iconName, iconSize, iconColor))
        : null;
    const isIconOnly = showIcon && iconPosition === "only";
    const isCircularIconOnlyButton = props.shape === "circle" && isIconOnly;
    return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => {
            void onPress();
        }, style: [
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
        ], children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: [
                styles.buttonContent,
                {
                    width: widthMode === "fit" ? undefined : "100%",
                    gap: isIconOnly ? 0 : iconSpacing,
                },
            ], children: [iconElement && (iconPosition === "left" || isIconOnly) ? iconElement : null, !isIconOnly ? ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                        styles.buttonText,
                        {
                            color: textColor,
                            fontSize,
                            fontWeight,
                            textAlign: props.textAlign ?? "center",
                        },
                    ], children: component.props.label })) : null, iconElement && iconPosition === "right" ? iconElement : null] }) }));
}
function DefaultTextInputComponent({ component, context, theme, parentAlignItems = "stretch", }) {
    const value = coerceStringValue(context.snapshot.values[component.props.fieldKey]);
    const error = getFieldError(context.snapshot, component.props.fieldKey);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.fieldGroup, children: [component.props.label ? ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                    styles.fieldLabel,
                    {
                        color: theme.textSecondary,
                        textAlign: parentAlignItems === "center"
                            ? "center"
                            : parentAlignItems === "flex-end"
                                ? "right"
                                : "left",
                    },
                ], children: component.props.label })) : null, (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: value, onChangeText: (nextValue) => context.onValueChange(component.props.fieldKey, nextValue), placeholder: component.props.placeholder, placeholderTextColor: theme.placeholderText, keyboardType: component.props.keyboardType === "email"
                    ? "email-address"
                    : component.props.keyboardType === "numeric"
                        ? "numeric"
                        : component.props.keyboardType === "phone"
                            ? "phone-pad"
                            : "default", maxLength: component.props.maxLength, style: [
                    styles.input,
                    {
                        width: "100%",
                        backgroundColor: theme.inputBackground,
                        borderColor: error ? theme.errorBorder : theme.inputBorder,
                        color: theme.inputText,
                    },
                ] }), error ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.fieldError, { color: theme.errorText }], children: error }) : null] }));
}
function OptionPill({ label, selected, theme, onPress, }) {
    return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: onPress, style: [
            styles.optionPill,
            {
                backgroundColor: selected ? theme.pillSelectedBackground : theme.pillBackground,
                borderColor: selected ? theme.pillSelectedBorder : theme.pillBorder,
            },
        ], children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                styles.optionPillText,
                { color: selected ? theme.pillSelectedText : theme.pillText },
            ], children: label }) }));
}
function DefaultSingleSelectComponent({ component, context, theme, parentAlignItems = "stretch", }) {
    const value = coerceStringValue(context.snapshot.values[component.props.fieldKey]);
    const error = getFieldError(context.snapshot, component.props.fieldKey);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.fieldGroup, children: [component.props.label ? ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                    styles.fieldLabel,
                    {
                        color: theme.textSecondary,
                        textAlign: parentAlignItems === "center"
                            ? "center"
                            : parentAlignItems === "flex-end"
                                ? "right"
                                : "left",
                    },
                ], children: component.props.label })) : null, (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.selectList, children: component.props.options.map((option) => ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { style: [
                        styles.selectOption,
                        {
                            borderColor: value === option.id ? theme.textPrimary : theme.inputBorder,
                            backgroundColor: value === option.id ? theme.textPrimary : theme.inputBackground,
                        },
                    ], onPress: () => context.onValueChange(component.props.fieldKey, option.id), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                            styles.selectOptionText,
                            { color: value === option.id ? "#ffffff" : theme.textPrimary },
                        ], children: option.label }) }, option.id))) }), error ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.fieldError, { color: theme.errorText }], children: error }) : null] }));
}
function DefaultMultiSelectComponent({ component, context, theme, parentAlignItems = "stretch", }) {
    const values = coerceStringArrayValue(context.snapshot.values[component.props.fieldKey]);
    const error = getFieldError(context.snapshot, component.props.fieldKey);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.fieldGroup, children: [component.props.label ? ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                    styles.fieldLabel,
                    {
                        color: theme.textSecondary,
                        textAlign: parentAlignItems === "center"
                            ? "center"
                            : parentAlignItems === "flex-end"
                                ? "right"
                                : "left",
                    },
                ], children: component.props.label })) : null, (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.optionGroup, children: component.props.options.map((option) => {
                    const selected = values.includes(option.id);
                    return ((0, jsx_runtime_1.jsx)(OptionPill, { label: option.label, selected: selected, theme: theme, onPress: () => {
                            const nextValues = selected
                                ? values.filter((value) => value !== option.id)
                                : [...values, option.id];
                            context.onValueChange(component.props.fieldKey, nextValues);
                        } }, option.id));
                }) }), error ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.fieldError, { color: theme.errorText }], children: error }) : null] }));
}
function DefaultSliderComponent({ component, context, theme, parentAlignItems = "stretch", }) {
    const [trackWidth, setTrackWidth] = (0, react_1.useState)(0);
    const currentValue = coerceNumberValue(context.snapshot.values[component.props.fieldKey], component.props.defaultValue ?? component.props.min);
    const step = component.props.step ?? 1;
    const clampedValue = Math.min(component.props.max, Math.max(component.props.min, currentValue));
    const range = component.props.max - component.props.min;
    const progress = range <= 0 ? 0 : ((clampedValue - component.props.min) / range) * 100;
    const thumbSize = 18;
    const thumbLeft = trackWidth <= 0
        ? 0
        : Math.min(Math.max((progress / 100) * trackWidth - thumbSize / 2, 0), Math.max(trackWidth - thumbSize, 0));
    const updateFromLocation = (locationX) => {
        if (trackWidth <= 0 || range <= 0)
            return;
        const ratio = Math.min(Math.max(locationX / trackWidth, 0), 1);
        const rawValue = component.props.min + ratio * range;
        const steppedValue = Math.round((rawValue - component.props.min) / step) * step + component.props.min;
        const nextValue = Math.min(component.props.max, Math.max(component.props.min, Number(steppedValue.toFixed(4))));
        context.onValueChange(component.props.fieldKey, nextValue);
    };
    const handleTrackLayout = (event) => {
        setTrackWidth(event.nativeEvent.layout.width);
    };
    const handleTrackInteraction = (event) => {
        updateFromLocation(event.nativeEvent.locationX);
    };
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.fieldGroup, children: [component.props.label ? ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                    styles.fieldLabel,
                    {
                        color: theme.textSecondary,
                        textAlign: parentAlignItems === "center"
                            ? "center"
                            : parentAlignItems === "flex-end"
                                ? "right"
                                : "left",
                    },
                ], children: component.props.label })) : null, (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.sliderField, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { onLayout: handleTrackLayout, onStartShouldSetResponder: () => true, onResponderGrant: handleTrackInteraction, onResponderMove: handleTrackInteraction, style: styles.sliderTouchArea, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
                                    styles.sliderTrack,
                                    {
                                        backgroundColor: theme.progressTrackBackground,
                                    },
                                ] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
                                    styles.sliderFill,
                                    {
                                        width: `${progress}%`,
                                        backgroundColor: "#3B82F6",
                                    },
                                ] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
                                    styles.sliderThumb,
                                    {
                                        left: thumbLeft,
                                        backgroundColor: "#3B82F6",
                                        borderColor: theme.inputBackground,
                                    },
                                ] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.sliderLabels, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.sliderLabel, { color: theme.placeholderText }], children: String(component.props.minLabel ?? component.props.min) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.sliderLabel, { color: theme.placeholderText }], children: String(component.props.maxLabel ?? component.props.max) })] })] })] }));
}
function DefaultProgressBarComponent({ snapshot, component, theme, }) {
    const progress = snapshot.totalScreens > 1
        ? ((snapshot.currentScreenIndex + 1) / snapshot.totalScreens) * 100
        : 100;
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
            styles.progressTrack,
            {
                backgroundColor: component.props.backgroundColor ?? theme.progressTrackBackground,
                height: component.props.height ?? 6,
            },
        ], children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: {
                width: `${progress}%`,
                backgroundColor: component.props.color ?? theme.progressFillColor,
                height: "100%",
                borderRadius: 999,
            } }) }));
}
function DefaultPageIndicatorComponent({ snapshot, component, theme, }) {
    const size = component.props.size ?? 8;
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.pageIndicatorRow, children: Array.from({ length: snapshot.totalScreens }).map((_, index) => ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: index === snapshot.currentScreenIndex
                    ? component.props.activeColor ?? theme.indicatorActive
                    : component.props.inactiveColor ?? theme.indicatorInactive,
            } }, index))) }));
}
// ─── Render Dispatch ────────────────────────────────────────────────────────
function renderDefaultComponent(component, context, theme, registry, iconRenderer, parentAlignItems = "stretch") {
    switch (component.type) {
        case "TEXT":
            return ((0, jsx_runtime_1.jsx)(DefaultTextComponent, { component: component, theme: theme, parentAlignItems: parentAlignItems }));
        case "IMAGE":
            return (0, jsx_runtime_1.jsx)(DefaultImageComponent, { component: component });
        case "ICON_LIBRARY":
            return (0, jsx_runtime_1.jsx)(DefaultIconLibraryComponent, { component: component, iconRenderer: iconRenderer });
        case "BUTTON":
            return ((0, jsx_runtime_1.jsx)(DefaultButtonComponent, { component: component, onPress: () => context.onPressButton(component.id), iconRenderer: iconRenderer }));
        case "TEXT_INPUT":
            return ((0, jsx_runtime_1.jsx)(DefaultTextInputComponent, { component: component, context: context, theme: theme, parentAlignItems: parentAlignItems }));
        case "SINGLE_SELECT":
            return ((0, jsx_runtime_1.jsx)(DefaultSingleSelectComponent, { component: component, context: context, theme: theme, parentAlignItems: parentAlignItems }));
        case "MULTI_SELECT":
            return ((0, jsx_runtime_1.jsx)(DefaultMultiSelectComponent, { component: component, context: context, theme: theme, parentAlignItems: parentAlignItems }));
        case "SLIDER":
            return ((0, jsx_runtime_1.jsx)(DefaultSliderComponent, { component: component, context: context, theme: theme, parentAlignItems: parentAlignItems }));
        case "PROGRESS_BAR":
            return (0, jsx_runtime_1.jsx)(DefaultProgressBarComponent, { component: component, snapshot: context.snapshot, theme: theme });
        case "PAGE_INDICATOR":
            return (0, jsx_runtime_1.jsx)(DefaultPageIndicatorComponent, { component: component, snapshot: context.snapshot, theme: theme });
        case "CUSTOM_COMPONENT": {
            const registered = registry?.getComponent(component.props.registryKey);
            return registered
                ? registered({
                    session: context.session,
                    snapshot: context.snapshot,
                    screen: context.snapshot.currentScreen,
                    component,
                })
                : null;
        }
        default:
            return null;
    }
}
// ─── Main Renderer ──────────────────────────────────────────────────────────
function ArloFlowRenderer({ session, handlers, componentRenderers, registry, iconRenderer, autoStart = true, emptyState = null, unsupportedComponent, unsupportedScreen, onSnapshotChange, }) {
    const [snapshot, setSnapshot] = (0, react_1.useState)(() => session.getSnapshot());
    const savedOnSnapshotChange = (0, react_1.useRef)(onSnapshotChange);
    const savedHandlers = (0, react_1.useRef)(handlers);
    (0, react_1.useEffect)(() => {
        savedOnSnapshotChange.current = onSnapshotChange;
        savedHandlers.current = handlers;
    }, [onSnapshotChange, handlers]);
    (0, react_1.useEffect)(() => {
        const nextSnapshot = session.getSnapshot();
        (0, react_1.startTransition)(() => {
            setSnapshot(nextSnapshot);
        });
        savedOnSnapshotChange.current?.(nextSnapshot);
        if (autoStart && session.getSnapshot().status === "idle") {
            const effect = session.start();
            const startedSnapshot = session.getSnapshot();
            (0, react_1.startTransition)(() => {
                setSnapshot(startedSnapshot);
            });
            savedOnSnapshotChange.current?.(startedSnapshot);
            void (0, arlo_sdk_1.applyFlowSessionEffect)(session, effect, savedHandlers.current);
        }
    }, [autoStart, session]);
    const sortedComponents = (0, react_1.useMemo)(() => [...(snapshot.currentScreen?.components ?? [])].sort((a, b) => a.order - b.order), [snapshot.currentScreen]);
    const theme = (0, react_1.useMemo)(() => (snapshot.currentScreen ? getThemeForScreen(snapshot.currentScreen) : LIGHT_THEME), [snapshot.currentScreen]);
    const context = {
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
                emitAnalyticsEvent(handlers, session, nextSnapshot, (0, arlo_sdk_1.createComponentInteractionAnalyticsEvent)(nextSnapshot, component, value));
            }
        },
        onPressButton: async (componentId) => {
            const currentSnapshot = session.getSnapshot();
            const currentHandlers = handlers;
            const buttonComponent = findButtonComponent(currentSnapshot.currentScreen, componentId);
            if (buttonComponent) {
                emitAnalyticsEvent(currentHandlers, session, currentSnapshot, (0, arlo_sdk_1.createButtonPressedAnalyticsEvent)(currentSnapshot, buttonComponent));
            }
            const effect = session.pressButton(componentId);
            const immediateSnapshot = session.getSnapshot();
            setSnapshot(immediateSnapshot);
            onSnapshotChange?.(immediateSnapshot);
            await (0, arlo_sdk_1.applyFlowSessionEffect)(session, effect, currentHandlers);
            const finalSnapshot = session.getSnapshot();
            setSnapshot(finalSnapshot);
            onSnapshotChange?.(finalSnapshot);
        },
    };
    const renderComponentNode = (component, renderContext, renderTheme, isAbsoluteScreen, parentAlignItems = "stretch") => {
        const customRenderer = componentRenderers?.[component.type];
        const content = customRenderer
            ? customRenderer(component, renderContext)
            : renderDefaultComponent(component, renderContext, renderTheme, registry, iconRenderer, parentAlignItems);
        if (content === null) {
            return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.unsupported, children: unsupportedComponent ? (unsupportedComponent(component)) : ((0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.unsupportedText, children: ["Unsupported component: ", component.type] })) }, component.id));
        }
        return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: getComponentWrapperStyle(component, isAbsoluteScreen, parentAlignItems), children: content }, component.id));
    };
    const renderAutoLayoutScreen = (screen, components, renderContext, renderTheme) => {
        const padding = getScreenPadding(screen);
        const backgroundColor = screen.style?.backgroundColor ?? "#FFFFFF";
        const justifyContent = screen.style?.justifyContent ?? "flex-start";
        const alignItems = screen.style?.alignItems ?? "center";
        const { main, bottom } = splitAutoLayoutComponents(components);
        return ((0, jsx_runtime_1.jsxs)(SafeView, { style: { flex: 1, backgroundColor }, children: [(0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { style: { flex: 1, width: "100%" }, contentInsetAdjustmentBehavior: "automatic", automaticallyAdjustKeyboardInsets: true, keyboardShouldPersistTaps: "handled", contentContainerStyle: [
                        styles.container,
                        {
                            backgroundColor,
                            paddingTop: padding.top,
                            paddingRight: padding.right,
                            paddingBottom: bottom.length > 0 ? 12 : padding.bottom,
                            paddingLeft: padding.left,
                        },
                    ], children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
                            styles.autoLayoutMain,
                            {
                                backgroundColor,
                                justifyContent,
                                alignItems,
                            },
                        ], children: main.map((component) => renderComponentNode(component, renderContext, renderTheme, false, alignItems)) }) }), bottom.length > 0 ? ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
                        styles.autoLayoutBottom,
                        {
                            backgroundColor,
                            paddingTop: 12,
                            paddingRight: padding.right,
                            paddingBottom: padding.bottom,
                            paddingLeft: padding.left,
                        },
                    ], children: bottom.map((component) => renderComponentNode(component, renderContext, renderTheme, false, alignItems)) })) : null] }));
    };
    if (!snapshot.currentScreen) {
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: emptyState });
    }
    if (snapshot.currentScreen.customScreenKey) {
        const registeredScreen = registry?.getScreen(snapshot.currentScreen.customScreenKey);
        const importedPreviewScreen = getImportedPreviewScreen(snapshot.currentScreen);
        if (registeredScreen) {
            return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: registeredScreen({
                    session,
                    snapshot,
                    screen: snapshot.currentScreen,
                }) }));
        }
        if (importedPreviewScreen) {
            const previewComponents = [...(importedPreviewScreen.components ?? [])].sort((a, b) => a.order - b.order);
            const previewTheme = getThemeForScreen(importedPreviewScreen);
            const previewContext = {
                ...context,
                onValueChange: () => undefined,
                onPressButton: async () => undefined,
            };
            return renderAutoLayoutScreen(importedPreviewScreen, previewComponents, previewContext, previewTheme);
        }
        return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: unsupportedScreen ? (unsupportedScreen(snapshot.currentScreen)) : ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.unsupported, children: (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.unsupportedText, children: ["Unsupported screen: ", snapshot.currentScreen.customScreenKey] }) })) }));
    }
    if (snapshot.currentScreen.layoutMode === "absolute") {
        const bgColor = snapshot.currentScreen.style?.backgroundColor ?? "#FFFFFF";
        return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: { flex: 1, backgroundColor: bgColor }, children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: [{ flex: 1 }, getScreenContainerStyle(snapshot.currentScreen)], children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.absoluteContainer, children: sortedComponents.map((component) => renderComponentNode(component, context, theme, true)) }) }) }));
    }
    return renderAutoLayoutScreen(snapshot.currentScreen, sortedComponents, context, theme);
}
// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = react_native_1.StyleSheet.create({
    container: {
        flexGrow: 1,
        width: "100%",
    },
    componentBlock: {
        alignSelf: "stretch",
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
//# sourceMappingURL=ArloFlowRenderer.js.map