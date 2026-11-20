import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/** Doors and drawers take this long to open or close. */
export const OPEN_MS = 400;

export function prefersReducedMotion(): boolean {
  try {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Glides a number towards `target` in a fixed, eased time and hands every step to `apply`
 * (which moves the three.js object directly: no React render per frame, no allocations).
 * Timed on the wall clock, because with frameloop="demand" the first delta after a pause is huge.
 * With „reduce motion" set, the value jumps.
 */
export function useTween(target: number, apply: (value: number) => void, durationMs = OPEN_MS) {
  const invalidate = useThree((s) => s.invalidate);
  const state = useRef({ value: target, from: target, to: target, start: -1, active: false });
  const applyRef = useRef(apply);

  // every render: the geometry around the value may have changed (a wider door, a deeper drawer)
  useLayoutEffect(() => {
    applyRef.current = apply;
    apply(state.current.value);
  });

  useEffect(() => {
    const s = state.current;
    if (s.value === target) {
      s.active = false;
      return;
    }
    if (prefersReducedMotion()) {
      s.value = target;
      s.active = false;
      applyRef.current(target);
    } else {
      s.from = s.value;
      s.to = target;
      s.start = -1;
      s.active = true;
    }
    invalidate();
  }, [target, invalidate]);

  useFrame((frame) => {
    const s = state.current;
    if (!s.active) return;
    const now = performance.now();
    if (s.start < 0) s.start = now;
    const t = Math.min(1, (now - s.start) / durationMs);
    s.value = t >= 1 ? s.to : s.from + (s.to - s.from) * easeInOut(t);
    applyRef.current(s.value);
    if (t >= 1) s.active = false;
    frame.invalidate();
  });
}
