# EpicMob Homepage — Crafto "Decor Store" Warm Redesign

**Date:** 2026-07-01
**Reference:** https://crafto.themezaa.com/decor-store/
**Scope:** Homepage only (header/footer left as-is this pass; palette/patterns roll to other pages later).

## Direction

Move EpicMob (Romanian interior-rendering + custom-furniture studio) away from the
dark cinematic look toward Crafto's **light, warm, editorial decor-store** aesthetic:
airy hero, icon "featured categories" tiles, and a bento gallery of render cards.

Decisions locked with the user:
- **Mood:** light & warm — match Crafto fully (flip away from dark black+ember).
- **Scope:** homepage first, for a fast visible result.
- **Featured categories = room types** (Bucătărie, Baie, Living, Dormitor, Birou, Comercial),
  matching existing render content and how clients think.

## Palette (new `@theme` tokens in `app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `--sand` | `#F5F0E8` | Page background |
| `--cream` | `#FBF8F3` | Cards, raised panels |
| `--clay` | `#EDE4D6` | Section bands, tile grounds |
| `--espresso` | `#2A2420` | Headlines, primary text |
| `--mocha-72` | `rgba(42,36,32,.72)` | Body copy |
| `--terracotta` | `#C06A3E` | Primary accent — buttons, links, eyebrow |
| `--olive` | `#7C7A54` | Secondary accent, category icons |
| `--line` | `rgba(42,36,32,.10)` | Hairlines, borders |

Typography unchanged: **Cormorant Garamond** (display) + **Manrope** (body).
Shadows become soft warm-neutral instead of blue.

## Homepage section order

1. **Hero** — editorial split. Left: terracotta eyebrow, big serif headline, one body line,
   two CTAs (filled "Cere o randare" + ghost "Vezi portofoliul"), trust chips.
   Right: large rounded render + two floating overlap chips (before/after schiță→randare,
   material swatch from `paletar.png`), subtle framer-motion float/parallax.
2. **Featured categories** — `--clay` band, 6 icon tiles (2→3→6 responsive). Lucide icons in
   olive-tinted circles, room label + count, hover lift + terracotta icon.
   Each links to `/portfolio?cat=<room>`.
   Icons: CookingPot, Bath, Sofa, BedDouble, Briefcase, Building2.
3. **Bento gallery** — centerpiece. CSS grid, asymmetric mixed spans (2×2 hero, 2×1 wide,
   1×1 squares, 1×2 tall). Rounded-2xl, cover images via `next/image`, bottom gradient +
   label/tag, hover zoom. Collapses 4→2→1 cols.
4. **Process strip** — `--cream`, 4 numbered steps (01 Schiță → 02 Randare 3D → 03 Producție →
   04 Montaj), serif terracotta numbers, connector line, sketch/contract imagery accents.
5. **Featured project / promo band** — full-bleed `--clay`, split image + story + "Detalii proiect"
   link to `/portfolio/[slug]` (already stubbed).
6. **Final CTA** — `--espresso` background, cream serif headline "Gata să-ți vezi camera?",
   terracotta button → `/contact`.

## Imagery available (`public/portfolio/`)

Renders: `kitchen-ornate-navy-full/overview/upper/shelves`, `kitchen-white-modern`,
`kitchen-navy-sink-*`, `living_randare1/2`, `baie_randare1/2`, `birou_randare1/2`,
`bucatarie_randare1/2`, `dressing-mirror-wardrobe`, `detail-*-handle`.
Sketches/accents: `schite/*.png` (baie, bucatarie, living), `bucatarie_shita_mana`,
`contract.png`, `paletar.png`.

## New / changed files (planned)

- `app/globals.css` — new warm `@theme` tokens + light utility classes (eyebrow, cards, buttons).
- `components/home/hero.tsx` — new light hero (replaces MaterialPinnedScene usage).
- `components/home/categories.tsx` — new.
- `components/home/bento-gallery.tsx` — new.
- `components/home/process.tsx` — new light process (replaces StickyProcess usage).
- `components/home/featured-project.tsx` — new.
- `components/home/final-cta.tsx` — light rebuild.
- `components/home/home-page-content.tsx` — recompose to the new section order.

Existing dark components kept on disk (not deleted) so nothing is lost; the homepage simply
stops importing them.

## Stack notes

Next 16 App Router (read `node_modules/next/dist/docs/` before structural changes),
Tailwind v4 `@theme`, framer-motion, gsap, lenis, lucide-react — all already installed.
Copy is placeholder Romanian, easy for the user to refine.
