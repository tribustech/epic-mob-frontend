# Atelier 3D — configurator de mobilier pe epicmob.ro

Data: 2026-11-11 · Status: draft pentru aprobare

## 1. Intenția

Clientul EpicMob își configurează singur, pe site, un dressing/dulap (apoi comode, separatoare, corpuri suspendate), îl vede în 3D, vede **prețul final de vânzare** calculat exact ca în CRM și trimite configurația ca cerere. Proprietarul îl sună pentru măsurători și lămuriri.

De ce: azi fiecare cerere se transformă manual în ofertă în CRM (`crm.epicmob.ro`). Atelierul aduce leaduri deja calificate (dimensiuni, material, buget văzut) și reduce munca de ofertare, pentru că configurația ajunge în CRM gata structurată pe corpuri.

Inspirație: configuratoarele de la technefurniture.com (categorii, 3D, preț live). Luăm ideea și categoriile, **nu** aspectul — Atelierul folosește identitatea vizuală EpicMob (paleta cinematic: `--black`, `--ember`, `--ivory`, Cormorant Garamond + Manrope).

## 2. Obiective

1. Pagina publică **„Atelier 3D”** pe `epic-mob-frontend`, la adresa `/configurator`.
2. Categorii (aceleași ca la Téchne): **Dressing & depozitare**, **Comode & noptiere**, **Separatoare cameră**, **Corpuri suspendate**. Se lansează întâi **Dressing**; celelalte vin pe același motor.
3. Clientul alege liber dimensiunile (lățime, înălțime, adâncime) ale ansamblului și ale fiecărei coloane, conținutul fiecărei coloane, materialul și ușile.
4. Vizualizare 3D care se actualizează live.
5. Preț live = cost × (1 + manoperă 120%), calculat de **motorul din CRM**, aceleași reguli ca la ofertele manuale.
6. Trimitere ca cerere → lead nou în CRM + email de notificare.

## 3. Non-obiective (nu în prima versiune)

- Bucătării (prea complexe: colțuri, electrocasnice, blat, instalații). Rămân pe formularul de cerere ofertă.
- Coș, plată, avans online.
- AR / vizualizare în cameră (poate mai târziu).
- Materiale fără preț în catalog.

## 4. Anti-obiective (eșec chiar dacă „merge”)

- Prețul din Atelier diferă de cel pe care l-ar da CRM-ul pentru aceeași configurație.
- Costul intern, procentul de manoperă sau prețurile de catalog ajung în browser.
- Clientul poate trimite o configurație care nu se poate fabrica (piese mai mari decât placa).
- Arată ca o copie a site-ului Téchne.

## 5. Decizii luate de proprietar

**Preț**
- Clientul vede prețul cu tot cu adaosul de 120% (manopera din CRM).
- Ușă glisantă — sistem: **250 lei / ușă** (cost, intră sub adaos). Valoare editabilă din catalogul CRM, nu hard-codată.
- Oglindă: **200 lei/m² + 100 lei pentru lipire per oglindă** (o oglindă per ușă).
- Sticlă: **400 lei/m²**.

**Uși la dressing**: cele mai cerute sunt **ușile glisante, cu sau fără oglindă**.

**Dimensiuni**: clientul alege liber lățime/înălțime/adâncime. Sistemul trebuie să țină cont de dimensiunea plăcii materialului: dacă o piesă nu încape pe placă (ex. dulap lung de 3 m, sau înalt peste lungimea plăcii), corpul se **împarte automat** în bucăți fabricabile.

**Corp vs. fronturi**: clientul alege separat materialul **corpului** și materialul **fronturilor/ușilor** (ex. corp PAL, fronturi MDF melaminat sau vopsit). **Polițele sunt mereu din materialul corpului.**

**Picioare și plintă**: clientul alege picioare de **100 mm sau 150 mm**, cu **plintă**. Plinta nu are limită de lungime (se taie și se îmbină).

**Uși glisante — construcție**: adâncimea introdusă de client **include** șina ușilor. Oglinda se **lipește pe o foaie de PAL**. Dacă o ușă iese mai înaltă decât placa, clientul primește mesaj că nu se poate și trebuie să reducă înălțimea.

**Materiale**: doar cele care au preț în catalog, grupate în:
- **PAL melaminat**
- **MDF melaminat**
- **MDF vopsit** — clientul alege **RAL-ul** și **câte fețe se vopsesc**; implicit culoare normală (nu vie/metalizată) și model **plan drept**, dacă nu alege alt model.

**După configurare**: clientul trimite configurația ca cerere (nume, telefon, oraș, observații). Proprietarul îl sună.

**Lead în CRM**
- Apare în **CRM → Leaduri** (sursa „Atelier”).
- Evidențiat (**fundal verde / „Nou”**) până când e deschis prima dată.
- **Email** de notificare la fiecare lead nou, către adresa proprietarului (configurată prin variabilă de mediu, nu în cod).

## 6. Ce există deja (de refolosit)

CRM-ul (`C:\Projects\epicmob\epicmob-ofertare`, Next 15 + Prisma + three.js) are:
- `lib/engine/` — din corpuri → piese (`carcass`, `pieces`, `drawers`, `fronts`, `hardware`), listă debitare, **nesting pe plăci** (aruncă eroare când o piesă nu încape pe placa materialului; dimensiunile plăcii sunt în catalog: `sheetLengthMm`, `sheetWidthMm`), costing.
- Constante în `lib/engine/constants.ts`: `doorMaxWidthMm: 650`, `shelfSpanWarnMm: 900` (avertisment poliță), etc.
- `lib/quote/` — preț ofertă, `front-pricing.ts` pentru MDF vopsit (m², fețe, mat/lucios, culoare normală/vie/metalizată, negru lucios, freză mâner).
- `components/configurator/Scene3D.tsx`, `AssemblyLayout3D.tsx` — scenă 3D three.js a ansamblurilor.
- Catalog: 725 materiale (Egger, Kastamonu, AGT, manual), canturi, feronerie; multe „fără preț”.
- Modelul de ofertă: Proiect → Ofertă → Ansambluri (setări: picioare, plintă) → Corpuri (tip `BAZA | SUSPENDAT | INALT | COLT`, dimensiuni mm, conținut) + plăci libere + linii libere; manoperă % pe proiect.
- Ușile glisante **nu** sunt modelate în motor azi (se pun manual ca plăci libere + linie liberă „Sistem glisare Häfele Slido”).

Site-ul (`epic-mob-frontend`, Next 16 + React 19 + Tailwind 4) are:
- `/configurator` ocupat de formularul „Cere ofertă” (`components/configurator/wizard/quote-wizard.tsx`).
- `app/api/quote/route.ts` + `lib/postmark.ts` — trimitere email prin Postmark (deja configurat).
- Atenție: `AGENTS.md` — versiunea de Next are schimbări; citește `node_modules/next/dist/docs/` înainte de cod.

## 7. Comportament

### 7.1 Fluxul clientului
1. Alege categoria (Dressing).
2. Introduce dimensiunile totale ale ansamblului.
3. Sistemul propune o împărțire în coloane; clientul poate schimba numărul și lățimea fiecărei coloane.
4. Pentru fiecare coloană alege conținutul: bară haine, polițe, sertare (combinații ca în ofertele reale: „bare + sertar”, „polițe”, „polițe + bară”).
5. Alege materialul corpului (polițele urmează corpul) și materialul fronturilor/ușilor (categorie → decor; la MDF vopsit, RAL + număr fețe), plus picioarele (100 / 150 mm, cu plintă).
6. Alege ușile: fără uși / glisante fără oglindă / glisante cu oglindă / glisante cu sticlă.
7. Vede 3D + preț live + avertismente.
8. Trimite cererea.

### 7.2 Împărțire automată (fabricabilitate)
- Dacă înălțimea depășește lungimea utilă a plăcii materialului ales, coloana se împarte în corp jos + corp sus (cum e în oferta „Dulap uși glisante 240×225”: „stânga jos / stânga sus”).
- Dacă o piesă orizontală (fund, capac, poliță) nu încape pe placă, coloana se împarte în corpuri.
- Avertismentele motorului (ex. poliță > 900 mm) se afișează clientului în limbaj simplu, cu sugestie (ex. „adaugă un perete despărțitor”).
- O configurație cu erori de fabricabilitate nu poate fi trimisă.

### 7.3 Ușile glisante (regulă nouă de cost)
Cost per ușă = panou + umplutură + sistem:
- panou PAL/MDF din catalog (materialul fronturilor) — la ușile cu oglindă, oglinda se lipește pe panou;
- oglindă: suprafață × 200 lei/m² + 100 lei lipire;
- sticlă: suprafață × 400 lei/m²;
- sistem glisare: 250 lei.
Toate sunt costuri; se aplică manopera de 120%. Valorile stau în catalogul CRM (editabile).

### 7.4 Preț
- Calculat **pe server, de motorul CRM**. Browserul primește doar prețul final de vânzare și avertismentele.
- Prețul se recalculează la fiecare modificare (cu debounce).

### 7.5 Lead
- La trimitere: CRM creează un lead (sursa „Atelier”) cu nume, telefon, oraș, „Ce vrea” = rezumat lizibil (ex. „Dressing 3000×2600×600, 4 coloane, uși glisante cu oglindă, PAL A394 Zebrano Deschis”), buget = prețul afișat, plus configurația completă atașată (structurată pe ansamblu/corpuri) ca să poată fi transformată direct în ofertă ciornă.
- Leadul are stare „nevăzut” până la prima deschidere; în lista Leaduri rândul e evidențiat verde cu eticheta „Nou”.
- Se trimite email de notificare cu rezumatul și link direct la lead în CRM.

## 8. Alegerile mele (de verificat de proprietar)

- **Nume și adresă**: „Atelier 3D” la `/configurator`; formularul existent „Cere ofertă” se mută la `/cere-oferta`. Linkurile interne care trimit azi la formular (header, CTA-uri, footer, sitemap) se actualizează la `/cere-oferta`. Din Atelier există link către „Cere ofertă” pentru bucătării și cereri custom.
- **Arhitectură**: CRM-ul rămâne singura sursă de adevăr pentru preț. Expune endpointuri server-to-server (catalog public filtrat, calcul preț, creare lead), protejate cu un secret partajat. Site-ul le apelează doar din server (route handlers), niciodată direct din browser.
- **Emailul** se trimite din site, prin Postmark (deja configurat), către o variabilă de mediu (ex. `ATELIER_LEAD_EMAIL`).
- **Număr implicit de uși glisante**: `ceil(lățime / 1000 mm)`, minimum 2; clientul îl poate schimba. Suprapunere între uși vecine: 30 mm.
- **Adâncimea șinei**: 100 mm (din adâncimea totală; corpul = adâncime − 100). Valoare editabilă în setările CRM.
- **Ușa cu sticlă**: tratată ca oglinda — sticlă (400 lei/m²) lipită pe foaie de PAL + 100 lei lipire.
- **Construcția standard** (ce nu alege clientul), după oferta „Dulap uși glisante 240×225”: spate PFL alb 3 mm, sertare Blum Tandembox antaro 450, polițe pe suporți Duplo, bară de haine = produsul „Bara de haine” din catalog. Plinta în mod „pe corpuri”. MDF vopsit implicit **mat**.
- **TVA**: firma nu e plătitoare de TVA (CRM → Setări), deci clientul vede exact prețul de vânzare din CRM, etichetat „preț estimativ — prețul final se stabilește după măsurători”, fără mențiunea „cu TVA”.
- **Lead în CRM**: dacă telefonul există deja la un client (neșters), se folosește acel client; altfel se creează unul cu stadiul LEAD și sursa „Atelier”. Se creează imediat **proiect + ofertă-ciornă** (ansamblu „Dressing”, corpurile și liniile ușilor glisante), ca proprietarul s-o deschidă și s-o ajusteze direct. Leadul „nou” = câmp nou pe client, setat doar de Atelier și șters la prima deschidere a clientului în CRM.
- **Găzduire**: site-ul și CRM-ul sunt pe Vercel, aceeași echipă; CRM-ul rulează `prisma migrate deploy` la build.

## 9. Lăsat constructorului

- Cum se partajează geometria 3D între CRM și site (CRM returnează piesele poziționate vs. site-ul desenează din aceleași reguli; recomandat: CRM returnează, pentru o singură sursă de adevăr).
- Biblioteca 3D în site (recomandat `three` + `@react-three/fiber` + `@react-three/drei`, compatibil cu ce e în CRM).
- Debounce, cache, limitare rată pe endpointuri publice, protecție anti-spam la trimitere.
- Texturi pentru decoruri (din imaginile catalogului, unde există).
- Structura exactă a câmpurilor noi în Prisma (stare „nevăzut”, configurație JSON).
