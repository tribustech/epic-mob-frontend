# Sticky Process — Images + Desktop Visibility Fix

## Goals

1. Restore desktop visibility of the `StickyProcess` section (currently collapses to 0 height).
2. Add a reference image to each of the five process steps so each panel has visual weight beyond typography.
3. Handle the stylistic mismatch between photo/render assets and the flat `contract.png` illustration.

## Non-goals

- No changes to `components/home/process-section.tsx` (unused by the current home page).
- No changes to the GSAP timeline behavior, pin distance, or mobile viewport height logic — only the CSS variable override that breaks desktop.
- No new animation on the images themselves.

## Problem — desktop regression

`components/home/sticky-process.tsx` currently sets:

```tsx
className="... md:[--sticky-process-height:auto]"
style={{ minHeight: "var(--sticky-process-height, 100dvh)" }}
```

Inline `style` wins over the Tailwind `min-h-[100svh]` class. On viewports ≥ `md`, the custom property resolves to `auto`, so `min-height: auto`. All panels are `absolute inset-0`, giving the section no intrinsic content height. Result: section collapses and is invisible. Same issue on the inner wrapper `<div>` that uses `height: var(--sticky-process-height, 100dvh)`.

### Fix

Remove the `md:[--sticky-process-height:auto]` override. The mobile-only `syncViewportHeight()` already calls `section.style.removeProperty("--sticky-process-height")` on desktop, so the variable is unset there and the fallback `100dvh` applies naturally.

No other structural changes to pinning, clip-path reveal, or viewport sync logic are needed.

## Image column design

### Data model (lib/site-data.ts)

Extend each `processSteps` entry:

```ts
export const processSteps = [
  {
    title: "Consultanta",
    description: "...",
    image: "/portfolio/schite/bucatarie_shita_mana.jpg",
    imageAlt: "Schita de bucatarie desenata de mana",
    imageVariant: "photo",
  },
  {
    title: "Design",
    description: "...",
    image: "/portfolio/schite/bucatarie.png",
    imageAlt: "Randare digitala a unei bucatarii",
    imageVariant: "photo",
  },
  {
    title: "Selectie materiale",
    description: "...",
    image: "/portfolio/schite/paletar.png",
    imageAlt: "Paletar cu mostre de materiale si finisaje",
    imageVariant: "photo",
  },
  {
    title: "Oferta si contract",
    description: "...",
    image: "/portfolio/schite/contract.png",
    imageAlt: "Ilustratie cu un contract si strangere de mana",
    imageVariant: "illustration",
  },
  {
    title: "Montaj & Predare",
    description: "...",
    image: "/portfolio/schite/bucatarie_randare1.jpg",
    imageAlt: "Randare finala a unei bucatarii montate",
    imageVariant: "photo",
  },
];
```

`imageVariant` is a string union (`"photo" | "illustration"`) used only for visual treatment. Typing inferred from the literal; no explicit type export needed unless a consumer requires it.

### Panel layout (components/home/sticky-process.tsx)

Each `<article data-process-panel>` restructures to:

- **Desktop (`lg:`)** — two-column grid `grid-cols-[1.05fr_0.95fr]` (slight bias toward image for visual impact). Left column: image frame fills the column at full panel height. Right column: title and description, vertically centered.
- **Mobile / tablet** — single column. Image on top (aspect-ratio driven, roughly 4:3), number + title + description stacked below. Panel still fills the synced viewport height; the inner content becomes vertically scrollable within the panel if necessary (should not be with current copy length).

The giant step number ("01", "02", ...) moves **inside the image frame**, absolute-positioned at bottom-left with a soft dark gradient behind it for legibility. It no longer lives in its own grid column. This preserves the dramatic numbering while letting the image carry the visual weight.

### Image rendering

Use `next/image` with `fill` + `sizes` hints:

- Photo variant: `object-cover` inside a relative container filling the column/top area. No padding.
- Illustration variant: wrapper gets `bg-[var(--home-material)]` (or a warm tinted mix) and `p-10 lg:p-16`; image uses `object-contain`. This turns the white-background vector into a branded card rather than a floating asset.

Set `priority` on the first panel's image only. All others lazy-load (they animate in via clip-path anyway).

### Right column (text)

The existing title/description block stays the same typographically. Container classes adjust:

- Desktop: right column, `self-center`, `max-w-xl`, padded.
- Mobile: below the image, same max-width rules as today.

Remove the "0.55fr_1fr" grid and the standalone `<span>` rendering the big number.

## Accessibility

- Each `<Image>` gets `alt` text describing the step and scene (e.g. "Schita pe hartie a unei bucatarii" for Consultanta). Alt text lives in `processSteps` as a new `imageAlt` field — keeps copy alongside the rest of the step content.
- The panel's `<article>` already has an `h2` for the step title — preserved.

## Files changed

- `lib/site-data.ts` — add `image`, `imageAlt`, `imageVariant` fields to each of the 5 `processSteps` entries.
- `components/home/sticky-process.tsx` — remove `md:[--sticky-process-height:auto]` class; restructure panel markup per the layout section above; import `next/image`.

## Out of scope / future

- Code path `components/home/process-section.tsx` (unused by current home) is not touched. If it is re-enabled, a separate pass would propagate the image fields there.
- No parallax or Ken Burns on the images; if desired, a follow-up can add a subtle transform tied to panel progress.
