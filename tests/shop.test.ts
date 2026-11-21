import assert from "node:assert/strict";
import test from "node:test";
import { hasMirror } from "../lib/atelier/door-types.ts";
import { PALETTES } from "../lib/atelier/palettes.ts";
import { WHITE_BODY_CODES } from "../lib/atelier/house-rules.ts";
import { SHOP_OFFERS, offerFor, offerPrice } from "../lib/shop/offers.ts";
import { HANDLES, PHOTO_COLOURS, ROOM_LABELS, SHOP_CATEGORIES, SHOP_PRODUCTS, productFacts, renderOf } from "../lib/shop/products.ts";

test("every shop product has a unique slug, a known category and known colours", () => {
  const slugs = new Set<string>();
  for (const p of SHOP_PRODUCTS) {
    assert.ok(!slugs.has(p.slug), `duplicate slug ${p.slug}`);
    slugs.add(p.slug);
    assert.match(p.slug, /^[a-z0-9-]+$/);
    assert.ok(SHOP_CATEGORIES.some((c) => c.id === p.category));
    assert.ok(p.rooms.length > 0);
    // all-mirror hinged doors show only the white body: one colour is honest there
    if (!(p.preset.shape.category === "DRESSING" && p.preset.shape.doors.type === "BATANTE_OGLINDA")) assert.ok(p.paletteIds.length >= 2, `${p.slug} has one colour only`);
    assert.equal(new Set(p.paletteIds).size, p.paletteIds.length);
    for (const id of p.paletteIds) assert.ok(PALETTES.some((pal) => pal.id === id), `${p.slug}: unknown palette ${id}`);
    assert.ok(productFacts(p.preset).length >= 3);
  }
});

test("mirror doors only come with a white body (owner rule)", () => {
  for (const p of SHOP_PRODUCTS.filter((p) => hasMirror(p.preset.shape))) {
    for (const id of p.paletteIds) {
      const pal = PALETTES.find((x) => x.id === id)!;
      assert.ok(WHITE_BODY_CODES.includes(pal.carcassCodes[0]), `${p.slug}: ${id} has no white body`);
    }
  }
});

test("offers point at real products, run for a sane percent and end after they start", () => {
  for (const o of SHOP_OFFERS) {
    const target = o.target.startsWith("categorie:") ? SHOP_CATEGORIES.find((c) => `categorie:${c.id}` === o.target) : SHOP_PRODUCTS.find((p) => p.slug === o.target);
    assert.ok(target, `offer for unknown ${o.target}`);
    assert.ok(o.percent > 0 && o.percent < 50);
    assert.match(o.from, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(o.from <= o.until);
  }
});

test("an offer applies only between its dates and is a real reduction", () => {
  const o = SHOP_OFFERS[0];
  const p = SHOP_PRODUCTS.find((x) => x.slug === o.target)!;
  assert.equal(offerFor(p.slug, p.category, o.from)?.percent, o.percent);
  assert.equal(offerFor(p.slug, p.category, o.until)?.percent, o.percent);
  assert.equal(offerFor(p.slug, p.category, "2000-01-01"), null);
  assert.equal(offerFor(p.slug, p.category, "2999-01-01"), null);
  assert.equal(offerPrice(5000, o), Math.floor(5000 * (1 - o.percent / 100)));
  assert.ok(offerPrice(5000, o) < 5000);
  assert.equal(offerPrice(5000, null), 5000);
});

test("renders are listed per colour and only for known colours", () => {
  for (const p of SHOP_PRODUCTS) {
    for (const id of p.paletteIds) {
      const r = renderOf(p.slug, id);
      if (r) assert.equal(r, `/magazin/randari/${p.slug}/${id}.webp`);
    }
  }
  assert.equal(renderOf("nu-exista", "alb-total"), null);
});

test("every listed room photo is a colour the shop sells and exists on disk", async () => {
  const { existsSync } = await import("node:fs");
  const PHOTOS = (await import("../lib/shop/photos.json", { with: { type: "json" } })).default as Record<string, string[]>;
  for (const [slug, ids] of Object.entries(PHOTOS)) {
    const product = SHOP_PRODUCTS.find((p) => p.slug === slug);
    assert.ok(product, `photo for unknown model ${slug}`);
    for (const id of ids) {
      assert.ok(product.paletteIds.includes(id), `${slug}: photo for a colour not sold (${id})`);
      assert.ok(existsSync(`public/magazin/foto/${slug}/${id}.webp`), `${slug}/${id}.webp missing`);
    }
  }
});

test("every room of the shop has a range, and every product sits in known rooms", () => {
  for (const room of Object.keys(ROOM_LABELS)) {
    const n = SHOP_PRODUCTS.filter((p) => (p.rooms as string[]).includes(room)).length;
    assert.ok(n >= 6, `${room}: only ${n} products`);
  }
  for (const p of SHOP_PRODUCTS) {
    assert.equal(new Set(p.rooms).size, p.rooms.length, `${p.slug}: room listed twice`);
    for (const r of p.rooms) assert.ok(r in ROOM_LABELS, `${p.slug}: unknown room ${r}`);
  }
});

test("owner rules hold for every colour sold: no dark comode or wall units; shop handles are the allowed ones", () => {
  for (const p of SHOP_PRODUCTS) {
    if (p.preset.category === "COMODA" || p.preset.category === "SUSPENDAT") {
      for (const id of p.paletteIds) assert.notEqual(PALETTES.find((x) => x.id === id)!.mood, "INCHIS", `${p.slug}: dark colour ${id}`);
    }
  }
  for (const [slug, h] of Object.entries(HANDLES)) {
    assert.ok(SHOP_PRODUCTS.some((p) => p.slug === slug), `handle for unknown model ${slug}`);
    assert.ok(["APLICAT", "BUTON", "GOLA", "PUSH"].includes(h.type), `${slug}: handle ${h.type}`);
    if (h.finish) assert.ok(["NEGRU", "INOX", "AURIU"].includes(h.finish));
  }
});

test("each product has one or two photo colours, among the colours it sells, the default first", () => {
  for (const p of SHOP_PRODUCTS) {
    const ids = PHOTO_COLOURS[p.slug];
    assert.ok(ids, `${p.slug}: no photo colours`);
    assert.ok(ids.length >= 1 && ids.length <= 2, `${p.slug}: ${ids.length} photo colours`);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(ids[0], p.paletteIds[0], `${p.slug}: the default colour is not a photo colour`);
    for (const id of ids) assert.ok(p.paletteIds.includes(id), `${p.slug}: photo colour ${id} is not sold`);
  }
  for (const slug of Object.keys(PHOTO_COLOURS)) assert.ok(SHOP_PRODUCTS.some((p) => p.slug === slug), `photo colours for unknown model ${slug}`);
});

test("the photo brief (v3) covers every photo colour that has no accepted photo yet", async () => {
  const { readFileSync } = await import("node:fs");
  const PHOTOS = JSON.parse(readFileSync("lib/shop/photos.json", "utf8")) as Record<string, string[]>;
  const brief = JSON.parse(readFileSync("scripts/shop-art-direction-v3.json", "utf8")) as { products: Record<string, unknown>; variants: { slug: string; paletteId: string; render: string; out: string }[] };
  const want = Object.entries(PHOTO_COLOURS).flatMap(([slug, ids]) => ids.filter((id) => !PHOTOS[slug]?.includes(id)).map((id) => `${slug}/${id}`)).sort();
  const briefed = new Set(brief.variants.map((v) => `${v.slug}/${v.paletteId}`));
  for (const w of want) assert.ok(briefed.has(w), `${w}: photo colour without a photo and without a brief`);
  for (const v of brief.variants) {
    assert.ok(brief.products[v.slug], `${v.slug}: no product brief`);
    assert.equal(v.render, `public/magazin/randari/${v.slug}/${v.paletteId}.webp`);
    assert.equal(v.out, `public/magazin/foto/${v.slug}/${v.paletteId}.webp`);
  }
});
