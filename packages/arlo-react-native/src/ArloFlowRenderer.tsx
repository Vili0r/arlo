import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { applyFlowSessionEffect } from "arlo-sdk";
import type {
  FlowComponent,
  FlowSessionSnapshot,
  Screen,
} from "arlo-sdk";

import type {
  ArloComponentRenderContext,
  ArloComponentRendererMap,
  ArloFlowRendererProps,
} from "./types";

function getScreenContainerStyle(screen: Screen) {
  return {
    backgroundColor: screen.style?.backgroundColor ?? "#0b0b0d",
    paddingTop: screen.style?.paddingTop ?? screen.style?.padding ?? 24,
    paddingBottom: screen.style?.paddingBottom ?? screen.style?.padding ?? 24,
    paddingHorizontal: screen.style?.paddingHorizontal ?? screen.style?.padding ?? 20,
    justifyContent: screen.style?.justifyContent ?? "flex-start",
    alignItems: screen.style?.alignItems ?? "stretch",
  } as const;
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

function getFieldError(snapshot: FlowSessionSnapshot, fieldKey: string): string | null {
  return snapshot.validationErrorsByField[fieldKey] ?? null;
}

function DefaultTextComponent({ component }: { component: Extract<FlowComponent, { type: "TEXT" }> }) {
  return (
    <Text
      style={{
        color: component.props.color ?? "#ffffff",
        fontSize: component.props.fontSize ?? 16,
        fontWeight: component.props.fontWeight ?? "normal",
        textAlign: component.props.textAlign ?? "left",
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

function DefaultButtonComponent({
  component,
  onPress,
}: {
  component: Extract<FlowComponent, { type: "BUTTON" }>;
  onPress: () => Promise<void>;
}) {
  return (
    <Pressable
      onPress={() => {
        void onPress();
      }}
      style={[
        styles.button,
        {
          backgroundColor: component.props.style?.backgroundColor ?? "#ffffff",
          borderRadius: component.props.style?.borderRadius ?? 14,
          borderColor: component.props.style?.borderColor ?? "transparent",
          borderWidth: component.props.style?.borderWidth ?? 0,
        },
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          {
            color: component.props.style?.textColor ?? "#111111",
          },
        ]}
      >
        {component.props.label}
      </Text>
    </Pressable>
  );
}

function DefaultTextInputComponent({
  component,
  context,
}: {
  component: Extract<FlowComponent, { type: "TEXT_INPUT" }>;
  context: ArloComponentRenderContext;
}) {
  const value = coerceStringValue(context.snapshot.values[component.props.fieldKey]);
  const error = getFieldError(context.snapshot, component.props.fieldKey);

  return (
    <View style={styles.fieldGroup}>
      {component.props.label ? <Text style={styles.fieldLabel}>{component.props.label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={(nextValue) => context.onValueChange(component.props.fieldKey, nextValue)}
        placeholder={component.props.placeholder}
        placeholderTextColor="#7a7a85"
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
        style={[styles.input, error ? styles.inputError : undefined]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function OptionPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionPill, selected ? styles.optionPillSelected : undefined]}
    >
      <Text style={[styles.optionPillText, selected ? styles.optionPillTextSelected : undefined]}>
        {label}
      </Text>
    </Pressable>
  );
}

function DefaultSingleSelectComponent({
  component,
  context,
}: {
  component: Extract<FlowComponent, { type: "SINGLE_SELECT" }>;
  context: ArloComponentRenderContext;
}) {
  const value = coerceStringValue(context.snapshot.values[component.props.fieldKey]);
  const error = getFieldError(context.snapshot, component.props.fieldKey);

  return (
    <View style={styles.fieldGroup}>
      {component.props.label ? <Text style={styles.fieldLabel}>{component.props.label}</Text> : null}
      <View style={styles.optionGroup}>
        {component.props.options.map((option) => (
          <OptionPill
            key={option.id}
            label={option.label}
            selected={value === option.id}
            onPress={() => context.onValueChange(component.props.fieldKey, option.id)}
          />
        ))}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function DefaultMultiSelectComponent({
  component,
  context,
}: {
  component: Extract<FlowComponent, { type: "MULTI_SELECT" }>;
  context: ArloComponentRenderContext;
}) {
  const values = coerceStringArrayValue(context.snapshot.values[component.props.fieldKey]);
  const error = getFieldError(context.snapshot, component.props.fieldKey);

  return (
    <View style={styles.fieldGroup}>
      {component.props.label ? <Text style={styles.fieldLabel}>{component.props.label}</Text> : null}
      <View style={styles.optionGroup}>
        {component.props.options.map((option) => {
          const selected = values.includes(option.id);

          return (
            <OptionPill
              key={option.id}
              label={option.label}
              selected={selected}
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
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function DefaultSliderComponent({
  component,
  context,
}: {
  component: Extract<FlowComponent, { type: "SLIDER" }>;
  context: ArloComponentRenderContext;
}) {
  const currentValue = coerceNumberValue(
    context.snapshot.values[component.props.fieldKey],
    component.props.defaultValue ?? component.props.min
  );

  const step = component.props.step ?? 1;
  const nextValue = Math.min(component.props.max, currentValue + step);
  const previousValue = Math.max(component.props.min, currentValue - step);

  return (
    <View style={styles.fieldGroup}>
      {component.props.label ? <Text style={styles.fieldLabel}>{component.props.label}</Text> : null}
      <View style={styles.sliderCard}>
        <Text style={styles.sliderValue}>{String(currentValue)}</Text>
        <View style={styles.sliderActions}>
          <OptionPill
            label={component.props.minLabel ?? "-"}
            selected={false}
            onPress={() => context.onValueChange(component.props.fieldKey, previousValue)}
          />
          <OptionPill
            label={component.props.maxLabel ?? "+"}
            selected={false}
            onPress={() => context.onValueChange(component.props.fieldKey, nextValue)}
          />
        </View>
      </View>
    </View>
  );
}

function DefaultProgressBarComponent({
  snapshot,
  component,
}: {
  snapshot: FlowSessionSnapshot;
  component: Extract<FlowComponent, { type: "PROGRESS_BAR" }>;
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
          backgroundColor: component.props.backgroundColor ?? "#26262b",
          height: component.props.height ?? 6,
        },
      ]}
    >
      <View
        style={{
          width: `${progress}%`,
          backgroundColor: component.props.color ?? "#ffffff",
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
}: {
  snapshot: FlowSessionSnapshot;
  component: Extract<FlowComponent, { type: "PAGE_INDICATOR" }>;
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
                ? component.props.activeColor ?? "#ffffff"
                : component.props.inactiveColor ?? "#4b4b55",
          }}
        />
      ))}
    </View>
  );
}

function renderDefaultComponent(
  component: FlowComponent,
  context: ArloComponentRenderContext,
  registry?: ArloFlowRendererProps["registry"]
) {
  switch (component.type) {
    case "TEXT":
      return <DefaultTextComponent component={component} />;
    case "IMAGE":
      return <DefaultImageComponent component={component} />;
    case "BUTTON":
      return <DefaultButtonComponent component={component} onPress={() => context.onPressButton(component.id)} />;
    case "TEXT_INPUT":
      return <DefaultTextInputComponent component={component} context={context} />;
    case "SINGLE_SELECT":
      return <DefaultSingleSelectComponent component={component} context={context} />;
    case "MULTI_SELECT":
      return <DefaultMultiSelectComponent component={component} context={context} />;
    case "SLIDER":
      return <DefaultSliderComponent component={component} context={context} />;
    case "PROGRESS_BAR":
      return <DefaultProgressBarComponent component={component} snapshot={context.snapshot} />;
    case "PAGE_INDICATOR":
      return <DefaultPageIndicatorComponent component={component} snapshot={context.snapshot} />;
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

export function ArloFlowRenderer({
  session,
  handlers,
  componentRenderers,
  registry,
  autoStart = true,
  emptyState = null,
  unsupportedComponent,
  unsupportedScreen,
  onSnapshotChange,
}: ArloFlowRendererProps) {
  const [snapshot, setSnapshot] = useState(() => session.getSnapshot());

  useEffect(() => {
    const nextSnapshot = session.getSnapshot();
    setSnapshot(nextSnapshot);
    onSnapshotChange?.(nextSnapshot);

    if (autoStart && session.getSnapshot().status === "idle") {
      const effect = session.start();
      const startedSnapshot = session.getSnapshot();
      setSnapshot(startedSnapshot);
      onSnapshotChange?.(startedSnapshot);
      void applyFlowSessionEffect(session, effect, handlers);
    }
  }, [autoStart, handlers, onSnapshotChange, session]);

  const sortedComponents = useMemo(
    () =>
      [...(snapshot.currentScreen?.components ?? [])].sort((a, b) => a.order - b.order),
    [snapshot.currentScreen]
  );

  const context: ArloComponentRenderContext = {
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
      await applyFlowSessionEffect(session, effect, handlers);
      const finalSnapshot = session.getSnapshot();
      setSnapshot(finalSnapshot);
      onSnapshotChange?.(finalSnapshot);
    },
  };

  if (!snapshot.currentScreen) {
    return <>{emptyState}</>;
  }

  if (snapshot.currentScreen.customScreenKey) {
    const registeredScreen = registry?.getScreen(snapshot.currentScreen.customScreenKey);

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

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        getScreenContainerStyle(snapshot.currentScreen),
      ]}
    >
      {sortedComponents.map((component) => {
        const customRenderer = componentRenderers?.[component.type] as
          | ArloComponentRendererMap[typeof component.type]
          | undefined;

        const content = customRenderer
          ? customRenderer(component as never, context as never)
          : renderDefaultComponent(component, context, registry);

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
          <View key={component.id} style={styles.componentBlock}>
            {content}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 16,
  },
  componentBlock: {
    width: "100%",
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
