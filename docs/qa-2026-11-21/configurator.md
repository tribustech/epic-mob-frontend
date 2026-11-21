# QA: Atelier 3D configurator (/configurator), 2026-11-21

Build: branch `claude/project-thread-jc08q7` @ `38036fd`. Dev server http://localhost:3000, production build http://localhost:3005. Prices come from the CRM mock on :4020. Tooling: Playwright 1.55 on real Google Chrome (GPU), @axe-core/playwright. Viewports: desktop 1440×900; mobile 390×844 and 430×932 (isMobile, hasTouch). Scripts are in /tmp/epicmob-qatools/s*.mjs. Screenshots are in this folder; the per-preset 3D sweep is in sweep/.

**Environment caveat.** The local CRM mock (`epicmob-ofertare-configurator` @ 95cd536, branch claude/project-thread-0nzbh7) rejects BUCATARIE/BAIE ({"error":"Invalid body"}). Its catalog has no `worktops` and no `drawerExtensions`. Kitchen/bath pricing and 3D, and the drawer-extension choice, therefore could not be exercised end to end. If the CRM changes for these live on another branch, retest against that CRM. Production behaves the same as here if the site ships before the CRM.

Severity counts: blocker 1 · major 4 · minor 9 · polish 5

| id | severity | URL | viewport | steps | expected | actual | screenshot |
|---|---|---|---|---|---|---|---|
| F01 | blocker | :3000/configurator (same on :3005) | all | Model → tap Bucătărie / Baie | Kitchen models, kitchen 3D and a price; or the chip hidden / a "Cere ofertă" fallback | No models (empty list). The 3D keeps the previous dressing with "Imaginea nu e la zi". "Preț indisponibil momentan + Reîncearcă" never helps. "Trimite cererea" is disabled: a dead end. `presetAvailable()` hides kitchen presets when there are no worktops, but `CATEGORY_DISPLAY` still shows the chips. Fix: gate the chips on the same condition and allow a lead without a price | 10-model-bucatarie.png, 10-model-baie.png, 11-bucatarie-*.png, 11-baie-*.png |
| F02 | major | :3000/configurator#interior | desktop | Comodă (drawers) → Compartimente; Dressing "Bară + sertare"; Kitchen → Module | The extraction choice is visible, toggles, and updates the price | Never renders: `DrawerRunners` returns null because `catalog.drawerExtensions` is absent. Cannot be verified; the share encode/decode and price-check handle PARTIALA (code review only) | 54-comoda-compartimente.png, 71-dressing-bara-sertare.png |
| F03 | major | #oferta | all | Config with drawers → Ofertă | The summary states the drawer runners | `step-offer.tsx` has no row for `drawerExtension` (code-confirmed) | 80-offer-panel.png |
| F04 | minor | /configurator | all | Toggle the extension → Anulează | "Am anulat: glisierele sertarelor" | `CHANGE_NAMES` lacks `setDrawerExtension`, so the toast says "interiorul" (code-confirmed) | – |
| F05 | minor | #interior | desktop | Dressing "Bară + sertare" | The runner choice is offered, if intended | `DRAWER_CONTENTS` excludes `BARA_SERTARE`; confirm intent | 71-dressing-bara-sertare.png |
| F06 | minor | Bucătărie/Baie | all | A config the CRM rejects with {error} | A clear "not supported" message | A 400 is shown as an outage with a futile Reîncearcă; console 400 errors | 10-model-bucatarie.png |
| F07 | major UX | #usi | all | Mânere → Profil ascuns (dressing hinged, comodă) | The buyer understands Gola | Name hides "Gola"; no how-to-open line; the photo (horizontal, kitchen) and the wardrobe 3D (vertical strips) disagree; Auriu finish offered; no price hint (5.218 vs 4.914–5.000 lei) | 42-handle-4.png, 43-gola-auriu-dressing.png, 52-comoda-gola.png, 84-form-sent.png |
| F08 | minor | #usi | desktop | Pick any handle | The handle seen in context | Extreme close-up crops the piece (comodă half cut off); "Deschide tot" hidden; no "see whole" control | 42-handle-*.png, 52-comoda-gola.png, 53-comoda-bara.png |
| F09 | major UX | #culori | all | Culori step | Obvious body/front choice | See the UX section | 20-dressing-step-2.png, 31-colors-separate-panel.png, 32-colors-carcass-peek.png, 35-colors-vopsit-options.png, 36-colors-melaminat.png |
| F10 | minor (dev only) | :3000#culori | desktop | Configure → external site → browser Back | Restored and interactive | Dev: default Dressing at Model, URL #culori, not hydrated (dead) until reload. Prod :3005 OK; soft Back from Portofoliu OK | 95-back-from-external-dev.png, 95-back-from-external-prod.png, 91-forward-after-leaving.png |
| F11 | minor | #oferta | desktop | Comodă: drawers + Uși batante → Ofertă | Contents listed | Only "2 compartimente", no Uși row | 80-offer-panel.png, 84-form-sent.png |
| F12 | polish | /configurator | all | Model step footer text | Up-to-date copy | "Bucătărie sau altceva? Cere o ofertă personalizată" although Bucătărie exists | 00-landing-desktop.png |
| F13 | polish | /configurator | desktop 1440 | Any step | All 6 tabs visible | Step bar scrolls; "Ofertă" is cut on step 1 and "Model" on steps 4–6 | 00-landing-desktop.png, 22-dressing-step-4.png |
| F14 | polish | /configurator | all | Comodă → Doar forma | Distinct names | "Comodă TV" ×2; generic "Nou", "Cel mai ales" | sweep/cat-Comoda-D2.png, sweep/cat-Comoda-D3.png |
| F15 | polish | #culori | all | Fronturi → Mat catifelat sau lucios | Romanian names | HG White, HG Black, HG Light Grey, Havana Coffee… | 36-colors-melaminat.png |
| F16 | minor | #dimensiuni | desktop | Lățime: type "5", Tab | 60 cm with a note, or an explicit "5 m" note | Silently 500 cm (metres heuristic), price 11.012 lei. 9999/abc/-100 handled well | 60-dim-5.png, 60-dim-9999.png |
| F17 | minor (verify) | #culori | desktop | Vopsit → "Și interiorul ușii" | Price updates | Stays 5.243 lei (may be the mock) | 35-colors-vopsit-options.png |
| F18 | minor a11y | /configurator | desktop | axe on each step | 0 serious | color-contrast: "Închide tot" white on #d66c00, 3.49:1; definition-list: dl > div > button in the summary | 70-dressing-interior.png |
| F19 | polish | /configurator | desktop | Comodă in 3D | One continuous top | Seam/double line where compartments meet | 50-comoda-model.png, 56-comoda-rotated.png, 84-form-sent.png |

## UX friction: Gola handles and colour choice

### Gola ("Profil ascuns")

1. The name hides it: the CRM label "Profil ascuns (Gola)" is shortened to "Profil ascuns".
2. "Linie continuă de aluminiu" gives the look, not how you open it; the other cards say how they work.
3. The photo shows a horizontal kitchen channel; the wardrobe 3D shows vertical strips; the comodă shows black bands.
4. It sits in the same grid as bar/knob, with Negru/Inox/Auriu finishes, and a gold Gola looks odd.
5. The most expensive option has no price hint. The locked "Doar la fronturi vopsite" cards look disabled, and their explanation opens below the grid, often off-screen.
6. The close-up camera never shows the clean front, which is the point of Gola.

**Fixes:**
- Rename the card "Profil Gola (fără mâner)" with the sub-line "Canal de aluminiu deasupra frontului: prinzi cu degetele".
- Pick the photo by category so it matches the 3D (horizontal for kitchen/comodă, vertical for wardrobes).
- Offer Gola finishes as Aluminiu / Negru / Ca fronturile.
- Add a relative price chip per handle card, using the deltas `price-check.ts` already produces.
- Frame the whole piece at ¾ after a handle pick, and add "Vezi tot".
- Make locked cards look actionable and explain inline under the tapped card.

### Colour choice

1. Colours are chosen before dimensions and doors; with mirror doors the configurator forces a white body (WHITE_BODY), undoing the choice.
2. The 39 palette cards are abstract two-square swatches with long supplier sub-names.
3. Changing only the fronts means opening the collapsed "Alege separat" at the bottom and scrolling past the body picker (362 decors). The panel is 1,796 px in a 638 px viewport. Picking a body colour silently drops the palette selection.
4. Front types are labelled by finish ("Aspect lemn și culori uni" / "Mat catifelat sau lucios" / "Vopsit în orice culoare"), with no material or price hint (painted: 4.257 → 5.243 lei). Paint options hide behind a quiet link.
5. English decor names; codes are hidden behind "Detalii".
6. "Culoare → oglindă → sticlă" on the door tiles means "panel", not colour.
7. The body-colour peek lasts 2.2 s, then the doors close and hide it.

**Fixes:**
- Reorder the steps to Model → Dimensiuni → Uși → Interior → Culori → Ofertă, and offer "Fronturi" only when fronts exist.
- Use `MiniPreview` renders of the current model on the palette cards.
- Add top tabs "Combinații gata | Aleg eu", with a segmented "Corp / Fronturi" switch inside "Aleg eu", and show a "Combinație personalizată" state.
- Name the front types by material with a price hint: "PAL (lemn și uni) · €", "MDF melaminat · €€", "MDF vopsit RAL · €€€".
- Use Romanian names with the code as a sub-line, and make search accept codes.
- Rename the door cycle to "Panou / Oglindă / Sticlă".
- Keep the doors open or translucent while editing the body.

## What works

- All dressing (10 ready-made + 21 shapes), comodă (4 + 13), separator (3 + 8) and suspendat (4 + 10) presets price and render. Steps adapt per category.
- The price updates on every change. 15 rapid "+" taps → 1 request, and one undo restores all 15 ("Am anulat: dimensiunile").
- Rapid category switching ends in a consistent state.
- Dimensions: clamping with a red note; garbage input keeps the previous value; comma decimals; slider and chips stay in sync; the too-tall-doors error links to the right step.
- 3D: rotate and zoom with limits (the page doesn't scroll while zooming), Deschide/Închide tot, click-to-open drawers, column highlight, door peek. Bar, knob, push and Gola render on the right fronts.
- Locked handles explain why and offer a one-tap switch to painted fronts.
- Share: "Link copiat"; `?c=` reopens the identical configuration (same summary and price) in a fresh context on dev and prod; the code is stripped from the URL; bad codes are ignored.
- Form: Romanian inline errors and a phone example; hidden honeypot; the payload includes the shown handle colour (GOLA/AURIU); the mock answered 200; the thank-you state and "Începe o configurație nouă" work.
- Reload keeps the configuration and step. Back/Forward between steps works, and prod restores after Back from an external site.
- Mobile 390 and 430: no overflow, and all measured targets are ≥ 44 px.
- Console: no JS errors on the dressing/comodă/separator/suspendat flows. The only errors are the 400s from F01/F06, plus the expected `/_vercel/insights/script.js` 404 on the local prod build. There is a `THREE.Clock` deprecation warning.
