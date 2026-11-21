"use client";

import Link from "next/link";
import Image from "next/image";
import { type CSSProperties, useCallback, useEffect, useState } from "react";
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

const AUTOPLAY_MS = 6000;

// Light on purpose (it is the first thing a phone runs): the slides cross-fade
// and the copy rises with CSS animations (globals.css, "Hero slider"), not an
// animation library. The first slide paints in its final state so the image
// and text count for LCP right away. Autoplay stops while the visitor hovers or
// focuses the hero, and never runs with reduced motion.
export function WarmHero() {
  const [index, setIndex] = useState(0);
  // the slide being faded out (null before the first change: nothing animates)
  const [prev, setPrev] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (to: number) => {
      if (to === index) return;
      setPrev(index);
      setIndex(to);
    },
    [index],
  );

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => go((index + 1) % slides.length), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [go, index, paused]);

  const slide = slides[index];
  const nextSlide = slides[(index + 1) % slides.length];
  const swapping = prev !== null;

  return (
    <section
      className="hero2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      {/* One stable, descriptive h1 for the page; the rotating room name below
          is a visual label, not a heading. */}
      <h1 className="sr-only">
        Epic Mob Atelier: mobilier la comandă pentru bucătării, dressinguri,
        living și băi
      </h1>
      <div className="hero2__bg" />

      <div className="section-shell grid items-center gap-6 pt-8 pb-10 sm:pt-12 lg:grid-cols-[0.8fr_1.25fr] lg:gap-6 lg:pt-16 lg:pb-20">
        {/* Eyebrow — mobile only, sits above the image */}
        <p className="hero2__enter order-1 text-center eyebrow-warm lg:hidden">
          Mobilier la comandă
        </p>

        {/* Copy */}
        <div className="order-3 max-w-xl text-center lg:order-1 lg:text-left">
          <p className="hero2__enter hidden eyebrow-warm lg:block" style={{ "--d": 0 } as CSSProperties}>
            Mobilier la comandă
          </p>

          <div
            className="hero2__enter hero2__enter--move relative mt-4 min-h-[7.5rem] sm:min-h-[9rem] lg:min-h-[11rem]"
            style={{ "--d": 1 } as CSSProperties}
          >
            <div key={slide.room} className={swapping ? "hero2__text-in" : undefined}>
              <p className="display-font text-[clamp(3rem,7vw,5.5rem)] leading-[0.98] text-espresso">
                {slide.room}
              </p>
              <p className="mx-auto mt-4 max-w-md text-lg leading-8 text-espresso/75 lg:mx-0">
                {slide.line}
              </p>
            </div>
          </div>

          <div
            className="hero2__enter mt-8 hidden flex-wrap items-center gap-4 lg:flex lg:justify-start"
            style={{ "--d": 2 } as CSSProperties}
          >
            <Link href="/cere-oferta" className="btn-warm btn-warm--primary">
              Cere o ofertă
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
            <Link href="/portfolio" className="btn-warm btn-warm--ghost">
              Vezi portofoliul
            </Link>
          </div>

          {/* Slider controls */}
          <div
            className="hero2__enter mt-8 flex items-center justify-center gap-6 lg:mt-10 lg:justify-start"
            style={{ "--d": 3 } as CSSProperties}
          >
            <button
              type="button"
              onClick={() => go((index + 1) % slides.length)}
              className="hero2__next"
              aria-label={`Următorul: ${nextSlide.room}`}
            >
              <span className="hero2__next-label">Următorul</span>
              <span className="hero2__next-thumb">
                <Image
                  src={nextSlide.image}
                  alt=""
                  fill
                  sizes="76px"
                  className="object-cover"
                />
              </span>
            </button>

            <div className="hero2__dots" role="group" aria-label="Alege camera">
              {slides.map((s, i) => (
                <button
                  key={s.room}
                  type="button"
                  onClick={() => go(i)}
                  className={`hero2__dot ${i === index ? "hero2__dot--active" : ""}`}
                  aria-label={s.room}
                  aria-pressed={i === index}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Circle stage — opaque from the first paint (the image is the LCP
            element); only a subtle scale plays as an enhancement. */}
        <div className="hero2__stage-in order-2 lg:order-2">
          <div className="hero2__stage">
            <span className="hero2__halo" aria-hidden="true" />
            <span className="hero2__ring" aria-hidden="true" />
            <span className="hero2__spin" aria-hidden="true" />
            <span className="hero2__spin-dot" aria-hidden="true" />
            <div className="hero2__circle">
              {prev !== null && prev !== index ? (
                <div key={slides[prev].image} className="absolute inset-0">
                  <Image
                    src={slides[prev].image}
                    alt=""
                    fill
                    sizes="(max-width: 1023px) 16rem, 45vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div
                key={slide.image}
                className={`absolute inset-0${swapping ? " hero2__img-in" : ""}`}
              >
                <Image
                  src={slide.image}
                  alt={`Mobilier la comandă — ${slide.room}`}
                  fill
                  // the first slide is the LCP image: fetch it first, no lazy-loading
                  preload={index === 0}
                  sizes="(max-width: 1023px) 16rem, 45vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
