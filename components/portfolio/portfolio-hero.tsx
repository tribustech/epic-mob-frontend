type PortfolioHeroProps = {
  stats: {
    totalProjects: number;
    yearsInOperation: number;
    blumPercentage: number;
    averageDeliveryWeeks: number;
  };
};

export function PortfolioHero({ stats }: PortfolioHeroProps) {
  return (
    <section className="portfolio-hero">
      <div className="portfolio-shell portfolio-hero__shell">
        <div className="portfolio-hero__meta">
          <span className="portfolio-hero__meta-rule" aria-hidden />
          2019 — 2026 · {stats.totalProjects} proiecte
        </div>
        <h1 className="portfolio-hero__title">
          Lucrari care
          <br />
          <em>traiesc</em> deja.
        </h1>
        <p className="portfolio-hero__lede">
          Fotografii reale, fara randari. Fiecare proiect e o discutie despre
          cum se foloseste casa, ce contrazice planul si ce ramane peste 10 ani.
        </p>
        <div className="portfolio-hero__stats">
          <div>
            <div className="portfolio-hero__stat-num">{stats.totalProjects}</div>
            <div className="portfolio-hero__stat-label">
              Proiecte
              <br />
              finalizate
            </div>
          </div>
          <div>
            <div className="portfolio-hero__stat-num">
              {stats.yearsInOperation}
              <em>+</em>
            </div>
            <div className="portfolio-hero__stat-label">
              Ani de
              <br />
              atelier
            </div>
          </div>
          <div>
            <div className="portfolio-hero__stat-num">{stats.blumPercentage}%</div>
            <div className="portfolio-hero__stat-label">
              Feronerie
              <br />
              Blum
            </div>
          </div>
          <div>
            <div className="portfolio-hero__stat-num">
              {stats.averageDeliveryWeeks} spt
            </div>
            <div className="portfolio-hero__stat-label">
              Predare
              <br />
              medie
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
