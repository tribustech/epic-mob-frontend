import assert from "node:assert/strict";
import test from "node:test";
import { leadEmailHtml } from "../lib/atelier/lead-email.ts";
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
const contact = { name: "Ion Popescu", phone: "0722 123 456", city: "Cluj", notes: "Vreau urgent" };

test("leadEmailHtml with CRM data has name, phone, CRM link and formatted price", () => {
  const html = leadEmailHtml({
    contact,
    summary: "Dressing 2400x2400",
    sellPrice: 14250,
    crmUrl: "https://crm.example/projects/42",
    config,
  });
  assert.ok(html.includes("Ion Popescu"));
  assert.ok(html.includes("0722 123 456"));
  assert.ok(html.includes('href="https://crm.example/projects/42"'));
  assert.ok(html.includes("14.250 lei"));
  assert.ok(!html.includes("CRM indisponibil"));
});

test("leadEmailHtml without crmUrl flags CRM unavailable and embeds config JSON", () => {
  const html = leadEmailHtml({ contact, summary: "", sellPrice: null, crmUrl: null, config });
  assert.ok(html.includes("CRM indisponibil"));
  assert.ok(html.includes("&quot;carcassMaterialId&quot;: &quot;mat-1&quot;"));
});

test("leadEmailHtml escapes customer-provided strings", () => {
  const html = leadEmailHtml({
    contact: { ...contact, name: "<script>alert(1)</script>", notes: '"><img src=x>' },
    summary: "<b>x</b>",
    sellPrice: null,
    crmUrl: "https://crm.example/x\"onmouseover=\"y",
    config,
  });
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img"));
  assert.ok(!html.includes("<b>x</b>"));
  assert.ok(!html.includes('"onmouseover="'));
});
