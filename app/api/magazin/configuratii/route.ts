import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/business-data";
import { bucharestToday } from "@/lib/shop/offers";
import { priceCheckRows } from "@/lib/shop/price-check";
import { getShopCatalog } from "@/lib/shop/server";

export const dynamic = "force-dynamic";

function keyOk(request: Request): boolean {
  const expected = process.env.ATELIER_API_KEY;
  const given = request.headers.get("x-atelier-key");
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * For the CRM („Magazin" page): every shop product × colour × client option as the full configuration
 * the site sends for pricing, with the running offer. Server to server, header x-atelier-key =
 * ATELIER_API_KEY (same key as the CRM's atelier endpoints). No prices here: the CRM computes them.
 */
export async function GET(request: Request) {
  if (!keyOk(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const catalog = await getShopCatalog();
  if (!catalog) return NextResponse.json({ error: "CRM catalog unavailable" }, { status: 503 });
  const today = bucharestToday();
  const rows = priceCheckRows(catalog, today);
  return NextResponse.json(
    { generatedAt: new Date().toISOString(), today, siteUrl: SITE_URL, count: rows.length, rows },
    { headers: { "cache-control": "no-store" } },
  );
}
