import type { FlowSession, FlowSessionEffect } from "./runtime";

export interface FlowBridgeHandlers {
  onOpenUrl?: (url: string) => void | Promise<void>;
  onDeepLink?: (url: string) => void | Promise<void>;
  onCustomEvent?: (eventName: string) => void | Promise<void>;
  onRequestNotifications?: () => void | Promise<void>;
  onRequestTracking?: () => void | Promise<void>;
  onRestorePurchases?: () => void | Promise<void>;
  onCompleted?: (session: FlowSession) => void | Promise<void>;
  onDismissed?: (session: FlowSession) => void | Promise<void>;
  onScreenChanged?: (session: FlowSession) => void | Promise<void>;
}

export async function applyFlowSessionEffect(
  session: FlowSession,
  effect: FlowSessionEffect,
  handlers: FlowBridgeHandlers = {}
): Promise<void> {
  switch (effect.type) {
    case "open_url":
      await handlers.onOpenUrl?.(effect.url);
      return;
    case "deep_link":
      await handlers.onDeepLink?.(effect.url);
      return;
    case "custom_event":
      await handlers.onCustomEvent?.(effect.eventName);
      return;
    case "request_notifications":
      await handlers.onRequestNotifications?.();
      return;
    case "request_tracking":
      await handlers.onRequestTracking?.();
      return;
    case "restore_purchases":
      await handlers.onRestorePurchases?.();
      return;
    case "completed":
      await handlers.onCompleted?.(session);
      return;
    case "dismissed":
      await handlers.onDismissed?.(session);
      return;
    case "screen_changed":
      await handlers.onScreenChanged?.(session);
      return;
    case "noop":
      return;
    default: {
      const exhaustiveCheck: never = effect;
      return exhaustiveCheck;
    }
  }
}
