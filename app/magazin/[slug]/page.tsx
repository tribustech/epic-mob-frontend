import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, PhoneCall, Ruler, ShieldCheck, Wrench } from "lucide-react";
import { withAllPrices } from "@/components/shop/all-prices";
import { ProductCard } from "@/components/shop/product-card";
import { ProductView } from "@/components/shop/product-view";
import { FRONT_INFO } from "@/lib/shop/fronts";
import { sizeOptions } from "@/lib/shop/sizes";
import { JsonLd, buildBreadcrumbSchema } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/business-data";
import { BRAND, baseOpenGraph } from "@/lib/seo";
import { ROOM_LABELS, SHOP_CATEGORIES, SHOP_PRODUCTS, colourCountText, pictureOf, productBySlug, productFacts, sizeText } from "@/lib/shop/products";
import { BOARDS_PAGE, DECOR_NOTE, HARDWARE_PAGE, constructionSpec } from "@/lib/shop/specs";
import { getShopItems, getShopProduct } from "@/lib/shop/server";
import { categoryLandingOf, roomLandingOf } from "@/lib/shop/landing";

export const revalidate = 600;

export function generateStaticParams() {
  return SHOP_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return {};
  const title = `${product.preset.name} | Magazin ${BRAND}`;
  const description = `${product.preset.tagline} ${colourCountText(product.paletteIds.length)}, cu montaj inclus și garanție 5 ani.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/magazin/${slug}` },
    openGraph: { ...baseOpenGraph, title, description, url: `/magazin/${slug}`, ...(pictureOf(slug, product.paletteIds[0]) ? { images: [pictureOf(slug, product.paletteIds[0])!] } : {}) },
  };
}

/** „Balamale Blum CLIP top BLUMOTION, …" / „… glisiere Blum TANDEM BLUMOTION (…)": the Blum product name */
const BLUM = /Blum [A-Za-z ]*?BLUMOTION/;

/** The text with the first match of the phrase as a link. */
function LinkedPhrase({ text, phrase, href }: { text: string; phrase: RegExp; href: string }) {
  const m = phrase.exec(text);
  if (!m) return <>{text}</>;
  return (
    <>
      {text.slice(0, m.index)}
      <Link href={href} className="shop-matlink">
        {m[0]}
      </Link>
      {text.slice(m.index + m[0].length)}
    </>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();
  const data = await getShopProduct(slug);
  if (!data) notFound();
  const { item, scenes, configs, fronts } = data;
  // the boards of the fronts (PAL · AGT · vopsit) are offered on pieces that have doors or drawers
  const hasFrontChoice = Object.values(fronts).some((list) => list.length > 1);
  const category = SHOP_CATEGORIES.find((c) => c.id === item.category);
  const categoryPage = categoryLandingOf(item.category);

  const { items } = await getShopItems();
  const related = items
    .filter((i) => i.slug !== slug && (i.category === item.category || i.rooms.some((r) => item.rooms.includes(r))))
    .sort((a, b) => Number(b.category === item.category) - Number(a.category === item.category))
    .slice(0, 4);
  const relatedPriced = await withAllPrices(related);

  // the widths it is sold in (3: the photographed one, one smaller, one larger); ?culoare= / ?latime= / ?fronturi= are
  // read in the browser (ProductView), so the page stays static for search engines
  const widths = sizeOptions(product.preset).map((w) => ({ widthMm: w, size: sizeText(product.preset, w) }));

  // the first Blum line links to where the hinges and slides are explained (once per page)
  const construction = constructionSpec(product.preset);
  const blumAt = construction.findIndex((f) => BLUM.test(f));

  const priced = item.variants.filter((v) => v.finalPrice != null);
  const jsonLd = priced.length
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: item.name,
        description: item.tagline,
        brand: { "@type": "Brand", name: BRAND },
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
  const breadcrumbJsonLd = buildBreadcrumbSchema([
    { name: "Acasă", path: "/" },
    { name: "Magazin", path: "/magazin" },
    ...(categoryPage ? [{ name: categoryPage.name, path: categoryPage.path }] : []),
    { name: item.name, path: `/magazin/${slug}` },
  ]);

  return (
    <main className="home-warm shop-page">
      {jsonLd && <JsonLd data={jsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />
      <div className="section-shell">
        <nav className="shop-crumbs" aria-label="Unde te afli">
          <ol>
            <li>
              <Link href="/magazin">Magazin</Link>
            </li>
            {category && (
              <li>
                <ChevronRight size={14} aria-hidden="true" />
                <Link href={categoryPage?.path ?? `/magazin?categorie=${category.id}#produse`}>{category.label}</Link>
              </li>
            )}
            <li className="shop-crumbs__here">
              <ChevronRight size={14} aria-hidden="true" />
              <span aria-current="page">{item.name}</span>
            </li>
          </ol>
        </nav>

        <ProductView item={item} scenes={scenes} configs={configs} widths={widths} fronts={fronts} />

        <section className="shop-details">
          <div>
            <h2 className="shop-details__title">Ce include</h2>
            <ul className="shop-facts">
              {productFacts(product.preset).map((f) => (
                <li key={f}>{f}</li>
              ))}
              <li>
                Potrivit pentru:{" "}
                {item.rooms.map((r, i) => {
                  const page = roomLandingOf(r);
                  const label = ROOM_LABELS[r].toLowerCase();
                  return (
                    <span key={r}>
                      {i > 0 && ", "}
                      {page ? (
                        <Link href={page.path} className="shop-matlink">
                          {label}
                        </Link>
                      ) : (
                        label
                      )}
                    </span>
                  );
                })}
              </li>
            </ul>
          </div>
          <div>
            <h2 className="shop-details__title">Din ce e făcut</h2>
            <ul className="shop-facts">
              <li>
                Corp și polițe:{" "}
                <Link href="/materiale/pal-melaminat" className="shop-matlink">
                  PAL melaminat
                </Link>{" "}
                de 18 mm (Egger sau Kastamonu); decorul exact apare lângă fiecare culoare
              </li>
              {hasFrontChoice && (
                <li>
                  Uși și fețe: la alegere, din{" "}
                  <Link href={FRONT_INFO.PAL.href} className="shop-matlink">
                    PAL melaminat
                  </Link>
                  ,{" "}
                  <Link href={FRONT_INFO.AGT.href} className="shop-matlink">
                    MDF melaminat AGT
                  </Link>{" "}
                  sau{" "}
                  <Link href={FRONT_INFO.VOPSIT.href} className="shop-matlink">
                    MDF vopsit
                  </Link>
                  ; prețul se schimbă după placă
                </li>
              )}
              {construction.map((f, i) => (
                <li key={f}>{i === blumAt ? <LinkedPhrase text={f} phrase={BLUM} href={HARDWARE_PAGE} /> : f}</li>
              ))}
            </ul>
            <p className="shop-details__note">
              {DECOR_NOTE}{" "}
              <Link href={BOARDS_PAGE} className="shop-matlink">
                Vezi cum diferă PAL-ul și MDF-ul
              </Link>
              .
            </p>
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
                <span>Confirmăm comanda la telefon. Dacă vrei, venim gratuit să verificăm măsurile.</span>
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
