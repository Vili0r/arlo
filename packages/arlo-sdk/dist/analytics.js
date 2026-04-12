"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnalyticsEventsForEffect = createAnalyticsEventsForEffect;
exports.createButtonPressedAnalyticsEvent = createButtonPressedAnalyticsEvent;
exports.createComponentInteractionAnalyticsEvent = createComponentInteractionAnalyticsEvent;
function createBaseEvent(snapshot) {
    return {
        timestamp: new Date().toISOString(),
        projectId: snapshot.projectId,
        userId: snapshot.userId,
        flowSlug: snapshot.flowSlug,
        flowVersion: snapshot.flowVersion,
        sessionId: snapshot.sessionId,
    };
}
function createScreenContext(snapshot) {
    return {
        screenId: snapshot.currentScreenId,
        screenIndex: snapshot.currentScreenIndex,
        screenName: snapshot.currentScreen?.name ?? null,
        totalScreens: snapshot.totalScreens,
    };
}
function normalizeDuration(durationMs) {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
        return 0;
    }
    return Math.round(durationMs);
}
function sanitizeInteractionValue(component, value) {
    if (component.type === "TEXT_INPUT") {
        return {
            value: null,
            valueRedacted: true,
        };
    }
    if (component.type === "MULTI_SELECT") {
        return {
            value: Array.isArray(value)
                ? value.filter((item) => typeof item === "string")
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
function createAnalyticsEventsForEffect(snapshot, effect) {
    const baseEvent = createBaseEvent(snapshot);
    const screenContext = createScreenContext(snapshot);
    switch (effect.type) {
        case "screen_changed": {
            const screenViewedEvent = {
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
function createButtonPressedAnalyticsEvent(snapshot, component) {
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
function createComponentInteractionAnalyticsEvent(snapshot, component, value) {
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
//# sourceMappingURL=analytics.js.map