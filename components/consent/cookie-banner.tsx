"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  onConsentSettingsOpen,
  setConsent,
  useConsent,
  type ConsentStatus,
} from "@/lib/consent";

// Small corner card, shown until the visitor accepts or refuses marketing
// cookies, and again whenever the footer "Setări cookies" link reopens it.
// Accept and Refuz carry equal weight on purpose: refusing must be as easy as
// accepting.
export function CookieBanner() {
  const consent = useConsent();
  const pathname = usePathname();
  const [reopened, setReopened] = useState(false);

  useEffect(() => onConsentSettingsOpen(() => setReopened(true)), []);

  if (consent === "pending") return null;
  if (consent !== null && !reopened) return null;

  const choose = (status: ConsentStatus) => {
    setConsent(status);
    setReopened(false);
  };

  // Clear the fixed bottom bars: the configurator's action bar (all sizes) and
  // the mobile bars on the homepage and contact page.
  const offset =
    pathname === "/configurator"
      ? "bottom-28"
      : pathname === "/" || pathname === "/contact"
        ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6"
        : "bottom-4 sm:bottom-6";

  return (
    <div
      role="dialog"
      aria-label="Preferințe cookies"
      className={`fixed inset-x-4 z-[1000] rounded-3xl border border-espresso/10 bg-cream p-5 text-espresso shadow-[var(--shadow-warm)] sm:inset-x-auto sm:left-6 sm:max-w-sm ${offset}`}
    >
      <p className="font-semibold">Acest site folosește cookies</p>
      <p className="mt-2 text-sm leading-6 text-espresso/70">
        Folosim cookies pentru a îmbunătăți experiența ta pe site și pentru a-ți
        afișa reclame relevante. Îți poți schimba alegerea oricând.{" "}
        <Link
          href="/politica-confidentialitate#cookies"
          className="underline underline-offset-2"
        >
          Politica de cookies
        </Link>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => choose("denied")}
          className="rounded-full border border-espresso/20 px-4 py-2.5 text-sm font-semibold text-espresso transition-colors hover:border-espresso"
        >
          Refuz
        </button>
        <button
          type="button"
          onClick={() => choose("granted")}
          className="rounded-full border border-espresso/20 px-4 py-2.5 text-sm font-semibold text-espresso transition-colors hover:border-espresso"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
