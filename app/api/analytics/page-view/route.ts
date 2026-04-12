import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { tinybird } from "@/lib/tinybird";
import prisma from "@/lib/prisma";

const trackPageViewSchema = z.object({
  pathname: z.string().trim().min(1).max(2048),
  sessionId: z.string().trim().min(1).max(128),
});

function normalizePathname(pathname: string) {
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    try {
      return new URL(pathname).pathname || "/";
    } catch {
      return "/";
    }
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function getCountry(request: NextRequest) {
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-country");

  if (!country) {
    return null;
  }

  const normalized = country.trim().toUpperCase();
  return normalized.length <= 8 ? normalized : null;
}

async function getProjectIdForPathname(pathname: string) {
  const projectMatch = pathname.match(/^\/dashboard\/project\/([^/]+)/);

  if (projectMatch) {
    return projectMatch[1] ?? null;
  }

  const flowMatch = pathname.match(/^\/flow\/([^/]+)/);

  if (!flowMatch?.[1]) {
    return null;
  }

  const flow = await prisma.flow.findUnique({
    where: { id: flowMatch[1] },
    select: { projectId: true },
  });

  return flow?.projectId ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = trackPageViewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const pathname = normalizePathname(parsed.data.pathname);
    const projectId = await getProjectIdForPathname(pathname);

    await tinybird.pageViews.ingest({
      timestamp: new Date().toISOString(),
      pathname,
      project_id: projectId,
      session_id: parsed.data.sessionId,
      country: getCountry(request),
    });

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (error) {
    console.error("Failed to record Tinybird page view", error);

    return NextResponse.json(
      { error: "Failed to record page view" },
      { status: 500 },
    );
  }
}
