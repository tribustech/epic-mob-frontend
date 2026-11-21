import test from "node:test";
import assert from "node:assert/strict";
import { PRICE_BURST_MS, PRICE_DEBOUNCE_MS, priceDelay } from "../lib/atelier/use-live-price.ts";

test("first load and a lone tap ask for the price at once", () => {
  assert.equal(priceDelay(1000, null), 0);
  assert.equal(priceDelay(10_000, 10_000 - PRICE_BURST_MS), 0);
});

test("changes in quick succession are debounced", () => {
  assert.equal(priceDelay(1000, 900), PRICE_DEBOUNCE_MS);
});
