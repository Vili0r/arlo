import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Release all record locks held by this user across any entity
    const result = await prisma.recordLock.deleteMany({
      where: {
        lockedById: userId,
      },
    });

    return NextResponse.json({
      success: true,
      releasedLocksCount: result.count,
    });
  } catch (error) {
    console.error("[RecordLock:ReleaseAll] Error:", error);
    return NextResponse.json(
      { error: "Failed to release locks" },
      { status: 500 }
    );
  }
}
