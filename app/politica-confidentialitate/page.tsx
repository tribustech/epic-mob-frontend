import type { Metadata } from "next";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
import { JsonLd, buildBreadcrumbSchema } from "@/components/seo/json-ld";
import { legalEntity } from "@/lib/business-data";
import { contactDetails } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Politica de confidențialitate și cookies",
  description:
    "Cum colectează, folosește și protejează Epic Mob datele tale personale: cereri de ofertă, formularul de contact, fotografii încărcate și cookies.",
  alternates: { canonical: "/politica-confidentialitate" },
};

const LAST_UPDATED = "16 octombrie 2026";

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: "Acasă", path: "/" },
  { name: "Politica de confidențialitate", path: "/politica-confidentialitate" },
]);

// Data processors, listed for transparency (GDPR art. 13).
const processors = [
  {
    name: "Vercel Inc.",
    role: "găzduirea site-ului, statistici anonime de trafic și stocarea fotografiilor încărcate în configurator",
  },
  {
    name: "Postmark (ActiveCampaign LLC)",
    role: "trimiterea emailurilor cu cererea de ofertă, către noi și (dacă ne-ai dat adresa) către tine",
  },
  {
    name: "Google LLC",
    role: "Google Sheets — registrul intern în care păstrăm cererile de ofertă",
  },
  {
    name: "Meta Platforms Ireland Ltd.",
    role: "Meta Pixel, doar dacă ai acceptat cookies de marketing; WhatsApp, dacă ne scrii pe WhatsApp",
  },
];

const cookies = [
  {
    name: "epicmob-consent",
    provider: "Epic Mob (stocare locală în browser)",
    purpose: "Ține minte dacă ai acceptat sau refuzat cookies de marketing.",
    duration: "6 luni",
    type: "Strict necesar",
  },
  {
    name: "_fbp",
    provider: "Meta (epicmob.ro)",
    purpose:
      "Recunoaște vizitele repetate ca să putem măsura eficiența reclamelor de pe Facebook și Instagram.",
    duration: "90 de zile",
    type: "Marketing — doar cu acordul tău",
  },
  {
    name: "fr",
    provider: "Meta (facebook.com)",
    purpose: "Livrarea și măsurarea reclamelor Meta.",
    duration: "90 de zile",
    type: "Marketing — doar cu acordul tău",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-sand text-espresso">
      <JsonLd data={breadcrumbSchema} />

      <section className="section-shell pt-28 pb-10 sm:pt-32 lg:pt-36">
        <p className="eyebrow-warm">Confidențialitate</p>
        <h1 className="display-font mt-4 max-w-4xl text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] text-espresso">
          Politica de confidențialitate și cookies
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-espresso/70">
          Pe scurt: folosim datele tale doar ca să-ți răspundem și să-ți facem
          oferta. Nu le vindem nimănui, iar cookies de marketing pornesc doar
          dacă ești de acord.
        </p>
        <p className="mt-4 text-sm text-espresso/50">
          Ultima actualizare: {LAST_UPDATED}
        </p>
      </section>

      <article className="section-shell pb-24">
        <div className="mx-auto max-w-3xl space-y-12 text-base leading-8 text-espresso/75 [&_h2]:font-[family-name:var(--font-display)][&_h2]:mb-4 [&_h2]:text-3xl [&_h2]:leading-tight [&_h2]:text-espresso [&_li]:pl-1 [&_strong]:text-espresso [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          <section>
            <h2>1. Cine suntem</h2>
            <p>
              Operatorul datelor tale este <strong>{legalEntity.name}</strong>,
              cu sediul social în {legalEntity.registeredOffice}, CUI{" "}
              {legalEntity.cui}, nr. de ordine în Registrul Comerțului{" "}
              {legalEntity.tradeRegister}, EUID {legalEntity.euid}{" "}
              („Epic Mob”, „noi”).
            </p>
            <p className="mt-4">
              Pentru orice întrebare despre datele tale ne scrii la{" "}
              <a
                href={`mailto:${contactDetails.email}`}
                className="underline underline-offset-2"
              >
                {contactDetails.email}
              </a>
              .
            </p>
          </section>

          <section>
            <h2>2. Ce date colectăm</h2>
            <ul>
              <li>
                <strong>Cererea de ofertă (configurator):</strong> nume,
                telefon, email (opțional), orașul, detaliile proiectului și
                fotografiile sau schițele pe care le încarci. Răspunsurile se
                salvează pe măsură ce completezi pașii, deci păstrăm și
                cererile începute, dar netrimise.
              </li>
              <li>
                <strong>Formularul de contact:</strong> nume, telefon, email și
                mesajul tău.
              </li>
              <li>
                <strong>Telefon, email, WhatsApp:</strong> datele pe care ni le
                transmiți când ne contactezi direct.
              </li>
              <li>
                <strong>Date tehnice:</strong> statistici agregate și anonime
                despre vizite (pagini văzute, tipul dispozitivului, țara),
                colectate fără cookies. Cu acordul tău, și date despre
                interacțiunea cu site-ul prin Meta Pixel (vezi secțiunea
                Cookies).
              </li>
            </ul>
          </section>

          <section>
            <h2>3. De ce le folosim</h2>
            <ul>
              <li>
                Ca să-ți răspundem și să-ți pregătim oferta, la cererea ta
                (art. 6 alin. 1 lit. b GDPR — demersuri înainte de încheierea
                unui contract).
              </li>
              <li>
                Ca să executăm contractul, dacă devii client (art. 6 alin. 1
                lit. b).
              </li>
              <li>
                Ca să respectăm obligațiile legale, de exemplu cele fiscale și
                contabile (art. 6 alin. 1 lit. c).
              </li>
              <li>
                Ca să înțelegem cum e folosit site-ul și să-l îmbunătățim, pe
                baza statisticilor anonime (art. 6 alin. 1 lit. f — interes
                legitim).
              </li>
              <li>
                Ca să măsurăm și să îmbunătățim reclamele pe Facebook și
                Instagram, doar dacă ai acceptat cookies de marketing (art. 6
                alin. 1 lit. a — consimțământ).
              </li>
            </ul>
            <p className="mt-4">
              Nu luăm decizii automate cu efect asupra ta și nu vindem datele
              tale.
            </p>
          </section>

          <section>
            <h2>4. Cui le transmitem</h2>
            <p>
              Folosim câțiva furnizori care prelucrează date în numele nostru,
              doar în scopurile de mai sus:
            </p>
            <ul className="mt-4">
              {processors.map((processor) => (
                <li key={processor.name}>
                  <strong>{processor.name}</strong> — {processor.role}.
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Unii dintre acești furnizori pot transfera date în afara Spațiului
              Economic European (în special în SUA). Transferurile se fac pe
              baza Cadrului UE-SUA privind protecția datelor (EU-US Data
              Privacy Framework) sau a clauzelor contractuale standard aprobate
              de Comisia Europeană.
            </p>
          </section>

          <section>
            <h2>5. Cât timp le păstrăm</h2>
            <ul>
              <li>
                <strong>Cererile de ofertă și mesajele</strong> care nu devin
                contract, inclusiv cererile începute și netrimise, se păstrează{" "}
                <strong>12 luni</strong>, apoi se șterg.
              </li>
              <li>
                <strong>Datele clienților</strong> se păstrează pe durata
                contractului și apoi cât cere legislația fiscală și contabilă
                pentru contracte și facturi.
              </li>
              <li>
                <strong>Alegerea privind cookies</strong> o ținem minte 6 luni,
                apoi te întrebăm din nou.
              </li>
            </ul>
          </section>

          <section id="cookies" className="scroll-mt-28">
            <h2>6. Cookies</h2>
            <p>
              Statisticile de trafic (Vercel Web Analytics) nu folosesc cookies
              și nu te identifică. Cookies de marketing (Meta Pixel) se
              activează <strong>doar după ce apeși „Accept”</strong> în
              bannerul de cookies. Dacă refuzi, site-ul funcționează exact la
              fel.
            </p>

            <div className="mt-6 overflow-x-auto rounded-2xl border border-espresso/10 bg-cream">
              <table className="w-full min-w-[36rem] text-left text-sm leading-6">
                <thead className="border-b border-espresso/10 text-espresso">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nume</th>
                    <th className="px-4 py-3 font-semibold">Furnizor</th>
                    <th className="px-4 py-3 font-semibold">Scop</th>
                    <th className="px-4 py-3 font-semibold">Durată</th>
                    <th className="px-4 py-3 font-semibold">Tip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-espresso/10">
                  {cookies.map((cookie) => (
                    <tr key={cookie.name} className="align-top">
                      <td className="px-4 py-3 font-mono text-xs text-espresso">
                        {cookie.name}
                      </td>
                      <td className="px-4 py-3">{cookie.provider}</td>
                      <td className="px-4 py-3">{cookie.purpose}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {cookie.duration}
                      </td>
                      <td className="px-4 py-3">{cookie.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6">
              Îți poți schimba alegerea oricând, și din linkul „Setări cookies”
              din subsolul paginii.
            </p>
            <CookieSettingsButton className="btn-warm btn-warm--ghost mt-4">
              Schimbă preferințele cookies
            </CookieSettingsButton>
          </section>

          <section>
            <h2>7. Drepturile tale</h2>
            <p>Conform GDPR, ai dreptul să ne ceri:</p>
            <ul className="mt-4">
              <li>acces la datele pe care le avem despre tine;</li>
              <li>corectarea datelor greșite;</li>
              <li>ștergerea datelor;</li>
              <li>restricționarea prelucrării;</li>
              <li>portabilitatea datelor;</li>
              <li>
                să te opui prelucrării bazate pe interesul nostru legitim;
              </li>
              <li>
                să-ți retragi oricând consimțământul, fără să afecteze
                prelucrarea făcută până atunci.
              </li>
            </ul>
            <p className="mt-4">
              Ne scrii la{" "}
              <a
                href={`mailto:${contactDetails.email}`}
                className="underline underline-offset-2"
              >
                {contactDetails.email}
              </a>{" "}
              și îți răspundem în cel mult o lună. Dacă nu ești mulțumit, poți
              depune o plângere la Autoritatea Națională de Supraveghere a
              Prelucrării Datelor cu Caracter Personal (ANSPDCP),{" "}
              <a
                href="https://www.dataprotection.ro"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                www.dataprotection.ro
              </a>
              .
            </p>
          </section>

          <section>
            <h2>8. Securitate și minori</h2>
            <p>
              Datele circulă criptat (HTTPS), iar accesul la ele îl au doar
              persoanele din echipa noastră care se ocupă de oferte și
              proiecte. Fotografiile încărcate sunt stocate la o adresă unică,
              greu de ghicit, pe care o folosim doar intern.
            </p>
            <p className="mt-4">
              Site-ul nu se adresează persoanelor sub 16 ani și nu colectăm
              intenționat date despre acestea.
            </p>
          </section>

          <section>
            <h2>9. Modificări</h2>
            <p>
              Putem actualiza această politică atunci când se schimbă modul în
              care lucrăm cu datele. Data ultimei actualizări apare la începutul
              paginii.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
