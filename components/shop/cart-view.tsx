"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { splitSizeKey } from "@/lib/shop/sizes";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Minus, PhoneCall, Plus, Ruler, ShoppingBag, Trash2, Truck } from "lucide-react";
import { trackPixel } from "@/lib/meta-pixel";
import { ConsentNote } from "@/components/legal/consent-note";
import { MAX_QTY, applyFreshPrices, cartCount, cartSizeText, clearCart, setQty, useCart, type CartLine, type FreshPrice, type PriceChange } from "@/lib/shop/cart";
import { checkContact as check, type ContactField as Field } from "@/lib/shop/contact-check";
import { DELIVERY_TEXT, pictureOf, productBySlug } from "@/lib/shop/products";
import { formatPrice } from "./price";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; total: number | null; partial: string[]; reference: string | null; lines: CartLine[] }
  | { kind: "error"; message: string };

const lineKey = (l: { slug: string; paletteId: string }) => `${l.slug}|${l.paletteId}`;

function lineImage(l: CartLine): string | null {
  const product = productBySlug(l.slug);
  return product ? pictureOf(l.slug, splitSizeKey(l.paletteId).paletteId) : null;
}

export function CartView() {
  const lines = useCart();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [form, setForm] = useState({ name: "", phone: "", city: "", notes: "", website: "" });
  // the visit is optional: the pieces are sold at the sizes shown
  const [measure, setMeasure] = useState(false);
  const [tried, setTried] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  /** after „Scoate": the line whose name gets the focus next (null = the heading), so keyboard users keep their place */
  const focusAfterRemove = useRef<string | null | undefined>(undefined);

  // prices as of today: the basket keeps what the client saw when adding, so check it once it opens
  const [checking, setChecking] = useState(true);
  const [changes, setChanges] = useState<PriceChange[]>([]);
  const [gone, setGone] = useState<string[]>([]);
  const keys = lines.map(lineKey).join(",");
  useEffect(() => {
    if (!keys) return;
    let live = true;
    fetch("/api/magazin/preturi", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lines: keys.split(",").map((k) => ({ slug: k.split("|")[0], paletteId: k.split("|")[1] })) }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { lines?: FreshPrice[] } | null) => {
        if (!live || !Array.isArray(data?.lines)) return;
        const moved = applyFreshPrices(data.lines);
        if (moved.length) setChanges((old) => [...old.filter((c) => !moved.some((m) => lineKey(m) === lineKey(c))), ...moved]);
        setGone(data.lines.filter((l) => !l.available).map(lineKey));
      })
      .catch(() => {})
      .finally(() => live && setChecking(false));
    return () => {
      live = false;
    };
  }, [keys]);

  useEffect(() => {
    const target = focusAfterRemove.current;
    if (target === undefined) return;
    focusAfterRemove.current = undefined;
    const link = target ? listRef.current?.querySelector<HTMLElement>(`[data-line="${CSS.escape(target)}"] .shop-cart__name`) : null;
    (link ?? headingRef.current)?.focus();
  }, [lines]);

  // the tab says what happened, also when the client comes back to it later
  useEffect(() => {
    if (status.kind !== "sent") return;
    const before = document.title;
    document.title = `Comanda a fost trimisă${status.reference ? ` (${status.reference})` : ""} | EpicMob`;
    return () => {
      document.title = before;
    };
  }, [status]);

  const remove = (l: CartLine) => {
    const i = lines.findIndex((x) => lineKey(x) === lineKey(l));
    const next = lines[i + 1] ?? lines[i - 1];
    focusAfterRemove.current = next ? lineKey(next) : null;
    setQty(l.slug, l.paletteId, 0);
  };

  const total = lines.every((l) => l.price != null) ? lines.reduce((s, l) => s + (l.price as number) * l.qty, 0) : null;
  const regularTotal = lines.reduce((s, l) => s + (l.regularPrice ?? l.price ?? 0) * l.qty, 0);
  const saved = total != null && regularTotal > total ? regularTotal - total : 0;
  const errors = tried ? check(form) : {};
  const pieces = cartCount(lines);
  const shownChanges = changes.filter((c) => lines.some((l) => lineKey(l) === lineKey(c)));

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
          lines: lines.map((l) => ({ slug: l.slug, paletteId: l.paletteId, qty: l.qty, price: l.price })),
          contact: { name: form.name, phone: form.phone, city: form.city, notes: [measure ? "Vrea să venim să măsurăm înainte." : "", form.notes].filter(Boolean).join(" ") },
          website: form.website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        total?: number | null;
        error?: string;
        unavailable?: boolean;
        priceChanged?: boolean;
        partial?: string[];
        lines?: FreshPrice[];
        gone?: { slug: string; paletteId: string }[];
        reference?: string;
      };
      if (res.status === 409 && Array.isArray(data.gone) && data.gone.length > 0) {
        const goneKeys = data.gone.map(lineKey);
        setGone((old) => [...new Set([...old, ...goneKeys])]);
        const names = lines.filter((l) => goneKeys.includes(lineKey(l))).map((l) => `${l.name} (${l.colour})`);
        setStatus({
          kind: "error",
          message: names.length
            ? `${names.join(", ")} ${names.length === 1 ? "nu mai este disponibil" : "nu mai sunt disponibile"}. ${names.length === 1 ? "L-am marcat" : "Le-am marcat"} în coș: scoate-${names.length === 1 ? "l" : "le"} și trimite din nou.`
            : (data.error ?? "Un produs din coș nu mai este disponibil. Scoate-l și trimite din nou."),
        });
        return;
      }
      if (res.status === 409 && data.priceChanged && Array.isArray(data.lines)) {
        const moved = applyFreshPrices(data.lines);
        setChanges((old) => [...old.filter((c) => !moved.some((m) => lineKey(m) === lineKey(c))), ...moved]);
        setStatus({ kind: "error", message: data.error ?? "Prețul unor produse s-a schimbat. Verifică totalul și trimite din nou." });
        return;
      }
      if (!res.ok || !data.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? "Momentan nu putem primi comanda online. Sună-ne la +40 750 402 027 sau scrie-ne pe WhatsApp.",
        });
        return;
      }
      trackPixel("Purchase", { value: data.total ?? total ?? 0, currency: "RON", num_items: cartCount(lines) });
      const ordered = lines;
      clearCart();
      setStatus({
        kind: "sent",
        total: data.total ?? total,
        partial: Array.isArray(data.partial) ? data.partial : [],
        reference: typeof data.reference === "string" && data.reference ? data.reference : null,
        lines: ordered,
      });
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
        {status.reference && (
          <p>
            Numărul comenzii: <strong className="shop-sent__ref">{status.reference}</strong>. Păstrează-l dacă ne suni.
          </p>
        )}
        <div className="shop-sent__recap">
          <h2 className="shop-details__title">Ce ai comandat</h2>
          <ul>
            {status.lines.map((l) => (
              <li key={lineKey(l)}>
                <span>
                  {l.name}
                  <small>
                    {l.colour} · {l.qty === 1 ? "1 bucată" : `${l.qty} bucăți`}
                  </small>
                </span>
                <strong>{l.price != null ? formatPrice(l.price * l.qty) : "Preț la măsurători"}</strong>
              </li>
            ))}
          </ul>
          {status.total != null && (
            <p className="shop-cart__total">
              <span>Total</span>
              <strong>{formatPrice(status.total)}</strong>
            </p>
          )}
        </div>
        {status.partial.length > 0 && (
          <p className="shop-form__alert" role="alert">
            <CircleAlert size={18} aria-hidden="true" />
            <span>
              Nu am putut salva aceste produse: {status.partial.join("; ")}. Sună-ne la +40 750 402 027 sau scrie-ne pe WhatsApp ca să le
              adăugăm în comanda ta.
            </span>
          </p>
        )}
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
          <h1 id="cos-titlu" className="display-font shop-product__title" ref={headingRef} tabIndex={-1}>
            Coșul tău <span className="shop-cart__pieces">{cartSizeText(lines.length, pieces)}</span>
          </h1>
          {shownChanges.length > 0 && (
            <div className="shop-form__alert" role="status">
              <CircleAlert size={18} aria-hidden="true" />
              <span>
                Prețul s-a schimbat de când ai adăugat {shownChanges.length === 1 ? "produsul" : "produsele"} în coș:{" "}
                {shownChanges.map((c) => `${c.name} (${c.colour}): ${formatPrice(c.before)} → ${formatPrice(c.after)} / bucată`).join("; ")}. Totalul de mai jos
                este cel de azi.
              </span>
            </div>
          )}
          <ul className="shop-cart__lines" ref={listRef}>
            {lines.map((l) => {
              const img = lineImage(l);
              const sk = splitSizeKey(l.paletteId);
              const href = `/magazin/${l.slug}?culoare=${sk.paletteId}${sk.widthMm ? `&latime=${sk.widthMm}` : ""}`;
              const onOffer = l.regularPrice != null && l.price != null && l.regularPrice > l.price && l.offerPercent > 0;
              const unavailable = gone.includes(lineKey(l));
              return (
                <li key={`${l.slug}-${l.paletteId}`} className="shop-cart__line" data-line={lineKey(l)}>
                  <Link href={href} className="shop-cart__thumb" tabIndex={-1} aria-hidden="true">
                    {img && <Image src={img} alt="" width={160} height={160} sizes="112px" />}
                  </Link>
                  <div className="shop-cart__what">
                    <Link href={href} className="shop-cart__name">
                      {l.name}
                    </Link>
                    <span className="shop-cart__colour">{l.colour}</span>
                    {l.price != null && l.qty > 1 && <span className="shop-cart__unit">{formatPrice(l.price)} / bucată</span>}
                    {onOffer && (
                      <span className="shop-cart__unit">
                        {l.offerLabel ?? "Ofertă"} <span className="shop-price__pct">−{l.offerPercent}%</span>
                      </span>
                    )}
                    {unavailable && (
                      <span className="shop-form__error">
                        <CircleAlert size={15} aria-hidden="true" /> Produsul nu mai este disponibil în această culoare. Scoate-l din coș.
                      </span>
                    )}
                  </div>
                  <span className="shop-cart__price">
                    {l.price != null ? (
                      <>
                        <span className={onOffer ? "shop-price__now--offer" : undefined}>{formatPrice(l.price * l.qty)}</span>
                        {onOffer && (
                          <>
                            <br />
                            <s className="shop-price__was">{formatPrice((l.regularPrice as number) * l.qty)}</s>
                          </>
                        )}
                      </>
                    ) : (
                      "Preț la măsurători"
                    )}
                  </span>
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
                    <button type="button" className="shop-cart__remove" onClick={() => remove(l)} aria-label={`Scoate din coș: ${l.name}, ${l.colour}`}>
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
            {saved > 0 && (
              <p className="shop-cart__unit">
                Economisești {formatPrice(saved)} față de prețul obișnuit.
              </p>
            )}
            {checking && <p className="shop-cart__unit">Verificăm prețurile de azi…</p>}
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
          <p className="shop-checkout__lede">Comanzi exact produsele din coș, la mărimile afișate. Nu plătești nimic online: te sunăm să confirmăm comanda și data montajului.</p>
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
            <label className="shop-form__check">
              <input type="checkbox" checked={measure} onChange={(e) => setMeasure(e.target.checked)} />
              <span>
                Vreau să veniți să măsurați înainte <span>(gratuit; recomandat dacă mobila intră între pereți sau sub tavan)</span>
              </span>
            </label>
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
            <ConsentNote subject="comanda ta" withTerms />
          </form>
          <ul className="shop-trust">
            <li>
              <PhoneCall size={16} aria-hidden="true" /> Te sunăm ca să stabilim detaliile.
            </li>
            <li>
              <Ruler size={16} aria-hidden="true" /> Dacă vrei, venim gratuit să verificăm măsurile.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
