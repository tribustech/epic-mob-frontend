import { categoryRules } from "@/lib/atelier/categories";
import { COMBO_PRESETS, presetById, type PresetShape } from "@/lib/atelier/presets";
import { resolvePalettes } from "@/lib/atelier/palettes";
import { currentHandle, hasHandledFronts } from "@/lib/atelier/handles";
import { followUps } from "@/lib/atelier/house-rules";
import { parseConfig } from "@/lib/atelier/share";
import { atelierReducer, defaultConfig, type AtelierAction } from "@/lib/atelier/state";
import type { AtelierCatalog, AtelierConfig } from "@/lib/atelier/types";

/** The screens of the configurator, in order; the ids are also the funnel's `step` values and the URL hashes. */
export const STEP_IDS = ["model", "culori", "dimensiuni", "usi", "interior", "oferta"] as const;
export type StepId = (typeof STEP_IDS)[number];

/**
 * The steps this piece of furniture really has. „Uși și mânere" exists for a dressing (it chooses its
 * doors there) and for anything else whose fronts take a handle; furniture with neither (an open
 * separator, an open shelf) skips it.
 */
export function stepsFor(config: AtelierConfig): StepId[] {
  const doors = categoryRules(config.category).slidingDoors;
  return STEP_IDS.filter((s) => s !== "usi" || doors || hasHandledFronts(config));
}

/** The step to show when `step` does not exist for this furniture: the next one that does. */
export function nearestStep(step: StepId, config: AtelierConfig): StepId {
  const steps = stepsFor(config);
  if (steps.includes(step)) return step;
  return STEP_IDS.slice(STEP_IDS.indexOf(step)).find((s) => steps.includes(s)) ?? "model";
}

export function stepLabel(step: StepId, config: AtelierConfig): string {
  switch (step) {
    case "model":
      return "Model";
    case "culori":
      return "Culori";
    case "dimensiuni":
      return "Dimensiuni";
    case "usi":
      return categoryRules(config.category).slidingDoors ? "Uși și mânere" : "Mânere";
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
  /** what each entry of `past` changed, in plain words („culorile"), for the „Am anulat: …" note */
  pastWhat: string[];
  /** the change the last undo took back; `n` makes two undos of the same kind two notes */
  undone: { what: string; n: number } | null;
  /** signature + time of the last change, to coalesce slider drags into one undo entry */
  last: { sig: string; at: number } | null;
  /** what the configurator changed on its own with the last change, to tell the client in one line each */
  notices: SessionNotice[];
}

/**
 * WHITE_BODY: mirror doors go on a plain white body, so the body was switched from an AGT panel to white.
 * HANDLE_RESET: the chosen handle cannot be made on the new fronts / doors; the usual one took its place.
 */
export type SessionNotice = "WHITE_BODY" | "HANDLE_RESET";

const NO_NOTICES: SessionNotice[] = [];

export type SessionAction =
  /** with `catalog`, the house rules run on top of the change (lib/atelier/house-rules.ts), as the same undo step */
  | { type: "config"; actions: AtelierAction[]; at: number; catalog?: AtelierCatalog }
  | { type: "dismissNotice" }
  | { type: "dismissUndone" }
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

/** What a change was about, as the client would say it (the first action names it). */
const CHANGE_NAMES: Partial<Record<AtelierAction["type"], string>> = {
  setCategory: "modelul",
  applyPreset: "modelul",
  applyPalette: "culorile",
  setCarcass: "culoarea corpului",
  setFronts: "culoarea fronturilor",
  setSize: "dimensiunile",
  setLegs: "picioarele",
  setDoors: "ușile",
  setDoorFill: "fața unei uși",
  setDoorFills: "fețele ușilor",
  setDoorGlass: "tipul de oglindă sau sticlă",
  setHandle: "mânerele",
  setBottom: "partea de jos",
  setColumnDoorRows: "ușile",
  setColumnDoorsAcross: "ușile",
};

function changeName(actions: AtelierAction[]): string {
  return (actions[0] && CHANGE_NAMES[actions[0].type]) ?? "interiorul";
}

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
      let config = action.actions.reduce(atelierReducer, state.config);
      const notices: SessionNotice[] = [];
      if (action.catalog) {
        const extra = followUps(state.config, config, action.catalog);
        config = extra.actions.reduce(atelierReducer, config);
        if (extra.whitened) notices.push("WHITE_BODY");
        if (extra.handleReset) notices.push("HANDLE_RESET");
      }
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
      const pastWhat = coalesce ? state.pastWhat : [...state.pastWhat, changeName(action.actions)].slice(-HISTORY_LIMIT);
      return { ...state, config, past, pastWhat, undone: null, last: { sig, at: action.at }, notices: notices.length ? notices : NO_NOTICES };
    }
    case "undo": {
      if (state.past.length === 0) return state;
      return {
        ...state,
        config: state.past[state.past.length - 1],
        past: state.past.slice(0, -1),
        pastWhat: state.pastWhat.slice(0, -1),
        undone: { what: state.pastWhat[state.pastWhat.length - 1] ?? "ultima schimbare", n: (state.undone?.n ?? 0) + 1 },
        last: null,
        notices: NO_NOTICES,
      };
    }
    case "step":
      return action.step === state.step ? state : { ...state, step: action.step };
    case "contact":
      return { ...state, contact: action.contact };
    case "dismissNotice":
      return state.notices.length ? { ...state, notices: NO_NOTICES } : state;
    case "dismissUndone":
      return state.undone ? { ...state, undone: null } : state;
    case "restore":
      return { config: action.config, past: [], pastWhat: [], undone: null, step: action.step, contact: action.contact, last: null, notices: NO_NOTICES };
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
  return { config: withGlassDefaults(config, catalog), past: [], pastWhat: [], undone: null, step: "model", contact: EMPTY_CONTACT, last: null, notices: NO_NOTICES };
}

/**
 * A configuration that comes from outside a tap (first screen, a reload, a shared link), settled the way a
 * tap would leave it: a mirror / glass door with no type takes the catalog's first one (what the swatches
 * show as chosen, and what the CRM must price), a handle the fronts cannot take becomes the usual one.
 */
export function withGlassDefaults(config: AtelierConfig, catalog: AtelierCatalog): AtelierConfig {
  return followUps(config, config, catalog).actions.reduce(atelierReducer, config);
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

/**
 * Stable key of everything in a configuration except the finishes: the colours, which mirror / glass
 * is on the doors and the colour of the handles. (A model stays „the same model" in another finish.)
 */
export function shapeKey(shape: PresetShape | AtelierConfig): string {
  const { carcassMaterialId: _c, fronts: _f, ...rest } = shape as AtelierConfig;
  void _c;
  void _f;
  const { mirrorId: _m, glassId: _g, ...doors } = rest.doors;
  void _m;
  void _g;
  // no handle chosen and the category's default chosen by hand are the same thing
  const handle = hasHandledFronts(rest) ? currentHandle(rest) : undefined;
  return JSON.stringify(canonical({ ...rest, doors, handle }));
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

/** Strict check of a stored configuration (lib/atelier/share.ts); null when it no longer fits today's catalog or rules. */
export function validStoredConfig(raw: unknown, catalog: AtelierCatalog): AtelierConfig | null {
  return parseConfig(raw, catalog);
}

export function loadSession(
  catalog: AtelierCatalog,
): { config: AtelierConfig; step: StepId; contact: LeadContact } | null {
  try {
    const text = window.sessionStorage.getItem(STORAGE_KEY);
    if (!text) return null;
    const parsed = JSON.parse(text) as { config?: unknown; step?: unknown; contact?: unknown };
    let config = validStoredConfig(parsed.config, catalog);
    if (!config) return null;
    config = withGlassDefaults(config, catalog);
    const step = nearestStep(STEP_IDS.find((s) => s === parsed.step) ?? "model", config);
    return { config, step, contact: storedContact(parsed.contact) };
  } catch {
    return null;
  }
}

/** What the step screens call to change the configuration (one action, or several as one change). */
export type Act = (action: AtelierAction | AtelierAction[]) => void;
