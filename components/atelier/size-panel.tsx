"use client";

import type { Dispatch } from "react";
import type { AtelierAction } from "@/lib/atelier/state";
import type { AtelierConfig } from "@/lib/atelier/types";
import { NumberField } from "./number-field";

export const SIZE_LIMITS = {
  widthMm: { min: 600, max: 6000 },
  heightMm: { min: 1000, max: 3000 },
  depthMm: { min: 350, max: 800 },
} as const;

export function SizePanel({ config, dispatch }: { config: AtelierConfig; dispatch: Dispatch<AtelierAction> }) {
  return (
    <section className="atelier-panel" aria-labelledby="atelier-size">
      <h2 id="atelier-size" className="atelier-panel__title">
        Dimensiuni
      </h2>
      <p className="mt-1 text-sm text-[var(--home-ivory)]/60">Măsurile golului (nișei) unde va sta dressingul.</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <NumberField
          id="atelier-width"
          label="Lățime"
          value={config.widthMm}
          {...SIZE_LIMITS.widthMm}
          slider
          onCommit={(widthMm) => dispatch({ type: "setSize", widthMm })}
        />
        <NumberField
          id="atelier-height"
          label="Înălțime"
          value={config.heightMm}
          {...SIZE_LIMITS.heightMm}
          slider
          onCommit={(heightMm) => dispatch({ type: "setSize", heightMm })}
        />
        <NumberField
          id="atelier-depth"
          label="Adâncime"
          value={config.depthMm}
          {...SIZE_LIMITS.depthMm}
          slider
          onCommit={(depthMm) => dispatch({ type: "setSize", depthMm })}
        />
      </div>
      <div className="mt-5">
        <span className="atelier-label" id="atelier-legs">
          Soclu (picioare)
        </span>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="atelier-legs">
          {([100, 150] as const).map((legsMm) => (
            <button
              key={legsMm}
              type="button"
              role="radio"
              aria-checked={config.legsMm === legsMm}
              className="atelier-chip"
              onClick={() => dispatch({ type: "setLegs", legsMm })}
            >
              {legsMm} mm
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
