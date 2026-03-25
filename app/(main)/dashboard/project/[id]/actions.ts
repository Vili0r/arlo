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
