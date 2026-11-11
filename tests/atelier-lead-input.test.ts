import assert from "node:assert/strict";
import test from "node:test";
import { MAX_CONFIG_JSON_LENGTH, parseLeadInput } from "../lib/atelier/lead-input.ts";
import type { AtelierConfig } from "../lib/atelier/types.ts";

const config: AtelierConfig = {
  category: "DRESSING",
  widthMm: 2400,
  heightMm: 2400,
  depthMm: 600,
  columns: [{ widthMm: 800, content: "POLITE" }],
  carcassMaterialId: "mat-1",
  fronts: { kind: "PAL", materialId: "mat-2" },
  legsMm: 100,
  doors: { type: "NONE" },
};
const contact = { name: " Ion ", phone: "0722 123 456", city: "Cluj", notes: " x " };

test("parseLeadInput accepts a valid payload and trims fields", () => {
  const r = parseLeadInput({ config, contact });
  assert.ok(r.ok);
  if (r.ok) {
    assert.deepEqual(r.contact, { name: "Ion", phone: "0722 123 456", city: "Cluj", notes: "x" });
    assert.equal(r.config, config);
  }
});

test("parseLeadInput enforces the CRM contact limits (name 100, phone 30, city 80, notes 1000)", () => {
  for (const bad of [
    { ...contact, name: "a".repeat(101) },
    { ...contact, phone: "0".repeat(31) },
    { ...contact, city: "a".repeat(81) },
    { ...contact, notes: "a".repeat(1001) },
  ]) {
    const r = parseLeadInput({ config, contact: bad });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.error, /prea lung/);
  }
  assert.ok(parseLeadInput({ config, contact: { ...contact, name: "a".repeat(100), notes: "a".repeat(1000) } }).ok);
});

test("parseLeadInput requires name, phone (6+ digits) and city", () => {
  for (const bad of [
    { ...contact, name: "  " },
    { ...contact, phone: "12-34" },
    { ...contact, city: "" },
    { name: "Ion", phone: "0722123456" },
  ]) {
    const r = parseLeadInput({ config, contact: bad });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.error, /[ăâîșțĂÂÎȘȚ]|incomplete|invalid/);
  }
});

test("parseLeadInput rejects a missing or oversized configuration", () => {
  assert.equal(parseLeadInput({ contact }).ok, false);
  const huge = { ...config, carcassMaterialId: "x".repeat(MAX_CONFIG_JSON_LENGTH) };
  const r = parseLeadInput({ config: huge, contact });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.error, /prea mare/);
});
