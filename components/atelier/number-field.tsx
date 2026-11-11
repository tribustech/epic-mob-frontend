"use client";

import { useState } from "react";

/**
 * A millimetre input that lets the customer type freely and only commits
 * (clamped to [min, max]) on blur or Enter, so half-typed values never reach
 * the reducer or the price API.
 */
export function NumberField({
  id,
  label,
  value,
  min,
  max,
  step = 10,
  onCommit,
  slider = false,
  disabled = false,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onCommit: (value: number) => void;
  slider?: boolean;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const parsed = Number(draft.replace(",", "."));
    setDraft(null);
    if (!Number.isFinite(parsed) || draft.trim() === "") return;
    const next = Math.min(max, Math.max(min, Math.round(parsed)));
    if (next !== value) onCommit(next);
  };

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="atelier-label">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={draft ?? String(value)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          className="atelier-input"
          disabled={disabled}
          aria-describedby={`${id}-range`}
        />
        <span className="shrink-0 text-sm text-[var(--home-ivory)]/55">mm</span>
      </div>
      {slider && (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Math.min(max, Math.max(min, value))}
          onChange={(e) => onCommit(Number(e.target.value))}
          className="atelier-range mt-3"
          disabled={disabled}
          aria-label={`${label} (glisor)`}
        />
      )}
      <p id={`${id}-range`} className="mt-1 text-xs text-[var(--home-ivory)]/60">
        {min}–{max} mm
      </p>
    </div>
  );
}
