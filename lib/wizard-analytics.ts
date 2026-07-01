// Two lanes for the quote wizard:
//   1. trackEvent  → Vercel Web Analytics (funnel counts: started / step / submitted)
//   2. sendRecord  → full answers snapshot, beaconed to /api/track → Google Sheet
//      (uses sendBeacon so it still fires when the tab closes mid-flow).
import { track } from "@vercel/analytics";

export type EventProps = Record<string, string | number | boolean | null>;

/** Funnel event → Vercel Web Analytics (aggregate counts only). */
export function trackEvent(event: string, props: EventProps = {}): void {
  try {
    track(event, props);
  } catch {
    /* analytics must never break the flow */
  }
}

/** Full answers snapshot → /api/track → Google Sheet (survives tab close). */
export function sendRecord(payload: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ ...payload, ts: Date.now() });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/track", blob)) return;
    }
  } catch {
    /* fall through to fetch */
  }

  void fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function newSessionId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `s_${Date.now()}_${Math.round(Math.random() * 1e9)}`;
}
