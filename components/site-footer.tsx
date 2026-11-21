"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
import { legalEntity } from "@/lib/business-data";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/icons/social-icons";
import { ANPC_SAL_URL } from "@/lib/legal";
import { contactDetails, navigation } from "@/lib/site-data";
import { socialLinks, type SocialKind } from "@/lib/social-links";

const socialIcons: Record<SocialKind, typeof InstagramIcon> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
};

export function SiteFooter() {
  const pathname = usePathname();
  // The quote wizard is a focused, full-screen flow — no footer, so the sticky
  // action bar has nothing to overlap.
  if (pathname === "/cere-oferta" || pathname === "/configurator") return null;

  // The warm footer is the site-wide footer. Pages with a fixed mobile action
  // bar (homepage warm-tabbar, contact action bar) reserve bottom padding for
  // it so the footer isn't hidden behind the bar on small screens.
  const hasMobileBar = pathname === "/" || pathname === "/contact";
  return <WarmFooter hasMobileBar={hasMobileBar} />;
}

function WarmFooter({ hasMobileBar }: { hasMobileBar: boolean }) {
  // Only the profiles listed in the structured data (business.sameAs).
  const socials = socialLinks();
  return (
    <footer className={`warm-footer${hasMobileBar ? " pb-24 lg:pb-0" : ""}`}>
      <div className="warm-footer__accent" />

      <div className="section-shell grid gap-10 py-14 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="display-font text-4xl text-espresso">Epic Mob</p>
          <p className="mt-4 max-w-md text-sm leading-7 text-espresso/75">
            Mobilier la comandă pentru interioare în care detaliul contează,
            cu consultanță, design și execuție asumată prin contract și factură.
          </p>
          {socials.length > 0 ? (
            <ul className="mt-6 flex gap-3" aria-label="Epic Mob pe rețele sociale">
              {socials.map(({ kind, label, href }) => {
                const Icon = socialIcons[kind];
                return (
                  <li key={kind}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="warm-footer__social"
                      aria-label={`Epic Mob pe ${label}`}
                    >
                      <Icon size={18} />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
        <div>
          <p className="warm-footer__eyebrow">Navigare</p>
          <div className="mt-4 space-y-1">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="warm-footer__link">
                {item.label}
              </Link>
            ))}
            <Link href="/intrebari-frecvente" className="warm-footer__link">
              Întrebări frecvente
            </Link>
          </div>
        </div>
        <div>
          <p className="warm-footer__eyebrow">Contact</p>
          <div className="mt-4 space-y-1">
            <a className="warm-footer__link" href={`tel:${contactDetails.phone}`}>
              {contactDetails.phone}
            </a>
            <a className="warm-footer__link" href={`mailto:${contactDetails.email}`}>
              {contactDetails.email}
            </a>
            <a
              className="warm-footer__link"
              href={contactDetails.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp direct
            </a>
          </div>
        </div>
      </div>

      <div className="section-shell warm-footer__divider flex flex-col items-center gap-3 py-6 text-center text-xs text-espresso/75 sm:flex-row sm:justify-between sm:text-left">
        <div className="space-y-1">
          <p>
            &copy; {new Date().getFullYear()} Epic Mob. Toate drepturile rezervate.
          </p>
          <p>
            {legalEntity.name} · CUI {legalEntity.cui} · Reg. Com.{" "}
            {legalEntity.tradeRegister}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-end">
          <Link href="/termeni-si-conditii" className="hover:text-espresso">
            Termeni și condiții
          </Link>
          <Link href="/politica-confidentialitate" className="hover:text-espresso">
            Politica de confidențialitate
          </Link>
          <CookieSettingsButton className="hover:text-espresso" />
          <a href={ANPC_SAL_URL} target="_blank" rel="noreferrer" className="hover:text-espresso">
            ANPC – SAL
          </a>
        </div>
      </div>
    </footer>
  );
}
