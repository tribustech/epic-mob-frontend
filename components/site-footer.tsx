"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { contactDetails, navigation } from "@/lib/site-data";

export function SiteFooter() {
  const pathname = usePathname();
  // The quote wizard is a focused, full-screen flow — no footer, so the sticky
  // action bar has nothing to overlap.
  if (pathname === "/configurator") return null;
  // Warm footer on the homepage and the portfolio; other pages stay navy.
  const isWarm = pathname === "/" || pathname.startsWith("/portfolio");
  if (isWarm) {
    // The mobile action tabbar only exists on the homepage, so reserve the
    // bottom padding for it there and let the portfolio footer sit flush.
    return <WarmFooter hasTabbar={pathname === "/"} />;
  }
  return <NavyFooter />;
}

function WarmFooter({ hasTabbar }: { hasTabbar: boolean }) {
  return (
    <footer className={`warm-footer${hasTabbar ? " pb-24 lg:pb-0" : ""}`}>
      <div className="warm-footer__accent" />

      <div className="section-shell grid gap-10 py-14 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="display-font text-4xl text-espresso">Epic Mob</p>
          <p className="mt-4 max-w-md text-sm leading-7 text-espresso/60">
            Mobilier la comanda pentru interioare in care detaliul conteaza,
            cu consultanta, design si executie asumata prin contract si factura.
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

function NavyFooter() {
  return (
    <footer className="bg-navy">
      {/* Gold accent line */}
      <div className="h-0.5 bg-gold" />

      <div className="section-shell grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="display-font text-4xl text-white">Epic Mob</p>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/50">
            Mobilier la comanda pentru interioare in care detaliul conteaza,
            cu consultanta, design si executie asumata prin contract si factura.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            Navigare
          </p>
          <div className="mt-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm text-white/50 transition hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            Contact
          </p>
          <div className="mt-4 space-y-3 text-sm text-white/50">
            <a className="block transition hover:text-gold" href={`tel:${contactDetails.phone}`}>
              {contactDetails.phone}
            </a>
            <a className="block transition hover:text-gold" href={`mailto:${contactDetails.email}`}>
              {contactDetails.email}
            </a>
            <a
              className="block transition hover:text-gold"
              href={contactDetails.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp direct
            </a>
          </div>
        </div>
      </div>

      <div className="section-shell border-t border-white/8 py-6">
        <p className="text-center text-xs text-white/30">
          &copy; {new Date().getFullYear()} Epic Mob. Toate drepturile rezervate.
        </p>
      </div>
    </footer>
  );
}
