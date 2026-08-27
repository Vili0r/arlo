import { PrismaClient } from '@prisma/client';
import { generateAuditDiff } from '../utils/auditDiff.ts';

const prisma = new PrismaClient();
async function main() {
  const complaint = await prisma.complaint.findFirst();
  if (!complaint) return console.log("No complaint");

  const fullyUpdated = { ...complaint, shortDescription: complaint.shortDescription + " MODIFIED" };

  const fieldChanges = generateAuditDiff(complaint, fullyUpdated);
  console.log("fieldChanges:", fieldChanges);
}
main().catch(console.error).finally(() => prisma.$disconnect());
