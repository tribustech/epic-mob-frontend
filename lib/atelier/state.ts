import { doorFills, doorOpening, isDoorFill, normalizeDoors } from "./door-types";
import { cleanHandle, hasHandledFronts } from "./handles";
import { BARA_SERTARE_RANGE, BOTTOM_HEIGHT_RANGE, CATEGORY_RULES, POLITE_BARA_SHELVES, SERTARE_RANGE, SHELF_CONTENTS, categoryRules } from "./categories";
import type {
  AtelierCatalog,
  AtelierCategory,
  AtelierColumn,
  AtelierConfig,
  AtelierBottom,
  AtelierFronts,
  AtelierHandle,
  ColumnContent,
  DoorFill,
  KitchenLayout,
  RailPosition,
  UpperContent,
} from "./types.ts";
import {
  LEG_B_RANGE,
  drawerRangeOf,
  isKitchen,
  profileOf,
  cornerIndex,
  fitKitchen,
  isTall,
  kitchenColumn,
  kitchenLayout,
  legBModulesMm,
  widthRange,
  withLayout,
  withModule,
} from "./kitchen";
import type { PresetShape } from "./presets.ts";

/** Column limits are the same for every category (CATEGORY_RULES[*].column). */
export const MIN_COL_MM = CATEGORY_RULES.DRESSING.column[0];
export const MAX_COL_MM = CATEGORY_RULES.DRESSING.column[1];

export type AtelierAction =
  | { type: "setCategory"; category: AtelierCategory }
  | { type: "applyPreset"; shape: PresetShape }
  | { type: "applyPalette"; carcassMaterialId: string; fronts: AtelierFronts }
  | { type: "setSize"; widthMm?: number; heightMm?: number; depthMm?: number }
  | { type: "setColumnWidth"; index: number; widthMm: number; leg?: "B" }
  | { type: "setColumnContent"; index: number; content: ColumnContent; leg?: "B" }
  | { type: "setColumnDrawers"; index: number; drawers: number | undefined; leg?: "B" }
  | { type: "setColumnRail"; index: number; railPosition: RailPosition }
  | { type: "setColumnShelves"; index: number; shelves: number | undefined; leg?: "B" }
  | { type: "addColumn"; leg?: "B"; content?: ColumnContent }
  | { type: "removeColumn"; index: number; leg?: "B" }
  | { type: "equalizeColumns" }
  | { type: "setCarcass"; materialId: string }
  | { type: "setFronts"; fronts: AtelierFronts }
  | { type: "setLegs"; legsMm: AtelierConfig["legsMm"] }
  | { type: "setDoors"; doors: AtelierConfig["doors"]; handle?: AtelierHandle }
  | { type: "setHandle"; handle: AtelierHandle }
  /** the face of one door (sliding: the door; hinged: the column) */
  | { type: "setDoorFill"; index: number; fill: DoorFill }
  /** the face of every door at once, left to right (missing entries = panel) */
  | { type: "setDoorFills"; fills: DoorFill[] }
  /** which mirror / glass from the catalog; only the given keys change */
  | { type: "setDoorGlass"; mirrorId?: string; glassId?: string }
  | { type: "setColumnDoorRows"; index: number; doorRows: number }
  | { type: "setColumnDoorsAcross"; index: number; doorsAcross: number }
  | { type: "setBottom"; bottom: AtelierBottom }
  /* ── kitchens (the column actions above take `leg: "B"` for the second wall of an L) ── */
  | { type: "setKitchenLayout"; layout: KitchenLayout }
  | { type: "setLegB"; widthMm: number }
  | { type: "setColumnUpper"; index: number; upper: UpperContent; leg?: "B" }
  | { type: "setWorktop"; worktopId: string }
  | { type: "setLed"; led: boolean };

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
  if (isKitchen({ category })) {
    const p = profileOf({ category });
    const columns = defaults.columns!.map((c) => kitchenColumn(c, p.bath ? undefined : 600, p));
    return {
      category,
      widthMm: defaults.widthMm,
      heightMm: defaults.heightMm,
      depthMm: defaults.depthMm,
      columns: fitKitchen(columns, defaults.widthMm, null, -1, p) ?? columns,
      legsMm: defaults.legsMm,
      doors: { ...defaults.doors },
      kitchen: { layout: "LINIAR" as const },
    };
  }
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

/**
 * n equal columns for a total width, in whole centimetres where the total allows it; the
 * leftover millimetres go on the last column. Always sums to exactly total; null when n
 * columns of 30–120 cm cannot make it.
 */
export function evenWidths(total: number, n: number): number[] | null {
  if (n < 1 || total < n * MIN_COL_MM || total > n * MAX_COL_MM) return null;
  for (const base of [Math.floor(total / n / 10) * 10, Math.floor(total / n)]) {
    const last = total - base * (n - 1);
    if (base >= MIN_COL_MM && last <= MAX_COL_MM) return Array.from({ length: n }, (_, i) => (i === n - 1 ? last : base));
  }
  return fit(Array.from({ length: n }, () => Math.floor(total / n)), total);
}

/** Are these widths „all the same" (nobody set one by hand)? Equal within 2 mm, or exactly an even split. */
export function areEven(widths: number[]): boolean {
  if (widths.length <= 1) return true;
  if (Math.max(...widths) - Math.min(...widths) <= 2) return true;
  const even = evenWidths(sumOf(widths), widths.length);
  return !!even && even.every((w, i) => w === widths[i]);
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
  // equal columns stay equal (no 53,3 / 53,4 cm drift, no odd filler column after widening)
  const fitted = areEven(state.columns.map((c) => c.widthMm))
    ? evenWidths(widthMm, cols.length)
    : fit(cols.map((c) => c.widthMm), widthMm);
  if (!fitted) return state;
  return { ...state, widthMm, columns: withWidths(cols, fitted) };
}

/** Every change leaves the doors in their canonical form (see normalizeDoors). */
export function atelierReducer(state: AtelierConfig, action: AtelierAction): AtelierConfig {
  const next = reduce(state, action);
  if (next === state) return state;
  const doors = normalizeDoors(next);
  return doors === next.doors ? next : { ...next, doors };
}

function reduce(state: AtelierConfig, action: AtelierAction): AtelierConfig {
  const rules = categoryRules(state.category);
  if (isKitchen(state)) {
    const k = reduceKitchen(state, action);
    if (k !== undefined) return k;
  }
  switch (action.type) {
    case "setCategory": {
      if (action.category === state.category || !CATEGORY_RULES[action.category]) return state;
      // New category starts from its own defaults; the chosen materials stay.
      const next: AtelierConfig = { ...state, ...categoryDefaults(action.category) };
      delete next.handle;
      delete next.bottom;
      // the worktop and LED stay when coming back to a kitchen in the same visit
      if (!isKitchen(action)) delete next.kitchen;
      else if (state.kitchen?.worktopId) next.kitchen = { ...next.kitchen!, worktopId: state.kitchen.worktopId };
      return next;
    }
    case "applyPreset": {
      // A ready-made model: its whole shape replaces the current one; the colours stay.
      const shape = action.shape;
      if (!CATEGORY_RULES[shape.category] || shape.columns.length === 0) return state;
      const next: AtelierConfig = {
        ...shape,
        columns: shape.columns.map((c) => ({ ...c })),
        doors: { ...shape.doors, ...(shape.doors.fills ? { fills: [...shape.doors.fills] } : {}) },
        carcassMaterialId: state.carcassMaterialId,
        fronts: state.fronts,
      };
      if (shape.bottom) next.bottom = { ...shape.bottom };
      delete next.kitchen;
      if (shape.kitchen) {
        next.kitchen = { ...shape.kitchen, ...(shape.kitchen.legB ? { legB: { ...shape.kitchen.legB, columns: shape.kitchen.legB.columns.map((c) => ({ ...c })) } } : {}) };
        // the client's worktop stays (the preset's is only a suggestion when none was chosen yet)
        const worktopId = state.kitchen?.worktopId ?? shape.kitchen.worktopId;
        if (worktopId) next.kitchen.worktopId = worktopId;
        else delete next.kitchen.worktopId;
      }
      const handle = cleanHandle(shape.handle);
      if (handle && hasHandledFronts(next)) next.handle = handle;
      return next;
    }
    case "applyPalette":
      return { ...state, carcassMaterialId: action.carcassMaterialId, fronts: { ...action.fronts } };
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
      if (!col || (col.content !== "SERTARE" && col.content !== "BARA_SERTARE")) return state;
      const range = col.content === "SERTARE" ? SERTARE_RANGE : BARA_SERTARE_RANGE;
      const next: AtelierColumn = { ...col };
      delete next.drawers;
      if (drawers !== undefined && Number.isFinite(drawers))
        next.drawers = clamp(Math.round(drawers), ...range) as AtelierColumn["drawers"];
      return { ...state, columns: state.columns.map((c, i) => (i === index ? next : c)) };
    }
    case "setColumnRail": {
      const { index, railPosition } = action;
      const col = state.columns[index];
      if (!col || col.content !== "POLITE_BARA" || (railPosition !== "SUS" && railPosition !== "JOS")) return state;
      return { ...state, columns: state.columns.map((c, i) => (i === index ? { ...c, railPosition } : c)) };
    }
    case "setColumnShelves": {
      const { index, shelves } = action;
      const col = state.columns[index];
      if (!col || (col.content !== "POLITE_BARA" && !SHELF_CONTENTS.has(col.content))) return state;
      const next: AtelierColumn = { ...col };
      delete next.shelves;
      const range: [number, number] = col.content === "POLITE_BARA" ? [...POLITE_BARA_SHELVES] : [0, 6];
      if (shelves !== undefined && Number.isFinite(shelves)) next.shelves = clamp(Math.round(shelves), ...range);
      return { ...state, columns: state.columns.map((c, i) => (i === index ? next : c)) };
    }
    case "addColumn": {
      // equal columns: make room for one more and keep them equal (3 × 100 → 4 × 75)
      const even = areEven(state.columns.map((c) => c.widthMm)) ? evenWidths(state.widthMm, state.columns.length + 1) : null;
      if (even) return { ...state, columns: withWidths([...state.columns, { widthMm: 0, content: rules.fill }], even) };
      const cols = splitWidest(state.columns, rules.fill);
      if (!cols) return state;
      // hinged doors with their own faces: the new half takes the face of the column it was cut from
      const fills = state.doors.fills && doorOpening(state.doors.type) === "BATANTE" ? doorFills(state) : null;
      if (!fills) return { ...state, columns: cols };
      const at = cols.findIndex((c, i) => c !== state.columns[i]);
      fills.splice(at, 0, fills[at] ?? "PANOU");
      return { ...state, columns: cols, doors: { ...state.doors, fills } };
    }
    case "equalizeColumns": {
      const even = evenWidths(state.widthMm, state.columns.length);
      return even && even.some((w, i) => w !== state.columns[i].widthMm) ? { ...state, columns: withWidths(state.columns, even) } : state;
    }
    case "removeColumn": {
      const { index } = action;
      if (state.columns.length <= 1 || index < 0 || index >= state.columns.length) return state;
      const rest = state.columns.filter((_, i) => i !== index);
      const widths = rest.map((c) => c.widthMm);
      const fitted = (Math.max(...widths) - Math.min(...widths) <= 20 ? evenWidths(state.widthMm, rest.length) : null) ?? fit(widths, state.widthMm);
      if (!fitted) return state;
      const next: AtelierConfig = { ...state, columns: withWidths(rest, fitted) };
      // hinged doors with their own faces: the removed column takes its face with it
      if (state.doors.fills && doorOpening(state.doors.type) === "BATANTE")
        next.doors = { ...state.doors, fills: doorFills(state).filter((_, i) => i !== index) };
      return next;
    }
    case "setCarcass":
      return { ...state, carcassMaterialId: action.materialId };
    case "setFronts":
      return { ...state, fronts: action.fronts };
    case "setLegs":
      return rules.legs.includes(action.legsMm) ? { ...state, legsMm: action.legsMm } : state;
    case "setDoors": {
      if (!rules.slidingDoors) return state;
      const next: AtelierConfig = { ...state, doors: action.doors };
      // the handle belongs to hinged doors only; keep the last choice while switching between them
      const handle = cleanHandle(action.handle) ?? state.handle;
      if (action.doors.type.startsWith("BATANTE") && handle) next.handle = handle;
      else delete next.handle;
      return next;
    }
    case "setHandle": {
      // every front can take a handle (doors and drawers); open separators and open / sliding wardrobes have none
      const handle = cleanHandle(action.handle);
      if (!handle || !hasHandledFronts(state)) return state;
      // the colour stays while the client tries other types that have one
      if (handle.finish === undefined && state.handle?.finish && cleanHandle({ type: handle.type, finish: state.handle.finish })?.finish)
        handle.finish = state.handle.finish;
      return { ...state, handle };
    }
    case "setDoorFill": {
      const fills = doorFills(state);
      const { index, fill } = action;
      if (!Number.isInteger(index) || index < 0 || index >= fills.length || !isDoorFill(fill) || fills[index] === fill) return state;
      fills[index] = fill;
      return { ...state, doors: normalizeDoors(state, fills) };
    }
    case "setDoorFills": {
      if (doorOpening(state.doors.type) === "NONE" || !Array.isArray(action.fills)) return state;
      return { ...state, doors: normalizeDoors(state, action.fills.filter(isDoorFill)) };
    }
    case "setDoorGlass": {
      if (doorOpening(state.doors.type) === "NONE") return state;
      const doors = { ...state.doors };
      if (typeof action.mirrorId === "string" && action.mirrorId) doors.mirrorId = action.mirrorId;
      if (typeof action.glassId === "string" && action.glassId) doors.glassId = action.glassId;
      return { ...state, doors };
    }
    case "setBottom": {
      if (state.category !== "SEPARATOR") return state;
      const b = action.bottom;
      if (b.type === "NONE") {
        const next: AtelierConfig = { ...state };
        delete next.bottom;
        return next;
      }
      const bottom: AtelierBottom = { type: b.type === "USI" ? "USI" : "SERTARE" };
      if (b.heightMm !== undefined && Number.isFinite(b.heightMm))
        bottom.heightMm = clamp(Math.round(b.heightMm), ...BOTTOM_HEIGHT_RANGE);
      if (bottom.type === "SERTARE" && (b.drawers === 1 || b.drawers === 3)) bottom.drawers = b.drawers;
      if (bottom.type === "USI" && b.shelves !== undefined && Number.isFinite(b.shelves))
        bottom.shelves = clamp(Math.round(b.shelves), 0, 4);
      return { ...state, bottom };
    }
    case "setColumnDoorsAcross": {
      const col = state.columns[action.index];
      if (!col) return state;
      const next: AtelierColumn = { ...col };
      if (action.doorsAcross === 2) next.doorsAcross = 2;
      else delete next.doorsAcross;
      return { ...state, columns: state.columns.map((c, i) => (i === action.index ? next : c)) };
    }
    case "setColumnDoorRows": {
      const { index } = action;
      const col = state.columns[index];
      if (!col || !Number.isFinite(action.doorRows)) return state;
      const rows = clamp(Math.round(action.doorRows), 1, 3);
      const next: AtelierColumn = { ...col };
      if (rows === 1) delete next.doorRows;
      else next.doorRows = rows as AtelierColumn["doorRows"];
      return { ...state, columns: state.columns.map((c, i) => (i === index ? next : c)) };
    }
    case "setKitchenLayout":
    case "setLegB":
    case "setColumnUpper":
    case "setWorktop":
    case "setLed":
      return state;
  }
}

/* ── kitchens ── */

/** One wall of a kitchen as a column list: its modules, their total and the corner unit's index. */
function wallOf(state: AtelierConfig, leg: "B" | undefined) {
  if (leg === "B") {
    const b = state.kitchen?.legB;
    return b ? { columns: b.columns, total: legBModulesMm(state), corner: -1 } : null;
  }
  return { columns: state.columns, total: state.widthMm, corner: cornerIndex(kitchenLayout(state), state.columns.length) };
}

function withWall(state: AtelierConfig, leg: "B" | undefined, columns: AtelierColumn[]): AtelierConfig {
  if (leg !== "B") return { ...state, columns };
  return { ...state, kitchen: { ...state.kitchen!, legB: { ...state.kitchen!.legB!, columns } } };
}

/**
 * The kitchen's own handling of the column / size actions (module widths follow the module type, the corner
 * unit stays put, the second wall of an L). undefined = the action is handled like for any other furniture.
 */
function reduceKitchen(state: AtelierConfig, action: AtelierAction): AtelierConfig | undefined {
  const leg = "leg" in action ? action.leg : undefined;
  const wall = wallOf(state, leg);
  const p = profileOf(state);
  const rules = categoryRules(state.category);
  switch (action.type) {
    case "setKitchenLayout":
      if (p.bath) return state;
      return withLayout(state, action.layout) ?? state;
    case "setLegB": {
      const b = state.kitchen?.legB;
      if (!b || !Number.isFinite(action.widthMm)) return state;
      const w = clamp(Math.round(action.widthMm), ...LEG_B_RANGE);
      const fitted = fitKitchen(b.columns, w - state.depthMm);
      return fitted ? { ...state, kitchen: { ...state.kitchen!, legB: { widthMm: w, columns: fitted } } } : state;
    }
    case "setWorktop":
      return action.worktopId ? { ...state, kitchen: { layout: "LINIAR", ...state.kitchen, worktopId: action.worktopId } } : state;
    case "setLed":
      return { ...state, kitchen: { layout: "LINIAR", ...state.kitchen, led: action.led } };
    case "setSize": {
      let next = state;
      if (action.heightMm !== undefined && Number.isFinite(action.heightMm)) next = { ...next, heightMm: clamp(Math.round(action.heightMm), ...rules.height) };
      if (action.depthMm !== undefined && Number.isFinite(action.depthMm)) {
        const depthMm = clamp(Math.round(action.depthMm), ...rules.depth);
        // the second wall keeps its length; its modules give or take the corner's change
        const b = next.kitchen?.legB;
        const legCols = b ? fitKitchen(b.columns, b.widthMm - depthMm) : null;
        if (b && !legCols) return next;
        next = { ...next, depthMm, ...(b && legCols ? { kitchen: { ...next.kitchen!, legB: { ...b, columns: legCols } } } : {}) };
      }
      if (action.widthMm !== undefined && Number.isFinite(action.widthMm)) {
        const w = clamp(Math.round(action.widthMm), ...rules.width);
        const corner = cornerIndex(kitchenLayout(next), next.columns.length);
        const fitted = w === next.widthMm ? next.columns : fitKitchen(next.columns, w, corner >= 0 ? corner : null, corner, p);
        if (fitted) next = { ...next, widthMm: w, columns: fitted };
      }
      return next;
    }
    case "setColumnWidth": {
      const col = wall?.columns[action.index];
      if (!wall || !col || !Number.isFinite(action.widthMm)) return state;
      const w = clamp(Math.round(action.widthMm), ...widthRange(col.content, p));
      const cols = wall.columns.map((c, i) => (i === action.index ? { ...c, widthMm: w } : c));
      const fitted = fitKitchen(cols, wall.total, action.index, wall.corner, p);
      return fitted ? withWall(state, leg, fitted) : state;
    }
    case "setColumnContent": {
      if (!wall || !p.modules.includes(action.content)) return state;
      if (wall.columns[action.index]?.content === action.content) return state;
      const cols = withModule(wall.columns, wall.total, action.index, action.content, wall.corner, p);
      return cols ? withWall(state, leg, cols) : state;
    }
    case "setColumnDrawers": {
      const col = wall?.columns[action.index];
      const range = col ? drawerRangeOf(col.content) : null;
      if (!wall || !col || !range) return state;
      const next: AtelierColumn = { ...col };
      delete next.drawers;
      if (action.drawers !== undefined && Number.isFinite(action.drawers))
        next.drawers = clamp(Math.round(action.drawers), ...range) as AtelierColumn["drawers"];
      return withWall(state, leg, wall.columns.map((c, i) => (i === action.index ? next : c)));
    }
    case "setColumnShelves":
      return state;
    case "setColumnUpper": {
      const col = wall?.columns[action.index];
      if (!wall || !col || isTall(col.content) || !p.uppers.includes(action.upper)) return state;
      return withWall(state, leg, wall.columns.map((c, i) => (i === action.index ? { ...c, upper: action.upper } : c)));
    }
    case "addColumn": {
      if (!wall) return state;
      const content = action.content && p.modules.includes(action.content) ? action.content : "SERTARE";
      const at = wall.corner === wall.columns.length - 1 ? wall.columns.length - 1 : wall.columns.length;
      const cols = [...wall.columns];
      cols.splice(at, 0, kitchenColumn(content, undefined, p));
      const fitted = fitKitchen(cols, wall.total, at, wall.corner === at ? at + 1 : wall.corner, p);
      return fitted && fitted.length === cols.length ? withWall(state, leg, fitted) : state;
    }
    case "removeColumn": {
      if (!wall || wall.columns.length <= 1 || action.index === wall.corner || !wall.columns[action.index]) return state;
      const cols = wall.columns.filter((_, i) => i !== action.index);
      const corner = wall.corner > action.index ? wall.corner - 1 : wall.corner;
      const fitted = fitKitchen(cols, wall.total, null, corner, p);
      return fitted && fitted.length === cols.length ? withWall(state, leg, fitted) : state;
    }
    case "equalizeColumns":
    case "setColumnRail":
    case "setColumnDoorRows":
    case "setColumnDoorsAcross":
    case "setDoors":
    case "setDoorFill":
    case "setDoorFills":
    case "setDoorGlass":
    case "setBottom":
      return state;
    default:
      return undefined;
  }
}
