import type { AtelierCatalog, AtelierFronts } from "./types.ts";

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
    // weighted RGB distance (the eye is most sensitive to green)
    const d = target ? 2 * (c[0] - target[0]) ** 2 + 4 * (c[1] - target[1]) ** 2 + 3 * (c[2] - target[2]) ** 2 : 0;
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
