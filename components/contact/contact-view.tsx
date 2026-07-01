"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import {
  contactPreferenceOptions,
  isValidEmail,
  type ContactPreference,
} from "@/lib/quote-wizard";
import { contactDetails } from "@/lib/site-data";

const helpfulPoints = [
  "Ai deja randări, schițe sau măsurători?",
  "Ce camere vrei să mobilezi și în ce termen?",
  "Ai un stil, materiale sau culori în minte?",
  "Ai ales electrocasnicele sau le integrăm noi?",
];

type Status = "idle" | "sending" | "success" | "error";

export function ContactView() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preference, setPreference] = useState<ContactPreference | "">("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "sending") return;

    if (!name.trim() || !phone.trim()) {
      setError("Completează numele și un număr de telefon.");
      return;
    }
    if (email.trim() && !isValidEmail(email)) {
      setError("Adresa de email nu pare validă.");
      return;
    }

    setError(null);
    setStatus("sending");

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contact: {
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            preference,
            message: message.trim(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("request-failed");
      }

      const data = (await response.json()) as { whatsAppUrl?: string };
      setWhatsAppUrl(data.whatsAppUrl ?? null);
      setStatus("success");
    } catch {
      setStatus("error");
      setError(
        "Ceva nu a mers. Încearcă din nou sau scrie-ne direct pe WhatsApp.",
      );
    }
  }

  return (
    <div className="section-shell pb-28 pt-10 sm:pt-16 lg:pb-24">
      {/* Hero */}
      <header className="max-w-2xl">
        <p className="eyebrow-warm">Contact</p>
        <h1 className="display-font mt-4 text-[clamp(2.4rem,8vw,4rem)] leading-[1.05] text-espresso">
          Să vorbim despre casa ta.
        </h1>
        <p className="mt-5 text-lg leading-8 text-[var(--mocha-72)]">
          Scrie-ne câteva rânduri despre proiect sau sună-ne direct. Îți
          răspundem rapid și te ghidăm de la prima idee până la montaj.
        </p>
      </header>

      <div className="mt-12 grid gap-6 lg:mt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        {/* Form */}
        <section className="warm-card p-6 sm:p-9">
          {status === "success" ? (
            <div className="flex min-h-[22rem] flex-col items-center justify-center text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-[color-mix(in_srgb,var(--terracotta)_14%,var(--cream))] text-terracotta">
                <Check size={32} strokeWidth={2.5} />
              </span>
              <h2 className="display-font mt-6 text-3xl text-espresso">
                Mesajul a plecat!
              </h2>
              <p className="mt-3 max-w-sm text-base leading-7 text-[var(--mocha-72)]">
                Mulțumim, {name.split(" ")[0] || "dragă"}. Am primit detaliile și
                revenim în cel mai scurt timp.
              </p>
              {whatsAppUrl ? (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-warm btn-warm--primary mt-8"
                >
                  <MessageCircle size={18} strokeWidth={2} />
                  Continuă pe WhatsApp
                </a>
              ) : null}
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className="text-xl font-semibold text-espresso">
                Trimite-ne un mesaj
              </h2>
              <p className="mt-1.5 text-sm text-[var(--mocha-52)]">
                Câmpurile marcate cu * sunt obligatorii.
              </p>

              <div className="mt-7 grid gap-5">
                <div className="contact-field">
                  <label className="contact-label" htmlFor="contact-name">
                    Nume *
                  </label>
                  <input
                    id="contact-name"
                    className="contact-input"
                    type="text"
                    autoComplete="name"
                    placeholder="Cum te cheamă?"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="contact-field">
                    <label className="contact-label" htmlFor="contact-phone">
                      Telefon *
                    </label>
                    <input
                      id="contact-phone"
                      className="contact-input"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="07xx xxx xxx"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      required
                    />
                  </div>
                  <div className="contact-field">
                    <label className="contact-label" htmlFor="contact-email">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      className="contact-input"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="opțional"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </div>

                <div className="contact-field">
                  <span className="contact-label">Cum te contactăm?</span>
                  <div className="mt-1 flex flex-wrap gap-2.5">
                    {contactPreferenceOptions.map((option) => {
                      const active = preference === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={`contact-pref ${
                            active ? "contact-pref--active" : ""
                          }`}
                          aria-pressed={active}
                          onClick={() =>
                            setPreference(
                              active ? "" : (option.id as ContactPreference),
                            )
                          }
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="contact-field">
                  <label className="contact-label" htmlFor="contact-message">
                    Mesaj
                  </label>
                  <textarea
                    id="contact-message"
                    className="contact-input contact-textarea"
                    rows={4}
                    placeholder="Spune-ne pe scurt ce ai în minte — camere, stil, termen…"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                  />
                </div>
              </div>

              {error ? (
                <p className="mt-4 text-sm font-medium text-terracotta-deep">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="btn-warm btn-warm--primary mt-7 w-full justify-center sm:w-auto"
                disabled={status === "sending"}
              >
                {status === "sending" ? (
                  <>
                    <Loader2 size={18} strokeWidth={2} className="animate-spin" />
                    Se trimite…
                  </>
                ) : (
                  <>
                    Trimite mesajul
                    <ArrowRight size={18} strokeWidth={2} />
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        {/* Contact rail */}
        <aside className="grid content-start gap-6">
          <section className="warm-card p-6 sm:p-8">
            <p className="eyebrow-warm">Direct</p>
            <div className="mt-5 grid gap-3">
              <a className="contact-row" href={`tel:${contactDetails.phone}`}>
                <span className="contact-row__icon">
                  <Phone size={20} strokeWidth={2} />
                </span>
                <span className="contact-row__body">
                  <span className="contact-row__label">Sună-ne</span>
                  <span className="contact-row__value">
                    {contactDetails.phone}
                  </span>
                </span>
              </a>
              <a
                className="contact-row"
                href={`mailto:${contactDetails.email}`}
              >
                <span className="contact-row__icon">
                  <Mail size={20} strokeWidth={2} />
                </span>
                <span className="contact-row__body">
                  <span className="contact-row__label">Scrie-ne</span>
                  <span className="contact-row__value">
                    {contactDetails.email}
                  </span>
                </span>
              </a>
              <a
                className="contact-row contact-row--accent"
                href={contactDetails.whatsapp}
                target="_blank"
                rel="noreferrer"
              >
                <span className="contact-row__icon">
                  <MessageCircle size={20} strokeWidth={2} />
                </span>
                <span className="contact-row__body">
                  <span className="contact-row__label">WhatsApp</span>
                  <span className="contact-row__value">Răspuns rapid</span>
                </span>
                <ArrowRight
                  size={18}
                  strokeWidth={2}
                  className="contact-row__go"
                />
              </a>
            </div>
          </section>

          <section className="warm-card p-6 sm:p-8">
            <p className="eyebrow-warm">Ce ajută să știm</p>
            <ul className="mt-5 grid gap-3.5">
              {helpfulPoints.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 text-[0.95rem] leading-7 text-[var(--mocha-72)]"
                >
                  <Check
                    size={18}
                    strokeWidth={2.5}
                    className="mt-1 shrink-0 text-terracotta"
                  />
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href="/configurator"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-terracotta"
            >
              Prefer să răspund pas cu pas
              <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </section>

          <p className="flex items-center gap-2 px-1 text-sm text-[var(--mocha-52)]">
            <Clock size={16} strokeWidth={2} />
            Răspundem de obicei în aceeași zi lucrătoare.
          </p>
        </aside>
      </div>

      {/* Mobile sticky action bar */}
      <div className="contact-actionbar">
        <a
          className="contact-actionbar__ghost"
          href={`tel:${contactDetails.phone}`}
        >
          <Phone size={18} strokeWidth={2} />
          Sună
        </a>
        <a
          className="contact-actionbar__cta"
          href={contactDetails.whatsapp}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={18} strokeWidth={2} />
          WhatsApp
        </a>
      </div>
    </div>
  );
}
