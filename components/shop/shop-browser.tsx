"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, PencilRuler, SearchX, SlidersHorizontal, X } from "lucide-react";
import { MOOD_LABELS, type PaletteMood } from "@/lib/atelier/palettes";
import {
  ROOM_LABELS,
  SHOP_CATEGORIES,
  SHOP_PRODUCTS,
  SHOP_TYPES,
  SHOP_WIDTHS,
  typeOf,
  widthOf,
  withMirror,
  type ShopCategory,
  type ShopRoom,
  type ShopType,
  type ShopWidth,
} from "@/lib/shop/products";
import type { ShopItem } from "@/lib/shop/server";
import { ProductCard, moodOf } from "./product-card";

type Sort = "recomandat" | "pret-asc" | "pret-desc";
const SORT_LABELS: Record<Sort, string> = { recomandat: "Recomandate", "pret-asc": "Preț: de la mic la mare", "pret-desc": "Preț: de la mare la mic" };

interface Filters {
  categorie: ShopCategory | null;
  tip: ShopType | null;
  camera: ShopRoom | null;
  latime: ShopWidth | null;
  culoare: PaletteMood | null;
  oglinda: boolean;
  oferte: boolean;
  sort: Sort;
}

const NONE: Filters = { categorie: null, tip: null, camera: null, latime: null, culoare: null, oglinda: false, oferte: false, sort: "recomandat" };
/** the filters besides the category (one count on the „Filtre" button, one „Șterge filtrele" in the sheet) */
const NO_EXTRA: Partial<Filters> = { tip: null, camera: null, latime: null, culoare: null, oglinda: false, oferte: false };

/** what the cards do not carry: kind of piece, width band, mirror */
const META = new Map(SHOP_PRODUCTS.map((p) => [p.slug, { tip: typeOf(p.slug), latime: widthOf(p.preset), oglinda: withMirror(p.preset) }]));
const ROOMS = Object.keys(ROOM_LABELS) as ShopRoom[];
const MOODS = Object.keys(MOOD_LABELS) as PaletteMood[];
/** the event the „Toate ofertele" links on the same page use to set a filter without a reload */
const FILTER_EVENT = "epicmob-magazin-filtru";

function fromUrl(search: string): Filters {
  const q = new URLSearchParams(search);
  const cat = q.get("categorie");
  const room = q.get("camera");
  const mood = q.get("culoare")?.toUpperCase();
  const sort = q.get("ordine");
  const tip = q.get("tip");
  const latime = q.get("latime");
  return {
    categorie: SHOP_CATEGORIES.some((c) => c.id === cat) ? (cat as ShopCategory) : null,
    tip: SHOP_TYPES.some((t) => t.id === tip) ? (tip as ShopType) : null,
    camera: room && room in ROOM_LABELS ? (room as ShopRoom) : null,
    latime: SHOP_WIDTHS.some((w) => w.id === latime) ? (latime as ShopWidth) : null,
    culoare: mood && mood in MOOD_LABELS ? (mood as PaletteMood) : null,
    oglinda: q.get("oglinda") === "1",
    oferte: q.get("oferte") === "1",
    sort: sort && sort in SORT_LABELS ? (sort as Sort) : "recomandat",
  };
}

function toUrl(f: Filters): string {
  const q = new URLSearchParams();
  if (f.categorie) q.set("categorie", f.categorie);
  if (f.tip) q.set("tip", f.tip);
  if (f.camera) q.set("camera", f.camera);
  if (f.latime) q.set("latime", f.latime);
  if (f.culoare) q.set("culoare", f.culoare.toLowerCase());
  if (f.oglinda) q.set("oglinda", "1");
  if (f.oferte) q.set("oferte", "1");
  if (f.sort !== "recomandat") q.set("ordine", f.sort);
  const s = q.toString();
  return s ? `?${s}` : "";
}

const matches = (item: ShopItem, f: Filters) =>
  (!f.categorie || item.category === f.categorie) &&
  (!f.tip || META.get(item.slug)?.tip === f.tip) &&
  (!f.camera || item.rooms.includes(f.camera)) &&
  (!f.latime || META.get(item.slug)?.latime === f.latime) &&
  (!f.oglinda || !!META.get(item.slug)?.oglinda) &&
  (!f.oferte || !!item.offer) &&
  (!f.culoare || item.variants.some((v) => moodOf(v) === f.culoare));

/** price of the colour the card shows (the first one of the chosen colour family) */
function priceOf(item: ShopItem, mood: PaletteMood | null): number | null {
  const v = (mood && item.variants.find((x) => moodOf(x) === mood)) || item.variants[0];
  return v?.finalPrice ?? null;
}

const plural = (n: number) => `${n} ${n === 1 ? "produs" : "produse"}`;

/** A link (on /magazin itself) that sets the filters on the spot and scrolls to the products. */
export function ShopFilterLink({ filter, className, children }: { filter: Partial<Filters>; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={`/magazin${toUrl({ ...NONE, ...filter })}#produse`}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(FILTER_EVENT, { detail: { ...NONE, ...filter } }));
      }}
    >
      {children}
    </a>
  );
}

function Option({ active, count, onClick, children }: { active: boolean; count?: number; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`shop-opt ${active ? "is-active" : ""}`} aria-pressed={active} disabled={!active && count === 0} onClick={onClick}>
      {active && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
      {children}
      {count != null && <span className="shop-opt__count">{count}</span>}
    </button>
  );
}

export function ShopBrowser({ items }: { items: ShopItem[] }) {
  const [f, setF] = useState<Filters>(NONE);
  const [sheetOpen, setSheetOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const toTop = (always = false) => {
    const el = rootRef.current;
    if (el && (always || el.getBoundingClientRect().top < 0)) el.scrollIntoView({ block: "start" });
  };

  // read the filters from the address once on the client (links like /magazin?categorie=comode)
  useEffect(() => {
    const read = () => setF(fromUrl(window.location.search));
    read();
    const onLink = (e: Event) => {
      const next = (e as CustomEvent<Filters>).detail;
      setF(next);
      window.history.replaceState(null, "", `${window.location.pathname}${toUrl(next)}`);
      rootRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    };
    window.addEventListener("popstate", read);
    window.addEventListener(FILTER_EVENT, onLink);
    return () => {
      window.removeEventListener("popstate", read);
      window.removeEventListener(FILTER_EVENT, onLink);
    };
  }, []);

  const update = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    setF(next);
    window.history.replaceState(null, "", `${window.location.pathname}${toUrl(next)}`);
    // the list got shorter: do not leave the visitor looking at the footer
    if (!sheetOpen) toTop();
  };

  // the phone sheet is a native <dialog>: it traps focus, closes on Esc and sits above the site header
  useEffect(() => {
    const dlg = sheetRef.current;
    if (!dlg) return;
    if (sheetOpen && !dlg.open) dlg.showModal();
    if (!sheetOpen && dlg.open) dlg.close();
  }, [sheetOpen]);

  // keep the chosen category chip in view on phones
  useEffect(() => {
    const row = tabsRef.current;
    const chip = row?.querySelector<HTMLElement>(".is-active");
    if (row && chip) row.scrollTo({ left: f.categorie ? chip.offsetLeft - 40 : 0, behavior: "smooth" });
  }, [f.categorie]);

  const shown = useMemo(() => {
    const list = items.filter((item) => matches(item, f));
    const p = (item: ShopItem) => priceOf(item, f.culoare);
    // products without a price today always go last
    if (f.sort === "pret-asc") return [...list].sort((a, b) => (p(a) ?? Infinity) - (p(b) ?? Infinity));
    if (f.sort === "pret-desc") return [...list].sort((a, b) => (p(b) ?? -Infinity) - (p(a) ?? -Infinity));
    // recommended: offers first, then the „Cel mai ales" models, then the rest in catalog order
    return [...list].sort((a, b) => Number(!!b.offer) - Number(!!a.offer) || Number(!!b.badge) - Number(!!a.badge));
  }, [items, f]);

  /** how many products a choice would show, with the other filters kept */
  const countWith = (patch: Partial<Filters>) => items.filter((item) => matches(item, { ...f, ...patch })).length;

  const offers = items.filter((i) => i.offer).length;
  const category = SHOP_CATEGORIES.find((c) => c.id === f.categorie);
  const mirrors = items.filter((i) => META.get(i.slug)?.oglinda).length;
  const extraCount = Number(!!f.tip) + Number(!!f.camera) + Number(!!f.latime) + Number(!!f.culoare) + Number(f.oglinda) + Number(f.oferte);
  const anyFilter = !!f.categorie || extraCount > 0;
  const clear = () => update({ categorie: null, ...NO_EXTRA });

  const active: { key: string; label: string; off: Partial<Filters> }[] = [];
  if (category) active.push({ key: "cat", label: category.label, off: { categorie: null } });
  if (f.tip) active.push({ key: "tip", label: SHOP_TYPES.find((t) => t.id === f.tip)!.label, off: { tip: null } });
  if (f.camera) active.push({ key: "cam", label: ROOM_LABELS[f.camera], off: { camera: null } });
  if (f.latime) active.push({ key: "lat", label: `Lățime: ${SHOP_WIDTHS.find((w) => w.id === f.latime)!.label.toLowerCase()}`, off: { latime: null } });
  if (f.culoare) active.push({ key: "cul", label: `Culori: ${MOOD_LABELS[f.culoare].toLowerCase()}`, off: { culoare: null } });
  if (f.oglinda) active.push({ key: "ogl", label: "Cu oglindă", off: { oglinda: false } });
  if (f.oferte) active.push({ key: "of", label: "La ofertă", off: { oferte: false } });

  const categoryOptions = (
    <>
      <Option active={!f.categorie} count={countWith({ categorie: null })} onClick={() => update({ categorie: null })}>
        Toate
      </Option>
      {/* a kind of furniture with no product right now (e.g. the CRM does not price kitchens yet) is not offered */}
      {SHOP_CATEGORIES.filter((c) => f.categorie === c.id || items.some((i) => i.category === c.id)).map((c) => (
        <Option key={c.id} active={f.categorie === c.id} count={countWith({ categorie: c.id })} onClick={() => update({ categorie: f.categorie === c.id ? null : c.id })}>
          {c.label}
        </Option>
      ))}
    </>
  );

  /** kind of piece, room, width, colour family, mirror and offers: the same groups in the desktop column and in the phone sheet */
  const groups = (idPrefix: string) => (
    <>
      <fieldset className="shop-fgroup">
        <legend>Cauți ceva anume?</legend>
        <div className="shop-fgroup__opts">
          {SHOP_TYPES.map((t) => (
            <Option key={t.id} active={f.tip === t.id} count={countWith({ tip: t.id })} onClick={() => update({ tip: f.tip === t.id ? null : t.id })}>
              {t.label}
            </Option>
          ))}
        </div>
      </fieldset>
      <fieldset className="shop-fgroup">
        <legend>Pentru ce cameră?</legend>
        <div className="shop-fgroup__opts">
          {ROOMS.map((r) => (
            <Option key={r} active={f.camera === r} count={countWith({ camera: r })} onClick={() => update({ camera: f.camera === r ? null : r })}>
              {ROOM_LABELS[r]}
            </Option>
          ))}
        </div>
      </fieldset>
      <fieldset className="shop-fgroup">
        <legend>Ce lățime are locul?</legend>
        <div className="shop-fgroup__opts">
          {SHOP_WIDTHS.map((w) => (
            <Option key={w.id} active={f.latime === w.id} count={countWith({ latime: w.id })} onClick={() => update({ latime: f.latime === w.id ? null : w.id })}>
              {w.label}
            </Option>
          ))}
        </div>
      </fieldset>
      <fieldset className="shop-fgroup">
        <legend>Ce culori îți plac?</legend>
        <div className="shop-fgroup__opts">
          {MOODS.map((m) => (
            <Option key={m} active={f.culoare === m} count={countWith({ culoare: m })} onClick={() => update({ culoare: f.culoare === m ? null : m })}>
              <span className={`shop-mood shop-mood--${m.toLowerCase()}`} aria-hidden="true" />
              {MOOD_LABELS[m]}
            </Option>
          ))}
        </div>
      </fieldset>
      {mirrors > 0 && (
        <div className="shop-fgroup">
          <button type="button" role="switch" aria-checked={f.oglinda} id={`${idPrefix}-oglinda`} className="shop-switch" onClick={() => update({ oglinda: !f.oglinda })}>
            <span className="shop-switch__text">
              <strong>Cu oglindă</strong>
              <span>{plural(countWith({ oglinda: true }))} cu uși sau dulap cu oglindă</span>
            </span>
            <span className="shop-switch__track" aria-hidden="true">
              <span />
            </span>
          </button>
        </div>
      )}
      {offers > 0 && (
        <div className="shop-fgroup">
          <button type="button" role="switch" aria-checked={f.oferte} id={`${idPrefix}-oferte`} className="shop-switch" onClick={() => update({ oferte: !f.oferte })}>
            <span className="shop-switch__text">
              <strong>Doar la ofertă</strong>
              <span>{plural(offers)} cu preț redus</span>
            </span>
            <span className="shop-switch__track" aria-hidden="true">
              <span />
            </span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <div id="produse" className="shop-browser" ref={rootRef}>
      <div className="shop-browser__head">
        <h2 className="display-font shop-section-head__title">{category ? category.label : "Toate produsele"}</h2>
        <p className="shop-section-head__note">{category ? category.blurb : "Alege un fel de mobilier sau spune-ne pentru ce cameră cauți."}</p>
      </div>

      {/* phones and tablets: categories in one row you swipe sideways */}
      <div className="shop-cattabs" role="group" aria-label="Fel de mobilier" ref={tabsRef}>
        {categoryOptions}
      </div>

      <div className="shop-browser__layout">
        {/* desktop: all the filters in a column that stays in view */}
        <aside className="shop-side" aria-label="Filtre">
          <fieldset className="shop-fgroup">
            <legend>Fel de mobilier</legend>
            <div className="shop-fgroup__opts shop-fgroup__opts--list">{categoryOptions}</div>
          </fieldset>
          {groups("side")}
          {anyFilter && (
            <button type="button" className="shop-clear" onClick={clear}>
              <X size={15} aria-hidden="true" /> Șterge filtrele
            </button>
          )}
        </aside>

        <div className="shop-results">
          <div className="shop-toolbar">
            <button type="button" className="shop-toolbar__filters" onClick={() => setSheetOpen(true)} aria-haspopup="dialog">
              <SlidersHorizontal size={17} aria-hidden="true" />
              Filtre
              {extraCount > 0 && <span className="shop-toolbar__badge">{extraCount}</span>}
            </button>
            <p className="shop-toolbar__count" aria-live="polite">
              {plural(shown.length)}
            </p>
            <label className="shop-sort">
              <span className="shop-sort__label">Ordonează</span>
              <select value={f.sort} onChange={(e) => update({ sort: e.target.value as Sort })} aria-label="Ordonează produsele">
                {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                  <option key={s} value={s}>
                    {SORT_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {active.length > 0 && (
            <ul className="shop-active" aria-label="Filtre alese">
              {active.map((a) => (
                <li key={a.key}>
                  <button type="button" className="shop-active__chip" onClick={() => update(a.off)} aria-label={`Scoate filtrul: ${a.label}`}>
                    {a.label}
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
              <li>
                <button type="button" className="shop-clear" onClick={clear}>
                  Șterge filtrele
                </button>
              </li>
            </ul>
          )}

          {shown.length === 0 ? (
            <div className="shop-empty">
              <span className="shop-empty__icon">
                <SearchX size={26} aria-hidden="true" />
              </span>
              <h3>Nu avem nimic cu toate aceste filtre</h3>
              <p>Scoate unul dintre ele sau fă-ți mobila pe măsură, exact cum o vrei.</p>
              <div className="shop-empty__actions">
                <button type="button" className="btn-warm btn-warm--primary" onClick={clear}>
                  Șterge filtrele
                </button>
                <Link href="/configurator" className="btn-warm btn-warm--ghost">
                  <PencilRuler size={16} aria-hidden="true" /> Deschide Atelierul 3D
                </Link>
              </div>
            </div>
          ) : (
            <ul className="shop-grid">
              {shown.map((item, i) => (
                <li key={`${item.slug}-${f.culoare ?? ""}`}>
                  <ProductCard item={item} priority={i < 4} mood={f.culoare} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <dialog
        ref={sheetRef}
        className="shop-sheet"
        aria-labelledby="shop-sheet-title"
        onClose={() => setSheetOpen(false)}
        onClick={(e) => {
          // a tap on the dark area around the sheet closes it
          if (e.target === e.currentTarget) setSheetOpen(false);
        }}
      >
        <div className="shop-sheet__panel">
          <header className="shop-sheet__head">
            <h2 id="shop-sheet-title">Filtre</h2>
            <button type="button" className="shop-sheet__close" onClick={() => setSheetOpen(false)} aria-label="Închide filtrele">
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className="shop-sheet__body">{sheetOpen && groups("sheet")}</div>
          <footer className="shop-sheet__foot">
            <button type="button" className="shop-clear" onClick={() => update(NO_EXTRA)} disabled={extraCount === 0}>
              Șterge filtrele
            </button>
            <button
              type="button"
              className="btn-warm btn-warm--primary shop-sheet__apply"
              onClick={() => {
                setSheetOpen(false);
                toTop(true);
              }}
            >
              {shown.length === 0 ? "Niciun produs" : `Arată ${plural(shown.length)}`}
              {shown.length > 0 && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </footer>
        </div>
      </dialog>
    </div>
  );
}
