import { PortfolioHero } from "@/components/portfolio/portfolio-hero";
import { PortfolioFilters } from "@/components/portfolio/portfolio-filters";
import { PortfolioChapterDivider } from "@/components/portfolio/portfolio-chapter-divider";
import { PortfolioScene } from "@/components/portfolio/portfolio-scene";
import { PortfolioFinalCta } from "@/components/portfolio/portfolio-final-cta";
import { portfolioChapters, portfolioStats } from "@/lib/portfolio-data";

export default function PortfolioPage() {
  const totalShown = portfolioChapters.reduce(
    (n, chapter) => n + chapter.projects.length,
    0
  );

  return (
    <main className="bg-[var(--home-black)] text-[var(--home-ivory)]">
      <PortfolioHero stats={portfolioStats} />
      <PortfolioFilters
        totalShown={totalShown}
        totalProjects={portfolioStats.totalProjects}
      />
      {portfolioChapters.map((chapter) => (
        <section key={chapter.id} aria-labelledby={`chapter-${chapter.id}`}>
          <PortfolioChapterDivider chapter={chapter} />
          {chapter.projects.map((project, i) => (
            <PortfolioScene
              key={project.slug}
              project={project}
              totalProjects={totalShown}
              reverse={i % 2 === 1}
            />
          ))}
        </section>
      ))}
      <PortfolioFinalCta
        unshownCount={portfolioStats.totalProjects - totalShown}
      />
    </main>
  );
}
