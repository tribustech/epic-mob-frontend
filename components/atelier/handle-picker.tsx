"use client";

import Image from "next/image";
import { useState } from "react";
import { Info, Undo2 } from "lucide-react";
import { doorFills } from "@/lib/atelier/door-types";
import {
  DEFAULT_HANDLE_FINISH,
  FINISH_INFO,
  HANDLE_FINISHES,
  HANDLE_INFO,
  HANDLE_KINDS,
  currentHandle,
  frontsNoun,
  handleBlockers,
  handleHasFinish,
  needsPaintedFronts,
} from "@/lib/atelier/handles";
import { paintedFrontsLike } from "@/lib/atelier/palettes";
import type { AtelierAction } from "@/lib/atelier/state";
import type { AtelierCatalog, AtelierConfig, HandleKind } from "@/lib/atelier/types";
import type { MaterialLook } from "./material-look";
import type { Act } from "./session";
import { RadioGroup, Section, SelectedMark } from "./ui";

/** „mânerul îngropat", „muchia oblică", „șina ascunsă": the name inside a sentence. */
const THE_NAME: Partial<Record<HandleKind, string>> = { INGROPAT: "mânerul îngropat", PROFIL_J: "muchia oblică" };

/**
 * The handle of every front (doors and drawers), picked from photos: one tap on a card, always. A handle
 * that is cut into the door itself needs painted doors: picking it switches them to paint in the nearest
 * colour, in the same step, and a small note says so with an undo. Only a mirror / glass door stops it,
 * and then the note offers to take the mirror off. The exact model is settled at measuring.
 */
export function HandlePicker({
  catalog,
  config,
  act,
  front,
  onUndo,
}: {
  catalog: AtelierCatalog;
  config: AtelierConfig;
  act: Act;
  /** the look of the fronts now: painted fronts made for a handle start from the nearest paint colour */
  front: MaterialLook;
  /** takes back the last change (the note's „Anulează") */
  onUndo?: () => void;
}) {
  const offered = new Set((catalog.handles?.types ?? []).map((t) => t.type));
  const types = HANDLE_KINDS.filter((t) => offered.has(t));
  const current = currentHandle(config);
  const finish = config.handle?.finish ?? DEFAULT_HANDLE_FINISH;
  const noun = frontsNoun(config);
  const notPainted = config.fronts.kind !== "MDF_VOPSIT";

  /** the handle that mirror / glass doors stand in the way of: its one-line note is open */
  const [asked, setAsked] = useState<HandleKind | null>(null);
  const stopped = asked && asked !== current && handleBlockers(config, asked).glazed ? asked : null;
  /** painted fronts are not offered by the workshop right now */
  const [noPaint, setNoPaint] = useState<HandleKind | null>(null);
  /** we switched the fronts to paint for this handle; `after` is the configuration that change produced */
  const [auto, setAuto] = useState<{ type: HandleKind; ralCode: string | undefined; after: AtelierConfig | null } | null>(null);
  if (auto && auto.after === null && config.handle?.type === auto.type && config.fronts.kind === "MDF_VOPSIT" && config.fronts.ralCode === auto.ralCode)
    setAuto({ ...auto, after: config });
  // the note lives until the next change (or its own undo)
  const switched = auto && auto.after === config ? auto.type : null;

  const pick = (type: HandleKind, removeGlazing = false) => {
    const { paint, glazed } = handleBlockers(config, type);
    if (glazed && !removeGlazing) {
      setAsked(stopped === type ? null : type);
      return;
    }
    const painted = paint ? paintedFrontsLike(catalog, front.color) : null;
    if (paint && !painted) {
      setNoPaint(type);
      return;
    }
    // one change, one undo: the handle, and whatever it needs
    const actions: AtelierAction[] = [{ type: "setHandle", handle: { type } }];
    if (glazed) actions.push({ type: "setDoorFills", fills: doorFills(config).map(() => "PANOU" as const) });
    if (painted) actions.push({ type: "setFronts", fronts: painted });
    act(actions);
    setAsked(null);
    setNoPaint(null);
    setAuto(painted ? { type, ralCode: painted.ralCode, after: null } : null);
  };

  return (
    <Section title="Mânere" anchor="manere" hint="Cum deschizi ușile și sertarele. Atinge o poză și vezi mânerul pe mobilă.">
      {types.length === 0 ? (
        <p className="atelier-issue atelier-issue--error">Mânerele nu s-au încărcat. Reîncarcă pagina.</p>
      ) : (
        <div className="atelier-box">
          <RadioGroup label="Tip de mâner" className="atelier-handles">
            {types.map((type) => {
              const info = HANDLE_INFO[type];
              const selected = type === current;
              // cut into the door itself: an honest tag, never a disabled card
              const tag = needsPaintedFronts(type) && notPainted ? `doar la ${noun.plain} vopsite` : null;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${info.name} — ${info.benefit}${tag ? ` (${tag})` : ""}`}
                  className="atelier-card atelier-handle"
                  onClick={() => !selected && pick(type)}
                >
                  <span className="atelier-handle__art">
                    <Image src={info.image} alt="" width={300} height={200} sizes="(min-width: 1024px) 180px, 46vw" />
                    {selected && <SelectedMark className="absolute right-1.5 top-1.5" />}
                  </span>
                  <span className="atelier-handle__text">
                    <span className="atelier-card__name">{info.name}</span>
                    <span className="atelier-card__sub">{info.benefit}</span>
                    {tag && <span className="atelier-handle__tag">{tag}</span>}
                  </span>
                </button>
              );
            })}
          </RadioGroup>

          {switched && (
            <div className="atelier-handlenote" role="status">
              <Info size={15} aria-hidden="true" />
              <p>
                Am trecut {noun.the} pe vopsit, într-o nuanță apropiată, ca să se poată face {THE_NAME[switched] ?? "mânerul"}. Culoarea o poți
                schimba la „Culori”.
              </p>
              {onUndo && (
                <button type="button" className="atelier-chip atelier-chip--sm" onClick={onUndo}>
                  <Undo2 size={14} aria-hidden="true" />
                  Anulează
                </button>
              )}
            </div>
          )}
          {stopped && (
            <div className="atelier-handlenote" role="status">
              <Info size={15} aria-hidden="true" />
              <p>
                {HANDLE_INFO[stopped].name} se taie în ușă, așa că nu merge pe uși cu oglindă sau sticlă.
                {handleBlockers(config, stopped).paint ? " Fără oglindă, trecem ușile pe vopsit, într-o nuanță apropiată." : ""}
              </p>
              <button type="button" className="atelier-chip atelier-chip--sm" onClick={() => pick(stopped, true)}>
                Scoate oglinda de pe uși
              </button>
            </div>
          )}
          {noPaint && !switched && noPaint !== current && (
            <div className="atelier-handlenote" role="status">
              <Info size={15} aria-hidden="true" />
              <p>
                {HANDLE_INFO[noPaint].name} se face doar la {noun.plain} vopsite, iar acestea nu sunt disponibile acum în configurator. Scrie-ne în
                cerere și găsim o soluție.
              </p>
            </div>
          )}

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
