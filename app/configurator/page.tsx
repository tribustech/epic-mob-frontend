import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AtelierConfigurator } from "@/components/atelier/atelier-configurator";
import { getAtelierCatalog } from "@/lib/atelier/crm";
import { publicCatalog } from "@/lib/atelier/public-catalog";
import { baseOpenGraph } from "@/lib/seo";

// The catalog comes from the CRM (cached 10 minutes); regenerate on the same cadence
// so a page built while the CRM was unreachable recovers on its own.
export const revalidate = 600;

const TITLE = "Atelier 3D — configurează-ți mobilierul | Epic Mob";
const DESCRIPTION =
  "Configurează-ți în 3D dressingul, comoda, separatorul, corpurile suspendate, bucătăria sau mobilierul de baie: dimensiuni, coloane și materiale, cu preț estimativ pe loc. Trimite configurația și venim la măsurători.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/configurator" },
  openGraph: {
    ...baseOpenGraph,
    title: TITLE,
    description: DESCRIPTION,
    url: "/configurator",
  },
};

function CatalogUnavailable() {
  return (
    <section className="home-shell py-12 sm:py-20">
      <div className="atelier-panel mx-auto max-w-2xl text-center">
        <h1 className="atelier-panel__title">Atelierul 3D se odihnește puțin</h1>
        <p className="mt-3 text-base text-[var(--home-ivory)]/70">
          Configuratorul nu este disponibil chiar acum. Spune-ne ce ai în minte și îți pregătim o ofertă
          personalizată.
        </p>
        <Link href="/cere-oferta" className="portfolio-btn portfolio-btn--primary mt-6">
          Cere ofertă
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export default async function ConfiguratorPage() {
  const raw = await getAtelierCatalog();
  const catalog = raw ? publicCatalog(raw) : null;

  // The tool starts right under the site header (its compact <h1> lives in the panel).
  return (
    <main className="atelier-page">{catalog ? <AtelierConfigurator catalog={catalog} /> : <CatalogUnavailable />}</main>
  );
}
