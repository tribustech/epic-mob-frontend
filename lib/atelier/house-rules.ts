import { hasMirror, missingGlassIds } from "./door-types.ts";
import { categoryDefaultHandle, handleUnavailable, hasHandledFronts } from "./handles.ts";
import type { AtelierAction } from "./state.ts";
import type { AtelierCatalog, AtelierConfig } from "./types.ts";

/** The plain white board the palettes use for bodies, in order of preference (decor codes). */
export const WHITE_BODY_CODES: readonly string[] = ["W1000 ST9", "W1100 ST9", "D129 PS10"];

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
  let handleReset = false;
  const fallback = categoryDefaultHandle(next.category);
  if (next.handle && fallback && hasHandledFronts(next) && handleUnavailable(next, next.handle.type)) {
    actions.push({ type: "setHandle", handle: { type: fallback } });
    handleReset = true;
  }
  return { actions, whitened, handleReset };
}
