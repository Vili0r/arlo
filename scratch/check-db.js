const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const c = await prisma.complaint.findFirst({
    where: { complaintNumber: 'CMP-2026-0003' },
    include: { initialMIR: true, finalMIR: true, vigilanceDecisionTrees: true }
  });
  console.log(JSON.stringify(c, null, 2));
}
run();
