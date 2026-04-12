import { z } from "zod";

import { tinybird } from "@/lib/tinybird";

export const sdkAnalyticsEventSchema = z.object({
  event: z.enum([
    "flow_started",
    "screen_viewed",
    "button_pressed",
    "component_interaction",
    "flow_completed",
    "flow_dismissed",
    "custom_event",
  ]),
  timestamp: z.string().datetime(),
  projectId: z.string().trim().min(1).max(128).nullable().optional(),
  userId: z.string().trim().min(1).max(128).nullable().optional(),
  flowSlug: z.string().trim().min(1).max(200),
  flowVersion: z.number().int().min(0),
  sessionId: z.string().trim().min(1).max(128),
  screenId: z.string().trim().min(1).max(200).nullable().optional(),
  screenIndex: z.number().int().min(-1).max(9999),
  screenName: z.string().trim().min(1).max(200).nullable().optional(),
  totalScreens: z.number().int().min(0).max(9999),
  durationMs: z.number().int().min(0).max(2_147_483_647).optional(),
  componentId: z.string().trim().min(1).max(200).optional(),
  componentType: z
    .enum(["BUTTON", "TEXT_INPUT", "SINGLE_SELECT", "MULTI_SELECT", "SLIDER"])
    .optional(),
  action: z
    .enum([
      "NEXT_SCREEN",
      "PREV_SCREEN",
      "SKIP_FLOW",
      "OPEN_URL",
      "DEEP_LINK",
      "CUSTOM_EVENT",
      "DISMISS",
      "CLOSE_FLOW",
      "REQUEST_NOTIFICATIONS",
      "REQUEST_TRACKING",
      "RESTORE_PURCHASES",
    ])
    .optional(),
  label: z.string().trim().min(1).max(200).nullable().optional(),
  fieldKey: z.string().trim().min(1).max(50).optional(),
  value: z
    .union([
      z.string().max(2000),
      z.array(z.string().max(200)).max(100),
      z.number(),
      z.boolean(),
      z.null(),
    ])
    .optional(),
  valueRedacted: z.boolean().optional(),
  eventName: z.string().trim().min(1).max(100).optional(),
});

export type SDKAnalyticsEventInput = z.infer<typeof sdkAnalyticsEventSchema>;

function serializeSDKAnalyticsValue(value: SDKAnalyticsEventInput["value"]) {
  if (value === undefined) {
    return null;
  }

  return JSON.stringify(value);
}

export async function ingestSDKAnalyticsEvent({
  projectId,
  event,
  requestUserId = null,
}: {
  projectId: string;
  event: SDKAnalyticsEventInput;
  requestUserId?: string | null;
}) {
  await tinybird.sdkEvents.ingest({
    timestamp: event.timestamp,
    project_id: projectId,
    session_id: event.sessionId,
    user_id: event.userId ?? requestUserId,
    flow_slug: event.flowSlug,
    flow_version: event.flowVersion,
    event_name: event.event,
    screen_id: event.screenId ?? null,
    screen_name: event.screenName ?? null,
    screen_index: event.screenIndex,
    total_screens: event.totalScreens,
    duration_ms: event.durationMs ?? null,
    component_id: event.componentId ?? null,
    component_type: event.componentType ?? null,
    button_action: event.action ?? null,
    event_label: event.label ?? null,
    field_key: event.fieldKey ?? null,
    value_json: serializeSDKAnalyticsValue(event.value),
    value_redacted: event.valueRedacted ?? false,
    custom_event_name: event.eventName ?? null,
  });
}
