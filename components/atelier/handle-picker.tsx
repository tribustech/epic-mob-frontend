"use client";

import type { Dispatch } from "react";
import { currentHandle } from "@/lib/atelier/handles";
import type { AtelierAction } from "@/lib/atelier/state";
import type { AtelierCatalog, AtelierConfig } from "@/lib/atelier/types";

/** Handle type for every front (doors and drawers). The exact applied-handle model is settled at measuring. */
export function HandlePicker({
  catalog,
  config,
  dispatch,
}: {
  catalog: AtelierCatalog;
  config: AtelierConfig;
  dispatch: Dispatch<AtelierAction>;
}) {
  const types = catalog.handles?.types ?? [];
  const selected = currentHandle(config);

  if (types.length === 0) {
    return (
      <p className="text-sm text-red-700">Mânerele nu s-au încărcat. Reîncarcă pagina.</p>
    );
  }

  return (
    <div>
      <span className="atelier-label" id="atelier-handle-type">
        Mâner (uși și sertare)
      </span>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="atelier-handle-type">
        {types.map((t) => (
          <button
            key={t.type}
            type="button"
            role="radio"
            aria-checked={selected === t.type}
            className="atelier-chip"
            onClick={() => dispatch({ type: "setHandle", handle: { type: t.type } })}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
