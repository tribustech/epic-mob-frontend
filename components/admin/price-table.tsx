"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { foldText, formatLei, headline, type PriceBreakdown } from "@/lib/admin/breakdown";
import type { AtelierConfig } from "@/lib/atelier/types";
import { BreakdownView } from "./breakdown-view";
import { postBreakdowns } from "./client";
import "./admin.css";

export interface TableRow {
  key: string; slug: string; name: string; category: string; categoryLabel: string;
  paletteName: string; variantLabel: string; config: AtelierConfig; offerPercent: number | null; path: string;
}

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const n2 = (v: number | undefined | null) => (v == null ? "" : v.toFixed(2).replace(".", ","));

/** The table: loads the breakdowns product by product (3 at a time), filters, expands a row, exports CSV. */
export function PriceTable({ rows }: { rows: TableRow[] }) {
  const [data, setData] = useState<Record<string, PriceBreakdown | { error: string }>>({});
  const [cat, setCat] = useState("");
  const [slug, setSlug] = useState("");
  const [q, setQ] = useState("");
  const [onlyBad, setOnlyBad] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const groups = [...new Set(rows.map((r) => r.slug))].map((s) => rows.filter((r) => r.slug === s));
    let next = 0;
    const worker = async () => {
      while (live && next < groups.length) {
        const g = groups[next++];
        try {
          const items = await postBreakdowns(g.map((r) => ({ key: r.key, config: r.config, offerPercent: r.offerPercent })));
          if (live) setData((d) => ({ ...d, ...Object.fromEntries(g.map((r, i) => [r.key, items[i]])) }));
        } catch (e) {
          const error = e instanceof Error ? e.message : "Eroare";
          if (live) setData((d) => ({ ...d, ...Object.fromEntries(g.map((r) => [r.key, { error }])) }));
        }
      }
    };
    void Promise.all([worker(), worker(), worker()]);
    return () => {
      live = false;
    };
  }, [rows]);

  const categories = useMemo(() => [...new Map(rows.map((r) => [r.category, r.categoryLabel]))], [rows]);
  const products = useMemo(() => [...new Map(rows.filter((r) => !cat || r.category === cat).map((r) => [r.slug, r.name]))], [rows, cat]);
  const isBad = (k: string) => {
    const d = data[k];
    return !!d && ("error" in d || !d.totals || d.problems.length > 0 || !(d.totals.finalPrice > 0));
  };
  const shown = rows.filter((r) => {
    if (cat && r.category !== cat) return false;
    if (slug && r.slug !== slug) return false;
    if (q && !foldText(`${r.name} ${r.paletteName} ${r.variantLabel} ${r.slug}`).includes(foldText(q.trim()))) return false;
    return !onlyBad || isBad(r.key);
  });
  const loaded = rows.filter((r) => data[r.key]).length;

  const exportCsv = () => {
    const head = ["Produs", "Slug", "Categorie", "Culoare", "Variantă", "Materiale", "Feronerie", "Manoperă %", "Manoperă lei", "Preț fără ofertă", "Ofertă %", "Discount lei", "Preț final", "Probleme"];
    const lines = shown.map((r) => {
      const d = data[r.key];
      const b = d && !("error" in d) ? d : null;
      const t = b?.totals;
      return [r.name, r.slug, r.categoryLabel, r.paletteName, r.variantLabel, n2(t && headline(t).materials), n2(t?.hardware), t?.laborPct ?? "", n2(t?.labor), n2(t?.sellPrice), t?.discountPct ?? "", n2(t?.discount), n2(t?.finalPrice), d ? ("error" in d ? d.error : b!.problems.join(" | ")) : "neîncărcat"].map(csvCell).join(";");
    });
    const blob = new Blob(["﻿" + [head.join(";"), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `preturi-magazin-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <div className="adm-filters">
        <select value={cat} onChange={(e) => { setCat(e.target.value); setSlug(""); }} aria-label="Categorie">
          <option value="">Toate categoriile</option>
          {categories.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <select value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="Produs">
          <option value="">Toate produsele</option>
          {products.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută (produs, culoare, variantă)" aria-label="Caută" />
        <label><input type="checkbox" checked={onlyBad} onChange={(e) => setOnlyBad(e.target.checked)} /> Doar cu probleme</label>
        <button type="button" className="adm-btn adm-btn--ghost" onClick={exportCsv}>Descarcă CSV</button>
        <span className="adm-muted">{loaded < rows.length ? `Se încarcă ${loaded} / ${rows.length}…` : `${shown.length} rânduri`}</span>
      </div>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Produs</th><th>Culoare</th><th>Variantă</th>
              <th className="num">Materiale</th><th className="num">Feronerie</th><th className="num">Manoperă</th>
              <th className="num">Discount</th><th className="num">Preț final</th><th>Probleme</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const d = data[r.key];
              const b = d && !("error" in d) ? d : null;
              const t = b?.totals;
              return (
                <Fragment key={r.key}>
                  <tr className={`adm-row ${isBad(r.key) ? "is-bad" : ""}`} onClick={() => setOpen(open === r.key ? null : r.key)}>
                    <td><Link href={r.path} onClick={(e) => e.stopPropagation()}>{r.name}</Link></td>
                    <td>{r.paletteName}</td>
                    <td>{r.variantLabel}</td>
                    <td className="num">{t ? formatLei(headline(t).materials) : "…"}</td>
                    <td className="num">{t ? formatLei(t.hardware) : ""}</td>
                    <td className="num">{t ? `${Math.round(t.laborPct)}% · ${formatLei(t.labor)}` : ""}</td>
                    <td className="num">{t?.discount ? `${t.discountPct}% · −${formatLei(t.discount)}` : ""}</td>
                    <td className="num"><b>{t ? formatLei(t.finalPrice) : ""}</b></td>
                    <td>{d ? ("error" in d ? d.error : b!.problems.length || "") : ""}</td>
                  </tr>
                  {open === r.key && b && (
                    <tr><td colSpan={9} className="adm-expand"><BreakdownView b={b} /></td></tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
