import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.complaint.findUnique({
    where: { id: "cmt8vgfog00019kxvbs3gepgs" },
    include: { investigation: true }
  });
  console.log("Complaint found:", !!c);
  if (c) {
    console.log("OrgId:", c.orgId);
    console.log("Has Investigation:", !!c.investigation);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
