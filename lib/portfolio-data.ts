export type ProjectCategory = "bucatarie" | "dressing" | "baie" | "detaliu";

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
};

export type PortfolioChapter = {
  id: "bucatarii" | "dressinguri" | "detalii";
  number: string;
  title: string;
  description: string;
  projects: PortfolioProject[];
};

export const portfolioStats = {
  totalProjects: 84,
  yearsInOperation: 7,
  blumPercentage: 100,
  averageDeliveryWeeks: 9,
};

export const portfolioChapters: PortfolioChapter[] = [
  {
    id: "bucatarii",
    number: "01",
    title: "Bucatarii care <em>tin casa</em>.",
    description:
      "Patru proiecte unde bucataria a devenit punctul de greutate al locuintei. Fiecare cu o decizie incomoda care a schimbat directia.",
    projects: [
      {
        slug: "kensington-navy",
        index: 1,
        category: "bucatarie",
        badge: "Bucatarie · 2025",
        title: "Kensington <em>navy.</em>",
        lede: "Bucatarie cu front sculptat in MDF vopsit, profilatura clasica si insula in stil englez, predata in 9 saptamani.",
        body: "Familia voia sa pastreze structura veche a apartamentului — calorifere de fonta, pardoseala originala — dar avea nevoie de o bucatarie functionala pentru gatit zilnic. Am pus accentul pe profilatura clasica si <em>manere de alama</em> turnate manual, dar am ascuns electrocasnicele intr-o coloana de servire si am dublat capacitatea de stocare cu un dulap mascat in coridor.",
        specs: [
          { label: "Material", value: "MDF vopsit RAL custom" },
          { label: "Feronerie", value: "Blum Movento + Aventos" },
          { label: "Suprafata", value: "14 m² + insula 2.4m" },
          { label: "Predat", value: "Septembrie 2025" },
        ],
        image: {
          src: "/portfolio/kitchen-ornate-navy-full.jpg",
          alt: "Bucatarie Kensington navy cu front sculptat si insula",
        },
      },
      {
        slug: "olivia-complet-alb",
        index: 2,
        category: "bucatarie",
        badge: "Bucatarie · 2025",
        title: "Olivia, <em>complet alb.</em>",
        lede: "Bucatarie L cu fronturi infoliate mate, blat porcelanat si iluminare cu senzor pe toate corpurile superioare.",
        body: "Brief simplu pe hartie, complicat pe santier: clientul voia <em>linii curate, fara manere</em>, dar pastra o nisa de instalatii care iesea 11cm in spatele frigiderului. Am proiectat un corp tehnic mascat, am compensat 11cm prin grosimea blatului si am rezolvat ventilatia hotei cu canal lateral. Vizual, pare ca toate corpurile sunt egale.",
        specs: [
          { label: "Material", value: "MDF infoliat mat" },
          { label: "Blat", value: "Porcelanat 12mm" },
          { label: "Iluminare", value: "Senzor + RGB cald" },
          { label: "Predat", value: "Iunie 2025" },
        ],
        image: {
          src: "/portfolio/kitchen-white-modern.jpg",
          alt: "Bucatarie Olivia in alb cu blat porcelanat si linii curate",
        },
      },
      {
        slug: "vatra-luminoasa",
        index: 3,
        category: "bucatarie",
        badge: "Bucatarie · 2024",
        title: "Vatra <em>Luminoasa.</em>",
        lede: "Open-space cu bucatarie + zona de masa, integrare a unei sobe de teracota originale din 1962.",
        body: "Apartamentul avea o soba de teracota pe care familia nu voia sa o piarda. Am desenat bucataria <em>in jurul ei</em>, nu impotriva ei: corpurile inalte se opresc cu 40cm inainte de soba, iar materialul a fost ales sa raspunda la albul-bej al teracotei vechi. Sertarele Blum suporta greutatea unui set de tigai de fonta fara sa cedeze.",
        specs: [
          { label: "Material", value: "MDF vopsit + PAL" },
          { label: "Pastrat", value: "Soba teracota 1962" },
          { label: "Suprafata", value: "22 m² open-space" },
          { label: "Predat", value: "Noiembrie 2024" },
        ],
        image: {
          src: "/portfolio/kitchen-ornate-navy-overview.jpg",
          alt: "Open-space Vatra Luminoasa cu soba de teracota integrata",
        },
      },
      {
        slug: "aviatorilor-navy-alama",
        index: 4,
        category: "bucatarie",
        badge: "Bucatarie · 2024",
        title: "Aviatorilor, <em>navy &amp; alama.</em>",
        lede: "Bucatarie cu zona de chiuveta in nisa, masca pentru hota integrata si dulapuri de coltar inalte.",
        body: "Caracteristic acestui proiect: <em>nu am vandut clientului niciun corp inutil</em>. Am respins doua dulapuri din primul randament si am redesenat zona de gatit ca sa ramana spatiu pentru o masa de servire de 4 persoane. Manerele de alama au fost recuperate de la un proiect anterior si refinisate manual.",
        specs: [
          { label: "Material", value: "MDF vopsit navy" },
          { label: "Manere", value: "Alama refinisata" },
          { label: "Suprafata", value: "11 m²" },
          { label: "Predat", value: "Mai 2024" },
        ],
        image: {
          src: "/portfolio/kitchen-navy-sink-wide.jpg",
          alt: "Bucatarie Aviatorilor cu chiuveta in nisa si manere de alama",
        },
      },
    ],
  },
  {
    id: "dressinguri",
    number: "02",
    title: "Dressinguri si <em>spatii de stocare</em>.",
    description:
      "Cand totul trebuie sa incapa fara sa para incarcat. Trei proiecte unde geometria a fost mai grea decat estetica.",
    projects: [
      {
        slug: "dressing-cu-oglinzi",
        index: 5,
        category: "dressing",
        badge: "Dressing · 2025",
        title: "Dressing <em>cu oglinzi.</em>",
        lede: "Dressing pe doua nivele intr-un dormitor de 3.6m, cu oglinda integrata pe usa centrala si iluminare LED pe sertare.",
        body: "Spatiul real era de 3.6m liniari, dar tavanul avea o grinda decorativa care intra 18cm in volum. Am oprit corpul exact sub grinda si am compensat cu un raft tehnic pe latura. Oglinda <em>pivotanta</em> permite vedere completa fara sa scoata clientul din volum.",
        specs: [
          { label: "Material", value: "PAL + MDF infoliat" },
          { label: "Oglinda", value: "Pivotanta cu balama-piano" },
          { label: "Suprafata", value: "3.6 m liniari" },
          { label: "Predat", value: "August 2025" },
        ],
        image: {
          src: "/portfolio/dressing-mirror-wardrobe.jpg",
          alt: "Dressing pe doua nivele cu oglinda pivotanta integrata",
        },
      },
      {
        slug: "coltar-de-colectionar",
        index: 6,
        category: "dressing",
        badge: "Dressing · 2024",
        title: "Coltar de <em>colectionar.</em>",
        lede: "Vitrine cu corpuri superioare in dressing-bibliotca pentru un colectionar de carti rare si obiecte de portelan.",
        body: "Brief atipic: clientul nu voia haine la vedere, ci <em>obiecte de colectie cu lumina punctuala</em>. Am livrat un coltar in trei volume: doua cu vitrine si LED nou pe fiecare polita, plus un nucleu inchis pentru haine. Sticla este antireflex, montata mecanic fara silicon vizibil.",
        specs: [
          { label: "Material", value: "MDF vopsit + sticla" },
          { label: "Iluminare", value: "LED 3000K, telecomanda" },
          { label: "Suprafata", value: "4.2 m liniari" },
          { label: "Predat", value: "Decembrie 2024" },
        ],
        image: {
          src: "/portfolio/kitchen-ornate-navy-shelves.jpg",
          alt: "Coltar de colectionar cu vitrine iluminate punctual",
        },
      },
    ],
  },
  {
    id: "detalii",
    number: "03",
    title: "Detalii care <em>fac diferenta</em>.",
    description:
      "Cantitati mici, decizii lungi. Ce tine timp dupa ce restul s-a uitat.",
    projects: [
      {
        slug: "maner-turnat-manual",
        index: 7,
        category: "detaliu",
        badge: "Detaliu · 2025",
        title: "Maner <em>turnat manual.</em>",
        lede: "Manere de alama brunata, turnate intr-un atelier din Brasov, finisate cu lac mat care nu ingalbeneste.",
        body: "Sapte luni de cautari dupa furnizorul potrivit. Mainile clientului sunt mainile care deschid cele mai des un corp — am refuzat doua finisaje care lasau urme dupa o saptamana. <em>Standardul nostru</em>: dupa 5 ani, sa fie la fel.",
        specs: [
          { label: "Material", value: "Alama 70% + zinc" },
          { label: "Furnizor", value: "Atelier Brasov" },
          { label: "Finisaj", value: "Lac mat anti-amprenta" },
          { label: "Stoc", value: "Permanent disponibil" },
        ],
        image: {
          src: "/portfolio/detail-gold-handle.jpg",
          alt: "Maner de alama turnat manual cu finisaj mat",
        },
      },
      {
        slug: "front-sculptat-mdf",
        index: 8,
        category: "detaliu",
        badge: "Detaliu · 2024",
        title: "Front <em>sculptat MDF.</em>",
        lede: "Profilatura cu trei nivele si lambriu in MDF vopsit RAL custom, executata pe CNC-ul atelierului.",
        body: "Profilatura clasica are doua probleme reale: <em>se sparge la montaj</em> si se ingalbeneste la 4-5 ani. Solutia noastra: vopsire in trei pasi cu grunduire intre, astfel incat lemnul nu mai respira pigmentul. Frontul a stat 18 luni la atelier ca proba, fara modificari de culoare.",
        specs: [
          { label: "Material", value: "MDF 19mm" },
          { label: "Vopsea", value: "RAL custom 3-pas" },
          { label: "Productie", value: "CNC propriu" },
          { label: "Garantie", value: "10 ani fara ingalbenire" },
        ],
        image: {
          src: "/portfolio/kitchen-ornate-cabinets-close.jpg",
          alt: "Front sculptat in MDF cu profilatura clasica vopsita",
        },
      },
      {
        slug: "chiuveta-integrata",
        index: 9,
        category: "detaliu",
        badge: "Detaliu · 2024",
        title: "Chiuveta <em>integrata.</em>",
        lede: "Chiuveta din inox masiv montata sub blat porcelanat, cu sifon mascat si baterie cu pull-down.",
        body: "Punctul slab al unei bucatarii premium e <em>marginea chiuvetei</em>. Am livrat o solutie under-mount cu garnitura silicon de tip stomatologic — invizibila, nu prinde mizerie, suporta 80°C. Sifonul este redirectat lateral ca sa eliberam <em>20cm sub chiuveta</em> pentru un sertar de filtre.",
        specs: [
          { label: "Chiuveta", value: "Inox 18/10 masiv" },
          { label: "Blat", value: "Porcelanat 12mm" },
          { label: "Garnitura", value: "Silicon stomatologic" },
          { label: "Baterie", value: "Pull-down magnetic" },
        ],
        image: {
          src: "/portfolio/kitchen-navy-sink-detail.jpg",
          alt: "Chiuveta inox integrata sub blat porcelanat",
        },
      },
      {
        slug: "corpuri-cu-vitrina",
        index: 10,
        category: "detaliu",
        badge: "Detaliu · 2024",
        title: "Corpuri <em>cu vitrina.</em>",
        lede: "Corpuri superioare cu vitrine de sticla, lambriu lemn pe spate si LED frontal mascat in profil.",
        body: "Vitrinele clasice au o problema: <em>se vad cablurile LED</em>. Am profilat un canal de 4mm in marginea de sus a corpului, am ascuns LED-ul si am redirectat cablul prin balama. Lumea vede sticla, lemnul si obiectele, nu mecanismul.",
        specs: [
          { label: "Material", value: "MDF vopsit + furnir nuc" },
          { label: "Sticla", value: "Antireflex 6mm" },
          { label: "LED", value: "Mascat in canal 4mm" },
          { label: "Predat", value: "Februarie 2024" },
        ],
        image: {
          src: "/portfolio/kitchen-ornate-navy-upper.jpg",
          alt: "Corpuri superioare cu vitrina si LED mascat",
        },
      },
      {
        slug: "usa-clasica-refacuta",
        index: 11,
        category: "detaliu",
        badge: "Detaliu · 2023",
        title: "Usa <em>clasica refacuta.</em>",
        lede: "Recuperarea unei usi originale din 1934, cu maner decorativ refinisat si vopsire cu pigment sintetic.",
        body: "Clientul a vrut <em>sa nu cumpere o usa noua</em>. Am demontat usa, am detasat manerul, l-am trimis la cromare si am vopsit usa cu un pigment albastru-pruna care reproduce nuanta originala vazuta in fotografii alb-negru ale apartamentului. Usa a fost remontata in 14 zile.",
        specs: [
          { label: "Origine", value: "1934, recuperata" },
          { label: "Maner", value: "Cromat refinisat" },
          { label: "Vopsea", value: "Pigment sintetic" },
          { label: "Predat", value: "Octombrie 2023" },
        ],
        image: {
          src: "/portfolio/detail-blue-door-handle.jpg",
          alt: "Usa clasica din 1934 refacuta cu maner cromat",
        },
      },
    ],
  },
];
