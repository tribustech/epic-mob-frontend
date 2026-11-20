"use client";

import { useState, type CSSProperties } from "react";
import {
  alternateFills,
  currentGlass,
  doorFace,
  doorFills,
  doorOpening,
  doorType,
  type DoorFace,
  type DoorOpening,
} from "@/lib/atelier/door-types";
import { autoDoorCount, doorCountOptions } from "@/lib/atelier/doors";
import type { AtelierCatalog, AtelierConfig, AtelierGlass, DoorFill } from "@/lib/atelier/types";
import { glassSwatchStyle } from "./glass-look";
import { swatchStyle, type MaterialLook } from "./material-look";
import type { Act } from "./session";
import { Choice, Field, RadioGroup, Section, SelectedMark, decorName } from "./ui";

/* ── how the doors open: three picture cards ── */

function OpeningGlyph({ kind }: { kind: DoorOpening }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg viewBox="0 0 48 40" className="atelier-opening__glyph" aria-hidden="true">
      {kind === "GLISANTE" && (
        <g {...common}>
          <rect x="6" y="5" width="20" height="30" rx="1.5" />
          <rect x="22" y="5" width="20" height="30" rx="1.5" fill="#fff" />
          <path d="M28 20h9M34 17l3 3-3 3" />
        </g>
      )}
      {kind === "BATANTE" && (
        <g {...common}>
          <rect x="6" y="5" width="36" height="30" rx="1.5" />
          <path d="M24 5v30" />
          <path d="M24 5l-9 4v28l9-2" fill="#fff" />
          <path d="M28 19v3" />
        </g>
      )}
      {kind === "NONE" && (
        <g {...common}>
          <rect x="6" y="5" width="36" height="30" rx="1.5" />
          <path d="M24 5v30M6 15h18M6 25h18M27 11h12" />
          <path d="M30 11l-1.5 9h6L33 11M36 11l-1 7" strokeWidth="1.2" />
        </g>
      )}
    </svg>
  );
}

/** Plain words first („Alunecă lateral"); the trade name („uși glisante") is the small line under it. */
const OPENINGS: { value: DoorOpening; name: string; benefit: string }[] = [
  { value: "GLISANTE", name: "Alunecă lateral", benefit: "uși glisante — nu ocupă loc în cameră" },
  { value: "BATANTE", name: "Se deschid spre tine", benefit: "uși batante — ca la un dulap obișnuit" },
  { value: "NONE", name: "Fără uși", benefit: "totul la vedere" },
];

/* ── the face of the doors ── */

const FACE_NAME: Record<DoorFill, string> = { PANOU: "Culoare", OGLINDA: "Oglindă", STICLA: "Sticlă" };
const NEXT_FACE: Record<DoorFill, DoorFill> = { PANOU: "OGLINDA", OGLINDA: "STICLA", STICLA: "PANOU" };

/** Older CRM (no mirror / glass types): one face for all the doors. */
const UNIFORM_FACES: { value: DoorFace; label: string }[] = [
  { value: "PANOU", label: "Culoarea fronturilor" },
  { value: "OGLINDA", label: "Oglindă" },
  { value: "STICLA", label: "Sticlă" },
];

/** „Oglindă argintie 4 mm" → „Argintie 4 mm": the row is already titled „Tip oglindă". */
function glassName(name: string, kind: "OGLINDA" | "STICLA"): string {
  const short = decorName(name)
    .replace(kind === "OGLINDA" ? /^oglind[ăa]\s+/iu : /^sticl[ăa]\s+/iu, "")
    .trim();
  return short ? short.charAt(0).toUpperCase() + short.slice(1) : name;
}

/** The first few types; the rest behind „Mai multe". */
const GLASS_FIRST = 5;

function GlassRow({
  kind,
  list,
  selectedId,
  onPick,
}: {
  kind: "OGLINDA" | "STICLA";
  list: AtelierGlass[];
  selectedId: string | undefined;
  onPick: (id: string) => void;
}) {
  const [all, setAll] = useState(false);
  const selected = currentGlass(list, selectedId);
  // the chosen one is always on screen, even when it lives behind „Mai multe"
  const first = list.slice(0, GLASS_FIRST);
  const shown = all || list.length <= GLASS_FIRST + 1 ? list : selected && !first.includes(selected) ? [...first.slice(0, -1), selected] : first;
  const label = kind === "OGLINDA" ? "Tip oglindă" : "Tip sticlă";
  if (list.length === 0) return null;

  return (
    <div className="atelier-glassrow" data-anchor={kind === "OGLINDA" ? "oglinda" : "sticla"}>
      <p className="atelier-label">
        {label}
        {selected && <span className="atelier-glassrow__current"> · {glassName(selected.name, kind)}</span>}
      </p>
      <RadioGroup label={label} className="atelier-glasses">
        {shown.map((g) => (
          <button
            key={g.id}
            type="button"
            role="radio"
            aria-checked={g.id === selected?.id}
            aria-label={decorName(g.name)}
            title={decorName(g.name)}
            className="atelier-glass"
            onClick={() => g.id !== selectedId && onPick(g.id)}
          >
            <span className="atelier-glass__chip" style={glassSwatchStyle(kind, g)}>
              {g.id === selected?.id && <SelectedMark />}
            </span>
            <span className="atelier-glass__name">{glassName(g.name, kind)}</span>
          </button>
        ))}
        {shown.length < list.length && (
          <button type="button" className="atelier-glass atelier-glass--more" onClick={() => setAll(true)}>
            <span className="atelier-glass__chip">+{list.length - shown.length}</span>
            <span className="atelier-glass__name">Mai multe</span>
          </button>
        )}
      </RadioGroup>
    </div>
  );
}

export function DoorsPanel({
  catalog,
  config,
  act,
  front,
}: {
  catalog: AtelierCatalog;
  config: AtelierConfig;
  act: Act;
  /** the look of the fronts: a door in „culoarea fronturilor" is drawn with it */
  front: MaterialLook;
}) {
  const { doors } = config;
  const opening = doorOpening(doors.type);
  const sliding = opening === "GLISANTE";
  const fills = doorFills(config);
  const handleTypes = catalog.handles?.types ?? [];
  const glass = catalog.glass;
  // per-door faces and mirror / glass types need a CRM that knows them
  const perDoor = !!glass;
  const mirrors = glass?.mirrors ?? [];
  const glasses = glass?.glasses ?? [];
  const auto = autoDoorCount(config.widthMm);
  // only counts whose doors fit on a sheet (too-wide doors cannot be cut)
  const counts = doorCountOptions(config.widthMm, doors.count);
  // hinged doors need a handle the CRM can price; without any (old cached catalog) the option is hidden
  const openings = OPENINGS.filter((o) => o.value !== "BATANTE" || handleTypes.length > 0 || opening === "BATANTE");
  const uniformFace = fills.length > 0 && fills.every((f) => f === fills[0]) ? fills[0] : null;

  const setOpening = (o: DoorOpening) => {
    if (o === opening) return;
    // the same face on every door carries over; a mix starts again from the plain doors
    act({ type: "setDoors", doors: { type: doorType(o, uniformFace ?? "PANOU"), mirrorId: doors.mirrorId, glassId: doors.glassId } });
  };
  const all = (fill: DoorFill) => act({ type: "setDoorFills", fills: fills.map(() => fill) });
  const faceStyle = (fill: DoorFill): CSSProperties =>
    fill === "PANOU"
      ? swatchStyle(front)
      : glassSwatchStyle(fill, currentGlass(fill === "OGLINDA" ? mirrors : glasses, fill === "OGLINDA" ? doors.mirrorId : doors.glassId));
  const noun = sliding ? "Ușa" : "Coloana";
  const anyMirror = fills.includes("OGLINDA");
  const anyGlass = fills.includes("STICLA");
  const alternate = alternateFills(fills.length);
  const isAlternate = fills.length > 1 && fills.every((f, i) => f === alternate[i]);

  return (
    <Section title="Uși" anchor="usi">
      <div className="atelier-box">
        <RadioGroup label="Cum se deschid ușile" selectOnArrow className="atelier-openings">
          {openings.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={o.value === opening}
              aria-label={`${o.name} (${o.benefit})`}
              className="atelier-card atelier-opening"
              onClick={() => setOpening(o.value)}
            >
              <OpeningGlyph kind={o.value} />
              <span className="atelier-card__name">{o.name}</span>
              <span className="atelier-opening__sub">{o.benefit}</span>
            </button>
          ))}
        </RadioGroup>

        {opening !== "NONE" && !perDoor && (
          <div className="atelier-rows mt-3">
            <Field label="Fața ușilor">
              <Choice
                label="Fața ușilor"
                value={doorFace(doors.type)}
                options={UNIFORM_FACES}
                onChange={(f) => act({ type: "setDoorFills", fills: fills.map(() => f) })}
              />
            </Field>
          </div>
        )}

        {opening !== "NONE" && perDoor && (
          <div className="atelier-faces">
            <p className="atelier-label">Ce pui pe uși?</p>
            <div className="atelier-faces__quick" role="group" aria-label="Alege rapid pentru toate ușile">
              <button type="button" className="atelier-chip atelier-chip--sm" aria-pressed={uniformFace === "PANOU"} onClick={() => all("PANOU")}>
                Fără oglinzi
              </button>
              <button type="button" className="atelier-chip atelier-chip--sm" aria-pressed={uniformFace === "OGLINDA"} onClick={() => all("OGLINDA")}>
                Toate oglindă
              </button>
              {fills.length > 1 && (
                <button
                  type="button"
                  className="atelier-chip atelier-chip--sm"
                  aria-pressed={isAlternate}
                  onClick={() => act({ type: "setDoorFills", fills: alternate })}
                >
                  Una da, una nu
                </button>
              )}
              {glasses.length > 0 && (
                <button type="button" className="atelier-chip atelier-chip--sm" aria-pressed={uniformFace === "STICLA"} onClick={() => all("STICLA")}>
                  Toate sticlă
                </button>
              )}
            </div>

            <p className="atelier-hint atelier-faces__hint">
              Sau atinge o ușă ca s-o schimbi: culoare → oglindă{glasses.length > 0 ? " → sticlă" : ""}.
            </p>
            <div className="atelier-doorchips" role="group" aria-label="Fața fiecărei uși">
              {fills.map((fill, i) => {
                let next = NEXT_FACE[fill];
                if (next === "STICLA" && glasses.length === 0) next = "PANOU";
                return (
                  <button
                    key={i}
                    type="button"
                    className="atelier-doorchip"
                    data-fill={fill}
                    aria-label={`${noun} ${i + 1}: ${FACE_NAME[fill].toLowerCase()}. Atinge pentru ${FACE_NAME[next].toLowerCase()}.`}
                    onClick={() => act({ type: "setDoorFill", index: i, fill: next })}
                  >
                    <span className="atelier-doorchip__door" style={faceStyle(fill)} aria-hidden="true" />
                    <span className="atelier-doorchip__n">
                      {noun} {i + 1}
                    </span>
                    <span className="atelier-doorchip__face">{FACE_NAME[fill]}</span>
                  </button>
                );
              })}
            </div>

            {anyMirror && (
              <GlassRow kind="OGLINDA" list={mirrors} selectedId={doors.mirrorId} onPick={(mirrorId) => act({ type: "setDoorGlass", mirrorId })} />
            )}
            {anyGlass && (
              <GlassRow kind="STICLA" list={glasses} selectedId={doors.glassId} onPick={(glassId) => act({ type: "setDoorGlass", glassId })} />
            )}
          </div>
        )}

        {sliding && (
          <div className="atelier-rows mt-3">
            <Field label="Număr de uși">
              <Choice
                label="Număr de uși"
                value={doors.count ?? 0}
                options={[{ value: 0, label: `Automat (${auto})` }, ...counts.map((c) => ({ value: c, label: String(c) }))]}
                onChange={(count) => {
                  const next = { ...doors };
                  if (count) next.count = count;
                  else delete next.count;
                  act({ type: "setDoors", doors: next });
                }}
              />
            </Field>
          </div>
        )}
      </div>
    </Section>
  );
}
