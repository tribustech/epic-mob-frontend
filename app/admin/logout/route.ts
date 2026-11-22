import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_UI_COOKIE, adminCookieOptions } from "@/lib/admin/session";

/** „Ieși": forgets the admin cookies on this browser. */
export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL("/admin", request.url), 303);
  res.cookies.set(ADMIN_COOKIE, "", adminCookieOptions(0));
  res.cookies.set(ADMIN_UI_COOKIE, "", adminCookieOptions(0, false));
  return res;
}
