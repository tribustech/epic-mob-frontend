import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { portfolioChapters } from "@/lib/portfolio-data";

export function generateStaticParams() {
  return portfolioChapters.flatMap((chapter) =>
    chapter.projects.map((project) => ({ slug: project.slug }))
  );
}

export default async function PortfolioCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = portfolioChapters
    .flatMap((chapter) => chapter.projects)
    .find((p) => p.slug === slug);

  if (!project) notFound();

  return (
    <main className="bg-[var(--home-black)] text-[var(--home-ivory)]">
      <article className="portfolio-shell" style={{ padding: "140px 0" }}>
        <Link
          href="/portfolio"
          className="portfolio-scene__cta"
          style={{ marginBottom: 40 }}
        >
          ← Inapoi la portofoliu
        </Link>
        <div className="portfolio-scene__index" style={{ marginTop: 40 }}>
          {project.badge}
        </div>
        <h1
          className="portfolio-hero__title"
          style={{ fontSize: "clamp(48px, 6vw, 96px)", marginBottom: 28 }}
          dangerouslySetInnerHTML={{ __html: project.title }}
        />
        <p
          className="portfolio-scene__lede"
          style={{ maxWidth: "60ch", fontSize: 19 }}
        >
          {project.lede}
        </p>
        <div
          className="portfolio-scene__image"
          style={{ marginTop: 48, aspectRatio: "16 / 10", maxWidth: 960 }}
        >
          <Image
            src={project.image.src}
            alt={project.image.alt}
            fill
            sizes="(max-width: 980px) 100vw, 960px"
            className="portfolio-scene__image-media"
            priority
          />
        </div>
      </article>
    </main>
  );
}
