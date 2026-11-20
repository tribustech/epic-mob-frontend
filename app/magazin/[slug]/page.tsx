import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, PhoneCall, Ruler, ShieldCheck, Wrench } from "lucide-react";
import { withAllPrices } from "@/components/shop/all-prices";
import { ProductCard } from "@/components/shop/product-card";
import { ProductView } from "@/components/shop/product-view";
import { SITE_URL } from "@/lib/business-data";
import { ROOM_LABELS, SHOP_CATEGORIES, SHOP_PRODUCTS, productBySlug, productFacts } from "@/lib/shop/products";
import { getShopItems, getShopProduct } from "@/lib/shop/server";

export const revalidate = 600;

export function generateStaticParams() {
  return SHOP_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return {};
  const title = `${product.preset.name} | Magazin EpicMob`;
  const description = `${product.preset.tagline} În ${product.paletteIds.length} combinații de culori, cu montaj inclus și garanție 5 ani.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/magazin/${slug}` },
    openGraph: { title, description, url: `/magazin/${slug}`, type: "website", ...(product.photo ? { images: [product.photo] } : {}) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();
  const data = await getShopProduct(slug);
  if (!data) notFound();
  const { item, scenes, configs } = data;
  const category = SHOP_CATEGORIES.find((c) => c.id === item.category);

  const { items } = await getShopItems();
  const related = items
    .filter((i) => i.slug !== slug && (i.category === item.category || i.rooms.some((r) => item.rooms.includes(r))))
    .sort((a, b) => Number(b.category === item.category) - Number(a.category === item.category))
    .slice(0, 4);
  const relatedPriced = await withAllPrices(related);

  const priced = item.variants.filter((v) => v.finalPrice != null);
  const jsonLd = priced.length
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: item.name,
        description: item.tagline,
        brand: { "@type": "Brand", name: "EpicMob" },
        url: `${SITE_URL}/magazin/${slug}`,
        ...(item.photo ? { image: `${SITE_URL}${item.photo}` } : {}),
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "RON",
          lowPrice: Math.min(...priced.map((v) => v.finalPrice as number)),
          highPrice: Math.max(...priced.map((v) => v.finalPrice as number)),
          offerCount: priced.length,
        },
      }
    : null;

  return (
    <main className="home-warm shop-page">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <div className="section-shell">
        <nav className="shop-crumbs" aria-label="Unde te afli">
          <ol>
            <li>
              <Link href="/magazin">Magazin</Link>
            </li>
            {category && (
              <li>
                <ChevronRight size={14} aria-hidden="true" />
                <Link href={`/magazin?categorie=${category.id}#produse`}>{category.label}</Link>
              </li>
            )}
            <li className="shop-crumbs__here">
              <ChevronRight size={14} aria-hidden="true" />
              <span aria-current="page">{item.name}</span>
            </li>
          </ol>
        </nav>

        <ProductView item={item} scenes={scenes} configs={configs} />

        <section className="shop-details">
          <div>
            <h2 className="shop-details__title">Ce include</h2>
            <ul className="shop-facts">
              {productFacts(product.preset).map((f) => (
                <li key={f}>{f}</li>
              ))}
              <li>Potrivit pentru: {item.rooms.map((r) => ROOM_LABELS[r].toLowerCase()).join(", ")}</li>
            </ul>
          </div>
          <div>
            <h2 className="shop-details__title">Cum comanzi</h2>
            <ol className="shop-steps">
              <li>
                <PhoneCall size={18} aria-hidden="true" />
                <span>Pui produsul în coș și ne lași numărul. Te sunăm ca să stabilim detaliile.</span>
              </li>
              <li>
                <Ruler size={18} aria-hidden="true" />
                <span>Venim la tine, măsurăm și îți confirmăm prețul.</span>
              </li>
              <li>
                <Wrench size={18} aria-hidden="true" />
                <span>Livrăm și montăm. Montajul e inclus în preț.</span>
              </li>
              <li>
                <ShieldCheck size={18} aria-hidden="true" />
                <span>Garanție 5 ani pentru tot ce montăm.</span>
              </li>
            </ol>
          </div>
        </section>

        {related.length > 0 && (
          <section className="shop-related">
            <h2 className="shop-details__title">S-ar putea să-ți placă și</h2>
            <ul className="shop-grid shop-grid--four">
              {relatedPriced.map((r) => (
                <li key={r.slug}>
                  <ProductCard item={r} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
