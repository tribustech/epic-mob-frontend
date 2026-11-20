"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Minus, PhoneCall, Plus, Ruler, ShoppingBag, Trash2, Truck } from "lucide-react";
import { trackPixel } from "@/lib/meta-pixel";
import { MAX_QTY, cartCount, clearCart, setQty, useCart, type CartLine } from "@/lib/shop/cart";
import { DELIVERY_TEXT, productBySlug, renderOf } from "@/lib/shop/products";
import { formatPrice } from "./price";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; total: number | null } | { kind: "error"; message: string };
type Field = "name" | "phone" | "city";

/** Plain-word checks, shown under each field (the browser's own bubbles are in the phone's language, not ours). */
function check(form: { name: string; phone: string; city: string }): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (form.name.trim().length < 2) errors.name = "Scrie numele tău, ca să știm cum să ți ne adresăm.";
  const digits = form.phone.replace(/\D/g, "");
  if (digits.length === 0) errors.phone = "Scrie numărul de telefon pe care te putem suna.";
  else if (digits.length < 9) errors.phone = "Numărul pare prea scurt. Verifică-l, te rugăm.";
  if (form.city.trim().length < 2) errors.city = "Scrie localitatea în care livrăm.";
  return errors;
}

function lineImage(l: CartLine): string | null {
  const product = productBySlug(l.slug);
  if (product?.photo && product.paletteIds[0] === l.paletteId) return product.photo;
  return renderOf(l.slug, l.paletteId) ?? product?.photo ?? null;
}

export function CartView() {
  const lines = useCart();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [form, setForm] = useState({ name: "", phone: "", city: "", notes: "", website: "" });
  const [tried, setTried] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const total = lines.every((l) => l.price != null) ? lines.reduce((s, l) => s + (l.price as number) * l.qty, 0) : null;
  const errors = tried ? check(form) : {};
  const pieces = cartCount(lines);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    const problems = check(form);
    const firstBad = (Object.keys(problems) as Field[])[0];
    if (firstBad) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${firstBad}"]`)?.focus();
      return;
    }
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
      window.scrollTo({ top: 0 });
    } catch {
      setStatus({ kind: "error", message: "Nu am putut trimite comanda. Verifică internetul și încearcă din nou." });
    }
  };

  if (status.kind === "sent") {
    return (
      <div className="shop-sent" role="status">
        <span className="shop-sent__icon shop-sent__icon--ok">
          <CheckCircle2 size={34} aria-hidden="true" />
        </span>
        <h1 className="display-font shop-product__title">Mulțumim, am primit comanda!</h1>
        <p>Nu ai plătit nimic. Iată ce urmează:</p>
        <ol className="shop-sent__steps">
          <li>
            <PhoneCall size={18} aria-hidden="true" />
            <span>Te sunăm în curând ca să stabilim ziua în care venim la măsurători.</span>
          </li>
          <li>
            <Ruler size={18} aria-hidden="true" />
            <span>Măsurăm la tine acasă și îți confirmăm prețul pe loc.</span>
          </li>
          <li>
            <Truck size={18} aria-hidden="true" />
            <span>{DELIVERY_TEXT}.</span>
          </li>
        </ol>
        <Link href="/magazin" className="btn-warm btn-warm--primary">
          Înapoi în magazin <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="shop-sent">
        <span className="shop-sent__icon">
          <ShoppingBag size={30} aria-hidden="true" />
        </span>
        <h1 className="display-font shop-product__title">Coșul tău e gol</h1>
        <p>Alege un dulap, o comodă sau o bibliotecă din magazin și o găsești aici.</p>
        <Link href="/magazin" className="btn-warm btn-warm--primary">
          Mergi în magazin <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const fieldProps = (key: Field) => ({
    id: `cos-${key}`,
    name: key,
    value: form[key],
    onChange: set(key),
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `cos-${key}-err` : undefined,
  });
  const fieldError = (key: Field) =>
    errors[key] ? (
      <p className="shop-form__error" id={`cos-${key}-err`}>
        <CircleAlert size={15} aria-hidden="true" /> {errors[key]}
      </p>
    ) : null;

  return (
    <>
      <Link href="/magazin" className="shop-back">
        <ArrowLeft size={16} aria-hidden="true" /> Continuă cumpărăturile
      </Link>
      <div className="shop-cart">
        <section aria-labelledby="cos-titlu">
          <h1 id="cos-titlu" className="display-font shop-product__title">
            Coșul tău <span className="shop-cart__pieces">{pieces === 1 ? "1 produs" : `${pieces} produse`}</span>
          </h1>
          <ul className="shop-cart__lines">
            {lines.map((l) => {
              const img = lineImage(l);
              const href = `/magazin/${l.slug}?culoare=${l.paletteId}`;
              return (
                <li key={`${l.slug}-${l.paletteId}`} className="shop-cart__line">
                  <Link href={href} className="shop-cart__thumb" tabIndex={-1} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {img && <img src={img} alt="" loading="lazy" />}
                  </Link>
                  <div className="shop-cart__what">
                    <Link href={href} className="shop-cart__name">
                      {l.name}
                    </Link>
                    <span className="shop-cart__colour">{l.colour}</span>
                    {l.price != null && l.qty > 1 && <span className="shop-cart__unit">{formatPrice(l.price)} bucata</span>}
                  </div>
                  <span className="shop-cart__price">{l.price != null ? formatPrice(l.price * l.qty) : "Preț la măsurători"}</span>
                  <div className="shop-cart__controls">
                    <div className="shop-qty" role="group" aria-label={`Câte bucăți: ${l.name}`}>
                      <button type="button" onClick={() => setQty(l.slug, l.paletteId, l.qty - 1)} disabled={l.qty <= 1} aria-label="O bucată mai puțin">
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <span aria-live="polite">
                        {l.qty}
                        <span className="shop-sr"> {l.qty === 1 ? "bucată" : "bucăți"}</span>
                      </span>
                      <button type="button" onClick={() => setQty(l.slug, l.paletteId, l.qty + 1)} disabled={l.qty >= MAX_QTY} aria-label="O bucată în plus">
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </div>
                    <button type="button" className="shop-cart__remove" onClick={() => setQty(l.slug, l.paletteId, 0)} aria-label={`Scoate din coș: ${l.name}, ${l.colour}`}>
                      <Trash2 size={16} aria-hidden="true" /> Scoate
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="shop-cart__sum">
            {total != null && (
              <p className="shop-cart__total">
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </p>
            )}
            <p className="shop-cart__note">
              <Truck size={17} aria-hidden="true" />
              <span>{DELIVERY_TEXT}. Montajul și garanția de 5 ani sunt incluse în preț.</span>
            </p>
          </div>
        </section>

        <section className="shop-checkout" aria-labelledby="cos-trimite">
          <h2 id="cos-trimite" className="shop-details__title">
            Trimite comanda
          </h2>
          <p className="shop-checkout__lede">Nu plătești nimic acum. Te sunăm, venim la măsurători și îți confirmăm prețul.</p>
          <form onSubmit={submit} className="shop-form" noValidate ref={formRef}>
            <div className="shop-form__field">
              <label htmlFor="cos-name">Numele tău</label>
              <input {...fieldProps("name")} required autoComplete="name" maxLength={100} />
              {fieldError("name")}
            </div>
            <div className="shop-form__field">
              <label htmlFor="cos-phone">Telefon</label>
              <input {...fieldProps("phone")} required type="tel" inputMode="tel" autoComplete="tel" maxLength={30} placeholder="07xx xxx xxx" />
              {fieldError("phone") ?? <p className="shop-form__hint">Te sunăm noi, de obicei în aceeași zi.</p>}
            </div>
            <div className="shop-form__field">
              <label htmlFor="cos-city">Localitate</label>
              <input {...fieldProps("city")} required autoComplete="address-level2" maxLength={80} placeholder="De ex. București, sector 3" />
              {fieldError("city")}
            </div>
            <div className="shop-form__field">
              <label htmlFor="cos-notes">
                Vrei să ne spui ceva? <span>(nu e obligatoriu)</span>
              </label>
              <textarea id="cos-notes" rows={3} maxLength={400} value={form.notes} onChange={set("notes")} placeholder="De ex. etajul, când ești acasă, ce ai vrea să schimbăm" />
            </div>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="shop-hp" value={form.website} onChange={set("website")} aria-hidden="true" />
            {status.kind === "error" && (
              <p className="shop-form__alert" role="alert">
                <CircleAlert size={18} aria-hidden="true" /> <span>{status.message}</span>
              </p>
            )}
            <button type="submit" className="btn-warm btn-warm--primary shop-form__submit" disabled={status.kind === "sending"}>
              {status.kind === "sending" ? "Se trimite…" : "Trimite comanda"}
              {status.kind !== "sending" && <ArrowRight size={17} aria-hidden="true" />}
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
    </>
  );
}
