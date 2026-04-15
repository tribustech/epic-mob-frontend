"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { ReactNode, useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { prefersReducedMotion } from "@/lib/motion-preferences";
import { createHoverText, splitText } from "@/lib/split-text";

declare global {
  interface Window {
    __lenis?: InstanceType<typeof Lenis>;
  }
}

const hoverIgnoreSelector =
  ".logo-nav, [data-hover-link-ignore], .home-slider-link, .project-slider-link";

export function HomeAnimationProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    window.__lenis = lenis;

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const splitReverts: Array<() => void> = [];
    const hoverCleanups: Array<() => void> = [];
    const animations: gsap.core.Tween[] = [];
    let hasSetup = false;
    let setupFrame = 0;

    const setup = () => {
      if (hasSetup) {
        return;
      }

      hasSetup = true;

      document
        .querySelectorAll<HTMLElement>("[data-home-reveal='line']")
        .forEach((line) => {
          animations.push(
            gsap.fromTo(
              line,
              { scaleX: 0 },
              {
                scaleX: 1,
                duration: 1.2,
                ease: "power3.out",
                scrollTrigger: { trigger: line, start: "top 88%", once: true },
              }
            )
          );
        });

      document
        .querySelectorAll<HTMLElement>("[data-home-reveal='text']")
        .forEach((text) => {
          const split = splitText(text, "chars");
          splitReverts.push(split.revert);
          gsap.set(split.chars, { yPercent: 100 });
          animations.push(
            gsap.to(split.chars, {
              yPercent: 0,
              duration: 1.1,
              stagger: 0.018,
              ease: "power4.out",
              scrollTrigger: { trigger: text, start: "top 86%", once: true },
            })
          );
        });

      document
        .querySelectorAll<HTMLElement>("[data-home-hover]")
        .forEach((link) => {
          if (
            link.matches(hoverIgnoreSelector) ||
            link.closest(hoverIgnoreSelector)
          ) {
            return;
          }

          const hover = createHoverText(link);
          splitReverts.push(hover.revert);
          gsap.set(hover.bottom, { yPercent: 100 });

          const enter = () => {
            gsap.to(hover.top, {
              yPercent: -100,
              duration: 0.45,
              stagger: 0.015,
              ease: "epicTextHover",
              overwrite: true,
            });
            gsap.to(hover.bottom, {
              yPercent: 0,
              duration: 0.45,
              stagger: 0.015,
              ease: "epicTextHover",
              overwrite: true,
            });
          };

          const leave = () => {
            gsap.to(hover.top, {
              yPercent: 0,
              duration: 0.45,
              stagger: 0.015,
              ease: "epicTextHover",
              overwrite: true,
            });
            gsap.to(hover.bottom, {
              yPercent: 100,
              duration: 0.45,
              stagger: 0.015,
              ease: "epicTextHover",
              overwrite: true,
            });
          };

          link.addEventListener("mouseenter", enter);
          link.addEventListener("mouseleave", leave);
          hoverCleanups.push(() => {
            link.removeEventListener("mouseenter", enter);
            link.removeEventListener("mouseleave", leave);
          });
        });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    const handleIntroComplete = () => {
      setup();
    };

    window.addEventListener("introComplete", handleIntroComplete, { once: true });
    setupFrame = window.requestAnimationFrame(setup);

    return () => {
      window.cancelAnimationFrame(setupFrame);
      window.removeEventListener("introComplete", handleIntroComplete);
      hoverCleanups.forEach((cleanup) => cleanup());
      animations.forEach((animation) => animation.kill());
      splitReverts.forEach((revert) => revert());
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      gsap.ticker.remove(tick);
      delete window.__lenis;
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
