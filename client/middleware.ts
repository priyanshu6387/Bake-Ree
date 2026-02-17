import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OPS_PREFIX = "/ops";
const ADMIN_PREFIX = "/admin";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Guard invalid wildcard-style URLs typed manually, e.g. /admin/*
  if (pathname === `${ADMIN_PREFIX}/*` || pathname.startsWith(`${ADMIN_PREFIX}/*/`)) {
    const redirectUrl = new URL(`${ADMIN_PREFIX}${search}`, request.url);
    return NextResponse.redirect(redirectUrl, 307);
  }

  // Canonical URL: /admin/*
  if (pathname === OPS_PREFIX || pathname.startsWith(`${OPS_PREFIX}/`)) {
    const target = pathname.replace(OPS_PREFIX, ADMIN_PREFIX) || ADMIN_PREFIX;
    const redirectUrl = new URL(`${target}${search}`, request.url);
    return NextResponse.redirect(redirectUrl, 307);
  }

  // Serve Ops app under /admin/* while keeping /admin in browser URL
  if (pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)) {
    const rewrittenPath = pathname.replace(ADMIN_PREFIX, OPS_PREFIX) || OPS_PREFIX;
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = rewrittenPath;
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ops/:path*", "/admin/:path*"],
};
