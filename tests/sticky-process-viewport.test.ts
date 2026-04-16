import assert from "node:assert/strict";
import test from "node:test";
import {
  getStickyProcessScrollDistance,
  getStickyProcessViewportHeight,
} from "../lib/sticky-process-viewport.ts";

test("prefers the visual viewport height on mobile, minus header", () => {
  assert.equal(
    getStickyProcessViewportHeight({
      innerHeight: 844,
      visualViewportHeight: 724,
      headerHeight: 72,
    }),
    652
  );
});

test("falls back to innerHeight when visualViewport is unavailable", () => {
  assert.equal(
    getStickyProcessViewportHeight({
      innerHeight: 844,
      headerHeight: 72,
    }),
    772
  );
});

test("never returns a non-positive viewport height after subtraction", () => {
  assert.equal(
    getStickyProcessViewportHeight({
      innerHeight: 40,
      visualViewportHeight: 0,
      headerHeight: 72,
    }),
    1
  );
});

test("handles zero header height (e.g. before CSS resolves)", () => {
  assert.equal(
    getStickyProcessViewportHeight({
      innerHeight: 800,
      headerHeight: 0,
    }),
    800
  );
});

test("computes one viewport of scroll per transition", () => {
  assert.equal(
    getStickyProcessScrollDistance({
      panelCount: 4,
      viewportHeight: 724,
    }),
    2172
  );
});

test("does not create negative scroll distance", () => {
  assert.equal(
    getStickyProcessScrollDistance({
      panelCount: 0,
      viewportHeight: 724,
    }),
    0
  );
});
