"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export interface GetAuditLogsParams {
  entityType?: string;
  entityId?: string;
  complaintId?: string;
  capaId?: string;
  limit?: number;
}

export async function getAuditHistory(entityType: string, entityId: string) {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("Unauthorized");
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      orgId,
      entityType,
      entityId,
    },
    orderBy: {
      timestamp: "desc",
    },
    include: {
      changedBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return logs;
}

export async function getAuditLogs(params: GetAuditLogsParams) {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("Unauthorized");
  }

  const whereClause: {
    orgId: string;
    entityType?: string;
    entityId?: string;
    complaintId?: string;
    capaId?: string;
  } = { orgId };

  if (params.entityType) whereClause.entityType = params.entityType;
  if (params.entityId) whereClause.entityId = params.entityId;
  if (params.complaintId) whereClause.complaintId = params.complaintId;
  if (params.capaId) whereClause.capaId = params.capaId;

  const logs = await prisma.auditLog.findMany({
    where: whereClause,
    orderBy: {
      timestamp: "desc",
    },
    take: params.limit,
    include: {
      changedBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return logs;
}

