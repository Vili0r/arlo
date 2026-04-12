import type { ArloAnalyticsEvent, ArloButtonPressedAnalyticsEvent, ArloComponentInteractionAnalyticsEvent, FlowComponent, FlowSessionEffect, FlowSessionSnapshot } from "./types";
type AnalyticsInteractiveComponent = Extract<FlowComponent, {
    type: "TEXT_INPUT" | "SINGLE_SELECT" | "MULTI_SELECT" | "SLIDER";
}>;
type AnalyticsButtonComponent = Extract<FlowComponent, {
    type: "BUTTON";
}>;
export declare function createAnalyticsEventsForEffect(snapshot: FlowSessionSnapshot, effect: FlowSessionEffect): ArloAnalyticsEvent[];
export declare function createButtonPressedAnalyticsEvent(snapshot: FlowSessionSnapshot, component: AnalyticsButtonComponent): ArloButtonPressedAnalyticsEvent;
export declare function createComponentInteractionAnalyticsEvent(snapshot: FlowSessionSnapshot, component: AnalyticsInteractiveComponent, value: string | string[] | number | boolean | null | undefined): ArloComponentInteractionAnalyticsEvent;
export {};
//# sourceMappingURL=analytics.d.ts.map