import Link from "next/link";
import { MiniPreview } from "@/components/atelier/mini-preview";
import { swatchStyle } from "@/components/atelier/material-look";
import { presetById } from "@/lib/atelier/presets";
import { renderOf } from "@/lib/shop/products";
import type { ShopItem, ShopVariant } from "@/lib/shop/server";
import { formatPrice } from "./price";

/** The picture of a product: its room photo when we have one, else a front drawing in its colours. */
export function ProductPicture({ item, variant, sizes, priority = false }: { item: ShopItem; variant: ShopVariant; sizes?: string; priority?: boolean }) {
  const preset = presetById(item.slug);
  const isDefault = variant.paletteId === item.variants[0]?.paletteId;
  if (item.photo && isDefault) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.photo} alt={`${item.name}, ${variant.name}`} className="shop-pic__photo" sizes={sizes} loading={priority ? "eager" : "lazy"} />;
  }
  const render = renderOf(item.slug, variant.paletteId);
  if (render) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={render} alt={`${item.name}, ${variant.name}`} className="shop-pic__photo" sizes={sizes} loading={priority ? "eager" : "lazy"} width={800} height={600} />;
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
    return <p className={`shop-price shop-price--${size} shop-price--ask`}>Preț pe loc în configurator</p>;
  }
  return (
    <p className={`shop-price shop-price--${size}`}>
      <span className={offer ? "shop-price__now shop-price__now--offer" : "shop-price__now"}>{formatPrice(variant.finalPrice)}</span>
      {offer && (
        <>
          <s className="shop-price__was" aria-label={`Preț obișnuit ${formatPrice(variant.price)}`}>
            {formatPrice(variant.price)}
          </s>
          <span className="shop-price__pct">−{offer.percent}%</span>
        </>
      )}
    </p>
  );
}

export function ProductCard({ item, priority = false }: { item: ShopItem; priority?: boolean }) {
  const variant = item.variants[0];
  return (
    <Link href={`/magazin/${item.slug}`} className="shop-card">
      <div className="shop-pic">
        <ProductPicture item={item} variant={variant} priority={priority} sizes="(max-width: 640px) 50vw, 25vw" />
        <div className="shop-card__tags">
          {item.offer && <span className="shop-tag shop-tag--offer">{item.offer.label}</span>}
          {!item.offer && item.badge && <span className="shop-tag">{item.badge}</span>}
        </div>
      </div>
      <div className="shop-card__body">
        <h3 className="shop-card__name">{item.name}</h3>
        <p className="shop-card__colour">{variant.name}</p>
        <PriceLine variant={variant} offer={item.offer} />
        {item.variants.length > 1 && (
          <p className="shop-card__swatches">
            {item.variants.slice(0, 6).map((v) => (
              <Swatch key={v.paletteId} variant={v} size={16} />
            ))}
            <span className="shop-card__more">{item.variants.length} culori</span>
          </p>
        )}
      </div>
    </Link>
  );
}
