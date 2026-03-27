import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isDocsHost(host: string): boolean {
  const hostname = host.split(":")[0].toLowerCase();
  return hostname === "doc.arlo.com" || hostname === "doc.localhost";
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");

  if (!host || !isDocsHost(host)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const docsUrl = request.nextUrl.clone();
  docsUrl.pathname = "/docs";
  return NextResponse.rewrite(docsUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
