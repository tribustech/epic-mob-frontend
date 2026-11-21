import assert from "node:assert/strict";
import test from "node:test";
import { COLOR_FAMILIES, FAMILY_LABELS, colorFamily, decorNature, plainFamily, toneOf } from "../lib/atelier/color-families.ts";
import { DECOR_TONES, PLAIN_DECORS } from "../lib/atelier/decor-tones.ts";
import { PALETTES, paintedFrontsLike } from "../lib/atelier/palettes.ts";
import { HANDLE_INFO, HANDLE_KINDS, frontsNoun, needsPaintedFronts } from "../lib/atelier/handles.ts";
import { atelierReducer, defaultConfig } from "../lib/atelier/state.ts";
import { initialSession, sessionReducer } from "../components/atelier/session.ts";
import type { AtelierCatalog } from "../lib/atelier/types.ts";

const fam = (name: string, decorCode: string | null = null) => colorFamily({ name: decorCode ? `${decorCode} · ${name}` : name, decorCode });

test("colour families: every decor lands in the family a customer would look in", () => {
  // flat colours, by their measured tone
  assert.equal(fam("Alb Premium", "W1000 ST9"), "ALB");
  assert.equal(fam("Alb Portelan", "W1200 ST9"), "ALB");
  assert.equal(fam("Soft Touch White", "734"), "ALB");
  assert.equal(fam("Gri Cașmir", "U702 ST9"), "BEJ_GRI");
  assert.equal(fam("Gri Deschis", "U708 ST9"), "BEJ_GRI");
  assert.equal(fam("Bej Nisip", "U156 ST9"), "BEJ_GRI");
  assert.equal(fam("Negru", "U999 ST19"), "NEGRU");
  assert.equal(fam("Gri Grafit", "U961 ST7"), "NEGRU");
  assert.equal(fam("Antracit", "D143 PS14"), "NEGRU");
  assert.equal(fam("Albastru Denim", "U540 ST9"), "CULORI");
  assert.equal(fam("Roșu China", "U321 ST9"), "CULORI");
  assert.equal(fam("Galben Curry", "U163 ST9"), "CULORI");
  // a muted green is still „a colour": the name decides where the tone alone would say grey
  assert.equal(fam("Verde Salvie", "U638 ST9"), "CULORI");
  assert.equal(fam("Verde Eucalipt", "U604 ST9"), "CULORI");
  // woods split by how light they are, whatever they are called
  assert.equal(fam("Stejar Halifax Natur", "H1180 ST37"), "LEMN_DESCHIS");
  assert.equal(fam("Stejar Bardolino Natur", "H1145 ST10"), "LEMN_DESCHIS");
  assert.equal(fam("Stejar Halifax Tabac", "H1181 ST37"), "LEMN_INCHIS");
  assert.equal(fam("Nuc Dijon Natur", "H3734 ST9"), "LEMN_INCHIS");
  assert.equal(fam("Stejar Sonoma", "A804 PS17"), "LEMN_DESCHIS");
  // stone, concrete, metal
  assert.equal(fam("Beton Chicago Gri Deschis", "F186 ST9"), "PIATRA");
  assert.equal(fam("Marmură Crystal", "F800 ST9"), "PIATRA");
});

test("colour families work for decors the code has never seen (a new decor in the CRM sorts itself)", () => {
  // unknown code, known supplier series
  assert.equal(fam("Stejar Nou Deschis", "H9999 ST10"), "LEMN_DESCHIS");
  assert.equal(fam("Nuc Nou Închis", "H9998 ST10"), "LEMN_INCHIS");
  assert.equal(fam("Granit Nou", "F9999 ST9"), "PIATRA");
  assert.equal(fam("Alb Nou", "W9999 ST9"), "ALB");
  assert.equal(fam("Negru Nou", "U9999 ST9"), "NEGRU");
  assert.equal(fam("Verde Nou", "U9998 ST9"), "CULORI");
  assert.equal(fam("Gri Nou", "U9997 ST9"), "BEJ_GRI");
  // no code at all: the name alone
  assert.equal(fam("Stejar auriu"), "LEMN_DESCHIS");
  assert.equal(fam("Marmură albă"), "PIATRA");
  assert.equal(fam("Albastru Pacific"), "CULORI"); // „alb" inside „albastru" is not white
  assert.equal(fam("Alb mat"), "ALB");
  assert.equal(fam("Gri Piatră Mat", "X-390"), "BEJ_GRI"); // a grey named after stone is a grey
  assert.equal(fam("Ceva necunoscut"), "BEJ_GRI");
  // a colour handed in by the caller wins over the lookup
  assert.equal(colorFamily({ name: "Fără nume", color: "#f8f8f6" }), "ALB");
  assert.equal(colorFamily({ name: "Fără nume", color: "#1c1c1c" }), "NEGRU");
});

test("colour families: the whole tone map is covered, and the generated data agrees with the rules", () => {
  const counts = new Map<string, number>();
  for (const [code, hex] of Object.entries(DECOR_TONES)) {
    assert.ok(toneOf(hex), `${code}: ${hex} is a colour`);
    const family = colorFamily({ name: code, decorCode: code });
    assert.ok(COLOR_FAMILIES.includes(family), code);
    counts.set(family, (counts.get(family) ?? 0) + 1);
    // a decor known to be a flat colour is never filed under wood or stone
    if (PLAIN_DECORS.has(code)) assert.ok(!["LEMN_DESCHIS", "LEMN_INCHIS", "PIATRA"].includes(family), `${code} is plain`);
    // very light is never „black", very dark never „white"
    const light = toneOf(hex)!.light;
    if (light > 0.8) assert.notEqual(family, "NEGRU", code);
    if (light < 0.5) assert.notEqual(family, "ALB", code);
    if (family === "LEMN_DESCHIS") assert.ok(light >= 0.5, code);
    if (family === "LEMN_INCHIS") assert.ok(light < 0.5, code);
  }
  // no family is a dumping ground, none is empty
  for (const family of COLOR_FAMILIES) {
    assert.ok(FAMILY_LABELS[family]);
    assert.ok((counts.get(family) ?? 0) >= 5, `${family}: ${counts.get(family)}`);
  }
  // the decors of the ready-made combinations sit where their names say
  const first = (id: string) => PALETTES.find((p) => p.id === id)!;
  assert.equal(colorFamily({ name: "", decorCode: first("alb-total").carcassCodes[0] }), "ALB");
  assert.equal(colorFamily({ name: "", decorCode: first("grafit-total").carcassCodes[0] }), "NEGRU");
  assert.equal(decorNature({ name: "", decorCode: first("stejar-natur").carcassCodes[0] }), "WOOD");
});

test("paint colours by tone", () => {
  assert.equal(plainFamily("#f1f0ea"), "ALB"); // RAL 9016
  assert.equal(plainFamily("#0e0e10"), "NEGRU"); // RAL 9005
  assert.equal(plainFamily("#383e42"), "NEGRU"); // RAL 7016 antracit
  assert.equal(plainFamily("#c5c7c4"), "BEJ_GRI"); // RAL 7035
  assert.equal(plainFamily("#1f3855"), "CULORI"); // RAL 5011
  assert.equal(plainFamily("#89ac76"), "CULORI"); // RAL 6021
  assert.equal(plainFamily("not a colour"), "BEJ_GRI");
});

/* ── handles that need painted fronts: one tap, one undo ── */

const m = (id: string, decorCode: string | null = null) => ({ id, name: id, decorCode, brand: "Egger", imageUrl: null });
const catalog: AtelierCatalog = {
  carcass: [m("alb", "W1000 ST9"), m("stejar", "H1180 ST37")],
  fronts: { PAL: [m("alb", "W1000 ST9"), m("stejar", "H1180 ST37")], MDF_MELAMINAT: [], MDF_VOPSIT: [{ id: "drept", name: "Drept" }] },
  ral: [
    { code: "RAL 9016", name: "Traffic white", hex: "#f1f0ea" },
    { code: "RAL 1011", name: "Brown beige", hex: "#af8a54" },
    { code: "RAL 9005", name: "Jet black", hex: "#0e0e10" },
  ],
  handles: { types: HANDLE_KINDS.map((type) => ({ type, label: type })) },
};

test("a recessed handle on wood-decor doors: the doors go to paint with it, and one undo takes both back", () => {
  let session = initialSession(catalog);
  const at = { n: 0 };
  const act = (actions: Parameters<typeof atelierReducer>[1][]) => {
    session = sessionReducer(session, { type: "config", actions, at: (at.n += 5000), catalog });
  };
  act([{ type: "setDoors", doors: { type: "BATANTE" } }]);
  act([{ type: "setFronts", fronts: { kind: "PAL", materialId: "stejar" } }]);
  const before = session.config;
  // what the handle picker sends for „Mâner îngropat": the handle, and painted fronts in the nearest colour
  const painted = paintedFrontsLike(catalog, DECOR_TONES["H1180 ST37"])!;
  assert.equal(painted.ralCode, "RAL 1011");
  act([{ type: "setHandle", handle: { type: "INGROPAT" } }, { type: "setFronts", fronts: painted }]);
  assert.equal(session.config.handle?.type, "INGROPAT");
  assert.equal(session.config.fronts.kind, "MDF_VOPSIT");
  // the house rules have nothing to put right, so no „we changed your handle" note
  assert.deepEqual(session.notices, []);
  assert.equal(session.pastWhat[session.pastWhat.length - 1], "mânerele");
  session = sessionReducer(session, { type: "undo" });
  assert.deepEqual(session.config, before);
  // without painted fronts the same handle would be put back to the usual one (the old behaviour, still the safety net)
  act([{ type: "setHandle", handle: { type: "INGROPAT" } }]);
  assert.equal(session.config.handle?.type, "APLICAT");
  assert.deepEqual(session.notices, ["HANDLE_RESET"]);
});

test("handle cards: plain names, a line each that tells them apart, the right words for the fronts", () => {
  const names = HANDLE_KINDS.map((t) => HANDLE_INFO[t].name);
  assert.equal(new Set(names).size, names.length);
  for (const type of HANDLE_KINDS) {
    const { name, benefit } = HANDLE_INFO[type];
    assert.ok(!/frez|gola|tip-?on|push/i.test(`${name} ${benefit}`), `${type}: workshop jargon`);
    assert.ok(benefit.length <= 52, `${type}: one short line`);
  }
  assert.deepEqual(HANDLE_KINDS.filter(needsPaintedFronts), ["INGROPAT", "PROFIL_J"]);
  const dressing = atelierReducer(defaultConfig(catalog), { type: "setDoors", doors: { type: "BATANTE" } });
  assert.deepEqual(frontsNoun(dressing), { plain: "uși", the: "ușile" });
  assert.equal(frontsNoun(defaultConfig(catalog, "BUCATARIE")).the, "ușile și sertarele");
  const comoda = defaultConfig(catalog, "COMODA");
  const onlyDrawers = { ...comoda, columns: comoda.columns.map((c) => ({ ...c, content: "SERTARE" as const })) };
  assert.equal(frontsNoun(onlyDrawers).plain, "sertare");
});
