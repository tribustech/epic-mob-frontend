import assert from "node:assert/strict";
import test from "node:test";
import { FRONT_MATERIALS, KIND_OF_MATERIAL, PAINT_NEEDS_PLAIN, type FrontMaterial, colourDistance, frontOptions, namedColour, type FrontOption } from "../lib/atelier/front-materials.ts";
import { resolvePalettes } from "../lib/atelier/palettes.ts";
import type { AtelierCatalog, AtelierMaterial } from "../lib/atelier/types.ts";
import { FRONT_INFO, colourWithFronts, frontKey, frontMaterialFromSlug, splitFrontKey } from "../lib/shop/fronts.ts";
import { priceCheckRows } from "../lib/shop/price-check.ts";
import { SHOP_PRODUCTS } from "../lib/shop/products.ts";
import { frontVariants, variantConfig } from "../lib/shop/server.ts";
import { sizeKey, splitSizeKey } from "../lib/shop/sizes.ts";

const mat = (decorCode: string, name: string, brand: string): AtelierMaterial => ({
  id: `${brand}-${decorCode}`.toLowerCase().replace(/\s+/g, ""),
  name: `${decorCode} · ${name}`,
  decorCode,
  brand,
  imageUrl: null,
});

// real decor codes, so the measured tones (decor-tones.ts) are the ones the shop uses
const PAL = [
  mat("W1000 ST9", "Alb Premium", "Egger"),
  mat("U999 ST19", "Negru", "Egger"),
  mat("H1180 ST37", "Stejar Halifax Natur", "Egger"),
  mat("U702 ST9", "Gri Cașmir", "Egger"),
  mat("U638 ST9", "Verde Salvie", "Egger"),
];
const AGT = [
  mat("601", "HG White", "AGT"),
  mat("734", "Soft Touch White", "AGT"),
  mat("723", "Soft Touch Black", "AGT"),
  mat("384", "Matt Cashmere Gold", "AGT"),
  mat("397", "Matt Natural Touch Oak", "AGT"),
  mat("735", "Soft Touch Relax Green", "AGT"),
  mat("729", "Soft Touch New Grey", "AGT"),
];
const catalog: AtelierCatalog = {
  carcass: PAL,
  fronts: { PAL, MDF_MELAMINAT: AGT, MDF_VOPSIT: [{ id: "model-drept", name: "model-drept" }] },
  ral: [
    { code: "RAL 9016", name: "Traffic white", hex: "#F7FBF5" },
    { code: "RAL 9005", name: "Jet black", hex: "#0E0E10" },
    { code: "RAL 6019", name: "Pastel green", hex: "#B9CEAC" },
    { code: "RAL 7035", name: "Light grey", hex: "#C5C7C4" },
    { code: "RAL 1013", name: "Oyster white", hex: "#E3D9C6" },
  ],
  handles: { types: (["APLICAT", "BUTON", "INGROPAT", "PROFIL_J", "GOLA", "PUSH"] as const).map((type) => ({ type, label: type })) },
};
const id = (code: string, list: AtelierMaterial[]) => list.find((m) => m.decorCode === code)!.id;
const by = (options: FrontOption[], m: string) => options.find((o) => o.material === m)!;

test("fronts: always the three boards, cheapest first, the palette's own marked native", () => {
  const options = frontOptions(catalog, { kind: "PAL", materialId: id("W1000 ST9", PAL) });
  assert.deepEqual(options.map((o) => o.material), ["PAL", "AGT", "VOPSIT"]);
  assert.deepEqual(FRONT_MATERIALS, ["PAL", "AGT", "VOPSIT"]);
  assert.equal(by(options, "PAL").native, true);
  assert.deepEqual(by(options, "PAL").fronts, { kind: "PAL", materialId: id("W1000 ST9", PAL) });
  assert.equal(options.filter((o) => o.native).length, 1);
});

test("fronts: white PAL → matt white AGT (not high gloss) and the nearest white RAL on the flat painted model", () => {
  const options = frontOptions(catalog, { kind: "PAL", materialId: id("W1000 ST9", PAL) });
  assert.deepEqual(by(options, "AGT").fronts, { kind: "MDF_MELAMINAT", materialId: id("734", AGT) });
  assert.equal(by(options, "AGT").colourName, "Soft Touch White · AGT 734");
  assert.deepEqual(by(options, "VOPSIT").fronts, { kind: "MDF_VOPSIT", modelId: "model-drept", ralCode: "RAL 9016" });
  assert.equal(by(options, "VOPSIT").colourName, "Alb trafic · RAL 9016");
});

test("fronts: black stays black, green stays green (the name helps where the photos measure close)", () => {
  const black = frontOptions(catalog, { kind: "PAL", materialId: id("U999 ST19", PAL) });
  assert.equal(by(black, "AGT").fronts?.materialId, id("723", AGT));
  assert.equal(by(black, "VOPSIT").fronts?.ralCode, "RAL 9005");
  const green = frontOptions(catalog, { kind: "PAL", materialId: id("U638 ST9", PAL) });
  assert.equal(by(green, "AGT").fronts?.materialId, id("735", AGT));
  assert.equal(by(green, "VOPSIT").fronts?.ralCode, "RAL 6019");
});

test("fronts: a wood front maps to a wood AGT decor, and paint is not offered for it", () => {
  const oak = frontOptions(catalog, { kind: "PAL", materialId: id("H1180 ST37", PAL) });
  assert.equal(by(oak, "AGT").fronts?.materialId, id("397", AGT));
  assert.equal(by(oak, "VOPSIT").fronts, null);
  assert.equal(by(oak, "VOPSIT").reason, PAINT_NEEDS_PLAIN);
  assert.equal(PAINT_NEEDS_PLAIN, "Vopsit doar în culori uni");
  // no wood on the AGT list: no AGT option rather than a flat colour
  const noWood = { ...catalog, fronts: { ...catalog.fronts, MDF_MELAMINAT: AGT.filter((m) => m.decorCode !== "397") } };
  assert.equal(by(frontOptions(noWood, { kind: "PAL", materialId: id("H1180 ST37", PAL) }), "AGT").fronts, null);
});

test("fronts: an AGT or painted colour is native there and maps back to the nearest PAL decor", () => {
  const agt = frontOptions(catalog, { kind: "MDF_MELAMINAT", materialId: id("734", AGT) });
  assert.equal(by(agt, "AGT").native, true);
  assert.equal(by(agt, "PAL").fronts?.materialId, id("W1000 ST9", PAL));
  const painted = frontOptions(catalog, { kind: "MDF_VOPSIT", modelId: "model-drept", ralCode: "RAL 9005" });
  assert.equal(by(painted, "VOPSIT").native, true);
  assert.equal(by(painted, "VOPSIT").colourName, "Negru intens · RAL 9005");
  assert.equal(by(painted, "PAL").fronts?.materialId, id("U999 ST19", PAL));
  assert.equal(by(painted, "AGT").fronts?.materialId, id("723", AGT));
});

test("fronts: a handle cut into the front keeps the painted fronts it needs", () => {
  const options = frontOptions(catalog, { kind: "MDF_VOPSIT", modelId: "model-drept", ralCode: "RAL 9016" }, "INGROPAT");
  assert.equal(by(options, "VOPSIT").native, true);
  assert.equal(by(options, "PAL").fronts, null);
  assert.equal(by(options, "AGT").fronts, null);
  assert.ok(by(options, "PAL").reason);
});

test("fronts: helpers", () => {
  assert.equal(namedColour("Gri Grafit"), "GREY");
  assert.equal(namedColour("Grey brown"), "BROWN");
  assert.equal(namedColour("Soft Touch Storm Grey"), "GREY");
  assert.equal(namedColour("Taupe"), null);
  assert.equal(colourDistance("#ffffff", "#ffffff"), 0);
  assert.ok(colourDistance("#000000", "#ffffff") > 99);
});

test("basket keys: the board of the fronts sits before the width; the colour's own board has no suffix", () => {
  assert.equal(frontKey("alb-casmir", "AGT", "PAL"), "alb-casmir~agt");
  assert.equal(frontKey("alb-casmir", "PAL", "PAL"), "alb-casmir");
  assert.equal(frontKey("alb-casmir", null, "PAL"), "alb-casmir");
  assert.equal(frontKey("supermat-crem", "PAL", "AGT"), "supermat-crem~pal");
  assert.equal(sizeKey(frontKey("alb-casmir", "VOPSIT", "PAL"), 1800, 2400), "alb-casmir~vopsit@1800");
  assert.deepEqual(splitSizeKey("alb-casmir~vopsit@1800"), { paletteId: "alb-casmir", widthMm: 1800, front: "VOPSIT" });
  assert.deepEqual(splitSizeKey("alb-casmir~agt"), { paletteId: "alb-casmir", widthMm: null, front: "AGT" });
  assert.deepEqual(splitSizeKey("alb-casmir@1800"), { paletteId: "alb-casmir", widthMm: 1800, front: null });
  assert.deepEqual(splitFrontKey("alb-casmir~lemn"), { paletteId: "alb-casmir", front: null });
  assert.equal(frontMaterialFromSlug("VOPSIT"), "VOPSIT");
  assert.equal(frontMaterialFromSlug("x"), null);
  assert.equal(colourWithFronts("Alb & cașmir", "VOPSIT"), "Alb & cașmir · fronturi MDF vopsit");
  assert.equal(colourWithFronts("Alb & cașmir", null), "Alb & cașmir");
  for (const m of FRONT_MATERIALS) assert.ok(FRONT_INFO[m].href.startsWith("/materiale/"));
});

test("shop: a piece with fronts offers the boards, keeps its body, and an open shelf offers none", () => {
  const palette = resolvePalettes(catalog).find((p) => p.fronts.kind === "PAL" && p.fronts.materialId === id("U702 ST9", PAL))!;
  assert.ok(palette, "a cașmir palette");
  const chest = SHOP_PRODUCTS.find((p) => p.slug === "comoda-clasica-160")!;
  const variants = frontVariants(chest, palette, catalog);
  assert.deepEqual(variants.map((v) => v.option.material), ["PAL", "AGT", "VOPSIT"]);
  const base = variantConfig(chest, palette, catalog);
  for (const v of variants) {
    assert.ok(v.config);
    assert.equal(v.config!.carcassMaterialId, base.carcassMaterialId);
    assert.equal(v.config!.widthMm, base.widthMm);
    assert.equal(v.option.key, v.option.native ? palette.id : `${palette.id}~${v.option.material.toLowerCase()}`);
  }
  assert.equal(variants.find((v) => v.option.material === "VOPSIT")!.config!.fronts.kind, "MDF_VOPSIT");
  const shelf = SHOP_PRODUCTS.find((p) => p.slug === "separator-biblioteca-120")!;
  assert.deepEqual(frontVariants(shelf, palette, catalog), []);
});

test("admin price check lists the other boards of every colour, with a ?fronturi= link", () => {
  const rows = priceCheckRows(catalog, "2026-11-21").filter((r) => r.variant.startsWith("fronturi:"));
  assert.ok(rows.length > 0);
  for (const r of rows) {
    assert.match(r.path, /[?&]fronturi=(pal|agt|vopsit)$/);
    assert.equal(r.config.fronts.kind, KIND_OF_MATERIAL[r.variant.slice("fronturi:".length) as FrontMaterial]);
  }
});
