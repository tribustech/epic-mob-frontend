"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MiniPreview } from "@/components/atelier/mini-preview";
import { swatchStyle } from "@/components/atelier/material-look";
import { PALETTES, type PaletteMood } from "@/lib/atelier/palettes";
import { presetById } from "@/lib/atelier/presets";
import { pictureOf } from "@/lib/shop/products";
import type { ShopItem, ShopVariant } from "@/lib/shop/server";
import { formatPrice } from "./price";
import { AdminCardBadge } from "@/components/admin/admin-card-badge";

const MOOD_OF = new Map(PALETTES.map((p) => [p.id, p.mood]));

/** The colour family („Luminoase", „Lemn cald"…) of a variant. */
export function moodOf(variant: ShopVariant): PaletteMood | undefined {
  return MOOD_OF.get(variant.paletteId);
}

/** The picture of one colour: its room photo, else its 3D render, else a front drawing in its colours. */
export function ProductPicture({ item, variant, sizes, priority = false }: { item: ShopItem; variant: ShopVariant; sizes?: string; priority?: boolean }) {
  const preset = presetById(item.slug);
  const src = pictureOf(item.slug, variant.paletteId);
  if (src) {
    // next/image serves a copy as wide as the slot (`sizes`), not the 1200 px original
    return (
      <Image
        src={src}
        alt={`${item.name}, ${variant.name}`}
        className="shop-pic__photo"
        fill
        sizes={sizes ?? "(max-width: 640px) 50vw, 25vw"}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
      />
    );
  }
  return (
    <div className="shop-pic__studio" role="img" aria-label={`${item.name}, ${variant.name}`}>
      {preset && <MiniPreview shape={preset.shape} carcass={variant.carcass} front={variant.front} className="shop-pic__drawing" />}
    </div>
  );
}

export function Swatch({ variant, size = 18 }: { variant: ShopVariant; size?: number }) {
  return (
    <span className="shop-swatch" style={{ width: size, height: size }} aria-hidden="true">
      <span style={swatchStyle(variant.carcass)} />
      <span style={swatchStyle(variant.front)} />
    </span>
  );
}

export function PriceLine({ variant, offer, size = "md" }: { variant: ShopVariant; offer: ShopItem["offer"]; size?: "md" | "lg" }) {
  if (variant.finalPrice == null || variant.price == null) {
    return <p className={`shop-price shop-price--${size} shop-price--ask`}>Vezi prețul în Atelierul 3D</p>;
  }
  return (
    <p className={`shop-price shop-price--${size}`}>
      <span className={offer ? "shop-price__now shop-price__now--offer" : "shop-price__now"}>{formatPrice(variant.finalPrice)}</span>
      {offer && (
        <>
          <s className="shop-price__was">
            <span className="shop-sr">Preț obișnuit: </span>
            {formatPrice(variant.price)}
          </s>
          {size === "lg" && <span className="shop-price__pct">−{offer.percent}%</span>}
        </>
      )}
    </p>
  );
}

/**
 * One product in a grid or rail. The whole card opens the product. The small colour dots switch the picture
 * and the price (each has a 44 px tall tap area), and the card then opens the product in that colour.
 * `mood` (the colour family chosen in the filters) decides which colour is shown first.
 */
export function ProductCard({ item, priority = false, mood = null }: { item: ShopItem; priority?: boolean; mood?: PaletteMood | null }) {
  const [picked, setPicked] = useState<string | null>(null);
  const first = (mood && item.variants.find((v) => moodOf(v) === mood)) || item.variants[0];
  const variant = item.variants.find((v) => v.paletteId === picked) ?? first;
  const isDefault = variant.paletteId === item.variants[0].paletteId;
  const href = isDefault ? `/magazin/${item.slug}` : `/magazin/${item.slug}?culoare=${variant.paletteId}`;

  return (
    <article className="shop-card">
      <Link href={href} className="shop-card__link">
        <div className="shop-pic">
          <ProductPicture item={item} variant={variant} priority={priority} sizes="(max-width: 640px) 50vw, 25vw" />
          <div className="shop-card__tags">
            {item.offer ? <span className="shop-tag shop-tag--offer">{item.offer.label}</span> : item.badge ? <span className="shop-tag">{item.badge}</span> : <span />}
            {item.offer && <span className="shop-tag shop-tag--pct">−{item.offer.percent}%</span>}
          </div>
        </div>
        <div className="shop-card__body">
          <h3 className="shop-card__name">{item.name}</h3>
          <p className="shop-card__colour">{variant.name}</p>
          <PriceLine variant={variant} offer={item.offer} />
        </div>
      </Link>
      <AdminCardBadge share={variant.share} offerPercent={item.offer?.percent ?? null} />
      {item.variants.length > 1 && (
        <div className="shop-card__swatches">
          {item.variants.slice(0, 6).map((v) => (
            <button
              key={v.paletteId}
              type="button"
              className={`shop-card__dot ${v.paletteId === variant.paletteId ? "is-active" : ""}`}
              aria-pressed={v.paletteId === variant.paletteId}
              aria-label={`Arată în culoarea ${v.name}`}
              title={v.name}
              onClick={() => setPicked(v.paletteId)}
            >
              <span className="shop-card__ring">
                <Swatch variant={v} size={18} />
              </span>
            </button>
          ))}
          <span className="shop-card__more">{item.variants.length} culori</span>
        </div>
      )}
    </article>
  );
}
