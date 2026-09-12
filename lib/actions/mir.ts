"use server";

import { auth } from "@clerk/nextjs/server";
import { PrismaClient, InitialMIR, FinalMIR } from "@prisma/client";

const prisma = new PrismaClient();

export async function updateInitialMIR(
  mirId: string,
  newData: Partial<InitialMIR>
) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("Unauthorized");

  const updated = await prisma.initialMIR.update({
    where: { id: mirId, orgId },
    data: newData,
  });

  return updated;
}

export async function updateFinalMIR(
  mirId: string,
  newData: Partial<FinalMIR>
) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) throw new Error("Unauthorized");

  const updated = await prisma.finalMIR.update({
    where: { id: mirId, orgId },
    data: newData,
  });

  return updated;
}
