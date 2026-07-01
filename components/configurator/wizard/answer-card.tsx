"use client";

import { Check } from "lucide-react";
import type { AnswerOption } from "@/lib/quote-wizard";

type AnswerCardProps = {
  option: AnswerOption;
  selected: boolean;
  onSelect: (id: string) => void;
  /** Multi-select cards show a check badge instead of auto-advancing. */
  multi?: boolean;
  /** Softer, reassuring styling for "Nu stiu inca" style answers. */
  soft?: boolean;
};

export function AnswerCard({ option, selected, onSelect, multi, soft }: AnswerCardProps) {
  const base =
    "group relative flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition duration-200 will-change-transform hover:-translate-y-0.5 sm:flex-col sm:items-start sm:gap-4 sm:p-6";

  const state = selected
    ? "border-terracotta bg-cream shadow-[0_12px_32px_rgba(192,106,62,0.18)] ring-1 ring-terracotta"
    : soft
      ? "border-dashed border-espresso/20 bg-transparent hover:border-espresso/40"
      : "border-espresso/10 bg-cream hover:border-terracotta/50 hover:shadow-[0_10px_28px_rgba(42,36,32,0.08)]";

  return (
    <button type="button" onClick={() => onSelect(option.id)} className={`${base} ${state}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/icons/streamline/${option.icon}`}
        alt=""
        aria-hidden="true"
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 sm:h-11 sm:w-11"
      />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-tight text-espresso">{option.label}</span>
        {option.hint ? (
          <span className="mt-1 block text-sm leading-snug text-espresso/55">{option.hint}</span>
        ) : null}
      </span>
      {multi ? (
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition sm:absolute sm:right-4 sm:top-4 ${
            selected
              ? "border-terracotta bg-terracotta text-cream"
              : "border-espresso/25 bg-transparent text-transparent"
          }`}
        >
          <Check size={12} strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}
