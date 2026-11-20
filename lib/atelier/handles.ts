import type { AtelierCategory, AtelierConfig, AtelierHandle, HandleFinish, HandleKind } from "./types.ts";

/** Contents whose fronts carry a handle in comode / corpuri suspendate. */
const FRONT_CONTENTS = new Set(["SERTARE", "USI", "USA_RIDICABILA"]);

/** Every handle type, in the order the cards are shown (the catalog decides which ones exist). */
export const HANDLE_KINDS: readonly HandleKind[] = ["APLICAT", "BUTON", "INGROPAT", "PROFIL_J", "GOLA", "PUSH"];
export const HANDLE_FINISHES: readonly HandleFinish[] = ["NEGRU", "INOX", "AURIU"];
/** The finish shown (and drawn in 3D) until the client picks another. */
export const DEFAULT_HANDLE_FINISH: HandleFinish = "NEGRU";

export const isHandleKind = (v: unknown): v is HandleKind => (HANDLE_KINDS as readonly unknown[]).includes(v);
export const isHandleFinish = (v: unknown): v is HandleFinish => (HANDLE_FINISHES as readonly unknown[]).includes(v);

/** Types with a visible piece of metal, whose colour the client can choose. */
const WITH_FINISH: ReadonlySet<HandleKind> = new Set<HandleKind>(["APLICAT", "BUTON", "INGROPAT", "GOLA"]);
export const handleHasFinish = (type: HandleKind | null | undefined): boolean => !!type && WITH_FINISH.has(type);

export interface HandleInfo {
  /** plain name, e.g. „Mâner bară" */
  name: string;
  /** one line: why you would pick it */
  benefit: string;
  /** photo under /public */
  image: string;
}

/** Plain-word names for the handle types (the CRM labels are workshop jargon: „Profil J", „Push (TIP-ON)"). */
export const HANDLE_INFO: Record<HandleKind, HandleInfo> = {
  APLICAT: { name: "Mâner bară", benefit: "Clasic, ușor de prins", image: "/handles/aplicat.webp" },
  BUTON: { name: "Buton", benefit: "Mic și discret", image: "/handles/buton.webp" },
  INGROPAT: { name: "Mâner îngropat", benefit: "Nu iese în afară", image: "/handles/ingropat.webp" },
  PROFIL_J: { name: "Muchie frezată", benefit: "Fără mâner, tragi de margine", image: "/handles/profil-j.webp" },
  GOLA: { name: "Profil ascuns", benefit: "Linie continuă de aluminiu", image: "/handles/gola.webp" },
  PUSH: { name: "Fără mâner", benefit: "Apeși și se deschide", image: "/handles/push.webp" },
};

export const FINISH_INFO: Record<HandleFinish, { label: string; color: string }> = {
  NEGRU: { label: "Negru", color: "#26221f" },
  INOX: { label: "Inox", color: "#c3c7ca" },
  AURIU: { label: "Auriu", color: "#c9a45c" },
};

/**
 * What stands between these fronts and this handle. A recessed grip and a milled edge are cut into the
 * front itself: that needs painted fronts (`paint`), and cannot be done on a hinged door covered by a
 * mirror or glass (`glazed`). The CRM answers MANER_FRONTURI otherwise.
 */
export function handleBlockers(
  config: Pick<AtelierConfig, "category" | "doors" | "fronts">,
  type: HandleKind,
): { paint: boolean; glazed: boolean } {
  if (type !== "INGROPAT" && type !== "PROFIL_J") return { paint: false, glazed: false };
  const d = config.doors;
  return {
    paint: config.fronts.kind !== "MDF_VOPSIT",
    glazed: config.category === "DRESSING" && d.type.startsWith("BATANTE") && (d.type !== "BATANTE" || (d.fills ?? []).some((f) => f !== "PANOU")),
  };
}

/** Can these fronts take this handle? null = yes; else the reason, as one plain line for the card. */
export function handleUnavailable(config: Pick<AtelierConfig, "category" | "doors" | "fronts">, type: HandleKind): string | null {
  const { paint, glazed } = handleBlockers(config, type);
  return paint ? "Doar la fronturi vopsite" : glazed ? "Nu merge pe uși cu oglindă sau sticlă" : null;
}

/** The handle the CRM uses when the client picks none (CRM effectiveHandle): push on comode and
 *  wall cabinets, an applied handle on a hinged-door wardrobe. null = no handled fronts. */
export function categoryDefaultHandle(category: AtelierCategory): HandleKind | null {
  if (category === "COMODA" || category === "SUSPENDAT") return "PUSH";
  return "APLICAT"; // dressing with hinged doors, separator with a closed bottom
}

/** Does this configuration have fronts whose handle the client can choose? */
export function hasHandledFronts(config: Pick<AtelierConfig, "category" | "doors" | "bottom" | "columns">): boolean {
  if (config.category === "DRESSING") return config.doors.type.startsWith("BATANTE");
  if (config.category === "SEPARATOR") return !!config.bottom && config.bottom.type !== "NONE";
  if (config.category === "COMODA" || config.category === "SUSPENDAT")
    return config.columns.some((c) => FRONT_CONTENTS.has(c.content));
  return false;
}

/** The handle shown as selected: the client's choice, else the category default. */
export function currentHandle(config: Pick<AtelierConfig, "category" | "handle">): HandleKind | null {
  return config.handle?.type ?? categoryDefaultHandle(config.category);
}

/** The handle actually on the fronts (null when no front takes one), with the colour drawn in 3D. */
export function effectiveHandle(
  config: Pick<AtelierConfig, "category" | "doors" | "bottom" | "columns" | "handle">,
): { type: HandleKind; finish: HandleFinish | null } | null {
  if (!hasHandledFronts(config)) return null;
  const type = currentHandle(config);
  if (!type) return null;
  return { type, finish: handleHasFinish(type) ? (config.handle?.finish ?? DEFAULT_HANDLE_FINISH) : null };
}

/** What the reducer stores: a known type, and a finish only where there is something to colour. */
export function cleanHandle(raw: { type?: unknown; finish?: unknown } | null | undefined): AtelierHandle | null {
  if (!raw || !isHandleKind(raw.type)) return null;
  const handle: AtelierHandle = { type: raw.type };
  if (handleHasFinish(raw.type) && isHandleFinish(raw.finish)) handle.finish = raw.finish;
  return handle;
}

/** „Mâner bară, negru" / „Fără mâner (apeși și se deschide)" — for the summary. */
export function handleText(handle: { type: HandleKind; finish: HandleFinish | null }): string {
  const info = HANDLE_INFO[handle.type];
  if (handle.type === "PUSH") return "Fără mâner (apeși și se deschide)";
  return handle.finish ? `${info.name}, ${FINISH_INFO[handle.finish].label.toLowerCase()}` : info.name;
}

/**
 * The configuration as it is sent with a request: the handle colour the client saw in 3D is written
 * down even when they never touched the swatches (the default), so the workshop knows what was shown.
 */
export function withShownHandle(config: AtelierConfig): AtelierConfig {
  const shown = effectiveHandle(config);
  if (!shown || !shown.finish || config.handle?.finish === shown.finish) return config;
  return { ...config, handle: { type: shown.type, finish: shown.finish } };
}

/**
 * Is anything on this furniture made of the fronts material? Doors in the fronts' colour, drawer fronts,
 * the doors of a closed bottom. Not so for an open piece, or a wardrobe whose every door is mirror / glass
 * (those are glued on body board) and that has no drawers.
 */
export function usesFronts(config: Pick<AtelierConfig, "category" | "doors" | "bottom" | "columns">): boolean {
  if (config.category !== "DRESSING") return hasHandledFronts(config);
  if (config.columns.some((c) => c.content === "BARA_SERTARE")) return true;
  const d = config.doors;
  if (d.type === "NONE") return false;
  if (d.fills && d.fills.length > 0) return d.fills.some((f) => f === "PANOU");
  return d.type === "GLISANTE" || d.type === "BATANTE";
}
