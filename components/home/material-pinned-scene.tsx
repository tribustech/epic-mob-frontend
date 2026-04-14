"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { prefersReducedMotion } from "@/lib/motion-preferences";

export function MaterialPinnedScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;

    if (!section || !image || prefersReducedMotion()) {
      return;
    }

    const context = gsap.context(() => {
      gsap.set(image, { clipPath: "inset(12% 14% 12% 14%)" });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=140%",
          scrub: true,
          pin: true,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .to(image, {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1.08,
          ease: "none",
        })
        .to(
          section.querySelector("[data-material-copy]"),
          { color: "var(--home-ivory)", ease: "none" },
          0.2
        )
        .fromTo(
          section.querySelectorAll("[data-material-detail]"),
          { yPercent: 100, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            stagger: 0.12,
            ease: "power3.out",
          },
          0.45
        );
    }, section);

    return () => {
      context.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="home-material-surface relative min-h-[100svh] overflow-hidden py-24 text-[var(--home-ivory)]"
    >
      <div
        ref={imageRef}
        className="absolute inset-[8vw] overflow-hidden rounded-[2rem] max-md:inset-x-6"
      >
        <Image
          src="/portfolio/kitchen-ornate-cabinets-close.jpg"
          alt="Fronturi MDF vopsit si detalii de mobilier premium"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(7,7,7,0.32)]" />
      </div>
      <div className="home-shell relative z-10 flex min-h-[80svh] items-end">
        <div
          data-material-copy
          className="max-w-4xl text-[var(--home-charcoal)]"
        >
          <p className="home-kicker">Material si proportie</p>
          <h2 className="display-font mt-5 text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-[-0.06em]">
            Fiecare suprafata spune cum a fost construita.
          </h2>
          <div className="mt-8 grid gap-4 text-sm uppercase tracking-[0.24em] sm:grid-cols-3">
            <span data-material-detail>PAL pentru structura</span>
            <span data-material-detail>MDF pentru fronturi</span>
            <span data-material-detail>Feronerie Blum</span>
          </div>
        </div>
      </div>
    </section>
  );
}
