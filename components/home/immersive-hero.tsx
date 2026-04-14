"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap-config";
import { heroImages } from "@/lib/site-data";

/* ── Data ── */

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
const LOOPS = 1;

/* ── Clip-path helpers (match Mersi main.js) ── */

const VISIBLE = "inset(0% 0% 0% 0%)";
const HIDDEN_TOP = "inset(100% 0% 0% 0%)";
const HIDDEN_BOTTOM = "inset(0% 0% 100% 0%)";

function hiddenCard(mobile: boolean) {
  return mobile ? "inset(50% 0% 50% 0%)" : HIDDEN_TOP;
}

function cardReveal(progress: number, mobile: boolean) {
  if (mobile) {
    const p = (1 - progress) * 50;
    return `inset(${p}% 0% ${p}% 0%)`;
  }
  return `inset(${(1 - progress) * 100}% 0% 0% 0%)`;
}

/* ── Component ── */

export function ImmersiveHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rightRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardListRef = useRef<HTMLDivElement>(null);
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const textureRef = useRef<HTMLDivElement>(null);
  const mobileExitRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const mobileExit = mobileExitRef.current;

    const isMobile = () => window.innerWidth <= 991;
    const getHeroStep = () => {
      if (!isMobile()) return window.innerHeight;
      return window.innerHeight - section.offsetTop;
    };

    /* ── Initial clip-path state ── */
    const initSlides = () => {
      const mobile = isMobile();
      leftRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, {
          clipPath: i === 0 ? VISIBLE : HIDDEN_TOP,
          zIndex: i === 0 ? SLIDE_COUNT : i + 1,
        });
      });
      rightRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, {
          clipPath: i === 0 ? VISIBLE : HIDDEN_BOTTOM,
          zIndex: i === 0 ? SLIDE_COUNT : i + 1,
        });
      });
      const firstName = heroPairs[0].sliderName;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const name = el.dataset.sliderName;
        gsap.set(el, {
          clipPath: name === firstName ? VISIBLE : hiddenCard(mobile),
          zIndex: name === firstName ? SLIDE_COUNT : i + 1,
        });
      });

      if (cardListRef.current) {
        gsap.set(cardListRef.current, {
          clipPath: mobile ? VISIBLE : "inset(0% 0% 100% 0%)",
        });
      }
    };

    initSlides();

    /* ── Mobile swipe handler ── */
    let mobileIndex = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;
    let isMobileAnimating = false;
    let mobileReleased = false;
    let mobileReturnTrigger = false;

    const releaseMobileHero = () => {
      mobileReleased = true;
      isMobileAnimating = false;
      setVisible(false);
    };

    const resetMobileHeroChrome = () => {
      const chrome = [
        leftPanelRef.current,
        rightPanelRef.current,
        cardWrapRef.current,
        textureRef.current,
      ].filter(Boolean) as HTMLElement[];

      gsap.set(chrome, { opacity: 1, scale: 1, y: 0 });

      if (mobileExit) {
        gsap.set(mobileExit, { display: "none", clearProps: "all" });
      }
    };

    const animateMobileSlide = (targetIndex: number, direction: 1 | -1) => {
      if (isMobileAnimating || targetIndex === mobileIndex) return;

      const currentIndex = mobileIndex;
      const currentName = heroPairs[currentIndex].sliderName;
      const targetName = heroPairs[targetIndex].sliderName;
      const nextLeftFrom = direction > 0 ? HIDDEN_TOP : HIDDEN_BOTTOM;
      const nextRightFrom = direction > 0 ? HIDDEN_BOTTOM : HIDDEN_TOP;

      isMobileAnimating = true;
      mobileIndex = targetIndex;

      leftRefs.current.forEach((el, i) => {
        if (!el) return;
        if (i === targetIndex) {
          gsap.set(el, { clipPath: nextLeftFrom, zIndex: SLIDE_COUNT + 1 });
        } else if (i === currentIndex) {
          gsap.set(el, { clipPath: VISIBLE, zIndex: SLIDE_COUNT });
        } else {
          gsap.set(el, {
            clipPath: direction > 0 ? HIDDEN_TOP : HIDDEN_BOTTOM,
            zIndex: i + 1,
          });
        }
      });

      rightRefs.current.forEach((el, i) => {
        if (!el) return;
        if (i === targetIndex) {
          gsap.set(el, { clipPath: nextRightFrom, zIndex: SLIDE_COUNT + 1 });
        } else if (i === currentIndex) {
          gsap.set(el, { clipPath: VISIBLE, zIndex: SLIDE_COUNT });
        } else {
          gsap.set(el, {
            clipPath: direction > 0 ? HIDDEN_BOTTOM : HIDDEN_TOP,
            zIndex: i + 1,
          });
        }
      });

      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const name = el.dataset.sliderName;
        if (name === targetName) {
          gsap.set(el, { clipPath: hiddenCard(true), zIndex: SLIDE_COUNT + 1 });
        } else if (name === currentName) {
          gsap.set(el, { clipPath: VISIBLE, zIndex: SLIDE_COUNT });
        } else {
          gsap.set(el, { clipPath: hiddenCard(true), zIndex: i + 1 });
        }
      });

      const currentCard = cardRefs.current[currentIndex];
      const targetCard = cardRefs.current[targetIndex];

      gsap
        .timeline({
          defaults: { duration: 0.8, ease: "power2.inOut" },
          onComplete: () => {
            leftRefs.current.forEach((el, i) => {
              if (!el || i === targetIndex) return;
              gsap.set(el, {
                clipPath: direction > 0 ? HIDDEN_TOP : HIDDEN_BOTTOM,
                zIndex: i + 1,
              });
            });
            rightRefs.current.forEach((el, i) => {
              if (!el || i === targetIndex) return;
              gsap.set(el, {
                clipPath: direction > 0 ? HIDDEN_BOTTOM : HIDDEN_TOP,
                zIndex: i + 1,
              });
            });
            cardRefs.current.forEach((el, i) => {
              if (!el || i === targetIndex) return;
              gsap.set(el, { clipPath: hiddenCard(true), zIndex: i + 1 });
            });
            isMobileAnimating = false;
          },
        })
        .to(leftRefs.current[targetIndex], { clipPath: VISIBLE }, 0)
        .to(rightRefs.current[targetIndex], { clipPath: VISIBLE }, 0)
        .to(targetCard, { clipPath: VISIBLE }, 0)
        .to(currentCard, { clipPath: hiddenCard(true) }, 0);
    };

    const animateMobileExit = () => {
      const overlay = mobileExit;
      const card = cardWrapRef.current;
      const pair = heroPairs[mobileIndex];
      const target = section.offsetTop + section.offsetHeight + 1;

      if (!overlay || !card) {
        releaseMobileHero();
        window.scrollTo(0, target);
        return;
      }

      const rect = card.getBoundingClientRect();
      const chrome = [
        leftPanelRef.current,
        rightPanelRef.current,
        cardWrapRef.current,
        textureRef.current,
      ].filter(Boolean) as HTMLElement[];

      gsap.killTweensOf([overlay, ...chrome]);
      isMobileAnimating = true;

      gsap.set(overlay, {
        display: "flex",
        opacity: 1,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        borderRadius: 8,
        backgroundColor: pair.color,
        clipPath: VISIBLE,
      });

      gsap
        .timeline({
          defaults: { ease: "power3.inOut" },
          onComplete: () => {
            gsap.set(overlay, { display: "none", clearProps: "all" });
          },
        })
        .to(chrome, { opacity: 0, scale: 0.985, duration: 0.42 }, 0)
        .to(
          overlay,
          {
            left: 0,
            top: 0,
            width: "100vw",
            height: "100dvh",
            borderRadius: 0,
            duration: 0.72,
          },
          0
        )
        .add(() => {
          window.scrollTo(0, target);
          releaseMobileHero();
        })
        .to(overlay, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.5 });
    };

    const exitMobileHero = () => {
      if (isMobileAnimating) return;
      animateMobileExit();
    };

    const setMobileSlideState = (targetIndex: number) => {
      mobileIndex = targetIndex;
      const targetName = heroPairs[targetIndex].sliderName;

      leftRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, {
          clipPath: i === targetIndex ? VISIBLE : HIDDEN_TOP,
          zIndex: i === targetIndex ? SLIDE_COUNT : i + 1,
        });
      });

      rightRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, {
          clipPath: i === targetIndex ? VISIBLE : HIDDEN_BOTTOM,
          zIndex: i === targetIndex ? SLIDE_COUNT : i + 1,
        });
      });

      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const name = el.dataset.sliderName;
        gsap.set(el, {
          clipPath: name === targetName ? VISIBLE : hiddenCard(true),
          zIndex: name === targetName ? SLIDE_COUNT : i + 1,
        });
      });
    };

    const animateMobileReturn = () => {
      const overlay = mobileExit;
      const card = cardWrapRef.current;
      const pair = heroPairs[SLIDE_COUNT - 1];

      if (!overlay || !card) {
        mobileReleased = false;
        mobileReturnTrigger = false;
        setVisible(true);
        setMobileSlideState(SLIDE_COUNT - 1);
        resetMobileHeroChrome();
        window.scrollTo(0, section.offsetTop);
        return;
      }

      const cardRect = card.getBoundingClientRect();
      const chrome = [
        leftPanelRef.current,
        rightPanelRef.current,
        cardWrapRef.current,
        textureRef.current,
      ].filter(Boolean) as HTMLElement[];

      isMobileAnimating = true;
      mobileReturnTrigger = true;
      setVisible(true);
      setMobileSlideState(SLIDE_COUNT - 1);
      gsap.set(chrome, { opacity: 0, scale: 0.985, y: 0 });
      gsap.set(overlay, {
        display: "flex",
        opacity: 1,
        left: 0,
        top: 0,
        width: "100vw",
        height: "100dvh",
        borderRadius: 0,
        backgroundColor: pair.color,
        clipPath: VISIBLE,
      });

      window.scrollTo(0, section.offsetTop);
      mobileReleased = false;

      gsap
        .timeline({
          defaults: { ease: "power3.inOut" },
          onComplete: () => {
            gsap.set(overlay, { display: "none", clearProps: "all" });
            mobileReturnTrigger = false;
            isMobileAnimating = false;
          },
        })
        .to(chrome, { opacity: 1, scale: 1, duration: 0.42 }, 0.12)
        .to(
          overlay,
          {
            left: cardRect.left,
            top: cardRect.top,
            width: cardRect.width,
            height: cardRect.height,
            borderRadius: 8,
            duration: 0.72,
          },
          0
        )
        .to(overlay, { opacity: 0, duration: 0.24 }, 0.55);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (!isMobile()) return;

      if (mobileReleased) {
        if (window.scrollY <= section.offsetTop + 2) {
          mobileReleased = false;
          mobileReturnTrigger = false;
          setVisible(true);
          initSlides();
          resetMobileHeroChrome();
        } else {
          return;
        }
      }

      const touch = event.touches[0];
      if (!touch) return;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchMoved = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!isMobile() || mobileReleased) return;
      event.preventDefault();
      touchMoved = true;
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!isMobile() || mobileReleased || isMobileAnimating || !touchMoved) return;
      const touch = event.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const isVerticalSwipe =
        Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 36;

      if (!isVerticalSwipe) return;

      if (deltaY < 0) {
        if (mobileIndex === SLIDE_COUNT - 1) {
          exitMobileHero();
          return;
        }
        animateMobileSlide(mobileIndex + 1, 1);
        return;
      }

      animateMobileSlide(
        mobileIndex === 0 ? SLIDE_COUNT - 1 : mobileIndex - 1,
        -1
      );
    };

    section.addEventListener("touchstart", onTouchStart, { passive: true });
    section.addEventListener("touchmove", onTouchMove, { passive: false });
    section.addEventListener("touchend", onTouchEnd, { passive: true });

    /* ── Desktop scroll handler ── */
    let snapTimer: ReturnType<typeof setTimeout> | null = null;
    let isSnapping = false;

    const applyHeroScroll = (scrollY: number) => {
      if (isMobile()) return;

      const sectionTop = section.offsetTop;
      const step = getHeroStep();
      const totalSlides = SLIDE_COUNT * step;
      const relScroll = Math.max(0, scrollY - sectionTop);

      /* ── Exit phase: after all slides ── */
      if (relScroll >= totalSlides) {
        const exitProgress = Math.min((relScroll - totalSlides) / step, 1);
        const s = 1 - exitProgress * 0.08; // 1 → 0.92
        const o = 1 - exitProgress;

        if (leftPanelRef.current)
          gsap.set(leftPanelRef.current, { scale: s, opacity: o });
        if (rightPanelRef.current)
          gsap.set(rightPanelRef.current, { scale: s, opacity: o });
        if (cardWrapRef.current)
          gsap.set(cardWrapRef.current, { y: exitProgress * 60, opacity: o });
        if (textureRef.current)
          gsap.set(textureRef.current, { opacity: o });
        return;
      }

      /* Reset exit transforms when back in slide range */
      if (leftPanelRef.current)
        gsap.set(leftPanelRef.current, { scale: 1, opacity: 1 });
      if (rightPanelRef.current)
        gsap.set(rightPanelRef.current, { scale: 1, opacity: 1 });
      if (cardWrapRef.current)
        gsap.set(cardWrapRef.current, { y: 0, opacity: 1 });
      if (textureRef.current)
        gsap.set(textureRef.current, { opacity: 1 });

      const slideScroll = Math.min(relScroll, totalSlides - 1);
      const cur = Math.min(Math.floor(slideScroll / step), SLIDE_COUNT - 1);
      const next = (cur + 1) % SLIDE_COUNT;
      const progress = (slideScroll % step) / step;

      // Left slides
      leftRefs.current.forEach((el, i) => {
        if (!el) return;
        if (i === cur) {
          gsap.set(el, { clipPath: VISIBLE, zIndex: SLIDE_COUNT });
        } else if (i === next) {
          gsap.set(el, {
            clipPath: `inset(${(1 - progress) * 100}% 0% 0% 0%)`,
            zIndex: SLIDE_COUNT + 1,
          });
        } else {
          gsap.set(el, { clipPath: HIDDEN_TOP, zIndex: i + 1 });
        }
      });

      // Right slides
      rightRefs.current.forEach((el, i) => {
        if (!el) return;
        if (i === cur) {
          gsap.set(el, { clipPath: VISIBLE, zIndex: SLIDE_COUNT });
        } else if (i === next) {
          gsap.set(el, {
            clipPath: `inset(0% 0% ${(1 - progress) * 100}% 0%)`,
            zIndex: SLIDE_COUNT + 1,
          });
        } else {
          gsap.set(el, { clipPath: HIDDEN_BOTTOM, zIndex: i + 1 });
        }
      });

      // Cards (matched by slider-name)
      const curName = heroPairs[cur].sliderName;
      const nextName = heroPairs[next].sliderName;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const name = el.dataset.sliderName;
        if (name === nextName && nextName !== curName) {
          gsap.set(el, {
            clipPath: cardReveal(progress, isMobile()),
            zIndex: SLIDE_COUNT + 1,
          });
        } else if (name === curName) {
          gsap.set(el, { clipPath: VISIBLE, zIndex: SLIDE_COUNT });
        } else {
          gsap.set(el, { clipPath: hiddenCard(isMobile()), zIndex: i + 1 });
        }
      });
    };

    /* ── Snap logic ── */
    let lastScrollDir = 0;
    let prevScrollY = 0;

    const scheduleSnap = (scrollY: number) => {
      if (isMobile() || isSnapping) return;

      /* Track scroll direction */
      if (scrollY > prevScrollY) lastScrollDir = 1;
      else if (scrollY < prevScrollY) lastScrollDir = -1;
      prevScrollY = scrollY;

      if (snapTimer) clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        const lenis = window.__lenis;
        if (!lenis) return;
        const sectionTop = section.offsetTop;
        const step = getHeroStep();
        const totalSlides = SLIDE_COUNT * step;
        const relScroll = Math.max(0, scrollY - sectionTop);

        /* Exit phase snap: commit based on scroll direction, not midpoint */
        if (relScroll >= totalSlides) {
          const exitProgress = (relScroll - totalSlides) / step;
          if (exitProgress < 0.02 || exitProgress > 0.98) return;

          /* Forward scroll → leave hero. Backward → return to last slide. */
          const target = lastScrollDir >= 0
            ? sectionTop + totalSlides + step
            : sectionTop + totalSlides;
          isSnapping = true;
          lenis.scrollTo(target, {
            duration: 0.7,
            easing: (t: number) => 1 - Math.pow(1 - t, 3),
            onComplete: () => { isSnapping = false; },
          });
          return;
        }

        /* Slide phase snap */
        const slideScroll = Math.min(relScroll, totalSlides - 1);
        const cur = Math.floor(slideScroll / step);
        const localProgress = (slideScroll % step) / step;

        if (localProgress < 0.02 || localProgress > 0.98) return;

        const targetIndex = localProgress >= 0.5 ? cur + 1 : cur;
        const targetScroll =
          sectionTop +
          Math.floor(relScroll / totalSlides) * totalSlides +
          targetIndex * step;

        isSnapping = true;
        lenis.scrollTo(targetScroll, {
          duration: 0.7,
          easing: (t: number) => 1 - Math.pow(1 - t, 3),
          onComplete: () => { isSnapping = false; },
        });
      }, 160);
    };

    /* ── Lenis scroll subscription ── */
    const onScroll = ({ scroll }: { scroll: number }) => {
      applyHeroScroll(scroll);
      scheduleSnap(scroll);
    };

    let lenisAttached = false;
    const attachLenis = () => {
      if (lenisAttached) return;
      const lenis = window.__lenis;
      if (lenis) {
        lenis.on("scroll", onScroll);
        lenisAttached = true;
      }
    };

    /* ── Resize handler ── */
    let lastWasMobile = isMobile();

    const onResize = () => {
      const nowMobile = isMobile();
      if (nowMobile === lastWasMobile) return;
      lastWasMobile = nowMobile;

      mobileIndex = 0;
      mobileReleased = false;
      initSlides();
      resetMobileHeroChrome();

      attachLenis();
      applyHeroScroll(window.scrollY);
    };

    window.addEventListener("resize", onResize);

    const onWindowScroll = () => {
      if (
        !isMobile() ||
        !mobileReleased ||
        mobileReturnTrigger ||
        isMobileAnimating
      ) {
        return;
      }

      if (window.scrollY <= section.offsetTop + 4) {
        animateMobileReturn();
      }
    };

    window.addEventListener("scroll", onWindowScroll, { passive: true });

    /* ── Intro card reveal (matches Mersi Tg function) ── */
    const introReveal = () => {
      const cardList = cardListRef.current;
      if (cardList && !isMobile()) {
        gsap.fromTo(
          cardList,
          { clipPath: "inset(0% 0% 100% 0%)" },
          {
            clipPath: VISIBLE,
            duration: 1.2,
            ease: "power4.inOut",
            delay: 0.3,
          }
        );
      }
      attachLenis();
      applyHeroScroll(window.scrollY);
    };

    let introDone = false;
    let fallback: ReturnType<typeof setTimeout> | null = null;
    const runIntroOnce = () => {
      if (introDone) return;
      introDone = true;
      if (fallback) clearTimeout(fallback);
      introReveal();
    };
    window.addEventListener("introComplete", runIntroOnce, { once: true });
    fallback = setTimeout(runIntroOnce, 2000);

    /* ── Visibility: hide panels when section out of viewport ── */
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(section);

    return () => {
      window.removeEventListener("introComplete", runIntroOnce);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onWindowScroll);
      section.removeEventListener("touchstart", onTouchStart);
      section.removeEventListener("touchmove", onTouchMove);
      section.removeEventListener("touchend", onTouchEnd);
      clearTimeout(fallback);
      if (snapTimer) clearTimeout(snapTimer);
      observer.disconnect();
      gsap.killTweensOf(mobileExit);
      const lenis = window.__lenis;
      if (lenis) {
        lenis.off("scroll", onScroll);
        lenisAttached = false;
      }
      setVisible(false);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`epic-hero ${visible ? "epic-hero--visible" : ""}`}
      style={{ height: `${(SLIDE_COUNT * LOOPS + 1) * 100}vh` }}
    >
      {/* Left panel */}
      <div ref={leftPanelRef} className="epic-hero__panel epic-hero__panel--left">
        {heroPairs.map((pair, i) => (
          <div
            key={pair.sliderName}
            ref={(node) => { leftRefs.current[i] = node; }}
            className="epic-hero__slide"
            data-slider-name={pair.sliderName}
          >
            <Image
              src={pair.left}
              alt=""
              fill
              priority={i === 0}
              sizes="(max-width: 991px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        ))}
      </div>

      {/* Right panel */}
      <div ref={rightPanelRef} className="epic-hero__panel epic-hero__panel--right">
        {heroPairs.map((pair, i) => (
          <div
            key={pair.sliderName}
            ref={(node) => { rightRefs.current[i] = node; }}
            className="epic-hero__slide"
            data-slider-name={pair.sliderName}
          >
            <Image
              src={pair.right}
              alt=""
              fill
              priority={i === 0}
              sizes="(max-width: 991px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        ))}
      </div>

      {/* Texture overlay */}
      <div ref={textureRef} className="epic-hero__texture" />

      <div ref={mobileExitRef} className="epic-hero__mobile-exit">
        <span>EpicMob</span>
      </div>

      {/* Center card */}
      <div ref={cardWrapRef} className="epic-hero__card-w">
        <div ref={cardListRef} className="epic-hero__card-list">
          {heroPairs.map((pair, i) => (
            <div
              key={pair.sliderName}
              ref={(node) => { cardRefs.current[i] = node; }}
              className="epic-hero__card-item"
              data-slider-name={pair.sliderName}
            >
              <Link
                href="/portfolio"
                aria-label={`Vezi ${pair.title}`}
                className="epic-hero__card-link"
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
                      {`${String(i + 1).padStart(2, "0")} / ${String(heroPairs.length).padStart(2, "0")}`}
                    </span>
                    <span className="epic-hero__card-cta">
                      Vezi <span className="epic-hero__card-cta-arrow">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
