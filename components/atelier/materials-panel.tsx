"use client";

import { useMemo, useState, type Dispatch } from "react";
import type { AtelierAction } from "@/lib/atelier/state";
import type { AtelierCatalog, AtelierConfig, AtelierFronts, FrontKind } from "@/lib/atelier/types";
import { materialLook, swatchStyle } from "./material-look";
import { MaterialSelect } from "./material-select";

const KIND_LABELS: Record<FrontKind, string> = {
  PAL: "PAL",
  MDF_MELAMINAT: "MDF melaminat",
  MDF_VOPSIT: "MDF vopsit",
};

const DEFAULT_RAL = "RAL 9016";
const RAL_LIST_LIMIT = 60;

/** The flat ("plan drept") model is the default for MDF vopsit. */
export function defaultVopsitModelId(catalog: AtelierCatalog): string | undefined {
  const models = catalog.fronts.MDF_VOPSIT;
  return (models.find((m) => /plan\s*drept|drept/i.test(m.name)) ?? models[0])?.id;
}

export function defaultFronts(catalog: AtelierCatalog, kind: FrontKind, current: AtelierFronts): AtelierFronts {
  if (kind === "MDF_VOPSIT") {
    const ral =
      catalog.ral.find((r) => r.code === current.ralCode) ??
      catalog.ral.find((r) => r.code === DEFAULT_RAL) ??
      catalog.ral[0];
    return { kind, modelId: defaultVopsitModelId(catalog), ralCode: ral?.code, faces: current.faces ?? 1 };
  }
  return { kind, materialId: catalog.fronts[kind][0]?.id };
}

function RalPicker({
  catalog,
  value,
  onChange,
}: {
  catalog: AtelierCatalog;
  value: string | undefined;
  onChange: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = catalog.ral.find((r) => r.code === value);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^ral\s*/, "");
    const list = q
      ? catalog.ral.filter(
          (r) => r.code.toLowerCase().replace(/^ral\s*/, "").includes(q) || r.name.toLowerCase().includes(q),
        )
      : catalog.ral;
    return list.slice(0, RAL_LIST_LIMIT);
  }, [catalog.ral, query]);

  return (
    <div className="mt-4">
      <label htmlFor="atelier-ral-search" className="atelier-label">
        Culoare RAL
      </label>
      {selected && (
        <p className="mt-2 flex items-center gap-2 text-sm">
          <span
            className="inline-block h-5 w-5 shrink-0 rounded border border-black/30"
            style={{ backgroundColor: selected.hex }}
            aria-hidden="true"
          />
          Aleasă: <strong>{selected.code}</strong>
          <span className="truncate text-[var(--home-ivory)]/60">{selected.name}</span>
        </p>
      )}
      <input
        id="atelier-ral-search"
        type="search"
        className="atelier-input mt-2"
        placeholder="Caută după cod sau nume (ex. 9016, alb)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div
        className="mt-2 grid max-h-64 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-[var(--home-ivory)]/10 p-1 sm:grid-cols-2"
        role="radiogroup"
        aria-label="Culori RAL"
      >
        {matches.length === 0 && (
          <p className="p-3 text-sm text-[var(--home-ivory)]/55">Niciun cod RAL nu se potrivește.</p>
        )}
        {matches.map((r) => (
          <button
            key={r.code}
            type="button"
            role="radio"
            aria-checked={r.code === value}
            onClick={() => onChange(r.code)}
            className={`flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
              r.code === value
                ? "bg-[var(--home-orange-soft)] text-[var(--home-ivory)]"
                : "text-[var(--home-ivory)]/80 hover:bg-black/5"
            }`}
          >
            <span
              className="inline-block h-5 w-5 shrink-0 rounded border border-black/30"
              style={{ backgroundColor: r.hex }}
              aria-hidden="true"
            />
            <span className="shrink-0 font-semibold">{r.code}</span>
            <span className="truncate text-[var(--home-ivory)]/55">{r.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function MaterialsPanel({
  catalog,
  config,
  dispatch,
}: {
  catalog: AtelierCatalog;
  config: AtelierConfig;
  dispatch: Dispatch<AtelierAction>;
}) {
  const { fronts } = config;
  const kinds = (Object.keys(KIND_LABELS) as FrontKind[]).filter((k) => catalog.fronts[k].length > 0);
  const carcassMdf = new Set(catalog.fronts.MDF_MELAMINAT.map((m) => m.id));
  const setFronts = (next: AtelierFronts) => dispatch({ type: "setFronts", fronts: next });

  return (
    <section className="atelier-panel" aria-labelledby="atelier-materials">
      <h2 id="atelier-materials" className="atelier-panel__title">
        Materiale
      </h2>

      <h3 className="atelier-label mt-5">Corp (interior și laterale)</h3>
      <MaterialSelect
        label="Material corp"
        materials={catalog.carcass}
        selectedId={config.carcassMaterialId}
        swatch={(m) => swatchStyle(materialLook(m, carcassMdf.has(m.id) ? "MDF_MELAMINAT" : "PAL"))}
        onSelect={(materialId) => dispatch({ type: "setCarcass", materialId })}
      />

      <h3 className="atelier-label mt-7">Fronturi (sertare și uși)</h3>
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Tip fronturi">
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={fronts.kind === k}
            className="atelier-chip"
            onClick={() => fronts.kind !== k && setFronts(defaultFronts(catalog, k, fronts))}
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>

      {fronts.kind !== "MDF_VOPSIT" ? (
        <MaterialSelect
          label={`Decor ${KIND_LABELS[fronts.kind]}`}
          materials={catalog.fronts[fronts.kind]}
          selectedId={fronts.materialId}
          swatch={(m) => swatchStyle(materialLook(m, fronts.kind as "PAL" | "MDF_MELAMINAT"))}
          onSelect={(materialId) => setFronts({ kind: fronts.kind, materialId })}
        />
      ) : (
        <div>
          {catalog.fronts.MDF_VOPSIT.length > 1 && (
            <div className="mt-4">
              <label htmlFor="atelier-model" className="atelier-label">
                Model front
              </label>
              <select
                id="atelier-model"
                className="atelier-input mt-2"
                value={fronts.modelId ?? defaultVopsitModelId(catalog) ?? ""}
                onChange={(e) => setFronts({ ...fronts, modelId: e.target.value })}
              >
                {catalog.fronts.MDF_VOPSIT.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <RalPicker catalog={catalog} value={fronts.ralCode} onChange={(ralCode) => setFronts({ ...fronts, ralCode })} />
          <div className="mt-4">
            <span className="atelier-label" id="atelier-faces">
              Fețe vopsite
            </span>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="atelier-faces">
              {([1, 2] as const).map((faces) => (
                <button
                  key={faces}
                  type="button"
                  role="radio"
                  aria-checked={(fronts.faces ?? 1) === faces}
                  className="atelier-chip"
                  onClick={() => setFronts({ ...fronts, faces })}
                >
                  {faces === 1 ? "O față" : "Două fețe"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
