import assert from "node:assert/strict";
import test from "node:test";
import { MAX_DOOR_WIDTH_MM, autoDoorCount, doorCountOptions, doorWidthMm } from "../lib/atelier/doors.ts";

test("door width uses the CRM overlap (30 mm per extra door)", () => {
  assert.equal(doorWidthMm(4500, 2), 2265);
  assert.equal(doorWidthMm(3000, 3), 1020);
});

test("automatic door count never produces a door wider than the sheet", () => {
  for (let w = 600; w <= 12000; w += 10) {
    assert.ok(doorWidthMm(w, autoDoorCount(w)) <= MAX_DOOR_WIDTH_MM, `width ${w}`);
  }
});

test("a 4500 mm wardrobe is not offered 2 doors; 3+ are", () => {
  const opts = doorCountOptions(4500);
  assert.ok(!opts.includes(2));
  assert.ok(opts.includes(3));
});

test("narrow wardrobes keep 2 doors; too-narrow counts are hidden", () => {
  assert.deepEqual(doorCountOptions(1000), [2]);
  assert.ok(doorCountOptions(2400).includes(2));
});

test("a manually chosen count stays listed (the CRM explains why it does not fit)", () => {
  assert.ok(doorCountOptions(4500, 2).includes(2));
});
