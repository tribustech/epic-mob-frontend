"use client";

import { useEffect, useMemo, useState } from "react";
import { MOOD_LABELS, PALETTES, type PaletteMood } from "@/lib/atelier/palettes";
import { ROOM_LABELS, SHOP_CATEGORIES, type ShopCategory, type ShopRoom } from "@/lib/shop/products";
import type { ShopItem } from "@/lib/shop/server";
import { ProductCard } from "./product-card";

type Sort = "recomandat" | "pret-asc" | "pret-desc";
const SORT_LABELS: Record<Sort, string> = { recomandat: "Recomandate", "pret-asc": "Preț crescător", "pret-desc": "Preț descrescător" };

interface Filters {
  categorie: ShopCategory | null;
  camera: ShopRoom | null;
  culoare: PaletteMood | null;
  oferte: boolean;
  sort: Sort;
}

const MOOD_OF = new Map(PALETTES.map((p) => [p.id, p.mood]));

function fromUrl(search: string): Filters {
  const q = new URLSearchParams(search);
  const cat = q.get("categorie");
  const room = q.get("camera");
  const mood = q.get("culoare")?.toUpperCase();
  const sort = q.get("ordine");
  return {
    categorie: SHOP_CATEGORIES.some((c) => c.id === cat) ? (cat as ShopCategory) : null,
    camera: room && room in ROOM_LABELS ? (room as ShopRoom) : null,
    culoare: mood && mood in MOOD_LABELS ? (mood as PaletteMood) : null,
    oferte: q.get("oferte") === "1",
    sort: sort && sort in SORT_LABELS ? (sort as Sort) : "recomandat",
  };
}

function toUrl(f: Filters): string {
  const q = new URLSearchParams();
  if (f.categorie) q.set("categorie", f.categorie);
  if (f.camera) q.set("camera", f.camera);
  if (f.culoare) q.set("culoare", f.culoare.toLowerCase());
  if (f.oferte) q.set("oferte", "1");
  if (f.sort !== "recomandat") q.set("ordine", f.sort);
  const s = q.toString();
  return s ? `?${s}` : "";
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={`shop-chip ${active ? "is-active" : ""}`} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}

const priceOf = (item: ShopItem) => item.variants[0]?.finalPrice ?? Number.POSITIVE_INFINITY;

export function ShopBrowser({ items }: { items: ShopItem[] }) {
  const [f, setF] = useState<Filters>({ categorie: null, camera: null, culoare: null, oferte: false, sort: "recomandat" });

  // read the filters from the address once on the client (links like /magazin?categorie=comode)
  useEffect(() => {
    const read = () => setF(fromUrl(window.location.search));
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  const update = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    setF(next);
    window.history.replaceState(null, "", `${window.location.pathname}${toUrl(next)}`);
  };

  const shown = useMemo(() => {
    const list = items.filter(
      (item) =>
        (!f.categorie || item.category === f.categorie) &&
        (!f.camera || item.rooms.includes(f.camera)) &&
        (!f.oferte || item.offer) &&
        (!f.culoare || item.variants.some((v) => MOOD_OF.get(v.paletteId) === f.culoare)),
    );
    if (f.sort === "pret-asc") return [...list].sort((a, b) => priceOf(a) - priceOf(b));
    if (f.sort === "pret-desc") return [...list].sort((a, b) => (priceOf(b) === Infinity ? -1 : priceOf(b)) - (priceOf(a) === Infinity ? -1 : priceOf(a)));
    // recommended: offers first, then the „Cel mai ales" models, then the rest in catalog order
    return [...list].sort((a, b) => Number(!!b.offer) - Number(!!a.offer) || Number(!!b.badge) - Number(!!a.badge));
  }, [items, f]);

  const offers = items.filter((i) => i.offer).length;
  const anyFilter = f.categorie || f.camera || f.culoare || f.oferte;

  return (
    <div id="produse" className="shop-browser">
      <div className="shop-filters" role="group" aria-label="Filtre">
        <div className="shop-filters__row">
          <Chip active={!f.categorie} onClick={() => update({ categorie: null })}>
            Toate
          </Chip>
          {SHOP_CATEGORIES.map((c) => (
            <Chip key={c.id} active={f.categorie === c.id} onClick={() => update({ categorie: f.categorie === c.id ? null : c.id })}>
              {c.label}
            </Chip>
          ))}
          {offers > 0 && (
            <Chip active={f.oferte} onClick={() => update({ oferte: !f.oferte })}>
              Oferte ({offers})
            </Chip>
          )}
        </div>
        <div className="shop-filters__row shop-filters__row--small">
          <label className="shop-select">
            <span>Camera</span>
            <select value={f.camera ?? ""} onChange={(e) => update({ camera: (e.target.value || null) as ShopRoom | null })}>
              <option value="">Oricare</option>
              {(Object.keys(ROOM_LABELS) as ShopRoom[]).map((r) => (
                <option key={r} value={r}>
                  {ROOM_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="shop-select">
            <span>Culori</span>
            <select value={f.culoare ?? ""} onChange={(e) => update({ culoare: (e.target.value || null) as PaletteMood | null })}>
              <option value="">Oricare</option>
              {(Object.keys(MOOD_LABELS) as PaletteMood[]).map((m) => (
                <option key={m} value={m}>
                  {MOOD_LABELS[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="shop-select">
            <span>Ordine</span>
            <select value={f.sort} onChange={(e) => update({ sort: e.target.value as Sort })}>
              {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <span className="shop-filters__count" aria-live="polite">
            {shown.length} {shown.length === 1 ? "produs" : "produse"}
          </span>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="shop-empty">
          <p>Niciun produs nu se potrivește cu filtrele alese.</p>
          {anyFilter && (
            <button type="button" className="btn-warm btn-warm--ghost mt-4" onClick={() => update({ categorie: null, camera: null, culoare: null, oferte: false })}>
              Arată tot
            </button>
          )}
        </div>
      ) : (
        <ul className="shop-grid">
          {shown.map((item, i) => (
            <li key={item.slug}>
              <ProductCard item={item} priority={i < 4} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
