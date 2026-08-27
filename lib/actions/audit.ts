"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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
