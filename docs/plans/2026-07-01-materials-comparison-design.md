# Comparație materiale — design

**Data:** 2026-07-01
**Branch:** feature/crafto-warm-redesign

## Scop

Pornind de la infograficul EpicMob „Alege materialul potrivit", aducem pe site o
experiență prin care clientul *simte* diferența dintre materiale (nu doar o citește).
Fiecare material e prezentat printr-o „felie" care arată fața finisată + miezul expus,
cu diagramă de structură animată (linii-ghid către straturi), plusuri și minusuri.

## Materiale (4)

1. **PAL Melaminat** — practic, robust, ieftin (miez de așchii presate).
2. **MDF Melaminat** — fibră densă, muchii mai fine decât PAL.
3. **MDF Înfoliat** — suprafață catifelată, folie termoformată care înfoliază muchia.
4. **MDF Vopsit** — vopsea poliuretanică, finisaj premium impecabil.

> Notă de conținut: PAL Melaminat vs MDF Melaminat trebuie poziționate clar diferit
> (miez așchii vs fibră densă) ca să nu pară redundante. Copy-ul se draftează din
> infografic + logică de domeniu și se validează cu clientul.

## Asset-uri

Câte 2 randări per material în `~/Downloads`:
- `01` = scena mare (felie la unghi + bucătărie asortată în fundal) → hero lifestyle.
- `02` = macro pe colț (finisaj + miez, muchie rotunjită) → dovada de structură.

Fișiere sursă: `final-{pal,mdf-melaminat,infoliat,vops}-furniture-0{1,2}.png`
(atenție: `final-mdf-melaminat-furniture-02` e fără extensie `.png`).

Pipeline: convert în WebP ~1600px, calitate ~82, în `public/materials/`
(~18MB PNG → ~1.5MB WebP total).

## Sursă unică de date — `lib/materials-data.ts`

```ts
type Material = {
  slug: string;
  name: string;
  tagline: string;
  accent: string;              // culoarea-semnătură (comută cu materialul)
  heroImage: string;           // /materials/<x>-01.webp
  detailImage: string;         // /materials/<x>-02.webp
  structure: { label: string; sub?: string; anchor: "top" | "core" | "edge" }[];
  pros: string[];
  cons: string[];
  properties: { icon: string; label: string }[]; // rândul cu iconițe din infografic
  goodFor: string[];           // bucătărie / dressing / baie ...
  article: Block[];            // conținut editorial pagina dedicată
};
```

**Idee-cheie:** `accent` = culoarea reală a materialului (stejar / fibră / salvie /
charcoal). Peste tema warm (sand/espresso), accentul comută odată cu materialul și
leagă vizual cele 3 suprafețe.

## Diagrama de structură animată (piesa centrală, refolosită de B și C)

- Layout: felia (`02`) în dreapta, etichete de structură în stânga.
- Overlay SVG cu linii-ghid din puncte-ancoră (top/core/edge) spre etichete.
- Animație la scroll-into-view / la comutare material:
  1. ancora apare + pulsează (cerc `accent`),
  2. linia se desenează (`pathLength` 0→1, ~0.5s),
  3. eticheta fade+slide, stagger ~0.12s,
  4. la schimbarea materialului liniile se retrag și se re-desenează, `accent` comută.
- Plusuri/minusuri sub diagramă: `＋` bulină salvie, `－` bulină teracotă stinsă.
- Tehnic: `framer-motion` (`pathLength`), fără librării noi (ca `warm-journey`).

## Cele 3 suprafețe

### A) Home — teaser scrollytelling `components/home/warm/warm-materials.tsx`
Scenă pinned (ca `warm-journey`). Derulare → trece prin 4 materiale; felia (`01`)
centrată cu crossfade, fundal preia `accent`, lateral nume + tagline + 1–2 plusuri.
Fără diagrama completă (rămâne cârligul). CTA „Vezi toate materialele →" spre `/materiale`.
Inserat în `warm-home.tsx` după `WarmJourney`.

### B) `/materiale` — hub cu comutator (A)
4 pastile sus → scena mare cu diagrama animată + plusuri/minusuri. Comutarea re-animă
liniile și schimbă `accent`. Fiecare material are „Află mai mult →" spre articol.
Hero + intro editorial deasupra comutatorului.

### C) `/materiale/[slug]` — articol per material
`generateStaticParams` din array. Hero (`01` + nume + tagline), intro, diagrama animată,
plusuri/minusuri detaliate, „pentru ce e potrivit", macro `02` full-bleed, CTA final,
navigație prev/next.

### Navigație
Adaug „Materiale" în `components/site-header.tsx` și `components/home/warm/warm-tabbar.tsx`.

## Extensie: „Unde se potrivește" — potrivire pe zone (căldură / umezeală)

Adăugat 2026-07-01. Fiecare material e evaluat pe 6 zone fixe, cu verdict pe 3
niveluri (`recomandat` / `atentie` / `evita`) + o frază „de ce". Sursă de date:
`placementZones` + câmpul `placement` pe fiecare `Material` din `lib/materials-data.ts`.

**Zone:** Fronturi bucătărie · Lângă aragaz/cuptor · Baie/umezeală · Lângă chiuvetă ·
Cameră copii · Living/dormitor.

**Suprafețe:**
- `/materiale/[slug]` — secțiune „Unde se potrivește" (`MaterialPlacement`), sub pros/cons.
- `/materiale` (carduri) — fără indicator. Am testat un strip compact de iconițe pe card,
  dar la dimensiunea aia 6 iconițe × 3 stări de culoare fără legendă nu comunicau clar
  (se rupeau pe 2 rânduri, culorile indistincte). Decizie: potrivirea pe zone rămâne doar
  în pagina de detaliu, unde fiecare zonă are etichetă + explicație.

**Matrice publicată** (recomandat ✓ / atenție ⚠ / evită ✕):

| Zonă | PAL Melam. | MDF Melam. | Înfoliat | Vopsit |
|---|---|---|---|---|
| Fronturi bucătărie | ✓ | ✓ | ✓ | ✓ |
| Lângă aragaz/cuptor | ⚠ | ⚠ | ✕ | ✓ |
| Baie/umezeală | ⚠ | ⚠ | ⚠ | ✓ |
| Lângă chiuvetă | ⚠ | ⚠ | ⚠ | ⚠ |
| Cameră copii | ✓ | ✓ | ✓ | ⚠ |
| Living/dormitor | ✓ | ✓ | ✓ | ✓ |

**Fundament (verificat online, surse producători + comercianți):**
- Folia termoformată se desprinde la căldură directă/abur prelungit; producătorii cer
  benzi de protecție termică lângă cuptor/mașină de spălat vase, altfel se anulează
  garanția — Holiday Kitchens, DeSlaurier. Confirmă afirmația clientului „înfoliat lângă
  aragaz = folia se desprinde".
- PAL/așchii se umflă dacă apa ajunge la miez; în zone umede se folosește miez hidrofug
  **P3 (EN 312)** + canturi sigilate — Egger, Kronospan, C Workshop. Confirmă afirmația
  „PAL în baie se umflă".
- Melamina e rezistentă la umezeală, dar **nu impermeabilă**; cantul e punctul slab.
- MDF vopsit e cel mai tolerant la căldură (peliculă continuă, fără folie de desprins) și
  cel mai ușor de retușat/recolorat — DeSlaurier, Modern Twig.

**Nepublicat intenționat** (repetat online, dar fără sursă de producător): pragul exact
„~70 °C la care se desprinde folia" (temperatura din specs e cea de presare, nu limita în
exploatare) — comunicăm mecanismul, nu un număr. Deflectorul de căldură vine de la
producătorii de mobilă/mașini de spălat, **nu de la Blum**.

Surse: holidaykitchens.com/resources/cabinet-care/thermofoil ·
deslaurier.com/en-us/learning-centre/6-problems-with-thermofoil-kitchen-cabinets ·
support.egger.com/hc/en-us/articles/360016175053 ·
kronospan.com (Particleboard P3) · cworkshop.co.uk · site.moderntwig.com

## Ordine de implementare

1. Asset pipeline (convert PNG → WebP în `public/materials/`)
2. `lib/materials-data.ts` (date + copy draft)
3. Componentă diagramă animată (refolosită de B și C)
4. `/materiale` (hub A)
5. `/materiale/[slug]` (articole)
6. Teaser home (B) + inserare în `warm-home`
7. Navigație (header + tabbar)
