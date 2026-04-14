import Image from "next/image";
import Link from "next/link";
import { portfolioProjects } from "@/lib/site-data";

const featuredProjects = portfolioProjects.slice(0, 6);

export function ProjectIndex() {
  return (
    <section className="bg-[var(--home-black)] py-24 text-[var(--home-ivory)] sm:py-32">
      <div className="home-shell">
        <div className="mb-16 flex flex-col gap-6 border-t border-[color-mix(in_srgb,var(--home-ivory)_18%,transparent)] pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="home-kicker">Proiecte</p>
            <h2
              data-home-reveal="text"
              className="display-font mt-4 max-w-4xl text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-[-0.06em]"
            >
              Proiecte reale, nu randari.
            </h2>
          </div>
          <Link
            data-home-hover
            href="/portfolio"
            className="w-fit text-xs font-bold uppercase tracking-[0.28em] text-[var(--home-orange)]"
          >
            Vezi portofoliul
          </Link>
        </div>
        <div className="space-y-12">
          {featuredProjects.map((project, index) => (
            <Link
              href="/portfolio"
              key={project.title}
              className="group grid gap-6 border-t border-[color-mix(in_srgb,var(--home-ivory)_16%,transparent)] pt-8 lg:grid-cols-[0.8fr_1.2fr]"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <span className="text-xs uppercase tracking-[0.3em] text-[var(--home-orange)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3
                    data-home-hover
                    className="display-font mt-4 text-4xl leading-none tracking-[-0.04em] sm:text-6xl"
                  >
                    {project.title}
                  </h3>
                </div>
                <span className="text-xs uppercase tracking-[0.3em] text-[color-mix(in_srgb,var(--home-ivory)_52%,transparent)]">
                  {project.space}
                </span>
              </div>
              <div className="relative h-[44vh] min-h-80 overflow-hidden rounded-[1.5rem]">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[rgba(7,7,7,0.12)] transition-colors duration-500 group-hover:bg-[rgba(7,7,7,0.02)]" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
