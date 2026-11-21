import { hasMirror, missingGlassIds } from "./door-types";
import { categoryDefaultHandle, handleUnavailable, hasHandledFronts } from "./handles";
import { PALETTES } from "./palettes";
import type { AtelierAction } from "./state.ts";
import type { AtelierCatalog, AtelierCategory, AtelierConfig } from "./types.ts";

/** The plain white board the palettes use for bodies, in order of preference (decor codes). */
export const WHITE_BODY_CODES: readonly string[] = ["W1000 ST9", "W1100 ST9", "D129 PS10"];

/** No black or dark chests of drawers and wall units (owner, 2026-11-20): light, wood and colour palettes only. */
export const NO_DARK_CATEGORIES: ReadonlySet<AtelierCategory> = new Set<AtelierCategory>(["COMODA", "SUSPENDAT"]);

/** A dark palette (mood „Închis"): black, anthracite, graphite fronts or bodies. */
export const isDarkPalette = (paletteId: string): boolean => PALETTES.find((p) => p.id === paletteId)?.mood === "INCHIS";

/** May this category be shown / sold in this palette (the no-dark rule above)? */
export const paletteAllowed = (category: AtelierCategory, paletteId: string): boolean => !(NO_DARK_CATEGORIES.has(category) && isDarkPalette(paletteId));

/** Is this body material an AGT panel (MDF melaminat: supermat / high gloss), not plain board? */
export function isAgtBody(catalog: AtelierCatalog, materialId: string): boolean {
  if (catalog.fronts.MDF_MELAMINAT.some((m) => m.id === materialId)) return true;
  return catalog.carcass.find((m) => m.id === materialId)?.brand?.toUpperCase() === "AGT";
}

export function whiteBodyId(catalog: AtelierCatalog): string | null {
  for (const code of WHITE_BODY_CODES) {
    const found = catalog.carcass.find((m) => m.decorCode === code);
    if (found) return found.id;
  }
  return null;
}

/** Worktops shown first and the one a new kitchen starts with (decor codes, in order of preference). */
export const FEATURED_WORKTOP_CODES: readonly string[] = [
  "H1145 ST10", "W1000 ST76", "F186 ST9", "F800 ST9", "H3303 ST10", "F275 ST9", "H1318 ST10", "U999 ST78", "F206 ST9", "H2033 ST10",
];

/** Worktops: 38 mm thick, as deep as the kitchen (standard 60 cm). */
export function usableWorktops(catalog: AtelierCatalog, depthMm: number) {
  return (catalog.worktops ?? []).filter((w) => w.maxDepthMm >= depthMm);
}

export function defaultWorktopId(catalog: AtelierCatalog, depthMm: number): string | null {
  const list = usableWorktops(catalog, depthMm);
  const thick = list.filter((w) => w.thicknessMm >= 38);
  for (const code of FEATURED_WORKTOP_CODES) {
    const found = thick.find((w) => w.decorCode === code) ?? list.find((w) => w.decorCode === code);
    if (found) return found.id;
  }
  return (thick[0] ?? list[0])?.id ?? null;
}

/**
 * What the configurator adds on its own after a change by the client (same undo step):
 *  - a mirror / glass door without a type takes the first type in the catalog, so the swatch shown as
 *    chosen is the one that is priced;
 *  - house rule: mirror doors go on a plain white body. When a mirror appears and the body is an AGT
 *    panel, the body becomes white board (`whitened`, for the one-line notice). It fires only at the
 *    moment the mirror appears: a client who then picks an AGT body by hand keeps it;
 *  - a handle cut into the front (recessed grip, milled edge) that the new fronts / doors cannot take
 *    goes back to the category's usual handle (`handleReset`), so the client never meets a CRM error.
 */
export function followUps(
  prev: AtelierConfig,
  next: AtelierConfig,
  catalog: AtelierCatalog,
): { actions: AtelierAction[]; whitened: boolean; handleReset: boolean } {
  const actions: AtelierAction[] = [];
  const ids = missingGlassIds(next, catalog);
  if (ids.mirrorId || ids.glassId) actions.push({ type: "setDoorGlass", ...ids });
  let whitened = false;
  if (hasMirror(next) && !hasMirror(prev) && isAgtBody(catalog, next.carcassMaterialId)) {
    const white = whiteBodyId(catalog);
    if (white && white !== next.carcassMaterialId) {
      actions.push({ type: "setCarcass", materialId: white });
      whitened = true;
    }
  }
  // a kitchen always has a worktop the catalog knows and that is deep enough
  if (next.category === "BUCATARIE" || next.category === "BAIE") {
    const ok = usableWorktops(catalog, next.depthMm).some((w) => w.id === next.kitchen?.worktopId);
    const id = ok ? null : defaultWorktopId(catalog, next.depthMm);
    if (id) actions.push({ type: "setWorktop", worktopId: id });
  }
  let handleReset = false;
  const fallback = categoryDefaultHandle(next.category);
  if (next.handle && fallback && hasHandledFronts(next) && handleUnavailable(next, next.handle.type)) {
    actions.push({ type: "setHandle", handle: { type: fallback } });
    handleReset = true;
  }
  return { actions, whitened, handleReset };
}
