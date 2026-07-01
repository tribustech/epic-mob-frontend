"use client";

import { Pencil } from "lucide-react";
import { WizardFooterBar } from "./wizard-footer-bar";
import {
  contactPreferenceOptions,
  finishOptions,
  labelFor,
  labelsFor,
  lightingOptions,
  materialOptions,
  NU_STIU,
  plansOptions,
  propertyTypes,
  roomOptions,
  spaceStates,
  styleOptions,
  timelineOptions,
  type AnswerOption,
  type QuoteAnswers,
} from "@/lib/quote-wizard";

const CONSULT = "Ne consultăm împreună";

function single(options: AnswerOption[], id: string): string {
  return id && id !== NU_STIU ? labelFor(options, id) || CONSULT : CONSULT;
}

function multi(options: AnswerOption[], ids: string[]): string {
  const label = labelsFor(options, ids);
  return label || CONSULT;
}

type Row = { label: string; value: string; step: number };

type SummaryStepProps = {
  answers: QuoteAnswers;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string;
};

export function SummaryStep({ answers, onEdit, onSubmit, submitting, error }: SummaryStepProps) {
  const rows: Row[] = [
    { label: "Tip imobil", value: single(propertyTypes, answers.propertyType), step: 0 },
    { label: "Starea spațiului", value: single(spaceStates, answers.spaceState), step: 1 },
    { label: "Camere", value: multi(roomOptions, answers.rooms), step: 2 },
    { label: "Schițe / măsurători", value: single(plansOptions, answers.plansStatus), step: 3 },
    { label: "Stil", value: single(styleOptions, answers.style), step: 4 },
  ];

  const detailBits = [
    labelsFor(materialOptions, answers.materials),
    labelsFor(finishOptions, answers.finishes),
    labelsFor(lightingOptions, answers.lighting),
  ].filter(Boolean);
  if (detailBits.length > 0) {
    rows.push({ label: "Detalii", value: detailBits.join(" · "), step: 5 });
  }

  rows.push({ label: "Termen", value: single(timelineOptions, answers.timeline), step: 6 });

  if (answers.files.length > 0) {
    rows.push({
      label: "Fișiere",
      value: `${answers.files.length} atașate`,
      step: 3,
    });
  }

  const contactValue = [
    answers.contact.name,
    answers.contact.phone,
    answers.contact.email,
    labelFor(contactPreferenceOptions, answers.contact.preference),
  ]
    .filter(Boolean)
    .join(" · ");
  rows.push({ label: "Contact", value: contactValue || "—", step: 7 });

  return (
    <div className="flex flex-col">
      <p className="eyebrow-warm">Aproape gata</p>
      <h2 className="display-font mt-4 text-[clamp(1.9rem,4vw,3rem)] leading-[1.08] text-espresso">
        Hai să verificăm împreună.
      </h2>
      <p className="mt-4 max-w-xl text-lg leading-8 text-espresso/60">
        Poți edita orice răspuns înainte de a trimite. Îți trimitem rezumatul și pe email.
      </p>

      <dl className="mt-9 divide-y divide-espresso/10 overflow-hidden rounded-2xl border border-espresso/10 bg-cream">
        {rows.map((row, index) => (
          <div key={`${row.label}-${index}`} className="flex items-center gap-4 p-4 sm:px-6">
            <dt className="w-32 shrink-0 text-sm font-medium uppercase tracking-wide text-espresso/45">
              {row.label}
            </dt>
            <dd className="min-w-0 flex-1 text-espresso">{row.value}</dd>
            <button
              type="button"
              onClick={() => onEdit(row.step)}
              aria-label={`Editează ${row.label}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-espresso/40 transition hover:bg-sand hover:text-terracotta"
            >
              <Pencil size={15} />
            </button>
          </div>
        ))}
      </dl>

      {error ? <p className="mt-5 text-sm text-terracotta-deep">{error}</p> : null}

      {/* Spacer so the recap clears the fixed bar. */}
      <div className="h-24" aria-hidden />
      <WizardFooterBar>
        <div className="flex items-center justify-end gap-4 sm:justify-between">
          <p className="hidden text-sm text-espresso/55 sm:block">
            Fără obligații. Răspundem în cel mai scurt timp.
          </p>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="btn-warm btn-warm--primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Se trimite..." : "Trimite cererea"}
          </button>
        </div>
      </WizardFooterBar>
    </div>
  );
}
