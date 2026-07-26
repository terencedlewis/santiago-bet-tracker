import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE, getAppPassword, isAuthEnabled } from "@/lib/auth";

const COOKIE_MAX_AGE_DAYS = 30;
const COOKIE_MAX_AGE_SECONDS = (() => {
  const envValue = process.env.AUTH_COOKIE_MAX_AGE_SECONDS;
  if (envValue == null) return COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  const parsed = Number(envValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
})();

function safeCompare(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(valueBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthEnabled()) {
      return NextResponse.json({ success: true, authDisabled: true });
    }

    const body = await request.json();
    const password = typeof body?.password === "string" ? body.password : "";
    const expectedPassword = getAppPassword();

    if (!safeCompare(password, expectedPassword)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: AUTH_COOKIE_VALUE,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.includes("APP_PASSWORD")) {
      return NextResponse.json({ error: "Server password is not configured" }, { status: 500 });
    }
    return NextResponse.json({ error: "Invalid login request" }, { status: 400 });
  }
}
