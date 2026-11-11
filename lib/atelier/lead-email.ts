import type { AtelierConfig, AtelierContact } from "./types";

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatLei(value: number): string {
  // ro-RO grouping with a dot, independent of ICU data: 14250 -> "14.250"
  return `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} lei`;
}

export function leadEmailHtml(args: {
  contact: AtelierContact;
  summary: string;
  sellPrice: number | null;
  crmUrl: string | null;
  config: AtelierConfig;
}): string {
  const { contact, summary, sellPrice, crmUrl, config } = args;
  const price = sellPrice != null ? formatLei(sellPrice) : "—";

  const crmBlock = crmUrl
    ? `<p><a href="${esc(crmUrl)}">Deschide în CRM</a></p>`
    : `<p style="color:#b42318"><strong>CRM indisponibil</strong> — cererea nu a fost creată în CRM. Configurația completă este atașată mai jos.</p>
<pre style="background:#f5f5f5;padding:12px;border-radius:8px;white-space:pre-wrap">${esc(JSON.stringify(config, null, 2))}</pre>`;

  return `<div style="font-family:Arial,sans-serif;color:#2b1d14;max-width:640px">
<h2>Lead nou Atelier 3D</h2>
<table cellpadding="4">
<tr><td><strong>Nume</strong></td><td>${esc(contact.name)}</td></tr>
<tr><td><strong>Telefon</strong></td><td>${esc(contact.phone)}</td></tr>
<tr><td><strong>Oraș</strong></td><td>${esc(contact.city)}</td></tr>
<tr><td><strong>Observații</strong></td><td>${esc(contact.notes ?? "")}</td></tr>
<tr><td><strong>Preț estimat</strong></td><td>${esc(price)}</td></tr>
</table>
${summary ? `<p style="white-space:pre-wrap">${esc(summary)}</p>` : ""}
${crmBlock}
</div>`;
}
