import type { AtelierCatalog, AtelierHandle, HandleKind } from "./types";

/** Handle types that need a product picked from catalog.handles.items (same set as the CRM). */
export const HANDLE_WITH_ITEM: ReadonlySet<HandleKind> = new Set<HandleKind>(["APLICAT", "BUTON", "INGROPAT"]);

/** First sensible handle for hinged doors: an applied handle with the first product, else the first type the CRM offers. */
export function defaultHandle(catalog: AtelierCatalog): AtelierHandle | undefined {
  const types = catalog.handles?.types.map((t) => t.type) ?? [];
  const firstItem = catalog.handles?.items[0]?.id;
  if (types.includes("APLICAT") && firstItem) return { type: "APLICAT", itemId: firstItem };
  const t = types.find((x) => !HANDLE_WITH_ITEM.has(x)) ?? types[0];
  if (!t) return undefined;
  return HANDLE_WITH_ITEM.has(t) ? { type: t, itemId: firstItem } : { type: t };
}

/** Switching the handle type keeps the chosen product when the new type also needs one. */
export function withHandleType(current: AtelierHandle | undefined, type: HandleKind, catalog: AtelierCatalog): AtelierHandle {
  if (!HANDLE_WITH_ITEM.has(type)) return { type };
  return { type, itemId: current?.itemId ?? catalog.handles?.items[0]?.id };
}
