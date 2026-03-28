import prisma from "@/lib/prisma";
import { hashApiKey } from "@/lib/api-keys";
import { flowConfigSchema } from "@/lib/validations";
import type { FlowConfig, SDKErrorResponse, SDKFlowResponse } from "@/lib/types";

export class SDKRouteError extends Error {
  readonly status: number;
  readonly code: SDKErrorResponse["code"];

  constructor(
    message: string,
    options: { status: number; code: SDKErrorResponse["code"] }
  ) {
    super(message);
    this.name = "SDKRouteError";
    this.status = options.status;
    this.code = options.code;
  }
}

export interface ResolvedSDKAuth {
  id: string;
  projectId: string;
  environment: "DEVELOPMENT" | "PRODUCTION";
}

export async function resolveSDKAuth(
  rawApiKey: string | null,
  projectId: string
): Promise<ResolvedSDKAuth> {
  if (!rawApiKey?.trim()) {
    throw new SDKRouteError("Missing API key", {
      status: 401,
      code: "INVALID_API_KEY",
    });
  }

  const hashedKey = hashApiKey(rawApiKey.trim());
  const apiKey = await prisma.apiKey.findUnique({
    where: { hashedKey },
    select: {
      id: true,
      projectId: true,
      environment: true,
    },
  });

  if (!apiKey || apiKey.projectId !== projectId) {
    throw new SDKRouteError("Invalid API key", {
      status: 401,
      code: "INVALID_API_KEY",
    });
  }

  return apiKey;
}

export async function touchSDKApiKey(apiKeyId: string): Promise<void> {
  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { lastUsedAt: new Date() },
  });
}

export function buildSDKFlowResponse(input: {
  slug: string;
  version: number;
  config: unknown;
  errorCode?: SDKErrorResponse["code"];
}): SDKFlowResponse {
  const parsedConfig = flowConfigSchema.safeParse(input.config);

  if (!parsedConfig.success) {
    throw new SDKRouteError("Published flow is invalid", {
      status: 500,
      code: input.errorCode ?? "FLOW_NOT_FOUND",
    });
  }

  return {
    flow: {
      slug: input.slug,
      version: input.version,
      config: input.config as FlowConfig,
    },
  };
}

export function getPublishedVersionForEnvironment<T extends {
  developmentVersion: TPublished | null;
  productionVersion: TPublished | null;
}>(
  flow: T,
  environment: ResolvedSDKAuth["environment"]
) {
  return environment === "PRODUCTION" ? flow.productionVersion : flow.developmentVersion;
}

type TPublished = {
  version: number;
  config: unknown;
};
