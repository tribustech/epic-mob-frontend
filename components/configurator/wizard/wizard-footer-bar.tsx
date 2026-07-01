"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders the step's primary action as a bar pinned to the bottom of the
 * viewport. Portaled to document.body so no transformed/animated ancestor
 * (e.g. the Framer step wrapper) can re-anchor the fixed positioning.
 */
export function WizardFooterBar({ children }: { children: ReactNode }) {
  // SSR-safe mount guard: the portal target (document.body) only exists on the
  // client, so we render nothing until after hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-espresso/10 bg-cream/95 shadow-[0_-8px_24px_rgba(42,36,32,0.08)] backdrop-blur-sm">
      <div className="section-shell">
        <div className="mx-auto max-w-3xl py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
