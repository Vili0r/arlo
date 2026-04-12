import type {
  ArloAnalyticsBaseEvent,
  ArloAnalyticsEvent,
  ArloAnalyticsScreenContext,
  ArloAnalyticsValue,
  ArloButtonPressedAnalyticsEvent,
  ArloComponentInteractionAnalyticsEvent,
  FlowComponent,
  FlowSessionEffect,
  FlowSessionSnapshot,
} from "./types";

type AnalyticsInteractiveComponent = Extract<
  FlowComponent,
  { type: "TEXT_INPUT" | "SINGLE_SELECT" | "MULTI_SELECT" | "SLIDER" }
>;

type AnalyticsButtonComponent = Extract<FlowComponent, { type: "BUTTON" }>;

function createBaseEvent(snapshot: FlowSessionSnapshot): ArloAnalyticsBaseEvent {
  return {
    timestamp: new Date().toISOString(),
    projectId: snapshot.projectId,
    userId: snapshot.userId,
    flowSlug: snapshot.flowSlug,
    flowVersion: snapshot.flowVersion,
    sessionId: snapshot.sessionId,
  };
}

function createScreenContext(snapshot: FlowSessionSnapshot): ArloAnalyticsScreenContext {
  return {
    screenId: snapshot.currentScreenId,
    screenIndex: snapshot.currentScreenIndex,
    screenName: snapshot.currentScreen?.name ?? null,
    totalScreens: snapshot.totalScreens,
  };
}

function normalizeDuration(durationMs: number): number {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return 0;
  }

  return Math.round(durationMs);
}

function sanitizeInteractionValue(
  component: AnalyticsInteractiveComponent,
  value: string | string[] | number | boolean | null | undefined
): { value: ArloAnalyticsValue; valueRedacted: boolean } {
  if (component.type === "TEXT_INPUT") {
    return {
      value: null,
      valueRedacted: true,
    };
  }

  if (component.type === "MULTI_SELECT") {
    return {
      value: Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [],
      valueRedacted: false,
    };
  }

  if (component.type === "SINGLE_SELECT") {
    return {
      value: typeof value === "string" ? value : null,
      valueRedacted: false,
    };
  }

  return {
    value: typeof value === "number" ? value : null,
    valueRedacted: false,
  };
}

export function createAnalyticsEventsForEffect(
  snapshot: FlowSessionSnapshot,
  effect: FlowSessionEffect
): ArloAnalyticsEvent[] {
  const baseEvent = createBaseEvent(snapshot);
  const screenContext = createScreenContext(snapshot);

  switch (effect.type) {
    case "screen_changed": {
      const screenViewedEvent: ArloAnalyticsEvent = {
        ...baseEvent,
        ...screenContext,
        event: "screen_viewed",
        source: effect.source,
      };

      if (effect.source !== "start") {
        return [screenViewedEvent];
      }

      return [
        {
          ...baseEvent,
          ...screenContext,
          event: "flow_started",
        },
        screenViewedEvent,
      ];
    }
    case "completed":
      return [
        {
          ...baseEvent,
          ...screenContext,
          event: "flow_completed",
          durationMs: normalizeDuration(snapshot.durationMs),
        },
      ];
    case "dismissed":
      return [
        {
          ...baseEvent,
          ...screenContext,
          event: "flow_dismissed",
        },
      ];
    case "custom_event":
      return [
        {
          ...baseEvent,
          ...screenContext,
          event: "custom_event",
          eventName: effect.eventName,
        },
      ];
    default:
      return [];
  }
}

export function createButtonPressedAnalyticsEvent(
  snapshot: FlowSessionSnapshot,
  component: AnalyticsButtonComponent
): ArloButtonPressedAnalyticsEvent {
  return {
    ...createBaseEvent(snapshot),
    ...createScreenContext(snapshot),
    event: "button_pressed",
    componentId: component.id,
    componentType: "BUTTON",
    action: component.props.action,
    label: component.props.label.trim() || null,
  };
}

export function createComponentInteractionAnalyticsEvent(
  snapshot: FlowSessionSnapshot,
  component: AnalyticsInteractiveComponent,
  value: string | string[] | number | boolean | null | undefined
): ArloComponentInteractionAnalyticsEvent {
  const sanitizedValue = sanitizeInteractionValue(component, value);

  return {
    ...createBaseEvent(snapshot),
    ...createScreenContext(snapshot),
    event: "component_interaction",
    componentId: component.id,
    componentType: component.type,
    fieldKey: component.props.fieldKey,
    label: component.props.label?.trim() || null,
    value: sanitizedValue.value,
    valueRedacted: sanitizedValue.valueRedacted,
  };
}
