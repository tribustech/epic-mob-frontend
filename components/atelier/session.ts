import { CATEGORY_RULES, categoryRules } from "@/lib/atelier/categories";
import { COMBO_PRESETS, presetById, type PresetShape } from "@/lib/atelier/presets";
import { resolvePalettes } from "@/lib/atelier/palettes";
import { atelierReducer, defaultConfig, type AtelierAction } from "@/lib/atelier/state";
import type { AtelierCatalog, AtelierConfig } from "@/lib/atelier/types";

/** The five screens of the configurator; the ids are also the funnel's `step` values. */
export const STEP_IDS = ["model", "culori", "dimensiuni", "interior", "oferta"] as const;
export type StepId = (typeof STEP_IDS)[number];

export function stepLabel(step: StepId, config: AtelierConfig): string {
  switch (step) {
    case "model":
      return "Model";
    case "culori":
      return "Culori";
    case "dimensiuni":
      return "Dimensiuni";
    case "interior":
      return config.category === "DRESSING" ? "Interior" : "Compartimente";
    case "oferta":
      return "Ofertă";
  }
}

/** What the client typed in the request form; kept while they move between steps and across a reload. */
export interface LeadContact {
  name: string;
  phone: string;
  city: string;
  notes: string;
}

export const EMPTY_CONTACT: LeadContact = { name: "", phone: "", city: "", notes: "" };

const CONTACT_MAX: Record<keyof LeadContact, number> = { name: 100, phone: 30, city: 80, notes: 1000 };

function storedContact(raw: unknown): LeadContact {
  const from = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const text = (key: keyof LeadContact) => (typeof from[key] === "string" ? (from[key] as string).slice(0, CONTACT_MAX[key]) : "");
  return { name: text("name"), phone: text("phone"), city: text("city"), notes: text("notes") };
}

/* ── Session state: the configuration, an undo stack and the current step ── */

const HISTORY_LIMIT = 40;
/** Rapid repeats of the same action (dragging a slider, tapping a stepper) undo as one change. */
const COALESCE_MS = 900;

export interface AtelierSession {
  config: AtelierConfig;
  past: AtelierConfig[];
  step: StepId;
  contact: LeadContact;
  /** signature + time of the last change, to coalesce slider drags into one undo entry */
  last: { sig: string; at: number } | null;
}

export type SessionAction =
  | { type: "config"; actions: AtelierAction[]; at: number }
  | { type: "undo" }
  | { type: "step"; step: StepId }
  | { type: "contact"; contact: LeadContact }
  | { type: "restore"; config: AtelierConfig; step: StepId; contact: LeadContact };

const signature = (a: AtelierAction): string => {
  const keys = Object.keys(a)
    .filter((k) => k !== "type" && (a as Record<string, unknown>)[k] !== undefined)
    .sort();
  const index = "index" in a ? `#${a.index}` : "";
  return `${a.type}${index}:${a.type === "setSize" ? keys.join(",") : ""}`;
};

const COALESCING = new Set<AtelierAction["type"]>([
  "setSize",
  "setColumnWidth",
  "setColumnDrawers",
  "setColumnShelves",
  "setBottom",
]);

export function sessionReducer(state: AtelierSession, action: SessionAction): AtelierSession {
  switch (action.type) {
    case "config": {
      // several actions (a combination = model + colours) are one change, and one undo
      const config = action.actions.reduce(atelierReducer, state.config);
      // choosing what is already chosen is not a change: nothing to undo
      if (config === state.config || JSON.stringify(config) === JSON.stringify(state.config)) return state;
      const sig = action.actions.map(signature).join("+");
      const coalesce =
        action.actions.length === 1 &&
        COALESCING.has(action.actions[0].type) &&
        state.last !== null &&
        state.last.sig === sig &&
        action.at - state.last.at < COALESCE_MS;
      const past = coalesce ? state.past : [...state.past, state.config].slice(-HISTORY_LIMIT);
      return { ...state, config, past, last: { sig, at: action.at } };
    }
    case "undo": {
      if (state.past.length === 0) return state;
      return { ...state, config: state.past[state.past.length - 1], past: state.past.slice(0, -1), last: null };
    }
    case "step":
      return action.step === state.step ? state : { ...state, step: action.step };
    case "contact":
      return { ...state, contact: action.contact };
    case "restore":
      return { config: action.config, past: [], step: action.step, contact: action.contact, last: null };
  }
}

/** First screen: the first ready-made combination (model + colours) when it resolves, else the plain defaults. */
export function initialSession(catalog: AtelierCatalog): AtelierSession {
  let config = defaultConfig(catalog);
  const combo = COMBO_PRESETS.find((c) => presetById(c.presetId)?.category === "DRESSING") ?? COMBO_PRESETS[0];
  const preset = combo && presetById(combo.presetId);
  const palette = combo && resolvePalettes(catalog).find((p) => p.id === combo.paletteId);
  if (preset && palette) {
    config = atelierReducer(config, { type: "applyPreset", shape: preset.shape });
    config = atelierReducer(config, {
      type: "applyPalette",
      carcassMaterialId: palette.carcassMaterialId,
      fronts: palette.fronts,
    });
  }
  return { config, past: [], step: "model", contact: EMPTY_CONTACT, last: null };
}

/* ── Comparing shapes (which preset card is the current one) ── */

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) out[key] = canonical(v);
    }
    return out;
  }
  return value;
}

/** Stable key of everything in a configuration except the colours. */
export function shapeKey(shape: PresetShape | AtelierConfig): string {
  const { carcassMaterialId: _c, fronts: _f, ...rest } = shape as AtelierConfig;
  void _c;
  void _f;
  return JSON.stringify(canonical(rest));
}

export function shapeOf(config: AtelierConfig): PresetShape {
  const { carcassMaterialId: _c, fronts: _f, ...rest } = config;
  void _c;
  void _f;
  return rest;
}

/* ── sessionStorage: a reload keeps the configuration and the step ── */

const STORAGE_KEY = "epicmob:atelier:v2";

export function saveSession(config: AtelierConfig, step: StepId, contact: LeadContact): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ config, step, contact }));
  } catch {
    // private mode / quota: the configurator works without persistence
  }
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Loose shape check of a stored configuration; null when it no longer fits today's catalog or rules. */
export function validStoredConfig(raw: unknown, catalog: AtelierCatalog): AtelierConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<AtelierConfig>;
  if (typeof c.category !== "string" || !CATEGORY_RULES[c.category]) return null;
  const rules = categoryRules(c.category);
  if (!isNum(c.widthMm) || !isNum(c.heightMm) || !isNum(c.depthMm) || !isNum(c.legsMm)) return null;
  if (c.widthMm < rules.width[0] || c.widthMm > rules.width[1]) return null;
  if (c.heightMm < rules.height[0] || c.heightMm > rules.height[1]) return null;
  if (c.depthMm < rules.depth[0] || c.depthMm > rules.depth[1]) return null;
  if (!rules.legs.includes(c.legsMm)) return null;
  if (!Array.isArray(c.columns) || c.columns.length === 0 || c.columns.length > 30) return null;
  for (const col of c.columns) {
    if (!col || typeof col !== "object" || !isNum(col.widthMm) || !rules.contents.includes(col.content)) return null;
  }
  if (c.columns.reduce((sum, col) => sum + col.widthMm, 0) !== c.widthMm) return null;
  if (!c.doors || typeof c.doors !== "object" || typeof c.doors.type !== "string") return null;
  if (!rules.slidingDoors && c.doors.type !== "NONE") return null;
  if (typeof c.carcassMaterialId !== "string" || !catalog.carcass.some((m) => m.id === c.carcassMaterialId)) return null;
  const f = c.fronts;
  if (!f || typeof f !== "object") return null;
  if (f.kind === "MDF_VOPSIT") {
    if (!catalog.ral.some((r) => r.code === f.ralCode)) return null;
    if (!catalog.fronts.MDF_VOPSIT.some((m) => m.id === f.modelId)) return null;
  } else if (f.kind === "PAL" || f.kind === "MDF_MELAMINAT") {
    if (!catalog.fronts[f.kind].some((m) => m.id === f.materialId)) return null;
  } else {
    return null;
  }
  if (c.bottom !== undefined && (c.category !== "SEPARATOR" || typeof c.bottom !== "object" || !c.bottom)) return null;
  if (c.handle !== undefined) {
    const type = c.handle?.type;
    if (!type || !(catalog.handles?.types ?? []).some((t) => t.type === type)) return null;
  }
  return c as AtelierConfig;
}

export function loadSession(
  catalog: AtelierCatalog,
): { config: AtelierConfig; step: StepId; contact: LeadContact } | null {
  try {
    const text = window.sessionStorage.getItem(STORAGE_KEY);
    if (!text) return null;
    const parsed = JSON.parse(text) as { config?: unknown; step?: unknown; contact?: unknown };
    const config = validStoredConfig(parsed.config, catalog);
    if (!config) return null;
    const step = STEP_IDS.find((s) => s === parsed.step) ?? "model";
    return { config, step, contact: storedContact(parsed.contact) };
  } catch {
    return null;
  }
}

/** What the step screens call to change the configuration (one action, or several as one change). */
export type Act = (action: AtelierAction | AtelierAction[]) => void;
