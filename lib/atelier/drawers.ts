import type { AtelierCatalog, AtelierConfig, ColumnContent, DrawerExtension } from "./types";

/** Modulele cu sertare în față (glisiere Blum TANDEM + cutie din PAL în CRM). */
const DRAWER_CONTENTS: ReadonlySet<ColumnContent> = new Set<ColumnContent>(["SERTARE", "PLITA", "COLOANA_CUPTOR", "LAVOAR"]);

/** Configurația are sertare cu front (nu doar sertarele interioare din dressing). */
export function hasFrontDrawers(config: AtelierConfig): boolean {
  const cols = [...config.columns, ...(config.kitchen?.legB?.columns ?? [])];
  return cols.some((c) => DRAWER_CONTENTS.has(c.content)) || config.bottom?.type === "SERTARE";
}

/**
 * Configurația are sertare pe glisiere TANDEM, deci alegerea extracției contează la preț: sertarele cu front și
 * sertarele interioare din dressing („Bară + sertare"), pe care CRM-ul le cotează tot cu glisiere TANDEM de
 * extracția aleasă (crm lib/atelier/to-quote.ts, interiorDrawerSlide).
 */
export function hasDrawers(config: AtelierConfig): boolean {
  return hasFrontDrawers(config) || config.columns.some((c) => c.content === "BARA_SERTARE");
}

/** CRM-ul poate cota glisiere cu extracție parțială (are produsul în catalog). */
export const partialDrawersAvailable = (catalog: AtelierCatalog): boolean => (catalog.drawerExtensions ?? []).includes("PARTIALA");

export const drawerExtensionOf = (config: AtelierConfig): DrawerExtension => config.drawerExtension ?? "COMPLETA";

export const DRAWER_EXTENSION_LABEL: Record<DrawerExtension, string> = {
  COMPLETA: "Extracție completă",
  PARTIALA: "Extracție parțială",
};
