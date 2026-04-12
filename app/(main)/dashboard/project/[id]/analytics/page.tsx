import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  MonitorPlay,
  MousePointerClick,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";
import { getProject } from "../../actions";
import {
  getFlowCompletionRate,
  getFlowInteractionCount,
  getProjectAnalyticsSummary,
  getProjectTopFlowInteractionsAnalytics,
  getProjectTopFlowScreensAnalytics,
} from "@/lib/tinybird-analytics";
import { AnalyticsRankingSection } from "@/components/dashboard/analytics-ranking-section";

interface ProjectAnalyticsPageProps {
  params: {
    id: string;
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function ProjectAnalyticsPage({
  params,
}: ProjectAnalyticsPageProps) {
  const { id } = await params;

  let project;

  try {
    project = await getProject(id);
  } catch (error) {
    if (error instanceof Error && error.message === "Project not found") {
      notFound();
    }

    throw error;
  }

  const [summary, topFlowScreens, topFlowInteractions] = await Promise.all([
    getProjectAnalyticsSummary(project.id),
    getProjectTopFlowScreensAnalytics(project.id),
    getProjectTopFlowInteractionsAnalytics(project.id),
  ]);
  const flowCompletionRate = getFlowCompletionRate(summary.flow);
  const flowInteractionCount = getFlowInteractionCount(summary.flow);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 py-8 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <Link
              href={`/dashboard/project/${project.id}`}
              className="inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white"
            >
              <ArrowLeft size={14} />
              Back to project
            </Link>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Analytics
                </span>
                <span className="text-xs text-white/35">Last 7 days</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {project.name}
              </h1>
              <p className="mt-1 text-sm text-white/45">
                Tinybird-powered flow analytics for screens and interactions from your app and the builder preview.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                Flows Started
              </span>
              <CheckCircle2 size={16} className="text-emerald-300" />
            </div>
            <div className="text-3xl font-semibold text-white">
              {formatNumber(summary.flow.flowsStarted)}
            </div>
            <p className="mt-2 text-xs text-white/45">
              Sessions that started an Arlo flow in the current 7-day window.
            </p>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                Flow Sessions
              </span>
              <Users size={16} className="text-sky-300" />
            </div>
            <div className="text-3xl font-semibold text-white">
              {formatNumber(summary.flow.uniqueSessions)}
            </div>
            <p className="mt-2 text-xs text-white/45">
              Distinct sessions that sent built-in Arlo flow events.
            </p>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                Screen Views
              </span>
              <MonitorPlay size={16} className="text-violet-300" />
            </div>
            <div className="text-3xl font-semibold text-white">
              {formatNumber(summary.flow.screenViews)}
            </div>
            <p className="mt-2 text-xs text-white/45">
              Built-in `screen_viewed` events captured when a flow screen was shown.
            </p>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                Interactions
              </span>
              <MousePointerClick size={16} className="text-amber-300" />
            </div>
            <div className="text-3xl font-semibold text-white">
              {formatNumber(flowInteractionCount)}
            </div>
            <p className="mt-2 text-xs text-white/45">
              Button presses plus built-in field interactions from the SDK.
            </p>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="space-y-6">
            <AnalyticsRankingSection
              title="Top Flow Screens"
              description="Flow screens with the most built-in `screen_viewed` events."
              rows={topFlowScreens.map((screen) => ({
                key: screen.screenId,
                label: screen.screenName,
                detail:
                  screen.screenName === screen.screenId
                    ? undefined
                    : screen.screenId,
                value: screen.views,
              }))}
              emptyTitle="No flow screen views yet"
              emptyDescription="Once the SDK starts sending built-in events from the app, the busiest screens will show up here."
              valueLabel="views"
            />

            <AnalyticsRankingSection
              title="Interaction Hotspots"
              description="Buttons and fields with the highest built-in interaction volume."
              rows={topFlowInteractions.map((interaction) => ({
                key: interaction.componentKey,
                label: interaction.componentLabel,
                detail: interaction.componentType.replaceAll("_", " "),
                value: interaction.interactions,
              }))}
              emptyTitle="No flow interactions yet"
              emptyDescription="Selections, button presses, and other built-in SDK interactions will appear here."
              valueLabel="events"
            />
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-white">
                  Flow Performance
                </h2>
                <p className="mt-1 text-xs text-white/45">
                  Built-in Arlo lifecycle analytics captured from the app and builder preview.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/35">
                    Flows Started
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    {formatNumber(summary.flow.flowsStarted)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/35">
                    Flows Completed
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    {formatNumber(summary.flow.flowsCompleted)}
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/35">
                    Completion Rate
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    {flowCompletionRate}%
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/35">
                    Total Flow Events
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    {formatNumber(summary.flow.totalEvents)}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/35">
                    Button Presses
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {formatNumber(summary.flow.buttonPresses)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/35">
                    Field Interactions
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {formatNumber(summary.flow.componentInteractions)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-white/35">
                    SDK Sessions
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {formatNumber(summary.flow.uniqueSessions)}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
