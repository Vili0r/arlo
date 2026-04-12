import type { ReactNode } from "react";
import { Text, View } from "react-native";

import type { ArloPresenter } from "arlo-sdk";

import { ArloFlowRenderer } from "./ArloFlowRenderer";
import type { ArloFlowRendererProps } from "./types";
import { useArloPresenter } from "./useArloPresenter";

export interface ArloPresenterRendererProps
  extends Omit<ArloFlowRendererProps, "session"> {
  presenter: ArloPresenter;
  loadingState?: ReactNode;
  errorState?: (message: string) => ReactNode;
}

export function ArloPresenterRenderer({
  presenter,
  loadingState = (
    <View>
      <Text>Loading...</Text>
    </View>
  ),
  errorState,
  handlers,
  ...rendererProps
}: ArloPresenterRendererProps) {
  const state = useArloPresenter(presenter);
  const resolvedHandlers = handlers ?? presenter.getHandlers();

  if (state.status === "loading") {
    return <>{loadingState}</>;
  }

  if (state.status === "error") {
    if (errorState) {
      return <>{errorState(state.error?.message ?? "Unknown error")}</>;
    }

    return (
      <View>
        <Text>{state.error?.message ?? "Failed to load flow"}</Text>
      </View>
    );
  }

  if (!state.session) {
    return <>{rendererProps.emptyState ?? null}</>;
  }

  return (
    <ArloFlowRenderer
      session={state.session}
      {...rendererProps}
      handlers={resolvedHandlers}
      onSnapshotChange={(snapshot) => {
        rendererProps.onSnapshotChange?.(snapshot);
        presenter.syncSession();
      }}
    />
  );
}
