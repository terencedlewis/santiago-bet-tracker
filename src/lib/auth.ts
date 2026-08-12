import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_COOKIE_NAME = "sbt_auth";
export const AUTH_COOKIE_VALUE = "authenticated";
export type AuthRole = "user" | "admin";
const AUTH_ENABLED = process.env.DISABLE_AUTH !== "true";

/**
 * Returns whether authentication checks should run.
 * Set DISABLE_AUTH=true only for temporary local testing.
 */
export function isAuthEnabled() {
  return AUTH_ENABLED;
}

export function getAppPassword() {
  const password = process.env.APP_PASSWORD?.trim();
  if (!password) {
    throw new Error("APP_PASSWORD environment variable is not configured. Please set it in .env.local");
  }
  return password;
}

export function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) {
    throw new Error("ADMIN_PASSWORD environment variable is not configured. Please set it in .env.local");
  }
  return password;
}

export function getPasswordForRole(role: AuthRole) {
  return role === "admin" ? getAdminPassword() : getAppPassword();
}

export function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  return secret && secret.length > 0 ? secret : getAppPassword();
}

export function buildSessionToken(role: AuthRole, secret = getSessionSecret()) {
  const encodedRole = encodeURIComponent(role);
  const signature = createHmac("sha256", secret).update(encodedRole).digest("base64url");
  return `${encodedRole}.${signature}`;
}

export function verifySessionToken(token: string | undefined, secret = getSessionSecret()) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const [encodedRole, signature] = token.split(".");
  if (!encodedRole || !signature) {
    return null;
  }

  const normalizedRole = decodeURIComponent(encodedRole);
  if (normalizedRole !== "user" && normalizedRole !== "admin") {
    return null;
  }

  const expectedSignature = createHmac("sha256", secret).update(encodedRole).digest("base64url");
  const valueBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  const maxLength = Math.max(valueBuffer.length, expectedBuffer.length, 1);

  const paddedValue = Buffer.alloc(4 + maxLength);
  const paddedExpected = Buffer.alloc(4 + maxLength);
  paddedValue.writeUInt32BE(valueBuffer.length, 0);
  paddedExpected.writeUInt32BE(expectedBuffer.length, 0);
  valueBuffer.copy(paddedValue, 4);
  expectedBuffer.copy(paddedExpected, 4);

  if (!timingSafeEqual(paddedValue, paddedExpected)) {
    return null;
  }

  return normalizedRole as AuthRole;
}
