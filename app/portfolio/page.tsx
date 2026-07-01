import type { Metadata } from "next";
import { PortfolioHero } from "@/components/portfolio/portfolio-hero";
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import { PortfolioFinalCta } from "@/components/portfolio/portfolio-final-cta";

export const metadata: Metadata = {
  title: "Portofoliu — bucătării și mobilier la comandă",
  description:
    "Proiecte reale de bucătării, living și mobilier la comandă: MDF vopsit, PAL, feronerie Blum și montaj complet. Vezi lucrările Epic Mob pe camere.",
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;

  return (
    <main className="bg-sand text-espresso">
      <PortfolioHero />
      <PortfolioGrid activeCat={cat} />
      <PortfolioFinalCta />
    </main>
  );
}
