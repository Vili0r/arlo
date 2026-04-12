# Arlo SDK

Core TypeScript client for fetching published Arlo flows from the control plane.

## CLI

You can scaffold an Expo app integration with:

```bash
npx arlo-sdk init --project-id=cmmq9kh7u0000qw9kpqnqwq9d
```

This command:

- adds `arlo-sdk`, `arlo-react-native`, and `@react-native-async-storage/async-storage`
- creates `arlo/arlo.config.ts`
- creates `arlo/ArloOnboardingScreen.tsx`
- runs your package manager install step automatically

Useful options:

```bash
npx arlo-sdk init \
  --project-id=cmmq9kh7u0000qw9kpqnqwq9d \
  --entry-point-key=onboarding_home \
  --api-key=ob_test_xxx \
  --base-url=http://192.168.1.10:3000
```

You can also skip installation or overwrite generated files:

```bash
npx arlo-sdk init --project-id=... --skip-install
npx arlo-sdk init --project-id=... --force
```

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
  onOpenUrl({ url }) {
    console.log("Open external URL", url);
  },
  onScreenChanged({ snapshot }) {
    console.log(snapshot.currentScreenId);
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

## Entry Point API

```ts
const response = await client.getEntryPoint("onboarding_home");
console.log(response.flow.slug);

await presenter.presentEntryPoint("onboarding_home");
```

## Persistent Cache

```ts
import { createArloClient, createPersistentFlowCache } from "./src";

const cache = createPersistentFlowCache({
  storage: {
    getItem: async (key) => localStorage.getItem(key),
    setItem: async (key, value) => localStorage.setItem(key, value),
    removeItem: async (key) => localStorage.removeItem(key),
  },
  maxAgeMs: 1000 * 60 * 60 * 24,
});

const client = createArloClient({
  apiKey: "ob_live_xxx",
  projectId: "proj_123",
  baseUrl: "https://your-arlo-domain.com",
  cache,
  offlineFallback: true,
});
```

## Validation

```ts
const session = createFlowSession(response);
const errors = session.validateCurrentScreen();

if (errors.length > 0) {
  console.log(errors);
}
```

## Host App Callbacks

```ts
const presenter = createArloPresenter({
  client,
  handlers: {
    onCompleted({ snapshot }) {
      console.log("Completed flow", snapshot.flowSlug, snapshot.values);
    },
    onDismissed({ snapshot }) {
      console.log("Dismissed on screen", snapshot.currentScreenId);
    },
    onOpenUrl({ url, snapshot }) {
      console.log("Open", url, "from", snapshot.currentScreenId);
    },
    onValidationFailed({ effect }) {
      console.log(effect.errors);
    },
  },
});
```

## Endpoint contract

The SDK currently fetches:

`GET /api/sdk/projects/:projectId/flows/:slug`

with:

- `x-api-key: <raw api key>`
