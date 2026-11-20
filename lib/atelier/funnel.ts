/**
 * Funnel tracking for the Atelier 3D configurator. One call per meaningful step; the
 * implementation fans out to the CRM (via /api/atelier/event), Vercel Analytics and the
 * Meta pixel. Must never throw and never block the UI.
 *
 * Privacy: events are first-party and anonymous (no name, phone, IP or cookie). The visit id
 * lives in sessionStorage and dies with the tab. The returning-visitor id (localStorage) is
 * only created after the visitor accepted the cookie banner; the Meta pixel only exists after
 * consent as well (window.fbq is undefined otherwise).
 */
import { readAttribution } from "@/lib/attribution";
import { getConsent } from "@/lib/consent";
import { trackEvent } from "@/lib/wizard-analytics";
import { buildFunnelPayload, isSameHost, type FunnelEventName, type FunnelPropsMap } from "./funnel-payload";

export type FunnelEvent =
  | "view"               // configurator shown
  | "category_selected"  // props: { category }
  | "preset_selected"    // props: { presetId, category }
  | "combo_selected"     // props: { comboId }
  | "palette_selected"   // props: { paletteId }
  | "material_changed"   // props: { part: "corp" | "fronturi" }
  | "step_viewed"        // props: { step }
  | "size_changed"       // first change per session only
  | "interior_changed"   // first change per session only (columns / doors / handles)
  | "price_shown"        // first valid price per session; props: { price }
  | "form_started"       // first focus in the request form
  | "lead_submitted"     // props: { price }
  | "lead_failed";

export type FunnelProps = Record<string, string | number | boolean | null>;

const ENDPOINT = "/api/atelier/event";
const SESSION_KEY = "epicmob_atelier_sid";
const VISITOR_KEY = "epicmob_atelier_vid";

/** Meta gets only the few steps worth building audiences on; "Lead" is NOT sent from here. */
const PIXEL_EVENTS: Partial<Record<FunnelEvent, string>> = {
  preset_selected: "AtelierPreset",
  combo_selected: "AtelierPreset",
  price_shown: "AtelierPrice",
};

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `s_${Date.now()}_${Math.round(Math.random() * 1e9)}`;
}

let memorySessionId: string | null = null;

/**
 * The id of this visit to the configurator (per tab). Send it as `sessionId` with the lead
 * request so the CRM can link the request to the steps that led to it.
 */
export function getFunnelSessionId(): string {
  if (memorySessionId) return memorySessionId;
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (stored) return (memorySessionId = stored);
  } catch {
    /* storage blocked or not in a browser: keep the id in memory */
  }
  memorySessionId = randomId();
  try {
    window.sessionStorage.setItem(SESSION_KEY, memorySessionId);
  } catch {
    /* ignore */
  }
  return memorySessionId;
}

/** Anonymous returning-visitor id — only with consent; removed again if consent is withdrawn. */
function visitorId(): string | null {
  try {
    if (getConsent() !== "granted") {
      window.localStorage.removeItem(VISITOR_KEY);
      return null;
    }
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = randomId();
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Fire on every swatch tap / step change: kept in the CRM only, not worth a Vercel Analytics event each. */
const NOT_MIRRORED: ReadonlySet<FunnelEvent> = new Set<FunnelEvent>(["material_changed", "step_viewed"]);

let referrerSent = false;

function send(body: string): void {
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }
  } catch {
    /* fall through to fetch */
  }
  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function trackFunnel(event: FunnelEvent, props: FunnelProps = {}): void {
  if (typeof window === "undefined") return;
  let flat: FunnelPropsMap = {};
  try {
    const payload = buildFunnelPayload({
      sessionId: getFunnelSessionId(),
      visitorId: visitorId(),
      event: event as FunnelEventName,
      props,
      path: window.location.pathname,
      referrer: referrerSent || isSameHost(document.referrer, window.location.host) ? null : document.referrer,
      attribution: readAttribution(),
      viewportWidth: window.innerWidth,
    });
    referrerSent = true;
    flat = payload.props;
    send(JSON.stringify(payload));
  } catch {
    /* tracking must never break the configurator */
  }

  if (!NOT_MIRRORED.has(event)) trackEvent(`atelier_${event}`, flat);

  try {
    const pixelEvent = PIXEL_EVENTS[event];
    if (pixelEvent && typeof window.fbq === "function") {
      const params: Record<string, string | number | boolean> = {};
      for (const [key, value] of Object.entries(flat)) if (value !== null) params[key] = value;
      window.fbq("trackCustom", pixelEvent, params);
    }
  } catch {
    /* ignore */
  }
}

const fired = new Set<FunnelEvent>();

/** Fires at most once per page session for the given key (e.g. „size_changed"). */
export function trackFunnelOnce(event: FunnelEvent, props: FunnelProps = {}): void {
  if (fired.has(event)) return;
  fired.add(event);
  trackFunnel(event, props);
}
