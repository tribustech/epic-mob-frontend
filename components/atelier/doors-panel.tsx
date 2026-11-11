"use client";

import type { Dispatch } from "react";
import type { AtelierAction } from "@/lib/atelier/state";
import type { AtelierConfig, DoorType } from "@/lib/atelier/types";

const DOOR_TYPES: { type: DoorType; label: string; hint: string }[] = [
  { type: "NONE", label: "Fără uși", hint: "Dressing deschis" },
  { type: "GLISANTE", label: "Glisante", hint: "Panou din materialul fronturilor" },
  { type: "GLISANTE_OGLINDA", label: "Glisante cu oglindă", hint: "Oglindă argintie" },
  { type: "GLISANTE_STICLA", label: "Glisante din sticlă", hint: "Sticlă lacuită" },
];

/** Same rule as the CRM: one door per started metre, at least two. */
export function autoDoorCount(widthMm: number): number {
  return Math.max(2, Math.ceil(widthMm / 1000));
}

export function DoorsPanel({ config, dispatch }: { config: AtelierConfig; dispatch: Dispatch<AtelierAction> }) {
  const { doors } = config;
  const auto = autoDoorCount(config.widthMm);
  const counts = [2, 3, 4, 5, 6].filter(
    (n) => n === 2 || n === doors.count || config.widthMm / n >= 450,
  );

  return (
    <section className="atelier-panel" aria-labelledby="atelier-doors">
      <h2 id="atelier-doors" className="atelier-panel__title">
        Uși
      </h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tip uși">
        {DOOR_TYPES.map((d) => (
          <button
            key={d.type}
            type="button"
            role="radio"
            aria-checked={doors.type === d.type}
            className="atelier-swatch !p-3"
            onClick={() => dispatch({ type: "setDoors", doors: d.type === "NONE" ? { type: "NONE" } : { ...doors, type: d.type } })}
          >
            <span className="text-sm font-semibold">{d.label}</span>
            <span className="text-xs text-[var(--home-ivory)]/55">{d.hint}</span>
          </button>
        ))}
      </div>

      {doors.type !== "NONE" && (
        <div className="mt-5">
          <label htmlFor="atelier-door-count" className="atelier-label">
            Număr de uși
          </label>
          <select
            id="atelier-door-count"
            className="atelier-input mt-2 sm:max-w-xs"
            value={doors.count ?? ""}
            onChange={(e) =>
              dispatch({
                type: "setDoors",
                doors: e.target.value ? { type: doors.type, count: Number(e.target.value) } : { type: doors.type },
              })
            }
          >
            <option value="">Automat ({auto} uși)</option>
            {counts.map((n) => (
              <option key={n} value={n}>
                {n} uși
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-[var(--home-ivory)]/60">
            Ușile glisează pe două șine și se suprapun ușor, ca să nu rămână fante.
          </p>
        </div>
      )}
    </section>
  );
}
