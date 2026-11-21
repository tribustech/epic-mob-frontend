import { NextResponse } from "next/server";
import { resolvePalettes } from "@/lib/atelier/palettes";
import { MAX_LINES } from "@/lib/shop/cart-limits";
import { getShopCatalog, priceShopLine } from "@/lib/shop/server";

export const dynamic = "force-dynamic";

const text = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 100) : "");

/**
 * Today's prices for the basket's lines (the basket keeps what the client saw when adding a product, and
 * refreshes it here when it opens). Body: { lines: [{ slug, paletteId }] }. Same numbers as the product
 * pages and the order route: usual price, price after the offer, the offer. Public prices only.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { lines?: unknown } | null;
  const raw = Array.isArray(body?.lines) ? body.lines.slice(0, MAX_LINES) : null;
  if (!raw || raw.length === 0) return NextResponse.json({ error: "Cerere invalidă" }, { status: 400 });

  const catalog = await getShopCatalog();
  if (!catalog) return NextResponse.json({ unavailable: true }, { status: 503 });
  const palettes = resolvePalettes(catalog);

  const lines = await Promise.all(
    (raw as Record<string, unknown>[]).map(async (l) => {
      const slug = text(l?.slug);
      const paletteId = text(l?.paletteId);
      const priced = await priceShopLine(slug, paletteId, catalog, palettes);
      if (!priced) return { slug, paletteId, available: false, price: null, finalPrice: null, offerPercent: 0, offerLabel: null };
      const { name, colour, price, finalPrice, offerPercent, offerLabel } = priced;
      // echo the slug the basket sent (a renamed product keeps its old slug in older baskets)
      return { slug, paletteId, available: true, name, colour, price, finalPrice, offerPercent, offerLabel };
    }),
  );
  return NextResponse.json({ lines }, { headers: { "cache-control": "no-store" } });
}
