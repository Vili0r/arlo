import "server-only";
import {
  tinybirdNoStore,
  type SDKProjectSummaryOutput,
  type TopFlowInteractionsOutput,
  type TopFlowScreensOutput,
} from "@/lib/tinybird";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type ProjectAnalyticsSummary = {
  flow: {
    totalEvents: number;
    uniqueSessions: number;
    flowsStarted: number;
    flowsCompleted: number;
    screenViews: number;
    buttonPresses: number;
    componentInteractions: number;
  };
};

export type ProjectTopFlowScreen = {
  screenId: string;
  screenName: string;
  views: number;
};

export type ProjectTopFlowInteraction = {
  componentKey: string;
  componentLabel: string;
  componentType: string;
  interactions: number;
};

function toNumber(value: bigint | number | undefined) {
  if (typeof value === "bigint") {
    return Number(value);
  }

  return Number(value ?? 0);
}

export async function getProjectAnalyticsSummary(
  projectId: string,
  lookbackDays = 7,
): Promise<ProjectAnalyticsSummary> {
  const dateTo = new Date();
  const dateFrom = new Date(dateTo.getTime() - lookbackDays * DAY_IN_MS);

  try {
    const flowSummaryResult = await tinybirdNoStore.sdkProjectSummary.query({
      project_id: projectId,
      date_from: dateFrom.toISOString(),
      date_to: dateTo.toISOString(),
    });

    const flowSummary = flowSummaryResult.data[0] as SDKProjectSummaryOutput | undefined;

    return {
      flow: {
        totalEvents: toNumber(flowSummary?.total_events),
        uniqueSessions: toNumber(flowSummary?.unique_sessions),
        flowsStarted: toNumber(flowSummary?.flows_started),
        flowsCompleted: toNumber(flowSummary?.flows_completed),
        screenViews: toNumber(flowSummary?.screen_views),
        buttonPresses: toNumber(flowSummary?.button_presses),
        componentInteractions: toNumber(flowSummary?.component_interactions),
      },
    };
  } catch (error) {
    console.error("Failed to load Tinybird project analytics", error);

    return {
      flow: {
        totalEvents: 0,
        uniqueSessions: 0,
        flowsStarted: 0,
        flowsCompleted: 0,
        screenViews: 0,
        buttonPresses: 0,
        componentInteractions: 0,
      },
    };
  }
}

export async function getProjectTopFlowScreensAnalytics(
  projectId: string,
  limit = 8,
  lookbackDays = 7,
): Promise<ProjectTopFlowScreen[]> {
  const dateTo = new Date();
  const dateFrom = new Date(dateTo.getTime() - lookbackDays * DAY_IN_MS);

  try {
    const result = await tinybirdNoStore.topFlowScreens.query({
      project_id: projectId,
      date_from: dateFrom.toISOString(),
      date_to: dateTo.toISOString(),
      limit,
    });

    return (result.data as TopFlowScreensOutput[]).map((screen) => ({
      screenId: screen.screen_id,
      screenName: screen.screen_name,
      views: toNumber(screen.views),
    }));
  } catch (error) {
    console.error("Failed to load Tinybird flow screen analytics", error);
    return [];
  }
}

export async function getProjectTopFlowInteractionsAnalytics(
  projectId: string,
  limit = 8,
  lookbackDays = 7,
): Promise<ProjectTopFlowInteraction[]> {
  const dateTo = new Date();
  const dateFrom = new Date(dateTo.getTime() - lookbackDays * DAY_IN_MS);

  try {
    const result = await tinybirdNoStore.topFlowInteractions.query({
      project_id: projectId,
      date_from: dateFrom.toISOString(),
      date_to: dateTo.toISOString(),
      limit,
    });

    return (result.data as TopFlowInteractionsOutput[]).map((interaction) => ({
      componentKey: interaction.component_key,
      componentLabel: interaction.component_label,
      componentType: interaction.component_type,
      interactions: toNumber(interaction.interactions),
    }));
  } catch (error) {
    console.error("Failed to load Tinybird flow interaction analytics", error);
    return [];
  }
}

export function getFlowCompletionRate(summary: ProjectAnalyticsSummary["flow"]) {
  if (summary.flowsStarted === 0) {
    return 0;
  }

  return Math.round((summary.flowsCompleted / summary.flowsStarted) * 100);
}

export function getFlowInteractionCount(summary: ProjectAnalyticsSummary["flow"]) {
  return summary.buttonPresses + summary.componentInteractions;
}
