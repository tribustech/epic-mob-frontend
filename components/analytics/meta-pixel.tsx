"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useConsent } from "@/lib/consent";
import { META_PIXEL_ID, trackPixel } from "@/lib/meta-pixel";

// Loads Meta Pixel only after the visitor accepts marketing cookies, tracks a
// PageView on every client-side route change (the App Router never reloads the
// page) and a Contact event on phone / email / WhatsApp link clicks.
export function MetaPixel() {
  const consent = useConsent();
  const pathname = usePathname();
  const enabled = consent === "granted" && META_PIXEL_ID !== "";
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (enabled) {
      const alreadyLoaded = Boolean(window.fbq);
      if (alreadyLoaded) {
        // Consent was revoked earlier in this visit and is now given again.
        window.fbq?.("consent", "grant");
      } else {
        loadPixel();
        window.fbq?.("init", META_PIXEL_ID);
      }
      return;
    }
    if (consent === "denied" && window.fbq) {
      window.fbq("consent", "revoke");
      clearMetaCookies();
      lastTrackedPath.current = null;
    }
  }, [enabled, consent]);

  useEffect(() => {
    if (!enabled || lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;
    trackPixel("PageView");
  }, [enabled, pathname]);

  useEffect(() => {
    if (!enabled) return;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href") ?? "";
      const method = href.startsWith("tel:")
        ? "telefon"
        : href.startsWith("mailto:")
          ? "email"
          : href.includes("wa.me")
            ? "whatsapp"
            : null;
      if (method) trackPixel("Contact", { method });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [enabled]);

  return null;
}

// Meta's standard base snippet: a queueing fbq stub plus the async library.
function loadPixel() {
  type Queue = ((...args: unknown[]) => void) & {
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[];
    push: unknown;
    loaded: boolean;
    version: string;
  };
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Queue;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq as unknown as Window["fbq"];
  window._fbq = window.fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

// Drop the first-party Meta cookies when consent is withdrawn.
function clearMetaCookies() {
  const host = window.location.hostname;
  const domains = ["", host, `.${host.replace(/^www\./, "")}`];
  for (const name of ["_fbp", "_fbc"]) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}
