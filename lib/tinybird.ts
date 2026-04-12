/**
 * Tinybird Definitions
 *
 * Define your datasources, endpoints, and client here.
 */

import {
  defineDatasource,
  defineEndpoint,
  Tinybird,
  node,
  t,
  p,
  engine,
  type InferRow,
  type InferParams,
  type InferOutputRow,
} from "@tinybirdco/sdk";

// ============================================================================
// Datasources
// ============================================================================

/**
 * Page views datasource - tracks page view events
 */
export const pageViews = defineDatasource("page_views", {
  description: "Page view tracking data",
  schema: {
    timestamp: t.dateTime(),
    pathname: t.string(),
    project_id: t.string().nullable(),
    session_id: t.string(),
    country: t.string().lowCardinality().nullable(),
  },
  engine: engine.mergeTree({
    sortingKey: ["pathname", "timestamp"],
  }),
});

export type PageViewsRow = InferRow<typeof pageViews>;

export const sdkEvents = defineDatasource("sdk_events", {
  description: "Arlo SDK analytics events",
  schema: {
    timestamp: t.dateTime(),
    project_id: t.string(),
    session_id: t.string(),
    user_id: t.string().nullable(),
    flow_slug: t.string(),
    flow_version: t.int32(),
    event_name: t.string().lowCardinality(),
    screen_id: t.string().nullable(),
    screen_name: t.string().nullable(),
    screen_index: t.int32().nullable(),
    total_screens: t.int32().nullable(),
    duration_ms: t.int32().nullable(),
    component_id: t.string().nullable(),
    component_type: t.string().lowCardinality().nullable(),
    button_action: t.string().lowCardinality().nullable(),
    event_label: t.string().nullable(),
    field_key: t.string().nullable(),
    value_json: t.string().nullable(),
    value_redacted: t.bool(),
    custom_event_name: t.string().nullable(),
  },
  engine: engine.mergeTree({
    sortingKey: ["project_id", "timestamp", "flow_slug"],
  }),
});

export type SDKEventsRow = InferRow<typeof sdkEvents>;

// ============================================================================
// Endpoints
// ============================================================================

/**
 * Top pages endpoint - get the most visited pages
 */
export const topPages = defineEndpoint("top_pages", {
  description: "Get the most visited pages",
  params: {
    project_id: p.string().optional(),
    date_from: p.dateTime().optional("2026-04-10T15:51:16.276Z"),
    date_to: p.dateTime().optional("2026-04-11T15:51:16.276Z"),
    limit: p.int32().optional(10),
  },
  nodes: [
    node({
      name: "endpoint",
      sql: `
        SELECT pathname, count() AS views
        FROM page_views
        WHERE timestamp >= parseDateTimeBestEffort({{String(date_from, '2026-04-10T15:51:16.276Z', required=False)}})
          AND timestamp <= parseDateTimeBestEffort({{String(date_to, '2026-04-11T15:51:16.276Z', required=False)}})
          AND ({{String(project_id, '', required=False)}} = '' OR project_id = {{String(project_id, '', required=False)}})
        GROUP BY pathname
        ORDER BY views DESC
        LIMIT {{Int32(limit, 10)}}
      `,
    }),
  ],
  output: {
    pathname: t.string(),
    views: t.uint64(),
  },
});

export type TopPagesParams = InferParams<typeof topPages>;
export type TopPagesOutput = InferOutputRow<typeof topPages>;

export const projectSummary = defineEndpoint("project_summary", {
  description: "Get summary analytics for a project",
  params: {
    project_id: p.string(),
    date_from: p.dateTime().optional("2026-04-10T15:51:16.276Z"),
    date_to: p.dateTime().optional("2026-04-11T15:51:16.276Z"),
  },
  nodes: [
    node({
      name: "endpoint",
      sql: `
        SELECT
          count() AS total_views,
          uniqExact(session_id) AS unique_sessions
        FROM page_views
        WHERE project_id = {{String(project_id)}}
          AND timestamp >= parseDateTimeBestEffort({{String(date_from, '2026-04-10T15:51:16.276Z', required=False)}})
          AND timestamp <= parseDateTimeBestEffort({{String(date_to, '2026-04-11T15:51:16.276Z', required=False)}})
      `,
    }),
  ],
  output: {
    total_views: t.uint64(),
    unique_sessions: t.uint64(),
  },
});

export type ProjectSummaryParams = InferParams<typeof projectSummary>;
export type ProjectSummaryOutput = InferOutputRow<typeof projectSummary>;

export const topCountries = defineEndpoint("top_countries", {
  description: "Get top countries for a project",
  params: {
    project_id: p.string(),
    date_from: p.dateTime().optional("2026-04-10T15:51:16.276Z"),
    date_to: p.dateTime().optional("2026-04-11T15:51:16.276Z"),
    limit: p.int32().optional(5),
  },
  nodes: [
    node({
      name: "endpoint",
      sql: `
        SELECT
          coalesce(country, 'Unknown') AS country,
          count() AS views
        FROM page_views
        WHERE project_id = {{String(project_id)}}
          AND timestamp >= parseDateTimeBestEffort({{String(date_from, '2026-04-10T15:51:16.276Z', required=False)}})
          AND timestamp <= parseDateTimeBestEffort({{String(date_to, '2026-04-11T15:51:16.276Z', required=False)}})
        GROUP BY country
        ORDER BY views DESC
        LIMIT {{Int32(limit, 5)}}
      `,
    }),
  ],
  output: {
    country: t.string(),
    views: t.uint64(),
  },
});

export type TopCountriesParams = InferParams<typeof topCountries>;
export type TopCountriesOutput = InferOutputRow<typeof topCountries>;

export const sdkProjectSummary = defineEndpoint("sdk_project_summary", {
  description: "Get Arlo SDK event summary analytics for a project",
  params: {
    project_id: p.string(),
    date_from: p.dateTime().optional("2026-04-10T15:51:16.276Z"),
    date_to: p.dateTime().optional("2026-04-11T15:51:16.276Z"),
  },
  nodes: [
    node({
      name: "endpoint",
      sql: `
        SELECT
          count() AS total_events,
          uniqExact(session_id) AS unique_sessions,
          countIf(event_name = 'flow_started') AS flows_started,
          countIf(event_name = 'flow_completed') AS flows_completed,
          countIf(event_name = 'screen_viewed') AS screen_views,
          countIf(event_name = 'button_pressed') AS button_presses,
          countIf(event_name = 'component_interaction') AS component_interactions
        FROM sdk_events
        WHERE project_id = {{String(project_id)}}
          AND timestamp >= parseDateTimeBestEffort({{String(date_from, '2026-04-10T15:51:16.276Z', required=False)}})
          AND timestamp <= parseDateTimeBestEffort({{String(date_to, '2026-04-11T15:51:16.276Z', required=False)}})
      `,
    }),
  ],
  output: {
    total_events: t.uint64(),
    unique_sessions: t.uint64(),
    flows_started: t.uint64(),
    flows_completed: t.uint64(),
    screen_views: t.uint64(),
    button_presses: t.uint64(),
    component_interactions: t.uint64(),
  },
});

export type SDKProjectSummaryParams = InferParams<typeof sdkProjectSummary>;
export type SDKProjectSummaryOutput = InferOutputRow<typeof sdkProjectSummary>;

export const topFlowScreens = defineEndpoint("top_flow_screens", {
  description: "Get the most-viewed flow screens for a project",
  params: {
    project_id: p.string(),
    date_from: p.dateTime().optional("2026-04-10T15:51:16.276Z"),
    date_to: p.dateTime().optional("2026-04-11T15:51:16.276Z"),
    limit: p.int32().optional(8),
  },
  nodes: [
    node({
      name: "endpoint",
      sql: `
        SELECT
          coalesce(screen_id, 'unknown_screen') AS screen_id,
          coalesce(screen_name, screen_id, 'Unknown screen') AS screen_name,
          count() AS views
        FROM sdk_events
        WHERE project_id = {{String(project_id)}}
          AND event_name = 'screen_viewed'
          AND timestamp >= parseDateTimeBestEffort({{String(date_from, '2026-04-10T15:51:16.276Z', required=False)}})
          AND timestamp <= parseDateTimeBestEffort({{String(date_to, '2026-04-11T15:51:16.276Z', required=False)}})
        GROUP BY screen_id, screen_name
        ORDER BY views DESC
        LIMIT {{Int32(limit, 8)}}
      `,
    }),
  ],
  output: {
    screen_id: t.string(),
    screen_name: t.string(),
    views: t.uint64(),
  },
});

export type TopFlowScreensParams = InferParams<typeof topFlowScreens>;
export type TopFlowScreensOutput = InferOutputRow<typeof topFlowScreens>;

export const topFlowInteractions = defineEndpoint("top_flow_interactions", {
  description: "Get the most frequent flow interactions for a project",
  params: {
    project_id: p.string(),
    date_from: p.dateTime().optional("2026-04-10T15:51:16.276Z"),
    date_to: p.dateTime().optional("2026-04-11T15:51:16.276Z"),
    limit: p.int32().optional(8),
  },
  nodes: [
    node({
      name: "endpoint",
      sql: `
        SELECT
          coalesce(component_id, field_key, 'unknown_component') AS component_key,
          coalesce(event_label, field_key, component_id, 'Unknown interaction') AS component_label,
          coalesce(component_type, 'Unknown') AS component_type,
          count() AS interactions
        FROM sdk_events
        WHERE project_id = {{String(project_id)}}
          AND event_name IN ('button_pressed', 'component_interaction')
          AND timestamp >= parseDateTimeBestEffort({{String(date_from, '2026-04-10T15:51:16.276Z', required=False)}})
          AND timestamp <= parseDateTimeBestEffort({{String(date_to, '2026-04-11T15:51:16.276Z', required=False)}})
        GROUP BY component_key, component_label, component_type
        ORDER BY interactions DESC
        LIMIT {{Int32(limit, 8)}}
      `,
    }),
  ],
  output: {
    component_key: t.string(),
    component_label: t.string(),
    component_type: t.string(),
    interactions: t.uint64(),
  },
});

export type TopFlowInteractionsParams = InferParams<typeof topFlowInteractions>;
export type TopFlowInteractionsOutput = InferOutputRow<typeof topFlowInteractions>;

// ============================================================================
// Client
// ============================================================================

export const tinybird = new Tinybird({
  datasources: { pageViews, sdkEvents },
  pipes: {
    topPages,
    projectSummary,
    topCountries,
    sdkProjectSummary,
    topFlowScreens,
    topFlowInteractions,
  },
});

export const tinybirdNoStore = new Tinybird({
  datasources: { pageViews, sdkEvents },
  pipes: {
    topPages,
    projectSummary,
    topCountries,
    sdkProjectSummary,
    topFlowScreens,
    topFlowInteractions,
  },
  fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
});
