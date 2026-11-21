"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  onConsentSettingsOpen,
  setConsent,
  useConsent,
  type ConsentStatus,
} from "@/lib/consent";
import { bottomClearance, pinnedBottomBoxes } from "@/lib/fixed-bars";

// Shown until the visitor accepts or refuses marketing cookies, and again
// whenever the footer "Setări cookies" link reopens it. Phones get a compact
// bar (one short line + two buttons); larger screens a small corner card.
// Either way it sits just above any sticky bottom bar (tab bar, price bar,
// wizard buttons) instead of covering it. Accept and Refuz carry equal weight
// on purpose: refusing must be as easy as accepting. It comes right after the
// skip link in the page, so keyboard users reach it before the header.
export function CookieBanner() {
  const consent = useConsent();
  const pathname = usePathname();
  const [reopened, setReopened] = useState(false);
  const [clearance, setClearance] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => onConsentSettingsOpen(() => setReopened(true)), []);

  const visible = consent !== "pending" && (consent === null || reopened);

  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setClearance(bottomClearance(pinnedBottomBoxes(ref.current), window.innerHeight));
      });
    };
    measure();
    // bars appear on scroll (shop price bar) or after hydration (basket button)
    const late = window.setTimeout(measure, 600);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(late);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [visible, pathname]);

  if (!visible) return null;

  const choose = (status: ConsentStatus) => {
    setConsent(status);
    setReopened(false);
  };

  const button =
    "min-h-11 rounded-full border border-espresso/25 px-4 text-sm font-semibold text-espresso transition-colors hover:border-espresso";

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Preferințe cookies"
      style={{ bottom: `calc(${clearance}px + 0.5rem)` }}
      className="fixed inset-x-2 z-[1000] rounded-2xl border border-espresso/10 bg-cream px-4 py-3 text-espresso shadow-[var(--shadow-warm)] sm:inset-x-auto sm:left-6 sm:max-w-sm sm:rounded-3xl sm:p-5"
    >
      <p className="text-sm leading-5 sm:hidden">
        Folosim cookies pentru reclame relevante.{" "}
        <Link
          href="/politica-confidentialitate#cookies"
          className="underline underline-offset-2"
        >
          Detalii
        </Link>
      </p>
      <div className="hidden sm:block">
        <p className="font-semibold">Acest site folosește cookies</p>
        <p className="mt-2 text-sm leading-6 text-espresso/75">
          Folosim cookies pentru a îmbunătăți experiența ta pe site și pentru a-ți
          afișa reclame relevante. Îți poți schimba alegerea oricând.{" "}
          <Link
            href="/politica-confidentialitate#cookies"
            className="underline underline-offset-2"
          >
            Politica de cookies
          </Link>
        </p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
        <button type="button" onClick={() => choose("denied")} className={button}>
          Refuz
        </button>
        <button type="button" onClick={() => choose("granted")} className={button}>
          Accept
        </button>
      </div>
    </div>
  );
}
