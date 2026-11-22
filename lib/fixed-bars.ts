// Floating UI (the cookie banner) must never cover a sticky bottom bar: the
// home tab bar, the shop's price bar or basket button, the quote wizard's
// buttons. Instead of listing every bar by route, the banner measures what is
// pinned to the bottom of the viewport and sits just above it.

export type Box = { top: number; bottom: number; height: number };

/**
 * How far above the viewport's bottom edge something must sit to clear every
 * bar in `boxes` that is pinned to the bottom. Boxes that do not touch the
 * bottom edge, or are taller than half the viewport (a full-screen sheet, the
 * page itself), are ignored.
 */
export function bottomClearance(boxes: readonly Box[], viewportHeight: number, tolerance = 24): number {
  let clearance = 0;
  for (const b of boxes) {
    if (b.height <= 0 || b.height > viewportHeight / 2) continue;
    if (b.bottom < viewportHeight - tolerance) continue;
    clearance = Math.max(clearance, Math.ceil(viewportHeight - b.top));
  }
  return clearance;
}

/** Bars pinned near the bottom edge (position fixed or sticky), sampled at a few points. */
export function pinnedBottomBoxes(exclude: Element | null): Box[] {
  const h = window.innerHeight;
  const w = window.innerWidth;
  const seen = new Set<Element>();
  const boxes: Box[] = [];
  for (const x of [8, w / 2, w - 8]) {
    for (const y of [h - 4, h - 28]) {
      for (const hit of document.elementsFromPoint(x, y)) {
        let el: Element | null = hit;
        while (el && el !== document.body && el !== document.documentElement) {
          if (exclude && (el === exclude || exclude.contains(el))) break;
          const pos = getComputedStyle(el).position;
          if (pos === "fixed" || pos === "sticky") {
            if (!seen.has(el)) {
              seen.add(el);
              const r = el.getBoundingClientRect();
              boxes.push({ top: r.top, bottom: r.bottom, height: r.height });
            }
            break;
          }
          el = el.parentElement;
        }
      }
    }
  }
  return boxes;
}
