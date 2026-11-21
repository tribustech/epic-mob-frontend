import type { AtelierCatalog, AtelierCategory, AtelierConfig } from "./types.ts";

/** Everything a preset fixes except the colours (those come from a palette). */
export type PresetShape = Omit<AtelierConfig, "carcassMaterialId" | "fronts">;

/**
 * A ready-made model the client starts from. Picking one replaces the shape of the
 * configuration (sizes, columns, doors, legs, handle, bottom) and keeps the colours.
 */
export interface LayoutPreset {
  id: string;
  category: AtelierCategory;
  /** short Romanian name, e.g. „Dressing clasic 2,4 m" */
  name: string;
  /** one line: who / what it is for */
  tagline: string;
  /** optional badge, e.g. „Cel mai ales" */
  badge?: string;
  shape: PresetShape;
  /** palette (lib/atelier/palettes.ts) that suits it best; used by the „combinații" */
  paletteId?: string;
}

/** A model + a colour combination, picked in one tap (the featured „combinații"). */
export interface ComboPreset {
  id: string;
  name: string;
  tagline: string;
  presetId: string;
  paletteId: string;
}

type Column = PresetShape["columns"][number];
const col = (widthMm: number, content: Column["content"], extra: Partial<Column> = {}): Column => ({
  widthMm,
  content,
  ...extra,
});

interface PresetInput {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  paletteId: string;
  /** width × height × depth, mm */
  size: [number, number, number];
  columns: Column[];
  doors?: PresetShape["doors"];
  legsMm?: PresetShape["legsMm"];
  bottom?: PresetShape["bottom"];
  handle?: PresetShape["handle"];
  kitchen?: PresetShape["kitchen"];
}

function make(category: AtelierCategory, p: PresetInput): LayoutPreset {
  const [widthMm, heightMm, depthMm] = p.size;
  const shape: PresetShape = {
    category,
    widthMm,
    heightMm,
    depthMm,
    columns: p.columns,
    legsMm: p.legsMm ?? (category === "SUSPENDAT" ? 0 : 100),
    doors: p.doors ?? { type: "NONE" },
  };
  if (p.bottom) shape.bottom = p.bottom;
  if (p.handle) shape.handle = p.handle;
  if (p.kitchen) shape.kitchen = p.kitchen;
  const preset: LayoutPreset = { id: p.id, category, name: p.name, tagline: p.tagline, shape, paletteId: p.paletteId };
  if (p.badge) preset.badge = p.badge;
  return preset;
}

/*
 * Every preset must price in the CRM without errors (scripts/check-atelier-presets.ts)
 * and respect lib/atelier/categories.ts (tests/atelier-presets.test.ts).
 * Owner rule: mirror doors go with a white body and cașmir fronts („alb-casmir").
 * A mirror on only some of the doors is written as the plain door type + `fills` (one face per sliding
 * door / per column with hinged doors); such presets are offered only when the CRM knows per-door faces
 * (presetAvailable).
 */

const DRESSING: PresetInput[] = [
  {
    id: "dressing-clasic-240",
    name: "Dressing clasic 2,4 m",
    tagline: "Două zone de umerașe și polițe la mijloc, cu uși glisante.",
    badge: "Cel mai ales",
    paletteId: "alb-stejar-natur",
    size: [2400, 2600, 600],
    columns: [col(800, "BARA"), col(800, "POLITE"), col(800, "BARA")],
    doors: { type: "GLISANTE" },
  },
  {
    id: "dressing-hol-120",
    name: "Dulap de hol 1,2 m",
    tagline: "Pentru geci și pantofi, cu uși batante și adâncime mică.",
    paletteId: "casmir-alb",
    size: [1200, 2400, 450],
    columns: [col(600, "POLITE_BARA", { shelves: 2 }), col(600, "POLITE")],
    doors: { type: "BATANTE" },
  },
  {
    id: "dressing-dormitor-180",
    name: "Dulap de dormitor 1,8 m",
    tagline: "Două uși glisante: o parte de umerașe, una de polițe.",
    paletteId: "alb-total",
    size: [1800, 2600, 600],
    columns: [col(900, "BARA"), col(900, "POLITE")],
    doors: { type: "GLISANTE", count: 2 },
  },
  {
    id: "dressing-oglinda-240",
    name: "Dressing cu oglindă 2,4 m",
    tagline: "Uși glisante cu oglindă, care măresc dormitorul.",
    badge: "Preferat la dormitor",
    paletteId: "alb-casmir",
    size: [2400, 2600, 600],
    columns: [col(800, "BARA_DUBLA"), col(800, "POLITE"), col(800, "BARA_SERTARE", { drawers: 2 })],
    doors: { type: "GLISANTE_OGLINDA" },
  },
  {
    id: "dressing-familie-300",
    name: "Dressing de familie 3 m",
    tagline: "Trei uși glisante: haine lungi, haine scurte, polițe și sertare.",
    paletteId: "stejar-casmir",
    size: [3000, 2600, 600],
    columns: [
      col(750, "BARA"),
      col(750, "POLITE_BARA", { railPosition: "JOS", shelves: 2 }),
      col(750, "POLITE"),
      col(750, "BARA_SERTARE", { drawers: 3 }),
    ],
    doors: { type: "GLISANTE", count: 3 },
  },
  {
    id: "dressing-mare-360",
    name: "Dressing pe tot peretele 3,6 m",
    tagline: "Patru zone pentru doi: umerașe, polițe, bară dublă și sertare.",
    paletteId: "gri-casmir",
    size: [3600, 2600, 600],
    columns: [col(900, "BARA"), col(900, "POLITE"), col(900, "BARA_DUBLA"), col(900, "BARA_SERTARE", { drawers: 3 })],
    doors: { type: "GLISANTE", count: 4 },
  },
  {
    id: "dressing-deschis-280",
    name: "Dressing deschis 2,8 m",
    tagline: "Fără uși, pentru o cameră de dressing: totul la vedere.",
    badge: "Nou",
    paletteId: "stejar-natur",
    size: [2800, 2400, 500],
    columns: [col(700, "BARA"), col(700, "POLITE"), col(700, "BARA_SERTARE", { drawers: 3 }), col(700, "BARA_DUBLA")],
    doors: { type: "NONE" },
  },
  {
    id: "dressing-sertare-200",
    name: "Dulap cu sertare 2 m",
    tagline: "Uși batante, umerașe la mijloc și trei sertare dedesubt.",
    paletteId: "antracit-stejar",
    size: [2000, 2500, 600],
    columns: [col(600, "POLITE"), col(800, "BARA_SERTARE", { drawers: 3, doorsAcross: 2 }), col(600, "POLITE")],
    doors: { type: "BATANTE" },
  },
  {
    id: "dressing-copii-150",
    name: "Dulap pentru copii 1,5 m",
    tagline: "Bară dublă la îndemâna celor mici și multe polițe.",
    paletteId: "denim-alb",
    size: [1500, 2200, 550],
    columns: [col(750, "BARA_DUBLA", { doorsAcross: 2 }), col(750, "POLITE", { doorsAcross: 2 })],
    doors: { type: "BATANTE" },
  },
  {
    id: "dressing-tavan-270",
    name: "Dulap până în tavan 2,7 m",
    tagline: "Uși batante pe două rânduri, cu depozitare sus pentru valize.",
    paletteId: "supermat-crem",
    size: [2700, 2800, 600],
    columns: [
      col(900, "BARA", { doorRows: 2, doorsAcross: 2 }),
      col(900, "POLITE_BARA", { doorRows: 2, doorsAcross: 2, shelves: 3 }),
      col(900, "POLITE", { doorRows: 2, doorsAcross: 2 }),
    ],
    doors: { type: "BATANTE" },
    handle: { type: "PUSH" },
  },
  {
    id: "dressing-hol-oglinda-160",
    name: "Dulap de hol cu oglindă 1,6 m",
    tagline: "Uși batante cu oglindă: te vezi din cap până în picioare la plecare.",
    paletteId: "alb-casmir",
    size: [1600, 2400, 450],
    columns: [col(800, "POLITE_BARA", { shelves: 2, doorsAcross: 2 }), col(800, "POLITE", { doorsAcross: 2 })],
    doors: { type: "BATANTE_OGLINDA" },
  },
  {
    id: "dressing-oglinda-una-180",
    name: "Dulap cu o ușă oglindă 1,8 m",
    tagline: "Două uși glisante: una cu oglindă, una în culoarea aleasă.",
    paletteId: "alb-casmir",
    size: [1800, 2500, 600],
    columns: [col(900, "BARA"), col(900, "POLITE")],
    doors: { type: "GLISANTE", count: 2, fills: ["OGLINDA", "PANOU"] },
  },
  {
    id: "dressing-oglinda-mijloc-240",
    name: "Dulap cu oglindă la mijloc 2,4 m",
    tagline: "Uși batante, cu oglindă doar pe cele două uși din mijloc.",
    paletteId: "alb-casmir",
    size: [2400, 2500, 600],
    columns: [col(800, "BARA", { doorsAcross: 2 }), col(800, "POLITE", { doorsAcross: 2 }), col(800, "BARA_SERTARE", { drawers: 2, doorsAcross: 2 })],
    doors: { type: "BATANTE", fills: ["PANOU", "OGLINDA", "PANOU"] },
  },
  {
    id: "dressing-oglinzi-300",
    name: "Dressing cu trei oglinzi 3 m",
    tagline: "Trei uși glisante, toate cu oglindă, de la un perete la altul.",
    paletteId: "alb-casmir",
    size: [3000, 2600, 600],
    columns: [col(750, "BARA"), col(750, "POLITE"), col(750, "POLITE_BARA", { shelves: 2 }), col(750, "BARA_DUBLA")],
    doors: { type: "GLISANTE_OGLINDA", count: 3 },
  },
  {
    id: "dressing-sticla-300",
    name: "Dressing cu sticlă 3 m",
    tagline: "Uși glisante din sticlă lăcuită, pentru un dormitor elegant.",
    paletteId: "grafit-total",
    size: [3000, 2600, 650],
    columns: [col(900, "BARA"), col(600, "POLITE"), col(600, "POLITE_BARA", { shelves: 2 }), col(900, "BARA_DUBLA")],
    doors: { type: "GLISANTE_STICLA", count: 3 },
  },
  {
    id: "dressing-ingust-90",
    name: "Dulap îngust 0,9 m",
    tagline: "Încape după ușă sau într-o nișă: bară sus, polițe jos.",
    paletteId: "alb-total",
    size: [900, 2400, 550],
    columns: [col(900, "POLITE_BARA", { shelves: 3, doorsAcross: 2 })],
    doors: { type: "BATANTE" },
  },
  {
    id: "dressing-3-usi-150",
    name: "Dulap cu 3 uși 1,5 m",
    tagline: "Dulapul clasic de dormitor: polițe într-o parte, umerașe pe două uși.",
    paletteId: "alb-total",
    size: [1500, 2100, 550],
    columns: [col(500, "POLITE"), col(500, "BARA"), col(500, "BARA")],
    doors: { type: "BATANTE" },
  },
  {
    id: "dressing-camara-90",
    name: "Dulap de cămară 0,9 m",
    tagline: "Polițe de sus până jos pentru provizii, cu uși pe două rânduri.",
    paletteId: "alb-total",
    size: [900, 2200, 500],
    columns: [col(450, "POLITE", { doorRows: 2 }), col(450, "POLITE", { doorRows: 2 })],
    doors: { type: "BATANTE" },
  },
  {
    id: "dressing-serviciu-80",
    name: "Dulap pentru aspirator și mături 0,8 m",
    tagline: "O parte înaltă pentru aspirator și masa de călcat, una cu polițe pentru detergenți.",
    paletteId: "alb-total",
    size: [800, 2200, 450],
    columns: [col(400, "BARA"), col(400, "POLITE")],
    doors: { type: "BATANTE" },
  },
  {
    id: "dressing-baie-60",
    name: "Coloană de baie 0,6 m",
    tagline: "Înaltă și puțin adâncă: prosoape sus, detergenți jos, în spatele a două uși.",
    paletteId: "alb-total",
    size: [600, 1900, 350],
    columns: [col(600, "POLITE", { doorRows: 2 })],
    doors: { type: "BATANTE" },
  },
  {
    id: "dressing-birou-100",
    name: "Dulap de birou pentru acte 1 m",
    tagline: "Polițe pentru bibliorafturi și dosare, închise în spatele a două uși.",
    paletteId: "alb-stejar-natur",
    size: [1000, 2000, 400],
    columns: [col(500, "POLITE"), col(500, "POLITE")],
    doors: { type: "BATANTE" },
  },
  {
    id: "dressing-oglinda-glisanta-200",
    name: "Dulap cu două uși glisante cu oglindă 2 m",
    tagline: "Oglindă pe ambele uși glisante: bară dublă, polițe la mijloc și bară pentru haine lungi.",
    paletteId: "alb-casmir",
    size: [2000, 2400, 600],
    columns: [col(700, "BARA_DUBLA"), col(600, "POLITE"), col(700, "BARA")],
    doors: { type: "GLISANTE_OGLINDA", count: 2 },
  },
  {
    id: "dressing-3-usi-oglinda-150",
    name: "Dulap cu 3 uși și oglindă 1,5 m",
    tagline: "Polițe într-o parte, umerașe pe două uși și oglindă pe ușa din mijloc.",
    paletteId: "alb-casmir",
    size: [1500, 2200, 550],
    columns: [col(500, "POLITE"), col(500, "BARA"), col(500, "BARA")],
    doors: { type: "BATANTE", fills: ["PANOU", "OGLINDA", "PANOU"] },
  },
  {
    id: "dressing-cuier-100",
    name: "Cuier deschis de hol 1 m",
    tagline: "Fără uși: bară pentru geci și polițe pentru genți, căciuli și încălțăminte.",
    paletteId: "stejar-natur",
    size: [1000, 2000, 400],
    columns: [col(500, "BARA"), col(500, "POLITE")],
    doors: { type: "NONE" },
  },
];

const COMODA: PresetInput[] = [
  {
    id: "comoda-clasica-160",
    name: "Comodă cu 6 sertare 1,6 m",
    tagline: "Comoda de dormitor: două coloane a câte trei sertare.",
    badge: "Cel mai ales",
    paletteId: "stejar-alb",
    size: [1600, 800, 450],
    columns: [col(800, "SERTARE", { drawers: 3 }), col(800, "SERTARE", { drawers: 3 })],
  },
  {
    id: "comoda-4-sertare-100",
    name: "Comodă cu 4 sertare 1 m",
    tagline: "Patru sertare largi, pentru lenjerie și tricouri.",
    paletteId: "alb-total",
    size: [1000, 950, 450],
    columns: [col(1000, "SERTARE", { drawers: 4 })],
  },
  {
    id: "comoda-tv-200",
    name: "Comodă TV 2 m",
    tagline: "Joasă și lungă: sertare pe margini, nișă pentru aparate la mijloc.",
    paletteId: "antracit-stejar",
    size: [2000, 500, 400],
    columns: [col(600, "SERTARE", { drawers: 2 }), col(800, "DESCHIS", { shelves: 1 }), col(600, "SERTARE", { drawers: 2 })],
  },
  {
    id: "comoda-tv-240",
    name: "Comodă TV 2,4 m",
    tagline: "Pe tot peretele de living, cu uși și sertare.",
    paletteId: "nuc-negru-mat",
    size: [2400, 500, 450],
    columns: [col(800, "USI", { shelves: 1 }), col(800, "SERTARE", { drawers: 2 }), col(800, "USI", { shelves: 1 })],
  },
  {
    id: "noptiera-50",
    name: "Noptieră cu 2 sertare",
    tagline: "Lângă pat, cu două sertare încăpătoare.",
    paletteId: "stejar-casmir",
    size: [500, 500, 400],
    columns: [col(500, "SERTARE", { drawers: 2 })],
  },
  {
    id: "comoda-hol-120",
    name: "Pantofar de hol 1,2 m",
    tagline: "Puțin adânc, cu uși și polițe pentru încălțăminte.",
    paletteId: "casmir-alb",
    size: [1200, 1000, 350],
    columns: [col(600, "USI", { shelves: 3 }), col(600, "USI", { shelves: 3 })],
  },
  {
    id: "comoda-mixta-180",
    name: "Bufet cu uși și sertare 1,8 m",
    tagline: "Sertare la mijloc, uși pe laterale: pentru living sau sufragerie.",
    paletteId: "nuc-crem",
    size: [1800, 850, 450],
    columns: [col(600, "USI", { shelves: 2 }), col(600, "SERTARE", { drawers: 4 }), col(600, "USI", { shelves: 2 })],
  },
  {
    id: "comoda-inalta-80",
    name: "Comodă înaltă cu 5 sertare",
    tagline: "Ocupă puțin loc pe perete și ține cât un dulap mic.",
    paletteId: "gri-casmir",
    size: [800, 1200, 450],
    columns: [col(800, "SERTARE", { drawers: 5 })],
  },
  {
    id: "comoda-nisa-140",
    name: "Comodă cu nișă 1,4 m",
    tagline: "Sertare într-o parte, polițe deschise pentru cărți în cealaltă.",
    paletteId: "salvie-stejar",
    size: [1400, 800, 400],
    columns: [col(800, "SERTARE", { drawers: 3 }), col(600, "DESCHIS", { shelves: 2 })],
  },
  {
    id: "comoda-pantofar-80",
    name: "Pantofar înalt și îngust 0,8 m",
    tagline: "Doar 30 cm adâncime: cinci rânduri de încălțăminte pe un perete îngust de hol.",
    paletteId: "alb-total",
    size: [800, 1200, 300],
    columns: [col(400, "USI", { shelves: 4 }), col(400, "USI", { shelves: 4 })],
  },
  {
    id: "comoda-cafea-120",
    name: "Bufet de cafea 1,2 m",
    tagline: "Înalt cât blatul de bucătărie: espressorul deasupra, cănile și cafeaua dedesubt.",
    paletteId: "alb-stejar-natur",
    size: [1200, 900, 450],
    columns: [col(600, "USI", { shelves: 1 }), col(600, "SERTARE", { drawers: 3 })],
  },
  {
    id: "comoda-baie-80",
    name: "Dulăpior de baie pe podea 0,8 m",
    tagline: "Puțin adânc, lângă lavoar sau mașina de spălat: o ușă și trei sertare.",
    paletteId: "alb-casmir",
    size: [800, 850, 350],
    columns: [col(400, "USI", { shelves: 2 }), col(400, "SERTARE", { drawers: 3 })],
  },
  {
    id: "comoda-birou-90",
    name: "Comodă de birou 0,9 m",
    tagline: "La înălțimea biroului: sertare pentru acte și un dulăpior pentru imprimantă.",
    paletteId: "alb-stejar-natur",
    size: [900, 750, 450],
    columns: [col(450, "SERTARE", { drawers: 3 }), col(450, "USI", { shelves: 1 })],
  },
  {
    id: "comoda-tv-160",
    name: "Comodă TV 1,6 m",
    tagline: "Pentru livingul mic: două sertare într-o parte, nișă deschisă pentru aparate în cealaltă.",
    paletteId: "alb-stejar-natur",
    size: [1600, 500, 400],
    columns: [col(800, "SERTARE", { drawers: 2 }), col(800, "DESCHIS", { shelves: 1 })],
  },
  {
    id: "noptiera-deschisa-45",
    name: "Noptieră deschisă 45 cm",
    tagline: "Îngustă, fără uși: două nișe pentru carte, telefon și ochelari.",
    paletteId: "stejar-natur",
    size: [450, 550, 400],
    columns: [col(450, "DESCHIS", { shelves: 1 })],
  },
];

const SEPARATOR: PresetInput[] = [
  {
    id: "separator-biblioteca-120",
    name: "Bibliotecă separator 1,2 m",
    tagline: "Deschisă pe ambele fețe: desparte fără să ia lumina.",
    paletteId: "stejar-natur",
    size: [1200, 2000, 350],
    columns: [col(400, "DESCHIS"), col(400, "DESCHIS"), col(400, "DESCHIS")],
  },
  {
    id: "separator-sertare-160",
    name: "Bibliotecă cu sertare jos 1,6 m",
    tagline: "Polițe deschise sus, sertare încăpătoare la bază.",
    badge: "Cel mai ales",
    paletteId: "stejar-alb",
    size: [1600, 2000, 400],
    columns: [col(800, "DESCHIS", { shelves: 3 }), col(800, "DESCHIS", { shelves: 3 })],
    bottom: { type: "SERTARE", heightMm: 700, drawers: 2 },
  },
  {
    id: "separator-usi-180",
    name: "Separator cu uși jos 1,8 m",
    tagline: "Dulăpioare închise la bază și rafturi decorative deasupra.",
    paletteId: "alb-stejar-natur",
    size: [1800, 2200, 400],
    columns: [col(600, "DESCHIS", { shelves: 3 }), col(600, "DESCHIS", { shelves: 3 }), col(600, "DESCHIS", { shelves: 3 })],
    bottom: { type: "USI", heightMm: 800, shelves: 1 },
  },
  {
    id: "separator-inalt-240",
    name: "Separator până în tavan 2,4 m",
    tagline: "Un perete de rafturi între living și dormitor.",
    paletteId: "bardolino-gri",
    size: [2400, 2600, 350],
    columns: [col(600, "DESCHIS"), col(600, "DESCHIS"), col(600, "DESCHIS"), col(600, "DESCHIS")],
  },
  {
    id: "separator-scund-200",
    name: "Separator scund 2 m",
    tagline: "La înălțimea canapelei: delimitează zona și rămâne aerisit.",
    paletteId: "antracit-stejar",
    size: [2000, 1200, 350],
    columns: [col(500, "DESCHIS", { shelves: 2 }), col(500, "DESCHIS", { shelves: 2 }), col(500, "DESCHIS", { shelves: 2 }), col(500, "DESCHIS", { shelves: 2 })],
  },
  {
    id: "separator-ingust-90",
    name: "Coloană separator 0,9 m",
    tagline: "Îngust, lângă intrare: două sertare jos și polițe pentru plante.",
    paletteId: "salvie-stejar",
    size: [900, 2200, 300],
    columns: [col(450, "DESCHIS", { shelves: 4 }), col(450, "DESCHIS", { shelves: 4 })],
    bottom: { type: "SERTARE", heightMm: 500, drawers: 1 },
  },
  {
    id: "separator-cuburi-150",
    name: "Bibliotecă cu 16 cuburi 1,5 m",
    tagline: "Patru pe patru nișe egale, pentru cărți, cutii și coșuri: la perete sau între două zone.",
    paletteId: "alb-total",
    size: [1500, 1500, 400],
    columns: [col(375, "DESCHIS", { shelves: 3 }), col(375, "DESCHIS", { shelves: 3 }), col(375, "DESCHIS", { shelves: 3 }), col(375, "DESCHIS", { shelves: 3 })],
  },
  {
    id: "separator-copii-120",
    name: "Bibliotecă joasă pentru copii 1,2 m",
    tagline: "La înălțimea celor mici: polițe pentru cărți și sertare de jucării la bază.",
    paletteId: "alb-total",
    size: [1200, 1200, 350],
    columns: [col(400, "DESCHIS", { shelves: 1 }), col(400, "DESCHIS", { shelves: 1 }), col(400, "DESCHIS", { shelves: 1 })],
    bottom: { type: "SERTARE", heightMm: 400, drawers: 1 },
  },
];

const SUSPENDAT: PresetInput[] = [
  {
    id: "suspendat-clasic-120",
    name: "Corp suspendat 1,2 m",
    tagline: "Două uși batante, deasupra biroului, a blatului sau a mașinii de spălat.",
    paletteId: "alb-total",
    size: [1200, 600, 350],
    columns: [col(600, "USI", { shelves: 1 }), col(600, "USI", { shelves: 1 })],
  },
  {
    id: "suspendat-tv-180",
    name: "Corp TV suspendat 1,8 m",
    tagline: "Plutește sub televizor, cu uși care se ridică.",
    badge: "Cel mai ales",
    paletteId: "stejar-negru",
    size: [1800, 350, 400],
    columns: [col(900, "USA_RIDICABILA", { shelves: 0 }), col(900, "USA_RIDICABILA", { shelves: 0 })],
  },
  {
    id: "suspendat-tv-240",
    name: "Corp TV suspendat 2,4 m",
    tagline: "Lung și jos, cu nișă deschisă la mijloc pentru aparate.",
    paletteId: "nuc-negru-mat",
    size: [2400, 350, 400],
    columns: [col(800, "USA_RIDICABILA", { shelves: 0 }), col(800, "DESCHIS", { shelves: 0 }), col(800, "USA_RIDICABILA", { shelves: 0 })],
  },
  {
    id: "suspendat-baie-60",
    name: "Dulăpior de baie 0,6 m",
    tagline: "Puțin adânc, cu o ușă și polițe pentru cosmetice.",
    paletteId: "alb-casmir",
    size: [600, 700, 250],
    columns: [col(600, "USI", { shelves: 2 })],
  },
  {
    id: "suspendat-aventos-180",
    name: "Corpuri cu uși Aventos 1,8 m",
    tagline: "Uși care se ridică și rămân sus, deasupra biroului sau a patului.",
    paletteId: "supermat-alb",
    size: [1800, 400, 350],
    columns: [col(900, "USA_RIDICABILA", { shelves: 0 }), col(900, "USA_RIDICABILA", { shelves: 0 })],
  },
  {
    id: "suspendat-etajera-150",
    name: "Etajeră suspendată 1,5 m",
    tagline: "Trei nișe deschise pentru cărți și decorațiuni.",
    paletteId: "stejar-natur",
    size: [1500, 350, 250],
    columns: [col(500, "DESCHIS", { shelves: 0 }), col(500, "DESCHIS", { shelves: 0 }), col(500, "DESCHIS", { shelves: 0 })],
  },
  {
    id: "suspendat-mixt-200",
    name: "Corp suspendat cu nișă 2 m",
    tagline: "Uși pe laterale și o nișă deschisă la mijloc.",
    paletteId: "casmir-alb",
    size: [2000, 600, 350],
    columns: [col(600, "USI", { shelves: 1 }), col(800, "DESCHIS", { shelves: 1 }), col(600, "USI", { shelves: 1 })],
  },
  {
    id: "suspendat-hol-90",
    name: "Dulap suspendat de hol 0,9 m",
    tagline: "Înalt și îngust, deasupra pantofarului sau a mașinii de spălat.",
    paletteId: "gri-casmir",
    size: [900, 900, 350],
    columns: [col(450, "USI", { shelves: 2 }), col(450, "USI", { shelves: 2 })],
  },
  {
    id: "suspendat-bucatarie-180",
    name: "Corp suspendat de bucătărie 1,8 m",
    tagline: "Trei uși și polițe pentru veselă, deasupra blatului sau a colțului de cafea.",
    paletteId: "alb-total",
    size: [1800, 720, 320],
    columns: [col(600, "USI", { shelves: 2 }), col(600, "USI", { shelves: 2 }), col(600, "USI", { shelves: 2 })],
  },
  {
    id: "suspendat-baie-nisa-90",
    name: "Dulăpior de baie cu nișă 0,9 m",
    tagline: "O ușă pentru cosmetice și o nișă deschisă pentru prosoape.",
    paletteId: "alb-total",
    size: [900, 700, 250],
    columns: [col(300, "DESCHIS", { shelves: 2 }), col(600, "USI", { shelves: 2 })],
  },
  {
    id: "suspendat-pat-240",
    name: "Corp suspendat peste pat 2,4 m",
    tagline: "Patru uși deasupra patului, pentru lenjerie, pături și perne de rezervă.",
    paletteId: "alb-total",
    size: [2400, 400, 350],
    columns: [col(600, "USI", { shelves: 0 }), col(600, "USI", { shelves: 0 }), col(600, "USI", { shelves: 0 }), col(600, "USI", { shelves: 0 })],
  },
];

/*
 * Kitchens: modules left to right as you face the wall. In an L the corner unit (COLT, 110 cm) sits on the
 * main wall at the corner end, and the second wall's modules fill its length minus the worktop depth (60 cm).
 * The sink sits next to the dishwasher; the hob (with the oven under it) is never right next to the fridge.
 */
const L_B = (widthMm: number, layout: "L_STANGA" | "L_DREAPTA", columns: Column[]): PresetShape["kitchen"] => ({ layout, legB: { widthMm, columns } });
const BUCATARIE: PresetInput[] = [
  {
    id: "bucatarie-240",
    name: "Bucătărie 2,4 m",
    tagline: "Sertare, chiuvetă, mașină de vase și cuptor, pe un perete.",
    badge: "Cea mai aleasă",
    paletteId: "alb-stejar-natur",
    size: [2400, 2200, 600],
    legsMm: 150,
    columns: [col(600, "SERTARE", { drawers: 3 }), col(600, "CHIUVETA"), col(600, "MASINA_VASE"), col(600, "CUPTOR")],
    kitchen: { layout: "LINIAR" },
  },
  {
    id: "bucatarie-compacta-180",
    name: "Bucătărie compactă 1,8 m",
    tagline: "Pentru garsonieră sau apartament mic: chiuvetă, cuptor, sertare.",
    paletteId: "alb-total",
    size: [1800, 2200, 600],
    legsMm: 150,
    columns: [col(600, "CHIUVETA"), col(600, "SERTARE", { drawers: 3 }), col(600, "CUPTOR")],
    kitchen: { layout: "LINIAR" },
  },
  {
    id: "bucatarie-260",
    name: "Bucătărie 2,6 m",
    tagline: "Pe un perete: sertare, plită pe sertare, mașină de vase și chiuvetă de 80 cm.",
    paletteId: "alb-casmir",
    size: [2600, 2200, 600],
    legsMm: 150,
    columns: [col(600, "SERTARE", { drawers: 3 }), col(600, "PLITA"), col(600, "MASINA_VASE"), col(800, "CHIUVETA")],
    kitchen: { layout: "LINIAR" },
  },
  {
    id: "bucatarie-frigider-300",
    name: "Bucătărie 3 m cu frigider",
    tagline: "Frigider încorporat într-o coloană înaltă, totul pe un perete.",
    paletteId: "gri-casmir",
    size: [3000, 2200, 600],
    legsMm: 150,
    columns: [col(600, "FRIGIDER"), col(600, "SERTARE", { drawers: 3 }), col(600, "CHIUVETA"), col(600, "MASINA_VASE"), col(600, "CUPTOR")],
    kitchen: { layout: "LINIAR" },
  },
  {
    id: "bucatarie-coloane-380",
    name: "Bucătărie 3,8 m cu coloane",
    tagline: "Frigider și cuptor la înălțime în coloane, mult loc de lucru.",
    paletteId: "stejar-alb",
    size: [3800, 2300, 600],
    legsMm: 150,
    columns: [col(600, "FRIGIDER"), col(600, "COLOANA_CUPTOR"), col(600, "SERTARE", { drawers: 3 }), col(800, "CHIUVETA"), col(600, "MASINA_VASE"), col(600, "PLITA")],
    kitchen: { layout: "LINIAR" },
  },
  {
    id: "bucatarie-l-270",
    name: "Bucătărie în L 2,7 × 1,8 m",
    tagline: "Colț cu chiuvetă pe un perete și cuptor pe celălalt.",
    badge: "Mult loc de lucru",
    paletteId: "alb-casmir",
    size: [2700, 2200, 600],
    legsMm: 150,
    columns: [col(1100, "COLT"), col(1000, "CHIUVETA"), col(600, "MASINA_VASE")],
    kitchen: L_B(1800, "L_STANGA", [col(600, "SERTARE", { drawers: 3 }), col(600, "CUPTOR")]),
  },
  {
    id: "bucatarie-l-frigider-300",
    name: "Bucătărie în L 3 × 2,4 m",
    tagline: "Frigider încorporat, colț și plită pe al doilea perete.",
    paletteId: "bardolino-gri",
    size: [3000, 2200, 600],
    legsMm: 150,
    columns: [col(600, "FRIGIDER"), col(500, "SERTARE", { drawers: 3 }), col(800, "CHIUVETA"), col(1100, "COLT")],
    kitchen: L_B(2400, "L_DREAPTA", [col(600, "MASINA_VASE"), col(600, "CUPTOR"), col(600, "SERTARE", { drawers: 3 })]),
  },
  {
    id: "bucatarie-rafturi-240",
    name: "Bucătărie cu rafturi deschise 2,4 m",
    tagline: "Rafturi deschise sus, pentru o bucătărie aerisită.",
    paletteId: "salvie-stejar",
    size: [2400, 2200, 600],
    legsMm: 150,
    columns: [
      col(600, "SERTARE", { drawers: 3, upper: "DESCHIS" }),
      col(600, "CHIUVETA"),
      col(600, "MASINA_VASE", { upper: "DESCHIS" }),
      col(600, "CUPTOR"),
    ],
    kitchen: { layout: "LINIAR" },
  },
  {
    id: "bucatarie-ridicabile-300",
    name: "Bucătărie modernă 3 m",
    tagline: "Dulapuri sus cu uși care se ridică, fronturi fără mâner la vedere.",
    paletteId: "grafit-total",
    size: [3000, 2300, 600],
    legsMm: 150,
    handle: { type: "PUSH" },
    columns: [
      col(600, "FRIGIDER"),
      col(600, "SERTARE", { drawers: 3, upper: "RIDICABILA" }),
      col(600, "CHIUVETA", { upper: "RIDICABILA" }),
      col(600, "MASINA_VASE", { upper: "RIDICABILA" }),
      col(600, "CUPTOR"),
    ],
    kitchen: { layout: "LINIAR", led: true },
  },
];

/*
 * Bathroom furniture: one wall, wall-hung by default (legs 0). The basin sits on the vanity's worktop (the
 * client brings it, we cut the worktop); the mirror cabinet hangs 30 cm above it. A washer niche raises the
 * worktop to 90 cm. Mirror cabinets keep a white body (owner rule).
 */
const BAIE: PresetInput[] = [
  {
    id: "baie-lavoar-coloana-120",
    name: "Mobilier lavoar cu coloană 1,2 m",
    tagline: "Corp de lavoar cu două sertare, dulap cu oglindă și o coloană pentru prosoape.",
    badge: "Cea mai aleasă",
    paletteId: "alb-stejar-natur",
    size: [1200, 1900, 480],
    legsMm: 0,
    columns: [col(800, "LAVOAR", { drawers: 2, upper: "OGLINDA" }), col(400, "COLOANA")],
    kitchen: { layout: "LINIAR" },
  },
  {
    id: "baie-lavoar-60",
    name: "Mobilier lavoar suspendat 60 cm",
    tagline: "Pentru baia mică: un corp de lavoar cu sertare și dulapul cu oglindă deasupra.",
    paletteId: "alb-total",
    size: [600, 1900, 460],
    legsMm: 0,
    columns: [col(600, "LAVOAR", { drawers: 2, upper: "OGLINDA" })],
    kitchen: { layout: "LINIAR" },
  },
  {
    id: "baie-lavoar-50",
    name: "Mobilier lavoar suspendat 50 cm",
    tagline: "Pentru baia foarte mică: corp de lavoar cu două sertare și dulap cu oglindă deasupra.",
    paletteId: "alb-stejar-natur",
    size: [500, 1900, 400],
    legsMm: 0,
    columns: [col(500, "LAVOAR", { drawers: 2, upper: "OGLINDA" })],
    kitchen: { layout: "LINIAR" },
  },
  {
    id: "baie-lavoar-80",
    name: "Mobilier lavoar suspendat 80 cm",
    tagline: "Corp de lavoar cu două sertare largi și dulap cu oglindă cu două uși.",
    paletteId: "alb-casmir",
    size: [800, 1900, 480],
    legsMm: 0,
    columns: [col(800, "LAVOAR", { drawers: 2, upper: "OGLINDA" })],
    kitchen: { layout: "LINIAR" },
  },
  {
    id: "baie-dubla-140",
    name: "Mobilier baie cu lavoar dublu 1,4 m",
    tagline: "Două corpuri de lavoar, fiecare cu sertarele și dulapul lui cu oglindă.",
    paletteId: "alb-stejar-deschis",
    size: [1400, 1900, 480],
    legsMm: 0,
    columns: [col(700, "LAVOAR", { drawers: 2, upper: "OGLINDA" }), col(700, "LAVOAR", { drawers: 2, upper: "OGLINDA" })],
    kitchen: { layout: "LINIAR" },
  },
  {
    id: "baie-masina-140",
    name: "Mobilier lavoar cu mașina de spălat 1,4 m",
    tagline: "Mașina de spălat sub același blat cu lavoarul, dulap deasupra ei.",
    paletteId: "alb-antracit",
    size: [1400, 1950, 600],
    legsMm: 0,
    columns: [col(650, "MASINA_SPALAT", { upper: "USI" }), col(750, "LAVOAR", { drawers: 2, upper: "OGLINDA" })],
    kitchen: { layout: "LINIAR" },
  },
  {
    id: "baie-picioare-100",
    name: "Mobilier lavoar pe picioare 1 m",
    tagline: "Corp de lavoar și un corp cu trei sertare, pe picioare, cu oglindă și raft deasupra.",
    paletteId: "alb-gri-matase",
    size: [1000, 1900, 480],
    legsMm: 100,
    columns: [col(600, "LAVOAR", { drawers: 2, upper: "OGLINDA" }), col(400, "SERTARE", { drawers: 3, upper: "DESCHIS" })],
    kitchen: { layout: "LINIAR" },
  },
];

export const LAYOUT_PRESETS: LayoutPreset[] = [
  ...DRESSING.map((p) => make("DRESSING", p)),
  ...COMODA.map((p) => make("COMODA", p)),
  ...SEPARATOR.map((p) => make("SEPARATOR", p)),
  ...SUSPENDAT.map((p) => make("SUSPENDAT", p)),
  ...BUCATARIE.map((p) => make("BUCATARIE", p)),
  ...BAIE.map((p) => make("BAIE", p)),
];

/** Featured model + colour pairs, in the order they are shown. */
export const COMBO_PRESETS: ComboPreset[] = [
  { id: "scandinav-luminos", name: "Scandinav luminos", tagline: "Dressing 2,4 m alb, cu uși în stejar natur.", presetId: "dressing-clasic-240", paletteId: "alb-stejar-natur" },
  { id: "dormitor-cu-oglinda", name: "Dormitor cu oglindă", tagline: "Uși glisante cu oglindă, corp alb și cașmir.", presetId: "dressing-oglinda-240", paletteId: "alb-casmir" },
  { id: "oglinda-la-mijloc", name: "Oglindă la mijloc", tagline: "Dulap alb cu uși cașmir și oglindă pe ușile din mijloc.", presetId: "dressing-oglinda-mijloc-240", paletteId: "alb-casmir" },
  { id: "nuc-crem-dormitor", name: "Nuc & crem de dormitor", tagline: "Dulap de 1,8 m în nuc, cu uși crem.", presetId: "dressing-dormitor-180", paletteId: "nuc-crem" },
  { id: "casmir-total", name: "Cașmir de la un perete la altul", tagline: "Dressing de 3,6 m, tot în gri cașmir.", presetId: "dressing-mare-360", paletteId: "gri-casmir" },
  { id: "walk-in-stejar", name: "Walk-in în stejar", tagline: "Dressing deschis, cald, cu totul la vedere.", presetId: "dressing-deschis-280", paletteId: "stejar-natur" },
  { id: "hol-primitor", name: "Hol primitor", tagline: "Dulap de hol cașmir, cu uși albe.", presetId: "dressing-hol-120", paletteId: "casmir-alb" },
  { id: "camera-copilului", name: "Camera copilului", tagline: "Dulap alb cu uși albastru denim.", presetId: "dressing-copii-150", paletteId: "denim-alb" },
  { id: "grafit-elegant", name: "Grafit elegant", tagline: "Dulap cu sertare, antracit și stejar.", presetId: "dressing-sertare-200", paletteId: "antracit-stejar" },
  { id: "supermat-pana-in-tavan", name: "Supermat până în tavan", tagline: "Fronturi AGT crem supermat, fără mânere.", presetId: "dressing-tavan-270", paletteId: "supermat-crem" },
  { id: "comoda-nordica", name: "Comodă nordică", tagline: "Șase sertare albe pe corp de stejar.", presetId: "comoda-clasica-160", paletteId: "stejar-alb" },
  { id: "living-stejar-casmir", name: "Living în stejar & cașmir", tagline: "Comodă TV de 2,4 m în stejar, cu fronturi cașmir.", presetId: "comoda-tv-240", paletteId: "stejar-casmir" },
  { id: "noptiera-calda", name: "Noptieră caldă", tagline: "Stejar cu sertare cașmir.", presetId: "noptiera-50", paletteId: "stejar-casmir" },
  { id: "bufet-salvie", name: "Bufet verde salvie", tagline: "Uși și sertare salvie pe stejar deschis.", presetId: "comoda-mixta-180", paletteId: "salvie-stejar" },
  { id: "biblioteca-aerisita", name: "Bibliotecă aerisită", tagline: "Separator cu sertare albe la bază.", presetId: "separator-sertare-160", paletteId: "stejar-alb" },
  { id: "separator-loft", name: "Separator de loft", tagline: "Rafturi scunde, antracit și stejar.", presetId: "separator-scund-200", paletteId: "antracit-stejar" },
  { id: "perete-de-carti", name: "Perete de cărți", tagline: "Separator înalt în stejar bardolino.", presetId: "separator-inalt-240", paletteId: "bardolino-gri" },
  { id: "tv-plutitor", name: "TV plutitor", tagline: "Corp suspendat alb, cu uși în stejar natur.", presetId: "suspendat-tv-180", paletteId: "alb-stejar-natur" },
  { id: "baie-luminoasa", name: "Baie luminoasă", tagline: "Dulăpior alb cu ușă cașmir.", presetId: "suspendat-baie-60", paletteId: "alb-casmir" },
  { id: "birou-supermat", name: "Birou alb supermat", tagline: "Corpuri Aventos cu fronturi AGT albe.", presetId: "suspendat-aventos-180", paletteId: "supermat-alb" },
  { id: "bucatarie-luminoasa", name: "Bucătărie luminoasă", tagline: "2,4 m, corp alb și fronturi în stejar natur.", presetId: "bucatarie-240", paletteId: "alb-stejar-natur" },
  { id: "bucatarie-l-casmir", name: "Bucătărie în L, cașmir", tagline: "Colț, chiuvetă și cuptor, în alb și cașmir.", presetId: "bucatarie-l-270", paletteId: "alb-casmir" },
  { id: "baie-calda", name: "Baie caldă", tagline: "Mobilier lavoar suspendat cu coloană, alb și stejar natur.", presetId: "baie-lavoar-coloana-120", paletteId: "alb-stejar-natur" },
  { id: "etajera-stejar", name: "Etajeră în stejar", tagline: "Trei nișe deschise, pentru cărți și plante.", presetId: "suspendat-etajera-150", paletteId: "stejar-natur" },
];

export function presetsFor(category: AtelierCategory): LayoutPreset[] {
  return LAYOUT_PRESETS.filter((p) => p.category === category);
}

export function presetById(id: string): LayoutPreset | undefined {
  return LAYOUT_PRESETS.find((p) => p.id === id);
}

/**
 * Can this model be shown as it is drawn? A preset with its own face per door needs a CRM that knows
 * per-door faces (it lists the mirror / glass types in the catalog); an older one would build it with
 * plain doors.
 */
export function presetAvailable(preset: LayoutPreset, catalog: Pick<AtelierCatalog, "glass" | "worktops">): boolean {
  // a kitchen needs a CRM that knows kitchens (it lists the worktops)
  if (preset.category === "BUCATARIE" || preset.category === "BAIE") return (catalog.worktops?.length ?? 0) > 0;
  return !preset.shape.doors.fills || !!catalog.glass;
}
