import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingView, getLandingItems } from "@/components/shop/landing-view";
import { MIN_LANDING_PRODUCTS, landingImage, categoryLandingBySlug, categoryLandings } from "@/lib/shop/landing";
import { baseOpenGraph } from "@/lib/seo";

// prices come from the CRM (cached 10 minutes), like /magazin
export const revalidate = 600;
// only the kinds of furniture listed below: any other /magazin/categorie/<x> is a 404
export const dynamicParams = false;

export function generateStaticParams() {
  return categoryLandings().map((l) => ({ categorie: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ categorie: string }> }): Promise<Metadata> {
  const landing = categoryLandingBySlug((await params).categorie);
  if (!landing) return {};
  const image = landingImage(landing);
  return {
    title: { absolute: landing.title },
    description: landing.description,
    alternates: { canonical: landing.path },
    openGraph: { ...baseOpenGraph, title: landing.title, description: landing.description, url: landing.path, ...(image ? { images: [image] } : {}) },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ categorie: string }> }) {
  const landing = categoryLandingBySlug((await params).categorie);
  if (!landing) notFound();
  const { items, available } = await getLandingItems(landing);
  if (available != null && available < MIN_LANDING_PRODUCTS) notFound();
  return <LandingView landing={landing} items={items} />;
}
