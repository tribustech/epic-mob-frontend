// Cookie consent for marketing tracking (Meta Pixel). Vercel Analytics is
// cookieless and doesn't need consent, so it stays outside this gate.
//
// The choice lives in localStorage and expires after CONSENT_MAX_AGE_MS, after
// which the banner asks again. Anything that sets marketing cookies must read
// getConsent() / useConsent() and only run when the status is "granted".

import { useSyncExternalStore } from "react";

export type ConsentStatus = "granted" | "denied";

const STORAGE_KEY = "epicmob-consent";
const CHANGE_EVENT = "epicmob:consent-change";
const OPEN_EVENT = "epicmob:consent-open";
// ~6 months, as stated in the privacy policy.
export const CONSENT_MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000;

type StoredConsent = { status: ConsentStatus; at: number };

function readConsent(): ConsentStatus | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredConsent;
    if (stored.status !== "granted" && stored.status !== "denied") return null;
    if (Date.now() - stored.at > CONSENT_MAX_AGE_MS) return null;
    return stored.status;
  } catch {
    return null;
  }
}

export function getConsent(): ConsentStatus | null {
  if (typeof window === "undefined") return null;
  return readConsent();
}

export function setConsent(status: ConsentStatus): void {
  try {
    const stored: StoredConsent = { status, at: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage blocked (private mode etc.) — the choice still applies to this
    // page view through the event below.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: status }));
}

/** Re-opens the banner so the visitor can change their choice (footer link). */
export function openConsentSettings(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onConsentSettingsOpen(callback: () => void): () => void {
  window.addEventListener(OPEN_EVENT, callback);
  return () => window.removeEventListener(OPEN_EVENT, callback);
}

// In-memory fallback so a choice made with storage blocked still sticks for
// the rest of the visit.
let sessionChoice: ConsentStatus | null = null;

function subscribe(callback: () => void): () => void {
  const onChange = (event: Event) => {
    sessionChoice = (event as CustomEvent<ConsentStatus>).detail;
    callback();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => readConsent() ?? sessionChoice;
// "pending" on the server keeps the banner out of the SSR markup; it shows
// after hydration only for visitors who haven't chosen.
const getServerSnapshot = () => "pending" as const;

/**
 * Current consent: "granted" | "denied" | null (not chosen yet), or "pending"
 * during SSR/hydration when the stored choice can't be known.
 */
export function useConsent(): ConsentStatus | null | "pending" {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
