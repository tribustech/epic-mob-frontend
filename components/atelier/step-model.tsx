"use client";

import Link from "next/link";
import { useState } from "react";
import type { ResolvedPalette } from "@/lib/atelier/palettes";
import { COMBO_PRESETS, presetById, presetsFor, type LayoutPreset } from "@/lib/atelier/presets";
import { CATEGORY_ORDER } from "@/lib/atelier/categories";
import { trackFunnel } from "@/lib/atelier/funnel";
import type { AtelierCatalog, AtelierCategory, AtelierConfig } from "@/lib/atelier/types";
import { paletteLooks, type MaterialLook } from "./material-look";
import { MiniPreview } from "./mini-preview";

import { shapeKey, type Act } from "./session";
import { RadioGroup, Section, SelectedMark } from "./ui";

export const CATEGORY_SHORT: Record<AtelierCategory, string> = {
  DRESSING: "Dressing",
  COMODA: "Comodă",
  SEPARATOR: "Separator",
  SUSPENDAT: "Suspendat",
};

function ModelCard({
  name,
  tagline,
  badge,
  selected,
  preset,
  carcass,
  front,
  onPick,
}: {
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
        <MiniPreview shape={preset.shape} carcass={carcass} front={front} className="h-full w-full" />
        {badge && <span className="atelier-badge">{badge}</span>}
        {selected && <SelectedMark className="absolute right-2 top-2" />}
      </span>
      <span className="atelier-model__text">
        <span className="atelier-card__name">{name}</span>
        <span className="atelier-card__sub">{tagline}</span>
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
  const presets = presetsFor(config.category);
  const combos = COMBO_PRESETS.flatMap((combo) => {
    const preset = presetById(combo.presetId);
    const palette = palettes.find((p) => p.id === combo.paletteId);
    return preset && palette && preset.category === config.category ? [{ combo, preset, palette }] : [];
  });
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
    const first = presetsFor(category)[0];
    act(first ? { type: "applyPreset", shape: first.shape } : { type: "setCategory", category });
    trackFunnel("category_selected", { category });
  };

  return (
    <div className="atelier-stack">
      <Section title="Ce construim?">
        <RadioGroup label="Tip de mobilier" className="atelier-cats">
          {CATEGORY_ORDER.map((id) => {
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
                  {sample && <MiniPreview shape={sample.shape} carcass={carcass} front={front} className="h-full w-full" />}
                </span>
                <span className="atelier-cat__name">{CATEGORY_SHORT[id]}</span>
              </button>
            );
          })}
        </RadioGroup>
      </Section>

      <section className="atelier-section">
        {combos.length > 0 && presets.length > 0 && (
          <div className="atelier-switch" role="tablist" aria-label="Combinații sau modele">
            {(
              [
                ["combos", `Combinații (${combos.length})`],
                ["models", `Modele (${presets.length})`],
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
              ? "Model și culori alese de noi. Atinge una și o ajustezi după plac."
              : "Toate modelele, în culorile alese de tine. Dimensiunile le potrivești la pasul 3."}
          </p>
          {list === "combos" ? (
            <div className="atelier-rail">
              {combos.map(({ combo, preset, palette }) => {
                const looks = paletteLooks(catalog, palette);
                return (
                  <ModelCard
                    key={combo.id}
                    name={combo.name}
                    tagline={combo.tagline}
                    preset={preset}
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
              {presets.map((preset) => (
                <ModelCard
                  key={preset.id}
                  name={preset.name}
                  tagline={preset.tagline}
                  badge={preset.badge}
                  preset={preset}
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
        Bucătărie sau altceva?{" "}
        <Link href="/cere-oferta" className="atelier-link">
          Cere o ofertă personalizată
        </Link>
      </p>
    </div>
  );
}
