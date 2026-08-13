import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getSessionSecret, isAuthEnabled, verifySessionToken } from "@/lib/auth";

const PUBLIC_ROUTES = new Set(["/login", "/api/auth/login", "/api/mlb/odds"]);
const ADMIN_ROUTES = ["/admin"];

export async function middleware(request: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authRole = cookieValue ? await verifySessionToken(cookieValue, getSessionSecret()) : null;

  if (PUBLIC_ROUTES.has(pathname)) {
    if (pathname === "/login" && authRole) {
      const redirectPath = authRole === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    return NextResponse.next();
  }

  if (!authRole) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isAdminRoute && authRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)"],
};
