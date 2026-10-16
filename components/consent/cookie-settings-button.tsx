"use client";

import { openConsentSettings } from "@/lib/consent";

// Reopens the cookie banner so the visitor can change their choice at any
// time (a GDPR requirement: withdrawing consent must be as easy as giving it).
export function CookieSettingsButton({
  className,
  children = "Setări cookies",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      {children}
    </button>
  );
}
