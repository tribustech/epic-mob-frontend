import { CATEGORY_RULES, SERTARE_RANGE, categoryRules } from "./categories";
import type {
  AtelierCatalog,
  AtelierCategory,
  AtelierColumn,
  AtelierConfig,
  AtelierFronts,
  ColumnContent,
} from "./types.ts";

/** Column limits are the same for every category (CATEGORY_RULES[*].column). */
export const MIN_COL_MM = CATEGORY_RULES.DRESSING.column[0];
export const MAX_COL_MM = CATEGORY_RULES.DRESSING.column[1];

export type AtelierAction =
  | { type: "setCategory"; category: AtelierCategory }
  | { type: "setSize"; widthMm?: number; heightMm?: number; depthMm?: number }
  | { type: "setColumnWidth"; index: number; widthMm: number }
  | { type: "setColumnContent"; index: number; content: ColumnContent }
  | { type: "setColumnDrawers"; index: number; drawers: number | undefined }
  | { type: "addColumn" }
  | { type: "removeColumn"; index: number }
  | { type: "setCarcass"; materialId: string }
  | { type: "setFronts"; fronts: AtelierFronts }
  | { type: "setLegs"; legsMm: AtelierConfig["legsMm"] }
  | { type: "setDoors"; doors: AtelierConfig["doors"] };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const sumOf = (a: number[]) => a.reduce((x, y) => x + y, 0);

/** Splits widthMm into equal columns (floor), remainder on the last. */
function splitEven(widthMm: number, n: number): number[] {
  const base = Math.floor(widthMm / n);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? widthMm - base * (n - 1) : base));
}

/** Dressing: n = max(1, ceil(w/1000)) equal columns (floor), remainder on the last; alternating BARA/POLITE. */
export function defaultColumns(widthMm: number): AtelierColumn[] {
  const n = Math.max(1, Math.ceil(widthMm / 1000));
  return splitEven(widthMm, n).map((w, i) => ({
    widthMm: w,
    content: i % 2 === 0 ? ("BARA" as const) : ("POLITE" as const),
  }));
}

function categoryDefaults(category: AtelierCategory) {
  const { defaults } = categoryRules(category);
  const columns = defaults.columns
    ? splitEven(defaults.widthMm, defaults.columns.length).map((widthMm, i) => ({
        widthMm,
        content: defaults.columns![i],
      }))
    : defaultColumns(defaults.widthMm);
  return {
    category,
    widthMm: defaults.widthMm,
    heightMm: defaults.heightMm,
    depthMm: defaults.depthMm,
    columns,
    legsMm: defaults.legsMm,
    doors: { ...defaults.doors },
  };
}

export function defaultConfig(catalog: AtelierCatalog, category: AtelierCategory = "DRESSING"): AtelierConfig {
  const carcassId = catalog.carcass[0]?.id ?? "";
  const frontId = catalog.fronts.PAL[0]?.id ?? carcassId;
  return {
    ...categoryDefaults(category),
    carcassMaterialId: carcassId,
    fronts: { kind: "PAL", materialId: frontId },
  };
}

/**
 * Scale widths proportionally to total (integer mm, remainder on the last
 * entry), clamp each to 300-1200, then spread any leftover difference over the
 * entries that still have room. Returns null when total is unreachable.
 */
function fit(widths: number[], total: number): number[] | null {
  const n = widths.length;
  if (n === 0 || total < n * MIN_COL_MM || total > n * MAX_COL_MM) return null;
  const cur = sumOf(widths) || n;
  const out = widths.map((w) => Math.round(((w || 1) * total) / cur));
  out[n - 1] = total - sumOf(out.slice(0, n - 1));
  for (let i = 0; i < n; i++) out[i] = clamp(out[i], MIN_COL_MM, MAX_COL_MM);
  let diff = total - sumOf(out);
  while (diff !== 0) {
    const dir = diff > 0 ? 1 : -1;
    const open = out
      .map((_, i) => i)
      .filter((i) => (dir > 0 ? out[i] < MAX_COL_MM : out[i] > MIN_COL_MM));
    if (open.length === 0) return null;
    const share = Math.max(1, Math.floor(Math.abs(diff) / open.length));
    for (const i of open) {
      if (diff === 0) break;
      const room = dir > 0 ? MAX_COL_MM - out[i] : out[i] - MIN_COL_MM;
      const step = Math.min(share, room, Math.abs(diff));
      out[i] += dir * step;
      diff -= dir * step;
    }
  }
  return out;
}

function withWidths(cols: AtelierColumn[], w: number[]): AtelierColumn[] {
  return cols.map((c, i) => ({ ...c, widthMm: w[i] }));
}

function splitWidest(cols: AtelierColumn[], fill: ColumnContent): AtelierColumn[] | null {
  let idx = 0;
  cols.forEach((c, i) => {
    if (c.widthMm > cols[idx].widthMm) idx = i;
  });
  const w = cols[idx].widthMm;
  if (w < 2 * MIN_COL_MM) return null;
  const left = Math.floor(w / 2);
  const next = [...cols];
  next.splice(idx, 1, { ...cols[idx], widthMm: left }, { widthMm: w - left, content: fill });
  return next;
}

function resize(state: AtelierConfig, widthMm: number): AtelierConfig {
  const { fill } = categoryRules(state.category);
  let cols = state.columns;
  const minN = Math.ceil(widthMm / MAX_COL_MM);
  const maxN = Math.max(1, Math.floor(widthMm / MIN_COL_MM));
  if (cols.length < minN) {
    // Add filler columns weighted at the target average; fit() then rescales
    // everything to the new total, so narrow columns can still grow.
    const avg = Math.round(widthMm / minN);
    cols = [...cols, ...Array.from({ length: minN - cols.length }, () => ({ widthMm: avg, content: fill }))];
  }
  if (cols.length > maxN) cols = cols.slice(0, maxN);
  const fitted = fit(cols.map((c) => c.widthMm), widthMm);
  if (!fitted) return state;
  return { ...state, widthMm, columns: withWidths(cols, fitted) };
}

export function atelierReducer(state: AtelierConfig, action: AtelierAction): AtelierConfig {
  const rules = categoryRules(state.category);
  switch (action.type) {
    case "setCategory": {
      if (action.category === state.category || !CATEGORY_RULES[action.category]) return state;
      // New category starts from its own defaults; the chosen materials stay.
      return { ...state, ...categoryDefaults(action.category) };
    }
    case "setSize": {
      let next = state;
      if (action.heightMm !== undefined && Number.isFinite(action.heightMm))
        next = { ...next, heightMm: clamp(Math.round(action.heightMm), ...rules.height) };
      if (action.depthMm !== undefined && Number.isFinite(action.depthMm))
        next = { ...next, depthMm: clamp(Math.round(action.depthMm), ...rules.depth) };
      if (action.widthMm !== undefined && Number.isFinite(action.widthMm)) {
        const w = clamp(Math.round(action.widthMm), Math.max(MIN_COL_MM, rules.width[0]), rules.width[1]);
        if (w !== next.widthMm) next = resize(next, w);
      }
      return next;
    }
    case "setColumnWidth": {
      const { index } = action;
      const n = state.columns.length;
      if (n <= 1 || index < 0 || index >= n || !Number.isFinite(action.widthMm)) return state;
      const total = state.widthMm;
      const lo = Math.max(MIN_COL_MM, total - MAX_COL_MM * (n - 1));
      const hi = Math.min(MAX_COL_MM, total - MIN_COL_MM * (n - 1));
      if (lo > hi) return state;
      const w = clamp(Math.round(action.widthMm), lo, hi);
      const others = state.columns.map((c) => c.widthMm).filter((_, i) => i !== index);
      const fitted = fit(others, total - w);
      if (!fitted) return state;
      let k = 0;
      const widths = state.columns.map((_, i) => (i === index ? w : fitted[k++]));
      return { ...state, columns: withWidths(state.columns, widths) };
    }
    case "setColumnContent": {
      const { index, content } = action;
      if (index < 0 || index >= state.columns.length || !rules.contents.includes(content)) return state;
      const columns = state.columns.map((c, i) => {
        if (i !== index) return c;
        const next: AtelierColumn = { widthMm: c.widthMm, content };
        if (content === "BARA_SERTARE") next.drawers = 2;
        return next;
      });
      return { ...state, columns };
    }
    case "setColumnDrawers": {
      const { index, drawers } = action;
      const col = state.columns[index];
      if (!col || col.content !== "SERTARE") return state;
      const next: AtelierColumn = { widthMm: col.widthMm, content: col.content };
      if (col.shelves !== undefined) next.shelves = col.shelves;
      if (drawers !== undefined && Number.isFinite(drawers))
        next.drawers = clamp(Math.round(drawers), ...SERTARE_RANGE) as AtelierColumn["drawers"];
      return { ...state, columns: state.columns.map((c, i) => (i === index ? next : c)) };
    }
    case "addColumn": {
      const cols = splitWidest(state.columns, rules.fill);
      return cols ? { ...state, columns: cols } : state;
    }
    case "removeColumn": {
      const { index } = action;
      if (state.columns.length <= 1 || index < 0 || index >= state.columns.length) return state;
      const rest = state.columns.filter((_, i) => i !== index);
      const fitted = fit(rest.map((c) => c.widthMm), state.widthMm);
      if (!fitted) return state;
      return { ...state, columns: withWidths(rest, fitted) };
    }
    case "setCarcass":
      return { ...state, carcassMaterialId: action.materialId };
    case "setFronts":
      return { ...state, fronts: action.fronts };
    case "setLegs":
      return rules.legs.includes(action.legsMm) ? { ...state, legsMm: action.legsMm } : state;
    case "setDoors":
      return rules.slidingDoors ? { ...state, doors: action.doors } : state;
  }
}
