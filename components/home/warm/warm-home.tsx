import { WarmHero } from "@/components/home/warm/warm-hero";
import { WarmCategories } from "@/components/home/warm/warm-categories";
import { WarmBento } from "@/components/home/warm/warm-bento";
import { WarmJourney } from "@/components/home/warm/warm-journey";
import { WarmFeatured } from "@/components/home/warm/warm-featured";
import { WarmFinalCta } from "@/components/home/warm/warm-final-cta";
import { WarmTabbar } from "@/components/home/warm/warm-tabbar";

export function WarmHome() {
  return (
    <>
      <main className="home-warm">
        <WarmHero />
        <WarmCategories />
        <WarmBento />
        <WarmJourney />
        <WarmFeatured />
        <WarmFinalCta />
      </main>
      <WarmTabbar />
    </>
  );
}
