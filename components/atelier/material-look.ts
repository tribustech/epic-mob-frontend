import type { CSSProperties } from "react";
import type { AtelierCatalog, AtelierConfig, AtelierMaterial } from "@/lib/atelier/types";

/** How a material is drawn: a texture image when the CRM has one, otherwise a flat tone. */
export interface MaterialLook {
  color: string;
  imageUrl: string | null;
}

/** Neutral fallback tones per board kind. */
const KIND_TONE = {
  PAL: "#d8cfc1",
  MDF_MELAMINAT: "#e4e0d8",
  MDF_VOPSIT: "#ece9e2",
} as const;

/** A rough tone guessed from the decor name, so plain swatches still differ visually. */
const NAME_TONES: [RegExp, string][] = [
  [/negru|black|antracit|grafit/i, "#2f2f31"],
  [/gri|grey|gray|beton|concrete/i, "#8f8d89"],
  [/nuc|walnut|wenge/i, "#6b4a33"],
  [/stejar|oak|sonoma|frasin|ash/i, "#b48a5c"],
  [/cire|cherry|mesteac|birch|fag|beech/i, "#c99a6b"],
  [/bej|beige|cashmere|crem|cream|nisip|sand/i, "#d8c9ae"],
  [/alb|white/i, "#f1efea"],
];

function toneFor(material: AtelierMaterial | undefined, fallback: string): string {
  if (!material) return fallback;
  const text = `${material.name} ${material.decorCode ?? ""}`;
  for (const [re, tone] of NAME_TONES) if (re.test(text)) return tone;
  return fallback;
}

function lookOf(material: AtelierMaterial | undefined, fallback: string): MaterialLook {
  return { color: toneFor(material, fallback), imageUrl: material?.imageUrl ?? null };
}

/** Background CSS for a swatch tile. */
export function swatchStyle(look: MaterialLook): CSSProperties {
  return look.imageUrl
    ? { backgroundColor: look.color, backgroundImage: `url("${look.imageUrl.replace(/["\\]/g, encodeURIComponent)}")` }
    : { backgroundColor: look.color };
}

export function materialLook(
  material: AtelierMaterial,
  kind: keyof typeof KIND_TONE,
): MaterialLook {
  return lookOf(material, KIND_TONE[kind]);
}

/** Carcass look (CORP / SPATE / PLINTA pieces). */
export function carcassLook(catalog: AtelierCatalog, config: AtelierConfig): MaterialLook {
  const material = catalog.carcass.find((m) => m.id === config.carcassMaterialId);
  const isMdf = catalog.fronts.MDF_MELAMINAT.some((m) => m.id === config.carcassMaterialId);
  return lookOf(material, isMdf ? KIND_TONE.MDF_MELAMINAT : KIND_TONE.PAL);
}

/** Front look (drawer fronts and panel sliding doors). MDF vopsit uses the RAL colour. */
export function frontLook(catalog: AtelierCatalog, config: AtelierConfig): MaterialLook {
  const { fronts } = config;
  if (fronts.kind === "MDF_VOPSIT") {
    const ral = catalog.ral.find((r) => r.code === fronts.ralCode);
    return { color: ral?.hex ?? KIND_TONE.MDF_VOPSIT, imageUrl: null };
  }
  const material = catalog.fronts[fronts.kind].find((m) => m.id === fronts.materialId);
  return lookOf(material, KIND_TONE[fronts.kind]);
}
