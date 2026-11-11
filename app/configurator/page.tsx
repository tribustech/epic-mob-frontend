import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AtelierConfigurator } from "@/components/atelier/atelier-configurator";
import { getAtelierCatalog } from "@/lib/atelier/crm";

// The catalog comes from the CRM (cached 10 minutes); regenerate on the same cadence
// so a page built while the CRM was unreachable recovers on its own.
export const revalidate = 600;

const TITLE = "Atelier 3D — configurează-ți dressingul | EpicMob";
const DESCRIPTION =
  "Configurează-ți dressingul în 3D: dimensiuni, coloane, materiale și uși glisante, cu preț estimativ pe loc. Trimite configurația și venim la măsurători.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/configurator" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/configurator",
    type: "website",
  },
};

function CatalogUnavailable() {
  return (
    <div className="atelier-panel mx-auto max-w-2xl text-center">
      <h2 className="atelier-panel__title">Atelierul 3D se odihnește puțin</h2>
      <p className="mt-3 text-[var(--home-ivory)]/70">
        Configuratorul nu este disponibil chiar acum. Spune-ne ce ai în minte și îți pregătim o ofertă
        personalizată.
      </p>
      <Link href="/cere-oferta" className="portfolio-btn portfolio-btn--primary mt-6">
        Cere ofertă
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

export default async function ConfiguratorPage() {
  const catalog = await getAtelierCatalog();

  return (
    <main className="atelier-page min-h-screen">
      <section className="home-shell pb-20 pt-8 sm:pt-12">
        <header className="max-w-3xl">
          <p className="home-kicker">Atelier 3D</p>
          <h1 className="display-font mt-4 text-[clamp(2.4rem,5vw,4rem)] leading-[1.02] text-[var(--home-ivory)]">
            Configurează-ți dressingul
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--home-ivory)]/70">
            Alege dimensiunile, coloanele, materialele și ușile. Vezi modelul în 3D și prețul estimativ pe loc,
            apoi trimite-ne configurația — venim la măsurători.
          </p>
        </header>
        <div className="mt-8 sm:mt-10">
          {catalog ? <AtelierConfigurator catalog={catalog} /> : <CatalogUnavailable />}
        </div>
      </section>
    </main>
  );
}
