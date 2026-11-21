import { cookies } from "next/headers";
import { adminSecret, verifyAdminToken, type AdminClaims } from "./token";

/** httpOnly: the CRM token itself. */
export const ADMIN_COOKIE = "epicmob_admin";
/** Readable by the page, holds no secret: only tells the client code to load the admin panels at all. */
export const ADMIN_UI_COOKIE = "epicmob_admin_ui";

export function adminCookieOptions(maxAgeSec: number, httpOnly = true) {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.max(0, Math.floor(maxAgeSec)),
  };
}

/** The logged-in admin (valid CRM token in the cookie), or null. */
export async function currentAdmin(): Promise<(AdminClaims & { token: string }) | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const claims = verifyAdminToken(token, adminSecret());
  return claims && token ? { ...claims, token } : null;
}

export async function isAdmin(): Promise<boolean> {
  return (await currentAdmin()) !== null;
}
