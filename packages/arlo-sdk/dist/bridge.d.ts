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
    effect: Extract<FlowSessionEffect, {
        type: "validation_failed";
    }>;
}
export interface FlowBridgeHandlers {
    onOpenUrl?: (payload: FlowBridgeActionPayload & {
        url: string;
    }) => void | Promise<void>;
    onDeepLink?: (payload: FlowBridgeActionPayload & {
        url: string;
    }) => void | Promise<void>;
    onCustomEvent?: (payload: FlowBridgeActionPayload & {
        eventName: string;
    }) => void | Promise<void>;
    onRequestNotifications?: (payload: FlowBridgeActionPayload) => void | Promise<void>;
    onRequestTracking?: (payload: FlowBridgeActionPayload) => void | Promise<void>;
    onRestorePurchases?: (payload: FlowBridgeActionPayload) => void | Promise<void>;
    onCompleted?: (payload: FlowBridgeLifecyclePayload) => void | Promise<void>;
    onDismissed?: (payload: FlowBridgeLifecyclePayload) => void | Promise<void>;
    onScreenChanged?: (payload: FlowBridgeLifecyclePayload) => void | Promise<void>;
    onValidationFailed?: (payload: FlowBridgeValidationPayload) => void | Promise<void>;
}
export declare function applyFlowSessionEffect(session: FlowSession, effect: FlowSessionEffect, handlers?: FlowBridgeHandlers): Promise<void>;
//# sourceMappingURL=bridge.d.ts.map