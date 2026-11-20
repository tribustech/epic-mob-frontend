"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Check, Minus, Plus } from "lucide-react";

const priceFormat = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 });

export function formatLei(value: number): string {
  return `${priceFormat.format(Math.round(value))} lei`;
}

/** Millimetres shown as centimetres with a Romanian decimal comma: 2400 → „240", 2405 → „240,5". */
export function cm(mm: number): string {
  const v = Math.round(mm) / 10;
  return (Number.isInteger(v) ? String(v) : v.toFixed(1)).replace(".", ",");
}

/** „240 cm" typed by a client → millimetres (null when it is not a number). */
export function parseCm(text: string): number | null {
  // „240", „240,5", „240 cm", „2,4 m", „2400 mm" — the unit is optional and centimetres by default
  const match = /^([0-9]+(?:[.,][0-9]*)?|[.,][0-9]+)\s*(cm|mm|m)?\.?$/i.exec(text.trim());
  if (!match) return null;
  const v = Number(match[1].replace(",", "."));
  if (!Number.isFinite(v)) return null;
  const unit = (match[2] ?? "cm").toLowerCase();
  return Math.round(unit === "m" ? v * 1000 : unit === "mm" ? v : v * 10);
}

/** „W1000 ST9 · Alb Premium" → „Alb Premium" (the catalog name leads with the decor code). */
export function decorTitle(name: string): string {
  const at = name.indexOf(" · ");
  if (/^(MDF vopsit )?RAL\b/.test(name)) return name;
  return at > 0 && at < name.length - 3 ? name.slice(at + 3) : name;
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** The orange tick shown on the selected card / swatch. */
export function SelectedMark({ className = "" }: { className?: string }) {
  return (
    <span className={`atelier-mark ${className}`} aria-hidden="true">
      <Check size={12} strokeWidth={3} />
    </span>
  );
}

export function Section({
  title,
  hint,
  action,
  children,
  className = "",
}: {
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`atelier-section ${className}`}>
      <div className="atelier-section__head">
        <div className="min-w-0">
          <h2 className="atelier-section__title">{title}</h2>
          {hint && <p className="atelier-hint mt-0.5">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const RADIO = '[role="radio"]:not(:disabled)';

/**
 * A radio group that is one tab stop: Tab lands on the chosen option (or the first), the arrow
 * keys move between options. With `selectOnArrow` the arrows also choose (short lists of chips);
 * without it they only move focus and Space / Enter chooses (long lists of pictures).
 */
export function RadioGroup({
  label,
  selectOnArrow = false,
  className,
  children,
}: {
  label: string;
  selectOnArrow?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // after every render: exactly one option is reachable with Tab
  useEffect(() => {
    const radios = [...(ref.current?.querySelectorAll<HTMLElement>('[role="radio"]') ?? [])];
    const enabled = radios.filter((r) => !r.hasAttribute("disabled"));
    const stop =
      enabled.find((r) => r === document.activeElement) ??
      enabled.find((r) => r.getAttribute("aria-checked") === "true") ??
      enabled[0];
    for (const r of radios) r.tabIndex = r === stop ? 0 : -1;
  });
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (dir === 0 && e.key !== "Home" && e.key !== "End") return;
    const radios = [...e.currentTarget.querySelectorAll<HTMLElement>(RADIO)];
    const at = radios.indexOf(document.activeElement as HTMLElement);
    if (at < 0 || radios.length === 0) return;
    e.preventDefault();
    const next =
      e.key === "Home" ? radios[0] : e.key === "End" ? radios[radios.length - 1] : radios[(at + dir + radios.length) % radios.length];
    for (const r of radios) r.tabIndex = r === next ? 0 : -1;
    next.focus();
    if (selectOnArrow) next.click();
  };
  return (
    <div ref={ref} role="radiogroup" aria-label={label} className={className} onKeyDown={onKeyDown}>
      {children}
    </div>
  );
}

export interface ChoiceOption<T> {
  value: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

/** One-of-many as tappable chips (a radio group). */
export function Choice<T extends string | number>({
  label,
  options,
  value,
  onChange,
  columns,
  className = "",
}: {
  label: string;
  options: ChoiceOption<T>[];
  value: T | null | undefined;
  onChange: (value: T) => void;
  /** fixed grid instead of a wrapping row */
  columns?: 2 | 3;
  className?: string;
}) {
  const layout = columns === 2 ? "grid grid-cols-2 gap-2" : columns === 3 ? "grid grid-cols-3 gap-2" : "flex flex-wrap gap-2";
  return (
    <RadioGroup label={label} selectOnArrow className={`${layout} ${className}`}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          disabled={o.disabled}
          className={`atelier-chip ${columns ? "atelier-chip--block" : ""}`}
          onClick={() => o.value !== value && onChange(o.value)}
        >
          {o.icon}
          <span className="min-w-0">{o.label}</span>
        </button>
      ))}
    </RadioGroup>
  );
}

/** A labelled row inside a card: label on the left, control on the right (stacks when narrow). */
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="atelier-field">
      <div className="min-w-0">
        <p className="atelier-label">{label}</p>
        {hint && <p className="atelier-hint">{hint}</p>}
      </div>
      <div className="atelier-field__control">{children}</div>
    </div>
  );
}

/**
 * − value + for small counts. `value === undefined` means „automat": the count the workshop
 * would pick (autoValue) is shown, and the first tap starts from it.
 */
export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  autoValue,
  format = String,
}: {
  label: string;
  value: number | undefined;
  min: number;
  max: number;
  onChange: (value: number | undefined) => void;
  autoValue?: number;
  format?: (n: number) => string;
}) {
  const shown = value ?? autoValue ?? min;
  const isAuto = value === undefined && autoValue !== undefined;
  return (
    <div className="flex items-center gap-2">
      {autoValue !== undefined && !isAuto && (
        <button type="button" className="atelier-textbtn" onClick={() => onChange(undefined)}>
          Automat
        </button>
      )}
      <div className="atelier-stepper" role="group" aria-label={label}>
        <button
          type="button"
          aria-label={`${label}: mai puțin`}
          disabled={shown <= min}
          onClick={() => onChange(Math.max(min, shown - 1))}
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <output aria-live="polite">
          {format(shown)}
          {isAuto && <span className="atelier-stepper__auto">automat</span>}
        </output>
        <button
          type="button"
          aria-label={`${label}: mai mult`}
          disabled={shown >= max}
          onClick={() => onChange(Math.min(max, shown + 1))}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/**
 * A length the client can nudge (− / +), type (in cm) or drag (slider). The state stays in
 * millimetres; half-typed text never reaches the reducer — it commits on blur / Enter, clamped.
 */
export function LengthControl({
  id,
  label,
  valueMm,
  minMm,
  maxMm,
  stepMm = 10,
  slider = false,
  disabled = false,
  onCommit,
}: {
  id: string;
  label: string;
  valueMm: number;
  minMm: number;
  maxMm: number;
  stepMm?: number;
  slider?: boolean;
  disabled?: boolean;
  onCommit: (mm: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const clampMm = (mm: number) => Math.min(maxMm, Math.max(minMm, Math.round(mm)));

  const commit = () => {
    if (draft === null) return;
    const mm = parseCm(draft);
    setDraft(null);
    if (mm === null) return;
    const next = clampMm(mm);
    if (next !== valueMm) onCommit(next);
  };
  const nudge = (dir: 1 | -1) => {
    // land on the next multiple of the step, so 2405 → 2410 → 2420
    const snapped = dir > 0 ? Math.floor(valueMm / stepMm) * stepMm + stepMm : Math.ceil(valueMm / stepMm) * stepMm - stepMm;
    const next = clampMm(snapped);
    if (next !== valueMm) onCommit(next);
  };

  return (
    <div className="min-w-0">
      <div className="atelier-length">
        <button type="button" aria-label={`${label}: mai mic`} disabled={disabled || valueMm <= minMm} onClick={() => nudge(-1)}>
          <Minus size={16} aria-hidden="true" />
        </button>
        <label className="atelier-length__value" htmlFor={id}>
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`${label} în centimetri (între ${cm(minMm)} și ${cm(maxMm)})`}
            value={draft ?? cm(valueMm)}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
                e.currentTarget.blur();
              }
            }}
          />
          <span aria-hidden="true">cm</span>
        </label>
        <button type="button" aria-label={`${label}: mai mare`} disabled={disabled || valueMm >= maxMm} onClick={() => nudge(1)}>
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
      {slider && (
        <input
          type="range"
          className="atelier-range"
          min={minMm}
          max={maxMm}
          step={stepMm}
          value={Math.min(maxMm, Math.max(minMm, valueMm))}
          disabled={disabled}
          onChange={(e) => onCommit(Number(e.target.value))}
          aria-label={`${label} (glisor)`}
          style={{ "--fill": `${((valueMm - minMm) / Math.max(1, maxMm - minMm)) * 100}%` } as React.CSSProperties}
        />
      )}
    </div>
  );
}
