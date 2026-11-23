import assert from "node:assert/strict";
import test from "node:test";
import {
  CATEGORY_LANDINGS,
  MIN_LANDING_PRODUCTS,
  ROOM_LANDINGS,
  categoryLandings,
  landingProducts,
  roomLandings,
} from "../lib/shop/landing.ts";
import { ROOM_LABELS, SHOP_CATEGORIES, SHOP_PRODUCTS } from "../lib/shop/products.ts";

const ALL = [...ROOM_LANDINGS, ...CATEGORY_LANDINGS];

test("one landing page per room and per category, with unique Romanian slugs that do not clash with products", () => {
  assert.equal(ROOM_LANDINGS.length, Object.keys(ROOM_LABELS).length);
  assert.equal(CATEGORY_LANDINGS.length, SHOP_CATEGORIES.length);
  const paths = new Set(ALL.map((l) => l.path));
  assert.equal(paths.size, ALL.length, "duplicate landing path");
  for (const l of ALL) {
    assert.match(l.slug, /^[a-z0-9-]+$/);
    assert.equal(l.path, `/magazin/${l.kind}/${l.slug}`);
  }
  // /magazin/camera and /magazin/categorie are static segments next to /magazin/[slug]
  for (const p of SHOP_PRODUCTS) assert.ok(p.slug !== "camera" && p.slug !== "categorie" && p.slug !== "cos", `product slug ${p.slug} clashes`);
});

test("every built landing page has enough products; today that is every room and category", () => {
  for (const l of [...roomLandings(), ...categoryLandings()]) {
    assert.ok(landingProducts(l).length >= MIN_LANDING_PRODUCTS, `${l.path} has ${landingProducts(l).length} products`);
  }
  assert.equal(roomLandings().length + categoryLandings().length, ALL.length);
});

test("landing copy is unique per page and follows the shop's wording rules", () => {
  const seen = new Map<string, string>();
  for (const l of ALL) {
    assert.ok(l.intro.length >= 2 && l.intro.length <= 3, `${l.path}: 2–3 intro paragraphs`);
    assert.ok(l.faq.length >= 3 && l.faq.length <= 5, `${l.path}: 3–5 questions`);
    assert.ok(l.title.length <= 75, `${l.path}: title too long`);
    assert.ok(l.description.length >= 120 && l.description.length <= 220, `${l.path}: description length ${l.description.length}`);
    for (const text of [l.title, l.description, l.h1, ...l.intro, ...l.faq.flatMap((f) => [f.question, f.answer])]) {
      // texts shared between pages would be thin, duplicated content
      if (text.length > 40) {
        assert.ok(!seen.has(text) || seen.get(text) === l.path, `"${text.slice(0, 50)}…" on ${seen.get(text)} and ${l.path}`);
        seen.set(text, l.path);
      }
      assert.doesNotMatch(text, /[şţŞŢ]/, `${l.path}: cedilla instead of comma below`);
      assert.doesNotMatch(text, /TVA/i, `${l.path}: the firm is not a VAT payer`);
      assert.doesNotMatch(text, /în stoc/i, `${l.path}: shop pieces are made to order, never „în stoc"`);
    }
    for (const m of l.materials) assert.match(m.href, /^\/materiale(\/[a-z-]+|#[a-z]+)?$/);
  }
});
