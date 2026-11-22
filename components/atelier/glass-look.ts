import type { CSSProperties } from "react";
import { currentGlass } from "@/lib/atelier/door-types";
import type { AtelierCatalog, AtelierDoors, AtelierGlass } from "@/lib/atelier/types";

/** How a mirror / glass with no known tint is drawn. */
export const MIRROR_TINT = "#cfd8de";
export const GLASS_TINT = "#a9c1cb";

function rgb(color: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return [207, 216, 222];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mixes a colour towards white (amount > 0) or black (amount < 0). */
export function mix(color: string, amount: number): string {
  const target = amount < 0 ? 0 : 255;
  const k = Math.min(1, Math.abs(amount));
  return `rgb(${rgb(color).map((v) => Math.round(v + (target - v) * k)).join(",")})`;
}

/**
 * A swatch that reads as a mirror or as glass: the tint with a diagonal glint. Matte (sandblasted /
 * satin) kinds are drawn frosted: a milky, even surface without the glint.
 */
export function glassSwatchStyle(kind: "OGLINDA" | "STICLA", glass?: Pick<AtelierGlass, "tint" | "matte" | "opaque"> | null): CSSProperties {
  const tint = glass?.tint && /^#?[0-9a-f]{6}$/i.test(glass.tint.trim()) ? glass.tint.trim() : kind === "OGLINDA" ? MIRROR_TINT : GLASS_TINT;
  // lacquered glass is not see-through: a solid colour with a soft shine
  if (glass?.opaque) {
    return { backgroundColor: tint, backgroundImage: `linear-gradient(160deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 45%)` };
  }
  if (glass?.matte) {
    return {
      backgroundColor: mix(tint, 0.35),
      backgroundImage: `linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.25) 100%)`,
    };
  }
  const glint =
    kind === "OGLINDA"
      ? `linear-gradient(125deg, ${mix(tint, 0.45)} 0%, ${mix(tint, 0.05)} 34%, ${mix(tint, 0.75)} 46%, ${mix(tint, 0.1)} 58%, ${mix(tint, -0.12)} 100%)`
      : `linear-gradient(125deg, ${mix(tint, 0.3)} 0%, ${mix(tint, 0)} 40%, ${mix(tint, 0.4)} 50%, ${mix(tint, -0.05)} 62%, ${mix(tint, -0.18)} 100%)`;
  return { backgroundColor: tint, backgroundImage: glint };
}

export type GlassLook = Pick<AtelierGlass, "tint" | "matte" | "opaque">;
/** How the mirror and the glass on the doors look (for the small drawings). */
export interface Glazing {
  mirror?: GlassLook | null;
  glass?: GlassLook | null;
}

/** The mirror / glass chosen for these doors, or the catalog's first (what a preset would get). */
export function glazingOf(catalog: Pick<AtelierCatalog, "glass">, doors: Pick<AtelierDoors, "mirrorId" | "glassId">): Glazing {
  return { mirror: currentGlass(catalog.glass?.mirrors, doors.mirrorId), glass: currentGlass(catalog.glass?.glasses, doors.glassId) };
}

/** Gradient stops (top-left → bottom-right) for a door face in the small drawings. */
export function glassStops(kind: "OGLINDA" | "STICLA", look: GlassLook | null | undefined, fallback: string[]): string[] {
  if (!look?.tint || !/^#?[0-9a-f]{6}$/i.test(look.tint.trim())) return fallback;
  const t = look.tint.trim();
  if (look.opaque) return [mix(t, 0.12), t, t, mix(t, -0.06)];
  if (look.matte) return [mix(t, 0.4), mix(t, 0.3), mix(t, 0.34), mix(t, 0.22)];
  return kind === "OGLINDA" ? [mix(t, 0.45), mix(t, 0.05), mix(t, 0.3), mix(t, -0.12)] : [mix(t, 0.35), mix(t, 0.05), mix(t, 0.2), mix(t, -0.1)];
}
