import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { faqItems } from "@/lib/faq-data";
import { JsonLd, buildBreadcrumbSchema } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/business-data";

export const metadata: Metadata = {
  title: "Întrebări frecvente — Epic Mob",
  description:
    "Răspunsuri la întrebările frecvente despre mobilierul la comandă Epic Mob: preț, termene, garanție, montaj, materiale, plată și cum ceri o ofertă.",
  alternates: { canonical: "/intrebari-frecvente" },
  openGraph: {
    title: "Întrebări frecvente — Epic Mob",
    description:
      "Preț, termene, garanție, montaj, materiale și plată — pe scurt, la mobilierul la comandă Epic Mob.",
    url: "/intrebari-frecvente",
    type: "website",
  },
};

// FAQPage schema built from the same source as the visible content below, so
// what search engines and LLMs read matches what users see (a Google rule).
const faqPageSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  url: `${SITE_URL}/intrebari-frecvente`,
  inLanguage: "ro",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: "Acasă", path: "/" },
  { name: "Întrebări frecvente", path: "/intrebari-frecvente" },
]);

export default function FaqPage() {
  return (
    <main className="bg-sand text-espresso">
      <JsonLd data={faqPageSchema} />
      <JsonLd data={breadcrumbSchema} />

      <section className="section-shell pt-28 pb-10 sm:pt-32 lg:pt-36">
        <p className="eyebrow-warm">Întrebări frecvente</p>
        <h1 className="display-font mt-4 max-w-4xl text-[clamp(2.5rem,6vw,5rem)] leading-[1.02] text-espresso">
          Ce vrei să știi, pe scurt.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-espresso/70">
          Preț, termene, garanție, montaj și materiale — răspunsurile la
          întrebările pe care ni le pun cel mai des. Nu găsești ce cauți?
          Scrie-ne, îți răspundem repede.
        </p>
      </section>

      <section className="section-shell pb-16">
        <dl className="mx-auto max-w-3xl divide-y divide-espresso/10 border-y border-espresso/10">
          {faqItems.map((item) => (
            <details key={item.question} className="group py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-semibold text-espresso [&::-webkit-details-marker]:hidden">
                <dt>{item.question}</dt>
                <Plus
                  size={22}
                  strokeWidth={2}
                  className="shrink-0 text-terracotta transition-transform duration-200 group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <dd className="max-w-2xl pb-5 pr-10 text-base leading-8 text-espresso/70">
                {item.answer}
              </dd>
            </details>
          ))}
        </dl>
      </section>

      <section className="section-shell pb-24">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 rounded-[2rem] bg-cream p-8 shadow-[var(--shadow-warm)] sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <p className="display-font text-2xl text-espresso sm:text-3xl">
              Ai un proiect în minte?
            </p>
            <p className="mt-2 max-w-md text-espresso/70">
              Primești o ofertă personalizată, gratuit, în câțiva pași simpli.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/configurator" className="btn-warm btn-warm--primary">
              Cere ofertă
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
            <Link href="/contact" className="btn-warm btn-warm--ghost">
              Contact
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
