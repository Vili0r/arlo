"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
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
  collectFigmaSnapshotNodeIds,
  parseFigmaSource,
  type FigmaNodesResponse,
  type ParsedFigmaImport,
} from "./_lib/figma-import";
import {
  compileEditorDocument,
  createStoredEditorDocument,
  flowConfigToEditorDocument,
  readStoredFlow,
  type EditorDocument,
} from "./_lib/editor-document";
import { DEFAULT_FLOW_CONFIG } from "./_lib/default-flow-config";
import { applyImportedScreensToDocument, resolveTargetScreenIndex } from "./_lib/import-flow";
import type { ImportMode } from "./_lib/code-import";

/* ── helpers ──────────────────────────────────────────── */

async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

async function requireFlowAccess(flowId: string, userId: string) {
  const flow = await prisma.flow.findUnique({
    where: { id: flowId },
    include: {
      project: { select: { userId: true } },
      developmentVersion: {
        select: { id: true, version: true },
      },
      productionVersion: {
        select: { id: true, version: true },
      },
    },
  });
  if (!flow || flow.project.userId !== userId) {
    throw new Error("Flow not found or access denied");
  }
  return flow;
}

const FIGMA_API_BASE_URL = "https://api.figma.com/v1";
const FIGMA_RESPONSE_CACHE_TTL_MS = 60_000;
const FIGMA_RATE_LIMIT_RETRY_FALLBACK_MS = 1_000; // Shorter fallback for transient retries
const FIGMA_RATE_LIMIT_BAN_FALLBACK_MS = 60_000;  // Longer "ban" if we actually hit it and are told to wait
const FIGMA_REQUEST_CACHE_MAX_ENTRIES = 100;
const MAX_FIGMA_SNAPSHOT_EXPORTS = 24;

const figmaResponseCache = new Map<string, { expiresAt: number; payload: unknown }>();
const figmaInFlightRequests = new Map<string, Promise<unknown>>();
const figmaRateLimitUntil = new Map<string, number>();

function pruneFigmaRequestCaches(now = Date.now()) {
  if (
    figmaResponseCache.size <= FIGMA_REQUEST_CACHE_MAX_ENTRIES &&
    figmaRateLimitUntil.size <= FIGMA_REQUEST_CACHE_MAX_ENTRIES
  ) {
    return;
  }

  for (const [key, entry] of figmaResponseCache) {
    if (entry.expiresAt <= now) figmaResponseCache.delete(key);
  }

  for (const [key, retryAt] of figmaRateLimitUntil) {
    if (retryAt <= now) figmaRateLimitUntil.delete(key);
  }

  while (figmaResponseCache.size > FIGMA_REQUEST_CACHE_MAX_ENTRIES) {
    const oldestKey = figmaResponseCache.keys().next().value;
    if (!oldestKey) break;
    figmaResponseCache.delete(oldestKey);
  }

  while (figmaRateLimitUntil.size > FIGMA_REQUEST_CACHE_MAX_ENTRIES) {
    const oldestKey = figmaRateLimitUntil.keys().next().value;
    if (!oldestKey) break;
    figmaRateLimitUntil.delete(oldestKey);
  }
}

function getRetryAfterMs(response: Response, isInternalRetry = false): number {
  const retryAfter = response.headers.get("retry-after");
  if (!retryAfter) {
    return isInternalRetry ? FIGMA_RATE_LIMIT_RETRY_FALLBACK_MS : FIGMA_RATE_LIMIT_BAN_FALLBACK_MS;
  }

  const retryAfterSeconds = Number(retryAfter);
  if (Number.isFinite(retryAfterSeconds)) {
    return Math.max(1_000, retryAfterSeconds * 1_000);
  }

  const retryAfterDate = Date.parse(retryAfter);
  if (Number.isFinite(retryAfterDate)) {
    return Math.max(1_000, retryAfterDate - Date.now());
  }

  return isInternalRetry ? FIGMA_RATE_LIMIT_RETRY_FALLBACK_MS : FIGMA_RATE_LIMIT_BAN_FALLBACK_MS;
}

async function fetchFigmaJson<T>(
  path: string,
  headers: HeadersInit,
  options: { cacheKey?: string; cacheTtlMs?: number } = {},
): Promise<T> {
  const { cacheKey, cacheTtlMs = FIGMA_RESPONSE_CACHE_TTL_MS } = options;
  const now = Date.now();

  if (cacheKey) {
    pruneFigmaRequestCaches(now);

    const retryAt = figmaRateLimitUntil.get(cacheKey);
    if (retryAt && retryAt > now) {
      const secondsUntilRetry = Math.ceil((retryAt - now) / 1_000);
      throw new Error(`Figma is rate limiting this import. Try again in about ${secondsUntilRetry} seconds.`);
    }

    const cached = figmaResponseCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.payload as T;
    }

    const inFlight = figmaInFlightRequests.get(cacheKey);
    if (inFlight) {
      return (await inFlight) as T;
    }
  }

  const performRequest = async (attempt = 0): Promise<T> => {
    const response = await fetch(`${FIGMA_API_BASE_URL}${path}`, {
      headers,
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | { err?: string; message?: string }
      | null;

    if (!response.ok) {
      if (response.status === 429 && attempt < 2) {
        const retryAfterMs = getRetryAfterMs(response, true);
        // If the rate limit is short (less than 10 seconds), let's try waiting and retrying once or twice.
        if (retryAfterMs <= 10_000) {
          await new Promise((resolve) => setTimeout(resolve, retryAfterMs + 200 * attempt));
          return performRequest(attempt + 1);
        }
      }

      const retryAfterMs = response.status === 429 ? getRetryAfterMs(response) : null;
      if (cacheKey && retryAfterMs) {
        figmaRateLimitUntil.set(cacheKey, Date.now() + retryAfterMs);
      }

      const message =
        payload?.err ||
        payload?.message ||
        (retryAfterMs
          ? `Figma rate limit exceeded. Try again in about ${Math.ceil(retryAfterMs / 1_000)} seconds.`
          : `Figma request failed with status ${response.status}.`);
      throw new Error(message);
    }

    if (cacheKey) {
      figmaResponseCache.set(cacheKey, {
        expiresAt: Date.now() + cacheTtlMs,
        payload,
      });
    }

    return payload as T;
  };

  const request = performRequest();

  if (cacheKey) {
    figmaInFlightRequests.set(cacheKey, request);
    request.then(
      () => figmaInFlightRequests.delete(cacheKey),
      () => figmaInFlightRequests.delete(cacheKey),
    );
  }

  return (await request) as T;
}

function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

function requireFlowPayload(input: {
  config?: FlowConfig;
  document?: EditorDocument;
}): { draftPayload: unknown; runtimeConfig: FlowConfig } {
  if (input.document) {
    return {
      draftPayload: createStoredEditorDocument(input.document),
      runtimeConfig: compileEditorDocument(input.document),
    };
  }

  if (input.config) {
    return {
      draftPayload: input.config,
      runtimeConfig: input.config,
    };
  }

  throw new Error("A flow config or editor document is required.");
}

type PublishEnvironment = "DEVELOPMENT" | "PRODUCTION";

function getFlowStatus(data: {
  developmentVersion?: { id: string } | null;
  productionVersion?: { id: string } | null;
}) {
  return data.developmentVersion || data.productionVersion ? "PUBLISHED" : "DRAFT";
}

/* ── Save Draft ──────────────────────────────────────── */

export async function saveDraft(input: {
  flowId: string;
  config?: FlowConfig;
  document?: EditorDocument;
  changelog?: string;
}): Promise<{ success: true }> {
  const userId = await requireUser();
  const flow = await requireFlowAccess(input.flowId, userId);
  const { draftPayload } = requireFlowPayload(input);

  await prisma.flow.update({
    where: { id: flow.id },
    data: {
      draftConfig: toPrismaJson(draftPayload),
      draftUpdatedAt: new Date(),
      status: getFlowStatus(flow),
      updatedAt: new Date(),
    },
  });

  return { success: true };
}

/* ── Auto-save Draft ─────────────────────────────────── */

export async function autoSaveDraft(input: {
  flowId: string;
  config?: FlowConfig;
  document?: EditorDocument;
}): Promise<{ success: true }> {
  const userId = await requireUser();
  const flow = await requireFlowAccess(input.flowId, userId);
  const { draftPayload } = requireFlowPayload(input);

  await prisma.flow.update({
    where: { id: flow.id },
    data: {
      draftConfig: toPrismaJson(draftPayload),
      draftUpdatedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return { success: true };
}

/* ── Publish ──────────────────────────────────────────── */

export async function publishFlow(input: {
  flowId: string;
  config?: FlowConfig;
  document?: EditorDocument;
  environment?: PublishEnvironment;
  changelog?: string;
}): Promise<{ success: true; versionId: string; version: number }> {
  const userId = await requireUser();
  const flow = await requireFlowAccess(input.flowId, userId);
  const environment = input.environment ?? "DEVELOPMENT";
  const { runtimeConfig } = requireFlowPayload(input);

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
      config: toPrismaJson(runtimeConfig),
      changelog: input.changelog ?? `Published v${nextVersion}`,
      publishedEnvironment: environment,
      publishedAt: new Date(),
    },
  });

  const publishedField =
    environment === "PRODUCTION" ? "productionVersionId" : "developmentVersionId";

  await prisma.flow.update({
    where: { id: flow.id },
    data: {
      status: "PUBLISHED",
      [publishedField]: version.id,
      draftConfig: Prisma.DbNull,
      draftUpdatedAt: null,
      updatedAt: new Date(),
    },
  });

  return { success: true, versionId: version.id, version: version.version };
}

export async function promoteDevelopmentToProduction(input: {
  flowId: string;
  changelog?: string;
}): Promise<{ success: true; versionId: string; version: number }> {
  const userId = await requireUser();
  const flow = await prisma.flow.findUnique({
    where: { id: input.flowId },
    include: {
      project: { select: { userId: true } },
      developmentVersion: true,
    },
  });

  if (!flow || flow.project.userId !== userId) {
    throw new Error("Flow not found or access denied");
  }

  if (!flow.developmentVersion) {
    throw new Error("Publish a development version before promoting to production");
  }

  const latestVersion = await prisma.flowVersion.findFirst({
    where: { flowId: flow.id },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const nextVersion = (latestVersion?.version ?? 0) + 1;
  const developmentFlow = readStoredFlow(flow.developmentVersion.config);

  const version = await prisma.flowVersion.create({
    data: {
      flowId: flow.id,
      version: nextVersion,
      config: toPrismaJson(developmentFlow.runtimeConfig),
      changelog:
        input.changelog ??
        `Promoted development v${flow.developmentVersion.version} to production`,
      publishedEnvironment: "PRODUCTION",
      publishedAt: new Date(),
    },
  });

  await prisma.flow.update({
    where: { id: flow.id },
    data: {
      status: "PUBLISHED",
      productionVersionId: version.id,
      updatedAt: new Date(),
    },
  });

  return { success: true, versionId: version.id, version: version.version };
}

/* ── Get flow by ID ──────────────────────────────────── */

export async function getFlow(flowId: string): Promise<{
  flowId: string;
  projectId: string;
  document: EditorDocument | null;
  config: FlowConfig | null;
  version: number | null;
  status: string;
  developmentVersion: { id: string; version: number } | null;
  productionVersion: { id: string; version: number } | null;
  registryKeys: {
    id: string;
    key: string;
    type: "SCREEN" | "COMPONENT";
    description: string | null;
  }[];
}> {
  const userId = await requireUser();
  const flow = await requireFlowAccess(flowId, userId);

  // Prefer the mutable draft state when it exists; numbered versions are only published snapshots.
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

  const latestFlow = flow.draftConfig
    ? readStoredFlow(flow.draftConfig)
    : latest
      ? readStoredFlow(latest.config)
      : null;

  return {
    flowId: flow.id,
    projectId: flow.projectId,
    document: latestFlow?.document ?? null,
    config: latestFlow?.runtimeConfig ?? null,
    version: latest?.version ?? null,
    status: flow.status,
    developmentVersion: flow.developmentVersion,
    productionVersion: flow.productionVersion,
    registryKeys,
  };
}

/* ── Load latest version for a flow ──────────────────── */

export async function loadLatestVersion(flowId: string): Promise<{
  document: EditorDocument;
  config: FlowConfig;
  versionId: string;
  version: number;
  status: string;
} | null> {
  const userId = await requireUser();
  const flow = await requireFlowAccess(flowId, userId);

  const latest = await prisma.flowVersion.findFirst({
    where: { flowId },
    orderBy: { version: "desc" },
    include: { flow: { select: { status: true } } },
  });

  if (!latest && !flow.draftConfig) return null;

  const resolved = readStoredFlow(flow.draftConfig ?? latest!.config);

  return {
    document: resolved.document,
    config: resolved.runtimeConfig,
    versionId: latest?.id ?? "",
    version: latest?.version ?? 0,
    status: latest?.flow.status ?? flow.status,
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

  const filePath = `/files/${parsedSource.fileKey}/nodes?ids=${encodeURIComponent(parsedSource.nodeId)}`;
  const fileResponse = await fetchFigmaJson<FigmaNodesResponse>(filePath, figmaHeaders, {
    cacheKey: `${userId}:${filePath}`,
  });

  const rootNode = fileResponse.nodes[parsedSource.nodeId]?.document;
  if (!rootNode) {
    throw new Error("That Figma node could not be loaded. Check that the URL points to a valid frame or layer you can access.");
  }

  const importWarnings: string[] = [];
  const directImageNodeIds = collectFigmaImageNodeIds(rootNode);
  const snapshotNodeIds = collectFigmaSnapshotNodeIds(rootNode);
  const cappedSnapshotNodeIds = snapshotNodeIds.slice(0, MAX_FIGMA_SNAPSHOT_EXPORTS);
  const skippedSnapshotCount = snapshotNodeIds.length - cappedSnapshotNodeIds.length;

  if (skippedSnapshotCount > 0) {
    importWarnings.push(
      `Skipped ${skippedSnapshotCount} visual-only Figma layers during preview to avoid image export rate limits.`,
    );
  }

  const imageNodeIds = Array.from(
    new Set([
      ...directImageNodeIds,
      ...cappedSnapshotNodeIds,
    ]),
  );
  let imageUrls: Record<string, string> | undefined;

  if (imageNodeIds.length > 0) {
    const imagesPath = `/images/${parsedSource.fileKey}?ids=${encodeURIComponent(
      imageNodeIds.join(","),
    )}&format=png&use_absolute_bounds=true`;
    try {
      const imagesResponse = await fetchFigmaJson<{ images?: Record<string, string | null> }>(imagesPath, figmaHeaders, {
        cacheKey: `${userId}:${imagesPath}`,
      });

      imageUrls = Object.fromEntries(
        Object.entries(imagesResponse.images ?? {}).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Figma image export failed.";
      if (/rate limit/i.test(message)) {
        importWarnings.push(
          "Figma rate limited image exports, so Arlo continued with text and layout but skipped some visual-only artwork. Retry in a minute for a higher-fidelity import.",
        );
      } else {
        throw error;
      }
    }
  }

  return buildFigmaImports({
    fileKey: parsedSource.fileKey,
    nodeId: parsedSource.nodeId,
    sourceUrl: parsedSource.sourceUrl,
    response: fileResponse,
    imageUrls,
    warnings: importWarnings,
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

export async function applyImportedScreens(input: {
  flowId: string;
  screenIndex: number;
  mode: ImportMode;
  screens: FlowConfig["screens"];
}): Promise<{ success: true; selectedScreenIndex: number }> {
  const userId = await requireUser();
  const flow = await requireFlowAccess(input.flowId, userId);
  const latest = await prisma.flowVersion.findFirst({
    where: { flowId: input.flowId },
    orderBy: { version: "desc" },
    select: { config: true },
  });

  const currentDocument = flow.draftConfig
    ? readStoredFlow(flow.draftConfig).document
    : latest
      ? readStoredFlow(latest.config).document
    : flowConfigToEditorDocument(DEFAULT_FLOW_CONFIG);

  const { document, selectedScreenIndex } = applyImportedScreensToDocument({
    document: currentDocument,
    importedScreens: input.screens,
    mode: input.mode,
    screenIndex: resolveTargetScreenIndex(input.screenIndex, currentDocument.screens.length),
  });

  await autoSaveDraft({
    flowId: input.flowId,
    document,
  });

  revalidatePath(`/flow/${input.flowId}`);
  revalidatePath(`/flow/${input.flowId}/import`);
  revalidatePath(`/flow/${input.flowId}/import/figma`);

  return {
    success: true,
    selectedScreenIndex,
  };
}
