import { isHandleKind } from "./handles";
import type { AtelierCatalog, AtelierGlass, AtelierMaterial } from "./types";

/** Only the public fields reach the client bundle / RSC payload, whatever else the CRM sends. */
export function publicCatalog(catalog: AtelierCatalog): AtelierCatalog {
  const material = (m: AtelierMaterial): AtelierMaterial => ({
    id: m.id,
    name: m.name,
    decorCode: m.decorCode ?? null,
    brand: m.brand ?? null,
    imageUrl: m.imageUrl ?? null,
  });
  // mirror / glass types for the doors: only how they look, never a price
  const glass = (g: AtelierGlass): AtelierGlass => ({
    id: String(g.id),
    name: String(g.name ?? ""),
    tint: typeof g.tint === "string" && /^#[0-9a-f]{6}$/i.test(g.tint) ? g.tint : "#cfd8de",
    ...(g.matte === true ? { matte: true } : {}),
    ...(g.opaque === true ? { opaque: true } : {}),
  });
  const glassOf = (list: unknown): AtelierGlass[] =>
    (Array.isArray(list) ? (list as AtelierGlass[]) : []).filter((g) => g && typeof g.id === "string" && g.id).map(glass);
  return {
    carcass: (catalog.carcass ?? []).map(material),
    fronts: {
      PAL: (catalog.fronts?.PAL ?? []).map(material),
      MDF_MELAMINAT: (catalog.fronts?.MDF_MELAMINAT ?? []).map(material),
      MDF_VOPSIT: (catalog.fronts?.MDF_VOPSIT ?? []).map((m) => ({ id: m.id, name: m.name })),
    },
    ral: (catalog.ral ?? []).map((r) => ({ code: r.code, name: r.name, hex: r.hex })),
    // only the handle types this site knows how to show
    handles: {
      types: (catalog.handles?.types ?? []).filter((t) => t && isHandleKind(t.type)).map((t) => ({ type: t.type, label: String(t.label ?? "") })),
    },
    // drawer runner extensions the CRM can price (absent on an older CRM = full extension only)
    ...(Array.isArray(catalog.drawerExtensions)
      ? { drawerExtensions: catalog.drawerExtensions.filter((e) => e === "COMPLETA" || e === "PARTIALA") }
      : {}),
    // absent on an older CRM: the configurator then keeps the one-face-for-all-doors choice
    // kitchen worktops: how they look and how deep they can be cut, never a price
    ...(Array.isArray(catalog.worktops)
      ? {
          worktops: catalog.worktops
            .filter((w) => w && typeof w.id === "string" && w.id)
            .map((w) => ({ ...material(w), thicknessMm: Number(w.thicknessMm) || 38, maxDepthMm: Number(w.maxDepthMm) || 600 })),
        }
      : {}),
    ...(catalog.glass ? { glass: { mirrors: glassOf(catalog.glass.mirrors), glasses: glassOf(catalog.glass.glasses) } } : {}),
  };
}
