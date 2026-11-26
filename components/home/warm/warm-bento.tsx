import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { allPortfolioProjects, roomLabel } from "@/lib/portfolio-data";

// Hand-picked for the home page: bright, sharp covers that read well in the
// same 4:3 frame, and one per room type so the section shows range. The rest
// live on /portfolio. Each entry can nudge the crop with `focus` (CSS
// object-position) when the subject is not centred.
const featured: { slug: string; focus?: string }[] = [
  { slug: "bucatarie-nuc-gola", focus: "50% 62%" },
  { slug: "dressing-cu-oglinzi" },
  { slug: "living-comoda-tv-biblioteca-crem" },
  { slug: "bucatarie-alba-marmura" },
  { slug: "dormitor-comoda-mustar" },
  { slug: "baie-verde-petrol-litiera-pisica" },
];

const tiles = featured.flatMap(({ slug, focus }) => {
  const project = allPortfolioProjects.find((p) => p.slug === slug);
  if (!project) return [];
  return [
    {
      slug,
      focus: focus ?? "50% 50%",
      title: project.title,
      space: roomLabel[project.category],
      image: project.image.src,
      alt: project.image.alt,
    },
  ];
});

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
          className="warm-link group hidden items-center gap-2 text-sm font-semibold sm:inline-flex"
        >
          Vezi toate proiectele
          <ArrowUpRight
            size={18}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>

      {/* Phone: swipeable row with the next card peeking in. sm+: even grid. */}
      <ul className="-mx-6 mt-10 flex snap-x snap-mandatory scroll-pl-6 gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] sm:mx-0 sm:mt-12 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
        {tiles.map((tile, index) => (
          <li key={tile.slug} className="w-[80%] shrink-0 snap-start sm:w-auto">
            <Link href={`/portfolio/${tile.slug}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-clay shadow-[0_0.75rem_2rem_rgba(78,55,34,0.12)] transition-shadow duration-500 group-hover:shadow-[0_1.25rem_3rem_rgba(78,55,34,0.2)]">
                <Image
                  src={tile.image}
                  alt={tile.alt}
                  fill
                  sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 400px"
                  loading={index < 3 ? "eager" : "lazy"}
                  style={{ objectPosition: tile.focus }}
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
              </div>
              <div className="mt-4 flex items-start justify-between gap-4 px-1">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
                    {tile.space}
                  </p>
                  <p
                    className="display-font mt-1.5 text-2xl leading-snug text-espresso"
                    dangerouslySetInnerHTML={{ __html: tile.title }}
                  />
                </div>
                <ArrowUpRight
                  size={20}
                  aria-hidden
                  className="mt-1 shrink-0 text-espresso/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-terracotta"
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 sm:hidden">
        <Link
          href="/portfolio"
          className="warm-link group inline-flex items-center gap-2 text-sm font-semibold"
        >
          Vezi toate proiectele
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </section>
  );
}
