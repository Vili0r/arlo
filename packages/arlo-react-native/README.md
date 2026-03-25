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
import { ArloPresenterRenderer } from "./src";

const arlo = createArloClient({
  apiKey: "ob_live_xxx",
  projectId: "proj_123",
  baseUrl: "https://your-arlo-domain.com",
});

export function OnboardingScreen() {
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
      handlers={{
        onOpenUrl(url) {
          console.log("Open URL", url);
        },
        onCompleted() {
          console.log("Flow completed");
        },
      }}
    />
  );
}
```
