import type { Metadata } from "next";
import { WarmHome } from "@/components/home/warm/warm-home";
import { baseOpenGraph } from "@/lib/seo";

// the shop section shows live prices and offers (CRM, cached 10 minutes)
export const revalidate = 600;

export const metadata: Metadata = {
  // Home uses the full brand as the title rather than the "%s | Epic Mob"
  // template, so the tab and search result lead with the atelier name.
  title: "Epic Mob Atelier — Mobilier la comandă",
  description:
    "Atelier de mobilier premium la comandă: bucătării, dressinguri, living și băi. Consultanță, proiectare 3D și execuție cap-coadă cu feronerie Blum și montaj inclus, în toată țara.",
  alternates: { canonical: "/" },
  openGraph: {
    ...baseOpenGraph,
    title: "Epic Mob Atelier — Mobilier la comandă",
    description:
      "Bucătării, dressinguri, living și băi la comandă. Feronerie Blum, montaj inclus, execuție cap-coadă în toată țara.",
    url: "/",
  },
};

export default function Home() {
  return <WarmHome />;
}
