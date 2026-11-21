import assert from "node:assert/strict";
import test from "node:test";
import { atelierReducer, defaultConfig } from "../lib/atelier/state.ts";
import type { AtelierCatalog, AtelierConfig } from "../lib/atelier/types.ts";

const mat = (id: string) => ({ id, name: id, decorCode: null, brand: null, imageUrl: null });
const catalog: AtelierCatalog = {
  carcass: [mat("c1")],
  fronts: { PAL: [mat("f1")], MDF_MELAMINAT: [], MDF_VOPSIT: [] },
  ral: [],
};

/** A chest of drawers with partial-extension runners chosen. */
function chestWithPartial(): AtelierConfig {
  const chest = atelierReducer(defaultConfig(catalog), { type: "setCategory", category: "COMODA" });
  const next = atelierReducer(chest, { type: "setDrawerExtension", extension: "PARTIALA" });
  assert.equal(next.drawerExtension, "PARTIALA");
  return next;
}

test("the drawer runner choice is dropped when the category changes", () => {
  const dressing = atelierReducer(chestWithPartial(), { type: "setCategory", category: "DRESSING" });
  assert.equal(dressing.drawerExtension, undefined);
});

test("the drawer runner choice is dropped once no front drawers are left", () => {
  let c = chestWithPartial();
  c = atelierReducer(c, { type: "setColumnContent", index: 0, content: "USI" });
  assert.equal(c.drawerExtension, "PARTIALA", "one column of drawers is left");
  c = atelierReducer(c, { type: "setColumnContent", index: 1, content: "DESCHIS" });
  assert.deepEqual(c.columns.map((col) => col.content), ["USI", "DESCHIS"]);
  assert.equal(c.drawerExtension, undefined);
  // furniture without front drawers cannot take the choice at all
  const dressing = defaultConfig(catalog);
  assert.equal(atelierReducer(dressing, { type: "setDrawerExtension", extension: "PARTIALA" }).drawerExtension, undefined);
});

test("the drawer runner choice stays while there are front drawers", () => {
  const c = atelierReducer(chestWithPartial(), { type: "setSize", heightMm: 900 });
  assert.equal(c.drawerExtension, "PARTIALA");
});
