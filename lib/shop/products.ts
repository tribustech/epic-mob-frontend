import { CONTENT_LABELS } from "../atelier/categories";
import { hasMirror } from "../atelier/door-types";
import { LAYOUT_PRESETS, type LayoutPreset } from "../atelier/presets";
import type { AtelierCategory } from "../atelier/types.ts";
import RENDERS from "./renders.json";

/**
 * The shop („Magazin"): ready-made pieces built from the configurator's models (lib/atelier/presets.ts)
 * in a few colour combinations each (lib/atelier/palettes.ts). A product is one model; a variant is
 * one colour combination of it. Prices come from the CRM like in the configurator, so a product
 * costs exactly what the same configuration costs there, and „Personalizează" opens it there.
 */

export type ShopRoom = "dormitor" | "living" | "hol" | "copii" | "birou" | "baie";
export type ShopCategory = "dulapuri" | "comode" | "biblioteci" | "suspendate";

export const SHOP_CATEGORIES: { id: ShopCategory; label: string; atelier: AtelierCategory; blurb: string }[] = [
  { id: "dulapuri", label: "Dulapuri și dressinguri", atelier: "DRESSING", blurb: "Cu uși glisante, batante, cu oglindă sau deschise." },
  { id: "comode", label: "Comode și noptiere", atelier: "COMODA", blurb: "Sertare, comode TV, bufete și pantofare." },
  { id: "biblioteci", label: "Biblioteci și separatoare", atelier: "SEPARATOR", blurb: "Rafturi care despart camera fără să ia lumina." },
  { id: "suspendate", label: "Corpuri suspendate", atelier: "SUSPENDAT", blurb: "Comode TV plutitoare, etajere și dulăpioare." },
];

export const ROOM_LABELS: Record<ShopRoom, string> = {
  dormitor: "Dormitor",
  living: "Living",
  hol: "Hol",
  copii: "Camera copilului",
  birou: "Birou",
  baie: "Baie",
};

/** Where each model goes (filters, „Pentru dormitor" on the home page). Unlisted models: by category. */
const ROOMS: Record<string, ShopRoom[]> = {
  "dressing-clasic-240": ["dormitor"],
  "dressing-hol-120": ["hol"],
  "dressing-dormitor-180": ["dormitor"],
  "dressing-oglinda-240": ["dormitor"],
  "dressing-familie-300": ["dormitor"],
  "dressing-mare-360": ["dormitor"],
  "dressing-deschis-280": ["dormitor"],
  "dressing-sertare-200": ["dormitor", "copii"],
  "dressing-copii-150": ["copii"],
  "dressing-tavan-270": ["dormitor", "hol"],
  "dressing-hol-oglinda-160": ["hol"],
  "dressing-oglinda-una-180": ["dormitor", "hol"],
  "dressing-oglinda-mijloc-240": ["dormitor"],
  "dressing-oglinzi-300": ["dormitor"],
  "dressing-sticla-300": ["dormitor"],
  "dressing-ingust-90": ["hol", "copii"],
  "comoda-clasica-160": ["dormitor"],
  "comoda-4-sertare-100": ["dormitor", "copii"],
  "comoda-tv-200": ["living"],
  "comoda-tv-240": ["living"],
  "noptiera-50": ["dormitor"],
  "comoda-hol-120": ["hol"],
  "comoda-mixta-180": ["living"],
  "comoda-inalta-80": ["dormitor", "copii"],
  "comoda-nisa-140": ["living", "copii", "birou"],
  "separator-biblioteca-120": ["living", "birou"],
  "separator-sertare-160": ["living", "birou"],
  "separator-usi-180": ["living"],
  "separator-inalt-240": ["living"],
  "separator-scund-200": ["living"],
  "separator-ingust-90": ["hol", "living"],
  "suspendat-clasic-120": ["hol", "birou"],
  "suspendat-tv-180": ["living", "dormitor"],
  "suspendat-tv-240": ["living"],
  "suspendat-baie-60": ["baie"],
  "suspendat-aventos-180": ["birou", "dormitor"],
  "suspendat-etajera-150": ["living", "birou", "copii"],
  "suspendat-mixt-200": ["living", "hol"],
  "suspendat-hol-90": ["hol", "baie"],
};

/**
 * Colour variants: the model's own palette first, then the shop's usual range. Mirror doors keep a
 * white body (owner rule), so those models only get white-body palettes. A palette the CRM cannot
 * price today (decor missing) is dropped when the page is built.
 */
const USUAL: string[] = ["alb-total", "stejar-natur", "gri-casmir", "alb-stejar-natur", "antracit-stejar", "nuc-crem", "salvie-stejar", "stejar-negru"];
const WHITE_BODY: string[] = ["alb-casmir", "alb-total", "alb-stejar-natur", "alb-antracit", "alb-gri-matase", "alb-stejar-deschis"];
const MAX_VARIANTS = 6;

export interface ShopProduct {
  slug: string;
  preset: LayoutPreset;
  category: ShopCategory;
  rooms: ShopRoom[];
  /** palette ids, the first is the one shown by default */
  paletteIds: string[];
  /** AI photo of the default variant in a room (public/magazin/foto/<slug>.webp), when generated */
  photo?: string;
}

const CATEGORY_OF: Record<AtelierCategory, ShopCategory> = {
  DRESSING: "dulapuri",
  COMODA: "comode",
  SEPARATOR: "biblioteci",
  SUSPENDAT: "suspendate",
};
const DEFAULT_ROOM: Record<AtelierCategory, ShopRoom> = { DRESSING: "dormitor", COMODA: "dormitor", SEPARATOR: "living", SUSPENDAT: "living" };

/** 3D renders of each colour (scripts/render-shop-images.cjs): public/magazin/randari/<slug>/<palette>.webp */
export function renderOf(slug: string, paletteId: string): string | null {
  const list = (RENDERS as Record<string, string[]>)[slug];
  return list?.includes(paletteId) ? `/magazin/randari/${slug}/${paletteId}.webp` : null;
}

/** Photos already generated (public/magazin/foto/<slug>.webp). Kept in code so the build needs no fs. */
export const PHOTOS: ReadonlySet<string> = new Set<string>([
  "comoda-4-sertare-100",
  "comoda-clasica-160",
  "comoda-hol-120",
  "comoda-inalta-80",
  "comoda-mixta-180",
  "comoda-nisa-140",
  "comoda-tv-200",
  "comoda-tv-240",
  "dressing-clasic-240",
  "dressing-copii-150",
  "dressing-deschis-280",
  "dressing-dormitor-180",
  "dressing-familie-300",
  "dressing-hol-120",
  "dressing-hol-oglinda-160",
  "dressing-ingust-90",
  "dressing-mare-360",
  "dressing-oglinda-240",
  "dressing-oglinda-mijloc-240",
  "dressing-oglinda-una-180",
  "dressing-oglinzi-300",
  "dressing-sertare-200",
  "dressing-sticla-300",
  "dressing-tavan-270",
  "noptiera-50",
  "separator-biblioteca-120",
  "separator-inalt-240",
  "separator-ingust-90",
  "separator-scund-200",
  "separator-sertare-160",
  "separator-usi-180",
  "suspendat-aventos-180",
  "suspendat-baie-60",
  "suspendat-clasic-120",
  "suspendat-etajera-150",
  "suspendat-hol-90",
  "suspendat-mixt-200",
  "suspendat-tv-180",
  "suspendat-tv-240",
]);

function variantsOf(preset: LayoutPreset): string[] {
  const own = preset.paletteId ?? "alb-total";
  const pool = hasMirror(preset.shape) ? WHITE_BODY : USUAL;
  return [own, ...pool.filter((id) => id !== own)].slice(0, MAX_VARIANTS);
}

export const SHOP_PRODUCTS: ShopProduct[] = LAYOUT_PRESETS.map((preset) => {
  const slug = preset.id;
  const product: ShopProduct = {
    slug,
    preset,
    category: CATEGORY_OF[preset.category],
    rooms: ROOMS[preset.id] ?? [DEFAULT_ROOM[preset.category]],
    paletteIds: variantsOf(preset),
  };
  if (PHOTOS.has(slug)) product.photo = `/magazin/foto/${slug}.webp`;
  return product;
});

export function productBySlug(slug: string): ShopProduct | undefined {
  return SHOP_PRODUCTS.find((p) => p.slug === slug);
}

/* ── words for the product page ── */

const cmText = (mm: number) => `${Math.round(mm / 10)}`;

/** „240 × 260 × 60 cm" (lățime × înălțime × adâncime) */
export function sizeText(preset: LayoutPreset): string {
  const s = preset.shape;
  return `${cmText(s.widthMm)} × ${cmText(s.heightMm)} × ${cmText(s.depthMm)} cm`;
}

const DOOR_TEXT: Record<string, string> = {
  NONE: "Fără uși",
  GLISANTE: "Uși glisante",
  GLISANTE_OGLINDA: "Uși glisante cu oglindă",
  GLISANTE_STICLA: "Uși glisante din sticlă",
  BATANTE: "Uși batante",
  BATANTE_OGLINDA: "Uși batante cu oglindă",
  BATANTE_STICLA: "Uși batante din sticlă",
};

/** The facts of the model, one line each (product page „Ce include"). */
export function productFacts(preset: LayoutPreset): string[] {
  const s = preset.shape;
  const facts: string[] = [`Dimensiuni: ${sizeText(preset)} (lățime × înălțime × adâncime)`];
  if (s.category === "DRESSING") {
    const fills = s.doors.fills ?? [];
    const mirrors = fills.filter((f) => f === "OGLINDA").length;
    facts.push(mirrors > 0 && !s.doors.type.endsWith("OGLINDA") ? `${DOOR_TEXT[s.doors.type]}, ${mirrors === 1 ? "una cu oglindă" : `${mirrors} cu oglindă`}` : DOOR_TEXT[s.doors.type]);
  }
  const counts = new Map<string, number>();
  let drawers = 0;
  for (const col of s.columns) {
    counts.set(CONTENT_LABELS[col.content], (counts.get(CONTENT_LABELS[col.content]) ?? 0) + 1);
    if (col.content === "SERTARE" || col.content === "BARA_SERTARE") drawers += col.drawers ?? (col.content === "SERTARE" ? 3 : 2);
  }
  if (s.bottom?.type === "SERTARE") drawers += (s.bottom.drawers ?? 2) * s.columns.length;
  facts.push(`${s.columns.length} ${s.columns.length === 1 ? "compartiment" : "compartimente"}: ${[...counts].map(([label, n]) => (n > 1 ? `${n} × ${label.toLowerCase()}` : label.toLowerCase())).join(", ")}`);
  if (drawers > 0) facts.push(`${drawers} ${drawers === 1 ? "sertar" : "sertare"} pe glisiere Blum Tandem cu închidere lină`);
  if (s.bottom?.type === "USI") facts.push("Dulăpioare cu uși la bază");
  if (s.category === "SUSPENDAT") facts.push("Se prinde de perete, fără picioare");
  else facts.push(`Pe picioare de ${s.legsMm / 10} cm`);
  return facts;
}

/** Shop delivery promise. Honest and the same everywhere. */
export const DELIVERY_TEXT = "Livrare și montaj în 4–6 săptămâni";
