export const AUTH_COOKIE_NAME = "sbt_auth";
export const AUTH_COOKIE_VALUE = "authenticated";
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
