"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Box, Check, ChevronRight, Image as ImageIcon, PencilRuler, ShoppingBag, Truck } from "lucide-react";
import { effectiveHandle } from "@/lib/atelier/handles";
import type { AtelierConfig, AtelierScene } from "@/lib/atelier/types";
import { addToCart, cartCount, useCart } from "@/lib/shop/cart";
import { DELIVERY_TEXT } from "@/lib/shop/products";
import type { ShopItem } from "@/lib/shop/server";
import { trackPixel } from "@/lib/meta-pixel";
import { PriceLine, ProductPicture, Swatch } from "./product-card";
import { formatPrice } from "./price";
import { offerEndText } from "@/lib/shop/offers";

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
}: {
  item: ShopItem;
  scenes: Record<string, AtelierScene | null>;
  configs: Record<string, AtelierConfig>;
}) {
  const [paletteId, setPaletteId] = useState(item.variants[0].paletteId);
  const [view, setView] = useState<"poza" | "3d">("poza");
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [added, setAdded] = useState<"idle" | "added" | "full">("idle");
  const [buyInView, setBuyInView] = useState(true);
  const buyRef = useRef<HTMLDivElement>(null);
  const cart = useCart();

  // ?culoare=<palette> opens that colour (links from the shop grid, the home page, shared links)
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
    const ok = addToCart({ slug: item.slug, paletteId: variant.paletteId, name: item.name, colour: variant.name, price: variant.finalPrice });
    setAdded(ok ? "added" : "full");
    if (ok) trackPixel("AddToCart", { content_name: item.name, value: variant.finalPrice ?? 0, currency: "RON" });
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
            Corp: {plainDecor(variant.carcassName)} · Uși și fețe: {plainDecor(variant.frontName)}
          </p>
        </fieldset>

        <div className="shop-buy" ref={buyRef}>
          <button type="button" className={`btn-warm btn-warm--primary shop-buy__main ${done ? "is-done" : ""}`} onClick={add} disabled={!canBuy}>
            {addIcon}
            {done ? "Adăugat în coș" : "Adaugă în coș"}
          </button>
          <p className="shop-buy__status" aria-live="polite">
            {added === "full" ? (
              <span className="shop-buy__error">Coșul e plin. Trimite comanda sau scoate un produs din coș.</span>
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
              <span className="shop-buy__hint">Nu plătești nimic acum. Te sunăm și venim întâi să măsurăm.</span>
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
          </span>
          <ChevronRight size={20} aria-hidden="true" className="shop-customize__go" />
        </Link>

        <p className="shop-delivery">
          <Truck size={18} aria-hidden="true" /> {DELIVERY_TEXT}. Venim întâi să măsurăm, ca să se potrivească perfect.
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
          <Link href="/magazin/cos" className="shop-sticky__cart" aria-label={`Vezi coșul: ${cartTotal} ${cartTotal === 1 ? "produs" : "produse"}`}>
            <ShoppingBag size={20} aria-hidden="true" />
            <span>{cartTotal}</span>
          </Link>
        )}
        <button type="button" className={`btn-warm btn-warm--primary shop-sticky__add ${done ? "is-done" : ""}`} onClick={add}>
          {addIcon}
          {done ? "Adăugat" : "Adaugă în coș"}
        </button>
      </div>
    </div>
  );
}
