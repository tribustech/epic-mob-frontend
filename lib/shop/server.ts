import { unstable_cache } from "next/cache";
import { carcassLook, frontLook, type MaterialLook } from "@/components/atelier/material-look";
import { crmFetch, getAtelierCatalog } from "@/lib/atelier/crm";
import { frontOptions, materialOfKind, type FrontMaterial } from "@/lib/atelier/front-materials";
import { handleUnavailable, hasHandledFronts, usesFronts } from "@/lib/atelier/handles";
import { followUps } from "@/lib/atelier/house-rules";
import { resolvePalettes, type ResolvedPalette } from "@/lib/atelier/palettes";
import { presetAvailable } from "@/lib/atelier/presets";
import { publicCatalog } from "@/lib/atelier/public-catalog";
import { encodeShare } from "@/lib/atelier/share";
import { atelierReducer } from "@/lib/atelier/state";
import type { AtelierCatalog, AtelierConfig, AtelierPriceResult, AtelierScene } from "@/lib/atelier/types";
import { offerFor, offerPrice, type ShopOffer } from "./offers";
import { colourWithFronts, frontKey } from "./fronts";
import { resizedConfig, sizeKey, sizedName, sizeOptions, splitSizeKey } from "./sizes";
import { carcassSpec, frontSpec } from "./specs";
import { SHOP_PRODUCTS, pictureOf, productBySlug, type ShopProduct } from "./products";

/** One colour combination of a product, ready for the page (serializable). */
export interface ShopVariant {
  paletteId: string;
  name: string;
  carcassName: string;
  frontName: string;
  /** what the body / the fronts are made of: „PAL melaminat 18 mm, decor Egger W1000 ST9" */
  carcassSpec: string;
  frontSpec: string;
  carcass: MaterialLook;
  front: MaterialLook;
  /** usual price (= configurator price); null when the CRM could not price it now */
  price: number | null;
  /** price after the running offer (= price without an offer) */
  finalPrice: number | null;
  /** `/configurator?c=…` code */
  share: string;
}

/** One board the fronts of a colour can be made of, on the product page (lib/atelier/front-materials.ts). */
export interface ShopFrontOption {
  material: FrontMaterial;
  /** the board the colour is drawn with: its photo and its listed price */
  native: boolean;
  /** the colour id with this board („alb-casmir~vopsit"; the native board: the colour id) */
  key: string;
  /** why it is not offered for this colour („Vopsit doar în culori uni"); null = offered */
  reason: string | null;
  /** the colour on this board: „Soft Touch White · AGT 734" */
  colourName: string | null;
  /** how these fronts are drawn (3D, swatch) */
  look: MaterialLook | null;
  /** „MDF vopsit RAL 9016, mat" */
  spec: string | null;
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

/**
 * The colour on each board of fronts (PAL · AGT · vopsit), with the configuration the shop prices for it.
 * Empty when the piece has no fronts (open shelves: the board changes nothing). The body never changes.
 */
export function frontVariants(
  product: ShopProduct,
  palette: ResolvedPalette,
  catalog: AtelierCatalog,
  base: AtelierConfig = variantConfig(product, palette, catalog),
): { option: ShopFrontOption; config: AtelierConfig | null }[] {
  if (!usesFronts(base)) return [];
  const native = materialOfKind(palette.fronts.kind);
  return frontOptions(catalog, palette.fronts, base.handle?.type ?? null).map((o) => {
    const config = !o.fronts ? null : o.native ? base : variantConfig(product, { ...palette, fronts: o.fronts }, catalog);
    const option: ShopFrontOption = {
      material: o.material,
      native: o.native,
      key: frontKey(palette.id, o.material, native),
      reason: o.reason,
      colourName: o.colourName,
      look: config ? frontLook(catalog, config) : null,
      spec: o.fronts ? frontSpec({ ...palette, fronts: o.fronts }, catalog) : null,
    };
    return { option, config };
  });
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
  if (!productAvailable(product, catalog, palettes)) return null;
  const chosen = palettesOf(product, palettes);
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
      carcassSpec: carcassSpec(palette, catalog),
      frontSpec: frontSpec(palette, catalog),
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

/**
 * Whether a product page can be shown with this catalog: the same check buildItem makes before pricing
 * (the CRM can build the model, and at least one of its colours exists). Used by the sitemap.
 */
export function productAvailable(product: ShopProduct, catalog: AtelierCatalog, palettes: ResolvedPalette[]): boolean {
  return presetAvailable(product.preset, catalog) && palettesOf(product, palettes).length > 0;
}

/** Slugs of the product pages that open now; null when the CRM catalog cannot be read. */
export async function availableProductSlugs(): Promise<string[] | null> {
  const catalog = await getShopCatalog();
  if (!catalog) return null;
  const palettes = resolvePalettes(catalog);
  return SHOP_PRODUCTS.filter((p) => productAvailable(p, catalog, palettes)).map((p) => p.slug);
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
export async function getShopProduct(slug: string): Promise<{
  item: ShopItem;
  scenes: Record<string, AtelierScene | null>;
  /** by colour id, and by colour id with another board of fronts („alb-casmir~vopsit") */
  configs: Record<string, AtelierConfig>;
  /** the boards of fronts each colour comes in (empty: the piece has no fronts) */
  fronts: Record<string, ShopFrontOption[]>;
  catalog: AtelierCatalog;
} | null> {
  const product = productBySlug(slug);
  const catalog = await getShopCatalog();
  if (!product || !catalog) return null;
  const palettes = resolvePalettes(catalog);
  const item = await buildItem(product, catalog, palettes, { allPrices: true });
  if (!item) return null;
  const scenes: Record<string, AtelierScene | null> = {};
  const configs: Record<string, AtelierConfig> = {};
  const fronts: Record<string, ShopFrontOption[]> = {};
  for (const palette of palettesOf(product, palettes)) {
    const config = variantConfig(product, palette, catalog);
    configs[palette.id] = config;
    scenes[palette.id] = (await priceOf(config)).scene; // cached by the call in buildItem
    const options = frontVariants(product, palette, catalog, config);
    fronts[palette.id] = options.map((o) => o.option);
    for (const o of options) if (o.config && !o.option.native) configs[o.option.key] = o.config;
  }
  return { item, scenes, configs, fronts, catalog };
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
  /** the board of the fronts when it is not the colour's own; null = as the colour is shown */
  front: FrontMaterial | null;
  /** for the workshop: „fronturi MDF vopsit RAL 9016, mat" (null = the colour's own fronts) */
  frontNote: string | null;
}

/**
 * null when the product or colour is no longer sold, the width is not one it is sold in, or the colour has
 * no such board of fronts.
 */
export async function priceShopLine(slug: string, key: string, catalog: AtelierCatalog, palettes: ResolvedPalette[]): Promise<PricedShopLine | null> {
  const product = productBySlug(slug);
  const { paletteId, widthMm, front: asked } = splitSizeKey(key);
  const palette = palettes.find((p) => p.id === paletteId);
  if (!product || !palette || !product.paletteIds.includes(paletteId) || !presetAvailable(product.preset, catalog)) return null;
  let base = variantConfig(product, palette, catalog);
  const native = materialOfKind(palette.fronts.kind);
  const front = asked && asked !== native ? asked : null;
  if (front) {
    const other = frontVariants(product, palette, catalog, base).find((v) => v.option.material === front);
    if (!other?.config) return null;
    base = other.config;
  }
  if (widthMm != null && !sizeOptions(product.preset).includes(widthMm)) return null;
  const config = widthMm == null ? base : resizedConfig(base, widthMm);
  if (!config) return null;
  const { price } = await priceOf(config);
  const offer = offerFor(product.slug, product.category);
  const sized = widthMm != null && widthMm !== product.preset.shape.widthMm;
  return {
    slug: product.slug,
    paletteId: sizeKey(frontKey(palette.id, front, native), widthMm, product.preset.shape.widthMm),
    name: sized ? sizedName(product.preset.name, product.preset.shape.widthMm, widthMm) : product.preset.name,
    colour: colourWithFronts(palette.name, front),
    config,
    price,
    finalPrice: price == null ? null : offerPrice(price, offer),
    offerPercent: offer?.percent ?? 0,
    offerLabel: offer?.label ?? null,
    front,
    frontNote: front ? `fronturi ${frontSpec({ ...palette, fronts: config.fronts }, catalog)}` : null,
  };
}
