"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { createProjectSchema, updateProjectSchema } from "@/lib/validations";
import { projectListInclude, projectDetailInclude } from "@/lib/types";

export async function getProjects() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const projects = await prisma.project.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
    include: projectListInclude,
  });

  return projects;
}

export async function getProject(projectId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: userId,
    },
    include: projectDetailInclude,
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return project;
}

export async function createProject(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const platform = formData.get("platform") as string;
  const iconFile = formData.get("icon") as File | null;

  // Validate text fields with Zod
  const validated = createProjectSchema.parse({ name, platform });

  let iconUrl: string | undefined;

  // Upload icon to Vercel Blob if provided
  if (iconFile && iconFile.size > 0) {
    if (!iconFile.type.startsWith("image/")) {
      throw new Error("Icon must be an image file");
    }

    if (iconFile.size > 2 * 1024 * 1024) {
      throw new Error("Icon must be under 2MB");
    }

    const blob = await put(`project-icons/${userId}/${Date.now()}-${iconFile.name}`, iconFile, {
      access: "public",
      contentType: iconFile.type,
    });

    iconUrl = blob.url;
  }

  const project = await prisma.project.create({
    data: {
      name: validated.name,
      platform: validated.platform,
      iconUrl,
      userId: userId,
    },
  });

  revalidatePath("/dashboard");
  return project;
}

export async function updateProject(projectId: string, formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: userId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const name = formData.get("name") as string | null;
  const platform = formData.get("platform") as string | null;
  const iconFile = formData.get("icon") as File | null;
  const removeIcon = formData.get("removeIcon") === "true";

  // Build update payload from non-null fields
  const updateData: Record<string, any> = {};
  if (name) updateData.name = name;
  if (platform) updateData.platform = platform;

  // Validate provided fields
  const validated = updateProjectSchema.parse(updateData);

  // Handle icon removal
  if (removeIcon && project.iconUrl) {
    await del(project.iconUrl);
    validated.iconUrl = undefined;
    updateData.iconUrl = null;
  }

  // Handle new icon upload
  if (iconFile && iconFile.size > 0) {
    if (!iconFile.type.startsWith("image/")) {
      throw new Error("Icon must be an image file");
    }

    if (iconFile.size > 2 * 1024 * 1024) {
      throw new Error("Icon must be under 2MB");
    }

    // Delete old icon if exists
    if (project.iconUrl) {
      await del(project.iconUrl);
    }

    const blob = await put(`project-icons/${userId}/${Date.now()}-${iconFile.name}`, iconFile, {
      access: "public",
      contentType: iconFile.type,
    });

    updateData.iconUrl = blob.url;
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { ...validated, ...updateData },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return updated;
}

export async function deleteProject(projectId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: userId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Clean up icon from Vercel Blob
  if (project.iconUrl) {
    await del(project.iconUrl);
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  revalidatePath("/dashboard");
  return { success: true };
}