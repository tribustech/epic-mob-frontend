/**
 * Shop offers. The crossed-out price is the model's usual price: exactly what the same configuration
 * costs in the configurator on the same day (both come live from the CRM). The offer price is that,
 * minus the percent. So a reduction shown here is always a real one.
 *
 * To run an offer: add a line with the product slug (or a whole category), the percent and the dates
 * (inclusive, Europe/Bucharest). Expired offers disappear on their own at the next page refresh.
 */
export interface ShopOffer {
  /** product slug (lib/shop/products.ts) or `categorie:<ShopCategory>` */
  target: string;
  percent: number;
  /** YYYY-MM-DD */
  from: string;
  until: string;
  /** short label on the card, e.g. „Ofertă de iarnă" */
  label: string;
}

export const SHOP_OFFERS: ShopOffer[] = [
  { target: "dressing-clasic-240", percent: 10, from: "2026-11-20", until: "2026-12-31", label: "Ofertă de iarnă" },
  { target: "dressing-oglinda-240", percent: 10, from: "2026-11-20", until: "2026-12-31", label: "Ofertă de iarnă" },
  { target: "comoda-clasica-160", percent: 10, from: "2026-11-20", until: "2026-12-31", label: "Ofertă de iarnă" },
  { target: "comoda-tv-240", percent: 10, from: "2026-11-20", until: "2026-12-31", label: "Ofertă de iarnă" },
  { target: "separator-sertare-160", percent: 10, from: "2026-11-20", until: "2026-12-31", label: "Ofertă de iarnă" },
  { target: "suspendat-tv-180", percent: 10, from: "2026-11-20", until: "2026-12-31", label: "Ofertă de iarnă" },
];

/** Today in Romania, YYYY-MM-DD. */
export function bucharestToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** The best running offer for a product (a product-specific one wins over its category's). */
export function offerFor(slug: string, category: string, today: string = bucharestToday()): ShopOffer | null {
  const running = SHOP_OFFERS.filter(
    (o) => (o.target === slug || o.target === `categorie:${category}`) && o.from <= today && today <= o.until && o.percent > 0 && o.percent < 90,
  );
  if (running.length === 0) return null;
  return running.sort((a, b) => (a.target === slug ? -1 : 0) - (b.target === slug ? -1 : 0) || b.percent - a.percent)[0];
}

/** Offer price, rounded down to whole lei. */
export function offerPrice(price: number, offer: ShopOffer | null): number {
  return offer ? Math.floor(price * (1 - offer.percent / 100)) : price;
}

/** „31 decembrie" */
export function offerEndText(offer: ShopOffer): string {
  const [y, m, d] = offer.until.split("-").map(Number);
  return new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}
