import assert from "node:assert/strict";
import test from "node:test";
import { faqItems } from "../lib/faq-data.ts";
import { ADVANCE_PERCENT, ANPC_SAL_URL, EU_SOL_URL, WARRANTY_YEARS } from "../lib/legal.ts";
import { baseOpenGraph } from "../lib/seo.ts";
import { DELIVERY_TEXT } from "../lib/shop/products.ts";

const faqText = faqItems.map((i) => `${i.question} ${i.answer}`).join("\n");

test("FAQ follows the owner's rules: 5-year warranty, 4–6 weeks, no shelf-price claim", () => {
  assert.equal(WARRANTY_YEARS, 5);
  assert.match(faqText, /garanție 5 ani/);
  assert.ok(faqText.includes(DELIVERY_TEXT), "FAQ must use the shop's delivery text");
  for (const banned of [/24 de luni/, /8–10 săptămâni/, /prețuri de raft/, /TVA inclus/i, /în stoc/i]) {
    assert.doesNotMatch(faqText, banned);
  }
});

test("FAQ copy uses comma-below diacritics, never cedilla ş ţ", () => {
  assert.doesNotMatch(faqText, /[şţŞŢ]/);
});

test("legal constants and shared Open Graph defaults", () => {
  assert.equal(ADVANCE_PERCENT, 50);
  assert.ok(ANPC_SAL_URL.startsWith("https://anpc.ro/"));
  assert.ok(EU_SOL_URL.startsWith("https://ec.europa.eu/"));
  assert.equal(baseOpenGraph.siteName, "Epic Mob");
  assert.equal(baseOpenGraph.locale, "ro_RO");
  assert.equal(baseOpenGraph.images[0].url, "/opengraph-image");
});
