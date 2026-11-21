"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { trackFunnel } from "@/lib/atelier/funnel";
import { MOOD_LABELS, defaultVopsitModelId, type PaletteMood, type ResolvedPalette } from "@/lib/atelier/palettes";
import type { AtelierCatalog, AtelierConfig, AtelierFronts, AtelierMaterial, FrontKind } from "@/lib/atelier/types";
import { cropBox, materialLook, paletteLooks, swatchStyle, worktopLook, worktopMaterialLook, type MaterialLook } from "./material-look";
import { FEATURED_WORKTOP_CODES, usableWorktops } from "@/lib/atelier/house-rules";

import type { Act } from "./session";
import { ralLabel, ralNameRo } from "@/lib/atelier/ral-names";
import { Choice, Field, RadioGroup, Section, SelectedMark, decorName, decorTitle, fold } from "./ui";

/** The three kinds of fronts, in plain words (the workshop calls them PAL, MDF melaminat, MDF vopsit). */
const KIND_LABELS: Record<FrontKind, string> = {
  PAL: "Aspect lemn și culori uni",
  MDF_MELAMINAT: "Mat catifelat sau lucios",
  MDF_VOPSIT: "Vopsit în orice culoare",
};

/** The paint colours people pick most for furniture, with everyday names; they lead the list. */
const POPULAR_RAL: [code: string, name: string][] = [
  ["RAL 9016", "Alb"],
  ["RAL 9010", "Alb cald"],
  ["RAL 9001", "Crem"],
  ["RAL 1013", "Fildeș"],
  ["RAL 7044", "Bej-gri"],
  ["RAL 7035", "Gri deschis"],
  ["RAL 7016", "Antracit"],
  ["RAL 9005", "Negru"],
  ["RAL 6021", "Verde salvie"],
  ["RAL 5014", "Albastru porumbel"],
  ["RAL 5011", "Bleumarin"],
  ["RAL 8004", "Teracotă"],
];

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
    label: decorName(bare || m.name),
    sub: code,
    group: m.brand,
    look: materialLook(m, kind),
    // with and without diacritics, the code with and without its space: „casmir", „h1145", „H 1145"
    text: fold(`${m.name} ${decorName(m.name)} ${code} ${code.replace(/\s+/g, "")} ${m.brand ?? ""}`),
  };
}

function SwatchTile({ item, selected, onPick, codes }: { item: SwatchItem; selected: boolean; onPick: () => void; codes: boolean }) {
  const crop = item.look.crop ? cropBox(item.look.crop) : null;
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
            style={
              crop
                ? { inset: "auto", left: `${crop.left}%`, top: `${crop.top}%`, width: `${crop.width}%`, height: `${crop.height}%`, objectFit: "fill" }
                : undefined
            }
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        {selected && <SelectedMark className="absolute right-1 top-1" />}
      </span>
      <span className="atelier-tile__label">{item.label}</span>
      {codes && item.sub && <span className="atelier-tile__sub">{item.sub}</span>}
    </button>
  );
}

function SwatchPicker({
  label,
  items,
  selectedId,
  onPick,
  placeholder,
  collapsed = COLLAPSED,
  allLabel = "Vezi toate",
}: {
  label: string;
  items: SwatchItem[];
  selectedId: string | undefined;
  onPick: (id: string) => void;
  placeholder: string;
  /** how many tiles before „Vezi toate" */
  collapsed?: number;
  allLabel?: string;
}) {
  const [query, setQuery] = useState("");
  /** „Detalii": the supplier filter and the decor / colour codes — for those who know what they look for */
  const [details, setDetails] = useState(false);
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
    // every word typed must be found; „ral7016", „RAL 7016" and „7016" are the same search
    const words = fold(query.trim()).split(/\s+/).filter(Boolean);
    const compact = words.join("");
    const list = items.filter(
      (i) =>
        (!activeGroup || i.group === activeGroup) &&
        (words.length === 0 || words.every((w) => i.text.includes(w)) || i.text.replace(/\s+/g, "").includes(compact)),
    );
    const at = list.findIndex((i) => i.id === leadId);
    return at > 0 ? [list[at], ...list.slice(0, at), ...list.slice(at + 1)] : list;
  }, [items, query, activeGroup, leadId]);

  const limit = expanded ? matches.length : query.trim() ? SEARCH_LIMIT : collapsed;
  let shown = matches.slice(0, limit);
  // …but a choice made elsewhere (a palette) must still be visible without opening anything
  if (selectedId && !shown.some((i) => i.id === selectedId)) {
    const chosen = matches.find((i) => i.id === selectedId);
    if (chosen) shown = [chosen, ...shown.slice(0, Math.max(0, limit - 1))];
  }

  // the search comes with the full list (or with „Detalii"): eight tiles need no search box
  const searching = expanded || details || query !== "";
  return (
    <div>
      {searching && (
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
      )}
      {details && groups.length > 0 && (
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
          <SwatchTile key={item.id} item={item} selected={item.id === selectedId} codes={details} onPick={() => onPick(item.id)} />
        ))}
      </RadioGroup>
      {matches.length === 0 && <p className="atelier-hint mt-3">Nimic nu se potrivește căutării.</p>}
      <div className="atelier-swatchmore">
        {matches.length > Math.min(limit, collapsed) && (matches.length > limit || expanded) && (
          <button type="button" className="atelier-textbtn" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Arată mai puține" : `${allLabel} (${matches.length})`}
          </button>
        )}
        <button type="button" className="atelier-textbtn atelier-textbtn--quiet" aria-expanded={details} onClick={() => setDetails((v) => !v)}>
          {details ? "Ascunde detaliile" : "Detalii (coduri, producător)"}
        </button>
      </div>
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
  noTwoFaces = false,
  focus = null,
}: {
  catalog: AtelierCatalog;
  config: AtelierConfig;
  palettes: ResolvedPalette[];
  activePalette: string | null;
  carcass: MaterialLook;
  front: MaterialLook;
  act: Act;
  /** painting both faces could not be priced for this front model: the option is off */
  noTwoFaces?: boolean;
  /** the part a „Modifică" link asked for („corp" / „fronturi" open the separate pickers) */
  focus?: string | null;
}) {
  const [mood, setMood] = useState<PaletteMood | null>(null);
  // body and fronts one by one: closed until asked for, open when the colours are no ready-made combination
  const [separate, setSeparate] = useState(activePalette === null || palettes.length === 0 || focus === "corp" || focus === "fronturi");
  const [paintMore, setPaintMore] = useState((config.fronts.faces ?? 1) === 2);
  const [allPalettes, setAllPalettes] = useState(false);
  const { fronts } = config;

  const moods = (Object.keys(MOOD_LABELS) as PaletteMood[]).filter((m) => palettes.some((p) => p.mood === m));
  const paletteList = useMemo(() => {
    const list = mood ? palettes.filter((p) => p.mood === mood) : palettes;
    return list.map((palette) => ({ palette, looks: paletteLooks(catalog, palette) }));
  }, [catalog, palettes, mood]);
  // the chosen combination is always among the visible ones (first, when it would be hidden)
  const shownPalettes = useMemo(() => {
    if (allPalettes) return paletteList;
    const head = paletteList.slice(0, PALETTES_COLLAPSED);
    const active = paletteList.find((p) => p.palette.id === activePalette);
    return !active || head.includes(active) ? head : [active, ...head.slice(0, PALETTES_COLLAPSED - 1)];
  }, [paletteList, allPalettes, activePalette]);

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
  const ralItems = useMemo<SwatchItem[]>(() => {
    const popular = new Map(POPULAR_RAL);
    const items = catalog.ral.map((r) => {
      // an everyday name first, else the Romanian colour name; the code alone when we have none (never the English one)
      const name = popular.get(r.code) ?? ralNameRo(r.name);
      return {
        id: r.code,
        label: name ?? r.code,
        sub: name ? r.code : "",
        group: null,
        look: { color: r.hex, imageUrl: null },
        text: fold(`${r.code} ${r.code.replace(/\s+/g, "")} ${name ?? ""} ${ralNameRo(r.name) ?? ""} ${r.name}`),
      };
    });
    // the popular furniture colours lead, in their own order; then the whole chart
    const rank = (id: string) => {
      const at = POPULAR_RAL.findIndex(([code]) => code === id);
      return at < 0 ? POPULAR_RAL.length : at;
    };
    return items.map((item, i) => ({ item, i })).sort((a, b) => rank(a.item.id) - rank(b.item.id) || a.i - b.i).map((x) => x.item);
  }, [catalog]);

  const kitchen = config.category === "BUCATARIE";
  const worktopItems = useMemo(() => {
    if (!kitchen) return [];
    const rank = (code: string | null | undefined) => {
      const at = FEATURED_WORKTOP_CODES.findIndex((c) => fold(c).replace(/\s+/g, "") === fold(code ?? "").replace(/\s+/g, ""));
      return at < 0 ? FEATURED_WORKTOP_CODES.length : at;
    };
    return usableWorktops(catalog, config.depthMm)
      .map((m, i) => ({ m, i }))
      .sort((a, b) => rank(a.m.decorCode) - rank(b.m.decorCode) || a.i - b.i)
      .map(({ m }) => {
        const item = materialItem(m, "PAL");
        // the board of the same decor when there is one; else the supplier's worktop photo is still the best picture
        const board = worktopMaterialLook(catalog, m);
        return board.imageUrl ? { ...item, look: board } : item;
      });
  }, [catalog, config.depthMm, kitchen]);
  const worktop = worktopLook(catalog, config);
  const worktopName = (catalog.worktops ?? []).find((m) => m.id === config.kitchen?.worktopId)?.name ?? "—";

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
        ? ralLabel(ral)
        : "—"
      : catalog.fronts[fronts.kind].find((m) => m.id === fronts.materialId)?.name ?? "—";

  return (
    <div className="atelier-stack">
      {palettes.length > 0 && (
        <Section
          title="Combinații de culori"
          anchor="culori"
          hint="În fiecare poză: în spate corpul (interiorul și lateralele), în față fronturile (ușile și sertarele). O atingere și vezi rezultatul în 3D."
        >
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

      {kitchen && worktopItems.length > 0 && (
        <Section title="Blat" anchor="blat" hint="Blat de 38 mm, rezistent la apă, tăiat pe măsura bucătăriei.">
          <div className="atelier-box">
            {worktop && (
              <div className="atelier-box__head">
                <p className="atelier-hint">Ales acum</p>
                <Current look={worktop} name={worktopName} />
              </div>
            )}
            <SwatchPicker
              label="Decor blat"
              items={worktopItems}
              selectedId={config.kitchen?.worktopId}
              placeholder="Caută: stejar, marmură, beton…"
              onPick={(worktopId) => {
                act({ type: "setWorktop", worktopId });
                trackFunnel("material_changed", { part: "blat" });
              }}
            />
          </div>
        </Section>
      )}

      <section className="atelier-section">
        <button type="button" className="atelier-disclosure" aria-expanded={separate} onClick={() => setSeparate((v) => !v)}>
          <span className="min-w-0">
            <span className="atelier-section__title">Alege separat</span>
            <span className="atelier-hint block">Altă culoare pentru corp sau pentru fronturi, din tot catalogul.</span>
          </span>
          <ChevronDown size={18} aria-hidden="true" className={separate ? "rotate-180" : ""} />
        </button>
        {separate && (
          <div className="mt-3">
        <div className="atelier-box" data-anchor="corp">
          <div className="atelier-box__head">
            <div>
              <h3 className="atelier-box__title">Corp</h3>
              <p className="atelier-hint">Interiorul și lateralele</p>
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

        <div className="atelier-box mt-3" data-anchor="fronturi">
          <div className="atelier-box__head">
            <div>
              <h3 className="atelier-box__title">Fronturi</h3>
              <p className="atelier-hint">Ușile și fețele sertarelor</p>
            </div>
            <Current look={front} name={frontName} />
          </div>
          {kinds.length > 1 && (
            <Choice
              label="Fel de fronturi"
              className="mb-3"
              value={fronts.kind}
              options={kinds.map((k) => ({ value: k, label: KIND_LABELS[k] }))}
              onChange={(k) => setFronts(defaultFronts(catalog, k, fronts, config.carcassMaterialId))}
            />
          )}
          {fronts.kind !== "MDF_VOPSIT" ? (
            <SwatchPicker
              key={fronts.kind}
              label={`Fronturi: ${KIND_LABELS[fronts.kind].toLowerCase()}`}
              items={frontItems[fronts.kind]}
              selectedId={fronts.materialId}
              placeholder="Caută: stejar, alb, H1145…"
              onPick={(materialId) => setFronts({ kind: fronts.kind, materialId })}
            />
          ) : (
            <>
              <SwatchPicker
                key="ral"
                label="Culoarea vopselei"
                items={ralItems}
                selectedId={fronts.ralCode}
                collapsed={POPULAR_RAL.length}
                allLabel="Toate culorile"
                placeholder="Caută: alb, antracit, 9016…"
                onPick={(ralCode) => setFronts({ ...fronts, ralCode })}
              />
              <button type="button" className="atelier-textbtn atelier-textbtn--quiet mt-2" aria-expanded={paintMore} onClick={() => setPaintMore((v) => !v)}>
                {paintMore ? "Ascunde opțiunile de vopsire" : "Mai multe opțiuni de vopsire"}
              </button>
              {paintMore && (
                <div className="atelier-rows mt-1">
                  {catalog.fronts.MDF_VOPSIT.length > 1 && (
                    <Field label="Modelul frontului">
                      <Choice
                        label="Modelul frontului"
                        value={fronts.modelId ?? defaultVopsitModelId(catalog) ?? ""}
                        options={catalog.fronts.MDF_VOPSIT.map((m) => ({ value: m.id, label: m.name }))}
                        onChange={(modelId) => setFronts({ ...fronts, modelId })}
                      />
                    </Field>
                  )}
                  <Field
                    label="Ce vopsim"
                    hint={
                      noTwoFaces
                        ? "Vopsirea și pe interior nu e disponibilă momentan — o stabilim la măsurători."
                        : "De obicei doar exteriorul: interiorul ușii se vede numai când o deschizi."
                    }
                  >
                    <Choice
                      label="Ce vopsim"
                      value={fronts.faces ?? 1}
                      options={[
                        { value: 1, label: "Doar exteriorul" },
                        { value: 2, label: "Și interiorul ușii", disabled: noTwoFaces },
                      ]}
                      onChange={(faces) => setFronts({ ...fronts, faces: faces as 1 | 2 })}
                    />
                  </Field>
                </div>
              )}
            </>
          )}
        </div>
          </div>
        )}
      </section>
    </div>
  );
}
