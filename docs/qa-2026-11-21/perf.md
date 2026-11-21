# EpicMob 3D performance audit, read-only (2026-11-21)

## Setup

- **Target:** production build at http://localhost:3005, served with `next start` from /tmp/epicmob-qa (commit 38036fd).
- **Machine:** Apple M1 Max, real Chrome with GPU (ANGLE Metal), Playwright 1.55.
- **Desktop profile:** 1440×900 at DPR 2.
- **Mobile profile:** 390×844 at DPR 3, CPU slowed 4×. The GPU cannot be throttled.
- **Kitchen:** not measured. The price API returns `400 Invalid body` for it with the local mock. The `kitchen*` entries in raw/ and screens/ show the previous dressing.
- **Measured instead:** Dressing 2.4 m, Dressing 3.6 m (closed and fully open), Comodă 1.6 m, and /magazin/dressing-mare-360.
- **Files:** raw/, lighthouse/, screens/, scripts/.

## Verdict

- The 3D view itself is fine on an M1 Max:
  - 113–120 fps while orbiting
  - 0 renders while idle (frameloop="demand" works)
  - no long tasks on option changes
  - no memory leak
- What the owner feels comes from three things:
  1. Every change waits about 430 ms; 400 ms of that is a fixed debounce on the price call, applied on first load too.
  2. The GPU does 2–2.5× more work per frame than needed (outlines and per-frame shadows). Weaker GPUs will fall below 60 fps.
  3. Mobile load is heavy on the main thread.

## Key metrics

| Metric | Desktop | Mobile (CPU 4×) |
|---|---|---|
| Time to first 3D frame (/configurator) | 864–973 ms (400 ms is the debounce) | 1,563–1,886 ms |
| 3D chunk (three.js, react-three-fiber, drei and the viewer) | 263 KB gz / 981 KB raw, 55.6% unused at load | same |
| Requests and data on load | 65 requests, 936 KB (28 of them Next.js prefetches) | 41 requests, 820 KB |
| Decor textures | 300×240 JPEGs, 16–20 KB each (fine) | same |
| Shop: "Rotește în 3D" to first frame | 1,096 ms (+264 KB) | 778 ms |
| Renders while idle | 0 | 0 |
| Orbit fps (120 Hz display) | 113.6, p95 9.2 ms; one 100–178 ms frame when a drag starts | 92.2 |
| CPU time per render (median / p95) | 0.7 / 1.1 ms | 2.6 / 3.8 ms |
| GPU frame time, 3.6 m | 3.28 ms | 3.03 ms |
| Draw calls: 2.4 m / 3.6 m / 3.6 m open / Comodă | 87 / 122 / 142 / 62 | same |
| Click to new model | ~430 ms | 448–1,279 ms |
| Long tasks over 50 ms per change | 0 | 0 (shop swatch: 53 and 63 ms) |
| Script time per change: colour / width / door | 11–31 / 50–63 / 13–77 ms | 46–91 / 227–269 / 55–107 ms |
| Heap growth after 30 changes | +0.8 MB, no leak | +0.9 MB |
| Lighthouse /configurator | 99 | 72 (LCP 3.9 s, TBT 620 ms, TTI 7.0 s) |
| Lighthouse /magazin/dressing-mare-360 | 100 | 88 |

Lighthouse varies between runs. The site-wide agent measured 46 on mobile for /configurator (TBT 5.9 s), so the mobile score should be treated as 46–72.

## GPU test (desktop, frame time with GPU sync)

| Scene | Baseline | No shadow casting | No outlines | Neither | DPR 1.5 | DPR 1 |
|---|---|---|---|---|---|---|
| 2.4 m | 3.00 ms | 2.25 | 1.55 | 1.21 | 1.97 | 1.26 |
| 3.6 m | 3.28 ms | 1.90 | 1.67 | 1.40 | 1.59 | 1.38 |
| 3.6 m, fully open | 3.50 ms | 2.62 | 1.77 | 1.59 | 1.95 | 1.64 |

## Top 8 fixes by impact

Paths are relative to epic-mob-frontend-configurator/.

1. **Remove the debounce from first load and from clicks.** Very high impact, low effort.
   - Today: `lib/atelier/use-live-price.ts:4` waits 400 ms, applied at `:91` to every call.
   - Fix: 0 ms for the first call and for discrete clicks; about 150 ms only for sliders and typing.
   - Price the default preset on the server through ISR (`app/configurator/page.tsx:10`) and pass the result in.
   - For colour-only changes, apply the materials right away (`atelier-configurator.tsx:147-149`) and let the price follow.
2. **Replace the per-panel drei `<Edges>`.** −49% GPU, low–medium effort.
   - Locations: `components/atelier/viewer-3d.tsx` lines 619, 794, 903, 963, 1021 and 1168. They add 23–33 transparent fat-line draws per frame.
   - Fix: darken the edges inside the board shader, or merge them into one `LineSegments` per scene.
3. **Stop redrawing the shadow map every frame.** −25 to −42% GPU, low effort.
   - Locations: `viewer-3d.tsx:1844` and the KeyLight at `:1550-1559`. There are 44 shadow casters.
   - Fix: `shadowMap.autoUpdate=false`, and set `needsUpdate` only when the scene changes or an animation runs (`viewer/motion.ts:52-63`).
   - Drop castShadow on handles, rails and drawer boxes, and turn shadows off on phones.
4. **Lower the DPR.** −40 to −58% GPU, trivial effort.
   - Location: `viewer-3d.tsx:1843`, where `dpr={[1,2]}`.
   - Fix: `[1,1.5]` plus `<PerformanceMonitor>`/`<AdaptiveDpr>`, capped at 1.5 on phones (`usePhoneBox` at `:1653`).
5. **Make the 3D chunk smaller and load it earlier.** Helps mobile LCP and TBT, medium effort.
   - Today: `import * as THREE` (`viewer-3d.tsx:7`, `viewer/hardware.tsx:3`) pulls in all of three.js, plus drei and three-stdlib.
   - Fix: named imports; drop drei `Edges`/`Line`; take OrbitControls directly from three/examples.
   - Preload the chunk on /configurator instead of after hydration (`atelier-configurator.tsx:43`).
   - In the shop, prefetch it on hover or focus of "Rotește în 3D" (`components/shop/product-view.tsx:18`).
6. **Stop compiling shaders synchronously.** Medium impact, low effort.
   - Set `gl.debug.checkShaderErrors=false` in production; that check took 75 ms on mobile.
   - `useLookMaterial` (`viewer-3d.tsx:211-225`) creates a new material per change. Mutate the existing materials instead.
   - Warm up the mirror/glass materials (`:1185-1262`) with `compileAsync`.
7. **Stop rebuilding every panel on each size change.** Medium impact, medium effort.
   - Today: `grainBox`/`useGrainBox` (`viewer-3d.tsx:174-204`) keys each geometry on world position, so a resize costs 50–63 ms on desktop and 227–269 ms on mobile.
   - Fix: one shared unit box (as in `viewer/hardware.tsx:14`) with grain UVs computed in the shader, then `InstancedMesh` per material.
8. **Stop re-rendering the whole scene on hover and UI state changes.** Low–medium impact, low effort.
   - Today: `setHover` (`viewer-3d.tsx:1404, 1431-1440`) and a new `onToggle` on every render (`:1745` → `:1871`).
   - Fix: keep hover in a ref with one shared glow mesh; wrap `onToggle` in `useCallback`; wrap the panels in `React.memo`; move overlay state (`:1883`) outside `<Canvas>`.

Checked and fine: the demand render loop, textures and their caching (`viewer-3d.tsx:86-151`), disposal (no leak), and lazy loading of the 3D code on both routes.
