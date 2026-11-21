"use client";

import Link from "next/link";
import { useState } from "react";
import type { ResolvedPalette } from "@/lib/atelier/palettes";
import { COMBO_PRESETS, cardNames, categoryAvailable, presetAvailable, presetById, presetsFor, type LayoutPreset } from "@/lib/atelier/presets";
import { CATEGORY_DISPLAY } from "@/lib/atelier/categories";
import { doorOpening, hasGlass, hasMirror } from "@/lib/atelier/door-types";
import { paletteAllowed } from "@/lib/atelier/house-rules";
import { trackFunnel } from "@/lib/atelier/funnel";
import type { AtelierCatalog, AtelierCategory, AtelierConfig } from "@/lib/atelier/types";
import { glazingOf, type Glazing } from "./glass-look";
import { paletteLooks, type MaterialLook } from "./material-look";
import { MiniPreview } from "./mini-preview";

import { shapeKey, type Act } from "./session";
import { RadioGroup, Section, SelectedMark } from "./ui";

export const CATEGORY_SHORT: Record<AtelierCategory, string> = {
  DRESSING: "Dressing",
  COMODA: "Comodă",
  SEPARATOR: "Separator",
  SUSPENDAT: "Suspendat",
  BUCATARIE: "Bucătărie",
  BAIE: "Baie",
};

/** „2,4 m" / „50 cm": the width a model starts from, shown as its own badge so it never truncates. */
function sizeLabel(widthMm: number): string {
  return widthMm >= 1000 ? `${String(Math.round(widthMm / 100) / 10).replace(".", ",")} m` : `${Math.round(widthMm / 10)} cm`;
}

/** The two or three facts a newcomer looks for on a card: how it closes, mirror, drawers. */
export function modelFacts(shape: LayoutPreset["shape"]): string[] {
  const facts: string[] = [];
  const has = (...contents: string[]) => shape.columns.some((c) => contents.includes(c.content));
  if (shape.category === "DRESSING") {
    const opening = doorOpening(shape.doors.type);
    facts.push(opening === "GLISANTE" ? "Uși glisante" : opening === "BATANTE" ? "Uși batante" : "Fără uși");
    if (hasMirror(shape)) facts.push("Cu oglindă");
    else if (hasGlass(shape)) facts.push("Cu sticlă");
    if (has("BARA_SERTARE")) facts.push("Cu sertare");
  } else {
    if (has("SERTARE") || shape.bottom?.type === "SERTARE") facts.push("Cu sertare");
    if (has("USI") || shape.bottom?.type === "USI") facts.push("Cu uși");
    if (has("USA_RIDICABILA")) facts.push("Uși care se ridică");
    if (has("DESCHIS") && shape.category !== "SEPARATOR") facts.push("Cu nișă deschisă");
    if (shape.category === "SEPARATOR" && !shape.bottom) facts.push("Deschis pe ambele fețe");
  }
  return facts.slice(0, 3);
}

function ModelCard({
  name,
  tagline,
  badge,
  selected,
  preset,
  carcass,
  front,
  glazing,
  onPick,
}: {
  glazing: Glazing;
  name: string;
  tagline: string;
  badge?: string;
  selected: boolean;
  preset: LayoutPreset;
  carcass: MaterialLook;
  front: MaterialLook;
  onPick: () => void;
}) {
  return (
    <button type="button" className="atelier-card atelier-model" aria-pressed={selected} onClick={() => !selected && onPick()}>
      <span className="atelier-model__art">
        <MiniPreview shape={preset.shape} carcass={carcass} front={front} glazing={glazing} className="h-full w-full" />
        {badge && <span className="atelier-badge">{badge}</span>}
        {selected && <SelectedMark className="absolute right-2 top-2" />}
      </span>
      <span className="atelier-model__text">
        <span className="atelier-card__name">{name}</span>
        <span className="atelier-card__sub">{tagline}</span>
        <span className="atelier-model__facts">
          <span className="atelier-model__fact atelier-model__fact--size">{sizeLabel(preset.shape.widthMm)}</span>
          {modelFacts(preset.shape).map((fact) => (
            <span key={fact} className="atelier-model__fact">
              {fact}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

export function StepModel({
  catalog,
  config,
  palettes,
  activePalette,
  carcass,
  front,
  act,
}: {
  catalog: AtelierCatalog;
  config: AtelierConfig;
  palettes: ResolvedPalette[];
  activePalette: string | null;
  carcass: MaterialLook;
  front: MaterialLook;
  act: Act;
}) {
  const currentKey = shapeKey(config);
  const presets = presetsFor(config.category).filter((p) => presetAvailable(p, catalog));
  const combos = COMBO_PRESETS.flatMap((combo) => {
    const preset = presetById(combo.presetId);
    const palette = palettes.find((p) => p.id === combo.paletteId);
    // house rule: no dark chests of drawers or wall units, not even as a featured combination
    const shown = preset && palette && preset.category === config.category && presetAvailable(preset, catalog) && paletteAllowed(preset.category, palette.id);
    return shown ? [{ combo, preset, palette }] : [];
  });
  const comboNames = cardNames(combos.map(({ combo }) => combo.name));
  const presetNames = cardNames(presets.map((p) => p.name));
  // Two lists share the space: ready-made combinations (model + colours) and the plain models.
  // Open on the one that holds the current choice.
  const inCombos = combos.some(
    ({ combo, preset }) => combo.paletteId === activePalette && shapeKey(preset.shape) === currentKey,
  );
  const inModels = presets.some((preset) => shapeKey(preset.shape) === currentKey);
  const [tab, setTab] = useState<"combos" | "models">(inCombos || !inModels ? "combos" : "models");
  const list = combos.length === 0 ? "models" : presets.length === 0 ? "combos" : tab;

  const pickCategory = (category: AtelierCategory) => {
    if (category === config.category) return;
    // start the new category from its first ready-made model (or its plain defaults)
    const first = presetsFor(category).find((p) => presetAvailable(p, catalog));
    act(first ? { type: "applyPreset", shape: first.shape } : { type: "setCategory", category });
    // the 3D now shows that first model: show the list where its card is marked as chosen
    if (first) setTab("models");
    trackFunnel("category_selected", { category });
  };

  return (
    <div className="atelier-stack">
      <Section title="Ce construim?" className="atelier-section--cats">
        <RadioGroup label="Tip de mobilier" className="atelier-cats">
          {CATEGORY_DISPLAY.filter((id) => id === config.category || categoryAvailable(id, catalog)).map((id) => {
            const sample = presetsFor(id)[0];
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={config.category === id}
                className="atelier-card atelier-cat"
                onClick={() => pickCategory(id)}
              >
                <span className="atelier-cat__art">
                  {sample && <MiniPreview shape={sample.shape} carcass={carcass} front={front} bold className="h-full w-full" />}
                </span>
                <span className="atelier-cat__name">{CATEGORY_SHORT[id]}</span>
              </button>
            );
          })}
        </RadioGroup>
      </Section>

      <section className="atelier-section">
        {combos.length > 0 && presets.length > 0 && (
          <div className="atelier-switch" role="tablist" aria-label="Gata făcute, cu tot cu culori, sau doar forma">
            {(
              [
                ["combos", `Gata făcute (${combos.length})`],
                ["models", `Doar forma (${presets.length})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`atelier-list-${id}`}
                aria-selected={list === id}
                aria-controls="atelier-list-panel"
                className="atelier-switch__tab"
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div id="atelier-list-panel" role="tabpanel" aria-labelledby={`atelier-list-${list}`}>
          <p className="atelier-hint atelier-list-hint">
            {list === "combos"
              ? "Formă și culori alese de noi. Atinge una și o schimbi după plac."
              : "Toate formele, în culorile tale de acum. Dimensiunile le potrivești la pasul 3."}
          </p>
          {list === "combos" ? (
            <div className="atelier-rail">
              {combos.map(({ combo, preset, palette }, i) => {
                const looks = paletteLooks(catalog, palette);
                return (
                  <ModelCard
                    key={combo.id}
                    name={comboNames[i]}
                    tagline={combo.tagline}
                    preset={preset}
                    glazing={glazingOf(catalog, preset.shape.doors)}
                    carcass={looks.carcass}
                    front={looks.front}
                    selected={combo.paletteId === activePalette && shapeKey(preset.shape) === currentKey}
                    onPick={() => {
                      act([
                        { type: "applyPreset", shape: preset.shape },
                        { type: "applyPalette", carcassMaterialId: palette.carcassMaterialId, fronts: palette.fronts },
                      ]);
                      trackFunnel("combo_selected", { comboId: combo.id, name: combo.name });
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="atelier-grid2">
              {presets.map((preset, i) => (
                <ModelCard
                  key={preset.id}
                  name={presetNames[i]}
                  tagline={preset.tagline}
                  badge={preset.badge}
                  preset={preset}
                  glazing={glazingOf(catalog, preset.shape.doors)}
                  carcass={carcass}
                  front={front}
                  selected={shapeKey(preset.shape) === currentKey}
                  onPick={() => {
                    act({ type: "applyPreset", shape: preset.shape });
                    trackFunnel("preset_selected", { presetId: preset.id, category: preset.category, name: preset.name });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <p className="atelier-hint">
        Vrei altceva decât ce vezi aici?{" "}
        <Link href="/cere-oferta" className="atelier-link">
          Cere o ofertă personalizată
        </Link>
      </p>
    </div>
  );
}
