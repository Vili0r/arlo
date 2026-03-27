import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import {
  FIGMA_OAUTH_STATE_COOKIE,
  exchangeCodeForFigmaTokens,
  fetchFigmaMe,
  isFigmaOAuthEnabled,
  parseOAuthStateCookie,
  upsertFigmaConnection,
} from "@/lib/figma-oauth";

function buildFlowRedirect(flowId: string, status: "connected" | "error"): string {
  const url = new URL(`/flow/${flowId}`, "http://localhost");
  url.searchParams.set("figma", status);
  if (status === "connected") {
    url.searchParams.set("openImport", "figma");
  }
  return `${url.pathname}${url.search}`;
}

export async function GET(request: NextRequest) {
  if (!isFigmaOAuthEnabled()) {
    return new NextResponse("Figma OAuth is not configured on this server.", { status: 500 });
  }

  const { userId } = getAuth(request);
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const stateCookie = parseOAuthStateCookie(request.cookies.get(FIGMA_OAUTH_STATE_COOKIE)?.value);
  const responseState = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const authError = request.nextUrl.searchParams.get("error");

  if (!stateCookie || !responseState || stateCookie.state !== responseState || stateCookie.userId !== userId) {
    return new NextResponse("Figma OAuth state verification failed.", { status: 400 });
  }

  const redirectResponse = NextResponse.redirect(
    new URL(buildFlowRedirect(stateCookie.flowId, authError || !code ? "error" : "connected"), request.url),
  );
  redirectResponse.cookies.delete(FIGMA_OAUTH_STATE_COOKIE);

  if (authError || !code) {
    return redirectResponse;
  }

  try {
    const tokens = await exchangeCodeForFigmaTokens(code);
    const profile = await fetchFigmaMe(tokens.access_token);

    await upsertFigmaConnection({
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? "",
      tokenType: tokens.token_type,
      expiresInSeconds: tokens.expires_in,
      figmaUserId: profile?.id || tokens.user_id_string || null,
      figmaHandle: profile?.handle || null,
      figmaEmail: profile?.email || null,
      figmaAvatarUrl: profile?.img_url || null,
    });

    return redirectResponse;
  } catch (error) {
    console.error("Figma OAuth callback failed:", error);
    return NextResponse.redirect(new URL(buildFlowRedirect(stateCookie.flowId, "error"), request.url));
  }
}
