"use client";

import { useEffect, useRef } from "react";
import {
  MessageCircle,
  Ruler,
  SwatchBook,
  FileText,
  Hammer,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Faithful port of dropship.io's "Our journey" [data-timeline-track] routine
// (odyn bundle `dt()`): a runtime SVG circular arc with ~200 ruler ticks that
// grow near a travelling dot, the passed portion coloured. Horizontal on all
// sizes (like dropship). Content is EpicMob's own project milestones; palette
// is the warm theme. The cards are a native horizontally-scrollable strip
// (swipe on touch, drag/scroll on desktop); the ruler dot + tick fill are
// driven by the strip's scroll position.
const milestones = [
  {
    icon: MessageCircle,
    num: "01",
    title: "Discuție",
    description: "Vorbim despre ce îți dorești, stilul și ce ai deja decis.",
  },
  {
    icon: Ruler,
    num: "02",
    title: "Măsurători",
    description: "Venim la măsurători sau pornim de la cele pe care le ai deja.",
  },
  {
    icon: SwatchBook,
    num: "03",
    title: "Materiale",
    description: "Alegem împreună finisajele, culorile și feroneria Blum.",
  },
  {
    icon: FileText,
    num: "04",
    title: "Ofertă",
    description: "Îți pregătim o ofertă detaliată, fără obligații.",
  },
  {
    icon: Hammer,
    num: "05",
    title: "Producție",
    description: "Executăm mobila în atelierul propriu, cu atenție la detalii.",
  },
  {
    icon: Wrench,
    num: "06",
    title: "Montaj",
    description: "Livrăm și montăm complet, inclusiv electrocasnicele.",
  },
];

const SVG_NS = "http://www.w3.org/2000/svg";
const TERRA = "#C06A3E";
const FAINT = "rgba(192,106,62,0.30)";
const LINE = "rgba(42,36,32,0.15)";
const SAND = "#F5F0E8";

function svgEl(name: string, attrs: Record<string, string | number> = {}) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

type Tick = {
  el: SVGLineElement;
  fraction: number;
  cx: number;
  cy: number;
  nx: number;
  ny: number;
  svgX: number;
};

type Built = {
  clipRect: SVGRectElement;
  dot: SVGCircleElement;
  ticks: Tick[];
  n: number;
  D: number;
  h: number;
  l: number;
  lens: number[]; // [ae0..ae4, base]
  W: (x: number) => number;
};

export function WarmJourney() {
  const stripRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const builtRef = useRef<Built | null>(null);

  useEffect(() => {
    const g = () => builtRef.current;

    // ── Build the track SVG (odyn `we()`), sized to the track width ──
    const build = () => {
      const track = trackRef.current;
      if (!track) return;
      track.innerHTML = "";
      const D = track.clientWidth;
      if (!D) return;

      const l = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const n = Math.round(D * 0.22);
      const de = D + n * 2;
      const center = n + D / 2;
      const f = D * 3; // arc radius — large so the arc stays gentle and fully fits its box
      const y = 3.25 * l; // baseline height (from top of the SVG)
      const h = Math.min(420, Math.round(de / 7)); // dense ticks, ~7px apart
      const d = Math.max(4, 0.32 * l); // dot radius
      const lens = [3 * l, 2.75 * l, 2.5 * l, 2.25 * l, 2.125 * l, 2 * l];

      const W = (x: number) => {
        const F = x - center;
        const J = Math.min(Math.abs(F), f);
        return y - (Math.sqrt(f * f - J * J) - f);
      };
      const Z = (x: number) => {
        const F = x - center;
        const J = Math.min(Math.abs(F), f - 1);
        return F / Math.sqrt(f * f - J * J);
      };

      // Size the SVG so the full arc + longest ruler tick are contained (no clipping).
      // The deepest visible point is at the edge of the fade mask (8% / 92% of `de`).
      const p = Math.ceil(Math.max(W(0.08 * de), W(0.92 * de)) + lens[0] / 2 + 8);
      const pathD = () => {
        let s = "";
        for (let i = 0; i <= 200; i += 1) {
          const X = (i / 200) * de;
          s += (i ? "L" : "M") + `${X.toFixed(1)},${W(X).toFixed(1)} `;
        }
        return s;
      };

      const svg = svgEl("svg", { width: de, height: p });
      const fade =
        "linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)";
      (svg as SVGSVGElement).style.cssText =
        `display:block;overflow:visible;position:relative;left:-${n}px;` +
        `-webkit-mask-image:${fade};mask-image:${fade};`;

      const clipId = "tlclip" + Math.random().toString(36).slice(2);
      const defs = svgEl("defs");
      const clip = svgEl("clipPath", { id: clipId });
      const clipRect = svgEl("rect", { x: 0, y: -1000, width: 0, height: 2000 }) as SVGRectElement;
      clip.appendChild(clipRect);
      defs.appendChild(clip);
      svg.appendChild(defs);

      const dPath = pathD();
      const ticks: Tick[] = [];
      for (let i = 0; i <= h; i += 1) {
        const X = (i / h) * de;
        const frac = Math.max(0, Math.min(1, (X - n) / D));
        const u = W(X);
        const e = Z(X);
        const q = Math.sqrt(1 + e * e);
        const nx = -e / q;
        const ny = 1 / q;
        const half = lens[5] / 2;
        const line = svgEl("line", {
          x1: (X + half * nx).toFixed(2),
          y1: (u + half * ny).toFixed(2),
          x2: (X - half * nx).toFixed(2),
          y2: (u - half * ny).toFixed(2),
          stroke: FAINT,
          "stroke-width": 1.5,
          "stroke-linecap": "round",
        }) as SVGLineElement;
        svg.appendChild(line);
        ticks.push({ el: line, fraction: frac, cx: X, cy: u, nx, ny, svgX: X });
      }

      // faint full arc + coloured (clipped) arc over the ticks
      svg.appendChild(svgEl("path", { d: dPath, stroke: LINE, "stroke-width": 2, fill: "none", "stroke-linecap": "round" }));
      svg.appendChild(svgEl("path", { d: dPath, stroke: TERRA, "stroke-width": 2, fill: "none", "clip-path": `url(#${clipId})` }));

      const dot = svgEl("circle", { r: d, fill: TERRA, stroke: SAND, "stroke-width": 2.5, cx: n, cy: W(n) }) as SVGCircleElement;
      svg.appendChild(dot);

      track.appendChild(svg);
      builtRef.current = { clipRect, dot, ticks, n, D, h, l, lens, W };
    };

    // ── Per-frame update ── `ce` is the strip's scroll fraction (0→1).
    const render = (ce: number) => {
      const b = g();
      const strip = stripRef.current;
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];

      // Emphasise the card nearest the strip centre (scale + opacity focus).
      if (strip && cards.length) {
        const rect = strip.getBoundingClientRect();
        const center = rect.left + strip.clientWidth / 2;
        const half = strip.clientWidth / 2 || 1;
        for (const el of cards) {
          const r = el.getBoundingClientRect();
          const t = Math.min(1, Math.abs(r.left + r.width / 2 - center) / half);
          el.style.transform = `scale(${(1 - 0.14 * t).toFixed(3)})`;
          el.style.opacity = (1 - 0.55 * t).toFixed(3);
        }
      }

      // Track: dot, clip fill and graduated ticks.
      if (b) {
        const F = b.n + ce * b.D;
        b.clipRect.setAttribute("width", F.toFixed(1));
        b.dot.setAttribute("cx", F.toFixed(1));
        b.dot.setAttribute("cy", b.W(F).toFixed(1));
        for (const t of b.ticks) {
          const ae = Math.round(Math.abs(t.fraction - ce) * b.h);
          const K = ae <= 4 ? b.lens[ae] : b.lens[5];
          const half = Math.max(0.5 * b.l, K) / 2;
          t.el.setAttribute("x1", (t.cx + half * t.nx).toFixed(2));
          t.el.setAttribute("y1", (t.cy + half * t.ny).toFixed(2));
          t.el.setAttribute("x2", (t.cx - half * t.nx).toFixed(2));
          t.el.setAttribute("y2", (t.cy - half * t.ny).toFixed(2));
          t.el.setAttribute("stroke", t.svgX >= b.n && t.fraction <= ce ? TERRA : FAINT);
        }
      }
    };

    const progress = () => {
      const strip = stripRef.current;
      if (!strip) return 0;
      const max = strip.scrollWidth - strip.clientWidth;
      return max > 0 ? strip.scrollLeft / max : 0;
    };

    build();
    render(progress());

    // Ruler + card focus follow the strip's scroll (swipe, wheel, drag, snap).
    const strip = stripRef.current;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        render(progress());
        ticking = false;
      });
    };
    strip?.addEventListener("scroll", onScroll, { passive: true });

    // Desktop mouse: click-and-drag to scroll horizontally (touch uses native swipe).
    let dragging = false;
    let startX = 0;
    let startLeft = 0;
    const onPointerDown = (e: PointerEvent) => {
      if (!strip || e.pointerType !== "mouse") return;
      if (strip.scrollWidth - strip.clientWidth <= 0) return;
      dragging = true;
      startX = e.clientX;
      startLeft = strip.scrollLeft;
      strip.classList.add("is-dragging");
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging || !strip) return;
      strip.scrollLeft = startLeft - (e.clientX - startX);
    };
    const onPointerUp = () => {
      if (!strip) return;
      dragging = false;
      strip.classList.remove("is-dragging");
    };
    strip?.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Ruler acts as a draggable scrubber: pressing/dragging along the track
    // (mouse or touch) maps the pointer's X to a target scroll position, which
    // the strip eases toward each frame — so a press glides rather than jumps.
    const track = trackRef.current;
    let scrubbing = false;
    let scrubTarget = 0;
    let scrubRaf = 0;
    const maxScroll = () => (strip ? strip.scrollWidth - strip.clientWidth : 0);
    const stepScrub = () => {
      if (!strip) return;
      const cur = strip.scrollLeft;
      const diff = scrubTarget - cur;
      if (Math.abs(diff) < 0.5) {
        strip.scrollLeft = scrubTarget;
        scrubRaf = 0;
        if (!scrubbing) strip.classList.remove("is-snap-off");
        return;
      }
      strip.scrollLeft = cur + diff * 0.22;
      scrubRaf = requestAnimationFrame(stepScrub);
    };
    const ensureScrub = () => {
      if (!scrubRaf && strip) {
        strip.classList.add("is-snap-off");
        scrubRaf = requestAnimationFrame(stepScrub);
      }
    };
    const scrubTo = (clientX: number) => {
      if (!strip || !track) return;
      const r = track.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (clientX - r.left) / (r.width || 1)));
      scrubTarget = frac * maxScroll();
      ensureScrub();
    };
    // Nearest card's centred scroll position — used to settle after a scrub.
    const nearestCardScroll = () => {
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      if (!strip || !cards.length) return strip ? strip.scrollLeft : 0;
      const cur = strip.scrollLeft;
      let best = Infinity;
      let target = cur;
      for (const el of cards) {
        const p = el.offsetLeft + el.offsetWidth / 2 - strip.clientWidth / 2;
        if (Math.abs(p - cur) < best) {
          best = Math.abs(p - cur);
          target = p;
        }
      }
      return Math.max(0, Math.min(maxScroll(), target));
    };
    const onTrackDown = (e: PointerEvent) => {
      if (!strip || maxScroll() <= 0) return;
      scrubbing = true;
      track?.classList.add("is-scrubbing");
      scrubTo(e.clientX);
      e.preventDefault();
    };
    const onTrackMove = (e: PointerEvent) => {
      if (scrubbing) scrubTo(e.clientX);
    };
    const onTrackUp = () => {
      if (!scrubbing) return;
      scrubbing = false;
      track?.classList.remove("is-scrubbing");
      scrubTarget = nearestCardScroll(); // ease onto the nearest card
      ensureScrub();
    };
    track?.addEventListener("pointerdown", onTrackDown);
    window.addEventListener("pointermove", onTrackMove);
    window.addEventListener("pointerup", onTrackUp);

    // First-time hint: once the strip scrolls into view, glide it toward the
    // next card and back so the user sees the cards/ruler can be moved. Skipped
    // if the user has already interacted, or under reduced-motion.
    let hinted = false;
    let engaged = false;
    let hintTimer = 0;
    const markEngaged = () => {
      engaged = true;
    };
    // Only horizontal wheel intent counts — vertical page-scroll over the strip
    // shouldn't suppress the hint.
    const onWheelEngage = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) engaged = true;
    };
    strip?.addEventListener("pointerdown", markEngaged, { passive: true });
    strip?.addEventListener("wheel", onWheelEngage, { passive: true });
    track?.addEventListener("pointerdown", markEngaged, { passive: true });

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const hintNudge = () => {
      if (!strip || engaged) return;
      const max = strip.scrollWidth - strip.clientWidth;
      if (max <= 0) return;
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      const step =
        cards.length > 1
          ? cards[1].offsetLeft - cards[0].offsetLeft
          : strip.clientWidth * 0.5;
      const amp = Math.min(max, step * 0.55);
      strip.classList.add("is-snap-off");
      const t0 = performance.now();
      const dur = 1150;
      const frame = (now: number) => {
        if (!strip || engaged) {
          strip?.classList.remove("is-snap-off");
          return;
        }
        const p = Math.min(1, (now - t0) / dur);
        strip.scrollLeft = amp * Math.sin(p * Math.PI); // 0 → amp → 0
        if (p < 1) {
          requestAnimationFrame(frame);
        } else {
          strip.scrollLeft = 0;
          strip.classList.remove("is-snap-off");
        }
      };
      requestAnimationFrame(frame);
    };

    let io: IntersectionObserver | null = null;
    if (strip && !prefersReduced && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
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
    }

    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        build();
        render(progress());
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      strip?.removeEventListener("scroll", onScroll);
      strip?.removeEventListener("pointerdown", onPointerDown);
      track?.removeEventListener("pointerdown", onTrackDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onTrackMove);
      window.removeEventListener("pointerup", onTrackUp);
      strip?.removeEventListener("pointerdown", markEngaged);
      strip?.removeEventListener("wheel", onWheelEngage);
      track?.removeEventListener("pointerdown", markEngaged);
      window.removeEventListener("resize", onResize);
      io?.disconnect();
      clearTimeout(hintTimer);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(scrubRaf);
    };
  }, []);

  // Prev/next arrows: step to the adjacent card from whichever card is nearest
  // right now, so they always land on a snap point (even mid-scrub).
  const scrollByStep = (dir: number) => {
    const strip = stripRef.current;
    if (!strip) return;
    const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
    if (!cards.length) return;
    const centered = cards.map(
      (el) => el.offsetLeft + el.offsetWidth / 2 - strip.clientWidth / 2,
    );
    const cur = strip.scrollLeft;
    let idx = 0;
    let best = Infinity;
    centered.forEach((p, i) => {
      if (Math.abs(p - cur) < best) {
        best = Math.abs(p - cur);
        idx = i;
      }
    });
    const next = Math.max(0, Math.min(cards.length - 1, idx + dir));
    const max = strip.scrollWidth - strip.clientWidth;
    strip.scrollTo({
      left: Math.max(0, Math.min(max, centered[next])),
      behavior: "smooth",
    });
  };

  return (
    <section
      className="warm-journey relative bg-sand"
      aria-label="Parcursul unui proiect"
    >
      <div className="warm-journey__inner">
        <div className="section-shell text-center">
          <p className="eyebrow-warm">Cum lucrăm</p>
          <h2 className="display-font mt-4 text-4xl leading-tight text-espresso sm:text-5xl">
            Parcursul unui proiect
          </h2>
        </div>

        <div className="warm-journey__viewport">
          <button
            type="button"
            className="warm-journey__nav warm-journey__nav--prev"
            aria-label="Pasul anterior"
            onClick={() => scrollByStep(-1)}
          >
            <ChevronLeft strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="warm-journey__nav warm-journey__nav--next"
            aria-label="Pasul următor"
            onClick={() => scrollByStep(1)}
          >
            <ChevronRight strokeWidth={1.75} aria-hidden="true" />
          </button>
          <div ref={stripRef} className="warm-journey__cards">
            {milestones.map((m, i) => (
              <article
                key={m.num}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="warm-journey__card"
              >
                <span className="warm-journey__icon">
                  <m.icon strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="warm-journey__year">{m.num}</span>
                <h3 className="mt-1 text-2xl font-semibold text-espresso">
                  {m.title}
                </h3>
                <p className="warm-journey__desc mt-2">{m.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div ref={trackRef} className="warm-journey__track" aria-hidden="true" />
      </div>
    </section>
  );
}
