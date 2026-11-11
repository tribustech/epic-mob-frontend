import assert from "node:assert/strict";
import test from "node:test";
import {
  atelierReducer,
  defaultColumns,
  defaultConfig,
} from "../lib/atelier/state.ts";
import { isLatest } from "../lib/atelier/use-live-price.ts";
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
