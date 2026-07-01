"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { contactDetails, navigation } from "@/lib/site-data";

export function SiteFooter() {
  const pathname = usePathname();
  // The quote wizard is a focused, full-screen flow — no footer, so the sticky
  // action bar has nothing to overlap.
  if (pathname === "/configurator") return null;

  // The warm footer is the site-wide footer. Pages with a fixed mobile action
  // bar (homepage warm-tabbar, contact action bar) reserve bottom padding for
  // it so the footer isn't hidden behind the bar on small screens.
  const hasMobileBar = pathname === "/" || pathname === "/contact";
  return <WarmFooter hasMobileBar={hasMobileBar} />;
}

function WarmFooter({ hasMobileBar }: { hasMobileBar: boolean }) {
  return (
    <footer className={`warm-footer${hasMobileBar ? " pb-24 lg:pb-0" : ""}`}>
      <div className="warm-footer__accent" />

      <div className="section-shell grid gap-10 py-14 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="display-font text-4xl text-espresso">Epic Mob</p>
          <p className="mt-4 max-w-md text-sm leading-7 text-espresso/60">
            Mobilier la comandă pentru interioare în care detaliul contează,
            cu consultanță, design și execuție asumată prin contract și factură.
          </p>
        </div>
        <div>
          <p className="warm-footer__eyebrow">Navigare</p>
          <div className="mt-4 space-y-3">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="block text-sm">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="warm-footer__eyebrow">Contact</p>
          <div className="mt-4 space-y-3 text-sm">
            <a className="block" href={`tel:${contactDetails.phone}`}>
              {contactDetails.phone}
            </a>
            <a className="block" href={`mailto:${contactDetails.email}`}>
              {contactDetails.email}
            </a>
            <a
              className="block"
              href={contactDetails.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp direct
            </a>
          </div>
        </div>
      </div>

      <div className="section-shell warm-footer__divider py-6">
        <p className="text-center text-xs text-espresso/45">
          &copy; {new Date().getFullYear()} Epic Mob. Toate drepturile rezervate.
        </p>
      </div>
    </footer>
  );
}
