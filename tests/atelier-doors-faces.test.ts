import assert from "node:assert/strict";
import test from "node:test";
import { atelierReducer, defaultConfig } from "../lib/atelier/state.ts";
import { alternateFills, doorFills, doorSlots, doorsSummary, hasGlass, hasMirror, missingGlassIds, normalizeDoors } from "../lib/atelier/door-types.ts";
import {
  DEFAULT_HANDLE_FINISH,
  HANDLE_INFO,
  HANDLE_KINDS,
  cleanHandle,
  effectiveHandle,
  handleHasFinish,
  handleText,
  handleUnavailable,
  withShownHandle,
} from "../lib/atelier/handles.ts";
import { followUps, isAgtBody, whiteBodyId } from "../lib/atelier/house-rules.ts";
import { existsSync } from "node:fs";
import type { AtelierCatalog, AtelierConfig, AtelierMaterial } from "../lib/atelier/types.ts";

const mat = (id: string, extra: Partial<AtelierMaterial> = {}): AtelierMaterial => ({ id, name: id, decorCode: null, brand: "Egger", imageUrl: null, ...extra });
const agt = mat("agt-734", { decorCode: "734", brand: "AGT" });
const white = mat("alb", { decorCode: "W1000 ST9" });
const catalog: AtelierCatalog = {
  carcass: [mat("stejar"), white, agt],
  fronts: { PAL: [mat("stejar"), white], MDF_MELAMINAT: [agt], MDF_VOPSIT: [] },
  ral: [],
  handles: { types: HANDLE_KINDS.map((type) => ({ type, label: type })) },
  glass: {
    mirrors: [
      { id: "og-clara", name: "Oglindă clară", tint: "#cfd8de" },
      { id: "og-bronz", name: "Oglindă bronz", tint: "#b08d6a" },
    ],
    glasses: [{ id: "st-mata", name: "Sticlă mată", tint: "#dfe7ea", matte: true }],
  },
};

/** 2,4 m dressing, sliding doors (3, automatic). */
const sliding = (): AtelierConfig => defaultConfig(catalog);
const hinged = (): AtelierConfig => atelierReducer(sliding(), { type: "setDoors", doors: { type: "BATANTE" } });

test("door slots: one per sliding door, one per column with hinged doors", () => {
  assert.equal(doorSlots(sliding()), 3);
  assert.equal(doorSlots({ ...sliding(), doors: { type: "GLISANTE", count: 4 } }), 4);
  assert.equal(doorSlots(hinged()), hinged().columns.length);
  assert.equal(doorSlots({ ...sliding(), doors: { type: "NONE" } }), 0);
  assert.equal(doorSlots(defaultConfig(catalog, "COMODA")), 0);
  // the classic types still mean „every door": old configurations read the same
  assert.deepEqual(doorFills({ ...sliding(), doors: { type: "GLISANTE_OGLINDA" } }), ["OGLINDA", "OGLINDA", "OGLINDA"]);
  // short / odd fills fall back to the face of the type
  assert.deepEqual(doorFills({ ...sliding(), doors: { type: "GLISANTE", fills: ["OGLINDA", "x" as never] } }), ["OGLINDA", "PANOU", "PANOU"]);
});

test("setDoorFill: one tap per door; mixed faces = plain type + fills", () => {
  let c = atelierReducer(sliding(), { type: "setDoorFill", index: 1, fill: "OGLINDA" });
  assert.deepEqual(c.doors, { type: "GLISANTE", fills: ["PANOU", "OGLINDA", "PANOU"] });
  assert.ok(hasMirror(c) && !hasGlass(c));
  c = atelierReducer(c, { type: "setDoorFill", index: 0, fill: "STICLA" });
  assert.deepEqual(c.doors.fills, ["STICLA", "OGLINDA", "PANOU"]);
  // out of range / unknown faces change nothing
  assert.equal(atelierReducer(c, { type: "setDoorFill", index: 3, fill: "OGLINDA" }), c);
  assert.equal(atelierReducer(c, { type: "setDoorFill", index: -1, fill: "OGLINDA" }), c);
  assert.equal(atelierReducer(c, { type: "setDoorFill", index: 0, fill: "LEMN" as never }), c);
  assert.equal(atelierReducer(c, { type: "setDoorFill", index: 1, fill: "OGLINDA" }), c);
  // no doors, no faces
  const open = atelierReducer(sliding(), { type: "setDoors", doors: { type: "NONE" } });
  assert.equal(atelierReducer(open, { type: "setDoorFill", index: 0, fill: "OGLINDA" }), open);
  assert.equal(atelierReducer(open, { type: "setDoorFills", fills: ["OGLINDA"] }), open);
});

test("the same face on every door is the classic type without fills (an older CRM prices it the same)", () => {
  let c = sliding();
  for (const index of [0, 1, 2]) c = atelierReducer(c, { type: "setDoorFill", index, fill: "OGLINDA" });
  assert.deepEqual(c.doors, { type: "GLISANTE_OGLINDA" });
  c = atelierReducer(c, { type: "setDoorFills", fills: ["STICLA", "STICLA", "STICLA"] });
  assert.deepEqual(c.doors, { type: "GLISANTE_STICLA" });
  c = atelierReducer(c, { type: "setDoorFills", fills: [] });
  assert.deepEqual(c.doors, { type: "GLISANTE" });
  // hinged: per column
  let h = atelierReducer(hinged(), { type: "setDoorFills", fills: alternateFills(3) });
  assert.deepEqual(h.doors, { type: "BATANTE", fills: ["OGLINDA", "PANOU", "OGLINDA"] });
  h = atelierReducer(h, { type: "setDoorFill", index: 1, fill: "OGLINDA" });
  assert.deepEqual(h.doors, { type: "BATANTE_OGLINDA" });
});

test("faces follow the doors: count, width, columns added / removed, opening changed", () => {
  let c = atelierReducer({ ...sliding(), doors: { type: "GLISANTE", count: 3 } }, { type: "setDoorFills", fills: ["OGLINDA", "PANOU", "OGLINDA"] });
  // a fourth door starts plain; back to two keeps the first two
  c = atelierReducer(c, { type: "setDoors", doors: { ...c.doors, count: 4 } });
  assert.deepEqual(c.doors, { type: "GLISANTE", count: 4, fills: ["OGLINDA", "PANOU", "OGLINDA", "PANOU"] });
  c = atelierReducer(c, { type: "setDoors", doors: { ...c.doors, count: 2 } });
  assert.deepEqual(c.doors, { type: "GLISANTE", count: 2, fills: ["OGLINDA", "PANOU"] });
  // automatic count: widening from 2,4 m to 3,6 m adds a door
  let auto = atelierReducer(sliding(), { type: "setDoorFill", index: 0, fill: "OGLINDA" });
  auto = atelierReducer(auto, { type: "setSize", widthMm: 3600 });
  assert.deepEqual(auto.doors.fills, ["OGLINDA", "PANOU", "PANOU", "PANOU"]);
  // narrowing to one mirror + nothing else left uniform? 2 doors: [OGLINDA, PANOU] stays mixed
  auto = atelierReducer(auto, { type: "setSize", widthMm: 1800 });
  assert.deepEqual(auto.doors, { type: "GLISANTE", fills: ["OGLINDA", "PANOU"] });

  // hinged: removing a column takes its face along, a new column starts plain
  let h = atelierReducer(hinged(), { type: "setDoorFill", index: 1, fill: "OGLINDA" });
  assert.deepEqual(h.doors.fills, ["PANOU", "OGLINDA", "PANOU"]);
  const removed = atelierReducer(h, { type: "removeColumn", index: 0 });
  assert.deepEqual(removed.doors.fills, ["OGLINDA", "PANOU"]);
  const added = atelierReducer(h, { type: "addColumn" });
  assert.equal(added.columns.length, 4);
  assert.deepEqual(added.doors.fills, ["PANOU", "OGLINDA", "PANOU", "PANOU"]);
  // every remaining column mirrored: uniform again
  h = atelierReducer(atelierReducer(h, { type: "removeColumn", index: 2 }), { type: "setDoorFill", index: 0, fill: "OGLINDA" });
  assert.deepEqual(h.doors, { type: "BATANTE_OGLINDA" });
  // no doors: nothing door-related survives
  const none = atelierReducer({ ...auto, doors: { ...auto.doors, mirrorId: "og-clara" } }, { type: "setDoors", doors: { type: "NONE" } });
  assert.deepEqual(none.doors, { type: "NONE" });
});

test("mirror / glass ids: kept only while a door has that face; setDoorGlass changes only the given key", () => {
  let c = atelierReducer(sliding(), { type: "setDoorFills", fills: ["OGLINDA", "STICLA", "PANOU"] });
  c = atelierReducer(c, { type: "setDoorGlass", mirrorId: "og-bronz" });
  c = atelierReducer(c, { type: "setDoorGlass", glassId: "st-mata" });
  assert.deepEqual(c.doors, { type: "GLISANTE", fills: ["OGLINDA", "STICLA", "PANOU"], mirrorId: "og-bronz", glassId: "st-mata" });
  // the glass door becomes a panel: the glass id goes, the mirror id stays
  c = atelierReducer(c, { type: "setDoorFill", index: 1, fill: "PANOU" });
  assert.deepEqual(c.doors, { type: "GLISANTE", fills: ["OGLINDA", "PANOU", "PANOU"], mirrorId: "og-bronz" });
  c = atelierReducer(c, { type: "setDoorFills", fills: ["OGLINDA", "OGLINDA", "OGLINDA"] });
  assert.deepEqual(c.doors, { type: "GLISANTE_OGLINDA", mirrorId: "og-bronz" });
  c = atelierReducer(c, { type: "setDoorFills", fills: [] });
  assert.deepEqual(c.doors, { type: "GLISANTE" });
  // a mirror id without a mirror door does not stick
  assert.deepEqual(atelierReducer(c, { type: "setDoorGlass", mirrorId: "og-bronz" }).doors, { type: "GLISANTE" });
  // normalizeDoors keeps the same object when there is nothing to change
  assert.equal(normalizeDoors(c), c.doors);
});

test("missingGlassIds: the first type in the catalog for a face without one; nothing on an older CRM", () => {
  const mirror = atelierReducer(sliding(), { type: "setDoorFills", fills: ["OGLINDA", "STICLA", "PANOU"] });
  assert.deepEqual(missingGlassIds(mirror, catalog), { mirrorId: "og-clara", glassId: "st-mata" });
  assert.deepEqual(missingGlassIds({ ...mirror, doors: { ...mirror.doors, mirrorId: "og-bronz", glassId: "st-mata" } }, catalog), {});
  // an id the catalog no longer has is replaced
  assert.deepEqual(missingGlassIds({ ...mirror, doors: { ...mirror.doors, mirrorId: "gone", glassId: "st-mata" } }, catalog), { mirrorId: "og-clara" });
  assert.deepEqual(missingGlassIds(mirror, {}), {});
  assert.deepEqual(missingGlassIds(sliding(), catalog), {});
});

test("doors in plain words", () => {
  assert.equal(doorsSummary(sliding()), "Uși glisante");
  assert.equal(doorsSummary({ ...sliding(), doors: { type: "BATANTE_OGLINDA" } }), "Uși batante cu oglindă");
  assert.equal(doorsSummary({ ...sliding(), doors: { type: "NONE" } }), "Fără uși");
  assert.equal(
    doorsSummary({ ...sliding(), doors: { type: "GLISANTE", fills: ["OGLINDA", "PANOU", "STICLA"] } }),
    "Uși glisante: 1 cu oglindă, 1 cu sticlă, 1 în culoarea fronturilor",
  );
  assert.equal(doorsSummary(defaultConfig(catalog, "COMODA")), null);
});

test("house rule: a mirror appearing on an AGT body switches the body to plain white, once", () => {
  assert.equal(isAgtBody(catalog, "agt-734"), true);
  assert.equal(isAgtBody(catalog, "stejar"), false);
  assert.equal(whiteBodyId(catalog), "alb");
  const onAgt = { ...sliding(), carcassMaterialId: "agt-734" };
  const mirrored = atelierReducer(onAgt, { type: "setDoorFill", index: 0, fill: "OGLINDA" });
  const extra = followUps(onAgt, mirrored, catalog);
  assert.equal(extra.whitened, true);
  assert.deepEqual(extra.actions, [
    { type: "setDoorGlass", mirrorId: "og-clara" },
    { type: "setCarcass", materialId: "alb" },
  ]);
  const done = extra.actions.reduce(atelierReducer, mirrored);
  assert.equal(done.carcassMaterialId, "alb");
  assert.equal(done.doors.mirrorId, "og-clara");
  // nothing is blocked: the client picks the AGT body again and keeps it (the mirror was already there)
  const back = atelierReducer(done, { type: "setCarcass", materialId: "agt-734" });
  assert.deepEqual(followUps(done, back, catalog), { actions: [], whitened: false, handleReset: false });
  // plain board bodies and glass doors are left alone
  const onOak = { ...sliding(), carcassMaterialId: "stejar" };
  assert.equal(followUps(onOak, atelierReducer(onOak, { type: "setDoorFill", index: 0, fill: "OGLINDA" }), catalog).whitened, false);
  assert.equal(followUps(onAgt, atelierReducer(onAgt, { type: "setDoorFill", index: 0, fill: "STICLA" }), catalog).whitened, false);
  // no white board in the catalog: the body stays
  const noWhite = { ...catalog, carcass: catalog.carcass.filter((m) => m.id !== "alb") };
  assert.equal(followUps(onAgt, mirrored, noWhite).whitened, false);
});

test("handles: all six types, a finish only where there is metal to colour", () => {
  let c = hinged();
  for (const type of HANDLE_KINDS) {
    c = atelierReducer(c, { type: "setHandle", handle: { type } });
    assert.equal(c.handle?.type, type);
    assert.ok(HANDLE_INFO[type].name && HANDLE_INFO[type].benefit);
    assert.ok(existsSync(`public${HANDLE_INFO[type].image}`), HANDLE_INFO[type].image);
  }
  c = atelierReducer(c, { type: "setHandle", handle: { type: "APLICAT", finish: "AURIU" } });
  assert.deepEqual(c.handle, { type: "APLICAT", finish: "AURIU" });
  // the colour stays while trying other types that have one…
  c = atelierReducer(c, { type: "setHandle", handle: { type: "BUTON" } });
  assert.deepEqual(c.handle, { type: "BUTON", finish: "AURIU" });
  // …and goes where there is nothing to colour
  c = atelierReducer(c, { type: "setHandle", handle: { type: "PUSH" } });
  assert.deepEqual(c.handle, { type: "PUSH" });
  assert.deepEqual(atelierReducer(c, { type: "setHandle", handle: { type: "PROFIL_J", finish: "INOX" } }).handle, { type: "PROFIL_J" });
  // junk is refused
  assert.equal(atelierReducer(c, { type: "setHandle", handle: { type: "LEMN" as never } }), c);
  assert.deepEqual(atelierReducer(c, { type: "setHandle", handle: { type: "GOLA", finish: "ROZ" as never } }).handle, { type: "GOLA" });
  assert.equal(cleanHandle(null), null);
  assert.equal(handleHasFinish("PUSH"), false);
  assert.equal(handleHasFinish("INGROPAT"), true);
});

test("the handle on the fronts: default per category, default colour, none without handled fronts", () => {
  assert.equal(effectiveHandle(sliding()), null);
  assert.deepEqual(effectiveHandle(hinged()), { type: "APLICAT", finish: DEFAULT_HANDLE_FINISH });
  assert.deepEqual(effectiveHandle(defaultConfig(catalog, "COMODA")), { type: "PUSH", finish: null });
  assert.equal(effectiveHandle(defaultConfig(catalog, "SEPARATOR")), null);
  assert.equal(handleText({ type: "APLICAT", finish: "INOX" }), "Mâner bară, inox");
  assert.equal(handleText({ type: "PUSH", finish: null }), "Fără mâner (apeși și se deschide)");
  assert.equal(handleText({ type: "PROFIL_J", finish: null }), "Muchie frezată");
  // a session saved before the colours existed still reads: { type } only
  const old = { ...hinged(), handle: { type: "APLICAT" as const } };
  assert.deepEqual(effectiveHandle(old), { type: "APLICAT", finish: "NEGRU" });
  // what is sent with a request names the colour that was shown, without touching unhandled fronts
  assert.deepEqual(withShownHandle(old).handle, { type: "APLICAT", finish: "NEGRU" });
  assert.deepEqual(withShownHandle(hinged()).handle, { type: "APLICAT", finish: "NEGRU" });
  const plain = sliding();
  assert.equal(withShownHandle(plain), plain);
  const push = defaultConfig(catalog, "COMODA");
  assert.equal(withShownHandle(push), push);
});

test("handles cut into the front: painted fronts only, never over a mirror; an invalid one goes back to the usual handle", () => {
  const painted: AtelierCatalog = { ...catalog, fronts: { ...catalog.fronts, MDF_VOPSIT: [{ id: "drept", name: "Drept" }] }, ral: [{ code: "RAL 9010", name: "Alb", hex: "#ffffff" }] };
  const pal = hinged();
  assert.equal(handleUnavailable(pal, "INGROPAT"), "Doar la fronturi vopsite");
  assert.equal(handleUnavailable(pal, "PROFIL_J"), "Doar la fronturi vopsite");
  for (const type of ["APLICAT", "BUTON", "GOLA", "PUSH"] as const) assert.equal(handleUnavailable(pal, type), null);
  const vopsit = atelierReducer(pal, { type: "setFronts", fronts: { kind: "MDF_VOPSIT", modelId: "drept", ralCode: "RAL 9010" } });
  assert.equal(handleUnavailable(vopsit, "INGROPAT"), null);
  const chosen = atelierReducer(vopsit, { type: "setHandle", handle: { type: "INGROPAT", finish: "INOX" } });
  assert.deepEqual(followUps(vopsit, chosen, painted).actions, []);
  // a mirror on one hinged column: the recessed grip can no longer be cut
  const mirrored = atelierReducer(chosen, { type: "setDoorFill", index: 0, fill: "OGLINDA" });
  assert.equal(handleUnavailable(mirrored, "INGROPAT"), "Nu merge pe uși cu oglindă sau sticlă");
  const extra = followUps(chosen, mirrored, painted);
  assert.equal(extra.handleReset, true);
  const fixed = extra.actions.reduce(atelierReducer, mirrored);
  assert.deepEqual(fixed.handle, { type: "APLICAT", finish: "INOX" });
  assert.equal(followUps(mirrored, fixed, painted).handleReset, false);
  // back to board fronts: same
  const board = atelierReducer(chosen, { type: "setFronts", fronts: { kind: "PAL", materialId: "stejar" } });
  assert.equal(followUps(chosen, board, painted).handleReset, true);
  // a comodă falls back to its own default (no handle, push to open)
  const comoda = { ...defaultConfig(painted, "COMODA"), handle: { type: "PROFIL_J" as const } };
  assert.deepEqual(followUps(comoda, comoda, painted).actions, [{ type: "setHandle", handle: { type: "PUSH" } }]);
  // a sliding wardrobe has no handle to worry about
  assert.equal(followUps(sliding(), sliding(), painted).handleReset, false);
});
