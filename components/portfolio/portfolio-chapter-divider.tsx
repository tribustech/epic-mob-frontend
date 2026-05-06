import type { PortfolioChapter } from "@/lib/portfolio-data";

type PortfolioChapterDividerProps = {
  chapter: PortfolioChapter;
};

export function PortfolioChapterDivider({ chapter }: PortfolioChapterDividerProps) {
  return (
    <div className="portfolio-chapter">
      <div className="portfolio-shell">
        <div className="portfolio-chapter__line">Capitolul {chapter.number}</div>
        <h3
          id={`chapter-${chapter.id}`}
          className="portfolio-chapter__title"
          dangerouslySetInnerHTML={{ __html: chapter.title }}
        />
        <p className="portfolio-chapter__desc">{chapter.description}</p>
      </div>
    </div>
  );
}
