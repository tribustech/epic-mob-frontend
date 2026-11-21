import assert from "node:assert/strict";
import test from "node:test";
import { MAX_LINES, MAX_QTY, addLine, cartSizeText, type CartLine } from "../lib/shop/cart.ts";
import { checkContact } from "../lib/shop/contact-check.ts";
import { normalizeRoPhone, phoneProblem } from "../lib/shop/phone.ts";
import { colourCountText, SHOP_PRODUCTS } from "../lib/shop/products.ts";
import { orderReference } from "../lib/shop/reference.ts";
import { productAvailable } from "../lib/shop/server.ts";
import { resolvePalettes } from "../lib/atelier/palettes.ts";
import type { AtelierCatalog } from "../lib/atelier/types.ts";

const line = (slug: string, paletteId = "p1"): Omit<CartLine, "qty"> => ({
  slug,
  paletteId,
  name: slug,
  colour: paletteId,
  price: 1000,
  regularPrice: null,
  offerPercent: 0,
  offerLabel: null,
});

test("adding a piece reports when the line already has the most pieces, instead of a false „Adăugat” (S-02)", () => {
  let lines: CartLine[] = [];
  for (let i = 0; i < MAX_QTY; i++) {
    const r = addLine(lines, line("a"));
    assert.equal(r.result, "added");
    lines = r.lines;
  }
  assert.equal(lines[0].qty, MAX_QTY);
  const capped = addLine(lines, line("a"));
  assert.equal(capped.result, "max");
  assert.equal(capped.lines, lines, "nothing changes");
  // a full basket still takes one more piece of a line it has, but no new line
  let full: CartLine[] = [];
  for (let i = 0; i < MAX_LINES; i++) full = addLine(full, line(`p${i}`)).lines;
  assert.equal(addLine(full, line("new")).result, "full");
  assert.equal(addLine(full, line("p0")).result, "added");
});

test("the basket heading counts products and pieces apart (S-18)", () => {
  assert.equal(cartSizeText(1, 1), "1 produs");
  assert.equal(cartSizeText(5, 5), "5 produse");
  assert.equal(cartSizeText(5, 6), "5 produse, 6 bucăți");
  assert.equal(cartSizeText(1, 3), "1 produs, 3 bucăți");
});

test("one Romanian mobile phone rule for the basket and the order route (S-19)", () => {
  for (const ok of ["0712345678", "0712 345 678", "0712.345.678", "0712-345-678", "+40712345678", "+40 712 345 678", "+40 (0)712 345 678", "0040 712 345 678"]) {
    assert.equal(phoneProblem(ok), null, ok);
    assert.equal(normalizeRoPhone(ok), "0712345678", ok);
  }
  assert.match(phoneProblem("")!, /Scrie numărul/);
  assert.match(phoneProblem("   ")!, /Scrie numărul/);
  assert.match(phoneProblem("abc")!, /doar cifre/);
  assert.match(phoneProblem("07l2345678")!, /doar cifre/);
  assert.match(phoneProblem("0712345")!, /prea puține cifre/);
  assert.match(phoneProblem("07123456789")!, /prea multe cifre/);
  assert.match(phoneProblem("1234567890123456")!, /începe cu 07/);
  assert.match(phoneProblem("0212345678")!, /începe cu 07/);
  assert.match(phoneProblem("+44 7911 123456")!, /începe cu 07/);
  // the order route uses the same rule through checkContact
  assert.equal(checkContact({ name: "Ana", phone: "0712345", city: "Cluj" }).phone, phoneProblem("0712345"));
  assert.deepEqual(checkContact({ name: "Ana", phone: "+40 712 345 678", city: "Cluj" }), {});
});

test("the order reference comes from the CRM quote, else from the time (S-06)", () => {
  assert.equal(orderReference([null, "cmabc123xyz9"]), "EM-23XYZ9");
  assert.equal(orderReference(["q-1"], new Date(0)), "EM-0", "too short to be an id");
  const t = orderReference([], new Date("2026-11-21T10:00:00Z"));
  assert.match(t, /^EM-[0-9A-Z]+$/);
  assert.notEqual(t, orderReference([], new Date("2026-11-21T10:00:01Z")));
});

test("meta description says „o singură combinație” for a one-colour product (S-16)", () => {
  assert.equal(colourCountText(1), "Într-o singură combinație de culori");
  assert.equal(colourCountText(3), "În 3 combinații de culori");
  assert.equal(colourCountText(19), "În 19 combinații de culori");
  assert.equal(colourCountText(20), "În 20 de combinații de culori");
  assert.equal(colourCountText(101), "În 101 combinații de culori");
});

test("the sitemap leaves out kitchens and bathrooms when the CRM cannot price them (F-01)", () => {
  const mat = (id: string) => ({ id, name: id, decorCode: null, brand: null, imageUrl: null });
  const catalog: AtelierCatalog = { carcass: [mat("c1")], fronts: { PAL: [mat("f1")], MDF_MELAMINAT: [], MDF_VOPSIT: [] }, ral: [] };
  const palettes = resolvePalettes(catalog);
  const kitchen = SHOP_PRODUCTS.find((p) => p.category === "bucatarii" || p.preset.category === "BUCATARIE");
  assert.ok(kitchen, "the shop has a kitchen");
  assert.equal(productAvailable(kitchen, catalog, palettes), false);
  const withWorktops = { ...catalog, worktops: [{ ...mat("w1"), thicknessMm: 38, maxDepthMm: 600 }] };
  // with worktops the preset is available; the colours decide the rest
  const palettesW = resolvePalettes(withWorktops);
  assert.equal(productAvailable(kitchen, withWorktops, palettesW), palettesW.some((p) => kitchen.paletteIds.includes(p.id)));
});
