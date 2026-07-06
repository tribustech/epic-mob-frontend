import type { Metadata } from "next";
import { PortfolioHero } from "@/components/portfolio/portfolio-hero";
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import { PortfolioFinalCta } from "@/components/portfolio/portfolio-final-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { allPortfolioProjects } from "@/lib/portfolio-data";
import { SITE_URL } from "@/lib/business-data";

// Plain-text titles for the ItemList (project titles carry inline HTML).
const plainText = (value: string) =>
  value.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Portofoliu Epic Mob",
  itemListElement: allPortfolioProjects.map((project, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `${SITE_URL}/portfolio/${project.slug}`,
    name: plainText(project.title).replace(/\.$/, ""),
  })),
};

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
      <JsonLd data={itemListSchema} />
      <PortfolioHero />
      <PortfolioGrid activeCat={cat} />
      <PortfolioFinalCta />
    </main>
  );
}
