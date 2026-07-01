# EpicMob — Cinematic v2 Migration

> **Read me first.** This is a complete migration brief for `epic-mob-frontend`. The goal is to retire the navy/gold "premium" track and consolidate the entire app onto the cinematic palette already used by the home immersive hero. Work in the order below — tokens, then chrome, then component classes, then page-by-page surfaces. Do **not** invent new tokens beyond what's listed here. Do **not** keep navy/gold as fallbacks; this is a hard delete.

> **Scope:** full sweep. Token layer, shared chrome (header, footer, menu, section heading), components (cards, glass icons, buttons, pills, materials), and page-level chrome (configurator, contact, value-props, services-showcase, materials-section, portfolio-preview, process-section, configurator-preview, final-cta, hero).

> **Codebase note:** this is the new Next.js (per `AGENTS.md`). Read `node_modules/next/dist/docs/` before any structural change. **No structural changes are required by this migration** — only Tailwind/CSS class swaps and `globals.css` rewrites.

---

## 0. The cinematic palette (single source of truth)

All tokens. There is no other palette.

| Token | Value | Use |
|---|---|---|
| `--black` | `#070707` | Page background, hero stage |
| `--charcoal` | `#1a1a1a` | Card grounds, secondary surfaces |
| `--ash` | `#2a2a2a` | Image placeholder, deep wells |
| `--ember` | `#d66c00` | Primary accent — buttons, links, focus, eyebrow |
| `--ember-deep` | `#b35700` | Primary button hover |
| `--ember-soft` | `rgba(214, 108, 0, 0.18)` | Selection tint, focus rings, menu radial |
| `--ivory` | `#ede7de` | Default text, hero card ground |
| `--ivory-72` | `rgba(237, 231, 222, 0.72)` | Body copy mute |
| `--ivory-48` | `rgba(237, 231, 222, 0.48)` | Meta, secondary border |
| `--ivory-24` | `rgba(237, 231, 222, 0.24)` | Default pill border, hairline |
| `--ivory-12` | `rgba(237, 231, 222, 0.12)` | Card hairline, divider |
| `--material` | `#c8aa87` | Process strip step 03 only |
| `--stone` | `#8c7d6f` | Process strip step 02 only |

**Shadows (warm-black, not ambient blue):**

```css
--shadow-card:        0 1.25rem 3rem   rgba(0, 0, 0, 0.45);
--shadow-card-hover:  0 1.75rem 4.5rem rgba(0, 0, 0, 0.55);
--shadow-cinematic:   0 1.25rem 4rem   rgba(0, 0, 0, 0.42);
```

**Typography:** unchanged. `--font-display` (Cormorant Garamond) and `--font-body` (Manrope) keep their existing roles.

---

## 1. `app/globals.css` — token rewrite

### 1a. Replace the `@theme` block (top of file)

**Before:**
```css
@theme {
  --color-bg: #F4F6FF;
  --color-navy: #10375C;
  --color-gold: #F3C623;
  --color-amber: #EB8317;
  --shadow-card: 0 8px 32px rgba(16, 55, 92, 0.10), 0 2px 8px rgba(16, 55, 92, 0.06);
  --shadow-card-hover: 0 16px 48px rgba(16, 55, 92, 0.16), 0 4px 12px rgba(16, 55, 92, 0.08);
  --shadow-elevated: 0 20px 60px rgba(16, 55, 92, 0.14), 0 8px 24px rgba(16, 55, 92, 0.08);
  --shadow-header: 0 4px 30px rgba(16, 55, 92, 0.08);
}

:root {
  --color-gold-soft: rgba(243, 198, 35, 0.16);
  --color-amber-soft: rgba(235, 131, 23, 0.16);
}
```

**After:**
```css
@theme {
  --color-stage:    #070707;
  --color-charcoal: #1a1a1a;
  --color-ash:      #2a2a2a;
  --color-ember:    #d66c00;
  --color-ember-deep: #b35700;
  --color-ivory:    #ede7de;
  --color-material: #c8aa87;
  --color-stone:    #8c7d6f;

  --shadow-card:        0 1.25rem 3rem   rgba(0, 0, 0, 0.45);
  --shadow-card-hover:  0 1.75rem 4.5rem rgba(0, 0, 0, 0.55);
  --shadow-cinematic:   0 1.25rem 4rem   rgba(0, 0, 0, 0.42);
}

:root {
  --ember-soft: rgba(214, 108, 0, 0.18);
  --ivory-72:   rgba(237, 231, 222, 0.72);
  --ivory-48:   rgba(237, 231, 222, 0.48);
  --ivory-24:   rgba(237, 231, 222, 0.24);
  --ivory-12:   rgba(237, 231, 222, 0.12);

  /* Keep the existing home-* aliases — they're used by the immersive hero. */
  --home-black: var(--color-stage);
  --home-charcoal: var(--color-charcoal);
  --home-orange: var(--color-ember);
  --home-orange-soft: var(--ember-soft);
  --home-ivory: var(--color-ivory);
  --home-material: var(--color-material);
  --home-stone: var(--color-stone);
}
```

> Tailwind utilities reading from `@theme` will now expose `bg-stage`, `text-ivory`, `bg-ember`, `bg-charcoal`, `text-ember`, `bg-material`, `bg-stone`. The old `bg-bg`, `text-navy`, `bg-navy`, `text-gold`, `bg-gold`, `text-amber`, `bg-amber` utilities **disappear**. All callsites must be migrated (see §3).

### 1b. Body chrome

**Before:**
```css
body {
  font-family: var(--font-body), sans-serif;
  background-color: var(--color-bg);
  color: var(--color-navy);
}

::selection {
  background: rgba(243, 198, 35, 0.24);
  color: var(--color-navy);
}
```

**After:**
```css
body {
  font-family: var(--font-body), sans-serif;
  background-color: var(--color-stage);
  color: var(--color-ivory);
}

::selection {
  background: var(--ember-soft);
  color: var(--color-ivory);
}
```

### 1c. `.eyebrow`

**Before:**
```css
.eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.35em;
  color: var(--color-gold);
}
```

**After:**
```css
.eyebrow {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.36em;
  color: var(--color-ember);
}
```

### 1d. **Delete** these blocks entirely

These classes are retired. Remove from `globals.css`:

- `.card-premium` and `.card-premium:hover`
- `.glass-icon`, `.glass-icon::before`, `.glass-icon::after`, `.glass-icon:hover`, `.glass-icon svg`
- `.glass-icon-sm`, `.glass-icon-sm::before`, `.glass-icon-sm svg`
- `.navy-glass-card`, `.navy-glass-card:hover`
- `.gold-left-accent`, `.gold-left-accent::before`

### 1e. Add the new card + icon

```css
/* ── Cinematic card ── */
.card-cinematic {
  background: var(--color-charcoal);
  border: 1px solid var(--ivory-12);
  border-radius: 1rem;
  transition: transform 0.35s ease, border-color 0.35s ease;
}
.card-cinematic:hover {
  transform: translateY(-4px);
  border-color: var(--color-ember);
}

/* ── Ember icon (replaces glass-icon) ── */
.ember-icon {
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-ember);
  color: var(--color-ember);
}
.ember-icon svg {
  width: 1.25rem;
  height: 1.25rem;
  stroke-width: 1.5;
}
.ember-icon-sm {
  width: 2.25rem;
  height: 2.25rem;
}
.ember-icon-sm svg {
  width: 1rem;
  height: 1rem;
}
```

### 1f. Search and replace inside `globals.css`

After §1a–1e, do a final pass on the file:

- `var(--color-bg)` → `var(--color-stage)`
- `var(--color-navy)` → `var(--color-ivory)` (this is correct — navy was *foreground* on a sky background; ivory is *foreground* on the black stage)
- `var(--color-gold)` → `var(--color-ember)`
- `var(--color-amber)` → `var(--color-ember)`
- `var(--color-gold-soft)` → `var(--ember-soft)`
- `var(--color-amber-soft)` → `var(--ember-soft)`
- `rgba(16, 55, 92, ...)` shadow remnants → use the new `--shadow-card` family
- `rgba(243, 198, 35, ...)` → `var(--ember-soft)` for tints, `var(--color-ember)` for solids

### 1g. Site menu gradient

**Before** (around line ~1230):
```css
.site-menu {
  background:
    radial-gradient(circle at 84% 12%, rgba(243, 198, 35, 0.16), transparent 28%),
    linear-gradient(135deg, #070707 0%, #15130f 56%, #23170d 100%);
}
```

**After:**
```css
.site-menu {
  background:
    radial-gradient(circle at 84% 12%, var(--ember-soft), transparent 32%),
    linear-gradient(135deg, #070707 0%, #15130f 56%, #1f1208 100%);
}
```

### 1h. `.site-menu__primary-link--cta`

**Before:** `color: var(--color-gold);` → **After:** `color: var(--color-ember);`

---

## 2. `app/layout.tsx`

**Before:**
```tsx
<body className="min-h-full bg-bg text-navy antialiased">
```

**After:**
```tsx
<body className="min-h-full bg-stage text-ivory antialiased">
```

---

## 3. Tailwind class migration map

Apply across **every `.tsx`** in `app/` and `components/`. This is a search-and-replace pass.

| Old class | New class |
|---|---|
| `bg-bg` | `bg-stage` |
| `bg-navy` | `bg-stage` (when used as a section background — currently `services-showcase`, `configurator-preview`, `hero`, `site-footer`) |
| `bg-navy/0` | `bg-stage/0` |
| `bg-navy/40` | `bg-stage/60` |
| `bg-navy/[0.02]` | `bg-ivory/[0.04]` |
| `bg-navy/5` | `bg-ivory/5` |
| `bg-gold` | `bg-ember` |
| `bg-gold/10` | `bg-ember/10` |
| `bg-gold/16` | `bg-ember/16` |
| `bg-white` (card grounds, e.g. `materials-section` chip) | `bg-charcoal` |
| `bg-white/90` (overlay chips) | `bg-ivory/90` (keep ivory ink) |
| `text-navy` | `text-ivory` |
| `text-navy/40` | `text-ivory/48` |
| `text-navy/55` | `text-ivory/72` |
| `text-navy/60` | `text-ivory/72` |
| `text-navy/65` | `text-ivory/72` |
| `text-gold` | `text-ember` |
| `text-gold/80` | `text-ember/80` |
| `text-white` | `text-ivory` |
| `text-white/50` | `text-ivory/48` |
| `text-white/70` | `text-ivory/72` |
| `border-navy` | `border-ivory/48` |
| `border-navy/5` | `border-ivory/12` |
| `border-navy/12` | `border-ivory/24` |
| `border-navy/15` | `border-ivory/24` |
| `border-navy/20` | `border-ivory/24` |
| `border-gold` | `border-ember` |
| `hover:bg-navy` | `hover:bg-charcoal` |
| `hover:bg-navy/5` | `hover:bg-ivory/5` |
| `hover:text-gold` | `hover:text-ember` |
| `hover:text-white` | `hover:text-ivory` |
| `focus:border-gold` | `focus:border-ember` |
| `hover:border-navy` | `hover:border-ember` |
| `shadow-[0_12px_32px_rgba(243,198,35,0.35)]` | `shadow-[0_12px_32px_rgba(214,108,0,0.4)]` |
| `shadow-[0_0_8px_rgba(243,198,35,0.4)]` | `shadow-[0_0_8px_rgba(214,108,0,0.5)]` |
| `shadow-[0_0_0_4px_rgba(243,198,35,0.12)]` | `shadow-[0_0_0_4px_rgba(214,108,0,0.18)]` |
| `shadow-[0_0_0_6px_rgba(243,198,35,0.12)]` | `shadow-[0_0_0_6px_rgba(214,108,0,0.18)]` |
| `shadow-[0_0_0_1px_rgba(243,198,35,0.22),0_12px_40px_rgba(243,198,35,0.14)]` | `shadow-[0_0_0_1px_rgba(214,108,0,0.3),0_12px_40px_rgba(214,108,0,0.18)]` |

> **Buttons that combined `bg-gold` + `text-navy`** (e.g. `final-cta`, `configurator-preview`, `hero`, `contact`, `configurator-page-view`) become `bg-ember text-stage`. Black ink on ember-orange is correct — verify contrast in the browser, but the ratio is well above 4.5:1.

---

## 4. Component-by-component edits

### 4a. `components/section-heading.tsx`

The `variant` prop becomes redundant — every section sits on a dark stage now. Simplify:

```tsx
type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
};

export function SectionHeading({ eyebrow, title, description, centered = false }: SectionHeadingProps) {
  return (
    <div className={`max-w-3xl ${centered ? "mx-auto text-center" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="display-font mt-4 text-4xl leading-tight text-ivory sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      {description && (
        <p className={`mt-5 max-w-2xl text-base leading-8 text-ivory/72 ${centered ? "mx-auto" : ""}`}>
          {description}
        </p>
      )}
    </div>
  );
}
```

> Update every callsite: remove the `variant="dark"` / `variant="light"` prop. If any callsite relied on `variant="dark"` for white text on a navy section, that section is now black-on-stage anyway, so removing the prop is correct.

### 4b. `components/site-footer.tsx`

- `<footer className="bg-navy">` → `<footer className="bg-charcoal">` (charcoal differentiates the footer from the page stage; ember rule line stays).
- `<div className="h-0.5 bg-gold" />` → `<div className="h-0.5 bg-ember" />`
- `text-gold` → `text-ember`, `text-white/50` → `text-ivory/48`, `hover:text-gold` → `hover:text-ember`.

### 4c. `components/home/value-props.tsx`

The trust grid (Consultanta / Design / Blum / Contract / Montaj). **Pixel-priority** — get this one right before anything else.

- Section: `bg-bg` → `bg-stage`. Keep section-space rhythm.
- Card wrapper: `card-premium p-8` → `card-cinematic p-8`.
- Icon: `<div className="glass-icon">` → `<div className="ember-icon">`. Drop the gradient SVG; the SVG inside should keep its current paths but inherit `currentColor` (which is now ember).
- Title: `text-navy` → `text-ivory`. Body: `text-navy/55` → `text-ivory/72`.

### 4d. `components/home/services-showcase.tsx`

- Section: `bg-navy` → `bg-stage`.
- Cards: `navy-glass-card gold-left-accent` → `card-cinematic` plus a new accent rule:

```tsx
<article className="card-cinematic relative px-8 py-8 sm:px-10 sm:py-10">
  <span aria-hidden className="absolute left-0 top-4 bottom-4 w-px bg-ember" />
  <span className="display-font text-5xl leading-none text-ember/80 sm:text-6xl">
    {/* existing index */}
  </span>
  {/* existing content, with text-* migrated per §3 */}
</article>
```

> The 3px gold-gradient bar becomes a 1px ember hairline. This is intentional — the cinematic system uses 1px hairlines almost everywhere.

### 4e. `components/home/materials-section.tsx`

- Section: `bg-bg` → `bg-stage`.
- Pill chip overlay: `bg-white/90 ... text-navy` → `bg-ivory/90 ... text-charcoal` (keep the contrast inversion — this chip rides on top of imagery).
- Bullet dot: `bg-gold` → `bg-ember`. Body: `text-navy/65` → `text-ivory/72`.
- Table head: `text-navy/40` → `text-ivory/48`. Body cells: `text-navy/60` → `text-ivory/72`. Borders: `border-navy/5` → `border-ivory/12`. Hover: `hover:bg-navy/[0.02]` → `hover:bg-ivory/[0.04]`.
- Price tag: `bg-gold/10 ... text-navy` → `bg-ember/16 ... text-ember`.
- Table wrapper background (currently implicitly white): wrap `<table>` in a `<div className="card-cinematic overflow-hidden">` so it sits on charcoal, not bare stage.

### 4f. `components/home/portfolio-preview.tsx`

- Section: `bg-bg` → `bg-stage`.
- "Vezi tot" button: `border-2 border-navy/15 ... text-navy ... hover:border-navy hover:bg-navy hover:text-white` → `border border-ivory/24 ... text-ivory ... hover:border-ember hover:bg-ember hover:text-stage`. (Reduce `border-2` to `border` to match the rest of the system.)
- Tile hover overlay: `bg-navy/0 ... group-hover:bg-navy/40` → `bg-stage/0 ... group-hover:bg-stage/60`.
- `text-gold` on the space label → `text-ember`.

### 4g. `components/home/configurator-preview.tsx`

- Section: `bg-navy` → `bg-stage`.
- Card: `navy-glass-card p-8` → `card-cinematic p-8`.
- "in 2 minute." `text-gold` → `text-ember`.
- Bullet dot: `bg-gold shadow-[0_0_8px_rgba(243,198,35,0.4)]` → `bg-ember shadow-[0_0_8px_rgba(214,108,0,0.5)]`.
- CTA: `bg-gold ... text-navy ... hover:shadow-[0_12px_32px_rgba(243,198,35,0.35)]` → `bg-ember text-stage hover:bg-ember-deep hover:shadow-[0_12px_32px_rgba(214,108,0,0.4)]`. Drop the `hover:-translate-y-1` — cinematic surfaces don't lift; they shift colour.

### 4h. `components/home/process-section.tsx`

- Section: `bg-bg` → `bg-stage`.
- Timeline dots: `border-gold bg-bg shadow-[0_0_0_4px_rgba(243,198,35,0.12)]` → `border-ember bg-stage shadow-[0_0_0_4px_rgba(214,108,0,0.18)]`. Same treatment for the larger dot variant.
- Card: `card-premium p-6` → `card-cinematic p-6` (and `card-premium p-8` → `card-cinematic p-8`).
- Inner icon: `glass-icon-sm` → `ember-icon ember-icon-sm`.
- Step label: `text-gold` → `text-ember`.
- Title: `text-navy` → `text-ivory`. Body: `text-navy/55` → `text-ivory/72`.

### 4i. `components/home/final-cta.tsx`

- Decorative rules: `bg-gold` → `bg-ember`.
- Highlight word: `text-gold` → `text-ember`.
- CTA: `bg-gold ... text-navy ... hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(243,198,35,0.35)]` → `bg-ember text-stage hover:bg-ember-deep`. Drop the lift.

### 4j. `components/home/hero.tsx`

This is the **legacy** hero — the live home actually uses `cinematic-hero.tsx` / `immersive-hero.tsx`. If `hero.tsx` is still imported anywhere, migrate it; otherwise delete the file.

- `bg-navy` → `bg-stage`
- `bg-gold` rule, `text-gold` highlight → `bg-ember`, `text-ember`
- CTA + bottom info pills → migrate per §3
- Final inline shadow → `shadow-[0_12px_32px_rgba(214,108,0,0.4)]`

### 4k. `components/configurator/configurator-page-view.tsx`

The largest single surface. **Configurator chosen treatment:** full-bleed black, no imagery — pure form on the cinematic stage. Wrap the page root in:

```tsx
<div className="min-h-screen bg-stage text-ivory">
  {/* existing content */}
</div>
```

Then migrate every class per §3. Specifically:

- Selected pill: `rounded-full bg-gold px-4 py-3 text-sm font-semibold text-navy shadow-[0_0_0_1px_rgba(243,198,35,0.22),0_12px_40px_rgba(243,198,35,0.14)]` → `rounded-full bg-ember px-4 py-3 text-sm font-semibold text-stage shadow-[0_0_0_1px_rgba(214,108,0,0.3),0_12px_40px_rgba(214,108,0,0.18)]`.
- Idle pill: `rounded-full border border-navy/12 px-4 py-3 text-sm text-navy transition hover:bg-navy/5` → `rounded-full border border-ivory/24 px-4 py-3 text-sm text-ivory transition hover:bg-ivory/5`.
- Selected card: `border-gold bg-gold/16` → `border-ember bg-ember/16`.
- Idle card: `border-navy/12 bg-bg` → `border-ivory/24 bg-charcoal`.
- Inputs: `border-navy/12 bg-bg ... text-navy ... placeholder:text-navy/40 focus:border-gold` → `border-ivory/24 bg-charcoal ... text-ivory ... placeholder:text-ivory/48 focus:border-ember`. Change `rounded-2xl` → `rounded-none` to match the cinematic input shape.
- Eyebrow / labels: `text-navy/40` → `text-ember`, weight 800, tracking 0.24em (matches the `field__label` spec).
- Submit CTA: `bg-gold ... text-navy ... hover:-translate-y-0.5` → `bg-ember text-stage hover:bg-ember-deep`. Drop the lift.

### 4l. `app/contact/page.tsx`

- Wrap root: `<div className="min-h-screen bg-stage text-ivory">` (or migrate the existing wrapper class).
- Eyebrows: `text-gold` → `text-ember`.
- Phone/email labels: `text-navy` → `text-ivory`.
- Primary CTA: `bg-gold ... text-navy hover:-translate-y-0.5` → `bg-ember text-stage hover:bg-ember-deep`. Drop the lift.
- Secondary CTA: `border border-navy/20 ... text-navy ... hover:bg-navy hover:text-white` → `border border-ivory/24 ... text-ivory ... hover:bg-ivory hover:text-stage`.
- Trust list: `text-navy/60` → `text-ivory/72`.

### 4m. Docs

`docs/plans/2026-04-13-liquid-glass-nav-design.md` references `text-navy/60` and `text-gold`. Update copy (or note that the plan is superseded by v2 cinematic).

---

## 5. Acceptance checklist

After applying §1–4, verify in the browser:

- [ ] No occurrences of `text-navy`, `bg-navy`, `text-gold`, `bg-gold`, `text-amber`, `bg-amber`, `bg-bg` remain in any `.tsx` or `.css` (run `rg -n "(text|bg|border|hover:bg|hover:text|focus:border)-(navy|gold|amber)|bg-bg" app components`).
- [ ] No occurrences of `card-premium`, `glass-icon`, `glass-icon-sm`, `navy-glass-card`, `gold-left-accent` remain.
- [ ] No raw `#10375C`, `#F3C623`, `#EB8317`, `#F4F6FF`, `rgba(16, 55, 92, ...)`, `rgba(243, 198, 35, ...)`, `rgba(235, 131, 23, ...)` remain in source. (Ember-rgba `rgba(214, 108, 0, ...)` is allowed.)
- [ ] Home page renders fully on the black stage from header → hero → trust grid → services → portfolio preview → process → materials → configurator preview → final CTA → footer, with **zero** white/sky-blue surfaces breaking the rhythm.
- [ ] Configurator at `/configurator` is full-bleed black with ember focus state on inputs.
- [ ] Contact at `/contact` is full-bleed black; primary CTA is ember.
- [ ] Site menu gold radial is replaced with ember radial; menu CTA link is ember.
- [ ] `prefers-reduced-motion` still honoured on the immersive hero and process scenes (those files are untouched by this migration).

---

## 5b. Information architecture changes

In addition to the token migration, the IA changes:

- **Drop `/despre`.** Delete the route, its page component, and any associated content components. Don't fold the copy back into Home — for now, the home immersive sections carry the brand story implicitly. We may reintroduce a richer About later.
- **Replace `/portfolio` entirely.** The new direction is a cinematic full-bleed gallery with alternating image/text scenes per project, grouped into chapters (Bucatarii / Dressinguri / Detalii). See `portfolio-preview.html` in this project for the layout reference. Each project links to a dedicated case-study page (`/portfolio/[slug]`); stub the route with placeholder content for now.
- **Rebuild `/contact`.** Editorial split: huge phone number left, brief form right (name + phone + room pills + short message). Below: atelier strip with address + map placeholder. Form is a stub — wire to existing email backend if present, otherwise log + show success state. See `contact-preview.html` for the layout reference.
- **Navigation:** remove the `Despre` link from `lib/site-data.ts > navigation`. Keep `Acasa / Portofoliu / Contact + Cere oferta`.

## 6. Out of scope (do not touch)

- `lib/site-data.ts` content (copy + image references) — voice and data don't change.
- Image assets in `public/`.
- The immersive cinematic hero (`cinematic-hero.tsx`, `immersive-hero.tsx`) — already uses the cinematic palette.
- The render showcase (`render-showcase-motion`) — already cinematic.
- The split-text / GSAP / Framer Motion animation logic.
- `tests/` — these don't depend on colour tokens.
- Next.js config, Tailwind config beyond the `@theme` block.

---

## 7. Suggested commit sequence

1. `chore(tokens): cinematic palette in globals.css and @theme block`
2. `chore(tailwind): migrate bg-navy/text-navy/bg-gold/text-gold to cinematic`
3. `refactor(cards): retire card-premium and glass-icon for card-cinematic + ember-icon`
4. `refactor(section-heading): drop variant prop, default to ivory on stage`
5. `refactor(configurator): full-bleed cinematic treatment`
6. `refactor(contact): full-bleed cinematic treatment`
7. `refactor(footer,menu): cinematic surface chrome`
8. `chore: remove dead navy/gold callsites and verify acceptance checklist`

---

## 8. Prompt to paste into Claude Code

> I'm migrating `epic-mob-frontend` to a single cinematic palette. The full brief is in `HANDOFF.md` at the repo root — read it first.
>
> Apply the migration in commit-sequence order (§7). After each commit, run the acceptance ripgrep checks from §5 and report any leftover navy/gold/amber/bg-bg references before moving to the next commit.
>
> Do not invent tokens beyond those in §0. Do not preserve navy/gold as fallbacks. Do not touch anything in §6.
>
> Per `AGENTS.md`, this is the new Next.js — read `node_modules/next/dist/docs/` if any structural change becomes necessary, but the brief should not require any.
