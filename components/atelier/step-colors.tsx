"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { trackFunnel } from "@/lib/atelier/funnel";
import { MOOD_LABELS, defaultVopsitModelId, type PaletteMood, type ResolvedPalette } from "@/lib/atelier/palettes";
import type { AtelierCatalog, AtelierConfig, AtelierFronts, AtelierMaterial, FrontKind } from "@/lib/atelier/types";
import { materialLook, paletteLooks, swatchStyle, type MaterialLook } from "./material-look";

import type { Act } from "./session";
import { Choice, Field, RadioGroup, Section, SelectedMark, decorTitle } from "./ui";

const KIND_LABELS: Record<FrontKind, string> = {
  PAL: "PAL",
  MDF_MELAMINAT: "MDF melaminat",
  MDF_VOPSIT: "MDF vopsit (RAL)",
};

const DEFAULT_RAL = "RAL 9016";
const COLLAPSED = 8;
const SEARCH_LIMIT = 24;
const PALETTES_COLLAPSED = 8;

function defaultFronts(catalog: AtelierCatalog, kind: FrontKind, current: AtelierFronts, carcassId: string): AtelierFronts {
  if (kind === "MDF_VOPSIT") {
    const ral =
      catalog.ral.find((r) => r.code === current.ralCode) ??
      catalog.ral.find((r) => r.code === DEFAULT_RAL) ??
      catalog.ral[0];
    return { kind, modelId: defaultVopsitModelId(catalog), ralCode: ral?.code, faces: current.faces ?? 1 };
  }
  // same decor as the body when this board type has it, else the first one
  const list = catalog.fronts[kind];
  return { kind, materialId: (list.find((m) => m.id === carcassId) ?? list[0])?.id };
}

/* ── Swatch grid with search and filter chips ── */

interface SwatchItem {
  id: string;
  /** main line under the tile */
  label: string;
  /** second line (decor code / RAL name) */
  sub: string;
  group: string | null;
  look: MaterialLook;
  /** what the search matches */
  text: string;
}

function materialItem(m: AtelierMaterial, kind: "PAL" | "MDF_MELAMINAT"): SwatchItem {
  const code = m.decorCode ?? "";
  const bare = code && m.name.startsWith(code) ? m.name.slice(code.length).replace(/^[\s·\-–]+/, "") : m.name;
  return {
    id: m.id,
    label: bare || m.name,
    sub: code,
    group: m.brand,
    look: materialLook(m, kind),
    text: `${m.name} ${code} ${m.brand ?? ""}`.toLowerCase(),
  };
}

function SwatchTile({ item, selected, onPick }: { item: SwatchItem; selected: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={[item.label, item.sub].filter(Boolean).join(", ")}
      title={[item.label, item.sub].filter(Boolean).join(" · ")}
      className="atelier-tile"
      onClick={() => !selected && onPick()}
    >
      <span className="atelier-tile__chip" style={{ backgroundColor: item.look.color }}>
        {item.look.imageUrl && (
          // decor textures come from the CRM through a same-origin rewrite; lazy so 362 tiles cost nothing until seen
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.look.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        {selected && <SelectedMark className="absolute right-1 top-1" />}
      </span>
      <span className="atelier-tile__label">{item.label}</span>
      {item.sub && <span className="atelier-tile__sub">{item.sub}</span>}
    </button>
  );
}

function SwatchPicker({
  label,
  items,
  selectedId,
  onPick,
  placeholder,
}: {
  label: string;
  items: SwatchItem[];
  selectedId: string | undefined;
  onPick: (id: string) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const groups = useMemo(() => {
    const seen: string[] = [];
    for (const item of items) if (item.group && !seen.includes(item.group)) seen.push(item.group);
    return seen.length > 1 ? seen : [];
  }, [items]);
  const activeGroup = group && groups.includes(group) ? group : null;

  // The decor chosen when the list was opened leads it; a tap never reshuffles the tiles under the finger.
  const [leadId] = useState(selectedId);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((i) => (!activeGroup || i.group === activeGroup) && (!q || i.text.includes(q)));
    const at = list.findIndex((i) => i.id === leadId);
    return at > 0 ? [list[at], ...list.slice(0, at), ...list.slice(at + 1)] : list;
  }, [items, query, activeGroup, leadId]);

  const limit = expanded ? matches.length : query.trim() ? SEARCH_LIMIT : COLLAPSED;
  let shown = matches.slice(0, limit);
  // …but a choice made elsewhere (a palette) must still be visible without opening anything
  if (selectedId && !shown.some((i) => i.id === selectedId)) {
    const chosen = matches.find((i) => i.id === selectedId);
    if (chosen) shown = [chosen, ...shown.slice(0, Math.max(0, limit - 1))];
  }

  return (
    <div>
      <div className="atelier-search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={`Caută: ${label}`}
        />
      </div>
      {groups.length > 0 && (
        <RadioGroup className="atelier-scrollrow mt-2" selectOnArrow label={`${label}: producător`}>
          {[null, ...groups].map((g) => (
            <button
              key={g ?? "toate"}
              type="button"
              role="radio"
              aria-checked={activeGroup === g}
              className="atelier-chip atelier-chip--sm"
              onClick={() => setGroup(g)}
            >
              {g ?? "Toate"}
            </button>
          ))}
        </RadioGroup>
      )}
      <RadioGroup label={label} className={`atelier-tiles mt-3 ${expanded && matches.length > 12 ? "atelier-tiles--scroll" : ""}`}>
        {shown.map((item) => (
          <SwatchTile key={item.id} item={item} selected={item.id === selectedId} onPick={() => onPick(item.id)} />
        ))}
      </RadioGroup>
      {matches.length === 0 && <p className="atelier-hint mt-3">Nimic nu se potrivește căutării.</p>}
      {matches.length > Math.min(limit, COLLAPSED) && (matches.length > limit || expanded) && (
        <button type="button" className="atelier-textbtn mt-2" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Arată mai puține" : `Vezi toate (${matches.length})`}
        </button>
      )}
    </div>
  );
}

/* ── Palettes ── */

function PaletteCard({
  palette,
  looks,
  selected,
  legend,
  onPick,
}: {
  palette: ResolvedPalette;
  looks: { carcass: MaterialLook; front: MaterialLook };
  selected: boolean;
  /** name the two boards (first card only) */
  legend: boolean;
  onPick: () => void;
}) {
  return (
    <button type="button" role="radio" aria-checked={selected} className="atelier-card atelier-palette" onClick={() => !selected && onPick()}>
      <span className="atelier-palette__art">
        <span className="atelier-palette__body" style={swatchStyle(looks.carcass)}>
          {legend && <span className="atelier-palette__tag">Corp</span>}
        </span>
        <span className="atelier-palette__front" style={swatchStyle(looks.front)}>
          {legend && <span className="atelier-palette__tag">Fronturi</span>}
        </span>
        {selected && <SelectedMark className="absolute right-2 top-2" />}
      </span>
      <span className="atelier-palette__text">
        <span className="atelier-card__name">{palette.name}</span>
        <span className="atelier-card__sub">
          {palette.carcassName === palette.frontName
            ? decorTitle(palette.carcassName)
            : `${decorTitle(palette.carcassName)} + ${decorTitle(palette.frontName)}`}
        </span>
      </span>
    </button>
  );
}

function Current({ look, name }: { look: MaterialLook; name: string }) {
  return (
    <span className="atelier-current">
      <span className="atelier-current__dot" style={swatchStyle(look)} aria-hidden="true" />
      <span className="truncate">{decorTitle(name)}</span>
    </span>
  );
}

export function StepColors({
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
  const [mood, setMood] = useState<PaletteMood | null>(null);
  const [allPalettes, setAllPalettes] = useState(false);
  const { fronts } = config;

  const moods = (Object.keys(MOOD_LABELS) as PaletteMood[]).filter((m) => palettes.some((p) => p.mood === m));
  const paletteList = useMemo(() => {
    const list = mood ? palettes.filter((p) => p.mood === mood) : palettes;
    return list.map((palette) => ({ palette, looks: paletteLooks(catalog, palette) }));
  }, [catalog, palettes, mood]);
  const shownPalettes = allPalettes ? paletteList : paletteList.slice(0, PALETTES_COLLAPSED);

  const carcassItems = useMemo(() => {
    const mdf = new Set(catalog.fronts.MDF_MELAMINAT.map((m) => m.id));
    return catalog.carcass.map((m) => materialItem(m, mdf.has(m.id) ? "MDF_MELAMINAT" : "PAL"));
  }, [catalog]);
  const frontItems = useMemo(
    () => ({
      PAL: catalog.fronts.PAL.map((m) => materialItem(m, "PAL")),
      MDF_MELAMINAT: catalog.fronts.MDF_MELAMINAT.map((m) => materialItem(m, "MDF_MELAMINAT")),
    }),
    [catalog],
  );
  const ralItems = useMemo<SwatchItem[]>(
    () =>
      catalog.ral.map((r) => ({
        id: r.code,
        label: r.code,
        sub: r.name,
        group: null,
        look: { color: r.hex, imageUrl: null },
        text: `${r.code} ${r.code.replace(/^ral\s*/i, "")} ${r.name}`.toLowerCase(),
      })),
    [catalog],
  );

  const kinds = (Object.keys(KIND_LABELS) as FrontKind[]).filter((k) => catalog.fronts[k].length > 0);
  const setFronts = (next: AtelierFronts) => {
    if (JSON.stringify(next) === JSON.stringify(fronts)) return;
    act({ type: "setFronts", fronts: next });
    trackFunnel("material_changed", { part: "fronturi" });
  };

  const carcassName = catalog.carcass.find((m) => m.id === config.carcassMaterialId)?.name ?? "—";
  const ral = catalog.ral.find((r) => r.code === fronts.ralCode);
  const frontName =
    fronts.kind === "MDF_VOPSIT"
      ? ral
        ? `${ral.code} · ${ral.name}`
        : "—"
      : catalog.fronts[fronts.kind].find((m) => m.id === fronts.materialId)?.name ?? "—";

  return (
    <div className="atelier-stack">
      {palettes.length > 0 && (
        <Section title="Combinații de culori" hint="Placa din spate e corpul, cea din față sunt fronturile. O atingere și vezi rezultatul în 3D.">
          {moods.length > 1 && (
            <RadioGroup className="atelier-scrollrow" selectOnArrow label="Filtrează combinațiile">
              {[null, ...moods].map((m) => (
                <button
                  key={m ?? "toate"}
                  type="button"
                  role="radio"
                  aria-checked={mood === m}
                  className="atelier-chip atelier-chip--sm"
                  onClick={() => setMood(m)}
                >
                  {m ? MOOD_LABELS[m] : "Toate"}
                </button>
              ))}
            </RadioGroup>
          )}
          <RadioGroup label="Combinații de culori" className="atelier-grid2 mt-3">
            {shownPalettes.map(({ palette, looks }, i) => (
              <PaletteCard
                key={palette.id}
                legend={i === 0}
                palette={palette}
                looks={looks}
                selected={palette.id === activePalette}
                onPick={() => {
                  act({ type: "applyPalette", carcassMaterialId: palette.carcassMaterialId, fronts: palette.fronts });
                  trackFunnel("palette_selected", { paletteId: palette.id, name: palette.name });
                }}
              />
            ))}
          </RadioGroup>
          {paletteList.length > PALETTES_COLLAPSED && (
            <button
              type="button"
              className="atelier-textbtn mt-3"
              aria-expanded={allPalettes}
              onClick={() => setAllPalettes((v) => !v)}
            >
              {allPalettes ? "Arată mai puține" : `Vezi toate combinațiile (${paletteList.length})`}
            </button>
          )}
        </Section>
      )}

      <Section title="Alege separat" hint="Orice decor din catalog, pentru corp și pentru fronturi.">
        <div className="atelier-box">
          <div className="atelier-box__head">
            <div>
              <h3 className="atelier-box__title">Corp</h3>
              <p className="atelier-hint">interior și laterale</p>
            </div>
            <Current look={carcass} name={carcassName} />
          </div>
          <SwatchPicker
            label="Decor corp"
            items={carcassItems}
            selectedId={config.carcassMaterialId}
            placeholder="Caută: stejar, alb, H1145…"
            onPick={(materialId) => {
              act({ type: "setCarcass", materialId });
              trackFunnel("material_changed", { part: "corp" });
            }}
          />
        </div>

        <div className="atelier-box mt-3">
          <div className="atelier-box__head">
            <div>
              <h3 className="atelier-box__title">Fronturi</h3>
              <p className="atelier-hint">uși și sertare</p>
            </div>
            <Current look={front} name={frontName} />
          </div>
          {kinds.length > 1 && (
            <Choice
              label="Material fronturi"
              className="mb-3"
              value={fronts.kind}
              options={kinds.map((k) => ({ value: k, label: KIND_LABELS[k] }))}
              onChange={(k) => setFronts(defaultFronts(catalog, k, fronts, config.carcassMaterialId))}
            />
          )}
          {fronts.kind !== "MDF_VOPSIT" ? (
            <SwatchPicker
              key={fronts.kind}
              label={`Decor fronturi ${KIND_LABELS[fronts.kind]}`}
              items={frontItems[fronts.kind]}
              selectedId={fronts.materialId}
              placeholder="Caută: stejar, alb, H1145…"
              onPick={(materialId) => setFronts({ kind: fronts.kind, materialId })}
            />
          ) : (
            <>
              <SwatchPicker
                key="ral"
                label="Culoare RAL"
                items={ralItems}
                selectedId={fronts.ralCode}
                placeholder="Caută: 9016, alb, verde…"
                onPick={(ralCode) => setFronts({ ...fronts, ralCode })}
              />
              <div className="atelier-rows mt-3">
                {catalog.fronts.MDF_VOPSIT.length > 1 && (
                  <Field label="Model front">
                    <Choice
                      label="Model front"
                      value={fronts.modelId ?? defaultVopsitModelId(catalog) ?? ""}
                      options={catalog.fronts.MDF_VOPSIT.map((m) => ({ value: m.id, label: m.name }))}
                      onChange={(modelId) => setFronts({ ...fronts, modelId })}
                    />
                  </Field>
                )}
                <Field label="Fețe vopsite">
                  <Choice
                    label="Fețe vopsite"
                    value={fronts.faces ?? 1}
                    options={[
                      { value: 1, label: "O față" },
                      { value: 2, label: "Două fețe" },
                    ]}
                    onChange={(faces) => setFronts({ ...fronts, faces: faces as 1 | 2 })}
                  />
                </Field>
              </div>
            </>
          )}
        </div>
      </Section>
    </div>
  );
}
