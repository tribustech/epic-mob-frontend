# Sticky Process Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reference image per step to the `StickyProcess` panels and fix the desktop regression that currently hides the section.

**Architecture:** Extend `processSteps` data with `image`, `imageAlt`, and `imageVariant` fields. Restructure each panel in `StickyProcess` to render a full-column image with the large step number overlaying the image frame. Remove the Tailwind class that overrides the sticky-process CSS variable to `auto` on desktop (the cause of the collapse-to-zero bug).

**Tech Stack:** Next.js 16, React 19, TypeScript, `next/image`, Tailwind v4, GSAP ScrollTrigger (unchanged), `node --test --experimental-strip-types`.

---

## Current Workspace Notes

- The approved spec is `docs/superpowers/specs/2026-04-15-sticky-process-images-design.md`.
- Desktop regression root cause: `components/home/sticky-process.tsx` sets `md:[--sticky-process-height:auto]` which makes `minHeight: var(--sticky-process-height, 100dvh)` resolve to `auto` on `md`+. All panels are `absolute inset-0`, so the section collapses to 0 and becomes invisible.
- All five image assets already exist in `public/portfolio/schite/` (verified): `bucatarie_shita_mana.jpg`, `bucatarie.png`, `paletar.png`, `contract.png`, `bucatarie_randare1.jpg`.
- Available verification commands: `node --test --experimental-strip-types <path>`, `npm run lint`, `npm run build`.
- The existing `processSteps` array in `lib/site-data.ts` has five active entries (Consultanta, Design, Selectie materiale, Oferta si contract, Montaj & Predare) plus one commented-out entry (Productie) — do not uncomment it.

## File Structure

- Modify `lib/site-data.ts`: extend each entry of `processSteps` with `image`, `imageAlt`, `imageVariant` fields.
- Modify `components/home/sticky-process.tsx`: remove `md:[--sticky-process-height:auto]`; replace the grid layout inside each panel with an image column + overlaid number + text column that stacks on mobile.
- Create `tests/process-steps-data.test.ts`: assert every step has the new required fields and that image paths point under `/portfolio/schite/`.

No new runtime modules are needed.

---

### Task 1: Add Image Fields To processSteps

**Files:**
- Modify: `lib/site-data.ts:206-237`
- Create: `tests/process-steps-data.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/process-steps-data.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { processSteps } from "../lib/site-data.ts";

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

test("each process step has a valid imageVariant", () => {
  for (const step of processSteps) {
    assert.ok(
      step.imageVariant === "photo" || step.imageVariant === "illustration",
      `${step.title} must have imageVariant photo or illustration`
    );
  }
});

test("the contract step uses the illustration variant", () => {
  const contract = processSteps.find((step) => step.title === "Oferta si contract");
  assert.ok(contract, "Oferta si contract step exists");
  assert.equal(contract?.imageVariant, "illustration");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/process-steps-data.test.ts`
Expected: FAIL — `image` / `imageAlt` / `imageVariant` are missing on existing entries.

- [ ] **Step 3: Extend `processSteps` entries**

In `lib/site-data.ts`, replace the current `processSteps` export (lines 206-237) with:

```ts
export const processSteps = [
  {
    title: "Consultanta",
    description:
      "Preluam camerele, stilul dorit si evaluam ce este deja decis.",
    image: "/portfolio/schite/bucatarie_shita_mana.jpg",
    imageAlt: "Schita de bucatarie desenata de mana",
    imageVariant: "photo" as const,
  },
  {
    title: "Design",
    description:
      "Clarificam directia cromatica, volumele si materialele.",
    image: "/portfolio/schite/bucatarie.png",
    imageAlt: "Randare digitala a unei bucatarii",
    imageVariant: "photo" as const,
  },
  {
    title: "Selectie materiale",
    description:
      "Alegem impreuna PAL, MDF vopsit sau infoliat pentru fiecare zona.",
    image: "/portfolio/schite/paletar.png",
    imageAlt: "Paletar cu mostre de materiale si finisaje",
    imageVariant: "photo" as const,
  },
  {
    title: "Oferta si contract",
    description:
      "Prezentam oferta detaliata si semnam contractul.",
    image: "/portfolio/schite/contract.png",
    imageAlt: "Ilustratie cu un contract si strangere de mana",
    imageVariant: "illustration" as const,
  },
  // {
  //   title: "Productie",
  //   description:
  //     "Executam cu feronerie Blum si atentie la fiecare detaliu.",
  // },
  {
    title: "Montaj & Predare",
    description:
      "Montaj complet, inclusiv electrocasnice si adaptari de instalatii.",
    image: "/portfolio/schite/bucatarie_randare1.jpg",
    imageAlt: "Randare finala a unei bucatarii montate",
    imageVariant: "photo" as const,
  },
];
```

Note: `as const` on `imageVariant` lets TypeScript narrow the union to `"photo" | "illustration"` at consumer sites without declaring an explicit type.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/process-steps-data.test.ts`
Expected: PASS — all four tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/site-data.ts tests/process-steps-data.test.ts
git commit -m "feat: add image fields to process steps data"
```

---

### Task 2: Fix Desktop Visibility Regression

**Files:**
- Modify: `components/home/sticky-process.tsx:105-117`

- [ ] **Step 1: Remove the CSS variable override that breaks desktop**

In `components/home/sticky-process.tsx`, locate the section element:

```tsx
<section
  ref={sectionRef}
  className="relative min-h-[100svh] min-h-[100dvh] overflow-hidden bg-[var(--home-charcoal)] text-[var(--home-ivory)] md:[--sticky-process-height:auto]"
  style={{ minHeight: "var(--sticky-process-height, 100dvh)" }}
>
```

Replace with:

```tsx
<section
  ref={sectionRef}
  className="relative min-h-[100svh] min-h-[100dvh] overflow-hidden bg-[var(--home-charcoal)] text-[var(--home-ivory)]"
  style={{ minHeight: "var(--sticky-process-height, 100dvh)" }}
>
```

The mobile-only `syncViewportHeight()` already removes the property on desktop via `section.style.removeProperty("--sticky-process-height")`, so the inline fallback `100dvh` applies cleanly without the override.

- [ ] **Step 2: Run lint to confirm no syntax errors**

Run: `npm run lint`
Expected: no errors in `components/home/sticky-process.tsx`.

- [ ] **Step 3: Run the dev server and visually confirm the section renders**

Run: `npm run dev` (background the process if desired).
In the browser at the home page, scroll to the Proces section on a desktop viewport (width > 991px). Confirm the charcoal panel is visible and GSAP pinning reveals each panel on scroll.

Record the result in the task description comment. If the section is still invisible on desktop, stop and investigate before continuing — do NOT proceed to Task 3.

- [ ] **Step 4: Commit**

```bash
git add components/home/sticky-process.tsx
git commit -m "fix: restore sticky process visibility on desktop"
```

---

### Task 3: Restructure Panel Markup With Image Column

**Files:**
- Modify: `components/home/sticky-process.tsx:118-147`

- [ ] **Step 1: Import `next/image` at the top of the file**

At the top of `components/home/sticky-process.tsx`, add the import (keep it with other imports):

```tsx
import Image from "next/image";
```

- [ ] **Step 2: Replace the panel markup block**

Locate the `{processSteps.map((step, index) => (...))}` block (currently lines 118-147 before edits in Task 2; the line range will have shifted slightly after Task 2).

Replace the entire `<article>` block with:

```tsx
{processSteps.map((step, index) => (
  <article
    key={step.title}
    data-process-panel
    className="absolute inset-0 flex flex-col bg-[var(--home-charcoal)] lg:grid lg:grid-cols-[1.05fr_0.95fr]"
  >
    <div
      className={
        "relative h-[55%] w-full overflow-hidden lg:h-full " +
        (step.imageVariant === "illustration"
          ? "bg-[var(--home-material)] p-10 lg:p-16"
          : "")
      }
    >
      <Image
        src={step.image}
        alt={step.imageAlt}
        fill
        sizes="(min-width: 1024px) 55vw, 100vw"
        priority={index === 0}
        className={
          step.imageVariant === "illustration"
            ? "object-contain"
            : "object-cover"
        }
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/75 via-black/40 to-transparent"
      />
      <span className="display-font pointer-events-none absolute bottom-4 left-4 text-[clamp(4.5rem,14vw,14rem)] leading-none tracking-[-0.08em] text-[var(--home-orange)] sm:bottom-6 sm:left-6 lg:bottom-10 lg:left-10">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
    <div className="relative flex flex-1 items-center px-6 py-10 sm:px-10 lg:px-16 lg:py-20">
      <div className="max-w-xl">
        <p className="home-kicker text-[color-mix(in_srgb,var(--home-ivory)_60%,transparent)]">
          Pasul {String(index + 1).padStart(2, "0")}
        </p>
        <h2 className="display-font mt-4 text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] tracking-[-0.05em] text-[var(--home-ivory)]">
          {step.title}
        </h2>
        <p className="mt-6 text-lg leading-8 text-[color-mix(in_srgb,var(--home-ivory)_68%,transparent)]">
          {step.description}
        </p>
      </div>
    </div>
  </article>
))}
```

Notes on the changes:
- The old `<div className="absolute inset-0 opacity-30" ...>` alternating color overlay is removed — the image is the visual now.
- The huge number moves inside the image frame with a gradient scrim for legibility.
- Mobile (below `lg`) stacks: image takes 55% of the panel height, text the rest.
- Desktop splits image / text into two columns with the image on the left.
- For the illustration variant (`contract.png`), the container uses `bg-[var(--home-material)]` with generous padding and `object-contain` so the flat white-background illustration sits on a branded card.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Run build to catch any type or import errors**

Run: `npm run build`
Expected: build completes. Pay attention to any warnings about missing image dimensions — `fill` is used here so there should be none.

- [ ] **Step 5: Visual verification in the dev server**

Run: `npm run dev`

In the browser:
1. Desktop viewport (≥ 1024px): scroll to Proces. Each panel reveals via clip-path as you scroll. Verify image occupies the left column, number overlays bottom-left, title + description are centered in the right column.
2. Mobile viewport (≤ 991px via device toolbar): verify image stacks above the text, number overlays bottom-left of the image, panel still fills the viewport height (no collapsed section).
3. Open the contract panel (step 04): verify the illustration is on a warm/material tinted background, not floating on white.
4. Trigger `prefers-reduced-motion` in DevTools: panels should be stacked statically (no pinning) and all images should render.

If any of the above fails, stop and investigate before committing.

- [ ] **Step 6: Commit**

```bash
git add components/home/sticky-process.tsx
git commit -m "feat: add images to sticky process panels"
```

---

### Task 4: Run Full Verification Suite

**Files:** none

- [ ] **Step 1: Run all existing tests together**

Run:

```bash
node --test --experimental-strip-types tests/process-steps-data.test.ts tests/sticky-process-viewport.test.ts tests/portfolio-immersive-state.test.ts tests/render-showcase-motion.test.ts
```

Expected: all tests pass. If any pre-existing test fails, it is out of scope; record and stop.

- [ ] **Step 2: Run lint once more across the repo**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 3: Run a production build**

Run: `npm run build`
Expected: build succeeds. Confirm the Proces route is not missing assets.

- [ ] **Step 4: Final commit (only if any repairs were needed)**

If steps 1-3 surfaced nothing to change, skip this step. Otherwise:

```bash
git add -A
git commit -m "chore: address lint/build follow-ups for sticky process images"
```
