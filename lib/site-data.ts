export const navigation = [
  { href: "/", label: "Acasa", icon: "House" as const, color: "#007AFF" },
  { href: "/portfolio", label: "Portofoliu", icon: "Briefcase" as const, color: "#FF9500" },
  { href: "/despre", label: "Despre", icon: "Users" as const, color: "#34C759" },
  { href: "/contact", label: "Contact", icon: "Mail" as const, color: "#FF3B30" },
];

export const contactDetails = {
  phone: "+40 721 234 567",
  email: "contact@epicmob.ro",
  whatsapp: "https://wa.me/40721234567",
};

export const headerCta = {
  href: "/configurator",
  label: "Cere oferta",
};

export const menuSecondaryLinks = [
  { href: "/configurator", label: "Cere oferta" },
  { href: "/portfolio", label: "Portofoliu" },
  { href: "/contact", label: "Contact" },
];

export const heroImages = [
  "/portfolio/schite/living_randare1.jpg",
  "/portfolio/schite/living_randare2.jpg",
  "/portfolio/schite/bucatarie_randare1.jpg",
  "/portfolio/schite/bucatarie_randare2.png",
  "/portfolio/schite/baie_randare1.jpg",
  "/portfolio/schite/baie_randare2.jpg",
  "/portfolio/kitchen-ornate-navy-full.jpg",
  "/portfolio/kitchen-white-modern.jpg",
  "/portfolio/kitchen-ornate-navy-overview.jpg",
  "/portfolio/kitchen-navy-sink-wide.jpg",
];

export const trustSignals = [
  "Feronerie Blum",
  "Contract & Factura",
  "Montaj Inclus",
  "Consultanta Gratuita",
];

export const trustHighlights = [
  {
    icon: "consultanta",
    title: "Consultanta inclusa",
    description:
      "Pornim proiectul impreuna, chiar daca nu ai inca toate raspunsurile.",
  },
  {
    icon: "design",
    title: "Design interior integrat",
    description:
      "Materialele, culorile si volumele raman intr-un singur limbaj.",
  },
  {
    icon: "blum",
    title: "Feronerie Blum",
    description:
      "Standard de incredere pentru fiecare sertar si balama.",
  },
  {
    icon: "contract",
    title: "Contract si factura",
    description: "Colaborare asumata, nu doar promisiuni.",
  },
  {
    icon: "montaj",
    title: "Montaj complet",
    description:
      "Inclusiv electrocasnice si adaptari de instalatii.",
  },
];

export const materials = [
  {
    name: "PAL",
    image: "/portfolio/detail-blue-door-handle.jpg",
    bullets: [
      "Ideal pentru dressinguri si corpuri interioare",
      "Varietate mare de culori si texturi",
      "Raport calitate-pret excelent",
    ],
    durability: "Buna",
    moisture: "Moderata",
    finish: "Texturat / Neted",
    price: "Accesibil",
  },
  {
    name: "MDF Vopsit",
    image: "/portfolio/kitchen-ornate-cabinets-close.jpg",
    bullets: [
      "Recomandat pentru bucatarii si bai",
      "Rezistent la umiditate",
      "Finisaj neted, culori personalizate",
    ],
    durability: "Foarte buna",
    moisture: "Ridicata",
    finish: "Neted / Lucios / Mat",
    price: "Premium",
  },
  {
    name: "MDF Infoliat / Laminat",
    image: "/portfolio/kitchen-ornate-navy-upper.jpg",
    bullets: [
      "Alternativa eleganta la vopsit",
      "Texturi lemn sau finisaje mate",
      "Durabilitate ridicata la uzura",
    ],
    durability: "Foarte buna",
    moisture: "Buna",
    finish: "Texturat / Mat",
    price: "Mediu-Premium",
  },
];

export const servicePillars = [
  {
    title: "Consultanta si structurare de brief",
    description:
      "Preluam proiectul fie dintr-un punct foarte clar, fie dintr-un stadiu incipient si punem ordine in camere, nevoi si limitari tehnice.",
  },
  {
    title: "Design interior si selectie de materiale",
    description:
      "Discutam stilul, materialele, directia cromatica si zonele unde MDF-ul sau PAL-ul sunt mai potrivite.",
  },
  {
    title: "Productie, montaj si integrare electrocasnice",
    description:
      "Executia include feronerie Blum, atentia la detalii si montajul electrocasnicelor, plus adaptari de instalatii.",
  },
];

export const portfolioProjects = [
  {
    title: "Bucatarie sculptata in contraste calde",
    space: "Bucatarie",
    image: "/portfolio/kitchen-ornate-navy-full.jpg",
    tall: true,
  },
  {
    title: "Dressing cu oglinzi",
    space: "Dressing",
    image: "/portfolio/dressing-mirror-wardrobe.jpg",
    tall: false,
  },
  {
    title: "Bucatarie moderna alba",
    space: "Bucatarie",
    image: "/portfolio/kitchen-white-modern.jpg",
    tall: false,
  },
  {
    title: "Fronturi ornamentale MDF vopsit",
    space: "Detaliu",
    image: "/portfolio/kitchen-ornate-cabinets-close.jpg",
    tall: true,
  },
  {
    title: "Detaliu maner auriu",
    space: "Detaliu",
    image: "/portfolio/detail-gold-handle.jpg",
    tall: false,
  },
  {
    title: "Chiuveta si baterie premium",
    space: "Detaliu",
    image: "/portfolio/kitchen-navy-sink-detail.jpg",
    tall: false,
  },
  {
    title: "Bucatarie navy — vedere de ansamblu",
    space: "Bucatarie",
    image: "/portfolio/kitchen-ornate-navy-overview.jpg",
    tall: true,
  },
  {
    title: "Corpuri superioare cu vitrina",
    space: "Bucatarie",
    image: "/portfolio/kitchen-ornate-navy-shelves.jpg",
    tall: false,
  },
  {
    title: "Usa clasica cu maner decorativ",
    space: "Detaliu",
    image: "/portfolio/detail-blue-door-handle.jpg",
    tall: true,
  },
  {
    title: "Corpuri superioare close-up",
    space: "Bucatarie",
    image: "/portfolio/kitchen-ornate-navy-upper.jpg",
    tall: false,
  },
  {
    title: "Bucatarie navy — zona chiuveta",
    space: "Bucatarie",
    image: "/portfolio/kitchen-navy-sink-wide.jpg",
    tall: false,
  },
];

export const processSteps = [
  {
    title: "Consultanta",
    description:
      "Preluam camerele, stilul dorit si evaluam ce este deja decis.",
    image: "/portfolio/schite/bucatarie_shita_mana.jpg",
    imageAlt: "Schita de bucatarie desenata de mana",
    imageVariant: "photo" as const,
  },
  {
    title: "Design",
    description:
      "Clarificam directia cromatica, volumele si materialele.",
    image: "/portfolio/schite/bucatarie.png",
    imageAlt: "Randare digitala a unei bucatarii",
    imageVariant: "photo" as const,
  },
  {
    title: "Selectie materiale",
    description:
      "Alegem impreuna PAL, MDF vopsit sau infoliat pentru fiecare zona.",
    image: "/portfolio/schite/paletar.png",
    imageAlt: "Paletar cu mostre de materiale si finisaje",
    imageVariant: "photo" as const,
  },
  {
    title: "Oferta si contract",
    description:
      "Prezentam oferta detaliata si semnam contractul.",
    image: "/portfolio/schite/contract.png",
    imageAlt: "Ilustratie cu un contract si strangere de mana",
    imageVariant: "illustration" as const,
  },
  // {
  //   title: "Productie",
  //   description:
  //     "Executam cu feronerie Blum si atentie la fiecare detaliu.",
  // },
  {
    title: "Montaj & Predare",
    description:
      "Montaj complet, inclusiv electrocasnice si adaptari de instalatii.",
    image: "/portfolio/schite/bucatarie_randare1.jpg",
    imageAlt: "Randare finala a unei bucatarii montate",
    imageVariant: "photo" as const,
  },
];

export const basicQuestions = [
  "Camerele pe care vrei sa le mobilezi",
  "Randari, schite sau masuratori existente",
  "Linkuri Pinterest si imagini de inspiratie",
  "Directie de culori si stil",
  "Electrocasnice deja alese",
  "Deadline si detalii generale",
];

export const advancedSignals = [
  "Camere si corpuri de mobilier pe fiecare zona",
  "Materiale: PAL, MDF vopsit si combinatii viitoare",
  "Branduri de finisaj: Egger, AGT, MDF vopsit",
  "Iluminare: buton, senzor, telecomanda, alb cald, alb rece, RGB",
  "Observatii despre electrocasnice, dimensiuni si referinte",
  "Lead complet pentru discutie rapida si precisa",
];
