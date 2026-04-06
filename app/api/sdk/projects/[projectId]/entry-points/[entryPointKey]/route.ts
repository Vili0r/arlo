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
  context: { params: Promise<{ projectId: string; entryPointKey: string }> }
) {
  try {
    const { projectId, entryPointKey } = await context.params;
    const apiKey = await resolveSDKAuth(request.headers.get("x-api-key"), projectId);

    const entryPoint = await prisma.entryPoint.findFirst({
      where: {
        projectId,
        key: entryPointKey,
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

    if (!entryPoint) {
      return jsonError(404, "Flow not found", "FLOW_NOT_FOUND");
    }

    const publishedVersion = getPublishedVersionForEnvironment(
      entryPoint.flow,
      apiKey.environment
    );

    if (entryPoint.flow.status !== "PUBLISHED" || !publishedVersion) {
      return jsonError(404, "Flow is not published", "FLOW_NOT_PUBLISHED");
    }

    const etag = `"${publishedVersion.version}"`;
    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304 });
    }

    const response = buildSDKFlowResponse({
      slug: entryPoint.flow.slug,
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
        "X-Arlo-Entry-Point": entryPoint.key,
      },
    });
  } catch (error) {
    if (error instanceof SDKRouteError) {
      return jsonError(error.status, error.message, error.code);
    }

    console.error("Error resolving SDK entry point", error);
    return jsonError(500, "Failed to load entry point", "FLOW_NOT_FOUND");
  }
}
