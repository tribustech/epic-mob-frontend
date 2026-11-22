import assert from "node:assert/strict";
import test from "node:test";
import { LAYOUT_PRESETS } from "../lib/atelier/presets.ts";
import { resolvePalettes, PALETTES } from "../lib/atelier/palettes.ts";
import { HANDLE_KINDS } from "../lib/atelier/handles.ts";
import { decodeShare, encodeShare, parseConfig, shareCodeFrom, shareUrl } from "../lib/atelier/share.ts";
import type { AtelierCatalog, AtelierConfig, AtelierMaterial } from "../lib/atelier/types.ts";

const mat = (decorCode: string, brand = "Egger"): AtelierMaterial => ({
  id: `m-${decorCode.replace(/\s+/g, "").toLowerCase()}`,
  name: `${decorCode} · test`,
  decorCode,
  brand,
  imageUrl: null,
});

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
    handles: { types: HANDLE_KINDS.map((type) => ({ type, label: type })) },
    glass: {
      mirrors: [{ id: "og-clară", name: "Oglindă clară", tint: "#cfd8de" }, { id: "og-bronz", name: "Oglindă bronz", tint: "#b08d6a" }],
      glasses: [{ id: "st-mata", name: "Sticlă mată", tint: "#dfe7ea", matte: true }],
    },
  };
}

const catalog = fullCatalog();
const palettes = resolvePalettes(catalog);
const configOf = (i: number): AtelierConfig => {
  const preset = LAYOUT_PRESETS[i];
  const palette = palettes.find((p) => p.id === preset.paletteId) ?? palettes[0];
  return { ...preset.shape, carcassMaterialId: palette.carcassMaterialId, fronts: palette.fronts };
};

test("share link: every preset survives encode → decode unchanged, in a short URL-safe code", () => {
  LAYOUT_PRESETS.forEach((preset, i) => {
    const config = configOf(i);
    const code = encodeShare(config);
    assert.match(code, /^[A-Za-z0-9_-]+$/, preset.id);
    assert.ok(code.length < 600, `${preset.id}: ${code.length} characters`);
    assert.deepEqual(decodeShare(code, catalog), config, preset.id);
  });
});

test("share link: handle + colour, a face per door, mirror / glass types, painted fronts, separator bottom", () => {
  const vopsit = palettes.find((p) => p.fronts.kind === "MDF_VOPSIT")!;
  const rich: AtelierConfig = {
    category: "DRESSING",
    widthMm: 2405,
    heightMm: 2600,
    depthMm: 600,
    legsMm: 150,
    columns: [
      { widthMm: 800, content: "POLITE_BARA", railPosition: "JOS", shelves: 3, doorRows: 2, doorsAcross: 2 },
      { widthMm: 800, content: "BARA_SERTARE", drawers: 3 },
      { widthMm: 805, content: "POLITE", shelves: 0 },
    ],
    carcassMaterialId: vopsit.carcassMaterialId,
    fronts: { ...vopsit.fronts, faces: 2 },
    doors: { type: "BATANTE", fills: ["OGLINDA", "STICLA", "PANOU"], mirrorId: "og-clară", glassId: "st-mata" },
    handle: { type: "INGROPAT", finish: "AURIU" },
  };
  assert.deepEqual(decodeShare(encodeShare(rich), catalog), rich);

  const sliding: AtelierConfig = { ...rich, columns: rich.columns.map((c) => ({ widthMm: c.widthMm, content: c.content })), doors: { type: "GLISANTE_OGLINDA", count: 4, mirrorId: "og-bronz" } };
  delete sliding.handle;
  assert.deepEqual(decodeShare(encodeShare(sliding), catalog), sliding);

  const separator = configOf(LAYOUT_PRESETS.findIndex((p) => p.id === "separator-usi-180"));
  const withHandle = { ...separator, handle: { type: "PUSH" as const } };
  assert.deepEqual(decodeShare(encodeShare(withHandle), catalog), withHandle);

  assert.equal(shareUrl("https://epicmob.ro/", rich), `https://epicmob.ro/configurator?c=${encodeShare(rich)}`);
  assert.equal(shareCodeFrom(`?utm_source=wa&c=${encodeShare(rich)}`), encodeShare(rich));
  assert.equal(shareCodeFrom(""), null);
});

test("share link: garbage is ignored", () => {
  const good = encodeShare(configOf(0));
  const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const packed = JSON.parse(Buffer.from(good, "base64url").toString()) as unknown[];
  const variant = (change: (p: unknown[]) => void) => {
    const copy = JSON.parse(JSON.stringify(packed)) as unknown[];
    change(copy);
    return b64(copy);
  };
  const bad: unknown[] = [
    "", " ", "abc", "%%%", "<script>alert(1)</script>", good + "=", good.slice(0, -7), "A".repeat(5000), null, undefined, 42, {},
    b64(null), b64("x"), b64({}), b64([]), b64([2, 0]), b64([1]), b64([1, 0, "x", [], [], "id", []]),
    b64({ category: "DRESSING", __proto__: { polluted: true } }),
    variant((p) => (p[0] = 99)), // another version
    variant((p) => (p[1] = 7)), // unknown category
    variant((p) => (p[1] = "constructor")),
    variant((p) => ((p[2] as number[])[0] = 99_999)), // far too wide
    variant((p) => ((p[2] as number[])[0] = 2400.5)),
    variant((p) => ((p[2] as number[])[3] = 37)), // legs that do not exist
    variant((p) => ((p[3] as unknown[][])[0][0] = 100)), // columns no longer add up
    variant((p) => ((p[3] as unknown[][])[0][1] = 6)), // content of another category (USI in a dressing)
    variant((p) => (p[3] = [])),
    variant((p) => (p[3] = Array.from({ length: 31 }, () => [100, 0]))),
    variant((p) => ((p[4] as unknown[])[0] = 42)), // unknown door type
    variant((p) => ((p[4] as unknown[])[2] = "POX")), // unknown door face
    variant((p) => (p[5] = "not-in-the-catalog")),
    variant((p) => (p[5] = { $ne: null })),
    variant((p) => ((p[6] as unknown[])[1] = "not-in-the-catalog")),
    variant((p) => ((p[6] as unknown[])[0] = 9)),
    variant((p) => (p[8] = [0, 700])), // a bottom on a dressing
  ];
  for (const code of bad) assert.equal(decodeShare(code, catalog), null, String(code).slice(0, 60));
  assert.equal(({} as { polluted?: boolean }).polluted, undefined);
  // a comodă with doors is not a thing
  const comoda = encodeShare(configOf(LAYOUT_PRESETS.findIndex((p) => p.category === "COMODA")));
  const cp = JSON.parse(Buffer.from(comoda, "base64url").toString()) as unknown[];
  cp[4] = [1];
  assert.equal(decodeShare(b64(cp), catalog), null);
});

test("share link: optional details that no longer check out are left out, the configuration still opens", () => {
  const base = configOf(LAYOUT_PRESETS.findIndex((p) => p.id === "dressing-oglinda-mijloc-240"));
  const config: AtelierConfig = { ...base, doors: { ...base.doors, mirrorId: "og-bronz" }, handle: { type: "GOLA", finish: "INOX" } };
  const code = encodeShare(config);
  // an older CRM: no mirror types, only two handle types
  const older: AtelierCatalog = { ...catalog, glass: undefined, handles: { types: [{ type: "APLICAT", label: "Mâner aplicat" }, { type: "PUSH", label: "Push" }] } };
  const opened = decodeShare(code, older)!;
  assert.deepEqual(opened.doors, { type: "BATANTE", fills: ["PANOU", "OGLINDA", "PANOU"] });
  assert.equal(opened.handle, undefined);
  // unknown keys never get through; a uniform `fills` collapses to the classic type
  const parsed = parseConfig({ ...config, doors: { type: "BATANTE", fills: ["OGLINDA", "OGLINDA", "OGLINDA"], evil: 1 }, extra: "x", contact: { phone: "07" } }, catalog)!;
  assert.deepEqual(Object.keys(parsed).sort(), ["carcassMaterialId", "category", "columns", "depthMm", "doors", "fronts", "handle", "heightMm", "legsMm", "widthMm"]);
  assert.deepEqual(parsed.doors, { type: "BATANTE_OGLINDA" });
});

test("stored sessions from before handles had colours and doors had faces still load", () => {
  const old = {
    category: "DRESSING", widthMm: 2400, heightMm: 2600, depthMm: 600, legsMm: 100,
    columns: [{ widthMm: 1200, content: "BARA" }, { widthMm: 1200, content: "POLITE" }],
    carcassMaterialId: catalog.carcass[0].id,
    fronts: { kind: "PAL", materialId: catalog.fronts.PAL[0].id },
    doors: { type: "BATANTE_OGLINDA" },
    handle: { type: "APLICAT" },
  };
  assert.deepEqual(parseConfig(JSON.parse(JSON.stringify(old)), catalog), old);
  assert.deepEqual(parseConfig({ ...old, doors: { type: "GLISANTE", count: 3 }, handle: undefined }, catalog)?.doors, { type: "GLISANTE", count: 3 });
});
