import assert from "node:assert/strict";
import test from "node:test";
import { hasDrawers, hasFrontDrawers } from "../lib/atelier/drawers.ts";
import { parseCm } from "../lib/atelier/length.ts";
import { compartmentsText, drawerRunnersText } from "../lib/atelier/offer-summary.ts";
import { cardNames, categoryAvailable, presetById, presetsFor } from "../lib/atelier/presets.ts";
import { atelierReducer, defaultConfig } from "../lib/atelier/state.ts";
import type { AtelierCatalog, AtelierConfig } from "../lib/atelier/types.ts";

const mat = (id: string) => ({ id, name: id, decorCode: null, brand: null, imageUrl: null });
const catalog: AtelierCatalog = {
  carcass: [mat("c1")],
  fronts: { PAL: [mat("f1")], MDF_MELAMINAT: [], MDF_VOPSIT: [] },
  ral: [],
};
const withPartial: AtelierCatalog = { ...catalog, drawerExtensions: ["COMPLETA", "PARTIALA"] };

function dressingWithDrawers(): AtelierConfig {
  let c = defaultConfig(catalog);
  assert.equal(c.category, "DRESSING");
  c = atelierReducer(c, { type: "setColumnContent", index: 0, content: "BARA_SERTARE" });
  return c;
}

test("dressing interior drawers take the runner choice too (F05: the CRM quotes them on TANDEM slides)", () => {
  const c = dressingWithDrawers();
  assert.equal(hasFrontDrawers(c), false);
  assert.equal(hasDrawers(c), true);
  const partial = atelierReducer(c, { type: "setDrawerExtension", extension: "PARTIALA" });
  assert.equal(partial.drawerExtension, "PARTIALA");
  // no drawers left: the choice goes
  const none = atelierReducer(partial, { type: "setColumnContent", index: 0, content: "POLITE" });
  assert.equal(hasDrawers(none), false);
  assert.equal(none.drawerExtension, undefined);
});

test("the offer lists the drawer runners when they could be chosen (F03)", () => {
  const c = dressingWithDrawers();
  assert.equal(drawerRunnersText(c, catalog), null, "the CRM offers only one kind");
  assert.equal(drawerRunnersText(c, withPartial), "Glisiere Blum TANDEM, extracție completă");
  const partial = atelierReducer(c, { type: "setDrawerExtension", extension: "PARTIALA" });
  assert.equal(drawerRunnersText(partial, withPartial), "Glisiere Blum TANDEM, extracție parțială");
  const noDrawers = defaultConfig(catalog);
  assert.equal(drawerRunnersText(noDrawers, withPartial), null);
});

test("the offer says what is in the compartments (F11)", () => {
  let chest = atelierReducer(defaultConfig(catalog), { type: "setCategory", category: "COMODA" });
  chest = atelierReducer(chest, { type: "setColumnContent", index: 1, content: "USI" });
  assert.equal(compartmentsText(chest), "2 compartimente: sertare, uși batante");
  const three = { category: "DRESSING" as const, columns: [{ widthMm: 800, content: "BARA" as const }, { widthMm: 800, content: "POLITE" as const }, { widthMm: 800, content: "BARA" as const }] };
  assert.equal(compartmentsText(three), "3 coloane: 2 × bară de haine, polițe");
});

test("category chips need a model this CRM can price (F01)", () => {
  assert.equal(categoryAvailable("DRESSING", catalog), true);
  assert.equal(categoryAvailable("BUCATARIE", catalog), false, "no worktops: no kitchens");
  assert.equal(categoryAvailable("BAIE", catalog), false);
  const kitchens = { ...catalog, worktops: [{ ...mat("w1"), thicknessMm: 38, maxDepthMm: 600 }] };
  assert.equal(categoryAvailable("BUCATARIE", kitchens), true);
  assert.equal(categoryAvailable("BAIE", kitchens), true);
});

test("model cards keep the size in the name when two would read the same (F14)", () => {
  assert.deepEqual(cardNames(["Comodă cu 6 sertare 1,6 m", "Comodă TV 2 m", "Comodă TV 2,4 m", "Noptieră cu 2 sertare"]), [
    "Comodă cu 6 sertare",
    "Comodă TV 2 m",
    "Comodă TV 2,4 m",
    "Noptieră cu 2 sertare",
  ]);
  for (const category of ["DRESSING", "COMODA", "SEPARATOR", "SUSPENDAT", "BUCATARIE", "BAIE"] as const) {
    const names = cardNames(presetsFor(category).map((p) => p.name));
    assert.equal(new Set(names).size, names.length, `${category}: ${names.join(" / ")}`);
  }
  assert.ok(presetById("comoda-tv-200"));
});

test("a small bare number is centimetres, never silently metres (F16)", () => {
  assert.equal(parseCm("5"), 50, "5 cm: the control raises it to its minimum, with the note");
  assert.equal(parseCm("240"), 2400);
  assert.equal(parseCm("240,5"), 2405);
  assert.equal(parseCm("2,4"), 2400, "a decimal under 10 can only be metres");
  assert.equal(parseCm("1.8"), 1800);
  assert.equal(parseCm("5 m"), 5000, "said explicitly");
  assert.equal(parseCm("2400 mm"), 2400);
  assert.equal(parseCm("60 cm"), 600);
  assert.equal(parseCm("abc"), null);
  assert.equal(parseCm("-100"), null);
});
