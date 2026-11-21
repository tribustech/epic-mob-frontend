# QA site-wide (21.11.2026)

Build de producție pe :3005 (commit 38036fd), Chrome real, viewport-uri 1440×900 și 390×844.

- 85 de pagini parcurse prin crawl și 99 de URL-uri verificate din sitemap.
- Rezultat: blocker 0, major 5, minor 13, polish 6.
- Fișiere salvate în acest folder: `crawl-results.json`, `home-inventory.json`, `axe/`, `lighthouse/`, `screenshots/`.

## Lighthouse

| Page | Preset | Perf | A11y | BP | SEO | LCP | TBT |
|---|---|---|---|---|---|---|---|
| / | mobile | **44** | 94 | 96 | 100 | 5.5 s | 4,380 ms |
| / | desktop | 98 | 94 | 96 | 100 | 1.1 s | 0 |
| /magazin | mobile | 83 | 96 | 96 | 100 | 4.6 s | 30 ms |
| /magazin | desktop | **60** | 96 | 96 | 100 | 2.0 s | 1,030 ms |
| /magazin/dressing-clasic-240 | mobile | 82 | 96 | 96 | 100 | 4.9 s | 10 ms |
| /magazin/dressing-clasic-240 | desktop | 100 | 96 | 96 | 100 | 0.8 s | 0 |
| /configurator | mobile | **46** | 96 | 93 | 100 | 5.9 s | 5,850 ms |
| /configurator | desktop | 99 | 96 | 96 | 100 | 0.8 s | 30 ms |

CLS e 0 pe toate paginile.

## Findings

| ID | Sev | URL | Viewport | Steps | Expected | Actual | Evidence |
|---|---|---|---|---|---|---|---|
| F-01 | Major | /sitemap.xml | n/a | Request every `<loc>` | All return 200 | 14 of 99 return 404: all `bucatarie-*` and `baie-*` products. `app/sitemap.ts` lists every SHOP_PRODUCTS entry, but the product page calls `notFound()` | `crawl-results.json` |
| F-02 | Major | /, /magazin, /configurator | mobile (/magazin: desktop) | Lighthouse | Perf ≥ 80 | 44 / 60 / 46; TBT 4.4 s / 1.0 s / 5.9 s | `lighthouse/` |
| F-03 | Major | all | both | axe wcag2aa | Contrast ≥ 4.5:1 | CTA #fbf8f3 on #c06a3e is 3.68:1, eyebrows 3.1–3.7:1, footer 2.57:1 | `axe/axe-summary.json` |
| F-04 | Major | menu | both | Enter on MENU, then Tab | Focus stays in the dialog | Focus escapes to the page behind | `screenshots/kbd-menu-open-*.png` |
| F-05 | Major | /cere-oferta, 404 | both | Open the pages | New warm header | Old black header and old logo; the 404 page is the default English Next.js page | `screenshots/page-desktop_cere-oferta.png` |
| F-06 | Minor | /, /cere-oferta | both | Check h1 | One descriptive h1 | Rotating slide label; no h1 on /cere-oferta | `screenshots/hero-desktop-3000ms.png` |
| F-07 | Minor | /magazin, /configurator, /contact, /cere-oferta, /intrebari-frecvente | n/a | Check og:image | Present | Missing | `crawl-results.json` |
| F-08 | Minor | several | n/a | Compare titles | Consistent brand | "EpicMob \| Epic Mob" | `crawl-results.json` |
| F-09 | Minor | all | both | Watch console | No errors | `/_vercel/insights/script.js` 404 off Vercel | `crawl-results.json` |
| F-10 | Minor | 24 pages | desktop | Watch console | No warnings | CSS preloaded but not used | `crawl-results.json` |
| F-11 | Minor | / | mobile | Measure tap targets | ≥ 24 px | Carousel dots 8 px, swatches 21 px | `home-inventory.json` |
| F-12 | Minor | / (Parcursul unui proiect) | both | axe, Tab | Focusable, readable | Not focusable; contrast 1.37–2.7:1 | `screenshots/home-desktop-s4.png` |
| F-13 | Minor | all | desktop | Tab from load | Skip link first | No skip link | keyboard test |
| F-14 | Minor | /cere-oferta | both | axe | Progress bar has an accessible name | No name; contrast 3.53:1 | `axe/axe-desktop_cere-oferta.json` |
| F-15 | Minor | all | both | First visit | Cookie banner reachable and unobtrusive | Last in tab order; covers 28% of the screen on mobile, including the sticky cart bar | `screenshots/hero-mobile-3000ms.png` |
| F-16 | Minor | shop | both | Lighthouse | Images sized to their slot | Raw 1200 px webp without next/image wastes 0.7–0.9 MB | `lighthouse/lh-magazin-*` |
| F-17 | Minor | /materiale/anchors | both | Open | Not in production | Dev page is public, no noindex | `screenshots/page-desktop_materiale_anchors.png` |
| F-18 | Minor | footer | both | axe | ≥ 4.5:1 | 2.57:1 | `axe/axe-summary.json` |
| F-19 | Polish | menu | both | Open MENU | Sequential numbers | "05" appears twice | `screenshots/kbd-menu-open-desktop.png` |
| F-20 | Polish | all | both | Read labels | Romanian | MENU / CLOSE / NEXT | same |
| F-21 | Polish | / | both | Compare CTAs | Same destination | Hero CTA goes to /contact, header CTA to /cere-oferta | `home-inventory.json` |
| F-22 | Polish | /portfolio?cat=comercial | both | Click "Comercial" | Projects shown | 0 projects | n/a |
| F-23 | Polish | /configurator | both | Watch console | No warnings | THREE.Clock deprecation warning | `crawl-results.json` |
| F-24 | Polish | footer | both | View footer | Social links | None, although the structured data lists Instagram and TikTok | `screenshots/home-desktop-full.png` |

## Ce funcționează

- **Pagini și imagini:** cele 85 de pagini răspund cu 200. Nu există imagini stricate și nici conținut mixt (HTTP pe HTTPS).
- **Mobil:** nicio pagină nu face scroll orizontal la 390 px.
- **SEO și accesibilitate:**
  - Toate paginile au title, meta description și canonical, iar `lang` e setat pe `ro`.
  - Toate imaginile au alt, iar câmpurile formularului de contact au etichete.
- **Home:** secțiunea de magazin arată poze reale, nu schițe.
- **Cookie-uri:** alegerea se păstrează după reîncărcare.
- **Dark mode:** site-ul nu are o temă întunecată, dar nimic nu se strică atunci când sistemul e setat pe dark.
