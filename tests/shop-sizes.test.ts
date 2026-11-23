import assert from "node:assert/strict";
import test from "node:test";
import { LAYOUT_PRESETS } from "../lib/atelier/presets.ts";
import { atelierReducer } from "../lib/atelier/state.ts";
import type { AtelierConfig } from "../lib/atelier/types.ts";
import { SHOP_PRODUCTS } from "../lib/shop/products.ts";
import { resizedConfig, sizeKey, sizedName, sizeOptions, splitSizeKey, widthLabel } from "../lib/shop/sizes.ts";

test("size keys round-trip and the photographed width has no suffix", () => {
  assert.equal(sizeKey("alb-total", 1800, 2400), "alb-total@1800");
  assert.equal(sizeKey("alb-total", 2400, 2400), "alb-total");
  assert.equal(sizeKey("alb-total", null, 2400), "alb-total");
  assert.deepEqual(splitSizeKey("alb-total@1800"), { paletteId: "alb-total", widthMm: 1800, front: null });
  assert.deepEqual(splitSizeKey("alb-total"), { paletteId: "alb-total", widthMm: null, front: null });
  assert.deepEqual(splitSizeKey("alb-total@abc"), { paletteId: "alb-total", widthMm: null, front: null });
});

test("every shop product comes in at most 3 widths, its own included, and each one can be built", () => {
  for (const product of SHOP_PRODUCTS) {
    const preset = product.preset;
    const widths = sizeOptions(preset);
    assert.ok(widths.length >= 2 && widths.length <= 3, `${product.slug}: ${widths}`);
    assert.ok(widths.includes(preset.shape.widthMm), product.slug);
    const base = atelierReducer({ carcassMaterialId: "x", fronts: { kind: "PAL", materialId: "x" } } as unknown as AtelierConfig, { type: "applyPreset", shape: preset.shape });
    for (const w of widths) assert.equal(resizedConfig(base, w)?.widthMm, w, `${product.slug} @ ${w}`);
  }
  assert.ok(LAYOUT_PRESETS.length > 0);
});

test("wardrobes step 60 cm, chests 40 cm", () => {
  const p = (id: string) => SHOP_PRODUCTS.find((x) => x.slug === id)!.preset;
  assert.deepEqual(sizeOptions(p("dressing-clasic-240")), [1800, 2400, 3000]);
  assert.deepEqual(sizeOptions(p("comoda-clasica-160")), [1200, 1600, 2000]);
  assert.equal(widthLabel(1800), "1,8 m");
  assert.equal(widthLabel(900), "90 cm");
});

test("the name follows the width", () => {
  assert.equal(sizedName("Dressing clasic 2,4 m", 2400, 3000), "Dressing clasic 3 m");
  assert.equal(sizedName("Bucătărie 3 m cu frigider", 3000, 2400), "Bucătărie 2,4 m cu frigider");
  assert.equal(sizedName("Bucătărie în L 2,7 × 1,8 m", 2700, 3300), "Bucătărie în L 3,3 × 1,8 m");
  assert.equal(sizedName("Mobilier lavoar suspendat 50 cm", 500, 600), "Mobilier lavoar suspendat 60 cm");
  assert.equal(sizedName("Comodă nordică", 1600, 2000), "Comodă nordică, lățime 2 m");
  assert.equal(sizedName("Dressing clasic 2,4 m", 2400, 2400), "Dressing clasic 2,4 m");
});
