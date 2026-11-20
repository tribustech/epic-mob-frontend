"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { getFunnelSessionId, trackFunnel, trackFunnelOnce } from "@/lib/atelier/funnel";
import type { AtelierConfig, AtelierIssue } from "@/lib/atelier/types";
import { trackPixel } from "@/lib/meta-pixel";
import type { LeadContact } from "./session";
import { issueMessage } from "./ui";

export type LeadStatus =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success"; key: string }
  | { kind: "error"; message: string; issues?: AtelierIssue[] };

/** The submit button lives in the configurator's footer and points at this form by id. */
export const REQUEST_FORM_ID = "atelier-request-form";

const UNAVAILABLE_MESSAGE =
  "Momentan nu putem primi cererea online. Te rugăm să încerci din nou puțin mai târziu sau să ne scrii din pagina Cere ofertă.";

/** A sent request only „sticks" for the configuration it was sent with. */
export function leadSentFor(status: LeadStatus, config: AtelierConfig): boolean {
  return status.kind === "success" && status.key === JSON.stringify(config);
}

type FieldKey = "name" | "phone" | "city";
const FIELD_ORDER: readonly FieldKey[] = ["name", "phone", "city"];

/** What is wrong with each contact field (empty object = ready to send). */
export function contactErrors(contact: { name: string; phone: string; city: string }): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  if (!contact.name.trim()) errors.name = "Scrie numele tău.";
  const phone = contact.phone.trim();
  const digits = phone.replace(/\D/g, "").length;
  if (!phone) errors.phone = "Scrie un număr de telefon.";
  else if (!/^\+?[\d\s().\-/]+$/.test(phone) || digits < 7 || digits > 15)
    errors.phone = "Numărul nu pare valid. Exemplu: 0722 123 456.";
  if (!contact.city.trim()) errors.city = "Scrie orașul.";
  return errors;
}

export function LeadSent({ onAgain }: { onAgain: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  // the form (and the focused submit button) is gone: move focus to the confirmation
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div ref={ref} tabIndex={-1} className="atelier-sent" role="status">
      <CheckCircle2 size={28} aria-hidden="true" className="shrink-0" />
      <div>
        <p className="atelier-sent__title">Mulțumim! Am primit configurația.</p>
        <p className="atelier-sent__text">Te sunăm în curând ca să stabilim măsurătorile.</p>
        <button type="button" className="atelier-textbtn mt-2" onClick={onAgain}>
          Începe o configurație nouă
        </button>
      </div>
    </div>
  );
}

export function RequestForm({
  config,
  blocked,
  unavailable,
  contact: typed,
  onContact,
  price,
  status,
  onStatus,
}: {
  config: AtelierConfig;
  blocked: boolean;
  /** the price service is down: nothing can be sent for now */
  unavailable: boolean;
  /** the fields live in the configurator, so leaving this step does not lose them */
  contact: LeadContact;
  onContact: (contact: LeadContact) => void;
  /** the estimate on screen when the request is sent (funnel only) */
  price: number | null;
  status: LeadStatus;
  onStatus: (status: LeadStatus) => void;
}) {
  const configKey = JSON.stringify(config);
  const errorRef = useRef<HTMLDivElement>(null);
  const errorMessage = status.kind === "error" ? status.message : null;
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const edit = (key: keyof LeadContact, value: string) => {
    onContact({ ...typed, [key]: value });
    // the reason goes away as soon as the client starts fixing the field
    if (key !== "notes" && fieldErrors[key]) setFieldErrors((errors) => ({ ...errors, [key]: undefined }));
  };

  // the submit button sits in the footer: bring a fresh error into view
  useEffect(() => {
    if (errorMessage) errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [errorMessage]);

  // Sent: the confirmation (LeadSent) takes the form's place at the top of the step.
  // Changing the configuration brings the form back so another one can be sent.
  if (status.kind === "success" && status.key === configKey) return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blocked || unavailable || status.kind === "sending") return;
    const website = String(new FormData(event.currentTarget).get("website") ?? "").trim();
    const notes = typed.notes.trim();
    const contact = {
      name: typed.name.trim(),
      phone: typed.phone.trim(),
      city: typed.city.trim(),
      ...(notes ? { notes } : {}),
    };
    const invalid = contactErrors(contact);
    setFieldErrors(invalid);
    const first = FIELD_ORDER.find((key) => invalid[key]);
    if (first) {
      if (status.kind === "error") onStatus({ kind: "idle" });
      // every attempt: take the client to the first field that needs fixing
      const field = document.getElementById(`atelier-${first}`);
      field?.focus({ preventScroll: true });
      field?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    onStatus({ kind: "sending" });
    const fail = (next: LeadStatus) => {
      trackFunnel("lead_failed");
      onStatus(next);
    };
    try {
      const res = await fetch("/api/atelier/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, contact, website, sessionId: getFunnelSessionId() }),
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        errors?: AtelierIssue[];
      } | null;
      if (res.ok && body?.ok) {
        trackFunnel("lead_submitted", { price: price == null ? null : Math.round(price) });
        try {
          trackPixel("Lead", { content_name: "atelier" });
        } catch {
          // the pixel must never break a sent request
        }
        onStatus({ kind: "success", key: configKey });
      } else if (res.status === 422 && Array.isArray(body?.errors)) {
        fail({ kind: "error", message: "Configurația are nevoie de ajustări:", issues: body.errors });
      } else if (res.status === 429) {
        fail({ kind: "error", message: "Prea multe cereri. Încearcă din nou mai târziu." });
      } else if (res.status === 503) {
        fail({ kind: "error", message: UNAVAILABLE_MESSAGE });
      } else {
        fail({
          kind: "error",
          message: typeof body?.error === "string" ? body.error : "Cererea nu a putut fi trimisă. Verifică datele și încearcă din nou.",
        });
      }
    } catch {
      fail({ kind: "error", message: UNAVAILABLE_MESSAGE });
    }
  }

  return (
    <form
      id={REQUEST_FORM_ID}
      className="atelier-form"
      onSubmit={onSubmit}
      onFocus={() => trackFunnelOnce("form_started")}
      noValidate
    >
      <div className="atelier-form__field">
        <label htmlFor="atelier-name" className="atelier-label">
          Nume
        </label>
        <input
          id="atelier-name"
          name="name"
          value={typed.name}
          onChange={(e) => edit("name", e.target.value)}
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? "atelier-name-error" : undefined}
          required
          maxLength={100}
          autoComplete="name"
          className="atelier-input"
        />
        {fieldErrors.name && (
          <p id="atelier-name-error" className="atelier-form__error">
            {fieldErrors.name}
          </p>
        )}
      </div>
      <div className="atelier-form__field">
        <label htmlFor="atelier-phone" className="atelier-label">
          Telefon
        </label>
        <input
          id="atelier-phone"
          name="phone"
          type="tel"
          value={typed.phone}
          onChange={(e) => edit("phone", e.target.value)}
          aria-invalid={fieldErrors.phone ? true : undefined}
          aria-describedby={fieldErrors.phone ? "atelier-phone-error" : undefined}
          required
          maxLength={30}
          autoComplete="tel"
          inputMode="tel"
          className="atelier-input"
        />
        {fieldErrors.phone && (
          <p id="atelier-phone-error" className="atelier-form__error">
            {fieldErrors.phone}
          </p>
        )}
      </div>
      <div className="atelier-form__field atelier-form__wide">
        <label htmlFor="atelier-city" className="atelier-label">
          Oraș
        </label>
        <input
          id="atelier-city"
          name="city"
          value={typed.city}
          onChange={(e) => edit("city", e.target.value)}
          aria-invalid={fieldErrors.city ? true : undefined}
          aria-describedby={fieldErrors.city ? "atelier-city-error" : undefined}
          required
          maxLength={80}
          autoComplete="address-level2"
          className="atelier-input"
        />
        {fieldErrors.city && (
          <p id="atelier-city-error" className="atelier-form__error">
            {fieldErrors.city}
          </p>
        )}
      </div>
      <div className="atelier-form__field atelier-form__wide">
        <label htmlFor="atelier-notes" className="atelier-label">
          Observații <span className="font-normal opacity-70">(opțional)</span>
        </label>
        <textarea
          id="atelier-notes"
          name="notes"
          value={typed.notes}
          onChange={(e) => onContact({ ...typed, notes: e.target.value })}
          rows={2}
          maxLength={1000}
          className="atelier-input resize-y"
          placeholder="Ex.: nișă între doi pereți, tavan înclinat…"
        />
      </div>
      {/* Honeypot: hidden from people, bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="atelier-website">Website</label>
        <input id="atelier-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status.kind === "error" && (
        <div ref={errorRef} className="atelier-issue atelier-issue--error atelier-form__wide" role="alert">
          <p>{status.message}</p>
          {status.issues && (
            <ul className="mt-1 list-disc pl-5">
              {status.issues.map((issue, i) => (
                <li key={`${issue.code}-${i}`}>{issueMessage(issue.message, config.category === "DRESSING")}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {unavailable && !blocked && (
        <p className="atelier-issue atelier-issue--error atelier-form__wide">
          Momentan nu putem calcula prețul, așa că cererea nu poate fi trimisă de aici. Încearcă din nou peste câteva
          minute sau scrie-ne din pagina Cere ofertă.
        </p>
      )}
      {blocked && (
        <p className="atelier-issue atelier-issue--error atelier-form__wide">
          Corectează mai întâi configurația (vezi mesajul de lângă preț), apoi poți trimite cererea.
        </p>
      )}
    </form>
  );
}
