import { createAnalyticsEventsForEffect } from "./analytics";
import type { FlowSession, FlowSessionEffect } from "./runtime";
import type { ArloAnalyticsEvent } from "./types";

export interface FlowBridgeBasePayload {
  session: FlowSession;
}

export interface FlowBridgeLifecyclePayload extends FlowBridgeBasePayload {
  snapshot: ReturnType<FlowSession["getSnapshot"]>;
}

export interface FlowBridgeActionPayload extends FlowBridgeLifecyclePayload {
  effect: FlowSessionEffect;
}

export interface FlowBridgeAnalyticsPayload extends FlowBridgeLifecyclePayload {
  event: ArloAnalyticsEvent;
  effect?: FlowSessionEffect;
}

export interface FlowBridgeValidationPayload extends FlowBridgeLifecyclePayload {
  effect: Extract<FlowSessionEffect, { type: "validation_failed" }>;
}

export interface FlowBridgeHandlers {
  onOpenUrl?: (payload: FlowBridgeActionPayload & { url: string }) => void | Promise<void>;
  onDeepLink?: (payload: FlowBridgeActionPayload & { url: string }) => void | Promise<void>;
  onCustomEvent?: (payload: FlowBridgeActionPayload & { eventName: string }) => void | Promise<void>;
  onRequestNotifications?: (payload: FlowBridgeActionPayload) => void | Promise<void>;
  onRequestTracking?: (payload: FlowBridgeActionPayload) => void | Promise<void>;
  onRestorePurchases?: (payload: FlowBridgeActionPayload) => void | Promise<void>;
  onCompleted?: (payload: FlowBridgeLifecyclePayload) => void | Promise<void>;
  onDismissed?: (payload: FlowBridgeLifecyclePayload) => void | Promise<void>;
  onScreenChanged?: (payload: FlowBridgeLifecyclePayload) => void | Promise<void>;
  onAnalyticsEvent?: (payload: FlowBridgeAnalyticsPayload) => void | Promise<void>;
  onValidationFailed?: (payload: FlowBridgeValidationPayload) => void | Promise<void>;
}

export async function applyFlowSessionEffect(
  session: FlowSession,
  effect: FlowSessionEffect,
  handlers: FlowBridgeHandlers = {}
): Promise<void> {
  const snapshot = session.getSnapshot();
  const lifecyclePayload: FlowBridgeLifecyclePayload = {
    session,
    snapshot,
  };

  switch (effect.type) {
    case "open_url":
      await handlers.onOpenUrl?.({
        ...lifecyclePayload,
        effect,
        url: effect.url,
      });
      break;
    case "deep_link":
      await handlers.onDeepLink?.({
        ...lifecyclePayload,
        effect,
        url: effect.url,
      });
      break;
    case "custom_event":
      await handlers.onCustomEvent?.({
        ...lifecyclePayload,
        effect,
        eventName: effect.eventName,
      });
      break;
    case "request_notifications":
      await handlers.onRequestNotifications?.({
        ...lifecyclePayload,
        effect,
      });
      break;
    case "request_tracking":
      await handlers.onRequestTracking?.({
        ...lifecyclePayload,
        effect,
      });
      break;
    case "restore_purchases":
      await handlers.onRestorePurchases?.({
        ...lifecyclePayload,
        effect,
      });
      break;
    case "completed":
      await handlers.onCompleted?.(lifecyclePayload);
      break;
    case "dismissed":
      await handlers.onDismissed?.(lifecyclePayload);
      break;
    case "screen_changed":
      await handlers.onScreenChanged?.(lifecyclePayload);
      break;
    case "validation_failed":
      await handlers.onValidationFailed?.({
        ...lifecyclePayload,
        effect,
      });
      break;
    case "noop":
      break;
    default: {
      const exhaustiveCheck: never = effect;
      return exhaustiveCheck;
    }
  }

  const analyticsEvents = createAnalyticsEventsForEffect(snapshot, effect);

  for (const event of analyticsEvents) {
    await handlers.onAnalyticsEvent?.({
      ...lifecyclePayload,
      effect,
      event,
    });
  }
}
