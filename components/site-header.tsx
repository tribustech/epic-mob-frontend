"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { HeaderCart } from "@/components/shop/header-cart";
import { trapTabKey } from "@/lib/focus-trap";
import {
  contactDetails,
  headerCta,
  menuSecondaryLinks,
  navigation,
} from "@/lib/site-data";

// How long the menu's closing animation runs (matches .site-menu--closing).
const MENU_CLOSE_MS = 320;

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

// The header ships on every page, so it stays light: the menu animates with
// CSS (globals.css, "Site header and menu") instead of an animation library.
export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // true while the menu plays its closing animation (still on screen)
  const [closing, setClosing] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setMenuOpen(false);
    setClosing(true);
  };
  const toggleMenu = () => {
    if (menuOpen) closeMenu();
    else {
      setClosing(false);
      setMenuOpen(true);
    }
  };

  useEffect(() => {
    if (!closing) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setClosing(false), reduce ? 0 : MENU_CLOSE_MS);
    return () => clearTimeout(id);
  }, [closing]);

  // Modal menu: focus moves in, Tab stays inside, Escape closes, and focus
  // returns to the MENIU button when it closes.
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
        event.preventDefault();
        setMenuOpen(false);
        setClosing(true);
        return;
      }
      if (menuRef.current) trapTabKey(menuRef.current, event);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [menuOpen]);

  const menuVisible = menuOpen || closing;

  return (
    <>
      {/* One warm header on every page, the 404 and /cere-oferta included. */}
      <header className="site-header site-header--warm">
        <Link href="/" className="site-header__logo" aria-label="Epic Mob, pagina principală">
          <BrandWordmark />
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

          {/* the basket, on phones and desktop, once something is in it */}
          <HeaderCart />

          <button
            ref={triggerRef}
            type="button"
            className="site-header__menu-button"
            onClick={toggleMenu}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? "Închide meniul" : "Deschide meniul"}
          >
            <span>{menuOpen ? "ÎNCHIDE" : "MENIU"}</span>
            <span className="site-header__menu-lines" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      {menuVisible ? (
        <div
          ref={menuRef}
          id="site-menu"
          className={`site-menu site-menu--warm${closing ? " site-menu--closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Meniu principal"
        >
          <div className="site-menu__top">
            <Link
              href="/"
              className="site-menu__logo"
              aria-label="Epic Mob, pagina principală"
              onClick={closeMenu}
            >
              <BrandWordmark />
            </Link>

            <button
              ref={closeRef}
              type="button"
              className="site-menu__close"
              onClick={closeMenu}
              aria-label="Închide meniul"
            >
              ÎNCHIDE
            </button>
          </div>

          <div className="site-menu__content">
            <nav className="site-menu__primary" aria-label="Navigație meniu">
              {navigation.map((item, index) => {
                const active = pathname === item.href;

                return (
                  <div
                    key={item.href}
                    className="site-menu__item"
                    style={{ "--i": index } as CSSProperties}
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
                  </div>
                );
              })}

              <div
                className="site-menu__item"
                style={{ "--i": navigation.length } as CSSProperties}
              >
                <Link
                  href={headerCta.href}
                  className="site-menu__primary-link site-menu__primary-link--cta"
                  onClick={closeMenu}
                >
                  {/* numbered after the pages above, so no number repeats */}
                  <span>{String(navigation.length + 1).padStart(2, "0")}</span>
                  {headerCta.label}
                </Link>
              </div>
            </nav>

            <div className="site-menu__lower">
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
                <p className="site-menu__eyebrow">Epic Mob Atelier</p>
                <p>
                  Mobilier premium la comandă, consultanță și execuție
                  cap-coadă pentru proiecte rezidențiale.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
