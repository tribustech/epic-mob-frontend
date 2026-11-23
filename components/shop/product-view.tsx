"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Box, Check, ChevronRight, Image as ImageIcon, PencilRuler, Ruler, ShoppingBag, Truck } from "lucide-react";
import { effectiveHandle } from "@/lib/atelier/handles";
import type { AtelierConfig, AtelierScene } from "@/lib/atelier/types";
import { MAX_QTY, addToCart, cartCount, cartSizeText, useCart, type AddResult } from "@/lib/shop/cart";
import { DELIVERY_TEXT } from "@/lib/shop/products";
import type { ShopItem } from "@/lib/shop/server";
import { trackPixel } from "@/lib/meta-pixel";
import { PriceLine, ProductPicture, Swatch } from "./product-card";
import { formatPrice } from "./price";
import { offerEndText } from "@/lib/shop/offers";
import { AdminPricePanel } from "@/components/admin/admin-price-panel";

const Viewer3D = dynamic(() => import("@/components/atelier/viewer-3d"), {
  ssr: false,
  loading: () => <div className="shop-viewer__loading">Se încarcă vizualizarea 3D…</div>,
});

/** „W1000 ST9 · Alb Premium" → „Alb Premium": the supplier code means nothing to a client */
const plainDecor = (name: string) => name.replace(/^[A-Z]{0,4}[- ]?\d{2,5}(\s+[A-Z]{1,3}\d{1,3})?\s*[·\-–]\s*/u, "");

export function ProductView({
  item,
  scenes,
  configs,
  initialPaletteId,
  size,
  sizes = [],
}: {
  /** „240 × 220 × 60 cm": the piece is sold at exactly this size */
  size: string;
  /** the same model in other sizes (this one included), for the size chips */
  sizes?: { slug: string; label: string; price: number | null; current: boolean }[];
  item: ShopItem;
  scenes: Record<string, AtelierScene | null>;
  configs: Record<string, AtelierConfig>;
  /** ?culoare= read on the server, so the first paint already shows that colour and its price */
  initialPaletteId?: string;
}) {
  const [paletteId, setPaletteId] = useState(
    initialPaletteId && item.variants.some((v) => v.paletteId === initialPaletteId) ? initialPaletteId : item.variants[0].paletteId,
  );
  const [view, setView] = useState<"poza" | "3d">("poza");
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [added, setAdded] = useState<"idle" | AddResult>("idle");
  const [buyInView, setBuyInView] = useState(true);
  const buyRef = useRef<HTMLDivElement>(null);
  const cart = useCart();

  // ?culoare=<palette> opens that colour (links from the shop grid, the home page, shared links). The server
  // already passes it as initialPaletteId; this covers client-side navigation that keeps the component.
  useEffect(() => {
    const fromUrl = () => {
      const wanted = new URLSearchParams(window.location.search).get("culoare");
      if (wanted && item.variants.some((v) => v.paletteId === wanted)) setPaletteId(wanted);
    };
    fromUrl();
  }, [item.variants]);

  // phones: once the big button is out of view, a slim bar with the price and the button stays at the bottom
  useEffect(() => {
    const el = buyRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setBuyInView(entry.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // „Adăugat" goes back to „Adaugă în coș" after a moment, so a second piece can be added
  useEffect(() => {
    if (added !== "added") return;
    const t = window.setTimeout(() => setAdded("idle"), 2400);
    return () => window.clearTimeout(t);
  }, [added]);

  const variant = item.variants.find((v) => v.paletteId === paletteId) ?? item.variants[0];
  const scene = scenes[variant.paletteId] ?? null;
  const config = configs[variant.paletteId];
  const handle = config ? effectiveHandle(config) : null;
  const inCart = cart.find((l) => l.slug === item.slug && l.paletteId === variant.paletteId)?.qty ?? 0;
  const cartTotal = cartCount(cart);

  const choose = (id: string) => {
    setPaletteId(id);
    setAdded("idle");
    const url = new URL(window.location.href);
    if (id === item.variants[0].paletteId) url.searchParams.delete("culoare");
    else url.searchParams.set("culoare", id);
    window.history.replaceState(null, "", url.toString());
  };

  const add = () => {
    const onOffer = !!item.offer && variant.price != null && variant.finalPrice != null && variant.finalPrice < variant.price;
    const result = addToCart({
      slug: item.slug,
      paletteId: variant.paletteId,
      name: item.name,
      colour: variant.name,
      price: variant.finalPrice,
      regularPrice: onOffer ? variant.price : null,
      offerPercent: onOffer ? item.offer!.percent : 0,
      offerLabel: onOffer ? item.offer!.label : null,
    });
    setAdded(result);
    if (result === "added") trackPixel("AddToCart", { content_name: item.name, value: variant.finalPrice ?? 0, currency: "RON" });
  };

  const show3d = view === "3d" && !!scene && !!config;
  const canBuy = variant.finalPrice != null;
  const done = added === "added";
  const addIcon = done ? <Check size={18} aria-hidden="true" /> : <ShoppingBag size={18} aria-hidden="true" />;

  return (
    <div className="shop-product">
      <div className="shop-product__media">
        <div className={`shop-viewer ${show3d ? "shop-viewer--3d" : ""}`}>
          {show3d ? (
            <Viewer3D
              scene={scene}
              columns={config.columns.map((c) => c.content)}
              railPositions={config.columns.map((c) => c.railPosition)}
              carcass={variant.carcass}
              front={variant.front}
              updating={false}
              doorsOpen={doorsOpen}
              onDoorsOpenChange={setDoorsOpen}
              handles={handle?.type === "APLICAT"}
              handle={handle?.type ?? null}
              handleFinish={handle?.finish ?? undefined}
            />
          ) : (
            <div className="shop-pic shop-pic--large">
              <ProductPicture item={item} variant={variant} priority sizes="(max-width: 1024px) 100vw, 60vw" />
            </div>
          )}
          {item.offer && !show3d && <span className="shop-tag shop-tag--offer shop-viewer__tag">{item.offer.label}</span>}
        </div>
        {scene && config && (
          <div className="shop-viewswitch" role="group" aria-label="Cum vrei să vezi produsul">
            <button type="button" className={view === "poza" ? "is-active" : ""} aria-pressed={view === "poza"} onClick={() => setView("poza")}>
              <ImageIcon size={17} aria-hidden="true" /> Imagine
            </button>
            <button type="button" className={view === "3d" ? "is-active" : ""} aria-pressed={view === "3d"} onClick={() => setView("3d")}>
              <Box size={17} aria-hidden="true" /> Rotește în 3D
            </button>
          </div>
        )}
      </div>

      <div className="shop-product__info">
        {!item.offer && item.badge ? <span className="shop-tag shop-tag--soft">{item.badge}</span> : null}
        <h1 className="display-font shop-product__title">{item.name}</h1>
        <p className="shop-product__tagline">{item.tagline}</p>
        <p className="shop-product__size">
          <Ruler size={17} aria-hidden="true" /> <span>{size}</span> <span className="shop-product__size-key">lățime × înălțime × adâncime</span>
        </p>

        <PriceLine variant={variant} offer={item.offer} size="lg" />
        {item.offer && variant.price != null && (
          <p className="shop-product__offer-note">
            {item.offer.label}: prețul obișnuit este {formatPrice(variant.price)}. Oferta ține până pe {offerEndText(item.offer)}.
          </p>
        )}

        <fieldset className="shop-colours">
          <legend>
            <span>Alege culoarea</span>
            <strong>{variant.name}</strong>
          </legend>
          <div className="shop-colours__list">
            {item.variants.map((v) => {
              const on = v.paletteId === variant.paletteId;
              return (
                <button key={v.paletteId} type="button" className={`shop-colour ${on ? "is-active" : ""}`} aria-pressed={on} data-palette={v.paletteId} onClick={() => choose(v.paletteId)}>
                  <Swatch variant={v} size={38} />
                  <span className="shop-colour__text">
                    <span className="shop-colour__name">{v.name}</span>
                    {v.finalPrice != null && <span className="shop-colour__price">{formatPrice(v.finalPrice)}</span>}
                  </span>
                  {on && (
                    <span className="shop-colour__check" aria-hidden="true">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="shop-colours__materials">
            <span>
              <strong>Corp:</strong> {variant.carcassSpec} ({plainDecor(variant.carcassName)})
            </span>
            <span>
              <strong>Uși și fețe:</strong> {variant.frontSpec} ({plainDecor(variant.frontName)})
            </span>
          </p>
        </fieldset>

        {sizes.length > 1 && (
          <nav className="shop-sizes" aria-label="Alte mărimi">
            <span className="shop-sizes__label">Mărimea</span>
            <div className="shop-sizes__list">
              {sizes.map((s) =>
                s.current ? (
                  <span key={s.slug} className="shop-size is-active" aria-current="page">
                    <strong>{s.label}</strong>
                    {variant.finalPrice != null && <span>{formatPrice(variant.finalPrice)}</span>}
                  </span>
                ) : (
                  <Link key={s.slug} href={`/magazin/${s.slug}?culoare=${variant.paletteId}`} className="shop-size">
                    <strong>{s.label}</strong>
                    {s.price != null && <span>de la {formatPrice(s.price)}</span>}
                  </Link>
                ),
              )}
            </div>
          </nav>
        )}

        <div className="shop-buy" ref={buyRef}>
          <button type="button" className={`btn-warm btn-warm--primary shop-buy__main ${done ? "is-done" : ""}`} onClick={add} disabled={!canBuy}>
            {addIcon}
            {done ? "Adăugat în coș" : "Adaugă în coș"}
          </button>
          <p className="shop-buy__status" aria-live="polite">
            {added === "full" ? (
              <span className="shop-buy__error">Coșul e plin. Trimite comanda sau scoate un produs din coș.</span>
            ) : added === "max" ? (
              <>
                <span className="shop-buy__error">Ai deja numărul maxim ({MAX_QTY} bucăți) în coș. Pentru mai multe, scrie-ne în observațiile comenzii.</span>
                <Link href="/magazin/cos" className="shop-buy__tocart">
                  Vezi coșul <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </>
            ) : inCart > 0 ? (
              <>
                <span className="shop-buy__incart">
                  <Check size={15} strokeWidth={2.6} aria-hidden="true" /> {inCart === 1 ? "Este în coș" : `${inCart} bucăți în coș`}
                </span>
                <Link href="/magazin/cos" className="shop-buy__tocart">
                  Vezi coșul <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </>
            ) : (
              <span className="shop-buy__hint">Comanzi exact ce vezi, la mărimea de mai sus. Nu plătești nimic online: te sunăm să confirmăm comanda.</span>
            )}
          </p>
        </div>

        <Link href={`/configurator?c=${variant.share}`} className="shop-customize">
          <span className="shop-customize__icon">
            <PencilRuler size={20} aria-hidden="true" />
          </span>
          <span className="shop-customize__text">
            <strong>Personalizează în Atelierul 3D</strong>
            <span>Altă lățime, alt interior, alte uși sau mânere. Pornești exact de la acest produs.</span>
            {item.offer && (
              <span className="shop-customize__offer">
                {item.offer.label} (−{item.offer.percent}%) se aplică doar modelului standard din magazin. În Atelierul 3D vezi prețul obișnuit.
              </span>
            )}
          </span>
          <ChevronRight size={20} aria-hidden="true" className="shop-customize__go" />
        </Link>

        <p className="shop-delivery">
          <Truck size={18} aria-hidden="true" /> {DELIVERY_TEXT}, montaj inclus. Dacă vrei, venim gratuit să verificăm măsurile înainte.
        </p>
      </div>

      {/* phones and tablets: price + button always at hand */}
      <div className={`shop-sticky ${!buyInView && canBuy ? "is-on" : ""}`} inert={buyInView || !canBuy}>
        <div className="shop-sticky__what">
          <span className="shop-sticky__price">
            {variant.finalPrice != null && formatPrice(variant.finalPrice)}
            {item.offer && variant.price != null && <s>{formatPrice(variant.price)}</s>}
          </span>
          <span className="shop-sticky__colour">{variant.name}</span>
        </div>
        {cartTotal > 0 && (
          <Link href="/magazin/cos" className="shop-sticky__cart" aria-label={`Vezi coșul: ${cartSizeText(cart.length, cartTotal)}`}>
            <ShoppingBag size={20} aria-hidden="true" />
            <span>{cartTotal}</span>
          </Link>
        )}
        <button type="button" className={`btn-warm btn-warm--primary shop-sticky__add ${done ? "is-done" : ""}`} onClick={add}>
          {addIcon}
          {done ? "Adăugat" : added === "max" ? `Ai deja ${MAX_QTY} în coș` : added === "full" ? "Coșul e plin" : "Adaugă în coș"}
        </button>
      </div>
      <AdminPricePanel config={config} offerPercent={item.offer?.percent ?? null} />
    </div>
  );
}
