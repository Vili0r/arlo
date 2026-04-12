import { z } from "zod";
import { buttonActionSchema, branchRuleSchema, flowComponentSchema, flowConfigSchema, flowSettingsSchema, screenSchema, sdkErrorCodeSchema, sdkErrorResponseSchema, sdkFlowResponseSchema, skipConditionSchema } from "./schema";
export type FlowComponent = z.infer<typeof flowComponentSchema>;
export type BranchRule = z.infer<typeof branchRuleSchema>;
export type SkipCondition = z.infer<typeof skipConditionSchema>;
export type Screen = z.infer<typeof screenSchema>;
export type FlowSettings = z.infer<typeof flowSettingsSchema>;
export type FlowConfig = z.infer<typeof flowConfigSchema>;
export type SDKFlowResponse = z.infer<typeof sdkFlowResponseSchema>;
export type SDKErrorCode = z.infer<typeof sdkErrorCodeSchema>;
export type SDKErrorResponse = z.infer<typeof sdkErrorResponseSchema>;
export type ButtonAction = z.infer<typeof buttonActionSchema>;
export type ArloUserTraits = Record<string, string | number | boolean | string[] | null | undefined>;
export interface ArloIdentifyInput {
    userId: string;
    traits?: ArloUserTraits;
}
export interface ArloClientOptions {
    apiKey: string;
    projectId: string;
    baseUrl: string;
    fetch?: typeof fetch;
    cache?: ArloFlowCache;
    headers?: Record<string, string>;
    offlineFallback?: boolean;
    /**
     * Maximum age (in ms) of a cached entry before a blocking fetch is required
     * instead of returning stale data. Defaults to 7 days.
     * Set to 0 to always require a fresh fetch (disables SWR).
     * Set to Infinity to never force a blocking fetch.
     */
    maxStaleMs?: number;
}
export interface ArloFlowCacheEntry {
    response: SDKFlowResponse;
    cachedAt: number;
    etag?: string;
}
export interface ArloFlowCache {
    get(key: string): Promise<ArloFlowCacheEntry | null> | ArloFlowCacheEntry | null;
    set(key: string, value: ArloFlowCacheEntry): Promise<void> | void;
    delete?(key: string): Promise<void> | void;
    /** Return all stored cache keys. Used to clear the entire cache on identity change. */
    keys?(): Promise<string[]> | string[];
}
export interface GetFlowOptions {
    useCache?: boolean;
    forceRefresh?: boolean;
    allowOfflineFallback?: boolean;
}
export interface ArloEventMap {
    "flow:fetched": SDKFlowResponse;
    "flow:cache-hit": SDKFlowResponse;
    /** Emitted when background SWR revalidation discovers a newer version. */
    "flow:updated": SDKFlowResponse;
    "flow:error": ArloSDKError;
    "user:identified": ArloIdentifyInput;
}
export interface ArloClient {
    identify(input: ArloIdentifyInput): void;
    getIdentity(): ArloIdentifyInput | null;
    getProjectId(): string;
    getFlow(slug: string, options?: GetFlowOptions): Promise<SDKFlowResponse>;
    getEntryPoint(entryPointKey: string, options?: GetFlowOptions): Promise<SDKFlowResponse>;
    preloadFlow(slug: string): Promise<SDKFlowResponse>;
    preloadEntryPoint(entryPointKey: string): Promise<SDKFlowResponse>;
    clearCachedFlow(slug: string): Promise<void>;
    /** Clear all cached flows. Automatically called when identity changes (for A/B consistency). */
    clearAllCachedFlows(): Promise<void>;
    trackAnalyticsEvent(event: ArloAnalyticsEvent): Promise<void>;
    on<K extends keyof ArloEventMap>(event: K, handler: (payload: ArloEventMap[K]) => void): () => void;
}
export type ArloAnalyticsValue = string | string[] | number | boolean | null;
export interface ArloAnalyticsBaseEvent {
    timestamp: string;
    projectId: string | null;
    userId: string | null;
    flowSlug: string;
    flowVersion: number;
    sessionId: string;
}
export interface ArloAnalyticsScreenContext {
    screenId: string | null;
    screenIndex: number;
    screenName: string | null;
    totalScreens: number;
}
export interface ArloFlowStartedAnalyticsEvent extends ArloAnalyticsBaseEvent, ArloAnalyticsScreenContext {
    event: "flow_started";
}
export interface ArloScreenViewedAnalyticsEvent extends ArloAnalyticsBaseEvent, ArloAnalyticsScreenContext {
    event: "screen_viewed";
    source: "start" | "navigation" | "programmatic";
}
export interface ArloButtonPressedAnalyticsEvent extends ArloAnalyticsBaseEvent, ArloAnalyticsScreenContext {
    event: "button_pressed";
    componentId: string;
    componentType: "BUTTON";
    action: ButtonAction;
    label: string | null;
}
export interface ArloComponentInteractionAnalyticsEvent extends ArloAnalyticsBaseEvent, ArloAnalyticsScreenContext {
    event: "component_interaction";
    componentId: string;
    componentType: "TEXT_INPUT" | "SINGLE_SELECT" | "MULTI_SELECT" | "SLIDER";
    fieldKey: string;
    label: string | null;
    value: ArloAnalyticsValue;
    valueRedacted: boolean;
}
export interface ArloFlowCompletedAnalyticsEvent extends ArloAnalyticsBaseEvent, ArloAnalyticsScreenContext {
    event: "flow_completed";
    durationMs: number;
}
export interface ArloFlowDismissedAnalyticsEvent extends ArloAnalyticsBaseEvent, ArloAnalyticsScreenContext {
    event: "flow_dismissed";
}
export interface ArloCustomAnalyticsEvent extends ArloAnalyticsBaseEvent, ArloAnalyticsScreenContext {
    event: "custom_event";
    eventName: string;
}
export type ArloAnalyticsEvent = ArloFlowStartedAnalyticsEvent | ArloScreenViewedAnalyticsEvent | ArloButtonPressedAnalyticsEvent | ArloComponentInteractionAnalyticsEvent | ArloFlowCompletedAnalyticsEvent | ArloFlowDismissedAnalyticsEvent | ArloCustomAnalyticsEvent;
export declare class ArloSDKError extends Error {
    readonly status: number;
    readonly code?: SDKErrorCode | "INVALID_RESPONSE" | "NETWORK_ERROR";
    constructor(message: string, options?: {
        status?: number;
        code?: ArloSDKError["code"];
    });
}
export type { FlowFieldError, FlowSession, FlowSessionEffect, FlowSessionOptions, FlowSessionSnapshot, FlowSessionStatus, } from "./runtime";
export type { FlowBridgeHandlers } from "./bridge";
export type { FlowBridgeActionPayload, FlowBridgeAnalyticsPayload, FlowBridgeBasePayload, FlowBridgeLifecyclePayload, FlowBridgeValidationPayload, } from "./bridge";
export type { ArloPresentationState, ArloPresenter, CreateArloPresenterOptions, PresentationStatus, PresentFlowOptions, } from "./presenter";
export type { ArloCacheStorage, CreatePersistentFlowCacheOptions, } from "./cache";
//# sourceMappingURL=types.d.ts.map