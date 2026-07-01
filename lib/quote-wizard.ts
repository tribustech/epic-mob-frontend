// Data model + catalog for the friendly "Cere oferta" wizard.
// Every single-select field allows the NU_STIU sentinel so no step is a dead end.

export const NU_STIU = "nu-stiu";

export type AnswerOption = {
  id: string;
  label: string;
  /** SVG filename under /public/icons/streamline/ (Streamline Colors). */
  icon: string;
  hint?: string;
};

export type ContactPreference = "whatsapp" | "telefon" | "email";

export type QuoteFile = {
  url: string;
  name: string;
  size: number;
};

export type QuoteContact = {
  name: string;
  phone: string;
  email: string;
  preference: ContactPreference | "";
  /** Free-text note (used by the standalone contact form). */
  message?: string;
};

export type QuoteAnswers = {
  propertyType: string;
  spaceState: string;
  rooms: string[];
  plansStatus: string;
  files: QuoteFile[];
  style: string;
  // optional detail step
  materials: string[];
  finishes: string[];
  lighting: string[];
  timeline: string;
  contact: QuoteContact;
};

export const emptyAnswers: QuoteAnswers = {
  propertyType: "",
  spaceState: "",
  rooms: [],
  plansStatus: "",
  files: [],
  style: "",
  materials: [],
  finishes: [],
  lighting: [],
  timeline: "",
  contact: { name: "", phone: "", email: "", preference: "" },
};

const nuStiuOption: AnswerOption = {
  id: NU_STIU,
  label: "Nu știu încă",
  icon: "help.svg",
  hint: "Nicio problemă — te ghidăm noi.",
};

export const propertyTypes: AnswerOption[] = [
  { id: "apartament", label: "Apartament", icon: "apartment.svg" },
  { id: "casa", label: "Casă", icon: "house.svg" },
  { id: "birouri", label: "Spațiu birouri", icon: "office.svg" },
  { id: "comercial", label: "Centru comercial", icon: "mall.svg" },
  { id: "altceva", label: "Altceva", icon: "other.svg" },
];

export const spaceStates: AnswerOption[] = [
  { id: "gol", label: "Gol / nou", icon: "empty-room.svg", hint: "Spațiu liber, gata de mobilat." },
  {
    id: "mobilat",
    label: "Mobilat",
    icon: "old-furniture.svg",
    hint: "Trebuie evacuată mobila veche.",
  },
  { id: "santier", label: "În construcție", icon: "construction.svg", hint: "Încă în șantier." },
  nuStiuOption,
];

export const roomOptions: AnswerOption[] = [
  { id: "bucatarie", label: "Bucătărie", icon: "kitchen.svg" },
  { id: "dressing", label: "Dressing", icon: "wardrobe.svg" },
  { id: "living", label: "Living", icon: "living.svg" },
  { id: "dormitor", label: "Dormitor", icon: "bedroom.svg" },
  { id: "baie", label: "Baie", icon: "bathroom.svg" },
  { id: "birou", label: "Birou", icon: "desk.svg" },
  { id: "hol", label: "Hol", icon: "hallway.svg" },
  { id: "toata-casa", label: "Toată casa", icon: "whole-home.svg" },
  { id: "ajutati-ma", label: "Ajutați-mă să aleg", icon: "help.svg" },
];

/** Rooms that clear any other selection when picked. */
export const exclusiveRoomIds = ["toata-casa", "ajutati-ma"];

export const plansOptions: AnswerOption[] = [
  { id: "randari", label: "Da, randări de la designer", icon: "blueprint.svg" },
  { id: "aproximativ", label: "Dimensiuni aproximative", icon: "ruler.svg" },
  { id: "fara", label: "Nu, avem nevoie de măsurători", icon: "measure.svg" },
];

export const styleOptions: AnswerOption[] = [
  { id: "modern", label: "Modern minimalist", icon: "style-modern.svg" },
  { id: "cald", label: "Cald & natural", icon: "style-warm.svg" },
  { id: "clasic", label: "Clasic elegant", icon: "style-classic.svg" },
  { id: "industrial", label: "Industrial", icon: "style-industrial.svg" },
  { id: NU_STIU, label: "Nu știu, arătați-mi idei", icon: "help.svg" },
];

export const materialOptions: AnswerOption[] = [
  { id: "pal", label: "PAL", icon: "material-pal.svg" },
  { id: "mdf-vopsit", label: "MDF vopsit", icon: "material-mdf.svg" },
  { id: "pal-mdf", label: "PAL + fronturi MDF", icon: "material-mix.svg" },
  { id: "furnir", label: "Furnir natural", icon: "material-veneer.svg" },
];

export const finishOptions: AnswerOption[] = [
  { id: "egger", label: "Egger", icon: "finish-egger.svg" },
  { id: "agt", label: "AGT", icon: "finish-agt.svg" },
  { id: "mat", label: "Vopsit mat", icon: "finish-matte.svg" },
  { id: "lucios", label: "Lucios", icon: "finish-gloss.svg" },
];

export const lightingOptions: AnswerOption[] = [
  { id: "fara", label: "Fără LED", icon: "light-off.svg" },
  { id: "cald", label: "Alb cald", icon: "light-warm.svg" },
  { id: "rece", label: "Alb rece", icon: "light-cool.svg" },
  { id: "senzor", label: "Cu senzor", icon: "light-sensor.svg" },
  { id: "rgb", label: "Colorată", icon: "light-rgb.svg" },
];

export const timelineOptions: AnswerOption[] = [
  { id: "urgent", label: "Cât mai repede", icon: "clock-fast.svg" },
  { id: "1-3", label: "1 – 3 luni", icon: "calendar.svg" },
  { id: "3-6", label: "3 – 6 luni", icon: "calendar-long.svg" },
  { id: "info", label: "Doar mă informez", icon: "info.svg" },
];

export const contactPreferenceOptions: AnswerOption[] = [
  { id: "whatsapp", label: "WhatsApp", icon: "whatsapp.svg" },
  { id: "telefon", label: "Telefon", icon: "phone.svg" },
  { id: "email", label: "Email", icon: "mail.svg" },
];

export type StepId =
  | "propertyType"
  | "spaceState"
  | "rooms"
  | "plans"
  | "style"
  | "details"
  | "timeline"
  | "contact"
  | "summary";

export const stepOrder: StepId[] = [
  "propertyType",
  "spaceState",
  "rooms",
  "plans",
  "style",
  "details",
  "timeline",
  "contact",
  "summary",
];

export const totalSteps = stepOrder.length;

// ── Helpers ────────────────────────────────────────────────────────────────

export function labelFor(options: AnswerOption[], id: string): string {
  return options.find((option) => option.id === id)?.label ?? "";
}

export function labelsFor(options: AnswerOption[], ids: string[]): string {
  const labels = ids.map((id) => labelFor(options, id)).filter(Boolean);
  return labels.length > 0 ? labels.join(", ") : "";
}

const NE_CONSULTAM = "Ne consultăm împreună";

function orConsult(value: string): string {
  return value && value !== NU_STIU ? value : NE_CONSULTAM;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ── Summary (plain text — used for WhatsApp + email fallback) ────────────────

export function buildQuoteSummary(answers: QuoteAnswers): string {
  const lines: string[] = [
    `Tip imobil: ${orConsult(labelFor(propertyTypes, answers.propertyType))}`,
    `Starea spațiului: ${orConsult(labelFor(spaceStates, answers.spaceState))}`,
    `Camere: ${orConsult(labelsFor(roomOptions, answers.rooms))}`,
    `Schițe / măsurători: ${orConsult(labelFor(plansOptions, answers.plansStatus))}`,
    `Stil: ${orConsult(labelFor(styleOptions, answers.style))}`,
  ];

  const materials = labelsFor(materialOptions, answers.materials);
  const finishes = labelsFor(finishOptions, answers.finishes);
  const lighting = labelsFor(lightingOptions, answers.lighting);
  if (materials) lines.push(`Materiale: ${materials}`);
  if (finishes) lines.push(`Finisaje: ${finishes}`);
  if (lighting) lines.push(`Iluminare: ${lighting}`);

  lines.push(`Termen: ${orConsult(labelFor(timelineOptions, answers.timeline))}`);

  if (answers.files.length > 0) {
    lines.push(`Fișiere (${answers.files.length}):`);
    for (const file of answers.files) {
      lines.push(`  - ${file.name}: ${file.url}`);
    }
  }

  lines.push(
    "",
    `Nume: ${answers.contact.name}`,
    `Telefon: ${answers.contact.phone}`,
    `Email: ${answers.contact.email}`,
    `Preferință contact: ${labelFor(contactPreferenceOptions, answers.contact.preference) || "oricare"}`,
  );

  if (answers.contact.message) {
    lines.push("", `Mesaj: ${answers.contact.message}`);
  }

  return lines.join("\n");
}

/** True if the user has filled in anything at all (to skip empty drafts). */
export function hasAnyAnswer(answers: QuoteAnswers): boolean {
  return Boolean(
    answers.propertyType ||
      answers.spaceState ||
      answers.rooms.length ||
      answers.plansStatus ||
      answers.files.length ||
      answers.style ||
      answers.materials.length ||
      answers.finishes.length ||
      answers.lighting.length ||
      answers.timeline ||
      answers.contact.name ||
      answers.contact.phone ||
      answers.contact.email,
  );
}

/** Flat, human-readable record of the answers — one row per Google Sheet entry. */
export function buildQuoteRecord(answers: QuoteAnswers): Record<string, string | number> {
  return {
    propertyType: labelFor(propertyTypes, answers.propertyType),
    spaceState: labelFor(spaceStates, answers.spaceState),
    rooms: labelsFor(roomOptions, answers.rooms),
    plansStatus: labelFor(plansOptions, answers.plansStatus),
    style: labelFor(styleOptions, answers.style),
    materials: labelsFor(materialOptions, answers.materials),
    finishes: labelsFor(finishOptions, answers.finishes),
    lighting: labelsFor(lightingOptions, answers.lighting),
    timeline: labelFor(timelineOptions, answers.timeline),
    name: answers.contact.name,
    phone: answers.contact.phone,
    email: answers.contact.email,
    message: answers.contact.message ?? "",
    contactPreference: labelFor(contactPreferenceOptions, answers.contact.preference),
    filesCount: answers.files.length,
    fileUrls: answers.files.map((file) => file.url).join(", "),
  };
}

// ── Server-side validation / normalization ───────────────────────────────────

function toStringSafe(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeFiles(value: unknown): QuoteFile[] {
  if (!Array.isArray(value)) return [];
  const files: QuoteFile[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Record<string, unknown>;
    const url = toStringSafe(candidate.url);
    const name = toStringSafe(candidate.name);
    if (!url || !name) continue;
    files.push({
      url,
      name,
      size: typeof candidate.size === "number" ? candidate.size : 0,
    });
  }
  return files;
}

/** Parse an untrusted payload into QuoteAnswers, or null if contact is invalid. */
export function parseQuoteAnswers(payload: unknown): QuoteAnswers | null {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as Record<string, unknown>;
  const contactRaw =
    candidate.contact && typeof candidate.contact === "object"
      ? (candidate.contact as Record<string, unknown>)
      : {};

  const preference = toStringSafe(contactRaw.preference);
  const answers: QuoteAnswers = {
    propertyType: toStringSafe(candidate.propertyType),
    spaceState: toStringSafe(candidate.spaceState),
    rooms: toStringArray(candidate.rooms),
    plansStatus: toStringSafe(candidate.plansStatus),
    files: normalizeFiles(candidate.files),
    style: toStringSafe(candidate.style),
    materials: toStringArray(candidate.materials),
    finishes: toStringArray(candidate.finishes),
    lighting: toStringArray(candidate.lighting),
    timeline: toStringSafe(candidate.timeline),
    contact: {
      name: toStringSafe(contactRaw.name),
      phone: toStringSafe(contactRaw.phone),
      email: toStringSafe(contactRaw.email),
      message: toStringSafe(contactRaw.message),
      preference:
        preference === "whatsapp" || preference === "telefon" || preference === "email"
          ? preference
          : "",
    },
  };

  // Friendly: only name + phone are required. Email is optional, but if the
  // user typed one it must look valid.
  if (!answers.contact.name || !answers.contact.phone) {
    return null;
  }
  if (answers.contact.email && !isValidEmail(answers.contact.email)) {
    return null;
  }

  return answers;
}
