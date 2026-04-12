import { applyFlowSessionEffect } from "./bridge";
import { createFlowSession } from "./runtime";
import type {
  ArloClient,
  FlowBridgeHandlers,
  FlowSessionSnapshot,
  FlowSession,
  GetFlowOptions,
  SDKFlowResponse,
} from "./types";
import { ArloSDKError } from "./types";

export type PresentationStatus =
  | "idle"
  | "loading"
  | "presented"
  | "dismissed"
  | "completed"
  | "error";

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
  getHandlers(): FlowBridgeHandlers | undefined;
  presentFlow(slug: string, options?: PresentFlowOptions): Promise<ArloPresentationState>;
  presentEntryPoint(
    entryPointKey: string,
    options?: PresentFlowOptions
  ): Promise<ArloPresentationState>;
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

function createInitialState(): ArloPresentationState {
  return {
    status: "idle",
    flowSlug: null,
    response: null,
    session: null,
    error: null,
  };
}

function mapSnapshotStatus(snapshot: FlowSessionSnapshot): PresentationStatus {
  if (snapshot.status === "completed") {
    return "completed";
  }

  if (snapshot.status === "dismissed") {
    return "dismissed";
  }

  if (snapshot.status === "active") {
    return "presented";
  }

  return "idle";
}

export function createArloPresenter(
  options: CreateArloPresenterOptions
): ArloPresenter {
  let state = createInitialState();
  const listeners = new Set<(state: ArloPresentationState) => void>();

  const resolvedHandlers: FlowBridgeHandlers = {
    ...options.handlers,
    onAnalyticsEvent: (payload) => {
      void options.client.trackAnalyticsEvent(payload.event).catch(() => {
        // Silently swallow analytics errors to avoid interrupting the user flow
      });

      return options.handlers?.onAnalyticsEvent?.(payload);
    },
  };

  function notify(): void {
    for (const listener of listeners) {
      listener(state);
    }
  }

  function setState(
    updater:
      | ArloPresentationState
      | ((previous: ArloPresentationState) => ArloPresentationState)
  ): ArloPresentationState {
    state = typeof updater === "function" ? updater(state) : updater;
    notify();
    return state;
  }

  async function presentResolvedFlow(
    requestedKey: string,
    loader: () => Promise<SDKFlowResponse>,
    presentOptions: PresentFlowOptions = {}
  ): Promise<ArloPresentationState> {
    setState((previous) => ({
      ...previous,
      status: "loading",
      flowSlug: requestedKey,
      error: null,
    }));

    try {
      const response = await loader();
      const session = createFlowSession(response, {
        identity: options.client.getIdentity(),
        initialValues: presentOptions.initialValues,
        projectId: options.client.getProjectId(),
      });

      const effect = session.start();
      await applyFlowSessionEffect(session, effect, resolvedHandlers);

      const snapshot = session.getSnapshot();
      const nextStatus =
        snapshot.status === "dismissed"
          ? "dismissed"
          : snapshot.status === "completed"
            ? "completed"
            : "presented";

      return setState({
        status: nextStatus,
        flowSlug: response.flow.slug,
        response,
        session,
        error: null,
      });
    } catch (error) {
      const sdkError =
        error instanceof ArloSDKError
          ? error
          : new ArloSDKError("Failed to present flow");

      return setState({
        status: "error",
        flowSlug: requestedKey,
        response: null,
        session: null,
        error: sdkError,
      });
    }
  }

  return {
    getState(): ArloPresentationState {
      return state;
    },
    getHandlers(): FlowBridgeHandlers | undefined {
      return resolvedHandlers;
    },
    async presentFlow(
      slug: string,
      presentOptions: PresentFlowOptions = {}
    ): Promise<ArloPresentationState> {
      return presentResolvedFlow(
        slug,
        () => options.client.getFlow(slug, presentOptions),
        presentOptions
      );
    },
    presentEntryPoint(
      entryPointKey: string,
      presentOptions: PresentFlowOptions = {}
    ): Promise<ArloPresentationState> {
      return presentResolvedFlow(
        entryPointKey,
        () => options.client.getEntryPoint(entryPointKey, presentOptions),
        presentOptions
      );
    },
    preloadFlow(slug: string): Promise<SDKFlowResponse> {
      return options.client.preloadFlow(slug);
    },
    preloadEntryPoint(entryPointKey: string): Promise<SDKFlowResponse> {
      return options.client.preloadEntryPoint(entryPointKey);
    },
    async dismiss(): Promise<ArloPresentationState> {
      if (!state.session) {
        return state;
      }

      const effect = state.session.dismiss();
      await applyFlowSessionEffect(state.session, effect, resolvedHandlers);

      return setState((previous) => ({
        ...previous,
        status: "dismissed",
      }));
    },
    syncSession(): ArloPresentationState {
      if (!state.session) {
        return state;
      }

      const snapshot = state.session.getSnapshot();
      return setState((previous) => ({
        ...previous,
        status: mapSnapshotStatus(snapshot),
      }));
    },
    clear(): ArloPresentationState {
      return setState(createInitialState());
    },
    subscribe(listener: (currentState: ArloPresentationState) => void): () => void {
      listeners.add(listener);
      listener(state);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
