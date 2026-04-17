"use server";

import prisma from "@/lib/prisma"; // adjust to your setup
import { createEntryPointSchema, updateEntryPointAllocationsSchema } from "@/lib/validations";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateApiKey } from "@/lib/api-keys";

function hasPublishedVersionForEnvironment(
  flow: {
    developmentVersion: { id: string; version: number } | null;
    productionVersion: { id: string; version: number } | null;
  },
  environment: "DEVELOPMENT" | "PRODUCTION"
) {
  return environment === "PRODUCTION"
    ? Boolean(flow.productionVersion)
    : Boolean(flow.developmentVersion);
}

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

    // Remove any variant allocations that reference this flow
    await tx.entryPointVariant.deleteMany({
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
    variants?: { flowId: string; percentage: number }[];
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  const parsed = createEntryPointSchema.parse({
    key: data.key.trim(),
    name: data.name?.trim() || undefined,
    flowId: data.flowId,
    environment: data.environment,
    variants: data.variants,
  });

  // Collect all flow IDs we need to validate
  const variantFlowIds = (parsed.variants ?? []).map((v) => v.flowId);
  const allFlowIds = [parsed.flowId, ...variantFlowIds];

  const flows = await prisma.flow.findMany({
    where: {
      projectId,
      id: { in: allFlowIds },
    },
    include: {
      developmentVersion: {
        select: { id: true, version: true },
      },
      productionVersion: {
        select: { id: true, version: true },
      },
    },
  });

  const flowById = new Map(flows.map((flow) => [flow.id, flow]));
  const primaryFlow = flowById.get(parsed.flowId);

  if (!primaryFlow) {
    throw new Error("Primary flow not found");
  }

  if (
    primaryFlow.status !== "PUBLISHED" ||
    !hasPublishedVersionForEnvironment(primaryFlow, parsed.environment)
  ) {
    throw new Error("Primary flow must be published in the selected environment");
  }

  // Validate all variant flows exist and are published
  if (parsed.variants && parsed.variants.length > 0) {
    for (const variant of parsed.variants) {
      const variantFlow = flowById.get(variant.flowId);
      if (!variantFlow) {
        throw new Error(`Variant flow not found: ${variant.flowId}`);
      }
      if (
        variantFlow.status !== "PUBLISHED" ||
        !hasPublishedVersionForEnvironment(variantFlow, parsed.environment)
      ) {
        throw new Error(
          `Flow "${variantFlow.name}" must be published in the selected environment`
        );
      }
    }
  }

  const entryPoint = await prisma.$transaction(async (tx) => {
    const ep = await tx.entryPoint.create({
      data: {
        projectId,
        flowId: parsed.flowId,
        key: parsed.key,
        name: parsed.name?.trim() || null,
        environment: parsed.environment,
      },
    });

    // Create variant rows if A/B test is configured
    if (parsed.variants && parsed.variants.length > 0) {
      await tx.entryPointVariant.createMany({
        data: parsed.variants.map((variant, index) => ({
          entryPointId: ep.id,
          flowId: variant.flowId,
          percentage: variant.percentage,
          order: index,
        })),
      });
    }

    return ep;
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

export async function updateEntryPointAllocations(
  projectId: string,
  entryPointId: string,
  data: {
    variants: { flowId: string; percentage: number }[];
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new Error("Project not found");

  const entryPoint = await prisma.entryPoint.findFirst({
    where: { id: entryPointId, projectId },
  });
  if (!entryPoint) throw new Error("Entry point not found");

  const parsed = updateEntryPointAllocationsSchema.parse(data);

  // Validate all variant flows exist, belong to this project, and are published
  const flowIds = parsed.variants.map((v) => v.flowId);
  const flows = await prisma.flow.findMany({
    where: {
      projectId,
      id: { in: flowIds },
    },
    include: {
      developmentVersion: {
        select: { id: true, version: true },
      },
      productionVersion: {
        select: { id: true, version: true },
      },
    },
  });

  const flowById = new Map(flows.map((flow) => [flow.id, flow]));

  for (const variant of parsed.variants) {
    const flow = flowById.get(variant.flowId);
    if (!flow) {
      throw new Error(`Flow not found: ${variant.flowId}`);
    }
    if (
      flow.status !== "PUBLISHED" ||
      !hasPublishedVersionForEnvironment(flow, entryPoint.environment)
    ) {
      throw new Error(
        `Flow "${flow.name}" must be published in the ${entryPoint.environment.toLowerCase()} environment`
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    // Delete existing variants
    await tx.entryPointVariant.deleteMany({
      where: { entryPointId },
    });

    // Create new variants
    await tx.entryPointVariant.createMany({
      data: parsed.variants.map((variant, index) => ({
        entryPointId,
        flowId: variant.flowId,
        percentage: variant.percentage,
        order: index,
      })),
    });

    // Update the primary flowId to match the first variant
    await tx.entryPoint.update({
      where: { id: entryPointId },
      data: { flowId: parsed.variants[0].flowId },
    });
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
