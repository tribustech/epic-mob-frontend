import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const specs = [
  { label: "Material", value: "MDF vopsit RAL custom" },
  { label: "Feronerie", value: "Blum Movento + Aventos" },
  { label: "Predat", value: "9 săptămâni" },
];

export function WarmFeatured() {
  return (
    <section className="bg-clay">
      <div className="section-shell grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <div className="relative order-last aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[var(--shadow-warm)] lg:order-first">
          <Image
            src="/portfolio/00-kitchen-ornate-navy-full.jpg"
            alt="Bucătărie Kensington navy cu front sculptat și insulă"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="max-w-lg">
          <p className="eyebrow-warm">Proiect în prim-plan · Bucătărie 2025</p>
          <h2 className="display-font mt-4 text-4xl leading-tight text-espresso sm:text-5xl">
            Kensington navy
          </h2>
          <p className="mt-5 text-lg leading-8 text-espresso/70">
            Front sculptat în MDF vopsit, profilatură clasică și o insulă în stil
            englez — cu electrocasnicele ascunse într-o coloană de servire și
            depozitare dublată printr-un dulap mascat în coridor.
          </p>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-[var(--line)] pt-6">
            {specs.map((spec) => (
              <div key={spec.label}>
                <dt className="text-xs uppercase tracking-[0.2em] text-espresso/45">
                  {spec.label}
                </dt>
                <dd className="mt-1.5 text-sm font-semibold text-espresso">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>

          <Link
            href="/portfolio/kensington-navy"
            className="btn-warm btn-warm--primary mt-9"
          >
            Detalii proiect
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
