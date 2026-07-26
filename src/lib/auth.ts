export const AUTH_COOKIE_NAME = "sbt_auth";
export const AUTH_COOKIE_VALUE = "authenticated";

export function getAppPassword() {
  return process.env.APP_PASSWORD ?? "changeme";
}
