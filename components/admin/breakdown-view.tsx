"use client";

import { HARDWARE_CATEGORY, formatLei, formatLei2, formatNum, headline, type PriceBreakdown } from "@/lib/admin/breakdown";
import { CabinetsView } from "./cabinets-view";
import "./admin.css";

function Section({ title, total, open = false, children }: { title: string; total?: number; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="adm-sec" open={open}>
      <summary>
        <span>{title}</span>
        {total !== undefined && <b>{formatLei(total)}</b>}
      </summary>
      <div className="adm-sec__body">{children}</div>
    </details>
  );
}

/** The whole breakdown: big totals on top, then the lines in sections that open on a tap. */
export function BreakdownView({ b, compact = false }: { b: PriceBreakdown; compact?: boolean }) {
  const t = b.totals;
  const sum = (xs?: { total: number }[]) => (xs ?? []).reduce((s, x) => s + x.total, 0);
  return (
    <div className="adm-bd">
      {b.problems.length > 0 && (
        <ul className="adm-problems">
          {b.problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {t && (
        <dl className="adm-totals">
          <div><dt>Materiale</dt><dd>{formatLei(headline(t).materials)}</dd></div>
          <div><dt>Feronerie</dt><dd>{formatLei(t.hardware)}</dd></div>
          <div><dt>Manoperă {formatNum(t.laborPct, 1)}%</dt><dd>{formatLei(t.labor)}</dd></div>
          <div><dt>Discount{t.discountPct ? ` ${formatNum(t.discountPct, 1)}%` : ""}</dt><dd>{t.discount ? `−${formatLei(t.discount)}` : "—"}</dd></div>
          <div className="adm-totals__final"><dt>Preț final</dt><dd>{formatLei(t.finalPrice)}</dd></div>
        </dl>
      )}
      {t && !compact && (
        <p className="adm-formula">
          Cost atelier {formatLei2(t.materials)} + manoperă {formatNum(t.laborPct, 1)}% din {formatLei2(t.laborBase)} = {formatLei2(t.sellPrice)}
          {t.discount ? ` − ofertă ${formatLei2(t.discount)} = ${formatLei2(t.finalPrice)}` : ""}
        </p>
      )}
      {t && (
        <>
          <Section title="Plăci" total={sum(b.boards)}>
            <table className="adm-lines">
              <thead><tr><th>Material</th><th>m²</th><th>Plăci</th><th>Pierdere</th><th>Preț</th><th>Total</th></tr></thead>
              <tbody>
                {(b.boards ?? []).map((x) => (
                  <tr key={x.materialId}>
                    <td>{x.name}<small>{x.kind} {x.thicknessMm} mm · {x.materialId}</small></td>
                    <td>{formatNum(x.areaSqm)}</td>
                    <td>{x.sheets ?? "—"}</td>
                    <td>{x.wastePct == null ? "—" : `${formatNum(x.wastePct, 0)}%`}</td>
                    <td>{x.pricePerSheet != null ? `${formatLei2(x.pricePerSheet)}/placă` : `${formatLei2(x.pricePerSqm)}/m²`}</td>
                    <td>{formatLei2(x.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
          <Section title="Cant" total={sum(b.edging)}>
            <table className="adm-lines">
              <thead><tr><th>Bandă</th><th>ml</th><th>Preț/ml</th><th>Total</th></tr></thead>
              <tbody>
                {(b.edging ?? []).map((x) => (
                  <tr key={x.edgeBandId}><td>{x.name}<small>{x.edgeBandId}</small></td><td>{formatNum(x.ml)}</td><td>{formatLei2(x.pricePerMl)}</td><td>{formatLei2(x.total)}</td></tr>
                ))}
              </tbody>
            </table>
          </Section>
          <Section title="Feronerie" total={t.hardware} open={(b.unresolvedHardware ?? []).length > 0}>
            <table className="adm-lines">
              <thead><tr><th>Produs</th><th>Cod</th><th>Buc.</th><th>Preț</th><th>Total</th></tr></thead>
              <tbody>
                {(b.hardware ?? []).map((x) => (
                  <tr key={x.code} className={x.unitPrice ? "" : "adm-warn"}>
                    <td>{x.name}<small>{HARDWARE_CATEGORY[x.category] ?? x.category}</small></td>
                    <td><code>{x.code}</code></td>
                    <td>{formatNum(x.qty)}</td>
                    <td>{formatLei2(x.unitPrice)}</td>
                    <td>{formatLei2(x.total)}</td>
                  </tr>
                ))}
                {(b.hardwareExtra ?? []).map((x) => (
                  <tr key={x.name}><td colSpan={4}>{x.name}</td><td>{formatLei2(x.total)}</td></tr>
                ))}
                {(b.unresolvedHardware ?? []).map((x) => (
                  <tr key={x.slot + x.name} className="adm-bad">
                    <td>{x.name}<small>nerezolvată: nu e în preț</small></td><td>{HARDWARE_CATEGORY[x.category] ?? x.category}</td><td>{formatNum(x.qty)}</td><td>—</td><td>0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
          {(b.freeLines ?? []).length > 0 && (
            <Section title="Oglindă, sticlă, sisteme, servicii" total={sum(b.freeLines)}>
              <table className="adm-lines">
                <tbody>
                  {(b.freeLines ?? []).map((x, i) => (
                    <tr key={i}><td>{x.name}<small>{x.inCommission ? "cu manoperă" : "fără manoperă"}</small></td><td>{formatLei2(x.total)}</td></tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}
          <Section title="Debitare și altele" total={sum(b.cutting) + sum(b.other)}>
            <table className="adm-lines">
              <tbody>
                {[...(b.cutting ?? []), ...(b.other ?? [])].map((x, i) => (
                  <tr key={i}><td>{x.name}{x.detail && <small>{x.detail}</small>}</td><td>{formatLei2(x.total)}</td></tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}
      {t && !compact && (b.cabinets ?? []).length > 0 && <CabinetsView cabinets={b.cabinets!} reconciliation={b.reconciliation} />}
      {!compact && (b.warnings ?? []).length > 0 && (
        <Section title={`Avertismente motor (${b.warnings!.length})`}>
          <ul className="adm-list">{b.warnings!.map((w, i) => <li key={i}>{w.cabinet ? `${w.cabinet}: ` : ""}{w.message}</li>)}</ul>
        </Section>
      )}
      {!compact && (b.notes ?? []).length > 0 && (
        <Section title="Ce nu e în calcul">
          <ul className="adm-list">{b.notes!.map((n) => <li key={n}>{n}</li>)}</ul>
        </Section>
      )}
    </div>
  );
}
