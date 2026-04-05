import type { ArloClient, FlowBridgeHandlers, FlowSession, GetFlowOptions, SDKFlowResponse } from "./types";
import { ArloSDKError } from "./types";
export type PresentationStatus = "idle" | "loading" | "presented" | "dismissed" | "completed" | "error";
type PresentationValue = string | string[] | number | boolean | null | undefined;
export interface PresentFlowOptions extends GetFlowOptions {
    initialValues?: Record<string, PresentationValue>;
}
export interface ArloPresentationState {
    status: PresentationStatus;
    flowSlug: string | null;
    response: SDKFlowResponse | null;
    session: FlowSession | null;
    error: ArloSDKError | null;
}
export interface ArloPresenter {
    getState(): ArloPresentationState;
    presentFlow(slug: string, options?: PresentFlowOptions): Promise<ArloPresentationState>;
    presentEntryPoint(entryPointKey: string, options?: PresentFlowOptions): Promise<ArloPresentationState>;
    preloadFlow(slug: string): Promise<SDKFlowResponse>;
    preloadEntryPoint(entryPointKey: string): Promise<SDKFlowResponse>;
    dismiss(): Promise<ArloPresentationState>;
    syncSession(): ArloPresentationState;
    clear(): ArloPresentationState;
    subscribe(listener: (state: ArloPresentationState) => void): () => void;
}
export interface CreateArloPresenterOptions {
    client: ArloClient;
    handlers?: FlowBridgeHandlers;
}
export declare function createArloPresenter(options: CreateArloPresenterOptions): ArloPresenter;
export {};
//# sourceMappingURL=presenter.d.ts.map