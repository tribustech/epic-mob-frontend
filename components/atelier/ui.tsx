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
  // „240", „240,5", „240 cm", „2,4 m", „2400 mm" — centimetres by default; a bare number under 10
  // („2.4", „3") can only be metres: no furniture here is under 10 cm
  const match = /^([0-9]+(?:[.,][0-9]*)?|[.,][0-9]+)\s*(cm|mm|m)?\.?$/i.exec(text.trim());
  if (!match) return null;
  const v = Number(match[1].replace(",", "."));
  if (!Number.isFinite(v)) return null;
  const unit = (match[2] ?? (v > 0 && v < 10 ? "m" : "cm")).toLowerCase();
  return Math.round(unit === "m" ? v * 1000 : unit === "mm" ? v : v * 10);
}

/**
 * A message from the price service, as the client reads it: millimetres become centimetres
 * („964 mm" → „96,4 cm") and, outside dressings, „coloană" becomes „compartiment".
 */
export function issueMessage(message: string, dressing: boolean): string {
  let text = message.replace(/(\d+(?:[.,]\d+)?)\s*mm\b/g, (_, n: string) => `${cm(Number(n.replace(",", ".")))} cm`);
  if (!dressing) {
    const forms: [RegExp, string][] = [
      [/coloanelor/g, "compartimentelor"],
      [/coloanele/g, "compartimentele"],
      [/coloanei/g, "compartimentului"],
      [/coloana/g, "compartimentul"],
      [/coloană/g, "compartiment"],
      [/coloane/g, "compartimente"],
    ];
    for (const [re, to] of forms) {
      text = text.replace(re, to).replace(new RegExp(re.source.replace(/^c/, "C"), "g"), to.replace(/^c/, "C"));
    }
  }
  return text;
}

/** Search text without diacritics, lower-case: „Cașmir" → „casmir". */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Catalog names typed without diacritics, as they should read. */
const DECOR_WORDS: Record<string, string> = {
  portelan: "Porțelan",
  migdala: "Migdală",
  rosu: "Roșu",
  inchis: "Închis",
  mesteacan: "Mesteacăn",
  artar: "Arțar",
  cires: "Cireș",
  salbatic: "Sălbatic",
  salcam: "Salcâm",
  marmura: "Marmură",
  piatra: "Piatră",
  trufa: "Trufă",
  perlata: "Perlată",
  cenusiu: "Cenușiu",
  mustar: "Muștar",
  casmir: "Cașmir",
  kasmir: "Cașmir",
  tendinta: "Tendință",
  fata: "față",
  "2-fete": "2 fețe",
};

/** „Alb Portelan" → „Alb Porțelan" (display only; ids and decor codes are untouched). */
export function decorName(name: string): string {
  return name.replace(/[\p{L}\d-]+/gu, (word) => {
    const fixed = DECOR_WORDS[word.toLowerCase()];
    if (!fixed) return word;
    return word.length > 1 && word === word.toUpperCase() && /\p{L}/u.test(word) ? fixed.toUpperCase() : fixed;
  });
}

/** „W1000 ST9 · Alb Premium" → „Alb Premium" (the catalog name leads with the decor code). */
export function decorTitle(name: string): string {
  const at = name.indexOf(" · ");
  if (/^(MDF vopsit )?RAL\b/.test(name)) return name;
  return decorName(at > 0 && at < name.length - 3 ? name.slice(at + 3) : name);
}

/** English words in panel names (AGT), as a client would say them. */
const EN_WORDS: Record<string, string> = {
  white: "Alb", black: "Negru", grey: "Gri", gray: "Gri", cream: "Crem", blue: "Albastru", green: "Verde", gold: "Auriu",
  oak: "Stejar", walnut: "Nuc", wood: "Lemn", stone: "Piatră", light: "deschis", dark: "închis", anthracite: "Antracit",
  metallic: "metalizat", natural: "natur", cashmere: "Cașmir", capucino: "Cappuccino", beige: "Bej", clay: "Lut", olive: "Oliv", sky: "Cer",
};
/** English puts the colour last („Storm Grey"); Romanian puts it first („Gri Storm"). */
const EN_HEAD = new Set(["white", "black", "grey", "gray", "cream", "blue", "green", "gold", "oak", "walnut", "wood", "anthracite"]);
const GLOSS = /^HG\s+/i;
const MATTE = /^(Soft Touch|Super Matt|Supramat|Matt)\s+|\s+(Mat|Soft)$/i;

/**
 * The name under a swatch, in one to three plain words: no decor code, no supplier shorthand, no shouting.
 * „W1000 ST9 · Alb Premium" → „Alb Premium"; „601 · HG White" → „Alb" (finish „lucios");
 * „726 · Soft Touch Storm Grey" → „Gri Storm" (finish „mat"); „STEJAR MALMO" → „Stejar Malmo".
 */
export function decorLabel(name: string): { label: string; finish: "lucios" | "mat" | null } {
  let text = decorTitle(name).replace(/\s+\d[\s-]*f[ae][țt][ăae](?!\p{L})/giu, "").trim();
  // a name written all in capitals: „STEJAR MALMO", „NUC ALTURA"
  if (text === text.toUpperCase()) text = text.replace(/\p{L}{3,}/gu, (w) => w.charAt(0) + w.slice(1).toLowerCase());
  let finish: "lucios" | "mat" | null = null;
  if (GLOSS.test(text)) {
    finish = "lucios";
    text = text.replace(GLOSS, "");
  }
  while (MATTE.test(text) && text.replace(MATTE, "").trim()) {
    finish ??= "mat";
    text = text.replace(MATTE, "").trim();
  }
  let words = text.split(/\s+/).filter(Boolean);
  const last = words[words.length - 1]?.toLowerCase();
  if (words.length > 1 && last && EN_HEAD.has(last)) words = [words[words.length - 1], ...words.slice(0, -1)];
  words = words.map((w, i) => {
    const ro = EN_WORDS[w.toLowerCase()];
    return ro ? (i === 0 ? ro.charAt(0).toUpperCase() + ro.slice(1) : ro) : w;
  });
  return { label: decorName(words.join(" ")) || decorTitle(name), finish };
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
  anchor,
}: {
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** name a „Modifică" link can jump to (the shell scrolls here and highlights it for a moment) */
  anchor?: string;
}) {
  return (
    <section className={`atelier-section ${className}`} data-anchor={anchor}>
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
 * A length the client can nudge (− / +, in steps of 5 cm; hold to repeat), type (in cm, any
 * precision) or drag (slider). The state stays in millimetres; half-typed text never reaches the
 * reducer — it commits on blur / Enter, clamped (with a short note when it had to be).
 */
export function LengthControl({
  id,
  label,
  valueMm,
  minMm,
  maxMm,
  stepMm = 10,
  nudgeMm = 50,
  slider = false,
  disabled = false,
  onCommit,
}: {
  id: string;
  label: string;
  valueMm: number;
  minMm: number;
  maxMm: number;
  /** slider precision */
  stepMm?: number;
  /** what one tap on − / + changes */
  nudgeMm?: number;
  slider?: boolean;
  disabled?: boolean;
  onCommit: (mm: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [clamped, setClamped] = useState(false);
  const clampTimer = useRef<number | null>(null);
  const clampMm = (mm: number) => Math.min(maxMm, Math.max(minMm, Math.round(mm)));

  // the − / + repeat while held: they must read the value as it is now, not as it was at press time
  const live = useRef({ valueMm, minMm, maxMm, nudgeMm, onCommit });
  useEffect(() => {
    live.current = { valueMm, minMm, maxMm, nudgeMm, onCommit };
  });
  const hold = useRef<{ timer: number | null; repeated: boolean }>({ timer: null, repeated: false });
  const stopHold = () => {
    if (hold.current.timer !== null) window.clearTimeout(hold.current.timer);
    hold.current.timer = null;
  };
  useEffect(
    () => () => {
      if (hold.current.timer !== null) window.clearTimeout(hold.current.timer);
      if (clampTimer.current !== null) window.clearTimeout(clampTimer.current);
    },
    [],
  );

  const noteClamp = () => {
    setClamped(true);
    if (clampTimer.current !== null) window.clearTimeout(clampTimer.current);
    clampTimer.current = window.setTimeout(() => setClamped(false), 4000);
  };

  const commit = () => {
    if (draft === null) return;
    const mm = parseCm(draft);
    setDraft(null);
    if (mm === null) {
      if (draft.trim()) noteClamp();
      return;
    }
    const next = clampMm(mm);
    if (next !== mm) noteClamp();
    else setClamped(false);
    if (next !== valueMm) onCommit(next);
  };
  /** one step; false when the limit is reached */
  const nudge = (dir: 1 | -1): boolean => {
    const v = live.current;
    // land on the next multiple of the step, so 2405 → 2450 → 2500
    const snapped =
      dir > 0 ? Math.floor(v.valueMm / v.nudgeMm) * v.nudgeMm + v.nudgeMm : Math.ceil(v.valueMm / v.nudgeMm) * v.nudgeMm - v.nudgeMm;
    const next = Math.min(v.maxMm, Math.max(v.minMm, snapped));
    if (next === v.valueMm) return false;
    live.current = { ...v, valueMm: next };
    v.onCommit(next);
    return true;
  };
  const nudgeButton = (dir: 1 | -1) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      stopHold();
      hold.current.repeated = false;
      const tick = () => {
        hold.current.repeated = true;
        hold.current.timer = nudge(dir) ? window.setTimeout(tick, 110) : null;
      };
      hold.current.timer = window.setTimeout(tick, 420);
    },
    onPointerUp: stopHold,
    onPointerLeave: stopHold,
    onPointerCancel: stopHold,
    onBlur: stopHold,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onClick: () => {
      stopHold();
      // the click that ends a hold already did its steps
      if (hold.current.repeated) hold.current.repeated = false;
      else nudge(dir);
    },
  });

  // Touch: a page scroll that happens to start on the slider must not change the value.
  const touch = useRef<{ x: number; y: number; scrollY: number; vertical: boolean | null } | null>(null);
  const sliderGuard = {
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      touch.current = { x: t.clientX, y: t.clientY, scrollY: window.scrollY, vertical: null };
    },
    onTouchMove: (e: React.TouchEvent) => {
      const s = touch.current;
      const t = e.touches[0];
      if (!s || s.vertical !== null) return;
      const dx = Math.abs(t.clientX - s.x);
      const dy = Math.abs(t.clientY - s.y);
      if (dx > 6 || dy > 6) s.vertical = dy > dx;
    },
    onTouchEnd: () => {
      window.setTimeout(() => {
        touch.current = null;
      }, 60);
    },
    onTouchCancel: () => {
      touch.current = null;
    },
  };
  const scrolling = () => {
    const s = touch.current;
    return !!s && (s.vertical === true || Math.abs(window.scrollY - s.scrollY) > 3);
  };

  return (
    <div className="min-w-0">
      <div className="atelier-length">
        <button type="button" aria-label={`${label}: mai mic`} disabled={disabled || valueMm <= minMm} {...nudgeButton(-1)}>
          <Minus size={16} aria-hidden="true" />
        </button>
        <label className="atelier-length__value" htmlFor={id}>
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`${label} în centimetri (între ${cm(minMm)} și ${cm(maxMm)})`}
            aria-describedby={clamped ? `${id}-range` : undefined}
            value={draft ?? cm(valueMm)}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
                // focus stays in the field (the value is selected again, ready for another try)
                const input = e.currentTarget;
                requestAnimationFrame(() => input.select());
              }
            }}
          />
          <span aria-hidden="true">cm</span>
        </label>
        <button type="button" aria-label={`${label}: mai mare`} disabled={disabled || valueMm >= maxMm} {...nudgeButton(1)}>
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
      {clamped && (
        <p id={`${id}-range`} className="atelier-length__note" role="status">
          între {cm(minMm)} și {cm(maxMm)} cm
        </p>
      )}
      {slider && (
        <input
          type="range"
          className="atelier-range"
          min={minMm}
          max={maxMm}
          step={stepMm}
          value={Math.min(maxMm, Math.max(minMm, valueMm))}
          disabled={disabled}
          {...sliderGuard}
          onChange={(e) => {
            if (!scrolling()) onCommit(Number(e.target.value));
          }}
          aria-label={`${label} (glisor)`}
          style={{ "--fill": `${((valueMm - minMm) / Math.max(1, maxMm - minMm)) * 100}%` } as React.CSSProperties}
        />
      )}
    </div>
  );
}
