import type { Metadata } from "next";
import { QuoteWizard } from "@/components/configurator/wizard/quote-wizard";

export const metadata: Metadata = {
  title: "Cere ofertă — EpicMob",
  description:
    "Răspunde la câteva întrebări simple și îți pregătim o ofertă personalizată pentru mobilierul tău.",
};

export default function ConfiguratorPage() {
  return (
    <main className="min-h-screen bg-cream">
      <section className="section-shell pb-24 pt-5 sm:pt-12">
        <QuoteWizard />
      </section>
    </main>
  );
}
