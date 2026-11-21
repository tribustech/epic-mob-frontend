import assert from "node:assert/strict";
import test from "node:test";
import { COMBO_PRESETS, LAYOUT_PRESETS, presetAvailable, presetById, presetsFor } from "../lib/atelier/presets.ts";
import { doorFills, doorSlots, hasMirror, normalizeDoors } from "../lib/atelier/door-types.ts";
import { PALETTES, activePaletteId, defaultVopsitModelId, resolvePalettes } from "../lib/atelier/palettes.ts";
import { atelierReducer, defaultConfig } from "../lib/atelier/state.ts";
import {
  BARA_SERTARE_RANGE,
  BOTTOM_HEIGHT_RANGE,
  CATEGORY_ORDER,
  CATEGORY_RULES,
  SERTARE_RANGE,
} from "../lib/atelier/categories.ts";
import { DECOR_TONES, HORIZONTAL_GRAIN_DECORS, PLAIN_DECORS } from "../lib/atelier/decor-tones.ts";
import type { AtelierCatalog, AtelierMaterial } from "../lib/atelier/types.ts";

const mat = (decorCode: string, brand = "Egger"): AtelierMaterial => ({
  id: `m-${decorCode.replace(/\s+/g, "").toLowerCase()}`,
  name: `${decorCode} · test`,
  decorCode,
  brand,
  imageUrl: null,
});

/** A catalog holding every decor any palette names (first choices and substitutes). */
function fullCatalog(): AtelierCatalog {
  const pal = new Set<string>();
  const mdf = new Set<string>();
  for (const p of PALETTES) {
    p.carcassCodes.forEach((c) => pal.add(c));
    if (p.front.kind === "PAL") p.front.codes.forEach((c) => pal.add(c));
    if (p.front.kind === "MDF_MELAMINAT") p.front.codes.forEach((c) => mdf.add(c));
  }
  const palMats = [...pal].map((c) => mat(c));
  const mdfMats = [...mdf].map((c) => mat(c, "AGT"));
  return {
    carcass: [...palMats, ...mdfMats],
    fronts: { PAL: palMats, MDF_MELAMINAT: mdfMats, MDF_VOPSIT: [{ id: "model-drept", name: "Drept" }] },
    ral: PALETTES.flatMap((p) => (p.front.kind === "MDF_VOPSIT" ? [{ code: p.front.ralCode, name: "x", hex: "#cccccc" }] : [])),
  };
}

const inRange = (v: number, [lo, hi]: readonly [number, number]) => v >= lo && v <= hi;

test("there are enough presets in every category", () => {
  const min = { DRESSING: 10, COMODA: 7, SEPARATOR: 5, SUSPENDAT: 6, BUCATARIE: 6 } as const;
  for (const category of CATEGORY_ORDER) {
    assert.ok(presetsFor(category).length >= min[category], `${category}: ${presetsFor(category).length}`);
  }
  assert.ok(COMBO_PRESETS.length >= 16);
  assert.ok(PALETTES.length >= 28);
});

test("preset, combo and palette ids are unique", () => {
  for (const [what, ids] of [
    ["preset", LAYOUT_PRESETS.map((p) => p.id)],
    ["combo", COMBO_PRESETS.map((p) => p.id)],
    ["palette", PALETTES.map((p) => p.id)],
  ] as const) {
    assert.equal(new Set(ids).size, ids.length, `duplicate ${what} id`);
  }
  // names are what the client reads: no two cards with the same name
  assert.equal(new Set(LAYOUT_PRESETS.map((p) => p.name)).size, LAYOUT_PRESETS.length);
  assert.equal(new Set(PALETTES.map((p) => p.name)).size, PALETTES.length);
  assert.equal(new Set(COMBO_PRESETS.map((p) => p.name)).size, COMBO_PRESETS.length);
});

for (const preset of LAYOUT_PRESETS) {
  test(`preset ${preset.id} respects the ${preset.category} rules`, () => {
    const { shape } = preset;
    const rules = CATEGORY_RULES[preset.category];
    assert.equal(shape.category, preset.category);
    assert.ok(preset.name.trim() && preset.tagline.trim());
    assert.ok(inRange(shape.widthMm, rules.width), "width");
    assert.ok(inRange(shape.heightMm, rules.height), "height");
    assert.ok(inRange(shape.depthMm, rules.depth), "depth");
    assert.ok(rules.legs.includes(shape.legsMm), "legs");
    assert.ok(shape.columns.length > 0);
    assert.equal(shape.columns.reduce((t, c) => t + c.widthMm, 0), shape.widthMm, "column widths sum to the width");
    shape.columns.forEach((c, i) => {
      assert.ok(inRange(c.widthMm, rules.column), `column ${i + 1} width`);
      assert.ok(rules.contents.includes(c.content), `column ${i + 1} content ${c.content}`);
      if (c.drawers !== undefined) {
        assert.ok(c.content === "SERTARE" || c.content === "BARA_SERTARE", `column ${i + 1}: drawers on ${c.content}`);
        assert.ok(inRange(c.drawers, c.content === "SERTARE" ? SERTARE_RANGE : BARA_SERTARE_RANGE), `column ${i + 1} drawers`);
      }
      if (c.shelves !== undefined) assert.ok(Number.isInteger(c.shelves) && inRange(c.shelves, [0, 15]), `column ${i + 1} shelves`);
      if (c.railPosition !== undefined) assert.equal(c.content, "POLITE_BARA");
      if (c.doorRows !== undefined || c.doorsAcross !== undefined) {
        assert.ok(shape.doors.type.startsWith("BATANTE"), `column ${i + 1}: door rows / leaves need hinged doors`);
      }
    });
    // doors exist only on dressings; a sliding door count needs sliding doors
    if (!rules.slidingDoors) assert.equal(shape.doors.type, "NONE");
    if (shape.doors.count !== undefined) {
      assert.ok(shape.doors.type.startsWith("GLISANTE"));
      assert.ok(shape.doors.count >= 2 && shape.doors.count <= 6);
    }
    if (shape.bottom) {
      assert.equal(preset.category, "SEPARATOR");
      const h = shape.bottom.heightMm ?? 700;
      assert.ok(inRange(h, BOTTOM_HEIGHT_RANGE));
      assert.ok(shape.heightMm - h >= 300, "room for shelves above the bottom");
    }
    if (shape.doors.fills) {
      // a face per door: exactly one per sliding door / per column, really mixed, written canonically
      assert.equal(shape.doors.fills.length, doorSlots(shape), "one face per door");
      assert.ok(new Set(shape.doors.fills).size > 1, "the same face on every door is written as the door type");
      assert.equal(normalizeDoors(shape), shape.doors, "canonical doors");
    }
    if (shape.handle) assert.ok(["APLICAT", "PUSH"].includes(shape.handle.type));
    if (preset.paletteId) assert.ok(PALETTES.some((p) => p.id === preset.paletteId), `palette ${preset.paletteId}`);
    assert.equal(presetById(preset.id), preset);
  });
}

test("owner rule: mirror doors come with the white body + cașmir palette, never AGT", () => {
  // any mirror counts: on every door (the *_OGLINDA types) or only on some (doors.fills)
  const mirrors = LAYOUT_PRESETS.filter((p) => hasMirror(p.shape));
  assert.ok(mirrors.length >= 4);
  for (const p of mirrors) assert.equal(p.paletteId, "alb-casmir", p.id);
  for (const c of COMBO_PRESETS) {
    const preset = presetById(c.presetId);
    if (preset && hasMirror(preset.shape)) assert.equal(c.paletteId, "alb-casmir", c.id);
  }
  for (const p of PALETTES) assert.doesNotMatch(p.name, /oglind/i);
});

test("mirror presets: one mirrored sliding door, a mirror on the middle column, all mirrors", () => {
  const one = presetById("dressing-oglinda-una-180")!;
  assert.deepEqual(doorFills(one.shape), ["OGLINDA", "PANOU"]);
  assert.equal(one.shape.doors.type, "GLISANTE", "mixed faces keep the plain door type");
  const middle = presetById("dressing-oglinda-mijloc-240")!;
  assert.deepEqual(doorFills(middle.shape), ["PANOU", "OGLINDA", "PANOU"]);
  assert.equal(middle.shape.doors.type, "BATANTE");
  const all = presetById("dressing-oglinzi-300")!;
  assert.deepEqual(doorFills(all.shape), ["OGLINDA", "OGLINDA", "OGLINDA"]);
  assert.equal(all.shape.doors.fills, undefined, "all mirrors is the classic type, so an older CRM prices it the same");

  // applying one keeps its faces, as a copy
  const next = atelierReducer(defaultConfig(fullCatalog()), { type: "applyPreset", shape: middle.shape });
  assert.deepEqual(next.doors, middle.shape.doors);
  assert.notEqual(next.doors.fills, middle.shape.doors.fills);

  // presets with a face per door need a CRM that knows them; the rest are always offered
  assert.equal(presetAvailable(one, {}), false);
  assert.equal(presetAvailable(one, { glass: { mirrors: [], glasses: [] } }), true);
  assert.equal(presetAvailable(all, {}), true);
});

test("a few presets carry a badge", () => {
  const badges = LAYOUT_PRESETS.filter((p) => p.badge);
  assert.ok(badges.length >= 3 && badges.length <= 8, `${badges.length} badges`);
});

test("combos reference existing presets and palettes, across all categories", () => {
  for (const c of COMBO_PRESETS) {
    assert.ok(presetById(c.presetId), `${c.id}: preset ${c.presetId}`);
    assert.ok(PALETTES.some((p) => p.id === c.paletteId), `${c.id}: palette ${c.paletteId}`);
    assert.ok(c.name.trim() && c.tagline.trim());
  }
  const categories = new Set(COMBO_PRESETS.map((c) => presetById(c.presetId)!.category));
  assert.deepEqual([...categories].sort(), [...CATEGORY_ORDER].sort());
});

test("palettes: every mood is covered and each part has 2–3 fallback codes", () => {
  for (const mood of ["LUMINOS", "LEMN", "INCHIS", "COLORAT"] as const) {
    assert.ok(PALETTES.filter((p) => p.mood === mood).length >= 5, mood);
  }
  for (const p of PALETTES) {
    assert.ok(p.carcassCodes.length >= 2 && p.carcassCodes.length <= 3, `${p.id} carcass codes`);
    assert.equal(new Set(p.carcassCodes).size, p.carcassCodes.length);
    if (p.front.kind !== "MDF_VOPSIT") {
      assert.ok(p.front.codes.length >= 2 && p.front.codes.length <= 3, `${p.id} front codes`);
      assert.equal(new Set(p.front.codes).size, p.front.codes.length);
    } else assert.match(p.front.ralCode, /^RAL \d{4}$/);
  }
});

test("resolvePalettes resolves everything against a full catalog, first choice first", () => {
  const catalog = fullCatalog();
  const resolved = resolvePalettes(catalog);
  assert.equal(resolved.length, PALETTES.length);
  const albTotal = resolved.find((p) => p.id === "alb-total")!;
  assert.equal(albTotal.carcassMaterialId, mat("W1000 ST9").id);
  assert.deepEqual(albTotal.fronts, { kind: "PAL", materialId: mat("W1000 ST9").id });
  const vopsit = resolved.find((p) => p.id === "alb-vopsit")!;
  assert.deepEqual(vopsit.fronts, { kind: "MDF_VOPSIT", modelId: "model-drept", ralCode: "RAL 9010" });
});

test("resolvePalettes falls back to the next code and drops what cannot resolve", () => {
  const catalog = fullCatalog();
  // W1000 ST9 is out of the price list: the substitute takes over
  const noW1000: AtelierCatalog = {
    ...catalog,
    carcass: catalog.carcass.filter((m) => m.decorCode !== "W1000 ST9"),
    fronts: { ...catalog.fronts, PAL: catalog.fronts.PAL.filter((m) => m.decorCode !== "W1000 ST9") },
  };
  const alb = resolvePalettes(noW1000).find((p) => p.id === "alb-total")!;
  assert.equal(alb.carcassMaterialId, mat("W1100 ST9").id);
  assert.equal(alb.fronts.materialId, mat("W1100 ST9").id);

  // no painted fronts and no AGT in the CRM: those palettes disappear, the rest stay
  const palOnly: AtelierCatalog = { ...catalog, fronts: { ...catalog.fronts, MDF_MELAMINAT: [], MDF_VOPSIT: [] } };
  const resolved = resolvePalettes(palOnly);
  const expected = PALETTES.filter((p) => p.front.kind === "PAL").map((p) => p.id);
  assert.deepEqual(resolved.map((p) => p.id), expected);
  assert.ok(expected.length >= 20);

  // a fronts decor that exists only as carcass is not a front
  const noFronts: AtelierCatalog = { ...catalog, fronts: { PAL: [], MDF_MELAMINAT: [], MDF_VOPSIT: [] } };
  assert.deepEqual(resolvePalettes(noFronts), []);
  assert.deepEqual(resolvePalettes({ carcass: [], fronts: catalog.fronts, ral: catalog.ral }), []);
});

test("applyPreset replaces the shape and keeps the colours", () => {
  const catalog = fullCatalog();
  const start = { ...defaultConfig(catalog), handle: { type: "PUSH" as const } };
  const preset = presetById("separator-sertare-160")!;
  const next = atelierReducer(start, { type: "applyPreset", shape: preset.shape });
  assert.equal(next.category, "SEPARATOR");
  assert.equal(next.widthMm, 1600);
  assert.deepEqual(next.columns, preset.shape.columns);
  assert.deepEqual(next.bottom, preset.shape.bottom);
  assert.deepEqual(next.doors, { type: "NONE" });
  assert.equal(next.handle, undefined, "the previous model's handle does not leak into the new one");
  assert.equal(next.carcassMaterialId, start.carcassMaterialId);
  assert.deepEqual(next.fronts, start.fronts);
  // the preset itself is never shared with the state
  assert.notEqual(next.columns, preset.shape.columns);
  assert.notEqual(next.columns[0], preset.shape.columns[0]);
  assert.notEqual(next.bottom, preset.shape.bottom);
  const widened = atelierReducer(next, { type: "setColumnWidth", index: 0, widthMm: 900 });
  assert.equal(preset.shape.columns[0].widthMm, 800);
  assert.equal(widened.columns[0].widthMm, 900);

  // going back to a dressing drops the separator's bottom
  const dressing = atelierReducer(next, { type: "applyPreset", shape: presetById("dressing-tavan-270")!.shape });
  assert.equal(dressing.bottom, undefined);
  assert.deepEqual(dressing.handle, { type: "PUSH" });
  assert.equal(dressing.columns[0].doorRows, 2);
});

test("applyPreset ignores a broken shape", () => {
  const start = defaultConfig(fullCatalog());
  const shape = presetById("dressing-clasic-240")!.shape;
  assert.equal(atelierReducer(start, { type: "applyPreset", shape: { ...shape, columns: [] } }), start);
});

test("every preset survives the reducer unchanged (nothing the UI would 'fix')", () => {
  const start = defaultConfig(fullCatalog());
  for (const preset of LAYOUT_PRESETS) {
    const applied = atelierReducer(start, { type: "applyPreset", shape: preset.shape });
    const { carcassMaterialId, fronts, ...shape } = applied;
    assert.deepEqual(shape, preset.shape, preset.id);
    assert.equal(carcassMaterialId, start.carcassMaterialId);
    assert.equal(fronts, start.fronts);
    // a no-op resize keeps the columns as designed
    assert.deepEqual(atelierReducer(applied, { type: "setSize", widthMm: applied.widthMm }).columns, preset.shape.columns, preset.id);
  }
});

test("applyPalette changes only the colours; activePaletteId finds it again", () => {
  const catalog = fullCatalog();
  const palettes = resolvePalettes(catalog);
  const start = atelierReducer(defaultConfig(catalog), { type: "applyPreset", shape: presetById("comoda-clasica-160")!.shape });
  for (const palette of palettes) {
    const next = atelierReducer(start, { type: "applyPalette", carcassMaterialId: palette.carcassMaterialId, fronts: palette.fronts });
    assert.equal(next.carcassMaterialId, palette.carcassMaterialId);
    assert.deepEqual(next.fronts, palette.fronts);
    assert.notEqual(next.fronts, palette.fronts, "fronts are copied, not shared");
    assert.deepEqual({ ...next, carcassMaterialId: "", fronts: null }, { ...start, carcassMaterialId: "", fronts: null });
    assert.equal(activePaletteId(palettes, next), palette.id, palette.id);
  }
  // a hand-picked pair that is no palette
  const odd = atelierReducer(start, { type: "applyPalette", carcassMaterialId: mat("U540 ST9").id, fronts: { kind: "PAL", materialId: mat("U830 ST9").id } });
  assert.equal(activePaletteId(palettes, odd), null);
});

test("no two palettes resolve to the same pair of decors", () => {
  const seen = new Map<string, string>();
  for (const p of resolvePalettes(fullCatalog())) {
    const key = `${p.carcassMaterialId}|${p.fronts.kind}|${p.fronts.materialId ?? p.fronts.ralCode}`;
    assert.equal(seen.get(key), undefined, `${p.id} duplicates ${seen.get(key)}`);
    seen.set(key, p.id);
  }
});

test("decor tones: hex colours, and every palette decor has a measured tone", () => {
  for (const [code, tone] of Object.entries(DECOR_TONES)) assert.match(tone, /^#[0-9a-f]{6}$/, code);
  for (const code of [...PLAIN_DECORS, ...HORIZONTAL_GRAIN_DECORS]) assert.ok(DECOR_TONES[code], code);
  for (const code of HORIZONTAL_GRAIN_DECORS) assert.ok(!PLAIN_DECORS.has(code), code);
  for (const p of PALETTES) {
    for (const code of [...p.carcassCodes, ...(p.front.kind === "MDF_VOPSIT" ? [] : p.front.codes)]) {
      assert.ok(DECOR_TONES[code], `${p.id}: no tone for ${code}`);
    }
  }
  // whites are light, blacks are dark, oak is in between
  const lum = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
  assert.ok(lum(DECOR_TONES["W1000 ST9"]) > 700);
  assert.ok(lum(DECOR_TONES["U999 ST19"]) < 200);
  assert.ok(lum(DECOR_TONES["H1180 ST37"]) > 300 && lum(DECOR_TONES["H1180 ST37"]) < 600);
});

test("defaultVopsitModelId prefers the flat model, else the first; palettes use it", () => {
  const catalog = fullCatalog();
  const withModels = (models: { id: string; name: string }[]): AtelierCatalog => ({
    ...catalog,
    fronts: { ...catalog.fronts, MDF_VOPSIT: models },
  });
  assert.equal(defaultVopsitModelId(withModels([])), undefined);
  assert.equal(defaultVopsitModelId(withModels([{ id: "a", name: "Frezat clasic" }, { id: "b", name: "Shaker" }])), "a");
  const flatSecond = withModels([{ id: "a", name: "Frezat clasic" }, { id: "b", name: "Plan drept" }]);
  assert.equal(defaultVopsitModelId(flatSecond), "b");
  assert.equal(defaultVopsitModelId(withModels([{ id: "x", name: "Shaker" }, { id: "model-drept", name: "model-drept" }])), "model-drept");
  assert.equal(resolvePalettes(flatSecond).find((p) => p.id === "alb-vopsit")!.fronts.modelId, "b");
});
