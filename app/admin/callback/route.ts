import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_UI_COOKIE, adminCookieOptions } from "@/lib/admin/session";
import { adminSecret, verifyAdminToken } from "@/lib/admin/token";

/**
 * The CRM posts the admin token here (form POST from crm…/atelier/site-login, so the token never sits in
 * a URL). A valid token becomes the httpOnly session cookie until the token expires (12 h).
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const token = form?.get("token");
  const claims = verifyAdminToken(token, adminSecret());
  if (!claims || typeof token !== "string") {
    return NextResponse.redirect(new URL("/admin?eroare=1", request.url), 303);
  }
  const res = NextResponse.redirect(new URL("/admin", request.url), 303);
  const maxAge = claims.exp - Math.floor(Date.now() / 1000);
  res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions(maxAge));
  res.cookies.set(ADMIN_UI_COOKIE, "1", adminCookieOptions(maxAge, false));
  res.headers.set("cache-control", "no-store");
  return res;
}
