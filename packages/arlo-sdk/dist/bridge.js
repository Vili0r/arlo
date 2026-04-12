"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyFlowSessionEffect = applyFlowSessionEffect;
const analytics_1 = require("./analytics");
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
            const exhaustiveCheck = effect;
            return exhaustiveCheck;
        }
    }
    const analyticsEvents = (0, analytics_1.createAnalyticsEventsForEffect)(snapshot, effect);
    for (const event of analyticsEvents) {
        await handlers.onAnalyticsEvent?.({
            ...lifecyclePayload,
            effect,
            event,
        });
    }
}
//# sourceMappingURL=bridge.js.map