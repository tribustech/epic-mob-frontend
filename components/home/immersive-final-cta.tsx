import Image from "next/image";
import Link from "next/link";

export function ImmersiveFinalCta() {
  return (
    <section className="relative overflow-hidden bg-[var(--home-black)] py-24 text-[var(--home-ivory)] sm:py-32">
      <div className="home-shell grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-end">
        <div>
          <span data-home-reveal="line" className="home-line mb-10" />
          <p className="home-kicker">Gata de start?</p>
          <h2
            data-home-reveal="text"
            className="display-font mt-5 max-w-5xl text-[clamp(3.5rem,9vw,9rem)] leading-[0.88] tracking-[-0.07em]"
          >
            Hai sa construim ceva facut pentru tine.
          </h2>
          <div className="mt-10 flex flex-wrap gap-8 text-xs font-bold uppercase tracking-[0.28em]">
            <Link
              data-home-hover
              href="/configurator"
              className="text-[var(--home-orange)]"
            >
              Incepe proiectul
            </Link>
            <Link data-home-hover href="/contact">
              Contact
            </Link>
          </div>
        </div>
        <div className="relative h-[48vh] min-h-80 overflow-hidden rounded-[1.5rem]">
          <Image
            src="/portfolio/kitchen-navy-sink-wide.jpg"
            alt="Bucatarie la comanda cu finisaje premium"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
