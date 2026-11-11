"use client";

import type { Dispatch } from "react";
import { Minus, Plus } from "lucide-react";
import { MAX_COL_MM, MIN_COL_MM, type AtelierAction } from "@/lib/atelier/state";
import type { AtelierConfig, ColumnContent } from "@/lib/atelier/types";
import { NumberField } from "./number-field";

export const CONTENT_LABELS: Record<ColumnContent, string> = {
  POLITE: "Polițe",
  BARA: "Bară de haine",
  BARA_DUBLA: "Bară dublă (haine scurte)",
  POLITE_BARA: "Polițe + bară",
  BARA_SERTARE: "Bară + sertare",
};

export function ColumnsPanel({ config, dispatch }: { config: AtelierConfig; dispatch: Dispatch<AtelierAction> }) {
  const n = config.columns.length;
  const canAdd = config.columns.some((c) => c.widthMm >= 2 * MIN_COL_MM);

  return (
    <section className="atelier-panel" aria-labelledby="atelier-columns">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="atelier-columns" className="atelier-panel__title">
          Coloane <span className="text-[var(--home-ivory)]/60">({n})</span>
        </h2>
        <button
          type="button"
          className="atelier-chip"
          onClick={() => dispatch({ type: "addColumn" })}
          disabled={!canAdd}
        >
          <Plus size={16} aria-hidden="true" /> Adaugă coloană
        </button>
      </div>
      <p className="mt-1 text-sm text-[var(--home-ivory)]/60">
        Fiecare coloană are între {MIN_COL_MM} și {MAX_COL_MM} mm; restul lățimii se reîmparte automat.
      </p>

      <ol className="mt-5 space-y-4">
        {config.columns.map((col, index) => (
          <li
            key={index}
            className="rounded-xl border border-[var(--home-ivory)]/10 bg-[var(--home-black)]/40 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">Coloana {index + 1}</span>
              <button
                type="button"
                className="atelier-chip !px-3 !py-1.5"
                onClick={() => dispatch({ type: "removeColumn", index })}
                disabled={n <= 1}
                aria-label={`Elimină coloana ${index + 1}`}
              >
                <Minus size={14} aria-hidden="true" /> Elimină
              </button>
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <NumberField
                id={`atelier-col-${index}-width`}
                label="Lățime"
                value={col.widthMm}
                min={MIN_COL_MM}
                max={MAX_COL_MM}
                step={10}
                disabled={n <= 1}
                onCommit={(widthMm) => dispatch({ type: "setColumnWidth", index, widthMm })}
              />
              <div className="min-w-0">
                <label htmlFor={`atelier-col-${index}-content`} className="atelier-label">
                  Interior
                </label>
                <select
                  id={`atelier-col-${index}-content`}
                  className="atelier-input mt-2"
                  value={col.content}
                  onChange={(e) =>
                    dispatch({ type: "setColumnContent", index, content: e.target.value as ColumnContent })
                  }
                >
                  {(Object.keys(CONTENT_LABELS) as ColumnContent[]).map((c) => (
                    <option key={c} value={c}>
                      {CONTENT_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
