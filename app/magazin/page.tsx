import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PencilRuler, ShieldCheck, Truck, Wrench } from "lucide-react";
import { withAllPrices } from "@/components/shop/all-prices";
import { LandingLinks } from "@/components/shop/landing-view";
import { ProductCard } from "@/components/shop/product-card";
import { ShopRail } from "@/components/shop/rail";
import { ShopBrowser, ShopFilterLink } from "@/components/shop/shop-browser";
import { offerEndText } from "@/lib/shop/offers";
import { DELIVERY_TEXT } from "@/lib/shop/products";
import { getShopItems } from "@/lib/shop/server";
import { baseOpenGraph } from "@/lib/seo";

// prices come from the CRM (cached 10 minutes); offers start and end on their own
export const revalidate = 600;

const TITLE = "Magazin — dulapuri, bucătării, comode și mobilier de baie | Epic Mob";
const DESCRIPTION =
  "Dulapuri, dressinguri, bucătării, mobilier de baie, comode, biblioteci și corpuri suspendate gata gândite, în zeci de combinații de culori. Preț pe loc, montaj inclus, garanție 5 ani.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/magazin" },
  openGraph: { ...baseOpenGraph, title: TITLE, description: DESCRIPTION, url: "/magazin" },
};

export default async function ShopPage() {
  const items = await withAllPrices((await getShopItems()).items);
  const offers = items.filter((i) => i.offer);
  const offerEnd = offers[0]?.offer ? offerEndText(offers[0].offer) : null;

  const count = items.reduce((n, i) => n + i.variants.length, 0);

  return (
    <main className="home-warm shop-page">
      <section className="shop-hero">
        <div className="section-shell shop-hero__inner">
          <div className="shop-hero__text">
            <p className="eyebrow-warm">Magazin Epic Mob</p>
            <h1 className="display-font shop-hero__title">Mobilier gata gândit, în culorile tale</h1>
            <p className="shop-hero__lede">
              {items.length > 0 ? `${items.length} modele` : "Dulapuri, comode și biblioteci"} în peste {count > 10 ? Math.floor(count / 10) * 10 : 100} de combinații de
              culori. Alegi modelul și culoarea și vezi prețul pe loc.
            </p>
          </div>
          <ul className="shop-usp">
            <li>
              <Truck size={18} aria-hidden="true" /> {DELIVERY_TEXT}
            </li>
            <li>
              <Wrench size={18} aria-hidden="true" /> Montaj inclus
            </li>
            <li>
              <ShieldCheck size={18} aria-hidden="true" /> Garanție 5 ani
            </li>
            <li>
              <PencilRuler size={18} aria-hidden="true" /> Orice produs se poate personaliza
            </li>
          </ul>
        </div>
      </section>

      <LandingLinks />

      {offers.length > 0 && (
        <section className="shop-offers" aria-labelledby="shop-offers-title">
          <div className="section-shell">
            <div className="shop-section-head">
              <div>
                <p className="eyebrow-warm">{offers[0].offer?.label}</p>
                <h2 id="shop-offers-title" className="display-font shop-section-head__title">
                  −{Math.max(...offers.map((o) => o.offer?.percent ?? 0))}% la modelele preferate
                </h2>
                {offerEnd && <p className="shop-section-head__note">Până pe {offerEnd}, la toate culorile.</p>}
              </div>
              <ShopFilterLink filter={{ oferte: true }} className="btn-warm btn-warm--ghost shop-section-head__more">
                Toate ofertele <ArrowRight size={16} aria-hidden="true" />
              </ShopFilterLink>
            </div>
            <ShopRail label="Produse la ofertă">
              {offers.map((item, i) => (
                <li key={item.slug}>
                  <ProductCard item={item} priority={i < 2} />
                </li>
              ))}
            </ShopRail>
          </div>
        </section>
      )}

      <section className="section-shell shop-all">
        {items.length > 0 ? (
          <ShopBrowser items={items} />
        ) : (
          <div className="shop-empty">
            <h2 className="display-font text-3xl text-espresso">Magazinul se actualizează</h2>
            <p className="mt-3">Revino în câteva minute sau spune-ne ce ai în minte și îți pregătim o ofertă.</p>
            <Link href="/cere-oferta" className="btn-warm btn-warm--primary mt-6">
              Cere ofertă <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      <section className="shop-custom">
        <div className="section-shell shop-custom__inner">
          <div>
            <p className="eyebrow-warm">Nu e exact ce cauți?</p>
            <h2 className="display-font shop-section-head__title">Pornește de la orice produs și fă-l al tău</h2>
            <p className="shop-section-head__note">
              Schimbi lățimea, înălțimea, interiorul, ușile, mânerele și culorile în Atelierul 3D. Prețul se schimbă pe loc.
            </p>
            <p className="shop-section-head__note">
              Corpurile sunt din PAL melaminat de 18 mm, cu balamale și glisiere Blum cu închidere lină.{" "}
              <Link href="/materiale" className="shop-matlink">
                Află mai multe despre materialele și feroneria noastră
              </Link>
              .
            </p>
          </div>
          <Link href="/configurator" className="btn-warm btn-warm--primary">
            Deschide Atelierul 3D <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
