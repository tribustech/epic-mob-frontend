import assert from "node:assert/strict";
import test from "node:test";
import { classifyFront, gripEdge, planScene, resolveOpen, toggleOpen } from "../components/atelier/viewer/plan.ts";
import type { AtelierScene, ScenePiece } from "../lib/atelier/types.ts";

/* Scenes built by hand, shaped like the CRM's: fronts sit 1 mm inside their column, 2–3 mm apart. */

const corp = (x: number, y: number, w: number, h: number, d = 595): ScenePiece => ({ x, y, z: 5, w, h, d, role: "CORP" });
const plinth = (x: number, w: number): ScenePiece => ({ x, y: 0, z: 30, w, h: 100, d: 500, role: "PLINTA" });
const door = (x: number, y: number, w: number, h: number, hinge: "L" | "R" | "T", z = 600): ScenePiece => ({ x, y, z, w, h, d: 18, role: "FRONT", front: "USA", hinge });
const drawer = (x: number, y: number, w: number, h: number, z = 600): ScenePiece => ({ x, y, z, w, h, d: 18, role: "FRONT", front: "SERTAR" });

/** A 2.6 m wardrobe: three tall doors (L, L, R) and two drawers inside the middle column. `gola` = as the CRM draws Gola (doors 35 mm shorter at the top). */
function wardrobe(gola: boolean): AtelierScene {
  const h = gola ? 2463 : 2498;
  return {
    widthMm: 2400,
    heightMm: 2600,
    depthMm: 618,
    handle: gola ? "GOLA" : "APLICAT",
    doors: [],
    pieces: [
      corp(0, 100, 18, 2500),
      corp(2382, 100, 18, 2500),
      corp(18, 2582, 2364, 18),
      plinth(0, 2400),
      door(1, 101, 798, h, "L"),
      door(801, 101, 798, h, "L"),
      drawer(820, 121, 760, 250, 542),
      drawer(820, 374, 760, 250, 542),
      door(1601, 101, 798, h, "R"),
    ],
  };
}

/** A 0.9 m chest: three drawers on the left, two base doors on the right. */
function chest(gola: boolean): AtelierScene {
  const cut = gola ? 35 : 0;
  const dh = 264.66 - cut;
  return {
    widthMm: 1600,
    heightMm: 900,
    depthMm: 468,
    handle: gola ? "GOLA" : "PUSH",
    doors: [],
    pieces: [
      corp(0, 100, 18, 800, 445),
      corp(18, 882, 1564, 18, 445),
      plinth(0, 1600),
      drawer(1, 634.33, 798, dh, 450),
      drawer(1, 367.67, 798, dh, 450),
      drawer(1, 101, 798, dh, 450),
      door(801, 101, 398, 798 - cut, "L", 450),
      door(1201, 101, 398, 798 - cut, "R", 450),
    ],
  };
}

/** A room divider: closed base doors with open shelving stacked on top (separate carcasses, as the CRM builds it). */
function divider(gola: boolean): AtelierScene {
  const h = gola ? 563 : 598;
  const column = (x: number): ScenePiece[] => [
    corp(x, 100, 18, 600, 345),
    corp(x + 382, 100, 18, 600, 345),
    corp(x + 18, 682, 364, 18, 345),
    { ...corp(x, 700, 18, 1300, 350), z: 0 },
    { ...corp(x + 382, 700, 18, 1300, 350), z: 0 },
    { ...corp(x + 18, 700, 364, 18, 350), z: 0 },
    door(x + 1, 101, 398, h, x === 800 ? "R" : "L", 350),
  ];
  return { widthMm: 1200, heightMm: 2000, depthMm: 368, handle: gola ? "GOLA" : "BUTON", doors: [], pieces: [plinth(0, 1200), ...column(0), ...column(400), ...column(800)] };
}

/** A wall cabinet (no plinth): a lift-up door and a pair of doors. */
const wallCabinet: AtelierScene = {
  widthMm: 1600,
  heightMm: 400,
  depthMm: 368,
  doors: [],
  pieces: [corp(0, 0, 18, 400, 345), corp(18, 382, 1564, 18, 345), door(1, 1, 798, 398, "T", 350), door(801, 1, 398, 398, "L", 350), door(1201, 1, 398, 398, "R", 350)],
};

/** Sizes to the tenth of a millimetre (the CRM's thirds of a millimetre do not add up exactly). */
const mm = <T>(value: T): T => JSON.parse(JSON.stringify(value, (_k, v) => (typeof v === "number" ? Math.round(v * 10) / 10 : v)));
const shapes = (scene: AtelierScene, handle: Parameters<typeof planScene>[1]) =>
  mm(planScene(scene, handle).fronts.map((f) => (f ? { key: f.key, cls: f.cls, edge: f.edge, hardware: f.hardware, piece: f.piece, channel: f.channel } : null)));

test("fronts are classified as a cabinet maker would", () => {
  assert.equal(classifyFront("DRAWER", drawer(0, 100, 800, 250), false), "DRAWER");
  assert.equal(classifyFront("T", door(0, 0, 800, 400, "T"), true), "LIFT");
  assert.equal(classifyFront("L", door(0, 100, 800, 2498, "L"), false), "TALL");
  assert.equal(classifyFront("L", door(0, 100, 800, 1200, "L"), false), "TALL");
  assert.equal(classifyFront("L", door(0, 100, 800, 1199, "L"), false), "BASE");
  assert.equal(classifyFront("R", door(0, 0, 400, 400, "R"), true), "WALL");
  // a short door in the upper row of a wardrobe is an upper door too
  assert.equal(classifyFront("R", door(0, 1900, 400, 698, "R"), false), "WALL");
  // ...and so is the middle door of three: its top edge is out of reach, its bottom edge is at hand
  assert.equal(classifyFront("L", door(0, 935, 800, 831, "L"), false), "WALL");
  assert.equal(classifyFront("L", door(0, 101, 800, 831, "L"), false), "BASE");
});

test("the grip edge follows the class: top for drawers and base doors, bottom for upper and lift-up doors, the opening side for tall doors", () => {
  assert.equal(gripEdge("DRAWER", "DRAWER"), "TOP");
  assert.equal(gripEdge("BASE", "L"), "TOP");
  assert.equal(gripEdge("WALL", "L"), "BOTTOM");
  assert.equal(gripEdge("LIFT", "T"), "BOTTOM");
  assert.equal(gripEdge("TALL", "L"), "RIGHT");
  assert.equal(gripEdge("TALL", "R"), "LEFT");
});

test("Gola on tall doors: a channel down the opening side, over the full height of the door", () => {
  const plan = planScene(wardrobe(false), "GOLA");
  const doors = plan.fronts.filter((f) => f?.kind === "door");
  assert.equal(doors.length, 3);
  for (const f of doors) {
    assert.ok(f && f.channel);
    assert.equal(f.cls, "TALL");
    assert.equal(f.piece.h, 2498, "the door keeps its full height");
    assert.equal(f.channel.h, 2498);
    assert.ok(f.channel.w < 40);
  }
  const [a, b, c] = doors.map((f) => f!);
  assert.equal(a.channel!.x + a.channel!.w, 799, "left-hinged: the channel is at the right edge");
  // the doors that meet (b hinged left, c hinged right) share one channel in the middle
  assert.equal(b.channel!.x + b.channel!.w, 1599);
  assert.equal(c.channel!.x, 1601);
  assert.equal(c.piece.x, 1601 + c.channel!.w);
});

test("the picture is the same before and after the CRM answers (its Gola scene shortens every front at the top)", () => {
  for (const build of [wardrobe, chest, divider]) {
    assert.deepEqual(shapes(build(true), "GOLA"), shapes(build(false), "GOLA"));
    // ...and when the client leaves Gola while the Gola scene is still on screen
    for (const handle of ["APLICAT", "BUTON", "INGROPAT", "PROFIL_J", "PUSH", "FARA"] as const)
      assert.deepEqual(shapes(build(true), handle), shapes(build(false), handle), handle);
  }
});

test("Gola on drawers and base doors: a channel along the top edge", () => {
  const plan = planScene(chest(true), "GOLA");
  for (const f of plan.fronts) {
    if (!f) continue;
    assert.equal(f.edge, "TOP");
    assert.ok(f.channel);
    assert.equal(f.channel.w, f.piece.w);
    assert.ok(Math.abs(f.channel.y - (f.piece.y + f.piece.h)) < 1e-6);
  }
});

test("wall cabinet: lift-up and side-hung doors are gripped at the bottom edge", () => {
  const plan = planScene(wallCabinet, "GOLA");
  assert.equal(plan.wallHung, true);
  assert.deepEqual(plan.fronts.filter(Boolean).map((f) => f!.cls), ["LIFT", "WALL", "WALL"]);
  for (const f of plan.fronts) {
    if (!f) continue;
    assert.equal(f.edge, "BOTTOM");
    assert.equal(f.channel!.y, 1);
    assert.equal(f.piece.y, 1 + f.channel!.h);
  }
});

test("drawers inside a wardrobe get no edge profile, but keep a real handle", () => {
  const interior = (handle: Parameters<typeof planScene>[1]) => planScene(wardrobe(false), handle).fronts.filter((f) => f?.kind === "drawer");
  for (const f of interior("GOLA")) {
    assert.equal(f!.channel, null);
    assert.equal(f!.hardware, false);
    assert.equal(f!.piece.h, 250);
  }
  for (const f of interior("PROFIL_J")) assert.equal(f!.hardware, false);
  for (const f of interior("APLICAT")) assert.equal(f!.hardware, true);
  assert.deepEqual(interior("APLICAT")[0]!.coveredBy.length, 1);
});

test("no handle type changes the size of a front, except the Gola strip", () => {
  for (const handle of ["APLICAT", "BUTON", "INGROPAT", "PROFIL_J", "PUSH", "FARA"] as const)
    for (const f of planScene(wardrobe(false), handle).fronts) if (f) assert.equal(f.channel, null);
});

test("opening: one door is not „everything open“; a drawer waits behind a closed door", () => {
  const scene = wardrobe(false);
  const plan = planScene(scene, "APLICAT");
  const closed = resolveOpen(scene, plan, {}, false, false);
  assert.equal(closed.anyOpen, false);
  // the drawer behind the closed middle door does not open
  const blocked = toggleOpen(scene, plan, {}, false, false, "drawer-0");
  assert.equal(blocked.changed, false);
  const oneDoor = toggleOpen(scene, plan, {}, false, false, "door-1");
  assert.equal(oneDoor.open, true);
  const state = resolveOpen(scene, plan, oneDoor.overrides, false, false);
  assert.equal(state.anyOpen, true);
  assert.equal(state.allOpen, false);
  const withDrawer = toggleOpen(scene, plan, oneDoor.overrides, false, false, "drawer-0");
  assert.equal(withDrawer.open, true);
  // closing the door takes the drawer with it
  const shut = toggleOpen(scene, plan, withDrawer.overrides, false, false, "door-1");
  assert.equal(resolveOpen(scene, plan, shut.overrides, false, false).anyOpen, false);
  assert.equal(resolveOpen(scene, plan, {}, true, false).allOpen, true);
});

test("three doors in a column: Gola gives two channels, the middle door shares the one below it", () => {
  const scene: AtelierScene = {
    widthMm: 800,
    heightMm: 2600,
    depthMm: 618,
    doors: [],
    pieces: [corp(0, 100, 18, 2500), corp(18, 2582, 764, 18), plinth(0, 800), door(1, 101, 798, 831, "L"), door(1, 934, 798, 831, "L"), door(1, 1767, 798, 832, "L")],
  };
  const fronts = planScene(scene, "GOLA").fronts.filter(Boolean).map((f) => f!);
  assert.deepEqual(fronts.map((f) => f.cls), ["BASE", "WALL", "WALL"]);
  assert.deepEqual(fronts.map((f) => f.edge), ["TOP", "BOTTOM", "BOTTOM"]);
  assert.ok(fronts[0].channel, "the lowest door: channel along its top");
  assert.equal(fronts[1].channel, null, "the middle door grips that same channel from above");
  assert.equal(fronts[1].piece.h, 831);
  assert.ok(fronts[2].channel, "the upper door: channel along its bottom");
  assert.equal(fronts[2].channel!.y, 1767);
});
