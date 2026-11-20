"use client";

import Image from "next/image";
import {
  DEFAULT_HANDLE_FINISH,
  FINISH_INFO,
  HANDLE_FINISHES,
  HANDLE_INFO,
  HANDLE_KINDS,
  currentHandle,
  handleHasFinish,
  handleUnavailable,
} from "@/lib/atelier/handles";
import type { AtelierCatalog, AtelierConfig } from "@/lib/atelier/types";
import type { Act } from "./session";
import { RadioGroup, Section, SelectedMark } from "./ui";

/**
 * The handle of every front (doors and drawers), picked from photos: one tap on a card. Types with a
 * visible piece of metal also get a colour. The exact model is settled at measuring.
 */
export function HandlePicker({ catalog, config, act }: { catalog: AtelierCatalog; config: AtelierConfig; act: Act }) {
  const offered = new Set((catalog.handles?.types ?? []).map((t) => t.type));
  const types = HANDLE_KINDS.filter((t) => offered.has(t));
  const current = currentHandle(config);
  const finish = config.handle?.finish ?? DEFAULT_HANDLE_FINISH;

  return (
    <Section title="Mânere" hint="Cum deschizi ușile și sertarele. Atinge o poză.">
      {types.length === 0 ? (
        <p className="atelier-issue atelier-issue--error">Mânerele nu s-au încărcat. Reîncarcă pagina.</p>
      ) : (
        <div className="atelier-box">
          <RadioGroup label="Tip de mâner" className="atelier-handles">
            {types.map((type) => {
              const info = HANDLE_INFO[type];
              const selected = type === current;
              // cut into the front itself: only on painted fronts, never over a mirror
              const why = selected ? null : handleUnavailable(config, type);
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${info.name} — ${(why ?? info.benefit).toLowerCase()}`}
                  aria-disabled={why ? true : undefined}
                  className="atelier-card atelier-handle"
                  onClick={() => !selected && !why && act({ type: "setHandle", handle: { type } })}
                >
                  <span className="atelier-handle__art">
                    <Image src={info.image} alt="" width={300} height={200} sizes="(min-width: 1024px) 180px, 46vw" />
                    {selected && <SelectedMark className="absolute right-1.5 top-1.5" />}
                  </span>
                  <span className="atelier-handle__text">
                    <span className="atelier-card__name">{info.name}</span>
                    <span className="atelier-card__sub">{why ?? info.benefit}</span>
                  </span>
                </button>
              );
            })}
          </RadioGroup>

          {current && handleHasFinish(current) && (
            <div className="atelier-finish">
              <p className="atelier-label">Culoarea mânerului</p>
              <RadioGroup label="Culoarea mânerului" selectOnArrow className="atelier-finish__row">
                {HANDLE_FINISHES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={f === finish}
                    className="atelier-chip atelier-finish__chip"
                    onClick={() => f !== config.handle?.finish && act({ type: "setHandle", handle: { type: current, finish: f } })}
                  >
                    <span className="atelier-finish__dot" style={{ background: FINISH_INFO[f].color }} aria-hidden="true" />
                    {FINISH_INFO[f].label}
                  </button>
                ))}
              </RadioGroup>
            </div>
          )}
          <p className="atelier-hint mt-3">Modelul exact îl alegem împreună, la măsurători.</p>
        </div>
      )}
    </Section>
  );
}
