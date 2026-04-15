"use client";

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
            className="absolute inset-0 flex items-end bg-[var(--home-charcoal)] px-6 py-20 sm:px-10 lg:px-16"
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  index % 2 === 0
                    ? "var(--home-black)"
                    : "var(--home-material)",
              }}
            />
            <div className="relative z-10 grid w-full gap-10 lg:grid-cols-[0.55fr_1fr] lg:items-end">
              <span className="display-font text-[clamp(5rem,18vw,18rem)] leading-none tracking-[-0.08em] text-[var(--home-orange)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="max-w-4xl">
                <h2 className="display-font text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-[-0.06em]">
                  {step.title}
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-[color-mix(in_srgb,var(--home-ivory)_68%,transparent)]">
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
