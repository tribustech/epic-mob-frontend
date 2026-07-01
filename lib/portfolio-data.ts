export type ProjectCategory =
  | "bucatarie"
  | "baie"
  | "living"
  | "dormitor"
  | "birou"
  | "comercial";

// Filter taxonomy — mirrors the homepage room tiles (lib/site-data roomCategories)
// so a `/portfolio?cat=<room>` deep-link from the homepage always resolves.
export const portfolioRooms: { value: ProjectCategory; label: string }[] = [
  { value: "bucatarie", label: "Bucătărie" },
  { value: "baie", label: "Baie" },
  { value: "living", label: "Living" },
  { value: "dormitor", label: "Dormitor" },
  { value: "birou", label: "Birou" },
  { value: "comercial", label: "Comercial" },
];

export const roomLabel: Record<ProjectCategory, string> = Object.fromEntries(
  portfolioRooms.map((r) => [r.value, r.label])
) as Record<ProjectCategory, string>;

export type PortfolioProject = {
  slug: string;
  index: number;
  category: ProjectCategory;
  badge: string;
  title: string;
  lede: string;
  body: string;
  specs: { label: string; value: string }[];
  image: { src: string; alt: string };
  // Optional extra photos shown as a gallery on the case-study page.
  gallery?: { src: string; alt: string }[];
  // Optional SEO overrides. When absent, a keyword-aware default is derived from
  // the room + project name (see generateMetadata in app/portfolio/[slug]).
  seoTitle?: string;
  seoDescription?: string;
};

export const portfolioStats = {
  totalProjects: 84,
  yearsInOperation: 7,
  blumPercentage: 100,
  averageDeliveryWeeks: 9,
};

// Real projects only. `image` is the cover; `gallery` holds the rest of the
// shoot. Copy on the consolidated navy kitchen is placeholder — refine freely.
export const portfolioProjects: PortfolioProject[] = [
  {
    slug: "bucatarie-nuc-gola",
    index: 0,
    category: "bucatarie",
    badge: "Bucătărie · 2025",
    title: "Nuc <em>&amp; lumină.</em>",
    seoTitle:
      "Bucătărie nuc Carini cu profil Gola, MDF vopsit — proiect la comandă",
    seoDescription:
      "Bucătărie în L la comandă: baze albe mate din MDF vopsit, corpuri nuc Carini, profil Gola negru, feronerie Blum cu sertare metalice și blat Kronospan.",
    lede: "Bucătărie în L, complet fără mânere, care pune alb mat lângă nuc Carini, cu profil Gola negru continuu și microciment gri pe perete.",
    body: "Provocarea reală a fost <em>echilibrul dintre cald și tehnic</em>: clienții voiau lemn la vedere, dar și linii curate, fără mânere. Am ținut bazele în alb mat cu profil <em>Gola negru</em>, am ridicat corpurile superioare în nuc Carini pentru căldură și am tras un cornier negru continuu care leagă blatul de fronturi. Electrocasnicele negre se pierd într-o coloană, iar chiuveta și bateria negre închid paleta. Pentru că bucătăria se deschide direct spre zona de masă, fiecare îmbinare se vede din living — așa că aici nu există muchie neterminată.",
    specs: [
      { label: "Corpuri", value: "MDF vopsit + PAL Nuc Carini" },
      { label: "Feronerie", value: "Blum + sertare metalice" },
      { label: "Blat", value: "Kronospan" },
      { label: "Mâner", value: "Profil Gola, fără mâner" },
    ],
    image: {
      src: "/portfolio/kitchen-nuc-gola-front.png",
      alt: "Bucătărie în L cu baze albe mate și corpuri nuc Carini, profil Gola negru",
    },
    gallery: [
      {
        src: "/portfolio/kitchen-nuc-gola-angle.png",
        alt: "Vedere de ansamblu a bucătăriei deschisă spre zona de masă",
      },
      {
        src: "/portfolio/kitchen-nuc-gola-corner.png",
        alt: "Colțul în L cu chiuvetă neagră și corpuri superioare din nuc",
      },
      {
        src: "/portfolio/kitchen-nuc-gola-sink.png",
        alt: "Zona chiuvetei cu baterie neagră și espressor integrat",
      },
      {
        src: "/portfolio/kitchen-nuc-gola-dining.png",
        alt: "Bucătăria văzută din zona de masă cu masă ceramică neagră",
      },
    ],
  },
  {
    slug: "bucatarie-mdf-vopsit-frezat",
    index: 1,
    category: "bucatarie",
    badge: "Bucătărie · La comandă",
    title: "Bucătărie <em>de artist.</em>",
    seoTitle:
      "Bucătărie MDF vopsit și frezat, fronturi personalizate — proiect la comandă",
    seoDescription:
      "Bucătărie cu fronturi din MDF vopsit și frezat pe CNC, cu motive decorative desenate împreună cu clientul, un artist. Execuție la comandă cu feronerie Blum.",
    lede: "Bucătărie cu fronturi din MDF vopsit și frezat, cu elemente decorative desenate împreună cu clientul — un artist care a vrut ca bucătăria să poarte semnătura lui.",
    body: "Clientul este artist, așa că proiectul nu a pornit dintr-un catalog, ci din mâna lui: am desenat <em>împreună</em> motivele frezate din fronturi, le-am testat pe probe la scara 1:1 și le-am reluat până când desenul a curs corect pe toată suprafața. Fronturile sunt din MDF vopsit, frezate pe CNC după geometria agreată cu el, iar restul bucătăriei — corpuri, blat, feronerie — a fost ținut deliberat sobru, ca <em>decorul să rămână vedeta</em>.",
    specs: [
      { label: "Material", value: "MDF vopsit + frezat CNC" },
      { label: "Fronturi", value: "Tipar personalizat, desen propriu" },
      { label: "Colaborare", value: "Cu clientul (artist)" },
      { label: "Feronerie", value: "Blum" },
    ],
    image: {
      src: "/portfolio/00-kitchen-ornate-navy-full.jpg",
      alt: "Bucătărie cu fronturi din MDF vopsit și frezat, motive decorative personalizate",
    },
    gallery: [
      {
        src: "/portfolio/00-kitchen-ornate-navy-overview.jpg",
        alt: "Bucătărie navy — vedere de ansamblu",
      },
      {
        src: "/portfolio/00-kitchen-ornate-navy-upper.jpg",
        alt: "Corpuri superioare cu vitrină și LED mascat",
      },
      {
        src: "/portfolio/00-kitchen-ornate-navy-shelves.jpg",
        alt: "Corpuri superioare cu rafturi și vitrine iluminate",
      },
      {
        src: "/portfolio/00-kitchen-ornate-cabinets-close.jpg",
        alt: "Detaliu front sculptat în MDF vopsit cu profilatură clasică",
      },
      {
        src: "/portfolio/00-kitchen-navy-sink-detail.jpg",
        alt: "Chiuvetă inox integrată sub blat porcelanat",
      },
      {
        src: "/portfolio/kitchen-navy-sink-wide.jpg",
        alt: "Zona chiuvetei cu baterie premium și nișă",
      },
      {
        src: "/portfolio/00-kitchen-white-modern.jpg",
        alt: "Bucătărie modernă cu linii curate și blat porcelanat",
      },
      {
        src: "/portfolio/00-detail-gold-handle.jpg",
        alt: "Detaliu mâner de alamă turnat manual",
      },
      {
        src: "/portfolio/00-detail-blue-door-handle.jpg",
        alt: "Detaliu mâner decorativ pe ușă clasică",
      },
    ],
  },
  {
    slug: "living-mdf-vopsit-ardezie",
    index: 2,
    category: "living",
    badge: "Living · La comandă",
    title: "Living <em>pe ardezie.</em>",
    seoTitle:
      "Mobilier living MDF vopsit cu perete TV din ardezie flexibilă — la comandă",
    seoDescription:
      "Living cu mobilier MDF vopsit, perete TV placat cu ardezie flexibilă pe cadru de lemn care ascunde firele și apropie televizorul de perete, și dulap cu geamuri fumurii. Feronerie Blum.",
    lede: "Living cu mobilier din MDF vopsit, un perete TV îmbrăcat în ardezie flexibilă care ascunde firele și apropie televizorul de perete, și un dulap cu geamuri fumurii.",
    body: "Provocarea a fost <em>peretele de televizor</em>: clientul voia ecranul cât mai aproape de perete, dar fără niciun fir la vedere. Am ridicat un cadru de lemn și l-am îmbrăcat în <em>ardezie flexibilă</em>, lăsând în spate un gol tehnic pentru cabluri — așa televizorul stă lipit de suprafață, iar firele dispar complet. Lângă el am pus un <em>dulap cu geamuri fumurii</em>, care lasă conținutul să se întrevadă fără să-l expună, iar restul mobilierului este în MDF vopsit, pe feronerie Blum.",
    specs: [
      { label: "Material", value: "MDF vopsit" },
      { label: "Perete TV", value: "Ardezie flexibilă pe cadru de lemn" },
      { label: "Dulap", value: "Geamuri fumurii" },
      { label: "Feronerie", value: "Blum" },
    ],
    image: {
      src: "/portfolio/schite/living_randare1.jpg",
      alt: "Living cu mobilier MDF vopsit și perete TV placat cu ardezie flexibilă",
    },
    gallery: [
      {
        src: "/portfolio/schite/living_randare2.jpg",
        alt: "Perete TV din ardezie flexibilă cu dulap cu geamuri fumurii alături",
      },
      {
        src: "/portfolio/schite/living.png",
        alt: "Desen tehnic al peretelui TV cu poziționarea LED-urilor și a corpurilor",
      },
    ],
  },
  {
    slug: "dressing-cu-oglinzi",
    index: 3,
    category: "dormitor",
    badge: "Dressing · 2025",
    title: "Dressing <em>cu oglinzi.</em>",
    lede: "Dressing pe două nivele într-un dormitor de 3.6m, cu oglindă integrată pe ușa centrală și iluminare LED pe sertare.",
    body: "Spațiul real era de 3.6m liniari, dar tavanul avea o grindă decorativă care intra 18cm în volum. Am oprit corpul exact sub grindă și am compensat cu un raft tehnic pe latură. Oglinda <em>pivotantă</em> permite vedere completă fără să scoată clientul din volum.",
    specs: [
      { label: "Material", value: "PAL + MDF infoliat" },
      { label: "Oglindă", value: "Pivotantă cu balama-piano" },
      { label: "Suprafață", value: "3.6 m liniari" },
      { label: "Predat", value: "August 2025" },
    ],
    image: {
      src: "/portfolio/dressing-mirror-wardrobe.jpg",
      alt: "Dressing pe două nivele cu oglindă pivotantă integrată",
    },
  },
];

// Ordered by index — the source for the bento gallery and case-study lookup.
export const allPortfolioProjects: PortfolioProject[] = [...portfolioProjects].sort(
  (a, b) => a.index - b.index
);
