"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import type { FlowConfig } from "@/lib/types";

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
      config: input.config as any, // Prisma Json type
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
      data: { config: input.config as any },
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
      config: input.config as any,
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
      config: input.config as any,
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

  const registryKeys = await prisma.customRegistryKey.findMany({
    where: { projectId: flow.projectId },
    orderBy: [{ type: "asc" }, { key: "asc" }],
    select: {
      id: true,
      key: true,
      type: true,
      description: true,
    },
  });

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
