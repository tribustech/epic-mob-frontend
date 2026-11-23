import type { AtelierScene, ScenePiece } from "@/lib/atelier/types";

/**
 * The CRM prices a hood module as a wall cabinet HOOD_MM shorter than its neighbours, sitting on the
 * bottom line of the others plus HOOD_MM, and sends the hood itself as a 60 mm APARAT box under it. Drawn
 * as sent, the short cabinet floats above the line of its neighbours with a slab hanging under it.
 *
 * Drawn here instead (only drawn, never priced): the cabinet's side panels and doors run down to the
 * bottom line of the other wall cabinets, with the hood hidden behind the doors (an integrated hood,
 * like the furniture-front models of Bosch / Neff): only its filter shows from below. The unit then
 * reads like its neighbours, and its handles sit at the same height as theirs (Andrew 2026-11-23:
 * the steel visor looked too tall and the handles out of line).
 */
export const HOOD_MM = 120; // = HOOD_MM of the CRM (lib/atelier/kitchen.ts there)

export interface HoodUnit {
  /** the cabinet's side panels (by index in scene.pieces), each prolonged down to the bottom line */
  sides: { index: number; piece: ScenePiece }[];
  /** the cabinet's doors (by index), each prolonged down to the bottom line */
  doors: { index: number; piece: ScenePiece }[];
  /** the hood's own piece (by index) */
  hood: number;
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
  scene.pieces.forEach((hood, hoodIndex) => {
    if (hood.role !== "APARAT" || hood.appliance !== "HOTA") return;
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
    const doorsOver = scene.pieces.flatMap((p, index) =>
      same(p) && p.role === "FRONT" && p.x < right && p.x + p.w > left && near(p.y, cabinetBottom, 6) ? [{ ...p, index }] : [],
    );
    const door = doorsOver[0];
    const zBack = hood.z;
    const zFront = door ? door.z + door.d : Math.max(hood.z + hood.d, ...sides.map((s) => s.z + s.d));
    const prolonged = sides.map(({ index, ...s }) => ({ index, piece: { ...s, y: bottom, h: s.y + s.h - bottom } }));
    const sorted = [...sides].sort((a, b) => a.x - b.x);
    const x0 = sorted.length >= 2 ? sorted[0].x + sorted[0].w : left;
    const x1 = sorted.length >= 2 ? sorted[sorted.length - 1].x : right;
    const doors = doorsOver.map(({ index, ...p }) => ({ index, piece: { ...p, y: p.y - HOOD_MM, h: p.h + HOOD_MM } }));
    units.push({ sides: prolonged, doors, hood: hoodIndex, x0, x1, y0: bottom, y1: cabinetBottom, zBack, zFront, ...(hood.leg ? { leg: hood.leg } : {}) });
  });
  return units;
}

/**
 * The scene as drawn: every hood cabinet one full-height unit (sides and doors down to the line of the
 * other wall cabinets), the hood itself reduced to the filter plate seen from below.
 */
export function integrateHoods(scene: AtelierScene): AtelierScene {
  const units = hoodUnits(scene);
  if (units.length === 0) return scene;
  const pieces = [...scene.pieces];
  for (const u of units) {
    for (const s of [...u.sides, ...u.doors]) pieces[s.index] = s.piece;
    const inner = u.x1 - u.x0;
    pieces[u.hood] = { ...pieces[u.hood], x: u.x0 + 15, w: Math.max(10, inner - 30), y: u.y0 + 20, h: 4, z: u.zBack + 20, d: Math.max(10, u.zFront - 40 - u.zBack) };
  }
  return { ...scene, pieces };
}
