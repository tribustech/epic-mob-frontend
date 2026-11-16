"use client";

import type { Dispatch } from "react";
import type { AtelierAction } from "@/lib/atelier/state";
import { autoDoorCount, doorCountOptions } from "@/lib/atelier/doors";
import type { AtelierCatalog, AtelierConfig, DoorType } from "@/lib/atelier/types";
import { HandlePicker } from "./handle-picker";

const DOOR_TYPES: { type: DoorType; label: string; hint: string }[] = [
  { type: "NONE", label: "Fără uși", hint: "Dressing deschis" },
  { type: "BATANTE", label: "Uși batante", hint: "Dulap clasic, ușile se deschid pe balamale" },
  { type: "GLISANTE", label: "Glisante", hint: "Panou din materialul fronturilor" },
  { type: "GLISANTE_OGLINDA", label: "Glisante cu oglindă", hint: "Oglindă argintie" },
  { type: "GLISANTE_STICLA", label: "Glisante din sticlă", hint: "Sticlă lacuită" },
];

export function DoorsPanel({
  catalog,
  config,
  dispatch,
}: {
  catalog: AtelierCatalog;
  config: AtelierConfig;
  dispatch: Dispatch<AtelierAction>;
}) {
  const { doors } = config;
  const sliding = doors.type.startsWith("GLISANTE");
  const handleTypes = catalog.handles?.types ?? [];
  const auto = autoDoorCount(config.widthMm);
  // only counts whose doors fit on a sheet (too-wide doors cannot be cut)
  const counts = doorCountOptions(config.widthMm, doors.count);

  return (
    <section className="atelier-panel" aria-labelledby="atelier-doors">
      <h2 id="atelier-doors" className="atelier-panel__title">
        Uși
      </h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tip uși">
        {/* hinged doors need a handle the CRM can price; without any (old cached catalog) the option is hidden */}
        {DOOR_TYPES.filter((d) => d.type !== "BATANTE" || handleTypes.length > 0 || doors.type === "BATANTE").map((d) => (
          <button
            key={d.type}
            type="button"
            role="radio"
            aria-checked={doors.type === d.type}
            className="atelier-swatch !p-3"
            onClick={() =>
              dispatch(
                d.type === "BATANTE"
                  ? { type: "setDoors", doors: { type: "BATANTE" } }
                  : {
                      type: "setDoors",
                      doors: d.type === "NONE" || !sliding ? { type: d.type } : { ...doors, type: d.type },
                    },
              )
            }
          >
            <span className="text-sm font-semibold">{d.label}</span>
            <span className="text-xs text-[var(--home-ivory)]/55">{d.hint}</span>
          </button>
        ))}
      </div>

      {doors.type === "BATANTE" && (
        <div className="mt-5 space-y-4">
          <HandlePicker catalog={catalog} config={config} dispatch={dispatch} />
          <p className="text-xs text-[var(--home-ivory)]/60">
            Fiecare coloană are o ușă; la fiecare coloană poți alege două uși pe lățime sau mai multe pe înălțime.
          </p>
        </div>
      )}

      {sliding && (
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
