# Poze magazin rămase de generat

Actualizat: 22.11.2026. Stadiu: 182 de poze acceptate pentru 63 de modele, în PR-ul site #6.
Rămân 8 poze. Codex a atins limita, care se resetează vineri, 28.11, la 08:58. Se poate porni și mai devreme, dacă reîncarci creditele ChatGPT.

## Cum se pornește
Pe Mac este pregătit scriptul de reluare, care pornește dintr-o singură comandă. Lucrează pe branch-ul `claude/magazin-foto-v2`.
Spune-i lui Claude „pornește pozele rămase”. Generarea durează în jur de 10 minute, apoi pozele trec prin verificare și se adaugă în PR.

Brief-urile sunt în `scripts/shop-art-direction-v3.json` din repo-ul site-ului.

## Modele fără nicio poză (6 mobilieri de baie)
Până se fac pozele, în magazin apare randarea 3D.

| Model | Culoare |
|---|---|
| baie-lavoar-50 | alb-stejar-natur |
| baie-lavoar-60 | alb-total |
| baie-lavoar-80 | alb-casmir |
| baie-dubla-140 | alb-stejar-deschis |
| baie-masina-140 | alb-antracit |
| baie-picioare-100 | alb-gri-matase |

## Refaceri (2), respinse la verificare
- **suspendat-pat-240 / alb-stejar-natur**
  - Corpul e atârnat prea jos, iar patul e prea lat.
  - La refacere: corpul de la 150 la 190 cm de la podea, pat de 160 cm și corpul iese câte 40 cm în fiecare parte.
- **bucatarie-l-270 / alb-stejar-natur**
  - În poză sunt 4 sertare în loc de 3.
  - La refacere: exact 3 fronturi și 3 mânere aurii.

Pentru aceste două culori, modelul are deja o poză acceptată pe cealaltă culoare.
