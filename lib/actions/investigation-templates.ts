"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgAuth } from "@/lib/auth-guard";
import { AuditAction, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getInvestigationTemplates(orgId: string) {
  return await prisma.investigationSectionTemplate.findMany({
    where: { orgId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createInvestigationTemplate(sectionName: string, orgSlug: string) {
  const { orgId, userId } = await requireOrgAuth();
  
  const template = await prisma.investigationSectionTemplate.create({
    data: {
      orgId,
      sectionName,
      isActive: true,
    }
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      entityType: "InvestigationSectionTemplate",
      entityId: template.id,
      action: AuditAction.CREATE,
      changedById: userId,
      newData: template as unknown as Prisma.InputJsonValue,
      reason: "Created investigation section template",
    },
  });

  revalidatePath(`/${orgSlug}/settings/investigation-templates`);
  return template;
}

export async function toggleInvestigationTemplate(id: string, isActive: boolean, orgSlug: string) {
  const { orgId, userId } = await requireOrgAuth();
  
  const existing = await prisma.investigationSectionTemplate.findUnique({
    where: { id, orgId }
  });

  if (!existing) {
    throw new Error("Template not found");
  }

  const template = await prisma.investigationSectionTemplate.update({
    where: { id, orgId },
    data: { isActive }
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      entityType: "InvestigationSectionTemplate",
      entityId: template.id,
      action: AuditAction.UPDATE,
      changedById: userId,
      previousData: existing as unknown as Prisma.InputJsonValue,
      newData: template as unknown as Prisma.InputJsonValue,
      reason: `Toggled investigation section template to ${isActive}`,
    },
  });

  revalidatePath(`/${orgSlug}/settings/investigation-templates`);
  return template;
}

export async function initializeCustomSections(investigationId: string, orgId: string) {
  // Get all active templates
  const activeTemplates = await prisma.investigationSectionTemplate.findMany({
    where: { orgId, isActive: true }
  });

  if (activeTemplates.length === 0) return;

  // Get existing custom sections for this investigation
  const existingSections = await prisma.investigationCustomSection.findMany({
    where: { investigationId, orgId }
  });

  const existingTemplateIds = new Set(existingSections.map(s => s.templateId));

  const newSectionsData = activeTemplates
    .filter(t => !existingTemplateIds.has(t.id))
    .map(t => ({
      orgId,
      investigationId,
      templateId: t.id,
    }));

  if (newSectionsData.length > 0) {
    await prisma.investigationCustomSection.createMany({
      data: newSectionsData,
    });
  }
}

export async function getCustomSections(investigationId: string) {
  const { orgId } = await requireOrgAuth();
  return await prisma.investigationCustomSection.findMany({
    where: { investigationId, orgId },
    include: { template: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateCustomSection(id: string, data: {
  assignedToId?: string | null;
  isRequired?: boolean;
  assignedDate?: Date | null;
  exemptRationale?: string | null;
  results?: string | null;
}) {
  const { orgId, userId } = await requireOrgAuth();
  
  const existing = await prisma.investigationCustomSection.findUnique({
    where: { id, orgId }
  });

  if (!existing) {
    throw new Error("Custom section not found");
  }

  const updated = await prisma.investigationCustomSection.update({
    where: { id, orgId },
    data: {
      ...data,
    }
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      entityType: "InvestigationCustomSection",
      entityId: updated.id,
      action: AuditAction.UPDATE,
      changedById: userId,
      previousData: existing as unknown as Prisma.InputJsonValue,
      newData: updated as unknown as Prisma.InputJsonValue,
      reason: "Updated custom investigation section",
    },
  });

  return updated;
}
