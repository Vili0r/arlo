import type { ReactNode } from "react";

import type {
  FlowBridgeHandlers,
  FlowComponent,
  FlowSession,
  FlowSessionSnapshot,
} from "arlo-sdk";

export interface ArloComponentRenderContext {
  session: FlowSession;
  snapshot: FlowSessionSnapshot;
  handlers?: FlowBridgeHandlers;
  onValueChange: (fieldKey: string, value: string | string[] | number | boolean | null) => void;
  onPressButton: (componentId: string) => Promise<void>;
}

export type ArloComponentRenderer<T extends FlowComponent = FlowComponent> = (
  component: T,
  context: ArloComponentRenderContext
) => ReactNode;

export type ArloComponentRendererMap = Partial<{
  [K in FlowComponent["type"]]: ArloComponentRenderer<Extract<FlowComponent, { type: K }>>;
}>;

export interface ArloFlowRendererProps {
  session: FlowSession;
  handlers?: FlowBridgeHandlers;
  componentRenderers?: ArloComponentRendererMap;
  autoStart?: boolean;
  emptyState?: ReactNode;
  unsupportedComponent?: (component: FlowComponent) => ReactNode;
  onSnapshotChange?: (snapshot: FlowSessionSnapshot) => void;
}
