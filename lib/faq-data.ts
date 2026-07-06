// Single source of truth for the FAQ. Feeds both the visible /intrebari-frecvente
// page and its FAQPage JSON-LD (so schema and content never drift — a Google
// requirement). Answers are plain text, grounded in confirmed business facts
// (owner-confirmed 2026-07-06): national coverage, ~9-week average delivery,
// Blum hardware, montaj inclus, contract & factură, 24-month legal warranty,
// deposit + balance-on-install payment, personalized pricing.

export type FaqItem = { question: string; answer: string };

export const faqItems: FaqItem[] = [
  {
    question: "Cât costă mobilierul la comandă?",
    answer:
      "Prețul depinde de proiect: dimensiuni, materiale, feronerie și complexitatea execuției. De aceea lucrăm cu ofertă personalizată, nu cu prețuri de raft. Poți primi o estimare gratuită răspunzând la câteva întrebări în configurator sau scriindu-ne direct.",
  },
  {
    question: "Cât durează de la comandă până la montaj?",
    answer:
      "În medie, un proiect ajunge la montaj în aproximativ 8–10 săptămâni de la semnarea contractului. Termenul exact depinde de complexitate și de disponibilitatea materialelor, iar îl confirmăm în ofertă.",
  },
  {
    question: "În ce zonă lucrați?",
    answer:
      "Lucrăm în toată țara. Proiectarea și consultanța se pot face și la distanță, iar producția și montajul le coordonăm pentru locația ta.",
  },
  {
    question: "Oferiți garanție la mobilier?",
    answer:
      "Da. Fiecare lucrare beneficiază de garanție legală de conformitate de 24 de luni. Folosim feronerie Blum pe sertare și balamale, un standard de încredere pe termen lung.",
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
      "Se lucrează cu un avans la semnarea contractului, iar restul se achită la finalizare și montaj. Detaliile exacte le stabilim în ofertă, în funcție de proiect.",
  },
  {
    question: "Cum cer o ofertă?",
    answer:
      "Poți cere o ofertă gratuită completând configuratorul, unde răspunzi la câteva întrebări simple, sau ne poți scrie direct pe WhatsApp, telefon ori email. Revenim rapid cu pașii următori.",
  },
];
