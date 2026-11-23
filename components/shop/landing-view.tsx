import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronRight, PencilRuler, ShieldCheck, Truck, Wrench } from "lucide-react";
import { JsonLd, buildBreadcrumbSchema } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/business-data";
import { categoryLandings, onLanding, roomLandings, type ShopLanding } from "@/lib/shop/landing";
import { DELIVERY_TEXT, SHOP_PRODUCTS } from "@/lib/shop/products";
import { getShopItems, type ShopItem } from "@/lib/shop/server";
import { withAllPrices } from "./all-prices";
import { ProductCard } from "./product-card";
import { formatPrice } from "./price";

const plural = (n: number) => `${n} ${n === 1 ? "model" : n >= 20 ? "de modele" : "modele"}`;

/** The other landing pages to link to: the rest of the same kind, and the other kind where it has products of this page. */
function siblings(landing: ShopLanding): { title: string; links: ShopLanding[] }[] {
  const mine = SHOP_PRODUCTS.filter((p) => onLanding(landing, p));
  const sameKind = (landing.kind === "camera" ? roomLandings() : categoryLandings()).filter((l) => l.slug !== landing.slug);
  const otherKind = (landing.kind === "camera" ? categoryLandings() : roomLandings()).filter((l) => mine.some((p) => onLanding(l, p)));
  return landing.kind === "camera"
    ? [
        { title: "Pentru această cameră, după fel", links: otherKind },
        { title: "Alte camere", links: sameKind },
      ]
    : [
        { title: "În ce camere se potrivesc", links: otherKind },
        { title: "Alte feluri de mobilier", links: sameKind },
      ];
}

/** A room or category landing page of the shop (app/magazin/camera, app/magazin/categorie). Server component. */
export function LandingView({ landing, items }: { landing: ShopLanding; items: ShopItem[] }) {
  const prices = items.map((i) => Math.min(...i.variants.map((v) => v.finalPrice ?? Infinity))).filter(Number.isFinite);
  const from = prices.length ? Math.min(...prices) : null;
  // recommended order, like the shop: offers first, then the „Cel mai ales" models
  const shown = [...items].sort((a, b) => Number(!!b.offer) - Number(!!a.offer) || Number(!!b.badge) - Number(!!a.badge));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${SITE_URL}${landing.path}`,
    inLanguage: "ro",
    mainEntity: landing.faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Acasă", path: "/" },
    { name: "Magazin", path: "/magazin" },
    { name: landing.name, path: landing.path },
  ]);

  return (
    <main className="home-warm shop-page">
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      <section className="shop-hero">
        <div className="section-shell">
          <nav className="shop-crumbs" aria-label="Unde te afli">
            <ol>
              <li>
                <Link href="/magazin">Magazin</Link>
              </li>
              <li className="shop-crumbs__here">
                <ChevronRight size={14} aria-hidden="true" />
                <span aria-current="page">{landing.name}</span>
              </li>
            </ol>
          </nav>
        </div>
        <div className="section-shell shop-hero__inner shop-landing__hero">
          <div className="shop-hero__text">
            <p className="eyebrow-warm">{landing.eyebrow}</p>
            <h1 className="display-font shop-hero__title">{landing.h1}</h1>
            <p className="shop-hero__lede">{landing.intro[0]}</p>
            {items.length > 0 && (
              <p className="shop-landing__count">
                {plural(items.length)}
                {from != null && <> · de la {formatPrice(from)}, montaj inclus</>}
              </p>
            )}
          </div>
          <ul className="shop-usp">
            <li>
              <Truck size={18} aria-hidden="true" /> {DELIVERY_TEXT}
            </li>
            <li>
              <Wrench size={18} aria-hidden="true" /> Montaj inclus
            </li>
            <li>
              <ShieldCheck size={18} aria-hidden="true" /> Garanție 5 ani
            </li>
            <li>
              <PencilRuler size={18} aria-hidden="true" /> Făcut pe măsură în atelierul nostru
            </li>
          </ul>
        </div>
      </section>

      <section className="section-shell shop-all" aria-labelledby="landing-products">
        <div className="shop-section-head">
          <h2 id="landing-products" className="display-font shop-section-head__title">
            {landing.kind === "camera" ? `Modele pentru ${landing.name.toLowerCase()}` : `Toate modelele: ${landing.name.toLowerCase()}`}
          </h2>
          <Link href="/configurator" className="btn-warm btn-warm--ghost">
            <PencilRuler size={16} aria-hidden="true" /> Personalizează în Atelierul 3D
          </Link>
        </div>
        {items.length > 0 ? (
          <ul className="shop-grid shop-grid--four">
            {shown.map((item, i) => (
              <li key={item.slug}>
                <ProductCard item={item} priority={i < 4} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="shop-empty">
            <h3 className="display-font text-2xl text-espresso">Prețurile se actualizează</h3>
            <p className="mt-3">Revino în câteva minute sau spune-ne ce ai în minte și îți pregătim o ofertă.</p>
            <Link href="/cere-oferta" className="btn-warm btn-warm--primary mt-6">
              Cere ofertă <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      <section className="section-shell shop-landing__about" aria-labelledby="landing-about">
        <div className="shop-landing__text">
          <h2 id="landing-about" className="display-font shop-section-head__title">
            Cum lucrăm
          </h2>
          {landing.intro.slice(1).map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p className="shop-landing__materials-title">Despre materiale și feronerie:</p>
          <ul className="shop-landing__materials">
            {landing.materials.map((m) => (
              <li key={m.href}>
                <Link href={m.href} className="shop-matlink">
                  {m.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="shop-landing__faq">
          <h2 className="display-font shop-section-head__title">Întrebări frecvente</h2>
          {landing.faq.map((f) => (
            <details key={f.question} className="shop-faq">
              <summary>
                {f.question}
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <p>{f.answer}</p>
            </details>
          ))}
          <p className="shop-landing__more">
            Alte întrebări?{" "}
            <Link href="/intrebari-frecvente" className="shop-matlink">
              Vezi toate răspunsurile
            </Link>{" "}
            sau{" "}
            <Link href="/contact" className="shop-matlink">
              scrie-ne
            </Link>
            .
          </p>
        </div>
      </section>

      <nav className="section-shell shop-landing__nav" aria-label="Mai mult din magazin">
        {siblings(landing)
          .filter((g) => g.links.length > 0)
          .map((g) => (
            <div key={g.title}>
              <h2 className="shop-details__title">{g.title}</h2>
              <ul className="shop-landing__chips">
                {g.links.map((l) => (
                  <li key={l.path}>
                    <Link href={l.path} className="shop-opt">
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </nav>

      <section className="shop-custom">
        <div className="section-shell shop-custom__inner">
          <div>
            <p className="eyebrow-warm">Nu e exact ce cauți?</p>
            <h2 className="display-font shop-section-head__title">Pornește de la orice model și fă-l pe măsura ta</h2>
            <p className="shop-section-head__note">
              În Atelierul 3D schimbi lățimea, înălțimea, interiorul, ușile, mânerele și culorile, iar prețul se schimbă pe loc.
            </p>
          </div>
          <Link href="/configurator" className="btn-warm btn-warm--primary">
            Personalizează în Atelierul 3D <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}

/**
 * The products of a landing page, every colour priced (same pipeline as /magazin). `available` counts the
 * products the CRM can build now (before hiding unpriced ones), the same count the sitemap uses; null when
 * the CRM catalog cannot be read (the page then shows „Prețurile se actualizează" instead of a 404).
 */
export async function getLandingItems(landing: ShopLanding): Promise<{ items: ShopItem[]; available: number | null }> {
  const { items, catalog } = await getShopItems();
  if (!catalog) return { items: [], available: null };
  const mine = items.filter((i) => onLanding(landing, i));
  return { items: await withAllPrices(mine), available: mine.length };
}

/** Links from /magazin to every room and kind-of-furniture page (crawlable; the filters below stay as they are). */
export function LandingLinks() {
  const groups = [
    { id: "magazin-camere", title: "Alege după cameră", links: roomLandings() },
    { id: "magazin-feluri", title: "Alege după felul mobilierului", links: categoryLandings() },
  ];
  return (
    <nav className="section-shell shop-landing__nav shop-landing__nav--top" aria-label="Magazinul pe camere și pe feluri de mobilier">
      {groups.map((g) => (
        <div key={g.id}>
          <h2 id={g.id} className="shop-details__title">
            {g.title}
          </h2>
          <ul className="shop-landing__chips" aria-labelledby={g.id}>
            {g.links.map((l) => (
              <li key={l.path}>
                <Link href={l.path} className="shop-opt">
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
