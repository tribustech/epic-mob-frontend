import { NextResponse } from "next/server";
import { CrmRejectedError, CrmUnavailableError, crmFetch } from "@/lib/atelier/crm";
import { leadEmailHtml } from "@/lib/atelier/lead-email";
import { isPostmarkConfigured, sendPostmarkEmail } from "@/lib/postmark";
import type { AtelierConfig, AtelierContact } from "@/lib/atelier/types";

type LeadResult = {
  clientId: string;
  projectId: string;
  quoteId: string;
  sellPrice: number | null;
  summary: string;
  crmUrl: string;
};

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function notifyOwner(subject: string, html: string): Promise<boolean> {
  const to = process.env.ATELIER_LEAD_EMAIL;
  if (!to || !isPostmarkConfigured()) {
    console.info("Atelier lead email skipped (ATELIER_LEAD_EMAIL / Postmark not configured)", subject);
    return false;
  }
  try {
    await sendPostmarkEmail({ to, subject, html });
    return true;
  } catch (error) {
    console.error("Atelier lead email failed", error);
    return false;
  }
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    config?: AtelierConfig;
    contact?: Partial<AtelierContact>;
    website?: string;
  } | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Date invalide." }, { status: 400 });
  }

  // Honeypot: bots fill the hidden field. Pretend success, do nothing.
  if (typeof payload.website === "string" && payload.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ error: "Prea multe cereri. Încearcă din nou mai târziu." }, { status: 429 });
  }

  const notes = str(payload.contact?.notes, 2000);
  const contact: AtelierContact = {
    name: str(payload.contact?.name, 120),
    phone: str(payload.contact?.phone, 40),
    city: str(payload.contact?.city, 80),
    ...(notes ? { notes } : {}),
  };
  if (!contact.name || !contact.phone || !payload.config || typeof payload.config !== "object") {
    return NextResponse.json({ error: "Datele de contact sunt incomplete." }, { status: 400 });
  }
  const config = payload.config;
  const subject = `Lead nou Atelier — ${contact.name}`;

  try {
    const lead = await crmFetch<LeadResult>("/api/atelier/lead", {
      method: "POST",
      body: { config, contact },
    });
    await notifyOwner(
      subject,
      leadEmailHtml({ contact, summary: lead.summary, sellPrice: lead.sellPrice, crmUrl: lead.crmUrl, config }),
    );
    return NextResponse.json({ ok: true, sellPrice: lead.sellPrice });
  } catch (error) {
    if (error instanceof CrmRejectedError) {
      // 422 {errors}: the configuration is invalid, not a CRM outage.
      return NextResponse.json(error.body ?? { error: "Configurație invalidă." }, { status: error.status });
    }
    if (!(error instanceof CrmUnavailableError)) console.error("Atelier lead failed", error);
    // CRM down: still deliver the lead by email with the raw configuration.
    const sent = await notifyOwner(
      subject,
      leadEmailHtml({ contact, summary: "", sellPrice: null, crmUrl: null, config }),
    );
    if (!sent) return NextResponse.json({ unavailable: true }, { status: 503 });
    return NextResponse.json({ ok: true, fallback: true });
  }
}
