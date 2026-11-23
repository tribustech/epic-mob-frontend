"use client";

import { useMemo, useState } from "react";
import {
  BUCKET_LABEL,
  HARDWARE_CATEGORY,
  edgeSides,
  foldText,
  formatLei,
  formatLei2,
  formatNum,
  partSearchText,
  partsCsv,
  type BreakdownReconciliation,
  type CabinetCostBlock,
} from "@/lib/admin/breakdown";

const KIND_LABEL: Record<CabinetCostBlock["kind"], string> = { CORP: "corp", BLAT: "blat", ALTELE: "piese fără corp" };

const dims = (c: CabinetCostBlock) => {
  const d = [c.widthMm, c.heightMm, c.depthMm].filter((x): x is number => x != null);
  return d.length ? `${d.join(" × ")} mm` : "";
};

/** The rest between the cabinets and the engine total: rounding to bani (shown in bani) or an unshared sum. */
function restText(r: BreakdownReconciliation): string {
  if (Math.abs(r.rest) < 0.00005) return "";
  if (Math.abs(r.rest) < 0.005) return ` (${r.rest < 0 ? "−" : "+"}${formatNum(Math.abs(r.rest) * 100, 2)} bani rotunjire)`;
  return ` ${r.rest < 0 ? "−" : "+"} ${r.restName.toLowerCase()} ${formatLei2(Math.abs(r.rest))} = ${formatLei2(r.engine)}`;
}

/**
 * „Pe fiecare corp": every cabinet of the configuration with every piece the CRM engine cuts (size, qty,
 * material, m², its share of the board cost, edge banding) and the cabinet's own hardware. Search, CSV.
 */
export function CabinetsView({ cabinets, reconciliation = [] }: { cabinets: CabinetCostBlock[]; reconciliation?: BreakdownReconciliation[] }) {
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<"" | "ok" | "err">("");
  const needle = foldText(q.trim());

  const shown = useMemo(() => {
    if (!needle) return cabinets;
    return cabinets
      .map((c) => {
        const hit = foldText(c.label).includes(needle);
        return {
          ...c,
          parts: hit ? c.parts : c.parts.filter((p) => partSearchText(c, p).includes(needle)),
          hardware: hit ? c.hardware : c.hardware.filter((h) => foldText(`${h.name} ${h.code} ${HARDWARE_CATEGORY[h.category] ?? h.category}`).includes(needle)),
        };
      })
      .filter((c) => c.parts.length > 0 || c.hardware.length > 0);
  }, [cabinets, needle]);

  const pieces = cabinets.reduce((n, c) => n + c.parts.reduce((m, p) => m + p.qty, 0), 0);
  const csv = () => partsCsv(cabinets);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(csv());
      setCopied("ok");
    } catch {
      setCopied("err");
    }
    setTimeout(() => setCopied(""), 2000);
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob(["﻿" + csv()], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "piese-defalcare.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="adm-cabs">
      <div className="adm-cabs__head">
        <h3>
          Pe fiecare corp <span className="adm-muted">({cabinets.length} grupuri, {pieces} piese)</span>
        </h3>
        <div className="adm-cabs__tools">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Caută piesă, corp, material, cant…" aria-label="Caută în piese" />
          <button type="button" className="adm-btn adm-btn--ghost" onClick={copy}>
            {copied === "ok" ? "Copiat" : copied === "err" ? "Nu s-a putut copia" : "Copiază CSV"}
          </button>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={download}>
            Descarcă CSV
          </button>
        </div>
      </div>

      {reconciliation.length > 0 && (
        <p className="adm-formula">
          Suma pe corpuri = totalul de sus: {reconciliation
            .map((r) => `${BUCKET_LABEL[r.bucket]} ${formatLei2(r.allocated)}${restText(r)}`)
            .join(" · ")}
        </p>
      )}

      {shown.length === 0 && <p className="adm-muted">Nicio piesă nu se potrivește.</p>}
      {shown.map((c) => (
        <details key={c.label} className="adm-sec adm-cab" open={!!needle || cabinets.length <= 1}>
          <summary>
            <span>
              {c.label} <small className="adm-muted">{[KIND_LABEL[c.kind], c.type && c.kind === "CORP" ? c.type.toLowerCase() : null, dims(c)].filter(Boolean).join(" · ")}</small>
            </span>
            <b>{formatLei(c.totals.total)}</b>
          </summary>
          <div className="adm-sec__body">
            <table className="adm-lines adm-parts">
              <thead>
                <tr>
                  <th>Piesă</th>
                  <th>Dimensiuni</th>
                  <th className="num">Buc</th>
                  <th>Material</th>
                  <th className="num">m²</th>
                  <th className="num">Placă</th>
                  <th className="num">Debit.</th>
                  <th>Cant</th>
                  <th className="num">ml</th>
                  <th className="num">Cost cant</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {c.parts.map((p, i) => (
                  <tr key={i}>
                    <td>
                      {p.name}
                      {p.basis && <small>{p.basis}</small>}
                    </td>
                    <td className="nowrap">
                      {p.lengthMm} × {p.widthMm}
                      {p.thicknessMm != null && ` × ${p.thicknessMm}`}
                    </td>
                    <td className="num">{p.qty}</td>
                    <td>
                      {p.materialName}
                      {p.decorCode && !p.materialName.includes(p.decorCode) && <small>{p.decorCode}</small>}
                    </td>
                    <td className="num">{formatNum(p.areaSqm, 3)}</td>
                    <td className="num">{formatLei2(p.boardCost)}</td>
                    <td className="num">{p.cuttingCost ? formatLei2(p.cuttingCost) : "—"}</td>
                    <td>
                      {p.edges.length ? edgeSides(p) : "—"}
                      {p.edges.length > 0 && <small>{[...new Set(p.edges.map((e) => e.name))].join(" + ")}</small>}
                    </td>
                    <td className="num">{p.edgeMl ? formatNum(p.edgeMl, 2) : "—"}</td>
                    <td className="num">{p.edgeCost ? formatLei2(p.edgeCost) : "—"}</td>
                    <td>{formatLei2(p.total)}</td>
                  </tr>
                ))}
                {c.hardware.map((h) => (
                  <tr key={h.code} className={`adm-parts__hw ${h.unitPrice ? "" : "adm-warn"}`}>
                    <td colSpan={2}>
                      {h.name}
                      <small>{HARDWARE_CATEGORY[h.category] ?? h.category} · <code>{h.code}</code></small>
                    </td>
                    <td className="num">{formatNum(h.qty)}</td>
                    <td colSpan={7}>feronerie · {formatNum(h.qty)} × {formatLei2(h.unitPrice)}</td>
                    <td>{formatLei2(h.total)}</td>
                  </tr>
                ))}
                {c.extras.map((x) => (
                  <tr key={x.name} className="adm-parts__hw">
                    <td colSpan={10}>
                      {x.name}
                      <small>{BUCKET_LABEL[x.bucket]}{x.detail ? ` · ${x.detail}` : ""}</small>
                    </td>
                    <td>{formatLei2(x.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={11}>
                    Plăci {formatLei2(c.totals.boards)} · debitare {formatLei2(c.totals.cuttingService)} · cant {formatLei2(c.totals.edging)} · feronerie {formatLei2(c.totals.hardware)} = <b>{formatLei2(c.totals.total)}</b>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </details>
      ))}
      <p className="adm-muted">
        Costul plăcii pe piesă = m² piesei din m² materialului × costul materialului (cu pierderea și facturarea din totaluri). Oglinda, sticla, sistemele și serviciile nu țin de un corp: sunt mai sus. Fără manoperă.
      </p>
    </section>
  );
}
