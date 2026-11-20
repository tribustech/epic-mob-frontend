import { NextResponse } from "next/server";
import { CrmRejectedError, CrmUnavailableError, crmFetch } from "@/lib/atelier/crm";
import { CONTACT_LIMITS } from "@/lib/atelier/lead-input";
import { resolvePalettes } from "@/lib/atelier/palettes";
import type { AtelierConfig, AtelierContact } from "@/lib/atelier/types";
import { isPostmarkConfigured, sendPostmarkEmail } from "@/lib/postmark";
import { MAX_LINES, MAX_QTY } from "@/lib/shop/cart-limits";
import { offerFor, offerPrice } from "@/lib/shop/offers";
import { productBySlug } from "@/lib/shop/products";
import { getShopCatalog, priceOf, variantConfig } from "@/lib/shop/server";

/**
 * „Trimite comanda" from the basket. Every line is rebuilt here from its product + colour (nothing
 * about the furniture is taken from the browser), priced again, and sent to the CRM as one Atelier
 * request (same client by phone, one project per line), with the shop details in the notes.
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
  name: string;
  colour: string;
  qty: number;
  config: AtelierConfig;
  price: number | null;
  final: number | null;
  offerLabel: string | null;
  percent: number;
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

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Prea multe comenzi într-un timp scurt. Încearcă din nou puțin mai târziu." }, { status: 429 });

  const c = body.contact ?? {};
  const contact: AtelierContact = { name: text(c.name), phone: text(c.phone), city: text(c.city) };
  const notes = text(c.notes).slice(0, 400);
  if (!contact.name || !contact.city || contact.phone.replace(/\D/g, "").length < 6) {
    return NextResponse.json({ error: "Completează numele, telefonul și localitatea." }, { status: 400 });
  }
  if (contact.name.length > CONTACT_LIMITS.name || contact.phone.length > CONTACT_LIMITS.phone || contact.city.length > CONTACT_LIMITS.city) {
    return NextResponse.json({ error: "Unul dintre câmpuri este prea lung." }, { status: 400 });
  }

  const raw = Array.isArray(body.lines) ? body.lines.slice(0, MAX_LINES) : [];
  if (raw.length === 0) return NextResponse.json({ error: "Coșul este gol." }, { status: 400 });

  const catalog = await getShopCatalog();
  if (!catalog) return NextResponse.json({ unavailable: true }, { status: 503 });
  const palettes = resolvePalettes(catalog);

  const lines: Line[] = [];
  for (const item of raw as Record<string, unknown>[]) {
    const product = productBySlug(text(item?.slug));
    const paletteId = text(item?.paletteId);
    const palette = palettes.find((p) => p.id === paletteId);
    if (!product || !palette || !product.paletteIds.includes(paletteId)) {
      return NextResponse.json({ error: "Un produs din coș nu mai este disponibil. Scoate-l și încearcă din nou." }, { status: 400 });
    }
    const qty = Math.min(MAX_QTY, Math.max(1, Math.round(Number(item.qty) || 1)));
    const config = variantConfig(product, palette, catalog);
    const { price } = await priceOf(config);
    const offer = offerFor(product.slug, product.category);
    lines.push({
      name: product.preset.name,
      colour: palette.name,
      qty,
      config,
      price,
      final: price == null ? null : offerPrice(price, offer),
      offerLabel: offer?.label ?? null,
      percent: offer?.percent ?? 0,
    });
  }

  const total = lines.every((l) => l.final != null) ? lines.reduce((s, l) => s + (l.final as number) * l.qty, 0) : null;
  const lineText = (l: Line, i: number) =>
    [
      `Comandă din Magazin (${i + 1}/${lines.length}): ${l.name}, culoarea „${l.colour}", ${l.qty} buc.`,
      l.final != null ? `Preț afișat: ${lei(l.final)}/buc` : null,
      l.percent > 0 && l.price != null ? `(${l.offerLabel} −${l.percent}%, preț obișnuit ${lei(l.price)})` : null,
      total != null && lines.length > 1 ? `Total coș: ${lei(total)}.` : null,
      notes ? `Observații: ${notes}` : null,
    ]
      .filter(Boolean)
      .join(" ")
      .slice(0, CONTACT_LIMITS.notes);

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
          body: { config: l.config, contact: { ...contact, notes: lineText(l, i) } },
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
        `<tr><td>${esc(l.name)}<br><small>${esc(l.colour)}</small></td><td>${l.qty}</td><td>${l.final != null ? esc(lei(l.final)) : "—"}${
          l.percent ? `<br><small>−${l.percent}% din ${esc(lei(l.price ?? 0))}</small>` : ""
        }</td><td>${results[i] ? `<a href="${esc(results[i]!.crmUrl)}">CRM</a>` : `<span style="color:#b42318">nu e în CRM</span>`}</td></tr>`,
    )
    .join("");
  const missing = lines.filter((_, i) => !results[i]);
  const html = `<div style="font-family:Arial,sans-serif;color:#2b1d14;max-width:680px">
<h2>Comandă nouă din Magazin</h2>
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
      await sendPostmarkEmail({ to, subject: `Comandă Magazin — ${contact.name}`, html });
      emailed = true;
    } catch (error) {
      console.error("Shop order email failed", error);
    }
  }

  if (results.every((r) => !r) && !emailed) return NextResponse.json({ unavailable: true }, { status: 503 });
  return NextResponse.json({ ok: true, total });
}
