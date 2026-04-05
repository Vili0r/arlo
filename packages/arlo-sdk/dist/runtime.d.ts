import type { ArloIdentifyInput, Screen, SDKFlowResponse } from "./types";
type FlowValue = string | string[] | number | boolean | null | undefined;
export interface FlowSessionOptions {
    initialValues?: Record<string, FlowValue>;
    identity?: ArloIdentifyInput | null;
}
export type FlowSessionStatus = "idle" | "active" | "completed" | "dismissed";
export interface FlowFieldError {
    fieldKey: string;
    componentId: string;
    message: string;
}
export type FlowSessionEffect = {
    type: "screen_changed";
    screenId: string;
    screenIndex: number;
} | {
    type: "completed";
    screenId: string;
    screenIndex: number;
} | {
    type: "dismissed";
    screenId: string;
    screenIndex: number;
} | {
    type: "validation_failed";
    errors: FlowFieldError[];
} | {
    type: "open_url";
    url: string;
} | {
    type: "deep_link";
    url: string;
} | {
    type: "custom_event";
    eventName: string;
} | {
    type: "request_notifications";
} | {
    type: "request_tracking";
} | {
    type: "restore_purchases";
} | {
    type: "noop";
};
export interface FlowSessionSnapshot {
    flowSlug: string;
    flowVersion: number;
    status: FlowSessionStatus;
    currentScreenId: string | null;
    currentScreenIndex: number;
    currentScreen: Screen | null;
    totalScreens: number;
    values: Record<string, FlowValue>;
    visibleScreenIds: string[];
    identity: ArloIdentifyInput | null;
    validationErrors: FlowFieldError[];
    validationErrorsByField: Record<string, string>;
    isCurrentScreenValid: boolean;
}
export interface FlowSession {
    start(): FlowSessionEffect;
    getSnapshot(): FlowSessionSnapshot;
    getCurrentScreen(): Screen | null;
    getVisibleScreens(): Screen[];
    getValue(fieldKey: string): FlowValue;
    setValue(fieldKey: string, value: FlowValue): FlowSessionSnapshot;
    validateCurrentScreen(): FlowFieldError[];
    canContinue(): boolean;
    goToScreenId(screenId: string): FlowSessionEffect;
    next(): FlowSessionEffect;
    previous(): FlowSessionEffect;
    dismiss(): FlowSessionEffect;
    pressButton(componentId: string): FlowSessionEffect;
}
export declare function createFlowSession(response: SDKFlowResponse, options?: FlowSessionOptions): FlowSession;
export {};
//# sourceMappingURL=runtime.d.ts.map