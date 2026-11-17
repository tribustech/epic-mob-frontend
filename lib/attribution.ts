// Where a visitor came from (ad click, UTM-tagged link, referrer), remembered
// in the browser so the finished request (configurator or contact form) can
// tell the CRM which campaign brought the lead. A visit with fresh campaign
// info (UTM or an ad click id) replaces the stored one; a plain visit keeps it
// for 30 days, so someone who clicks an ad today and comes back directly
// tomorrow is still credited to the ad.

const STORAGE_KEY = "epicmob_attribution";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type Attribution = {
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
  capturedAt: number;
};

const clip = (v: string | null, max = 200) => (v ? v.trim().slice(0, max) || null : null);

function externalReferrer(): string | null {
  const ref = document.referrer;
  if (!ref) return null;
  try {
    return new URL(ref).hostname === window.location.hostname ? null : clip(ref, 300);
  } catch {
    return null;
  }
}

function read(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Attribution;
    return Date.now() - value.capturedAt > MAX_AGE_MS ? null : value;
  } catch {
    return null;
  }
}

/** Call once per page load: stores campaign info from the landing URL. */
export function captureAttribution(): void {
  const params = new URLSearchParams(window.location.search);
  const current: Attribution = {
    utmSource: clip(params.get("utm_source"), 100),
    utmMedium: clip(params.get("utm_medium"), 100),
    utmCampaign: clip(params.get("utm_campaign")),
    utmContent: clip(params.get("utm_content")),
    utmTerm: clip(params.get("utm_term")),
    fbclid: params.has("fbclid"),
    gclid: params.has("gclid"),
    ttclid: params.has("ttclid"),
    referrer: externalReferrer(),
    landingPage: clip(window.location.pathname, 300),
    capturedAt: Date.now(),
  };
  const hasCampaign = Boolean(current.utmSource || current.utmCampaign || current.fbclid || current.gclid || current.ttclid);
  const stored = read();
  // Keep an earlier campaign visit over a plain one; otherwise remember this visit.
  if (!hasCampaign && stored) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* storage blocked: the lead just arrives without a source */
  }
}

/** What to send with a finished request. */
export function readAttribution(): Omit<Attribution, "capturedAt"> | null {
  const value = read();
  if (!value) return null;
  const { capturedAt: _ignored, ...rest } = value;
  void _ignored;
  return rest;
}
