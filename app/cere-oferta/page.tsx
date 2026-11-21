import type { Metadata } from "next";
import { QuoteWizard } from "@/components/configurator/wizard/quote-wizard";
import { baseOpenGraph } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Cere ofertă",
  description:
    "Răspunde la câteva întrebări simple și îți pregătim o ofertă personalizată pentru mobilierul tău.",
  alternates: { canonical: "/cere-oferta" },
  openGraph: {
    ...baseOpenGraph,
    title: "Cere ofertă | Epic Mob",
    description:
      "Răspunde la câteva întrebări simple și îți pregătim o ofertă personalizată pentru mobilierul tău.",
    url: "/cere-oferta",
  },
};

export default function CereOfertaPage() {
  return (
    <main className="min-h-screen bg-cream">
      <section className="section-shell pb-24 pt-5 sm:pt-12">
        <QuoteWizard />
      </section>
    </main>
  );
}
