import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizePostgresConnectionString } from "./database-url";

const adapter = new PrismaPg({
  connectionString: normalizePostgresConnectionString(process.env.DATABASE_URL!),
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function hasExpectedModelDelegates(client: PrismaClient | undefined): client is PrismaClient {
  if (!client) return false;

  const runtimeClient = client as PrismaClient & Record<string, unknown>;
  return [
    "project",
    "apiKey",
    "flow",
    "flowVersion",
    "placement",
    "customRegistryKey",
    "figmaConnection",
  ].every((key) => Boolean(runtimeClient[key]));
}

const prisma =
  (hasExpectedModelDelegates(globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : undefined) ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
