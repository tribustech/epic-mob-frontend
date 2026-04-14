# Liquid Glass Navigation Redesign

## Summary

Redesign the site header from a traditional full-width bar into an iOS liquid glass-inspired layout with a frosted pill containing the navigation links, centered in the viewport.

## Layout

```
[Logo image]  ·········  [ Glass Pill: Acasa  Portofoliu  Configurator  Contact ]  ·········  [Incepe proiectul]
   left                                    center (absolute)                                       right
```

- **Logo** (left): `epicmob-logo-transparent.png`, ~40px height, always full size. Inverted white on dark backgrounds.
- **Glass pill** (center): Absolutely centered in viewport via `left-1/2 -translate-x-1/2`. Contains the four nav links.
- **CTA** (right): "Incepe proiectul" rounded button, outside the pill.

## Scroll Behavior

- **At top**: No glass pill visible — nav links float freely. Homepage gets a subtle dark tint backdrop. Other pages are fully transparent.
- **On scroll (>40px)**: Glass pill fades in around the menu items with a 500ms transition. Header bar itself stays transparent — the pill carries all visual weight.

## Glass Pill Visual Treatment

- `background: rgba(255, 255, 255, 0.55)` — semi-transparent white
- `backdrop-filter: blur(24px)` — heavy frosted glass
- `border: 1px solid rgba(255, 255, 255, 0.35)` — subtle glass edge
- `box-shadow`: outer shadow for depth + inset highlight for light refraction
- `border-radius: 9999px` — full pill shape
- All properties transition from transparent/none to visible for smooth materialisation

## Colors

- Always white/light glass regardless of page — consistent across all routes
- Link colors adapt: `text-navy/60` when scrolled (inside pill), ivory/white at top on dark pages
- Active link: `text-gold`

## Logo

- Uses `next/image` with `epicmob-logo-transparent.png`
- `brightness-0 invert` filter on dark backgrounds (homepage, non-scrolled)
- Natural colors when scrolled (against light content)

## Mobile

- Unchanged — hamburger menu with full-screen overlay
- Glass pill is `hidden md:flex`

## Decisions Made

| Question | Choice | Reasoning |
|----------|--------|-----------|
| Glass style | Full frosted glass (heavy blur) | Premium, Apple visionOS feel |
| Scroll behavior | Transparent at top, glass on scroll | Hero breathes at top, pill materialises as anchor |
| Logo | Full image always | Clean and confident, no shrink animation needed |
| Glass color | Always white/light | Consistent UI element, blur handles background adaptation |
