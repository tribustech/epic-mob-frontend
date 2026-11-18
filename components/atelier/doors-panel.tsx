"use client";

import type { Dispatch } from "react";
import type { AtelierAction } from "@/lib/atelier/state";
import { autoDoorCount, doorCountOptions } from "@/lib/atelier/doors";
import { doorFace, doorOpening, doorType, type DoorFace, type DoorOpening } from "@/lib/atelier/door-types";
import type { AtelierCatalog, AtelierConfig } from "@/lib/atelier/types";
import { HandlePicker } from "./handle-picker";

const OPENINGS: { value: DoorOpening; label: string }[] = [
  { value: "NONE", label: "Fără uși" },
  { value: "BATANTE", label: "Uși batante" },
  { value: "GLISANTE", label: "Uși glisante" },
];

const FACES: { value: DoorFace; label: string }[] = [
  { value: "PANOU", label: "Din materialul fronturilor" },
  { value: "OGLINDA", label: "Cu oglindă" },
  { value: "STICLA", label: "Cu sticlă" },
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
  const opening = doorOpening(doors.type);
  const face = doorFace(doors.type);
  const sliding = opening === "GLISANTE";
  const handleTypes = catalog.handles?.types ?? [];
  const auto = autoDoorCount(config.widthMm);
  // only counts whose doors fit on a sheet (too-wide doors cannot be cut)
  const counts = doorCountOptions(config.widthMm, doors.count);

  return (
    <section className="atelier-panel" aria-labelledby="atelier-doors">
      <h2 id="atelier-doors" className="atelier-panel__title">
        Uși
      </h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tip uși">
        {/* hinged doors need a handle the CRM can price; without any (old cached catalog) the option is hidden */}
        {OPENINGS.filter((o) => o.value !== "BATANTE" || handleTypes.length > 0 || opening === "BATANTE").map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={opening === o.value}
            className="atelier-swatch !p-3"
            onClick={() =>
              opening !== o.value &&
              dispatch({ type: "setDoors", doors: { type: doorType(o.value, face) } })
            }
          >
            <span className="text-sm font-semibold">{o.label}</span>
          </button>
        ))}
      </div>

      {opening !== "NONE" && (
        <div className="mt-5">
          <span className="atelier-label" id="atelier-door-face">
            Fața ușilor
          </span>
          <div className="mt-2 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-labelledby="atelier-door-face">
            {FACES.map((f) => (
              <button
                key={f.value}
                type="button"
                role="radio"
                aria-checked={face === f.value}
                className="atelier-swatch !p-3"
                onClick={() =>
                  dispatch({
                    type: "setDoors",
                    doors: sliding ? { ...doors, type: doorType(opening, f.value) } : { type: doorType(opening, f.value) },
                  })
                }
              >
                <span className="text-sm font-semibold">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {opening === "BATANTE" && (
        <div className="mt-5 space-y-4">
          <HandlePicker catalog={catalog} config={config} dispatch={dispatch} />
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
        </div>
      )}
    </section>
  );
}
