import assert from "node:assert/strict";
import test from "node:test";
import { atelierReducer, defaultConfig } from "../lib/atelier/state.ts";
import { decodeShare, encodeShare } from "../lib/atelier/share.ts";
import { fitKitchen, kitchenColumn, legBModulesMm, withLayout } from "../lib/atelier/kitchen.ts";
import { LAYOUT_PRESETS } from "../lib/atelier/presets.ts";
import type { AtelierCatalog, AtelierConfig } from "../lib/atelier/types.ts";

const mat = (id: string) => ({ id, name: id, decorCode: null, brand: null, imageUrl: null });
const catalog: AtelierCatalog = {
  carcass: [mat("c1")],
  fronts: { PAL: [mat("f1")], MDF_MELAMINAT: [], MDF_VOPSIT: [] },
  ral: [],
  worktops: [{ ...mat("blat-1"), thicknessMm: 38, maxDepthMm: 600 }],
};

const sum = (c: AtelierConfig["columns"]) => c.reduce((t, x) => t + x.widthMm, 0);
const kitchen = (): AtelierConfig => atelierReducer(defaultConfig(catalog, "BUCATARIE"), { type: "setWorktop", worktopId: "blat-1" });

test("a new kitchen fills its wall exactly", () => {
  const c = kitchen();
  assert.equal(c.category, "BUCATARIE");
  assert.equal(sum(c.columns), c.widthMm);
  assert.equal(c.kitchen?.layout, "LINIAR");
});

test("every kitchen model fills its walls exactly", () => {
  for (const p of LAYOUT_PRESETS.filter((x) => x.category === "BUCATARIE")) {
    assert.equal(sum(p.shape.columns), p.shape.widthMm, p.id);
    if (p.shape.kitchen?.layout !== "LINIAR") assert.equal(sum(p.shape.kitchen!.legB!.columns), legBModulesMm(p.shape), p.id);
  }
});

test("changing the wall length refits the modules", () => {
  const c = atelierReducer(kitchen(), { type: "setSize", widthMm: 3000 });
  assert.equal(sum(c.columns), 3000);
  const d = atelierReducer(c, { type: "setSize", widthMm: 1800 });
  assert.equal(sum(d.columns), 1800);
});

test("an L gets a corner unit and a second wall; back to one wall drops both", () => {
  const l = atelierReducer(kitchen(), { type: "setKitchenLayout", layout: "L_STANGA" });
  assert.equal(l.columns[0].content, "COLT");
  assert.equal(sum(l.columns), l.widthMm);
  assert.ok(l.kitchen?.legB);
  assert.equal(sum(l.kitchen!.legB!.columns), legBModulesMm(l));
  const r = atelierReducer(l, { type: "setKitchenLayout", layout: "L_DREAPTA" });
  assert.equal(r.columns[r.columns.length - 1].content, "COLT");
  const one = atelierReducer(r, { type: "setKitchenLayout", layout: "LINIAR" });
  assert.ok(!one.columns.some((c) => c.content === "COLT"));
  assert.equal(one.kitchen?.legB, undefined);
  assert.equal(sum(one.columns), one.widthMm);
  assert.equal(withLayout(one, "LINIAR"), null);
});

test("the second wall refits when its length changes", () => {
  const l = atelierReducer(kitchen(), { type: "setKitchenLayout", layout: "L_STANGA" });
  const longer = atelierReducer(l, { type: "setLegB", widthMm: 2600 });
  assert.equal(longer.kitchen?.legB?.widthMm, 2600);
  assert.equal(sum(longer.kitchen!.legB!.columns), 2600 - longer.depthMm);
});

test("fitKitchen keeps appliance modules and adds drawers when the wall grows", () => {
  const cols = [kitchenColumn("CUPTOR"), kitchenColumn("SERTARE")];
  const out = fitKitchen(cols, 3000)!;
  assert.equal(sum(out), 3000);
  assert.equal(out[0].widthMm, 600);
  assert.equal(fitKitchen([kitchenColumn("CUPTOR")], 400), null);
});

test("a kitchen survives the share link", () => {
  let c = atelierReducer(kitchen(), { type: "setKitchenLayout", layout: "L_DREAPTA" });
  c = atelierReducer(c, { type: "setLed", led: true });
  c = atelierReducer(c, { type: "setColumnUpper", index: 0, upper: "DESCHIS" });
  const back = decodeShare(encodeShare(c), catalog);
  assert.deepEqual(back, c);
});

test("turning a one-wall kitchen into an L moves what does not fit round the corner", () => {
  const before = kitchen();
  const l = atelierReducer(before, { type: "setKitchenLayout", layout: "L_STANGA" });
  const all = [...l.columns, ...l.kitchen!.legB!.columns].map((c) => c.content);
  for (const c of before.columns) assert.ok(all.includes(c.content), `${c.content} kept`);
  const r = atelierReducer(before, { type: "setKitchenLayout", layout: "L_DREAPTA" });
  const allR = [...r.columns, ...r.kitchen!.legB!.columns].map((c) => c.content);
  for (const c of before.columns) assert.ok(allR.includes(c.content), `${c.content} kept`);
});
