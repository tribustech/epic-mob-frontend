import assert from "node:assert/strict";
import test from "node:test";
import {
  FUNNEL_EVENTS,
  buildFunnelPayload,
  createRateLimiter,
  deviceForWidth,
  isSameHost,
  isSameOriginRequest,
  parseFunnelBody,
  sanitizeAttribution,
  sanitizeProps,
} from "../lib/atelier/funnel-payload.ts";

const SID = "3f0e6c1e-8a51-4c0b-9a3f-1f2f6f0f9b11";

test("sanitizeProps keeps flat primitives, clips strings and caps the key count", () => {
  const props = sanitizeProps({ presetId: "dressing-3", price: 4200, ok: true, none: null, nested: { a: 1 }, list: [1], long: "x".repeat(500), nan: NaN });
  assert.deepEqual(Object.keys(props), ["presetId", "price", "ok", "none", "long"]);
  assert.equal((props.long as string).length, 200);
  const many = sanitizeProps(Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`k${i}`, i])));
  assert.equal(Object.keys(many).length, 20);
  assert.deepEqual(sanitizeProps("nope"), {});
  assert.deepEqual(sanitizeProps([1, 2]), {});
});

test("sanitizeAttribution drops the Meta ids and anything unknown", () => {
  const a = sanitizeAttribution({ utmSource: " facebook ", utmCampaign: "toamna", fbclid: true, fbc: "fb.1.123.abc", fbp: "fb.1.1.2", landingPage: "/configurator", extra: "x" });
  assert.deepEqual(a, {
    utmSource: "facebook", utmMedium: null, utmCampaign: "toamna", utmContent: null, utmTerm: null,
    fbclid: true, gclid: false, ttclid: false, referrer: null, landingPage: "/configurator",
  });
  assert.equal(sanitizeAttribution(null), null);
});

test("buildFunnelPayload shapes one event", () => {
  const p = buildFunnelPayload({
    sessionId: SID, visitorId: null, event: "preset_selected", props: { presetId: "p1", category: "DRESSING" },
    path: "/configurator", referrer: "https://www.google.com/", attribution: null, viewportWidth: 390, now: 1_700_000_000_000,
  });
  assert.deepEqual(p, {
    sessionId: SID, visitorId: null, event: "preset_selected", props: { presetId: "p1", category: "DRESSING" },
    path: "/configurator", referrer: "https://www.google.com/", attribution: null, device: "mobile", ts: 1_700_000_000_000,
  });
  const later = buildFunnelPayload({ sessionId: SID, visitorId: "v".repeat(12), event: "view", path: "/configurator", referrer: null, viewportWidth: 1440 });
  assert.equal("referrer" in later, false);
  assert.equal(later.device, "desktop");
});

test("deviceForWidth splits at the phone layout breakpoint", () => {
  assert.equal(deviceForWidth(767), "mobile");
  assert.equal(deviceForWidth(768), "desktop");
});

test("parseFunnelBody accepts every known event and rejects junk", () => {
  const now = 1_700_000_000_000;
  for (const event of FUNNEL_EVENTS) {
    assert.ok(parseFunnelBody({ sessionId: SID, event, ts: now }, now), event);
  }
  assert.equal(parseFunnelBody({ sessionId: SID, event: "hacked" }, now), null);
  assert.equal(parseFunnelBody({ sessionId: "short", event: "view" }, now), null);
  assert.equal(parseFunnelBody({ sessionId: "a b c d e f g h", event: "view" }, now), null);
  assert.equal(parseFunnelBody({ event: "view" }, now), null);
  assert.equal(parseFunnelBody(null, now), null);
  assert.equal(parseFunnelBody([], now), null);
});

test("parseFunnelBody normalises optional fields instead of failing", () => {
  const now = 1_700_000_000_000;
  const p = parseFunnelBody({
    sessionId: SID, visitorId: "<script>", event: "price_shown", props: { price: 5100, name: { first: "Ion" } },
    path: "https://evil.example/x", device: "tablet", ts: 5, attribution: "nope", referrer: 42, ip: "1.2.3.4",
  }, now);
  assert.deepEqual(p, {
    sessionId: SID, visitorId: null, event: "price_shown", props: { price: 5100 },
    path: "/", attribution: null, device: "desktop", ts: now,
  });
});

test("createRateLimiter limits per key inside the window", () => {
  const limited = createRateLimiter(2, 1000);
  assert.equal(limited("a", 0), false);
  assert.equal(limited("a", 10), false);
  assert.equal(limited("a", 20), true);
  assert.equal(limited("b", 20), false);
  assert.equal(limited("a", 1500), false);
});

test("createRateLimiter sweeps stale keys at most once per window", () => {
  const limited = createRateLimiter(1, 1000, 2);
  limited("a", 0); limited("b", 0); limited("c", 0); // over maxKeys, nothing stale yet; sweep stamped at 0
  assert.equal(limited("a", 500), true);
  assert.equal(limited("d", 2000), false); // everything older is stale and swept here
  assert.equal(limited("a", 2001), false);
});

test("isSameHost recognises the site's own pages", () => {
  assert.equal(isSameHost("https://epicmob.ro/dressinguri", "epicmob.ro"), true);
  assert.equal(isSameHost("https://www.google.com/", "epicmob.ro"), false);
  assert.equal(isSameHost("not a url", "epicmob.ro"), false);
  assert.equal(isSameHost(null, "epicmob.ro"), false);
});

test("isSameOriginRequest only lets the site's own pages through", () => {
  const host = "epicmob.ro";
  assert.equal(isSameOriginRequest({ origin: "https://epicmob.ro", secFetchSite: "same-origin", host }, true), true);
  assert.equal(isSameOriginRequest({ origin: "https://epicmob.ro", secFetchSite: null, host }, true), true);
  assert.equal(isSameOriginRequest({ origin: "https://evil.example", secFetchSite: null, host }, true), false);
  assert.equal(isSameOriginRequest({ origin: "https://epicmob.ro", secFetchSite: "cross-site", host }, true), false);
  assert.equal(isSameOriginRequest({ origin: null, secFetchSite: "same-origin", host }, true), true);
  assert.equal(isSameOriginRequest({ origin: null, secFetchSite: null, host }, true), false);
  assert.equal(isSameOriginRequest({ origin: null, secFetchSite: null, host }, false), true);
  assert.equal(isSameOriginRequest({ origin: "https://evil.example", secFetchSite: null, host }, false), false);
});
