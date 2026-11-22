/**
 * Pure parts of the configurator funnel tracking, shared by the browser (lib/atelier/funnel.ts)
 * and the server (app/api/atelier/event/route.ts): the event names, the payload shape and its
 * validation. No DOM, no Next imports — unit-tested in tests/atelier-funnel.test.ts.
 */
export const FUNNEL_EVENTS = [
  "view",
  "category_selected",
  "preset_selected",
  "combo_selected",
  "palette_selected",
  "material_changed",
  "step_viewed",
  "size_changed",
  "interior_changed",
  "price_shown",
  "form_started",
  "lead_submitted",
  "lead_failed",
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENTS)[number];
export type FunnelPropValue = string | number | boolean | null;
export type FunnelPropsMap = Record<string, FunnelPropValue>;
export type FunnelDevice = "mobile" | "desktop";

/** Campaign info only — never the Meta click / browser ids (fbc, fbp), which could single a person out. */
export type FunnelAttribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  fbclid: boolean;
  gclid: boolean;
  ttclid: boolean;
  referrer: string | null;
  landingPage: string | null;
};

/** What the browser posts to /api/atelier/event and the site forwards to the CRM (plus `country`). */
export type FunnelPayload = {
  sessionId: string;
  visitorId: string | null;
  event: FunnelEventName;
  props: FunnelPropsMap;
  path: string;
  /** document.referrer of the visit; sent with the first event of a page load only */
  referrer?: string;
  attribution: FunnelAttribution | null;
  device: FunnelDevice;
  ts: number;
};

export const MAX_PROPS = 20;
export const MAX_STRING = 200;
const MAX_KEY = 40;
const MAX_URL = 300;
/** Below this viewport width the configurator uses its phone layout. */
export const MOBILE_MAX_WIDTH = 768;
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

export function isFunnelEvent(value: unknown): value is FunnelEventName {
  return typeof value === "string" && (FUNNEL_EVENTS as readonly string[]).includes(value);
}

export function deviceForWidth(width: number): FunnelDevice {
  return width < MOBILE_MAX_WIDTH ? "mobile" : "desktop";
}

const clip = (value: unknown, max: number): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
};

/** Flat primitives only, at most MAX_PROPS keys, strings clipped to MAX_STRING. Anything else is dropped. */
export function sanitizeProps(raw: unknown): FunnelPropsMap {
  const out: FunnelPropsMap = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  let count = 0;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (count >= MAX_PROPS) break;
    if (!key || key.length > MAX_KEY) continue;
    if (typeof value === "string") out[key] = value.slice(0, MAX_STRING);
    else if (typeof value === "number") {
      if (!Number.isFinite(value)) continue;
      out[key] = value;
    } else if (typeof value === "boolean" || value === null) out[key] = value;
    else continue;
    count += 1;
  }
  return out;
}

export function sanitizeAttribution(raw: unknown): FunnelAttribution | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  return {
    utmSource: clip(a.utmSource, 100),
    utmMedium: clip(a.utmMedium, 100),
    utmCampaign: clip(a.utmCampaign, MAX_STRING),
    utmContent: clip(a.utmContent, MAX_STRING),
    utmTerm: clip(a.utmTerm, MAX_STRING),
    fbclid: a.fbclid === true,
    gclid: a.gclid === true,
    ttclid: a.ttclid === true,
    referrer: clip(a.referrer, MAX_URL),
    landingPage: clip(a.landingPage, MAX_URL),
  };
}

export function buildFunnelPayload(input: {
  sessionId: string;
  visitorId: string | null;
  event: FunnelEventName;
  props?: unknown;
  path: string;
  referrer?: string | null;
  attribution?: unknown;
  viewportWidth: number;
  now?: number;
}): FunnelPayload {
  const referrer = clip(input.referrer, MAX_URL);
  return {
    sessionId: input.sessionId,
    visitorId: input.visitorId,
    event: input.event,
    props: sanitizeProps(input.props),
    path: clip(input.path, MAX_URL) ?? "/",
    ...(referrer ? { referrer } : {}),
    attribution: sanitizeAttribution(input.attribution),
    device: deviceForWidth(input.viewportWidth),
    ts: input.now ?? Date.now(),
  };
}

/** Server-side validation of an untrusted body. Null = drop it silently. */
export function parseFunnelBody(raw: unknown, now = Date.now()): FunnelPayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const b = raw as Record<string, unknown>;
  if (!isFunnelEvent(b.event)) return null;
  if (typeof b.sessionId !== "string" || !ID_RE.test(b.sessionId)) return null;
  const visitorId = typeof b.visitorId === "string" && ID_RE.test(b.visitorId) ? b.visitorId : null;
  const path = clip(b.path, MAX_URL);
  const referrer = clip(b.referrer, MAX_URL);
  // a clock that is far off (or a missing ts) falls back to the server's time
  const ts = typeof b.ts === "number" && Number.isFinite(b.ts) && Math.abs(b.ts - now) < 24 * 60 * 60 * 1000 ? Math.round(b.ts) : now;
  return {
    sessionId: b.sessionId,
    visitorId,
    event: b.event,
    props: sanitizeProps(b.props),
    path: path && path.startsWith("/") ? path : "/",
    ...(referrer ? { referrer } : {}),
    attribution: sanitizeAttribution(b.attribution),
    device: b.device === "mobile" ? "mobile" : "desktop",
    ts,
  };
}

/** True when `referrer` points at the site itself (an internal navigation is not a traffic source). */
export function isSameHost(referrer: string | null | undefined, host: string | null | undefined): boolean {
  if (!referrer || !host) return false;
  try {
    return new URL(referrer).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Only the site's own pages may post events: the Origin must be ours, and a browser that says the
 * request is cross-site is refused. A request without Origin passes only if the browser marked it
 * same-origin, or outside production (curl while developing).
 */
export function isSameOriginRequest(
  h: { origin: string | null; secFetchSite: string | null; host: string | null },
  production: boolean,
): boolean {
  if (h.secFetchSite && h.secFetchSite !== "same-origin") return false;
  if (h.origin) return isSameHost(h.origin, h.host);
  return h.secFetchSite === "same-origin" || !production;
}

/** Per-key sliding-window limiter (in memory, per server instance). Old keys are swept at most once per window. */
export function createRateLimiter(max: number, windowMs: number, maxKeys = 5000) {
  const hits = new Map<string, number[]>();
  let lastSweep = 0;
  return function limited(key: string, now = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return true;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > maxKeys && now - lastSweep >= windowMs) {
      lastSweep = now;
      for (const [k, times] of hits) {
        if (times.every((t) => now - t >= windowMs)) hits.delete(k);
      }
    }
    return false;
  };
}
