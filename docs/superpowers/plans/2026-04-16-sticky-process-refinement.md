# Sticky Process Section Refinement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the sticky process section on the home page: offset the pin below the fixed site header, swap to text-left / image-right on desktop, inset images to ~80%, and give each of the five steps a distinct background tint in a warming progression.

**Architecture:** Surgical, single-file edits (Approach A from the spec). No new components. Pure-function units (`lib/sticky-process-viewport.ts`, `lib/site-data.ts`) get test-first changes; visual JSX/CSS changes in `components/home/sticky-process.tsx` verify via `next build` + manual browser check.

**Tech Stack:** Next.js 16.2.2, React 19.2.4, GSAP 3.14.2 (ScrollTrigger), Tailwind v4, Node's built-in `node:test` runner with `--experimental-strip-types`.

**Spec:** `docs/superpowers/specs/2026-04-16-sticky-process-refinement-design.md`

---

## File Structure

**Modified:**
- `lib/sticky-process-viewport.ts` — `getStickyProcessViewportHeight` gains a required `headerHeight` parameter and subtracts it from the base height.
- `lib/site-data.ts` — drop `imageVariant` field from `processSteps`; add sibling `processStepThemes` array (indexed alongside steps) with `{ background, foreground, accent }` per step.
- `app/globals.css` — add `--image-radius: 1rem` to `:root`.
- `components/home/sticky-process.tsx` — header-height reader, ScrollTrigger start offset, grid swap + `flex-col-reverse`, per-step inline styles, image frame wrapper, kicker blend mode, clip-path bleed.
- `tests/sticky-process-viewport.test.ts` — update all calls to pass `headerHeight`, add a test asserting subtraction.
- `tests/process-steps-data.test.ts` — remove the two `imageVariant` tests; add `processStepThemes` shape/length test.

**Not touched:** `components/home/process-section.tsx` (unused on home page, out of scope).

---

## Task 1: Viewport helper subtracts header height (TDD)

**Files:**
- Modify: `tests/sticky-process-viewport.test.ts`
- Modify: `lib/sticky-process-viewport.ts`

- [ ] **Step 1: Update existing tests to pass `headerHeight` and add one new test**

Replace the full contents of `tests/sticky-process-viewport.test.ts` with:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getStickyProcessScrollDistance,
  getStickyProcessViewportHeight,
} from "../lib/sticky-process-viewport.ts";

test("prefers the visual viewport height on mobile, minus header", () => {
  assert.equal(
    getStickyProcessViewportHeight({
      innerHeight: 844,
      visualViewportHeight: 724,
      headerHeight: 72,
    }),
    652
  );
});

test("falls back to innerHeight when visualViewport is unavailable", () => {
  assert.equal(
    getStickyProcessViewportHeight({
      innerHeight: 844,
      headerHeight: 72,
    }),
    772
  );
});

test("never returns a non-positive viewport height after subtraction", () => {
  assert.equal(
    getStickyProcessViewportHeight({
      innerHeight: 40,
      visualViewportHeight: 0,
      headerHeight: 72,
    }),
    1
  );
});

test("handles zero header height (e.g. before CSS resolves)", () => {
  assert.equal(
    getStickyProcessViewportHeight({
      innerHeight: 800,
      headerHeight: 0,
    }),
    800
  );
});

test("computes one viewport of scroll per transition", () => {
  assert.equal(
    getStickyProcessScrollDistance({
      panelCount: 4,
      viewportHeight: 724,
    }),
    2172
  );
});

test("does not create negative scroll distance", () => {
  assert.equal(
    getStickyProcessScrollDistance({
      panelCount: 0,
      viewportHeight: 724,
    }),
    0
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test --experimental-strip-types tests/sticky-process-viewport.test.ts`

Expected: the first four tests fail with a TypeScript error about the missing `headerHeight` property, or assertion failures (e.g. `724 !== 652`), because `getStickyProcessViewportHeight` does not yet accept `headerHeight`.

- [ ] **Step 3: Update the implementation**

Replace the full contents of `lib/sticky-process-viewport.ts` with:

```ts
export function getStickyProcessViewportHeight({
  innerHeight,
  visualViewportHeight,
  headerHeight,
}: {
  innerHeight: number;
  visualViewportHeight?: number;
  headerHeight: number;
}) {
  const base = visualViewportHeight ?? innerHeight;
  return Math.max(base - headerHeight, 1);
}

export function getStickyProcessScrollDistance({
  panelCount,
  viewportHeight,
}: {
  panelCount: number;
  viewportHeight: number;
}) {
  return Math.max(panelCount - 1, 0) * viewportHeight;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test --experimental-strip-types tests/sticky-process-viewport.test.ts`

Expected: `ℹ pass 6  ℹ fail 0`.

- [ ] **Step 5: Commit**

```bash
git add lib/sticky-process-viewport.ts tests/sticky-process-viewport.test.ts
git commit -m "refactor(sticky-process): subtract header height in viewport math"
```

---

## Task 2: Add `processStepThemes`, drop `imageVariant` (TDD)

**Files:**
- Modify: `tests/process-steps-data.test.ts`
- Modify: `lib/site-data.ts`

- [ ] **Step 1: Update the data test file**

Replace the full contents of `tests/process-steps-data.test.ts` with:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { processSteps, processStepThemes } from "../lib/site-data.ts";

test("each process step has an image asset under /portfolio/schite/", () => {
  assert.ok(processSteps.length >= 5);
  for (const step of processSteps) {
    assert.ok(
      typeof step.image === "string" && step.image.startsWith("/portfolio/schite/"),
      `${step.title} must have an image under /portfolio/schite/`
    );
  }
});

test("each process step has non-empty alt text", () => {
  for (const step of processSteps) {
    assert.ok(
      typeof step.imageAlt === "string" && step.imageAlt.trim().length > 0,
      `${step.title} must have non-empty imageAlt`
    );
  }
});

test("processStepThemes has the same length as processSteps", () => {
  assert.equal(processStepThemes.length, processSteps.length);
});

test("every theme defines background, foreground, and accent strings", () => {
  for (const [index, theme] of processStepThemes.entries()) {
    assert.equal(typeof theme.background, "string", `theme ${index} background`);
    assert.equal(typeof theme.foreground, "string", `theme ${index} foreground`);
    assert.equal(typeof theme.accent, "string", `theme ${index} accent`);
    assert.ok(theme.background.length > 0);
    assert.ok(theme.foreground.length > 0);
    assert.ok(theme.accent.length > 0);
  }
});
```

Note: the old `imageVariant` tests are intentionally removed — the field is being dropped. The two kept tests (image path, alt text) still pass after Step 3.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test --experimental-strip-types tests/process-steps-data.test.ts`

Expected: import error or `processStepThemes is undefined` — the new export does not yet exist.

- [ ] **Step 3: Update `lib/site-data.ts`**

Open `lib/site-data.ts`. Find the `processSteps` array (starts at line 206). Replace it with:

```ts
export const processSteps = [
  {
    title: "Consultanta",
    description:
      "Preluam camerele, stilul dorit si evaluam ce este deja decis.",
    image: "/portfolio/schite/bucatarie_shita_mana.jpg",
    imageAlt: "Schita de bucatarie desenata de mana",
  },
  {
    title: "Design",
    description:
      "Clarificam directia cromatica, volumele si materialele.",
    image: "/portfolio/schite/bucatarie.png",
    imageAlt: "Randare digitala a unei bucatarii",
  },
  {
    title: "Selectie materiale",
    description:
      "Alegem impreuna PAL, MDF vopsit sau infoliat pentru fiecare zona.",
    image: "/portfolio/schite/paletar.png",
    imageAlt: "Paletar cu mostre de materiale si finisaje",
  },
  {
    title: "Oferta si contract",
    description:
      "Prezentam oferta detaliata si semnam contractul.",
    image: "/portfolio/schite/contract.png",
    imageAlt: "Ilustratie cu un contract si strangere de mana",
  },
  {
    title: "Montaj & Predare",
    description:
      "Montaj complet, inclusiv electrocasnice si adaptari de instalatii.",
    image: "/portfolio/schite/bucatarie_randare1.jpg",
    imageAlt: "Randare finala a unei bucatarii montate",
  },
];

export const processStepThemes = [
  {
    background: "var(--home-charcoal)",
    foreground: "var(--home-ivory)",
    accent: "var(--home-orange)",
  },
  {
    background: "var(--home-stone)",
    foreground: "var(--home-ivory)",
    accent: "var(--home-orange)",
  },
  {
    background: "var(--home-material)",
    foreground: "var(--home-charcoal)",
    accent: "var(--home-charcoal)",
  },
  {
    background: "color-mix(in srgb, var(--home-orange) 55%, var(--home-charcoal))",
    foreground: "var(--home-ivory)",
    accent: "var(--home-ivory)",
  },
  {
    background: "var(--home-ivory)",
    foreground: "var(--home-charcoal)",
    accent: "var(--home-orange)",
  },
] as const;
```

Verify the commented-out "Productie" block between the fourth and fifth active entries stays put — it's a historical note, not to be deleted.

- [ ] **Step 4: Run the data tests**

Run: `node --test --experimental-strip-types tests/process-steps-data.test.ts`

Expected: `ℹ pass 4  ℹ fail 0`.

- [ ] **Step 5: Commit**

```bash
git add lib/site-data.ts tests/process-steps-data.test.ts
git commit -m "feat(sticky-process): add per-step themes, drop imageVariant"
```

---

## Task 3: Add `--image-radius` CSS token

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add the token**

In `app/globals.css`, locate the `:root` block containing `--home-charcoal: #1a1a1a;` (around line 265). Add the following line immediately after `--site-header-height: clamp(4.5rem, 8vh, 6rem);` (line 272):

```css
  --image-radius: 1rem;
```

The resulting block should look like:

```css
  --home-stone: #8c7d6f;
  ...
  --site-header-height: clamp(4.5rem, 8vh, 6rem);
  --image-radius: 1rem;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat(globals): add --image-radius token"
```

---

## Task 4: Refactor `sticky-process.tsx`

**Files:**
- Modify: `components/home/sticky-process.tsx`

This task updates one file. We'll make all structural changes in a single coherent edit, then verify via build + browser.

- [ ] **Step 1: Replace the full file contents**

Replace the full contents of `components/home/sticky-process.tsx` with:

```tsx
"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { prefersReducedMotion } from "@/lib/motion-preferences";
import { processSteps, processStepThemes } from "@/lib/site-data";
import {
  getStickyProcessScrollDistance,
  getStickyProcessViewportHeight,
} from "@/lib/sticky-process-viewport";

function readHeaderHeight(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--site-header-height")
    .trim();

  if (!raw) return 0;

  const probe = document.createElement("div");
  probe.style.height = raw;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return px;
}

export function StickyProcess() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || prefersReducedMotion()) {
      return;
    }

    const panels = Array.from(
      section.querySelectorAll<HTMLElement>("[data-process-panel]")
    );
    let refreshFrame = 0;
    const visualViewport = window.visualViewport;
    const isMobile = () => window.innerWidth <= 991;
    const syncViewportHeight = () => {
      if (!isMobile()) {
        section.style.removeProperty("--sticky-process-height");
        return;
      }

      const viewportHeight = getStickyProcessViewportHeight({
        innerHeight: window.innerHeight,
        visualViewportHeight: visualViewport?.height,
        headerHeight: readHeaderHeight(),
      });

      section.style.setProperty("--sticky-process-height", `${viewportHeight}px`);
    };
    const refresh = () => {
      if (refreshFrame) {
        window.cancelAnimationFrame(refreshFrame);
      }

      refreshFrame = window.requestAnimationFrame(() => {
        syncViewportHeight();
        ScrollTrigger.refresh();
      });
    };

    const context = gsap.context(() => {
      syncViewportHeight();

      panels.forEach((panel, index) => {
        gsap.set(panel, {
          clipPath:
            index === 0 ? "inset(0% 0% 0% 0%)" : "inset(100% 0% -1% 0%)",
          zIndex: index + 1,
        });
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: () => `top ${readHeaderHeight()}`,
          end: () =>
            `+=${getStickyProcessScrollDistance({
              panelCount: panels.length,
              viewportHeight: getStickyProcessViewportHeight({
                innerHeight: window.innerHeight,
                visualViewportHeight: visualViewport?.height,
                headerHeight: readHeaderHeight(),
              }),
            })}`,
          pin: true,
          pinType: "fixed",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      panels.slice(1).forEach((panel, index) => {
        timeline.to(
          panel,
          { clipPath: "inset(0% 0% 0% 0%)", ease: "none", duration: 1 },
          index
        );
      });
    }, section);

    visualViewport?.addEventListener("resize", refresh);
    window.addEventListener("orientationchange", refresh);

    return () => {
      if (refreshFrame) {
        window.cancelAnimationFrame(refreshFrame);
      }
      section.style.removeProperty("--sticky-process-height");
      visualViewport?.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", refresh);
      context.revert();
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{
        minHeight:
          "var(--sticky-process-height, calc(100svh - var(--site-header-height)))",
      }}
    >
      <div className="absolute left-6 top-6 z-20 sm:left-10 sm:top-10">
        <p
          className="home-kicker"
          style={{ color: "var(--home-ivory)", mixBlendMode: "difference" }}
        >
          Proces
        </p>
      </div>
      <div
        className="relative"
        style={{
          height:
            "var(--sticky-process-height, calc(100svh - var(--site-header-height)))",
        }}
      >
        {processSteps.map((step, index) => {
          const theme = processStepThemes[index];

          return (
            <article
              key={step.title}
              data-process-panel
              className="absolute inset-0 flex flex-col-reverse lg:grid lg:grid-cols-[0.95fr_1.05fr]"
              style={{
                backgroundColor: theme.background,
                color: theme.foreground,
              }}
            >
              <div className="relative flex flex-1 items-center px-6 py-10 sm:px-10 lg:px-16 lg:py-20">
                <div className="max-w-xl">
                  <span
                    className="display-font block text-[clamp(4rem,10vw,9rem)] leading-none tracking-[-0.06em]"
                    style={{ color: theme.accent }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2
                    className="display-font mt-4 text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] tracking-[-0.05em]"
                    style={{ color: theme.foreground }}
                  >
                    {step.title}
                  </h2>
                  <p
                    className="mt-6 text-lg leading-8"
                    style={{
                      color: `color-mix(in srgb, ${theme.foreground} 68%, transparent)`,
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
              <div className="relative flex h-[55%] w-full items-center justify-center p-[8%] lg:h-full lg:p-[10%]">
                <div className="relative aspect-[4/3] w-full max-w-[min(80%,720px)] overflow-hidden rounded-[var(--image-radius)]">
                  <Image
                    src={step.image}
                    alt={step.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 45vw, 80vw"
                    priority={index === 0}
                    className="object-cover"
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
```

Notes on what changed vs. the original:

1. **`readHeaderHeight()` helper** added at module scope — resolves the `--site-header-height` CSS var to pixels at call time.
2. **Pin start** is now `start: () => \`top ${readHeaderHeight()}\`` (function form re-evaluates on `ScrollTrigger.refresh()`).
3. **`syncViewportHeight()`** passes `headerHeight: readHeaderHeight()` to the helper.
4. **End-distance math** also passes `headerHeight`.
5. **Section `min-height` / inner `height`** use `calc(100svh - var(--site-header-height))` fallback so the layout is correct even before JS runs.
6. **Section root** no longer sets `bg-[var(--home-charcoal)] text-[var(--home-ivory)]` — per-panel themes own those now.
7. **Article** uses `flex flex-col-reverse lg:grid lg:grid-cols-[0.95fr_1.05fr]` (text first in source, image first visually on mobile via reverse, text left on desktop via grid).
8. **Text column** is first in source order; `--home-ivory`/charcoal text colors come from `theme.foreground`. The step number uses `theme.accent`.
9. **Image column** wraps the `<Image>` in a centered inner frame — `aspect-[4/3]`, `max-w-[min(80%,720px)]`, `rounded-[var(--image-radius)]`. `object-cover` is used for all images (no more `imageVariant` split).
10. **Kicker** uses `mixBlendMode: "difference"` so ivory stays readable across all five backgrounds.
11. **Initial clip-path** on panels 2–5 is `inset(100% 0% -1% 0%)` (1px bottom bleed) to prevent a hairline seam between outgoing/incoming tints during scrub.
12. **`pinType: "fixed"`** forces GSAP to pin using `position: fixed` rather than transforms — important when the trigger `start` references an offset that depends on the fixed header. Transform-based pinning can miscalculate with sticky ancestors.

- [ ] **Step 2: Run the full test suite**

Run: `node --test --experimental-strip-types tests/*.test.ts`

Expected: all tests pass. If `tests/portfolio-immersive-state.test.ts` or `tests/render-showcase-motion.test.ts` were passing before, they still pass (we didn't touch their inputs).

- [ ] **Step 3: Run the Next.js build**

Run: `npm run build`

Expected: build succeeds with no TypeScript errors. Common failure modes to watch for:
- Missing `processStepThemes` import (should be imported alongside `processSteps`).
- `theme` possibly undefined if `processStepThemes` doesn't match `processSteps` length (Task 2 test catches this, but double-check).

- [ ] **Step 4: Run the linter**

Run: `npm run lint`

Expected: no errors.

- [ ] **Step 5: Start the dev server and verify visually**

Run: `npm run dev`

Open `http://localhost:3000` in a browser. Scroll to the process section and verify:

- [ ] The top of each panel sits flush against the bottom of the fixed site header — no content hidden under it.
- [ ] At desktop widths (≥1024px), text is on the left, image on the right.
- [ ] At mobile widths (<1024px), image is on top (roughly 55% of viewport), text is below.
- [ ] Each image is visibly inset (~80% of its column), with the step's background tint showing around it.
- [ ] Scrolling through the section reveals five distinct background tints in this order: dark charcoal → warm stone → light beige → roasted orange-brown → ivory.
- [ ] On the third panel (beige `--home-material`), the title and "03" appear in dark charcoal — not orange/ivory.
- [ ] On the fifth panel (ivory), the title appears in dark charcoal and "05" in brand orange.
- [ ] The "Proces" kicker in the top-left stays readable on every panel (it's using `mix-blend-mode: difference`).
- [ ] Transitions between panels scrub smoothly with no visible 1px gap at the reveal edge.
- [ ] Enable your OS's "reduce motion" preference and reload. The panels should stack without pin or clip-path animation; per-step colors still apply.

If the UI verification fails on any item, investigate before committing. Say so explicitly in that case — do not claim the task complete.

- [ ] **Step 6: Commit**

```bash
git add components/home/sticky-process.tsx
git commit -m "feat(sticky-process): header-offset pin, layout swap, per-step tints, 80% image frame"
```

---

## Self-Review Checklist (run before handoff)

- [ ] All spec sections covered: pinning fix (Task 1 + 4), layout swap (Task 4), image frame (Task 3 + 4), per-step palette (Task 2 + 4), kicker blend (Task 4), transition bleed (Task 4), reduced motion untouched (Task 4 — existing short-circuit preserved).
- [ ] No "TBD", "TODO", "as appropriate" strings anywhere above.
- [ ] `processStepThemes` name is consistent: Task 2 defines it, Task 4 imports it, test file asserts it. No drift like `stepThemes` or `processThemes`.
- [ ] `readHeaderHeight` / `headerHeight` naming is consistent across the helper, the viewport function signature, and the test file (all use `headerHeight`).
- [ ] Type of `processStepThemes` entries: `{ background: string; foreground: string; accent: string }` — matches the test assertions and the inline-style usage in Task 4.
