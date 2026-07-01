import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { allPortfolioProjects, roomLabel } from "@/lib/portfolio-data";

export function generateStaticParams() {
  return allPortfolioProjects.map((project) => ({ slug: project.slug }));
}

// Strip inline HTML/entities so a display title can feed a plain-text <title>.
const plainText = (value: string) =>
  value
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = allPortfolioProjects.find((p) => p.slug === slug);
  if (!project) return {};

  // Drop the decorative trailing period; the brand is appended by the layout
  // template, so the fallback must not repeat "Epic Mob".
  const name = plainText(project.title).replace(/\.$/, "");
  const room = roomLabel[project.category];
  const title = project.seoTitle ?? `${name} — ${room} la comandă`;
  const description = project.seoDescription ?? plainText(project.lede);
  const canonical = `/portfolio/${project.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: [{ url: project.image.src, alt: project.image.alt }],
    },
  };
}

export default async function PortfolioCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = allPortfolioProjects.findIndex((p) => p.slug === slug);
  const project = allPortfolioProjects[index];

  if (!project) notFound();

  const next = allPortfolioProjects[(index + 1) % allPortfolioProjects.length];

  return (
    <main className="bg-sand text-espresso">
      <article className="section-shell pt-28 pb-20 sm:pt-32 lg:pt-36">
        <Link href="/portfolio" className="warm-link inline-flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft size={16} strokeWidth={2} />
          Înapoi la portofoliu
        </Link>

        <p className="eyebrow-warm mt-10">
          {roomLabel[project.category]} · {project.badge}
        </p>
        <h1
          className="display-font mt-4 max-w-4xl text-[clamp(2.5rem,6vw,5rem)] leading-[1.02] text-espresso"
          dangerouslySetInnerHTML={{ __html: project.title }}
        />
        <p className="mt-6 max-w-2xl text-lg leading-8 text-espresso/70">
          {project.lede}
        </p>

        <div className="relative mt-12 aspect-[16/10] w-full overflow-hidden rounded-[2rem] shadow-[var(--shadow-warm)]">
          <Image
            src={project.image.src}
            alt={project.image.alt}
            fill
            sizes="(max-width: 1200px) 100vw, 1100px"
            className="object-cover"
            priority
          />
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.4fr_0.6fr] lg:gap-16">
          <div
            className="pf-prose max-w-2xl text-lg leading-8 text-espresso/80"
            dangerouslySetInnerHTML={{ __html: project.body }}
          />

          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 self-start border-t border-[var(--line)] pt-8 lg:grid-cols-1">
            {project.specs.map((spec) => (
              <div key={spec.label}>
                <dt className="text-xs uppercase tracking-[0.2em] text-espresso/45">
                  {spec.label}
                </dt>
                <dd className="mt-1.5 text-base font-semibold text-espresso">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {project.gallery && project.gallery.length > 0 ? (
          <div className="mt-16">
            <p className="eyebrow-warm">Galerie</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {project.gallery.map((photo) => (
                <div
                  key={photo.src}
                  className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] shadow-[var(--shadow-warm)]"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-[var(--line)] pt-10">
          <Link href="/contact" className="btn-warm btn-warm--primary">
            Vreau un proiect ca acesta
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
          <Link
            href={`/portfolio/${next.slug}`}
            className="warm-link group inline-flex items-center gap-3 text-right"
          >
            <span>
              <span className="block text-xs uppercase tracking-[0.2em] text-espresso/45">
                Următorul proiect
              </span>
              <span
                className="display-font text-xl text-espresso"
                dangerouslySetInnerHTML={{ __html: next.title }}
              />
            </span>
            <ArrowRight
              size={20}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </article>
    </main>
  );
}
