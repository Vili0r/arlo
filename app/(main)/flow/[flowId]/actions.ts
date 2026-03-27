"use server";

import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import type { FlowConfig } from "@/lib/types";
import {
  buildFigmaApiHeaders,
  buildFigmaFallbackHeaders,
  getFigmaAuthMode,
  getFigmaConnectionStatusForUser,
  getUsableFigmaAccessToken,
} from "@/lib/figma-oauth";
import {
  buildFigmaImports,
  collectFigmaImageNodeIds,
  parseFigmaSource,
  type FigmaNodesResponse,
  type ParsedFigmaImport,
} from "./_lib/figma-import";

/* ── helpers ──────────────────────────────────────────── */

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

async function requireFlowAccess(flowId: string, userId: string) {
  const flow = await prisma.flow.findUnique({
    where: { id: flowId },
    include: { project: { select: { userId: true } } },
  });
  if (!flow || flow.project.userId !== userId) {
    throw new Error("Flow not found or access denied");
  }
  return flow;
}

const FIGMA_API_BASE_URL = "https://api.figma.com/v1";
async function fetchFigmaJson<T>(path: string, headers: HeadersInit): Promise<T> {
  const response = await fetch(`${FIGMA_API_BASE_URL}${path}`, {
    headers,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { err?: string; message?: string }
    | null;

  if (!response.ok) {
    const message =
      payload?.err ||
      payload?.message ||
      `Figma request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload as T;
}

function toPrismaJson(value: FlowConfig): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

/* ── Save Draft ──────────────────────────────────────── */

export async function saveDraft(input: {
  flowId: string;
  config: FlowConfig;
  changelog?: string;
}): Promise<{ success: true; versionId: string; version: number }> {
  const userId = await requireUser();
  const flow = await requireFlowAccess(input.flowId, userId);

  // Get the latest version number for this flow
  const latestVersion = await prisma.flowVersion.findFirst({
    where: { flowId: flow.id },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const nextVersion = (latestVersion?.version ?? 0) + 1;

  const version = await prisma.flowVersion.create({
    data: {
      flowId: flow.id,
      version: nextVersion,
      config: toPrismaJson(input.config),
      changelog: input.changelog ?? `Draft v${nextVersion}`,
    },
  });

  // Make sure flow status reflects DRAFT
  await prisma.flow.update({
    where: { id: flow.id },
    data: { status: "DRAFT", updatedAt: new Date() },
  });

  return { success: true, versionId: version.id, version: version.version };
}

/* ── Auto-save Draft (upserts latest unpublished version) ── */

export async function autoSaveDraft(input: {
  flowId: string;
  config: FlowConfig;
}): Promise<{ success: true; versionId: string }> {
  const userId = await requireUser();
  const flow = await requireFlowAccess(input.flowId, userId);

  // Find the latest unpublished version
  const latestUnpublished = await prisma.flowVersion.findFirst({
    where: {
      flowId: flow.id,
      publishedAt: null,
    },
    orderBy: { version: "desc" },
  });

  if (latestUnpublished) {
    // Update existing draft version in-place
    await prisma.flowVersion.update({
      where: { id: latestUnpublished.id },
      data: { config: toPrismaJson(input.config) },
    });

    await prisma.flow.update({
      where: { id: flow.id },
      data: { updatedAt: new Date() },
    });

    return { success: true, versionId: latestUnpublished.id };
  }

  // No unpublished version — create one
  const latestVersion = await prisma.flowVersion.findFirst({
    where: { flowId: flow.id },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const nextVersion = (latestVersion?.version ?? 0) + 1;

  const version = await prisma.flowVersion.create({
    data: {
      flowId: flow.id,
      version: nextVersion,
      config: toPrismaJson(input.config),
      changelog: "Auto-saved draft",
    },
  });

  return { success: true, versionId: version.id };
}

/* ── Publish ──────────────────────────────────────────── */

export async function publishFlow(input: {
  flowId: string;
  config: FlowConfig;
  changelog?: string;
}): Promise<{ success: true; versionId: string; version: number }> {
  const userId = await requireUser();
  const flow = await requireFlowAccess(input.flowId, userId);

  const latestVersion = await prisma.flowVersion.findFirst({
    where: { flowId: flow.id },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const nextVersion = (latestVersion?.version ?? 0) + 1;

  // Create the published version
  const version = await prisma.flowVersion.create({
    data: {
      flowId: flow.id,
      version: nextVersion,
      config: toPrismaJson(input.config),
      changelog: input.changelog ?? `Published v${nextVersion}`,
      publishedAt: new Date(),
    },
  });

  // Point the flow's publishedVersion to this new version
  await prisma.flow.update({
    where: { id: flow.id },
    data: {
      status: "PUBLISHED",
      publishedVersionId: version.id,
      updatedAt: new Date(),
    },
  });

  return { success: true, versionId: version.id, version: version.version };
}

/* ── Get flow by ID ──────────────────────────────────── */

export async function getFlow(flowId: string): Promise<{
  flowId: string;
  projectId: string;
  config: FlowConfig | null;
  version: number | null;
  status: string;
  registryKeys: {
    id: string;
    key: string;
    type: "SCREEN" | "COMPONENT";
    description: string | null;
  }[];
}> {
  const userId = await requireUser();
  const flow = await requireFlowAccess(flowId, userId);

  // Load the latest version if it exists
  const latest = await prisma.flowVersion.findFirst({
    where: { flowId: flow.id },
    orderBy: { version: "desc" },
  });

  const runtimePrisma = prisma as typeof prisma & {
    customRegistryKey?: {
      findMany: (args: unknown) => Promise<
        {
          id: string;
          key: string;
          type: "SCREEN" | "COMPONENT";
          description: string | null;
        }[]
      >;
    };
  };

  const registryKeys = runtimePrisma.customRegistryKey
    ? await runtimePrisma.customRegistryKey.findMany({
        where: { projectId: flow.projectId },
        orderBy: [{ type: "asc" }, { key: "asc" }],
        select: {
          id: true,
          key: true,
          type: true,
          description: true,
        },
      })
    : [];

  return {
    flowId: flow.id,
    projectId: flow.projectId,
    config: latest ? (latest.config as unknown as FlowConfig) : null,
    version: latest?.version ?? null,
    status: flow.status,
    registryKeys,
  };
}

/* ── Load latest version for a flow ──────────────────── */

export async function loadLatestVersion(flowId: string): Promise<{
  config: FlowConfig;
  versionId: string;
  version: number;
  status: string;
} | null> {
  const userId = await requireUser();
  await requireFlowAccess(flowId, userId);

  const latest = await prisma.flowVersion.findFirst({
    where: { flowId },
    orderBy: { version: "desc" },
    include: { flow: { select: { status: true } } },
  });

  if (!latest) return null;

  return {
    config: latest.config as unknown as FlowConfig,
    versionId: latest.id,
    version: latest.version,
    status: latest.flow.status,
  };
}

export async function fetchFigmaImportPreview(input: {
  flowId: string;
  source: string;
}): Promise<ParsedFigmaImport[]> {
  const userId = await requireUser();
  await requireFlowAccess(input.flowId, userId);

  const parsedSource = parseFigmaSource(input.source);
  const authMode = getFigmaAuthMode();
  const tokenResult =
    authMode === "oauth"
      ? await getUsableFigmaAccessToken(userId)
      : authMode === "token"
        ? { mode: "token" as const, accessToken: "" }
        : null;

  if (!tokenResult) {
    throw new Error("Figma import is not configured. Add OAuth credentials or a server access token.");
  }

  const figmaHeaders =
    tokenResult.mode === "oauth"
      ? buildFigmaApiHeaders(tokenResult.accessToken)
      : buildFigmaFallbackHeaders();

  const fileResponse = await fetchFigmaJson<FigmaNodesResponse>(
    `/files/${parsedSource.fileKey}/nodes?ids=${encodeURIComponent(parsedSource.nodeId)}`,
    figmaHeaders,
  );

  const rootNode = fileResponse.nodes[parsedSource.nodeId]?.document;
  if (!rootNode) {
    throw new Error("That Figma node could not be loaded. Check that the URL points to a valid frame or layer you can access.");
  }

  const imageNodeIds = collectFigmaImageNodeIds(rootNode);
  let imageUrls: Record<string, string> | undefined;

  if (imageNodeIds.length > 0) {
    const imagesResponse = await fetchFigmaJson<{ images?: Record<string, string | null> }>(
      `/images/${parsedSource.fileKey}?ids=${encodeURIComponent(imageNodeIds.join(","))}&format=png&use_absolute_bounds=true`,
      figmaHeaders,
    );

    imageUrls = Object.fromEntries(
      Object.entries(imagesResponse.images ?? {}).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0,
      ),
    );
  }

  return buildFigmaImports({
    fileKey: parsedSource.fileKey,
    nodeId: parsedSource.nodeId,
    sourceUrl: parsedSource.sourceUrl,
    response: fileResponse,
    imageUrls,
  });
}

export async function getFigmaConnectionStatus(input: {
  flowId: string;
}): Promise<{
  mode: "oauth" | "token" | "none";
  connected: boolean;
  accountLabel: string | null;
  expiresAt: string | null;
  connectUrl: string | null;
}> {
  const userId = await requireUser();
  await requireFlowAccess(input.flowId, userId);

  const status = await getFigmaConnectionStatusForUser(userId);

  return {
    ...status,
    connectUrl: status.mode === "oauth" ? `/api/figma/connect?flowId=${encodeURIComponent(input.flowId)}` : null,
  };
}
