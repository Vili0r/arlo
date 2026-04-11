import type { ReactNode } from "react";

import type {
  FlowBridgeHandlers,
  FlowComponent,
  FlowSession,
  FlowSessionSnapshot,
  Screen,
} from "arlo-sdk";
import type { ArloRegistry } from "./registry";

export interface ArloComponentRenderContext {
  session: FlowSession;
  snapshot: FlowSessionSnapshot;
  handlers?: FlowBridgeHandlers;
  onValueChange: (fieldKey: string, value: string | string[] | number | boolean | null) => void;
  onPressButton: (componentId: string) => Promise<void>;
  /** Render a named icon (e.g. from lucide-react-native). */
  iconRenderer?: ArloIconRenderer;
}

export type ArloComponentRenderer<T extends FlowComponent = FlowComponent> = (
  component: T,
  context: ArloComponentRenderContext
) => ReactNode;

export type ArloComponentRendererMap = Partial<{
  [K in FlowComponent["type"]]: ArloComponentRenderer<Extract<FlowComponent, { type: K }>>;
}>;

export type ArloCustomScreenRenderer = (screen: Screen, context: ArloComponentRenderContext) => ReactNode;

/** A function that renders a named icon. Return null if the icon name is unknown. */
export type ArloIconRenderer = (
  name: string,
  size: number,
  color: string
) => ReactNode;

export interface ArloFlowRendererProps {
  session: FlowSession;
  handlers?: FlowBridgeHandlers;
  componentRenderers?: ArloComponentRendererMap;
  registry?: ArloRegistry;
  /** Provide a function that renders a named icon (e.g. lucide-react-native). */
  iconRenderer?: ArloIconRenderer;
  autoStart?: boolean;
  emptyState?: ReactNode;
  unsupportedComponent?: (component: FlowComponent) => ReactNode;
  unsupportedScreen?: (screen: Screen) => ReactNode;
  onSnapshotChange?: (snapshot: FlowSessionSnapshot) => void;
}
