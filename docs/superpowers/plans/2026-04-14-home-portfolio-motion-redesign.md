# Home And Portfolio Motion Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify `Acasa` into a calmer cinematic experience and move the existing immersive controlled-scroll showcase to `Portofoliu`.

**Architecture:** Keep home and portfolio as separate motion systems. Home gets a new auto-playing cinematic hero plus the existing downstream sections, while portfolio gets a dedicated immersive component derived from the current hero logic so it can control scroll end to end without home-specific dismissal behavior.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, GSAP, Lenis, `next/image`, global CSS, Node test runner, ESLint, Next build.

---

## Current Workspace Notes

- There are pre-existing local changes in `app/page.tsx`, `components/home/immersive-hero.tsx`, and untracked files outside this scope. Do not revert them.
- The approved spec is `docs/superpowers/specs/2026-04-14-home-portfolio-motion-redesign-design.md`.
- Available verification commands are `node --test --experimental-strip-types`, `npm run lint`, and `npm run build`.

## File Structure

- Create `lib/portfolio-immersive-state.ts`: pure scroll-state helpers for the portfolio immersive sequence.
- Create `tests/portfolio-immersive-state.test.ts`: Node tests for slide-index and progress behavior.
- Create `components/home/cinematic-hero.tsx`: the new calmer home hero.
- Create `components/portfolio/portfolio-immersive-showcase.tsx`: the migrated immersive route component.
- Modify `components/home/home-page-content.tsx`: replace the home immersive hero and intro flow with the new composition.
- Modify `components/home/home-animation-provider.tsx`: allow reveal setup without waiting for the intro loader.
- Modify `components/home/project-index.tsx`: remove the conflicting “real projects, not renders” copy.
- Modify `app/portfolio/page.tsx`: render the immersive portfolio route instead of the grid.
- Modify `app/globals.css`: add home cinematic hero and portfolio immersive route styles.

---

### Task 1: Add Scroll State Helpers And Failing Tests

**Files:**
- Create: `lib/portfolio-immersive-state.ts`
- Create: `tests/portfolio-immersive-state.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/portfolio-immersive-state.test.ts` with:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  getImmersiveScrollState,
  getImmersiveSectionHeight,
} from "../lib/portfolio-immersive-state.ts";

test("section height uses one full viewport step per slide", () => {
  assert.equal(getImmersiveSectionHeight(3, 900), 2700);
});

test("initial scroll state starts on the first slide", () => {
  assert.deepEqual(getImmersiveScrollState({
    scrollY: 0,
    sectionTop: 0,
    step: 900,
    slideCount: 3,
  }), {
    currentIndex: 0,
    nextIndex: 1,
    progress: 0,
  });
});

test("midway through the second slide transition reports the right pair", () => {
  assert.deepEqual(getImmersiveScrollState({
    scrollY: 1350,
    sectionTop: 0,
    step: 900,
    slideCount: 3,
  }), {
    currentIndex: 1,
    nextIndex: 2,
    progress: 0.5,
  });
});

test("the sequence clamps to the final slide without wrapping", () => {
  assert.deepEqual(getImmersiveScrollState({
    scrollY: 3600,
    sectionTop: 0,
    step: 900,
    slideCount: 3,
  }), {
    currentIndex: 2,
    nextIndex: 2,
    progress: 1,
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
node --test --experimental-strip-types tests/portfolio-immersive-state.test.ts
```

Expected: FAIL because `lib/portfolio-immersive-state.ts` does not exist yet.

- [ ] **Step 3: Write the minimal helper implementation**

Create `lib/portfolio-immersive-state.ts` with:

```ts
interface ImmersiveScrollStateInput {
  scrollY: number;
  sectionTop: number;
  step: number;
  slideCount: number;
}

interface ImmersiveScrollState {
  currentIndex: number;
  nextIndex: number;
  progress: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getImmersiveSectionHeight(slideCount: number, step: number) {
  return Math.max(slideCount, 1) * step;
}

export function getImmersiveScrollState({
  scrollY,
  sectionTop,
  step,
  slideCount,
}: ImmersiveScrollStateInput): ImmersiveScrollState {
  if (slideCount <= 1 || step <= 0) {
    return { currentIndex: 0, nextIndex: 0, progress: 1 };
  }

  const maxScroll = getImmersiveSectionHeight(slideCount, step);
  const relativeScroll = clamp(scrollY - sectionTop, 0, maxScroll);
  const cappedScroll = Math.min(relativeScroll, maxScroll - 1);
  const currentIndex = Math.min(Math.floor(cappedScroll / step), slideCount - 1);

  if (currentIndex >= slideCount - 1) {
    return { currentIndex: slideCount - 1, nextIndex: slideCount - 1, progress: 1 };
  }

  return {
    currentIndex,
    nextIndex: currentIndex + 1,
    progress: (cappedScroll % step) / step,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
node --test --experimental-strip-types tests/portfolio-immersive-state.test.ts
```

Expected: PASS with 4 passing tests.

---

### Task 2: Build The New Home Hero And Home Composition

**Files:**
- Create: `components/home/cinematic-hero.tsx`
- Modify: `components/home/home-page-content.tsx`
- Modify: `components/home/home-animation-provider.tsx`
- Modify: `components/home/project-index.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Create the cinematic home hero component**

Implement a client component that rotates through a small set of real project photos, auto-plays slowly, keeps the current home tone, and exposes a full-bleed image with restrained line accents and existing CTAs.

- [ ] **Step 2: Replace the home immersive opening with the new hero**

Update `components/home/home-page-content.tsx` so home renders the cinematic hero first, then the existing render showcase, project index, process, and final CTA.

- [ ] **Step 3: Start reveal setup without depending on the intro loader**

Adjust `components/home/home-animation-provider.tsx` so line/text reveal setup can start immediately when the page mounts, while still avoiding duplicate setup.

- [ ] **Step 4: Update conflicting project copy**

Replace the `ProjectIndex` heading with copy that can coexist with renders.

- [ ] **Step 5: Add matching global styles**

Add the new `.home-cinematic-*` styles and any small supporting line-accent classes to `app/globals.css`.

- [ ] **Step 6: Run lint for the touched home files**

Run:

```bash
npm run lint
```

Expected: PASS with no errors in the touched home files.

---

### Task 3: Move The Immersive Experience To Portfolio

**Files:**
- Create: `components/portfolio/portfolio-immersive-showcase.tsx`
- Modify: `app/portfolio/page.tsx`
- Modify: `app/globals.css`
- Read: `components/home/immersive-hero.tsx`
- Read: `lib/portfolio-immersive-state.ts`

- [ ] **Step 1: Create the dedicated portfolio immersive component**

Build a portfolio-only component based on the current immersive hero logic, but remove the home-specific exit behavior and internal route link so the sequence can live as the full page.

- [ ] **Step 2: Replace the portfolio route content**

Update `app/portfolio/page.tsx` to render the immersive portfolio component as the full route.

- [ ] **Step 3: Add any portfolio-only CSS refinements**

Add or extend styles in `app/globals.css` so the immersive route fills the page cleanly and does not leave an awkward blank exit state.

- [ ] **Step 4: Run lint again**

Run:

```bash
npm run lint
```

Expected: PASS with no errors in the portfolio files.

---

### Task 4: Verify The End-To-End Result

**Files:**
- Modify if needed after verification: touched files above

- [ ] **Step 1: Run focused tests**

Run:

```bash
node --test --experimental-strip-types tests/portfolio-immersive-state.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: PASS and Next.js completes a production build without errors.

- [ ] **Step 3: Review the final diff**

Run:

```bash
git status --short
git diff --stat
```

Expected: only the intended home, portfolio, helper, test, plan, and style files are changed.
