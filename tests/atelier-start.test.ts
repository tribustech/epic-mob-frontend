import assert from "node:assert/strict";
import test from "node:test";
import { combosFor, curatedColours, initialSession, leadCombo } from "../components/atelier/session.ts";
import { COMBO_PRESETS, START_COMBO_IDS, presetById } from "../lib/atelier/presets.ts";
import { FEATURED_PALETTE_IDS, PALETTES, activePaletteId, featuredFirst, resolvePalettes } from "../lib/atelier/palettes.ts";
import { isDarkPalette } from "../lib/atelier/house-rules.ts";
import { CATEGORY_ORDER } from "../lib/atelier/categories.ts";
import type { AtelierCatalog, AtelierMaterial } from "../lib/atelier/types.ts";

const mat = (decorCode: string, brand = "Egger"): AtelierMaterial => ({
  id: `m-${decorCode.replace(/\s+/g, "").toLowerCase()}`,
  name: `${decorCode} · test`,
  decorCode,
  brand,
  imageUrl: null,
});

/** Every decor the palettes name; with `worktops`, a CRM that also prices kitchens and bathrooms. */
function catalogWith(worktops: boolean): AtelierCatalog {
  const pal = new Set<string>();
  const mdf = new Set<string>();
  for (const p of PALETTES) {
    p.carcassCodes.forEach((c) => pal.add(c));
    if (p.front.kind === "PAL") p.front.codes.forEach((c) => pal.add(c));
    if (p.front.kind === "MDF_MELAMINAT") p.front.codes.forEach((c) => mdf.add(c));
  }
  const palMats = [...pal].map((c) => mat(c));
  const mdfMats = [...mdf].map((c) => mat(c, "AGT"));
  const top = (code: string) => ({ ...mat(code), id: `w-${code}`, thicknessMm: 38, maxDepthMm: 600 });
  return {
    carcass: [...palMats, ...mdfMats],
    fronts: { PAL: palMats, MDF_MELAMINAT: mdfMats, MDF_VOPSIT: [{ id: "model-drept", name: "Drept" }] },
    ral: PALETTES.flatMap((p) => (p.front.kind === "MDF_VOPSIT" ? [{ code: p.front.ralCode, name: "x", hex: "#cccccc" }] : [])),
    ...(worktops ? { worktops: [top("H1145 ST10"), top("F186 ST9")] } : {}),
  };
}

test("the Atelier opens on a sage-and-oak L kitchen, not on the dressing", () => {
  const catalog = catalogWith(true);
  const { config } = initialSession(catalog);
  assert.equal(config.category, "BUCATARIE");
  assert.equal(activePaletteId(resolvePalettes(catalog), config), "salvie-stejar");
  assert.equal(config.kitchen?.layout, "L_STANGA");
  // the house rules ran: the kitchen has a worktop
  assert.ok(config.kitchen?.worktopId);
});

test("a CRM without kitchens: the Atelier opens on the sage sideboard instead", () => {
  const catalog = catalogWith(false);
  const { config } = initialSession(catalog);
  assert.equal(config.category, "COMODA");
  assert.equal(activePaletteId(resolvePalettes(catalog), config), "salvie-stejar");
});

test("the start list names real combinations, all of them light or warm (never dark)", () => {
  for (const id of START_COMBO_IDS) {
    const combo = COMBO_PRESETS.find((c) => c.id === id);
    assert.ok(combo, id);
    assert.ok(presetById(combo.presetId), id);
    assert.equal(isDarkPalette(combo.paletteId), false, id);
  }
  // the last resort is a dressing, which every CRM can price
  const last = COMBO_PRESETS.find((c) => c.id === START_COMBO_IDS[START_COMBO_IDS.length - 1])!;
  assert.equal(presetById(last.presetId)!.category, "DRESSING");
});

test("every category opens on a featured combination that is not dark and not all-white", () => {
  const catalog = catalogWith(true);
  const palettes = resolvePalettes(catalog);
  for (const category of CATEGORY_ORDER) {
    const lead = leadCombo(category, catalog, palettes);
    assert.ok(lead, category);
    assert.equal(lead.preset.category, category);
    assert.equal(isDarkPalette(lead.palette.id), false, `${category}: ${lead.palette.id}`);
    assert.notEqual(lead.palette.id, "alb-total", category);
    // the combos of a category come in COMBO_PRESETS order and respect the no-dark rule
    for (const shown of combosFor(category, catalog, palettes)) assert.equal(shown.preset.category, category);
  }
  assert.ok(combosFor("COMODA", catalog, palettes).every((c) => !isDarkPalette(c.palette.id)));
});

test("only colours that came from a featured combination count as ours", () => {
  assert.equal(curatedColours(null), false);
  assert.equal(curatedColours("salvie-stejar"), true);
  assert.equal(curatedColours("alb-total"), false);
});

test("featured palettes lead the colour step, the rest keep their order", () => {
  for (const id of FEATURED_PALETTE_IDS) assert.ok(PALETTES.some((p) => p.id === id), id);
  const sorted = featuredFirst(PALETTES);
  assert.equal(sorted.length, PALETTES.length);
  assert.deepEqual(sorted.slice(0, FEATURED_PALETTE_IDS.length).map((p) => p.id), [...FEATURED_PALETTE_IDS]);
  const rest = sorted.slice(FEATURED_PALETTE_IDS.length).map((p) => p.id);
  assert.deepEqual(rest, PALETTES.map((p) => p.id).filter((id) => !FEATURED_PALETTE_IDS.includes(id)));
});
