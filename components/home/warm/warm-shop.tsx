import Link from "next/link";
import { ArrowRight } from "lucide-react";
import "@/components/shop/shop.css";
import { ProductCard } from "@/components/shop/product-card";
import { offerEndText } from "@/lib/shop/offers";
import { DELIVERY_TEXT } from "@/lib/shop/products";
import { getShopItems } from "@/lib/shop/server";

/** Home page: the shop, with the running offer first. Hidden when the shop has nothing to show. */
export async function WarmShop() {
  const { items } = await getShopItems();
  if (items.length === 0) return null;
  const offers = items.filter((i) => i.offer);
  const picks = [...offers, ...items.filter((i) => !i.offer && i.badge), ...items.filter((i) => !i.offer && !i.badge)].slice(0, 8);
  const top = offers[0]?.offer ?? null;
  const maxPct = Math.max(0, ...offers.map((o) => o.offer?.percent ?? 0));

  return (
    <section className="home-shop" aria-labelledby="home-shop-title">
      <div className="section-shell home-shop__inner">
        <div className="shop-section-head">
          <div>
            <p className="eyebrow-warm">Magazin</p>
            <h2 id="home-shop-title" className="display-font shop-section-head__title text-espresso">
              Dulapuri, comode și biblioteci gata gândite
            </h2>
            <p className="shop-section-head__note">
              Alegi modelul și culoarea, vezi prețul pe loc. {DELIVERY_TEXT}, cu montaj inclus.
            </p>
          </div>
          <Link href="/magazin" className="btn-warm btn-warm--ghost">
            Vezi tot magazinul <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {top && (
          <div className="home-shop__banner">
            <div>
              <p className="eyebrow-warm">{top.label}</p>
              <h3 className="display-font home-shop__banner-title">
                Până la −{maxPct}% la {offers.length} modele preferate
              </h3>
              <p>Reducere față de prețul obișnuit, la toate culorile, până pe {offerEndText(top)}.</p>
            </div>
            <Link href="/magazin?oferte=1#produse" className="btn-warm btn-warm--primary">
              Vezi ofertele <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}

        <ul className="shop-rail">
          {picks.map((item) => (
            <li key={item.slug}>
              <ProductCard item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
