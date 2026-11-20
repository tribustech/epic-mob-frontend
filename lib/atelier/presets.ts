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
    columns: [col(600, "POLITE"), col(800, "BARA_SERTARE", { drawers: 3 }), col(600, "POLITE")],
    doors: { type: "BATANTE" },
  },
  {
    id: "dressing-copii-150",
    name: "Dulap pentru copii 1,5 m",
    tagline: "Bară dublă la îndemâna celor mici și multe polițe.",
    paletteId: "denim-alb",
    size: [1500, 2200, 550],
    columns: [col(750, "BARA_DUBLA"), col(750, "POLITE")],
    doors: { type: "BATANTE" },
  },
  {
    id: "dressing-tavan-270",
    name: "Dulap până în tavan 2,7 m",
    tagline: "Uși batante pe două rânduri, cu depozitare sus pentru valize.",
    paletteId: "supermat-crem",
    size: [2700, 2800, 600],
    columns: [
      col(900, "BARA", { doorRows: 2 }),
      col(900, "POLITE_BARA", { doorRows: 2, shelves: 3 }),
      col(900, "POLITE", { doorRows: 2 }),
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
    columns: [col(800, "POLITE_BARA", { shelves: 2 }), col(800, "POLITE")],
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
    tagline: "Uși batante, cu oglindă doar pe ușa din mijloc.",
    paletteId: "alb-casmir",
    size: [2400, 2500, 600],
    columns: [col(800, "BARA"), col(800, "POLITE"), col(800, "BARA_SERTARE", { drawers: 2 })],
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
    tagline: "Îngustă și înaltă, pentru lenjerie și tricouri.",
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
    tagline: "Îngust, lângă intrare: sertar jos și polițe pentru plante.",
    paletteId: "salvie-stejar",
    size: [900, 2200, 300],
    columns: [col(450, "DESCHIS", { shelves: 4 }), col(450, "DESCHIS", { shelves: 4 })],
    bottom: { type: "SERTARE", heightMm: 500, drawers: 1 },
  },
];

const SUSPENDAT: PresetInput[] = [
  {
    id: "suspendat-clasic-120",
    name: "Corp suspendat 1,2 m",
    tagline: "Două uși batante, pentru hol, birou sau spălătorie.",
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
];

export const LAYOUT_PRESETS: LayoutPreset[] = [
  ...DRESSING.map((p) => make("DRESSING", p)),
  ...COMODA.map((p) => make("COMODA", p)),
  ...SEPARATOR.map((p) => make("SEPARATOR", p)),
  ...SUSPENDAT.map((p) => make("SUSPENDAT", p)),
];

/** Featured model + colour pairs, in the order they are shown. */
export const COMBO_PRESETS: ComboPreset[] = [
  { id: "scandinav-luminos", name: "Scandinav luminos", tagline: "Dressing 2,4 m alb, cu uși în stejar natur.", presetId: "dressing-clasic-240", paletteId: "alb-stejar-natur" },
  { id: "dormitor-cu-oglinda", name: "Dormitor cu oglindă", tagline: "Uși glisante cu oglindă, corp alb și cașmir.", presetId: "dressing-oglinda-240", paletteId: "alb-casmir" },
  { id: "oglinda-la-mijloc", name: "Oglindă la mijloc", tagline: "Dulap alb cu uși cașmir și oglindă pe ușa din mijloc.", presetId: "dressing-oglinda-mijloc-240", paletteId: "alb-casmir" },
  { id: "nuc-crem-dormitor", name: "Nuc & crem de dormitor", tagline: "Dulap de 1,8 m în nuc, cu uși crem.", presetId: "dressing-dormitor-180", paletteId: "nuc-crem" },
  { id: "casmir-total", name: "Cașmir de la un perete la altul", tagline: "Dressing de 3,6 m, tot în gri cașmir.", presetId: "dressing-mare-360", paletteId: "gri-casmir" },
  { id: "walk-in-stejar", name: "Walk-in în stejar", tagline: "Dressing deschis, cald, cu totul la vedere.", presetId: "dressing-deschis-280", paletteId: "stejar-natur" },
  { id: "hol-primitor", name: "Hol primitor", tagline: "Dulap de hol cașmir, cu uși albe.", presetId: "dressing-hol-120", paletteId: "casmir-alb" },
  { id: "camera-copilului", name: "Camera copilului", tagline: "Dulap alb cu uși albastru denim.", presetId: "dressing-copii-150", paletteId: "denim-alb" },
  { id: "grafit-elegant", name: "Grafit elegant", tagline: "Dulap cu sertare, antracit și stejar.", presetId: "dressing-sertare-200", paletteId: "antracit-stejar" },
  { id: "supermat-pana-in-tavan", name: "Supermat până în tavan", tagline: "Fronturi AGT crem supermat, fără mânere.", presetId: "dressing-tavan-270", paletteId: "supermat-crem" },
  { id: "comoda-nordica", name: "Comodă nordică", tagline: "Șase sertare albe pe corp de stejar.", presetId: "comoda-clasica-160", paletteId: "stejar-alb" },
  { id: "living-negru-nuc", name: "Living în negru mat & nuc", tagline: "Comodă TV de 2,4 m, cu fronturi negre supermat.", presetId: "comoda-tv-240", paletteId: "nuc-negru-mat" },
  { id: "noptiera-calda", name: "Noptieră caldă", tagline: "Stejar cu sertare cașmir.", presetId: "noptiera-50", paletteId: "stejar-casmir" },
  { id: "bufet-salvie", name: "Bufet verde salvie", tagline: "Uși și sertare salvie pe stejar deschis.", presetId: "comoda-mixta-180", paletteId: "salvie-stejar" },
  { id: "biblioteca-aerisita", name: "Bibliotecă aerisită", tagline: "Separator cu sertare albe la bază.", presetId: "separator-sertare-160", paletteId: "stejar-alb" },
  { id: "separator-loft", name: "Separator de loft", tagline: "Rafturi scunde, antracit și stejar.", presetId: "separator-scund-200", paletteId: "antracit-stejar" },
  { id: "perete-de-carti", name: "Perete de cărți", tagline: "Separator înalt în stejar bardolino.", presetId: "separator-inalt-240", paletteId: "bardolino-gri" },
  { id: "tv-plutitor", name: "TV plutitor", tagline: "Corp suspendat în stejar, cu uși negre.", presetId: "suspendat-tv-180", paletteId: "stejar-negru" },
  { id: "baie-luminoasa", name: "Baie luminoasă", tagline: "Dulăpior alb cu ușă cașmir.", presetId: "suspendat-baie-60", paletteId: "alb-casmir" },
  { id: "birou-supermat", name: "Birou alb supermat", tagline: "Corpuri Aventos cu fronturi AGT albe.", presetId: "suspendat-aventos-180", paletteId: "supermat-alb" },
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
export function presetAvailable(preset: LayoutPreset, catalog: Pick<AtelierCatalog, "glass">): boolean {
  return !preset.shape.doors.fills || !!catalog.glass;
}
