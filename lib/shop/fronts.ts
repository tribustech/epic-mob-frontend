import { FRONT_MATERIALS, type FrontMaterial } from "../atelier/front-materials";

/**
 * The board of the fronts in the shop (Andrew 2026-11-23: „fronturi PAL, AGT sau MDF vopsit, cu prețuri
 * diferite; începem de la PAL"). Like the width, the choice travels through the basket and the order inside
 * the colour id: „alb-casmir~vopsit", „alb-casmir~agt@1800". The board a colour is drawn with (PAL for most,
 * AGT or paint for the supermat / painted colours) has no suffix, so every older basket key stays valid.
 */

const SEP = "~";

/** The word used in keys and in ?fronturi= links. */
export const FRONT_SLUG: Record<FrontMaterial, string> = { PAL: "pal", AGT: "agt", VOPSIT: "vopsit" };

export function frontMaterialFromSlug(slug: string | null | undefined): FrontMaterial | null {
  if (!slug) return null;
  return FRONT_MATERIALS.find((m) => FRONT_SLUG[m] === slug.toLowerCase()) ?? null;
}

/** „alb-casmir~vopsit" → { paletteId: "alb-casmir", front: "VOPSIT" }; no suffix (or an unknown one) → front null. */
export function splitFrontKey(key: string): { paletteId: string; front: FrontMaterial | null } {
  const at = key.indexOf(SEP);
  if (at < 0) return { paletteId: key, front: null };
  return { paletteId: key.slice(0, at), front: frontMaterialFromSlug(key.slice(at + 1)) };
}

/** The colour id with the board of its fronts (the colour's own board: just the colour). */
export const frontKey = (paletteId: string, front: FrontMaterial | null, native: FrontMaterial): string =>
  front == null || front === native ? paletteId : `${paletteId}${SEP}${FRONT_SLUG[front]}`;

/**
 * How each board is named and explained to a client. Only what the materials pages say about them
 * (lib/materials-data.ts): no claim the workshop has not made there.
 */
export const FRONT_INFO: Record<FrontMaterial, { label: string; blurb: string; href: string }> = {
  PAL: {
    label: "PAL melaminat",
    blurb: "Rezistent la zgârieturi, ușor de șters. Cel mai bun raport calitate–preț.",
    href: "/materiale/pal-melaminat",
  },
  AGT: {
    label: "MDF melaminat AGT",
    blurb: "Miez de MDF mai dens, suprafață mată și netedă, muchii mai fine.",
    href: "/materiale/mdf-melaminat",
  },
  VOPSIT: {
    label: "MDF vopsit",
    blurb: "Vopsit mat pe față și pe muchii, într-un singur ton, fără cant.",
    href: "/materiale/mdf-vopsit",
  },
};

/** „Alb & cașmir" → „Alb & cașmir · fronturi MDF vopsit" (the basket line, when the board is not the colour's own). */
export function colourWithFronts(colour: string, front: FrontMaterial | null): string {
  return front ? `${colour} · fronturi ${FRONT_INFO[front].label}` : colour;
}
