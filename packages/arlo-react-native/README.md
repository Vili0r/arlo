# Arlo React Native

React Native renderer for Arlo flows.

## Current scope

- Renders the active screen from an `arlo-sdk` flow session
- Handles default interactions for common component types
- Lets host apps override per-component rendering

## Example

```tsx
import { useEffect, useState } from "react";
import { createArloClient, createArloPresenter } from "arlo-sdk";
import { ArloPresenterRenderer, createArloRegistry, createReactNativeFlowCache } from "./src";
import AsyncStorage from "@react-native-async-storage/async-storage";

const arlo = createArloClient({
  apiKey: "ob_live_xxx",
  projectId: "proj_123",
  baseUrl: "https://your-arlo-domain.com",
  cache: createReactNativeFlowCache({
    storage: AsyncStorage,
  }),
});

export function OnboardingScreen() {
  const registry = createArloRegistry();
  registry.registerScreen("paywall_v1", ({ session }) => {
    return null;
  });

  const [presenter] = useState(() =>
    createArloPresenter({
      client: arlo,
    })
  );

  useEffect(() => {
    async function load() {
      await presenter.presentFlow("welcome");
    }

    void load();
  }, [presenter]);

  return (
    <ArloPresenterRenderer
      presenter={presenter}
      registry={registry}
      handlers={{
        onOpenUrl({ url }) {
          console.log("Open URL", url);
        },
        onCompleted({ snapshot }) {
          console.log("Flow completed", snapshot.values);
        },
      }}
    />
  );
}
```
