"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "framer-motion";
import { ArrowRight } from "lucide-react";

const slides = [
  {
    room: "Living",
    line: "Volume calde, riflaje și depozitare puse în proporție.",
    image: "/portfolio/schite/living_randare1.jpg",
    href: "/portfolio?cat=living",
  },
  {
    room: "Bucătărie",
    line: "Fronturi, blat și integrare gândite înainte de producție.",
    image: "/portfolio/schite/bucatarie_randare1.jpg",
    href: "/portfolio?cat=bucatarie",
  },
  {
    room: "Baie",
    line: "Mobilier integrat pentru zone curate și rezistente.",
    image: "/portfolio/schite/baie_randare1.jpg",
    href: "/portfolio?cat=baie",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function WarmHero() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, []);

  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next, index]);

  const slide = slides[index];
  const nextSlide = slides[(index + 1) % slides.length];

  const t: Transition = reduce ? { duration: 0 } : { duration: 0.7, ease };
  const textT: Transition = reduce ? { duration: 0 } : { duration: 0.55, ease };

  // Entrance (on mount)
  const enterContainer: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : 0.12,
        delayChildren: reduce ? 0 : 0.15,
      },
    },
  };
  const enterItem: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 26 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduce ? 0 : 0.6, ease },
    },
  };
  // The hero headline is the above-the-fold LCP element — it must be painted
  // without waiting for JS. This variant animates transform only (no opacity
  // gate), so the title is visible in SSR while still sliding up as enhancement.
  const titleItem: Variants = {
    hidden: { y: reduce ? 0 : 26 },
    show: { y: 0, transition: { duration: reduce ? 0 : 0.6, ease } },
  };

  return (
    <section className="hero2">
      <div className="hero2__bg" />

      <div className="section-shell grid items-center gap-6 pt-8 pb-10 sm:pt-12 lg:grid-cols-[0.8fr_1.25fr] lg:gap-6 lg:pt-16 lg:pb-20">
        {/* Eyebrow — mobile only, sits above the image */}
        <motion.p
          className="order-1 text-center eyebrow-warm lg:hidden"
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.6, ease }}
        >
          Mobilier la comandă
        </motion.p>

        {/* Copy */}
        <motion.div
          className="order-3 max-w-xl text-center lg:order-1 lg:text-left"
          variants={enterContainer}
          initial="hidden"
          animate="show"
        >
          <motion.p variants={enterItem} className="hidden eyebrow-warm lg:block">
            Mobilier la comandă
          </motion.p>

          <motion.div
            variants={titleItem}
            className="relative mt-4 min-h-[7.5rem] sm:min-h-[9rem] lg:min-h-[11rem]"
          >
            {/* initial={false}: first slide's headline renders at its final state
                (no opacity-0 gate) so it counts toward LCP; swaps still crossfade. */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={slide.room}
                initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -20 }}
                transition={textT}
              >
                <h1 className="display-font text-[clamp(3rem,7vw,5.5rem)] leading-[0.98] text-espresso">
                  {slide.room}
                </h1>
                <p className="mx-auto mt-4 max-w-md text-lg leading-8 text-espresso/70 lg:mx-0">
                  {slide.line}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div
            variants={enterItem}
            className="mt-8 hidden flex-wrap items-center gap-4 lg:flex lg:justify-start"
          >
            <Link href="/contact" className="btn-warm btn-warm--primary">
              Cere o ofertă
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
            <Link href="/portfolio" className="btn-warm btn-warm--ghost">
              Vezi portofoliul
            </Link>
          </motion.div>

          {/* Slider controls */}
          <motion.div
            variants={enterItem}
            className="mt-8 flex items-center justify-center gap-6 lg:mt-10 lg:justify-start"
          >
            <button
              type="button"
              onClick={next}
              className="hero2__next"
              aria-label={`Următorul: ${nextSlide.room}`}
            >
              <span className="hero2__next-label">Next</span>
              <span className="hero2__next-thumb">
                <Image
                  src={nextSlide.image}
                  alt={nextSlide.room}
                  fill
                  sizes="76px"
                  className="object-cover"
                />
              </span>
            </button>

            <div className="hero2__dots" role="tablist" aria-label="Slide-uri">
              {slides.map((s, i) => (
                <button
                  key={s.room}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`hero2__dot ${i === index ? "hero2__dot--active" : ""}`}
                  aria-label={`Mergi la ${s.room}`}
                  aria-selected={i === index}
                  role="tab"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Circle stage — starts opaque so the hero image (the LCP element) paints
            immediately; only a subtle scale plays as progressive enhancement. */}
        <motion.div
          className="order-2 lg:order-2"
          initial={{ opacity: 1, scale: reduce ? 1 : 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduce ? 0 : 0.9, ease }}
        >
          <div className="hero2__stage">
            <span className="hero2__halo" aria-hidden="true" />
            <span className="hero2__ring" aria-hidden="true" />
            <span className="hero2__spin" aria-hidden="true" />
            <span className="hero2__spin-dot" aria-hidden="true" />
            <div className="hero2__circle">
              {/* initial={false}: the first slide renders at its final state (no
                  opacity-0 gate that would delay LCP); later slide swaps still crossfade. */}
              <AnimatePresence initial={false}>
                <motion.div
                  key={slide.image}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: reduce ? 1 : 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={t}
                >
                  <Image
                    src={slide.image}
                    alt={`Mobilier la comandă — ${slide.room}`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 80vw, 45vw"
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
