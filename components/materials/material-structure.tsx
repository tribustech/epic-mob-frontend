"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Material } from "@/lib/materials-data";

// Animated structure diagram — the centrepiece of the material comparison.
//
// Desktop: the detail (02) macro sits on the right; structure labels sit in a
// left gutter. For each label an elbow leader is drawn: a short horizontal rail
// leaving the text, then a diagonal to a dot on the exact feature of the slab.
// The path draws on (framer-motion `pathLength` 0→1), the anchor dot pops, a
// pulse ring radiates. Labels fade+slide in, staggered.
//
// Mobile: leader lines would be cramped, so we stack — image on top, labels as a
// numbered list below.
//
// Re-animation: an IntersectionObserver flips `inView` once; the animated pieces
// are keyed by `material.slug`, so switching material remounts them and replays.

type Geometry = {
  d: string; // elbow path (text → rail → anchor)
  anchorX: number;
  anchorY: number;
};

const WIDE_BREAKPOINT = 768;

// Darken an accent toward espresso so the leader lines read on light slabs.
function darken(hex: string, amount = 0.4) {
  const m = hex.replace("#", "");
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const t = [42, 36, 32]; // espresso
  const mix = (c: number, i: number) => Math.round(c + (t[i] - c) * amount);
  const to = (c: number) => c.toString(16).padStart(2, "0");
  return `#${to(mix(r, 0))}${to(mix(g, 1))}${to(mix(b, 2))}`;
}

export function MaterialStructure({ material }: { material: Material }) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageBoxRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const [isWide, setIsWide] = useState(false);
  const [inView, setInView] = useState(false);
  const [geometry, setGeometry] = useState<Geometry[]>([]);

  // Measure connector geometry from the rendered layout (label text ↔ anchors).
  const measure = useCallback(() => {
    const container = containerRef.current;
    const imageBox = imageBoxRef.current;
    if (!container || !imageBox) return;

    const wide = container.clientWidth >= WIDE_BREAKPOINT;
    setIsWide(wide);
    if (!wide) {
      setGeometry([]);
      return;
    }

    const base = container.getBoundingClientRect();
    const img = imageBox.getBoundingClientRect();
    const railEndX = img.left - base.left - 6; // just before the slab

    const next: Geometry[] = material.structure.map((layer, i) => {
      const text = textRefs.current[i]?.getBoundingClientRect();
      const startX = text ? text.right - base.left + 12 : 0;
      const startY = text ? text.top + text.height / 2 - base.top : 0;
      const anchorX = img.left - base.left + layer.anchor.x * img.width;
      const anchorY = img.top - base.top + layer.anchor.y * img.height;
      const rail = Math.max(startX, railEndX);
      const d = `M ${startX} ${startY} L ${rail} ${startY} L ${anchorX} ${anchorY}`;
      return { d, anchorX, anchorY };
    });
    setGeometry(next);
  }, [material]);

  useLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    return () => ro.disconnect();
  }, [measure]);

  // Reveal once when scrolled into view.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(container);
    return () => io.disconnect();
  }, []);

  const accent = material.accent;
  const lineColor = darken(accent, 0.45);
  const animate = inView && !reduceMotion;

  return (
    <div ref={containerRef} className="material-structure">
      {/* Labels (left gutter on desktop, numbered list below on mobile) */}
      <ol className="material-structure__labels">
        {material.structure.map((layer, i) => (
          <motion.li
            key={`${material.slug}-${i}`}
            className="material-structure__label"
            initial={reduceMotion ? false : { opacity: 0, x: -12 }}
            animate={animate ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.45, delay: 0.3 + i * 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className="material-structure__badge"
              style={{ background: accent, color: material.onAccent }}
            >
              {i + 1}
            </span>
            <span
              className="material-structure__label-text"
              ref={(el) => {
                textRefs.current[i] = el;
              }}
            >
              <span className="material-structure__label-title">{layer.label}</span>
              {layer.sub ? (
                <span className="material-structure__label-sub">{layer.sub}</span>
              ) : null}
            </span>
          </motion.li>
        ))}
      </ol>

      {/* Slab macro */}
      <div ref={imageBoxRef} className="material-structure__image">
        <Image
          src={material.detailImage}
          alt={`Structura ${material.name} — muchie și miez`}
          fill
          sizes="(max-width: 768px) 100vw, 55vw"
          className="material-structure__img"
        />

        {/* Mobile: numbered anchor pins straight on the photo (no leader lines).
            Positioned by the same normalised anchor as the desktop dots. */}
        {!isWide ? (
          <div className="material-structure__pins" aria-hidden="true">
            {material.structure.map((layer, i) => (
              <span
                key={`${material.slug}-pin-${i}`}
                className="material-structure__pin-wrap"
                style={{ left: `${layer.anchor.x * 100}%`, top: `${layer.anchor.y * 100}%` }}
              >
                {animate ? (
                  <motion.span
                    className="material-structure__pin-pulse"
                    style={{ borderColor: accent }}
                    initial={{ scale: 1, opacity: 0.75 }}
                    animate={{ scale: 2.6, opacity: 0 }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      repeatDelay: 0.7,
                      delay: 0.3 + i * 0.18,
                      ease: "easeOut",
                    }}
                  />
                ) : null}
                <motion.span
                  className="material-structure__pin"
                  style={{ background: accent, color: material.onAccent }}
                  initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                  animate={animate ? { scale: 1, opacity: 1 } : undefined}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.18, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  {i + 1}
                </motion.span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Leader lines overlay (desktop only) */}
      {isWide ? (
        <svg className="material-structure__svg" aria-hidden="true">
          {geometry.map((g, i) => (
            <g key={`${material.slug}-line-${i}`}>
              {/* halo for legibility over the slab */}
              <motion.path
                d={g.d}
                fill="none"
                stroke="#FBF8F3"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                animate={animate ? { pathLength: 1, opacity: 0.55 } : undefined}
                transition={{ duration: 0.55, delay: 0.2 + i * 0.16, ease: "easeInOut" }}
              />
              <motion.path
                d={g.d}
                fill="none"
                stroke={lineColor}
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
                transition={{ duration: 0.55, delay: 0.2 + i * 0.16, ease: "easeInOut" }}
              />
              {/* pulse ring */}
              {animate ? (
                <motion.circle
                  cx={g.anchorX}
                  cy={g.anchorY}
                  r={6}
                  fill="none"
                  stroke={accent}
                  strokeWidth={2}
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 1.2, delay: 0.55 + i * 0.16, ease: "easeOut" }}
                  style={{ transformOrigin: `${g.anchorX}px ${g.anchorY}px` }}
                />
              ) : null}
              {/* anchor dot — white ring + accent fill for contrast on any slab */}
              <motion.circle
                cx={g.anchorX}
                cy={g.anchorY}
                r={6}
                fill="#FBF8F3"
                initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                animate={animate ? { scale: 1, opacity: 1 } : undefined}
                transition={{ duration: 0.35, delay: 0.5 + i * 0.16, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ transformOrigin: `${g.anchorX}px ${g.anchorY}px` }}
              />
              <motion.circle
                cx={g.anchorX}
                cy={g.anchorY}
                r={3.4}
                fill={accent}
                initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                animate={animate ? { scale: 1, opacity: 1 } : undefined}
                transition={{ duration: 0.35, delay: 0.5 + i * 0.16, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ transformOrigin: `${g.anchorX}px ${g.anchorY}px` }}
              />
            </g>
          ))}
        </svg>
      ) : null}
    </div>
  );
}
