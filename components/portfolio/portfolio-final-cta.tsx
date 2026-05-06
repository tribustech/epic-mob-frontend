import Link from "next/link";

type PortfolioFinalCtaProps = {
  unshownCount: number;
};

export function PortfolioFinalCta({ unshownCount }: PortfolioFinalCtaProps) {
  return (
    <section className="portfolio-final">
      <div className="portfolio-shell">
        <p className="eyebrow portfolio-final__eyebrow">Restul portofoliului</p>
        <h2 className="portfolio-final__title">
          Cele {unshownCount} de proiecte
          <br />
          care nu <em>au incaput</em> aici.
        </h2>
        <p className="portfolio-final__lede">
          Fiecare proiect are o poveste pe care o spunem doar in atelier.
          Programeaza o vizita si iti aratam fizic mostre, fronturi proba si
          feronerie.
        </p>
        <div className="portfolio-final__ctas">
          <Link href="/contact" className="portfolio-btn portfolio-btn--primary">
            Programeaza vizita
          </Link>
          <Link
            href="/configurator"
            className="portfolio-btn portfolio-btn--secondary"
          >
            Cere oferta →
          </Link>
        </div>
      </div>
    </section>
  );
}
