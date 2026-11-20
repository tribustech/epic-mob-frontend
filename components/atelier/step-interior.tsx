"use client";

import { DoorClosed, DoorOpen, Plus, Rows3, SquareDashed, Trash2 } from "lucide-react";
import {
  BARA_SERTARE_RANGE,
  BOTTOM_DEFAULT_HEIGHT_MM,
  BOTTOM_HEIGHT_RANGE,
  CONTENT_LABELS,
  FRONT_LABELS,
  POLITE_BARA_SHELVES,
  SERTARE_RANGE,
  SHELF_CHOICES,
  SHELF_CONTENTS,
  autoDrawers,
  autoShelves,
  categoryRules,
} from "@/lib/atelier/categories";
import { doorFace, doorOpening, doorType, type DoorFace, type DoorOpening } from "@/lib/atelier/door-types";
import { autoDoorCount, doorCountOptions } from "@/lib/atelier/doors";
import { hasHandledFronts } from "@/lib/atelier/handles";
import { MAX_COL_MM, MIN_COL_MM } from "@/lib/atelier/state";
import type { AtelierCatalog, AtelierConfig, BottomType, ColumnContent } from "@/lib/atelier/types";
import { ContentGlyph } from "./content-glyph";
import { HandlePicker } from "./handle-picker";
import type { Act } from "./session";
import { Choice, Field, LengthControl, Section, Stepper, cm, plural } from "./ui";

/** Shorter chip labels for the dressing interiors (the full ones are in CONTENT_LABELS). */
const SHORT_LABELS: Partial<Record<ColumnContent, string>> = {
  BARA: "Bară haine",
  BARA_DUBLA: "Bară dublă",
  DESCHIS: "Deschis",
};

const shelvesText = (n: number) => (n === 0 ? "fără polițe" : plural(n, "poliță", "polițe"));
const drawersText = (n: number) => plural(n, "sertar", "sertare");

/* ── Columns ── */

function ColumnEditor({ config, index, act }: { config: AtelierConfig; index: number; act: Act }) {
  const col = config.columns[index];
  const n = config.columns.length;
  const { contents } = categoryRules(config.category);
  // comode / corpuri suspendate: the column choice is the front (door type); shelves are the interior
  const byFront = config.category === "COMODA" || config.category === "SUSPENDAT";
  const hinged = config.doors.type.startsWith("BATANTE");
  const compartment = config.category !== "DRESSING";
  const noun = compartment ? "compartimentul" : "coloana";
  // Same rule as the CRM: drawers share the body height (total minus legs).
  const bodyHeight = config.heightMm - config.legsMm;
  // the widths the reducer accepts for this column (the others must stay within 30–120 cm)
  const lo = Math.max(MIN_COL_MM, config.widthMm - MAX_COL_MM * (n - 1));
  const hi = Math.min(MAX_COL_MM, config.widthMm - MIN_COL_MM * (n - 1));

  return (
    <div className="atelier-box">
      <div className="atelier-box__head">
        <h3 className="atelier-box__title">
          {compartment ? "Compartimentul" : "Coloana"} {index + 1}
          <span className="atelier-box__of"> din {n}</span>
        </h3>
        <button
          type="button"
          className="atelier-textbtn atelier-textbtn--danger"
          onClick={() => act({ type: "removeColumn", index })}
          disabled={n <= 1}
          aria-label={`Elimină ${noun} ${index + 1}`}
        >
          <Trash2 size={15} aria-hidden="true" /> Elimină
        </button>
      </div>

      {contents.length > 1 && (
        <Choice
          label={byFront ? (config.category === "COMODA" ? "Sertare sau uși" : "Tip ușă") : "Interior"}
          columns={2}
          value={col.content}
          options={contents.map((c) => ({
            value: c,
            label: (byFront && FRONT_LABELS[c]) || SHORT_LABELS[c] || CONTENT_LABELS[c],
            icon: <ContentGlyph content={c} className="atelier-glyph--chip" />,
          }))}
          onChange={(content) => act({ type: "setColumnContent", index, content })}
        />
      )}

      <div className="atelier-rows mt-3">
        <Field label="Lățime" hint={n > 1 ? "restul se reîmparte automat" : compartment ? "un singur compartiment: cât tot corpul" : "o singură coloană: cât tot corpul"}>
          <LengthControl
            key={`${config.category}-${index}`}
            id={`atelier-col-${index}-width`}
            label={`Lățime ${noun} ${index + 1}`}
            valueMm={col.widthMm}
            minMm={lo}
            maxMm={Math.max(lo, hi)}
            disabled={n <= 1}
            onCommit={(widthMm) => act({ type: "setColumnWidth", index, widthMm })}
          />
        </Field>

        {byFront && SHELF_CONTENTS.has(col.content) && (
          <Field label="Polițe în interior">
            <Stepper
              label="Polițe în interior"
              value={col.shelves ?? autoShelves(col.content, bodyHeight)}
              min={SHELF_CHOICES[0]}
              max={SHELF_CHOICES[SHELF_CHOICES.length - 1]}
              format={shelvesText}
              onChange={(shelves) => act({ type: "setColumnShelves", index, shelves })}
            />
          </Field>
        )}

        {col.content === "POLITE_BARA" && (
          <>
            <Field label="Unde stă bara" hint="o jumătate cu bară pentru haine scurte, cealaltă cu polițe">
              <Choice
                label="Unde stă bara"
                value={col.railPosition ?? "SUS"}
                options={[
                  { value: "SUS", label: "Bară sus" },
                  { value: "JOS", label: "Bară jos" },
                ]}
                onChange={(railPosition) => act({ type: "setColumnRail", index, railPosition })}
              />
            </Field>
            <Field label="Număr de polițe">
              <Choice
                label="Număr de polițe"
                value={col.shelves ?? 0}
                options={[
                  { value: 0, label: "Automat" },
                  ...Array.from({ length: POLITE_BARA_SHELVES[1] - POLITE_BARA_SHELVES[0] + 1 }, (_, i) => ({
                    value: POLITE_BARA_SHELVES[0] + i,
                    label: String(POLITE_BARA_SHELVES[0] + i),
                  })),
                ]}
                onChange={(shelves) => act({ type: "setColumnShelves", index, shelves: shelves || undefined })}
              />
            </Field>
          </>
        )}

        {col.content === "BARA_SERTARE" && (
          <Field label="Sertare" hint="jos, în interior">
            <Stepper
              label="Sertare în interior"
              value={col.drawers ?? 1}
              min={BARA_SERTARE_RANGE[0]}
              max={BARA_SERTARE_RANGE[1]}
              format={drawersText}
              onChange={(drawers) => act({ type: "setColumnDrawers", index, drawers })}
            />
          </Field>
        )}

        {col.content === "SERTARE" && (
          <Field label="Număr de sertare">
            <Stepper
              label="Număr de sertare"
              value={col.drawers}
              autoValue={autoDrawers(bodyHeight)}
              min={SERTARE_RANGE[0]}
              max={SERTARE_RANGE[1]}
              format={drawersText}
              onChange={(drawers) => act({ type: "setColumnDrawers", index, drawers })}
            />
          </Field>
        )}

        {hinged && (
          <>
            <Field label="Uși pe lățime">
              <Choice
                label="Uși pe lățime"
                value={col.doorsAcross ?? 1}
                options={[
                  { value: 1, label: "O ușă" },
                  { value: 2, label: "Două uși" },
                ]}
                onChange={(doorsAcross) => act({ type: "setColumnDoorsAcross", index, doorsAcross })}
              />
            </Field>
            <Field label="Uși pe înălțime" hint="una peste alta">
              <Choice
                label="Uși pe înălțime"
                value={col.doorRows ?? 1}
                options={[
                  { value: 1, label: "1" },
                  { value: 2, label: "2" },
                  { value: 3, label: "3" },
                ]}
                onChange={(doorRows) => act({ type: "setColumnDoorRows", index, doorRows })}
              />
            </Field>
          </>
        )}
      </div>
    </div>
  );
}

function Columns({
  config,
  act,
  index,
  onPick,
}: {
  config: AtelierConfig;
  act: Act;
  /** the selected column (also pointed at in the 3D view) */
  index: number;
  onPick: (index: number) => void;
}) {
  const n = config.columns.length;
  const canAdd = config.columns.some((c) => c.widthMm >= 2 * MIN_COL_MM);
  const dressing = config.category === "DRESSING";
  const noun = dressing ? "coloană" : "compartiment";

  return (
    <Section
      title={dressing ? `Coloane (${n})` : `Compartimente (${n})`}
      hint={
        dressing
          ? "Atinge o coloană ca să-i alegi interiorul. Fiecare are între 30 și 120 cm."
          : "Atinge un compartiment ca să-l schimbi. Fiecare are între 30 și 120 cm."
      }
    >
      <div className="atelier-cols" role="group" aria-label={dressing ? "Coloane" : "Compartimente"}>
        {config.columns.map((col, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={i === index}
            aria-label={`${noun} ${i + 1}: ${CONTENT_LABELS[col.content]}, ${cm(col.widthMm)} cm`}
            className="atelier-col"
            style={{ flexGrow: col.widthMm }}
            onClick={() => onPick(i)}
          >
            <ContentGlyph content={col.content} className="atelier-col__glyph" />
            <span className="atelier-col__w">{cm(col.widthMm)}</span>
          </button>
        ))}
        <button
          type="button"
          className="atelier-col atelier-col--add"
          onClick={() => act({ type: "addColumn" })}
          disabled={!canAdd}
          aria-label={`Adaugă ${noun}`}
          title={`Adaugă ${noun}`}
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3">
        <ColumnEditor config={config} index={index} act={act} />
      </div>
    </Section>
  );
}

/* ── Doors (dressing) ── */

const OPENINGS: { value: DoorOpening; label: string; icon: React.ReactNode }[] = [
  { value: "GLISANTE", label: "Glisante", icon: <Rows3 size={16} className="rotate-90" aria-hidden="true" /> },
  { value: "BATANTE", label: "Batante", icon: <DoorOpen size={16} aria-hidden="true" /> },
  { value: "NONE", label: "Fără uși", icon: <SquareDashed size={16} aria-hidden="true" /> },
];

const FACES: { value: DoorFace; label: string }[] = [
  { value: "PANOU", label: "Decorul fronturilor" },
  { value: "OGLINDA", label: "Oglindă" },
  { value: "STICLA", label: "Sticlă" },
];

function Doors({ catalog, config, act }: { catalog: AtelierCatalog; config: AtelierConfig; act: Act }) {
  const { doors } = config;
  const opening = doorOpening(doors.type);
  const face = doorFace(doors.type);
  const sliding = opening === "GLISANTE";
  const handleTypes = catalog.handles?.types ?? [];
  const auto = autoDoorCount(config.widthMm);
  // only counts whose doors fit on a sheet (too-wide doors cannot be cut)
  const counts = doorCountOptions(config.widthMm, doors.count);

  return (
    <Section title="Uși">
      <div className="atelier-box">
        <Choice
          label="Tip uși"
          columns={3}
          value={opening}
          // hinged doors need a handle the CRM can price; without any (old cached catalog) the option is hidden
          options={OPENINGS.filter((o) => o.value !== "BATANTE" || handleTypes.length > 0 || opening === "BATANTE")}
          onChange={(o) => act({ type: "setDoors", doors: { type: doorType(o, face) } })}
        />
        {opening !== "NONE" && (
          <div className="atelier-rows mt-3">
            <Field label="Fața ușilor">
              <Choice
                label="Fața ușilor"
                value={face}
                options={FACES}
                onChange={(f) =>
                  act({
                    type: "setDoors",
                    doors: sliding ? { ...doors, type: doorType(opening, f) } : { type: doorType(opening, f) },
                  })
                }
              />
            </Field>
            {opening === "BATANTE" && <HandlePicker catalog={catalog} config={config} act={act} />}
            {sliding && (
              <Field label="Număr de uși">
                <Choice
                  label="Număr de uși"
                  value={doors.count ?? 0}
                  options={[{ value: 0, label: `Automat (${auto})` }, ...counts.map((c) => ({ value: c, label: String(c) }))]}
                  onChange={(count) =>
                    act({ type: "setDoors", doors: count ? { type: doors.type, count } : { type: doors.type } })
                  }
                />
              </Field>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

/* ── Separator: the closed bottom ── */

const BOTTOMS: { value: BottomType; label: string; icon: React.ReactNode }[] = [
  { value: "NONE", label: "Deschis", icon: <SquareDashed size={16} aria-hidden="true" /> },
  { value: "SERTARE", label: "Sertare", icon: <Rows3 size={16} aria-hidden="true" /> },
  { value: "USI", label: "Uși", icon: <DoorClosed size={16} aria-hidden="true" /> },
];

/** Separator: optional closed bottom (drawers or doors) under the open shelves, with a PFL back. */
function Bottom({ catalog, config, act }: { catalog: AtelierCatalog; config: AtelierConfig; act: Act }) {
  const bottom = config.bottom ?? { type: "NONE" as const };
  const active = bottom.type !== "NONE";

  return (
    <Section title="Partea de jos" hint="Deschis până jos, sau cu sertare ori uși în partea de jos.">
      <div className="atelier-box">
        <Choice
          label="Partea de jos"
          columns={3}
          value={bottom.type}
          options={BOTTOMS}
          onChange={(type) => act({ type: "setBottom", bottom: { ...bottom, type } })}
        />
        {active && (
          <div className="atelier-rows mt-3">
            <Field label="Înălțime de la podea" hint={`${cm(BOTTOM_HEIGHT_RANGE[0])}–${cm(BOTTOM_HEIGHT_RANGE[1])} cm`}>
              <LengthControl
                id="atelier-bottom-height"
                label="Înălțime de la podea"
                valueMm={bottom.heightMm ?? BOTTOM_DEFAULT_HEIGHT_MM}
                minMm={BOTTOM_HEIGHT_RANGE[0]}
                maxMm={BOTTOM_HEIGHT_RANGE[1]}
                onCommit={(heightMm) => act({ type: "setBottom", bottom: { ...bottom, heightMm } })}
              />
            </Field>
            {bottom.type === "SERTARE" && (
              <Field label="Număr de sertare">
                <Stepper
                  label="Număr de sertare"
                  value={bottom.drawers ?? 2}
                  min={1}
                  max={3}
                  format={drawersText}
                  onChange={(drawers) => act({ type: "setBottom", bottom: { ...bottom, drawers: drawers as 1 | 2 | 3 } })}
                />
              </Field>
            )}
            {bottom.type === "USI" && (
              <Field label="Polițe în spatele ușilor">
                <Stepper
                  label="Polițe în spatele ușilor"
                  value={bottom.shelves ?? 1}
                  min={0}
                  max={4}
                  format={shelvesText}
                  onChange={(shelves) => act({ type: "setBottom", bottom: { ...bottom, shelves } })}
                />
              </Field>
            )}
            <HandlePicker catalog={catalog} config={config} act={act} />
          </div>
        )}
      </div>
    </Section>
  );
}

export function StepInterior({
  catalog,
  config,
  act,
  column,
  onColumn,
}: {
  catalog: AtelierCatalog;
  config: AtelierConfig;
  act: Act;
  column: number;
  onColumn: (index: number) => void;
}) {
  return (
    <div className="atelier-stack">
      <Columns config={config} act={act} index={column} onPick={onColumn} />
      {config.category === "SEPARATOR" && <Bottom catalog={catalog} config={config} act={act} />}
      {categoryRules(config.category).slidingDoors && <Doors catalog={catalog} config={config} act={act} />}
      {(config.category === "COMODA" || config.category === "SUSPENDAT") && hasHandledFronts(config) && (
        <Section title="Mânere">
          <div className="atelier-box">
            <HandlePicker catalog={catalog} config={config} act={act} />
          </div>
        </Section>
      )}
    </div>
  );
}
