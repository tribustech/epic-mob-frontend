import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function WarmFinalCta() {
  return (
    <section className="bg-espresso">
      <div className="section-shell py-24 text-center sm:py-28">
        <p className="eyebrow-warm">Următorul pas</p>
        <h2 className="display-font mx-auto mt-5 max-w-3xl text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] text-cream">
          Gata să-ți vezi camera?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-cream/70">
          Trimite-ne camerele și stilul dorit. Venim la măsurători și îți
          pregătim o ofertă detaliată, fără obligații.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/contact" className="btn-warm btn-warm--primary">
            Cere o ofertă
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
          <Link href="/portfolio" className="btn-warm btn-warm--ghost-invert">
            Vezi portofoliul
          </Link>
        </div>
      </div>
    </section>
  );
}
