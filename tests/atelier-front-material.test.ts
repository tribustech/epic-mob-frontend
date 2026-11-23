import assert from "node:assert/strict";
import test from "node:test";
import {
  FRONT_MATERIALS,
  FRONT_MATERIAL_LABEL,
  frontMaterialsOffered,
  frontsInMaterial,
  switchFrontMaterial,
} from "../lib/atelier/palettes.ts";
import type { AtelierCatalog, AtelierFronts, AtelierMaterial } from "../lib/atelier/types.ts";

const mat = (decorCode: string, name: string, brand = "Egger"): AtelierMaterial => ({
  id: `m-${decorCode.replace(/\s+/g, "").toLowerCase()}`,
  name: `${decorCode} · ${name}`,
  decorCode,
  brand,
  imageUrl: null,
});

// measured tones (lib/atelier/decor-tones.ts): W1000 #f8f8f6 white, U638 #bdbba2 sage, H1180 #b59570 oak,
// AGT 734 #fefffa white, 735 #9eb0a4 green, 723 #010101 black
const PAL = [mat("W1000 ST9", "Alb premium"), mat("U638 ST9", "Verde salvie"), mat("H1180 ST37", "Stejar Halifax natur")];
const AGT = [mat("734", "Supermat White", "AGT"), mat("735", "Supermat Green", "AGT"), mat("723", "Supermat Black", "AGT")];

function catalog(over: Partial<AtelierCatalog> = {}): AtelierCatalog {
  return {
    carcass: PAL,
    fronts: { PAL, MDF_MELAMINAT: AGT, MDF_VOPSIT: [{ id: "model-drept", name: "Drept" }] },
    ral: [
      { code: "RAL 9016", name: "Traffic white", hex: "#F1F1EA" },
      { code: "RAL 6019", name: "Pastel green", hex: "#B9CEAC" },
      { code: "RAL 1001", name: "Beige", hex: "#D0B084" },
      { code: "RAL 1019", name: "Grey beige", hex: "#A48F7A" },
      { code: "RAL 1036", name: "Pearl gold", hex: "#B5946A" },
      { code: "RAL 9005", name: "Jet black", hex: "#0E0E10" },
    ],
    ...over,
  };
}

const pal = (code: string): AtelierFronts => ({ kind: "PAL", materialId: `m-${code.replace(/\s+/g, "").toLowerCase()}` });

test("the three materials, PAL first, with the names the workshop uses", () => {
  assert.deepEqual(
    FRONT_MATERIALS.map((m) => m.kind),
    ["PAL", "MDF_MELAMINAT", "MDF_VOPSIT"],
  );
  assert.equal(FRONT_MATERIAL_LABEL.PAL, "PAL melaminat");
  assert.equal(FRONT_MATERIAL_LABEL.MDF_MELAMINAT, "MDF melaminat (AGT)");
  assert.equal(FRONT_MATERIAL_LABEL.MDF_VOPSIT, "MDF vopsit");
  for (const m of FRONT_MATERIALS) assert.ok(m.hint.length > 10 && m.hint.length < 70, m.hint);
});

test("only the materials the catalog can make are offered", () => {
  assert.deepEqual(frontMaterialsOffered(catalog()), ["PAL", "MDF_MELAMINAT", "MDF_VOPSIT"]);
  assert.deepEqual(frontMaterialsOffered(catalog({ ral: [] })), ["PAL", "MDF_MELAMINAT"]);
  const c = catalog();
  assert.deepEqual(frontMaterialsOffered({ ...c, fronts: { ...c.fronts, MDF_MELAMINAT: [], MDF_VOPSIT: [] } }), ["PAL"]);
});

test("a flat colour keeps its colour in every material", () => {
  const c = catalog();
  assert.deepEqual(frontsInMaterial(c, pal("U638 ST9"), "MDF_MELAMINAT"), { fronts: { kind: "MDF_MELAMINAT", materialId: "m-735" }, approx: false });
  assert.deepEqual(frontsInMaterial(c, pal("W1000 ST9"), "MDF_MELAMINAT")?.fronts.materialId, "m-734");
  const sage = frontsInMaterial(c, pal("U638 ST9"), "MDF_VOPSIT");
  assert.deepEqual(sage, { fronts: { kind: "MDF_VOPSIT", modelId: "model-drept", ralCode: "RAL 6019", faces: 1 }, approx: false });
  assert.equal(frontsInMaterial(c, pal("W1000 ST9"), "MDF_VOPSIT")?.fronts.ralCode, "RAL 9016");
  // and back from paint
  const black: AtelierFronts = { kind: "MDF_VOPSIT", modelId: "model-drept", ralCode: "RAL 9005", faces: 1 };
  assert.equal(frontsInMaterial(c, black, "MDF_MELAMINAT")?.fronts.materialId, "m-723");
  const white: AtelierFronts = { kind: "MDF_VOPSIT", modelId: "model-drept", ralCode: "RAL 9016", faces: 2 };
  assert.equal(frontsInMaterial(c, white, "PAL")?.fronts.materialId, "m-w1000st9");
});

test("paint cannot imitate wood: the nearest flat colour (never a pearl one), and it says so", () => {
  const r = frontsInMaterial(catalog(), pal("H1180 ST37"), "MDF_VOPSIT");
  assert.equal(r?.approx, true);
  // oak #b59570: „Pearl gold" #B5946A is nearer, but a pearl paint is never a stand-in
  assert.equal(r?.fronts.ralCode, "RAL 1019");
});

test("a matte front is matched to a matte panel, not a high-gloss one", () => {
  const c = catalog();
  const glossy: AtelierCatalog = { ...c, fronts: { ...c.fronts, MDF_MELAMINAT: [mat("601", "HG White", "AGT"), ...AGT] } };
  assert.equal(frontsInMaterial(glossy, pal("W1000 ST9"), "MDF_MELAMINAT")?.fronts.materialId, "m-734");
  const onlyGloss: AtelierCatalog = { ...c, fronts: { ...c.fronts, MDF_MELAMINAT: [mat("601", "HG White", "AGT"), AGT[2]] } };
  assert.equal(frontsInMaterial(onlyGloss, pal("W1000 ST9"), "MDF_MELAMINAT")?.fronts.materialId, "m-601");
});

test("a wood decor stays wood when the other material has wood; paint never lands on a wood decor from a plain colour", () => {
  const oakAgt = mat("397", "Supermat Oak", "AGT");
  const c = catalog();
  const withOak: AtelierCatalog = { ...c, fronts: { ...c.fronts, MDF_MELAMINAT: [...AGT, oakAgt] } };
  assert.equal(frontsInMaterial(withOak, pal("H1180 ST37"), "MDF_MELAMINAT")?.fronts.materialId, "m-397");
  const beige: AtelierFronts = { kind: "MDF_VOPSIT", modelId: "model-drept", ralCode: "RAL 1001", faces: 1 };
  assert.notEqual(frontsInMaterial(withOak, beige, "PAL")?.fronts.materialId, "m-h1180st37");
});

test("the same decor code in the other material wins", () => {
  const c = catalog();
  const both: AtelierCatalog = { ...c, fronts: { ...c.fronts, MDF_MELAMINAT: [...AGT, { ...PAL[1], id: "agt-u638", brand: "AGT" }] } };
  assert.equal(frontsInMaterial(both, pal("U638 ST9"), "MDF_MELAMINAT")?.fronts.materialId, "agt-u638");
});

test("nothing to switch to: null; the same material: unchanged", () => {
  const c = catalog();
  assert.equal(frontsInMaterial(catalog({ ral: [] }), pal("U638 ST9"), "MDF_VOPSIT"), null);
  assert.equal(frontsInMaterial({ ...c, fronts: { ...c.fronts, MDF_MELAMINAT: [] } }, pal("U638 ST9"), "MDF_MELAMINAT"), null);
  const f = pal("U638 ST9");
  assert.equal(frontsInMaterial(c, f, "PAL")?.fronts, f);
});

test("comparing materials comes back to the client's own colour", () => {
  const c = catalog();
  const start = pal("H1180 ST37");
  const agt = switchFrontMaterial(c, start, "MDF_MELAMINAT", null)!;
  const paint = switchFrontMaterial(c, agt.fronts, "MDF_VOPSIT", agt.trail)!;
  // matched to the oak, not to the AGT stand-in
  assert.equal(paint.fronts.ralCode, frontsInMaterial(c, start, "MDF_VOPSIT")!.fronts.ralCode);
  assert.equal(paint.approx, true);
  const back = switchFrontMaterial(c, paint.fronts, "PAL", paint.trail)!;
  assert.equal(back.fronts, start);
  // a colour picked by hand becomes the new origin
  const picked: AtelierFronts = { kind: "MDF_VOPSIT", modelId: "model-drept", ralCode: "RAL 9005", faces: 1 };
  const fromPicked = switchFrontMaterial(c, picked, "PAL", paint.trail)!;
  assert.equal(fromPicked.trail.origin, picked);
  assert.notEqual(fromPicked.fronts, start);
});

test("each material is priced as the client would get it: a recessed handle falls back off paint", async () => {
  const { withFronts } = await import("../components/atelier/material-prices.ts");
  const { defaultConfig } = await import("../lib/atelier/state.ts");
  const c: AtelierCatalog = { ...catalog(), handles: { types: [{ type: "INGROPAT", label: "Îngropat" }, { type: "BARA", label: "Bară" }] } } as AtelierCatalog;
  const base = defaultConfig(c, "COMODA");
  const painted = { ...base, fronts: { kind: "MDF_VOPSIT", modelId: "model-drept", ralCode: "RAL 9016", faces: 1 } as AtelierFronts, handle: { type: "INGROPAT" as const } };
  const onPal = withFronts(painted, pal("W1000 ST9"), c);
  assert.equal(onPal.fronts.kind, "PAL");
  assert.notEqual(onPal.handle?.type, "INGROPAT");
  // the same material: nothing changes
  assert.deepEqual(withFronts(painted, painted.fronts, c), painted);
});
