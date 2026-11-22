import { CONTENT_LABELS, FRONT_LABELS } from "./categories";
import { DRAWER_EXTENSION_LABEL, drawerExtensionOf, hasDrawers, partialDrawersAvailable } from "./drawers";
import type { AtelierCatalog, AtelierConfig } from "./types";

/**
 * The „Interior" / „Compartimente" line of the offer summary, with what is in them:
 * „3 coloane: 2 × bară de haine, polițe" / „2 compartimente: sertare, uși batante".
 */
export function compartmentsText(config: Pick<AtelierConfig, "category" | "columns">): string {
  const dressing = config.category === "DRESSING";
  const n = config.columns.length;
  const head = dressing ? `${n} ${n === 1 ? "coloană" : "coloane"}` : `${n} ${n === 1 ? "compartiment" : "compartimente"}`;
  const counts = new Map<string, number>();
  for (const col of config.columns) {
    const label = ((!dressing && FRONT_LABELS[col.content]) || CONTENT_LABELS[col.content]).toLowerCase();
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  if (counts.size === 0) return head;
  return `${head}: ${[...counts].map(([label, k]) => (k > 1 ? `${k} × ${label}` : label)).join(", ")}`;
}

/** The „Sertare" row: which drawer runners, when the client could choose them; null otherwise. */
export function drawerRunnersText(config: AtelierConfig, catalog: AtelierCatalog): string | null {
  if (!hasDrawers(config) || !partialDrawersAvailable(catalog)) return null;
  return `Glisiere Blum TANDEM, ${DRAWER_EXTENSION_LABEL[drawerExtensionOf(config)].toLowerCase()}`;
}
