import type { CSSProperties } from "react";
import type { AtelierCatalog, AtelierConfig, AtelierMaterial } from "@/lib/atelier/types";
import type { ResolvedPalette } from "@/lib/atelier/palettes";
import { DECOR_TONES, HORIZONTAL_GRAIN_DECORS, PLAIN_DECORS } from "@/lib/atelier/decor-tones";

/**
 * How a material is drawn: its real average tone, plus the decor photo as a texture for
 * woods / stones. Uni decors have no image on purpose (their photo is a flat colour, often
 * with a supplier sticker on it), so they are always the exact flat tone.
 */
export interface MaterialLook {
  color: string;
  imageUrl: string | null;
  /** the photo shows the grain lying down: turn it 90° when it is used as a texture */
  grainHorizontal?: boolean;
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
  // the measured tone of the decor photo first, then a guess from the name
  const known = material.decorCode ? DECOR_TONES[material.decorCode] : undefined;
  if (known) return known;
  const text = `${material.name} ${material.decorCode ?? ""}`;
  for (const [re, tone] of NAME_TONES) if (re.test(text)) return tone;
  return fallback;
}

function lookOf(material: AtelierMaterial | undefined, fallback: string): MaterialLook {
  const code = material?.decorCode ?? "";
  const look: MaterialLook = {
    color: toneFor(material, fallback),
    imageUrl: PLAIN_DECORS.has(code) ? null : (material?.imageUrl ?? null),
  };
  if (look.imageUrl && HORIZONTAL_GRAIN_DECORS.has(code)) look.grainHorizontal = true;
  return look;
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

/** Looks of a palette's two decors (for palette swatches and MiniPreview). */
export function paletteLooks(
  catalog: AtelierCatalog,
  palette: ResolvedPalette,
): { carcass: MaterialLook; front: MaterialLook } {
  const colours = { carcassMaterialId: palette.carcassMaterialId, fronts: palette.fronts } as AtelierConfig;
  return { carcass: carcassLook(catalog, colours), front: frontLook(catalog, colours) };
}
