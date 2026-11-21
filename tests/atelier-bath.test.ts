import assert from "node:assert/strict";
import test from "node:test";
import { atelierReducer, defaultConfig } from "../lib/atelier/state.ts";
import { decodeShare, encodeShare } from "../lib/atelier/share.ts";
import { counterMm, upperOf } from "../lib/atelier/kitchen.ts";
import { LAYOUT_PRESETS } from "../lib/atelier/presets.ts";
import { CATEGORY_RULES } from "../lib/atelier/categories.ts";
import type { AtelierCatalog, AtelierConfig } from "../lib/atelier/types.ts";

const mat = (id: string) => ({ id, name: id, decorCode: null, brand: null, imageUrl: null });
const catalog: AtelierCatalog = {
  carcass: [mat("c1")],
  fronts: { PAL: [mat("f1")], MDF_MELAMINAT: [], MDF_VOPSIT: [] },
  ral: [],
  worktops: [{ ...mat("blat-1"), thicknessMm: 38, maxDepthMm: 600 }],
};
const sum = (c: AtelierConfig["columns"]) => c.reduce((t, x) => t + x.widthMm, 0);
const bath = (): AtelierConfig => atelierReducer(defaultConfig(catalog, "BAIE"), { type: "setWorktop", worktopId: "blat-1" });

test("new bathroom furniture: wall-hung vanity with a mirror cabinet and a column", () => {
  const c = bath();
  assert.equal(c.legsMm, 0);
  assert.equal(sum(c.columns), c.widthMm);
  assert.deepEqual(c.columns.map((x) => x.content), ["LAVOAR", "COLOANA"]);
  assert.equal(upperOf(c.columns[0], true), "OGLINDA");
  assert.equal(counterMm(c), 850);
});

test("bathroom: no L, only bathroom modules, a washer raises the worktop", () => {
  const c = bath();
  assert.equal(atelierReducer(c, { type: "setKitchenLayout", layout: "L_STANGA" }), c);
  assert.equal(atelierReducer(c, { type: "setColumnContent", index: 0, content: "CUPTOR" }), c);
  const wide = atelierReducer(c, { type: "setSize", widthMm: 1800 });
  assert.equal(sum(wide.columns), 1800);
  const w = atelierReducer(wide, { type: "addColumn", content: "MASINA_SPALAT" });
  assert.ok(w.columns.some((x) => x.content === "MASINA_SPALAT"));
  assert.equal(sum(w.columns), w.widthMm);
  assert.equal(counterMm(w), 900);
  const d = atelierReducer(c, { type: "setColumnDrawers", index: 0, drawers: 1 });
  assert.equal(d.columns[0].drawers, 1);
  assert.equal(atelierReducer(c, { type: "setColumnUpper", index: 0, upper: "HOTA" }), c);
});

test("every bathroom model fits its wall and its limits", () => {
  const rules = CATEGORY_RULES.BAIE;
  for (const p of LAYOUT_PRESETS.filter((x) => x.category === "BAIE")) {
    assert.equal(sum(p.shape.columns), p.shape.widthMm, p.id);
    assert.ok(rules.legs.includes(p.shape.legsMm), p.id);
    for (const col of p.shape.columns) assert.ok(rules.contents.includes(col.content), `${p.id} ${col.content}`);
  }
});

test("bathroom furniture survives the share link", () => {
  let c = bath();
  c = atelierReducer(c, { type: "setColumnUpper", index: 0, upper: "USI" });
  c = atelierReducer(c, { type: "setLegs", legsMm: 100 });
  const back = decodeShare(encodeShare(c), catalog);
  assert.deepEqual(back, c);
});
