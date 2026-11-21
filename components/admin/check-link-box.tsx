"use client";

import { useState } from "react";
import { shareCodeOf, type PriceBreakdown } from "@/lib/admin/breakdown";
import { BreakdownView } from "./breakdown-view";
import { postBreakdowns } from "./client";
import "./admin.css";

/** „Verifică un link": paste a /configurator?c=… link, see its breakdown. */
export function CheckLinkBox() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [b, setB] = useState<PriceBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = shareCodeOf(text);
    setB(null);
    if (!code) return setError("Nu găsesc codul configurației în link (partea cu ?c=).");
    setError(null);
    setBusy(true);
    try {
      setB((await postBreakdowns([{ key: "link", share: code }]))[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="adm-check">
      <h2>Verifică un link</h2>
      <form onSubmit={check}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="https://epicmob.ro/configurator?c=…" aria-label="Linkul configurației" />
        <button className="adm-btn" type="submit" disabled={busy}>{busy ? "Calculez…" : "Arată prețul"}</button>
      </form>
      {error && <p className="adm-bad">{error}</p>}
      {b && <BreakdownView b={b} />}
    </section>
  );
}
