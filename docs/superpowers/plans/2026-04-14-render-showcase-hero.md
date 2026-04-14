# Render Showcase Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the pinned material scene after the immersive homepage hero with a full-screen automatic render showcase that cycles baie, bucatarie, and living renders with a zoom-out transition.

**Architecture:** Keep the existing `MaterialPinnedScene` export so `app/page.tsx` does not need composition changes. Rewrite the component as a small React state-driven slideshow and move visual behavior into focused CSS classes in `app/globals.css`. Remove `gsap`, `ScrollTrigger`, and scroll-pinning from this section.

**Tech Stack:** Next.js 16, React 19, TypeScript, `next/image`, existing global CSS, existing `prefersReducedMotion()` helper.

---

## Current Workspace Notes

- There are pre-existing local modifications in `app/globals.css` and `components/home/immersive-hero.tsx`. They may be changed as needed for this feature.
- The approved spec is `docs/superpowers/specs/2026-04-14-render-showcase-hero-design.md`.
- Available verification commands are `npm run lint` and `npm run build`.

## File Structure

- Modify `components/home/material-pinned-scene.tsx`: replace the pinned GSAP scene with the render showcase component while preserving the `MaterialPinnedScene` export.
- Modify `app/globals.css`: replace the old `.home-material-surface` styling with render showcase classes and reduced-motion behavior.
- No new runtime files are required.

---

### Task 1: Rewrite MaterialPinnedScene As Render Showcase

**Files:**
- Modify: `components/home/material-pinned-scene.tsx`

- [ ] **Step 1: Replace the component with a timer-driven render showcase**

Replace the entire contents of `components/home/material-pinned-scene.tsx` with:

```tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion-preferences";

interface RenderSlide {
  id: string;
  title: string;
  detail: string;
  image: string;
  alt: string;
}

const renderSlides: RenderSlide[] = [
  {
    id: "baie",
    title: "Baie",
    detail: "Mobilier integrat pentru zone curate si rezistente.",
    image: "/portfolio/schite/baie_randare1.jpg",
    alt: "Randare mobilier baie la comanda",
  },
  {
    id: "bucatarie",
    title: "Bucatarie",
    detail: "Fronturi, blat si integrare gandite inainte de productie.",
    image: "/portfolio/schite/bucatarie_randare1.jpg",
    alt: "Randare bucatarie cu mobilier la comanda",
  },
  {
    id: "living",
    title: "Living",
    detail: "Volume, riflaje si depozitare puse in proportie.",
    image: "/portfolio/schite/living_randare1.jpg",
    alt: "Randare living cu mobilier personalizat",
  },
];

const SLIDE_INTERVAL_MS = 5200;

export function MaterialPinnedScene() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = renderSlides[activeIndex];

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % renderSlides.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="render-showcase" aria-label="Randari interioare">
      <div className="render-showcase__slides" aria-hidden="true">
        {renderSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`render-showcase__slide ${
              index === activeIndex ? "render-showcase__slide--active" : ""
            }`}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              sizes="100vw"
              className="render-showcase__image"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      <div className="render-showcase__shade" />

      <div className="home-shell render-showcase__content">
        <p className="home-kicker">Randari interioare</p>
        <h2 className="display-font render-showcase__title">
          Vezi camera inainte sa intre in productie.
        </h2>
        <div className="render-showcase__meta" aria-live="polite">
          <span className="render-showcase__room">{activeSlide.title}</span>
          <span className="render-showcase__detail">{activeSlide.detail}</span>
        </div>
        <div className="render-showcase__progress" aria-label="Randare activa">
          {renderSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={`render-showcase__dot ${
                index === activeIndex ? "render-showcase__dot--active" : ""
              }`}
              aria-label={`Afiseaza ${slide.title}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run lint for the component**

Run:

```bash
npm run lint -- components/home/material-pinned-scene.tsx
```

Expected: ESLint exits successfully for `components/home/material-pinned-scene.tsx`. If the project ESLint CLI does not accept a file argument, run `npm run lint` and confirm there are no errors introduced by `components/home/material-pinned-scene.tsx`.

- [ ] **Step 3: Commit the component rewrite**

Run:

```bash
git add components/home/material-pinned-scene.tsx
git commit -m "feat: replace material pin with render showcase"
```

Expected: Git creates a commit containing only `components/home/material-pinned-scene.tsx`.

---

### Task 2: Add Render Showcase Styling

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace the old material surface rule with render showcase CSS**

Find this existing rule near the immersive home styles:

```css
.home-material-surface {
  background:
    radial-gradient(circle at 20% 18%, rgba(214, 108, 0, 0.18), transparent 28%),
    linear-gradient(135deg, rgba(200, 170, 135, 0.2), rgba(140, 125, 111, 0.12)),
    var(--home-black);
}
```

Replace it with:

```css
.render-showcase {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  isolation: isolate;
  background: var(--home-black);
  color: var(--home-ivory);
}

.render-showcase__slides,
.render-showcase__slide,
.render-showcase__shade {
  position: absolute;
  inset: 0;
}

.render-showcase__slide {
  opacity: 0;
  transform: scale(1.12);
  transition:
    opacity 1.2s ease,
    transform 5.2s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.render-showcase__slide--active {
  opacity: 1;
  transform: scale(1);
}

.render-showcase__image {
  object-fit: cover;
}

.render-showcase__shade {
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(7, 7, 7, 0.72) 0%, rgba(7, 7, 7, 0.34) 42%, rgba(7, 7, 7, 0.08) 100%),
    linear-gradient(0deg, rgba(7, 7, 7, 0.62) 0%, transparent 52%);
}

.render-showcase__content {
  position: relative;
  z-index: 2;
  display: flex;
  min-height: 100svh;
  flex-direction: column;
  justify-content: flex-end;
  padding-block: clamp(5rem, 11vh, 8rem);
}

.render-showcase__title {
  max-width: 58rem;
  margin: 1.25rem 0 0;
  font-size: clamp(3rem, 8vw, 8rem);
  line-height: 0.9;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.render-showcase__meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 46rem;
  margin-top: 1.5rem;
  color: rgba(237, 231, 222, 0.78);
}

.render-showcase__room {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--home-orange);
}

.render-showcase__detail {
  font-size: clamp(1rem, 2vw, 1.25rem);
  line-height: 1.5;
}

.render-showcase__progress {
  display: flex;
  gap: 0.65rem;
  margin-top: 2rem;
}

.render-showcase__dot {
  width: 2.75rem;
  height: 0.2rem;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: rgba(237, 231, 222, 0.32);
  cursor: pointer;
  transition: background 0.3s ease, transform 0.3s ease;
}

.render-showcase__dot--active {
  background: var(--home-orange);
  transform: scaleX(1.16);
}

@media (max-width: 767px) {
  .render-showcase__shade {
    background:
      linear-gradient(0deg, rgba(7, 7, 7, 0.76) 0%, rgba(7, 7, 7, 0.2) 62%, rgba(7, 7, 7, 0.28) 100%);
  }

  .render-showcase__content {
    padding-block: 4.25rem;
  }

  .render-showcase__title {
    max-width: 22rem;
    font-size: clamp(2.6rem, 16vw, 4.6rem);
    line-height: 0.92;
  }

  .render-showcase__meta {
    display: block;
    margin-top: 1.25rem;
  }

  .render-showcase__detail {
    display: block;
    margin-top: 0.55rem;
    font-size: 1rem;
  }

  .render-showcase__dot {
    width: 2.2rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .render-showcase__slide {
    transform: none;
    transition: opacity 0.4s ease;
  }

  .render-showcase__slide--active {
    transform: none;
  }
}
```

- [ ] **Step 2: Run lint after CSS changes**

Run:

```bash
npm run lint
```

Expected: ESLint exits successfully.

- [ ] **Step 3: Commit the styling**

Run:

```bash
git add app/globals.css
git commit -m "style: add render showcase hero"
```

Expected: Git creates a commit containing `app/globals.css`.

---

### Task 3: Verify Homepage Behavior

**Files:**
- Verify: `components/home/material-pinned-scene.tsx`
- Verify: `app/globals.css`
- Verify: `app/page.tsx`

- [ ] **Step 1: Build the app**

Run:

```bash
npm run build
```

Expected: Next.js build completes successfully.

- [ ] **Step 2: Start the dev server**

Run:

```bash
npm run dev
```

Expected: Next.js starts and prints a local URL, usually `http://localhost:3000`.

- [ ] **Step 3: Check desktop behavior**

Open the home page at desktop width and verify:

- The first immersive hero still appears first.
- Scrolling past the immersive hero reaches a full-screen render showcase.
- The render showcase is not pinned; normal scrolling continues to `ProjectIndex`.
- The visible slide fades and zooms out.
- The progress buttons switch between `Baie`, `Bucatarie`, and `Living`.

- [ ] **Step 4: Check mobile behavior**

Open the home page at mobile width and verify:

- The immersive hero mobile dismissal still transitions to the next section.
- The next section is the full-screen render showcase.
- The render fills the mobile viewport.
- Text remains readable near the bottom.
- The slide animation does not block normal page scrolling.

- [ ] **Step 5: Commit any verification fixes**

If verification required fixes, run:

```bash
git add components/home/material-pinned-scene.tsx app/globals.css
git commit -m "fix: polish render showcase behavior"
```

Expected: Git creates a small follow-up commit only if fixes were needed. If no fixes were needed, do not create an empty commit.
