import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import {
  FIGMA_OAUTH_STATE_COOKIE,
  buildFigmaAuthorizeUrl,
  createOAuthState,
  isFigmaOAuthEnabled,
  serializeOAuthStateCookie,
} from "@/lib/figma-oauth";

async function requireFlowAccess(flowId: string, userId: string) {
  const flow = await prisma.flow.findUnique({
    where: { id: flowId },
    include: { project: { select: { userId: true } } },
  });

  if (!flow || flow.project.userId !== userId) {
    return null;
  }

  return flow;
}

export async function GET(request: NextRequest) {
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFigmaOAuthEnabled()) {
    return NextResponse.json(
      { error: "Figma OAuth is not configured on this server." },
      { status: 500 },
    );
  }

  const flowId = request.nextUrl.searchParams.get("flowId")?.trim();
  if (!flowId) {
    return NextResponse.json({ error: "Missing flowId" }, { status: 400 });
  }

  const flow = await requireFlowAccess(flowId, userId);
  if (!flow) {
    return NextResponse.json({ error: "Flow not found or access denied" }, { status: 404 });
  }

  const statePayload = createOAuthState(userId, flowId);
  const redirectUrl = buildFigmaAuthorizeUrl(statePayload.state);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(FIGMA_OAUTH_STATE_COOKIE, serializeOAuthStateCookie(statePayload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
