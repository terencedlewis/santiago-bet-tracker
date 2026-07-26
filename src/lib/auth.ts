export const AUTH_COOKIE_NAME = "sbt_auth";
export const AUTH_COOKIE_VALUE = "authenticated";

export function isAuthEnabled() {
  return process.env.DISABLE_AUTH !== "true";
}

export function getAppPassword() {
  const password = process.env.APP_PASSWORD?.trim();
  if (!password) {
    throw new Error("APP_PASSWORD environment variable is not configured. Please set it in .env.local");
  }
  return password;
}
