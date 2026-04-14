import { HomeAnimationProvider } from "@/components/home/home-animation-provider";
import { ImmersiveFinalCta } from "@/components/home/immersive-final-cta";
import { ImmersiveHero } from "@/components/home/immersive-hero";
import { IntroLoader } from "@/components/home/intro-loader";
import { MaterialPinnedScene } from "@/components/home/material-pinned-scene";
import { ProjectIndex } from "@/components/home/project-index";
import { StickyProcess } from "@/components/home/sticky-process";

export default function Home() {
  return (
    <HomeAnimationProvider>
      <main className="home-immersive">
        <IntroLoader />
        <ImmersiveHero />
        <MaterialPinnedScene />
        <ProjectIndex />
        <StickyProcess />
        <ImmersiveFinalCta />
      </main>
    </HomeAnimationProvider>
  );
}
