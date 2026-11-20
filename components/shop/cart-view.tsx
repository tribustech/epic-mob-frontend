"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Minus, PhoneCall, Plus, Ruler, Trash2 } from "lucide-react";
import { trackPixel } from "@/lib/meta-pixel";
import { MAX_QTY, cartCount, clearCart, setQty, useCart } from "@/lib/shop/cart";
import { DELIVERY_TEXT } from "@/lib/shop/products";
import { formatPrice } from "./price";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; total: number | null } | { kind: "error"; message: string };

export function CartView() {
  const lines = useCart();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [form, setForm] = useState({ name: "", phone: "", city: "", notes: "", website: "" });

  const total = lines.every((l) => l.price != null) ? lines.reduce((s, l) => s + (l.price as number) * l.qty, 0) : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/magazin/comanda", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({ slug: l.slug, paletteId: l.paletteId, qty: l.qty })),
          contact: { name: form.name, phone: form.phone, city: form.city, notes: form.notes },
          website: form.website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; total?: number | null; error?: string; unavailable?: boolean };
      if (!res.ok || !data.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? "Momentan nu putem primi comanda online. Sună-ne la +40 750 402 027 sau scrie-ne pe WhatsApp.",
        });
        return;
      }
      trackPixel("Purchase", { value: data.total ?? total ?? 0, currency: "RON", num_items: cartCount(lines) });
      clearCart();
      setStatus({ kind: "sent", total: data.total ?? total });
    } catch {
      setStatus({ kind: "error", message: "Nu am putut trimite comanda. Verifică conexiunea și încearcă din nou." });
    }
  };

  if (status.kind === "sent") {
    return (
      <div className="shop-sent">
        <CheckCircle2 size={44} aria-hidden="true" />
        <h1 className="display-font shop-product__title">Mulțumim, am primit comanda!</h1>
        <p>Te sunăm în curând ca să stabilim ziua în care venim la măsurători. Prețul îl confirmăm atunci, pe loc.</p>
        <Link href="/magazin" className="btn-warm btn-warm--primary mt-6">
          Înapoi în magazin <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="shop-sent">
        <h1 className="display-font shop-product__title">Coșul tău e gol</h1>
        <p>Alege un dulap, o comodă sau o bibliotecă din magazin.</p>
        <Link href="/magazin" className="btn-warm btn-warm--primary mt-6">
          Mergi în magazin <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="shop-cart">
      <section>
        <h1 className="display-font shop-product__title">Coșul tău</h1>
        <ul className="shop-cart__lines">
          {lines.map((l) => (
            <li key={`${l.slug}-${l.paletteId}`} className="shop-cart__line">
              <div className="shop-cart__what">
                <Link href={`/magazin/${l.slug}?culoare=${l.paletteId}`} className="shop-cart__name">
                  {l.name}
                </Link>
                <span className="shop-cart__colour">{l.colour}</span>
              </div>
              <div className="shop-qty" role="group" aria-label={`Bucăți ${l.name}`}>
                <button type="button" onClick={() => setQty(l.slug, l.paletteId, l.qty - 1)} aria-label="Mai puțin">
                  {l.qty === 1 ? <Trash2 size={15} aria-hidden="true" /> : <Minus size={15} aria-hidden="true" />}
                </button>
                <span>{l.qty}</span>
                <button type="button" onClick={() => setQty(l.slug, l.paletteId, l.qty + 1)} disabled={l.qty >= MAX_QTY} aria-label="Mai mult">
                  <Plus size={15} aria-hidden="true" />
                </button>
              </div>
              <span className="shop-cart__price">{l.price != null ? formatPrice(l.price * l.qty) : "—"}</span>
            </li>
          ))}
        </ul>
        {total != null && (
          <p className="shop-cart__total">
            Total <strong>{formatPrice(total)}</strong>
          </p>
        )}
        <p className="shop-cart__note">{DELIVERY_TEXT}. Montajul și garanția de 5 ani sunt incluse.</p>
      </section>

      <section className="shop-checkout">
        <h2 className="shop-details__title">Trimite comanda</h2>
        <p className="shop-checkout__lede">Nu plătești nimic acum. Te sunăm, venim la măsurători și îți confirmăm prețul.</p>
        <form onSubmit={submit} className="shop-form">
          <label>
            <span>Nume</span>
            <input required autoComplete="name" maxLength={100} value={form.name} onChange={set("name")} />
          </label>
          <label>
            <span>Telefon</span>
            <input required type="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={set("phone")} />
          </label>
          <label>
            <span>Localitate</span>
            <input required autoComplete="address-level2" maxLength={80} value={form.city} onChange={set("city")} />
          </label>
          <label>
            <span>Observații (opțional)</span>
            <textarea rows={3} maxLength={400} value={form.notes} onChange={set("notes")} placeholder="De ex. etajul, când ești acasă, ce ai vrea să schimbăm" />
          </label>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="shop-hp" value={form.website} onChange={set("website")} aria-hidden="true" />
          {status.kind === "error" && <p className="shop-buy__error" role="alert">{status.message}</p>}
          <button type="submit" className="btn-warm btn-warm--primary shop-buy__main" disabled={status.kind === "sending"}>
            {status.kind === "sending" ? "Se trimite…" : "Trimite comanda"}
          </button>
        </form>
        <ul className="shop-trust">
          <li>
            <PhoneCall size={16} aria-hidden="true" /> Te sunăm ca să stabilim detaliile.
          </li>
          <li>
            <Ruler size={16} aria-hidden="true" /> Măsurăm la tine acasă înainte de orice.
          </li>
        </ul>
      </section>
    </div>
  );
}
