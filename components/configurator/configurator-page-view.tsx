"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  advancedDefaults,
  basicDefaults,
  buildProjectSummary,
  configuratorCatalog,
  ConfiguratorMode,
  ProjectSubmission,
} from "@/lib/configurator";
import { SectionHeading } from "@/components/section-heading";

type SubmissionState = {
  summary: string;
  whatsAppUrl: string;
  delivery: {
    mode: "preview-only";
  };
};

type BasicState = typeof basicDefaults;
type AdvancedState = typeof advancedDefaults;

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function chipClass(active: boolean) {
  return active
    ? "rounded-full bg-gold px-4 py-3 text-sm font-semibold text-navy shadow-[0_0_0_1px_rgba(243,198,35,0.22),0_12px_40px_rgba(243,198,35,0.14)]"
    : "rounded-full border border-navy/12 px-4 py-3 text-sm text-navy transition hover:bg-navy/5";
}

function PanelCard({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.8rem] border p-6 sm:p-7 ${
        active
          ? "border-gold bg-gold/16"
          : "border-navy/12 bg-white"
      }`}
    >
      {children}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  name,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm uppercase tracking-[0.18em] text-navy/40">
        {label}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 w-full rounded-2xl border border-navy/12 bg-bg px-4 py-4 text-navy outline-none transition placeholder:text-navy/40 focus:border-gold"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  name,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm uppercase tracking-[0.18em] text-navy/40">
        {label}
      </span>
      <textarea
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-3 w-full rounded-2xl border border-navy/12 bg-bg px-4 py-4 text-navy outline-none transition placeholder:text-navy/40 focus:border-gold"
      />
    </label>
  );
}

export function ConfiguratorPageView() {
  const [mode, setMode] = useState<ConfiguratorMode>("basic");
  const [basic, setBasic] = useState<BasicState>(basicDefaults);
  const [advanced, setAdvanced] = useState<AdvancedState>(advancedDefaults);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmissionState | null>(null);

  const activeState = mode === "basic" ? basic : advanced;

  const previewSummary = useMemo(() => {
    return buildProjectSummary(activeState as ProjectSubmission);
  }, [activeState]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = mode === "basic" ? basic : advanced;
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Cererea nu a putut fi trimisa.");
      }

      const data = (await response.json()) as SubmissionState;
      setResult(data);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "A aparut o problema neasteptata.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="section-shell section-space pt-32">
      <SectionHeading
        eyebrow="Configurator"
        title="Un brief premium, construit astfel incat sa ne spuna exact cat de aproape esti de proiectul ideal."
        description="Poti intra pe varianta Basic daca ai nevoie de ghidaj sau pe varianta Advanced daca ai deja camere, materiale, finisaje si detalii tehnice in minte."
      />
      <div className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-navy/8 bg-white p-6 shadow-card">
            <div className="inline-flex rounded-full border border-navy/12 bg-bg p-1">
              {configuratorCatalog.modes.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    setMode(entry.id);
                    setResult(null);
                    setError("");
                  }}
                  className={
                    mode === entry.id
                      ? "rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-navy"
                      : "rounded-full px-5 py-3 text-sm uppercase tracking-[0.18em] text-navy/60"
                  }
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-navy/60">
              {configuratorCatalog.modes.find((entry) => entry.id === mode)?.description}
            </p>
          </div>

          <PanelCard active>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">
              Previziune proiect
            </p>
            <pre className="mt-5 whitespace-pre-wrap text-sm leading-7 text-navy/60">
              {previewSummary}
            </pre>
          </PanelCard>

          {result ? (
            <PanelCard active>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                Cerere trimisa
              </p>
              <h2 className="mt-4 text-3xl text-navy">
                Atelier va analiza cererea si revine cu o discutie personalizata.
              </h2>
              <p className="mt-4 text-sm leading-7 text-navy/60">
                Livrarea este momentan setata in modul de preview pana conectam emailul final, dar rezumatul si pasul de WhatsApp sunt deja functionale.
              </p>
              <a
                href={result.whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-navy"
              >
                Continua pe WhatsApp
              </a>
            </PanelCard>
          ) : null}
        </aside>

        <form className="rounded-[2rem] border border-navy/8 bg-white p-6 shadow-card sm:p-8" onSubmit={handleSubmit}>
          {mode === "basic" ? (
            <div className="space-y-8">
              <PanelCard>
                <p className="text-sm uppercase tracking-[0.18em] text-navy/60">
                  1. Camere de mobilat
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {configuratorCatalog.roomTypes.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() =>
                        setBasic((current) => ({
                          ...current,
                          rooms: toggleValue(current.rooms, room.label),
                        }))
                      }
                      className={chipClass(basic.rooms.includes(room.label))}
                    >
                      {room.label}
                    </button>
                  ))}
                </div>
              </PanelCard>

              <div className="grid gap-6 sm:grid-cols-2">
                <InputField
                  label="Ai randari, schite sau masuratori?"
                  name="plansStatus"
                  value={basic.plansStatus}
                  onChange={(value) => setBasic((current) => ({ ...current, plansStatus: value }))}
                  placeholder="Ex: Da, randari de la designer"
                />
                <InputField
                  label="Linkuri Pinterest sau inspiratie"
                  name="inspirationLinks"
                  value={basic.inspirationLinks}
                  onChange={(value) =>
                    setBasic((current) => ({ ...current, inspirationLinks: value }))
                  }
                  placeholder="Ex: pinterest.com/..."
                />
                <InputField
                  label="Paleta sau culori care iti plac"
                  name="colorDirection"
                  value={basic.colorDirection}
                  onChange={(value) =>
                    setBasic((current) => ({ ...current, colorDirection: value }))
                  }
                  placeholder="Ex: tonuri calde, lemn + grafit"
                />
                <InputField
                  label="Electrocasnice deja alese?"
                  name="applianceStatus"
                  value={basic.applianceStatus}
                  onChange={(value) =>
                    setBasic((current) => ({ ...current, applianceStatus: value }))
                  }
                  placeholder="Ex: Da, deja cumparate"
                />
                <InputField
                  label="Stil dorit"
                  name="styleDirection"
                  value={basic.styleDirection}
                  onChange={(value) =>
                    setBasic((current) => ({ ...current, styleDirection: value }))
                  }
                  placeholder="Ex: modern premium"
                />
                <InputField
                  label="Deadline"
                  name="deadline"
                  value={basic.deadline}
                  onChange={(value) => setBasic((current) => ({ ...current, deadline: value }))}
                  placeholder="Ex: septembrie 2026"
                />
              </div>

              <TextAreaField
                label="Detalii suplimentare"
                name="notes"
                value={basic.notes}
                onChange={(value) => setBasic((current) => ({ ...current, notes: value }))}
                placeholder="Poti mentiona camerele, nevoile, stilul sau orice constrangere tehnica."
              />

              <div className="grid gap-6 sm:grid-cols-3">
                <InputField
                  label="Nume complet"
                  name="fullName"
                  value={basic.fullName}
                  onChange={(value) => setBasic((current) => ({ ...current, fullName: value }))}
                />
                <InputField
                  label="Telefon"
                  name="phone"
                  value={basic.phone}
                  onChange={(value) => setBasic((current) => ({ ...current, phone: value }))}
                />
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={basic.email}
                  onChange={(value) => setBasic((current) => ({ ...current, email: value }))}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <PanelCard>
                <p className="text-sm uppercase tracking-[0.18em] text-navy/60">
                  1. Camere si corpuri
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {configuratorCatalog.roomTypes.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() =>
                        setAdvanced((current) => ({
                          ...current,
                          rooms: toggleValue(current.rooms, room.label),
                        }))
                      }
                      className={chipClass(advanced.rooms.includes(room.label))}
                    >
                      {room.label}
                    </button>
                  ))}
                </div>
                <TextAreaField
                  label="Tipuri de corpuri si dimensiuni"
                  name="furnitureDetails"
                  value={advanced.furnitureDetails}
                  onChange={(value) =>
                    setAdvanced((current) => ({ ...current, furnitureDetails: value }))
                  }
                  placeholder="Ex: bucatarie in L, dressing pe perete de 4m, baie suspendata."
                />
              </PanelCard>

              <PanelCard>
                <p className="text-sm uppercase tracking-[0.18em] text-navy/60">
                  2. Materiale si finisaje
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {configuratorCatalog.materialFamilies.map((material) => (
                    <button
                      key={material.id}
                      type="button"
                      onClick={() =>
                        setAdvanced((current) => ({
                          ...current,
                          materials: toggleValue(current.materials, material.label),
                        }))
                      }
                      className={chipClass(advanced.materials.includes(material.label))}
                    >
                      {material.label}
                    </button>
                  ))}
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {configuratorCatalog.finishBrands.map((brand) => (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() =>
                        setAdvanced((current) => ({
                          ...current,
                          finishBrands: toggleValue(current.finishBrands, brand.label),
                        }))
                      }
                      className={
                        advanced.finishBrands.includes(brand.label)
                          ? "rounded-[1.4rem] border border-gold bg-gold/16 p-4 text-left"
                          : "rounded-[1.4rem] border border-navy/12 bg-bg p-4 text-left"
                      }
                    >
                      <p className="font-semibold text-navy">{brand.label}</p>
                      <p className="mt-2 text-sm leading-6 text-navy/60">
                        {brand.description}
                      </p>
                    </button>
                  ))}
                </div>
              </PanelCard>

              <PanelCard>
                <p className="text-sm uppercase tracking-[0.18em] text-navy/60">
                  3. Feronerie si iluminare
                </p>
                <p className="mt-3 text-sm leading-7 text-navy/60">
                  Feronerie Blum este pozitionata implicit ca standard premium.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {configuratorCatalog.lightingOptions.map((lighting) => (
                    <button
                      key={lighting.id}
                      type="button"
                      onClick={() =>
                        setAdvanced((current) => ({
                          ...current,
                          lighting: toggleValue(current.lighting, lighting.label),
                        }))
                      }
                      className={chipClass(advanced.lighting.includes(lighting.label))}
                    >
                      {lighting.label}
                    </button>
                  ))}
                </div>
              </PanelCard>

              <div className="grid gap-6 sm:grid-cols-2">
                <InputField
                  label="Electrocasnice si dimensiuni"
                  name="applianceDetails"
                  value={advanced.applianceDetails}
                  onChange={(value) =>
                    setAdvanced((current) => ({ ...current, applianceDetails: value }))
                  }
                  placeholder="Ex: cuptor incorporabil, frigider side-by-side"
                />
                <InputField
                  label="Deadline"
                  name="deadline"
                  value={advanced.deadline}
                  onChange={(value) =>
                    setAdvanced((current) => ({ ...current, deadline: value }))
                  }
                  placeholder="Ex: august 2026"
                />
              </div>

              <TextAreaField
                label="Linkuri, randari, referinte si note"
                name="references"
                value={advanced.references}
                onChange={(value) =>
                  setAdvanced((current) => ({ ...current, references: value }))
                }
                placeholder="Ex: links, materiale preferate, observatii de montaj"
              />

              <div className="grid gap-6 sm:grid-cols-3">
                <InputField
                  label="Nume complet"
                  name="fullName"
                  value={advanced.fullName}
                  onChange={(value) =>
                    setAdvanced((current) => ({ ...current, fullName: value }))
                  }
                />
                <InputField
                  label="Telefon"
                  name="phone"
                  value={advanced.phone}
                  onChange={(value) => setAdvanced((current) => ({ ...current, phone: value }))}
                />
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={advanced.email}
                  onChange={(value) => setAdvanced((current) => ({ ...current, email: value }))}
                />
              </div>
            </div>
          )}

          {error ? <p className="mt-6 text-sm text-[#ff9f7a]">{error}</p> : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-navy/12 pt-6">
            <p className="text-sm leading-7 text-navy/60">
              Dupa trimitere afisam rezumatul si continuam imediat pe WhatsApp.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-gold px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-navy transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Se trimite..." : "Trimite proiectul"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
