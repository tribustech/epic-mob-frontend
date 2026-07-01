"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { materials } from "@/lib/materials-data";
import { MaterialCard } from "@/components/materials/material-card";

// Home teaser for the four materials — a horizontally-scrollable strip of the
// same cards used on /materiale, on every breakpoint. Equal-height cards, the
// first aligned to the content gutter. On scroll-into-view it does one gentle
// forward-and-back nudge (same routine as WarmJourney) to signal it's swipeable.
export function WarmMaterials() {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Any real interaction cancels the hint (don't fight the user).
    let engaged = false;
    const markEngaged = () => {
      engaged = true;
    };
    const onWheelEngage = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) engaged = true;
    };
    strip.addEventListener("pointerdown", markEngaged, { passive: true });
    strip.addEventListener("wheel", onWheelEngage, { passive: true });

    let hinted = false;
    let hintTimer = 0;
    let raf = 0;

    // Glide forward toward the next card and back: scrollLeft = amp·sin(p·π).
    const hintNudge = () => {
      if (!strip || engaged) return;
      const max = strip.scrollWidth - strip.clientWidth;
      if (max <= 0) return;
      const cards = Array.from(
        strip.querySelectorAll<HTMLElement>(".warm-materials__item"),
      );
      const step =
        cards.length > 1
          ? cards[1].offsetLeft - cards[0].offsetLeft
          : strip.clientWidth * 0.5;
      const amp = Math.min(max, step * 0.55);
      const start = strip.scrollLeft;
      strip.classList.add("is-snap-off");
      const t0 = performance.now();
      const dur = 1150;
      const frame = (now: number) => {
        if (!strip || engaged) {
          strip?.classList.remove("is-snap-off");
          return;
        }
        const p = Math.min(1, (now - t0) / dur);
        strip.scrollLeft = start + amp * Math.sin(p * Math.PI); // out and back
        if (p < 1) {
          raf = requestAnimationFrame(frame);
        } else {
          strip.scrollLeft = start;
          strip.classList.remove("is-snap-off");
        }
      };
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.5 && !hinted && !engaged) {
            hinted = true;
            hintTimer = window.setTimeout(hintNudge, 450);
          }
        }
      },
      { threshold: [0.5] },
    );
    io.observe(strip);

    return () => {
      strip.removeEventListener("pointerdown", markEngaged);
      strip.removeEventListener("wheel", onWheelEngage);
      io.disconnect();
      clearTimeout(hintTimer);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      className="warm-materials section-space bg-sand"
      aria-label="Materialele pe care le folosim"
    >
      <div className="section-shell">
        <p className="eyebrow-warm">Materiale</p>
        <h2 className="display-font warm-materials__title">
          Din ce e făcută mobila ta contează.
        </h2>
      </div>

      <div ref={stripRef} className="warm-materials__strip">
        {materials.map((mat) => (
          <div key={mat.slug} className="warm-materials__item">
            <MaterialCard material={mat} />
          </div>
        ))}
      </div>

      <div className="section-shell">
        <Link
          href="/materiale"
          className="btn-warm btn-warm--ghost warm-materials__cta"
        >
          Vezi toate materialele
          <ArrowRight size={18} strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
