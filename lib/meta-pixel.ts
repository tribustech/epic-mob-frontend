// Meta Pixel helpers. The pixel itself is loaded by components/analytics/
// meta-pixel.tsx, and only after the visitor accepts marketing cookies — until
// then window.fbq doesn't exist and every call here is a silent no-op.

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

type FbqParams = Record<string, string | number | boolean>;

type Fbq = {
  (command: "init", pixelId: string): void;
  (command: "track", event: string, params?: FbqParams, options?: { eventID?: string }): void;
  (command: "trackCustom", event: string, params?: FbqParams, options?: { eventID?: string }): void;
  (command: "consent", action: "grant" | "revoke"): void;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/**
 * Sends a standard Meta event. Returns the event id, which a future
 * Conversions API call can reuse so Meta de-duplicates browser + server hits.
 */
export function trackPixel(event: string, params?: FbqParams): string {
  const eventID = crypto.randomUUID();
  window.fbq?.("track", event, params, { eventID });
  return eventID;
}
