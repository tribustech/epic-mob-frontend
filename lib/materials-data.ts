// Single source of truth for the material-comparison experience.
// Consumed by three surfaces: the home teaser (warm-materials), the /materiale
// hub (interactive switcher) and the /materiale/[slug] articles.
//
// Assets: two purpose-built renders per material live in /public/materials/.
//   <slug>-01.webp  → the "scene" (angled slab + a matching kitchen behind it)
//   <slug>-02.webp  → a macro of the corner (finish + exposed core) used as the
//                     backdrop for the animated structure diagram.
//
// `accent` is each material's signature colour. Layered over the warm theme it
// switches with the material so the eye *sees* the difference, not just reads it.

export type StructureLayer = {
  label: string;
  sub?: string;
  // Normalised anchor point on the detail (02) image, 0–1 in each axis. The
  // structure diagram draws an animated leader line from here to the label.
  anchor: { x: number; y: number };
};

export type MaterialProperty = {
  // lucide-react icon name, resolved by the diagram component.
  icon: string;
  label: string;
};

export type ArticleSection = {
  heading: string;
  body: string;
};

// "Unde se potrivește" — a fixed set of rooms/zones evaluated identically for
// every material, so the client can compare at a glance where a material shines
// and where it will fail. Verdicts and the "de ce" notes are grounded in
// manufacturer guidance (Egger/Kronospan moisture-resistant P3 cores, thermofoil
// heat-shield requirements) — see docs/plans for sources.
export type PlacementVerdict = "recomandat" | "atentie" | "evita";

export type PlacementZone = {
  key: string;
  label: string;
  icon: string; // lucide-react icon name, resolved by MaterialIcon
};

export const placementZones: PlacementZone[] = [
  { key: "kitchen", label: "Fronturi bucătărie", icon: "CookingPot" },
  { key: "stove", label: "Lângă aragaz / cuptor", icon: "Flame" },
  { key: "bath", label: "Baie / umezeală", icon: "ShowerHead" },
  { key: "sink", label: "Lângă chiuvetă", icon: "Droplets" },
  { key: "kids", label: "Cameră copii", icon: "Baby" },
  { key: "dry", label: "Living / dormitor", icon: "Sofa" },
];

export type PlacementRating = {
  verdict: PlacementVerdict;
  note?: string; // the "de ce" — required for atentie/evita, optional otherwise
};

export type Placement = Record<string, PlacementRating>;

export type Material = {
  slug: string;
  name: string;
  short: string; // pill / compact label
  tagline: string;
  accent: string;
  accentSoft: string; // translucent accent for washes/backgrounds
  onAccent: string; // legible text colour on top of the accent
  heroImage: string;
  detailImage: string;
  structure: StructureLayer[];
  properties: MaterialProperty[];
  pros: string[];
  cons: string[];
  goodFor: string[];
  placement: Placement;
  intro: string;
  article: ArticleSection[];
};

export const materials: Material[] = [
  {
    slug: "pal-melaminat",
    name: "PAL Melaminat",
    short: "PAL Melaminat",
    tagline: "Practic, rezistent și ușor de întreținut",
    accent: "#BE9B6B",
    accentSoft: "rgba(190, 155, 107, 0.16)",
    onAccent: "#2A2420",
    heroImage: "/materials/pal-01.webp",
    detailImage: "/materials/pal-02.webp",
    structure: [
      { label: "Melamină decorativă", sub: "rezistentă la uzură", anchor: { x: 0.46, y: 0.17 } },
      { label: "PAL", sub: "așchii de lemn presate", anchor: { x: 0.64, y: 0.54 } },
      { label: "Cant ABS", sub: "0.8 – 2 mm", anchor: { x: 0.15, y: 0.5 } },
    ],
    properties: [
      { icon: "ShieldCheck", label: "Rezistent la zgârieturi și abraziune" },
      { icon: "Sparkles", label: "Ușor de curățat" },
      { icon: "PiggyBank", label: "Raport calitate–preț excelent" },
      { icon: "Palette", label: "Gamă variată de decoruri" },
    ],
    pros: [
      "Cel mai bun raport calitate–preț",
      "Rezistent la zgârieturi, abraziune și uzură zilnică",
      "Gamă foarte largă de decoruri și texturi lemnoase",
      "Ușor de curățat și de întreținut",
    ],
    cons: [
      "Muchia se acoperă cu cant, nu se poate profila",
      "Nu permite frezări sau forme curbe pe suprafață",
      "Miezul e sensibil la apă dacă muchia rămâne neprotejată",
    ],
    goodFor: [
      "Corpuri de bucătărie și blaturi de lucru",
      "Dressinguri și dulapuri încăpătoare",
      "Mobilier de birou și camere pentru copii",
    ],
    placement: {
      kitchen: { verdict: "recomandat" },
      stove: {
        verdict: "atentie",
        note: "Fața melaminică suportă bine căldura, dar cantul de lângă cuptor trebuie protejat.",
      },
      bath: {
        verdict: "atentie",
        note: "Miezul din așchii se umflă de la umezeală — doar cu miez hidrofug (P3) și canturi bine sigilate.",
      },
      sink: {
        verdict: "atentie",
        note: "Apa pătrunsă la un cant ciobit umflă miezul cel mai repede dintre toate — cantul trebuie intact.",
      },
      kids: { verdict: "recomandat", note: "Suprafață dură, se șterge ușor și rezistă la zgârieturi." },
      dry: { verdict: "recomandat" },
    },
    intro:
      "PAL melaminat este alegerea de bază pentru mobila la comandă: un miez din așchii de lemn presate, acoperit cu o folie melaminică decorativă dură. Practic, echilibrat ca preț și disponibil în sute de decoruri — de la stejar natural la culori uni mate.",
    article: [
      {
        heading: "Din ce e făcut",
        body: "Miezul este PAL — plăci din așchii de lemn presate cu rășini. Peste el se aplică melamina decorativă, un strat dur rezistent la zgârieturi. Muchiile se protejează cu cant ABS de 0.8–2 mm, aplicat cu adeziv sau laser pentru o linie fină, fără rost vizibil.",
      },
      {
        heading: "Când îl recomandăm",
        body: "Este materialul potrivit când vrei un rezultat solid, curat și fără compromisuri de durabilitate, la un buget echilibrat. Merge excelent pe corpuri drepte, dulapuri și dressinguri, unde suprafețele plane pun în valoare decorul.",
      },
      {
        heading: "La ce să fii atent",
        body: "PAL-ul nu se poate freza sau profila — muchia rămâne dreaptă, acoperită cu cant. Dacă îți dorești o muchie rotunjită dintr-o bucată sau fronturi cu relief, îți vom recomanda MDF înfoliat sau vopsit.",
      },
    ],
  },
  {
    slug: "mdf-melaminat",
    name: "MDF Melaminat",
    short: "MDF Melaminat",
    tagline: "Miez dens, suprafață netedă, muchii fine",
    accent: "#7C7F82",
    accentSoft: "rgba(124, 127, 130, 0.16)",
    onAccent: "#FBF8F3",
    heroImage: "/materials/mdf-melaminat-01.webp",
    detailImage: "/materials/mdf-melaminat-02.webp",
    structure: [
      { label: "Melamină decorativă", sub: "rezistentă la uzură", anchor: { x: 0.57, y: 0.25 } },
      { label: "MDF", sub: "fibră de lemn densă", anchor: { x: 0.71, y: 0.58 } },
      { label: "Cant ABS", sub: "0.8 – 2 mm", anchor: { x: 0.31, y: 0.53 } },
    ],
    properties: [
      { icon: "Layers", label: "Miez dens și omogen" },
      { icon: "Sparkles", label: "Suprafață netedă, ușor de curățat" },
      { icon: "ShieldCheck", label: "Muchii și găuriri mai precise" },
      { icon: "Palette", label: "Decoruri variate" },
    ],
    pros: [
      "Miez de fibră mai dens și mai omogen decât PAL",
      "Muchii și găuriri mai curate, fără spărturi",
      "Suprafață netedă cu finisaj melaminic dur",
      "Mai stabil pe piese înguste și rafturi lungi",
    ],
    cons: [
      "Mai scump decât PAL melaminat",
      "Tot muchie cu cant — fără profilări pe suprafață",
      "Mai greu, cere feronerie dimensionată corect",
    ],
    goodFor: [
      "Rafturi și polițe lungi care nu trebuie să se lase",
      "Corpuri cu multe găuriri și îmbinări precise",
      "Fronturi drepte unde vrei o muchie impecabilă",
    ],
    placement: {
      kitchen: { verdict: "recomandat" },
      stove: {
        verdict: "atentie",
        note: "Fața melaminică ține bine la căldură; protejăm cantul din apropierea cuptorului.",
      },
      bath: {
        verdict: "atentie",
        note: "Miez mai dens ca PAL-ul, dar cantul de MDF umezit se umflă — cu MDF hidrofug și canturi sigilate.",
      },
      sink: {
        verdict: "atentie",
        note: "Cantul trebuie sigilat perfect; odată udat, MDF-ul e greu de recuperat.",
      },
      kids: { verdict: "recomandat", note: "Suprafață netedă, durabilă, ușor de curățat." },
      dry: { verdict: "recomandat" },
    },
    intro:
      "MDF melaminat combină un miez de fibră de lemn dens și omogen cu aceeași folie melaminică decorativă. Rezultatul: suprafețe la fel de practice ca PAL, dar cu muchii mai fine, găuriri mai precise și o stabilitate mai bună pe piesele înguste.",
    article: [
      {
        heading: "Din ce e făcut",
        body: "Spre deosebire de PAL, miezul e din fibră de lemn de densitate medie (MDF), presată fin și uniform. Peste el se aplică aceeași melamină decorativă. Densitatea mai mare înseamnă margini mai curate și șuruburi care „prind” mai bine.",
      },
      {
        heading: "Când îl recomandăm",
        body: "Îl alegem când precizia contează: rafturi lungi care nu trebuie să se lase, corpuri cu multe îmbinări sau piese înguste unde PAL-ul ar risca să se ciobească pe muchie.",
      },
      {
        heading: "La ce să fii atent",
        body: "Este mai scump și mai greu decât PAL-ul, iar suprafața tot nu se poate profila — pentru relief sau muchii curbe rămân MDF înfoliat și MDF vopsit.",
      },
    ],
  },
  {
    slug: "mdf-infoliat",
    name: "MDF Înfoliat",
    short: "MDF Înfoliat",
    tagline: "Suprafață fină, catifelată și design versatil",
    accent: "#8A9A82",
    accentSoft: "rgba(138, 154, 130, 0.18)",
    onAccent: "#22271F",
    heroImage: "/materials/infoliat-01.webp",
    detailImage: "/materials/infoliat-02.webp",
    structure: [
      { label: "Folie PVC termoformată", sub: "învelește complet muchia", anchor: { x: 0.49, y: 0.22 } },
      { label: "MDF", sub: "fibră de lemn de densitate medie", anchor: { x: 0.71, y: 0.57 } },
      { label: "Muchie rotunjită", sub: "dintr-o singură bucată", anchor: { x: 0.35, y: 0.49 } },
    ],
    properties: [
      { icon: "Hand", label: "Suprafață catifelată, plăcută la atingere" },
      { icon: "Waves", label: "Permite frezări și profilări" },
      { icon: "Droplets", label: "Rezistent la umiditate și pete" },
      { icon: "Palette", label: "Multiple culori și finisaje" },
    ],
    pros: [
      "Muchie rotunjită dintr-o bucată, fără rost vizibil",
      "Permite fronturi cu frezare, relief și forme curbe",
      "Suprafață catifelată, mată sau lucioasă",
      "Folia termoformată învelește complet muchia",
    ],
    cons: [
      "Folia se poate desprinde la căldură directă prelungită",
      "Reparațiile locale sunt greu de mascat",
      "Nu se recolorează ulterior ca vopseaua",
    ],
    goodFor: [
      "Fronturi de bucătărie cu frezare clasică sau modernă",
      "Mobilier pentru dormitor și living cu linii moi",
      "Camere de copii — muchii rotunjite, ușor de șters",
    ],
    placement: {
      kitchen: { verdict: "recomandat", note: "Suprafață continuă, ușor de șters — departe de căldura directă." },
      stove: {
        verdict: "evita",
        note: "Căldura directă prelungită înmoaie adezivul și folia se desprinde; lângă cuptor e nevoie de bandă de protecție termică.",
      },
      bath: {
        verdict: "atentie",
        note: "Fața rezistă la apă, dar aburul se poate strecura sub folie la muchii și o poate desprinde.",
      },
      sink: {
        verdict: "atentie",
        note: "Aburul de la mașina de spălat vase e o zonă clasică de desprindere — merge doar cu panou/deflector de protecție.",
      },
      kids: { verdict: "recomandat", note: "Suprafață continuă, fără rosturi — foarte ușor de șters." },
      dry: { verdict: "recomandat" },
    },
    intro:
      "MDF înfoliat înseamnă un miez de MDF frezat în forma dorită, peste care se termoformează o folie PVC care învelește complet suprafața și muchia — dintr-o singură bucată, fără cant. Așa obții fronturi cu relief, muchii rotunjite și o suprafață catifelată.",
    article: [
      {
        heading: "Din ce e făcut",
        body: "Frontul e un MDF frezat pe CNC în profilul dorit. O folie PVC se încălzește și se presează în vid peste el, urmând fiecare curbă și învelind muchia complet. Nu există cant lipit — totul e o suprafață continuă.",
      },
      {
        heading: "Când îl recomandăm",
        body: "Este alegerea pentru fronturi cu caracter: frezări clasice, linii moi, muchii rotunjite. Rezistă bine la umiditate și pete, deci merge foarte bine în bucătărie și în camerele copiilor.",
      },
      {
        heading: "La ce să fii atent",
        body: "Folia nu iubește căldura directă și prelungită (ex. lângă un cuptor neizolat) — se poate desprinde în timp. Pentru zonele foarte solicitate termic sau pentru un finisaj complet reparabil, MDF vopsit este mai potrivit.",
      },
    ],
  },
  {
    slug: "mdf-vopsit",
    name: "MDF Vopsit",
    short: "MDF Vopsit",
    tagline: "Eleganță premium, finisaj impecabil",
    accent: "#3A3A3C",
    accentSoft: "rgba(58, 58, 60, 0.16)",
    onAccent: "#FBF8F3",
    heroImage: "/materials/vops-01.webp",
    detailImage: "/materials/vops-02.webp",
    structure: [
      { label: "Vopsea poliuretanică", sub: "de înaltă calitate", anchor: { x: 0.54, y: 0.15 } },
      { label: "Frezaj decorativ", sub: "modele frezate direct în placă", anchor: { x: 0.3, y: 0.22 } },
      { label: "MDF", sub: "fibră de lemn de densitate medie", anchor: { x: 0.71, y: 0.6 } },
    ],
    properties: [
      { icon: "Gem", label: "Aspect premium și elegant" },
      { icon: "Palette", label: "Culori personalizate la comandă" },
      { icon: "Sparkles", label: "Finisaj perfect uniform" },
      { icon: "Leaf", label: "Durabil și ușor de întreținut" },
    ],
    pros: [
      "Finisaj perfect uniform, fără rost și fără muchie vizibilă",
      "Orice culoare la comandă, mat, satinat sau lucios",
      "Permite frezări și forme complexe",
      "Se poate reface și recolora în timp",
    ],
    cons: [
      "Cel mai scump dintre finisaje",
      "Proces de execuție mai lung (grund + vopsire + uscare)",
      "Suprafețele foarte lucioase evidențiază amprentele",
    ],
    goodFor: [
      "Bucătării și mobilier de living premium",
      "Fronturi frezate sau cu linii arhitecturale",
      "Proiecte unde vrei o culoare exactă, la comandă",
    ],
    placement: {
      kitchen: { verdict: "recomandat" },
      stove: {
        verdict: "recomandat",
        note: "Cel mai bun dintre finisaje la căldură: lacul e o peliculă continuă, fără folie care să se desprindă.",
      },
      bath: {
        verdict: "recomandat",
        note: "Lacul poliuretanic sigilat rezistă bine la umezeală, cu toate fețele și canturile sigilate.",
      },
      sink: {
        verdict: "atentie",
        note: "Rezistă cât timp pelicula e intactă; un cant ciobit expune MDF-ul la apă.",
      },
      kids: {
        verdict: "atentie",
        note: "Cel mai ușor de retușat, dar lacul e mai moale decât melamina — se poate zgâria mai ușor.",
      },
      dry: { verdict: "recomandat" },
    },
    intro:
      "MDF vopsit este finisajul de top: un MDF frezat, grunduit și vopsit poliuretanic în mai multe straturi, șlefuit între ele. Rezultă o suprafață continuă, fără muchii vizibile, în exact culoarea și luciul pe care ți le dorești.",
    article: [
      {
        heading: "Din ce e făcut",
        body: "Frontul de MDF se frezează, se grunduiește pentru aderență, apoi se vopsește cu vopsea poliuretanică în straturi succesive, cu șlefuire între ele. Finisajul acoperă complet suprafața și muchiile, într-un singur ton uniform.",
      },
      {
        heading: "Când îl recomandăm",
        body: "Pentru proiectele unde aspectul e prioritatea: o culoare exactă la comandă, un mat catifelat sau un lucios profund, fronturi frezate cu linii arhitecturale. Este cel mai versatil estetic dintre toate.",
      },
      {
        heading: "La ce să fii atent",
        body: "Este cel mai scump și are cel mai lung timp de execuție, din cauza straturilor și uscării. În schimb, e singurul finisaj care se poate reface și recolora complet peste ani.",
      },
    ],
  },
];

export const materialSlugs = materials.map((m) => m.slug);

export function getMaterial(slug: string): Material | undefined {
  return materials.find((m) => m.slug === slug);
}
