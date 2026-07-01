import { portfolioStats } from "@/lib/portfolio-data";

const stats = [
  { num: `${portfolioStats.totalProjects}`, label: "Proiecte\nfinalizate" },
  { num: `${portfolioStats.yearsInOperation}+`, label: "Ani de\natelier" },
  { num: `${portfolioStats.blumPercentage}%`, label: "Feronerie\nBlum" },
  { num: `${portfolioStats.averageDeliveryWeeks} spt`, label: "Predare\nmedie" },
];

export function PortfolioHero() {
  return (
    <section className="bg-clay">
      <div className="section-shell py-20 sm:py-24 lg:py-28">
        <p className="eyebrow-warm">Portofoliu · 2019 — 2026</p>
        <h1 className="display-font mt-5 max-w-4xl text-[clamp(2.75rem,6vw,5rem)] leading-[1.02] text-espresso">
          Lucrări care <em className="text-terracotta not-italic">trăiesc</em> deja.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-espresso/70">
          Proiecte reale, gândite pentru felul în care se folosește casa. Fiecare
          are o decizie incomodă care a schimbat direcția — și un detaliu care
          rămâne frumos peste 10 ani.
        </p>

        <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-[var(--line)] pt-10 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="display-font text-[clamp(2.25rem,4vw,3rem)] leading-none text-espresso">
                {stat.num}
              </dt>
              <dd className="mt-3 whitespace-pre-line text-xs uppercase tracking-[0.2em] text-espresso/45">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
