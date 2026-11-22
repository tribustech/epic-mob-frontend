import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, buildBreadcrumbSchema } from "@/components/seo/json-ld";
import { legalEntity } from "@/lib/business-data";
import { ADVANCE_PERCENT, ANPC_SAL_URL, WARRANTY_YEARS } from "@/lib/legal";
import { baseOpenGraph } from "@/lib/seo";
import { DELIVERY_TEXT } from "@/lib/shop/products";
import { contactDetails } from "@/lib/site-data";

const DESCRIPTION =
  "Cum comanzi mobilier de la Epic Mob: măsurători, confirmarea prețului, avans și plată, termen de livrare și montaj, garanție 5 ani și dreptul de retragere.";

export const metadata: Metadata = {
  title: "Termeni și condiții",
  description: DESCRIPTION,
  alternates: { canonical: "/termeni-si-conditii" },
  openGraph: {
    ...baseOpenGraph,
    title: "Termeni și condiții | Epic Mob",
    description: DESCRIPTION,
    url: "/termeni-si-conditii",
  },
};

const LAST_UPDATED = "21 noiembrie 2026";

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: "Acasă", path: "/" },
  { name: "Termeni și condiții", path: "/termeni-si-conditii" },
]);

const linkClass = "underline underline-offset-2";

export default function TermsPage() {
  return (
    <main className="bg-sand text-espresso">
      <JsonLd data={breadcrumbSchema} />

      <section className="section-shell pt-28 pb-10 sm:pt-32 lg:pt-36">
        <p className="eyebrow-warm">Termeni și condiții</p>
        <h1 className="display-font mt-4 max-w-4xl text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] text-espresso">
          Cum lucrăm, pe față
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-espresso/70">
          Pe scurt: venim la măsurători, îți confirmăm prețul înainte să
          plătești ceva, lucrăm cu avans și factură, iar pentru ce montăm ai
          garanție {WARRANTY_YEARS} ani.
        </p>
        <p className="mt-4 text-sm text-espresso/75">
          Ultima actualizare: {LAST_UPDATED}
        </p>
      </section>

      <article className="section-shell pb-24">
        <div className="mx-auto max-w-3xl space-y-12 text-base leading-8 text-espresso/75 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:mb-4 [&_h2]:text-3xl [&_h2]:leading-tight [&_h2]:text-espresso [&_li]:pl-1 [&_strong]:text-espresso [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5">
          <section>
            <h2>1. Cine suntem</h2>
            <p>
              Site-ul epicmob.ro aparține <strong>{legalEntity.name}</strong>,
              cu sediul social în {legalEntity.registeredOffice}, CUI{" "}
              {legalEntity.cui}, nr. de ordine în Registrul Comerțului{" "}
              {legalEntity.tradeRegister}, EUID {legalEntity.euid}{" "}
              („Epic Mob”, „noi”).
            </p>
            <p className="mt-4">
              Ne găsești la telefon{" "}
              <a href={`tel:${contactDetails.phone}`} className={linkClass}>
                {contactDetails.phone}
              </a>{" "}
              și la{" "}
              <a href={`mailto:${contactDetails.email}`} className={linkClass}>
                {contactDetails.email}
              </a>
              .
            </p>
          </section>

          <section>
            <h2>2. Ce facem</h2>
            <p>
              Facem mobilier în atelierul nostru: modele gata gândite din Magazin,
              configurații din Atelierul 3D și proiecte complet
              personalizate. Fiecare piesă se produce în atelier după
              măsurile, culorile și opțiunile alese de tine, apoi o livrăm și
              o montăm.
            </p>
          </section>

          <section>
            <h2>3. Cum comanzi</h2>
            <ol>
              <li>
                Pui produsul în coș și ne lași numărul (sau ne trimiți o
                cerere din Atelierul 3D ori din formularul Cere ofertă). Asta
                nu e încă o comandă fermă și nu te obligă la nimic.
              </li>
              <li>Te sunăm ca să stabilim detaliile și o dată pentru măsurători.</li>
              <li>
                Venim la tine, măsurăm spațiul și îți confirmăm în scris
                prețul final și termenul.
              </li>
              <li>
                Comanda devine fermă când o confirmi și plătești avansul. Abia
                atunci intră în producție.
              </li>
              <li>Livrăm, montăm și îți predăm mobila gata de folosit.</li>
            </ol>
          </section>

          <section>
            <h2>4. Prețul</h2>
            <ul>
              <li>Prețurile sunt în lei și includ montajul.</li>
              <li>
                Prețul din Magazin și cel estimat în Atelierul 3D se confirmă la
                măsurători. Dacă spațiul real cere altă variantă (alte
                dimensiuni, alte piese), îți spunem noul preț înainte de
                comandă, iar tu decizi dacă mergi mai departe.
              </li>
              <li>
                Pentru proiectele personalizate primești o ofertă scrisă, pe
                baza dimensiunilor, materialelor și feroneriei alese.
              </li>
              <li>Prețul pe care l-ai confirmat când ai comandat nu se mai schimbă.</li>
            </ul>
          </section>

          <section>
            <h2>5. Plata</h2>
            <ul>
              <li>
                La confirmarea comenzii plătești un avans de{" "}
                {ADVANCE_PERCENT}% din preț.
              </li>
              <li>Restul se plătește la finalizare, după montaj.</li>
              <li>Pentru fiecare plată primești factură.</li>
            </ul>
          </section>

          <section>
            <h2>6. Livrare și montaj</h2>
            <p>
              {DELIVERY_TEXT} de la confirmarea comenzii. Termenul exact îl
              confirmăm după măsurători, în funcție de complexitate și de
              materiale. Dacă apare o întârziere, te anunțăm din timp și
              stabilim împreună o nouă dată.
            </p>
            <p className="mt-4">
              Ca montajul să meargă bine, avem nevoie ca spațiul să fie liber
              și accesibil în ziua stabilită.
            </p>
          </section>

          <section>
            <h2>7. Garanția</h2>
            <p>
              Pentru tot ce producem și montăm ai{" "}
              <strong>garanție {WARRANTY_YEARS} ani</strong> de la montaj. Dacă
              apare o problemă, ne scrii sau ne suni, venim să vedem și o
              rezolvăm: reglăm, reparăm sau înlocuim piesa.
            </p>
            <p className="mt-4">
              Garanția nu acoperă uzura normală, loviturile, apa sau umezeala
              excesivă, folosirea greșită și modificările făcute de altcineva.
              Garanția noastră se adaugă drepturilor pe care le ai oricum prin
              lege ca și consumator (garanția legală de conformitate, OUG
              140/2021), nu le înlocuiește.
            </p>
          </section>

          <section>
            <h2>8. Dreptul de retragere</h2>
            <p>
              Mobilierul nostru se face după măsurile și alegerile tale, deci
              este un produs personalizat. Conform art. 16 lit. c din OUG
              34/2014, pentru produsele realizate după specificațiile
              clientului <strong>nu se aplică dreptul de retragere de 14 zile</strong>{" "}
              după ce comanda a fost confirmată.
            </p>
            <p className="mt-4">
              Până confirmi comanda după măsurători poți renunța oricând, fără
              niciun cost.
            </p>
          </section>

          <section>
            <h2>9. Reclamații și litigii</h2>
            <p>
              Dacă ceva nu e în regulă, ne scrii la{" "}
              <a href={`mailto:${contactDetails.email}`} className={linkClass}>
                {contactDetails.email}
              </a>{" "}
              sau ne suni și căutăm împreună o soluție.
            </p>
            <p className="mt-4">
              Dacă nu ajungem la o înțelegere, te poți adresa Autorității
              Naționale pentru Protecția Consumatorilor prin{" "}
              <a href={ANPC_SAL_URL} target="_blank" rel="noreferrer" className={linkClass}>
                Soluționarea alternativă a litigiilor (ANPC SAL)
              </a>
              . Se aplică legea română.
            </p>
          </section>

          <section>
            <h2>10. Datele tale</h2>
            <p>
              Cum folosim numele, telefonul și celelalte date pe care ni le
              dai găsești în{" "}
              <Link href="/politica-confidentialitate" className={linkClass}>
                Politica de confidențialitate
              </Link>
              .
            </p>
          </section>

          <section>
            <h2>11. Modificări</h2>
            <p>
              Putem actualiza acești termeni. Pentru o comandă se aplică
              termenii valabili în ziua în care ai confirmat-o.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
