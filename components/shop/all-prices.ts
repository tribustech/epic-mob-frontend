import { resolvePalettes } from "@/lib/atelier/palettes";
import { offerPrice } from "@/lib/shop/offers";
import { productBySlug } from "@/lib/shop/products";
import { getShopCatalog, priceOf, variantConfig, type ShopItem } from "@/lib/shop/server";

/** Set to false to go back to „only the first colour has a price in lists" (fewer CRM price calls). */
const PRICE_EVERY_COLOUR = true;
const AT_ONCE = 6;

/**
 * List pages get only the first colour priced (lib/shop/server.ts). The cards now show other colours too
 * (the colour filter, the colour dots), and a card without a price is a dead end, so the missing prices
 * are filled in here. Server only. Same CRM call and the same 10-minute cache as the product pages, so a
 * colour priced there is not asked for again.
 */
export async function withAllPrices(items: ShopItem[]): Promise<ShopItem[]> {
  if (!PRICE_EVERY_COLOUR) return items;
  const catalog = await getShopCatalog();
  if (!catalog) return items;
  const palettes = resolvePalettes(catalog);

  const jobs = items.flatMap((item, i) => item.variants.map((v, j) => ({ i, j, item, v })).filter(({ v }) => v.price == null));
  const out = items.map((item) => ({ ...item, variants: [...item.variants] }));
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const { i, j, item, v } = jobs[next++];
      const product = productBySlug(item.slug);
      const palette = palettes.find((p) => p.id === v.paletteId);
      if (!product || !palette) continue;
      const { price } = await priceOf(variantConfig(product, palette, catalog));
      if (price != null) out[i].variants[j] = { ...v, price, finalPrice: offerPrice(price, item.offer) };
    }
  };
  await Promise.all(Array.from({ length: Math.min(AT_ONCE, jobs.length) }, worker));
  return hideUnpriced(out);
}

const hasPrice = (item: ShopItem) => item.variants.some((v) => v.finalPrice != null);

/**
 * A model the CRM refuses to price (a missing fitting, a slide too long for its depth) is a dead end in a
 * list: no price, no basket. Drop it, but only while the CRM prices the others, so an outage does not
 * empty the shop (the cards then fall back to „Vezi prețul în Atelierul 3D").
 */
function hideUnpriced(items: ShopItem[]): ShopItem[] {
  if (!items.some(hasPrice)) return items;
  const kept = items.filter(hasPrice);
  if (kept.length < items.length) {
    console.warn("Shop: hidden without a price", items.filter((i) => !hasPrice(i)).map((i) => i.slug).join(", "));
  }
  return kept;
}
