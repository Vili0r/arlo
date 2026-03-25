import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { flowConfigSchema } from "@/lib/validations";
import { hashApiKey } from "@/lib/api-keys";
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
  const { projectId, slug } = await context.params;
  const rawApiKey = request.headers.get("x-api-key")?.trim();

  if (!rawApiKey) {
    return jsonError(401, "Missing API key", "INVALID_API_KEY");
  }

  const hashedKey = hashApiKey(rawApiKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: { hashedKey },
    select: {
      id: true,
      projectId: true,
      environment: true,
    },
  });

  if (!apiKey || apiKey.projectId !== projectId) {
    return jsonError(401, "Invalid API key", "INVALID_API_KEY");
  }

  const flow = await prisma.flow.findFirst({
    where: {
      projectId,
      slug,
    },
    include: {
      publishedVersion: true,
    },
  });

  if (!flow) {
    return jsonError(404, "Flow not found", "FLOW_NOT_FOUND");
  }

  if (flow.status !== "PUBLISHED" || !flow.publishedVersion) {
    return jsonError(404, "Flow is not published", "FLOW_NOT_PUBLISHED");
  }

  const parsedConfig = flowConfigSchema.safeParse(flow.publishedVersion.config);

  if (!parsedConfig.success) {
    console.error("Invalid published flow config", {
      flowId: flow.id,
      versionId: flow.publishedVersion.id,
      issues: parsedConfig.error.issues,
    });

    return jsonError(500, "Published flow is invalid", "FLOW_NOT_FOUND");
  }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  const response: SDKFlowResponse = {
    flow: {
      slug: flow.slug,
      version: flow.publishedVersion.version,
      config: parsedConfig.data,
    },
  };

  return NextResponse.json<SDKFlowResponse>(response, {
    status: 200,
    headers: {
      "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
      "X-Arlo-Environment": apiKey.environment,
    },
  });
}
