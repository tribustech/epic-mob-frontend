import Image from "next/image";
import { SectionHeading } from "@/components/section-heading";
import { portfolioProjects } from "@/lib/site-data";

export default function PortfolioPage() {
  return (
    <main className="section-shell section-space pt-32">
      <SectionHeading
        eyebrow="Portofoliu"
        title="Proiecte reale, nu randari."
        description="Fiecare proiect reflecta atentia la detaliu si calitatea executiei pe care o aducem in fiecare colaborare."
      />
      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {portfolioProjects.map((project) => (
          <article
            key={project.title}
            className="group overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-card"
          >
            <div className="relative h-[340px] overflow-hidden">
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="space-y-2 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                {project.space}
              </p>
              <h2 className="display-font text-3xl leading-tight text-navy">
                {project.title}
              </h2>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
