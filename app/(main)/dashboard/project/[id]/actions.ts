"use server";

import prisma from "@/lib/prisma"; // adjust to your setup
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateApiKey } from "@/lib/api-keys";

export async function createFlow(projectId: string, data: { name: string; slug: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify ownership
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  const flow = await prisma.flow.create({
    data: {
      projectId,
      name: data.name,
      slug: data.slug,
    },
  });

  revalidatePath(`/project/${projectId}`);
  return flow;
}

export async function createApiKey(
  projectId: string,
  data: { name: string; environment: "DEVELOPMENT" | "PRODUCTION" }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  const { rawKey, hashedKey, prefix } = generateApiKey(data.environment);

  await prisma.apiKey.create({
    data: {
      projectId,
      name: data.name,
      hashedKey,
      prefix,
      environment: data.environment,
    },
  });

  revalidatePath(`/dashboard/project/${projectId}`);

  // Return the raw key ONCE — it can never be retrieved again
  return { rawKey, prefix };
}

export async function deleteApiKey(projectId: string, keyId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  await prisma.apiKey.delete({
    where: { id: keyId, projectId },
  });

  revalidatePath(`/dashboard/project/${projectId}`);
}

export async function createPlacement(
  projectId: string,
  data: { key: string; name?: string; flowId: string }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  const flow = await prisma.flow.findFirst({
    where: { id: data.flowId, projectId },
  });
  if (!flow) throw new Error("Flow not found");

  const placement = await prisma.placement.create({
    data: {
      projectId,
      flowId: data.flowId,
      key: data.key.trim(),
      name: data.name?.trim() || null,
    },
  });

  revalidatePath(`/dashboard/project/${projectId}`);
  return placement;
}

export async function deletePlacement(projectId: string, placementId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  const placement = await prisma.placement.findFirst({
    where: {
      id: placementId,
      projectId,
    },
  });
  if (!placement) throw new Error("Placement not found");

  await prisma.placement.delete({
    where: { id: placementId },
  });

  revalidatePath(`/dashboard/project/${projectId}`);
}

export async function createRegistryKey(
  projectId: string,
  data: {
    key: string;
    type: "SCREEN" | "COMPONENT";
    description?: string;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  const registryKey = await prisma.customRegistryKey.create({
    data: {
      projectId,
      key: data.key.trim(),
      type: data.type,
      description: data.description?.trim() || null,
    },
  });

  revalidatePath(`/dashboard/project/${projectId}`);
  return registryKey;
}

export async function deleteRegistryKey(projectId: string, registryKeyId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  const registryKey = await prisma.customRegistryKey.findFirst({
    where: {
      id: registryKeyId,
      projectId,
    },
  });
  if (!registryKey) throw new Error("Registry key not found");

  await prisma.customRegistryKey.delete({
    where: { id: registryKeyId },
  });

  revalidatePath(`/dashboard/project/${projectId}`);
}
