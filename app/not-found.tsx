import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Pagina nu există",
  description: "Pagina pe care o cauți nu există sau a fost mutată.",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="bg-sand text-espresso">
      <section className="section-shell pt-28 pb-24 sm:pt-32 lg:pt-36">
        <p className="eyebrow-warm">Eroare 404</p>
        <h1 className="display-font mt-4 max-w-4xl text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] text-espresso">
          Pagina nu există
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-espresso/70">
          Poate linkul e greșit sau pagina a fost mutată. Uite de unde poți
          continua:
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/magazin" className="btn-warm btn-warm--primary">
            Vezi Magazinul
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
          <Link href="/configurator" className="btn-warm btn-warm--ghost">
            Atelier 3D
          </Link>
          <Link href="/cere-oferta" className="btn-warm btn-warm--ghost">
            Cere ofertă
          </Link>
          <Link href="/" className="btn-warm btn-warm--ghost">
            Prima pagină
          </Link>
        </div>
      </section>
    </main>
  );
}
