import type { Metadata } from "next";
import { QuoteWizard } from "@/components/configurator/wizard/quote-wizard";

export const metadata: Metadata = {
  title: "Cere oferta — EpicMob",
  description:
    "Raspunde la cateva intrebari simple si iti pregatim o oferta personalizata pentru mobilierul tau.",
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
