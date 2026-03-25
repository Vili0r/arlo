"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateApiKey } from "@/lib/api-keys";

export async function getAllKeys() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const keys = await prisma.apiKey.findMany({
    where: { project: { userId } },
    include: {
      project: { select: { id: true, name: true, iconUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return keys;
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

  const { rawKey, prefix, hashedKey } = generateApiKey(data.environment);

  await prisma.apiKey.create({
    data: {
      projectId,
      name: data.name,
      hashedKey,
      prefix,
      environment: data.environment,
    },
  });

  revalidatePath("/dashboard/key");
  return { rawKey, prefix };
}

export async function deleteApiKey(keyId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const key = await prisma.apiKey.findFirst({
    where: { id: keyId, project: { userId } },
  });
  if (!key) throw new Error("Key not found");

  await prisma.apiKey.delete({ where: { id: keyId } });
  revalidatePath("/dashboard/key");
}

export async function getUserProjects() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return prisma.project.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
