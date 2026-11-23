"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Search, X } from "lucide-react";
import { COLOR_FAMILIES, FAMILY_LABELS, colorFamily, type ColorFamily } from "@/lib/atelier/color-families";
import { doorFills } from "@/lib/atelier/door-types";
import { trackFunnel } from "@/lib/atelier/funnel";
import { HANDLE_INFO, currentHandle, frontsNoun, needsPaintedFronts, usesFronts } from "@/lib/atelier/handles";
import { FEATURED_WORKTOP_CODES, paletteAllowed, usableWorktops } from "@/lib/atelier/house-rules";
import {
  FRONT_MATERIALS,
  FRONT_MATERIAL_LABEL,
  PALETTES,
  defaultVopsitModelId,
  featuredFirst,
  frontMaterialsOffered,
  switchFrontMaterial,
  type MaterialTrail,
  type ResolvedPalette,
  type ToneOf,
} from "@/lib/atelier/palettes";
import { ralNameRo } from "@/lib/atelier/ral-names";
import type { AtelierCatalog, AtelierConfig, AtelierFronts, AtelierMaterial, FrontKind } from "@/lib/atelier/types";
import { glazingOf } from "./glass-look";
import { cropBox, materialLook, paletteLooks, swatchStyle, worktopLook, worktopMaterialLook, type MaterialLook } from "./material-look";
import { useMaterialPrices, type MaterialPrice } from "./material-prices";
import { MiniPreview } from "./mini-preview";
import { shapeOf, type Act } from "./session";
import { Choice, Field, RadioGroup, SelectedMark, decorLabel, fold, formatLei } from "./ui";

/** What is being coloured: the fronts (doors and drawer faces), the body, or — kitchens and bathrooms — the worktop. */
export type ColorPart = "fronturi" | "corp" | "blat";

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

/** Swatches of a family before „Mai multe" (two rows), and how many each tap adds. */
const FIRST = 8;
const MORE_STEP = 16;
const SEARCH_LIMIT = 24;

/* ── swatches ── */

interface Swatch {
  key: string;
  /** one to three plain words under the tile */
  label: string;
  /** „mat" / „lucios" where the panel has a finish worth naming */
  finish: string | null;
  /** decor / colour code, shown with „Detalii" */
  code: string;
  brand: string | null;
  look: MaterialLook;
  family: ColorFamily | "VOPSIT";
  /** what the search matches */
  text: string;
  /** what a tap sets */
  sets: SwatchTarget;
}

type SwatchTarget =
  | { part: "corp"; materialId: string }
  | { part: "blat"; worktopId: string }
  | { part: "fronturi"; kind: "PAL" | "MDF_MELAMINAT"; materialId: string }
  | { part: "fronturi"; kind: "MDF_VOPSIT"; ralCode: string };

const NO_SWATCHES: Swatch[] = [];

const compact = (code: string | null | undefined) => fold(code ?? "").replace(/\s+/g, "");

/** Decors the ready-made combinations use lead their family: first choices, then their stand-ins. */
const PALETTE_RANK: Map<string, number> = (() => {
  const rank = new Map<string, number>();
  PALETTES.forEach((def, at) => {
    const lists = [def.carcassCodes, def.front.kind === "MDF_VOPSIT" ? [] : def.front.codes];
    for (const codes of lists)
      codes.forEach((code, choice) => {
        const r = choice * 1000 + at;
        if (r < (rank.get(code) ?? Infinity)) rank.set(code, r);
      });
  });
  return rank;
})();

function byRank<T>(list: T[], rank: (item: T) => number): T[] {
  return list
    .map((item, i) => ({ item, i, r: rank(item) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.item);
}

function decorSwatch(m: AtelierMaterial, kind: "PAL" | "MDF_MELAMINAT", key: string, sets: SwatchTarget, look?: MaterialLook): Swatch {
  const code = m.decorCode ?? "";
  const { label, finish } = decorLabel(code && m.name.startsWith(code) ? m.name.slice(code.length).replace(/^[\s·\-–]+/, "") || m.name : m.name);
  const drawn = look ?? materialLook(m, kind);
  return {
    key,
    label,
    finish,
    code,
    brand: m.brand,
    look: drawn,
    family: colorFamily({ name: m.name, decorCode: m.decorCode }),
    // with and without diacritics, the code with and without its space: „casmir", „h1145", „H 1145"
    text: fold(`${m.name} ${label} ${code} ${code.replace(/\s+/g, "")} ${m.brand ?? ""} ${finish ?? ""}`),
    sets,
  };
}

function SwatchTile({ item, selected, codes, onPick }: { item: Swatch; selected: boolean; codes: boolean; onPick: (item: Swatch) => void }) {
  const crop = item.look.crop ? cropBox(item.look.crop) : null;
  const sub = codes ? item.code : item.finish;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={[item.label, item.finish, codes ? item.code : null].filter(Boolean).join(", ")}
      title={[item.label, item.code].filter(Boolean).join(" · ")}
      className="atelier-tile"
      onClick={() => !selected && onPick(item)}
    >
      <span className="atelier-tile__chip" style={{ backgroundColor: item.look.color }}>
        {item.look.imageUrl && (
          // decor photos come from the CRM through a same-origin rewrite; lazy, so hundreds of tiles cost nothing until seen
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
      {sub && <span className="atelier-tile__sub">{sub}</span>}
    </button>
  );
}

/** One family: a visible heading, two rows of swatches, „Mai multe" for the rest. */
function Family({
  title,
  hint,
  items,
  selectedKey,
  codes,
  first = FIRST,
  allAtOnce = false,
  moreLabel = "Mai multe",
  onPick,
}: {
  title: string;
  hint?: string;
  items: Swatch[];
  selectedKey: string;
  codes: boolean;
  first?: number;
  /** a long colour chart opens whole, in its own scrolling box */
  allAtOnce?: boolean;
  moreLabel?: string;
  onPick: (item: Swatch) => void;
}) {
  const [count, setCount] = useState(first);
  // the same name twice (one decor in two surface textures) is shown once until the family is opened
  const head = useMemo(() => {
    const seen = new Set<string>();
    const out: Swatch[] = [];
    for (const item of items) {
      const id = `${item.label}|${item.finish ?? ""}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(item);
      if (out.length === first) break;
    }
    return out;
  }, [items, first]);
  const open = count > first;
  let shown = open ? items.slice(0, count) : head;
  // the chosen colour is always on screen, without moving the other tiles
  const chosen = items.find((i) => i.key === selectedKey);
  if (chosen && !shown.includes(chosen)) shown = [...shown, chosen];
  const rest = items.length - shown.length;
  if (items.length === 0) return null;

  return (
    <div className="atelier-family">
      <div className="atelier-family__head">
        <h4 className="atelier-family__title">{title}</h4>
        {hint && <p className="atelier-hint">{hint}</p>}
      </div>
      <RadioGroup label={title} className={`atelier-tiles atelier-tiles--four ${open && allAtOnce ? "atelier-tiles--scroll" : ""}`}>
        {shown.map((item) => (
          <SwatchTile key={item.key} item={item} selected={item.key === selectedKey} codes={codes} onPick={onPick} />
        ))}
      </RadioGroup>
      {(rest > 0 || open) && (
        <div className="atelier-family__more">
          {rest > 0 && (
            <button type="button" className="atelier-textbtn" onClick={() => setCount(allAtOnce ? items.length : count + MORE_STEP)}>
              {moreLabel} ({rest})
            </button>
          )}
          {open && (
            <button type="button" className="atelier-textbtn atelier-textbtn--quiet" onClick={() => setCount(first)}>
              Arată mai puține
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── the front material ── */

/** The tone used to match a colour across materials: the same one the swatches and the 3D view draw. */
const toneOfDecor: ToneOf = (m) => materialLook(m, "PAL").color;

/** „+1.240 lei" / „−310 lei" against PAL; null when either price is missing or it is PAL itself. */
function deltaText(kind: FrontKind, prices: Partial<Record<FrontKind, MaterialPrice>>): string | null {
  const own = prices[kind];
  const base = prices.PAL;
  if (kind === "PAL" || own?.state !== "ready" || base?.state !== "ready") return null;
  const diff = Math.round(own.price - base.price);
  if (diff === 0) return "la fel ca PAL";
  return `${diff > 0 ? "+" : "−"}${formatLei(Math.abs(diff))} față de PAL`;
}

/** PAL · AGT · MDF vopsit: what the fronts are made of, with what this very piece of furniture costs in each. */
function FrontMaterialPicker({
  offered,
  chosen,
  prices,
  handleNote,
  onPick,
}: {
  offered: FrontKind[];
  chosen: FrontKind;
  prices: Partial<Record<FrontKind, MaterialPrice>>;
  /** the handle the client chose is cut into the door: only painted fronts can take it */
  handleNote: string | null;
  onPick: (kind: FrontKind) => void;
}) {
  return (
    <RadioGroup label="Materialul fronturilor" className="atelier-material">
      {FRONT_MATERIALS.filter((m) => offered.includes(m.kind)).map((m) => {
        const selected = m.kind === chosen;
        const price = prices[m.kind];
        const delta = deltaText(m.kind, prices);
        const hint = handleNote && m.kind !== "MDF_VOPSIT" ? handleNote : m.hint;
        const total = !price || price.state === "loading" ? "…" : price.state === "ready" ? formatLei(price.price) : "—";
        return (
          <button
            key={m.kind}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${m.label}, ${hint}${price?.state === "ready" ? `, ${total}` : ""}${delta ? `, ${delta}` : ""}`}
            className="atelier-material__opt"
            onClick={() => !selected && onPick(m.kind)}
          >
            <span className="atelier-material__mark" aria-hidden="true" />
            <span className="atelier-material__text">
              <span className="atelier-material__name">{m.label}</span>
              <span className="atelier-material__hint">{hint}</span>
            </span>
            <span className="atelier-material__price" aria-hidden="true">
              <span className={`atelier-material__total ${price?.state === "loading" ? "is-loading" : ""}`}>{total}</span>
              {delta && <span className="atelier-material__delta">{delta}</span>}
            </span>
          </button>
        );
      })}
    </RadioGroup>
  );
}

/* ── the step ── */

/** „Uși", „Sertare" or both — what this very piece of furniture has on its front. */
function frontWords(config: AtelierConfig): { chip: string; of: string } {
  const noun = frontsNoun(config).plain;
  if (noun === "uși") return { chip: "Uși", of: "Culoarea ușilor" };
  if (noun === "sertare") return { chip: "Sertare", of: "Culoarea sertarelor" };
  return { chip: "Uși și sertare", of: "Culoarea ușilor și a sertarelor" };
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
  onPart,
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
  /** the part a „Modifică" link asked for („corp" / „fronturi" / „blat") */
  focus?: string | null;
  /** tells the shell what is being coloured (it opens the doors for the body, closes them for the fronts); null on leaving */
  onPart?: (part: ColorPart | null) => void;
}) {
  const { fronts } = config;
  const kitchen = config.category === "BUCATARIE" || config.category === "BAIE";
  const hasFronts = usesFronts(config);
  const words = frontWords(config);
  const canPaint = catalog.fronts.MDF_VOPSIT.length > 0 && catalog.ral.length > 0;

  const worktops = useMemo(() => (kitchen ? usableWorktops(catalog, config.depthMm) : []), [catalog, config.depthMm, kitchen]);
  const worktop = worktopLook(catalog, config);
  const parts: ColorPart[] = [...(hasFronts ? (["fronturi"] as const) : []), "corp", ...(worktops.length > 0 ? (["blat"] as const) : [])];

  const [picked, setPicked] = useState<ColorPart>(focus === "corp" || focus === "blat" || focus === "fronturi" ? focus : "fronturi");
  const part = parts.includes(picked) ? picked : parts[0];
  useEffect(() => {
    onPart?.(part);
  }, [onPart, part]);
  useEffect(() => () => onPart?.(null), [onPart]);
  // a „Modifică" link pressed while the step is already open
  const [seenFocus, setSeenFocus] = useState(focus);
  if (focus !== seenFocus) {
    setSeenFocus(focus);
    if (focus === "corp" || focus === "blat" || focus === "fronturi") setPicked(focus);
  }

  // the colour chips stay on screen while the swatches scroll: right under whatever is pinned above them
  const partsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = partsRef.current;
    if (!bar) return;
    const place = () => {
      const panel = document.getElementById("atelier-step-panel");
      const head = document.querySelector<HTMLElement>(".atelier-app__head");
      const own = !!panel && getComputedStyle(panel).overflowY !== "visible";
      let top = 0;
      if (!own) {
        const headStyle = head ? getComputedStyle(head) : null;
        if (head && headStyle?.position === "sticky") top = (parseFloat(headStyle.top) || 0) + head.offsetHeight;
        else top = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
      }
      bar.style.setProperty("--at-parts-top", `${Math.round(top) - 1}px`);
      const from = own && panel ? panel.getBoundingClientRect().top : top;
      bar.classList.toggle("is-stuck", bar.getBoundingClientRect().top <= from + 1);
    };
    place();
    const panel = document.getElementById("atelier-step-panel");
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    panel?.addEventListener("scroll", place, { passive: true });
    const late = window.setTimeout(place, 400);
    return () => {
      window.clearTimeout(late);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
      panel?.removeEventListener("scroll", place);
    };
  }, []);

  /** Another part: its colours start from their top, right under the chips. */
  const choosePart = (next: ColorPart) => {
    setPicked(next);
    setAllFound(false);
    const bar = partsRef.current;
    if (!bar) return;
    window.setTimeout(() => {
      const list = bar.parentElement?.querySelector<HTMLElement>(".atelier-colors");
      if (!list) return;
      const panel = document.getElementById("atelier-step-panel");
      const own = !!panel && getComputedStyle(panel).overflowY !== "visible";
      // where the chips rest when pinned: the colours go right under that line
      const pinned = own && panel ? panel.getBoundingClientRect().top : parseFloat(bar.style.getPropertyValue("--at-parts-top")) || 0;
      const by = list.getBoundingClientRect().top - (pinned + bar.offsetHeight + 4);
      if (Math.abs(by) < 4) return;
      if (own && panel) panel.scrollBy({ top: by, behavior: "smooth" });
      else window.scrollBy({ top: by, behavior: "smooth" });
    }, 30);
  };

  const [paintMore, setPaintMore] = useState((fronts.faces ?? 1) === 2);
  /** „Detalii": search, the supplier filter and the decor / colour codes — for those who know what they look for */
  const [details, setDetails] = useState(false);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string | null>(null);
  const [allFound, setAllFound] = useState(false);

  const setFronts = (next: AtelierFronts) => {
    if (JSON.stringify(next) === JSON.stringify(fronts)) return;
    act({ type: "setFronts", fronts: next });
    trackFunnel("material_changed", { part: "fronturi" });
  };
  /* the front material: PAL · AGT · MDF vopsit, each priced for this very configuration */
  const offered = useMemo(() => frontMaterialsOffered(catalog), [catalog]);
  const [trail, setTrail] = useState<MaterialTrail | null>(null);
  /** the colour a material switch chose, told in one line while it is still the one on the fronts */
  const [switchNote, setSwitchNote] = useState<{ fronts: AtelierFronts; approx: boolean } | null>(null);
  const targets = useMemo(() => {
    const out: Partial<Record<FrontKind, AtelierFronts>> = {};
    if (!hasFronts) return out;
    for (const kind of offered) {
      const next = kind === fronts.kind ? { fronts } : switchFrontMaterial(catalog, fronts, kind, trail, toneOfDecor);
      if (next) out[kind] = next.fronts;
    }
    return out;
  }, [catalog, fronts, trail, offered, hasFronts]);
  const materialPrices = useMaterialPrices(config, catalog, targets);
  const chooseMaterial = (kind: FrontKind) => {
    const next = switchFrontMaterial(catalog, fronts, kind, trail, toneOfDecor);
    if (!next) return;
    setTrail(next.trail);
    // back to the client's own colour: nothing to explain
    setSwitchNote(next.fronts === next.trail.origin ? null : { fronts: next.fronts, approx: next.approx });
    setQuery("");
    setBrand(null);
    setFronts(next.fronts);
  };
  const handleType = currentHandle(config);
  const handleNote = handleType && needsPaintedFronts(handleType) ? `${HANDLE_INFO[handleType].name} se face doar pe MDF vopsit.` : null;

  const pick = (item: Swatch) => {
    const t = item.sets;
    if (t.part === "corp") {
      act({ type: "setCarcass", materialId: t.materialId });
      trackFunnel("material_changed", { part: "corp" });
    } else if (t.part === "blat") {
      act({ type: "setWorktop", worktopId: t.worktopId });
      trackFunnel("material_changed", { part: "blat" });
    } else if (t.kind === "MDF_VOPSIT") {
      const was = fronts.kind === "MDF_VOPSIT" ? fronts : null;
      setFronts({ kind: "MDF_VOPSIT", modelId: was?.modelId ?? defaultVopsitModelId(catalog), ralCode: t.ralCode, faces: was?.faces ?? 1 });
    } else setFronts({ kind: t.kind, materialId: t.materialId });
  };

  /* every swatch of every part, sorted so that the well-known decors lead their family */
  const swatches = useMemo(() => {
    const paletteRank = (m: AtelierMaterial) => PALETTE_RANK.get(m.decorCode ?? "") ?? 1e6;
    const mdf = new Set(catalog.fronts.MDF_MELAMINAT.map((m) => m.id));
    const corp = byRank(catalog.carcass, (m) => paletteRank(m) + (mdf.has(m.id) ? 0.5 : 0)).map((m) =>
      decorSwatch(m, mdf.has(m.id) ? "MDF_MELAMINAT" : "PAL", m.id, { part: "corp", materialId: m.id }),
    );
    const boards = [
      ...catalog.fronts.PAL.map((m) => ({ m, kind: "PAL" as const })),
      ...catalog.fronts.MDF_MELAMINAT.map((m) => ({ m, kind: "MDF_MELAMINAT" as const })),
    ];
    const fronturi = byRank(boards, ({ m, kind }) => paletteRank(m) + (kind === "PAL" ? 0 : 0.5)).map(({ m, kind }) =>
      decorSwatch(m, kind, `${kind}:${m.id}`, { part: "fronturi", kind, materialId: m.id }),
    );
    const popular = new Map(POPULAR_RAL);
    const ralRank = (code: string) => {
      const at = POPULAR_RAL.findIndex(([c]) => c === code);
      return at < 0 ? POPULAR_RAL.length : at;
    };
    const vopsit: Swatch[] = byRank(catalog.ral, (r) => ralRank(r.code)).map((r) => {
      // an everyday name first, else the Romanian colour name; the code alone when we have none (never the English one)
      const name = popular.get(r.code) ?? ralNameRo(r.name);
      return {
        key: `ral:${r.code}`,
        label: name ?? r.code,
        finish: null,
        code: name ? r.code : "",
        brand: null,
        look: { color: r.hex, imageUrl: null },
        family: "VOPSIT" as const,
        text: fold(`${r.code} ${r.code.replace(/\s+/g, "")} ${name ?? ""} ${ralNameRo(r.name) ?? ""} ${r.name} vopsit`),
        sets: { part: "fronturi" as const, kind: "MDF_VOPSIT" as const, ralCode: r.code },
      };
    });
    return { corp, fronturi, vopsit };
  }, [catalog]);

  const blat = useMemo(() => {
    const rank = (m: AtelierMaterial) => {
      const at = FEATURED_WORKTOP_CODES.findIndex((c) => compact(c) === compact(m.decorCode));
      return at < 0 ? FEATURED_WORKTOP_CODES.length : at;
    };
    return byRank(worktops, rank).map((m) => {
      // the board of the same decor when there is one; else the supplier's worktop photo is still the best picture
      const board = worktopMaterialLook(catalog, m);
      return decorSwatch(m, "PAL", m.id, { part: "blat", worktopId: m.id }, board.imageUrl ? board : undefined);
    });
  }, [catalog, worktops]);

  const painted = fronts.kind === "MDF_VOPSIT";
  const selectedKey =
    part === "corp" ? config.carcassMaterialId : part === "blat" ? (config.kitchen?.worktopId ?? "") : painted ? `ral:${fronts.ralCode}` : `${fronts.kind}:${fronts.materialId}`;
  // the fronts show the colours of their material only; a search still finds every material
  const frontDecors = useMemo(
    () => (fronts.kind === "MDF_VOPSIT" ? NO_SWATCHES : swatches.fronturi.filter((i) => i.sets.part === "fronturi" && i.sets.kind === fronts.kind)),
    [swatches.fronturi, fronts.kind],
  );
  const decors = part === "corp" ? swatches.corp : part === "blat" ? blat : frontDecors;
  const paints = part === "fronturi" && canPaint && painted ? swatches.vopsit : NO_SWATCHES;
  // a worktop is most often stone or wood: those families first there
  const families: ColorFamily[] = part === "blat" ? ["PIATRA", ...COLOR_FAMILIES.filter((f) => f !== "PIATRA")] : [...COLOR_FAMILIES];

  const brands = useMemo(() => {
    const seen: string[] = [];
    for (const item of decors) if (item.brand && !seen.includes(item.brand)) seen.push(item.brand);
    return seen.length > 1 ? seen : [];
  }, [decors]);
  const activeBrand = details && brand && brands.includes(brand) ? brand : null;
  const listed = activeBrand ? decors.filter((i) => i.brand === activeBrand) : decors;

  // every word typed must be found; „ral7016", „RAL 7016" and „7016" are the same search
  const typed = details ? fold(query.trim()) : "";
  const found = ((): Swatch[] | null => {
    if (!typed) return null;
    const wordsTyped = typed.split(/\s+/).filter(Boolean);
    const joined = wordsTyped.join("");
    const pool = part !== "fronturi" ? listed : activeBrand ? listed : [...swatches.fronturi, ...(canPaint ? swatches.vopsit : [])];
    return pool.filter((i) => wordsTyped.every((w) => i.text.includes(w)) || i.text.replace(/\s+/g, "").includes(joined));
  })();
  /** search results of the fronts, by material (the chosen material first) */
  const foundGroups = (() => {
    if (!found) return null;
    if (part !== "fronturi") return [{ kind: null as FrontKind | null, items: found }];
    const kindOf = (i: Swatch): FrontKind => (i.sets.part === "fronturi" ? i.sets.kind : "PAL");
    const order = [fronts.kind, ...offered.filter((k) => k !== fronts.kind)];
    return order.map((kind) => ({ kind: kind as FrontKind | null, items: found.filter((i) => kindOf(i) === kind) })).filter((g) => g.items.length > 0);
  })();

  const currentName = (p: ColorPart): string => {
    const key = p === "corp" ? config.carcassMaterialId : p === "blat" ? (config.kitchen?.worktopId ?? "") : painted ? `ral:${fronts.ralCode}` : `${fronts.kind}:${fronts.materialId}`;
    const list = p === "corp" ? swatches.corp : p === "blat" ? blat : painted ? swatches.vopsit : swatches.fronturi;
    const item = list.find((i) => i.key === key);
    if (!item) return "—";
    return p === "fronturi" && painted ? `${item.label}, vopsit` : item.label;
  };
  const PART_INFO: Record<ColorPart, { chip: string; of: string; hint: string; look: MaterialLook | null }> = {
    fronturi: { chip: words.chip, of: words.of, hint: "Partea din față, cea care se vede cel mai mult.", look: front },
    corp: {
      chip: parts.length < 3 ? "Corp și interior" : "Corp",
      of: "Culoarea corpului",
      hint: hasFronts && words.chip !== "Sertare" ? "Interiorul și lateralele. Am deschis ușile ca să se vadă." : "Interiorul și lateralele.",
      look: carcass,
    },
    blat: { chip: "Blat", of: "Culoarea blatului", hint: "Blat de 38 mm, rezistent la apă, tăiat pe măsură.", look: worktop },
  };

  // the ready-made combinations, drawn on this very piece of furniture
  const shape = useMemo(() => shapeOf(config), [config]);
  const glazing = useMemo(() => glazingOf(catalog, config.doors), [catalog, config.doors]);
  // the best-looking first; no dark ones on chests of drawers and wall units (house rule)
  const combos = useMemo(
    () =>
      featuredFirst(palettes)
        .filter((palette) => paletteAllowed(config.category, palette.id))
        .map((palette) => ({ palette, looks: paletteLooks(catalog, palette) })),
    [catalog, palettes, config.category],
  );
  const mirrorDoors = config.category === "DRESSING" && config.doors.type !== "NONE" && !doorFills(config).some((f) => f === "PANOU");

  return (
    <div className="atelier-stack">
      <section className="atelier-section" data-anchor="culori">
        <h2 className="sr-only">Culori</h2>
        {hasFronts && combos.length > 0 && (
          <div className="atelier-combos">
            <h3 className="atelier-family__title">Combinații gata făcute</h3>
            <RadioGroup label="Combinații gata făcute" className="atelier-combos__row">
              {combos.map(({ palette, looks }) => {
                const selected = palette.id === activePalette;
                return (
                  <button
                    key={palette.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className="atelier-card atelier-combo"
                    onClick={() => {
                      if (selected) return;
                      act({ type: "applyPalette", carcassMaterialId: palette.carcassMaterialId, fronts: palette.fronts });
                      // a combination is judged from the outside: back to the doors (the shell closes them)
                      setPicked("fronturi");
                      trackFunnel("palette_selected", { paletteId: palette.id, name: palette.name });
                    }}
                  >
                    <span className="atelier-combo__art">
                      <MiniPreview shape={shape} carcass={looks.carcass} front={looks.front} worktop={worktop} glazing={glazing} className="h-full w-full" />
                      {selected && <SelectedMark className="absolute right-1 top-1" />}
                    </span>
                    <span className="atelier-combo__name">{palette.name}</span>
                  </button>
                );
              })}
            </RadioGroup>
          </div>
        )}

        {/* the two (three) colours of the furniture, always on screen; a tap chooses which one the swatches below change */}
        <div ref={partsRef} className="atelier-parts" role="tablist" aria-label="Ce colorezi" data-count={parts.length}>
          {parts.map((p) => {
            const info = PART_INFO[p];
            return (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={p === part}
                className="atelier-part"
                onClick={() => choosePart(p)}
              >
                <span className="atelier-part__dot" style={info.look ? swatchStyle(info.look) : undefined} aria-hidden="true" />
                <span className="atelier-part__text">
                  <span className="atelier-part__label">
                    {info.chip}
                  </span>
                  <span className="atelier-part__name">{currentName(p)}</span>
                </span>
              </button>
            );
          })}
        </div>
        {!hasFronts && mirrorDoors && (
          <p className="atelier-hint mt-2">Ușile sunt din oglindă sau sticlă, așa că aici alegi doar culoarea corpului. Oglinda o schimbi la „Uși și mânere”.</p>
        )}

        <div className="atelier-colors" data-anchor={part} key={part}>
          {part === "fronturi" && offered.length > 1 && (
            <div className="atelier-material-block">
              <h3 className="atelier-colors__title">Din ce sunt făcute {words.chip === "Sertare" ? "fețele sertarelor" : words.chip === "Uși" ? "ușile" : "ușile și sertarele"}</h3>
              <p className="atelier-hint">Prețul e pentru mobila ta, așa cum e configurată acum.</p>
              <FrontMaterialPicker offered={offered} chosen={fronts.kind} prices={materialPrices} handleNote={handleNote} onPick={chooseMaterial} />
              {switchNote && JSON.stringify(switchNote.fronts) === JSON.stringify(fronts) && (
                <div className="atelier-handlenote" role="status">
                  <Info size={15} aria-hidden="true" />
                  <p>
                    {switchNote.approx
                      ? `Vopseaua nu poate imita lemnul sau piatra, așa că am ales cea mai apropiată culoare uni: ${currentName("fronturi").replace(/, vopsit$/, "")}.`
                      : `Am ales culoarea cea mai apropiată în ${FRONT_MATERIAL_LABEL[fronts.kind]}: ${currentName("fronturi").replace(/, vopsit$/, "")}.`}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="atelier-colors__head">
            <div className="min-w-0">
              <h3 className="atelier-colors__title">{PART_INFO[part].of}</h3>
              <p className="atelier-hint">{PART_INFO[part].hint}</p>
            </div>
            <button
              type="button"
              className="atelier-textbtn atelier-textbtn--quiet"
              aria-expanded={details}
              onClick={() => {
                setDetails((v) => !v);
                setQuery("");
              }}
            >
              {details ? <X size={14} aria-hidden="true" /> : <Search size={14} aria-hidden="true" />}
              {details ? "Ascunde" : "Detalii"}
            </button>
          </div>

          {details && (
            <div className="atelier-colors__details">
              <div className="atelier-search">
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setAllFound(false);
                  }}
                  placeholder={part === "blat" ? "Caută: stejar, marmură, beton…" : part === "fronturi" && canPaint ? "Caută: stejar, alb, H1145, 7016…" : "Caută: stejar, alb, H1145…"}
                  aria-label={`Caută: ${PART_INFO[part].of.toLowerCase()}`}
                />
              </div>
              {brands.length > 0 && (
                <RadioGroup className="atelier-scrollrow mt-2" selectOnArrow label="Producător">
                  {[null, ...brands].map((b) => (
                    <button key={b ?? "toate"} type="button" role="radio" aria-checked={activeBrand === b} className="atelier-chip atelier-chip--sm" onClick={() => setBrand(b)}>
                      {b ?? "Toți producătorii"}
                    </button>
                  ))}
                </RadioGroup>
              )}
              <p className="atelier-hint mt-2">Sub fiecare culoare vezi acum și codul ei din catalogul producătorului.</p>
            </div>
          )}

          {found && foundGroups ? (
            <div className="atelier-family">
              <div className="atelier-family__head">
                <h4 className="atelier-family__title">{found.length > 0 ? `Găsite: ${found.length}` : "Nimic nu se potrivește căutării"}</h4>
              </div>
              {(() => {
                // one limit for all groups together
                let room = allFound ? Infinity : SEARCH_LIMIT;
                return foundGroups.map(({ kind, items }) => {
                  const shown = items.slice(0, Math.max(0, room));
                  room -= shown.length;
                  if (shown.length === 0) return null;
                  return (
                    <div key={kind ?? "toate"}>
                      {kind && <p className="atelier-material__group">{FRONT_MATERIAL_LABEL[kind]}</p>}
                      <RadioGroup label={kind ? `Rezultatele căutării: ${FRONT_MATERIAL_LABEL[kind]}` : "Rezultatele căutării"} className="atelier-tiles atelier-tiles--four">
                        {shown.map((item) => (
                          <SwatchTile key={item.key} item={item} selected={item.key === selectedKey} codes onPick={pick} />
                        ))}
                      </RadioGroup>
                    </div>
                  );
                });
              })()}
              {!allFound && found.length > SEARCH_LIMIT && (
                <div className="atelier-family__more">
                  <button type="button" className="atelier-textbtn" onClick={() => setAllFound(true)}>
                    Mai multe ({found.length - SEARCH_LIMIT})
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {families.map((family) => (
                <Family
                  key={`${part === "fronturi" ? fronts.kind : part}:${family}:${activeBrand ?? ""}`}
                  title={FAMILY_LABELS[family]}
                  items={listed.filter((i) => i.family === family)}
                  selectedKey={selectedKey}
                  codes={details}
                  onPick={pick}
                />
              ))}
              {paints.length > 0 && !activeBrand && (
                <>
                  <Family
                    title="Culori de vopsea (RAL)"
                    hint="Vopsim mat, în orice culoare. Cele mai cerute sunt primele."
                    items={paints}
                    selectedKey={selectedKey}
                    codes={details}
                    onPick={pick}
                    first={POPULAR_RAL.length}
                    allAtOnce
                    moreLabel="Toate culorile"
                  />
                  {painted && (
                    <div className="atelier-family__more">
                      <button type="button" className="atelier-textbtn atelier-textbtn--quiet" aria-expanded={paintMore} onClick={() => setPaintMore((v) => !v)}>
                        {paintMore ? "Ascunde opțiunile de vopsire" : "Mai multe opțiuni de vopsire"}
                      </button>
                    </div>
                  )}
                  {painted && paintMore && (
                    <div className="atelier-box atelier-rows mt-1">
                      {catalog.fronts.MDF_VOPSIT.length > 1 && (
                        <Field label="Modelul ușii">
                          <Choice
                            label="Modelul ușii"
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
            </>
          )}
        </div>
      </section>
    </div>
  );
}
