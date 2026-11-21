import { MODULE_LABELS, moduleLabel, upperOf } from "../atelier/kitchen";
import { CONTENT_LABELS } from "../atelier/categories";
import { hasMirror } from "../atelier/door-types";
import { hasHandledFronts } from "../atelier/handles";
import { NO_DARK_CATEGORIES, isDarkPalette } from "../atelier/house-rules";
import { PALETTES } from "../atelier/palettes";
import { LAYOUT_PRESETS, type LayoutPreset } from "../atelier/presets";
import type { AtelierCategory, AtelierHandle } from "../atelier/types.ts";
import PHOTOS from "./photos.json";
import RENDERS from "./renders.json";

/**
 * The shop („Magazin"): ready-made pieces built from the configurator's models (lib/atelier/presets.ts)
 * in a few colour combinations each (lib/atelier/palettes.ts). A product is one model; a variant is
 * one colour combination of it. Prices come from the CRM like in the configurator, so a product
 * costs exactly what the same configuration costs there, and „Personalizează" opens it there.
 */

export type ShopRoom = "dormitor" | "living" | "hol" | "bucatarie" | "baie" | "copii" | "birou";
export type ShopCategory = "dulapuri" | "bucatarii" | "comode" | "biblioteci" | "suspendate" | "baie";

export const SHOP_CATEGORIES: { id: ShopCategory; label: string; atelier: AtelierCategory; blurb: string }[] = [
  { id: "dulapuri", label: "Dulapuri și dressinguri", atelier: "DRESSING", blurb: "Cu uși glisante, batante, cu oglindă sau deschise." },
  { id: "comode", label: "Comode și noptiere", atelier: "COMODA", blurb: "Sertare, comode TV, bufete și pantofare." },
  { id: "biblioteci", label: "Biblioteci și separatoare", atelier: "SEPARATOR", blurb: "Rafturi care despart camera fără să ia lumina." },
  { id: "suspendate", label: "Corpuri suspendate", atelier: "SUSPENDAT", blurb: "Comode TV plutitoare, etajere și dulăpioare." },
  { id: "bucatarii", label: "Bucătării", atelier: "BUCATARIE", blurb: "Pe un perete sau în L, cu blat, chiuvetă și loc pentru electrocasnice." },
  { id: "baie", label: "Mobilier baie", atelier: "BAIE", blurb: "Lavoar cu sertare, dulap cu oglindă, coloană și nișă pentru mașina de spălat." },
];

export const ROOM_LABELS: Record<ShopRoom, string> = {
  dormitor: "Dormitor",
  living: "Living",
  hol: "Hol",
  bucatarie: "Bucătărie",
  baie: "Baie",
  copii: "Camera copilului",
  birou: "Birou",
};

/**
 * Where each model goes (filters, „Potrivit pentru" on the product page). Unlisted models: by category.
 * A room is listed only where the piece really works there: wall units always hang above something
 * (desk, worktop, washing machine, sofa), so they are not tagged for a bare hall wall. The kitchen has
 * no fitted kitchen (the configurator builds no worktop or appliance units): only the pieces that stand
 * beside one (pantry, service cupboard, coffee sideboard, wall cabinet, open shelf).
 */
const ROOMS: Record<string, ShopRoom[]> = {
  "dressing-clasic-240": ["dormitor"],
  "dressing-hol-120": ["hol"],
  "dressing-dormitor-180": ["dormitor"],
  "dressing-oglinda-240": ["dormitor"],
  "dressing-familie-300": ["dormitor"],
  "dressing-mare-360": ["dormitor"],
  "dressing-deschis-280": ["dormitor"],
  "dressing-sertare-200": ["dormitor"],
  "dressing-copii-150": ["copii"],
  "dressing-tavan-270": ["dormitor", "hol"],
  "dressing-hol-oglinda-160": ["hol"],
  "dressing-oglinda-una-180": ["dormitor", "hol"],
  "dressing-oglinda-mijloc-240": ["dormitor"],
  "dressing-oglinzi-300": ["dormitor"],
  "dressing-sticla-300": ["dormitor"],
  "dressing-ingust-90": ["hol", "copii", "dormitor"],
  "dressing-3-usi-150": ["dormitor", "copii"],
  "dressing-camara-90": ["bucatarie"],
  "dressing-serviciu-80": ["hol", "bucatarie"],
  "dressing-baie-60": ["baie"],
  "dressing-birou-100": ["birou"],
  "dressing-oglinda-glisanta-200": ["dormitor"],
  "dressing-3-usi-oglinda-150": ["dormitor", "copii"],
  "dressing-cuier-100": ["hol"],
  "comoda-clasica-160": ["dormitor"],
  "comoda-4-sertare-100": ["dormitor", "copii"],
  "comoda-tv-200": ["living"],
  "comoda-tv-240": ["living"],
  "noptiera-50": ["dormitor", "copii"],
  "comoda-hol-120": ["hol"],
  "comoda-mixta-180": ["living", "bucatarie"],
  "comoda-inalta-80": ["dormitor", "copii"],
  "comoda-nisa-140": ["living", "copii", "birou"],
  "comoda-pantofar-80": ["hol"],
  "comoda-cafea-120": ["bucatarie", "living"],
  "comoda-baie-80": ["baie"],
  "comoda-birou-90": ["birou"],
  "comoda-tv-160": ["living", "dormitor"],
  "noptiera-deschisa-45": ["dormitor", "copii"],
  "separator-biblioteca-120": ["living", "birou"],
  "separator-sertare-160": ["living", "birou", "copii"],
  "separator-usi-180": ["living", "birou"],
  "separator-inalt-240": ["living"],
  "separator-scund-200": ["living"],
  "separator-ingust-90": ["hol", "living"],
  "separator-cuburi-150": ["living", "copii", "birou"],
  "separator-copii-120": ["copii"],
  "suspendat-clasic-120": ["birou", "baie", "bucatarie"],
  "suspendat-tv-180": ["living", "dormitor"],
  "suspendat-tv-240": ["living"],
  "suspendat-baie-60": ["baie"],
  "suspendat-aventos-180": ["birou", "dormitor"],
  "suspendat-etajera-150": ["living", "birou", "copii", "bucatarie"],
  "suspendat-mixt-200": ["living", "hol"],
  "suspendat-hol-90": ["hol", "baie"],
  "suspendat-bucatarie-180": ["bucatarie"],
  "suspendat-baie-nisa-90": ["baie"],
  "suspendat-pat-240": ["dormitor"],
};

/**
 * Colour variants: the model's own palette first, then the shop's usual range. Mirror doors keep a
 * white body (owner rule), so those models only get white-body palettes. A palette the CRM cannot
 * price today (decor missing) is dropped when the page is built.
 */
const USUAL: string[] = ["alb-total", "stejar-natur", "gri-casmir", "alb-stejar-natur", "antracit-stejar", "nuc-crem", "salvie-stejar", "stejar-negru"];
const WHITE_BODY: string[] = ["alb-casmir", "alb-total", "alb-stejar-natur", "alb-antracit", "alb-gri-matase", "alb-stejar-deschis"];
const MAX_VARIANTS = 6;

/**
 * Models added after the first range sell a short, hand-picked list of colours instead of the usual
 * six (owner, 2026-11-21: more products, fewer colour combinations). The first is the default. The same
 * owner rules hold and are tested: no dark comode or wall units, white body behind a mirror.
 */
const COLOURS: Record<string, string[]> = {
  "dressing-3-usi-150": ["alb-total", "alb-stejar-natur", "gri-casmir", "stejar-natur"],
  "dressing-camara-90": ["alb-total", "alb-stejar-natur", "gri-casmir", "salvie-stejar"],
  "dressing-serviciu-80": ["alb-total", "gri-casmir", "alb-stejar-natur", "alb-gri-matase"],
  "dressing-baie-60": ["alb-total", "alb-stejar-natur", "alb-casmir", "gri-casmir"],
  "dressing-birou-100": ["alb-stejar-natur", "alb-total", "stejar-natur", "gri-casmir"],
  // kids' room: the soft colours children's rooms are bought in, white last
  "dressing-copii-150": ["denim-alb", "roz-pudra-alb", "eucalipt-alb", "alb-total"],
  // mirror doors: white bodies only
  "dressing-oglinda-glisanta-200": ["alb-casmir", "alb-total", "alb-stejar-natur", "alb-gri-matase"],
  "dressing-3-usi-oglinda-150": ["alb-casmir", "alb-total", "alb-stejar-natur", "alb-stejar-deschis"],
  // open, no fronts: four different bodies
  "dressing-cuier-100": ["stejar-natur", "alb-total", "gri-casmir", "salvie-stejar"],
  "comoda-pantofar-80": ["alb-total", "alb-stejar-natur", "gri-casmir", "casmir-alb"],
  "comoda-cafea-120": ["alb-stejar-natur", "alb-total", "salvie-stejar", "nuc-crem"],
  "comoda-baie-80": ["alb-casmir", "alb-total", "gri-casmir", "alb-stejar-natur"],
  "comoda-birou-90": ["alb-stejar-natur", "alb-total", "gri-casmir", "stejar-casmir"],
  "comoda-tv-160": ["alb-stejar-natur", "alb-total", "stejar-alb", "gri-casmir"],
  "noptiera-deschisa-45": ["stejar-natur", "alb-total", "gri-casmir", "salvie-stejar"],
  // open on both faces: only the body colour shows, so four different bodies
  "separator-cuburi-150": ["alb-total", "stejar-natur", "gri-casmir", "antracit-stejar"],
  "separator-copii-120": ["alb-total", "stejar-alb", "roz-pudra-alb", "eucalipt-alb", "denim-alb"],
  "suspendat-bucatarie-180": ["alb-total", "alb-stejar-natur", "gri-casmir", "salvie-stejar"],
  "suspendat-baie-nisa-90": ["alb-total", "stejar-alb", "alb-casmir", "gri-casmir"],
  "suspendat-pat-240": ["alb-total", "alb-stejar-natur", "stejar-alb", "gri-casmir"],
  // kitchens: what Romanian kitchens are bought in (white, white with oak, cashmere, sage), the model's own first
  "bucatarie-240": ["alb-stejar-natur", "alb-total", "gri-casmir", "salvie-stejar"],
  "bucatarie-compacta-180": ["alb-total", "alb-stejar-natur", "gri-casmir", "stejar-alb"],
  "bucatarie-260": ["alb-casmir", "alb-total", "alb-stejar-natur", "gri-casmir"],
  "bucatarie-frigider-300": ["gri-casmir", "alb-total", "alb-stejar-natur", "stejar-casmir"],
  "bucatarie-coloane-380": ["stejar-alb", "alb-total", "gri-casmir", "antracit-stejar"],
  "bucatarie-l-270": ["alb-casmir", "alb-total", "alb-stejar-natur", "salvie-stejar"],
  "bucatarie-l-frigider-300": ["bardolino-gri", "alb-total", "gri-casmir", "stejar-alb"],
  "bucatarie-rafturi-240": ["salvie-stejar", "alb-total", "stejar-alb", "alb-stejar-natur"],
  "bucatarie-ridicabile-300": ["grafit-total", "alb-total", "gri-casmir", "antracit-stejar"],
  // bathroom furniture: a mirror cabinet over the basin, so white bodies only
  "baie-lavoar-coloana-120": ["alb-stejar-natur", "alb-total", "alb-casmir", "alb-stejar-deschis"],
  "baie-lavoar-60": ["alb-total", "alb-stejar-natur", "alb-casmir", "alb-gri-matase"],
  "baie-lavoar-50": ["alb-stejar-natur", "alb-total", "alb-casmir", "alb-stejar-deschis"],
  "baie-lavoar-80": ["alb-casmir", "alb-total", "alb-stejar-natur", "alb-antracit"],
  "baie-dubla-140": ["alb-stejar-deschis", "alb-total", "alb-casmir", "alb-stejar-natur"],
  "baie-masina-140": ["alb-antracit", "alb-total", "alb-stejar-natur", "alb-casmir"],
  "baie-picioare-100": ["alb-gri-matase", "alb-total", "alb-stejar-natur", "alb-casmir"],
};

export interface ShopProduct {
  slug: string;
  preset: LayoutPreset;
  category: ShopCategory;
  rooms: ShopRoom[];
  /** palette ids, the first is the one shown by default */
  paletteIds: string[];
  /** the shop's own handle for this model (variety across the shop); dropped where the fronts or the catalog cannot take it */
  handle?: AtelierHandle;
}

const CATEGORY_OF: Record<AtelierCategory, ShopCategory> = {
  DRESSING: "dulapuri",
  COMODA: "comode",
  SEPARATOR: "biblioteci",
  SUSPENDAT: "suspendate",
  BUCATARIE: "bucatarii",
  BAIE: "baie",
};
const DEFAULT_ROOM: Record<AtelierCategory, ShopRoom> = { DRESSING: "dormitor", COMODA: "dormitor", SEPARATOR: "living", SUSPENDAT: "living", BUCATARIE: "bucatarie", BAIE: "baie" };

/** 3D renders of each colour (scripts/render-shop-images.cjs): public/magazin/randari/<slug>/<palette>.webp */
export function renderOf(slug: string, paletteId: string): string | null {
  const list = (RENDERS as Record<string, string[]>)[slug];
  return list?.includes(paletteId) ? `/magazin/randari/${slug}/${paletteId}.webp` : null;
}

/**
 * Room photo of one colour (public/magazin/foto/<slug>/<palette>.webp), listed in photos.json by
 * `node scripts/shop-photos-manifest.cjs` once the photo has been checked against the render and the brief.
 * Only the model's photo colours (PHOTO_COLOURS) show a photo: older photos of the other colours were never
 * checked against the photo rules, so those colours show their 3D render.
 */
export function photoOf(slug: string, paletteId: string): string | null {
  const list = (PHOTOS as Record<string, string[]>)[slug];
  return list?.includes(paletteId) && PHOTO_COLOURS[slug]?.includes(paletteId) ? `/magazin/foto/${slug}/${paletteId}.webp` : null;
}

/** The best picture of one colour: its room photo, else its 3D render. */
export function pictureOf(slug: string, paletteId: string): string | null {
  return photoOf(slug, paletteId) ?? renderOf(slug, paletteId);
}

/**
 * Handles per model, so the shop does not show the same bar handle everywhere. Applied only where the model
 * has handled fronts, the CRM catalog offers the type and the fronts can take it (lib/shop/server.ts).
 */
export const HANDLES: Record<string, AtelierHandle> = {
  "comoda-clasica-160": { type: "BUTON", finish: "NEGRU" },
  "comoda-tv-240": { type: "PUSH" },
  "separator-sertare-160": { type: "APLICAT", finish: "NEGRU" },
  "suspendat-tv-180": { type: "PUSH" },
  "dressing-hol-120": { type: "APLICAT", finish: "INOX" },
  "dressing-sertare-200": { type: "APLICAT", finish: "NEGRU" },
  "dressing-copii-150": { type: "BUTON", finish: "INOX" },
  "dressing-tavan-270": { type: "PUSH" },
  "dressing-hol-oglinda-160": { type: "APLICAT", finish: "NEGRU" },
  "dressing-oglinda-mijloc-240": { type: "APLICAT", finish: "AURIU" },
  "dressing-ingust-90": { type: "BUTON", finish: "NEGRU" },
  "comoda-4-sertare-100": { type: "GOLA", finish: "INOX" },
  "comoda-tv-200": { type: "GOLA", finish: "NEGRU" },
  "noptiera-50": { type: "BUTON", finish: "AURIU" },
  "comoda-hol-120": { type: "APLICAT", finish: "NEGRU" },
  "comoda-mixta-180": { type: "APLICAT", finish: "AURIU" },
  "comoda-inalta-80": { type: "APLICAT", finish: "INOX" },
  "comoda-nisa-140": { type: "APLICAT", finish: "NEGRU" },
  "separator-usi-180": { type: "PUSH" },
  "separator-ingust-90": { type: "BUTON", finish: "AURIU" },
  "suspendat-clasic-120": { type: "APLICAT", finish: "INOX" },
  "suspendat-tv-240": { type: "GOLA", finish: "NEGRU" },
  "suspendat-baie-60": { type: "BUTON", finish: "INOX" },
  "suspendat-aventos-180": { type: "PUSH" },
  "suspendat-mixt-200": { type: "GOLA", finish: "INOX" },
  "suspendat-hol-90": { type: "BUTON", finish: "AURIU" },
  "dressing-3-usi-150": { type: "APLICAT", finish: "INOX" },
  "comoda-pantofar-80": { type: "PUSH" },
  "dressing-camara-90": { type: "APLICAT", finish: "NEGRU" },
  "dressing-serviciu-80": { type: "PUSH" },
  "dressing-baie-60": { type: "APLICAT", finish: "INOX" },
  "dressing-birou-100": { type: "BUTON", finish: "INOX" },
  "comoda-cafea-120": { type: "BUTON", finish: "NEGRU" },
  "comoda-baie-80": { type: "GOLA", finish: "INOX" },
  "comoda-birou-90": { type: "GOLA", finish: "NEGRU" },
  "separator-copii-120": { type: "BUTON", finish: "AURIU" },
  "suspendat-bucatarie-180": { type: "GOLA", finish: "INOX" },
  "suspendat-baie-nisa-90": { type: "BUTON", finish: "NEGRU" },
  "bucatarie-240": { type: "APLICAT", finish: "NEGRU" },
  "bucatarie-compacta-180": { type: "APLICAT", finish: "INOX" },
  "bucatarie-frigider-300": { type: "APLICAT", finish: "INOX" },
  "bucatarie-coloane-380": { type: "APLICAT", finish: "NEGRU" },
  "bucatarie-l-270": { type: "APLICAT", finish: "AURIU" },
  "bucatarie-l-frigider-300": { type: "APLICAT", finish: "NEGRU" },
  "bucatarie-rafturi-240": { type: "BUTON", finish: "AURIU" },
  "baie-lavoar-coloana-120": { type: "APLICAT", finish: "NEGRU" },
  "baie-lavoar-80": { type: "APLICAT", finish: "AURIU" },
  "baie-dubla-140": { type: "APLICAT", finish: "INOX" },
  "dressing-3-usi-oglinda-150": { type: "APLICAT", finish: "NEGRU" },
  "comoda-tv-160": { type: "GOLA", finish: "INOX" },
  "suspendat-pat-240": { type: "PUSH" },
  "bucatarie-260": { type: "APLICAT", finish: "INOX" },
};


/** Extra body colours for open models, after USUAL (their fronts do not show, so only the body counts). */
const OPEN_EXTRA: string[] = ["sonoma-alb", "tabac-negru", "beton-grafit"];

/** A model with no fronts at all (open shelves): two palettes with the same body look identical. */
function isOpen(shape: LayoutPreset["shape"]): boolean {
  if (shape.category === "DRESSING") return shape.doors.type === "NONE" && !shape.columns.some((c) => c.content === "SERTARE" || c.content === "BARA_SERTARE");
  return !hasHandledFronts(shape);
}

const bodyOf = (id: string) => PALETTES.find((p) => p.id === id)?.carcassCodes[0] ?? id;

/** No black or dark chests of drawers and wall units (owner rule, lib/atelier/house-rules.ts). */
const NO_DARK = NO_DARK_CATEGORIES;
const LIGHT_EXTRA: string[] = ["stejar-alb", "alb-casmir", "nuc-alb", "alb-stejar-deschis"];
const isDark = isDarkPalette;

function variantsOf(preset: LayoutPreset): string[] {
  if (COLOURS[preset.id]) return COLOURS[preset.id];
  if (NO_DARK.has(preset.category)) {
    const own = preset.paletteId && !isDark(preset.paletteId) ? preset.paletteId : "alb-total";
    const pool = [own, ...USUAL, ...LIGHT_EXTRA, ...OPEN_EXTRA].filter((id) => !isDark(id));
    const out: string[] = [];
    for (const id of pool) {
      if (out.includes(id) || (isOpen(preset.shape) && out.some((o) => bodyOf(o) === bodyOf(id)))) continue;
      out.push(id);
    }
    return out.slice(0, MAX_VARIANTS);
  }
  const own = preset.paletteId ?? "alb-total";
  // hinged doors that are all mirror and no drawers: only the white body shows, so one colour only
  const sh = preset.shape;
  if (sh.category === "DRESSING" && sh.doors.type === "BATANTE_OGLINDA" && !sh.columns.some((c) => c.content === "SERTARE" || c.content === "BARA_SERTARE")) return [own];
  if (isOpen(preset.shape)) {
    const out: string[] = [];
    for (const id of [own, ...USUAL, ...OPEN_EXTRA]) {
      if (!out.some((o) => bodyOf(o) === bodyOf(id))) out.push(id);
    }
    return out.slice(0, MAX_VARIANTS);
  }
  const pool = hasMirror(preset.shape) ? WHITE_BODY : USUAL;
  return [own, ...pool.filter((id) => id !== own)].slice(0, MAX_VARIANTS);
}

/**
 * The one or two colours of each model that get a room photo (owner, 2026-11-21: a photo for 1–2 colours,
 * not for every combination). The default colour comes first. The other colours show their 3D render.
 * New models are photographed in what sells: white, white with natural oak, cashmere where it fits.
 * Niche models that few people search for (tall and slim dividers, Aventos band, floating console) get
 * one photo only.
 * Colours with an accepted photo were preferred; the ones still to be photographed are briefed in
 * scripts/shop-art-direction-v3.json.
 */
export const PHOTO_COLOURS: Record<string, string[]> = {
  "dressing-clasic-240": ["alb-stejar-natur", "antracit-stejar"],
  "dressing-hol-120": ["casmir-alb", "stejar-natur"],
  "dressing-dormitor-180": ["alb-total", "nuc-crem"],
  "dressing-oglinda-240": ["alb-casmir", "alb-stejar-natur"],
  "dressing-familie-300": ["stejar-casmir", "alb-total"],
  "dressing-mare-360": ["gri-casmir", "alb-stejar-natur"],
  "dressing-deschis-280": ["stejar-natur", "alb-total"],
  "dressing-sertare-200": ["antracit-stejar", "alb-stejar-natur"],
  "dressing-copii-150": ["denim-alb", "alb-total"],
  "dressing-tavan-270": ["supermat-crem", "stejar-natur"],
  "dressing-hol-oglinda-160": ["alb-casmir"],
  "dressing-oglinda-una-180": ["alb-casmir", "alb-antracit"],
  "dressing-oglinda-mijloc-240": ["alb-casmir", "alb-stejar-natur"],
  "dressing-oglinzi-300": ["alb-casmir", "alb-gri-matase"],
  "dressing-sticla-300": ["grafit-total", "alb-total"],
  "dressing-ingust-90": ["alb-total", "stejar-natur"],
  "dressing-3-usi-150": ["alb-total", "alb-stejar-natur"],
  "dressing-camara-90": ["alb-total", "alb-stejar-natur"],
  "dressing-serviciu-80": ["alb-total", "gri-casmir"],
  "dressing-baie-60": ["alb-total", "alb-stejar-natur"],
  "dressing-birou-100": ["alb-stejar-natur", "stejar-natur"],
  "dressing-oglinda-glisanta-200": ["alb-casmir", "alb-stejar-natur"],
  "dressing-3-usi-oglinda-150": ["alb-casmir", "alb-total"],
  "dressing-cuier-100": ["stejar-natur", "alb-total"],
  "comoda-clasica-160": ["stejar-alb", "gri-casmir"],
  "comoda-4-sertare-100": ["alb-total", "salvie-stejar"],
  "comoda-tv-200": ["alb-total", "stejar-natur"],
  "comoda-tv-240": ["alb-total", "nuc-crem"],
  "noptiera-50": ["stejar-casmir", "alb-total"],
  "comoda-hol-120": ["casmir-alb", "stejar-natur"],
  "comoda-mixta-180": ["nuc-crem", "salvie-stejar"],
  "comoda-inalta-80": ["gri-casmir", "alb-stejar-natur"],
  "comoda-nisa-140": ["salvie-stejar"],
  "comoda-pantofar-80": ["alb-total", "alb-stejar-natur"],
  "comoda-cafea-120": ["alb-stejar-natur", "alb-total"],
  "comoda-baie-80": ["alb-casmir", "gri-casmir"],
  "comoda-birou-90": ["alb-stejar-natur", "alb-total"],
  "comoda-tv-160": ["alb-stejar-natur", "alb-total"],
  "noptiera-deschisa-45": ["stejar-natur", "alb-total"],
  "separator-biblioteca-120": ["stejar-natur", "alb-total"],
  "separator-sertare-160": ["stejar-alb", "gri-casmir"],
  "separator-usi-180": ["alb-stejar-natur"],
  "separator-inalt-240": ["bardolino-gri"],
  "separator-scund-200": ["antracit-stejar"],
  "separator-ingust-90": ["salvie-stejar"],
  "separator-cuburi-150": ["alb-total", "stejar-natur"],
  "separator-copii-120": ["alb-total", "stejar-alb"],
  "suspendat-clasic-120": ["alb-total", "stejar-natur"],
  "suspendat-tv-180": ["alb-total", "stejar-natur"],
  "suspendat-tv-240": ["alb-total", "nuc-crem"],
  "suspendat-baie-60": ["alb-casmir", "alb-stejar-natur"],
  "suspendat-aventos-180": ["supermat-alb"],
  "suspendat-etajera-150": ["stejar-natur", "alb-total"],
  "suspendat-mixt-200": ["casmir-alb"],
  "suspendat-hol-90": ["gri-casmir", "alb-stejar-natur"],
  "suspendat-bucatarie-180": ["alb-total", "alb-stejar-natur"],
  "suspendat-baie-nisa-90": ["alb-total", "stejar-alb"],
  "suspendat-pat-240": ["alb-total", "alb-stejar-natur"],
  "bucatarie-240": ["alb-stejar-natur", "alb-total"],
  "bucatarie-compacta-180": ["alb-total"],
  "bucatarie-260": ["alb-casmir", "alb-total"],
  "bucatarie-frigider-300": ["gri-casmir", "alb-total"],
  "bucatarie-coloane-380": ["stejar-alb", "alb-total"],
  "bucatarie-l-270": ["alb-casmir", "alb-stejar-natur"],
  "bucatarie-l-frigider-300": ["bardolino-gri"],
  "bucatarie-rafturi-240": ["salvie-stejar"],
  "bucatarie-ridicabile-300": ["grafit-total", "alb-total"],
  "baie-lavoar-coloana-120": ["alb-stejar-natur", "alb-total"],
  "baie-lavoar-60": ["alb-total"],
  "baie-lavoar-50": ["alb-stejar-natur"],
  "baie-lavoar-80": ["alb-casmir"],
  "baie-dubla-140": ["alb-stejar-deschis"],
  "baie-masina-140": ["alb-antracit"],
  "baie-picioare-100": ["alb-gri-matase"],
};

export const SHOP_PRODUCTS: ShopProduct[] = LAYOUT_PRESETS.map((preset) => {
  const slug = preset.id;
  const product: ShopProduct = {
    slug,
    preset,
    category: CATEGORY_OF[preset.category],
    rooms: ROOMS[preset.id] ?? [DEFAULT_ROOM[preset.category]],
    paletteIds: variantsOf(preset),
  };
  if (HANDLES[slug]) product.handle = HANDLES[slug];
  return product;
});

/**
 * Products whose slug changed: old slug → new one. Saved carts and old links still find the product
 * (the page itself redirects in next.config.ts).
 */
export const RENAMED_SLUGS: Record<string, string> = {
  "bucatarie-coloane-360": "bucatarie-coloane-380",
};

export function productBySlug(slug: string): ShopProduct | undefined {
  const current = RENAMED_SLUGS[slug] ?? slug;
  return SHOP_PRODUCTS.find((p) => p.slug === current);
}

/* ── what shoppers filter by, besides category and room ── */

/** Kinds of piece shoppers look for across categories (a TV unit can stand on legs or hang). */
export type ShopType = "comoda-tv" | "noptiera" | "pantofar";
export const SHOP_TYPES: { id: ShopType; label: string }[] = [
  { id: "comoda-tv", label: "Comode TV" },
  { id: "noptiera", label: "Noptiere" },
  { id: "pantofar", label: "Pantofare" },
];
const TYPE_OF: Record<string, ShopType> = {
  "comoda-tv-160": "comoda-tv",
  "comoda-tv-200": "comoda-tv",
  "comoda-tv-240": "comoda-tv",
  "suspendat-tv-180": "comoda-tv",
  "suspendat-tv-240": "comoda-tv",
  "noptiera-50": "noptiera",
  "noptiera-deschisa-45": "noptiera",
  "comoda-hol-120": "pantofar",
  "comoda-pantofar-80": "pantofar",
};
export const typeOf = (slug: string): ShopType | null => TYPE_OF[slug] ?? null;

/** Width bands (the width of the piece; a kitchen in L: its main wall). */
export type ShopWidth = "sub-1m" | "1-1,6m" | "1,6-2,4m" | "peste-2,4m";
export const SHOP_WIDTHS: { id: ShopWidth; label: string }[] = [
  { id: "sub-1m", label: "Sub 1 m" },
  { id: "1-1,6m", label: "1–1,6 m" },
  { id: "1,6-2,4m", label: "1,6–2,4 m" },
  { id: "peste-2,4m", label: "Peste 2,4 m" },
];
export function widthOf(preset: LayoutPreset): ShopWidth {
  const w = preset.shape.widthMm;
  if (w < 1000) return "sub-1m";
  if (w < 1600) return "1-1,6m";
  if (w <= 2400) return "1,6-2,4m";
  return "peste-2,4m";
}

/** Has a mirror: mirror doors on a wardrobe, or a mirror cabinet in the bathroom. */
export function withMirror(preset: LayoutPreset): boolean {
  return hasMirror(preset.shape) || (preset.shape.category === "BAIE" && preset.shape.columns.some((c) => upperOf(c, true) === "OGLINDA"));
}

/* ── words for the product page ── */

const cmText = (mm: number) => `${Math.round(mm / 10)}`;

/** „240 × 260 × 60 cm" (lățime × înălțime × adâncime) */
export function sizeText(preset: LayoutPreset): string {
  const s = preset.shape;
  if (s.category === "BAIE") return `${cmText(s.widthMm)} × ${cmText(s.heightMm)} × ${cmText(s.depthMm)} cm`;
  if (s.category === "BUCATARIE") {
    const b = s.kitchen?.layout !== "LINIAR" ? s.kitchen?.legB : undefined;
    return `${cmText(s.widthMm)}${b ? ` + ${cmText(b.widthMm)}` : ""} cm, înaltă de ${cmText(s.heightMm)} cm, blat de ${cmText(s.depthMm)} cm`;
  }
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
  if (s.category === "BUCATARIE") return kitchenFacts(preset);
  if (s.category === "BAIE") return bathFacts(preset);
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
  if (drawers > 0) facts.push(`${drawers} ${drawers === 1 ? "sertar" : "sertare"} pe glisiere Blum TANDEM cu închidere lină`);
  if (s.bottom?.type === "USI") facts.push("Dulăpioare cu uși la bază");
  if (s.category === "SUSPENDAT") facts.push("Se prinde de perete, fără picioare");
  else facts.push(`Pe picioare de ${s.legsMm / 10} cm`);
  return facts;
}

function kitchenFacts(preset: LayoutPreset): string[] {
  const s = preset.shape;
  const L = s.kitchen?.layout !== "LINIAR" && !!s.kitchen?.legB;
  const all = [...s.columns, ...(L ? s.kitchen!.legB!.columns : [])];
  const facts = [`${L ? "În L" : "Pe un perete"}: ${sizeText(preset)}`];
  facts.push(`${all.length} module: ${all.map((c) => (MODULE_LABELS[c.content] ?? CONTENT_LABELS[c.content]).toLowerCase()).join(", ")}`);
  const drawers = all.reduce((n, c) => n + (c.content === "SERTARE" || c.content === "PLITA" ? c.drawers ?? 3 : c.content === "COLOANA_CUPTOR" ? 2 : 0), 0);
  if (drawers > 0) facts.push(`${drawers} sertare pe glisiere Blum TANDEM cu închidere lină`);
  facts.push("Blat de 38 mm, decupat pentru chiuvetă și plită");
  if (s.kitchen?.led) facts.push("Lumină LED sub dulapurile de sus");
  facts.push("Electrocasnicele și chiuveta nu sunt incluse: lăsăm loc exact pentru ale tale");
  facts.push(`Pe picioare de ${s.legsMm / 10} cm, cu plintă`);
  return facts;
}

function bathFacts(preset: LayoutPreset): string[] {
  const s = preset.shape;
  const facts = [`Dimensiuni: ${sizeText(preset)} (lățime × înălțime până sus × adâncime), ${s.legsMm === 0 ? "suspendat" : "pe picioare"}`];
  facts.push(`${s.columns.length} ${s.columns.length === 1 ? "modul" : "module"}: ${s.columns.map((c) => moduleLabel(c.content, true).toLowerCase()).join(", ")}`);
  const drawers = s.columns.reduce((n, c) => n + (c.content === "LAVOAR" ? c.drawers ?? 2 : c.content === "SERTARE" ? c.drawers ?? 3 : 0), 0);
  if (drawers > 0) facts.push(`${drawers} ${drawers === 1 ? "sertar" : "sertare"} pe glisiere Blum TANDEM cu închidere lină`);
  const mirrors = s.columns.filter((c) => upperOf(c, true) === "OGLINDA").length;
  if (mirrors > 0) facts.push(mirrors === 1 ? "Dulap cu uși oglindă deasupra lavoarului" : `${mirrors} dulapuri cu uși oglindă`);
  facts.push("Blat de 38 mm, decupat pentru lavoar");
  facts.push(s.columns.some((c) => c.content === "MASINA_SPALAT") ? "Lavoarul, bateria și mașina de spălat nu sunt incluse: lăsăm loc exact pentru ale tale" : "Lavoarul și bateria nu sunt incluse: decupăm blatul pentru ale tale");
  facts.push(s.legsMm === 0 ? "Suspendat pe perete, podeaua rămâne liberă" : `Pe picioare de ${s.legsMm / 10} cm, cu plintă`);
  return facts;
}

/** Shop delivery promise. Honest and the same everywhere. */
export const DELIVERY_TEXT = "Livrare și montaj în 4–6 săptămâni";
