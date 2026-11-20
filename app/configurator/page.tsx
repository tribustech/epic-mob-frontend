import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AtelierConfigurator } from "@/components/atelier/atelier-configurator";
import { getAtelierCatalog } from "@/lib/atelier/crm";
import type { AtelierCatalog, AtelierMaterial } from "@/lib/atelier/types";

// The catalog comes from the CRM (cached 10 minutes); regenerate on the same cadence
// so a page built while the CRM was unreachable recovers on its own.
export const revalidate = 600;

const TITLE = "Atelier 3D — configurează-ți mobilierul | EpicMob";
const DESCRIPTION =
  "Configurează-ți în 3D dressingul, comoda, separatorul sau corpurile suspendate: dimensiuni, coloane și materiale, cu preț estimativ pe loc. Trimite configurația și venim la măsurători.";

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

/** Only the public fields reach the client bundle / RSC payload, whatever else the CRM sends. */
function publicCatalog(catalog: AtelierCatalog): AtelierCatalog {
  const material = (m: AtelierMaterial): AtelierMaterial => ({
    id: m.id,
    name: m.name,
    decorCode: m.decorCode ?? null,
    brand: m.brand ?? null,
    imageUrl: m.imageUrl ?? null,
  });
  return {
    carcass: (catalog.carcass ?? []).map(material),
    fronts: {
      PAL: (catalog.fronts?.PAL ?? []).map(material),
      MDF_MELAMINAT: (catalog.fronts?.MDF_MELAMINAT ?? []).map(material),
      MDF_VOPSIT: (catalog.fronts?.MDF_VOPSIT ?? []).map((m) => ({ id: m.id, name: m.name })),
    },
    ral: (catalog.ral ?? []).map((r) => ({ code: r.code, name: r.name, hex: r.hex })),
    handles: { types: (catalog.handles?.types ?? []).map((t) => ({ type: t.type, label: t.label })) },
  };
}

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
