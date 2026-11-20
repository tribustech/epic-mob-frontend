import assert from "node:assert/strict";
import test from "node:test";
import {
  atelierReducer,
  defaultColumns,
  defaultConfig,
} from "../lib/atelier/state.ts";
import { isLatest } from "../lib/atelier/use-live-price.ts";
import { CATEGORY_RULES, autoDrawers } from "../lib/atelier/categories.ts";
import type { AtelierCatalog, AtelierColumn, AtelierConfig } from "../lib/atelier/types.ts";

const mat = (id: string) => ({ id, name: id, decorCode: null, brand: null, imageUrl: null });
const catalog: AtelierCatalog = {
  carcass: [mat("c1"), mat("c2")],
  fronts: { PAL: [mat("f1")], MDF_MELAMINAT: [], MDF_VOPSIT: [] },
  ral: [],
};

const cols = (...w: number[]): AtelierColumn[] => w.map((widthMm) => ({ widthMm, content: "POLITE" }));
const base = (widthMm: number, columns: AtelierColumn[]): AtelierConfig => ({
  ...defaultConfig(catalog),
  widthMm,
  columns,
});
const widths = (c: AtelierConfig) => c.columns.map((x) => x.widthMm);
const sum = (c: AtelierConfig) => widths(c).reduce((a, b) => a + b, 0);

test("defaultColumns(2500) -> [833, 833, 834] alternating BARA/POLITE", () => {
  const c = defaultColumns(2500);
  assert.deepEqual(c.map((x) => x.widthMm), [833, 833, 834]);
  assert.deepEqual(c.map((x) => x.content), ["BARA", "POLITE", "BARA"]);
  assert.equal(defaultColumns(800).length, 1);
});

test("defaultConfig uses first catalog materials", () => {
  const c = defaultConfig(catalog);
  assert.equal(c.widthMm, 2400);
  assert.equal(c.heightMm, 2600);
  assert.equal(c.depthMm, 600);
  assert.equal(c.carcassMaterialId, "c1");
  assert.deepEqual(c.fronts, { kind: "PAL", materialId: "f1" });
  assert.equal(c.legsMm, 100);
  assert.deepEqual(c.doors, { type: "GLISANTE" });
  assert.equal(c.columns.reduce((a, x) => a + x.widthMm, 0), 2400);
  const fb = defaultConfig({ ...catalog, fronts: { ...catalog.fronts, PAL: [] } });
  assert.equal(fb.fronts.materialId, "c1");
});

test("setSize 3000 -> 2400 scales [1200,900,900] to [960,720,720]", () => {
  const s = atelierReducer(base(3000, cols(1200, 900, 900)), { type: "setSize", widthMm: 2400 });
  assert.deepEqual(widths(s), [960, 720, 720]);
  assert.equal(sum(s), 2400);
});

test("setSize keeps sum exact with rounding and respects 300-1200", () => {
  const s = atelierReducer(base(2500, cols(833, 833, 834)), { type: "setSize", widthMm: 2000 });
  assert.equal(sum(s), 2000);
  const big = atelierReducer(base(2400, cols(800, 800, 800)), { type: "setSize", widthMm: 5000 });
  assert.equal(sum(big), 5000);
  assert.equal(big.columns.length, 5);
  assert.ok(widths(big).every((w) => w >= 300 && w <= 1200));
  const small = atelierReducer(base(2400, cols(800, 800, 800)), { type: "setSize", widthMm: 700 });
  assert.equal(sum(small), 700);
  assert.equal(small.columns.length, 2);
  assert.ok(widths(small).every((w) => w >= 300 && w <= 1200));
});

test("setSize height/depth only leaves columns", () => {
  const b = base(3000, cols(1000, 1000, 1000));
  const s = atelierReducer(b, { type: "setSize", heightMm: 2400, depthMm: 550 });
  assert.equal(s.heightMm, 2400);
  assert.equal(s.depthMm, 550);
  assert.deepEqual(widths(s), [1000, 1000, 1000]);
});

test("setColumnWidth(0, 1100) spreads diff over others, sum stays 3000", () => {
  const s = atelierReducer(base(3000, cols(1000, 1000, 1000)), { type: "setColumnWidth", index: 0, widthMm: 1100 });
  assert.equal(s.columns[0].widthMm, 1100);
  assert.deepEqual(widths(s), [1100, 950, 950]);
  assert.equal(sum(s), 3000);
});

test("setColumnWidth clamps to feasible range", () => {
  const s = atelierReducer(base(3000, cols(1000, 1000, 1000)), { type: "setColumnWidth", index: 0, widthMm: 5000 });
  assert.equal(s.columns[0].widthMm, 1200);
  assert.equal(sum(s), 3000);
  const t = atelierReducer(base(3000, cols(1000, 1000, 1000)), { type: "setColumnWidth", index: 1, widthMm: 100 });
  assert.equal(t.columns[1].widthMm, 600); // others cannot exceed 1200 each
  assert.equal(sum(t), 3000);
});

test("removeColumn redistributes width; last column no-op", () => {
  const s = atelierReducer(base(2400, cols(800, 800, 800)), { type: "removeColumn", index: 1 });
  assert.deepEqual(widths(s), [1200, 1200]);
  const one = base(800, cols(800));
  assert.equal(atelierReducer(one, { type: "removeColumn", index: 0 }), one);
});

test("removeColumn is a no-op when others cannot absorb (>1200)", () => {
  const b = base(3600, cols(1200, 1200, 1200));
  assert.equal(atelierReducer(b, { type: "removeColumn", index: 0 }), b);
});

test("addColumn splits the widest column", () => {
  const s = atelierReducer(base(3000, cols(1000, 1200, 800)), { type: "addColumn" });
  assert.deepEqual(widths(s), [1000, 600, 600, 800]);
  const tiny = base(900, cols(300, 300, 300));
  assert.equal(atelierReducer(tiny, { type: "addColumn" }), tiny);
});

test("content, carcass, fronts, legs, doors", () => {
  const b = base(2400, cols(800, 800, 800));
  const c = atelierReducer(b, { type: "setColumnContent", index: 0, content: "BARA_SERTARE" });
  assert.equal(c.columns[0].content, "BARA_SERTARE");
  assert.equal(c.columns[0].drawers, 2);
  assert.equal(atelierReducer(b, { type: "setCarcass", materialId: "c2" }).carcassMaterialId, "c2");
  assert.deepEqual(atelierReducer(b, { type: "setFronts", fronts: { kind: "MDF_VOPSIT", ralCode: "9010" } }).fronts, { kind: "MDF_VOPSIT", ralCode: "9010" });
  assert.equal(atelierReducer(b, { type: "setLegs", legsMm: 150 }).legsMm, 150);
  assert.deepEqual(atelierReducer(b, { type: "setDoors", doors: { type: "NONE" } }).doors, { type: "NONE" });
});

test("isLatest ignores stale responses", () => {
  assert.equal(isLatest(3, 3), true);
  assert.equal(isLatest(2, 3), false);
});

test("growing width beyond what current columns can cover adds columns", () => {
  const cases: [AtelierColumn[], number, number][] = [
    [cols(800), 3000, 3],
    [cols(1000, 1000), 3000, 3],
    [cols(300), 2000, 2],
    [cols(1000), 2500, 3],
  ];
  for (const [c, target, n] of cases) {
    const start = c.reduce((a, x) => a + x.widthMm, 0);
    const s = atelierReducer(base(start, c), { type: "setSize", widthMm: target });
    assert.equal(s.widthMm, target);
    assert.equal(sum(s), target);
    assert.equal(s.columns.length, n);
    assert.ok(widths(s).every((w) => w >= 300 && w <= 1200), JSON.stringify(widths(s)));
  }
});

/* ── categories ── */

const dims = (c: AtelierConfig) => [c.widthMm, c.heightMm, c.depthMm];
const inRange = (v: number, [lo, hi]: readonly [number, number]) => v >= lo && v <= hi;

function assertValid(c: AtelierConfig) {
  const r = CATEGORY_RULES[c.category];
  assert.ok(inRange(c.widthMm, r.width) && inRange(c.heightMm, r.height) && inRange(c.depthMm, r.depth), JSON.stringify(dims(c)));
  assert.ok(r.legs.includes(c.legsMm), `legs ${c.legsMm}`);
  assert.equal(sum(c), c.widthMm);
  for (const col of c.columns) {
    assert.ok(inRange(col.widthMm, r.column), `col ${col.widthMm}`);
    assert.ok(r.contents.includes(col.content), `content ${col.content}`);
  }
  if (c.category !== "DRESSING") assert.deepEqual(c.doors, { type: "NONE" });
}

test("setCategory('COMODA') -> valid comodă defaults, no doors, materials kept", () => {
  const start = atelierReducer(defaultConfig(catalog), { type: "setCarcass", materialId: "c2" });
  const s = atelierReducer(start, { type: "setCategory", category: "COMODA" });
  assert.equal(s.category, "COMODA");
  assert.deepEqual(dims(s), [1600, 800, 450]);
  assert.deepEqual(s.columns.map((c) => c.content), ["SERTARE", "SERTARE"]);
  assert.deepEqual(widths(s), [800, 800]);
  assert.deepEqual(s.doors, { type: "NONE" });
  assert.equal(s.legsMm, 100);
  assert.equal(s.carcassMaterialId, "c2");
  assert.deepEqual(s.fronts, start.fronts);
  assertValid(s);
});

test("defaults of every category are valid", () => {
  for (const category of ["DRESSING", "COMODA", "SEPARATOR", "SUSPENDAT"] as const) {
    assertValid(defaultConfig(catalog, category));
  }
  const sep = defaultConfig(catalog, "SEPARATOR");
  assert.deepEqual(dims(sep), [1200, 2000, 350]);
  assert.deepEqual(sep.columns.map((c) => c.content), ["DESCHIS", "DESCHIS", "DESCHIS"]);
  const sus = defaultConfig(catalog, "SUSPENDAT");
  assert.deepEqual(dims(sus), [1200, 600, 350]);
  assert.deepEqual(sus.columns.map((c) => c.content), ["USI", "USI"]);
  assert.deepEqual(defaultConfig(catalog), defaultConfig(catalog, "DRESSING"));
});

test("setCategory('SUSPENDAT') -> legsMm 0; setLegs keeps it 0", () => {
  const s = atelierReducer(defaultConfig(catalog), { type: "setCategory", category: "SUSPENDAT" });
  assert.equal(s.legsMm, 0);
  assert.equal(atelierReducer(s, { type: "setLegs", legsMm: 150 }).legsMm, 0);
  const back = atelierReducer(s, { type: "setCategory", category: "DRESSING" });
  assert.equal(back.legsMm, 100);
  assert.deepEqual(back.doors, { type: "GLISANTE" });
  assert.equal(atelierReducer(defaultConfig(catalog), { type: "setLegs", legsMm: 0 }).legsMm, 100);
});

test("setSize clamps to the category limits", () => {
  const c = defaultConfig(catalog, "COMODA");
  const big = atelierReducer(c, { type: "setSize", widthMm: 9000, heightMm: 2600, depthMm: 900 });
  assert.deepEqual(dims(big), [3000, 1200, 600]);
  assertValid(big);
  const small = atelierReducer(c, { type: "setSize", widthMm: 100, heightMm: 100, depthMm: 100 });
  assert.deepEqual(dims(small), [400, 400, 300]);
  assertValid(small);
  const sus = atelierReducer(defaultConfig(catalog, "SUSPENDAT"), { type: "setSize", widthMm: 300, heightMm: 1500 });
  assert.deepEqual(dims(sus).slice(0, 2), [300, 1000]);
  assertValid(sus);
  const dr = atelierReducer(defaultConfig(catalog), { type: "setSize", widthMm: 8000, heightMm: 500 });
  assert.deepEqual(dims(dr).slice(0, 2), [6000, 1000]);
  assertValid(dr);
});

test("column contents and new columns follow the category", () => {
  const c = defaultConfig(catalog, "SUSPENDAT");
  assert.equal(atelierReducer(c, { type: "setColumnContent", index: 0, content: "SERTARE" }), c);
  assert.equal(atelierReducer(c, { type: "setColumnContent", index: 0, content: "USA_RIDICABILA" }).columns[0].content, "USA_RIDICABILA");
  const wide = atelierReducer(c, { type: "setSize", widthMm: 3000 });
  assertValid(wide);
  assertValid(atelierReducer(c, { type: "addColumn" }));
  const sep = atelierReducer(defaultConfig(catalog, "SEPARATOR"), { type: "setSize", widthMm: 4000 });
  assertValid(sep);
  assert.deepEqual(atelierReducer(defaultConfig(catalog, "COMODA"), { type: "setDoors", doors: { type: "GLISANTE" } }).doors, { type: "NONE" });
});

test("setColumnDrawers: SERTARE 2-6, auto by default", () => {
  const c = defaultConfig(catalog, "COMODA");
  assert.equal(c.columns[0].drawers, undefined);
  assert.equal(atelierReducer(c, { type: "setColumnDrawers", index: 0, drawers: 5 }).columns[0].drawers, 5);
  assert.equal(atelierReducer(c, { type: "setColumnDrawers", index: 0, drawers: 9 }).columns[0].drawers, 6);
  assert.equal(atelierReducer(c, { type: "setColumnDrawers", index: 0, drawers: 1 }).columns[0].drawers, 2);
  assert.equal(atelierReducer(c, { type: "setColumnDrawers", index: 0, drawers: undefined }).columns[0].drawers, undefined);
  // auto count shown in the UI = the CRM rule on the body height (total − legs)
  assert.equal(autoDrawers(800 - 100), 4);
  assert.equal(autoDrawers(300), 2);
  assert.equal(autoDrawers(2000), 6);
});

test("POLITE_BARA: rail SUS/JOS and shelf count, kept on width changes", () => {
  let c = defaultConfig(catalog, "DRESSING");
  c = atelierReducer(c, { type: "setColumnContent", index: 0, content: "POLITE_BARA" });
  assert.equal(c.columns[0].railPosition, undefined);
  c = atelierReducer(c, { type: "setColumnRail", index: 0, railPosition: "JOS" });
  assert.equal(c.columns[0].railPosition, "JOS");
  c = atelierReducer(c, { type: "setColumnShelves", index: 0, shelves: 9 });
  assert.equal(c.columns[0].shelves, 6);
  c = atelierReducer(c, { type: "setColumnShelves", index: 0, shelves: undefined });
  assert.equal(c.columns[0].shelves, undefined);
  assert.equal(c.columns[0].railPosition, "JOS");
  c = atelierReducer(c, { type: "setColumnWidth", index: 0, widthMm: c.columns[0].widthMm - 50 });
  assert.equal(c.columns[0].railPosition, "JOS");
  // other contents ignore it; switching content resets it
  const other = atelierReducer(c, { type: "setColumnContent", index: 0, content: "POLITE" });
  assert.equal(other.columns[0].railPosition, undefined);
  assert.equal(atelierReducer(other, { type: "setColumnRail", index: 0, railPosition: "JOS" }), other);
});

test("hinged doors: handle kept with BATANTE only, door rows 1-3 per column", () => {
  let c = defaultConfig(catalog, "DRESSING");
  c = atelierReducer(c, { type: "setDoors", doors: { type: "BATANTE" }, handle: { type: "PUSH" } });
  assert.deepEqual(c.doors, { type: "BATANTE" });
  assert.deepEqual(c.handle, { type: "PUSH" });
  c = atelierReducer(c, { type: "setHandle", handle: { type: "APLICAT" } });
  assert.deepEqual(c.handle, { type: "APLICAT" });
  c = atelierReducer(c, { type: "setColumnDoorRows", index: 0, doorRows: 5 });
  assert.equal(c.columns[0].doorRows, 3);
  c = atelierReducer(c, { type: "setColumnDoorRows", index: 0, doorRows: 1 });
  assert.equal(c.columns[0].doorRows, undefined);
  const sliding = atelierReducer(c, { type: "setDoors", doors: { type: "GLISANTE" } });
  assert.equal(sliding.handle, undefined);
  assert.equal(atelierReducer(sliding, { type: "setHandle", handle: { type: "PUSH" } }), sliding);
  // switching back restores nothing by itself — the panel passes the handle again
  const comoda = atelierReducer(c, { type: "setCategory", category: "COMODA" });
  assert.equal(comoda.handle, undefined);
});

test("handles on comode and wall cabinets; none on the separator", () => {
  const comoda = atelierReducer(defaultConfig(catalog, "COMODA"), { type: "setHandle", handle: { type: "GOLA" } });
  assert.deepEqual(comoda.handle, { type: "GOLA" });
  const sus = atelierReducer(defaultConfig(catalog, "SUSPENDAT"), { type: "setHandle", handle: { type: "APLICAT" } });
  assert.deepEqual(sus.handle, { type: "APLICAT" });
  const sep = defaultConfig(catalog, "SEPARATOR");
  assert.equal(atelierReducer(sep, { type: "setHandle", handle: { type: "PUSH" } }), sep);
});

test("hinged doors across: one by default, two on request", () => {
  let c = atelierReducer(defaultConfig(catalog, "DRESSING"), { type: "setDoors", doors: { type: "BATANTE" } });
  assert.equal(c.columns[0].doorsAcross, undefined);
  c = atelierReducer(c, { type: "setColumnDoorsAcross", index: 0, doorsAcross: 2 });
  assert.equal(c.columns[0].doorsAcross, 2);
  c = atelierReducer(c, { type: "setColumnDoorsAcross", index: 0, doorsAcross: 1 });
  assert.equal(c.columns[0].doorsAcross, undefined);
});

test("bar + drawers: 1-3 interior drawers", () => {
  let c = atelierReducer(defaultConfig(catalog, "DRESSING"), { type: "setColumnContent", index: 0, content: "BARA_SERTARE" });
  c = atelierReducer(c, { type: "setColumnDrawers", index: 0, drawers: 3 });
  assert.equal(c.columns[0].drawers, 3);
  c = atelierReducer(c, { type: "setColumnDrawers", index: 0, drawers: 6 });
  assert.equal(c.columns[0].drawers, 3);
  assert.equal(c.columns[0].drawers, 3);
});

test("comode / wall cabinets: shelves 0-6 on door and open columns, not on drawers", () => {
  let c = defaultConfig(catalog, "SUSPENDAT");
  c = atelierReducer(c, { type: "setColumnShelves", index: 0, shelves: 0 });
  assert.equal(c.columns[0].shelves, 0);
  c = atelierReducer(c, { type: "setColumnShelves", index: 0, shelves: 9 });
  assert.equal(c.columns[0].shelves, 6);
  const comoda = defaultConfig(catalog, "COMODA"); // SERTARE columns
  assert.equal(atelierReducer(comoda, { type: "setColumnShelves", index: 0, shelves: 2 }), comoda);
});

test("separator bottom: drawers or doors, height clamped, NONE removes it, handle allowed only with it", () => {
  let c = defaultConfig(catalog, "SEPARATOR");
  assert.equal(atelierReducer(c, { type: "setHandle", handle: { type: "PUSH" } }), c);
  c = atelierReducer(c, { type: "setBottom", bottom: { type: "SERTARE", heightMm: 2000, drawers: 3 } });
  assert.deepEqual(c.bottom, { type: "SERTARE", heightMm: 1000, drawers: 3 });
  c = atelierReducer(c, { type: "setHandle", handle: { type: "PUSH" } });
  assert.deepEqual(c.handle, { type: "PUSH" });
  c = atelierReducer(c, { type: "setBottom", bottom: { type: "USI", heightMm: 700 } });
  assert.deepEqual(c.bottom, { type: "USI", heightMm: 700 });
  c = atelierReducer(c, { type: "setBottom", bottom: { type: "NONE" } });
  assert.equal(c.bottom, undefined);
  const dressing = defaultConfig(catalog, "DRESSING");
  assert.equal(atelierReducer(dressing, { type: "setBottom", bottom: { type: "SERTARE" } }), dressing);
});

test("separator bottom: one drawer, shelves behind the doors (0-4)", () => {
  let c = defaultConfig(catalog, "SEPARATOR");
  c = atelierReducer(c, { type: "setBottom", bottom: { type: "SERTARE", drawers: 1 } });
  assert.equal(c.bottom?.drawers, 1);
  c = atelierReducer(c, { type: "setBottom", bottom: { type: "USI", shelves: 7 } });
  assert.deepEqual(c.bottom, { type: "USI", shelves: 4 });
});

test("door type helpers: opening + face round-trip; hinged mirror keeps the handle", async () => {
  const { doorOpening, doorFace, doorType } = await import("../lib/atelier/door-types.ts");
  for (const t of ["NONE", "GLISANTE", "GLISANTE_OGLINDA", "GLISANTE_STICLA", "BATANTE", "BATANTE_OGLINDA", "BATANTE_STICLA"] as const)
    assert.equal(doorType(doorOpening(t), doorFace(t)), t);
  let c = atelierReducer(defaultConfig(catalog, "DRESSING"), { type: "setDoors", doors: { type: "BATANTE" } });
  c = atelierReducer(c, { type: "setHandle", handle: { type: "PUSH" } });
  c = atelierReducer(c, { type: "setDoors", doors: { type: "BATANTE_OGLINDA" } });
  assert.deepEqual(c.handle, { type: "PUSH" });
});

test("equal columns stay equal when the width changes (whole centimetres, remainder on the last)", () => {
  const s = atelierReducer(base(2400, cols(800, 800, 800)), { type: "setSize", widthMm: 1600 });
  assert.deepEqual(s.columns.map((c) => c.widthMm), [530, 530, 540]);
  assertValid(s);
  const wide = atelierReducer(base(2400, cols(800, 800, 800)), { type: "setSize", widthMm: 4000 });
  assert.deepEqual(wide.columns.map((c) => c.widthMm), [1000, 1000, 1000, 1000]);
  assertValid(wide);
});

test("hand-set widths are scaled, not equalised", () => {
  const s = atelierReducer(base(2400, cols(600, 1000, 800)), { type: "setSize", widthMm: 3000 });
  assert.deepEqual(s.columns.map((c) => c.widthMm), [775, 1200, 1025]);
  assertValid(s);
});

test("addColumn on equal columns re-splits evenly; removeColumn keeps the rest equal", () => {
  const added = atelierReducer(base(3000, cols(1000, 1000, 1000)), { type: "addColumn" });
  assert.deepEqual(added.columns.map((c) => c.widthMm), [750, 750, 750, 750]);
  const removed = atelierReducer(added, { type: "removeColumn", index: 1 });
  assert.deepEqual(removed.columns.map((c) => c.widthMm), [1000, 1000, 1000]);
  assertValid(removed);
});

test("equalizeColumns evens out hand-set widths", () => {
  const s = atelierReducer(base(2400, cols(600, 1000, 800)), { type: "equalizeColumns" });
  assert.deepEqual(s.columns.map((c) => c.widthMm), [800, 800, 800]);
  assert.equal(atelierReducer(s, { type: "equalizeColumns" }), s);
});
