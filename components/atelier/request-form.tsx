"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { AtelierConfig, AtelierIssue } from "@/lib/atelier/types";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success"; key: string }
  | { kind: "error"; message: string; issues?: AtelierIssue[] };

const UNAVAILABLE_MESSAGE =
  "Momentan nu putem primi cererea online. Te rugăm să încerci din nou puțin mai târziu sau să ne scrii din pagina Cere ofertă.";

export function RequestForm({ config, blocked }: { config: AtelierConfig; blocked: boolean }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const configKey = JSON.stringify(config);

  // A sent request only "sticks" for the configuration it was sent with; changing
  // the configuration brings the form back so another one can be sent.
  if (status.kind === "success" && status.key === configKey) {
    return (
      <section className="atelier-panel border-emerald-400/40" aria-live="polite">
        <p className="flex items-center gap-3 text-lg text-emerald-300">
          <CheckCircle2 aria-hidden="true" className="shrink-0" />
          Mulțumim! Te sunăm în curând pentru măsurători.
        </p>
        <button
          type="button"
          className="atelier-chip mt-4"
          onClick={() => setStatus({ kind: "idle" })}
        >
          Trimite altă configurație
        </button>
      </section>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blocked || status.kind === "sending") return;
    const data = new FormData(event.currentTarget);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    const contact = {
      name: field("name"),
      phone: field("phone"),
      city: field("city"),
      ...(field("notes") ? { notes: field("notes") } : {}),
    };
    if (!contact.name || !contact.city || contact.phone.replace(/\D/g, "").length < 6) {
      setStatus({ kind: "error", message: "Completează numele, un număr de telefon valid și orașul." });
      return;
    }

    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/atelier/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, contact, website: field("website") }),
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        errors?: AtelierIssue[];
      } | null;
      if (res.ok && body?.ok) {
        setStatus({ kind: "success", key: configKey });
      } else if (res.status === 422 && Array.isArray(body?.errors)) {
        setStatus({ kind: "error", message: "Configurația are nevoie de ajustări:", issues: body.errors });
      } else if (res.status === 429) {
        setStatus({ kind: "error", message: "Prea multe cereri. Încearcă din nou mai târziu." });
      } else if (res.status === 503) {
        setStatus({ kind: "error", message: UNAVAILABLE_MESSAGE });
      } else {
        setStatus({
          kind: "error",
          message: typeof body?.error === "string" ? body.error : "Cererea nu a putut fi trimisă. Verifică datele și încearcă din nou.",
        });
      }
    } catch {
      setStatus({ kind: "error", message: UNAVAILABLE_MESSAGE });
    }
  }

  const sending = status.kind === "sending";

  return (
    <section className="atelier-panel" aria-labelledby="atelier-request">
      <h2 id="atelier-request" className="atelier-panel__title">
        Trimite configurația
      </h2>
      <p className="mt-1 text-sm text-[var(--home-ivory)]/60">
        Te sunăm, venim la măsurători și îți confirmăm prețul final. Fără obligații.
      </p>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit} noValidate>
        <div className="min-w-0">
          <label htmlFor="atelier-name" className="atelier-label">
            Nume
          </label>
          <input id="atelier-name" name="name" required maxLength={100} autoComplete="name" className="atelier-input mt-2" />
        </div>
        <div className="min-w-0">
          <label htmlFor="atelier-phone" className="atelier-label">
            Telefon
          </label>
          <input
            id="atelier-phone"
            name="phone"
            type="tel"
            required
            maxLength={30}
            autoComplete="tel"
            inputMode="tel"
            className="atelier-input mt-2"
          />
        </div>
        <div className="min-w-0 sm:col-span-2">
          <label htmlFor="atelier-city" className="atelier-label">
            Oraș
          </label>
          <input
            id="atelier-city"
            name="city"
            required
            maxLength={80}
            autoComplete="address-level2"
            className="atelier-input mt-2"
          />
        </div>
        <div className="min-w-0 sm:col-span-2">
          <label htmlFor="atelier-notes" className="atelier-label">
            Observații (opțional)
          </label>
          <textarea id="atelier-notes" name="notes" rows={3} maxLength={1000} className="atelier-input mt-2 resize-y" />
        </div>
        {/* Honeypot: hidden from people, bots tend to fill it. */}
        <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label htmlFor="atelier-website">Website</label>
          <input id="atelier-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {status.kind === "error" && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300 sm:col-span-2" role="alert">
            <p>{status.message}</p>
            {status.issues && (
              <ul className="mt-1 list-disc pl-5">
                {status.issues.map((issue, i) => (
                  <li key={`${issue.code}-${i}`}>{issue.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="portfolio-btn portfolio-btn--primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            disabled={blocked || sending}
          >
            {sending ? "Se trimite…" : "Trimite cererea"}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          {blocked && (
            <p className="mt-2 text-xs text-red-300">Corectează erorile de mai sus ca să poți trimite cererea.</p>
          )}
        </div>
      </form>
    </section>
  );
}
