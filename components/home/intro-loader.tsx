"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap-config";
import { prefersReducedMotion } from "@/lib/motion-preferences";
import { heroImages } from "@/lib/site-data";

const LOADER_KEY = "epicmob:intro-loader-seen-at";
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const collapsedClip = "polygon(0% 50%, 100% 50%, 100% 50%, 0% 50%)";
const fullClip = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";

function dispatchIntroComplete() {
  window.dispatchEvent(new CustomEvent("introComplete"));
}

function hasRecentVisit() {
  const value = window.localStorage.getItem(LOADER_KEY);
  const timestamp = value ? Number(value) : 0;
  return Number.isFinite(timestamp) && Date.now() - timestamp < DAY_IN_MS;
}

export function IntroLoader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<HTMLDivElement[]>([]);
  const [hidden, setHidden] = useState(false);
  const loaderImages = heroImages.slice(0, 4);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      dispatchIntroComplete();
      return;
    }

    if (prefersReducedMotion()) {
      gsap.to(root, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          setHidden(true);
          dispatchIntroComplete();
        },
      });
      return;
    }

    const seen = hasRecentVisit();
    window.localStorage.setItem(LOADER_KEY, String(Date.now()));

    if (seen) {
      gsap.to(root, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          setHidden(true);
          dispatchIntroComplete();
        },
      });
      return;
    }

    const images = imageRefs.current;
    gsap.set(images, { clipPath: collapsedClip, opacity: 0 });

    const leftCurtain = root.querySelector<HTMLElement>(
      "[data-loader-curtain='left']"
    );
    const rightCurtain = root.querySelector<HTMLElement>(
      "[data-loader-curtain='right']"
    );
    const isMobile = window.innerWidth <= 991;

    const timeline = gsap.timeline({
      defaults: {
        ease: isMobile ? "power2.inOut" : "power4.inOut",
      },
      onComplete: () => {
        setHidden(true);
        dispatchIntroComplete();
      },
    });

    images.forEach((image) => {
      timeline
        .set(image, { opacity: 1 })
        .to(image, { clipPath: fullClip, duration: isMobile ? 0.6 : 0.8 })
        .to({}, { duration: 0.06 });
    });

    timeline
      .to(root.querySelectorAll("[data-loader-content]"), {
        opacity: 0,
        duration: 0.35,
        ease: "power2.out",
      })
      .set([leftCurtain, rightCurtain], { display: "block" })
      .to(
        leftCurtain,
        { clipPath: "inset(0% 0% 100% 0%)", duration: 1.15 },
        "<"
      )
      .to(
        rightCurtain,
        { clipPath: "inset(100% 0% 0% 0%)", duration: 1.15 },
        "<"
      )
      .to(root, { opacity: 0, duration: 0.01 });

    return () => {
      timeline.kill();
    };
  }, []);

  if (hidden) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[999] overflow-hidden bg-[var(--home-charcoal)] text-[var(--home-ivory)]"
      aria-hidden="true"
    >
      <div data-loader-content className="absolute inset-0">
        {loaderImages.map((src, index) => (
          <div
            key={src}
            ref={(node) => {
              if (node) imageRefs.current[index] = node;
            }}
            className="absolute left-1/2 top-1/2 h-[56vh] w-[min(72vw,900px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
            style={{ zIndex: index + 1 }}
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              sizes="80vw"
              priority={index === 0}
            />
          </div>
        ))}
      </div>
      <div
        className="absolute left-8 top-8 z-20 home-kicker"
        data-loader-content
      >
        EpicMob
      </div>
      <div
        className="absolute bottom-8 left-8 z-20 max-w-sm text-sm uppercase tracking-[0.28em] text-[color-mix(in_srgb,var(--home-ivory)_68%,transparent)]"
        data-loader-content
      >
        Mobila la comanda
      </div>
      <div
        data-loader-curtain="left"
        className="absolute bottom-0 left-0 hidden h-full w-1/2 bg-[var(--home-charcoal)]"
      />
      <div
        data-loader-curtain="right"
        className="absolute right-0 top-0 hidden h-full w-1/2 bg-[var(--home-charcoal)]"
      />
    </div>
  );
}
