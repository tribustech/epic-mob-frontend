import { materialLook } from "@/components/atelier/material-look";
import { colorFamily, decorNature, plainFamily, type ColorFamily } from "./color-families";
import { needsPaintedFronts } from "./handles";
import { defaultVopsitModelId } from "./palettes";
import { ralNameRo } from "./ral-names";
import type { AtelierCatalog, AtelierFronts, AtelierMaterial, FrontKind, HandleKind } from "./types.ts";

/**
 * The three boards the fronts of a ready-made colour can be made of (Andrew 2026-11-23: „fronturi PAL, AGT
 * (MDF melaminat) sau MDF vopsit, cu prețuri diferite; începem de la PAL"). A colour combination is drawn
 * with one board; the same look on the two other boards is found here: the nearest decor of that board by
 * measured tone (wood stays wood, a flat colour stays a flat colour), or for paint the nearest RAL colour.
 * Paint cannot look like wood or stone, so a wood front has no painted option. The body never changes.
 * Pure: the shop prices each answer through the CRM like any configuration.
 */

export type FrontMaterial = "PAL" | "AGT" | "VOPSIT";

/** In the order they are offered: cheapest first. */
export const FRONT_MATERIALS: readonly FrontMaterial[] = ["PAL", "AGT", "VOPSIT"];

export const KIND_OF_MATERIAL: Record<FrontMaterial, FrontKind> = { PAL: "PAL", AGT: "MDF_MELAMINAT", VOPSIT: "MDF_VOPSIT" };

export const materialOfKind = (kind: FrontKind): FrontMaterial => (kind === "MDF_MELAMINAT" ? "AGT" : kind === "MDF_VOPSIT" ? "VOPSIT" : "PAL");

export const isFrontMaterial = (v: unknown): v is FrontMaterial => v === "PAL" || v === "AGT" || v === "VOPSIT";

/** Why an option cannot be offered, in one plain line for the card. */
export const PAINT_NEEDS_PLAIN = "Vopsit doar în culori uni";

export interface FrontOption {
  material: FrontMaterial;
  /** the board this colour combination is drawn with (its photo, its listed price) */
  native: boolean;
  /** the fronts to price; null = not offered (see `reason`) */
  fronts: AtelierFronts | null;
  reason: string | null;
  /** the colour on that board, the way the client reads it: „Soft Touch White · AGT 734", „Alb perlat · RAL 1013" */
  colourName: string | null;
  /** the colour it is drawn with (#rrggbb) */
  color: string | null;
}

type Nature = "WOOD" | "STONE" | "PLAIN";

function rgbOf(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** sRGB → CIE L*a*b* (D65), so „close" means close to the eye. */
function labOf(hex: string): [number, number, number] | null {
  const rgb = rgbOf(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
  const y = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/** ΔE (CIE76) between two colours; Infinity when one is unknown. */
export function colourDistance(a: string, b: string): number {
  const x = labOf(a);
  const y = labOf(b);
  if (!x || !y) return Infinity;
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/** Colour words in decor and RAL names (Romanian decors, English AGT and RAL names), by the colour they name. */
const RO_WORDS: [RegExp, string][] = [
  [/\b(alb|albe)\b/, "WHITE"], [/\b(negru|neagra)\b/, "BLACK"], [/\b(gri|grafit|antracit)\b/, "GREY"], [/\bverde\b/, "GREEN"],
  [/\balbastru\b/, "BLUE"], [/\b(crem|vanilie)\b/, "CREAM"], [/\b(bej|nisip)\b/, "BEIGE"], [/\b(roz|rose)\b/, "PINK"],
  [/\b(rosu|bordo)\b/, "RED"], [/\b(galben|mustar)\b/, "YELLOW"], [/\b(maro|caramel|tabac)\b/, "BROWN"],
];
const EN_WORDS: [RegExp, string][] = [
  [/\bwhite\b/, "WHITE"], [/\bblack\b/, "BLACK"], [/\b(grey|gray|anthracite)\b/, "GREY"], [/\bgreen\b/, "GREEN"], [/\bblue\b/, "BLUE"],
  [/\bcream\b/, "CREAM"], [/\bbeige\b/, "BEIGE"], [/\b(pink|rose)\b/, "PINK"], [/\bred\b/, "RED"], [/\byellow\b/, "YELLOW"],
  [/\b(brown|tobac|tobacco|coffee)\b/, "BROWN"], [/\bgold\b/, "GOLD"],
];

/**
 * The colour a name says, when it says one: Romanian names put it first („Gri Grafit"), English ones last
 * („Grey brown" is a brown, „Soft Touch Storm Grey" a grey).
 */
export function namedColour(name: string): string | null {
  const text = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  let first: { at: number; colour: string } | null = null;
  for (const [re, colour] of RO_WORDS) {
    const m = re.exec(text);
    if (m && (!first || m.index < first.at)) first = { at: m.index, colour };
  }
  if (first) return first.colour;
  let last: { at: number; colour: string } | null = null;
  for (const [re, colour] of EN_WORDS) {
    const g = new RegExp(re.source, "g");
    for (let m = g.exec(text); m; m = g.exec(text)) if (!last || m.index > last.at) last = { at: m.index, colour };
  }
  return last?.colour ?? null;
}

/** Added to the tone distance when two names say different colours (a black front is not matched to „Cashmere Gold"). */
const OTHER_COLOUR_PENALTY = 15;
/** …and a little when the name says no colour („Taupe", „Pesto"): a „Cream" front prefers a decor called cream. */
const UNNAMED_PENALTY = 6;

/**
 * The nearest item by tone, among those of the same colour family when there are any (black stays black),
 * a little further when its name says another colour.
 */
function nearest<T>(
  items: T[],
  colorOf: (t: T) => string,
  familyOf: (t: T) => ColorFamily,
  nameOf: (t: T) => string,
  target: { color: string; family: ColorFamily; named: string | null },
): T | null {
  const same = items.filter((t) => familyOf(t) === target.family);
  let best: T | null = null;
  let bestD = Infinity;
  for (const t of same.length ? same : items) {
    const named = target.named ? namedColour(nameOf(t)) : null;
    const penalty = !target.named || named === target.named ? 0 : named ? OTHER_COLOUR_PENALTY : UNNAMED_PENALTY;
    const d = colourDistance(colorOf(t), target.color) + penalty;
    if (d < bestD) {
      best = t;
      bestD = d;
    }
  }
  return best;
}

/** Stone and concrete prints, whatever their photo measured. */
const PRINT = /marmur|marble|beton|concrete|terrazzo|granit/i;

/** High gloss panels: a different finish, chosen only for a front that is high gloss already. */
const GLOSSY = /\b(HG|high ?gloss|lucios)\b/i;

/** The decor name without the code the catalog puts in front of it: „734 · Soft Touch White" → „Soft Touch White". */
function bareName(m: AtelierMaterial): string {
  const code = m.decorCode ?? "";
  const name = code && m.name.startsWith(code) ? m.name.slice(code.length) : m.name;
  return name.replace(/^[\s·\-–]+/, "").trim() || m.name;
}

/** „Soft Touch White · AGT 734", „Cashmere Grey · Egger U702 ST9". */
export function decorLabel(m: AtelierMaterial): string {
  const code = m.decorCode ?? "";
  const brand = m.brand && !code.toUpperCase().startsWith(m.brand.toUpperCase()) ? `${m.brand} ` : "";
  return code ? `${bareName(m)} · ${brand}${code}` : bareName(m);
}

/** „Alb perlat · RAL 1013" (the code alone when the name is unknown). */
export function ralColourLabel(ral: { code: string; name: string }): string {
  const ro = ralNameRo(ral.name);
  return ro ? `${ro} · ${ral.code}` : ral.code;
}

const natureOf = (m: AtelierMaterial): Nature => decorNature({ name: m.name, decorCode: m.decorCode });
const lookColor = (m: AtelierMaterial, kind: "PAL" | "MDF_MELAMINAT") => materialLook(m, kind).color;
const decorFamily = (m: AtelierMaterial, kind: "PAL" | "MDF_MELAMINAT"): ColorFamily =>
  colorFamily({ name: m.name, decorCode: m.decorCode, color: lookColor(m, kind) });
const ralFamily = (r: { hex: string; name: string }): ColorFamily => plainFamily(r.hex, r.name);

interface Source {
  color: string;
  nature: Nature;
  family: ColorFamily;
  /** the colour its name says („Negru" → BLACK) */
  named: string | null;
  glossy: boolean;
}

/** What the fronts look like now: their tone, whether it is wood / stone / a flat colour, and the panel itself. */
function sourceOf(catalog: AtelierCatalog, fronts: AtelierFronts): Source | null {
  if (fronts.kind === "MDF_VOPSIT") {
    const ral = catalog.ral.find((r) => r.code === fronts.ralCode);
    return ral ? { color: ral.hex, nature: "PLAIN", family: ralFamily(ral), named: namedColour(ral.name), glossy: false } : null;
  }
  const kind = fronts.kind;
  const m = catalog.fronts[kind].find((x) => x.id === fronts.materialId);
  if (!m) return null;
  return { color: lookColor(m, kind), nature: natureOf(m), family: decorFamily(m, kind), named: namedColour(bareName(m)), glossy: GLOSSY.test(m.name) };
}

/** The decor of `list` nearest to the source: same nature first (wood → wood), matt unless the source is glossy. */
function nearestDecor(list: AtelierMaterial[], kind: "PAL" | "MDF_MELAMINAT", src: Source): AtelierMaterial | null {
  const finish = list.filter((m) => GLOSSY.test(m.name) === src.glossy);
  const pool = finish.length ? finish : list;
  // a flat colour is not matched to a marble or concrete print, even one the photo shows flat
  const same = pool.filter((m) => natureOf(m) === src.nature && !(src.nature === "PLAIN" && PRINT.test(m.name)));
  // a wood front on a board without wood decors: no equivalent (a flat colour would be another product)
  if (src.nature === "WOOD" && same.length === 0) return null;
  const candidates = same.length ? same : pool.filter((m) => natureOf(m) === "PLAIN" && !PRINT.test(m.name));
  return nearest(candidates, (m) => lookColor(m, kind), (m) => decorFamily(m, kind), bareName, src);
}

/**
 * The fronts of one colour combination on each of the three boards. `handle`: the handle the piece is sold
 * with; a handle cut into the front (recessed grip, milled edge) is made only on painted fronts, so the
 * other boards are not offered for it.
 */
export function frontOptions(catalog: AtelierCatalog, fronts: AtelierFronts, handle?: HandleKind | null): FrontOption[] {
  const src = sourceOf(catalog, fronts);
  const nativeMaterial = materialOfKind(fronts.kind);
  return FRONT_MATERIALS.map((material): FrontOption => {
    const none = (reason: string): FrontOption => ({ material, native: false, fronts: null, reason, colourName: null, color: null });
    if (material === nativeMaterial) {
      const colour = describeFronts(catalog, fronts);
      return { material, native: true, fronts, reason: null, colourName: colour?.name ?? null, color: colour?.color ?? src?.color ?? null };
    }
    if (!src) return none("Nu se poate acum");
    if (handle && needsPaintedFronts(handle) && material !== "VOPSIT") return none("Mânerul ales se face doar pe uși vopsite");
    if (material === "VOPSIT") {
      if (src.nature !== "PLAIN") return none(PAINT_NEEDS_PLAIN);
      const modelId = defaultVopsitModelId(catalog);
      const ral = nearest(catalog.ral, (r) => r.hex, ralFamily, (r) => r.name, src);
      if (!modelId || !ral) return none("Nu se poate acum");
      return { material, native: false, fronts: { kind: "MDF_VOPSIT", modelId, ralCode: ral.code }, reason: null, colourName: ralColourLabel(ral), color: ral.hex };
    }
    const kind = KIND_OF_MATERIAL[material] as "PAL" | "MDF_MELAMINAT";
    const m = nearestDecor(catalog.fronts[kind], kind, src);
    if (!m) return none(src.nature === "WOOD" ? "Nu avem acest lemn pe MDF" : "Nu se poate acum");
    return { material, native: false, fronts: { kind, materialId: m.id }, reason: null, colourName: decorLabel(m), color: lookColor(m, kind) };
  });
}

/** The colour of some fronts, the way the client reads it, and its tone. */
export function describeFronts(catalog: AtelierCatalog, fronts: AtelierFronts): { name: string; color: string } | null {
  if (fronts.kind === "MDF_VOPSIT") {
    const ral = catalog.ral.find((r) => r.code === fronts.ralCode);
    return ral ? { name: ralColourLabel(ral), color: ral.hex } : null;
  }
  const m = catalog.fronts[fronts.kind].find((x) => x.id === fronts.materialId);
  return m ? { name: decorLabel(m), color: lookColor(m, fronts.kind) } : null;
}
