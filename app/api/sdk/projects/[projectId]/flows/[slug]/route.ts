import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
  context: { params: Promise<{ projectId: string; slug: string }> }
) {
  try {
    const { projectId, slug } = await context.params;
    const apiKey = await resolveSDKAuth(request.headers.get("x-api-key"), projectId);

    const flow = await prisma.flow.findFirst({
      where: {
        projectId,
        slug,
      },
      include: {
        developmentVersion: true,
        productionVersion: true,
      },
    });

    if (!flow) {
      return jsonError(404, "Flow not found", "FLOW_NOT_FOUND");
    }

    const publishedVersion = getPublishedVersionForEnvironment(flow, apiKey.environment);

    if (flow.status !== "PUBLISHED" || !publishedVersion) {
      return jsonError(404, "Flow is not published", "FLOW_NOT_PUBLISHED");
    }

    const etag = `"${publishedVersion.version}"`;
    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304 });
    }

    const response = buildSDKFlowResponse({
      slug: flow.slug,
      version: publishedVersion.version,
      config: publishedVersion.config,
    });

    await touchSDKApiKey(apiKey.id);

    return NextResponse.json<SDKFlowResponse>(response, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "ETag": etag,
        "X-Arlo-Environment": apiKey.environment,
      },
    });
  } catch (error) {
    if (error instanceof SDKRouteError) {
      return jsonError(error.status, error.message, error.code);
    }

    console.error("Error resolving SDK flow", error);
    return jsonError(500, "Failed to load flow", "FLOW_NOT_FOUND");
  }
}
