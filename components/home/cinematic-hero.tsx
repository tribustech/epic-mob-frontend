"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trustSignals } from "@/lib/site-data";
import { prefersReducedMotion } from "@/lib/motion-preferences";

interface CinematicSlide {
  id: string;
  title: string;
  detail: string;
  image: string;
}

const cinematicSlides: CinematicSlide[] = [
  {
    id: "navy-kitchen",
    title: "Bucatarie sculptata in contraste calde",
    detail: "MDF vopsit, vitrine si detalii care raman coerente pana la montaj.",
    image: "/portfolio/kitchen-ornate-navy-full.jpg",
  },
  {
    id: "white-kitchen",
    title: "Volume clare pentru camere luminoase",
    detail: "Randari, selectie de materiale si executie puse in acelasi ritm.",
    image: "/portfolio/kitchen-white-modern.jpg",
  },
  {
    id: "wardrobe",
    title: "Depozitare gandita sa ramana eleganta",
    detail: "Oglinzi, proportii si feronerie bune incep din faza de directie.",
    image: "/portfolio/dressing-mirror-wardrobe.jpg",
  },
];

const SLIDE_INTERVAL_MS = 6800;

export function CinematicHero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % cinematicSlides.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  const previewSlides = useMemo(() => {
    return [
      cinematicSlides[(activeIndex + 1) % cinematicSlides.length],
      cinematicSlides[(activeIndex + 2) % cinematicSlides.length],
    ];
  }, [activeIndex]);

  const activeSlide = cinematicSlides[activeIndex];

  return (
    <section className="home-cinematic" aria-label="Epic Mob acasa">
      <div className="home-cinematic__media" aria-hidden="true">
        {cinematicSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`home-cinematic__slide ${
              index === activeIndex ? "home-cinematic__slide--active" : ""
            }`}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={index === 0}
              sizes="100vw"
              className="home-cinematic__image"
            />
          </div>
        ))}
        <div className="home-cinematic__shade" />
      </div>

      <div className="home-cinematic__lines" aria-hidden="true">
        <span className="home-cinematic__line home-cinematic__line--horizontal" />
        <span className="home-cinematic__line home-cinematic__line--vertical" />
      </div>

      <div className="home-shell home-cinematic__content">
        <div className="home-cinematic__copy">
          <p className="home-kicker">Mobilier premium la comanda</p>
          <h1 className="display-font home-cinematic__title">
            Mobilier gandit sa arate bine din prima directie pana la ultimul detaliu.
          </h1>
          <p className="home-cinematic__lede">
            Lucram cu tine pe stil, randari, materiale si executie ca fiecare camera
            sa ramana coerenta cand trece din idee in productie.
          </p>
          <div className="home-cinematic__actions">
            <Link href="/configurator" className="home-cinematic__primary-cta">
              Cere oferta
            </Link>
            <Link href="/portfolio" className="home-cinematic__secondary-cta">
              Vezi portofoliul
            </Link>
          </div>
          <ul className="home-cinematic__signals" aria-label="Avantaje Epic Mob">
            {trustSignals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>

        <aside className="home-cinematic__rail">
          <div className="home-cinematic__active">
            <span className="home-cinematic__index">
              {String(activeIndex + 1).padStart(2, "0")} / {String(cinematicSlides.length).padStart(2, "0")}
            </span>
            <h2 className="display-font home-cinematic__active-title">
              {activeSlide.title}
            </h2>
            <p className="home-cinematic__active-detail">{activeSlide.detail}</p>
          </div>

          <div className="home-cinematic__preview-grid" aria-hidden="true">
            {previewSlides.map((slide) => (
              <div key={slide.id} className="home-cinematic__preview-card">
                <div className="home-cinematic__preview-image-wrap">
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 42vw, 18vw"
                    className="home-cinematic__preview-image"
                  />
                </div>
                <div className="home-cinematic__preview-copy">
                  <span>{slide.title}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
