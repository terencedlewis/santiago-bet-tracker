export type AuthRole = "user" | "admin";

export function getSessionRoleFromCookie(cookieName = "sbt_auth"): AuthRole | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${cookieName}=`));

  if (!cookie) {
    return null;
  }

  const value = decodeURIComponent(cookie.slice(cookieName.length + 1));
  const [rawRole] = value.split(".");

  if (rawRole === "user" || rawRole === "admin") {
    return rawRole;
  }

  return null;
}
