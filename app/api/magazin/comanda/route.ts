import { NextResponse } from "next/server";
import { CrmRejectedError, CrmUnavailableError, crmFetch } from "@/lib/atelier/crm";
import { CONTACT_LIMITS } from "@/lib/atelier/lead-input";
import { resolvePalettes } from "@/lib/atelier/palettes";
import type { AtelierConfig, AtelierContact } from "@/lib/atelier/types";
import { isPostmarkConfigured, sendPostmarkEmail } from "@/lib/postmark";
import { MAX_LINES, MAX_QTY } from "@/lib/shop/cart-limits";
import { checkContact } from "@/lib/shop/contact-check";
import { productBySlug } from "@/lib/shop/products";
import { orderReference } from "@/lib/shop/reference";
import { getShopCatalog, priceShopLine } from "@/lib/shop/server";
import { splitSizeKey } from "@/lib/shop/sizes";

/**
 * „Trimite comanda" from the basket. Every line is rebuilt here from its product + colour (nothing
 * about the furniture is taken from the browser), priced again, and sent to the CRM as one Atelier
 * request (same client by phone, one project per line), with the shop details in the notes and as
 * structured `shop` data (quantity, the price shown, the offer).
 *
 * The browser sends the price it showed for each line. If today's price differs (an offer ended, the CRM
 * price moved), nothing is sent: 409 with the new prices, so the client sees them and confirms.
 */

type LeadResult = { clientId: string; projectId: string; quoteId: string; sellPrice: number | null; summary: string; crmUrl: string };

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ORDERS = 3;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  const limited = recent.length >= MAX_ORDERS;
  if (!limited) recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, t] of hits) if (t.every((x) => now - x >= WINDOW_MS)) hits.delete(k);
  return limited;
}

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const lei = (v: number) => `${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} lei`;
const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

interface Line {
  slug: string;
  paletteId: string;
  name: string;
  colour: string;
  qty: number;
  config: AtelierConfig;
  price: number | null;
  final: number | null;
  offerLabel: string | null;
  percent: number;
  /** what the basket showed; used when the CRM cannot price the line right now */
  shown: number | null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    lines?: unknown;
    contact?: Record<string, unknown>;
    website?: unknown;
  } | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Date invalide." }, { status: 400 });
  // honeypot
  if (typeof body.website === "string" && body.website.trim() !== "") return NextResponse.json({ ok: true });

  const c = body.contact ?? {};
  const contact: AtelierContact = { name: text(c.name), phone: text(c.phone), city: text(c.city) };
  const notes = text(c.notes).slice(0, 400);
  const problems = checkContact(contact);
  const firstProblem = Object.values(problems)[0];
  if (firstProblem) return NextResponse.json({ error: firstProblem, fields: problems }, { status: 400 });
  if (contact.name.length > CONTACT_LIMITS.name || contact.phone.length > CONTACT_LIMITS.phone || contact.city.length > CONTACT_LIMITS.city) {
    return NextResponse.json({ error: "Unul dintre câmpuri este prea lung." }, { status: 400 });
  }

  const raw = Array.isArray(body.lines) ? body.lines.slice(0, MAX_LINES) : [];
  if (raw.length === 0) return NextResponse.json({ error: "Coșul este gol." }, { status: 400 });

  const catalog = await getShopCatalog();
  if (!catalog) return NextResponse.json({ unavailable: true }, { status: 503 });
  const palettes = resolvePalettes(catalog);

  const lines: Line[] = [];
  const changed: { slug: string; paletteId: string; available: boolean; name: string; colour: string; price: number | null; finalPrice: number | null; offerPercent: number; offerLabel: string | null }[] = [];
  const gone: { slug: string; paletteId: string; name: string }[] = [];
  for (const item of raw as Record<string, unknown>[]) {
    const priced = await priceShopLine(text(item?.slug), text(item?.paletteId), catalog, palettes);
    if (!priced) {
      const product = productBySlug(text(item?.slug));
      const colour = palettes.find((p) => p.id === splitSizeKey(text(item?.paletteId)).paletteId)?.name;
      gone.push({ slug: text(item?.slug), paletteId: text(item?.paletteId), name: product ? `${product.preset.name}${colour ? ` (${colour})` : ""}` : "" });
      continue;
    }
    const qty = Math.min(MAX_QTY, Math.max(1, Math.round(Number(item.qty) || 1)));
    // `price` absent = an older basket page: no check (the lead still carries today's price)
    const hasShown = "price" in item;
    const shown = typeof item.price === "number" && Number.isFinite(item.price) ? Math.round(item.price) : null;
    const { config, price, finalPrice, offerPercent, offerLabel } = priced;
    if (hasShown && finalPrice != null && shown !== finalPrice) {
      // the slug the basket sent, so it can match the line (a renamed product keeps its old slug there)
      changed.push({ slug: text(item?.slug), paletteId: text(item?.paletteId), available: true, name: priced.name, colour: priced.colour, price, finalPrice, offerPercent, offerLabel });
    }
    lines.push({ slug: priced.slug, paletteId: priced.paletteId, name: priced.name, colour: priced.colour, qty, config, price, final: finalPrice, offerLabel, percent: offerPercent, shown });
  }
  if (gone.length > 0) {
    // the basket marks these lines (by slug + colour), so the client knows which one to take out
    const names = gone.map((g) => g.name).filter(Boolean);
    const error =
      names.length === 0
        ? `${gone.length === 1 ? "Un produs din coș nu mai este disponibil" : "Unele produse din coș nu mai sunt disponibile"}. Scoate-${gone.length === 1 ? "l" : "le"} și trimite din nou.`
        : `${names.join(", ")} ${gone.length === 1 ? "nu mai este disponibil" : "nu mai sunt disponibile"}. Scoate-${gone.length === 1 ? "l" : "le"} din coș și trimite din nou.`;
    return NextResponse.json({ error, gone: gone.map(({ slug, paletteId }) => ({ slug, paletteId })) }, { status: 409 });
  }
  if (changed.length > 0) {
    return NextResponse.json(
      { error: "Prețul unor produse s-a schimbat între timp. Verifică noul total și trimite din nou comanda.", priceChanged: true, lines: changed },
      { status: 409 },
    );
  }

  // only orders that are really sent count toward the anti-spam limit (a fixed mistake is not a new order)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Prea multe comenzi într-un timp scurt. Încearcă din nou puțin mai târziu." }, { status: 429 });

  /** the price of one piece as the client saw it: today's price, or (CRM down) what the basket showed */
  const unit = (l: Line) => l.final ?? l.shown;
  const total = lines.every((l) => unit(l) != null) ? lines.reduce((s, l) => s + (unit(l) as number) * l.qty, 0) : null;
  const lineText = (l: Line, i: number) =>
    [
      `Comandă din Magazin (${i + 1}/${lines.length}): ${l.name}, culoarea „${l.colour}", ${l.qty} buc.`,
      l.final != null ? `Preț afișat: ${lei(l.final)}/buc` : l.shown != null ? `Preț afișat în coș: ${lei(l.shown)}/buc (nu l-am putut recalcula acum)` : null,
      l.qty > 1 && unit(l) != null ? `Total linie: ${lei((unit(l) as number) * l.qty)}.` : null,
      l.percent > 0 && l.price != null ? `(${l.offerLabel} −${l.percent}%, preț obișnuit ${lei(l.price)})` : null,
      total != null && lines.length > 1 ? `Total coș: ${lei(total)}.` : null,
      notes ? `Observații: ${notes}` : null,
    ]
      .filter(Boolean)
      .join(" ")
      .slice(0, CONTACT_LIMITS.notes);

  const readableKey = (key: string) => {
    const k = splitSizeKey(key);
    return k.widthMm ? `${k.paletteId}, lățime ${Math.round(k.widthMm / 10)} cm` : k.paletteId;
  };
  /** structured shop data for the CRM (budget and draft quote = what the client was shown); none without a price */
  const shopData = (l: Line) => {
    const unitPrice = unit(l);
    if (unitPrice == null) return null;
    const onOffer = l.final != null && l.percent > 0 && l.price != null;
    return {
      slug: l.slug,
      // „alb-total@1800" → „alb-total, lățime 180 cm" (the CRM shows it as it is)
      paletteId: readableKey(l.paletteId),
      qty: l.qty,
      unitPrice,
      regularPrice: onOffer ? (l.price as number) : unitPrice,
      // the CRM accepts a percent only above 0: leave it out when there is no offer
      ...(onOffer ? { offerPercent: l.percent } : {}),
      ...(onOffer && l.offerLabel ? { offerLabel: l.offerLabel } : {}),
    };
  };

  const results: (LeadResult | null)[] = [];
  let crmDown = false;
  for (const [i, l] of lines.entries()) {
    if (crmDown) {
      results.push(null);
      continue;
    }
    try {
      results.push(
        await crmFetch<LeadResult>("/api/atelier/lead", {
          method: "POST",
          body: { config: l.config, contact: { ...contact, notes: lineText(l, i) }, ...(shopData(l) ? { shop: shopData(l) } : {}) },
          timeoutMs: 20_000,
        }),
      );
    } catch (error) {
      if (error instanceof CrmRejectedError) console.error("Shop order: CRM rejected a line", error.status, JSON.stringify(error.body));
      else if (error instanceof CrmUnavailableError) {
        console.error(`Shop order: CRM unavailable (${error.message})`);
        crmDown = true;
      } else console.error("Shop order failed", error);
      results.push(null);
    }
  }

  const rows = lines
    .map(
      (l, i) =>
        `<tr><td>${esc(l.name)}<br><small>${esc(l.colour)}</small></td><td>${l.qty}</td><td>${unit(l) != null ? esc(lei(unit(l) as number)) : "—"}${
          l.percent ? `<br><small>−${l.percent}% din ${esc(lei(l.price ?? 0))}</small>` : ""
        }</td><td>${results[i] ? `<a href="${esc(results[i]!.crmUrl)}">CRM</a>` : `<span style="color:#b42318">nu e în CRM</span>`}</td></tr>`,
    )
    .join("");
  const missing = lines.filter((_, i) => !results[i]);
  const reference = orderReference(results.map((r) => r?.quoteId));
  const html = `<div style="font-family:Arial,sans-serif;color:#2b1d14;max-width:680px">
<h2>Comandă nouă din Magazin · ${esc(reference)}</h2>
<p><strong>${esc(contact.name)}</strong> · ${esc(contact.phone)} · ${esc(contact.city)}</p>
${notes ? `<p>Observații: ${esc(notes)}</p>` : ""}
<table cellpadding="6" border="1" style="border-collapse:collapse">${rows}</table>
${total != null ? `<p><strong>Total afișat: ${esc(lei(total))}</strong></p>` : ""}
${missing.length ? `<pre style="background:#f5f5f5;padding:12px;white-space:pre-wrap">${esc(JSON.stringify(missing.map((l) => ({ name: l.name, colour: l.colour, config: l.config })), null, 2))}</pre>` : ""}
</div>`;

  let emailed = false;
  const to = process.env.ATELIER_LEAD_EMAIL;
  if (to && isPostmarkConfigured()) {
    try {
      await sendPostmarkEmail({ to, subject: `Comandă Magazin ${reference} — ${contact.name}`, html });
      emailed = true;
    } catch (error) {
      console.error("Shop order email failed", error);
    }
  }

  if (results.every((r) => !r) && !emailed) return NextResponse.json({ unavailable: true }, { status: 503 });
  // some lines did not reach the CRM and no email carries them: the client must tell us by phone
  const partial = emailed ? [] : missing.map((l) => `${l.name} (${l.colour}), ${l.qty} buc.`);
  if (partial.length) console.error("Shop order: lines not saved anywhere", JSON.stringify({ contact, partial }));
  return NextResponse.json({ ok: true, total, reference, ...(partial.length ? { partial } : {}) });
}
