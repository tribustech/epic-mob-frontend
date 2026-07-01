import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { materials } from "@/lib/materials-data";
import { hardware } from "@/lib/hardware-data";
import { handles } from "@/lib/handle-data";
import { leds } from "@/lib/led-data";
import { MaterialCard } from "@/components/materials/material-card";
import { HardwareCard } from "@/components/materials/hardware-card";
import { HandleCard } from "@/components/materials/handle-card";
import { LedCard } from "@/components/materials/led-card";

export const metadata: Metadata = {
  title: "Materiale & accesorii",
  description:
    "Din ce construim mobila ta: lemnul (PAL melaminat, MDF melaminat, înfoliat, vopsit), feroneria Blum, tipurile de mânere și iluminatul LED — explicate pe înțelesul tău.",
  alternates: { canonical: "/materiale" },
  openGraph: {
    title: "Materiale & accesorii EpicMob",
    description:
      "Lemnul, feroneria, mânerele și iluminatul LED din care construim mobila la comandă.",
    url: "/materiale",
    type: "website",
    images: [{ url: "/materials/pal-01.webp", alt: "Materiale EpicMob" }],
  },
};

export default function MaterialePage() {
  return (
    <main className="bg-sand text-espresso">
      {/* Hero */}
      <section className="section-shell pt-28 pb-6 sm:pt-32 lg:pt-36">
        <p className="eyebrow-warm">Materiale &amp; accesorii</p>
        <h1 className="display-font mt-4 max-w-4xl text-[clamp(2.5rem,6vw,5rem)] leading-[1.02] text-espresso">
          Din ce e făcută mobila ta.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-espresso/70">
          Lemnul, feroneria, mânerele și lumina — fiecare piesă schimbă felul în
          care arată, ține și se folosește mobila. Îți arătăm pe toate, pe
          înțelesul tău.
        </p>
      </section>

      {/* Lemn */}
      <section className="section-shell scroll-mt-28 pb-4" id="lemn" aria-labelledby="lemn-title">
        <div className="material-cathead">
          <div>
            <p className="eyebrow-warm">Lemn</p>
            <h2 id="lemn-title" className="display-font mt-3 text-3xl leading-tight text-espresso sm:text-4xl">
              Patru materiale, patru caractere
            </h2>
          </div>
          <p className="material-cathead__note">
            Fiecare cu locul lui. Apasă pe un material pentru structură, plusuri și
            minusuri și recomandări.
          </p>
        </div>

        <div className="material-grid mt-10">
          {materials.map((mat) => (
            <MaterialCard key={mat.slug} material={mat} />
          ))}
        </div>
      </section>

      {/* Feronerie */}
      <section className="section-shell scroll-mt-28 pb-4 pt-16" id="feronerie" aria-labelledby="feronerie-title">
        <div className="material-cathead">
          <div>
            <p className="eyebrow-warm">Feronerie</p>
            <h2
              id="feronerie-title"
              className="display-font mt-3 text-3xl leading-tight text-espresso sm:text-4xl"
            >
              Mișcarea care face diferența
            </h2>
          </div>
          <p className="material-cathead__note">
            Lucrăm cu feronerie <strong>Blum</strong> — sertare, balamale și
            mecanisme care se mișcă lin ani la rând.
          </p>
        </div>

        <div className="hardware-grid mt-10">
          {hardware.map((item) => (
            <HardwareCard key={item.slug} item={item} />
          ))}
        </div>
      </section>

      {/* Mânere */}
      <section className="section-shell scroll-mt-28 pb-4 pt-16" id="manere" aria-labelledby="manere-title">
        <div className="material-cathead">
          <div>
            <p className="eyebrow-warm">Mânere</p>
            <h2
              id="manere-title"
              className="display-font mt-3 text-3xl leading-tight text-espresso sm:text-4xl"
            >
              Cum deschizi contează
            </h2>
          </div>
          <p className="material-cathead__note">
            De la bara clasică aplicată la fronturi complet fără mâner — fiecare tip
            schimbă complet felul în care arată și se folosește mobila.
          </p>
        </div>

        <div className="hardware-grid mt-10">
          {handles.map((item) => (
            <HandleCard key={item.slug} item={item} />
          ))}
        </div>
      </section>

      {/* Iluminat LED */}
      <section className="section-shell scroll-mt-28 pb-4 pt-16" id="iluminat" aria-labelledby="iluminat-title">
        <div className="material-cathead">
          <div>
            <p className="eyebrow-warm">Iluminat LED</p>
            <h2
              id="iluminat-title"
              className="display-font mt-3 text-3xl leading-tight text-espresso sm:text-4xl"
            >
              Lumina potrivită, comandată cum vrei
            </h2>
          </div>
          <p className="material-cathead__note">
            Bandă în profil de aluminiu mascat (linie continuă, fără puncte), în alb
            cald, neutru sau RGB. Ce diferă cel mai mult e felul în care o aprinzi.
          </p>
        </div>

        <div className="hardware-grid mt-10">
          {leds.map((item) => (
            <LedCard key={item.slug} item={item} />
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="section-shell pb-24 pt-16">
        <div className="rounded-[2rem] border border-[var(--line)] bg-cream px-8 py-12 text-center shadow-[var(--shadow-warm)] sm:px-12 sm:py-16">
          <h2 className="display-font text-3xl leading-tight text-espresso sm:text-4xl">
            Nu ești sigur ce ți se potrivește?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-espresso/70">
            Spune-ne despre proiectul tău și îți recomandăm materialul și feroneria
            potrivite pentru fiecare corp — în funcție de cameră, buget și stil.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/configurator" className="btn-warm btn-warm--primary">
              Cere o ofertă
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
            <Link href="/portfolio" className="btn-warm btn-warm--ghost">
              Vezi proiecte realizate
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
