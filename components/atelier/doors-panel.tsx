"use client";

import type { Dispatch } from "react";
import type { AtelierAction } from "@/lib/atelier/state";
import { autoDoorCount, doorCountOptions } from "@/lib/atelier/doors";
import { HANDLE_WITH_ITEM, defaultHandle, withHandleType } from "@/lib/atelier/handles";
import type { AtelierCatalog, AtelierConfig, DoorType } from "@/lib/atelier/types";

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
  const handleItems = catalog.handles?.items ?? [];
  const handle = config.handle;
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
                  ? { type: "setDoors", doors: { type: "BATANTE" }, handle: config.handle ?? defaultHandle(catalog) }
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
          {handleTypes.length === 0 && (
            <p className="text-sm text-red-700">
              Mânerele nu s-au încărcat. Reîncarcă pagina sau alege altă variantă de uși.
            </p>
          )}
          <div>
            <span className="atelier-label" id="atelier-handle-type">
              Mâner
            </span>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="atelier-handle-type">
              {handleTypes.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  role="radio"
                  aria-checked={handle?.type === t.type}
                  className="atelier-chip"
                  onClick={() => dispatch({ type: "setHandle", handle: withHandleType(handle, t.type, catalog) })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {handle && HANDLE_WITH_ITEM.has(handle.type) && (
            <div>
              <label htmlFor="atelier-handle-item" className="atelier-label">
                Model mâner
              </label>
              <select
                id="atelier-handle-item"
                className="atelier-input mt-2 sm:max-w-sm"
                value={handle.itemId ?? ""}
                onChange={(e) => dispatch({ type: "setHandle", handle: { type: handle.type, itemId: e.target.value } })}
              >
                {handleItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <p className="text-xs text-[var(--home-ivory)]/60">
            O ușă pe coloanele de până la 60 cm, două pe cele mai late. Câte uși vrei pe înălțime alegi la fiecare
            coloană.
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
