"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { materials } from "@/lib/materials-data";

const ease = [0.22, 1, 0.36, 1] as const;

// Home teaser — a pinned scrollytelling walk through the four materials.
// The slab (01) stays centred and crossfades; the background wash and side copy
// take the active material's accent. A taste of the full /materiale experience.
export function WarmMaterials() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const idx = Math.min(materials.length - 1, Math.max(0, Math.floor(p * materials.length)));
    setActive(idx);
  });

  // Reduced motion / no-JS friendly fallback: a plain responsive grid.
  if (reduceMotion) {
    return (
      <section className="warm-materials-static section-space bg-sand">
        <div className="section-shell">
          <p className="eyebrow-warm">Materiale</p>
          <h2 className="display-font mt-4 max-w-3xl text-4xl leading-tight text-espresso sm:text-5xl">
            Din ce e făcută mobila ta contează.
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {materials.map((mat) => (
              <Link
                key={mat.slug}
                href={`/materiale/${mat.slug}`}
                className="warm-materials-static__card"
              >
                <span className="warm-materials-static__img">
                  <Image
                    src={mat.heroImage}
                    alt={mat.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-cover"
                  />
                </span>
                <span className="mt-4 block font-semibold text-espresso">
                  {mat.name}
                </span>
                <span className="mt-1 block text-sm text-espresso/60">
                  {mat.tagline}
                </span>
              </Link>
            ))}
          </div>
          <Link href="/materiale" className="btn-warm btn-warm--ghost mt-10 inline-flex">
            Vezi toate materialele
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
        </div>
      </section>
    );
  }

  const current = materials[active];

  return (
    <section
      ref={sectionRef}
      className="warm-materials"
      aria-label="Materialele pe care le folosim"
      style={{ ["--mat-accent" as string]: current.accent }}
    >
      <div className="warm-materials__sticky">
        <span className="warm-materials__wash" aria-hidden="true" />

        <div className="warm-materials__inner section-shell">
          <header className="warm-materials__head">
            <p className="eyebrow-warm">Materiale</p>
            <h2 className="display-font mt-3 text-3xl leading-tight text-espresso sm:text-4xl">
              Din ce e făcută mobila ta contează.
            </h2>
          </header>

          <div className="warm-materials__stage">
            {/* Slab — all stacked, crossfaded */}
            <div className="warm-materials__slab">
              {materials.map((mat, i) => (
                <span
                  key={mat.slug}
                  className="warm-materials__slab-img"
                  style={{ opacity: i === active ? 1 : 0 }}
                  aria-hidden={i === active ? undefined : true}
                >
                  <Image
                    src={mat.heroImage}
                    alt={i === active ? `${mat.name} — ${mat.tagline}` : ""}
                    fill
                    sizes="(max-width: 900px) 100vw, 55vw"
                    className="object-cover"
                    priority={i === 0}
                  />
                </span>
              ))}
            </div>

            {/* Copy */}
            <div className="warm-materials__copy">
              <span className="warm-materials__count" style={{ color: current.accent }}>
                {String(active + 1).padStart(2, "0")}
                <span className="warm-materials__count-total">
                  /{String(materials.length).padStart(2, "0")}
                </span>
              </span>

              <AnimatePresence mode="wait">
                <motion.div
                  key={current.slug}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.4, ease }}
                >
                  <h3 className="display-font warm-materials__name">{current.name}</h3>
                  <p className="warm-materials__tagline">{current.tagline}</p>
                  <ul className="warm-materials__pros">
                    {current.pros.slice(0, 2).map((pro) => (
                      <li key={pro}>
                        <span
                          className="warm-materials__pro-mark"
                          style={{ background: current.accentSoft, color: current.accent }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>

              {/* Progress rail */}
              <div className="warm-materials__rail" aria-hidden="true">
                {materials.map((mat, i) => (
                  <span
                    key={mat.slug}
                    className={`warm-materials__rail-seg ${i <= active ? "is-on" : ""}`}
                    style={i <= active ? { background: current.accent } : undefined}
                  />
                ))}
              </div>

              <Link href="/materiale" className="warm-materials__cta">
                Vezi toate materialele
                <ArrowRight size={18} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
