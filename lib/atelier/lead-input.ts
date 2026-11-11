import type { AtelierConfig, AtelierContact } from "./types";

/** Same limits as the CRM (lib/atelier/schema.ts there), so the CRM never rejects what we forward. */
export const CONTACT_LIMITS = { name: 100, phone: 30, city: 80, notes: 1000 } as const;
/** Upper bound for the forwarded / emailed configuration (a real one is ~1–2 KB). */
export const MAX_CONFIG_JSON_LENGTH = 50_000;

const LABELS: Record<keyof typeof CONTACT_LIMITS, string> = {
  name: "Numele",
  phone: "Telefonul",
  city: "Localitatea",
  notes: "Observațiile",
};

export type LeadInput =
  | { ok: true; contact: AtelierContact; config: AtelierConfig }
  | { ok: false; error: string };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Validates the public lead payload before it is forwarded to the CRM or emailed. Errors are in Romanian. */
export function parseLeadInput(payload: { config?: unknown; contact?: unknown }): LeadInput {
  const raw = (payload.contact && typeof payload.contact === "object" ? payload.contact : {}) as Record<string, unknown>;
  const fields = {
    name: text(raw.name),
    phone: text(raw.phone),
    city: text(raw.city),
    notes: text(raw.notes),
  };
  for (const key of Object.keys(CONTACT_LIMITS) as (keyof typeof CONTACT_LIMITS)[]) {
    if (fields[key].length > CONTACT_LIMITS[key]) {
      return { ok: false, error: `${LABELS[key]} este prea lung (maximum ${CONTACT_LIMITS[key]} de caractere).` };
    }
  }
  if (!fields.name || !fields.city || !payload.config || typeof payload.config !== "object") {
    return { ok: false, error: "Datele de contact sunt incomplete." };
  }
  if (fields.phone.replace(/\D/g, "").length < 6) {
    return { ok: false, error: "Numărul de telefon nu pare valid." };
  }
  if (JSON.stringify(payload.config).length > MAX_CONFIG_JSON_LENGTH) {
    return { ok: false, error: "Configurația este prea mare. Te rugăm să o simplifici sau să ne contactezi." };
  }
  const contact: AtelierContact = {
    name: fields.name,
    phone: fields.phone,
    city: fields.city,
    ...(fields.notes ? { notes: fields.notes } : {}),
  };
  return { ok: true, contact, config: payload.config as AtelierConfig };
}
