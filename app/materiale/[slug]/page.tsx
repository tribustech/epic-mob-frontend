import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { materials, materialSlugs, getMaterial } from "@/lib/materials-data";
import { MaterialStructure } from "@/components/materials/material-structure";
import { MaterialVerdict } from "@/components/materials/material-verdict";
import { MaterialProps } from "@/components/materials/material-props";
import { MaterialPlacement } from "@/components/materials/material-placement";

export function generateStaticParams() {
  return materialSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const material = getMaterial(slug);
  if (!material) return {};

  const title = `${material.name} — ${material.tagline}`;
  const description = material.intro;
  const canonical = `/materiale/${material.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: [{ url: material.heroImage, alt: material.name }],
    },
  };
}

export default async function MaterialArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = materials.findIndex((m) => m.slug === slug);
  const material = materials[index];

  if (!material) notFound();

  const next = materials[(index + 1) % materials.length];

  return (
    <main className="bg-sand text-espresso">
      <article className="section-shell pt-28 pb-20 sm:pt-32 lg:pt-36">
        <Link
          href="/materiale"
          className="warm-link inline-flex items-center gap-2 text-sm font-semibold"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Toate materialele
        </Link>

        {/* Hero */}
        <p className="eyebrow-warm mt-10" style={{ color: material.accent }}>
          Material
        </p>
        <h1 className="display-font mt-4 max-w-4xl text-[clamp(2.5rem,6vw,5rem)] leading-[1.02] text-espresso">
          {material.name}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-espresso/70">
          {material.intro}
        </p>

        <div className="relative mt-12 aspect-[16/10] w-full overflow-hidden rounded-[2rem] shadow-[var(--shadow-warm)]">
          <Image
            src={material.heroImage}
            alt={`${material.name} — ${material.tagline}`}
            fill
            sizes="(max-width: 1200px) 100vw, 1100px"
            className="object-cover"
            priority
          />
        </div>

        {/* Structure diagram */}
        <div className="mt-20">
          <p className="eyebrow-warm">Structură</p>
          <h2 className="display-font mt-3 text-3xl leading-tight text-espresso sm:text-4xl">
            Din ce e făcut
          </h2>
          <div className="mt-10">
            <MaterialStructure material={material} />
          </div>
        </div>

        {/* Pros / cons */}
        <div className="mt-20">
          <p className="eyebrow-warm">Plusuri și minusuri</p>
          <h2 className="display-font mt-3 text-3xl leading-tight text-espresso sm:text-4xl">
            Ce câștigi, ce iei în calcul
          </h2>
          <div className="mt-10">
            <MaterialVerdict material={material} />
          </div>
        </div>

        {/* Placement — unde se potrivește (heat / moisture by room) */}
        <div className="mt-20">
          <p className="eyebrow-warm">Unde se potrivește</p>
          <h2 className="display-font mt-3 text-3xl leading-tight text-espresso sm:text-4xl">
            Camera potrivită pentru fiecare corp
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-espresso/70">
            Căldura și umezeala pun materialele la încercare diferit. Iată unde
            recomandăm {material.name} și unde e nevoie de atenție.
          </p>
          <div className="mt-10">
            <MaterialPlacement material={material} />
          </div>
        </div>

        {/* Properties */}
        <div className="mt-20">
          <p className="eyebrow-warm">De ce contează</p>
          <div className="mt-8">
            <MaterialProps material={material} />
          </div>
        </div>

        {/* Article prose + good-for rail */}
        <div className="mt-20 grid gap-12 lg:grid-cols-[1.4fr_0.6fr] lg:gap-16">
          <div className="max-w-2xl">
            {material.article.map((section) => (
              <section key={section.heading} className="mt-10 first:mt-0">
                <h3 className="display-font text-2xl text-espresso">
                  {section.heading}
                </h3>
                <p className="mt-3 text-lg leading-8 text-espresso/80">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          <aside className="self-start rounded-[1.5rem] border border-[var(--line)] bg-cream p-7 shadow-[var(--shadow-warm)]">
            <p className="text-xs uppercase tracking-[0.2em] text-espresso/45">
              Potrivit pentru
            </p>
            <ul className="mt-5 flex flex-col gap-4">
              {material.goodFor.map((item) => (
                <li key={item} className="flex items-start gap-3 text-espresso/80">
                  <span
                    className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full"
                    style={{ background: material.accentSoft, color: material.accent }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="leading-6">{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        {/* Footer nav / CTA */}
        <div className="mt-20 flex flex-wrap items-center justify-between gap-6 border-t border-[var(--line)] pt-10">
          <Link href="/configurator" className="btn-warm btn-warm--primary">
            Cere o ofertă cu {material.name}
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
          <Link
            href={`/materiale/${next.slug}`}
            className="warm-link group inline-flex items-center gap-3 text-right"
          >
            <span>
              <span className="block text-xs uppercase tracking-[0.2em] text-espresso/45">
                Următorul material
              </span>
              <span className="display-font text-xl text-espresso">
                {next.name}
              </span>
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
