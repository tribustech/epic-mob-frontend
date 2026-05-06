import Image from "next/image";
import Link from "next/link";
import type { PortfolioProject } from "@/lib/portfolio-data";

type PortfolioSceneProps = {
  project: PortfolioProject;
  totalProjects: number;
  reverse?: boolean;
};

export function PortfolioScene({
  project,
  totalProjects,
  reverse = false,
}: PortfolioSceneProps) {
  const indexLabel = `${String(project.index).padStart(2, "0")} din ${totalProjects}`;
  const numeralLabel = String(project.index).padStart(2, "0");

  return (
    <section
      className={`portfolio-scene${reverse ? " portfolio-scene--reverse" : ""}`}
      data-category={project.category}
    >
      <div className="portfolio-shell">
        <div className="portfolio-scene__grid">
          <div className="portfolio-scene__image">
            <span className="portfolio-scene__badge">{project.badge}</span>
            <Image
              src={project.image.src}
              alt={project.image.alt}
              fill
              sizes="(max-width: 980px) 100vw, 50vw"
              className="portfolio-scene__image-media"
            />
            <span className="portfolio-scene__number" aria-hidden>
              {numeralLabel}
            </span>
          </div>
          <div className="portfolio-scene__text">
            <div className="portfolio-scene__index">Proiect / {indexLabel}</div>
            <h2
              className="portfolio-scene__title"
              dangerouslySetInnerHTML={{ __html: project.title }}
            />
            <p className="portfolio-scene__lede">{project.lede}</p>
            <p
              className="portfolio-scene__body"
              dangerouslySetInnerHTML={{ __html: project.body }}
            />
            <ul className="portfolio-scene__specs">
              {project.specs.map((spec) => (
                <li key={spec.label}>
                  <b>{spec.label}</b>
                  {spec.value}
                </li>
              ))}
            </ul>
            <Link
              href={`/portfolio/${project.slug}`}
              className="portfolio-scene__cta"
            >
              Vezi studiul de caz →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
