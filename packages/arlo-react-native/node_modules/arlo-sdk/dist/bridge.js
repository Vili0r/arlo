"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyFlowSessionEffect = applyFlowSessionEffect;
async function applyFlowSessionEffect(session, effect, handlers = {}) {
    const snapshot = session.getSnapshot();
    const lifecyclePayload = {
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
            const exhaustiveCheck = effect;
            return exhaustiveCheck;
        }
    }
}
//# sourceMappingURL=bridge.js.map