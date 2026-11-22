import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { boardEdges, mergeBoards, notchLiner, notchedPanel, panelEdges, type BoardSpec, type Notch } from "../components/atelier/viewer/geometry.ts";
import { gripNotch, gripPoint } from "../components/atelier/viewer/hardware.tsx";
import { classifyFront, gripEdge, type FrontMode, type FrontPlan } from "../components/atelier/viewer/plan.ts";
import type { ScenePiece } from "../lib/atelier/types.ts";

const S = 0.001;
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

function boxOf(g: THREE.BufferGeometry) {
  g.computeBoundingBox();
  return g.boundingBox as THREE.Box3;
}

const board = (x: number, y: number, z: number, w: number, h: number, d: number): BoardSpec => ({ size: [w, h, d], at: [x, y, z], origin: [x, y, z], grain: "auto" });

test("many boards become one geometry and one outline", () => {
  const boards = [board(0, 0, 0, 1, 2, 0.018), board(1, 0, 0, 0.018, 2, 0.5), board(0, 1, 0, 1, 0.018, 0.5)];
  const merged = mergeBoards(boards);
  assert.ok(merged);
  // 3 boxes × 24 vertices, 3 × 12 triangles
  assert.equal(merged.getAttribute("position").count, 72);
  assert.equal(merged.index?.count, 108);
  const edges = boardEdges(boards);
  assert.ok(edges);
  // 12 edges per board, as instances of one line object
  assert.equal(edges.getAttribute("instanceStart").count, 36);
  assert.equal(mergeBoards([]), null);
  assert.equal(boardEdges([]), null);
});

test("a board of a merged mesh can be turned onto the second wall", () => {
  const turn = new THREE.Matrix4().makeRotationY(Math.PI / 2);
  const merged = mergeBoards([{ ...board(0, 0, 0, 2, 1, 0.1), matrix: turn }]);
  assert.ok(merged);
  const size = boxOf(merged).getSize(new THREE.Vector3());
  assert.ok(near(size.x, 0.1) && near(size.z, 2), `turned box is ${size.x} × ${size.z}`);
});

const notch = (edge: Notch["edge"], centre = 0): Notch => ({ edge, centre, length: 0.19, height: 0.046, depth: 0.012, radius: 0.015 });

test("a front with a routed grip keeps its outer size, on every edge", () => {
  for (const edge of ["TOP", "BOTTOM", "LEFT", "RIGHT"] as const) {
    const g = notchedPanel(0.6, 0.7, 0.018, [0, 0, 0], notch(edge));
    const b = boxOf(g);
    assert.ok(near(b.min.x, -0.3) && near(b.max.x, 0.3), edge);
    assert.ok(near(b.min.y, -0.35) && near(b.max.y, 0.35), edge);
    assert.ok(near(b.min.z, -0.009) && near(b.max.z, 0.009), edge);
    assert.ok(g.getAttribute("uv") && g.getAttribute("normal"));
  }
});

test("the routed grip really is a hollow: no face of the front covers it", () => {
  const n = notch("TOP");
  const g = notchedPanel(0.6, 0.3, 0.018, [0, 0, 0], n);
  const pos = g.getAttribute("position");
  const normal = g.getAttribute("normal");
  // triangles of the face (z = +9 mm, facing the room) never reach into the middle of the scoop
  const inside = (x: number, y: number) => Math.abs(x) < n.length / 2 - 0.02 && y > 0.15 - n.height + 0.01;
  for (let i = 0; i < pos.count; i += 3) {
    if (normal.getZ(i) < 0.9 || !near(pos.getZ(i), 0.009)) continue;
    const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    assert.ok(!inside(cx, cy), `face triangle at ${cx.toFixed(3)}, ${cy.toFixed(3)} covers the scoop`);
  }
});

test("the shell of a recessed grip sits inside its scoop, faces the room and carries its shading", () => {
  for (const edge of ["TOP", "BOTTOM", "LEFT", "RIGHT"] as const) {
    const n = notch(edge);
    const g = notchLiner(0.6, 0.7, 0.018, n, { lip: 0.0024, proud: 0.0007, floorDark: 0.26, floorLight: 0.8, wallDark: 0.34 });
    const b = boxOf(g);
    // from the floor of the scoop to just proud of the face
    assert.ok(b.min.z > 0.009 - n.depth && b.max.z <= 0.009 + 0.0008, edge);
    const color = g.getAttribute("color");
    assert.equal(color.itemSize, 3);
    const pos = g.getAttribute("position");
    const normal = g.getAttribute("normal");
    let floorFacing = 0;
    let floor = 0;
    let darkest = 1;
    for (let i = 0; i < pos.count; i++) {
      darkest = Math.min(darkest, color.getX(i));
      if (pos.getZ(i) < 0.009 - n.depth + 0.001 && Math.abs(normal.getZ(i)) > 0.9) {
        floor++;
        if (normal.getZ(i) > 0) floorFacing++;
      }
    }
    assert.ok(floor > 0 && floorFacing === floor, `${edge}: the floor of the scoop faces the room (${floorFacing}/${floor})`);
    assert.ok(darkest < 0.4, "the deepest part is clearly darker than the lip");
  }
});

test("the outline of a front is left open across the mouth of its scoop", () => {
  const plain = panelEdges(0.6, 0.7, 0.018, null);
  assert.equal(plain.getAttribute("instanceStart").count, 12);
  const cut = panelEdges(0.6, 0.7, 0.018, notch("TOP"));
  // the top edge of the face is now two pieces
  assert.equal(cut.getAttribute("instanceStart").count, 13);
});

/* ── where each handle type puts its scoop ── */

function front(mode: FrontMode, piece: Partial<ScenePiece>, wallHung = false): FrontPlan {
  const p: ScenePiece = { x: 0, y: 100, z: 600, w: 600, h: 700, d: 18, role: "FRONT", ...piece };
  const cls = classifyFront(mode, p, wallHung);
  return { kind: mode === "DRAWER" ? "drawer" : "door", key: "k", mode, cls, edge: gripEdge(cls, mode), hardware: true, piece: p, channel: null, coveredBy: [], behindSliding: false, stagger: 1, boxDepthMm: 400, travelMm: 240 };
}
const notchOf = (f: FrontPlan, kind: "INGROPAT" | "PROFIL_J") => gripNotch(kind, f.mode, f.edge, f.cls, f.piece.w, f.piece.h, f.piece.d, f.piece.y);

test("recessed grip: horizontal in the middle of a drawer's top edge, real-size", () => {
  const n = notchOf(front("DRAWER", { h: 250 }), "INGROPAT");
  assert.ok(n);
  assert.equal(n.edge, "TOP");
  assert.equal(n.centre, 0);
  assert.ok(n.length >= 0.15 && n.length <= 0.19, `length ${n.length}`);
  assert.ok(n.height >= 0.04 && n.height <= 0.05, `height ${n.height}`);
  assert.ok(n.depth < 0.018 && n.depth >= 0.01);
});

test("recessed grip: vertical on the side of a door that opens, at hand height on a tall one", () => {
  const left = front("L", { h: 2400 });
  const nl = notchOf(left, "INGROPAT");
  assert.equal(nl?.edge, "RIGHT");
  const right = front("R", { h: 2400 });
  const nr = notchOf(right, "INGROPAT");
  assert.equal(nr?.edge, "LEFT");
  // ~1050 mm above the floor: the door starts at 100 and is 2400 high
  const handMm = left.piece.y + left.piece.h / 2 + (nl?.centre ?? 0) / S;
  assert.ok(Math.abs(handMm - 1050) < 5, `hand height ${handMm}`);
  // a lift-up door: along its bottom edge
  assert.equal(notchOf(front("T", { y: 1500, h: 360, w: 900 }, true), "INGROPAT")?.edge, "BOTTOM");
  // an upper door: near its bottom corner; a base door: near its top corner
  const upper = notchOf(front("L", { y: 1500, h: 700 }, true), "INGROPAT");
  const base = notchOf(front("L", { y: 100, h: 700 }), "INGROPAT");
  assert.ok((upper?.centre ?? 0) < 0 && (base?.centre ?? 0) > 0);
});

test("milled edge: a long shallow cut along the grip edge, with a return at each end", () => {
  const drawer = front("DRAWER", { h: 250, w: 800 });
  const n = notchOf(drawer, "PROFIL_J");
  assert.ok(n);
  assert.equal(n.edge, "TOP");
  assert.ok(n.length < 0.8 && n.length > 0.7);
  assert.ok(n.height < 0.03 && n.depth < 0.012);
  // tall door: down the side that opens
  assert.equal(notchOf(front("R", { h: 2400 }), "PROFIL_J")?.edge, "LEFT");
  // clearly not the same thing as the recessed grip
  const r = notchOf(drawer, "INGROPAT");
  assert.ok(r && n.length > 3 * r.length && r.height > 1.5 * n.height);
});

test("fronts too small for a grip get none; other handles route nothing", () => {
  assert.equal(notchOf(front("DRAWER", { h: 60, w: 300 }), "INGROPAT"), null);
  const f = front("DRAWER", { h: 250 });
  for (const kind of ["APLICAT", "BUTON", "GOLA", "PUSH", "FARA"] as const)
    assert.equal(gripNotch(kind, f.mode, f.edge, f.cls, f.piece.w, f.piece.h, f.piece.d, f.piece.y), null);
});

test("the camera's handle focus looks at the scoop of a recessed grip", () => {
  const drawer = front("DRAWER", { h: 250 });
  const [x, y] = gripPoint(drawer, "INGROPAT");
  assert.equal(x, 0);
  assert.ok(y > 125 - 46 && y < 125, `y ${y}`);
  const door = front("L", { h: 2400 });
  const [dx] = gripPoint(door, "INGROPAT");
  assert.ok(dx > 300 - 46 && dx < 300);
});
