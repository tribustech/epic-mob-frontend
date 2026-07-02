import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { allPortfolioProjects, roomLabel } from "@/lib/portfolio-data";

// Span + sizes pattern that tiles a 4-column dense grid cleanly. Applied by
// position to the real portfolio projects so the home stays in sync with
// /portfolio — the source of truth is lib/portfolio-data.
const layout: { span: "" | "bento--2x2" | "bento--2x1" | "bento--1x2"; sizes: string }[] = [
  { span: "bento--2x2", sizes: "(max-width: 900px) 100vw, 50vw" },
  { span: "bento--2x1", sizes: "(max-width: 900px) 100vw, 50vw" },
  { span: "", sizes: "(max-width: 900px) 50vw, 25vw" },
  { span: "", sizes: "(max-width: 900px) 50vw, 25vw" },
  { span: "bento--1x2", sizes: "(max-width: 900px) 50vw, 25vw" },
  { span: "bento--2x1", sizes: "(max-width: 900px) 100vw, 50vw" },
  { span: "", sizes: "(max-width: 900px) 50vw, 25vw" },
  { span: "bento--2x1", sizes: "(max-width: 900px) 100vw, 50vw" },
  { span: "", sizes: "(max-width: 900px) 50vw, 25vw" },
];

// Take as many real projects as the layout pattern can place, in portfolio order.
const tiles = allPortfolioProjects.slice(0, layout.length).map((project, index) => ({
  slug: project.slug,
  title: project.title,
  space: roomLabel[project.category],
  image: project.image.src,
  alt: project.image.alt,
  ...layout[index],
}));

export function WarmBento() {
  return (
    <section className="section-shell py-20 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="eyebrow-warm">Portofoliu</p>
          <h2 className="display-font mt-4 text-4xl leading-tight text-espresso sm:text-5xl">
            Proiecte recente
          </h2>
        </div>
        <Link
          href="/portfolio"
          className="warm-link group inline-flex items-center gap-2 text-sm font-semibold"
        >
          Vezi toate proiectele
          <ArrowUpRight
            size={18}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>

      <div className="bento mt-12">
        {tiles.map((tile) => (
          <Link
            key={tile.slug}
            href={`/portfolio/${tile.slug}`}
            className={`bento__tile group ${tile.span}`}
          >
            <Image
              src={tile.image}
              alt={tile.alt}
              fill
              sizes={tile.sizes}
              className="object-cover"
            />
            <div className="bento__caption">
              <p className="text-xs uppercase tracking-[0.22em] text-cream/70">
                {tile.space}
              </p>
              <p
                className="mt-1 display-font text-xl leading-snug"
                dangerouslySetInnerHTML={{ __html: tile.title }}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
