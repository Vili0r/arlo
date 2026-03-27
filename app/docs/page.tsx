import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  AppWindow,
  Boxes,
  Code2,
  MapPinned,
  Puzzle,
  Route,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Arlo Docs | Placements and Registry Keys",
  description:
    "Understand how placements route apps into flows and how registry keys connect those flows to native screens and components.",
};

const placementExample = `const flow = await arlo.getPlacement("onboarding_home");`;

const registryExample = `import { createArloRegistry } from "arlo-react-native";

const registry = createArloRegistry();

registry.registerScreen("paywall_v1", ({ screen }) => (
  <NativePaywall payload={screen.customPayload} />
));

registry.registerComponent("native_benefits_card", ({ component }) => (
  <BenefitsCard {...component.props.payload} />
));`;

const runtimeExample = `App asks for placement key
  -> Arlo resolves the placement to a published flow
  -> The flow may reference native registry keys
  -> The host app renders those native screens/components`;

const cards = [
  {
    icon: MapPinned,
    title: "Placements",
    subtitle: "Public runtime entry points",
    body:
      "A placement is the stable key your app calls at runtime. It maps something like onboarding_home to one specific flow in the project.",
    accent: "from-cyan-400/25 via-cyan-400/10 to-transparent",
    border: "border-cyan-400/20",
    iconColor: "text-cyan-300",
  },
  {
    icon: Puzzle,
    title: "Registry Keys",
    subtitle: "Native rendering contracts",
    body:
      "A registry key is the name of a native screen or native component your host app has registered so a flow can hand off rendering to the app.",
    accent: "from-amber-300/25 via-orange-300/10 to-transparent",
    border: "border-amber-300/20",
    iconColor: "text-amber-200",
  },
];

const steps = [
  {
    title: "1. Create or publish a flow",
    text:
      "Flows hold the versioned config Arlo can deliver to the SDK. Placements only resolve to something useful once the linked flow has a published version.",
  },
  {
    title: "2. Attach a placement key",
    text:
      "The placement key becomes the stable app-facing entry point. Your app can keep requesting the same placement while you swap which flow sits behind it.",
  },
  {
    title: "3. Reference registry keys inside the flow",
    text:
      "Inside the flow builder, a screen can point at a native screen key and a custom component block can point at a native component key.",
  },
  {
    title: "4. Let the host app render the native parts",
    text:
      "At runtime, Arlo uses the registry you registered in the React Native host app to resolve those keys into real UI.",
  },
];

export default function DocsPlacementsAndRegistryPage() {
  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#f7f2e7]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(50,189,201,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_28%),linear-gradient(180deg,#0b0d10_0%,#0d1117_42%,#0b0d10_100%)]" />

      <header className="border-b border-white/8 bg-black/20 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
              <Route size={18} className="text-cyan-300" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">Arlo Docs</p>
              <h1 className="text-sm font-semibold text-white">Placements and Registry Keys</h1>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
          >
            Main Site
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 md:py-16">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100/80">
              Runtime Mental Model
            </div>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                Placements decide which flow loads. Registry keys decide what the app renders.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-white/68 md:text-lg">
                If you only remember one thing, remember this split: placements are for
                finding flows, registry keys are for rendering native surfaces inside those
                flows.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {cards.map(({ icon: Icon, title, subtitle, body, accent, border, iconColor }) => (
                <div
                  key={title}
                  className={`relative overflow-hidden rounded-3xl border ${border} bg-white/[0.03] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)]`}
                >
                  <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${accent}`} />
                  <div className="relative space-y-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                      <Icon size={18} className={iconColor} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{title}</h3>
                      <p className="text-sm text-white/45">{subtitle}</p>
                    </div>
                    <p className="text-sm leading-6 text-white/70">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-[#11161d]/80 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.32)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Boxes size={18} className="text-amber-200" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/35">Quick Rule</p>
                <p className="text-sm font-medium text-white">Do not mix the two jobs</p>
              </div>
            </div>
            <div className="space-y-4 text-sm leading-6 text-white/70">
              <p>
                A placement key should stay stable even if you later change the flow behind it.
              </p>
              <p>
                A registry key should match something the host app already knows how to render,
                such as a native paywall screen or a native benefits card.
              </p>
              <p>
                Because of that, these keys live at different layers and solve different
                problems.
              </p>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">Runtime Shape</p>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-[#d9e8e6]">
                {runtimeExample}
              </pre>
            </div>
          </aside>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-[2rem] border border-cyan-300/15 bg-[#0f151b]/80 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                <MapPinned size={18} className="text-cyan-300" />
              </div>
              <h3 className="text-xl font-semibold text-white">Placements in practice</h3>
            </div>
            <div className="space-y-4 text-sm leading-6 text-white/72">
              <p>
                The dashboard describes placements as mapping SDK placement keys to published
                flows. That is exactly what they are: app-facing lookup keys.
              </p>
              <p>
                Example: your app asks for <code className="font-mono text-cyan-200">onboarding_home</code>.
                Arlo resolves that placement to the linked flow and returns the latest published
                version of that flow.
              </p>
            </div>
            <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-white/35">SDK Example</p>
              <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-[#d9f8ff]">
                {placementExample}
              </pre>
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-300/15 bg-[#17130d]/80 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10">
                <Puzzle size={18} className="text-amber-200" />
              </div>
              <h3 className="text-xl font-semibold text-white">Registry keys in practice</h3>
            </div>
            <div className="space-y-4 text-sm leading-6 text-white/72">
              <p>
                Registry keys tell flow authors which native screens and components the host app
                has registered.
              </p>
              <p>
                There are two flavors: <code className="font-mono text-amber-100">SCREEN</code>{" "}
                keys for whole native screens and{" "}
                <code className="font-mono text-amber-100">COMPONENT</code> keys for native blocks
                inside otherwise canvas-rendered screens.
              </p>
            </div>
            <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-white/35">
                Host App Example
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-6 text-[#fff0cf]">
                {registryExample}
              </pre>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <ArrowRight size={18} className="text-white/80" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-white">How they work together</h3>
              <p className="text-sm text-white/50">
                The full path from your app request to rendered UI
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((step) => (
              <div key={step.title} className="rounded-3xl border border-white/8 bg-black/15 p-5">
                <h4 className="text-base font-semibold text-white">{step.title}</h4>
                <p className="mt-2 text-sm leading-6 text-white/68">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[#0f1318] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10">
                <AppWindow size={18} className="text-fuchsia-200" />
              </div>
              <h3 className="text-xl font-semibold text-white">When to use a screen key</h3>
            </div>
            <ul className="space-y-3 text-sm leading-6 text-white/70">
              <li>Use it when the entire step should be rendered by the host app.</li>
              <li>Pass JSON payload when the native screen needs variants or parameters.</li>
              <li>Good examples: paywall, purchase flow, account recovery, identity check.</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#14110c] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-300/10">
                <Code2 size={18} className="text-blue-200" />
              </div>
              <h3 className="text-xl font-semibold text-white">When to use a component key</h3>
            </div>
            <ul className="space-y-3 text-sm leading-6 text-white/70">
              <li>Use it when most of the screen is Arlo-rendered but one block is app-native.</li>
              <li>Payload behaves like structured props for that native component.</li>
              <li>Good examples: benefits card, plan picker, price badge, loyalty widget.</li>
            </ul>
          </div>
        </section>

        <section className="rounded-[2rem] border border-cyan-300/12 bg-cyan-300/[0.05] p-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/55">Common Confusion</p>
          <p className="mt-3 max-w-4xl text-base leading-7 text-white/75">
            A placement key is not something the host app renders directly. It only finds a flow.
            A registry key does not fetch a flow. It only tells Arlo how to hand rendering off to
            native code once the flow is already running.
          </p>
        </section>
      </main>
    </div>
  );
}
