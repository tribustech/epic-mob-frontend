"use client";

import { currentHandle } from "@/lib/atelier/handles";
import type { AtelierCatalog, AtelierConfig } from "@/lib/atelier/types";
import type { Act } from "./session";
import { Choice, Field } from "./ui";

/** Handle type for every front (doors and drawers). The exact applied-handle model is settled at measuring. */
export function HandlePicker({ catalog, config, act }: { catalog: AtelierCatalog; config: AtelierConfig; act: Act }) {
  const types = catalog.handles?.types ?? [];

  if (types.length === 0) {
    return <p className="atelier-issue atelier-issue--error">Mânerele nu s-au încărcat. Reîncarcă pagina.</p>;
  }

  return (
    <Field label="Mânere" hint="pentru uși și sertare">
      <Choice
        label="Mâner (uși și sertare)"
        value={currentHandle(config)}
        options={types.map((t) => ({ value: t.type, label: t.label }))}
        onChange={(type) => act({ type: "setHandle", handle: { type } })}
      />
    </Field>
  );
}
