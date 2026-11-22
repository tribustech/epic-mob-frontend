import { BOTTOM_HEIGHT_RANGE, CATEGORY_ORDER, CATEGORY_RULES } from "./categories";
import { partialDrawersAvailable } from "./drawers";
import { doorOpening, isDoorFill, normalizeDoors } from "./door-types";
import { HANDLE_FINISHES, HANDLE_KINDS, cleanHandle } from "./handles";
import type {
  AtelierBottom,
  AtelierCatalog,
  AtelierColumn,
  AtelierConfig,
  AtelierDoors,
  AtelierFronts,
  ColumnContent,
  DoorFill,
  DoorType,
  FrontKind,
  KitchenLayout,
  UpperContent,
} from "./types.ts";
import { LEG_B_RANGE, isBath, isKitchen } from "./kitchen";

/**
 * „Trimite configurația": the whole configuration in a short, URL-safe code (`/configurator?c=…`).
 * The code comes back from the outside world, so decoding trusts nothing: it is rebuilt field by
 * field (parseConfig) against today's rules and catalog, and anything odd gives null.
 */

export const SHARE_PARAM = "c";
/** A real code is 150–400 characters; anything much longer is not ours. */
const MAX_CODE_LENGTH = 4000;
const VERSION = 1;

const CONTENTS: readonly ColumnContent[] = [
  "POLITE", "BARA", "BARA_DUBLA", "POLITE_BARA", "BARA_SERTARE", "SERTARE", "USI", "DESCHIS", "USA_RIDICABILA",
  "CHIUVETA", "CUPTOR", "MASINA_VASE", "FRIGIDER", "COLOANA_CUPTOR", "COLOANA", "COLT", "PLITA", "LAVOAR", "MASINA_SPALAT",
];
const UPPERS: readonly UpperContent[] = ["USI", "RIDICABILA", "DESCHIS", "HOTA", "NONE", "OGLINDA"];
const LAYOUTS: readonly KitchenLayout[] = ["LINIAR", "L_STANGA", "L_DREAPTA"];
const DOOR_TYPES: readonly DoorType[] = [
  "NONE", "GLISANTE", "GLISANTE_OGLINDA", "GLISANTE_STICLA", "BATANTE", "BATANTE_OGLINDA", "BATANTE_STICLA",
];
const FRONT_KINDS: readonly FrontKind[] = ["PAL", "MDF_MELAMINAT", "MDF_VOPSIT"];
const BOTTOM_TYPES = ["SERTARE", "USI"] as const;
const FILL_CODE: Record<DoorFill, string> = { PANOU: "P", OGLINDA: "O", STICLA: "S" };

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);
const intIn = (v: unknown, lo: number, hi: number): v is number => isInt(v) && v >= lo && v <= hi;
const isId = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 120;
const own = <T extends object>(obj: T, key: PropertyKey): key is keyof T => Object.prototype.hasOwnProperty.call(obj, key);

/* ── strict validation ── */

/**
 * An untrusted object → a configuration with only the fields we know, each checked against the
 * category rules and the catalog. null when the essentials do not hold (unknown category, sizes
 * outside the limits, columns that do not add up, colours the catalog no longer has); optional
 * details that do not check out (an unknown handle, a mirror type that is gone) are simply left out.
 */
export function parseConfig(raw: unknown, catalog: AtelierCatalog): AtelierConfig | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.category !== "string" || !own(CATEGORY_RULES, c.category)) return null;
  const category = c.category;
  const rules = CATEGORY_RULES[category];
  if (!intIn(c.widthMm, ...rules.width) || !intIn(c.heightMm, ...rules.height) || !intIn(c.depthMm, ...rules.depth)) return null;
  if (!isInt(c.legsMm) || !(rules.legs as readonly number[]).includes(c.legsMm)) return null;

  const parseColumns = (list: unknown, total: number): AtelierColumn[] | null => {
    if (!Array.isArray(list) || list.length === 0 || list.length > 30) return null;
    const out: AtelierColumn[] = [];
    for (const item of list as unknown[]) {
      if (!item || typeof item !== "object") return null;
      const col = item as Record<string, unknown>;
      if (!intIn(col.widthMm, 1, 10_000) || !rules.contents.includes(col.content as ColumnContent)) return null;
      const next: AtelierColumn = { widthMm: col.widthMm, content: col.content as ColumnContent };
      if (intIn(col.shelves, 0, 15)) next.shelves = col.shelves;
      if (intIn(col.drawers, 1, 6)) next.drawers = col.drawers as AtelierColumn["drawers"];
      if (col.railPosition === "SUS" || col.railPosition === "JOS") next.railPosition = col.railPosition;
      if (col.doorRows === 2 || col.doorRows === 3) next.doorRows = col.doorRows;
      if (col.doorsAcross === 2) next.doorsAcross = 2;
      if (isKitchen({ category }) && UPPERS.includes(col.upper as UpperContent)) next.upper = col.upper as UpperContent;
      out.push(next);
    }
    return out.reduce((sum, col) => sum + col.widthMm, 0) === total ? out : null;
  };
  const columns = parseColumns(c.columns, c.widthMm);
  if (!columns) return null;

  if (!c.doors || typeof c.doors !== "object") return null;
  const d = c.doors as Record<string, unknown>;
  if (!DOOR_TYPES.includes(d.type as DoorType)) return null;
  if (!rules.slidingDoors && d.type !== "NONE") return null;
  let doors: AtelierDoors = { type: d.type as DoorType };
  const opening = doorOpening(doors.type);
  if (opening === "GLISANTE" && intIn(d.count, 2, 6)) doors.count = d.count;
  if (opening !== "NONE") {
    if (Array.isArray(d.fills) && d.fills.length <= 30 && d.fills.every(isDoorFill)) doors.fills = [...(d.fills as DoorFill[])];
    if (isId(d.mirrorId) && catalog.glass?.mirrors.some((g) => g.id === d.mirrorId)) doors.mirrorId = d.mirrorId;
    if (isId(d.glassId) && catalog.glass?.glasses.some((g) => g.id === d.glassId)) doors.glassId = d.glassId;
  }

  if (!isId(c.carcassMaterialId) || !catalog.carcass.some((m) => m.id === c.carcassMaterialId)) return null;
  if (!c.fronts || typeof c.fronts !== "object") return null;
  const f = c.fronts as Record<string, unknown>;
  let fronts: AtelierFronts;
  if (f.kind === "MDF_VOPSIT") {
    if (!catalog.ral.some((r) => r.code === f.ralCode) || !catalog.fronts.MDF_VOPSIT.some((m) => m.id === f.modelId)) return null;
    fronts = { kind: "MDF_VOPSIT", modelId: f.modelId as string, ralCode: f.ralCode as string };
    if (f.faces === 1 || f.faces === 2) fronts.faces = f.faces;
  } else if (f.kind === "PAL" || f.kind === "MDF_MELAMINAT") {
    const kind = f.kind;
    if (!catalog.fronts[kind].some((m) => m.id === f.materialId)) return null;
    fronts = { kind, materialId: f.materialId as string };
  } else return null;

  const config: AtelierConfig = {
    category,
    widthMm: c.widthMm,
    heightMm: c.heightMm,
    depthMm: c.depthMm,
    columns,
    carcassMaterialId: c.carcassMaterialId,
    fronts,
    legsMm: c.legsMm as AtelierConfig["legsMm"],
    doors,
  };
  doors = normalizeDoors(config);
  config.doors = doors;

  if (c.bottom !== undefined) {
    if (category !== "SEPARATOR" || !c.bottom || typeof c.bottom !== "object") return null;
    const b = c.bottom as Record<string, unknown>;
    if (b.type === "SERTARE" || b.type === "USI") {
      const bottom: AtelierBottom = { type: b.type };
      if (intIn(b.heightMm, ...BOTTOM_HEIGHT_RANGE)) bottom.heightMm = b.heightMm;
      if (b.type === "SERTARE" && intIn(b.drawers, 1, 3)) bottom.drawers = b.drawers as AtelierBottom["drawers"];
      if (b.type === "USI" && intIn(b.shelves, 0, 4)) bottom.shelves = b.shelves;
      config.bottom = bottom;
    } else if (b.type !== "NONE") return null;
  }

  const handle = cleanHandle(c.handle as { type?: unknown; finish?: unknown } | undefined);
  if (handle && (catalog.handles?.types ?? []).some((t) => t.type === handle.type)) config.handle = handle;

  if (c.drawerExtension === "PARTIALA" && partialDrawersAvailable(catalog)) config.drawerExtension = "PARTIALA";

  if (isKitchen({ category })) {
    const k = (c.kitchen && typeof c.kitchen === "object" ? c.kitchen : {}) as Record<string, unknown>;
    const layout = !isBath({ category }) && LAYOUTS.includes(k.layout as KitchenLayout) ? (k.layout as KitchenLayout) : "LINIAR";
    config.kitchen = { layout };
    if (layout !== "LINIAR") {
      const b = (k.legB && typeof k.legB === "object" ? k.legB : {}) as Record<string, unknown>;
      if (!intIn(b.widthMm, ...LEG_B_RANGE)) return null;
      const legCols = parseColumns(b.columns, b.widthMm - c.depthMm);
      if (!legCols) return null;
      config.kitchen.legB = { widthMm: b.widthMm, columns: legCols };
    }
    if (isId(k.worktopId) && (catalog.worktops ?? []).some((w) => w.id === k.worktopId)) config.kitchen.worktopId = k.worktopId;
    if (k.led === true) config.kitchen.led = true;
  }
  return config;
}

/* ── compact code ── */

const trimmed = (list: unknown[]): unknown[] => {
  const out = [...list];
  while (out.length > 0 && (out[out.length - 1] === null || out[out.length - 1] === undefined)) out.pop();
  return out.map((v) => v ?? null);
};

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): string {
  const binary = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/** The configuration as a short URL-safe code (letters, digits, - and _ only). */
export function encodeShare(config: AtelierConfig): string {
  const { doors, fronts, handle, bottom, kitchen, drawerExtension } = config;
  const packCols = (cols: AtelierColumn[]) =>
    cols.map((c) =>
      trimmed([c.widthMm, CONTENTS.indexOf(c.content), c.shelves, c.drawers, c.railPosition === "JOS" ? 1 : c.railPosition === "SUS" ? 0 : null, c.doorRows, c.doorsAcross, c.upper ? UPPERS.indexOf(c.upper) : null]),
    );
  const packed = trimmed([
    VERSION,
    CATEGORY_ORDER.indexOf(config.category),
    [config.widthMm, config.heightMm, config.depthMm, config.legsMm],
    packCols(config.columns),
    trimmed([DOOR_TYPES.indexOf(doors.type), doors.count, doors.fills ? doors.fills.map((f) => FILL_CODE[f]).join("") : null, doors.mirrorId, doors.glassId]),
    config.carcassMaterialId,
    trimmed([FRONT_KINDS.indexOf(fronts.kind), fronts.kind === "MDF_VOPSIT" ? fronts.modelId : fronts.materialId, fronts.ralCode, fronts.faces]),
    handle ? trimmed([HANDLE_KINDS.indexOf(handle.type), handle.finish ? HANDLE_FINISHES.indexOf(handle.finish) : null]) : null,
    bottom && bottom.type !== "NONE" ? trimmed([BOTTOM_TYPES.indexOf(bottom.type), bottom.heightMm, bottom.drawers, bottom.shelves]) : null,
    kitchen
      ? trimmed([LAYOUTS.indexOf(kitchen.layout), kitchen.worktopId, kitchen.led ? 1 : null, kitchen.legB?.widthMm, kitchen.legB ? packCols(kitchen.legB.columns) : null])
      : null,
    drawerExtension === "PARTIALA" ? 1 : null,
  ]);
  return toBase64Url(JSON.stringify(packed));
}

const opt = (v: unknown): unknown => (v === null ? undefined : v);
const at = <T>(list: readonly T[], i: unknown): T | undefined => (isInt(i) && i >= 0 && i < list.length ? list[i] : undefined);

/** A code from a link → the configuration, or null for anything that is not a valid code of ours. */
export function decodeShare(code: unknown, catalog: AtelierCatalog): AtelierConfig | null {
  if (typeof code !== "string" || code.length === 0 || code.length > MAX_CODE_LENGTH || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
  let p: unknown;
  try {
    p = JSON.parse(fromBase64Url(code));
  } catch {
    return null;
  }
  if (!Array.isArray(p) || p[0] !== VERSION) return null;
  const [, cat, size, cols, doors, carcass, fronts, handle, bottom, kitchen, drawerExt] = p as unknown[];
  const unpackCols = (list: unknown[][]) =>
    list.map((c) => ({
      widthMm: c[0],
      content: at(CONTENTS, c[1]),
      shelves: opt(c[2]),
      drawers: opt(c[3]),
      railPosition: c[4] === 1 ? "JOS" : c[4] === 0 ? "SUS" : undefined,
      doorRows: opt(c[5]),
      doorsAcross: opt(c[6]),
      upper: at(UPPERS, c[7]),
    }));
  if (!Array.isArray(size) || !Array.isArray(cols) || !Array.isArray(doors) || !Array.isArray(fronts)) return null;
  if (cols.length > 30 || !cols.every(Array.isArray)) return null;
  const fills = doors[2];
  if (fills != null && (typeof fills !== "string" || fills.length > 30 || !/^[POS]*$/.test(fills))) return null;
  const frontKind = at(FRONT_KINDS, fronts[0]);
  const raw = {
    category: at(CATEGORY_ORDER, cat),
    widthMm: size[0],
    heightMm: size[1],
    depthMm: size[2],
    legsMm: size[3],
    columns: unpackCols(cols as unknown[][]),
    doors: {
      type: at(DOOR_TYPES, doors[0]),
      count: opt(doors[1]),
      fills: typeof fills === "string" ? [...fills].map((ch) => (ch === "O" ? "OGLINDA" : ch === "S" ? "STICLA" : "PANOU")) : undefined,
      mirrorId: opt(doors[3]),
      glassId: opt(doors[4]),
    },
    carcassMaterialId: carcass,
    fronts:
      frontKind === "MDF_VOPSIT"
        ? { kind: frontKind, modelId: fronts[1], ralCode: fronts[2], faces: opt(fronts[3]) }
        : { kind: frontKind, materialId: fronts[1] },
    handle: Array.isArray(handle) ? { type: at(HANDLE_KINDS, handle[0]), finish: at(HANDLE_FINISHES, handle[1]) } : undefined,
    bottom: Array.isArray(bottom)
      ? { type: at(BOTTOM_TYPES, bottom[0]) ?? "?", heightMm: opt(bottom[1]), drawers: opt(bottom[2]), shelves: opt(bottom[3]) }
      : undefined,
    kitchen: Array.isArray(kitchen)
      ? {
          layout: at(LAYOUTS, kitchen[0]),
          worktopId: opt(kitchen[1]),
          led: kitchen[2] === 1,
          legB:
            Array.isArray(kitchen[4]) && kitchen[4].length <= 30 && kitchen[4].every(Array.isArray)
              ? { widthMm: kitchen[3], columns: unpackCols(kitchen[4] as unknown[][]) }
              : undefined,
        }
      : undefined,
    drawerExtension: drawerExt === 1 ? "PARTIALA" : undefined,
  };
  return parseConfig(raw, catalog);
}

/** `https://…/configurator?c=<code>` for this configuration. */
export function shareUrl(origin: string, config: AtelierConfig): string {
  return `${origin.replace(/\/+$/, "")}/configurator?${SHARE_PARAM}=${encodeShare(config)}`;
}

/** The code in a URL's query string (`?c=…`), if any. */
export function shareCodeFrom(search: string): string | null {
  try {
    return new URLSearchParams(search).get(SHARE_PARAM);
  } catch {
    return null;
  }
}
