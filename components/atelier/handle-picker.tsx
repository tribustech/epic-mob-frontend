"use client";

import Image from "next/image";
import { useState } from "react";
import { doorFills } from "@/lib/atelier/door-types";
import {
  DEFAULT_HANDLE_FINISH,
  FINISH_INFO,
  HANDLE_FINISHES,
  HANDLE_INFO,
  HANDLE_KINDS,
  currentHandle,
  handleBlockers,
  handleHasFinish,
  handleUnavailable,
} from "@/lib/atelier/handles";
import { paintedFrontsLike } from "@/lib/atelier/palettes";
import type { AtelierAction } from "@/lib/atelier/state";
import type { AtelierCatalog, AtelierConfig, HandleKind } from "@/lib/atelier/types";
import type { MaterialLook } from "./material-look";
import type { Act } from "./session";
import { RadioGroup, Section, SelectedMark } from "./ui";

/**
 * The handle of every front (doors and drawers), picked from photos: one tap on a card. Types with a
 * visible piece of metal also get a colour. A type these fronts cannot take says why when tapped and
 * offers the way there in one tap. The exact model is settled at measuring.
 */
export function HandlePicker({
  catalog,
  config,
  act,
  front,
}: {
  catalog: AtelierCatalog;
  config: AtelierConfig;
  act: Act;
  /** the look of the fronts now: painted fronts offered for a handle start from the nearest paint colour */
  front: MaterialLook;
}) {
  const offered = new Set((catalog.handles?.types ?? []).map((t) => t.type));
  const types = HANDLE_KINDS.filter((t) => offered.has(t));
  const current = currentHandle(config);
  const finish = config.handle?.finish ?? DEFAULT_HANDLE_FINISH;
  /** the unavailable card the client tapped: its explanation is open */
  const [asked, setAsked] = useState<HandleKind | null>(null);
  const blocked = asked && asked !== current && handleUnavailable(config, asked) ? asked : null;

  const explain = (type: HandleKind) => {
    const { paint, glazed } = handleBlockers(config, type);
    const name = HANDLE_INFO[type].name;
    const painted = paint ? paintedFrontsLike(catalog, front.color) : null;
    const actions: AtelierAction[] = [];
    if (glazed) actions.push({ type: "setDoorFills", fills: doorFills(config).map(() => "PANOU" as const) });
    if (painted) actions.push({ type: "setFronts", fronts: painted });
    actions.push({ type: "setHandle", handle: { type } });
    const possible = !paint || !!painted;
    const text =
      paint && glazed
        ? `${name} se taie în front: merge doar cu fronturi vopsite și fără oglindă sau sticlă pe uși.`
        : paint
          ? `${name} se taie în front: merge doar cu fronturi vopsite.`
          : `${name} se taie în front: nu merge pe uși cu oglindă sau sticlă.`;
    const button = paint && glazed ? "Fronturi vopsite, fără oglindă" : paint ? "Schimbă pe fronturi vopsite" : "Scoate oglinda de pe uși";
    return (
      <div className="atelier-handlehelp" role="status">
        <p>{text}</p>
        {possible ? (
          <>
            <button
              type="button"
              className="atelier-chip"
              onClick={() => {
                act(actions);
                setAsked(null);
              }}
            >
              {button}
            </button>
            {paint && <p className="atelier-hint">Păstrăm o culoare apropiată de cea de acum; o poți schimba la pasul „Culori”. Prețul se recalculează.</p>}
          </>
        ) : (
          <p className="atelier-hint">Fronturile vopsite nu sunt disponibile acum în configurator. Scrie-ne și găsim o soluție.</p>
        )}
      </div>
    );
  };

  return (
    <Section title="Mânere" anchor="manere" hint="Cum deschizi ușile și sertarele. Atinge o poză.">
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
                  data-locked={why ? true : undefined}
                  data-open={why && blocked === type ? true : undefined}
                  className="atelier-card atelier-handle"
                  onClick={() => {
                    if (selected) return;
                    if (why) setAsked(blocked === type ? null : type);
                    else {
                      setAsked(null);
                      act({ type: "setHandle", handle: { type } });
                    }
                  }}
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
          {blocked && explain(blocked)}

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
