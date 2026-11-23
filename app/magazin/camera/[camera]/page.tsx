import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingView, getLandingItems } from "@/components/shop/landing-view";
import { MIN_LANDING_PRODUCTS, landingImage, roomLandingBySlug, roomLandings } from "@/lib/shop/landing";
import { baseOpenGraph } from "@/lib/seo";

// prices come from the CRM (cached 10 minutes), like /magazin
export const revalidate = 600;
// only the rooms listed below: any other /magazin/camera/<x> is a 404
export const dynamicParams = false;

export function generateStaticParams() {
  return roomLandings().map((l) => ({ camera: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ camera: string }> }): Promise<Metadata> {
  const landing = roomLandingBySlug((await params).camera);
  if (!landing) return {};
  const image = landingImage(landing);
  return {
    title: { absolute: landing.title },
    description: landing.description,
    alternates: { canonical: landing.path },
    openGraph: { ...baseOpenGraph, title: landing.title, description: landing.description, url: landing.path, ...(image ? { images: [image] } : {}) },
  };
}

export default async function RoomPage({ params }: { params: Promise<{ camera: string }> }) {
  const landing = roomLandingBySlug((await params).camera);
  if (!landing) notFound();
  const { items, available } = await getLandingItems(landing);
  if (available != null && available < MIN_LANDING_PRODUCTS) notFound();
  return <LandingView landing={landing} items={items} />;
}
