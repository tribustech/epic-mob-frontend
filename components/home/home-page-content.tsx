import { ImmersiveFinalCta } from "@/components/home/immersive-final-cta";
import { MaterialPinnedScene } from "@/components/home/material-pinned-scene";
import { ProjectIndex } from "@/components/home/project-index";
import { StickyProcess } from "@/components/home/sticky-process";

export function HomePageContent() {
  return (
    <main className="home-immersive">
      <MaterialPinnedScene />
      <ProjectIndex />
      <StickyProcess />
      <ImmersiveFinalCta />
    </main>
  );
}
