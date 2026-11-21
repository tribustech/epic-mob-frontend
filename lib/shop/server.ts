import { unstable_cache } from "next/cache";
import { carcassLook, frontLook, type MaterialLook } from "@/components/atelier/material-look";
import { crmFetch, getAtelierCatalog } from "@/lib/atelier/crm";
import { handleUnavailable, hasHandledFronts } from "@/lib/atelier/handles";
import { followUps } from "@/lib/atelier/house-rules";
import { resolvePalettes, type ResolvedPalette } from "@/lib/atelier/palettes";
import { presetAvailable } from "@/lib/atelier/presets";
import { publicCatalog } from "@/lib/atelier/public-catalog";
import { encodeShare } from "@/lib/atelier/share";
import { atelierReducer } from "@/lib/atelier/state";
import type { AtelierCatalog, AtelierConfig, AtelierPriceResult, AtelierScene } from "@/lib/atelier/types";
import { offerFor, offerPrice, type ShopOffer } from "./offers";
import { SHOP_PRODUCTS, pictureOf, productBySlug, type ShopProduct } from "./products";

/** One colour combination of a product, ready for the page (serializable). */
export interface ShopVariant {
  paletteId: string;
  name: string;
  carcassName: string;
  frontName: string;
  carcass: MaterialLook;
  front: MaterialLook;
  /** usual price (= configurator price); null when the CRM could not price it now */
  price: number | null;
  /** price after the running offer (= price without an offer) */
  finalPrice: number | null;
  /** `/configurator?c=…` code */
  share: string;
}

export interface ShopItem {
  slug: string;
  name: string;
  tagline: string;
  badge: string | null;
  category: ShopProduct["category"];
  rooms: ShopProduct["rooms"];
  /** the best picture of the default colour (room photo, else 3D render) */
  photo: string | null;
  offer: ShopOffer | null;
  variants: ShopVariant[];
}

export const getShopCatalog = async (): Promise<AtelierCatalog | null> => {
  const raw = await getAtelierCatalog();
  return raw ? publicCatalog(raw) : null;
};

/** Preset shape + palette → the configuration the configurator would build (with its house rules). */
export function variantConfig(product: ShopProduct, palette: ResolvedPalette, catalog: AtelierCatalog): AtelierConfig {
  let config: AtelierConfig = {
    carcassMaterialId: palette.carcassMaterialId,
    fronts: { ...palette.fronts },
  } as AtelierConfig;
  config = atelierReducer(config, { type: "applyPreset", shape: product.preset.shape });
  const h = product.handle;
  const offered = !catalog.handles || catalog.handles.types.some((t) => t.type === h?.type);
  if (h && offered && hasHandledFronts(config) && !handleUnavailable(config, h.type)) {
    config = atelierReducer(config, { type: "setHandle", handle: h });
  }
  return followUps(config, config, catalog).actions.reduce(atelierReducer, config);
}

/** CRM price of one configuration, cached 10 minutes (same as the catalog). */
const cachedPrice = unstable_cache(
  async (configJson: string): Promise<{ price: number | null; scene: AtelierScene | null }> => {
    const result = await crmFetch<AtelierPriceResult>("/api/atelier/price", { method: "POST", body: JSON.parse(configJson), timeoutMs: 10_000 });
    return { price: result.errors?.length ? null : result.sellPrice, scene: result.scene ?? null };
  },
  ["shop-price-v1"],
  { revalidate: 600, tags: ["shop-price"] },
);

/** CRM price in whole lei (rounded once, here): every page, the basket and the order use this number. */
export async function priceOf(config: AtelierConfig): Promise<{ price: number | null; scene: AtelierScene | null }> {
  try {
    const { price, scene } = await cachedPrice(JSON.stringify(config));
    return { price: price == null || !Number.isFinite(price) ? null : Math.round(price), scene };
  } catch (error) {
    console.error("Shop price failed", error instanceof Error ? error.message : error);
    return { price: null, scene: null };
  }
}

/** Runs `fn` over the items, at most `limit` at a time (the CRM prices one configuration per call). */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function palettesOf(product: ShopProduct, palettes: ResolvedPalette[]): ResolvedPalette[] {
  return product.paletteIds.map((id) => palettes.find((p) => p.id === id)).filter((p): p is ResolvedPalette => !!p);
}

async function buildItem(
  product: ShopProduct,
  catalog: AtelierCatalog,
  palettes: ResolvedPalette[],
  { allPrices }: { allPrices: boolean },
): Promise<ShopItem | null> {
  if (!presetAvailable(product.preset, catalog)) return null;
  const chosen = palettesOf(product, palettes);
  if (chosen.length === 0) return null;
  const offer = offerFor(product.slug, product.category);
  const variants = await mapLimit(chosen, 4, async (palette, ): Promise<ShopVariant> => {
    const config = variantConfig(product, palette, catalog);
    const looks = { carcass: carcassLook(catalog, config), front: frontLook(catalog, config) };
    const priced = allPrices || palette === chosen[0] ? (await priceOf(config)).price : null;
    return {
      paletteId: palette.id,
      name: palette.name,
      carcassName: palette.carcassName,
      frontName: palette.frontName,
      ...looks,
      price: priced,
      finalPrice: priced == null ? null : offerPrice(priced, offer),
      share: encodeShare(config),
    };
  });
  return {
    slug: product.slug,
    name: product.preset.name,
    tagline: product.preset.tagline,
    badge: product.preset.badge ?? null,
    category: product.category,
    rooms: product.rooms,
    photo: pictureOf(product.slug, chosen[0].id),
    offer,
    variants,
  };
}

/** Every product with its colours; only the default colour is priced (list pages). */
export async function getShopItems(): Promise<{ items: ShopItem[]; catalog: AtelierCatalog | null }> {
  const catalog = await getShopCatalog();
  if (!catalog) return { items: [], catalog: null };
  const palettes = resolvePalettes(catalog);
  const items = await mapLimit(SHOP_PRODUCTS, 6, (p) => buildItem(p, catalog, palettes, { allPrices: false }));
  return { items: items.filter((i): i is ShopItem => !!i), catalog };
}

/** One product with every colour priced, plus the 3D scene of each colour (product page). */
export async function getShopProduct(slug: string): Promise<{ item: ShopItem; scenes: Record<string, AtelierScene | null>; configs: Record<string, AtelierConfig>; catalog: AtelierCatalog } | null> {
  const product = productBySlug(slug);
  const catalog = await getShopCatalog();
  if (!product || !catalog) return null;
  const palettes = resolvePalettes(catalog);
  const item = await buildItem(product, catalog, palettes, { allPrices: true });
  if (!item) return null;
  const scenes: Record<string, AtelierScene | null> = {};
  const configs: Record<string, AtelierConfig> = {};
  for (const palette of palettesOf(product, palettes)) {
    const config = variantConfig(product, palette, catalog);
    configs[palette.id] = config;
    scenes[palette.id] = (await priceOf(config)).scene; // cached by the call in buildItem
  }
  return { item, scenes, configs, catalog };
}

/** One basket line priced now (the basket's refresh and the order route use the same numbers). */
export interface PricedShopLine {
  slug: string;
  paletteId: string;
  name: string;
  colour: string;
  config: AtelierConfig;
  /** usual price, whole lei; null when the CRM could not price it now */
  price: number | null;
  /** after the running offer */
  finalPrice: number | null;
  offerPercent: number;
  offerLabel: string | null;
}

/** null when the product or colour is no longer sold. */
export async function priceShopLine(slug: string, paletteId: string, catalog: AtelierCatalog, palettes: ResolvedPalette[]): Promise<PricedShopLine | null> {
  const product = productBySlug(slug);
  const palette = palettes.find((p) => p.id === paletteId);
  if (!product || !palette || !product.paletteIds.includes(paletteId) || !presetAvailable(product.preset, catalog)) return null;
  const config = variantConfig(product, palette, catalog);
  const { price } = await priceOf(config);
  const offer = offerFor(product.slug, product.category);
  return {
    slug: product.slug,
    paletteId: palette.id,
    name: product.preset.name,
    colour: palette.name,
    config,
    price,
    finalPrice: price == null ? null : offerPrice(price, offer),
    offerPercent: offer?.percent ?? 0,
    offerLabel: offer?.label ?? null,
  };
}
