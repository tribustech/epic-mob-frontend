import { DELIVERY_TEXT, ROOM_LABELS, pictureOf, SHOP_CATEGORIES, SHOP_PRODUCTS, type ShopCategory, type ShopProduct, type ShopRoom } from "./products";

/**
 * Landing pages of the shop, one per room (/magazin/camera/<camera>) and one per kind of furniture
 * (/magazin/categorie/<categorie>): static pages with their own words for search engines, the products
 * of that room or kind, a few questions and answers (FAQPage JSON-LD) and links to the materials pages.
 * Plain data here (no server code), so tests and the sitemap can read it.
 */

export interface LandingFaq {
  question: string;
  answer: string;
}

export interface LandingLink {
  href: string;
  label: string;
}

export interface ShopLanding {
  kind: "camera" | "categorie";
  /** the room or category id the products are picked by */
  key: ShopRoom | ShopCategory;
  /** the last part of the address */
  slug: string;
  /** /magazin/camera/dormitor */
  path: string;
  /** short name for links and breadcrumbs: „Dormitor", „Dulapuri și dressinguri" */
  name: string;
  h1: string;
  /** full <title> (absolute) */
  title: string;
  description: string;
  eyebrow: string;
  /** 2–3 paragraphs written for this page only */
  intro: string[];
  faq: LandingFaq[];
  /** the materials pages that matter here */
  materials: LandingLink[];
}

/** A landing page is built only when it has at least this many products (else it would be thin). */
export const MIN_LANDING_PRODUCTS = 2;

/** „livrare și montaj în 4–6 săptămâni", for the middle of a sentence */
const DELIVERY = DELIVERY_TEXT.charAt(0).toLowerCase() + DELIVERY_TEXT.slice(1);

const PAL: LandingLink = { href: "/materiale/pal-melaminat", label: "PAL melaminat de 18 mm" };
const HARDWARE: LandingLink = { href: "/materiale#feronerie", label: "Feroneria Blum, cu închidere lină" };
const HANDLES: LandingLink = { href: "/materiale#manere", label: "Mânere și deschidere prin apăsare" };
const BOARDS: LandingLink = { href: "/materiale#lemn", label: "PAL sau MDF: cum diferă plăcile" };
const MDF_PAINTED: LandingLink = { href: "/materiale/mdf-vopsit", label: "MDF vopsit, pentru fronturi" };
const MDF_MELAMINE: LandingLink = { href: "/materiale/mdf-melaminat", label: "MDF melaminat" };
const LIGHTING: LandingLink = { href: "/materiale#iluminat", label: "Iluminat LED în mobilier" };

/** Room address parts: the room ids are already plain Romanian words. */
export const ROOM_SLUGS: Record<ShopRoom, string> = {
  dormitor: "dormitor",
  living: "living",
  hol: "hol",
  bucatarie: "bucatarie",
  baie: "baie",
  copii: "copii",
  birou: "birou",
};

/** Category address parts, from the category labels. */
export const CATEGORY_SLUGS: Record<ShopCategory, string> = {
  dulapuri: "dulapuri-dressinguri",
  comode: "comode-noptiere",
  biblioteci: "biblioteci-separatoare",
  suspendate: "corpuri-suspendate",
  bucatarii: "bucatarii",
  baie: "mobilier-baie",
};

export const roomPath = (room: ShopRoom) => `/magazin/camera/${ROOM_SLUGS[room]}`;
export const categoryPath = (category: ShopCategory) => `/magazin/categorie/${CATEGORY_SLUGS[category]}`;

type Copy = Pick<ShopLanding, "h1" | "title" | "description" | "eyebrow" | "intro" | "faq" | "materials">;

const ROOM_COPY: Record<ShopRoom, Copy> = {
  dormitor: {
    h1: "Mobilă de dormitor la comandă",
    title: "Mobilă de dormitor la comandă: dulapuri, comode, noptiere | Epic Mob",
    description:
      "Dulapuri cu uși glisante sau cu oglindă, comode cu sertare, noptiere și corpuri peste pat, făcute pe măsură din PAL Egger de 18 mm, cu feronerie Blum. Montaj inclus, garanție 5 ani.",
    eyebrow: "Magazin · Dormitor",
    intro: [
      "În dormitor, mobila trebuie să țină multe și să se vadă puțin. Aici găsești dulapuri și dressinguri pe toată lățimea peretelui, cu uși glisante care nu cer loc liber în fața lor, comode cu sertare pentru lenjerie, noptiere și corpuri suspendate care folosesc peretele de deasupra patului.",
      "Corpurile le facem în atelierul nostru, din PAL melaminat de 18 mm de la Egger sau Kastamonu, cu cant ABS pe toate muchiile și spate din HDF alb. Sertarele alunecă pe glisiere Blum TANDEM, iar ușile batante au balamale Blum cu închidere lină, așa că nimic nu se trântește seara târziu.",
      `Prețul de pe fiecare model include montajul, iar după confirmarea comenzii urmează ${DELIVERY}. Pentru tot ce montăm ai garanție 5 ani. Vrei alt interior, alt număr de uși sau culoarea pereților tăi? Pornești de la orice model și îl schimbi în Atelierul 3D.`,
    ],
    faq: [
      {
        question: "Uși glisante sau batante la dulapul de dormitor?",
        answer:
          "Ușile glisante nu au nevoie de loc în fața dulapului, așa că sunt potrivite când patul e aproape de perete. Ușile batante se deschid complet și vezi tot interiorul dintr-o privire; la modelele noastre au balamale Blum cu închidere lină.",
      },
      {
        question: "Ce adâncime au dulapurile de dormitor din magazin?",
        answer:
          "Dulapurile și dressingurile de dormitor au în general 55–60 cm adâncime, cât să încapă umerașele drept. Dimensiunile exacte (lățime × înălțime × adâncime) sunt scrise pe pagina fiecărui model.",
      },
      {
        question: "Pot avea comoda și noptierele în aceeași culoare cu dulapul?",
        answer:
          "Da. Modelele folosesc aceleași combinații de decoruri, așa că alegi aceeași culoare la fiecare piesă. Dacă o combinație lipsește la un model, de cele mai multe ori o poți alege pentru el în Atelierul 3D.",
      },
      {
        question: "Dulapurile cu oglindă se fac în orice culoare?",
        answer:
          "Ușile cu oglindă le facem cu corpul alb, ca oglinda să arate curat. La dulapurile care au oglindă doar pe unele uși, celelalte uși pot fi în culoarea aleasă.",
      },
    ],
    materials: [PAL, HARDWARE, HANDLES, BOARDS],
  },
  living: {
    h1: "Mobilă de living la comandă",
    title: "Mobilă de living la comandă: comode TV, biblioteci, rafturi | Epic Mob",
    description:
      "Comode TV pe picioare sau suspendate, bufete, biblioteci și separatoare pentru living, făcute pe măsură în atelierul Epic Mob din PAL de 18 mm, cu feronerie Blum. Montaj inclus și garanție 5 ani.",
    eyebrow: "Magazin · Living",
    intro: [
      "Livingul e camera în care mobila se vede cel mai mult, așa că modelele de aici sunt gândite să lase spațiul aerisit: comode TV joase și lungi, corpuri TV care plutesc pe perete, bufete cu uși și sertare, biblioteci deschise pe ambele fețe și separatoare care despart zona de zi fără să închidă lumina.",
      "Le facem pe măsură, în atelierul nostru, din PAL melaminat de 18 mm (Egger sau Kastamonu), cu cant ABS în culoarea plăcii. Ușile se închid lin pe balamale Blum, sertarele merg pe glisiere Blum TANDEM, iar la corpurile cu uși care se ridică folosim pistoane cu gaz, ca ușa să rămână sus cât iei ce-ți trebuie.",
      `Prețul afișat include montajul, iar termenul este același pentru toate piesele: ${DELIVERY}. Ai garanție 5 ani. Dacă peretele tău are altă lungime, alegi una dintre lățimile de pe pagina produsului sau desenezi piesa de la zero în Atelierul 3D.`,
    ],
    faq: [
      {
        question: "Ce lățime aleg pentru comoda TV?",
        answer:
          "Comoda arată bine când e vizibil mai lată decât televizorul, ca ecranul să nu pară că iese peste margini. În magazin ai comode TV de 1,6, 2 și 2,4 m, iar pe pagina fiecărui model găsești de obicei și o lățime mai mică și una mai mare.",
      },
      {
        question: "Comodă TV pe picioare sau suspendată?",
        answer:
          "Corpul suspendat lasă podeaua liberă, se curăță ușor sub el și face livingul să pară mai mare; se prinde de perete pe suporți ascunși. Comoda pe picioare ține mai mult și nu depinde de perete. Spune-ne din ce e peretele, ca să venim la montaj cu prinderile potrivite.",
      },
      {
        question: "Un separator poate împărți livingul de dormitor sau de bucătărie?",
        answer:
          "Da, pentru asta sunt făcute. Bibliotecile separator sunt deschise pe ambele fețe, așa că lumina trece prin ele, iar variantele cu uși sau sertare jos ascund ce nu vrei la vedere.",
      },
    ],
    materials: [PAL, HARDWARE, LIGHTING, BOARDS],
  },
  hol: {
    h1: "Mobilă de hol la comandă",
    title: "Mobilă de hol la comandă: dulapuri, pantofare, cuiere | Epic Mob",
    description:
      "Dulapuri de hol cu adâncime mică, pantofare înguste, cuiere deschise și dulapuri cu oglindă, făcute pe măsură din PAL de 18 mm cu feronerie Blum. Montaj inclus, garanție 5 ani.",
    eyebrow: "Magazin · Hol",
    intro: [
      "Holul e de obicei îngust și plin de lucruri care trebuie să stea la îndemână: geci, pantofi, genți, chei. De aceea mobila de hol de aici are adâncime mică, de la 30 cm la pantofarul înalt până la 45 cm la dulapurile pentru haine, și uși cu oglindă în care te vezi din cap până în picioare înainte să pleci.",
      "Fiecare piesă se face în atelierul nostru, la dimensiunile peretelui, din PAL melaminat de 18 mm Egger sau Kastamonu. Cantul ABS de pe toate muchiile ține la loviturile de zi cu zi, iar balamalele Blum cu închidere lină opresc ușa ușor, chiar dacă o împingi în grabă.",
      `Montajul este inclus în preț și vine odată cu livrarea: ${DELIVERY}, cu garanție 5 ani. Dacă holul are o nișă ciudată sau un perete înclinat, pornești de la un model din magazin și îl potrivești în Atelierul 3D.`,
    ],
    faq: [
      {
        question: "Ce adâncime are un dulap de hol?",
        answer:
          "Dulapurile de hol din magazin au 45 cm adâncime, iar pantofarul înalt doar 30 cm, ca să lase loc de trecere. Pentru haine pe umerașe puse drept, alege un dulap de dormitor de 55–60 cm, dacă holul îți permite.",
      },
      {
        question: "Câte perechi de pantofi încap în pantofar?",
        answer:
          "Pantofarul înalt de 0,8 m are cinci rânduri de încălțăminte, iar pantofarul de 1,2 m are uși și polițe la 35 cm adâncime. Numărul de perechi depinde de mărime și de tipul încălțămintei; dimensiunile exacte sunt pe pagina fiecărui model.",
      },
      {
        question: "Pot pune un dulap suspendat deasupra pantofarului?",
        answer:
          "Da. Dulapul suspendat de hol de 0,9 m este făcut exact pentru asta: stă deasupra pantofarului sau a mașinii de spălat și se prinde de perete pe suporți ascunși.",
      },
    ],
    materials: [PAL, HARDWARE, HANDLES],
  },
  bucatarie: {
    h1: "Mobilă de bucătărie la comandă",
    title: "Mobilă de bucătărie la comandă: bucătării, cămări, corpuri | Epic Mob",
    description:
      "Bucătării pe un perete sau în L, cu blat Egger de 38 mm, plus dulapuri de cămară, bufete de cafea și corpuri suspendate. Făcute pe măsură, cu feronerie Blum, montaj inclus și garanție 5 ani.",
    eyebrow: "Magazin · Bucătărie",
    intro: [
      "Pentru bucătărie găsești aici atât bucătării întregi, pe un perete sau în L, cât și piesele care stau lângă ele: dulapul de cămară cu polițe de sus până jos, dulapul pentru aspirator și mături, bufetul de cafea înalt cât blatul și corpuri suspendate pentru veselă.",
      "Corpurile sunt din PAL melaminat de 18 mm de la Egger sau Kastamonu, iar blatul este Egger de 38 mm, decupat pentru chiuveta și plita ta. Sertarele mari merg pe glisiere Blum TANDEM de 30 kg, cu închidere lină și extracție completă, iar ușile au balamale Blum CLIP top BLUMOTION.",
      `Lăsăm loc exact pentru electrocasnicele tale (cuptor, plită, mașină de vase, frigider încorporabil); ele nu sunt incluse în preț. Montajul este inclus, termenul este ${DELIVERY}, iar garanția este de 5 ani. Dacă bucătăria ta are alte cote, o refaci pe măsură în Atelierul 3D.`,
    ],
    faq: [
      {
        question: "Sunt incluse electrocasnicele și chiuveta?",
        answer:
          "Nu. Bucătăriile din magazin au locurile pregătite pentru cuptor, plită, mașină de vase, frigider încorporabil și chiuvetă, iar blatul îl decupăm pentru ale tale. Ne spui modelele la telefon și ținem cont de dimensiunile lor.",
      },
      {
        question: "Ce blat are bucătăria?",
        answer:
          "Blat Egger de 38 mm, cu muchia în același decor, decupat pentru chiuvetă și plită. Adâncimea blatului este de 60 cm la toate bucătăriile din magazin.",
      },
      {
        question: "Bucătăria mea are alte dimensiuni. Ce fac?",
        answer:
          "Alegi modelul cel mai apropiat și îl deschizi în Atelierul 3D: schimbi lungimea, modulele, ușile și culorile, iar prețul se schimbă pe loc. Dacă vrei, venim gratuit să verificăm măsurile înainte de producție.",
      },
      {
        question: "Pot lua doar un dulap de cămară sau un bufet, fără bucătărie?",
        answer:
          "Da. Dulapul de cămară, dulapul pentru aspirator și bufetul de cafea se vând separat, cu montaj inclus, și se potrivesc lângă o bucătărie existentă.",
      },
    ],
    materials: [PAL, HARDWARE, MDF_PAINTED, LIGHTING],
  },
  baie: {
    h1: "Mobilier de baie la comandă",
    title: "Mobilier de baie la comandă: lavoar, oglindă, coloane | Epic Mob",
    description:
      "Mobilier pentru lavoar suspendat sau pe picioare, dulapuri cu oglindă, coloane și nișă pentru mașina de spălat, făcute pe măsură cu blat de 38 mm și sertare Blum. Montaj inclus, garanție 5 ani.",
    eyebrow: "Magazin · Baie",
    intro: [
      "În baie fiecare centimetru contează. Modelele de aici pornesc de la 50 cm, pentru baia foarte mică, și ajung la lavoarul dublu de 1,4 m. Sunt și ansambluri cu mașina de spălat sub același blat, coloane înalte și puțin adânci pentru prosoape și dulăpioare suspendate pentru cosmetice.",
      "Le facem în atelierul nostru din PAL melaminat de 18 mm (Egger sau Kastamonu), cu cant ABS pe toate muchiile și blat de 38 mm decupat pentru lavoarul tău. Sertarele de sub lavoar merg pe glisiere Blum TANDEM cu închidere lină, iar dulapurile cu oglindă au balamale Blum.",
      `Prețul include montajul; lavoarul și bateria le alegi tu, iar noi lăsăm decupajul pentru ele. Urmează ${DELIVERY}, cu garanție 5 ani. Dacă baia ta cere altă lățime, o alegi pe pagina produsului sau desenezi mobilierul în Atelierul 3D.`,
    ],
    faq: [
      {
        question: "Este inclus lavoarul în preț?",
        answer:
          "Nu. Lavoarul și bateria nu sunt incluse, ca să le poți alege tu. Blatul de 38 mm îl decupăm pentru lavoarul tău, așa că ne spui modelul înainte de producție.",
      },
      {
        question: "Mobilier suspendat sau pe picioare?",
        answer:
          "Mobilierul suspendat lasă podeaua liberă și se spală ușor pe jos. Varianta pe picioare are picioare reglabile și plintă, potrivită când peretele nu poate ține greutate. Ambele se găsesc în magazin.",
      },
      {
        question: "Am loc doar pentru lavoar și mașina de spălat. Aveți ceva potrivit?",
        answer:
          "Da. Mobilierul lavoar cu mașina de spălat de 1,4 m pune mașina sub același blat cu lavoarul, cu un dulap deasupra ei. Mașina nu este inclusă; lăsăm locul exact pentru a ta.",
      },
    ],
    materials: [PAL, HARDWARE, MDF_MELAMINE, BOARDS],
  },
  copii: {
    h1: "Mobilă pentru camera copilului la comandă",
    title: "Mobilă pentru camera copilului la comandă | Epic Mob",
    description:
      "Dulapuri cu bară la îndemâna copiilor, comode, noptiere, biblioteci joase cu sertare de jucării și biblioteci cu cuburi, făcute pe măsură din PAL de 18 mm, cu închidere lină Blum. Montaj inclus.",
    eyebrow: "Magazin · Camera copilului",
    intro: [
      "Camera copilului se schimbă repede: azi are nevoie de loc pentru jucării, peste câțiva ani pentru cărți și haine de școală. Modelele de aici țin pasul: dulapuri cu bară dublă la înălțimea celor mici, biblioteci joase cu sertare de jucării la bază, biblioteci cu cuburi pentru cutii și coșuri, comode și noptiere.",
      "Le facem în atelierul nostru din PAL melaminat de 18 mm de la Egger sau Kastamonu. Suprafața melaminată rezistă la zgârieturi și se șterge ușor de carioci și amprente, iar balamalele și glisierele Blum frânează ușile și sertarele în ultimii centimetri, așa că nu se trântesc.",
      `Montajul este inclus în preț, termenul este ${DELIVERY}, iar garanția este de 5 ani. Culorile merg de la alb curat la decoruri calde de lemn; dacă vrei altă combinație sau altă înălțime, schimbi modelul în Atelierul 3D.`,
    ],
    faq: [
      {
        question: "Ce mobilă e potrivită pentru o cameră de copil mică?",
        answer:
          "Dulapurile înguste (0,9 m sau 1,5 m), biblioteca joasă de 1,2 m și etajera suspendată ocupă puțin loc pe podea. Biblioteca cu cuburi poate sta la perete sau între două zone, de exemplu între pat și birou.",
      },
      {
        question: "Se curăță ușor mobila din camera copilului?",
        answer:
          "Da. Plăcile sunt melaminate: suprafața e rezistentă la zgârieturi și se șterge cu o cârpă umedă. Numele culorilor, de exemplu „Stejar natur”, sunt decoruri, nu lemn masiv.",
      },
      {
        question: "Pot comanda dulapul, comoda și biblioteca în aceeași culoare?",
        answer:
          "Da. Piesele din magazin folosesc aceleași combinații de decoruri, așa că alegi aceeași culoare la fiecare. Le livrăm și le montăm odată, dacă le comanzi împreună.",
      },
    ],
    materials: [PAL, HARDWARE, BOARDS, MDF_PAINTED],
  },
  birou: {
    h1: "Mobilier de birou la comandă",
    title: "Mobilier de birou la comandă: dulapuri de acte, biblioteci | Epic Mob",
    description:
      "Dulapuri pentru acte și bibliorafturi, comode la înălțimea biroului, biblioteci și corpuri suspendate cu uși care se ridică, făcute pe măsură din PAL de 18 mm cu feronerie Blum. Montaj inclus.",
    eyebrow: "Magazin · Birou",
    intro: [
      "Un birou acasă sau la firmă are nevoie de ordine: dosare la îndemână, imprimanta ascunsă, cărțile la vedere. Aici găsești dulapul pentru acte cu polițe pentru bibliorafturi, comoda de birou la înălțimea mesei, biblioteci deschise sau cu uși jos și corpuri suspendate cu uși care se ridică, deasupra biroului.",
      "Toate se fac în atelierul nostru din PAL melaminat de 18 mm, Egger sau Kastamonu, cu cant ABS pe toate muchiile. Polițele de 18 mm duc greutatea dosarelor, sertarele merg pe glisiere Blum TANDEM, iar ușile Aventos rămân sus pe pistoane cu gaz cât lucrezi.",
      `Montajul este inclus, ${DELIVERY}, garanție 5 ani. Pentru un birou întreg, cu masă și mai multe corpuri pe același perete, pornești de la un model și îl potrivești în Atelierul 3D sau ne ceri o ofertă.`,
    ],
    faq: [
      {
        question: "Încap bibliorafturile în dulapul de acte?",
        answer:
          "Da. Dulapul de birou pentru acte are 40 cm adâncime și polițe gândite pentru bibliorafturi și dosare, închise în spatele a două uși.",
      },
      {
        question: "Faceți și masă de birou?",
        answer:
          "În magazin avem corpurile din jurul biroului: comodă, dulap de acte, biblioteci și corpuri suspendate. Pentru un birou cu masă pe măsură, cere o ofertă sau pornește un proiect în Atelierul 3D.",
      },
      {
        question: "Ce sunt ușile Aventos?",
        answer:
          "Aventos este sistemul Blum pentru uși care se ridică: ușa se deschide în sus și rămâne acolo singură, pe pistoane cu gaz. E comod deasupra biroului, unde o ușă batantă te-ar lovi în cap.",
      },
    ],
    materials: [PAL, HARDWARE, HANDLES],
  },
};

const CATEGORY_COPY: Record<ShopCategory, Copy> = {
  dulapuri: {
    h1: "Dulapuri și dressinguri la comandă",
    title: "Dulapuri și dressinguri la comandă, pe măsură | Epic Mob",
    description:
      "Dulapuri și dressinguri cu uși glisante, batante, cu oglindă sau sticlă, de la 0,8 la 3,6 m, făcute pe măsură din PAL Egger de 18 mm cu feronerie Blum. Preț pe loc, montaj inclus, garanție 5 ani.",
    eyebrow: "Magazin · Dulapuri și dressinguri",
    intro: [
      "De la dulapul îngust de 0,9 m care încape după ușă până la dressingul de 3,6 m pe tot peretele, aici sunt toate dulapurile noastre: cu uși glisante, batante, cu oglindă sau cu sticlă lăcuită, dressinguri deschise pentru o cameră de haine, dulapuri până în tavan cu loc pentru valize, dar și dulapuri de hol, de cămară sau pentru acte.",
      "Interiorul este gândit pentru folosire zilnică: bare pentru haine lungi și scurte, polițe, sertare pe glisiere Blum TANDEM cu închidere lină. Corpul este din PAL melaminat de 18 mm de la Egger sau Kastamonu, cu cant ABS pe toate muchiile și spate din HDF alb, iar ușile batante au balamale Blum CLIP top BLUMOTION.",
      `Fiecare dulap se vinde în mai multe lățimi și combinații de culori, cu montaj inclus și ${DELIVERY}. Ai garanție 5 ani. Dacă vrei alt interior sau altă înălțime, deschizi dulapul în Atelierul 3D și îl schimbi până arată cum vrei.`,
    ],
    faq: [
      {
        question: "Ce adâncime trebuie să aibă un dulap de haine?",
        answer:
          "Pentru umerașe puse drept, 55–60 cm; așa sunt dulapurile de dormitor din magazin. Dulapurile de hol au 45 cm, iar cele pentru acte sau cuierul deschis 40 cm. Adâncimea exactă e pe pagina fiecărui model.",
      },
      {
        question: "Ce sunt dulapurile cu uși glisante cu oglindă?",
        answer:
          "Ușile glisante alunecă pe șine sus și jos și nu cer loc în fața dulapului. Cu oglindă pe toată ușa, camera pare mai mare și ai oglindă de corp întreg. Ușile cu oglindă le facem cu corpul alb.",
      },
      {
        question: "Pot schimba interiorul dulapului?",
        answer:
          "Da. În Atelierul 3D alegi pentru fiecare compartiment bară, bară dublă, polițe sau sertare, schimbi lățimea, înălțimea și ușile, iar prețul se recalculează pe loc.",
      },
      {
        question: "Dulapul ajunge până în tavan?",
        answer:
          "Dulapul până în tavan are 2,8 m și uși pe două rânduri, cu depozitare sus pentru valize. Dacă tavanul tău e mai jos sau mai sus, potrivești înălțimea în Atelierul 3D.",
      },
    ],
    materials: [PAL, HARDWARE, HANDLES, BOARDS],
  },
  comode: {
    h1: "Comode și noptiere la comandă",
    title: "Comode, noptiere, comode TV și pantofare la comandă | Epic Mob",
    description:
      "Comode cu sertare, noptiere, comode TV, bufete și pantofare, făcute pe măsură în atelierul Epic Mob din PAL de 18 mm, cu sertare Blum TANDEM cu închidere lină. Montaj inclus, garanție 5 ani.",
    eyebrow: "Magazin · Comode și noptiere",
    intro: [
      "Comodele sunt piesele care se mută cel mai ușor dintr-o cameră în alta, așa că aici le găsești pe toate: comoda clasică de dormitor cu șase sertare, comoda înaltă și îngustă, noptiere cu sertare sau deschise, comode TV joase, bufete pentru sufragerie, un bufet de cafea pentru bucătărie și pantofare pentru hol.",
      "La o comodă contează sertarele, așa că folosim glisiere Blum TANDEM BLUMOTION care duc 30 kg, se trag până la capăt și se închid singure, încet. Corpul este din PAL melaminat de 18 mm, Egger sau Kastamonu, pe picioare, cu cant ABS pe toate muchiile.",
      `Prețul afișat include montajul. După ce confirmăm comanda la telefon, urmează ${DELIVERY}, cu garanție 5 ani. Dacă vrei mai multe sertare, o nișă deschisă sau alte mânere, schimbi comoda în Atelierul 3D.`,
    ],
    faq: [
      {
        question: "Cât de mult duc sertarele?",
        answer:
          "Sertarele merg pe glisiere Blum TANDEM BLUMOTION de 30 kg, cu extracție completă (parțială la cerere) și închidere lină, deci pot ține lenjerie, haine sau dosare grele.",
      },
      {
        question: "Ce înălțime are o noptieră?",
        answer:
          "Noptiera cu două sertare are 50 cm, iar cea deschisă 55 cm, aproape de înălțimea saltelei la un pat obișnuit. Dacă patul tău e mai înalt, potrivești noptiera în Atelierul 3D.",
      },
      {
        question: "Ce comodă se potrivește pe un hol îngust?",
        answer:
          "Pantofarul înalt are doar 30 cm adâncime și cinci rânduri pentru încălțăminte; pantofarul de 1,2 m are 35 cm, cu uși și polițe. Amândouă lasă loc de trecere.",
      },
    ],
    materials: [PAL, HARDWARE, HANDLES],
  },
  biblioteci: {
    h1: "Biblioteci și separatoare la comandă",
    title: "Biblioteci și separatoare de cameră la comandă | Epic Mob",
    description:
      "Biblioteci deschise pe ambele fețe, separatoare până în tavan sau la înălțimea canapelei, biblioteci cu cuburi și cu sertare, făcute pe măsură din PAL de 18 mm. Montaj inclus, garanție 5 ani.",
    eyebrow: "Magazin · Biblioteci și separatoare",
    intro: [
      "Un raft bine pus împarte o cameră mare în două zone fără să ridice un perete. Bibliotecile și separatoarele de aici sunt deschise pe ambele fețe, așa că lumina trece prin ele, și merg de la coloana îngustă de 0,9 m de lângă intrare până la separatorul lat de 2,4 m care urcă până în tavan.",
      "Unele au sertare sau uși jos, ca să ascunzi ce nu vrei la vedere, altele, ca biblioteca cu 16 cuburi, sunt făcute pentru coșuri și cutii. Le construim în atelierul nostru din PAL melaminat de 18 mm de la Egger sau Kastamonu, cu cant ABS pe toate muchiile; la sertare folosim glisiere Blum TANDEM cu închidere lină.",
      `Montajul este inclus în preț: aducem piesele, le asamblăm și le aliniem la locul lor. Urmează ${DELIVERY}, cu garanție 5 ani. Pentru altă împărțire a rafturilor, deschizi modelul în Atelierul 3D.`,
    ],
    faq: [
      {
        question: "Separatorul se vede frumos din ambele părți?",
        answer:
          "Da. Bibliotecile separator sunt deschise pe ambele fețe și au cant pe toate muchiile, așa că arată la fel din living și din camera alăturată.",
      },
      {
        question: "Ce înălțime aleg pentru un separator?",
        answer:
          "Separatorul scund de 1,2 m stă la înălțimea canapelei și lasă camera aerisită; cel de 2,2 m cu uși jos delimitează mai clar, iar cel de 2,6 m urcă până în tavan, ca un perete de rafturi.",
      },
      {
        question: "Ce greutate țin polițele?",
        answer:
          "Polițele sunt din PAL de 18 mm și țin cărți obișnuite pe toată lungimea lor. Pentru colecții foarte grele (enciclopedii, albume mari) alege compartimente mai înguste, ca biblioteca cu cuburi.",
      },
    ],
    materials: [PAL, HARDWARE, BOARDS],
  },
  suspendate: {
    h1: "Corpuri suspendate la comandă",
    title: "Corpuri suspendate la comandă: TV, etajere, dulăpioare | Epic Mob",
    description:
      "Corpuri TV suspendate, etajere, dulăpioare de perete, corpuri peste pat și corpuri cu uși Aventos care se ridică, făcute pe măsură din PAL de 18 mm, prinse pe suporți ascunși. Montaj inclus.",
    eyebrow: "Magazin · Corpuri suspendate",
    intro: [
      "Corpurile suspendate folosesc peretele de deasupra a ceva: a biroului, a patului, a blatului de bucătărie, a mașinii de spălat. Aici găsești corpuri TV care plutesc sub televizor, etajere deschise pentru cărți, dulăpioare de baie puțin adânci, corpuri peste pat pentru lenjerie și corpuri cu uși care se ridică.",
      "Le prindem de perete pe suporți ascunși, așa că sub ele podeaua rămâne liberă. Corpul este din PAL melaminat de 18 mm (Egger sau Kastamonu), ușile batante au balamale Blum cu închidere lină, iar ușile Aventos se ridică și stau sus pe pistoane cu gaz.",
      `Montajul este inclus, iar fixarea pe perete o facem noi. Spune-ne din ce e peretele (zidărie, beton sau rigips), ca să venim cu prinderile potrivite. Termenul este ${DELIVERY}, cu garanție 5 ani.`,
    ],
    faq: [
      {
        question: "Pe ce fel de perete se poate monta un corp suspendat?",
        answer:
          "Pe zidărie și beton se prinde direct. Pe rigips se poate în multe cazuri, cu prinderi speciale sau pe structura din spate; spune-ne dinainte ce perete ai, ca să venim pregătiți.",
      },
      {
        question: "Ce sunt corpurile cu uși Aventos?",
        answer:
          "Ușile Aventos (sistem Blum) se deschid în sus și rămân deschise singure, pe pistoane cu gaz. Sunt comode deasupra biroului sau a patului, unde o ușă batantă ar încurca.",
      },
      {
        question: "Ce adâncime are un corp TV suspendat?",
        answer:
          "Corpurile TV suspendate au 40 cm adâncime și 35 cm înălțime, de 1,8 sau 2,4 m lungime. Etajera are doar 25 cm adâncime, cât pentru cărți și decorațiuni.",
      },
    ],
    materials: [PAL, HARDWARE, LIGHTING],
  },
  bucatarii: {
    h1: "Bucătării la comandă",
    title: "Bucătării la comandă pe un perete sau în L, cu preț pe loc | Epic Mob",
    description:
      "Bucătării pe un perete sau în L, de la 1,8 la 3,8 m, cu blat Egger de 38 mm, sertare Blum și loc pentru electrocasnicele tale. Făcute pe măsură în atelier, montaj inclus, garanție 5 ani.",
    eyebrow: "Magazin · Bucătării",
    intro: [
      "Bucătăriile din magazin sunt gata gândite pe module: compactă de 1,8 m pentru garsonieră, pe un perete de 2,4–3 m, cu frigider și cuptor în coloane înalte de 3,8 m sau în L, cu corp de colț. Fiecare are corpuri jos, sub blat, și dulapuri sus; unele au rafturi deschise sau uși care se ridică.",
      "Corpurile sunt din PAL melaminat de 18 mm, Egger sau Kastamonu, pe picioare reglabile cu plintă. Blatul Egger de 38 mm are muchia în același decor și îl decupăm pentru chiuvetă și plită. Sertarele de sub plită duc 30 kg pe glisiere Blum TANDEM, iar ușile se închid lin pe balamale Blum CLIP top BLUMOTION.",
      `Electrocasnicele și chiuveta nu sunt incluse; lăsăm loc exact pentru ale tale. Montajul este inclus, termenul este ${DELIVERY}, garanția 5 ani. Dacă bucătăria ta are alte cote, o refaci pe măsură în Atelierul 3D, cu prețul la vedere.`,
    ],
    faq: [
      {
        question: "Sunt incluse electrocasnicele?",
        answer:
          "Nu. Fiecare bucătărie are locurile pregătite pentru cuptor, plită, mașină de vase și, la unele modele, frigider încorporabil. Ne spui modelele tale și potrivim golurile după ele.",
      },
      {
        question: "Bucătărie pe un perete sau în L?",
        answer:
          "Pe un perete e varianta potrivită pentru bucătării înguste sau deschise spre living. În L câștigi blat de lucru și un corp de colț, cu chiuveta pe un perete și plita pe celălalt.",
      },
      {
        question: "Ce înălțime au bucătăriile?",
        answer:
          "Bucătăriile din magazin au 2,2 m înălțime până sus, iar două dintre ele 2,3 m; blatul are 60 cm adâncime. În Atelierul 3D poți schimba lungimea și modulele.",
      },
      {
        question: "Veniți să măsurați bucătăria?",
        answer:
          "Da, dacă vrei venim gratuit să verificăm măsurile înainte de producție, ca golurile pentru electrocasnice și decupajele din blat să iasă exact.",
      },
    ],
    materials: [PAL, MDF_PAINTED, HARDWARE, LIGHTING],
  },
  baie: {
    h1: "Mobilier baie la comandă",
    title: "Mobilier baie la comandă: lavoar, dulap oglindă, coloană | Epic Mob",
    description:
      "Mobilier lavoar suspendat sau pe picioare, de la 50 cm la lavoar dublu de 1,4 m, cu dulap oglindă, coloană pentru prosoape și nișă pentru mașina de spălat. Pe măsură, montaj inclus, garanție 5 ani.",
    eyebrow: "Magazin · Mobilier baie",
    intro: [
      "Fiecare model de mobilier de baie de aici este un ansamblu întreg: corpul de lavoar cu sertare, dulapul cu oglindă deasupra și, la cele mai mari, o coloană pentru prosoape, un corp cu sertare sau nișa pentru mașina de spălat sub același blat. Lățimile merg de la 50 cm la 1,4 m, cu lavoar simplu sau dublu.",
      "Corpurile sunt din PAL melaminat de 18 mm de la Egger sau Kastamonu, cu cant ABS pe toate muchiile, iar blatul de 38 mm îl decupăm pentru lavoarul ales de tine. Sertarele merg pe glisiere Blum TANDEM cu închidere lină, iar ușile dulapului cu oglindă pe balamale Blum.",
      `Lavoarul, bateria și mașina de spălat nu sunt incluse, ca să le alegi tu. Montajul este inclus, urmează ${DELIVERY}, cu garanție 5 ani. Dacă nișa din baie are altă lățime, alegi una dintre lățimile de pe pagina produsului sau desenezi mobilierul în Atelierul 3D.`,
    ],
    faq: [
      {
        question: "Ce lățime de mobilier încape într-o baie mică?",
        answer:
          "Pentru o baie foarte mică ai mobilierul lavoar de 50 cm, cu 40 cm adâncime, iar pentru una mică pe cel de 60 cm. Ambele vin cu dulap cu oglindă deasupra.",
      },
      {
        question: "Mobilierul de baie vine cu oglindă?",
        answer:
          "Da. Toate ansamblurile au dulap cu uși oglindă deasupra lavoarului; la lavoarul dublu, fiecare lavoar are dulapul lui.",
      },
      {
        question: "Montați și lavoarul?",
        answer:
          "Montăm mobilierul și decupăm blatul pentru lavoarul tău. Lavoarul și bateria nu sunt incluse; ne spui modelul înainte de producție, ca decupajul să se potrivească.",
      },
    ],
    materials: [PAL, MDF_MELAMINE, HARDWARE],
  },
};

const ROOMS = Object.keys(ROOM_LABELS) as ShopRoom[];

export const ROOM_LANDINGS: ShopLanding[] = ROOMS.map((room) => ({
  kind: "camera",
  key: room,
  slug: ROOM_SLUGS[room],
  path: roomPath(room),
  name: ROOM_LABELS[room],
  ...ROOM_COPY[room],
}));

export const CATEGORY_LANDINGS: ShopLanding[] = SHOP_CATEGORIES.map((c) => ({
  kind: "categorie",
  key: c.id,
  slug: CATEGORY_SLUGS[c.id],
  path: categoryPath(c.id),
  name: c.label,
  ...CATEGORY_COPY[c.id],
}));

/** Whether a product belongs on a landing page. */
export function onLanding(landing: Pick<ShopLanding, "kind" | "key">, p: Pick<ShopProduct, "rooms" | "category">): boolean {
  return landing.kind === "camera" ? p.rooms.includes(landing.key as ShopRoom) : p.category === landing.key;
}

/** The catalog products of a landing page (before the CRM says which ones it can build and price). */
export const landingProducts = (landing: ShopLanding): ShopProduct[] => SHOP_PRODUCTS.filter((p) => onLanding(landing, p));

/** Landing pages that are built at all: the ones with enough products in the catalog. */
export const roomLandings = (): ShopLanding[] => ROOM_LANDINGS.filter((l) => landingProducts(l).length >= MIN_LANDING_PRODUCTS);
export const categoryLandings = (): ShopLanding[] => CATEGORY_LANDINGS.filter((l) => landingProducts(l).length >= MIN_LANDING_PRODUCTS);

export const roomLandingBySlug = (slug: string) => roomLandings().find((l) => l.slug === slug);
export const categoryLandingBySlug = (slug: string) => categoryLandings().find((l) => l.slug === slug);

/** The landing page of a category, if it is built (product page breadcrumbs). */
export const categoryLandingOf = (category: ShopCategory) => categoryLandings().find((l) => l.key === category);
export const roomLandingOf = (room: ShopRoom) => roomLandings().find((l) => l.key === room);

/** A picture for link previews (Open Graph): the first product of the page that has one. */
export function landingImage(landing: ShopLanding): string | null {
  for (const p of landingProducts(landing)) {
    const src = pictureOf(p.slug, p.paletteIds[0]);
    if (src) return src;
  }
  return null;
}
