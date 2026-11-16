"use client";

import dynamic from "next/dynamic";
import { useMemo, useReducer, useState } from "react";
import { categoryRules } from "@/lib/atelier/categories";
import { atelierReducer, defaultConfig } from "@/lib/atelier/state";
import { useLivePrice } from "@/lib/atelier/use-live-price";
import type { AtelierCatalog, AtelierScene } from "@/lib/atelier/types";
import { CategoryPicker } from "./category-picker";
import { ColumnsPanel } from "./columns-panel";
import { DoorsPanel } from "./doors-panel";
import { carcassLook, frontLook } from "./material-look";
import { MaterialsPanel } from "./materials-panel";
import { PriceBar } from "./price-bar";
import { RequestForm } from "./request-form";
import { SizePanel } from "./size-panel";

// three.js needs the browser (WebGL); keep it out of SSR and out of the initial bundle.
const Viewer3D = dynamic(() => import("./viewer-3d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-[var(--image-radius)] bg-[#f1eee9] text-sm text-[var(--home-ivory)]/60">
      Se încarcă vizualizarea 3D…
    </div>
  ),
});

export function AtelierConfigurator({ catalog }: { catalog: AtelierCatalog }) {
  const [config, dispatch] = useReducer(atelierReducer, catalog, (c) => defaultConfig(c));
  const { result, loading, unavailable } = useLivePrice(config);

  // Keep showing the last valid scene while a new one loads or when the
  // current configuration has errors / pricing is unavailable.
  const [lastScene, setLastScene] = useState<AtelierScene | null>(null);
  if (result?.scene && result.scene !== lastScene) setLastScene(result.scene);

  const columnContents = useMemo(() => config.columns.map((c) => c.content), [config.columns]);

  const hasErrors = (result?.errors.length ?? 0) > 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-8">
      <div className="h-[50vh] min-h-[18rem] lg:sticky lg:top-[calc(var(--site-header-height)+1rem)] lg:h-[calc(100svh-var(--site-header-height)-2rem)]">
        <Viewer3D
          scene={lastScene}
          columns={columnContents}
          carcass={carcassLook(catalog, config)}
          front={frontLook(catalog, config)}
          updating={loading}
        />
      </div>

      <div className="min-w-0 space-y-5">
        <CategoryPicker category={config.category} dispatch={dispatch} />
        <SizePanel config={config} dispatch={dispatch} />
        <ColumnsPanel config={config} dispatch={dispatch} />
        <MaterialsPanel catalog={catalog} config={config} dispatch={dispatch} />
        {categoryRules(config.category).slidingDoors && <DoorsPanel config={config} dispatch={dispatch} />}
        <div className="sticky bottom-0 z-10 lg:static">
          <PriceBar result={result} loading={loading} unavailable={unavailable} />
        </div>
        <RequestForm config={config} blocked={hasErrors} />
      </div>
    </div>
  );
}
