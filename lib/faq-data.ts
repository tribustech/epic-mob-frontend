// Single source of truth for the FAQ. Feeds both the visible /intrebari-frecvente
// page and its FAQPage JSON-LD (so schema and content never drift — a Google
// requirement). Answers are plain text, grounded in confirmed business facts
// (owner-confirmed 2026-07-06): national coverage,
// Blum hardware, montaj inclus, contract & factură, deposit + balance-on-install
// payment, personalized pricing. Updated 2026-11: 5-year warranty and
// "Livrare și montaj în 4–6 săptămâni" (the owner's current rules, same as the
// Magazin), fixed shop prices next to custom offers.

export type FaqItem = { question: string; answer: string };

export const faqItems: FaqItem[] = [
  {
    question: "Cât costă mobilierul la comandă?",
    answer:
      "Modelele din Magazin au prețul afișat pe loc, confirmat la măsurători. Pentru proiectele complet personalizate pregătim o ofertă pe baza dimensiunilor, materialelor și feroneriei. Poți primi o estimare gratuită răspunzând la câteva întrebări în configurator sau scriindu-ne direct.",
  },
  {
    question: "Cât durează de la comandă până la montaj?",
    answer:
      "Livrare și montaj în 4–6 săptămâni de la confirmarea comenzii. Termenul exact depinde de complexitate și de disponibilitatea materialelor, și îl confirmăm în ofertă.",
  },
  {
    question: "În ce zonă lucrați?",
    answer:
      "Lucrăm în toată țara. Proiectarea și consultanța se pot face și la distanță, iar producția și montajul le coordonăm pentru locația ta.",
  },
  {
    question: "Oferiți garanție la mobilier?",
    answer:
      "Da. Oferim garanție 5 ani pentru fiecare lucrare. Folosim feronerie Blum pe sertare și balamale, un standard de încredere pe termen lung.",
  },
  {
    question: "Montajul este inclus?",
    answer:
      "Da, montajul complet este inclus, împreună cu montarea electrocasnicelor și adaptările necesare de instalații. Predăm mobila funcțională, gata de folosit.",
  },
  {
    question: "Din ce materiale construiți mobila?",
    answer:
      "Lucrăm cu PAL melaminat, MDF melaminat, MDF înfoliat și MDF vopsit, fiecare potrivit pentru zone diferite din casă. Feroneria este Blum. Îți explicăm pe înțelesul tău fiecare material în secțiunea Materiale.",
  },
  {
    question: "Cum decurge procesul, de la idee la montaj?",
    answer:
      "Pornim cu o consultanță gratuită în care înțelegem nevoile și spațiul. Urmează proiectarea 3D și oferta, apoi producția în atelier și, la final, montajul complet la tine acasă.",
  },
  {
    question: "Lucrați pe bază de contract și factură?",
    answer:
      "Da. Fiecare colaborare se face pe contract și cu factură, ca să știi clar ce primești, în ce termen și la ce preț.",
  },
  {
    question: "Cum se face plata?",
    answer:
      "Se lucrează cu un avans de regulă de 50% la confirmarea comenzii, iar restul se achită la finalizare și montaj. Detaliile exacte le stabilim în ofertă, în funcție de proiect.",
  },
  {
    question: "Cum cer o ofertă?",
    answer:
      "Poți cere o ofertă gratuită completând configuratorul, unde răspunzi la câteva întrebări simple, sau ne poți scrie direct pe WhatsApp, telefon ori email. Revenim rapid cu pașii următori.",
  },
];
