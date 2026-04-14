import assert from "node:assert/strict";
import test from "node:test";
import {
  getImmersiveScrollState,
  getImmersiveSectionHeight,
} from "../lib/portfolio-immersive-state.ts";

test("section height uses one full viewport step per slide", () => {
  assert.equal(getImmersiveSectionHeight(3, 900), 2700);
});

test("initial scroll state starts on the first slide", () => {
  assert.deepEqual(
    getImmersiveScrollState({
      scrollY: 0,
      sectionTop: 0,
      step: 900,
      slideCount: 3,
    }),
    {
      currentIndex: 0,
      nextIndex: 1,
      progress: 0,
    }
  );
});

test("midway through the second slide transition reports the right pair", () => {
  assert.deepEqual(
    getImmersiveScrollState({
      scrollY: 1350,
      sectionTop: 0,
      step: 900,
      slideCount: 3,
    }),
    {
      currentIndex: 1,
      nextIndex: 2,
      progress: 0.5,
    }
  );
});

test("the sequence clamps to the final slide without wrapping", () => {
  assert.deepEqual(
    getImmersiveScrollState({
      scrollY: 3600,
      sectionTop: 0,
      step: 900,
      slideCount: 3,
    }),
    {
      currentIndex: 2,
      nextIndex: 2,
      progress: 1,
    }
  );
});
