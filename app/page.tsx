import { HomeAnimationProvider } from "@/components/home/home-animation-provider";
import { HomePageContent } from "@/components/home/home-page-content";

export default function Home() {
  return (
    <HomeAnimationProvider>
      <HomePageContent />
    </HomeAnimationProvider>
  );
}
