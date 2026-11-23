"use client";

import { useEffect, useState } from "react";
import type { PriceBreakdown } from "@/lib/admin/breakdown";
import { encodeShare } from "@/lib/atelier/share";
import type { AtelierConfig } from "@/lib/atelier/types";
import { BreakdownView } from "./breakdown-view";
import { queueBreakdown, useIsAdmin } from "./client";
import "./admin.css";

/**
 * Admin only: a floating „Admin" button that opens a drawer with the price breakdown of exactly the
 * configuration on screen (colour, handle, doors, sizes…). It follows the selection as it changes.
 * Renders nothing for normal visitors.
 */
export function AdminPricePanel({ config, offerPercent = null }: { config: AtelierConfig | null | undefined; offerPercent?: number | null }) {
  const admin = useIsAdmin();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<{ key: string; b: PriceBreakdown | null; error: string | null }>({ key: "", b: null, error: null });
  const key = config ? JSON.stringify([config, offerPercent]) : "";

  useEffect(() => {
    if (!admin || !config || !key) return;
    let live = true;
    const t = setTimeout(() => {
      queueBreakdown({ key: "panel", config, offerPercent }).then(
        (b) => live && setState({ key, b, error: null }),
        (e: unknown) => live && setState({ key, b: null, error: e instanceof Error ? e.message : "Eroare" }),
      );
    }, 400);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // `key` covers config and offer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, key]);

  if (!admin || !config) return null;
  const loading = state.key !== key;
  const t = state.b?.totals;
  return (
    <>
      <button type="button" className={`adm-fab ${state.b?.problems.length ? "adm-fab--bad" : ""}`} onClick={() => setOpen(true)} aria-expanded={open}>
        Admin · defalcare preț{t ? ` · ${Math.round(t.finalPrice).toLocaleString("ro-RO")} lei` : ""}
      </button>
      {open && (
        <div className="adm-drawer" role="dialog" aria-label="Defalcarea prețului">
          <div className="adm-drawer__head">
            <strong>Din ce se face prețul</strong>
            {loading && <span className="adm-muted">se calculează…</span>}
            <a className="adm-btn adm-btn--ghost adm-drawer__crm" href={`/admin/crm?c=${encodeShare(config)}`} target="_blank" rel="noreferrer">
              Deschide în CRM
            </a>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setOpen(false)}>Închide</button>
          </div>
          {state.error && <p className="adm-bad">{state.error}</p>}
          {state.b ? <BreakdownView b={state.b} /> : !state.error && <p className="adm-muted">Se încarcă…</p>}
          <p className="adm-muted adm-drawer__foot">Cifrele vin din CRM (catalogul și motorul de ofertă), pentru exact ce e pe ecran.</p>
        </div>
      )}
    </>
  );
}
