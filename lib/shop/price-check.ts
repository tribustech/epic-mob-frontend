import { doorOpening, doorType, type DoorOpening } from "../atelier/door-types";
import { HANDLE_INFO, currentHandle, handleUnavailable, hasHandledFronts } from "../atelier/handles";
import { followUps } from "../atelier/house-rules";
import { resolvePalettes } from "../atelier/palettes";
import { presetAvailable } from "../atelier/presets";
import { encodeShare } from "../atelier/share";
import { atelierReducer, type AtelierAction } from "../atelier/state";
import type { AtelierCatalog, AtelierConfig, DoorFill, DoorType, HandleKind } from "../atelier/types.ts";
import { offerFor, type ShopOffer } from "./offers";
import { SHOP_CATEGORIES, SHOP_PRODUCTS, type ShopProduct } from "./products";
import { variantConfig } from "./server";

/**
 * Every combination the shop sells, for the admin price check (site /admin/preturi, CRM „Magazin"):
 *  - every product × every colour it is sold in, exactly as the shop builds it (variantConfig);
 *  - on the product's default colour, the options a client can switch to in the configurator, one at a
 *    time from the default: every other handle type the catalog offers and the fronts can take, and for
 *    wardrobes every other door type (none / sliding / hinged × panel / mirror / glass). Mirror versus no
 *    mirror is one of those door types.
 * Not a full cartesian product (it would be tens of thousands of rows): the options change the price the
 * same way in every colour, so one colour shows their effect. About 50 products × ~5 colours + ~6 options
 * per product ≈ 500–700 rows.
 * Drawer runners are not an option: the configurator always builds Tandembox drawers (the CRM picks the
 * set from the front height), so there is no runner variant to list.
 */

export interface PriceCheckRow {
  /** unique: slug|palette|variant */
  key: string;
  slug: string;
  name: string;
  category: ShopProduct["category"];
  categoryLabel: string;
  paletteId: string;
  paletteName: string;
  /** "" = as sold in the shop */
  variant: string;
  variantLabel: string;
  handle: HandleKind | null;
  doors: DoorType;
  config: AtelierConfig;
  /** `/configurator?c=` code */
  share: string;
  offer: Pick<ShopOffer, "percent" | "label" | "until"> | null;
  /** /magazin/<slug>?culoare=<palette> */
  path: string;
}

const DOOR_LABEL: Record<DoorType, string> = {
  NONE: "fără uși",
  GLISANTE: "glisante",
  GLISANTE_OGLINDA: "glisante cu oglindă",
  GLISANTE_STICLA: "glisante cu sticlă",
  BATANTE: "batante",
  BATANTE_OGLINDA: "batante cu oglindă",
  BATANTE_STICLA: "batante cu sticlă",
};

const apply = (catalog: AtelierCatalog, base: AtelierConfig, action: AtelierAction): AtelierConfig => {
  const next = atelierReducer(base, action);
  return followUps(base, next, catalog).actions.reduce(atelierReducer, next);
};

/** The options a client can switch to from this configuration, one at a time. */
export function optionVariants(config: AtelierConfig, catalog: AtelierCatalog): { variant: string; label: string; config: AtelierConfig }[] {
  const out: { variant: string; label: string; config: AtelierConfig }[] = [];
  const seen = new Set([JSON.stringify(config)]);
  const push = (variant: string, label: string, next: AtelierConfig) => {
    const id = JSON.stringify(next);
    if (seen.has(id)) return;
    seen.add(id);
    out.push({ variant, label, config: next });
  };
  if (config.category === "DRESSING") {
    const openings: DoorOpening[] = ["NONE", "GLISANTE", "BATANTE"];
    const faces: DoorFill[] = ["PANOU", "OGLINDA", "STICLA"];
    for (const o of openings) {
      for (const f of o === "NONE" ? (["PANOU"] as DoorFill[]) : faces) {
        const type = doorType(o, f);
        if (type === config.doors.type && !config.doors.fills) continue;
        const doors = o === "GLISANTE" && doorOpening(config.doors.type) === "GLISANTE" && config.doors.count ? { type, count: config.doors.count } : { type };
        push(`usi:${type}`, `Uși ${DOOR_LABEL[type]}`, apply(catalog, config, { type: "setDoors", doors }));
      }
    }
  }
  if (hasHandledFronts(config)) {
    const now = currentHandle(config);
    for (const { type } of catalog.handles?.types ?? []) {
      if (type === now || handleUnavailable(config, type)) continue;
      push(`maner:${type}`, `Mâner: ${HANDLE_INFO[type].name.toLowerCase()}`, apply(catalog, config, { type: "setHandle", handle: { type } }));
    }
  }
  return out;
}

export function priceCheckRows(catalog: AtelierCatalog, today?: string): PriceCheckRow[] {
  const palettes = resolvePalettes(catalog);
  const rows: PriceCheckRow[] = [];
  for (const product of SHOP_PRODUCTS) {
    if (!presetAvailable(product.preset, catalog)) continue;
    const offer = offerFor(product.slug, product.category, today);
    const categoryLabel = SHOP_CATEGORIES.find((c) => c.id === product.category)?.label ?? product.category;
    const chosen = product.paletteIds.map((id) => palettes.find((p) => p.id === id)).filter((p) => !!p);
    chosen.forEach((palette, i) => {
      const base = variantConfig(product, palette, catalog);
      const row = (variant: string, variantLabel: string, config: AtelierConfig): PriceCheckRow => ({
        key: `${product.slug}|${palette.id}|${variant}`,
        slug: product.slug,
        name: product.preset.name,
        category: product.category,
        categoryLabel,
        paletteId: palette.id,
        paletteName: palette.name,
        variant,
        variantLabel,
        handle: hasHandledFronts(config) ? currentHandle(config) : null,
        doors: config.doors.type,
        config,
        share: encodeShare(config),
        offer: offer ? { percent: offer.percent, label: offer.label, until: offer.until } : null,
        path: i === 0 ? `/magazin/${product.slug}` : `/magazin/${product.slug}?culoare=${palette.id}`,
      });
      rows.push(row("", "Ca în magazin", base));
      if (i === 0) for (const v of optionVariants(base, catalog)) rows.push(row(v.variant, v.label, v.config));
    });
  }
  return rows;
}
