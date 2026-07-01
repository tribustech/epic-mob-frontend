"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  contactDetails,
  headerCta,
  menuSecondaryLinks,
  navigation,
} from "@/lib/site-data";

const menuEase = [0.22, 1, 0.36, 1] as const;

function BrandWordmark() {
  return (
    <span className="site-brand">
      <span className="site-brand__name">
        Epic<span>Mob</span>
      </span>
      <span className="site-brand__tag">Mobilă la comandă</span>
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  // Warm palette applies to the homepage, the portfolio (list + case study),
  // and the contact page.
  const isWarm =
    pathname === "/" ||
    pathname.startsWith("/portfolio") ||
    pathname === "/contact";
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen((open) => !open);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const triggerElement = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [menuOpen]);

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.65, ease: menuEase };

  const itemTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: menuEase };

  return (
    <>
      <header className={`site-header ${isWarm ? "site-header--warm" : ""}`}>
        <Link href="/" className="site-header__logo" aria-label="EpicMob acasă">
          {isWarm ? (
            <BrandWordmark />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/portfolio/epicmob-logo-transparent.png"
              alt="EpicMob"
              className="site-header__logo-image"
            />
          )}
        </Link>

        <div className="site-header__right">
          <nav className="site-header__nav" aria-label="Navigație principală">
            {navigation.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`site-header__link ${
                    active ? "site-header__link--active" : ""
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link href={headerCta.href} className="site-header__cta">
            {headerCta.label}
          </Link>

          <button
            ref={triggerRef}
            type="button"
            className="site-header__menu-button"
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? "Închide meniul" : "Deschide meniul"}
          >
            <span>{menuOpen ? "CLOSE" : "MENU"}</span>
            <span className="site-header__menu-lines" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            id="site-menu"
            className={`site-menu ${isWarm ? "site-menu--warm" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Meniu principal"
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={transition}
          >
            <div className="site-menu__top">
              <Link
                href="/"
                className="site-menu__logo"
                aria-label="EpicMob acasă"
                onClick={closeMenu}
              >
                {isWarm ? (
                  <BrandWordmark />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/portfolio/epicmob-logo-transparent.png"
                    alt="EpicMob"
                    className="site-menu__logo-image"
                  />
                )}
              </Link>

              <button
                ref={closeRef}
                type="button"
                className="site-menu__close"
                onClick={closeMenu}
                aria-label="Închide meniul"
              >
                CLOSE
              </button>
            </div>

            <div className="site-menu__content">
              <motion.nav
                className="site-menu__primary"
                aria-label="Navigație meniu"
                initial="hidden"
                animate="show"
                exit="hidden"
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: reduceMotion ? 0 : 0.08,
                      delayChildren: reduceMotion ? 0 : 0.16,
                    },
                  },
                }}
              >
                {navigation.map((item, index) => {
                  const active = pathname === item.href;

                  return (
                    <motion.div
                      key={item.href}
                      variants={{
                        hidden: { opacity: 0, y: reduceMotion ? 0 : 32 },
                        show: { opacity: 1, y: 0 },
                      }}
                      transition={itemTransition}
                    >
                      <Link
                        href={item.href}
                        className={`site-menu__primary-link ${
                          active ? "site-menu__primary-link--active" : ""
                        }`}
                        aria-current={active ? "page" : undefined}
                        onClick={closeMenu}
                      >
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}

                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: reduceMotion ? 0 : 32 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={itemTransition}
                >
                  <Link
                    href={headerCta.href}
                    className="site-menu__primary-link site-menu__primary-link--cta"
                    onClick={closeMenu}
                  >
                    <span>05</span>
                    {headerCta.label}
                  </Link>
                </motion.div>
              </motion.nav>

              <motion.div
                className="site-menu__lower"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.5, delay: 0.38, ease: menuEase }
                }
              >
                <div className="site-menu__panel">
                  <p className="site-menu__eyebrow">Contact</p>
                  <a href={`tel:${contactDetails.phone}`}>
                    {contactDetails.phone}
                  </a>
                  <a href={`mailto:${contactDetails.email}`}>
                    {contactDetails.email}
                  </a>
                </div>

                <div className="site-menu__panel">
                  <p className="site-menu__eyebrow">Acțiuni rapide</p>
                  <div className="site-menu__secondary-links">
                    {menuSecondaryLinks.map((item) => (
                      <Link key={item.href} href={item.href} onClick={closeMenu}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="site-menu__panel site-menu__panel--note">
                  <p className="site-menu__eyebrow">EpicMob Atelier</p>
                  <p>
                    Mobilier premium la comandă, consultanță și execuție
                    cap-coadă pentru proiecte rezidențiale.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
