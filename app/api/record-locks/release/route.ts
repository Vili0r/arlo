import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { LockEntityType } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bodyText = await req.text();
    if (!bodyText) {
      return NextResponse.json({ error: "Missing body" }, { status: 400 });
    }

    const { entityType, recordId } = JSON.parse(bodyText) as {
      entityType: LockEntityType;
      recordId: string;
    };

    if (!entityType || !recordId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    await prisma.recordLock.deleteMany({
      where: {
        orgId,
        entityType,
        recordId,
        lockedById: userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RecordLock:Release] Error:", error);
    return NextResponse.json({ error: "Failed to release lock" }, { status: 500 });
  }
}
