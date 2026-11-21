import assert from "node:assert/strict";
import test from "node:test";
import { offerPrice } from "../lib/shop/offers.ts";
import { mergePrices, type CartLine } from "../lib/shop/cart.ts";
import { checkContact } from "../lib/shop/contact-check.ts";
import { foldText } from "../lib/admin/breakdown.ts";
import { badItems, crmIssues, fetchBreakdowns } from "../lib/admin/server.ts";

test("offer price: rounded once to whole lei, then integer percent math", () => {
  assert.equal(offerPrice(90, { percent: 30 }), 63);
  assert.equal(offerPrice(170, { percent: 30 }), 119);
  // the crossed-out price shows 1010, so 10% off is 909 (not floor(1009.6 × 0.9) = 908)
  assert.equal(offerPrice(1009.6, { percent: 10 }), 909);
  assert.equal(offerPrice(3939, { percent: 10 }), 3545);
  assert.equal(offerPrice(3008.2974, null), 3008);
  // line total = unit × qty with whole numbers
  const unit = offerPrice(3008.2974, null);
  assert.equal(unit * 2, 6016);
});

const line = (over: Partial<CartLine> = {}): CartLine => ({
  slug: "dressing-clasic-240",
  paletteId: "gri-casmir",
  qty: 2,
  name: "Dressing clasic 2,4 m",
  colour: "Gri cașmir",
  price: 3545,
  regularPrice: 3939,
  offerPercent: 10,
  offerLabel: "Ofertă de iarnă",
  ...over,
});
const fresh = (over = {}) => ({
  slug: "dressing-clasic-240",
  paletteId: "gri-casmir",
  available: true,
  price: 3939,
  finalPrice: 3545,
  offerPercent: 10,
  offerLabel: "Ofertă de iarnă",
  ...over,
});

test("cart refresh: same prices change nothing", () => {
  const lines = [line()];
  const r = mergePrices(lines, [fresh()]);
  assert.equal(r.lines, lines);
  assert.deepEqual(r.changed, []);
});

test("cart refresh: an ended offer updates the line and is reported", () => {
  const r = mergePrices([line()], [fresh({ finalPrice: 3939, offerPercent: 0, offerLabel: null })]);
  assert.equal(r.lines[0].price, 3939);
  assert.equal(r.lines[0].regularPrice, null);
  assert.equal(r.lines[0].offerPercent, 0);
  assert.equal(r.lines[0].qty, 2);
  assert.deepEqual(
    r.changed.map((c) => [c.before, c.after]),
    [[3545, 3939]],
  );
});

test("cart refresh: an old line without offer fields gets them, without a price-change warning", () => {
  const r = mergePrices([line({ regularPrice: null, offerPercent: 0, offerLabel: null })], [fresh()]);
  assert.equal(r.lines[0].regularPrice, 3939);
  assert.equal(r.lines[0].offerLabel, "Ofertă de iarnă");
  assert.deepEqual(r.changed, []);
});

test("cart refresh: no server price (CRM down) or an unavailable line keeps what the client saw", () => {
  const lines = [line()];
  assert.equal(mergePrices(lines, [fresh({ price: null, finalPrice: null })]).lines, lines);
  assert.equal(mergePrices(lines, [fresh({ available: false, price: null, finalPrice: null })]).lines, lines);
});

test("order contact check: same rules in the form and the route", () => {
  assert.deepEqual(checkContact({ name: "Ana Pop", phone: "0722 123 456", city: "Cluj" }), {});
  const bad = checkContact({ name: "A", phone: "123456", city: "C" });
  assert.deepEqual(Object.keys(bad).sort(), ["city", "name", "phone"]);
  assert.match(bad.phone!, /prea scurt/);
  assert.match(checkContact({ name: "Ana", phone: "", city: "Iași" }).phone!, /Scrie numărul/);
});

test("admin search ignores diacritics", () => {
  assert.ok(foldText("Ușă parțială · Bucătărie").includes(foldText("partiala")));
  assert.ok(foldText("Gri cașmir").includes(foldText("CASMIR")));
});

test("CRM batch errors: positions and readable messages", () => {
  const body = { error: "Invalid body", issues: [{ path: "2.config.columns", message: "Required" }, { path: "", message: "Invalid input" }] };
  assert.deepEqual(badItems(body), [2]);
  assert.deepEqual(crmIssues(body, 2), ["CRM-ul a respins configurația:", "config.columns: Required", "Invalid input"]);
  assert.deepEqual(crmIssues(body, 0), ["CRM-ul a respins configurația:", "Invalid input"]);
  assert.deepEqual(crmIssues(null), ["CRM-ul a respins configurația."]);
});

test("admin breakdowns: one line the CRM rejects does not fail the others", async () => {
  const saved = { fetch: globalThis.fetch, url: process.env.CRM_API_URL, key: process.env.ATELIER_API_KEY };
  process.env.CRM_API_URL = "http://crm.test";
  process.env.ATELIER_API_KEY = "k";
  let calls = 0;
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    calls++;
    const items = JSON.parse(String(init.body)) as { key: string; config: { bad?: boolean } }[];
    // like the CRM today: a z.union over the batch → one issue without a position
    if (items.some((i) => i.config.bad)) return new Response(JSON.stringify({ error: "Invalid body", issues: [{ path: "", message: "Invalid input" }] }), { status: 400 });
    return new Response(JSON.stringify({ items: items.map((i) => ({ key: i.key, ok: true, sellPrice: 100, totals: null, problems: [] })) }), { status: 200 });
  }) as typeof fetch;
  try {
    const lines = Array.from({ length: 7 }, (_, i) => ({ key: `k${i}`, config: (i === 4 ? { bad: true } : {}) as never }));
    const out = await fetchBreakdowns(lines, "token", null);
    assert.deepEqual(
      out.map((b) => b.ok),
      [true, true, true, true, false, true, true],
    );
    assert.equal(out[4].key, "k4");
    assert.ok(calls < 10, `too many CRM calls: ${calls}`);

    // auth errors still fail the whole call (the route tells the admin to log in again)
    globalThis.fetch = (async () => new Response("{}", { status: 401 })) as typeof fetch;
    await assert.rejects(fetchBreakdowns([{ key: "a", config: {} as never }], "token", null), /CRM responded 401/);
  } finally {
    globalThis.fetch = saved.fetch;
    if (saved.url == null) delete process.env.CRM_API_URL;
    else process.env.CRM_API_URL = saved.url;
    if (saved.key == null) delete process.env.ATELIER_API_KEY;
    else process.env.ATELIER_API_KEY = saved.key;
  }
});
