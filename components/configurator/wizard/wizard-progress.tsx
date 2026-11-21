"use client";

import { ArrowLeft } from "lucide-react";
import { totalSteps } from "@/lib/quote-wizard";

type WizardProgressProps = {
  /** Zero-based index of the active step. */
  current: number;
  onBack: () => void;
};

export function WizardProgress({ current, onBack }: WizardProgressProps) {
  return (
    <div className="flex items-center gap-4">
      {current > 0 ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Înapoi la pasul anterior"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-espresso/15 text-espresso transition hover:border-espresso/40"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
      ) : null}

      <div
        className="flex flex-1 items-center gap-1.5"
        role="progressbar"
        aria-label="Progresul cererii de ofertă"
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuetext={`Pasul ${current + 1} din ${totalSteps}`}
      >
        {Array.from({ length: totalSteps }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              index <= current ? "bg-terracotta" : "bg-espresso/25"
            }`}
          />
        ))}
      </div>

      <span className="shrink-0 text-sm font-medium text-espresso/75" aria-hidden="true">
        Pasul {current + 1} din {totalSteps}
      </span>
    </div>
  );
}
