import { colorFamily, plainFamily, type ColorFamily } from "./color-families";
import { DECOR_TONES } from "./decor-tones";
import type { AtelierCatalog, AtelierFronts, AtelierMaterial, FrontKind } from "./types.ts";

export type PaletteMood = "LUMINOS" | "LEMN" | "INCHIS" | "COLORAT";

export const MOOD_LABELS: Record<PaletteMood, string> = {
  LUMINOS: "Luminoase",
  LEMN: "Lemn cald",
  INCHIS: "Închise",
  COLORAT: "Cu culoare",
};

/**
 * A named colour combination: body + fronts. Decors are referenced by supplier decor code
 * (AtelierMaterial.decorCode, e.g. „W1000 ST9"), several in order of preference, because
 * the catalog comes live from the CRM and a decor may be missing or out of price.
 */
export interface PaletteDef {
  id: string;
  /** Romanian name, e.g. „Stejar natural & alb" */
  name: string;
  mood: PaletteMood;
  carcassCodes: string[];
  front:
    | { kind: "PAL" | "MDF_MELAMINAT"; codes: string[] }
    | { kind: "MDF_VOPSIT"; ralCode: string };
}

/** A palette whose decors exist in today's catalog, ready to apply. */
export interface ResolvedPalette {
  id: string;
  name: string;
  mood: PaletteMood;
  carcassMaterialId: string;
  fronts: AtelierFronts;
  /** display names of the two decors (for the caption under the swatch) */
  carcassName: string;
  frontName: string;
}

/**
 * Body + fronts, grouped by mood. Codes: Egger („W1000 ST9"), Kastamonu („D129 PS10"), AGT
 * („734" — MDF melaminat supermat / high gloss). The first code is the look we want; the
 * others are close substitutes used when the CRM has the first one out of the price list.
 * MDF vopsit (RAL) palettes appear only when the CRM offers painted fronts.
 */
export const PALETTES: PaletteDef[] = [
  // LUMINOS
  { id: "alb-total", name: "Alb total", mood: "LUMINOS", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "PAL", codes: ["W1000 ST9", "W1100 ST9", "D129 PS10"] } },
  { id: "alb-stejar-natur", name: "Alb & stejar natur", mood: "LUMINOS", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "PAL", codes: ["H1180 ST37", "H3303 ST10", "A525 PS29"] } },
  { id: "alb-casmir", name: "Alb & cașmir", mood: "LUMINOS", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "PAL", codes: ["U702 ST9", "U705 ST9", "U750 ST9"] } },
  { id: "casmir-alb", name: "Cașmir & alb", mood: "LUMINOS", carcassCodes: ["U702 ST9", "U705 ST9", "U750 ST9"], front: { kind: "PAL", codes: ["W1000 ST9", "W1100 ST9", "D129 PS10"] } },
  { id: "gri-casmir", name: "Gri cașmir", mood: "LUMINOS", carcassCodes: ["U702 ST9", "U705 ST9", "U750 ST9"], front: { kind: "PAL", codes: ["U702 ST9", "U705 ST9", "U750 ST9"] } },
  { id: "alb-stejar-deschis", name: "Scandinav deschis", mood: "LUMINOS", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "PAL", codes: ["H1145 ST10", "H3331 ST10", "A842 PS19"] } },
  { id: "alb-gri-matase", name: "Alb & gri mătase", mood: "LUMINOS", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "PAL", codes: ["U707 ST9", "U708 ST9", "U775 ST9"] } },
  { id: "vanilie-crem", name: "Vanilie & crem", mood: "LUMINOS", carcassCodes: ["W1200 ST9", "U104 ST9", "W1000 ST9"], front: { kind: "PAL", codes: ["U222 ST9", "U113 ST9", "D118 PS14"] } },
  { id: "supermat-alb", name: "Alb supermat", mood: "LUMINOS", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "MDF_MELAMINAT", codes: ["734", "3075", "383"] } },
  { id: "supermat-crem", name: "Crem supermat", mood: "LUMINOS", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "MDF_MELAMINAT", codes: ["398", "AGT-385", "AGT-730"] } },
  { id: "alb-vopsit", name: "Alb vopsit mat", mood: "LUMINOS", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "MDF_VOPSIT", ralCode: "RAL 9010" } },
  // LEMN
  { id: "stejar-natur", name: "Stejar natur", mood: "LEMN", carcassCodes: ["H1180 ST37", "H3303 ST10", "A525 PS29"], front: { kind: "PAL", codes: ["H1180 ST37", "H3303 ST10", "A525 PS29"] } },
  { id: "stejar-alb", name: "Stejar & alb", mood: "LEMN", carcassCodes: ["H1180 ST37", "H3303 ST10", "A525 PS29"], front: { kind: "PAL", codes: ["W1000 ST9", "W1100 ST9", "D129 PS10"] } },
  { id: "stejar-casmir", name: "Stejar & cașmir", mood: "LEMN", carcassCodes: ["H1180 ST37", "H3303 ST10", "A525 PS29"], front: { kind: "PAL", codes: ["U702 ST9", "U705 ST9", "U750 ST9"] } },
  { id: "nuc-crem", name: "Nuc & crem", mood: "LEMN", carcassCodes: ["H3734 ST9", "H3710 ST12", "H1714 ST19"], front: { kind: "PAL", codes: ["U222 ST9", "W1200 ST9", "U113 ST9"] } },
  { id: "nuc-alb", name: "Nuc & alb", mood: "LEMN", carcassCodes: ["H3734 ST9", "H3710 ST12", "H1714 ST19"], front: { kind: "PAL", codes: ["W1000 ST9", "W1100 ST9", "D129 PS10"] } },
  { id: "sonoma-alb", name: "Sonoma & alb", mood: "LEMN", carcassCodes: ["A804 PS17", "A842 PS19", "H1145 ST10"], front: { kind: "PAL", codes: ["D129 PS10", "W1000 ST9", "W1100 ST9"] } },
  { id: "bardolino-gri", name: "Stejar bardolino & gri", mood: "LEMN", carcassCodes: ["H1145 ST10", "H3331 ST10", "A842 PS19"], front: { kind: "PAL", codes: ["U732 ST9", "U727 ST9", "U201 ST9"] } },
  { id: "supermat-stejar", name: "Stejar supermat & alb", mood: "LEMN", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "MDF_MELAMINAT", codes: ["397", "3076", "388"] } },
  { id: "stejar-crem-vopsit", name: "Stejar & crem vopsit", mood: "LEMN", carcassCodes: ["H1180 ST37", "H3303 ST10", "A525 PS29"], front: { kind: "MDF_VOPSIT", ralCode: "RAL 1013" } },
  // INCHIS
  { id: "stejar-negru", name: "Stejar halifax & negru", mood: "INCHIS", carcassCodes: ["H1180 ST37", "H3303 ST10", "A525 PS29"], front: { kind: "PAL", codes: ["U999 ST19", "U999 ST7", "D107 PS14"] } },
  { id: "antracit-stejar", name: "Antracit & stejar", mood: "INCHIS", carcassCodes: ["U961 ST7", "U963 ST9", "D143 PS14"], front: { kind: "PAL", codes: ["H1180 ST37", "H3303 ST10", "A525 PS29"] } },
  { id: "grafit-total", name: "Grafit total", mood: "INCHIS", carcassCodes: ["U961 ST7", "U963 ST9", "D143 PS14"], front: { kind: "PAL", codes: ["U961 ST7", "U963 ST9", "D143 PS14"] } },
  { id: "alb-antracit", name: "Alb & antracit", mood: "INCHIS", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "PAL", codes: ["U961 ST7", "U963 ST9", "D143 PS14"] } },
  { id: "tabac-negru", name: "Stejar tabac & negru", mood: "INCHIS", carcassCodes: ["H1181 ST37", "H3325 ST28", "H3702 ST10"], front: { kind: "PAL", codes: ["U999 ST19", "U999 ST7", "D107 PS14"] } },
  { id: "nuc-negru-mat", name: "Negru mat & nuc", mood: "INCHIS", carcassCodes: ["H3734 ST9", "H3710 ST12", "H1714 ST19"], front: { kind: "MDF_MELAMINAT", codes: ["723", "6002", "726"] } },
  { id: "antracit-nuc", name: "Antracit & nuc", mood: "INCHIS", carcassCodes: ["U961 ST7", "U963 ST9", "D143 PS14"], front: { kind: "PAL", codes: ["H3734 ST9", "H3710 ST12", "H1714 ST19"] } },
  { id: "beton-grafit", name: "Beton & grafit", mood: "INCHIS", carcassCodes: ["F186 ST9", "U732 ST9", "U708 ST9"], front: { kind: "PAL", codes: ["U961 ST7", "U963 ST9", "D143 PS14"] } },
  { id: "gri-furtuna-supermat", name: "Gri furtună supermat", mood: "INCHIS", carcassCodes: ["U708 ST9", "U707 ST9", "D123 PS14"], front: { kind: "MDF_MELAMINAT", codes: ["726", "387", "399"] } },
  { id: "antracit-vopsit", name: "Antracit vopsit", mood: "INCHIS", carcassCodes: ["U961 ST7", "U963 ST9", "D143 PS14"], front: { kind: "MDF_VOPSIT", ralCode: "RAL 7016" } },
  // COLORAT
  { id: "salvie-stejar", name: "Verde salvie & stejar deschis", mood: "COLORAT", carcassCodes: ["H1145 ST10", "H3331 ST10", "A842 PS19"], front: { kind: "PAL", codes: ["U638 ST9", "U636 ST9", "U604 ST9"] } },
  { id: "denim-alb", name: "Albastru denim & alb", mood: "COLORAT", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "PAL", codes: ["U540 ST9", "U504 ST9", "D181 PS30"] } },
  { id: "eucalipt-alb", name: "Verde eucalipt & alb", mood: "COLORAT", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "PAL", codes: ["U604 ST9", "U665 ST9", "D202 PS30"] } },
  { id: "roz-pudra-alb", name: "Roz pudră & alb", mood: "COLORAT", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "PAL", codes: ["U325 ST9", "D302 PS30", "U220 ST9"] } },
  { id: "caramel-stejar", name: "Caramel & stejar", mood: "COLORAT", carcassCodes: ["H1180 ST37", "H3303 ST10", "A525 PS29"], front: { kind: "PAL", codes: ["U830 ST9", "D190 PS30", "U250 ST9"] } },
  { id: "supermat-albastru", name: "Albastru ocean supermat", mood: "COLORAT", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "MDF_MELAMINAT", codes: ["736", "AGT-3091", "726"] } },
  { id: "supermat-verde", name: "Verde relax supermat", mood: "COLORAT", carcassCodes: ["H1145 ST10", "H3331 ST10", "A842 PS19"], front: { kind: "MDF_MELAMINAT", codes: ["735", "AGT-3097", "AGT-390"] } },
  { id: "salvie-vopsit", name: "Salvie vopsit", mood: "COLORAT", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "MDF_VOPSIT", ralCode: "RAL 6021" } },
  { id: "albastru-porumbel-vopsit", name: "Albastru porumbel vopsit", mood: "COLORAT", carcassCodes: ["W1000 ST9", "W1100 ST9", "D129 PS10"], front: { kind: "MDF_VOPSIT", ralCode: "RAL 5014" } },
];

/**
 * The combinations that look best on a piece of furniture in 3D (warm wood with a soft colour), shown first
 * among the ready-made colours; the others follow in PALETTES order. All-white comes later on purpose.
 */
export const FEATURED_PALETTE_IDS: readonly string[] = [
  "salvie-stejar", "stejar-casmir", "alb-stejar-natur", "nuc-crem", "alb-casmir", "stejar-alb", "caramel-stejar", "supermat-verde",
];

/** The featured palettes first (in FEATURED_PALETTE_IDS order), then the rest as they came. */
export function featuredFirst<T extends { id: string }>(list: readonly T[]): T[] {
  const rank = (id: string) => {
    const i = FEATURED_PALETTE_IDS.indexOf(id);
    return i < 0 ? FEATURED_PALETTE_IDS.length : i;
  };
  return list
    .map((item, i) => ({ item, i }))
    .sort((a, b) => rank(a.item.id) - rank(b.item.id) || a.i - b.i)
    .map((x) => x.item);
}

/**
 * The painted-MDF front model used when the client has not picked one: the flat one
 * („plan drept"), else the first. Shared by the palettes and the manual colour picker, so the
 * same RAL always prices the same.
 */
export function defaultVopsitModelId(catalog: AtelierCatalog): string | undefined {
  const models = catalog.fronts.MDF_VOPSIT;
  return (models.find((m) => /drept|plan|neted/i.test(`${m.name} ${m.id}`)) ?? models[0])?.id;
}

/** Palettes that can be applied with this catalog (unresolvable ones are dropped). */
export function resolvePalettes(catalog: AtelierCatalog): ResolvedPalette[] {
  const out: ResolvedPalette[] = [];
  for (const def of PALETTES) {
    const carcass = def.carcassCodes.map((c) => catalog.carcass.find((m) => m.decorCode === c)).find(Boolean);
    if (!carcass) continue;
    if (def.front.kind === "MDF_VOPSIT") {
      const ralCode = def.front.ralCode;
      const ral = catalog.ral.find((r) => r.code === ralCode);
      const modelId = defaultVopsitModelId(catalog);
      if (!ral || !modelId) continue;
      out.push({
        id: def.id, name: def.name, mood: def.mood, carcassMaterialId: carcass.id,
        fronts: { kind: "MDF_VOPSIT", modelId, ralCode: ral.code },
        carcassName: carcass.name, frontName: `${ral.code} · ${ral.name}`,
      });
      continue;
    }
    const kind = def.front.kind;
    const front = def.front.codes.map((c) => catalog.fronts[kind].find((m) => m.decorCode === c)).find(Boolean);
    if (!front) continue;
    out.push({
      id: def.id, name: def.name, mood: def.mood, carcassMaterialId: carcass.id,
      fronts: { kind, materialId: front.id },
      carcassName: carcass.name, frontName: front.name,
    });
  }
  return out;
}

/** The palette that matches the current colours exactly, if any. */
export function activePaletteId(
  palettes: ResolvedPalette[],
  config: { carcassMaterialId: string; fronts: AtelierFronts },
): string | null {
  const f = config.fronts;
  return (
    palettes.find(
      (p) =>
        p.carcassMaterialId === config.carcassMaterialId &&
        p.fronts.kind === f.kind &&
        (p.fronts.materialId ?? null) === (f.materialId ?? null) &&
        (p.fronts.ralCode ?? null) === (f.ralCode ?? null),
    )?.id ?? null
  );
}

/** Weighted RGB distance (the eye is most sensitive to green). */
function distance(a: [number, number, number], b: [number, number, number]): number {
  return 2 * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + 3 * (a[2] - b[2]) ** 2;
}

function rgbOf(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The paint colour closest to a given colour (e.g. the look of the current fronts); null without colours. */
export function nearestRal(ral: AtelierCatalog["ral"], color: string): AtelierCatalog["ral"][number] | null {
  const target = rgbOf(color);
  let best: AtelierCatalog["ral"][number] | null = null;
  let bestD = Infinity;
  for (const r of ral) {
    const c = rgbOf(r.hex);
    if (!c) continue;
    const d = target ? distance(c, target) : 0;
    if (d < bestD) {
      best = r;
      bestD = d;
    }
  }
  return best ?? ral[0] ?? null;
}

/**
 * Painted fronts that look like the current ones: the default flat model in the paint colour nearest
 * to `color`. null when the CRM offers no painted fronts.
 */
export function paintedFrontsLike(catalog: AtelierCatalog, color: string): AtelierFronts | null {
  const modelId = defaultVopsitModelId(catalog);
  const ral = nearestRal(catalog.ral, color);
  return modelId && ral ? { kind: "MDF_VOPSIT", modelId, ralCode: ral.code, faces: 1 } : null;
}

/* ── the front material: PAL, AGT (MDF melaminat) or MDF vopsit ── */

/** The three front materials, cheapest first, in the words the workshop uses with clients. */
export const FRONT_MATERIALS: readonly { kind: FrontKind; label: string; hint: string }[] = [
  { kind: "PAL", label: "PAL melaminat", hint: "Placa clasică: decor de lemn sau culori uni." },
  { kind: "MDF_MELAMINAT", label: "MDF melaminat (AGT)", hint: "Placă mai densă, mată catifelată sau lucioasă." },
  { kind: "MDF_VOPSIT", label: "MDF vopsit", hint: "Vopsit mat în orice culoare. Permite mânerul îngropat." },
];

export const FRONT_MATERIAL_LABEL: Record<FrontKind, string> = Object.fromEntries(FRONT_MATERIALS.map((m) => [m.kind, m.label])) as Record<FrontKind, string>;

/** The front materials this catalog can make (painted fronts need a model and paint colours). */
export function frontMaterialsOffered(catalog: AtelierCatalog): FrontKind[] {
  return FRONT_MATERIALS.map((m) => m.kind).filter((kind) =>
    kind === "MDF_VOPSIT" ? catalog.fronts.MDF_VOPSIT.length > 0 && catalog.ral.length > 0 : catalog.fronts[kind].length > 0,
  );
}

/** The average tone of a decor (measured from its photo); null when unknown. */
export type ToneOf = (material: AtelierMaterial) => string | null;
const measuredTone: ToneOf = (m) => (m.decorCode ? (DECOR_TONES[m.decorCode] ?? null) : null);

/** High-gloss and metallic panels („HG White", „Cashmere Gold"): a matte front is matched to a matte one when there is one close enough. */
const GLOSSY = /\b(HG|high ?gloss|lucios|gloss|metallic|metalic|gold)\b/i;
/** about forty steps of green: a gloss panel wins only when no matte one is near */
const GLOSS_PENALTY = 6000;
/** Pearl and metallic paints (RAL 1036 „Pearl gold"…). */
const SHINY_PAINT = /pearl|metallic|perlat|metalizat|luminous/i;

/** Wood, stone and other patterns cannot be painted: only flat colours carry over to paint as they are. */
const GRAINED = new Set<ColorFamily>(["LEMN_DESCHIS", "LEMN_INCHIS", "PIATRA"]);

/** What the current fronts look like: their tone and their family („lemn deschis", „culori"…). */
function frontsSource(
  catalog: AtelierCatalog,
  fronts: AtelierFronts,
  toneOf: ToneOf,
): { color: string | null; family: ColorFamily; decorCode: string | null; glossy: boolean } | null {
  if (fronts.kind === "MDF_VOPSIT") {
    const ral = catalog.ral.find((r) => r.code === fronts.ralCode);
    // painted fronts are matte
    return ral ? { color: ral.hex, family: plainFamily(ral.hex), decorCode: null, glossy: false } : null;
  }
  const m = catalog.fronts[fronts.kind].find((x) => x.id === fronts.materialId);
  if (!m) return null;
  return { color: toneOf(m) ?? measuredTone(m), family: colorFamily({ name: m.name, decorCode: m.decorCode }), decorCode: m.decorCode, glossy: GLOSSY.test(m.name) };
}

/**
 * The same fronts in another material, looking as close as possible: the same decor code when the other
 * material has it, else the nearest colour of the same family (a light oak stays a light oak), else of the
 * same kind (grain / flat), else any. Paint cannot imitate wood or stone: a grained front becomes the nearest
 * flat paint colour, and `approx` says so. null when that material has nothing to offer.
 */
export function frontsInMaterial(
  catalog: AtelierCatalog,
  from: AtelierFronts,
  kind: FrontKind,
  toneOf: ToneOf = measuredTone,
): { fronts: AtelierFronts; approx: boolean } | null {
  if (from.kind === kind) return { fronts: from, approx: false };
  const source = frontsSource(catalog, from, toneOf);
  if (kind === "MDF_VOPSIT") {
    const modelId = defaultVopsitModelId(catalog);
    // a flat colour stays in its family (a sage stays a green, not the nearest beige); wood takes the nearest of all
    // pearl and metallic paints only when asked for by name: never as a stand-in
    const plain = catalog.ral.filter((r) => !SHINY_PAINT.test(r.name));
    const pool = plain.length ? plain : catalog.ral;
    const ral = source && !GRAINED.has(source.family)
      ? nearestOf(pool, (r) => r.hex, (r) => plainFamily(r.hex), source)
      : nearestRal(pool, source?.color ?? "#ffffff");
    if (!modelId || !ral) return null;
    return { fronts: { kind: "MDF_VOPSIT", modelId, ralCode: ral.code, faces: 1 }, approx: !!source && GRAINED.has(source.family) };
  }
  const list = catalog.fronts[kind];
  if (list.length === 0) return null;
  const same = source?.decorCode ? list.find((m) => m.decorCode === source.decorCode) : undefined;
  if (same) return { fronts: { kind, materialId: same.id }, approx: false };
  const best = nearestOf(list, (m) => toneOf(m) ?? measuredTone(m), (m) => colorFamily({ name: m.name, decorCode: m.decorCode }), source, (m) =>
    GLOSSY.test(m.name) === (source?.glossy ?? false) ? 0 : GLOSS_PENALTY,
  );
  return best ? { fronts: { kind, materialId: best.id }, approx: false } : null;
}

/** Tiers: the same family, then the same kind (grain / flat), then the rest; inside a tier, the nearest colour. */
function nearestOf<T>(
  list: readonly T[],
  colorOf: (item: T) => string | null,
  familyOf: (item: T) => ColorFamily,
  source: { color: string | null; family: ColorFamily } | null,
  penalty: (item: T) => number = () => 0,
): T | null {
  const target = source?.color ? rgbOf(source.color) : null;
  const grained = !!source && GRAINED.has(source.family);
  let best: T | null = null;
  let bestScore = Infinity;
  for (const item of list) {
    const family = familyOf(item);
    const tone = colorOf(item);
    const c = tone ? rgbOf(tone) : null;
    const tier = !source ? 0 : family === source.family ? 0 : GRAINED.has(family) === grained ? 1 : 2;
    const d = target && c ? distance(c, target) : 9 * 255 ** 2 * 3;
    const score = tier * 1e7 + d + penalty(item);
    if (score < bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

/**
 * The client's own colour, remembered while they compare materials: going PAL → AGT → MDF vopsit → PAL brings
 * back the very PAL decor they had, and each material is matched to that colour, not to the last stand-in.
 * `produced` is what the last switch made; once the client picks another colour, that becomes the origin.
 */
export interface MaterialTrail {
  origin: AtelierFronts;
  produced: AtelierFronts;
}

const sameFronts = (a: AtelierFronts, b: AtelierFronts) =>
  a.kind === b.kind && (a.materialId ?? null) === (b.materialId ?? null) && (a.ralCode ?? null) === (b.ralCode ?? null) && (a.modelId ?? null) === (b.modelId ?? null);

export function switchFrontMaterial(
  catalog: AtelierCatalog,
  current: AtelierFronts,
  kind: FrontKind,
  trail: MaterialTrail | null,
  toneOf: ToneOf = measuredTone,
): { fronts: AtelierFronts; approx: boolean; trail: MaterialTrail } | null {
  const origin = trail && sameFronts(trail.produced, current) ? trail.origin : current;
  if (origin.kind === kind) return { fronts: origin, approx: false, trail: { origin, produced: origin } };
  const next = frontsInMaterial(catalog, origin, kind, toneOf);
  if (!next) return null;
  // painted fronts keep the client's paint options (model, both faces) when coming back to paint
  const fronts = kind === "MDF_VOPSIT" && current.kind === "MDF_VOPSIT" ? { ...current, ralCode: next.fronts.ralCode } : next.fronts;
  return { fronts, approx: next.approx, trail: { origin, produced: fronts } };
}
