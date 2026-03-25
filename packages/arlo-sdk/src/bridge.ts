import type { FlowSession, FlowSessionEffect } from "./runtime";

export interface FlowBridgeBasePayload {
  session: FlowSession;
}

export interface FlowBridgeLifecyclePayload extends FlowBridgeBasePayload {
  snapshot: ReturnType<FlowSession["getSnapshot"]>;
}

export interface FlowBridgeActionPayload extends FlowBridgeLifecyclePayload {
  effect: FlowSessionEffect;
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
      return;
    case "deep_link":
      await handlers.onDeepLink?.({
        ...lifecyclePayload,
        effect,
        url: effect.url,
      });
      return;
    case "custom_event":
      await handlers.onCustomEvent?.({
        ...lifecyclePayload,
        effect,
        eventName: effect.eventName,
      });
      return;
    case "request_notifications":
      await handlers.onRequestNotifications?.({
        ...lifecyclePayload,
        effect,
      });
      return;
    case "request_tracking":
      await handlers.onRequestTracking?.({
        ...lifecyclePayload,
        effect,
      });
      return;
    case "restore_purchases":
      await handlers.onRestorePurchases?.({
        ...lifecyclePayload,
        effect,
      });
      return;
    case "completed":
      await handlers.onCompleted?.(lifecyclePayload);
      return;
    case "dismissed":
      await handlers.onDismissed?.(lifecyclePayload);
      return;
    case "screen_changed":
      await handlers.onScreenChanged?.(lifecyclePayload);
      return;
    case "validation_failed":
      await handlers.onValidationFailed?.({
        ...lifecyclePayload,
        effect,
      });
      return;
    case "noop":
      return;
    default: {
      const exhaustiveCheck: never = effect;
      return exhaustiveCheck;
    }
  }
}
