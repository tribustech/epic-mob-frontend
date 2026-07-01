import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { allPortfolioProjects } from "@/lib/portfolio-data";

// The foreground "featured project" on the homepage. Pulls a real project from
// the portfolio data by slug so the copy, image and specs stay in one place.
const FEATURED_SLUG = "bucatarie-nuc-gola";

export function WarmFeatured() {
  const project =
    allPortfolioProjects.find((p) => p.slug === FEATURED_SLUG) ??
    allPortfolioProjects[0];

  return (
    <section className="bg-clay">
      <div className="section-shell grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <div className="relative order-last aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[var(--shadow-warm)] lg:order-first">
          <Image
            src={project.image.src}
            alt={project.image.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="max-w-lg">
          <p className="eyebrow-warm">Proiect în prim-plan · {project.badge}</p>
          <h2
            className="display-font mt-4 text-4xl leading-tight text-espresso sm:text-5xl"
            dangerouslySetInnerHTML={{ __html: project.title }}
          />
          <p className="mt-5 text-lg leading-8 text-espresso/70">{project.lede}</p>

          <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-[var(--line)] pt-6 sm:grid-cols-4">
            {project.specs.map((spec) => (
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
            href={`/portfolio/${project.slug}`}
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
