import assert from "node:assert/strict";
import test from "node:test";
import { atelierReducer, defaultConfig } from "../lib/atelier/state.ts";
import { handleBlockers, usesFronts } from "../lib/atelier/handles.ts";
import { nearestRal, paintedFrontsLike } from "../lib/atelier/palettes.ts";
import { STEP_IDS, nearestStep, stepLabel, stepsFor } from "../components/atelier/session.ts";
import type { AtelierCatalog, AtelierConfig } from "../lib/atelier/types.ts";

const m = (id: string) => ({ id, name: id, decorCode: null, brand: null, imageUrl: null });
const base = { carcass: [m("alb")], fronts: { PAL: [m("alb")], MDF_MELAMINAT: [], MDF_VOPSIT: [m("mdf")] }, ral: [] } as unknown as AtelierCatalog;
const dressing = defaultConfig(base);
const hinged = atelierReducer(dressing, { type: "setDoors", doors: { type: "BATANTE" } });

test("the doors step: named after what the furniture has, skipped when it has neither", () => {
  assert.deepEqual(stepsFor(dressing), STEP_IDS);
  assert.ok(STEP_IDS.indexOf("usi") < STEP_IDS.indexOf("interior"));
  assert.equal(stepLabel("usi", dressing), "Uși și mânere");
  const comoda = defaultConfig(base, "COMODA");
  assert.ok(stepsFor(comoda).includes("usi"));
  assert.equal(stepLabel("usi", comoda), "Mânere");
  const open: AtelierConfig = { ...defaultConfig(base, "SEPARATOR"), bottom: undefined };
  assert.ok(!stepsFor(open).includes("usi"));
  // a link or a restored session that points at the missing step lands on the next one
  assert.equal(nearestStep("usi", open), "interior");
  assert.equal(nearestStep("usi", dressing), "usi");
  assert.equal(nearestStep("oferta", open), "oferta");
});

test("why a handle is not available", () => {
  assert.deepEqual(handleBlockers(hinged, "APLICAT"), { paint: false, glazed: false });
  assert.equal(handleBlockers(hinged, "INGROPAT").paint, hinged.fronts.kind !== "MDF_VOPSIT");
  const painted: AtelierConfig = { ...hinged, fronts: { kind: "MDF_VOPSIT", modelId: "m", ralCode: "9010", faces: 1 } };
  assert.deepEqual(handleBlockers(painted, "PROFIL_J"), { paint: false, glazed: false });
  const mirrored = atelierReducer(painted, { type: "setDoorFills", fills: painted.columns.map(() => "OGLINDA" as const) });
  assert.deepEqual(handleBlockers(mirrored, "INGROPAT"), { paint: false, glazed: true });
});

test("the fronts material is shown only when something is made of it", () => {
  assert.equal(usesFronts(hinged), true);
  const allMirror = atelierReducer(dressing, { type: "setDoors", doors: { type: "GLISANTE_OGLINDA" } });
  const noDrawers: AtelierConfig = { ...allMirror, columns: allMirror.columns.map((c) => ({ ...c, content: "POLITE" as const })) };
  assert.equal(usesFronts(noDrawers), false);
  assert.equal(usesFronts({ ...noDrawers, columns: noDrawers.columns.map((c, i) => (i ? c : { ...c, content: "BARA_SERTARE" as const })) }), true);
});

test("painted fronts close to the current look", () => {
  const ral = [
    { code: "9010", name: "Pure white", hex: "#f1ece1" },
    { code: "7016", name: "Anthracite grey", hex: "#383e42" },
    { code: "1019", name: "Grey beige", hex: "#a48f7a" },
  ];
  assert.equal(nearestRal(ral, "#fafafa")?.code, "9010");
  assert.equal(nearestRal(ral, "#30343a")?.code, "7016");
  assert.equal(nearestRal([], "#ffffff"), null);
  const catalog = { carcass: [], fronts: { PAL: [], MDF_MELAMINAT: [], MDF_VOPSIT: [{ id: "mdf", name: "MDF", decorCode: null, brand: null, imageUrl: null }] }, ral } as unknown as AtelierCatalog;
  const fronts = paintedFrontsLike(catalog, "#b09a80");
  assert.equal(fronts?.kind, "MDF_VOPSIT");
  assert.equal(fronts?.ralCode, "1019");
  assert.equal(paintedFrontsLike({ ...catalog, ral: [] }, "#ffffff"), null);
});
