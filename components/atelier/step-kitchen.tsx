"use client";

import { ArrowLeftRight, ArrowUpDown, Lightbulb, MoveDiagonal, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { categoryRules } from "@/lib/atelier/categories";
import {
  BATH_COUNTER_MM,
  BATH_HUNG_BODY_MM,
  BATH_UPPER_GAP_MM,
  KITCHEN_DEFAULT_DRAWERS,
  LAYOUT_LABELS,
  LEG_B_RANGE,
  UPPER_LABELS,
  cornerIndex,
  drawerRangeOf,
  isBath,
  isTall,
  kitchenLayout,
  legBModulesMm,
  moduleHint,
  moduleLabel,
  profileOf,
  upperOf,
  widthRange,
} from "@/lib/atelier/kitchen";
import type { AtelierColumn, AtelierConfig, KitchenLayout } from "@/lib/atelier/types";
import { ContentGlyph } from "./content-glyph";
import type { Act } from "./session";
import { Choice, Field, LengthControl, Section, Stepper, cm, plural } from "./ui";

/** The module picked in the „Module" step: which wall, which module. */
export interface KitchenPick {
  leg: "A" | "B";
  index: number;
}

const sideName = (layout: KitchenLayout) => (layout === "L_STANGA" ? "din stânga" : "din dreapta");

/** The walls as the client reads them. */
function wallTitle(config: AtelierConfig, leg: "A" | "B"): string {
  const layout = kitchenLayout(config);
  if (config.category === "BAIE") return "Peretele";
  if (layout === "LINIAR") return "Bucătăria";
  return leg === "A" ? "Peretele principal" : `Peretele ${sideName(layout)}`;
}

/* ── Dimensiuni: the shape and the walls ── */

function LayoutGlyph({ layout }: { layout: KitchenLayout }) {
  const path =
    layout === "LINIAR" ? "M8 10 h84 v14 h-84 z" : layout === "L_STANGA" ? "M8 10 h84 v14 h-70 v66 h-14 z" : "M8 10 h84 v80 h-14 v-66 h-70 z";
  return (
    <svg viewBox="0 0 100 100" className="atelier-glyph atelier-glyph--chip" fill="currentColor" fillOpacity={0.2} stroke="currentColor" strokeWidth={3} aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function SizeCard({ icon, label, range, children }: { icon: ReactNode; label: string; range: readonly [number, number]; children: ReactNode }) {
  return (
    <div className="atelier-box">
      <div className="atelier-size__head">
        <span className="atelier-size__icon" aria-hidden="true">
          {icon}
        </span>
        <h3 className="atelier-box__title">{label}</h3>
        <p className="atelier-hint ml-auto">
          {cm(range[0])}–{cm(range[1])} cm
        </p>
      </div>
      {children}
    </div>
  );
}

export function KitchenSize({ config, act, heightIssue = null }: { config: AtelierConfig; act: Act; heightIssue?: string | null }) {
  const bath = isBath(config);
  const rules = categoryRules(config.category);
  const layout = kitchenLayout(config);
  const legB = config.kitchen?.legB;
  const quick = bath ? [600, 800, 1000, 1200, 1600] : [1800, 2400, 2700, 3000, 3600];
  return (
    <div className="atelier-stack">
      {!bath && <Section title="Forma bucătăriei" anchor="forma" hint="Pe un singur perete, sau pe doi pereți care fac colț (în L).">
        <Choice
          label="Forma bucătăriei"
          columns={3}
          value={layout}
          options={(["LINIAR", "L_STANGA", "L_DREAPTA"] as const).map((l) => ({ value: l, label: LAYOUT_LABELS[l], icon: <LayoutGlyph layout={l} /> }))}
          onChange={(l) => act({ type: "setKitchenLayout", layout: l })}
        />
      </Section>}

      <Section
        title="Dimensiuni"
        anchor="dimensiuni"
        hint={`${bath ? "Lungimea peretelui pe care stă mobilierul de baie" : "Lungimea pereților pe care stă bucătăria"}. Aproximativ e de ajuns — măsurăm noi exact înainte de execuție.`}
      >
        <div className="space-y-3">
          <SizeCard icon={<ArrowLeftRight size={16} />} label={bath ? "Lățimea mobilierului" : layout === "LINIAR" ? "Lungimea peretelui" : "Peretele principal"} range={rules.width}>
            <LengthControl
              key="k-w"
              id="atelier-width"
              label="Lungimea peretelui principal"
              valueMm={config.widthMm}
              minMm={rules.width[0]}
              maxMm={rules.width[1]}
              slider
              onCommit={(widthMm) => act({ type: "setSize", widthMm })}
            />
            <div className="atelier-scrollrow atelier-scrollrow--wrap mt-3" role="group" aria-label="Lungimi uzuale">
              {quick.map((w) => (
                <button
                  key={w}
                  type="button"
                  className="atelier-chip atelier-chip--sm"
                  aria-pressed={config.widthMm === w}
                  onClick={() => config.widthMm !== w && act({ type: "setSize", widthMm: w })}
                >
                  {cm(w)} cm
                </button>
              ))}
            </div>
          </SizeCard>
          {!bath && layout !== "LINIAR" && legB && (
            <SizeCard icon={<ArrowLeftRight size={16} />} label={`Peretele ${sideName(layout)}`} range={LEG_B_RANGE}>
              <LengthControl
                key="k-b"
                id="atelier-legb"
                label={`Lungimea peretelui ${sideName(layout)}`}
                valueMm={legB.widthMm}
                minMm={LEG_B_RANGE[0]}
                maxMm={LEG_B_RANGE[1]}
                slider
                onCommit={(widthMm) => act({ type: "setLegB", widthMm })}
              />
              <p className="atelier-hint mt-2">Măsurat din colț, cu tot cu colțul.</p>
            </SizeCard>
          )}
          <SizeCard icon={<ArrowUpDown size={16} />} label={bath ? "Înălțime până sus la dulapul cu oglindă" : "Înălțime până sus la dulapuri"} range={rules.height}>
            <LengthControl
              key="k-h"
              id="atelier-height"
              label="Înălțime"
              valueMm={config.heightMm}
              minMm={rules.height[0]}
              maxMm={rules.height[1]}
              slider
              onCommit={(heightMm) => act({ type: "setSize", heightMm })}
            />
            {heightIssue && (
              <p className="atelier-length__note atelier-length__note--left" role="alert">
                {heightIssue}
              </p>
            )}
            <p className="atelier-hint mt-2">
              {bath
                ? `Blatul lavoarului stă la ${cm(BATH_COUNTER_MM)} cm (90 cm cu mașină de spălat), dulapul cu oglindă începe la ${cm(BATH_UPPER_GAP_MM)} cm deasupra lui.`
                : "Blatul stă la 90 cm, dulapurile de sus încep la 55 cm deasupra lui."}
            </p>
          </SizeCard>
          <SizeCard icon={<MoveDiagonal size={16} />} label={bath ? "Adâncimea blatului (lavoarului)" : "Adâncimea blatului"} range={rules.depth}>
            <LengthControl
              key="k-d"
              id="atelier-depth"
              label="Adâncimea blatului"
              valueMm={config.depthMm}
              minMm={rules.depth[0]}
              maxMm={rules.depth[1]}
              onCommit={(depthMm) => act({ type: "setSize", depthMm })}
            />
          </SizeCard>
        </div>
      </Section>

      <Section
        title={bath ? "Montaj" : "Picioare"}
        hint={bath ? `Suspendat pe perete (corpul de jos are ${cm(BATH_HUNG_BODY_MM)} cm, podeaua rămâne liberă) sau pe picioare de 10 cm.` : "Soclul de sub dulapurile de jos."}
      >
        <Choice
          label={bath ? "Montaj" : "Înălțime picioare"}
          value={config.legsMm}
          options={rules.legs.map((legsMm) => ({ value: legsMm, label: legsMm === 0 ? "Suspendat" : bath ? `Pe picioare (${cm(legsMm)} cm)` : `${cm(legsMm)} cm` }))}
          onChange={(legsMm) => act({ type: "setLegs", legsMm })}
        />
      </Section>
    </div>
  );
}

/* ── Module: what goes where, on every wall ── */

const drawersText = (n: number) => plural(n, "sertar", "sertare");

function ModuleEditor({ config, pick, act }: { config: AtelierConfig; pick: KitchenPick; act: Act }) {
  const legB = pick.leg === "B" ? config.kitchen?.legB : null;
  const cols = legB ? legB.columns : config.columns;
  const col: AtelierColumn | undefined = cols[pick.index];
  if (!col) return null;
  const leg = pick.leg === "B" ? ("B" as const) : undefined;
  const corner = pick.leg === "A" ? cornerIndex(kitchenLayout(config), cols.length) : -1;
  const isCorner = pick.index === corner;
  const p = profileOf(config);
  const [lo, hi] = widthRange(col.content, p);
  const up = upperOf(col, p.bath);
  const drawerRange = drawerRangeOf(col.content);
  const n = cols.length;

  return (
    <div className="atelier-box">
      <div className="atelier-box__head">
        <h3 className="atelier-box__title">
          {moduleLabel(col.content, p.bath)}
          <span className="atelier-box__of">
            {" "}
            · modulul {pick.index + 1} din {n}
          </span>
        </h3>
        {!isCorner && (
          <button
            type="button"
            className="atelier-textbtn atelier-textbtn--danger"
            onClick={() => act({ type: "removeColumn", index: pick.index, leg })}
            disabled={n <= 1}
            aria-label={`Elimină modulul ${pick.index + 1}`}
          >
            <Trash2 size={15} aria-hidden="true" /> Elimină
          </button>
        )}
      </div>
      <p className="atelier-hint -mt-2 mb-3">{moduleHint(col.content, p.bath)}</p>

      {!isCorner && (
        <Choice
          label="Ce pui aici"
          columns={2}
          value={col.content}
          options={p.modules.map((c) => ({
            value: c,
            label: moduleLabel(c, p.bath),
            icon: <ContentGlyph content={c} className="atelier-glyph--chip" />,
          }))}
          onChange={(content) => act({ type: "setColumnContent", index: pick.index, content, leg })}
        />
      )}

      <div className="atelier-rows mt-3">
        <Field label="Lățime" hint={lo === hi ? undefined : `${cm(lo)}–${cm(hi)} cm; restul se reîmparte automat`}>
          <LengthControl
            key={`${pick.leg}-${pick.index}-${col.content}`}
            id={`atelier-mod-${pick.leg}-${pick.index}-width`}
            label={`Lățime modul ${pick.index + 1}`}
            valueMm={col.widthMm}
            minMm={lo}
            maxMm={hi}
            disabled={n <= 1 || lo === hi}
            onCommit={(widthMm) => act({ type: "setColumnWidth", index: pick.index, widthMm, leg })}
          />
        </Field>
        {drawerRange && (
          <Field label="Număr de sertare">
            <Stepper
              label="Număr de sertare"
              value={col.drawers ?? (col.content === "LAVOAR" || p.bath ? 2 : KITCHEN_DEFAULT_DRAWERS)}
              min={drawerRange[0]}
              max={drawerRange[1]}
              format={drawersText}
              onChange={(drawers) => act({ type: "setColumnDrawers", index: pick.index, drawers, leg })}
            />
          </Field>
        )}
      </div>

      {up !== null && (
        <div className="mt-3">
          <Choice
            label="Deasupra, pe perete"
            value={up}
            options={p.uppers.map((u) => ({ value: u, label: UPPER_LABELS[u] }))}
            onChange={(upper) => act({ type: "setColumnUpper", index: pick.index, upper, leg })}
          />
          <p className="atelier-hint mt-1.5">{p.bath ? "Deasupra, pe perete: dulap cu oglindă, dulăpior sau raft." : "Deasupra, pe perete: dulap, raft sau hotă."}</p>
        </div>
      )}
    </div>
  );
}

function Wall({
  config,
  leg,
  act,
  pick,
  onPick,
}: {
  config: AtelierConfig;
  leg: "A" | "B";
  act: Act;
  pick: KitchenPick;
  onPick: (pick: KitchenPick) => void;
}) {
  const cols = leg === "B" ? (config.kitchen?.legB?.columns ?? []) : config.columns;
  const total = leg === "B" ? legBModulesMm(config) : config.widthMm;
  const legKey = leg === "B" ? ("B" as const) : undefined;
  return (
    <Section
      anchor={leg === "B" ? "perete-2" : "module"}
      title={`${wallTitle(config, leg)} (${cm(leg === "B" ? (config.kitchen?.legB?.widthMm ?? 0) : config.widthMm)} cm)`}
      hint={
        leg === "B"
          ? `De la stânga la dreapta, privind peretele. ${cm(total)} cm de module; restul e colțul.`
          : "De la stânga la dreapta, privind peretele. Atinge un modul ca să-l schimbi."
      }
    >
      <div className="atelier-cols" role="group" aria-label={wallTitle(config, leg)}>
        {cols.map((col, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={pick.leg === leg && pick.index === i}
            aria-label={`Modulul ${i + 1}: ${moduleLabel(col.content, config.category === "BAIE")}, ${cm(col.widthMm)} cm`}
            className="atelier-col"
            style={{ flexGrow: col.widthMm }}
            onClick={() => onPick({ leg, index: i })}
          >
            <ContentGlyph content={col.content} className="atelier-col__glyph" />
            <span className="atelier-col__w">
              {cm(col.widthMm)}
              {cols.length <= 5 && <span className="atelier-col__unit"> cm</span>}
            </span>
          </button>
        ))}
        <button
          type="button"
          className="atelier-col atelier-col--add"
          onClick={() => act({ type: "addColumn", leg: legKey })}
          aria-label="Adaugă un modul"
          title="Adaugă un modul"
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
      {pick.leg === leg && (
        <div className="mt-3">
          <ModuleEditor config={config} pick={pick} act={act} />
        </div>
      )}
    </Section>
  );
}

export function StepKitchen({ config, act, pick, onPick }: { config: AtelierConfig; act: Act; pick: KitchenPick; onPick: (pick: KitchenPick) => void }) {
  const hasB = kitchenLayout(config) !== "LINIAR" && !!config.kitchen?.legB;
  const safe: KitchenPick = pick.leg === "B" && !hasB ? { leg: "A", index: 0 } : pick;
  const bath = isBath(config);
  const hasUppers = [...config.columns, ...(config.kitchen?.legB?.columns ?? [])].some((c) => {
    const u = upperOf(c, bath);
    return u !== null && u !== "NONE";
  });
  return (
    <div className="atelier-stack">
      <Wall config={config} leg="A" act={act} pick={safe} onPick={onPick} />
      {hasB && <Wall config={config} leg="B" act={act} pick={safe} onPick={onPick} />}
      {hasUppers && (
        <Section title="Lumină" hint={bath ? "Bandă LED sub dulapul de sus, cu sursă și montaj." : "Bandă LED sub dulapurile de sus, cu sursă și montaj."}>
          <Choice
            label="Lumină sub dulapuri"
            value={config.kitchen?.led ? 1 : 0}
            options={[
              { value: 0, label: "Fără LED" },
              { value: 1, label: "Cu LED", icon: <Lightbulb size={16} aria-hidden="true" /> },
            ]}
            onChange={(v) => act({ type: "setLed", led: v === 1 })}
          />
        </Section>
      )}
      <p className="atelier-hint px-1">
        {bath
          ? "Lavoarul, bateria și mașina de spălat nu sunt incluse în preț: le lăsăm locul exact, iar blatul îl decupăm pentru lavoar. Oglinda de pe ușile dulapului este inclusă."
          : "Electrocasnicele, chiuveta și bateria nu sunt incluse în preț: le lăsăm locul exact, iar blatul îl decupăm pentru ele."}
        {isTall(safe.leg === "A" ? (config.columns[safe.index]?.content ?? "USI") : "USI") ? " Coloanele înalte nu au dulap deasupra." : ""}
      </p>
    </div>
  );
}
