"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion-preferences";

interface RenderSlide {
  id: string;
  title: string;
  detail: string;
  image: string;
}

const renderSlides: RenderSlide[] = [
  {
    id: "baie",
    title: "Baie",
    detail: "Mobilier integrat pentru zone curate si rezistente.",
    image: "/portfolio/schite/baie_randare1.jpg",
  },
  {
    id: "bucatarie",
    title: "Bucatarie",
    detail: "Fronturi, blat si integrare gandite inainte de productie.",
    image: "/portfolio/schite/bucatarie_randare1.jpg",
  },
  {
    id: "living",
    title: "Living",
    detail: "Volume, riflaje si depozitare puse in proportie.",
    image: "/portfolio/schite/living_randare1.jpg",
  },
];

const SLIDE_INTERVAL_MS = 5200;

export function MaterialPinnedScene() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = renderSlides[activeIndex];

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % renderSlides.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="render-showcase" aria-label="Randari interioare">
      <div className="render-showcase__slides" aria-hidden="true">
        {renderSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`render-showcase__slide ${
              index === activeIndex ? "render-showcase__slide--active" : ""
            }`}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              sizes="100vw"
              className="render-showcase__image"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      <div className="render-showcase__shade" />

      <div className="home-shell render-showcase__content">
        <p className="home-kicker">Randari interioare</p>
        <h2 className="display-font render-showcase__title">
          Vezi camera inainte sa intre in productie.
        </h2>
        <div className="render-showcase__meta" aria-live="polite">
          <span className="render-showcase__room">{activeSlide.title}</span>
          <span className="render-showcase__detail">{activeSlide.detail}</span>
        </div>
        <div className="render-showcase__progress" aria-label="Randare activa">
          {renderSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={`render-showcase__dot ${
                index === activeIndex ? "render-showcase__dot--active" : ""
              }`}
              aria-label={`Afiseaza ${slide.title}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
