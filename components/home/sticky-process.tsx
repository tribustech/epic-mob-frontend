"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { prefersReducedMotion } from "@/lib/motion-preferences";
import { processSteps } from "@/lib/site-data";
import {
  getStickyProcessScrollDistance,
  getStickyProcessViewportHeight,
} from "@/lib/sticky-process-viewport";

export function StickyProcess() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || prefersReducedMotion()) {
      return;
    }

    const panels = Array.from(
      section.querySelectorAll<HTMLElement>("[data-process-panel]")
    );
    let refreshFrame = 0;
    const visualViewport = window.visualViewport;
    const isMobile = () => window.innerWidth <= 991;
    const syncViewportHeight = () => {
      if (!isMobile()) {
        section.style.removeProperty("--sticky-process-height");
        return;
      }

      const viewportHeight = getStickyProcessViewportHeight({
        innerHeight: window.innerHeight,
        visualViewportHeight: visualViewport?.height,
      });

      section.style.setProperty("--sticky-process-height", `${viewportHeight}px`);
    };
    const refresh = () => {
      if (refreshFrame) {
        window.cancelAnimationFrame(refreshFrame);
      }

      refreshFrame = window.requestAnimationFrame(() => {
        syncViewportHeight();
        ScrollTrigger.refresh();
      });
    };

    const context = gsap.context(() => {
      syncViewportHeight();

      panels.forEach((panel, index) => {
        gsap.set(panel, {
          clipPath:
            index === 0 ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
          zIndex: index + 1,
        });
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () =>
            `+=${getStickyProcessScrollDistance({
              panelCount: panels.length,
              viewportHeight: getStickyProcessViewportHeight({
                innerHeight: window.innerHeight,
                visualViewportHeight: visualViewport?.height,
              }),
            })}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      panels.slice(1).forEach((panel, index) => {
        timeline.to(
          panel,
          { clipPath: "inset(0% 0% 0% 0%)", ease: "none", duration: 1 },
          index
        );
      });
    }, section);

    visualViewport?.addEventListener("resize", refresh);
    window.addEventListener("orientationchange", refresh);

    return () => {
      if (refreshFrame) {
        window.cancelAnimationFrame(refreshFrame);
      }
      section.style.removeProperty("--sticky-process-height");
      visualViewport?.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", refresh);
      context.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] min-h-[100dvh] overflow-hidden bg-[var(--home-charcoal)] text-[var(--home-ivory)]"
      style={{ minHeight: "var(--sticky-process-height, 100dvh)" }}
    >
      <div className="absolute left-6 top-6 z-20 sm:left-10 sm:top-10">
        <p className="home-kicker">Proces</p>
      </div>
      <div
        className="relative h-[100svh] h-[100dvh]"
        style={{ height: "var(--sticky-process-height, 100dvh)" }}
      >
        {processSteps.map((step, index) => (
          <article
            key={step.title}
            data-process-panel
            className="absolute inset-0 flex flex-col bg-[var(--home-charcoal)] lg:grid lg:grid-cols-[1.05fr_0.95fr]"
          >
            <div className="relative h-[55%] w-full overflow-hidden lg:h-full">
              <Image
                src={step.image}
                alt={step.imageAlt}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                priority={index === 0}
                className={
                  step.imageVariant === "illustration"
                    ? "object-contain p-8 lg:p-16"
                    : "object-cover"
                }
              />
            </div>
            <div className="relative flex flex-1 items-center px-6 py-10 sm:px-10 lg:px-16 lg:py-20">
              <div className="max-w-xl">
                <span className="display-font block text-[clamp(4rem,10vw,9rem)] leading-none tracking-[-0.06em] text-[var(--home-orange)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="display-font mt-4 text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] tracking-[-0.05em] text-[var(--home-ivory)]">
                  {step.title}
                </h2>
                <p className="mt-6 text-lg leading-8 text-[color-mix(in_srgb,var(--home-ivory)_68%,transparent)]">
                  {step.description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
