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
  presentFlow(slug: string, options?: PresentFlowOptions): Promise<ArloPresentationState>;
  preloadFlow(slug: string): Promise<SDKFlowResponse>;
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

  return {
    getState(): ArloPresentationState {
      return state;
    },
    async presentFlow(
      slug: string,
      presentOptions: PresentFlowOptions = {}
    ): Promise<ArloPresentationState> {
      setState((previous) => ({
        ...previous,
        status: "loading",
        flowSlug: slug,
        error: null,
      }));

      try {
        const response = await options.client.getFlow(slug, presentOptions);
        const session = createFlowSession(response, {
          identity: options.client.getIdentity(),
          initialValues: presentOptions.initialValues,
        });

        const effect = session.start();
        await applyFlowSessionEffect(session, effect, options.handlers);

        const snapshot = session.getSnapshot();
        const nextStatus =
          snapshot.status === "dismissed"
            ? "dismissed"
            : snapshot.status === "completed"
              ? "completed"
              : "presented";

        return setState({
          status: nextStatus,
          flowSlug: slug,
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
          flowSlug: slug,
          response: null,
          session: null,
          error: sdkError,
        });
      }
    },
    preloadFlow(slug: string): Promise<SDKFlowResponse> {
      return options.client.preloadFlow(slug);
    },
    async dismiss(): Promise<ArloPresentationState> {
      if (!state.session) {
        return state;
      }

      const effect = state.session.dismiss();
      await applyFlowSessionEffect(state.session, effect, options.handlers);

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
