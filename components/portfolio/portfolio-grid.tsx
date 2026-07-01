import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  allPortfolioProjects,
  portfolioRooms,
  roomLabel,
  type ProjectCategory,
} from "@/lib/portfolio-data";

type FilterValue = "toate" | ProjectCategory;

// Repeating span pattern — reapplied to the *filtered* list so the grid always
// tiles cleanly from the top regardless of which room is active.
const SPAN_PATTERN = [
  "bento--2x2",
  "",
  "",
  "bento--2x1",
  "bento--1x2",
  "",
] as const;

function isRoom(value?: string): value is ProjectCategory {
  return !!value && portfolioRooms.some((room) => room.value === value);
}

const chipHref = (value: FilterValue) =>
  value === "toate" ? "/portfolio" : `/portfolio?cat=${value}`;

export function PortfolioGrid({ activeCat }: { activeCat?: string }) {
  const active: FilterValue = isRoom(activeCat) ? activeCat : "toate";

  const projects =
    active === "toate"
      ? allPortfolioProjects
      : allPortfolioProjects.filter((project) => project.category === active);

  const chips: { value: FilterValue; label: string; count: number }[] = [
    { value: "toate", label: "Toate", count: allPortfolioProjects.length },
    ...portfolioRooms.map((room) => ({
      value: room.value,
      label: room.label,
      count: allPortfolioProjects.filter((p) => p.category === room.value)
        .length,
    })),
  ];

  return (
    <section className="section-shell py-16 sm:py-20">
      <div
        className="flex flex-wrap items-center gap-2.5"
        aria-label="Filtrează după cameră"
      >
        {chips.map((chip) => {
          const isActive = active === chip.value;
          return (
            <Link
              key={chip.value}
              href={chipHref(chip.value)}
              scroll={false}
              aria-current={isActive ? "true" : undefined}
              className={`pf-chip${isActive ? " pf-chip--active" : ""}`}
            >
              {chip.label}
              <span className="pf-chip__count">{chip.count}</span>
            </Link>
          );
        })}
      </div>

      {projects.length > 0 ? (
        <div className="bento mt-10">
          {projects.map((project, index) => (
            <Link
              key={project.slug}
              href={`/portfolio/${project.slug}`}
              className={`bento__tile group ${SPAN_PATTERN[index % SPAN_PATTERN.length]}`}
            >
              <Image
                src={project.image.src}
                alt={project.image.alt}
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                className="object-cover"
              />
              <span className="bento__go" aria-hidden>
                <ArrowUpRight size={18} strokeWidth={2} />
              </span>
              <div className="bento__caption">
                <p className="text-xs uppercase tracking-[0.22em] text-cream/70">
                  {roomLabel[project.category]}
                </p>
                <p
                  className="mt-1 display-font text-xl leading-snug"
                  dangerouslySetInnerHTML={{ __html: project.title }}
                />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="pf-empty mt-12">
          <p className="eyebrow-warm">În curând</p>
          <h3 className="display-font mt-4 text-3xl text-espresso sm:text-4xl">
            Proiecte {roomLabel[active as ProjectCategory]} în pregătire
          </h3>
          <p className="mx-auto mt-4 max-w-md text-espresso/60">
            Lucrăm la această secțiune din portofoliu. Între timp, spune-ne ce ai
            în minte și îți pregătim o ofertă, fără obligații.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="btn-warm btn-warm--primary">
              Cere o ofertă
            </Link>
            <Link href="/portfolio" className="btn-warm btn-warm--ghost">
              Vezi toate proiectele
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
