import type { AtelierColumn, AtelierConfig, AtelierKitchen, ColumnContent, KitchenLayout, UpperContent } from "./types.ts";

/*
 * Kitchens on the site (mirrors the CRM's lib/atelier/kitchen.ts, so the CRM never rejects what the UI allows):
 * one wall (LINIAR) or two walls in an L. On each wall, left to right as you face it, modules under the worktop
 * and tall columns; above every module under the worktop, a wall cabinet (or open shelf, hood, nothing).
 * In an L the corner unit (COLT) is on the main wall at the corner end; the second wall's modules start after
 * the worktop depth.
 */

export const COUNTER_MM = 900;
export const UPPER_GAP_MM = 550;
export const CORNER_WIDTH_MM = 1100;

export const KITCHEN_BASE: readonly ColumnContent[] = ["SERTARE", "USI", "CHIUVETA", "CUPTOR", "PLITA", "MASINA_VASE"];
export const KITCHEN_TALL: readonly ColumnContent[] = ["FRIGIDER", "COLOANA_CUPTOR", "COLOANA"];
/** what the client can pick for a module (the corner unit is placed by the layout) */
export const KITCHEN_MODULES: readonly ColumnContent[] = [...KITCHEN_BASE, ...KITCHEN_TALL];
export const KITCHEN_UPPERS: readonly UpperContent[] = ["USI", "RIDICABILA", "DESCHIS", "HOTA", "NONE"];
export const isTall = (c: ColumnContent): boolean => KITCHEN_TALL.includes(c);

export const KITCHEN_WIDTH: Partial<Record<ColumnContent, readonly [number, number]>> = {
  SERTARE: [300, 1200],
  USI: [300, 1000],
  CHIUVETA: [500, 1200],
  CUPTOR: [600, 900],
  PLITA: [600, 900],
  MASINA_VASE: [450, 600],
  FRIGIDER: [600, 700],
  COLOANA_CUPTOR: [600, 700],
  COLOANA: [300, 1000],
  COLT: [900, 1200],
};
/** a new module of this kind starts at this width */
export const KITCHEN_DEFAULT_WIDTH: Partial<Record<ColumnContent, number>> = {
  SERTARE: 600,
  USI: 600,
  CHIUVETA: 800,
  CUPTOR: 600,
  PLITA: 600,
  MASINA_VASE: 600,
  FRIGIDER: 600,
  COLOANA_CUPTOR: 600,
  COLOANA: 600,
  COLT: CORNER_WIDTH_MM,
};
export const widthRange = (c: ColumnContent): readonly [number, number] => KITCHEN_WIDTH[c] ?? [300, 1200];
/** modules whose width follows the wall (the appliance ones keep theirs) */
const FLEX: readonly ColumnContent[] = ["SERTARE", "USI", "CHIUVETA", "COLOANA"];
const isFlex = (c: ColumnContent) => FLEX.includes(c);

export const KITCHEN_DRAWERS: readonly [number, number] = [2, 4];
export const KITCHEN_DEFAULT_DRAWERS = 3;
export const LEG_B_RANGE: readonly [number, number] = [1200, 4500];

export const MODULE_LABELS: Partial<Record<ColumnContent, string>> = {
  SERTARE: "Sertare",
  USI: "Dulăpior cu uși",
  CHIUVETA: "Chiuvetă",
  CUPTOR: "Plită + cuptor",
  PLITA: "Plită pe sertare",
  MASINA_VASE: "Mașină de vase",
  FRIGIDER: "Frigider",
  COLOANA_CUPTOR: "Cuptor la înălțime",
  COLOANA: "Cămară",
  COLT: "Colț",
};
/** one line under the module picker: what the client gets */
export const MODULE_HINTS: Partial<Record<ColumnContent, string>> = {
  SERTARE: "Sertare mari, cu închidere lină, sub blat.",
  USI: "Dulăpior sub blat, cu uși și o poliță.",
  CHIUVETA: "Dulap sub chiuvetă; decupăm blatul pentru chiuveta ta.",
  CUPTOR: "Cuptorul tău sub blat, plita deasupra, hota sus.",
  PLITA: "Plita deasupra, sertare mari dedesubt, hota sus (cuptorul stă în coloană).",
  MASINA_VASE: "Loc pentru mașina de vase, cu front ca restul bucătăriei.",
  FRIGIDER: "Coloană înaltă pentru un frigider încorporabil.",
  COLOANA_CUPTOR: "Cuptor și microunde la nivelul ochilor, sertare dedesubt.",
  COLOANA: "Coloană înaltă cu polițe, pentru cămară.",
  COLT: "Corp de colț, cu acces din față.",
};
export const UPPER_LABELS: Record<UpperContent, string> = {
  USI: "Dulap cu uși",
  RIDICABILA: "Ușă care se ridică",
  DESCHIS: "Raft deschis",
  HOTA: "Hotă",
  NONE: "Nimic",
};
export const LAYOUT_LABELS: Record<KitchenLayout, string> = {
  LINIAR: "Pe un perete",
  L_STANGA: "În L, colț în stânga",
  L_DREAPTA: "În L, colț în dreapta",
};

export const isKitchen = (c: Pick<AtelierConfig, "category">): boolean => c.category === "BUCATARIE";
export const kitchenLayout = (c: Pick<AtelierConfig, "kitchen">): KitchenLayout => c.kitchen?.layout ?? "LINIAR";
export const isL = (c: Pick<AtelierConfig, "kitchen">): boolean => kitchenLayout(c) !== "LINIAR" && !!c.kitchen?.legB;

/** The wall cabinet of a module (null: a tall column has none). */
export function upperOf(col: AtelierColumn): UpperContent | null {
  if (isTall(col.content)) return null;
  return col.upper ?? (col.content === "CUPTOR" || col.content === "PLITA" ? "HOTA" : "USI");
}

/** Index of the corner unit on the main wall (−1 for a one-wall kitchen). */
export function cornerIndex(layout: KitchenLayout, n: number): number {
  return layout === "L_STANGA" ? 0 : layout === "L_DREAPTA" ? n - 1 : -1;
}

/** The second wall's modules fill its length minus the worktop depth in the corner. */
export const legBModulesMm = (config: Pick<AtelierConfig, "depthMm" | "kitchen">): number =>
  (config.kitchen?.legB?.widthMm ?? 0) - config.depthMm;

const sum = (cols: AtelierColumn[]) => cols.reduce((t, c) => t + c.widthMm, 0);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Fits a wall's modules to `total` mm: the flexible modules (drawers, doors, sink, pantry) share the change
 * in whole centimetres where possible; appliance modules and `keep` stay as they are. When the flexible ones
 * cannot absorb it, a module is added (drawers) or the last flexible one is removed. null = impossible.
 */
export function fitKitchen(cols: AtelierColumn[], total: number, keep: number | null = null, corner = -1): AtelierColumn[] | null {
  const out = cols.map((c) => ({ ...c }));
  for (let guard = 0; guard < 12; guard++) {
    const flex = out.map((c, i) => i).filter((i) => i !== keep && i !== corner && isFlex(out[i].content));
    const fixed = sum(out.filter((_, i) => !flex.includes(i)));
    const target = total - fixed;
    const lo = flex.reduce((t, i) => t + widthRange(out[i].content)[0], 0);
    const hi = flex.reduce((t, i) => t + widthRange(out[i].content)[1], 0);
    if (target >= lo && target <= hi && (flex.length > 0 || target === 0)) {
      if (flex.length === 0) return out;
      // proportional, rounded to cm, remainder on the widest flexible module
      const cur = flex.reduce((t, i) => t + out[i].widthMm, 0) || flex.length;
      for (const i of flex) {
        const [a, b] = widthRange(out[i].content);
        out[i].widthMm = clamp(Math.round((out[i].widthMm * target) / cur / 10) * 10, a, b);
      }
      let diff = target - flex.reduce((t, i) => t + out[i].widthMm, 0);
      for (let pass = 0; pass < 4 && diff !== 0; pass++) {
        for (const i of [...flex].sort((x, y) => out[y].widthMm - out[x].widthMm)) {
          if (diff === 0) break;
          const [a, b] = widthRange(out[i].content);
          const next = clamp(out[i].widthMm + diff, a, b);
          diff -= next - out[i].widthMm;
          out[i].widthMm = next;
        }
      }
      return diff === 0 ? out : null;
    }
    if (target > hi && (flex.length > 0 || target >= widthRange("SERTARE")[0])) {
      // too long: one more drawer module, next to the corner / at the end
      const at = corner === out.length - 1 ? out.length - 1 : corner === 0 ? 1 : out.length;
      out.splice(at, 0, { widthMm: 600, content: "SERTARE" });
      if (keep !== null && at <= keep) keep++;
      if (corner > 0 && at <= corner) corner++;
      continue;
    }
    // too short: drop the last flexible module (else the last one that is not kept)
    const drop =
      flex.length > 0 && target < lo ? flex[flex.length - 1] : out.map((_, i) => i).filter((i) => i !== keep && i !== corner && !flex.includes(i)).pop() ?? flex[flex.length - 1];
    if (drop === undefined || out.length <= 1) return null;
    out.splice(drop, 1);
    if (keep !== null && drop < keep) keep--;
    if (corner > drop) corner--;
  }
  return null;
}

export const kitchenColumn = (content: ColumnContent, widthMm = KITCHEN_DEFAULT_WIDTH[content] ?? 600): AtelierColumn =>
  content === "SERTARE" ? { widthMm, content, drawers: KITCHEN_DEFAULT_DRAWERS } : { widthMm, content };

/** A wall's modules with one module changed to `content` (width clamped to its range, the others refit). */
export function withModule(cols: AtelierColumn[], total: number, index: number, content: ColumnContent, corner = -1): AtelierColumn[] | null {
  if (!cols[index] || index === corner || content === "COLT") return null;
  const [a, b] = widthRange(content);
  const next = cols.map((c, i) => (i === index ? { ...kitchenColumn(content, clamp(c.widthMm, a, b)), ...(c.upper && !isTall(content) ? { upper: c.upper } : {}) } : c));
  return fitKitchen(next, total, index, corner);
}

/** The default second wall of an L (1,8 m: doors + drawers). */
export function defaultLegB(depthMm: number): NonNullable<AtelierKitchen["legB"]> {
  const widthMm = 1800;
  const cols = fitKitchen([kitchenColumn("USI"), kitchenColumn("SERTARE")], widthMm - depthMm) ?? [kitchenColumn("USI", widthMm - depthMm)];
  return { widthMm, columns: cols };
}

/** Changing the layout: an L gets a corner unit at the corner end of the main wall and a second wall. */
export function withLayout(config: AtelierConfig, layout: KitchenLayout): AtelierConfig | null {
  const prev = kitchenLayout(config);
  if (layout === prev) return null;
  let cols = config.columns.filter((c) => c.content !== "COLT");
  if (layout === "LINIAR") {
    const fitted = fitKitchen(cols, config.widthMm);
    if (!fitted) return null;
    const { legB: _legB, ...rest } = config.kitchen ?? { layout };
    void _legB;
    return { ...config, columns: fitted, kitchen: { ...rest, layout } };
  }
  let legB = config.kitchen?.legB;
  if (prev === "LINIAR" || !legB) {
    // the modules that no longer fit beside the corner unit move round the corner, onto the second wall
    const moved: AtelierColumn[] = [];
    const room = config.widthMm - CORNER_WIDTH_MM;
    while (cols.length > 1 && sum(cols) > room) {
      if (layout === "L_STANGA") moved.unshift(cols.shift()!);
      else moved.push(cols.pop()!);
    }
    if (moved.length === 0) legB = legB ?? defaultLegB(config.depthMm);
    else {
      const widthMm = clamp(Math.max(1800, Math.ceil((sum(moved) + config.depthMm) / 100) * 100), ...LEG_B_RANGE);
      const fittedB = fitKitchen(moved, widthMm - config.depthMm);
      if (!fittedB) return null;
      legB = { widthMm, columns: fittedB };
    }
  } else {
    // the second wall is listed as you face it: its corner end is on the right for L_STANGA, on the left for L_DREAPTA
    legB = { ...legB, columns: [...legB.columns].reverse() };
  }
  // the corner unit takes up what is left when the other modules cannot (90–120 cm)
  const rest = config.widthMm - sum(cols);
  const [cMin, cMax] = widthRange("COLT");
  const corner = kitchenColumn("COLT", rest >= cMin && rest <= cMax && !cols.some((c) => isFlex(c.content)) ? rest : CORNER_WIDTH_MM);
  cols = layout === "L_STANGA" ? [corner, ...cols] : [...cols, corner];
  const idx = layout === "L_STANGA" ? 0 : cols.length - 1;
  const fitted = fitKitchen(cols, config.widthMm, idx, idx);
  if (!fitted) return null;
  return { ...config, columns: fitted, kitchen: { ...config.kitchen, layout, legB } };
}
