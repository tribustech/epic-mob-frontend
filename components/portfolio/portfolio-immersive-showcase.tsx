"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap-config";
import { heroImages } from "@/lib/site-data";
import {
  getImmersiveScrollState,
  getImmersiveSectionHeight,
} from "@/lib/portfolio-immersive-state";
import { prefersReducedMotion } from "@/lib/motion-preferences";

interface HeroPair {
  sliderName: string;
  title: string;
  location: string;
  punch: string;
  color: string;
  left: string;
  right: string;
}

const heroPairs: HeroPair[] = [
  {
    sliderName: "living",
    title: "Living",
    location: "Biblioteci, riflaje, media",
    punch: "Gandita pentru spatiul tau",
    color: "#8f927a",
    left: heroImages[0],
    right: heroImages[1],
  },
  {
    sliderName: "bucatarie",
    title: "Bucatarie",
    location: "Fronturi, blat, integrare",
    punch: "Mobila la comanda",
    color: "#c7652d",
    left: heroImages[2],
    right: heroImages[3],
  },
  {
    sliderName: "baie",
    title: "Baie",
    location: "Rezistent, coerent, curat",
    punch: "Te ajutam sa iti alegi stilul",
    color: "#b69a76",
    left: heroImages[4],
    right: heroImages[5],
  },
];

const SLIDE_COUNT = heroPairs.length;
const VISIBLE = "inset(0% 0% 0% 0%)";
const HIDDEN_TOP = "inset(100% 0% 0% 0%)";
const HIDDEN_BOTTOM = "inset(0% 0% 100% 0%)";

function hiddenCard(mobile: boolean) {
  return mobile ? "inset(50% 0% 50% 0%)" : HIDDEN_TOP;
}

function cardReveal(progress: number, mobile: boolean) {
  if (mobile) {
    const inset = (1 - progress) * 50;
    return `inset(${inset}% 0% ${inset}% 0%)`;
  }

  return `inset(${(1 - progress) * 100}% 0% 0% 0%)`;
}

export function PortfolioImmersiveShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardListRef = useRef<HTMLDivElement>(null);
  const [sectionHeight, setSectionHeight] = useState(`${SLIDE_COUNT * 100}vh`);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    const reduceMotion = prefersReducedMotion();
    const isMobile = () => window.innerWidth <= 991;

    const getHeroStep = () => {
      return Math.max(window.innerHeight, 1);
    };

    const initSlides = () => {
      const mobile = isMobile();
      leftRefs.current.forEach((element, index) => {
        if (!element) {
          return;
        }

        gsap.set(element, {
          clipPath: index === 0 ? VISIBLE : HIDDEN_TOP,
          zIndex: index === 0 ? SLIDE_COUNT : index + 1,
        });
      });

      rightRefs.current.forEach((element, index) => {
        if (!element) {
          return;
        }

        gsap.set(element, {
          clipPath: index === 0 ? VISIBLE : HIDDEN_BOTTOM,
          zIndex: index === 0 ? SLIDE_COUNT : index + 1,
        });
      });

      const firstName = heroPairs[0].sliderName;
      cardRefs.current.forEach((element, index) => {
        if (!element) {
          return;
        }

        const sliderName = element.dataset.sliderName;
        gsap.set(element, {
          clipPath: sliderName === firstName ? VISIBLE : hiddenCard(mobile),
          zIndex: sliderName === firstName ? SLIDE_COUNT : index + 1,
        });
      });

      if (cardListRef.current) {
        gsap.set(cardListRef.current, {
          clipPath: VISIBLE,
        });
      }
    };

    const applyScroll = (scrollY: number) => {
      const { currentIndex, nextIndex, progress } = getImmersiveScrollState({
        scrollY,
        sectionTop: section.offsetTop,
        step: getHeroStep(),
        slideCount: SLIDE_COUNT,
      });
      const mobile = isMobile();
      const currentName = heroPairs[currentIndex].sliderName;
      const nextName = heroPairs[nextIndex].sliderName;

      leftRefs.current.forEach((element, index) => {
        if (!element) {
          return;
        }

        if (index === currentIndex) {
          gsap.set(element, { clipPath: VISIBLE, zIndex: SLIDE_COUNT });
          return;
        }

        if (index === nextIndex && nextIndex !== currentIndex) {
          gsap.set(element, {
            clipPath: mobile
              ? `inset(${(1 - progress) * 100}% 0% 0% 0%)`
              : `inset(${(1 - progress) * 100}% 0% 0% 0%)`,
            zIndex: SLIDE_COUNT + 1,
          });
          return;
        }

        gsap.set(element, { clipPath: HIDDEN_TOP, zIndex: index + 1 });
      });

      rightRefs.current.forEach((element, index) => {
        if (!element) {
          return;
        }

        if (index === currentIndex) {
          gsap.set(element, { clipPath: VISIBLE, zIndex: SLIDE_COUNT });
          return;
        }

        if (index === nextIndex && nextIndex !== currentIndex) {
          gsap.set(element, {
            clipPath: `inset(0% 0% ${(1 - progress) * 100}% 0%)`,
            zIndex: SLIDE_COUNT + 1,
          });
          return;
        }

        gsap.set(element, { clipPath: HIDDEN_BOTTOM, zIndex: index + 1 });
      });

      cardRefs.current.forEach((element, index) => {
        if (!element) {
          return;
        }

        const sliderName = element.dataset.sliderName;

        if (sliderName === nextName && nextName !== currentName) {
          gsap.set(element, {
            clipPath: cardReveal(progress, mobile),
            zIndex: SLIDE_COUNT + 1,
          });
          return;
        }

        if (sliderName === currentName) {
          gsap.set(element, { clipPath: VISIBLE, zIndex: SLIDE_COUNT });
          return;
        }

        gsap.set(element, {
          clipPath: hiddenCard(mobile),
          zIndex: index + 1,
        });
      });
    };

    const updateMetrics = () => {
      setSectionHeight(
        `${getImmersiveSectionHeight(SLIDE_COUNT, getHeroStep())}px`
      );
    };

    let previousScrollY = window.scrollY;
    let lastScrollDirection = 0;
    let snapTimer: ReturnType<typeof setTimeout> | null = null;
    let snapRelease: ReturnType<typeof setTimeout> | null = null;
    let isSnapping = false;

    const scheduleSnap = (scrollY: number) => {
      if (reduceMotion || isSnapping) {
        return;
      }

      if (scrollY > previousScrollY) {
        lastScrollDirection = 1;
      } else if (scrollY < previousScrollY) {
        lastScrollDirection = -1;
      }
      previousScrollY = scrollY;

      if (snapTimer) {
        clearTimeout(snapTimer);
      }

      snapTimer = setTimeout(() => {
        const state = getImmersiveScrollState({
          scrollY,
          sectionTop: section.offsetTop,
          step: getHeroStep(),
          slideCount: SLIDE_COUNT,
        });

        let targetIndex = state.currentIndex;
        if (state.currentIndex !== state.nextIndex) {
          targetIndex =
            state.progress >= 0.5 || lastScrollDirection > 0
              ? state.nextIndex
              : state.currentIndex;
        }

        const targetScroll = section.offsetTop + targetIndex * getHeroStep();

        if (Math.abs(targetScroll - window.scrollY) < 24) {
          return;
        }

        isSnapping = true;
        window.scrollTo({ top: targetScroll, behavior: "smooth" });

        if (snapRelease) {
          clearTimeout(snapRelease);
        }

        snapRelease = setTimeout(() => {
          isSnapping = false;
        }, 520);
      }, 140);
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      applyScroll(scrollY);
      scheduleSnap(scrollY);
    };

    const handleResize = () => {
      updateMetrics();
      initSlides();
      applyScroll(window.scrollY);
    };

    initSlides();
    updateMetrics();
    applyScroll(window.scrollY);

    if (!reduceMotion) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    window.addEventListener("resize", handleResize);

    return () => {
      if (snapTimer) {
        clearTimeout(snapTimer);
      }
      if (snapRelease) {
        clearTimeout(snapRelease);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="epic-hero epic-hero--visible epic-hero--portfolio"
      style={{ height: sectionHeight }}
    >
      <div className="epic-hero__panel epic-hero__panel--left">
        {heroPairs.map((pair, index) => (
          <div
            key={pair.sliderName}
            ref={(node) => {
              leftRefs.current[index] = node;
            }}
            className="epic-hero__slide"
            data-slider-name={pair.sliderName}
          >
            <Image
              src={pair.left}
              alt=""
              fill
              priority={index === 0}
              sizes="(max-width: 991px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        ))}
      </div>

      <div className="epic-hero__panel epic-hero__panel--right">
        {heroPairs.map((pair, index) => (
          <div
            key={pair.sliderName}
            ref={(node) => {
              rightRefs.current[index] = node;
            }}
            className="epic-hero__slide"
            data-slider-name={pair.sliderName}
          >
            <Image
              src={pair.right}
              alt=""
              fill
              priority={index === 0}
              sizes="(max-width: 991px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        ))}
      </div>

      <div className="epic-hero__texture" />

      <div className="epic-hero__card-w">
        <div ref={cardListRef} className="epic-hero__card-list">
          {heroPairs.map((pair, index) => (
            <div
              key={pair.sliderName}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              className="epic-hero__card-item"
              data-slider-name={pair.sliderName}
            >
              <div
                className="epic-hero__card-link epic-hero__card-link--static"
                aria-hidden="true"
              >
                <div
                  className="epic-hero__card-btn"
                  style={{ backgroundColor: pair.color }}
                >
                  <div className="epic-hero__card-info-left">
                    <h2 className="epic-hero__card-title">{pair.title}</h2>
                    <div className="epic-hero__card-detail--desktop">
                      {pair.location}
                    </div>
                  </div>
                  <p className="epic-hero__card-punch">{pair.punch}</p>
                  <div className="epic-hero__card-etiquette">
                    <span className="epic-hero__card-pager">
                      {String(index + 1).padStart(2, "0")} / {String(heroPairs.length).padStart(2, "0")}
                    </span>
                    <span className="epic-hero__card-cta">Portofoliu</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
