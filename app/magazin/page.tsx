import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PencilRuler, ShieldCheck, Truck, Wrench } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { ShopBrowser } from "@/components/shop/shop-browser";
import { offerEndText } from "@/lib/shop/offers";
import { DELIVERY_TEXT, SHOP_CATEGORIES } from "@/lib/shop/products";
import { getShopItems } from "@/lib/shop/server";

// prices come from the CRM (cached 10 minutes); offers start and end on their own
export const revalidate = 600;

const TITLE = "Magazin — dulapuri, comode și biblioteci | EpicMob";
const DESCRIPTION =
  "Dulapuri, dressinguri, comode, biblioteci și corpuri suspendate gata gândite, în zeci de combinații de culori. Preț pe loc, montaj inclus, garanție 5 ani.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/magazin" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/magazin", type: "website" },
};

export default async function ShopPage() {
  const { items } = await getShopItems();
  const offers = items.filter((i) => i.offer);
  const offerEnd = offers[0]?.offer ? offerEndText(offers[0].offer) : null;

  return (
    <main className="home-warm shop-page">
      <section className="shop-hero">
        <div className="section-shell shop-hero__inner">
          <p className="eyebrow-warm">Magazin EpicMob</p>
          <h1 className="display-font shop-hero__title">Mobilier gata gândit, în culorile tale</h1>
          <p className="shop-hero__lede">
            Dulapuri, comode, biblioteci și corpuri suspendate în peste {items.reduce((n, i) => n + i.variants.length, 0) || 100} de
            combinații. Alegi modelul și culoarea, iar dacă vrei altă mărime sau alt interior îl schimbi în Atelierul 3D.
          </p>
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

      {offers.length > 0 && (
        <section className="shop-offers">
          <div className="section-shell">
            <div className="shop-section-head">
              <div>
                <p className="eyebrow-warm">{offers[0].offer?.label}</p>
                <h2 className="display-font shop-section-head__title">
                  −{Math.max(...offers.map((o) => o.offer?.percent ?? 0))}% la modelele preferate
                </h2>
                {offerEnd && <p className="shop-section-head__note">Până pe {offerEnd}, la toate culorile.</p>}
              </div>
              <Link href="/magazin?oferte=1#produse" className="btn-warm btn-warm--ghost">
                Toate ofertele <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <ul className="shop-rail">
              {offers.map((item, i) => (
                <li key={item.slug}>
                  <ProductCard item={item} priority={i < 2} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section-shell shop-cats">
        <ul className="shop-cats__list">
          {SHOP_CATEGORIES.map((c) => {
            const count = items.filter((i) => i.category === c.id).length;
            return (
              <li key={c.id}>
                <Link href={`/magazin?categorie=${c.id}#produse`} className="shop-cat">
                  <span className="shop-cat__label">{c.label}</span>
                  <span className="shop-cat__blurb">{c.blurb}</span>
                  <span className="shop-cat__count">
                    {count} {count === 1 ? "model" : "modele"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

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
              Schimbi lățimea, înălțimea, interiorul, ușile, mânerele și culorile în Atelierul 3D, cu prețul actualizat pe loc.
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
