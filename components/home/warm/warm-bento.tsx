import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

type Tile = {
  title: string;
  space: string;
  image: string;
  span: "" | "bento--2x2" | "bento--2x1" | "bento--1x2";
  sizes: string;
};

// Curated to tile a 4-column grid cleanly (with grid-auto-flow: dense).
const tiles: Tile[] = [
  { title: "Bucătărie sculptată în contraste calde", space: "Bucătărie", image: "/portfolio/00-kitchen-ornate-navy-full.jpg", span: "bento--2x2", sizes: "(max-width: 900px) 100vw, 50vw" },
  { title: "Living contemporan", space: "Living", image: "/portfolio/schite/living_randare1.jpg", span: "bento--2x1", sizes: "(max-width: 900px) 100vw, 50vw" },
  { title: "Baie cu volume curate", space: "Baie", image: "/portfolio/schite/baie_randare1.jpg", span: "", sizes: "(max-width: 900px) 50vw, 25vw" },
  { title: "Birou cu depozitare integrată", space: "Birou", image: "/portfolio/schite/birou_randare1.jpg", span: "", sizes: "(max-width: 900px) 50vw, 25vw" },
  { title: "Bucătărie luminoasă", space: "Bucătărie", image: "/portfolio/schite/bucatarie_randare1.jpg", span: "bento--1x2", sizes: "(max-width: 900px) 50vw, 25vw" },
  { title: "Dressing cu oglinzi", space: "Dressing", image: "/portfolio/dressing-mirror-wardrobe.jpg", span: "bento--2x1", sizes: "(max-width: 900px) 100vw, 50vw" },
  { title: "Detaliu mâner auriu", space: "Detaliu", image: "/portfolio/00-detail-gold-handle.jpg", span: "", sizes: "(max-width: 900px) 50vw, 25vw" },
  { title: "Bucătărie modernă albă", space: "Bucătărie", image: "/portfolio/00-kitchen-white-modern.jpg", span: "bento--2x1", sizes: "(max-width: 900px) 100vw, 50vw" },
  { title: "Baie — vedere de ansamblu", space: "Baie", image: "/portfolio/schite/baie_randare2.jpg", span: "", sizes: "(max-width: 900px) 50vw, 25vw" },
];

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
            key={tile.image}
            href="/portfolio"
            className={`bento__tile group ${tile.span}`}
          >
            <Image
              src={tile.image}
              alt={tile.title}
              fill
              sizes={tile.sizes}
              className="object-cover"
            />
            <div className="bento__caption">
              <p className="text-xs uppercase tracking-[0.22em] text-cream/70">
                {tile.space}
              </p>
              <p className="mt-1 display-font text-xl leading-snug">
                {tile.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
