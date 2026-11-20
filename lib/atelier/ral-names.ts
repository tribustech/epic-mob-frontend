/**
 * Romanian names for the RAL Classic colours. The CRM sends the English names („Traffic white");
 * they are built the same way („<what it looks like> <colour>"), so a small dictionary translates
 * them all: „Pearl ruby red" → „Roșu rubin perlat". Anything unknown gets no name (the code alone).
 */

const COLOURS: Record<string, string> = {
  yellow: "Galben",
  beige: "Bej",
  white: "Alb",
  orange: "Portocaliu",
  red: "Roșu",
  pink: "Roz",
  violet: "Violet",
  lilac: "Lila",
  purple: "Purpuriu",
  blue: "Albastru",
  green: "Verde",
  grey: "Gri",
  brown: "Maro",
  black: "Negru",
  olive: "Oliv",
  turquoise: "Turcoaz",
  gold: "Auriu",
  aluminium: "Aluminiu",
  ivory: "Fildeș",
  copper: "Cupru",
  blackberry: "Mură",
};

const MODIFIERS: Record<string, string> = {
  green: "verzui",
  sand: "nisip",
  signal: "semnal",
  golden: "auriu",
  honey: "miere",
  maize: "porumb",
  daffodil: "narcisă",
  brown: "maroniu",
  lemon: "lămâie",
  oyster: "stridie",
  light: "deschis",
  dark: "închis",
  sulfur: "sulf",
  saffron: "șofran",
  zinc: "zinc",
  grey: "cenușiu",
  olive: "oliv",
  colza: "rapiță",
  traffic: "trafic",
  ochre: "ocru",
  luminous: "luminos",
  melon: "pepene",
  broom: "grozamă",
  dahlia: "dalie",
  pastel: "pastel",
  pearl: "perlat",
  sun: "soare",
  yellow: "gălbui",
  red: "roșiatic",
  pure: "pur",
  bright: "aprins",
  deep: "intens",
  salmon: "somon",
  ral: "RAL",
  flame: "flacără",
  carmine: "carmin",
  ruby: "rubin",
  purple: "purpuriu",
  wine: "vin",
  black: "negricios",
  oxide: "oxid",
  beige: "bej",
  tomato: "tomată",
  antique: "antic",
  coral: "coral",
  strawberry: "căpșună",
  raspberry: "zmeură",
  orient: "oriental",
  heather: "erică",
  claret: "bordo",
  blue: "albăstrui",
  violet: "violet",
  ultramarine: "ultramarin",
  sapphire: "safir",
  brillant: "briliant",
  azure: "azur",
  gentian: "gențiană",
  steel: "oțel",
  cobalt: "cobalt",
  pigeon: "porumbel",
  sky: "cer",
  turquoise: "turcoaz",
  capri: "Capri",
  ocean: "ocean",
  water: "apă",
  night: "noapte",
  distant: "îndepărtat",
  patina: "patină",
  emerald: "smarald",
  leaf: "frunză",
  moss: "mușchi",
  bottle: "sticlă",
  fir: "brad",
  grass: "iarbă",
  reseda: "rezeda",
  reed: "stuf",
  may: "de mai",
  chrome: "crom",
  pale: "pal",
  fern: "ferigă",
  opal: "opal",
  pine: "pin",
  mint: "mentă",
  fibrous: "fibros",
  squirrel: "veveriță",
  silver: "argintiu",
  mouse: "șoarece",
  khaki: "kaki",
  tarpaulin: "prelată",
  iron: "fier",
  basalt: "bazalt",
  slate: "ardezie",
  anthracite: "antracit",
  umbra: "umbră",
  concrete: "beton",
  graphite: "grafit",
  granite: "granit",
  stone: "piatră",
  pebble: "pietriș",
  cement: "ciment",
  platinum: "platină",
  dusty: "praf",
  agate: "agat",
  quartz: "cuarț",
  window: "fereastră",
  silk: "mătase",
  clay: "lut",
  copper: "arămiu",
  fawn: "căprioară",
  nut: "nucă",
  sepia: "sepia",
  chestnut: "castaniu",
  mahogany: "mahon",
  chocolate: "ciocolată",
  orange: "portocaliu",
  terra: "terra",
  jet: "intens",
  white: "alb",
  cleanroom: "steril",
  papyrus: "papirus",
};

/** Names that are not „modifier + colour". */
const WHOLE: Record<string, string> = {
  curry: "Curry",
  vermilion: "Vermilion",
  rose: "Roz",
  telemagenta: "Telemagenta",
  cream: "Crem",
  "olive drab": "Oliv mat",
  "telegrey 1": "Telegri 1",
  "telegrey 2": "Telegri 2",
  "telegrey 4": "Telegri 4",
};

/** „Traffic white" → „Alb trafic"; null when a word is not in the dictionary. */
export function ralNameRo(english: string): string | null {
  const key = english.trim().toLowerCase();
  if (!key) return null;
  if (WHOLE[key]) return WHOLE[key];
  const words = key.split(/\s+/);
  // „Traffic grey A": the variant letter stays at the end
  const variant = words.length > 1 && /^[a-z0-9]$/.test(words[words.length - 1]) ? words.pop()!.toUpperCase() : null;
  const colour = COLOURS[words[words.length - 1]];
  if (!colour) return null;
  const rest: string[] = [];
  for (const word of words.slice(0, -1).reverse()) {
    const ro = MODIFIERS[word];
    if (!ro) return null;
    rest.push(ro);
  }
  return [colour, ...rest, ...(variant ? [variant] : [])].join(" ");
}

/** „RAL 9016 · Alb trafic", or the code alone when the name is unknown. */
export function ralLabel(ral: { code: string; name: string }): string {
  const name = ralNameRo(ral.name);
  return name ? `${ral.code} · ${name}` : ral.code;
}
