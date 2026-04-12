import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import {
  ingestSDKAnalyticsEvent,
  sdkAnalyticsEventSchema,
} from "@/lib/sdk-analytics";
import { SDKRouteError, resolveSDKAuth } from "@/lib/sdk-api";

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

function getRequestUserId(request: NextRequest) {
  const userId = request.headers.get("x-arlo-user-id")?.trim();
  return userId ? userId.slice(0, 128) : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    await resolveSDKAuth(request.headers.get("x-api-key"), projectId);

    const body = await request.json();
    const parsed = sdkAnalyticsEventSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(400, "Invalid analytics event payload");
    }

    if (parsed.data.projectId && parsed.data.projectId !== projectId) {
      return jsonError(400, "Project id mismatch");
    }

    await ingestSDKAnalyticsEvent({
      projectId,
      event: parsed.data,
      requestUserId: getRequestUserId(request),
    });

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (error) {
    if (error instanceof SDKRouteError) {
      return jsonError(error.status, error.message);
    }

    console.error("Failed to record SDK analytics event", error);
    return jsonError(500, "Failed to record analytics event");
  }
}
