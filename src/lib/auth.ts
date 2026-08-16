export const AUTH_COOKIE_NAME = "sbt_auth";
export type AuthRole = "user" | "admin";
const AUTH_ENABLED = process.env.DISABLE_AUTH !== "true";
const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64url");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64url"));
  }

  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function signValue(value: string, secret: string) {
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const digest = await globalThis.crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

async function verifySignature(value: string, signature: string, secret: string) {
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  return globalThis.crypto.subtle.verify(
    "HMAC",
    cryptoKey,
    base64UrlToBytes(signature),
    encoder.encode(value)
  );
}

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

export async function buildSessionToken(role: AuthRole, secret = getSessionSecret()) {
  const encodedRole = encodeURIComponent(role);
  const signature = await signValue(encodedRole, secret);
  return `${encodedRole}.${signature}`;
}

export async function verifySessionToken(token: string | undefined, secret = getSessionSecret()) {
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

  const isValidSignature = await verifySignature(encodedRole, signature, secret);
  if (!isValidSignature) {
    return null;
  }

  return normalizedRole as AuthRole;
}

export async function getRequestRole(request: Request) {
  if (!isAuthEnabled()) {
    return "admin" as const;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const authCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`));
  const token = authCookie?.slice(AUTH_COOKIE_NAME.length + 1);

  return verifySessionToken(token, getSessionSecret());
}

export async function isAdminRequest(request: Request) {
  return (await getRequestRole(request)) === "admin";
}
