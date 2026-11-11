import type {
  AtelierCatalog,
  AtelierColumn,
  AtelierConfig,
  AtelierFronts,
  ColumnContent,
} from "./types.ts";

export const MIN_COL_MM = 300;
export const MAX_COL_MM = 1200;

export type AtelierAction =
  | { type: "setSize"; widthMm?: number; heightMm?: number; depthMm?: number }
  | { type: "setColumnWidth"; index: number; widthMm: number }
  | { type: "setColumnContent"; index: number; content: ColumnContent }
  | { type: "addColumn" }
  | { type: "removeColumn"; index: number }
  | { type: "setCarcass"; materialId: string }
  | { type: "setFronts"; fronts: AtelierFronts }
  | { type: "setLegs"; legsMm: 100 | 150 }
  | { type: "setDoors"; doors: AtelierConfig["doors"] };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const sumOf = (a: number[]) => a.reduce((x, y) => x + y, 0);

/** n = max(1, ceil(w/1000)) equal columns (floor), remainder on the last; alternating BARA/POLITE. */
export function defaultColumns(widthMm: number): AtelierColumn[] {
  const n = Math.max(1, Math.ceil(widthMm / 1000));
  const base = Math.floor(widthMm / n);
  return Array.from({ length: n }, (_, i) => ({
    widthMm: i === n - 1 ? widthMm - base * (n - 1) : base,
    content: i % 2 === 0 ? ("BARA" as const) : ("POLITE" as const),
  }));
}

export function defaultConfig(catalog: AtelierCatalog): AtelierConfig {
  const carcassId = catalog.carcass[0]?.id ?? "";
  const frontId = catalog.fronts.PAL[0]?.id ?? carcassId;
  return {
    category: "DRESSING",
    widthMm: 2400,
    heightMm: 2600,
    depthMm: 600,
    columns: defaultColumns(2400),
    carcassMaterialId: carcassId,
    fronts: { kind: "PAL", materialId: frontId },
    legsMm: 100,
    doors: { type: "GLISANTE" },
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

function splitWidest(cols: AtelierColumn[]): AtelierColumn[] | null {
  let idx = 0;
  cols.forEach((c, i) => {
    if (c.widthMm > cols[idx].widthMm) idx = i;
  });
  const w = cols[idx].widthMm;
  if (w < 2 * MIN_COL_MM) return null;
  const left = Math.floor(w / 2);
  const next = [...cols];
  next.splice(idx, 1, { ...cols[idx], widthMm: left }, { widthMm: w - left, content: "POLITE" });
  return next;
}

function resize(state: AtelierConfig, widthMm: number): AtelierConfig {
  let cols = state.columns;
  const minN = Math.ceil(widthMm / MAX_COL_MM);
  const maxN = Math.max(1, Math.floor(widthMm / MIN_COL_MM));
  if (cols.length < minN) {
    // Add POLITE columns weighted at the target average; fit() then rescales
    // everything to the new total, so narrow columns can still grow.
    const avg = Math.round(widthMm / minN);
    cols = [
      ...cols,
      ...Array.from({ length: minN - cols.length }, () => ({ widthMm: avg, content: "POLITE" as const })),
    ];
  }
  if (cols.length > maxN) cols = cols.slice(0, maxN);
  const fitted = fit(cols.map((c) => c.widthMm), widthMm);
  if (!fitted) return state;
  return { ...state, widthMm, columns: withWidths(cols, fitted) };
}

export function atelierReducer(state: AtelierConfig, action: AtelierAction): AtelierConfig {
  switch (action.type) {
    case "setSize": {
      let next = state;
      if (action.heightMm !== undefined && Number.isFinite(action.heightMm))
        next = { ...next, heightMm: Math.round(action.heightMm) };
      if (action.depthMm !== undefined && Number.isFinite(action.depthMm))
        next = { ...next, depthMm: Math.round(action.depthMm) };
      if (action.widthMm !== undefined && Number.isFinite(action.widthMm)) {
        const w = Math.max(MIN_COL_MM, Math.round(action.widthMm));
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
      if (index < 0 || index >= state.columns.length) return state;
      const columns = state.columns.map((c, i) => {
        if (i !== index) return c;
        const next: AtelierColumn = { widthMm: c.widthMm, content };
        if (content === "BARA_SERTARE") next.drawers = 2;
        return next;
      });
      return { ...state, columns };
    }
    case "addColumn": {
      const cols = splitWidest(state.columns);
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
      return { ...state, legsMm: action.legsMm };
    case "setDoors":
      return { ...state, doors: action.doors };
  }
}
