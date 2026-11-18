"use client";

import type { Dispatch } from "react";
import { categoryRules } from "@/lib/atelier/categories";
import type { AtelierAction } from "@/lib/atelier/state";
import type { AtelierConfig } from "@/lib/atelier/types";
import { NumberField } from "./number-field";

export function SizePanel({ config, dispatch }: { config: AtelierConfig; dispatch: Dispatch<AtelierAction> }) {
  const rules = categoryRules(config.category);
  const legOptions = rules.legs.filter((l) => l > 0);
  // Different categories have different limits: remount the fields so no half-typed draft survives a switch.
  const k = config.category;

  return (
    <section className="atelier-panel" aria-labelledby="atelier-size">
      <h2 id="atelier-size" className="atelier-panel__title">
        Dimensiuni
      </h2>
      <p className="mt-1 text-sm text-[var(--home-ivory)]/60">{rules.sizeHint}</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <NumberField
          key={`w-${k}`}
          id="atelier-width"
          label="Lățime"
          value={config.widthMm}
          min={rules.width[0]}
          max={rules.width[1]}
          slider
          onCommit={(widthMm) => dispatch({ type: "setSize", widthMm })}
        />
        <NumberField
          key={`h-${k}`}
          id="atelier-height"
          label="Înălțime"
          value={config.heightMm}
          min={rules.height[0]}
          max={rules.height[1]}
          slider
          onCommit={(heightMm) => dispatch({ type: "setSize", heightMm })}
        />
        <NumberField
          key={`d-${k}`}
          id="atelier-depth"
          label="Adâncime"
          value={config.depthMm}
          min={rules.depth[0]}
          max={rules.depth[1]}
          slider
          onCommit={(depthMm) => dispatch({ type: "setSize", depthMm })}
        />
      </div>
      {legOptions.length > 0 && (
        <div className="mt-5">
          <span className="atelier-label" id="atelier-legs">
            Soclu (picioare)
          </span>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-labelledby="atelier-legs">
            {legOptions.map((legsMm) => (
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
      )}
    </section>
  );
}
