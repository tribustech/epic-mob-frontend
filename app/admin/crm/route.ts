import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin/session";

/**
 * Admin only: opens the configuration on screen in the CRM (Magazin › „Verifică un link", which shows the
 * same breakdown from the same engine). The CRM address stays on the server (CRM_API_URL).
 */
export async function GET(request: Request) {
  const crm = process.env.CRM_API_URL?.replace(/\/+$/, "");
  const code = new URL(request.url).searchParams.get("c") ?? "";
  if (!(await currentAdmin())) return NextResponse.redirect(new URL("/admin", request.url), 303);
  if (!crm || !/^[A-Za-z0-9_-]{1,4000}$/.test(code)) return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 });
  return NextResponse.redirect(`${crm}/magazin?link=${code}`, 303);
}
