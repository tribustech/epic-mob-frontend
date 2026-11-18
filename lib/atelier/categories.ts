import type { AtelierCategory, AtelierConfig, ColumnContent } from "./types.ts";

type Range = readonly [number, number];

/**
 * What differs between Atelier categories on the site: limits (mirroring the CRM's
 * lib/atelier/categories.ts, so the CRM never rejects what the UI allows), allowed
 * column contents, defaults and Romanian copy. Used by the reducer and the UI.
 */
export interface SiteCategory {
  /** category picker chip */
  label: string;
  /** subtitle under the picker */
  intro: string;
  /** hint under the size panel title */
  sizeHint: string;
  legs: readonly AtelierConfig["legsMm"][];
  width: Range;
  height: Range;
  depth: Range;
  column: Range;
  contents: readonly ColumnContent[];
  /** content of a column added by „Adaugă coloană" or by widening */
  fill: ColumnContent;
  slidingDoors: boolean;
  defaults: {
    widthMm: number;
    heightMm: number;
    depthMm: number;
    legsMm: AtelierConfig["legsMm"];
    doors: AtelierConfig["doors"];
    /** null = dressing layout (one column per started metre, alternating BARA/POLITE) */
    columns: readonly ColumnContent[] | null;
  };
}

const COLUMN: Range = [300, 1200];

export const CATEGORY_RULES: Record<AtelierCategory, SiteCategory> = {
  DRESSING: {
    label: "Dressing & depozitare",
    intro: "Dressing pe toată nișa, cu bare, polițe, sertare și uși glisante sau batante.",
    sizeHint: "Măsurile golului (nișei) unde va sta dressingul.",
    legs: [100, 150],
    width: [600, 6000], height: [1000, 3000], depth: [350, 800], column: COLUMN,
    contents: ["POLITE", "BARA", "BARA_DUBLA", "POLITE_BARA", "BARA_SERTARE"],
    fill: "POLITE",
    slidingDoors: true,
    defaults: { widthMm: 2400, heightMm: 2600, depthMm: 600, legsMm: 100, doors: { type: "GLISANTE" }, columns: null },
  },
  COMODA: {
    label: "Comode & noptiere",
    intro: "Comodă sau noptieră pe picioare, cu sertare, uși sau nișe deschise.",
    sizeHint: "Măsurile totale ale comodei, cu tot cu picioare.",
    legs: [100, 150],
    width: [400, 3000], height: [400, 1200], depth: [300, 600], column: COLUMN,
    contents: ["SERTARE", "USI", "DESCHIS"],
    fill: "SERTARE",
    slidingDoors: false,
    defaults: { widthMm: 1600, heightMm: 800, depthMm: 450, legsMm: 100, doors: { type: "NONE" }, columns: ["SERTARE", "SERTARE"] },
  },
  SEPARATOR: {
    label: "Separatoare cameră",
    intro: "Bibliotecă deschisă pe ambele fețe, care împarte camera fără să o închidă.",
    sizeHint: "Măsurile totale ale separatorului, cu tot cu picioare.",
    legs: [100, 150],
    width: [600, 4000], height: [1000, 3000], depth: [250, 450], column: COLUMN,
    contents: ["DESCHIS"],
    fill: "DESCHIS",
    slidingDoors: false,
    defaults: { widthMm: 1200, heightMm: 2000, depthMm: 350, legsMm: 100, doors: { type: "NONE" }, columns: ["DESCHIS", "DESCHIS", "DESCHIS"] },
  },
  SUSPENDAT: {
    label: "Corpuri suspendate",
    intro: "Corpuri prinse pe perete, cu uși batante, uși Aventos sau deschise.",
    sizeHint: "Măsurile totale ale corpurilor suspendate.",
    legs: [0],
    width: [300, 3000], height: [300, 1000], depth: [250, 450], column: COLUMN,
    contents: ["USI", "DESCHIS", "USA_RIDICABILA"],
    fill: "USI",
    slidingDoors: false,
    defaults: { widthMm: 1200, heightMm: 600, depthMm: 350, legsMm: 0, doors: { type: "NONE" }, columns: ["USI", "USI"] },
  },
};

export const CATEGORY_ORDER: readonly AtelierCategory[] = ["DRESSING", "COMODA", "SEPARATOR", "SUSPENDAT"];

export function categoryRules(category: AtelierCategory): SiteCategory {
  return CATEGORY_RULES[category] ?? CATEGORY_RULES.DRESSING;
}

export const CONTENT_LABELS: Record<ColumnContent, string> = {
  POLITE: "Polițe",
  BARA: "Bară de haine",
  BARA_DUBLA: "Bară dublă (haine scurte)",
  POLITE_BARA: "Polițe + bară",
  BARA_SERTARE: "Bară + sertare",
  SERTARE: "Sertare",
  USI: "Uși",
  DESCHIS: "Deschis (polițe)",
  USA_RIDICABILA: "Ușă Aventos",
};

/** Contents that hang clothes (drawn as rails in the 3D view). */
export const RAIL_COUNT: Partial<Record<ColumnContent, number>> = {
  BARA: 1,
  BARA_DUBLA: 2,
  POLITE_BARA: 1,
  BARA_SERTARE: 1,
};

/** Separator bottom (CRM categories.ts): height from the floor, its limits and the default. */
export const BOTTOM_HEIGHT_RANGE: Range = [400, 1000];
export const BOTTOM_DEFAULT_HEIGHT_MM = 700;

/** Comode / corpuri suspendate: the column choice is the front type, not the interior. */
export const FRONT_LABELS: Partial<Record<ColumnContent, string>> = {
  SERTARE: "Sertare",
  USI: "Uși batante",
  USA_RIDICABILA: "Ușă Aventos",
  DESCHIS: "Fără ușă (deschis)",
};

/** Contents whose shelves the client picks (CRM columnBody: col.shelves, 0–15). */
export const SHELF_CONTENTS: ReadonlySet<ColumnContent> = new Set(["USI", "USA_RIDICABILA", "DESCHIS"]);
export const SHELF_CHOICES = [0, 1, 2, 3, 4, 5, 6];

/** The CRM's shelf count when the client picks none (columnBody). */
export function autoShelves(content: ColumnContent, bodyHeightMm: number): number {
  return content === "DESCHIS" ? Math.max(1, Math.round(bodyHeightMm / 350) - 1) : 1;
}

/** POLITE_BARA: shelves the client may pick in the shelf zone (the divider shelf comes on top, in the CRM). */
export const POLITE_BARA_SHELVES: Range = [1, 6];

/** BARA_SERTARE: 1–3 interior Tandembox drawers (CRM drawerRange). */
export const BARA_SERTARE_RANGE: Range = [1, 3];

/** SERTARE: 2–6 Tandembox drawers (CRM drawerRange). */
export const SERTARE_RANGE: Range = [2, 6];

/** The CRM's automatic drawer count for SERTARE: round(body height / 180) within 2–6. */
export function autoDrawers(bodyHeightMm: number): number {
  return Math.min(SERTARE_RANGE[1], Math.max(SERTARE_RANGE[0], Math.round(bodyHeightMm / 180)));
}
