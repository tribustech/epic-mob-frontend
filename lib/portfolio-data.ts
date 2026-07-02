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
  {
    slug: "bucatarie-cappuccino-piatra-neagra",
    index: 4,
    category: "bucatarie",
    badge: "Apartament · 2025",
    title: "Cappuccino <em>&amp; piatră neagră.</em>",
    seoTitle:
      "Bucătărie cappuccino lucioasă cu piatră neagră — proiect apartament la comandă",
    seoDescription:
      "Bucătărie în U din PAL lucios cappuccino, blat și spate cu aspect de piatră neagră, feronerie Blum și electrocasnice Beko integrate — plus dressing și mobilier de baie asortat.",
    lede: "Amenajare completă de apartament: o bucătărie în U cu fronturi lucioase cappuccino și piatră neagră pe blat și spate, dressing cu oglindă și mobilier de baie crem, în aceeași notă caldă.",
    body: "Clienții voiau o bucătărie <em>caldă, dar cu contrast</em> — nu încă o bucătărie albă. Am ales fronturi lucioase cappuccino, care prind lumina, și le-am pus lângă un blat și un spate cu aspect de piatră neagră pentru profunzime. Bucătăria în U valorifică fiecare colț: chiuveta neagră stă exact în unghi, mașina de spălat vase se ascunde integrată lângă cuptor, iar electrocasnicele Beko negre se topesc în fronturi. Mânerele bară negre, aplicate, dau ritmul întregii compoziții. Am dus aceeași notă în tot apartamentul — dressing alb cu oglindă în dormitor și mobilier de baie crem — ca totul să pară gândit împreună, nu adunat pe bucăți.",
    specs: [
      { label: "Corpuri", value: "PAL melaminat lucios cappuccino" },
      { label: "Blat & spate", value: "Laminat aspect piatră neagră" },
      { label: "Feronerie", value: "Blum + sertare metalice" },
      { label: "Electrocasnice", value: "Beko integrate" },
    ],
    image: {
      src: "/portfolio/cappuccino-kitchen-cover.webp",
      alt: "Bucătărie în U cu fronturi lucioase cappuccino și blat din piatră neagră",
    },
    gallery: [
      {
        src: "/portfolio/cappuccino-kitchen-wide.webp",
        alt: "Vedere de ansamblu a bucătăriei cappuccino cu spate din piatră neagră",
      },
      {
        src: "/portfolio/cappuccino-kitchen-appliances.webp",
        alt: "Zona de gătit cu cuptor Beko, sertare și mașină de spălat vase integrată",
      },
      {
        src: "/portfolio/cappuccino-bathroom.webp",
        alt: "Baie cu mobilier crem, dulap-oglindă cu LED și coloană suspendată",
      },
      {
        src: "/portfolio/cappuccino-wardrobe.webp",
        alt: "Dressing alb cu ușă-oglindă centrală în dormitor",
      },
      {
        src: "/portfolio/cappuccino-bedroom.webp",
        alt: "Dormitor cu pat alb lucios și dulap cu oglindă asortat",
      },
    ],
  },
  {
    slug: "bucatarie-alba-marmura",
    index: 5,
    category: "bucatarie",
    badge: "Bucătărie · 2026",
    title: "Alb <em>&amp; marmură.</em>",
    seoTitle:
      "Bucătărie albă cu spate din marmură Calacatta — proiect la comandă",
    seoDescription:
      "Bucătărie dreaptă cu fronturi albe mate, spate și pardoseală cu aspect de marmură Calacatta, iluminat LED sub corpuri și electrocasnice negre încastrate.",
    lede: "Bucătărie dreaptă în alb mat, cu spate și pardoseală din marmură Calacatta care aduce toată nervura în încăpere, iluminat LED sub corpuri și electrocasnice negre integrate.",
    body: "Clienții voiau o bucătărie <em>luminoasă, dar cu caracter</em> — nu una plată. Am ținut fronturile în alb, fără accente care să concureze, și am lăsat <em>marmura Calacatta</em> să fie vedeta: aceeași nervură caldă urcă de pe pardoseală pe spatele de lucru, așa că bucătăria pare tăiată dintr-o singură bucată de piatră. Banda LED de sub corpurile superioare spală venele marmurei și le scoate în evidență seara, iar plita, cuptorul și hota se retrag în negru ca linia albă să rămână continuă.",
    specs: [
      { label: "Fronturi", value: "Alb mat" },
      { label: "Spate & pardoseală", value: "Aspect marmură Calacatta" },
      { label: "Iluminat", value: "Bandă LED sub corpuri" },
      { label: "Electrocasnice", value: "Plită & cuptor negre, încastrate" },
    ],
    image: {
      src: "/portfolio/white-marble-kitchen-cover.webp",
      alt: "Bucătărie dreaptă albă cu spate din marmură Calacatta și electrocasnice negre încastrate",
    },
    gallery: [
      {
        src: "/portfolio/white-marble-kitchen-wide.webp",
        alt: "Bucătăria albă văzută din zona de masă, cu blat alb continuu",
      },
    ],
  },
  {
    slug: "bucatarie-shaker-alba-blat-negru",
    index: 6,
    category: "bucatarie",
    badge: "Bucătărie · 2026",
    title: "Shaker <em>alb, blat negru.</em>",
    seoTitle:
      "Bucătărie în L cu fronturi shaker albe și blat negru — proiect la comandă",
    seoDescription:
      "Bucătărie în L cu fronturi shaker albe, blat negru, faianță metrou, coloană de cuptor și microunde încastrate și frigider inox, potrivită în jurul centralei de perete.",
    lede: "Bucătărie în L cu fronturi shaker albe și blat negru, faianță metrou pe spate, coloană de cuptor și microunde și frigider inox — totul potrivit în jurul centralei de pe perete.",
    body: "Aici provocarea a fost <em>să încadrăm o bucătărie completă într-un spațiu real de bloc</em>, cu centrala termică pe perete și o fereastră care mânca din blat. Am mers pe fronturi <em>shaker albe</em>, calde și clasice, cu blat negru pentru contrast și faianță metrou pe spate. Colțul în L strânge tot ce trebuie: coloana cu cuptor și microunde încastrate lângă frigiderul inox, chiuveta și plita pe blatul negru continuu, iar corpurile ajung fix sub centrală, fără spații pierdute.",
    specs: [
      { label: "Fronturi", value: "Shaker alb" },
      { label: "Blat & spate", value: "Blat negru + faianță metrou" },
      { label: "Configurație", value: "Bucătărie în L" },
      { label: "Electrocasnice", value: "Cuptor & microunde încastrate, frigider inox" },
    ],
    image: {
      src: "/portfolio/shaker-white-kitchen-cover.webp",
      alt: "Bucătărie în L cu fronturi shaker albe, blat negru și faianță metrou, coloană cuptor și frigider inox",
    },
    gallery: [
      {
        src: "/portfolio/shaker-white-kitchen-hob.webp",
        alt: "Zona plitei și a chiuvetei pe blat negru, lângă centrala de perete",
      },
      {
        src: "/portfolio/shaker-white-kitchen-wide.webp",
        alt: "Vedere de ansamblu a bucătăriei shaker în L cu coloana de electrocasnice",
      },
      {
        src: "/portfolio/shaker-white-kitchen-column.webp",
        alt: "Coloana cu cuptor și microunde încastrate lângă frigiderul inox",
      },
      {
        src: "/portfolio/shaker-white-kitchen-door.webp",
        alt: "Bucătăria văzută dinspre ușa cu geam mat, cu blat negru continuu",
      },
    ],
  },
  {
    slug: "bucatarie-stejar-garsoniera",
    index: 7,
    category: "bucatarie",
    badge: "Bucătărie · 2026",
    title: "Stejar <em>pentru garsonieră.</em>",
    seoTitle:
      "Bucătărie compactă decor stejar pentru garsonieră — proiect la comandă",
    seoDescription:
      "Bucătărie dreaptă compactă în decor stejar deschis, cu spate din faianță maro, plită pe gaz, cuptor încastrat și coloană înaltă de depozitare — gândită pentru o garsonieră.",
    lede: "Bucătărie dreaptă compactă în decor stejar deschis, cu spate din faianță maro, plită pe gaz și cuptor încastrat și o coloană înaltă de depozitare — gândită pentru o garsonieră.",
    body: "Pentru o garsonieră, bucătăria trebuie <em>să încapă tot pe un singur perete</em> și să nu încarce camera. Am ales un decor <em>stejar deschis</em>, cald și tolerant la uz zilnic, pe un front simplu cu mânere-bară. Pe lângă plită și cuptor am ridicat o coloană înaltă care preia frigiderul și cămara într-un singur volum, așa că restul peretelui rămâne liber, iar spațiul de locuit respiră.",
    specs: [
      { label: "Corpuri", value: "PAL decor stejar deschis" },
      { label: "Spate", value: "Faianță maro" },
      { label: "Configurație", value: "Bucătărie dreaptă + coloană" },
      { label: "Electrocasnice", value: "Plită gaz + cuptor încastrat" },
    ],
    image: {
      src: "/portfolio/oak-studio-kitchen-cover.webp",
      alt: "Bucătărie dreaptă în decor stejar deschis cu spate maro și coloană de depozitare, pentru garsonieră",
    },
    gallery: [
      {
        src: "/portfolio/oak-studio-kitchen-wide.webp",
        alt: "Bucătăria stejar văzută în camera de zi, cu coloana înaltă alături",
      },
    ],
  },
  {
    slug: "baie-faianta-lemn",
    index: 8,
    category: "baie",
    badge: "Baie · 2026",
    title: "Baie <em>caldă, în lemn.</em>",
    seoTitle:
      "Mobilier de baie alb lucios pe faianță aspect lemn — proiect la comandă",
    seoDescription:
      "Baie mică cu faianță aspect lemn, mobilier alb lucios, bază de lavoar pe rotile cu blat integrat și dulap-oglindă cu iluminat LED.",
    lede: "Baie mică îmbrăcată în faianță cu aspect de lemn, cu mobilier alb lucios, lavoar cu blat integrat și dulap-oglindă cu iluminat LED deasupra.",
    body: "Într-o baie mică, mobilierul trebuie <em>să fie practic fără să pară înghesuit</em>. Am pus mobilierul în alb lucios, care reflectă lumina și deschide spațiul, pe fondul cald al faianței cu aspect de lemn. Baza de lavoar stă pe rotile pentru acces ușor la instalație, iar dulapul-oglindă de deasupra adaugă depozitare la înălțime și un LED care luminează exact zona de folosit.",
    specs: [
      { label: "Mobilier", value: "Alb lucios" },
      { label: "Lavoar", value: "Bază pe rotile cu blat integrat" },
      { label: "Oglindă", value: "Dulap-oglindă cu LED" },
      { label: "Finisaj", value: "Faianță aspect lemn" },
    ],
    image: {
      src: "/portfolio/wood-tile-bathroom-cover.webp",
      alt: "Baie mică cu faianță aspect lemn, mobilier alb lucios și dulap-oglindă cu LED",
    },
    gallery: [
      {
        src: "/portfolio/wood-tile-bathroom-vanity.webp",
        alt: "Lavoarul cu bază albă și dulapul-oglindă deschis, cu rafturi interioare",
      },
    ],
  },
  {
    slug: "dressing-tv-integrat",
    index: 9,
    category: "dormitor",
    badge: "Dormitor · 2026",
    title: "Dulap <em>cu nișă de TV.</em>",
    seoTitle:
      "Dulap pe tot peretele cu nișă de TV integrată — proiect la comandă",
    seoDescription:
      "Dulap pe tot peretele cu nișă de televizor integrată, uși glisante, rafturi deschise și sertare cu iluminat LED — depozitare completă pentru o cameră mică.",
    lede: "Dulap pe tot peretele cu nișă de televizor integrată, uși glisante, rafturi deschise și sertare cu iluminat LED — depozitare completă fără să ocupe camera.",
    body: "Într-o cameră unde <em>fiecare centimetru contează</em>, am strâns garderoba, televizorul și depozitarea într-un singur perete. Ușile glisante nu se deschid spre exterior, așa că nu fură spațiu, nișa de TV ține ecranul la înălțimea corectă cu o bandă LED discretă deasupra, iar sertarele și rafturile deschise împart hainele de obiectele la vedere. Volumul merge din podea până în tavan, ca nimic să nu se piardă sus.",
    specs: [
      { label: "Corpuri", value: "PAL melaminat" },
      { label: "Uși", value: "Glisante" },
      { label: "Nișă TV", value: "Cu iluminat LED" },
      { label: "Depozitare", value: "Sertare + rafturi deschise" },
    ],
    image: {
      src: "/portfolio/tv-wardrobe-cover.webp",
      alt: "Dulap pe tot peretele cu nișă de televizor integrată, uși glisante și iluminat LED",
    },
    gallery: [
      {
        src: "/portfolio/tv-wardrobe-open.webp",
        alt: "Dulapul cu ușile deschise, arătând bara de umeraș și rafturile interioare",
      },
      {
        src: "/portfolio/tv-wardrobe-shelves.webp",
        alt: "Zona centrală cu rafturi deschise, nișa de TV și sertare",
      },
      {
        src: "/portfolio/tv-wardrobe-closed.webp",
        alt: "Dulapul cu ușile glisante închise și nișa de televizor",
      },
    ],
  },
  {
    slug: "dulap-hol-oglinda",
    index: 10,
    category: "dormitor",
    badge: "Dulap hol · 2026",
    title: "Dulap <em>cu oglindă, pe hol.</em>",
    seoTitle:
      "Dulap de hol cu uși glisante și oglindă pe toată înălțimea — la comandă",
    seoDescription:
      "Dulap de hol cu uși glisante și oglindă pe toată înălțimea pe ușa centrală, în decor cald — depozitare discretă la intrare care mărește optic spațiul.",
    lede: "Dulap de hol cu uși glisante și oglindă pe toată înălțimea pe ușa centrală, în decor cald — depozitare discretă chiar la intrare, care și mărește optic holul.",
    body: "Holul e primul lucru pe care îl vezi când intri, așa că dulapul trebuia <em>să depoziteze mult și să pară puțin</em>. Am mers pe uși glisante, ca să nu blocheze circulația pe un spațiu îngust, și am pus <em>oglindă pe toată înălțimea</em> pe ușa din mijloc — dublează lumina și face holul să pară de două ori mai lat. Decorul cald al fronturilor se leagă de tâmplăria existentă, iar covorul cu meandru grecesc a dat nota pentru restul.",
    specs: [
      { label: "Corpuri", value: "PAL decor cald" },
      { label: "Uși", value: "Glisante cu oglindă" },
      { label: "Rol", value: "Depozitare pe hol" },
      { label: "Efect", value: "Mărește optic spațiul" },
    ],
    image: {
      src: "/portfolio/mirror-hall-wardrobe-cover.webp",
      alt: "Dulap de hol cu uși glisante și oglindă pe toată înălțimea, în decor cald",
    },
    gallery: [
      {
        src: "/portfolio/mirror-hall-wardrobe-angle.webp",
        alt: "Dulapul de hol văzut din lateral, cu oglinda reflectând camera alăturată",
      },
      {
        src: "/portfolio/mirror-hall-wardrobe-hall.webp",
        alt: "Holul cu dulapul glisant și ușile de interior din lemn",
      },
    ],
  },
];

// Ordered by index — the source for the bento gallery and case-study lookup.
export const allPortfolioProjects: PortfolioProject[] = [...portfolioProjects].sort(
  (a, b) => a.index - b.index
);
