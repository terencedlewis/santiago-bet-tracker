import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE, isAuthEnabled } from "@/lib/auth";

const PUBLIC_ROUTES = new Set(["/login", "/api/auth/login"]);

export function middleware(request: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const isAuthenticated = request.cookies.get(AUTH_COOKIE_NAME)?.value === AUTH_COOKIE_VALUE;

  if (PUBLIC_ROUTES.has(pathname)) {
    if (isAuthenticated && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isAuthenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)"],
};
