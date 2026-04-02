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

export async function deleteFlow(projectId: string, flowId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  const flow = await prisma.flow.findFirst({
    where: {
      id: flowId,
      projectId,
    },
    select: {
      id: true,
      developmentVersionId: true,
      productionVersionId: true,
    },
  });
  if (!flow) throw new Error("Flow not found");

  await prisma.$transaction(async (tx) => {
    if (flow.developmentVersionId || flow.productionVersionId) {
      await tx.flow.update({
        where: { id: flowId },
        data: {
          developmentVersionId: null,
          productionVersionId: null,
          status: "DRAFT",
        },
      });
    }

    await tx.entryPoint.deleteMany({
      where: { flowId },
    });

    await tx.flowVersion.deleteMany({
      where: { flowId },
    });

    await tx.flow.delete({
      where: { id: flowId },
    });
  });

  revalidatePath(`/dashboard/project/${projectId}`);
  revalidatePath(`/flow/${flowId}`);
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

export async function createEntryPoint(
  projectId: string,
  data: {
    key: string;
    name?: string;
    flowId: string;
    environment: "DEVELOPMENT" | "PRODUCTION";
  }
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

  const entryPoint = await prisma.entryPoint.create({
    data: {
      projectId,
      flowId: data.flowId,
      key: data.key.trim(),
      name: data.name?.trim() || null,
      environment: data.environment,
    },
  });

  revalidatePath(`/dashboard/project/${projectId}`);
  return entryPoint;
}

export async function deleteEntryPoint(projectId: string, entryPointId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  const entryPoint = await prisma.entryPoint.findFirst({
    where: {
      id: entryPointId,
      projectId,
    },
  });
  if (!entryPoint) throw new Error("Entry point not found");

  await prisma.entryPoint.delete({
    where: { id: entryPointId },
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
