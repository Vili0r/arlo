import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/docs(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

function isDocsHost(host: string): boolean {
  const hostname = host.split(":")[0].toLowerCase();
  return hostname === "docs.arlo.com" || hostname === "docs.localhost";
}

export default clerkMiddleware(async (auth, request) => {
  const host = request.headers.get("host");

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  if (!host || !isDocsHost(host) || request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const docsUrl = request.nextUrl.clone();
  docsUrl.pathname = "/docs";
  return NextResponse.rewrite(docsUrl);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
