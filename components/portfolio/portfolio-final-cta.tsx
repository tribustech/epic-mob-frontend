import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { contactDetails } from "@/lib/site-data";

export function PortfolioFinalCta() {
  return (
    <section className="bg-espresso">
      <div className="section-shell py-24 text-center sm:py-28">
        <p className="eyebrow-warm">Restul portofoliului</p>
        <h2 className="display-font mx-auto mt-5 max-w-3xl text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] text-cream">
          Fiecare proiect are o poveste pe care o spunem în atelier.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-cream/70">
          Programează o vizită și îți arătăm fizic mostre, fronturi probă și
          feronerie Blum — sau trimite-ne camerele și îți pregătim o ofertă,
          fără obligații.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/contact" className="btn-warm btn-warm--primary">
            Cere o ofertă
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
          <a
            href={contactDetails.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="btn-warm btn-warm--whatsapp"
          >
            <WhatsAppIcon size={18} />
            Scrie-ne pe WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
