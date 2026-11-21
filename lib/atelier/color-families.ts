import { DECOR_TONES, PLAIN_DECORS } from "./decor-tones";

/**
 * The simple families the colour step is grouped by. A customer does not know decor names or suppliers:
 * they look for „something white", „a light wood", „a colour". Every decor lands in exactly one family,
 * decided from data — the measured tone of its photo (decor-tones.ts), whether it is a flat colour, and
 * its name — never from a hand list of ids, so new decors in the CRM sort themselves.
 */
export type ColorFamily = "ALB" | "BEJ_GRI" | "LEMN_DESCHIS" | "LEMN_INCHIS" | "CULORI" | "NEGRU" | "PIATRA";

/** In the order they are shown. */
export const COLOR_FAMILIES: readonly ColorFamily[] = ["ALB", "BEJ_GRI", "LEMN_DESCHIS", "LEMN_INCHIS", "CULORI", "NEGRU", "PIATRA"];

export const FAMILY_LABELS: Record<ColorFamily, string> = {
  ALB: "Albe și crem",
  BEJ_GRI: "Bej și gri",
  LEMN_DESCHIS: "Lemn deschis",
  LEMN_INCHIS: "Lemn închis",
  CULORI: "Culori",
  NEGRU: "Negru și antracit",
  PIATRA: "Piatră, beton și metal",
};

/** Words that say „this is wood", in the languages the suppliers use (matched without diacritics). */
const WOOD_WORDS =
  /\b(stej\w*|st|oak|nuc|walnut|fag|frasin|pin|brad|cires|castan|artar|mesteacan|salcam|wenge|ulm|elm|arin|gorun|prun|mahon|larice|hicori|eucalipt|bambus|sonoma|lemn|wood|fineline|fleetwood|feelwood|coco bolo|tiveden|linden|sonara)\b/;
/** Words that say „this is stone, concrete, metal or fabric" (a pattern that is not wood). */
const STONE_WORDS =
  /\b(beton|marmur\w*|marble|piatra|pietra|stone|granit|ardezie|arduaz|slate|travertin|terrazzo|bazalt\w*|basaltino|titanit|metal\w*|otel|steel|aluminiu|bronz|corten|ferro|chromix|textil|in|oxide|sparkle|technotop|neotop)\b/;

/** Supplier code series: Egger H / Kastamonu A = wood reproductions, Egger & Kastamonu F = stone and fantasy. */
const WOOD_CODE = /^[HA]\d/;
const STONE_CODE = /^F\d/;
/** …and their flat colours: Egger U / W, Kastamonu D. */
const PLAIN_CODE = /^[UWD]\d/;

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Lightness 0–1, colourfulness 0–1 and hue 0–360 of a #rrggbb colour (HSL). */
export function toneOf(hex: string): { light: number; sat: number; hue: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const light = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { light, sat: 0, hue: 0 };
  const sat = d / (1 - Math.abs(2 * light - 1));
  let hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hue = (hue * 60 + 360) % 360;
  return { light, sat, hue };
}

/** Names that say „this is a colour", whatever the photo measured (a muted sage is still „a green"). */
const COLOUR_WORDS =
  /\b(verde|green|olive|pesto|jade|albastru|blue|azurit|indigo|rosu|roz|rose|burgund|strawberry|galben|mustar|portocaliu|ginger|amber|caramel|tobac|mov|violet|turcoaz)\b/;
const BLACK_WORDS = /\b(negru|black|nero|antracit|anthracite|grafit|carbune)\b/;
const WHITE_WORDS = /\b(alb|white|bianco|crem|cream|vanilie)\b/;

/**
 * A flat colour: by tone, helped by its name when there is one (paint colours pass none).
 * Whites and creams are very light; black and anthracite very dark and colourless; „a colour" is anything
 * the eye reads as coloured; everything between is beige and grey.
 */
export function plainFamily(hex: string, name = ""): Exclude<ColorFamily, "LEMN_DESCHIS" | "LEMN_INCHIS" | "PIATRA"> {
  const text = fold(name);
  const t = toneOf(hex);
  if (!t) {
    // no measured tone: the name is all we have
    if (COLOUR_WORDS.test(text)) return "CULORI";
    if (BLACK_WORDS.test(text)) return "NEGRU";
    if (WHITE_WORDS.test(text)) return "ALB";
    return "BEJ_GRI";
  }
  const { light, hue } = t;
  // how much colour the eye sees (0 = grey): saturation counts for little on very light and very dark tones
  const chroma = t.sat * (1 - Math.abs(2 * light - 1));
  const warm = hue >= 15 && hue <= 65; // beige, cream, sand, brown
  if (light >= 0.9 ? chroma <= (warm ? 0.14 : 0.05) : light >= 0.86 && chroma <= 0.05) return "ALB";
  if (COLOUR_WORDS.test(text)) return "CULORI";
  if (light <= 0.34 && chroma <= 0.1) return "NEGRU";
  if (BLACK_WORDS.test(text) && light < 0.45) return "NEGRU";
  if (chroma >= (warm ? 0.26 : 0.07)) return "CULORI";
  // dark browns are neither grey nor black
  if (warm && light < 0.4 && chroma >= 0.12) return "CULORI";
  return "BEJ_GRI";
}

export interface FamilyInput {
  name: string;
  decorCode?: string | null;
  /** the colour it is drawn with, when the caller already knows it (else looked up by decor code) */
  color?: string | null;
}

/** Wood, stone or a flat colour? The supplier's code series when it says so, else the name. */
export function decorNature(input: FamilyInput): "WOOD" | "STONE" | "PLAIN" {
  const code = (input.decorCode ?? "").trim();
  if (PLAIN_DECORS.has(code)) return "PLAIN";
  if (PLAIN_CODE.test(code)) return "PLAIN";
  if (WOOD_CODE.test(code)) return "WOOD";
  if (STONE_CODE.test(code)) return "STONE";
  const text = fold(bareName(input));
  // „Gri Piatră Mat" is a grey, not a stone: a name that starts with a colour is a flat colour
  if (/^\s*(alb|gri|bej|negru|crem|cream|maro|vizon)\b/.test(text) || COLOUR_WORDS.test(text.trim().split(/\s+/)[0] ?? "")) return "PLAIN";
  if (WOOD_WORDS.test(text)) return "WOOD";
  if (STONE_WORDS.test(text)) return "STONE";
  return "PLAIN";
}

/** The name without the decor code the catalog puts in front of it. */
function bareName(input: FamilyInput): string {
  const code = (input.decorCode ?? "").trim();
  return (code && input.name.startsWith(code) ? input.name.slice(code.length) : input.name).replace(/^[\s·\-–]+/, "");
}

/** The family of a decor (board, front panel or worktop). */
export function colorFamily(input: FamilyInput): ColorFamily {
  const code = (input.decorCode ?? "").trim();
  const color = input.color ?? DECOR_TONES[code] ?? null;
  const nature = decorNature(input);
  if (nature === "STONE") return "PIATRA";
  if (nature === "WOOD") {
    const t = color ? toneOf(color) : null;
    if (t) return t.light >= 0.5 ? "LEMN_DESCHIS" : "LEMN_INCHIS";
    return /inchis|maro|brun|tabac|negru|antracit|wenge|nuc|dark|coffee/.test(fold(input.name)) ? "LEMN_INCHIS" : "LEMN_DESCHIS";
  }
  return plainFamily(color ?? "", bareName(input));
}
