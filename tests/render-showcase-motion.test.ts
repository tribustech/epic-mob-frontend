import assert from "node:assert/strict";
import test from "node:test";
import { getRenderShowcaseMotion } from "../lib/render-showcase-motion.ts";

test("baie starts tighter and drifts in from the upper left", () => {
  assert.deepEqual(getRenderShowcaseMotion("baie"), {
    startScale: 1.28,
    endScale: 1.04,
    startX: "-3.5%",
    endX: "0%",
    startY: "-4%",
    endY: "0%",
  });
});

test("bucatarie uses a right-to-left drift with a slight rise", () => {
  assert.deepEqual(getRenderShowcaseMotion("bucatarie"), {
    startScale: 1.3,
    endScale: 1.05,
    startX: "4.5%",
    endX: "0%",
    startY: "2.5%",
    endY: "-1%",
  });
});

test("unknown slides fall back to the shared cinematic motion", () => {
  assert.deepEqual(getRenderShowcaseMotion("unknown"), {
    startScale: 1.24,
    endScale: 1.02,
    startX: "0%",
    endX: "0%",
    startY: "2.5%",
    endY: "0%",
  });
});
