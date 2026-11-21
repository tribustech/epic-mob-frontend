import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { optionVariants, priceCheckRows } from "../lib/shop/price-check.ts";
import { verifyAdminToken } from "../lib/admin/token.ts";
import { shareCodeOf } from "../lib/admin/breakdown.ts";
import { decodeShare } from "../lib/atelier/share.ts";
import { PALETTES } from "../lib/atelier/palettes.ts";
import { SHOP_PRODUCTS } from "../lib/shop/products.ts";
import type { AtelierCatalog, AtelierMaterial } from "../lib/atelier/types.ts";

// a catalog with every decor the palettes ask for (same idea as tests/shop.test.ts)
const mat = (decorCode: string, brand = "Egger"): AtelierMaterial => ({ id: `m-${decorCode.replace(/\s+/g, "").toLowerCase()}`, name: decorCode, decorCode, brand, imageUrl: null });
const codes = new Set<string>();
for (const p of PALETTES) {
  p.carcassCodes.forEach((c) => codes.add(c));
  if ("codes" in p.front) (p.front as { codes: string[] }).codes.forEach((c) => codes.add(c));
  if ("code" in p.front) codes.add((p.front as { code: string }).code);
}
const all = [...codes].map((c) => mat(c));
const catalog: AtelierCatalog = {
  carcass: all,
  fronts: { PAL: all, MDF_MELAMINAT: all.map((m) => ({ ...m, brand: "AGT" })), MDF_VOPSIT: [{ id: "model", name: "Drept" }] },
  ral: [{ code: "9016", name: "Alb", hex: "#fff" }],
  handles: { types: (["APLICAT", "BUTON", "INGROPAT", "PROFIL_J", "GOLA", "PUSH"] as const).map((type) => ({ type, label: type })) },
  glass: { mirrors: [{ id: "oglinda", name: "Oglindă", tint: "#ccc" }], glasses: [{ id: "sticla", name: "Sticlă", tint: "#eee" }] },
};

test("price check: every product, bounded, unique keys, shares decode to the same config", () => {
  const rows = priceCheckRows(catalog, "2026-11-21");
  assert.ok(rows.length >= SHOP_PRODUCTS.length, `${rows.length} rows`);
  assert.ok(rows.length <= 2000, `${rows.length} rows`);
  assert.equal(new Set(rows.map((r) => r.key)).size, rows.length);
  assert.ok(new Set(rows.filter((r) => r.variant === "").map((r) => r.slug)).size > SHOP_PRODUCTS.length * 0.5);
  for (const r of rows.slice(0, 200)) assert.deepEqual(decodeShare(r.share, catalog), r.config, r.key);
  const offer = rows.find((r) => r.slug === "dressing-clasic-240");
  assert.equal(offer?.offer?.percent, 10);
});

test("price check: a sliding wardrobe lists hinged, mirror and no-door variants; a chest lists handles", () => {
  const rows = priceCheckRows(catalog, "2026-11-21");
  const wardrobe = rows.filter((r) => r.slug === "dressing-clasic-240").map((r) => r.variant);
  for (const v of ["usi:NONE", "usi:GLISANTE_OGLINDA", "usi:BATANTE", "usi:BATANTE_OGLINDA"]) assert.ok(wardrobe.includes(v), v);
  const chest = rows.filter((r) => r.slug === "comoda-clasica-160");
  assert.ok(chest.some((r) => r.variant === "maner:PUSH"));
  // milled handles need painted fronts: not offered on board fronts
  assert.ok(!chest.some((r) => r.variant === "maner:INGROPAT" && r.config.fronts.kind !== "MDF_VOPSIT"));
  for (const r of chest.filter((x) => x.variant.startsWith("maner:"))) assert.equal(`maner:${r.handle}`, r.variant);
});

test("optionVariants never repeats the starting configuration", () => {
  const rows = priceCheckRows(catalog, "2026-11-21");
  const base = rows.find((r) => r.variant === "")!;
  assert.ok(optionVariants(base.config, catalog).every((v) => JSON.stringify(v.config) !== JSON.stringify(base.config)));
});

const SECRET = "s".repeat(40);
const jwt = (claims: Record<string, unknown>, secret = SECRET, alg = "HS256") => {
  const h = Buffer.from(JSON.stringify({ alg })).toString("base64url");
  const p = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${h}.${p}.${createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url")}`;
};
const good = { iss: "crm.epicmob.ro", aud: "epicmob-site-admin", sub: "u1", name: "Andrei", iat: 1000, exp: 2000 };

test("admin token: only a valid CRM token passes", () => {
  assert.deepEqual(verifyAdminToken(jwt(good), SECRET, 1500), { userId: "u1", name: "Andrei", exp: 2000 });
  assert.equal(verifyAdminToken(jwt(good), SECRET, 2000), null); // expired
  assert.equal(verifyAdminToken(jwt(good, "x".repeat(40)), SECRET, 1500), null); // other secret
  assert.equal(verifyAdminToken(jwt({ ...good, aud: "alt" }), SECRET, 1500), null);
  assert.equal(verifyAdminToken(jwt({ ...good, iss: "alt" }), SECRET, 1500), null);
  assert.equal(verifyAdminToken(jwt(good, SECRET, "none"), SECRET, 1500), null);
  assert.equal(verifyAdminToken(jwt(good), null, 1500), null); // site without the secret
  assert.equal(verifyAdminToken("a.b", SECRET, 1500), null);
});

test("check-link box finds the code in a pasted link", () => {
  assert.equal(shareCodeOf("https://epicmob.ro/configurator?c=abc_DEF-123"), "abc_DEF-123");
  assert.equal(shareCodeOf("  /configurator?x=1&c=zz  "), "zz");
  assert.equal(shareCodeOf("nimic aici"), null);
});

test("partial drawer extension: listed as an option and kept by the share code, only when the CRM offers it", () => {
  const withPartial: AtelierCatalog = { ...catalog, drawerExtensions: ["COMPLETA", "PARTIALA"] };
  const comoda = SHOP_PRODUCTS.find((p) => p.slug.startsWith("comoda-"))!;
  const rows = priceCheckRows(withPartial, "2026-11-21").filter((r) => r.slug === comoda.slug);
  const partial = rows.find((r) => r.variant === "sertare:PARTIALA");
  assert.ok(partial, "no partial-extension row for a chest of drawers");
  assert.equal(partial.config.drawerExtension, "PARTIALA");
  assert.equal(decodeShare(partial.share, withPartial)?.drawerExtension, "PARTIALA");
  // an older CRM (no partial runners): no such row, and a code asking for it falls back to full extension
  assert.ok(!priceCheckRows(catalog, "2026-11-21").some((r) => r.variant === "sertare:PARTIALA"));
  assert.equal(decodeShare(partial.share, catalog)?.drawerExtension, undefined);
});
