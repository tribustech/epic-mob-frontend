import Link from "next/link";
import { ArrowRight } from "lucide-react";
import "@/components/shop/shop.css";
import { withAllPrices } from "@/components/shop/all-prices";
import { ProductCard } from "@/components/shop/product-card";
import { ShopRail } from "@/components/shop/rail";
import { offerEndText } from "@/lib/shop/offers";
import { DELIVERY_TEXT, ROOM_LABELS, type ShopRoom } from "@/lib/shop/products";
import { getShopItems } from "@/lib/shop/server";

/** Home page: the shop, with the running offer first. Hidden when the shop has nothing to show. */
export async function WarmShop() {
  const { items } = await getShopItems();
  if (items.length === 0) return null;
  const offers = items.filter((i) => i.offer);
  const picks = [...offers, ...items.filter((i) => !i.offer && i.badge), ...items.filter((i) => !i.offer && !i.badge)].slice(0, 8);
  const priced = await withAllPrices(picks);
  const top = offers[0]?.offer ?? null;
  const maxPct = Math.max(0, ...offers.map((o) => o.offer?.percent ?? 0));
  const minPct = Math.min(...offers.map((o) => o.offer?.percent ?? 0));
  // quick ways in, by room: only rooms with at least two models, in the order shoppers think of them
  const ROOM_ORDER: ShopRoom[] = ["dormitor", "living", "hol", "bucatarie", "baie", "copii", "birou"];
  const rooms = ROOM_ORDER.map((room) => ({ room, count: items.filter((i) => i.rooms.includes(room)).length })).filter((r) => r.count >= 2);

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
              Alegi modelul și culoarea și vezi prețul pe loc. {DELIVERY_TEXT}, montajul e inclus.
            </p>
          </div>
          <Link href="/magazin" className="btn-warm btn-warm--primary shop-section-head__more home-shop__more">
            Vezi tot magazinul <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {top && (
          <div className="home-shop__banner">
            <div>
              <p className="eyebrow-warm">{top.label}</p>
              <h3 className="display-font home-shop__banner-title">
                {minPct === maxPct ? "" : "Până la "}−{maxPct}% la {offers.length} modele preferate
              </h3>
              <p>Reducere față de prețul obișnuit, la toate culorile, până pe {offerEndText(top)}.</p>
            </div>
            <Link href="/magazin?oferte=1#produse" className="btn-warm btn-warm--primary">
              Vezi ofertele <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}

        <ShopRail label="Produse din magazin">
          {priced.map((item) => (
            <li key={item.slug}>
              <ProductCard item={item} />
            </li>
          ))}
          <li className="shop-rail__last">
            <Link href="/magazin" className="shop-rail__all">
              <span className="display-font">Toate cele {items.length} modele</span>
              <span className="shop-rail__all-cta">
                Vezi magazinul <ArrowRight size={16} aria-hidden="true" />
              </span>
            </Link>
          </li>
        </ShopRail>

        <div className="home-shop__foot">
          <nav className="home-shop__rooms" aria-label="Magazinul pe camere">
            {rooms.map(({ room, count }) => (
              <Link key={room} href={`/magazin?camera=${room}#produse`} className="home-shop__room">
                {ROOM_LABELS[room]} <span>{count}</span>
              </Link>
            ))}
          </nav>
          <Link href="/magazin" className="btn-warm btn-warm--primary home-shop__all">
            Vezi toate cele {items.length} {items.length % 100 >= 20 || items.length % 100 === 0 ? "de " : ""}modele <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
