"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * A row of cards that scrolls sideways. On phones the next card peeks in from the right so it is
 * obvious there is more; with a mouse there are two arrow buttons (they hide when there is nowhere to go).
 */
export function ShopRail({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const start = el.scrollLeft <= 4;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setEdge((e) => (e.start === start && e.end === end ? e : { start, end }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const move = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className={`shop-railwrap ${edge.start ? "" : "has-start"} ${edge.end ? "" : "has-end"}`}>
      <ul ref={ref} className="shop-rail" aria-label={label} tabIndex={-1}>
        {children}
      </ul>
      <button type="button" className="shop-rail__arrow shop-rail__arrow--prev" onClick={() => move(-1)} disabled={edge.start} aria-label="Produsele dinainte">
        <ChevronLeft size={22} aria-hidden="true" />
      </button>
      <button type="button" className="shop-rail__arrow shop-rail__arrow--next" onClick={() => move(1)} disabled={edge.end} aria-label="Produsele următoare">
        <ChevronRight size={22} aria-hidden="true" />
      </button>
    </div>
  );
}
