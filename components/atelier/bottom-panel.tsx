"use client";

import type { Dispatch } from "react";
import { BOTTOM_DEFAULT_HEIGHT_MM, BOTTOM_HEIGHT_RANGE } from "@/lib/atelier/categories";
import type { AtelierAction } from "@/lib/atelier/state";
import type { AtelierCatalog, AtelierConfig, BottomType } from "@/lib/atelier/types";
import { HandlePicker } from "./handle-picker";
import { NumberField } from "./number-field";

const TYPES: { type: BottomType; label: string; hint: string }[] = [
  { type: "NONE", label: "Deschis până jos", hint: "Doar polițe, se vede prin el" },
  { type: "SERTARE", label: "Sertare", hint: "Pe toată lățimea, jos" },
  { type: "USI", label: "Uși", hint: "Câte o ușă pe coloană, jos" },
];

/** Separator: optional closed bottom (drawers or doors) under the open shelves, with a PFL back. */
export function BottomPanel({
  catalog,
  config,
  dispatch,
}: {
  catalog: AtelierCatalog;
  config: AtelierConfig;
  dispatch: Dispatch<AtelierAction>;
}) {
  const bottom = config.bottom ?? { type: "NONE" as const };
  const active = bottom.type !== "NONE";

  return (
    <section className="atelier-panel" aria-labelledby="atelier-bottom">
      <h2 id="atelier-bottom" className="atelier-panel__title">
        Partea de jos
      </h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Partea de jos">
        {TYPES.map((t) => (
          <button
            key={t.type}
            type="button"
            role="radio"
            aria-checked={bottom.type === t.type}
            className="atelier-swatch !p-3"
            onClick={() => dispatch({ type: "setBottom", bottom: { ...bottom, type: t.type } })}
          >
            <span className="text-sm font-semibold">{t.label}</span>
            <span className="text-xs text-[var(--home-ivory)]/55">{t.hint}</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              id="atelier-bottom-height"
              label="Înălțime de la podea"
              value={bottom.heightMm ?? BOTTOM_DEFAULT_HEIGHT_MM}
              min={BOTTOM_HEIGHT_RANGE[0]}
              max={BOTTOM_HEIGHT_RANGE[1]}
              step={10}
              onCommit={(heightMm) => dispatch({ type: "setBottom", bottom: { ...bottom, heightMm } })}
            />
            {bottom.type === "SERTARE" && (
              <div className="min-w-0">
                <label htmlFor="atelier-bottom-drawers" className="atelier-label">
                  Număr de sertare
                </label>
                <select
                  id="atelier-bottom-drawers"
                  className="atelier-input mt-2"
                  value={bottom.drawers ?? 2}
                  onChange={(e) =>
                    dispatch({ type: "setBottom", bottom: { ...bottom, drawers: Number(e.target.value) as 1 | 2 | 3 } })
                  }
                >
                  <option value={1}>1 sertar</option>
                  <option value={2}>2 sertare</option>
                  <option value={3}>3 sertare</option>
                </select>
              </div>
            )}
            {bottom.type === "USI" && (
              <div className="min-w-0">
                <label htmlFor="atelier-bottom-shelves" className="atelier-label">
                  Polițe în spatele ușilor
                </label>
                <select
                  id="atelier-bottom-shelves"
                  className="atelier-input mt-2"
                  value={bottom.shelves ?? 1}
                  onChange={(e) => dispatch({ type: "setBottom", bottom: { ...bottom, shelves: Number(e.target.value) } })}
                >
                  {[0, 1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? "Fără polițe" : n === 1 ? "1 poliță" : `${n} polițe`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <HandlePicker catalog={catalog} config={config} dispatch={dispatch} />
          <p className="text-xs text-[var(--home-ivory)]/60">
            Partea de jos are PFL în spate; polițele de deasupra rămân deschise pe ambele părți.
          </p>
        </div>
      )}
    </section>
  );
}
