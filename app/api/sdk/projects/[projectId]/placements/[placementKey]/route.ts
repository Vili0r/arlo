import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import {
  buildSDKFlowResponse,
  getPublishedVersionForEnvironment,
  resolveSDKAuth,
  SDKRouteError,
  touchSDKApiKey,
} from "@/lib/sdk-api";
import type { SDKErrorResponse, SDKFlowResponse } from "@/lib/types";

function jsonError(
  status: number,
  error: SDKErrorResponse["error"],
  code: SDKErrorResponse["code"]
) {
  return NextResponse.json<SDKErrorResponse>({ error, code }, { status });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ projectId: string; placementKey: string }> }
) {
  try {
    const { projectId, placementKey } = await context.params;
    const apiKey = await resolveSDKAuth(request.headers.get("x-api-key"), projectId);

    const placement = await prisma.placement.findFirst({
      where: {
        projectId,
        key: placementKey,
        environment: apiKey.environment,
      },
      include: {
        flow: {
          include: {
            developmentVersion: true,
            productionVersion: true,
          },
        },
      },
    });

    if (!placement) {
      return jsonError(404, "Flow not found", "FLOW_NOT_FOUND");
    }

    const publishedVersion = getPublishedVersionForEnvironment(
      placement.flow,
      apiKey.environment
    );

    if (placement.flow.status !== "PUBLISHED" || !publishedVersion) {
      return jsonError(404, "Flow is not published", "FLOW_NOT_PUBLISHED");
    }

    const response = buildSDKFlowResponse({
      slug: placement.flow.slug,
      version: publishedVersion.version,
      config: publishedVersion.config,
    });

    await touchSDKApiKey(apiKey.id);

    return NextResponse.json<SDKFlowResponse>(response, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
        "X-Arlo-Environment": apiKey.environment,
        "X-Arlo-Placement": placement.key,
      },
    });
  } catch (error) {
    if (error instanceof SDKRouteError) {
      return jsonError(error.status, error.message, error.code);
    }

    console.error("Error resolving SDK placement", error);
    return jsonError(500, "Failed to load placement", "FLOW_NOT_FOUND");
  }
}
