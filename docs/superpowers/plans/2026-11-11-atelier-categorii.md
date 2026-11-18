# Atelier 3D — categoriile Comode, Separatoare, Corpuri suspendate

**Goal:** Activăm în Atelier și categoriile „Comode & noptiere”, „Separatoare cameră”, „Corpuri suspendate”, pe același motor CRM, același contract și aceeași pagină `/configurator`.

**Context:** Construit peste branch-urile `feat/atelier` din ambele repo-uri (vezi `2026-11-11-atelier-3d.md` și spec-ul). Proprietarul a cerut „fă și pentru celelalte cazuri, apoi îți spun ce modificăm” — regulile de mai jos sunt alegerile mele, editabile după feedback.

## Contract (lib/atelier/types.ts — identic în ambele repo-uri, compatibil înapoi)

```ts
export type AtelierCategory = 'DRESSING' | 'COMODA' | 'SEPARATOR' | 'SUSPENDAT';
export type ColumnContent =
  | 'POLITE' | 'BARA' | 'BARA_DUBLA' | 'POLITE_BARA' | 'BARA_SERTARE'   // dressing
  | 'SERTARE' | 'USI' | 'DESCHIS' | 'USA_RIDICABILA';                   // comodă / separator / suspendat
export interface AtelierColumn {
  widthMm: number; content: ColumnContent;
  shelves?: number;                 // 0–15
  drawers?: 1 | 2 | 3 | 4 | 5 | 6;  // BARA_SERTARE: 1–3; SERTARE: 2–6
}
// AtelierConfig: category: AtelierCategory; legsMm: 0 | 100 | 150 (0 doar la SUSPENDAT; 100|150 la restul)
```
Restul tipurilor neschimbate. `doors` rămâne; la alte categorii decât DRESSING trebuie `{ type: 'NONE' }`.

## Reguli per categorie (fixate aici)

| | Dressing (neschimbat) | Comodă & noptieră | Separator | Corp suspendat |
|---|---|---|---|---|
| Tip corp motor | INALT (+SUSPENDAT sus la split) | BAZA | INALT (+SUSPENDAT sus la split), **fără spate** | SUSPENDAT |
| Lățime totală | 600–6000 | 400–3000 | 600–4000 | 300–3000 |
| Înălțime totală | 1000–3000 | 400–1200 | 1000–3000 | 300–1000 |
| Adâncime | 350–800 | 300–600 | 250–450 | 250–450 |
| Picioare | 100/150 + plintă | 100/150 + plintă | 100/150 + plintă | 0, fără plintă |
| Conținut coloană | ca acum | SERTARE, USI, DESCHIS | DESCHIS | USI, DESCHIS, USA_RIDICABILA |
| Coloană | 300–1200 | 300–1200 | 300–1200 | 300–1200 |

- Înălțimea corpului la categoriile cu picioare: `heightMm` trimis motorului = înălțimea totală (motorul scade piciorul — vezi fix-ul de înălțime); la SUSPENDAT `heightMm` = înălțimea totală, `legHeightMm: null`.
- **SERTARE**: `drawers ?? clamp(round((Hc)/180), 2, 6)` sertare pe un rând de coloană, sistem `TANDEMBOX`, fronturi din materialul fronturilor (`frontKind`/`frontMaterialId`/`mdfFront` din `cfg.fronts`).
- **USI**: uși batante, `doors = widthMm > 600 ? 2 : 1`, `shelves ?? 1` (comodă) / `shelves ?? 1` (suspendat).
- **USA_RIDICABILA**: `doors: 1`, `doorOpening: 'RIDICABILA'` (Aventos din setări), `shelves ?? 1`.
- **DESCHIS**: fără fronturi, `shelves ?? max(1, round(Hc/350) − 1)`.
- Mânere la comodă/suspendat: `quoteHandle` = `PUSH` cu produsul din setarea nouă `pushItemId` (prefill după nume „mecansim push”); dressing rămâne `FARA`.
- Separator: `back: { enabled: false }`, polițe din materialul corpului.
- Ansamblul din lead: nume „Comodă …”, „Separator …”, „Corpuri suspendate …”; proiect „Atelier — <Categorie> L×H×A”. Rezumat lead pe categorie.
- Scenă: corpuri suspendate desenate de la y = 0 (obiect de sine stătător); fronturile batante/sertarele vin din placement-ul motorului cu `role: 'FRONT'`.
- Validare nouă: conținut nepermis pentru categorie → `COLOANA_CONTINUT`; `legsMm` nepermis → `DIMENSIUNI`; uși glisante la altă categorie → `USI_NUMAR` (sau cod nou `USI_CATEGORIE`).

## Task A — CRM (`epicmob-ofertare`)
Files: `lib/atelier/types.ts`, `schema.ts`, `settings.ts` (+`pushItemId`), `prefill.ts`, `to-quote.ts` (reguli per categorie, idealmente un modul `categories.ts` cu limite + mapare conținut), `scene.ts`, `lead.ts` (nume/rezumat), `catalog.ts` dacă e cazul, `/setari` (select „Mecanism push”), teste.
Tests (vitest), toate trec prin `computeQuote` fără `INCOMPLETE_CABINET`:
- comodă 1600×800×450, 2 coloane SERTARE, picioare 100 → 2 corpuri BAZA 800×800×450 cu `drawers.count` 4 (round(700/180)=4) și `sellPrice > 0`; laterala = 700.
- noptieră 500×500×400, 1 coloană SERTARE drawers 2 → 1 BAZA.
- suspendat 1200×600×350, 2 coloane USI + USA_RIDICABILA → SUSPENDAT, `legHeightMm` null, fără plintă; USI 600 → 1 ușă.
- separator 1200×2000×350, 3 DESCHIS → INALT cu `back.enabled === false`.
- validare: SERTARE la SUSPENDAT → `COLOANA_CONTINUT`; legsMm 0 la COMODA → `DIMENSIUNI`; GLISANTE la COMODA → eroare; dimensiuni în afara limitelor categoriei → `DIMENSIUNI`.
- scenă: comoda are piese `FRONT`; suspendatul are min y = 0.
- dressing: toate testele existente trec neschimbate.

## Task B — site (`epic-mob-frontend`)
Files: `lib/atelier/types.ts` (copie identică), `lib/atelier/state.ts` (`defaultConfig(catalog, category = 'DRESSING')`, acțiune `{ type: 'setCategory'; category }` care resetează la valorile implicite ale categoriei păstrând materialele; limite per categorie în reducer), `lib/atelier/categories.ts` (limite + opțiuni conținut + etichete RO, folosite de UI și reducer), componentele din `components/atelier/` (category-picker: toate active; size-panel: limite per categorie, picioare ascunse la SUSPENDAT; columns-panel: opțiunile categoriei + selector număr sertare pentru SERTARE; doors-panel: doar la DRESSING; titlul paginii „Configurează-ți mobilierul” / subtitlu pe categorie), `lead/route.ts` limite neschimbate.
Implicit per categorie: Comodă 1600×800×450, 2×SERTARE; Separator 1200×2000×350, 3×DESCHIS; Suspendat 1200×600×350, 2×USI.
Tests (node:test): `setCategory('COMODA')` → configurație validă cu limitele comodei și `doors.type === 'NONE'`; `setSize` respectă limitele categoriei; `setCategory('SUSPENDAT')` → `legsMm === 0`.
Verificare: build + check vizual pe mock pentru toate 4 categoriile.
