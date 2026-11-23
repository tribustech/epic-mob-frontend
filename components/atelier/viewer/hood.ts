import type { AtelierScene, ScenePiece } from "@/lib/atelier/types";

/**
 * The CRM prices a hood module as a wall cabinet HOOD_MM shorter than its neighbours, sitting on the
 * bottom line of the others plus HOOD_MM, and sends the hood itself as a 60 mm APARAT box under it. Drawn
 * as sent, the short cabinet floats above the line of its neighbours with a slab hanging under it.
 *
 * Drawn here instead (only drawn, never priced): the cabinet's two side panels run down to the bottom
 * line of the other wall cabinets, and between them sits a built-in (telescopic) hood whose visor is flush
 * with the doors — so the unit reads as one cabinet with an integrated hood.
 */
export const HOOD_MM = 120; // = HOOD_MM of the CRM (lib/atelier/kitchen.ts there)

export interface HoodUnit {
  /** the cabinet's side panels (by index in scene.pieces), each prolonged down to the bottom line */
  sides: { index: number; piece: ScenePiece }[];
  /** the space between the side panels, from the bottom line to the cabinet's bottom (mm, scene coordinates) */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** wall side of the hood body and the front plane of the doors */
  zBack: number;
  zFront: number;
  leg?: "B";
}

const near = (a: number, b: number, eps = 3) => Math.abs(a - b) <= eps;

export function hoodUnits(scene: AtelierScene): HoodUnit[] {
  const units: HoodUnit[] = [];
  for (const hood of scene.pieces) {
    if (hood.role !== "APARAT" || hood.appliance !== "HOTA") continue;
    const same = (p: ScenePiece) => p.leg === hood.leg;
    const left = hood.x;
    const right = hood.x + hood.w;
    const cabinetBottom = hood.y + hood.h;
    const bottom = cabinetBottom - HOOD_MM;
    // the cabinet's side panels: thin, upright, standing on the hood
    const sides = scene.pieces.flatMap((p, index) =>
      same(p) && p.role === "CORP" && p.w <= 30 && p.h > 100 && near(p.y, cabinetBottom) && p.x >= left - 30 && p.x + p.w <= right + 30
        ? [{ ...p, index }]
        : [],
    );
    const door = scene.pieces.find((p) => same(p) && p.role === "FRONT" && p.x < right && p.x + p.w > left && near(p.y, cabinetBottom, 6));
    const zBack = hood.z;
    const zFront = door ? door.z + door.d : Math.max(hood.z + hood.d, ...sides.map((s) => s.z + s.d));
    const prolonged = sides.map(({ index, ...s }) => ({ index, piece: { ...s, y: bottom, h: s.y + s.h - bottom } }));
    const sorted = [...sides].sort((a, b) => a.x - b.x);
    const x0 = sorted.length >= 2 ? sorted[0].x + sorted[0].w : left;
    const x1 = sorted.length >= 2 ? sorted[sorted.length - 1].x : right;
    units.push({ sides: prolonged, x0, x1, y0: bottom, y1: cabinetBottom, zBack, zFront, ...(hood.leg ? { leg: hood.leg } : {}) });
  }
  return units;
}
