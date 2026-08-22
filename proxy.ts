import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const hostname = req.headers.get("host") || "";
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

  // Check if request is on a tenant subdomain (e.g. cvmed.localhost:3000 or cvmed.arlopms.com)
  let isSubdomain = false;
  let orgIdentifier = "";

  if (hostname.includes(".localhost")) {
    const parts = hostname.split(".localhost")[0];
    if (parts && parts !== "localhost" && parts !== "www") {
      isSubdomain = true;
      orgIdentifier = parts;
    }
  } else if (hostname.endsWith(`.${rootDomain}`) && hostname !== rootDomain) {
    const prefix = hostname.replace(`.${rootDomain}`, "");
    if (prefix && prefix !== "www") {
      isSubdomain = true;
      orgIdentifier = prefix;
    }
  }

  const { pathname, search } = req.nextUrl;

  // Never rewrite Next.js internals, Clerk auth endpoints, or public assets
  const isExcludedPath =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/__clerk") ||
    pathname.includes(".");

  if (isSubdomain && orgIdentifier) {
    // If path is excluded (like /sign-in, /sign-up, /api), let it route directly
    if (isExcludedPath) {
      return NextResponse.next();
    }

    // Check authentication
    const authContext = await auth();
    if (!authContext.userId) {
      // Redirect to central sign-in with return URL
      const protocol = req.nextUrl.protocol || "http:";
      const rootOrigin = `${protocol}//${rootDomain}`;
      const returnUrl = req.url;
      const signInUrl = new URL("/sign-in", rootOrigin);
      signInUrl.searchParams.set("redirect_url", returnUrl);
      return NextResponse.redirect(signInUrl);
    }

    // Internally rewrite to /[orgSlug]/...
    return NextResponse.rewrite(
      new URL(`/${orgIdentifier}${pathname}${search}`, req.url)
    );
  }

  // Root domain handling
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
