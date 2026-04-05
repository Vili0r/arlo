import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const versions = await prisma.flowVersion.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  return NextResponse.json({ versions });
}
