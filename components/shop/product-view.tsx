"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Box, Check, PencilRuler, ShoppingBag, Truck } from "lucide-react";
import { effectiveHandle } from "@/lib/atelier/handles";
import type { AtelierConfig, AtelierScene } from "@/lib/atelier/types";
import { addToCart } from "@/lib/shop/cart";
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
  const [view, setView] = useState<"poza" | "3d">(item.photo ? "poza" : "3d");
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [added, setAdded] = useState<"idle" | "added" | "full">("idle");

  // ?culoare=<palette> opens that colour (links from the home page, shared links)
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("culoare");
    if (wanted && item.variants.some((v) => v.paletteId === wanted)) setPaletteId(wanted);
  }, [item.variants]);

  const variant = item.variants.find((v) => v.paletteId === paletteId) ?? item.variants[0];
  const scene = scenes[variant.paletteId] ?? null;
  const config = configs[variant.paletteId];
  const handle = config ? effectiveHandle(config) : null;

  const choose = (id: string) => {
    setPaletteId(id);
    setAdded("idle");
    if (item.photo) setView(id === item.variants[0].paletteId ? view : "3d");
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

  const showPhoto = view === "poza" && !!item.photo && variant.paletteId === item.variants[0].paletteId;

  return (
    <div className="shop-product">
      <div className="shop-product__media">
        <div className="shop-viewer">
          {showPhoto ? (
            <div className="shop-pic shop-pic--large">
              <ProductPicture item={item} variant={variant} priority sizes="(max-width: 1024px) 100vw, 60vw" />
            </div>
          ) : scene ? (
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
              <ProductPicture item={{ ...item, photo: null }} variant={variant} priority />
            </div>
          )}
        </div>
        {item.photo && (
          <div className="shop-viewswitch" role="group" aria-label="Vizualizare">
            <button type="button" className={view === "poza" ? "is-active" : ""} onClick={() => { setView("poza"); choose(item.variants[0].paletteId); }}>
              Fotografie
            </button>
            <button type="button" className={view === "3d" ? "is-active" : ""} onClick={() => setView("3d")}>
              <Box size={15} aria-hidden="true" /> 3D
            </button>
          </div>
        )}
        {!showPhoto && scene && <p className="shop-viewer__hint">Rotește cu degetul sau cu mouse-ul. Atinge o ușă sau un sertar ca să-l deschizi.</p>}
      </div>

      <div className="shop-product__info">
        {item.offer ? <span className="shop-tag shop-tag--offer">{item.offer.label}</span> : item.badge ? <span className="shop-tag">{item.badge}</span> : null}
        <h1 className="display-font shop-product__title">{item.name}</h1>
        <p className="shop-product__tagline">{item.tagline}</p>

        <PriceLine variant={variant} offer={item.offer} size="lg" />
        {item.offer && variant.price != null && (
          <p className="shop-product__offer-note">
            Prețul obișnuit al acestui model este {formatPrice(variant.price)}. Oferta e valabilă până pe {offerEndText(item.offer)}.
          </p>
        )}

        <fieldset className="shop-colours">
          <legend>
            Culoare: <strong>{variant.name}</strong>
          </legend>
          <div className="shop-colours__list">
            {item.variants.map((v) => (
              <button
                key={v.paletteId}
                type="button"
                className={`shop-colour ${v.paletteId === variant.paletteId ? "is-active" : ""}`}
                aria-pressed={v.paletteId === variant.paletteId}
                onClick={() => choose(v.paletteId)}
                title={v.name}
              >
                <Swatch variant={v} size={34} />
                <span className="shop-colour__name">{v.name}</span>
                {v.finalPrice != null && <span className="shop-colour__price">{formatPrice(v.finalPrice)}</span>}
              </button>
            ))}
          </div>
          <p className="shop-colours__materials">
            Corp: {variant.carcassName} · Fronturi: {variant.frontName}
          </p>
        </fieldset>

        <div className="shop-buy">
          <button type="button" className="btn-warm btn-warm--primary shop-buy__main" onClick={add} disabled={variant.finalPrice == null}>
            {added === "added" ? <Check size={18} aria-hidden="true" /> : <ShoppingBag size={18} aria-hidden="true" />}
            {added === "added" ? "Adăugat în coș" : "Adaugă în coș"}
          </button>
          {added === "added" && (
            <Link href="/magazin/cos" className="btn-warm btn-warm--ghost">
              Vezi coșul
            </Link>
          )}
          {added === "full" && <p className="shop-buy__error">Coșul e plin. Trimite comanda sau scoate un produs din coș.</p>}
        </div>

        <Link href={`/configurator?c=${variant.share}`} className="shop-customize">
          <PencilRuler size={20} aria-hidden="true" />
          <span>
            <strong>Personalizează în Atelierul 3D</strong>
            <span>Altă lățime, alt interior, alte uși sau mânere: pornești exact de la acest produs.</span>
          </span>
        </Link>

        <p className="shop-delivery">
          <Truck size={18} aria-hidden="true" /> {DELIVERY_TEXT}. Venim întâi să măsurăm, ca să se potrivească perfect.
        </p>
      </div>
    </div>
  );
}
