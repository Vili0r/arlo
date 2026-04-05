"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArloFlowRenderer = ArloFlowRenderer;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const arlo_sdk_1 = require("arlo-sdk");
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
    return {
        backgroundColor: screen.style?.backgroundColor ?? "#0b0b0d",
        paddingTop: screen.style?.paddingTop ?? screen.style?.padding ?? 24,
        paddingBottom: screen.style?.paddingBottom ?? screen.style?.padding ?? 24,
        paddingHorizontal: screen.style?.paddingHorizontal ?? screen.style?.padding ?? 20,
        justifyContent: screen.style?.justifyContent ?? "flex-start",
        alignItems: screen.style?.alignItems ?? "stretch",
    };
}
function getComponentWrapperStyle(component, isAbsoluteScreen) {
    const layout = component.layout;
    if (!layout) {
        return isAbsoluteScreen ? { position: "absolute", zIndex: component.order } : styles.componentBlock;
    }
    const baseStyle = {
        display: layout.visible === false ? "none" : "flex",
        zIndex: layout.zIndex ?? component.order,
    };
    if (!isAbsoluteScreen && layout.position !== "absolute") {
        return {
            ...styles.componentBlock,
            ...baseStyle,
        };
    }
    return {
        ...baseStyle,
        position: "absolute",
        left: layout.x ?? 0,
        top: layout.y ?? 0,
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
function getFieldError(snapshot, fieldKey) {
    return snapshot.validationErrorsByField[fieldKey] ?? null;
}
function DefaultTextComponent({ component }) {
    return ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: {
            color: component.props.color ?? "#ffffff",
            fontSize: component.props.fontSize ?? 16,
            fontWeight: component.props.fontWeight ?? "normal",
            textAlign: component.props.textAlign ?? "left",
            lineHeight: component.props.lineHeight && component.props.fontSize
                ? component.props.lineHeight * component.props.fontSize
                : undefined,
            opacity: component.props.opacity ?? 1,
        }, children: component.props.content }));
}
function DefaultImageComponent({ component }) {
    return ((0, jsx_runtime_1.jsx)(react_native_1.Image, { source: { uri: component.props.src }, accessibilityLabel: component.props.alt, resizeMode: component.props.resizeMode ?? "cover", style: {
            width: component.props.width ?? "100%",
            height: component.props.height ?? 220,
            borderRadius: component.props.borderRadius ?? 0,
        } }));
}
function DefaultButtonComponent({ component, onPress, }) {
    return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => {
            void onPress();
        }, style: [
            styles.button,
            {
                backgroundColor: component.props.style?.backgroundColor ?? "#ffffff",
                borderRadius: component.props.style?.borderRadius ?? 14,
                borderColor: component.props.style?.borderColor ?? "transparent",
                borderWidth: component.props.style?.borderWidth ?? 0,
            },
        ], children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                styles.buttonText,
                {
                    color: component.props.style?.textColor ?? "#111111",
                },
            ], children: component.props.label }) }));
}
function DefaultTextInputComponent({ component, context, }) {
    const value = coerceStringValue(context.snapshot.values[component.props.fieldKey]);
    const error = getFieldError(context.snapshot, component.props.fieldKey);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.fieldGroup, children: [component.props.label ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.fieldLabel, children: component.props.label }) : null, (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: value, onChangeText: (nextValue) => context.onValueChange(component.props.fieldKey, nextValue), placeholder: component.props.placeholder, placeholderTextColor: "#7a7a85", keyboardType: component.props.keyboardType === "email"
                    ? "email-address"
                    : component.props.keyboardType === "numeric"
                        ? "numeric"
                        : component.props.keyboardType === "phone"
                            ? "phone-pad"
                            : "default", maxLength: component.props.maxLength, style: [styles.input, error ? styles.inputError : undefined] }), error ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.fieldError, children: error }) : null] }));
}
function OptionPill({ label, selected, onPress, }) {
    return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: onPress, style: [styles.optionPill, selected ? styles.optionPillSelected : undefined], children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.optionPillText, selected ? styles.optionPillTextSelected : undefined], children: label }) }));
}
function DefaultSingleSelectComponent({ component, context, }) {
    const value = coerceStringValue(context.snapshot.values[component.props.fieldKey]);
    const error = getFieldError(context.snapshot, component.props.fieldKey);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.fieldGroup, children: [component.props.label ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.fieldLabel, children: component.props.label }) : null, (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.optionGroup, children: component.props.options.map((option) => ((0, jsx_runtime_1.jsx)(OptionPill, { label: option.label, selected: value === option.id, onPress: () => context.onValueChange(component.props.fieldKey, option.id) }, option.id))) }), error ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.fieldError, children: error }) : null] }));
}
function DefaultMultiSelectComponent({ component, context, }) {
    const values = coerceStringArrayValue(context.snapshot.values[component.props.fieldKey]);
    const error = getFieldError(context.snapshot, component.props.fieldKey);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.fieldGroup, children: [component.props.label ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.fieldLabel, children: component.props.label }) : null, (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.optionGroup, children: component.props.options.map((option) => {
                    const selected = values.includes(option.id);
                    return ((0, jsx_runtime_1.jsx)(OptionPill, { label: option.label, selected: selected, onPress: () => {
                            const nextValues = selected
                                ? values.filter((value) => value !== option.id)
                                : [...values, option.id];
                            context.onValueChange(component.props.fieldKey, nextValues);
                        } }, option.id));
                }) }), error ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.fieldError, children: error }) : null] }));
}
function DefaultSliderComponent({ component, context, }) {
    const currentValue = coerceNumberValue(context.snapshot.values[component.props.fieldKey], component.props.defaultValue ?? component.props.min);
    const step = component.props.step ?? 1;
    const nextValue = Math.min(component.props.max, currentValue + step);
    const previousValue = Math.max(component.props.min, currentValue - step);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.fieldGroup, children: [component.props.label ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.fieldLabel, children: component.props.label }) : null, (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.sliderCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sliderValue, children: String(currentValue) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.sliderActions, children: [(0, jsx_runtime_1.jsx)(OptionPill, { label: component.props.minLabel ?? "-", selected: false, onPress: () => context.onValueChange(component.props.fieldKey, previousValue) }), (0, jsx_runtime_1.jsx)(OptionPill, { label: component.props.maxLabel ?? "+", selected: false, onPress: () => context.onValueChange(component.props.fieldKey, nextValue) })] })] })] }));
}
function DefaultProgressBarComponent({ snapshot, component, }) {
    const progress = snapshot.totalScreens > 1
        ? ((snapshot.currentScreenIndex + 1) / snapshot.totalScreens) * 100
        : 100;
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
            styles.progressTrack,
            {
                backgroundColor: component.props.backgroundColor ?? "#26262b",
                height: component.props.height ?? 6,
            },
        ], children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: {
                width: `${progress}%`,
                backgroundColor: component.props.color ?? "#ffffff",
                height: "100%",
                borderRadius: 999,
            } }) }));
}
function DefaultPageIndicatorComponent({ snapshot, component, }) {
    const size = component.props.size ?? 8;
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.pageIndicatorRow, children: Array.from({ length: snapshot.totalScreens }).map((_, index) => ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: index === snapshot.currentScreenIndex
                    ? component.props.activeColor ?? "#ffffff"
                    : component.props.inactiveColor ?? "#4b4b55",
            } }, index))) }));
}
function renderDefaultComponent(component, context, registry) {
    switch (component.type) {
        case "TEXT":
            return (0, jsx_runtime_1.jsx)(DefaultTextComponent, { component: component });
        case "IMAGE":
            return (0, jsx_runtime_1.jsx)(DefaultImageComponent, { component: component });
        case "BUTTON":
            return (0, jsx_runtime_1.jsx)(DefaultButtonComponent, { component: component, onPress: () => context.onPressButton(component.id) });
        case "TEXT_INPUT":
            return (0, jsx_runtime_1.jsx)(DefaultTextInputComponent, { component: component, context: context });
        case "SINGLE_SELECT":
            return (0, jsx_runtime_1.jsx)(DefaultSingleSelectComponent, { component: component, context: context });
        case "MULTI_SELECT":
            return (0, jsx_runtime_1.jsx)(DefaultMultiSelectComponent, { component: component, context: context });
        case "SLIDER":
            return (0, jsx_runtime_1.jsx)(DefaultSliderComponent, { component: component, context: context });
        case "PROGRESS_BAR":
            return (0, jsx_runtime_1.jsx)(DefaultProgressBarComponent, { component: component, snapshot: context.snapshot });
        case "PAGE_INDICATOR":
            return (0, jsx_runtime_1.jsx)(DefaultPageIndicatorComponent, { component: component, snapshot: context.snapshot });
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
function ArloFlowRenderer({ session, handlers, componentRenderers, registry, autoStart = true, emptyState = null, unsupportedComponent, unsupportedScreen, onSnapshotChange, }) {
    const handlersRef = (0, react_1.useRef)(handlers);
    const onSnapshotChangeRef = (0, react_1.useRef)(onSnapshotChange);
    (0, react_1.useEffect)(() => {
        handlersRef.current = handlers;
        onSnapshotChangeRef.current = onSnapshotChange;
    });
    const [snapshot, setSnapshot] = (0, react_1.useState)(() => session.getSnapshot());
    (0, react_1.useEffect)(() => {
        const nextSnapshot = session.getSnapshot();
        setSnapshot(nextSnapshot);
        onSnapshotChangeRef.current?.(nextSnapshot);
        if (autoStart && session.getSnapshot().status === "idle") {
            const effect = session.start();
            const startedSnapshot = session.getSnapshot();
            setSnapshot(startedSnapshot);
            onSnapshotChangeRef.current?.(startedSnapshot);
            void (0, arlo_sdk_1.applyFlowSessionEffect)(session, effect, handlersRef.current);
        }
    }, [autoStart, session]);
    const sortedComponents = (0, react_1.useMemo)(() => [...(snapshot.currentScreen?.components ?? [])].sort((a, b) => a.order - b.order), [snapshot.currentScreen]);
    const context = {
        session,
        snapshot,
        handlers,
        onValueChange: (fieldKey, value) => {
            const nextSnapshot = session.setValue(fieldKey, value);
            setSnapshot(nextSnapshot);
            onSnapshotChange?.(nextSnapshot);
        },
        onPressButton: async (componentId) => {
            const effect = session.pressButton(componentId);
            const immediateSnapshot = session.getSnapshot();
            setSnapshot(immediateSnapshot);
            onSnapshotChange?.(immediateSnapshot);
            await (0, arlo_sdk_1.applyFlowSessionEffect)(session, effect, handlers);
            const finalSnapshot = session.getSnapshot();
            setSnapshot(finalSnapshot);
            onSnapshotChange?.(finalSnapshot);
        },
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
            const previewContext = {
                ...context,
                onValueChange: () => undefined,
                onPressButton: async () => undefined,
            };
            return ((0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { contentContainerStyle: [
                    styles.container,
                    getScreenContainerStyle(importedPreviewScreen),
                ], children: previewComponents.map((component) => {
                    const customRenderer = componentRenderers?.[component.type];
                    const content = customRenderer
                        ? customRenderer(component, previewContext)
                        : renderDefaultComponent(component, previewContext, registry);
                    if (content === null) {
                        return null;
                    }
                    return (0, jsx_runtime_1.jsx)(react_native_1.View, { children: content }, component.id);
                }) }));
        }
        return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: unsupportedScreen ? (unsupportedScreen(snapshot.currentScreen)) : ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.unsupported, children: (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.unsupportedText, children: ["Unsupported screen: ", snapshot.currentScreen.customScreenKey] }) })) }));
    }
    if (snapshot.currentScreen.layoutMode === "absolute") {
        return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
                styles.absoluteContainer,
                getScreenContainerStyle(snapshot.currentScreen),
            ], children: sortedComponents.map((component) => {
                const customRenderer = componentRenderers?.[component.type];
                const content = customRenderer
                    ? customRenderer(component, context)
                    : renderDefaultComponent(component, context, registry);
                if (content === null) {
                    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.unsupported, children: unsupportedComponent ? (unsupportedComponent(component)) : ((0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.unsupportedText, children: ["Unsupported component: ", component.type] })) }, component.id));
                }
                return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: getComponentWrapperStyle(component, true), children: content }, component.id));
            }) }));
    }
    return ((0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { contentContainerStyle: [
            styles.container,
            getScreenContainerStyle(snapshot.currentScreen),
        ], children: sortedComponents.map((component) => {
            const customRenderer = componentRenderers?.[component.type];
            const content = customRenderer
                ? customRenderer(component, context)
                : renderDefaultComponent(component, context, registry);
            if (content === null) {
                return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.unsupported, children: unsupportedComponent ? (unsupportedComponent(component)) : ((0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.unsupportedText, children: ["Unsupported component: ", component.type] })) }, component.id));
            }
            return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: getComponentWrapperStyle(component, false), children: content }, component.id));
        }) }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flexGrow: 1,
        gap: 16,
    },
    componentBlock: {
        width: "100%",
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
        color: "#f3f3f5",
        fontSize: 14,
        fontWeight: "600",
    },
    input: {
        borderWidth: 1,
        borderColor: "#2c2c34",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: "#ffffff",
        backgroundColor: "#141419",
    },
    inputError: {
        borderColor: "#f36b8d",
    },
    fieldError: {
        color: "#f59cb3",
        fontSize: 12,
        fontWeight: "500",
    },
    button: {
        minHeight: 52,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "700",
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
        borderColor: "#30303a",
        backgroundColor: "#15151b",
    },
    optionPillSelected: {
        backgroundColor: "#ffffff",
        borderColor: "#ffffff",
    },
    optionPillText: {
        color: "#f1f1f3",
        fontSize: 14,
        fontWeight: "600",
    },
    optionPillTextSelected: {
        color: "#111111",
    },
    sliderCard: {
        borderRadius: 18,
        backgroundColor: "#15151b",
        borderWidth: 1,
        borderColor: "#2b2b34",
        padding: 14,
        gap: 12,
    },
    sliderValue: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "700",
    },
    sliderActions: {
        flexDirection: "row",
        gap: 10,
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