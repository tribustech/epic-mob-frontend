"use client";

import { useEffect, useState } from "react";
import { formatLei, headline, type PriceBreakdown } from "@/lib/admin/breakdown";
import { queueBreakdown, useIsAdmin } from "./client";
import "./admin.css";

/** Admin only: materials / labour / final on a product card (one batched call for the whole grid). */
export function AdminCardBadge({ share, offerPercent = null }: { share: string; offerPercent?: number | null }) {
  const admin = useIsAdmin();
  const [b, setB] = useState<PriceBreakdown | null | "err">(null);
  useEffect(() => {
    if (!admin) return;
    let live = true;
    queueBreakdown({ key: share, share, offerPercent }).then((x) => live && setB(x), () => live && setB("err"));
    return () => {
      live = false;
    };
  }, [admin, share, offerPercent]);
  if (!admin) return null;
  if (b === null) return <div className="adm-badge adm-muted">admin: se calculează…</div>;
  if (b === "err") return <div className="adm-badge adm-bad">admin: CRM indisponibil</div>;
  const t = b.totals;
  if (!t) return <div className="adm-badge adm-bad" title={b.problems.join("\n")}>admin: nu se poate cota</div>;
  const h = headline(t);
  return (
    <div className={`adm-badge ${b.problems.length ? "adm-badge--bad" : ""}`} title={b.problems.join("\n") || undefined}>
      <span>Mat. {formatLei(h.materials)}</span>
      <span>Fer. {formatLei(h.hardware)}</span>
      <span>Man. {Math.round(t.laborPct)}% {formatLei(t.labor)}</span>
      <b>{formatLei(t.finalPrice)}</b>
      {b.problems.length > 0 && <span className="adm-bad">{b.problems.length} probleme</span>}
    </div>
  );
}
