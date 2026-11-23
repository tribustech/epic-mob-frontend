import assert from "node:assert/strict";
import test from "node:test";
import { HOOD_MM, hoodUnits } from "../components/atelier/viewer/hood.ts";
import type { AtelierScene, ScenePiece } from "../lib/atelier/types.ts";

// a 600 mm hood cabinet next to an ordinary wall cabinet, as the CRM sends them (bucatarie-240)
const pieces: ScenePiece[] = [
  { x: 1782, y: 1450, z: 5, w: 18, h: 750, d: 345, role: "CORP" },
  { x: 1201, y: 1451, z: 350, w: 598, h: 748, d: 18, role: "FRONT", front: "USA", hinge: "R" },
  { x: 1800, y: 1570, z: 5, w: 18, h: 630, d: 345, role: "CORP" },
  { x: 2382, y: 1570, z: 5, w: 18, h: 630, d: 345, role: "CORP" },
  { x: 1818, y: 1570, z: 5, w: 564, h: 18, d: 345, role: "CORP" },
  { x: 1801, y: 1571, z: 350, w: 598, h: 628, d: 18, role: "FRONT", front: "USA", hinge: "R" },
  { x: 1802, y: 1510, z: 0, w: 596, h: 60, d: 330, role: "APARAT", appliance: "HOTA" },
];
const scene: AtelierScene = { pieces, doors: [], widthMm: 2400, heightMm: 2200, depthMm: 600 };

test("a hood cabinet's sides reach the bottom line of the other wall cabinets", () => {
  const [unit] = hoodUnits(scene);
  assert.ok(unit);
  assert.deepEqual(unit.sides.map((s) => s.index), [2, 3]);
  for (const { piece } of unit.sides) {
    assert.equal(piece.y, 1450); // = the neighbour's bottom
    assert.equal(piece.y + piece.h, 2200); // top unchanged
  }
  assert.equal(1570 - HOOD_MM, unit.y0);
  assert.deepEqual([unit.x0, unit.x1, unit.y1, unit.zFront], [1818, 2382, 1570, 368]);
  // the scene itself is left as the CRM sent it
  assert.equal(pieces[2].y, 1570);
});

test("no hood, no unit", () => {
  assert.deepEqual(hoodUnits({ ...scene, pieces: pieces.filter((p) => p.role !== "APARAT") }), []);
});
