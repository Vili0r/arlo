# Arlo SDK

Core TypeScript client for fetching published Arlo flows from the control plane.

## Current scope

- Authenticated flow fetching with `x-api-key`
- Runtime response validation with `zod`
- In-memory caching
- Basic event subscriptions

## Example

```ts
import { applyFlowSessionEffect, createArloClient, createFlowSession } from "./src";

const arlo = createArloClient({
  apiKey: "ob_live_xxx",
  projectId: "proj_123",
  baseUrl: "https://your-arlo-domain.com",
});

arlo.identify({
  userId: "user_123",
  traits: {
    plan: "pro",
    locale: "en-GB",
  },
});

const response = await arlo.getFlow("welcome");
const session = createFlowSession(response);

session.start();

const effect = session.pressButton("primary_cta");
await applyFlowSessionEffect(session, effect, {
  onOpenUrl(url) {
    console.log("Open external URL", url);
  },
  onScreenChanged(activeSession) {
    console.log(activeSession.getSnapshot().currentScreenId);
  },
});
```

## Presenter API

```ts
import { createArloClient, createArloPresenter } from "./src";

const client = createArloClient({
  apiKey: "ob_live_xxx",
  projectId: "proj_123",
  baseUrl: "https://your-arlo-domain.com",
});

const presenter = createArloPresenter({ client });

await presenter.presentFlow("welcome");
const state = presenter.getState();

console.log(state.status, state.session?.getSnapshot().currentScreenId);
```

## Endpoint contract

The SDK currently fetches:

`GET /api/sdk/projects/:projectId/flows/:slug`

with:

- `x-api-key: <raw api key>`
