import { CATEGORY_RULES } from "../atelier/categories";
import type { LayoutPreset } from "../atelier/presets";
import { atelierReducer } from "../atelier/state";
import type { FrontMaterial } from "../atelier/front-materials";
import type { AtelierConfig } from "../atelier/types.ts";
import { splitFrontKey } from "./fronts";

/**
 * Every shop product also comes in a few other widths (Andrew 2026-11-23: „diverse dimensiuni la fiecare
 * produs"): the same model, height and depth, resized by the configurator's own rules and priced by the
 * CRM like any configuration. A sized piece travels through the basket and the order as its colour id
 * with the width attached („alb-total@1800"), so the basket, the price refresh and the order route need
 * no new field. The width the model is shown at has no suffix.
 */

const SEP = "@";

/**
 * „alb-total@1800" → { paletteId: "alb-total", widthMm: 1800, front: null }; a plain colour id → widthMm null.
 * The board of the fronts may sit between the two („alb-total~agt@1800", lib/shop/fronts.ts): `paletteId` is
 * always the bare colour, `front` that board (null = the colour's own).
 */
export function splitSizeKey(key: string): { paletteId: string; widthMm: number | null; front: FrontMaterial | null } {
  const at = key.indexOf(SEP);
  const head = at < 0 ? key : key.slice(0, at);
  const { paletteId, front } = splitFrontKey(head);
  if (at < 0) return { paletteId, widthMm: null, front };
  const n = Number(key.slice(at + 1));
  return { paletteId, widthMm: Number.isInteger(n) && n > 0 ? n : null, front };
}

/** The basket id of a colour (with its fronts' board, lib/shop/fronts.ts) at a width (the model's own width: no suffix). */
export const sizeKey = (paletteId: string, widthMm: number | null, baseWidthMm: number): string =>
  widthMm == null || widthMm === baseWidthMm ? paletteId : `${paletteId}${SEP}${widthMm}`;

/** How far apart the three widths on offer are (Andrew 2026-11-23: few sizes, not every 30 cm). */
function stepOf(preset: LayoutPreset): number {
  const s = preset.shape;
  if (s.widthMm <= 600) return 100;
  if (s.widthMm <= 1000) return 200;
  if (s.category === "COMODA" || s.category === "SUSPENDAT" || s.category === "BAIE") return 400;
  return 600;
}

/** The widths a product is sold in (mm, ascending): its own, one smaller and one larger. */
export function sizeOptions(preset: LayoutPreset): number[] {
  const s = preset.shape;
  const [min, max] = CATEGORY_RULES[s.category].width;
  const step = stepOf(preset);
  const out = new Set<number>([s.widthMm]);
  for (const k of [-1, 1]) {
    const w = s.widthMm + k * step;
    if (w >= Math.max(min, 400) && w <= max) out.add(w);
  }
  return [...out].sort((a, b) => a - b);
}

/** The configuration at another width (null when the configurator cannot build it at that width). */
export function resizedConfig(config: AtelierConfig, widthMm: number): AtelierConfig | null {
  if (widthMm === config.widthMm) return config;
  const next = atelierReducer(config, { type: "setSize", widthMm });
  return next.widthMm === widthMm ? next : null;
}

/** „1,8 m" / „90 cm", the way the shop names widths. */
export function widthLabel(widthMm: number): string {
  return widthMm >= 1000 && widthMm % 100 === 0 ? `${(widthMm / 1000).toLocaleString("ro-RO")} m` : `${Math.round(widthMm / 10)} cm`;
}

/**
 * The product name at another width: „Dressing clasic 2,4 m" → „Dressing clasic 3 m", „Bucătărie în L 2,7 × 1,8 m"
 * → „Bucătărie în L 3,3 × 1,8 m"; a name without its width gets „, lățime 3 m".
 */
export function sizedName(name: string, baseWidthMm: number, widthMm: number): string {
  if (widthMm === baseWidthMm) return name;
  const m = /(\d+(?:,\d+)?)((?:\s×\s\d+(?:,\d+)?)?)\s(m|cm)(?=\s|,|$)/u.exec(name);
  if (m) {
    const metres = m[3] === "m";
    const value = Math.round(Number(m[1].replace(",", ".")) * (metres ? 1000 : 10));
    if (value === baseWidthMm) {
      const now = metres ? (widthMm / 1000).toLocaleString("ro-RO") : String(Math.round(widthMm / 10));
      return name.slice(0, m.index) + now + m[2] + " " + m[3] + name.slice(m.index + m[0].length);
    }
  }
  return `${name}, lățime ${widthLabel(widthMm)}`;
}
