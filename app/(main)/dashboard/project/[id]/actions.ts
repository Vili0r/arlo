"use server";

import prisma from "@/lib/prisma"; // adjust to your setup
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { randomBytes, createHash } from "crypto";

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

function generateApiKey(environment: "DEVELOPMENT" | "PRODUCTION"): {
  rawKey: string;
  hashedKey: string;
  prefix: string;
} {
  const envPrefix = environment === "PRODUCTION" ? "ob_live_" : "ob_test_";
  const random = randomBytes(24).toString("base64url"); // 32 chars
  const rawKey = envPrefix + random;
  const prefix = rawKey.slice(0, envPrefix.length + 6); // e.g. "ob_live_abc123"
  const hashedKey = createHash("sha256").update(rawKey).digest("hex");
  return { rawKey, hashedKey, prefix };
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