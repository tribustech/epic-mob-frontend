import type { AtelierCatalog, AtelierConfig, ColumnContent, DrawerExtension } from "./types";

/** Modulele cu sertare în față (glisiere Blum TANDEM + cutie din PAL în CRM). */
const DRAWER_CONTENTS: ReadonlySet<ColumnContent> = new Set<ColumnContent>(["SERTARE", "PLITA", "COLOANA_CUPTOR", "LAVOAR"]);

/** Configurația are sertare cu front (nu doar sertarele interioare din dressing). */
export function hasFrontDrawers(config: AtelierConfig): boolean {
  const cols = [...config.columns, ...(config.kitchen?.legB?.columns ?? [])];
  return cols.some((c) => DRAWER_CONTENTS.has(c.content)) || config.bottom?.type === "SERTARE";
}

/** CRM-ul poate cota glisiere cu extracție parțială (are produsul în catalog). */
export const partialDrawersAvailable = (catalog: AtelierCatalog): boolean => (catalog.drawerExtensions ?? []).includes("PARTIALA");

export const drawerExtensionOf = (config: AtelierConfig): DrawerExtension => config.drawerExtension ?? "COMPLETA";

export const DRAWER_EXTENSION_LABEL: Record<DrawerExtension, string> = {
  COMPLETA: "Extracție completă",
  PARTIALA: "Extracție parțială",
};
