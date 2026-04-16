# Sticky Process Section — Refinement Design

**Date:** 2026-04-16
**Scope:** `components/home/sticky-process.tsx`, `lib/sticky-process-viewport.ts`, `lib/site-data.ts`, `app/globals.css`

## Problem

The sticky process section on the home page has four issues:

1. **Pin ignores the site header.** GSAP ScrollTrigger pins with `start: "top top"`, so panel content lands beneath the fixed `SiteHeader` (~72–96px, per `--site-header-height`). Most visible on mobile.
2. **No color cue on step change.** All five panels share the same charcoal background, so the clip-path reveal between steps is easy to miss.
3. **Desktop layout is reversed.** Image is on the left, text on the right. Should be text-left, image-right.
4. **Images fill the entire column.** They should be inset (~80%, centered) so the background tint forms a visible frame.

## Goals

- Pin the section flush against the bottom of the site header, not the top of the viewport.
- Give each of the five steps a distinct background color that narrates a warming progression.
- On desktop (`lg:`+), render text in the left column and the framed image in the right column. Mobile stack (image-above-text) is preserved.
- Inset each image to ~80% of its column, centered, with the per-step background tint visible around it.

## Non-goals

- No change to the scroll-scrub timing, the clip-path reveal style, or the panel order.
- No change to the `ProcessSection` component (`components/home/process-section.tsx`) — it's unused on the home page and out of scope.
- No new brand colors. The palette reuses existing `--home-*` tokens plus one `color-mix`-derived value.

## Architecture

Single-file surgical edits (Approach A). No new components or contexts. The panel JSX remains inline in `sticky-process.tsx`.

**Files changed:**

- `components/home/sticky-process.tsx` — JSX structure, GSAP start offset, image frame, per-step theming.
- `lib/sticky-process-viewport.ts` — subtract header height from pinned viewport math.
- `lib/site-data.ts` — add `processStepThemes` array indexed alongside `processSteps`.
- `app/globals.css` — add `--image-radius` token (single `1rem` value used by the image frame).

## Detailed design

### 1. Pinning fix (header offset)

`ScrollTrigger.create`'s `start` value must be a pixel offset, not a CSS var. Read the computed header height at setup and on refresh:

```ts
const getHeaderHeight = () => {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--site-header-height");
  const probe = document.createElement("div");
  probe.style.height = raw;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return px;
};
```

ScrollTrigger setup becomes:

```ts
start: () => `top ${getHeaderHeight()}`,
```

`invalidateOnRefresh: true` stays. The existing `visualViewport.resize` and `orientationchange` listeners already call `ScrollTrigger.refresh()`, which re-evaluates `start` via the function form.

`lib/sticky-process-viewport.ts` updates to accept and subtract `headerHeight`:

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
```

All callers in `sticky-process.tsx` pass `headerHeight: getHeaderHeight()`.

The section's CSS `min-height` becomes `calc(100svh - var(--site-header-height))`, matching the existing pattern at `app/globals.css:304` and `:371`.

### 2. Desktop layout swap (text left, image right)

Grid template changes from `lg:grid-cols-[1.05fr_0.95fr]` to `lg:grid-cols-[0.95fr_1.05fr]`. JSX source order flips: text `div` first, image `div` second. Mobile flex column is untouched — image on top (55% h), text below. Reading order now matches visual order on desktop (a11y win).

### 3. Image frame (80% centered)

Image column wraps the `<Image>` in a centered inner frame:

```tsx
<div className="relative flex h-full w-full items-center justify-center p-[8%] lg:p-[10%]">
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
```

- `p-[10%]` on `lg:`, `p-[8%]` below — consistent inset while keeping the mobile top-band image from going tiny.
- `aspect-[4/3]` gives all images a consistent crop regardless of source dimensions.
- `max-w-[min(80%,720px)]` caps width on wide viewports.
- `object-cover` is used for all images. The `imageVariant: "illustration" | "photo"` branch is removed — the inset + aspect frame makes illustrations look intentional without the `object-contain` special case.
- `--image-radius: 1rem` added to `:root` in `globals.css`.

### 4. Per-step color palette

`lib/site-data.ts` gains:

```ts
export const processStepThemes = [
  { background: "var(--home-charcoal)", foreground: "var(--home-ivory)",   accent: "var(--home-orange)"   },
  { background: "var(--home-stone)",    foreground: "var(--home-ivory)",   accent: "var(--home-orange)"   },
  { background: "var(--home-material)", foreground: "var(--home-charcoal)", accent: "var(--home-charcoal)" },
  { background: "color-mix(in srgb, var(--home-orange) 55%, var(--home-charcoal))", foreground: "var(--home-ivory)", accent: "var(--home-ivory)" },
  { background: "var(--home-ivory)",    foreground: "var(--home-charcoal)", accent: "var(--home-orange)"   },
] as const;
```

Applied per panel:

```tsx
const theme = processStepThemes[index];
<article
  data-process-panel
  className="absolute inset-0 flex flex-col lg:grid lg:grid-cols-[0.95fr_1.05fr]"
  style={{ backgroundColor: theme.background, color: theme.foreground }}
>
  ...
  <span className="display-font ..." style={{ color: theme.accent }}>
    {String(index + 1).padStart(2, "0")}
  </span>
  <h2 className="display-font ..." style={{ color: theme.foreground }}>{step.title}</h2>
  <p className="mt-6 ..." style={{ color: `color-mix(in srgb, ${theme.foreground} 68%, transparent)` }}>
    {step.description}
  </p>
  ...
</article>
```

The existing `text-[var(--home-ivory)]` / `text-[color-mix(...var(--home-ivory)...)]` hard-coded classes are removed in favor of the `theme.foreground`-derived inline styles.

### 5. Kicker ("Proces") legibility

The absolutely-positioned kicker at top-left sits over all five backgrounds. Gets:

```tsx
<p className="home-kicker" style={{ color: "var(--home-ivory)", mixBlendMode: "difference" }}>
  Proces
</p>
```

`mix-blend-mode: difference` inverts against whatever is behind it, so ivory reads as dark on the ivory step and light on the dark steps. No per-step logic needed.

### 6. Transition hairline fix

Panel initial clip-path becomes `inset(100% 0% -1% 0%)` (adds 1px bleed at the bottom) to prevent a visible seam between outgoing and incoming tints during scrub. GSAP target stays `inset(0% 0% 0% 0%)`.

### 7. Reduced motion

`prefersReducedMotion()` short-circuit behavior is unchanged. When active, panels render stacked with no pin / no clip-path animation. Per-step colors still apply (they're CSS, not JS-animated).

## Color rationale

| # | Step | Background | Foreground | Accent |
|---|------|-----------:|-----------:|-------:|
| 01 | Consultanta         | `#1a1a1a` charcoal          | ivory    | orange   |
| 02 | Design              | `#8c7d6f` stone             | ivory    | orange   |
| 03 | Selectie materiale  | `#c8aa87` material          | charcoal | charcoal |
| 04 | Oferta si contract  | `#7a3e15` roasted (derived) | ivory    | ivory    |
| 05 | Montaj & Predare    | `#ede7de` ivory             | charcoal | orange   |

- Warming progression: cool/dark → warm/light. Narrates "rough idea → finished product."
- Accents orange where orange pops (01, 02, 05); switched to foreground color on 03/04 where orange would muddy.
- Step 5 flips to dark-on-light to signal "final step / handover" and cap the arc.

## Testing

- **Visual smoke test** on desktop ≥1024px, tablet 768–1023px, mobile 320–767px:
  - Header never overlaps panel content.
  - Text is on the left, image on the right at `lg:`.
  - Image inset visibly shows the step tint around it.
  - Each step's tint is distinct; transitions reveal the next tint from top.
- **Reduced-motion check** (OS setting or DevTools emulation): panels stack without pin; colors still visible.
- **Image `alt` audit**: unchanged from source data.
- **Build**: `npm run build` must pass.

## Risks

- **`color-mix` support** — supported in all current evergreen browsers and in the same globals already using it (`app/globals.css:297`, `:350`, `:396`). No polyfill needed.
- **Header height read timing** — `getComputedStyle` on `document.documentElement` runs after CSS is applied. `useEffect` runs after first paint, so the var is resolved. `invalidateOnRefresh: true` + resize listeners catch any late changes.
- **`mix-blend-mode: difference` on kicker** — if behind stacking issues arise, fall back to a per-step `color` switch driven by the active panel index. Acceptable complexity cost if the blend-mode path fails.
