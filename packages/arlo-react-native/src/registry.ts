import type { ReactNode } from "react";

import type { FlowComponent, FlowSession, FlowSessionSnapshot, Screen } from "arlo-sdk";

export interface ArloRegistryScreenContext {
  session: FlowSession;
  snapshot: FlowSessionSnapshot;
  screen: Screen;
}

export interface ArloRegistryComponentContext extends ArloRegistryScreenContext {
  component: Extract<FlowComponent, { type: "CUSTOM_COMPONENT" }>;
}

export type ArloRegisteredScreen = (context: ArloRegistryScreenContext) => ReactNode;
export type ArloRegisteredComponent = (
  context: ArloRegistryComponentContext
) => ReactNode;

export interface ArloRegistry {
  registerScreen(key: string, renderer: ArloRegisteredScreen): void;
  registerComponent(key: string, renderer: ArloRegisteredComponent): void;
  getScreen(key: string): ArloRegisteredScreen | null;
  getComponent(key: string): ArloRegisteredComponent | null;
}

export function createArloRegistry(): ArloRegistry {
  const screens = new Map<string, ArloRegisteredScreen>();
  const components = new Map<string, ArloRegisteredComponent>();

  return {
    registerScreen(key: string, renderer: ArloRegisteredScreen): void {
      screens.set(key, renderer);
    },
    registerComponent(key: string, renderer: ArloRegisteredComponent): void {
      components.set(key, renderer);
    },
    getScreen(key: string): ArloRegisteredScreen | null {
      return screens.get(key) ?? null;
    },
    getComponent(key: string): ArloRegisteredComponent | null {
      return components.get(key) ?? null;
    },
  };
}
