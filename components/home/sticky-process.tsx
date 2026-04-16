"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { prefersReducedMotion } from "@/lib/motion-preferences";
import { processSteps, processStepThemes } from "@/lib/site-data";
import {
  getStickyProcessScrollDistance,
  getStickyProcessViewportHeight,
} from "@/lib/sticky-process-viewport";

function readHeaderHeight(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--site-header-height")
    .trim();

  if (!raw) return 0;

  const probe = document.createElement("div");
  probe.style.height = raw;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return px;
}

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
        headerHeight: readHeaderHeight(),
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
            index === 0 ? "inset(0% 0% 0% 0%)" : "inset(100% 0% -1% 0%)",
          zIndex: index + 1,
        });
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: () => `top ${readHeaderHeight()}`,
          end: () =>
            `+=${getStickyProcessScrollDistance({
              panelCount: panels.length,
              viewportHeight: getStickyProcessViewportHeight({
                innerHeight: window.innerHeight,
                visualViewportHeight: visualViewport?.height,
                headerHeight: readHeaderHeight(),
              }),
            })}`,
          pin: true,
          pinType: "fixed",
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
      className="relative overflow-hidden"
      style={{
        minHeight:
          "var(--sticky-process-height, calc(100svh - var(--site-header-height)))",
      }}
    >
      <div className="absolute left-6 top-6 z-20 sm:left-10 sm:top-10">
        <p
          className="home-kicker"
          style={{ color: "var(--home-ivory)", mixBlendMode: "difference" }}
        >
          Proces
        </p>
      </div>
      <div
        className="relative"
        style={{
          height:
            "var(--sticky-process-height, calc(100svh - var(--site-header-height)))",
        }}
      >
        {processSteps.map((step, index) => {
          const theme = processStepThemes[index];

          return (
            <article
              key={step.title}
              data-process-panel
              className="absolute inset-0 flex flex-col-reverse lg:grid lg:grid-cols-[0.95fr_1.05fr]"
              style={{
                backgroundColor: theme.background,
                color: theme.foreground,
              }}
            >
              <div className="relative flex flex-1 items-center px-6 py-10 sm:px-10 lg:px-16 lg:py-20">
                <div className="max-w-xl">
                  <span
                    className="display-font block text-[clamp(4rem,10vw,9rem)] leading-none tracking-[-0.06em]"
                    style={{ color: theme.accent }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2
                    className="display-font mt-4 text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] tracking-[-0.05em]"
                    style={{ color: theme.foreground }}
                  >
                    {step.title}
                  </h2>
                  <p
                    className="mt-6 text-lg leading-8"
                    style={{
                      color: `color-mix(in srgb, ${theme.foreground} 68%, transparent)`,
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
              <div className="relative flex h-[55%] w-full items-center justify-center p-[4%] lg:h-full lg:p-[10%]">
                <div className="relative aspect-[4/3] w-full max-w-[min(92%,720px)] overflow-hidden rounded-[var(--image-radius)] lg:max-w-[min(80%,720px)]">
                  <Image
                    src={step.image}
                    alt={step.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 45vw, 80vw"
                    priority={index === 0}
                    className="object-cover"
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
