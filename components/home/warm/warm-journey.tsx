"use client";

import { useEffect, useRef } from "react";
import { useScroll } from "framer-motion";
import { MessageCircle, Ruler, SwatchBook, FileText, Hammer, Wrench } from "lucide-react";

// Faithful port of dropship.io's "Our journey" [data-timeline-track] routine
// (odyn bundle `dt()`): a runtime SVG circular arc with ~200 ruler ticks that
// grow near a travelling dot, the passed portion coloured. Horizontal on all
// sizes (like dropship); driven by page scroll instead of a Swiper. Content is
// EpicMob's own project milestones; palette is the warm theme.
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
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const builtRef = useRef<Built | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

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
      const f = D * 1.07; // arc radius
      const y = 3.75 * l;
      const p = 7.5 * l;
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

    // ── Per-frame update (odyn `he()`) ──
    const render = (ce: number) => {
      const b = g();
      const strip = stripRef.current;
      const vp = viewportRef.current;
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];

      // Slides: centre the active card and ride a gentle arc.
      if (strip && vp && cards.length) {
        const idx = ce * (cards.length - 1);
        const lo = Math.max(0, Math.floor(idx));
        const hi = Math.min(cards.length - 1, lo + 1);
        const fr = idx - lo;
        const co = (el: HTMLElement) => el.offsetLeft + el.offsetWidth / 2;
        const target = co(cards[lo]) + (co(cards[hi]) - co(cards[lo])) * fr;
        const vpW = vp.offsetWidth;
        strip.style.transform = `translateX(${(vpW / 2 - target).toFixed(1)}px)`;
        // Large radius so cards only tilt gently; rotation clamped for legibility.
        const arcR = vpW * 2.2;
        const vpCenter = vp.getBoundingClientRect().left + vpW / 2;
        for (const el of cards) {
          const r = el.getBoundingClientRect();
          const ae = r.left + r.width / 2 - vpCenter;
          const se = Math.min(Math.abs(ae), arcR);
          const K = Math.sqrt(arcR * arcR - se * se) - arcR;
          let rot =
            Math.atan2(se, Math.sqrt(arcR * arcR - se * se)) * (180 / Math.PI) * Math.sign(ae);
          rot = Math.max(-10, Math.min(10, rot));
          const scale = Math.max(0.86, 1 - Math.abs(ae) / (vpW * 2.4));
          el.style.transform = `translateY(${(-K).toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
          el.style.opacity = String(Math.max(0.3, 1 - Math.abs(ae) / (vpW * 0.72)));
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

    build();
    render(scrollYProgress.get());
    const unsub = scrollYProgress.on("change", render);

    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        build();
        render(scrollYProgress.get());
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      unsub();
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      ref={sectionRef}
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

        <div ref={viewportRef} className="warm-journey__viewport">
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

          <div ref={trackRef} className="warm-journey__track" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
