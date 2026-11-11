"use client";

import type { Dispatch } from "react";
import { Minus, Plus } from "lucide-react";
import { CONTENT_LABELS, SERTARE_RANGE, autoDrawers, categoryRules } from "@/lib/atelier/categories";
import { MAX_COL_MM, MIN_COL_MM, type AtelierAction } from "@/lib/atelier/state";
import type { AtelierConfig, ColumnContent } from "@/lib/atelier/types";
import { NumberField } from "./number-field";

const DRAWER_COUNTS = Array.from(
  { length: SERTARE_RANGE[1] - SERTARE_RANGE[0] + 1 },
  (_, i) => SERTARE_RANGE[0] + i,
);

export function ColumnsPanel({ config, dispatch }: { config: AtelierConfig; dispatch: Dispatch<AtelierAction> }) {
  const n = config.columns.length;
  const canAdd = config.columns.some((c) => c.widthMm >= 2 * MIN_COL_MM);
  const { contents } = categoryRules(config.category);
  // Same rule as the CRM: drawers share the body height (total minus legs).
  const autoCount = autoDrawers(config.heightMm - config.legsMm);

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
                  disabled={contents.length <= 1}
                  onChange={(e) =>
                    dispatch({ type: "setColumnContent", index, content: e.target.value as ColumnContent })
                  }
                >
                  {contents.map((c) => (
                    <option key={c} value={c}>
                      {CONTENT_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              {col.content === "SERTARE" && (
                <div className="min-w-0 sm:col-start-2">
                  <label htmlFor={`atelier-col-${index}-drawers`} className="atelier-label">
                    Număr de sertare
                  </label>
                  <select
                    id={`atelier-col-${index}-drawers`}
                    className="atelier-input mt-2"
                    value={col.drawers ?? ""}
                    onChange={(e) =>
                      dispatch({
                        type: "setColumnDrawers",
                        index,
                        drawers: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  >
                    <option value="">Automat ({autoCount} sertare)</option>
                    {DRAWER_COUNTS.map((d) => (
                      <option key={d} value={d}>
                        {d} sertare
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
